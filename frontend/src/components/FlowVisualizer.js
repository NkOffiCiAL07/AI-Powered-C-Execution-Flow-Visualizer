import React, { useState, useEffect } from "react";
import "../styles/FlowVisualizer.css";
import VariableTracker from "./VariableTracker";
import ExecutionTimeline from "./ExecutionTimeline";

function buildExplanation(snapshot, prevSnapshot, stepIndex) {
  const line = snapshot.location.line;
  const changed = snapshot.changed_variables || [];
  const vars = snapshot.variables || {};
  const prevVars = prevSnapshot?.variables || {};

  if (stepIndex === 0) {
    return `The program starts! We are on line ${line}. Nothing has happened yet — we are just getting ready to run.`;
  }

  if (changed.length === 0) {
    return `The computer is reading line ${line}. No variable changed this step — it is just moving to the next instruction.`;
  }

  const sentences = changed.map((name) => {
    const newVal = vars[name];
    const oldVal = prevVars[name];
    if (oldVal === undefined) {
      return `A brand new box called "${name}" was created and filled with the value ${newVal}.`;
    }
    return `The box "${name}" changed from ${oldVal} to ${newVal}.`;
  });

  return `Line ${line}: ${sentences.join(" ")}`;
}

function stepEmoji(snapshot, stepIndex) {
  if (stepIndex === 0) return "🚀";
  const changed = snapshot.changed_variables || [];
  if (changed.length === 0) return "👣";
  const name = changed[0];
  const val = snapshot.variables?.[name];
  if (typeof val === "string" && val.includes('"')) return "💬";
  return "✏️";
}

function getLastPlayableLine(code) {
  const lines = (code || "").split("\n");

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const trimmedLine = lines[index].trim();

    if (trimmedLine && trimmedLine !== "{" && trimmedLine !== "}") {
      return index + 1;
    }
  }

  return 1;
}

export default function FlowVisualizer({ result, loading, onLineChange, code }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1500);

  const snapshots = result?.snapshots || [];
  const stopLine = getLastPlayableLine(code);
  const stopStep = snapshots.findIndex(
    (snapshot) => snapshot.location?.line >= stopLine
  );
  const maxStep = stopStep >= 0 ? stopStep : Math.max(0, snapshots.length - 1);
  const visibleSnapshots = snapshots.slice(0, maxStep + 1);
  const totalSteps = visibleSnapshots.length;
  const safeCurrentStep = Math.min(currentStep, Math.max(0, totalSteps - 1));

  useEffect(() => {
    if (snapshots.length === 0) return;

    setCurrentStep((prev) => Math.min(prev, maxStep));
  }, [snapshots, maxStep]);

  useEffect(() => {
    if (!isAnimating || totalSteps === 0 || safeCurrentStep >= maxStep) return;

    const timer = setTimeout(() => {
      setCurrentStep((prev) => {
        const next = Math.min(prev + 1, maxStep);
        if (next >= maxStep) {
          return maxStep;
        }
        return next;
      });
    }, animationSpeed);

    return () => clearTimeout(timer);
  }, [isAnimating, safeCurrentStep, totalSteps, maxStep, animationSpeed]);

  useEffect(() => {
    if (isAnimating && totalSteps > 0 && safeCurrentStep >= maxStep) {
      setIsAnimating(false);
    }
  }, [isAnimating, totalSteps, safeCurrentStep, maxStep]);

  useEffect(() => {
    if (totalSteps > 0) {
      const snap = visibleSnapshots[safeCurrentStep];
      if (snap?.location?.line && onLineChange) onLineChange(snap.location.line);
    } else if (onLineChange) {
      onLineChange(null);
    }
  }, [safeCurrentStep, totalSteps, visibleSnapshots, onLineChange]);

  if (loading) {
    return (
      <div className="flow-visualizer-loading">
        <div className="spinner"></div>
        <p>Running your program step by step... please wait ⏳</p>
      </div>
    );
  }

  if (!result || snapshots.length === 0) {
    return (
      <div className="flow-visualizer-empty">
        <p>Press <strong>Analyze &amp; Run</strong> to watch your program execute!</p>
      </div>
    );
  }

  const snap = visibleSnapshots[safeCurrentStep];
  const prevSnap = safeCurrentStep > 0 ? visibleSnapshots[safeCurrentStep - 1] : null;
  const explanation = buildExplanation(snap, prevSnap, safeCurrentStep);
  const emoji = stepEmoji(snap, safeCurrentStep);
  const progressPct = Math.round(((safeCurrentStep + 1) / totalSteps) * 100);

  const speedLabel =
    animationSpeed >= 2000 ? "Very Slow" :
    animationSpeed >= 1200 ? "Slow" :
    animationSpeed >= 700  ? "Normal" :
    animationSpeed >= 350  ? "Fast" : "Very Fast";

  return (
    <div className="flow-visualizer">
      <div className="flow-controls">
        <div className="control-group">
          <button className="control-btn" onClick={() => { setCurrentStep(0); setIsAnimating(true); }}>
            ⏮ Restart
          </button>
          <button className="control-btn primary" onClick={() => setIsAnimating(!isAnimating)}>
            {isAnimating ? "⏸ Pause" : "▶ Play"}
          </button>
          <button className="control-btn" onClick={() => { setIsAnimating(false); setCurrentStep(Math.max(0, safeCurrentStep - 1)); }} disabled={safeCurrentStep === 0}>
            ◀ Back
          </button>
          <button className="control-btn" onClick={() => { setIsAnimating(false); setCurrentStep(Math.min(maxStep, safeCurrentStep + 1)); }} disabled={safeCurrentStep === maxStep}>
            Next ▶
          </button>
        </div>
        <div className="control-group">
          <span className="speed-label">🐢 Speed: <strong>{speedLabel}</strong></span>
          <input
            type="range" min="200" max="3000" step="100"
            value={3200 - animationSpeed}
            onChange={(e) => setAnimationSpeed(3200 - parseInt(e.target.value))}
            className="speed-slider"
          />
          <span className="speed-label">🐇</span>
        </div>
      </div>

      <div className="step-indicator">
        <div className="step-info">
          <span className="step-number">Step {safeCurrentStep + 1} of {totalSteps}</span>
          <span className="step-pct">{progressPct}% done</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="explanation-box">
        <div className="explanation-emoji">{emoji}</div>
        <div className="explanation-text">
          <div className="explanation-label">What is happening?</div>
          <div className="explanation-body">{explanation}</div>
        </div>
      </div>

      <div className="var-section-label">
        📦 Variable Boxes — each box stores a number or value
        {Object.keys(snap.variables || {}).length === 0 && (
          <span className="no-vars"> (no variables yet)</span>
        )}
      </div>
      <div className="execution-center">
        <VariableTracker
          variables={snap.variables}
          changedVariables={snap.changed_variables}
          previousSnapshot={prevSnap}
        />
      </div>

      <ExecutionTimeline
        snapshots={visibleSnapshots}
        currentStep={safeCurrentStep}
        onStepClick={(i) => { setIsAnimating(false); setCurrentStep(i); }}
      />
    </div>
  );
}
