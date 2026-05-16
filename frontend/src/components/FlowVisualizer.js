import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import "../styles/FlowVisualizer.css";
import VariableTracker from "./VariableTracker";
import ExecutionTimeline from "./ExecutionTimeline";

function buildExplanation(snapshot, prevSnapshot, stepIndex) {
  const line = snapshot.location.line;
  const changed = snapshot.changed_variables || [];
  const vars = snapshot.variables || {};
  const prevVars = prevSnapshot?.variables || {};

  if (line <= 0) {
    return `The program has finished executing!`;
  }

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
  return null;
}

export default function FlowVisualizer({
  result,
  loading,
  stepLoading,
  onLineChange,
  onNext,
  onBack,
  onExplainStep,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [diffMode, setDiffMode] = useState(false);
  const [diffStep, setDiffStep] = useState(null);
  const playingRef = useRef(false);
  const speedRef = useRef(1000);
  const onNextRef = useRef(onNext);
  const timerRef = useRef(null);
  onNextRef.current = onNext;

  const snapshots = useMemo(() => result?.snapshots || [], [result]);
  const cursorFromServer = typeof result?.cursor === "number" ? result.cursor : 0;
  const visibleSnapshots = useMemo(() => snapshots, [snapshots]);
  const totalSteps = visibleSnapshots.length;
  const safeCurrentStep = Math.min(currentStep, Math.max(0, totalSteps - 1));
  const statusStr = result?.status || "";
  const lastAccepted = result?.accepted !== false;
  const atEnd = safeCurrentStep >= Math.max(0, totalSteps - 1) && (statusStr === "exited" || statusStr === "error");
  const statusRef = useRef(statusStr);
  statusRef.current = statusStr;
  const lastAcceptedRef = useRef(lastAccepted);
  lastAcceptedRef.current = lastAccepted;

  useEffect(() => {
    if (result == null) {
      setCurrentStep(0);
      return;
    }
    setCurrentStep(Math.max(0, cursorFromServer));
  }, [result, cursorFromServer]);

  useEffect(() => {
    if (snapshots.length === 0) return;
    setCurrentStep((prev) => Math.min(prev, Math.max(0, snapshots.length - 1)));
  }, [snapshots]);

  useEffect(() => {
    if (totalSteps > 0) {
      const snap = visibleSnapshots[safeCurrentStep];
      if (snap?.location?.line && onLineChange) onLineChange(snap.location.line);
    } else if (onLineChange) {
      onLineChange(null);
    }
  }, [safeCurrentStep, totalSteps, visibleSnapshots, onLineChange]);

  // When stepLoading transitions from true → false while playing, schedule next
  const prevStepLoadingRef = useRef(stepLoading);
  useEffect(() => {
    const wasLoading = prevStepLoadingRef.current;
    prevStepLoadingRef.current = stepLoading;

    // Only act when a step just finished (true → false) and we're playing
    if (wasLoading && !stepLoading && playingRef.current) {
      // Check if program has ended or last step was rejected — stop playing
      if (statusRef.current === "exited" || statusRef.current === "error" || !lastAcceptedRef.current) {
        playingRef.current = false;
        setPlaying(false);
        return;
      }

      timerRef.current = setTimeout(() => {
        if (!playingRef.current) return;
        if (statusRef.current === "exited" || statusRef.current === "error" || !lastAcceptedRef.current) {
          playingRef.current = false;
          setPlaying(false);
          return;
        }
        if (onNextRef.current) onNextRef.current();
      }, speedRef.current);
    }
  }, [stepLoading]);

  // Stop when result is cleared (new analysis or code edit), NOT on step updates
  const prevSessionRef = useRef(result?.session_id);
  useEffect(() => {
    const newSession = result?.session_id;
    if (prevSessionRef.current && prevSessionRef.current !== newSession) {
      playingRef.current = false;
      setPlaying(false);
    }
    prevSessionRef.current = newSession;
  }, [result?.session_id]);

  // Stop when atEnd becomes true
  useEffect(() => {
    if (atEnd && playingRef.current) {
      playingRef.current = false;
      setPlaying(false);
    }
  }, [atEnd]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Keep speedRef in sync
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const handlePlay = useCallback(() => {
    if (atEnd) return;
    playingRef.current = true;
    setPlaying(true);
    // Kick off the first step immediately
    if (onNextRef.current) onNextRef.current();
  }, [atEnd]);

  const handlePause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable element
      const isEditable = e.target.tagName === 'INPUT' || 
                         e.target.tagName === 'TEXTAREA' || 
                         e.target.isContentEditable ||
                         e.target.closest('.monaco-editor');
      
      if (isEditable) return;

      switch (e.key) {
        case 'ArrowRight':
          if (!stepLoading && !atEnd && !playingRef.current) {
            if (onNextRef.current) onNextRef.current("step_over");
          }
          break;
        case 'ArrowLeft':
          if (!stepLoading && safeCurrentStep > 0 && !playingRef.current) {
            if (onBack) onBack();
          }
          break;
        case 'ArrowDown':
          if (!stepLoading && !atEnd && !playingRef.current) {
            if (onNextRef.current) onNextRef.current("step_in");
          }
          break;
        case 'ArrowUp':
          if (!stepLoading && !atEnd && !playingRef.current) {
            if (onNextRef.current) onNextRef.current("step_out");
          }
          break;
        case ' ': // Spacebar
          e.preventDefault(); // Prevent page scroll
          if (playingRef.current) {
            handlePause();
          } else if (!atEnd) {
            handlePlay();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepLoading, atEnd, safeCurrentStep, handlePlay, handlePause, onBack]);

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
        <p>
          {result?.execution_mode === "output_only"
            ? "This program was run with stdin input in output-only mode. Open Output & Details to see the result."
            : <><strong>Analyze &amp; Run</strong> to watch your program execute!</>}
        </p>
      </div>
    );
  }

  const snap = visibleSnapshots[safeCurrentStep];
  
  // If in diff mode and a diff step is selected, compare against that step. Otherwise, compare against previous step.
  const prevSnap = diffMode && diffStep !== null 
    ? visibleSnapshots[diffStep] 
    : (safeCurrentStep > 0 ? visibleSnapshots[safeCurrentStep - 1] : null);
    
  const explanation = buildExplanation(snap, prevSnap, safeCurrentStep);
  const progressPct = Math.round(((safeCurrentStep + 1) / totalSteps) * 100);

  return (
    <div className="flow-visualizer">
      <div className="flow-controls">
        <div className="control-group">
          <button
            className="control-btn"
            onClick={() => { handlePause(); onBack && onBack(); }}
            disabled={stepLoading || safeCurrentStep === 0 || playing}
            title="Go back one step (Left Arrow)"
          >
            <span className="material-symbols-outlined">chevron_left</span>
            Back
          </button>
          <button
            className={`control-btn ${playing ? 'pause-btn' : 'play-btn'}`}
            onClick={playing ? handlePause : handlePlay}
            disabled={stepLoading || atEnd}
            title={playing ? "Pause playback (Space)" : "Play automatically (Space)"}
          >
            <span className="material-symbols-outlined">{playing ? 'pause' : 'play_arrow'}</span>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            className="control-btn primary"
            onClick={() => { handlePause(); onNext && onNext("step_over"); }}
            disabled={stepLoading || atEnd || playing}
            title="Go to next line (Right Arrow)"
          >
            Next
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <button
            className="control-btn"
            onClick={() => { handlePause(); onNext && onNext("step_in"); }}
            disabled={stepLoading || atEnd || playing}
            title="Step into function (Down Arrow)"
          >
            <span className="material-symbols-outlined">south</span>
            In
          </button>
          <button
            className="control-btn"
            onClick={() => { handlePause(); onNext && onNext("step_out"); }}
            disabled={stepLoading || atEnd || playing}
            title="Step out of function (Up Arrow)"
          >
            <span className="material-symbols-outlined">north</span>
            Out
          </button>
        </div>
        <div className="control-group">
          <span className="speed-label">Speed:</span>
          <input
            type="range"
            className="speed-slider"
            min="200"
            max="2000"
            step="100"
            value={2200 - speed}
            onChange={(e) => setSpeed(2200 - Number(e.target.value))}
          />
          <span className="speed-label">{speed}ms</span>
        </div>
        <div className="control-group">
          <button
            className={`control-btn ${diffMode ? 'primary' : ''}`}
            onClick={() => { setDiffMode(!diffMode); if (!diffMode) setDiffStep(safeCurrentStep > 0 ? safeCurrentStep - 1 : 0); }}
            title="Toggle execution diff mode. When active, click a step on the timeline to compare with the current step."
          >
            <span className="material-symbols-outlined">compare_arrows</span>
            Diff Mode
          </button>
        </div>
        {stepLoading && <div className="control-group">Fetching next step...</div>}
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

      <div className="explanation-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="explanation-text" style={{ flex: 1 }}>
          <div className="explanation-label">What is happening?</div>
          <div className="explanation-body">{explanation}</div>
        </div>
        {onExplainStep && (
          <button 
            className="control-btn primary" 
            onClick={() => onExplainStep(snap)}
            title="Ask AI to explain this specific step in detail"
            style={{ marginLeft: '12px', flexShrink: 0, padding: '4px 8px', fontSize: '10px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }}>auto_awesome</span>
            AI Explain
          </button>
        )}
      </div>

      <div className="var-section-label">
        Variable Boxes — active in <span className="active-function-pill">{snap.location.function}</span>
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

      {snap.call_stack && snap.call_stack.length > 1 && (
        <div className="call-stack-section">
          <div className="var-section-label">Call Stack — active functions</div>
          <div className="call-stack-list">
            {snap.call_stack.map((frame, i) => (
              <div key={i} className={`call-stack-frame ${i === 0 ? "active" : ""}`}>
                <span className="frame-index">#{frame.index}</span>
                <span className="frame-func">{frame.function}</span>
                <span className="frame-loc">{frame.file.split('/').pop()}:{frame.line}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ExecutionTimeline
        snapshots={visibleSnapshots}
        currentStep={safeCurrentStep}
        diffStep={diffMode ? diffStep : null}
        onStepClick={(i) => {
          if (i <= (result?.cursor ?? 0)) {
            if (diffMode) {
              setDiffStep(i);
            } else {
              setCurrentStep(i);
            }
          }
        }}
      />
    </div>
  );
}
