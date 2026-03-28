import React from "react";
import "../styles/Header.css";
import { useTheme } from "../theme";

export default function Header({ onAnalyze, loading, view, onSwitchView }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <span className="logo-icon">C+</span>
          FlowViz
        </h1>
      </div>

      <div className="header-actions">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
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

        {view === "visualizer" && (
          <button
            className={`analyze-btn ${loading ? "loading" : ""}`}
            onClick={onAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze & Run"}
          </button>
        )}
      </div>
    </header>
  );
}
