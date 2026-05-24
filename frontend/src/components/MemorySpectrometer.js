import React, { useMemo } from "react";
import "../styles/MemorySpectrometer.css";

/* ── Helpers ─────────────────────────────────── */
function inferType(name, value) {
  const v = String(value ?? '');
  if (v === 'True' || v === 'False' || v === 'true' || v === 'false') return 'bool';
  if (/^-?\d+$/.test(v.trim())) return 'int';
  if (/^-?\d+\.\d+([eE][+-]?\d+)?$/.test(v.trim())) return 'double';
  if (v.startsWith('"') || v.startsWith("'")) return 'char*';
  if (v.startsWith('0x') || v.match(/^0x[0-9a-fA-F]+/)) return 'ptr*';
  if (v.startsWith('{') || v.startsWith('[')) return 'struct';
  return 'auto';
}

function typeColor(type) {
  if (!type) return 'var(--text-muted)';
  const t = type.toLowerCase();
  if (t === 'int' || t.includes('long') || t.includes('short')) return '#60a5fa';
  if (t.includes('double') || t.includes('float')) return '#34d399';
  if (t.includes('char') || t.includes('string') || t.includes('str')) return '#fb923c';
  if (t === 'bool') return '#a78bfa';
  if (t.includes('ptr') || t.includes('*')) return '#f87171';
  if (t.includes('struct') || t.includes('arr')) return '#e879f9';
  return 'var(--text-muted)';
}

