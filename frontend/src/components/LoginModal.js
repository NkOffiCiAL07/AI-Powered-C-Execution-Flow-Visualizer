import React, { useState } from 'react';
import '../styles/LoginModal.css';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const userData = {
        email,
        name: email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };
      onLogin(userData);
      setLoading(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-content animate-zoom-in">
        <button className="modal-close-btn" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="modal-header">
          <div className="logo-wrapper">
            <span className="material-symbols-outlined text-primary">terminal</span>
          </div>
          <h2>Welcome to Traceon</h2>
          <p>Sign in to access the execution visualizer</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined">mail</span>
              <input 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined">lock</span>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <div className="btn-loader"></div>
            ) : (
              'Sign In to System'
            )}
          </button>
        </form>

        <div className="modal-footer">
          <p>Don't have an account? <a href="#">Request Access</a></p>
        </div>

        {/* HUD Decoration */}
        <div className="hud-line"></div>
      </div>
    </div>
  );
};

export default LoginModal;
