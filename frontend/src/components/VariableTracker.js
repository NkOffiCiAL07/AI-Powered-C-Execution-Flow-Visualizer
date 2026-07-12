import React, { useEffect, useState, useMemo, memo } from "react";
import "../styles/VariableTracker.css";

function BubbleParticles({ active, varName, varValue }) {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    if (!active) return;
    const label = { id: `${Date.now()}-label`, left: 50, delay: 0, isLabel: true };
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
          <div key={b.id} className="bubble bubble-label" style={{ left: `${b.left}%`, animationDelay: `${b.delay}s` }}>
            <span className="bubble-var">{varName}</span>
            <span className="bubble-eq">=</span>
            <span className="bubble-val">{varValue}</span>
          </div>
        ) : (
          <span key={b.id} className="bubble" style={{ left: `${b.left}%`, width: b.size, height: b.size, animationDelay: `${b.delay}s`, background: `hsl(${b.hue}, 80%, 65%)` }} />
        )
      )}
    </div>
  );
}

// Tiny inline SVG sparkline for numeric variables
function Sparkline({ points }) {
  if (!points || points.length < 2) return null;
  const W = 52, H = 18, pad = 2;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (W - pad * 2));
  const ys = points.map(v => H - pad - ((v - min) / range) * (H - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const curX = xs[xs.length - 1], curY = ys[ys.length - 1];
  return (
    <svg className="var-sparkline" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx={curX} cy={curY} r="2.5" fill="var(--primary)" />
    </svg>
  );
}

const VariableTracker = memo(function VariableTracker({ variables, changedVariables, previousSnapshot, allSnapshots, currentStep }) {
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

  // Build numeric history for each variable up to currentStep
  const varHistory = useMemo(() => {
    if (!allSnapshots || !currentStep) return {};
    const hist = {};
    const limit = Math.min(currentStep + 1, allSnapshots.length);
    for (let i = 0; i < limit; i++) {
      const vars = allSnapshots[i]?.variables || {};
      for (const [k, v] of Object.entries(vars)) {
        const n = parseFloat(v);
        if (!isNaN(n)) {
          if (!hist[k]) hist[k] = [];
          hist[k].push(n);
        }
      }
    }
    return hist;
  }, [allSnapshots, currentStep]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortedVars = useMemo(() => Object.entries(variables || {}).sort(([a], [b]) => a.localeCompare(b)), [variables]);

  if (!variables || Object.keys(variables).length === 0) {
    return (
      <div className="variable-tracker">
        <div className="tracker-header">📦 Variables</div>
        <div className="variables-empty"><p>No variables in scope</p></div>
      </div>
    );
  }

  return (
    <div className="variable-tracker">
      <div className="tracker-header">📦 Variables ({Object.keys(variables).length})</div>
      <div className="variables-grid">
        {sortedVars.map(([name, value]) => {
          const isChanged = changedVariables?.includes(name);
          const previousValue = previousSnapshot?.variables?.[name];
          const history = varHistory[name];

          return (
            <div
              key={name}
              className={`variable-card ${isChanged ? "changed" : ""} ${flashingVars.has(name) ? "flashing" : ""}`}
            >
              {isChanged && <BubbleParticles active varName={name} varValue={value} key={`${name}-${burstKey}`} />}
              <div className="var-name" title={name}>{name}</div>
              <div className="var-value" title={String(value)}>
                <code>{value}</code>
                {history && history.length >= 2 && <Sparkline points={history} />}
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
});

export default VariableTracker;
