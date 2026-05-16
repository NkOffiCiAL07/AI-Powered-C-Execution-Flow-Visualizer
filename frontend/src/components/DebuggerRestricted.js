import React from 'react';
import '../styles/FlowVisualizer.css';

export default function DebuggerRestricted({ reason, onAction, actionLabel, onSecondaryAction, secondaryActionLabel }) {
  return (
    <div className="restricted-overlay">
      <div className="restricted-content">
        <div className="restricted-icon-shield">
          <span className="material-symbols-outlined">security</span>
        </div>
        <h2 className="restricted-title">Authentication Required</h2>
        <p className="restricted-text">
          {reason || "Sign in to access high-fidelity execution visualization and interactive memory mapping."}
        </p>
        
        <div className="restricted-actions-row">
          <button className="restricted-btn-primary" onClick={onAction}>
            <span className="material-symbols-outlined">login</span>
            {actionLabel || "Sign in with Google"}
          </button>
          
          {onSecondaryAction && (
            <button className="restricted-btn-outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </button>
          )}
        </div>

        <div className="restricted-perks">
          <div className="perk-item">
            <span className="material-symbols-outlined">schema</span>
            <span>Live Execution Maps</span>
          </div>
          <div className="perk-item">
            <span className="material-symbols-outlined">memory</span>
            <span>Memory Spectrometer</span>
          </div>
          <div className="perk-item">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>AI Step Insights</span>
          </div>
        </div>
      </div>
    </div>
  );
}