function truncate(val, max = 22) {
  const s = String(val ?? '—');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

/* ── Sub-components ──────────────────────────── */
function VarRow({ v }) {
  const isPtr = String(v.value ?? '').startsWith('0x');
  const color = typeColor(v.type);
  return (
    <div className={`mem-var-row${v.changed ? ' mem-var-row--changed' : ''}`}>
      <div className="mem-var-left">
        <span className="mem-var-type" style={{ color }}>{v.type}</span>
        <span className="mem-var-name">{v.name}</span>
      </div>
      <div className="mem-var-right">
        {v.changed && v.prev !== undefined && (
          <>
            <span className="mem-var-old" title={`Previous: ${v.prev}`}>{truncate(v.prev, 14)}</span>
            <span className="mem-var-arrow">→</span>
          </>
        )}
        <span
          className={`mem-var-value${v.changed ? ' mem-var-value--changed' : ''}${isPtr ? ' mem-var-ptr' : ''}`}
          title={String(v.value)}
        >
          {isPtr && <span className="mem-ptr-sym">*</span>}
          {truncate(v.value)}
        </span>
      </div>
    </div>
  );
}

function StackFrame({ frame, index }) {
  return (
    <div className={`mem-frame${frame.isActive ? ' mem-frame--active' : ''}`}>
      <div className="mem-frame-header">
        <div className="mem-frame-id">
          <span className="mem-frame-depth">#{index}</span>
          {frame.isActive && <span className="mem-frame-active-dot" />}
          <span className="mem-frame-fn">{frame.fn}()</span>
          {frame.file ? (
            <span className="mem-frame-loc">{frame.file}{frame.line ? `:${frame.line}` : ''}</span>
          ) : null}
        </div>
        {frame.isActive && <span className="mem-frame-badge">EXECUTING</span>}
      </div>

      {frame.vars.length > 0 ? (
        <div className="mem-frame-vars">
          {frame.vars.map((v, vi) => <VarRow key={vi} v={v} />)}
        </div>
      ) : (
        <div className="mem-frame-empty">
          {frame.isActive ? 'No variables in scope yet' : 'Outer frame — variables hidden'}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────── */
export default function MemorySpectrometer({ result, currentStep }) {
  const snap = result?.snapshots?.[currentStep] ?? null;
  const prevSnap = result?.snapshots?.[Math.max(0, currentStep - 1)] ?? null;

  const { frames, heapVars, totalVars, changedCount } = useMemo(() => {
    if (!snap) return { frames: [], heapVars: [], totalVars: 0, changedCount: 0 };

    const changedSet = new Set(snap.changed_variables || []);
    const prevVars = prevSnap?.variables || {};
    const currentVars = snap.variables || {};
    const callStack = snap.call_stack || [];

    const buildVars = (varMap) =>
      Object.entries(varMap).map(([k, v]) => ({
        name: k,
        value: v,
        prev: prevVars[k],
        changed: changedSet.has(k),
        type: inferType(k, v),
      }));

    let frameList;
    if (callStack.length === 0) {
      frameList = [{
        fn: snap.location?.function || 'global',
        file: snap.location?.file?.split('/').pop() || '',
        line: snap.location?.line || 0,
        isActive: true,
        vars: buildVars(currentVars),
      }];
    } else {
      frameList = callStack.map((frame, i) => ({
        fn: frame.function,
        file: frame.file?.split('/').pop() || '',
        line: frame.line,
        index: frame.index,
        isActive: i === 0,
        vars: i === 0 ? buildVars(currentVars) : [],
      }));
    }

    const allVars = frameList.flatMap(f => f.vars);
    const heap = allVars.filter(v => String(v.value ?? '').startsWith('0x'));

    return {
      frames: frameList,
      heapVars: heap,
      totalVars: Object.keys(currentVars).length,
      changedCount: changedSet.size,
    };
  }, [snap, prevSnap]);

  /* ─ Empty states ─ */
  if (!result || !result.snapshots || result.snapshots.length === 0) {
    return (
      <div className="flow-visualizer-empty">
        <span className="material-symbols-outlined" style={{ fontSize: 44, opacity: 0.35 }}>memory_alt</span>
        <p><strong>Analyze &amp; Debug</strong> your code to see the live memory map.</p>
        <p style={{ fontSize: 11, opacity: 0.6 }}>Stack frames and variable states appear here step-by-step.</p>
      </div>
    );
  }

  if (!snap) {
    return (
      <div className="flow-visualizer-empty">
        <p>No snapshot data at step {currentStep + 1}.</p>
      </div>
    );
  }

  return (
    <div className="memory-spectrometer">

      {/* ── Header ── */}
      <div className="mem-header">
        <div className="mem-header-left">
          <span className="material-symbols-outlined mem-header-icon">memory_alt</span>
          <div>
            <div className="mem-header-title">Memory Map</div>
            <div className="mem-header-sub">Live stack &amp; variable state · Step {currentStep + 1}</div>
          </div>
        </div>
        <div className="mem-stats">
          {totalVars > 0 && (
            <span className="mem-stat-pill">
              <span className="material-symbols-outlined" style={{ fontSize: 11 }}>data_object</span>
              {totalVars} var{totalVars !== 1 ? 's' : ''}
            </span>
          )}
          {changedCount > 0 && (
            <span className="mem-stat-pill mem-stat-changed">
              <span className="material-symbols-outlined" style={{ fontSize: 11 }}>edit</span>
              {changedCount} changed
            </span>
          )}
          {heapVars.length > 0 && (
            <span className="mem-stat-pill mem-stat-heap">
              <span className="material-symbols-outlined" style={{ fontSize: 11 }}>device_hub</span>
              {heapVars.length} ptr{heapVars.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="mem-legend">
        <span className="mem-legend-item">
          <span className="mem-legend-dot" style={{ background: '#60a5fa' }} />int
        </span>
        <span className="mem-legend-item">
          <span className="mem-legend-dot" style={{ background: '#34d399' }} />double
        </span>
        <span className="mem-legend-item">
          <span className="mem-legend-dot" style={{ background: '#fb923c' }} />char*
        </span>
        <span className="mem-legend-item">
          <span className="mem-legend-dot" style={{ background: '#f87171' }} />ptr
        </span>
        <span className="mem-legend-item">
          <span className="mem-legend-dot" style={{ background: '#a78bfa' }} />bool
        </span>
        <span className="mem-legend-item">
          <span className="mem-legend-dot mem-legend-dot--changed" />changed
        </span>
      </div>

      {/* ── Stack diagram ── */}
      <div className="mem-stack-wrap">
        <div className="mem-section-label">
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>layers</span>
          Call Stack
          <span className="mem-section-hint">({frames.length} frame{frames.length !== 1 ? 's' : ''} · innermost first)</span>
        </div>

        <div className="mem-stack">
          {/* Stack top bracket */}
          <div className="mem-stack-top-bar">▲ Stack top (SP)</div>

          {frames.map((frame, i) => (
            <StackFrame key={i} frame={frame} index={i} />
          ))}

          <div className="mem-stack-base-bar">▼ Stack base</div>
        </div>
      </div>

      {/* ── Heap section (only if pointers exist) ── */}
      {heapVars.length > 0 && (
        <div className="mem-heap-wrap">
          <div className="mem-section-label">
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>device_hub</span>
            Heap References
            <span className="mem-section-hint">(pointer values in active frame)</span>
          </div>
          <div className="mem-heap">
            {heapVars.map((v, i) => (
              <div key={i} className="mem-heap-row">
                <span className="mem-var-name">{v.name}</span>
                <span className="mem-heap-arrow">→</span>
                <code className="mem-heap-addr">{String(v.value)}</code>
                <span className="mem-heap-tag">heap</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
