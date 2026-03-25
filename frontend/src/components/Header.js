import React from "react";
import "../styles/Header.css";

export default function Header({ onAnalyze, loading, view, onSwitchView }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">🚀 C++ Execution Flow Visualizer</h1>
        <p className="header-subtitle">Debug C++ programs step-by-step with real-time variable tracking</p>
      </div>

      <div className="header-actions">
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
