import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import "../styles/FlowVisualizer.css";
import VariableTracker from "./VariableTracker";
import ExecutionTimeline from "./ExecutionTimeline";
import { useTheme, isDarkTheme } from "../theme";

// ── Call Graph Builder ────────────────────────────────────────────────────────
const NODE_W = 110, NODE_H = 30, H_GAP = 24, V_GAP = 44, PAD = 16;

function buildCallGraph(snapshots, upTo) {
  const nodeDepth = {}; // funcName -> min depth (0 = main / outermost)
  const edgeSet = new Set();
  const edges = [];

  for (let i = 0; i <= upTo; i++) {
    const stack = (snapshots[i]?.call_stack || []).slice().reverse(); // outermost first
    stack.forEach((frame, depth) => {
      if (nodeDepth[frame.function] === undefined || depth < nodeDepth[frame.function]) {
        nodeDepth[frame.function] = depth;
      }
      if (depth > 0) {
        const caller = stack[depth - 1].function;
        const key = `${caller}→${frame.function}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ from: caller, to: frame.function });
        }
      }
    });
  }

  // Group by depth, preserve discovery order within each level
  const byDepth = {};
  const seen = [];
  // Walk snapshots again in order to maintain consistent left-to-right ordering
  for (let i = 0; i <= upTo; i++) {
    const stack = (snapshots[i]?.call_stack || []).slice().reverse();
    stack.forEach((frame) => {
      if (!seen.includes(frame.function)) seen.push(frame.function);
    });
  }

  seen.forEach((fn) => {
    const d = nodeDepth[fn] ?? 0;
    if (!byDepth[d]) byDepth[d] = [];
    if (!byDepth[d].includes(fn)) byDepth[d].push(fn);
  });

  // Compute x/y positions
  const positions = {};
  Object.entries(byDepth).forEach(([depthStr, funcs]) => {
    const depth = Number(depthStr);
    const rowWidth = funcs.length * NODE_W + (funcs.length - 1) * H_GAP;
    funcs.forEach((fn, col) => {
      positions[fn] = {
        x: PAD + col * (NODE_W + H_GAP),
        y: PAD + depth * (NODE_H + V_GAP),
        rowWidth,
      };
    });
  });

  const maxX = Math.max(...Object.values(positions).map(p => p.x + NODE_W), 200) + PAD;
  const maxY = Math.max(...Object.values(positions).map(p => p.y + NODE_H), 80) + PAD;

  return { nodes: seen, positions, edges, svgW: maxX, svgH: maxY };
}

function CallGraphPanel({ snapshots, currentStep, dark }) {
  const graph = useMemo(
    () => buildCallGraph(snapshots, currentStep),
    [snapshots, currentStep]
  );
  const currentFn = snapshots[currentStep]?.location?.function;

  if (graph.nodes.length === 0) return null;

  const accent = '#C96A48';
  const nodeBg = dark ? '#1E1A17' : '#FFF8F4';
  const nodeBorder = dark ? 'rgba(232,226,217,0.14)' : 'rgba(201,106,72,0.22)';
  const edgeColor = dark ? 'rgba(232,226,217,0.18)' : 'rgba(100,70,40,0.2)';
  const textColor = dark ? '#E8E2D9' : '#1A1310';
  const mutedText = dark ? 'rgba(232,226,217,0.45)' : 'rgba(26,19,16,0.45)';

  return (
    <div className="call-graph-wrap">
      <div className="call-graph-label">
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: accent }}>account_tree</span>
        Execution Call Graph
        <span className="call-graph-hint">({graph.nodes.length} function{graph.nodes.length !== 1 ? 's' : ''} traced)</span>
      </div>
      <div className="call-graph-scroll">
        <svg
          width={graph.svgW}
          height={graph.svgH}
          style={{ display: 'block', minWidth: graph.svgW }}
          aria-label="Execution call graph"
        >
          {/* Edges */}
          {graph.edges.map(({ from, to }, ei) => {
            const fp = graph.positions[from];
            const tp = graph.positions[to];
            if (!fp || !tp) return null;
            const isSelf = from === to;
            const x1 = fp.x + NODE_W / 2;
            const y1 = fp.y + NODE_H;
            const x2 = tp.x + NODE_W / 2;
            const y2 = tp.y;
            const isActive = from === currentFn || to === currentFn;

            if (isSelf) {
              // Self-edge (recursion): arc on the right side
              const rx = fp.x + NODE_W + 10;
              const ry = fp.y + NODE_H / 2;
              return (
                <g key={ei}>
                  <path
                    d={`M ${fp.x + NODE_W} ${ry - 8} Q ${rx + 18} ${ry} ${fp.x + NODE_W} ${ry + 8}`}
                    fill="none"
                    stroke={isActive ? accent : edgeColor}
                    strokeWidth={isActive ? 1.8 : 1.2}
                    strokeDasharray={isActive ? 'none' : '5 3'}
                  />
                  <polygon
                    points={`${fp.x + NODE_W},${ry + 8} ${fp.x + NODE_W - 4},${ry + 14} ${fp.x + NODE_W + 4},${ry + 14}`}
                    fill={isActive ? accent : edgeColor}
                  />
                </g>
              );
            }

            const midY = (y1 + y2) / 2;
            const cx1 = x1;
            const cy1 = midY;
            const cx2 = x2;
            const cy2 = midY;

            return (
              <g key={ei}>
                <path
                  d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={isActive ? accent : edgeColor}
                  strokeWidth={isActive ? 1.8 : 1.2}
                  strokeDasharray={isActive ? 'none' : '5 3'}
                />
                {/* Arrowhead */}
                <polygon
                  points={`${x2},${y2} ${x2 - 4},${y2 - 8} ${x2 + 4},${y2 - 8}`}
                  fill={isActive ? accent : edgeColor}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((fn) => {
            const pos = graph.positions[fn];
            if (!pos) return null;
            const isActive = fn === currentFn;
            const label = fn.length > 14 ? fn.slice(0, 13) + '…' : fn;
            return (
              <g key={fn}>
                <rect
                  x={pos.x} y={pos.y}
                  width={NODE_W} height={NODE_H}
                  rx={7} ry={7}
                  fill={isActive ? accent : nodeBg}
                  stroke={isActive ? accent : nodeBorder}
                  strokeWidth={isActive ? 2 : 1}
                  filter={isActive ? 'url(#glow)' : 'none'}
                />
                <text
                  x={pos.x + NODE_W / 2}
                  y={pos.y + NODE_H / 2 + 4.5}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={isActive ? 700 : 500}
                  fontFamily="Space Grotesk, monospace"
                  fill={isActive ? '#fff' : textColor}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Glow filter for active node */}
          <defs>
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </svg>
      </div>
      {graph.nodes.length > 0 && (
        <div className="call-graph-legend">
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: accent, display: 'inline-block' }} />
            <span style={{ color: mutedText, fontSize: 10 }}>active</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="20" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke={edgeColor} strokeWidth="1.2" strokeDasharray="4 2"/></svg>
            <span style={{ color: mutedText, fontSize: 10 }}>call edge</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="20" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke={accent} strokeWidth="1.8"/></svg>
            <span style={{ color: mutedText, fontSize: 10 }}>active edge</span>
          </span>
        </div>
      )}
    </div>
  );
}

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

  const truncate = (val) => {
    if (typeof val !== 'string') return String(val);
    // Strip raw memory addresses like "0x7fff1234: " from display
    const cleaned = val.replace(/0x[0-9a-fA-F]+:\s*/g, '');
    return cleaned.length > 120 ? cleaned.slice(0, 120) + '…' : cleaned;
  };

  const sentences = changed.map((name) => {
    const newVal = truncate(vars[name]);
    const oldVal = prevVars[name] !== undefined ? truncate(prevVars[name]) : undefined;
    if (oldVal === undefined) {
      return `A brand new box called "${name}" was created and filled with the value ${newVal}.`;
    }
    return `The box "${name}" changed from ${oldVal} to ${newVal}.`;
  });

  return `Line ${line}: ${sentences.join(" ")}`;
}


export default function FlowVisualizer({
  result,
  loading,
  stepLoading,
  onLineChange,
  onNext,
  onBack,
  onExplainStep,
  breakpoints,
}) {
  const { theme } = useTheme();
  const dark = isDarkTheme(theme);

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
          {breakpoints && breakpoints.size > 0 && (
            <button
              className="control-btn"
              onClick={() => {
                handlePause();
                const bp = breakpoints;
                let found = -1;
                for (let i = safeCurrentStep + 1; i < visibleSnapshots.length; i++) {
                  if (bp.has(visibleSnapshots[i]?.location?.line)) { found = i; break; }
                }
                if (found >= 0) {
                  setCurrentStep(found);
                  if (onLineChange) onLineChange(visibleSnapshots[found].location.line);
                }
              }}
              disabled={stepLoading || atEnd}
              title="Jump to next breakpoint"
            >
              <span className="material-symbols-outlined">skip_next</span>
              Run to BP
            </button>
          )}
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

      <CallGraphPanel snapshots={visibleSnapshots} currentStep={safeCurrentStep} dark={dark} />

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
