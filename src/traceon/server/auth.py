from __future__ import annotations

import json
import logging
import os
import secrets
import threading
import time
import urllib.parse
import uuid

import httpx
import jwt
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse

from traceon.server.mongo_store import mongo_app_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

_DEV_SECRET = "traceon-dev-secret-change-in-production"

# ── OAuth state store: state → created_at (unix ts) ─────────────────────────
# Thread-safe; entries expire after _STATE_TTL seconds to prevent unbounded growth.
_STATE_STORE: dict[str, float] = {}
_STATE_TTL = 600  # 10 minutes
_STATE_LOCK = threading.Lock()

# ── JTI blocklist: jti → token-expiry (unix ts) ─────────────────────────────
# Used to honour server-side logout. Expired entries are lazily pruned.
_BLOCKLIST: dict[str, int] = {}
_BLOCKLIST_LOCK = threading.Lock()

# ── Auth-specific rate limiter (separate from the AI-endpoint limiter) ───────
_AUTH_RL_STORE: dict[str, list[float]] = {}
_AUTH_RL_LOCK = threading.Lock()
_AUTH_RL_LIMIT = 20
_AUTH_RL_WINDOW = 60.0


# ── Helpers ──────────────────────────────────────────────────────────────────

def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


def _client_id() -> str:
    val = _env("GOOGLE_CLIENT_ID")
    if not val:
        raise HTTPException(
            status_code=501,
            detail="GOOGLE_CLIENT_ID is not configured. Add it to your .env file.",
        )
    return val


def _redirect_uri() -> str:
    return _env("OAUTH_REDIRECT_URI", "http://localhost:8000/auth/google/callback")


def _frontend_origin() -> str:
    return _env("FRONTEND_ORIGIN", "http://localhost:3000")


def _jwt_secret() -> str:
    val = _env("JWT_SECRET", _DEV_SECRET)
    if val == _DEV_SECRET:
        logger.critical(
            "JWT_SECRET is not set — using the insecure dev default. "
            "Set JWT_SECRET in your .env file before deploying to production."
        )
    return val


def _jwt_ttl() -> int:
    return int(_env("JWT_TTL_SECONDS", str(7 * 24 * 3600)))


def _is_auth_rate_limited(ip: str) -> bool:
    now = time.monotonic()
    with _AUTH_RL_LOCK:
        times = _AUTH_RL_STORE.get(ip, [])
        times = [t for t in times if now - t < _AUTH_RL_WINDOW]
        if len(times) >= _AUTH_RL_LIMIT:
            _AUTH_RL_STORE[ip] = times
            return True
        times.append(now)
        _AUTH_RL_STORE[ip] = times
        return False


def _new_state() -> str:
    """Create a CSRF state token; lazily prune expired entries."""
    now = time.time()
    with _STATE_LOCK:
        expired = [k for k, ts in _STATE_STORE.items() if now - ts > _STATE_TTL]
        for k in expired:
            del _STATE_STORE[k]
        state = secrets.token_urlsafe(16)
        _STATE_STORE[state] = now
    return state


def _consume_state(state: str) -> bool:
    """Validate and atomically remove a state token."""
    now = time.time()
    with _STATE_LOCK:
        ts = _STATE_STORE.pop(state, None)
        if ts is None:
            return False
        if now - ts > _STATE_TTL:
            return False
    return True


def _is_jti_blocked(jti: str) -> bool:
    now = int(time.time())
    with _BLOCKLIST_LOCK:
        expired = [k for k, exp in _BLOCKLIST.items() if exp < now]
        for k in expired:
            del _BLOCKLIST[k]
        return jti in _BLOCKLIST


def _block_jti(jti: str, exp: int) -> None:
    with _BLOCKLIST_LOCK:
        _BLOCKLIST[jti] = exp


