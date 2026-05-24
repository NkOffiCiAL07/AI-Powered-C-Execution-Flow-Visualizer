import React, { useEffect } from 'react';
import '../styles/KeyboardShortcutsModal.css';

const SHORTCUTS = [
  { group: 'Editor',      keys: ['Ctrl', 'Enter'],       desc: 'Run code' },
  { group: 'Editor',      keys: ['Ctrl', 'Shift', 'D'],  desc: 'Start debugger' },
  { group: 'Editor',      keys: ['Ctrl', 'Shift', 'E'],  desc: 'Explain with AI' },
  { group: 'Editor',      keys: ['Ctrl', 'S'],            desc: 'Save file' },
  { group: 'Editor',      keys: ['Ctrl', 'G'],            desc: 'Generate code with AI' },
  { group: 'Breakpoints', keys: ['Click gutter'],         desc: 'Add / remove breakpoint on a line' },
  { group: 'Breakpoints', keys: ['F5'],                   desc: 'Continue to next breakpoint' },
  { group: 'Debugger',    keys: ['→'],                    desc: 'Step forward' },
  { group: 'Debugger',    keys: ['←'],                    desc: 'Step backward' },
  { group: 'Debugger',    keys: ['↓'],                    desc: 'Step into function' },
  { group: 'Debugger',    keys: ['↑'],                    desc: 'Step out of function' },
  { group: 'Debugger',    keys: ['Space'],                desc: 'Play / pause auto-step' },
  { group: 'Debugger',    keys: ['Escape'],               desc: 'Exit debugger' },
  { group: 'Global',      keys: ['?'],                    desc: 'Show this shortcuts panel' },
  { group: 'Global',      keys: ['T'],                    desc: 'Toggle theme' },
];

const GROUPS = ['Editor', 'Breakpoints', 'Debugger', 'Global'];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ksm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ksm-modal">
        <div className="ksm-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="ksm-close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="ksm-body">
          {GROUPS.map(group => (
            <div key={group} className="ksm-group">
              <div className="ksm-group-title">{group}</div>
              {SHORTCUTS.filter(s => s.group === group).map((s, i) => (
                <div key={i} className="ksm-row">
                  <span className="ksm-desc">{s.desc}</span>
                  <span className="ksm-keys">
                    {s.keys.map((k, j) => (
                      <React.Fragment key={k}>
                        <kbd className="ksm-key">{k}</kbd>
                        {j < s.keys.length - 1 && <span className="ksm-plus">+</span>}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="ksm-footer">Press <kbd className="ksm-key">?</kbd> anytime to reopen</div>
      </div>
    </div>
  );
}
