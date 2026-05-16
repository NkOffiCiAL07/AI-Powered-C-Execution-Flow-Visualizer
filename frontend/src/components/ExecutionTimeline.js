import React from "react";
import "../styles/ExecutionTimeline.css";

export default function ExecutionTimeline({ snapshots, currentStep, diffStep, onStepClick }) {
  return (
    <div className="execution-timeline">
      <div className="timeline-header">
        🗺 Program Journey — click any step to jump to it
      </div>
      <div className="timeline-container">
        <div className="timeline-track">
          {snapshots.map((snapshot, index) => {
            const changed = snapshot.changed_variables || [];
            const isCurrent = index === currentStep;
            const isDiff = index === diffStep;
            const isPast = index < currentStep;
            const label = changed.length > 0
              ? `${changed[0]}=${snapshot.variables?.[changed[0]]}`
              : `L${snapshot.location.line}`;

            return (
              <div
                key={index}
                className={`timeline-step ${isCurrent ? "active" : ""} ${isPast ? "past" : ""} ${isDiff ? "diff" : ""}`}
                onClick={() => onStepClick(index)}
                title={`Step ${index + 1} — Line ${snapshot.location.line}`}
              >
                <div className="step-dot">
                  {isCurrent && <div className="step-dot-pulse" />}
                  {isDiff && <div className="step-dot-pulse diff-pulse" />}
                </div>
                <div className="step-label">{label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="timeline-legend">
        <span className="legend-past">■ Done</span>
        <span className="legend-current">■ Now</span>
        {diffStep !== undefined && diffStep !== null && <span className="legend-diff">■ Diff Target</span>}
        <span className="legend-future">■ Coming up</span>
      </div>
    </div>
  );
}

