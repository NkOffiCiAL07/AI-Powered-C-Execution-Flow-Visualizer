// Derive the backend *origin* (scheme + host + port) once at module load.
// Using URL.origin avoids mismatches when REACT_APP_API_URL includes a path.
export const BACKEND_ORIGIN = (() => {
  try {
    return new URL(process.env.REACT_APP_API_URL || "http://localhost:8000").origin;
  } catch {
    return "http://localhost:8000";
  }
})();

const TOKEN_KEY = "traceon_auth_token";
const USER_KEY = "traceon_user";

export function storeAuth(user, token) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function decodeTokenPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64Url = parts[1];
    if (!base64Url) return null;
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }
    const decoded = atob(base64);
    try {
      return JSON.parse(
        decodeURIComponent(
          decoded
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        )
      );
    } catch {
      return JSON.parse(decoded);
    }
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}

// Returns a normalized user object. Prioritizes server payload,
// falling back safely to token claims or userData attributes.
export function normalizeUser(userData, token) {
  if (!userData) return null;
  if (userData.provider === "guest" || userData.role === "guest") {
    return { ...userData, role: "guest" };
  }
  const payload = token ? decodeTokenPayload(token) : null;
  return {
    ...userData,
    role: payload?.role || userData.role || "member",
    user_id: payload?.sub || payload?.user_id || userData.user_id || userData.id,
  };
}

// Restore a session from localStorage, optionally validating against the server.
// Returns { user, token } on success, null if the session is absent or invalid.
export async function restoreSession() {
  const storedUser = getStoredUser();
  const token = getStoredToken();

  if (!storedUser) return null;

  if (storedUser.provider === "guest" || storedUser.role === "guest") {
    return { user: { ...storedUser, role: "guest" }, token: null };
  }

  if (!token || isTokenExpired(token)) {
    clearAuth();
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_ORIGIN}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      clearAuth();
      return null;
    }
    const data = await response.json();
    const serverUser = data.user;
    if (!serverUser) { clearAuth(); return null; }
    const normalized = normalizeUser(serverUser, token);
    if (!normalized) { clearAuth(); return null; }
    storeAuth(normalized, token);
    return { user: normalized, token };
  } catch {
    // Network failure — trust the local token (already expiry-checked above)
    const normalized = normalizeUser(storedUser, token);
    if (!normalized) { clearAuth(); return null; }
    return { user: normalized, token };
  }
}

// Revoke the token on the server (best-effort — always clears locally).
export async function serverLogout(token) {
  if (!token) return;
  try {
    await fetch(`${BACKEND_ORIGIN}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // intentionally swallowed — local state is cleared regardless
  }
}
