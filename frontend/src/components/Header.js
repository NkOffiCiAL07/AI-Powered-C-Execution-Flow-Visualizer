import React from "react";
import "../styles/Header.css";
import { useTheme } from "../theme";

export default function Header({ onAnalyze, onExplain, loading, aiLoading, view, onSwitchView }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title" onClick={() => onSwitchView("landing")} style={{cursor: 'pointer'}}>
          <span className="material-symbols-outlined text-primary" style={{fontSize: '24px'}}>terminal</span>
          <span className="brand-text">Traceon</span>
        </h1>
      </div>

      <div className="header-actions">
        <nav className="header-nav">
          <button className={`nav-link ${view === 'landing' ? 'active' : ''}`} onClick={() => onSwitchView("landing")}>Home</button>
          <button className={`nav-link ${view === 'docs' ? 'active' : ''}`} onClick={() => onSwitchView("docs")}>Docs</button>
          <button className={`nav-link ${view === 'pricing' ? 'active' : ''}`} onClick={() => onSwitchView("pricing")}>Pricing</button>
          <button className={`nav-link ${view === 'community' ? 'active' : ''}`} onClick={() => onSwitchView("community")}>Community</button>
        </nav>
        
        {(view === "editor" || view === "visualizer") && (
          <div className="header-view-switch" role="tablist" aria-label="Page view switch">
            <button
              className={`view-switch-btn ${view === "visualizer" ? "active" : ""}`}
              onClick={() => onSwitchView("visualizer")}
              role="tab"
              aria-selected={view === "visualizer"}
            >
              Visualizer
            </button>
            <button
              className={`view-switch-btn ${view === "editor" ? "active" : ""}`}
              onClick={() => onSwitchView("editor")}
              role="tab"
              aria-selected={view === "editor"}
            >
              Editor
            </button>
          </div>
        )}

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>

        {view === "visualizer" && (
          <>
            <button
              className={`explain-btn ${aiLoading ? "loading" : ""}`}
              onClick={onExplain}
              disabled={aiLoading || loading}
            >
              {aiLoading ? "Thinking..." : "Explain Code"}
            </button>
            <button
              className={`analyze-btn ${loading ? "loading" : ""}`}
              onClick={onAnalyze}
              disabled={loading || aiLoading}
            >
              {loading ? "Analyzing..." : "Analyze & Run"}
            </button>
          </>
        )}
        <a href="#" className="sign-in-link">Sign In</a>
      </div>
    </header>
  );
}
