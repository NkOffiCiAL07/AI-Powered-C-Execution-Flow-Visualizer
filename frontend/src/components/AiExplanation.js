import React, { useState } from 'react';
import '../styles/AiExplanation.css';

const AiExplanation = ({ data, loading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!data?.explanation) return;
    navigator.clipboard.writeText(data.explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="ai-explanation-loading">
        <div className="ai-loader-wrapper">
          <div className="ai-spinner"></div>
          <div className="ai-pulse"></div>
        </div>
        <h3>Synthesizing Insights</h3>
        <p>Our AI is analyzing your code's architecture and logic...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ai-explanation-empty">
        <div className="empty-icon-wrapper">
          <span className="material-symbols-outlined">psychology_alt</span>
        </div>
        <h3>Deep Code Analysis</h3>
        <p>Click the "Explain Code" button in the header to generate a comprehensive architectural breakdown and complexity analysis.</p>
      </div>
    );
  }

  const getComplexityClass = (complexity) => {
    const c = (complexity || "").toLowerCase();
    if (c.includes('o(1)')) return 'complexity-low';
    if (c.includes('o(log')) return 'complexity-low';
    if (c.includes('o(n)')) return 'complexity-medium';
    if (c.includes('o(n log')) return 'complexity-medium';
    return 'complexity-high';
  };

  return (
    <div className="ai-explanation-container">
      {/* Overview */}
      <div className="ai-card">
        <div className="card-header">
          <h3><span className="material-symbols-outlined">analytics</span> Overview</h3>
          <button 
            className={`copy-btn ${copied ? 'copied' : ''}`} 
            onClick={handleCopy}
            title="Copy explanation"
          >
            <span className="material-symbols-outlined">
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>
        <p className="explanation-text">{data.explanation}</p>
      </div>

      {/* Complexity */}
      <div className="ai-metrics-grid">
        <div className={`ai-card metric-card ${getComplexityClass(data.time_complexity)}`}>
          <div className="metric-header">
            <span className="material-symbols-outlined">schedule</span>
            Time
          </div>
          <div className="metric-value">{data.time_complexity}</div>
        </div>

        <div className={`ai-card metric-card ${getComplexityClass(data.space_complexity)}`}>
          <div className="metric-header">
            <span className="material-symbols-outlined">memory</span>
            Space
          </div>
          <div className="metric-value">{data.space_complexity}</div>
        </div>
      </div>

      {/* Key Observations */}
      <div className="ai-card">
        <div className="card-header">
          <h3><span className="material-symbols-outlined">list_alt</span> Observations</h3>
        </div>
        <ul className="modern-points-list">
          {data.key_points.map((point, index) => (
            <li key={index} style={{ '--index': index }}>
              <div className="point-indicator"></div>
              <span className="point-text">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AiExplanation;
