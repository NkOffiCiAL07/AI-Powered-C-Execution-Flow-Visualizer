import React, { useMemo } from 'react';
import '../styles/BreakpointsPanel.css';

function truncateVal(v, max = 42) {
  const s = String(v).replace(/0x[0-9a-fA-F]+:\s*/g, '');
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export default function BreakpointsPanel({ snapshots, breakpoints, currentStep, onJumpToStep, gdbHits, onGdbDebug, gdbLoading }) {
  // If gdbHits are available, use them (richer data from real GDB)
  // Otherwise fall back to trace-based snapshot hits
  // Build a map: line → [{ snap, idx }, ...]  for all breakpointed lines
  const hits = useMemo(() => {
    const result = {};
    if (!breakpoints) return result;
    [...breakpoints].sort((a, b) => a - b).forEach(line => { result[line] = []; });
    (snapshots || []).forEach((snap, idx) => {
      const line = snap?.location?.line;
      if (line && result[line] !== undefined) result[line].push({ snap, idx });
    });
    return result;
  }, [snapshots, breakpoints]);

  const totalHits = Object.values(hits).reduce((sum, arr) => sum + arr.length, 0);

  if (!breakpoints || breakpoints.size === 0) {
    return (
      <div className="bp-empty">
        <span className="material-symbols-outlined">adjust</span>
        <p>No breakpoints set</p>
        <span>Click any line number in the editor gutter to add one.</span>
      </div>
    );
  }

  if (!gdbHits && (!snapshots || snapshots.length === 0)) {
    return (
      <div className="bp-empty">
        <span className="material-symbols-outlined">play_circle</span>
        <p>{breakpoints.size} breakpoint{breakpoints.size !== 1 ? 's' : ''} set</p>
        <span>Click "Analyze &amp; Debug" to see variable values at each hit.</span>
        {onGdbDebug && (
          <button className="bp-gdb-btn" onClick={onGdbDebug} disabled={gdbLoading}>
            <span className={`material-symbols-outlined${gdbLoading ? ' spin' : ''}`}>
              {gdbLoading ? 'sync' : 'bug_report'}
            </span>
            {gdbLoading ? 'Running GDB…' : 'Run with Real GDB'}
          </button>
        )}
      </div>
    );
  }

  // Use GDB hits if available; render them differently
  if (gdbHits) {
    const gdbByLine = {};
    [...breakpoints].sort((a, b) => a - b).forEach(ln => { gdbByLine[ln] = []; });
    gdbHits.forEach(hit => {
      if (gdbByLine[hit.breakpoint_line] !== undefined) {
        gdbByLine[hit.breakpoint_line].push(hit);
      }
    });

    return (
      <div className="bp-panel">
        <div className="bp-panel-summary">
          <span className="material-symbols-outlined" style={{ color: '#22c55e' }}>verified</span>
          Real GDB · {breakpoints.size} breakpoint{breakpoints.size !== 1 ? 's' : ''}
          <span className="bp-sum-sep">·</span>
          {gdbHits.length} hit{gdbHits.length !== 1 ? 's' : ''}
          {onGdbDebug && (
            <button className="bp-rerun-btn" onClick={onGdbDebug} disabled={gdbLoading} title="Re-run with GDB">
              <span className={`material-symbols-outlined${gdbLoading ? ' spin' : ''}`}>
                {gdbLoading ? 'sync' : 'refresh'}
              </span>
            </button>
          )}
        </div>
        <div className="bp-list">
          {[...breakpoints].sort((a, b) => a - b).map(line => {
            const lineHits = gdbByLine[line] || [];
            return (
              <div key={line} className="bp-group">
                <div className="bp-group-head">
                  <span className="bp-glyph" />
                  <span className="bp-line-label">Line {line}</span>
                  <span className={`bp-count-badge${lineHits.length === 0 ? ' bp-count-zero' : ''}`}>
                    {lineHits.length > 0 ? `${lineHits.length} hit${lineHits.length !== 1 ? 's' : ''}` : 'not reached'}
                  </span>
                </div>
                {lineHits.length === 0 ? (
                  <div className="bp-no-hit">Execution never reached this line</div>
                ) : (
                  lineHits.map((hit, hitIdx) => {
                    const allVars = { ...hit.args, ...hit.locals };
                    const varEntries = Object.entries(allVars);
                    return (
                      <div key={hitIdx} className="bp-hit bp-hit--gdb">
                        <div className="bp-hit-header">
                          <span className="bp-hit-num">Hit #{hit.hit_number}</span>
                          <span className="bp-gdb-tag">GDB</span>
                        </div>
                        {varEntries.length > 0 ? (
                          <div className="bp-vars">
                            {varEntries.slice(0, 8).map(([k, v]) => (
                              <div key={k} className="bp-var-row">
                                <span className="bp-var-name">{k}</span>
                                <span className="bp-var-eq">=</span>
                                <span className="bp-var-val">{truncateVal(v, 60)}</span>
                              </div>
                            ))}
                            {varEntries.length > 8 && <div className="bp-var-more">+{varEntries.length - 8} more</div>}
                          </div>
                        ) : <div className="bp-var-more">No variables in scope</div>}
                        {hit.call_stack?.length > 0 && (
                          <div className="bp-stack">
                            {hit.call_stack.map((fn, fi) => (
                              <React.Fragment key={fi}>
                                <span className="bp-frame">{fn}</span>
                                {fi < hit.call_stack.length - 1 && <span className="bp-frame-sep">→</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bp-panel">
      {/* Summary bar */}
      <div className="bp-panel-summary">
        <span className="material-symbols-outlined">adjust</span>
        {breakpoints.size} breakpoint{breakpoints.size !== 1 ? 's' : ''}
        <span className="bp-sum-sep">·</span>
        {totalHits} hit{totalHits !== 1 ? 's' : ''}
        <span className="bp-sum-hint">Click a hit to jump there</span>
        {onGdbDebug && (
          <button className="bp-rerun-btn" onClick={onGdbDebug} disabled={gdbLoading} title="Run with real GDB for richer variable values">
            <span className={`material-symbols-outlined${gdbLoading ? ' spin' : ''}`}>
              {gdbLoading ? 'sync' : 'bug_report'}
            </span>
            GDB
          </button>
        )}
      </div>

      {/* Per-line groups */}
      <div className="bp-list">
        {[...breakpoints].sort((a, b) => a - b).map(line => {
          const lineHits = hits[line] || [];
          return (
            <div key={line} className="bp-group">

              {/* Group header */}
              <div className="bp-group-head">
                <span className="bp-glyph" aria-hidden="true" />
                <span className="bp-line-label">Line {line}</span>
                <span className={`bp-count-badge${lineHits.length === 0 ? ' bp-count-zero' : ''}`}>
                  {lineHits.length > 0
                    ? `${lineHits.length} hit${lineHits.length !== 1 ? 's' : ''}`
                    : 'not reached'}
                </span>
              </div>

              {lineHits.length === 0 ? (
                <div className="bp-no-hit">Execution never reached this line</div>
              ) : (
                lineHits.map(({ snap, idx }, hitIdx) => {
                  const isActive = idx === currentStep;
                  const vars = snap.variables || {};
                  const changedVars = snap.changed_variables || [];
                  const varEntries = Object.entries(vars);
                  const stack = snap.call_stack ? [...snap.call_stack].reverse() : [];

                  return (
                    <button
                      key={idx}
                      className={`bp-hit${isActive ? ' bp-hit--active' : ''}`}
                      onClick={() => onJumpToStep(idx)}
                      title={`Jump to step ${idx + 1}`}
                    >
                      {/* Hit header */}
                      <div className="bp-hit-header">
                        <span className="bp-hit-num">Hit #{hitIdx + 1}</span>
                        <span className="bp-hit-step-badge">step {idx + 1}</span>
                        {isActive && <span className="bp-current-tag">◀ current</span>}
                        <span className="bp-hit-arrow material-symbols-outlined">chevron_right</span>
                      </div>

                      {/* Variables */}
                      {varEntries.length > 0 ? (
                        <div className="bp-vars">
                          {varEntries.slice(0, 6).map(([k, v]) => (
                            <div key={k} className="bp-var-row">
                              <span className="bp-var-name">{k}</span>
                              <span className="bp-var-eq">=</span>
                              <span className={`bp-var-val${changedVars.includes(k) ? ' bp-var-changed' : ''}`}>
                                {truncateVal(v)}
                              </span>
                            </div>
                          ))}
                          {varEntries.length > 6 && (
                            <div className="bp-var-more">+{varEntries.length - 6} more vars</div>
                          )}
                        </div>
                      ) : (
                        <div className="bp-var-more">No variables in scope</div>
                      )}

                      {/* Call stack */}
                      {stack.length > 0 && (
                        <div className="bp-stack">
                          {stack.map((frame, fi) => (
                            <React.Fragment key={fi}>
                              <span className="bp-frame">{frame.function}</span>
                              {fi < stack.length - 1 && <span className="bp-frame-sep">→</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
