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
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}

// Returns null when the token is malformed — callers must treat null as a
// rejected session rather than silently granting member access.
export function normalizeUser(userData, token) {
  if (!userData) return null;
  if (userData.provider === "guest" || userData.role === "guest") {
    return { ...userData, role: "guest" };
  }
  if (!token) return { ...userData, role: "member" };
  const payload = decodeTokenPayload(token);
  if (!payload) return null;
  return {
    ...userData,
    role: payload.role || "member",
    user_id: payload.sub || payload.user_id || userData.id,
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
