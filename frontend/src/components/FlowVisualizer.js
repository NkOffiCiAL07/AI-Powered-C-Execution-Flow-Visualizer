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



export default function FlowVisualizer({
  result,
  loading,
  stepLoading,
  onLineChange,
  onNext,
  onBack,
  onExplainStep,
  breakpoints,
  jumpTarget,   // { step: number, version: number } — set externally to jump to a step
}) {
  const { theme } = useTheme();
  const dark = isDarkTheme(theme);

  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pausedAtBp, setPausedAtBp] = useState(false); // true when auto-play stopped at a breakpoint
  const [speed, setSpeed] = useState(800);
  const [playStepType, setPlayStepType] = useState("step_in"); // "step_in" | "step_over"
  const [diffMode, setDiffMode] = useState(false);
  const [diffStep, setDiffStep] = useState(null);
  const playingRef = useRef(false);
  const speedRef = useRef(800);
  const playStepTypeRef = useRef("step_in");
  const onNextRef = useRef(onNext);
  const onLineChangeRef = useRef(onLineChange);
  const breakpointsRef = useRef(breakpoints);
  const visibleSnapshotsRef = useRef(null);
  const resultRef = useRef(result);          // always points at the latest result prop
  const timerRef = useRef(null);
  onNextRef.current = onNext;
  onLineChangeRef.current = onLineChange;
  breakpointsRef.current = breakpoints;
  resultRef.current = result;                // kept in sync every render (no useEffect needed)

  const snapshots = useMemo(() => result?.snapshots || [], [result]);
  const cursorFromServer = typeof result?.cursor === "number" ? result.cursor : 0;
  const visibleSnapshots = useMemo(() => snapshots, [snapshots]);
  visibleSnapshotsRef.current = visibleSnapshots; // keep ref in sync for keyboard handler
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

  // When stepLoading transitions from true → false while playing, check for
  // breakpoint hit then schedule (or cancel) the next auto-step.
  const prevStepLoadingRef = useRef(stepLoading);
  useEffect(() => {
    const wasLoading = prevStepLoadingRef.current;
    prevStepLoadingRef.current = stepLoading;

    // Only act when a step just finished (true → false) and we're in play mode
    if (!(wasLoading && !stepLoading && playingRef.current)) return;

    // ── 1. Program ended or step rejected → stop ──────────────────────────────
    if (statusRef.current === "exited" || statusRef.current === "error" || !lastAcceptedRef.current) {
      playingRef.current = false;
      setPlaying(false);
      setPausedAtBp(false);
      return;
    }

    // ── 2. Breakpoint hit → pause here so user can inspect ───────────────────
    const latestResult = resultRef.current;
    const cursor = latestResult?.cursor ?? 0;
    const landedSnap = latestResult?.snapshots?.[cursor];
    const landedLine = landedSnap?.location?.line;
    if (landedLine && breakpointsRef.current?.size > 0 && breakpointsRef.current.has(landedLine)) {
      playingRef.current = false;
      setPlaying(false);
      setPausedAtBp(true);   // show "Paused at breakpoint" badge
      return;
    }

    // ── 3. All clear → schedule the next step after the speed delay ──────────
    timerRef.current = setTimeout(() => {
      if (!playingRef.current) return;
      if (statusRef.current === "exited" || statusRef.current === "error" || !lastAcceptedRef.current) {
        playingRef.current = false;
        setPlaying(false);
        return;
      }
      if (onNextRef.current) onNextRef.current(playStepTypeRef.current);
    }, speedRef.current);
  }, [stepLoading]);

  // Stop when result is cleared (new analysis or code edit), NOT on step updates
  const prevSessionRef = useRef(result?.session_id);
  useEffect(() => {
    const newSession = result?.session_id;
    if (prevSessionRef.current && prevSessionRef.current !== newSession) {
      playingRef.current = false;
      setPlaying(false);
      setPausedAtBp(false);
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

  // Keep speedRef and playStepTypeRef in sync
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { playStepTypeRef.current = playStepType; }, [playStepType]);

  // External jump (from BreakpointsPanel) — version number is the intentional dep
  useEffect(() => {
    if (jumpTarget == null) return;
    const { step } = jumpTarget;
    if (step >= 0 && step < visibleSnapshots.length) {
      handlePause();
      setCurrentStep(step);
      if (onLineChange && visibleSnapshots[step]?.location?.line) {
        onLineChange(visibleSnapshots[step].location.line);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpTarget?.version]);

  const handlePlay = useCallback(() => {
    if (atEnd) return;
    setPausedAtBp(false);
    playingRef.current = true;
    setPlaying(true);
    // Kick off the first step immediately using the selected play mode
    if (onNextRef.current) onNextRef.current(playStepTypeRef.current);
  }, [atEnd]);

  const handlePause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    setPausedAtBp(false);
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
        case 'F5': // Continue to next breakpoint
          e.preventDefault();
          if (breakpointsRef.current && breakpointsRef.current.size > 0 && !stepLoading && !atEnd) {
            handlePause();
            const snaps = visibleSnapshotsRef.current;
            let bpFound = -1;
            for (let i = safeCurrentStep + 1; i < snaps.length; i++) {
              if (breakpointsRef.current.has(snaps[i]?.location?.line)) { bpFound = i; break; }
            }
            if (bpFound >= 0) {
              setCurrentStep(bpFound);
              if (onLineChangeRef.current) onLineChangeRef.current(snaps[bpFound].location.line);
            }
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

  const progressPct = Math.round(((safeCurrentStep + 1) / totalSteps) * 100);
  const isAtBreakpoint = breakpoints && snap?.location?.line && breakpoints.has(snap.location.line);

  return (
    <div className="flow-visualizer">
      <div className="flow-controls">
        {/* ── Transport ── */}
        <div className="control-group">
          <button
            className="control-btn"
            onClick={() => { handlePause(); onBack && onBack(); }}
            disabled={stepLoading || safeCurrentStep === 0 || playing}
            title="Go back one step (←)"
          >
            <span className="material-symbols-outlined">chevron_left</span>
            Back
          </button>

          <button
            className={`control-btn ${playing ? 'pause-btn' : 'play-btn'}`}
            onClick={playing ? handlePause : handlePlay}
            disabled={stepLoading || atEnd}
            title={playing ? "Pause (Space)" : "Auto-play through all lines (Space)"}
          >
            <span className="material-symbols-outlined">{playing ? 'pause' : 'play_arrow'}</span>
            {playing ? 'Pause' : 'Play'}
          </button>

          <button
            className="control-btn primary"
            onClick={() => { handlePause(); onNext && onNext("step_over"); }}
            disabled={stepLoading || atEnd || playing}
            title="Step over — next line, skip function body (→)"
          >
            <span className="material-symbols-outlined">redo</span>
            Step
          </button>

          <button
            className="control-btn"
            onClick={() => { handlePause(); onNext && onNext("step_in"); }}
            disabled={stepLoading || atEnd || playing}
            title="Step into function call (↓)"
          >
            <span className="material-symbols-outlined">south</span>
            Into
          </button>

          <button
            className="control-btn"
            onClick={() => { handlePause(); onNext && onNext("step_out"); }}
            disabled={stepLoading || atEnd || playing}
            title="Step out of current function (↑)"
          >
            <span className="material-symbols-outlined">north</span>
            Out
          </button>

          {breakpoints && breakpoints.size > 0 && (
            <button
              className="control-btn"
              onClick={() => {
                handlePause();
                let found = -1;
                for (let i = safeCurrentStep + 1; i < visibleSnapshots.length; i++) {
                  if (breakpoints.has(visibleSnapshots[i]?.location?.line)) { found = i; break; }
                }
                if (found >= 0) {
                  setCurrentStep(found);
                  if (onLineChange) onLineChange(visibleSnapshots[found].location.line);
                }
              }}
              disabled={stepLoading || atEnd}
              title="Jump to next breakpoint (F5)"
            >
              <span className="material-symbols-outlined">skip_next</span>
              To BP
            </button>
          )}
        </div>

        {/* ── Play mode toggle ── */}
        <div className="control-group play-mode-group">
          <span className="speed-label">Play mode:</span>
          <div className="play-mode-toggle">
            <button
              className={`play-mode-btn ${playStepType === 'step_in' ? 'active' : ''}`}
              onClick={() => setPlayStepType('step_in')}
              title="Play steps into every function call — sees every line executed"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>south</span>
              Step In
            </button>
            <button
              className={`play-mode-btn ${playStepType === 'step_over' ? 'active' : ''}`}
              onClick={() => setPlayStepType('step_over')}
              title="Play steps over function calls — only top-level lines"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>redo</span>
              Step Over
            </button>
          </div>
        </div>

        {/* ── Speed ── */}
        <div className="control-group">
          <span className="speed-label">Speed:</span>
          <input
            type="range"
            className="speed-slider"
            min="150"
            max="2000"
            step="50"
            value={2150 - speed}
            onChange={(e) => setSpeed(2150 - Number(e.target.value))}
          />
          <span className="speed-label">{speed < 400 ? 'Fast' : speed < 900 ? 'Normal' : 'Slow'}</span>
        </div>

        {/* ── Diff mode ── */}
        <div className="control-group">
          <button
            className={`control-btn ${diffMode ? 'primary' : ''}`}
            onClick={() => { setDiffMode(!diffMode); if (!diffMode) setDiffStep(safeCurrentStep > 0 ? safeCurrentStep - 1 : 0); }}
            title="Compare two execution steps side-by-side"
          >
            <span className="material-symbols-outlined">compare_arrows</span>
            Diff
          </button>
        </div>

        {stepLoading && (
          <div className="control-group step-fetching">
            <span className="material-symbols-outlined spin" style={{ fontSize: 15 }}>sync</span>
            stepping…
          </div>
        )}
      </div>

      <div className={`step-indicator${isAtBreakpoint ? ' step-at-breakpoint' : ''}`}>
        <div className="step-info">
          {isAtBreakpoint && (
            <span className="bp-hit-indicator" title="Execution reached a breakpoint">
              ⬤ Breakpoint — line {snap.location.line}
            </span>
          )}
          {pausedAtBp && (
            <span className="bp-paused-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>pause_circle</span>
              Paused at breakpoint — line {snap?.location?.line}
              <button
                className="bp-resume-btn"
                onClick={handlePlay}
                disabled={atEnd}
                title="Resume auto-play past this breakpoint"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>play_arrow</span>
                Resume
              </button>
            </span>
          )}
          <span className="step-number">Step {safeCurrentStep + 1} of {totalSteps}</span>
          <span className="step-pct">{progressPct}% done</span>

          {/* ── Feature 8: Performance Score Badge ── */}
          {totalSteps > 0 && (() => {
            let cls, icon, label;
            if (totalSteps <= 20)        { cls = 'blazing';  icon = 'bolt';  label = 'Blazing'; }
            else if (totalSteps <= 120)  { cls = 'moderate'; icon = 'speed'; label = 'Moderate'; }
            else                         { cls = 'heavy';    icon = 'warning'; label = 'Heavy'; }
            return (
              <span key={totalSteps} className={`perf-badge perf-badge--${cls}`} title={`${totalSteps} execution steps — ${label} complexity`}>
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{icon}</span>
                {label}
              </span>
            );
          })()}
        </div>

        {/* ── Feature 5: Draggable Timeline Scrubber ── */}
        <div
          className="progress-bar scrubber-bar"
          title="Click or drag to jump to any execution step"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const target = Math.round(pct * (totalSteps - 1));
            const maxVisited = result?.cursor ?? 0;
            if (target <= maxVisited) {
              handlePause();
              setCurrentStep(target);
              const snap = visibleSnapshots[target];
              if (snap?.location?.line && onLineChange) onLineChange(snap.location.line);
            }
          }}
          onMouseMove={(e) => {
            if (e.buttons !== 1) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const target = Math.round(pct * (totalSteps - 1));
            const maxVisited = result?.cursor ?? 0;
            if (target <= maxVisited) {
              handlePause();
              setCurrentStep(target);
              const snap = visibleSnapshots[target];
              if (snap?.location?.line && onLineChange) onLineChange(snap.location.line);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          {/* Visited range */}
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          {/* Scrubber thumb */}
          <div
            className="scrubber-thumb"
            style={{ left: `calc(${progressPct}% - 6px)` }}
          />
          {/* Breakpoint markers */}
          {breakpoints && [...breakpoints].map(bpLine => {
            // Find the first snapshot index where location.line === bpLine
            const idx = visibleSnapshots.findIndex(s => s?.location?.line === bpLine);
            if (idx < 0 || idx > (result?.cursor ?? 0)) return null;
            const pct = (idx / Math.max(totalSteps - 1, 1)) * 100;
            return (
              <div
                key={bpLine}
                className="scrubber-bp-marker"
                style={{ left: `${pct}%` }}
                title={`Breakpoint — line ${bpLine}`}
              />
            );
          })}
        </div>
      </div>

      {/* ── Graphical Execution State Panel ── */}
      <div className="exec-state-panel">
        {/* Left: current line + function badge */}
        <div className="exec-state-loc">
          <div className="exec-line-badge">
            <span className="exec-line-label">LINE</span>
            <span className="exec-line-num">{snap.location.line > 0 ? snap.location.line : '—'}</span>
          </div>
          <div className="exec-fn-badge">
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>function</span>
            {snap.location.function || 'global'}
          </div>
          {isAtBreakpoint && (
            <div className="exec-bp-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 11 }}>adjust</span>
              Breakpoint
            </div>
          )}
        </div>

        {/* Center: variable change cards */}
        <div className="exec-changes">
          {(snap.changed_variables || []).length === 0 ? (
            <div className="exec-no-change">
              <span className="material-symbols-outlined" style={{ fontSize: 14, opacity: 0.4 }}>arrow_right_alt</span>
              <span>{safeCurrentStep === 0 ? 'Program started' : 'No variable changes this step'}</span>
            </div>
          ) : (
            (snap.changed_variables || []).slice(0, 4).map((name) => {
              const newVal = snap.variables?.[name];
              const oldVal = prevSnap?.variables?.[name];
              const isNew = oldVal === undefined;
              const truncate = (v) => { const s = String(v ?? ''); return s.length > 16 ? s.slice(0, 14) + '…' : s; };
              return (
                <div key={name} className="exec-change-card">
                  <span className="exec-change-name">{name}</span>
                  {isNew ? (
                    <span className="exec-change-new-badge">NEW</span>
                  ) : (
                    <div className="exec-change-flow">
                      <span className="exec-change-old" title={String(oldVal)}>{truncate(oldVal)}</span>
                      <span className="exec-change-arrow">→</span>
                    </div>
                  )}
                  <span className="exec-change-val" title={String(newVal)}>{truncate(newVal)}</span>
                </div>
              );
            })
          )}
          {(snap.changed_variables || []).length > 4 && (
            <div className="exec-change-more">+{snap.changed_variables.length - 4} more</div>
          )}
        </div>

        {/* Right: AI explain button */}
        {onExplainStep && (
          <button
            className="exec-ai-btn"
            onClick={() => onExplainStep(snap)}
            title="Ask AI to explain this step in detail"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
            AI
          </button>
        )}
      </div>

      <CallGraphPanel snapshots={visibleSnapshots} currentStep={safeCurrentStep} dark={dark} />

      <div className="var-section-label">
        Variables — <span className="active-function-pill">{snap.location.function}</span>
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
          <div className="var-section-label">Call Stack</div>
          <div className="call-stack-list">
            {snap.call_stack.map((frame, i) => (
              <div key={i} className={`call-stack-frame ${i === 0 ? "active" : ""}`}>
                <span className="frame-index">#{frame.index ?? i}</span>
                <span className="frame-func">{frame.function}</span>
                <span className="frame-loc">{frame.file?.split('/').pop()}:{frame.line}</span>
                {i === 0 && <span className="frame-active-tag">▶ executing</span>}
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
