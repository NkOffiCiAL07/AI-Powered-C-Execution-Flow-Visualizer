import React, { useState } from "react";
import "../styles/OutputPanel.css";

export default function OutputPanel({ result, loading }) {
  const [expandedSteps, setExpandedSteps] = useState(new Set());

  if (loading) {
    return (
      <div className="output-panel-loading">
        <div className="spinner"></div>
        <p>Analyzing...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="output-panel-empty">
        <p>No execution data available</p>
      </div>
    );
  }

  const hasSnapshots = Array.isArray(result.snapshots) && result.snapshots.length > 0;
  const hasProgramOutput = Boolean(result.stdout || result.stderr);

  if (!hasSnapshots && !hasProgramOutput) {
    return (
      <div className="output-panel-empty">
        <p>No execution data available</p>
      </div>
    );
  }

  const toggleStep = (stepNum) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNum)) {
      newExpanded.delete(stepNum);
    } else {
      newExpanded.add(stepNum);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <div className="output-panel">
      <div className="output-header">
        <h3>📋 Execution Details</h3>
        <p className="output-summary">
          Total Steps: <strong>{result.snapshots.length}</strong>
        </p>
      </div>

      {hasProgramOutput && (
        <div className="output-table-container">
          <table className="output-table">
            <tbody>
              <tr className="expanded-row">
                <td colSpan="5">
                  <div className="expanded-content">
                    <div className="expanded-section">
                      <h4>Program Output:</h4>
                      <p>
                        <code>{result.stdout || "(no stdout)"}</code>
                      </p>
                    </div>
                    {result.stderr && (
                      <div className="expanded-section">
                        <h4>Runtime Errors:</h4>
                        <p>
                          <code>{result.stderr}</code>
                        </p>
                      </div>
                    )}
                    {result.execution_mode === "output_only" && (
                      <div className="expanded-section">
                        <h4>Execution Mode:</h4>
                        <p>Ran with stdin input in output-only mode. Step-by-step variable tracing is currently limited to non-stdin runs.</p>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {hasSnapshots && (
      <div className="output-table-container">
        <table className="output-table">
          <thead>
            <tr>
              <th>Step</th>
              <th>Line</th>
              <th>Function</th>
              <th>Variables</th>
              <th>Changed</th>
            </tr>
          </thead>
          <tbody>
            {result.snapshots.map((snapshot, index) => {
              const isExpanded = expandedSteps.has(index);
              const varCount = Object.keys(snapshot.variables).length;
              const changedCount = snapshot.changed_variables?.length || 0;

              return (
                <React.Fragment key={index}>
                  <tr
                    className={`output-row ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleStep(index)}
                  >
                    <td className="step-cell">{index + 1}</td>
                    <td className="line-cell">{snapshot.location.line}</td>
                    <td className="function-cell">{snapshot.location.function}</td>
                    <td className="var-count-cell">{varCount}</td>
                    <td className="changed-cell">
                      {changedCount > 0 ? (
                        <span className="changed-badge">{changedCount}</span>
                      ) : (
                        <span className="no-change">—</span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="expanded-row">
                      <td colSpan="5">
                        <div className="expanded-content">
                          <div className="expanded-section">
                            <h4>Variables:</h4>
                            <div className="variables-list">
                              {Object.entries(snapshot.variables).map(([name, value]) => (
                                <div key={name} className="variable-item">
                                  <span className="var-name">{name}</span>
                                  <span className="var-value">
                                    <code>{value}</code>
                                  </span>
                                  {snapshot.changed_variables?.includes(name) && (
                                    <span className="changed-indicator">✓</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="expanded-section">
                            <h4>Location:</h4>
                            <p>
                              <strong>File:</strong> <code>{snapshot.location.file}</code>
                            </p>
                            <p>
                              <strong>Line:</strong> {snapshot.location.line}
                            </p>
                            <p>
                              <strong>Function:</strong> {snapshot.location.function}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
