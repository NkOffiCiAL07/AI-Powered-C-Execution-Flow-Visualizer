import React from 'react';
import '../styles/FlowVisualizer.css';

export default function DebuggerRestricted({ reason, onAction, actionLabel, onSecondaryAction, secondaryActionLabel }) {
  return (
    <div className="flow-visualizer-empty restricted-state">
      <div className="restricted-icon-wrapper">
        <span className="material-symbols-outlined">lock</span>
      </div>
      <h3>Debugger Restricted</h3>
      <p className="restricted-reason">{reason}</p>
      
      <div className="restricted-actions">
        <button className="control-btn primary" onClick={onAction}>
          {actionLabel}
        </button>
        {onSecondaryAction && (
          <button className="control-btn" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </button>
        )}
      </div>

      <div className="restricted-footer">
        <span className="material-symbols-outlined">info</span>
        <span>The debugger requires a project to store execution snapshots in MongoDB.</span>
      </div>
    </div>
  );
}
