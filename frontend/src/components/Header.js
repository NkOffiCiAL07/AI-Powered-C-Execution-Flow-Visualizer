import React from "react";
import "../styles/Header.css";

export default function Header({ onAnalyze, loading }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">🚀 C++ Execution Flow Visualizer</h1>
        <p className="header-subtitle">Debug C++ programs step-by-step with real-time variable tracking</p>
      </div>
      <button
        className={`analyze-btn ${loading ? "loading" : ""}`}
        onClick={onAnalyze}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Analyze & Run"}
      </button>
    </header>
  );
}
