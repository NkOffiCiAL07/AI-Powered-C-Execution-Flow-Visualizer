import React from "react";
import "../styles/MemorySpectrometer.css";

export default function MemorySpectrometer({ result, currentStep }) {
  if (!result || !result.snapshots || result.snapshots.length === 0) {
    return (
      <div className="flow-visualizer-empty">
        <p>No memory data available for this step.</p>
      </div>
    );
  }

  const snap = result.snapshots[currentStep];
  const memory = snap.memory || [];

  if (memory.length === 0) {
    return (
      <div className="flow-visualizer-empty">
        <span className="material-symbols-outlined dash-empty-icon">memory</span>
        <p>Memory block empty at this step.</p>
      </div>
    );
  }

  return (
    <div className="memory-spectrometer">
      <div className="memory-header">
        <span className="material-symbols-outlined">memory</span>
        <h2>Memory Map (Stack & Heap)</h2>
      </div>

      <div className="memory-grid">
        {memory.map((mem, idx) => (
          <div key={idx} className="memory-block">
            <div className="memory-address">{mem.address}</div>
            <div className="memory-content">
              <div className="memory-meta">
                <span className="memory-type">{mem.type}</span>
                <span className="memory-name">{mem.name}</span>
              </div>
              <div className="memory-val-row">
                <code className="memory-value">{mem.value}</code>
                {mem.deref && (
                  <div className="memory-deref">
                    <span className="material-symbols-outlined">east</span>
                    <span>{mem.deref}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