def _decode_token(raw: str) -> dict:
    """Decode, validate, and blocklist-check a JWT. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(raw, _jwt_secret(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired — please sign in again")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

    jti = payload.get("jti")
    if jti and _is_jti_blocked(jti):
        raise HTTPException(
            status_code=401,
            detail="Token has been revoked — please sign in again",
        )
    return payload


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/google")
def google_login(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if _is_auth_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many sign-in attempts. Please wait a moment.",
        )

    state = _new_state()
    params = urllib.parse.urlencode({
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": state,
        "prompt": "select_account",
    })
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{params}")


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = None,
    error: str | None = None,
    state: str | None = None,
):
    client_ip = request.client.host if request.client else "unknown"
    if _is_auth_rate_limited(client_ip):
        return HTMLResponse(_popup_html(error="Too many sign-in attempts. Please wait a moment."))

    if error:
        return HTMLResponse(_popup_html(error=f"Google returned: {error}"))

    if not code:
        return HTMLResponse(_popup_html(error="No authorization code received from Google."))

    if not state or not _consume_state(state):
        return HTMLResponse(_popup_html(error="Invalid or expired state — please try signing in again."))

    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": _client_id(),
                "client_secret": _env("GOOGLE_CLIENT_SECRET"),
                "redirect_uri": _redirect_uri(),
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )

        if token_resp.status_code != 200:
            return HTMLResponse(_popup_html(error="Token exchange with Google failed."))

        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return HTMLResponse(_popup_html(error="Google did not return an access token."))

        profile_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if profile_resp.status_code != 200:
            return HTMLResponse(_popup_html(error="Failed to fetch profile from Google."))

        profile = profile_resp.json()

    google_id = profile.get("sub", "")
    email = profile.get("email", "")
    name = profile.get("name", "")
    avatar_url = profile.get("picture", "")

    user_id = mongo_app_store.upsert_user(google_id, email, name, avatar_url)

    user = {
        "id": user_id,
        "google_id": google_id,
        "name": name,
        "email": email,
        "avatar": avatar_url,
        "provider": "google",
        "role": "member",
    }

    now = int(time.time())
    jti = uuid.uuid4().hex
    token = jwt.encode(
        {
            "sub": user_id,
            "user_id": user_id,
            "user": user,
            "role": "member",
            "jti": jti,
            "iat": now,
            "exp": now + _jwt_ttl(),
        },
        _jwt_secret(),
        algorithm="HS256",
    )

    return HTMLResponse(_popup_html(token=token, user=user))


@router.get("/me")
def get_me(request: Request):
    """Return the user embedded in a valid Bearer JWT."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    payload = _decode_token(auth.removeprefix("Bearer ").strip())
    return {"user": payload.get("user")}


@router.post("/logout")
def logout(request: Request):
    """Revoke the current token by adding its JTI to the in-process blocklist."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        raw = auth.removeprefix("Bearer ").strip()
        try:
            payload = jwt.decode(raw, _jwt_secret(), algorithms=["HS256"])
            jti = payload.get("jti")
            exp = payload.get("exp", 0)
            if jti:
                _block_jti(jti, exp)
                logger.info("Revoked token jti=%s", jti)
        except jwt.InvalidTokenError:
            pass
    return {"logged_out": True}


# ── FastAPI dependencies ──────────────────────────────────────────────────────

def require_member(request: Request) -> dict:
    """Raises 401 if no valid token is present, 403 if the role is 'guest'."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = _decode_token(auth.removeprefix("Bearer ").strip())
    if payload.get("role") == "guest":
        raise HTTPException(
            status_code=403,
            detail="This feature requires a signed-in account",
        )
    return payload


def optional_user(request: Request) -> dict | None:
    """Returns JWT payload if a valid Bearer token is present, otherwise None."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    raw = auth.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(raw, _jwt_secret(), algorithms=["HS256"])
        jti = payload.get("jti")
        if jti and _is_jti_blocked(jti):
            return None
        return payload
    except jwt.InvalidTokenError:
        return None


# ── Popup HTML helper ─────────────────────────────────────────────────────────

def _popup_html(
    token: str | None = None,
    user: dict | None = None,
    error: str | None = None,
) -> str:
    if error:
        payload_json = json.dumps({"error": error})
    else:
        payload_json = json.dumps({"token": token, "user": user})

    payload_json = payload_json.replace("</", "<\\/")
    origin = _frontend_origin()

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Signing in…</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh; margin: 0;
      background: #FAF9F7; color: #1A1310;
    }}
    p {{ opacity: 0.55; font-size: 14px; margin-top: 12px; }}
    .spinner {{
      width: 32px; height: 32px;
      border: 3px solid rgba(201,106,72,0.2);
      border-top-color: #C96A48;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }}
    @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p>Signing in… this window will close automatically.</p>
  <script>
    (function () {{
      var payload = {payload_json};
      var sent = false;
      try {{
        if (window.opener) {{
          window.opener.postMessage(payload, "{origin}");
          sent = true;
        }}
      }} catch (_) {{}}
      if (!sent && window.opener) {{
        try {{ window.opener.postMessage(payload, "*"); }} catch (_) {{}}
      }}
      setTimeout(function () {{ window.close(); }}, 400);
    }})();
  </script>
</body>
</html>"""
