import React, { useEffect, useRef, useState } from "react";
import "../styles/Header.css";
import { useTheme } from "../theme";

const VIEW_OPTIONS = [
  { value: "visualizer", label: "Debugger", icon: "bug_report" },
  { value: "editor",     label: "Editor",   icon: "code"       },
];

function ViewDropdown({ view, onSwitchView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = VIEW_OPTIONS.find(o => o.value === view) || VIEW_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="view-dropdown" ref={ref}>
      <button className="view-dropdown-trigger" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span className="material-symbols-outlined">{current.icon}</span>
        <span>{current.label}</span>
        <span className={`material-symbols-outlined view-dropdown-chevron ${open ? "open" : ""}`}>expand_more</span>
      </button>

      {open && (
        <ul className="view-dropdown-menu" role="listbox">
          {VIEW_OPTIONS.map(opt => (
            <li
              key={opt.value}
              className={`view-dropdown-item ${opt.value === view ? "active" : ""}`}
              role="option"
              aria-selected={opt.value === view}
              onClick={() => { onSwitchView(opt.value); setOpen(false); }}
            >
              <span className="material-symbols-outlined">{opt.icon}</span>
              {opt.label}
              {opt.value === view && <span className="material-symbols-outlined view-dropdown-check">check</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Header({ onAnalyze, onRun, onExplain, loading, runLoading, aiLoading, view, onSwitchView, user, onLogout, onSignIn }) {
  const { theme, toggleTheme } = useTheme();
  const inApp = view === "editor" || view === "visualizer";

  return (
    <header className="header">
      {/* Left — brand */}
      <div className="header-brand" onClick={() => onSwitchView("landing")}>
        <span className="material-symbols-outlined header-brand-icon">terminal</span>
        <span className="brand-text">Traceon</span>
      </div>

      {/* Center — nav */}
      <nav className="header-nav" aria-label="Main navigation">
        <button className={`nav-link ${view === "landing"   ? "active" : ""}`} onClick={() => onSwitchView("landing")}>Home</button>
        <button className={`nav-link ${view === "docs"      ? "active" : ""}`} onClick={() => onSwitchView("docs")}>Docs</button>
        <button className={`nav-link ${view === "pricing"   ? "active" : ""}`} onClick={() => onSwitchView("pricing")}>Pricing</button>
        <button className={`nav-link ${view === "community" ? "active" : ""}`} onClick={() => onSwitchView("community")}>Community</button>
      </nav>

      {/* Right — actions + user */}
      <div className="header-right">

        {/* View dropdown — only inside the app */}
        {inApp && <ViewDropdown view={view} onSwitchView={onSwitchView} />}

        {/* AI + primary action */}
        {inApp && (
          <div className="header-actions-group">
            <button className={`explain-btn ${aiLoading ? "loading" : ""}`} onClick={onExplain} disabled={aiLoading || loading || runLoading}>
              <span className="material-symbols-outlined">auto_awesome</span>
              {aiLoading ? "Thinking…" : "AI Insights"}
            </button>
            {view === "visualizer" ? (
              <button className={`analyze-btn ${loading ? "loading" : ""}`} onClick={onAnalyze} disabled={loading || aiLoading}>
                <span className="material-symbols-outlined">play_arrow</span>
                {loading ? "Analyzing…" : "Analyze & Visualize"}
              </button>
            ) : (
              <button className={`analyze-btn ${runLoading ? "loading" : ""}`} onClick={onRun} disabled={runLoading || aiLoading}>
                <span className="material-symbols-outlined">play_arrow</span>
                {runLoading ? "Running…" : "Compile & Run"}
              </button>
            )}
          </div>
        )}

        {/* Theme toggle */}
        <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} aria-label="Toggle theme">
          <span className="material-symbols-outlined">{theme === "dark" ? "dark_mode" : "light_mode"}</span>
        </button>

        {/* User */}
        {user ? (
          <div className="user-pill">
            {user.avatar ? (
              <img className="user-avatar" src={user.avatar} alt={user.name} />
            ) : (
              <span className="user-avatar-placeholder material-symbols-outlined">person</span>
            )}
            <span className="user-name">{user.name || "Guest"}</span>
            <button className="signout-btn" onClick={onLogout} title="Sign out">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        ) : (
          <button className="sign-in-link" onClick={onSignIn}>Sign In</button>
        )}
      </div>
    </header>
  );
}
