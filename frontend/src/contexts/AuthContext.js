import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  clearAuth,
  getStoredToken,
  normalizeUser,
  restoreSession,
  serverLogout,
  storeAuth,
} from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sessionExpiredBanner, setSessionExpiredBanner] = useState(false);

  // Validate session against the server on startup
  useEffect(() => {
    restoreSession()
      .then((result) => { if (result) setUser(result.user); })
      .finally(() => setAuthLoading(false));
  }, []);

  // Handle 401s fired by api.js apiFetch
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setSessionExpiredBanner(true);
    };
    window.addEventListener("traceon:session-expired", onExpired);
    return () => window.removeEventListener("traceon:session-expired", onExpired);
  }, []);

  const login = useCallback((userData, token) => {
    const normalized = normalizeUser(userData, token);
    if (!normalized) return; // malformed token — reject silently
    storeAuth(normalized, token);
    setUser(normalized);
    setSessionExpiredBanner(false);
    setShowLoginModal(false);
  }, []);

  const logout = useCallback(async () => {
    const token = getStoredToken();
    await serverLogout(token);
    clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      authLoading,
      showLoginModal,
      setShowLoginModal,
      sessionExpiredBanner,
      setSessionExpiredBanner,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
