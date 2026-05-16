import React, { useState, useEffect, useRef } from 'react';
import '../styles/LoginModal.css';

const BACKEND = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const popupRef = useRef(null);
  const handlerRef = useRef(null);
  const pollRef = useRef(null);

  const cleanup = () => {
    if (handlerRef.current) {
      window.removeEventListener('message', handlerRef.current);
      handlerRef.current = null;
    }
    clearInterval(pollRef.current);
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
    setLoading(false);
  };

  useEffect(() => {
    if (!isOpen) cleanup();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError(null);

    const w = 500, h = 620;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);

    const popup = window.open(
      `${BACKEND}/auth/google`,
      'traceon-google-oauth',
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      setError('Popup blocked — please allow popups for this site and try again.');
      setLoading(false);
      return;
    }

    popupRef.current = popup;

    // Detect manual popup close
    pollRef.current = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollRef.current);
        if (handlerRef.current) {
          window.removeEventListener('message', handlerRef.current);
          handlerRef.current = null;
        }
        setLoading(false);
      }
    }, 600);

    const onMessage = (event) => {
      if (event.origin !== BACKEND) return;

      clearInterval(pollRef.current);
      window.removeEventListener('message', onMessage);
      handlerRef.current = null;

      const { token, user, error: authError } = event.data || {};

      if (authError) {
        setError(authError);
        setLoading(false);
        return;
      }

      if (token && user) {
        onLogin(user, token);
        onClose();
      } else {
        setError('Unexpected response from authentication server.');
        setLoading(false);
      }
    };

    handlerRef.current = onMessage;
    window.addEventListener('message', onMessage);
  };

  const handleGuestSignIn = () => {
    const guest = {
      id: `guest-${Math.random().toString(36).slice(2, 9)}`,
      name: 'Guest',
      email: '',
      avatar: '',
      provider: 'guest',
      role: 'guest',
    };
    onLogin(guest, null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="login-modal-content animate-zoom-in">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="modal-header">
          <div className="logo-wrapper">
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '28px' }}>
              terminal
            </span>
          </div>
          <h2>Welcome to Traceon</h2>
          <p>Sign in to save projects and access all languages</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <button className="google-signin-btn" onClick={handleGoogleSignIn} disabled={loading}>
          {loading ? (
            <>
              <div className="btn-loader" />
              Connecting to Google…
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        <div className="auth-divider"><span>or</span></div>

        <button className="guest-signin-btn" onClick={handleGuestSignIn} disabled={loading}>
          <span className="material-symbols-outlined">person</span>
          Continue as Guest
        </button>

        <p className="auth-note">Google sign-in saves your session across devices</p>

        <div className="modal-footer">
          <p>By continuing you agree to our Terms of Service and Privacy Policy.</p>
        </div>

        <div className="hud-line" />
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.109 17.64 11.8 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default LoginModal;
