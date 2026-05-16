import React, { useEffect, useState } from "react";
import "../styles/VariableTracker.css";

function BubbleParticles({ active, varName, varValue }) {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    if (!active) return;
    // One label bubble + several small decorative ones
    const label = {
      id: `${Date.now()}-label`,
      left: 50,
      delay: 0,
      isLabel: true,
    };
    const dots = Array.from({ length: 6 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      left: 8 + Math.random() * 84,
      delay: 0.08 + Math.random() * 0.35,
      size: 10 + Math.random() * 12,
      hue: 160 + Math.random() * 60,
      isLabel: false,
    }));
    setBubbles([label, ...dots]);
    const t = setTimeout(() => setBubbles([]), 1600);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div className="bubble-container">
      {bubbles.map((b) =>
        b.isLabel ? (
          <div
            key={b.id}
            className="bubble bubble-label"
            style={{ left: `${b.left}%`, animationDelay: `${b.delay}s` }}
          >
            <span className="bubble-var">{varName}</span>
            <span className="bubble-eq">=</span>
            <span className="bubble-val">{varValue}</span>
          </div>
        ) : (
          <span
            key={b.id}
            className="bubble"
            style={{
              left: `${b.left}%`,
              width: b.size,
              height: b.size,
              animationDelay: `${b.delay}s`,
              background: `hsl(${b.hue}, 80%, 65%)`,
            }}
          />
        )
      )}
    </div>
  );
}

export default function VariableTracker({ variables, changedVariables, previousSnapshot }) {
  const [flashingVars, setFlashingVars] = useState(new Set());
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (changedVariables && changedVariables.length > 0) {
      setFlashingVars(new Set(changedVariables));
      setBurstKey((k) => k + 1);
      const timer = setTimeout(() => setFlashingVars(new Set()), 800);
      return () => clearTimeout(timer);
    }
  }, [changedVariables]);

  if (!variables || Object.keys(variables).length === 0) {
    return (
      <div className="variable-tracker">
        <div className="tracker-header">📦 Variables</div>
        <div className="variables-empty">
          <p>No variables in scope</p>
        </div>
      </div>
    );
  }

  const sortedVars = Object.entries(variables).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="variable-tracker">
      <div className="tracker-header">📦 Variables ({Object.keys(variables).length})</div>
      <div className="variables-grid">
        {sortedVars.map(([name, value]) => {
          const isChanged = changedVariables?.includes(name);
          const previousValue = previousSnapshot?.variables?.[name];

          return (
            <div
              key={name}
              className={`variable-card ${isChanged ? "changed" : ""} ${
                flashingVars.has(name) ? "flashing" : ""
              }`}
            >
              {isChanged && <BubbleParticles active varName={name} varValue={value} key={`${name}-${burstKey}`} />}
              <div className="var-name" title={name}>{name}</div>
              <div className="var-value" title={String(value)}>
                <code>{value}</code>
              </div>
              {isChanged && previousValue !== undefined && (
                <div className="var-change">
                  <span className="prev-value">{previousValue}</span>
                  <span className="change-arrow"> → </span>
                  <span className="next-value">{value}</span>
                </div>
              )}
              {isChanged && <div className="change-badge">CHANGED!</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

