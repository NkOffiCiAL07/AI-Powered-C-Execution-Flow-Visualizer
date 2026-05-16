from __future__ import annotations

import json
import os
import secrets
import time
import urllib.parse

import httpx
import jwt
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

_STATE_STORE: dict[str, bool] = {}


def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


def _client_id() -> str:
    val = _env("GOOGLE_CLIENT_ID")
    if not val:
        raise HTTPException(status_code=501, detail="GOOGLE_CLIENT_ID is not configured. Add it to your .env file.")
    return val


def _redirect_uri() -> str:
    return _env("OAUTH_REDIRECT_URI", "http://localhost:8000/auth/google/callback")


def _frontend_origin() -> str:
    return _env("FRONTEND_ORIGIN", "http://localhost:3000")


def _jwt_secret() -> str:
    return _env("JWT_SECRET", "traceon-dev-secret-change-in-production")


@router.get("/google")
def google_login():
    state = secrets.token_urlsafe(16)
    _STATE_STORE[state] = True

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
    code: str | None = None,
    error: str | None = None,
    state: str | None = None,
):
    if error:
        return HTMLResponse(_popup_html(error=f"Google returned: {error}"))

    if not code:
        return HTMLResponse(_popup_html(error="No authorization code received from Google."))

    if not state or state not in _STATE_STORE:
        return HTMLResponse(_popup_html(error="Invalid state — possible CSRF attempt."))
    _STATE_STORE.pop(state, None)

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

    user = {
        "id": profile.get("sub", ""),
        "name": profile.get("name", ""),
        "email": profile.get("email", ""),
        "avatar": profile.get("picture", ""),
        "provider": "google",
    }

    now = int(time.time())
    token = jwt.encode(
        {"sub": user["id"], "user": user, "iat": now, "exp": now + 7 * 24 * 3600},
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

    raw = auth.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(raw, _jwt_secret(), algorithms=["HS256"])
        return {"user": payload.get("user")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired — please sign in again")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")


def _popup_html(
    token: str | None = None,
    user: dict | None = None,
    error: str | None = None,
) -> str:
    if error:
        payload_json = json.dumps({"error": error})
    else:
        payload_json = json.dumps({"token": token, "user": user})

    # Prevent </script> injection
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
      try {{
        if (window.opener) {{
          window.opener.postMessage(payload, "{origin}");
        }}
      }} catch (_) {{
        if (window.opener) window.opener.postMessage(payload, "*");
      }}
      setTimeout(function () {{ window.close(); }}, 400);
    }})();
  </script>
</body>
</html>"""
