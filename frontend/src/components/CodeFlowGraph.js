import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTheme, isDarkTheme } from '../theme';
import '../styles/CodeFlowGraph.css';

// ─── Node type metadata ────────────────────────────────────────────────────────
const TYPE_META = {
  condition: { label: 'if / elif',  color: '#F59E0B', shape: '◇' },
  else:      { label: 'else',       color: '#FB923C', shape: '◈' },
  loop:      { label: 'loop',       color: '#10B981', shape: '↻' },
  'func-def':{ label: 'function',   color: '#22D3EE', shape: '⊞' },
  call:      { label: 'fn call',    color: '#818CF8', shape: '↳' },
  return:    { label: 'return',     color: '#F87171', shape: '⤶' },
  statement: { label: 'statement',  color: null,      shape: '' },
};

// ─── Language-aware type detection ────────────────────────────────────────────
function detectType(code = '', lang = 'cpp') {
  const t = code.trim();

  // Filter pure-noise lines (braces, semicolons, blank)
  if (!t || /^[{};()[\]]+$/.test(t) || /^\/\//.test(t) || /^#/.test(t)) return 'noise';

  switch (lang) {

    case 'python': {
      // Python keywords
      if (/^(if|elif)\s/.test(t))                    return 'condition';
      if (/^else\s*:/.test(t))                        return 'else';
      if (/^(for|while)\s/.test(t))                   return 'loop';
      if (/^\breturn\b/.test(t))                      return 'return';
      if (/^(def|async\s+def)\s+\w/.test(t))          return 'func-def';
      if (/^class\s+\w/.test(t))                      return 'func-def';
      // Python call: identifier( or obj.method( — but not keywords
      const pyKw = /^(if|elif|while|for|def|class|return|import|from|with|try|except|raise|lambda|assert|pass|break|continue|yield)\b/;
      if (!pyKw.test(t) && /[\w.]+\s*\(/.test(t))    return 'call';
      return 'statement';
    }

    case 'java': {
      if (/^(if|else\s+if)\s*\(/.test(t))            return 'condition';
      if (/^else\b/.test(t))                          return 'else';
      if (/^(for|while|do)\b/.test(t))                return 'loop';
      if (/^\breturn\b/.test(t))                      return 'return';
      // Java method/constructor definition: visibility/type at start + word + (
      const javaDef = /^(public|private|protected|static|final|abstract|synchronized|void|int|long|double|float|boolean|char|byte|short|String|List|Map|Set|Object|@Override)\b/;
      if (javaDef.test(t) && /\w+\s*\(/.test(t))     return 'func-def';
      // Java call: method( but not control keywords
      if (/\w+\s*\(/.test(t) && !/^(if|while|for|switch)\b/.test(t)) return 'call';
      return 'statement';
    }

    default: {
      // C / C++ (default)
      if (/^(if|else\s+if)\s*\(/.test(t))            return 'condition';
      if (/^else\b/.test(t))                          return 'else';
      if (/^(for|while|do)\b/.test(t))                return 'loop';
      if (/^\breturn\b/.test(t))                      return 'return';
      // C/C++ function definition: return_type funcname(
      // Distinguish from calls: the type comes before the identifier
      if (/^[\w:*&<>]+\s+[\w:~*<>]+\s*\(/.test(t) && !/^(if|while|for|switch|return)\b/.test(t)) return 'func-def';
      // Function call: word( — but not control keywords
      if (/\w+\s*\(/.test(t) && !/^(if|while|for|switch|return)\b/.test(t)) return 'call';
      return 'statement';
    }
  }
}

// ─── Graph construction from execution trace ──────────────────────────────────
function buildGraph(snapshots, codeLines, lang) {
  if (!snapshots?.length) return { nodes: [], edges: [], firstAt: new Map() };

  const nodeMap = new Map();
  const edgeMap = new Map();
  const firstAt = new Map(); // nodeId → first snapshot index (execution order)

  snapshots.forEach((snap, idx) => {
    const line = snap?.location?.line;
    const func = snap?.location?.function || 'main';
    if (!line) return;

    const raw     = codeLines?.[line - 1] || '';
    const type    = detectType(raw, lang);
    if (type === 'noise') return; // skip brace-only / comment lines

    const id = `${func}::${line}`;
    if (!nodeMap.has(id)) {
      const trimmed = raw.trim();
      // Truncate display label so it fits the node width safely
      const label = trimmed.length > 26 ? trimmed.slice(0, 24) + '…' : trimmed;
      nodeMap.set(id, { id, line, func, code: label, fullCode: raw, type, hitCount: 0, snapshotIndices: [] });
      firstAt.set(id, idx);
    }
    const n = nodeMap.get(id);
    n.hitCount++;
    n.snapshotIndices.push(idx);
  });

  // Build edges from consecutive distinct (non-noise) nodes
  let prevId = null;
  snapshots.forEach((snap) => {
    const line = snap?.location?.line;
    const func = snap?.location?.function || 'main';
    if (!line) return;

    const id = `${func}::${line}`;
    if (!nodeMap.has(id)) return; // noise node — skip entirely

    if (prevId && prevId !== id) {
      const key = `${prevId}→${id}`;
      if (edgeMap.has(key)) {
        edgeMap.get(key).count++;
      } else {
        // Back-edge: target was first seen earlier in execution order than source
        const isBack = (firstAt.get(id) ?? Infinity) < (firstAt.get(prevId) ?? 0);
        edgeMap.set(key, { id: key, from: prevId, to: id, count: 1, isBack });
      }
    }
    prevId = id;
  });

  return { nodes: [...nodeMap.values()], edges: [...edgeMap.values()], firstAt };
}

// ─── Layered layout (simplified Sugiyama) ─────────────────────────────────────
const NW = 218, NH = 76, HGAP = 50, VGAP = 86, PAD = 32, MAX_ROW = 4;

function layoutGraph(nodes, edges, firstAt) {
  if (!nodes.length) return { pos: new Map(), svgW: 500, svgH: 300 };

  // Remove back-edges to form a DAG for rank assignment
  const dagEdges = edges.filter(e => !e.isBack);
  const children = new Map(nodes.map(n => [n.id, []]));
  const parents  = new Map(nodes.map(n => [n.id, []]));
  dagEdges.forEach(e => { children.get(e.from)?.push(e.to); parents.get(e.to)?.push(e.from); });

  // Longest-path BFS rank assignment
  const rank = new Map();
  const roots = nodes.filter(n => !(parents.get(n.id)?.length));
  const q = (roots.length ? roots : [nodes[0]]).map(n => n.id);
  q.forEach(id => rank.set(id, 0));
  const seen = new Set(q);
  while (q.length) {
    const id = q.shift(), r = rank.get(id) ?? 0;
    (children.get(id) || []).forEach(child => {
      const nr = r + 1;
      if (!rank.has(child) || rank.get(child) < nr) rank.set(child, nr);
      if (!seen.has(child)) { seen.add(child); q.push(child); }
    });
  }
  nodes.forEach(n => { if (!rank.has(n.id)) rank.set(n.id, 0); });

  // Group by rank; sort within each rank by first-execution order
  const byRank = new Map();
  nodes.forEach(n => {
    const r = rank.get(n.id) ?? 0;
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r).push(n);
  });
  byRank.forEach(list => list.sort((a, b) => (firstAt.get(a.id) ?? 9999) - (firstAt.get(b.id) ?? 9999)));

  // Assign grid positions, wrapping at MAX_ROW per visual row
  const pos  = new Map();
  let vRow = 0, maxW = 0;
  [...byRank.keys()].sort((a, b) => a - b).forEach(r => {
    const list = byRank.get(r);
    for (let ci = 0; ci < list.length; ci += MAX_ROW) {
      const chunk    = list.slice(ci, ci + MAX_ROW);
      const rowW     = chunk.length * NW + (chunk.length - 1) * HGAP;
      const rowIndex = vRow; // capture before closure
      maxW = Math.max(maxW, rowW);
      chunk.forEach((node, col) => pos.set(node.id, { x: col * (NW + HGAP), y: rowIndex * (NH + VGAP) + PAD }));
      vRow++;
    }
  });

  // Centre each visual row horizontally
  const byY = new Map();
  pos.forEach((p, id) => { if (!byY.has(p.y)) byY.set(p.y, []); byY.get(p.y).push({ id, p }); });
  byY.forEach(items => {
    const rowW = items.length * NW + (items.length - 1) * HGAP;
    const off  = Math.max(0, (maxW - rowW) / 2);
    items.forEach(({ p }) => { p.x += off; });
  });

  return { pos, svgW: maxW + PAD * 2, svgH: vRow * (NH + VGAP) + PAD + 36 };
}

// ─── Edge path helper ─────────────────────────────────────────────────────────
function edgePath(edge, pos) {
  const f = pos.get(edge.from), t = pos.get(edge.to);
  if (!f || !t) return null;
  const x1 = f.x + NW / 2, y1 = f.y + NH;
  const x2 = t.x + NW / 2, y2 = t.y;

  if (edge.isBack) {
    // Loop back-edge: curve around the left side
    const lx = Math.min(f.x, t.x) - 44;
    return `M ${x1} ${y1} C ${x1} ${y1 + 30} ${lx} ${(y1 + y2) / 2} ${lx} ${(y1 + y2) / 2} C ${lx} ${(y1 + y2) / 2} ${lx} ${y2 - 30} ${x2} ${y2}`;
  }

  if (Math.abs(y1 - y2) < 10) {
    // Same-rank edge: arc above the nodes
    const arcY = Math.min(f.y, t.y) - 28;
    return `M ${x1} ${f.y} C ${x1} ${arcY} ${x2} ${arcY} ${x2} ${t.y}`;
  }

  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
}

// ─── Type colour helper ───────────────────────────────────────────────────────
function typeColor(type, dark) {
  return TYPE_META[type]?.color || (dark ? 'rgba(232,226,217,0.28)' : 'rgba(26,19,16,0.20)');
}

// ─── Safe SVG clip-path ID ────────────────────────────────────────────────────
function clipId(nodeId) {
  return 'cfg-clip-' + nodeId.replace(/[^a-z0-9]/gi, '_');
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CodeFlowGraph({ result, currentStep, code, language = 'cpp', onJumpToStep }) {
  const { theme }  = useTheme();
  const dark       = isDarkTheme(theme);
  const codeLines  = useMemo(() => (code || '').split('\n'), [code]);
  const snapshots  = useMemo(() => result?.snapshots || [], [result]);

  const [expandedId, setExpandedId] = useState(null);
  const [tf, setTf]  = useState({ x: PAD, y: PAD, scale: 1 });
  const canvasRef    = useRef(null);
  const dragging     = useRef(false);
  const didDrag      = useRef(false);
  const ds           = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Reset expanded panel when a new analysis session starts
  const sessionId = result?.session_id;
  useEffect(() => { setExpandedId(null); setTf({ x: PAD, y: PAD, scale: 1 }); }, [sessionId]);

  const { nodes, edges, firstAt } = useMemo(
    () => buildGraph(snapshots, codeLines, language),
    [snapshots, codeLines, language]
  );
  const layout = useMemo(() => layoutGraph(nodes, edges, firstAt), [nodes, edges, firstAt]);

  // Active node = where the debugger cursor currently sits
  const curSnap  = snapshots[currentStep];
  const activeId = curSnap?.location?.line
    ? `${curSnap.location.function || 'main'}::${curSnap.location.line}`
    : null;

  // Zoom on wheel
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const h = (e) => { e.preventDefault(); setTf(t => ({ ...t, scale: Math.min(Math.max(t.scale * (e.deltaY < 0 ? 1.12 : 0.9), 0.2), 3) })); };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  // Pan
  const onMD = useCallback((e) => {
    if (e.button !== 0) return;
    dragging.current = true; didDrag.current = false;
    ds.current = { x: e.clientX, y: e.clientY, tx: tf.x, ty: tf.y };
  }, [tf.x, tf.y]);

  const onMM = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - ds.current.x, dy = e.clientY - ds.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) didDrag.current = true;
    setTf(t => ({ ...t, x: ds.current.tx + dx, y: ds.current.ty + dy }));
  }, []);

  const onMU = useCallback(() => { dragging.current = false; }, []);

  const onNodeClick = useCallback((id, e) => {
    e.stopPropagation();
    if (didDrag.current) return;
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const expandedNode = nodes.find(n => n.id === expandedId) || null;

  // Theme colours
  const accent   = '#C96A48';
  const textMain = dark ? '#E8E2D9' : '#1A1310';
  const textDim  = dark ? 'rgba(232,226,217,0.38)' : 'rgba(26,19,16,0.38)';
  const nodeBg   = dark ? '#1C1917' : '#FEFCFA';
  const edgeClr  = dark ? 'rgba(232,226,217,0.16)' : 'rgba(26,19,16,0.13)';

  if (!result || snapshots.length === 0) {
    return (
      <div className="cfg-empty">
        <span className="material-symbols-outlined cfg-empty-icon">account_tree</span>
        <p>Run <strong>Analyze &amp; Debug</strong> to generate the execution flow graph</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="cfg-empty">
        <span className="material-symbols-outlined cfg-empty-icon">warning</span>
        <p>No executable statements found in the trace. Try a longer program.</p>
      </div>
    );
  }

  return (
    <div className="cfg-root">
      {/* ── Toolbar ── */}
      <div className="cfg-bar">
        <div className="cfg-bar-left">
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: accent }}>schema</span>
          <span className="cfg-bar-title">Execution Flow Graph</span>
          <span className="cfg-bar-sub">{nodes.length} nodes · {edges.length} edges</span>
        </div>

        <div className="cfg-legend">
          {Object.entries(TYPE_META)
            .filter(([k]) => k !== 'statement' && nodes.some(n => n.type === k))
            .map(([k, v]) => (
              <span key={k} className="cfg-legend-item">
                <span className="cfg-legend-dot" style={{ background: v.color }} />
                {v.label}
              </span>
            ))}
        </div>

        <div className="cfg-zoom-grp">
          <button className="cfg-zoom-btn" onClick={() => setTf(t => ({ ...t, scale: Math.min(t.scale * 1.2, 3) }))}>+</button>
          <button className="cfg-zoom-btn" onClick={() => setTf({ x: PAD, y: PAD, scale: 1 })}>⟳</button>
          <button className="cfg-zoom-btn" onClick={() => setTf(t => ({ ...t, scale: Math.max(t.scale * 0.85, 0.2) }))}>−</button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="cfg-body">
        {/* Canvas */}
        <div className="cfg-canvas" ref={canvasRef} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>
          <svg
            width={Math.max(layout.svgW + 100, 500)}
            height={Math.max(layout.svgH + 60, 300)}
            style={{ display: 'block', minWidth: '100%', minHeight: '100%', userSelect: 'none' }}
          >
            <defs>
              {/* Arrowheads */}
              <marker id="cfg-arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0,0 8,3 0,6" fill={edgeClr} />
              </marker>
              <marker id="cfg-arr-a" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0,0 8,3 0,6" fill={accent} />
              </marker>
              {/* Glow filter for active node */}
              <filter id="cfg-glow" x="-28%" y="-28%" width="156%" height="156%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Per-node clip paths to prevent code text overflow */}
              {nodes.map(node => {
                const p = layout.pos.get(node.id);
                if (!p) return null;
                return (
                  <clipPath key={clipId(node.id)} id={clipId(node.id)}>
                    <rect x={p.x + 12} y={p.y + 30} width={NW - 22} height={24} />
                  </clipPath>
                );
              })}
            </defs>

            <g transform={`translate(${tf.x},${tf.y}) scale(${tf.scale})`}>

              {/* ── Edges ── */}
              {edges.map(edge => {
                const d = edgePath(edge, layout.pos);
                if (!d) return null;
                const isActive = edge.from === activeId || edge.to === activeId;
                const fp = layout.pos.get(edge.from);
                const tp = layout.pos.get(edge.to);
                // Midpoint for count / loop label
                const mx = fp && tp ? (fp.x + tp.x) / 2 + NW / 2 : 0;
                const my = fp && tp ? (fp.y + NH + tp.y) / 2 : 0;
                return (
                  <g key={edge.id}>
                    <path
                      d={d}
                      fill="none"
                      stroke={isActive ? accent : edgeClr}
                      strokeWidth={isActive ? 2.2 : 1.3}
                      strokeDasharray={edge.isBack ? '6 3' : undefined}
                      markerEnd={isActive ? 'url(#cfg-arr-a)' : 'url(#cfg-arr)'}
                      opacity={isActive ? 1 : 0.72}
                    />
                    {edge.count > 1 && !edge.isBack && (
                      <text x={mx} y={my} fontSize={9} fill={textDim} textAnchor="middle">
                        ×{edge.count}
                      </text>
                    )}
                    {edge.isBack && (
                      <text
                        x={fp ? fp.x - 30 : 0}
                        y={fp && tp ? (fp.y + NH + tp.y) / 2 : 0}
                        fontSize={8} fill={TYPE_META.loop.color} textAnchor="middle" opacity={0.75}
                      >
                        loop ↻{edge.count > 1 ? ` ×${edge.count}` : ''}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ── Nodes ── */}
              {nodes.map(node => {
                const p = layout.pos.get(node.id);
                if (!p) return null;
                const isActive   = node.id === activeId;
                const isExpanded = node.id === expandedId;
                const tc     = isActive ? accent : typeColor(node.type, dark);
                const bg     = isActive
                  ? (dark ? 'rgba(201,106,72,0.20)' : 'rgba(201,106,72,0.10)')
                  : nodeBg;
                const bdr    = isActive ? accent
                  : isExpanded ? tc
                  : (dark ? 'rgba(232,226,217,0.12)' : 'rgba(26,19,16,0.11)');
                const bw     = isActive || isExpanded ? 2 : 1;
                const meta   = TYPE_META[node.type] || TYPE_META.statement;
                // Fixed label widths per type to avoid SVG text measuring
                const labelW = node.type === 'statement' ? 0 : Math.max(meta.label.length * 5.6 + 14, 40);

                return (
                  <g key={node.id} onClick={(e) => onNodeClick(node.id, e)} style={{ cursor: 'pointer' }}>
                    {/* Glow outline for active node */}
                    {isActive && (
                      <rect x={p.x - 4} y={p.y - 4} width={NW + 8} height={NH + 8}
                        rx={13} fill="none" stroke={accent} strokeWidth={2} opacity={0.22}
                        filter="url(#cfg-glow)" />
                    )}

                    {/* Card background */}
                    <rect x={p.x} y={p.y} width={NW} height={NH} rx={9} ry={9}
                      fill={bg} stroke={bdr} strokeWidth={bw} />

                    {/* Left colour bar */}
                    <rect x={p.x} y={p.y + 10} width={3.5} height={NH - 20} rx={2} fill={tc} opacity={0.88} />

                    {/* Line-number pill */}
                    <rect x={p.x + 10} y={p.y + 10} width={36} height={17} rx={5} fill={tc} opacity={0.86} />
                    <text x={p.x + 28} y={p.y + 22} textAnchor="middle" fontSize={9} fontWeight={700}
                      fontFamily="'JetBrains Mono', monospace" fill="#fff">
                      L{node.line}
                    </text>

                    {/* Type badge */}
                    {node.type !== 'statement' && labelW > 0 && (
                      <>
                        <rect x={p.x + 52} y={p.y + 10} width={labelW} height={17} rx={5} fill={tc} opacity={0.13} />
                        <text x={p.x + 52 + labelW / 2} y={p.y + 22} textAnchor="middle"
                          fontSize={8} fontWeight={700} fill={tc} opacity={0.88}>
                          {meta.label.toUpperCase()}
                        </text>
                      </>
                    )}

                    {/* Hit-count badge (top-right) */}
                    {node.hitCount > 1 && (
                      <>
                        <rect x={p.x + NW - 38} y={p.y + 10} width={32} height={17} rx={9}
                          fill={tc} opacity={0.14} />
                        <text x={p.x + NW - 22} y={p.y + 22} textAnchor="middle"
                          fontSize={9} fontWeight={700} fill={tc}>
                          ×{node.hitCount}
                        </text>
                      </>
                    )}

                    {/* Code snippet — clipped so it never overflows the card */}
                    <text x={p.x + 12} y={p.y + 47}
                      fontSize={10.5} fontFamily="'JetBrains Mono', monospace"
                      fill={textMain} opacity={0.86}
                      clipPath={`url(#${clipId(node.id)})`}>
                      {node.code}
                    </text>

                    {/* Function label (only if not root/main) */}
                    {node.func && node.func !== 'main' && (
                      <text x={p.x + 12} y={p.y + NH - 9} fontSize={8} fill={textDim}>
                        fn: {node.func}
                      </text>
                    )}

                    {/* Expand chevron */}
                    <text x={p.x + NW - 11} y={p.y + NH - 8} textAnchor="middle"
                      fontSize={9} fill={tc} opacity={isExpanded ? 1 : 0.45}>
                      {isExpanded ? '▲' : '▼'}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* ── Detail panel ── */}
        {expandedNode && (
          <NodeDetail
            node={expandedNode}
            snapshots={snapshots}
            codeLines={codeLines}
            currentStep={currentStep}
            onJumpToStep={onJumpToStep}
            onClose={() => setExpandedId(null)}
            dark={dark}
          />
        )}
      </div>
    </div>
  );
}

// ─── Node detail panel ─────────────────────────────────────────────────────────
function NodeDetail({ node, snapshots, codeLines, currentStep, onJumpToStep, onClose, dark }) {
  const visits   = node.snapshotIndices;
  const lastSnap = snapshots[visits[visits.length - 1]];
  const meta     = TYPE_META[node.type] || TYPE_META.statement;
  const tc       = meta.color || (dark ? 'rgba(232,226,217,0.38)' : 'rgba(26,19,16,0.28)');
  const vars     = lastSnap?.variables || {};
  const changed  = lastSnap?.changed_variables || [];
  // Only show call stack when depth > 1 (non-trivial)
  const stack    = (lastSnap?.call_stack || []).filter((_, i) => i < 6);
  const showStack = stack.length > 1;

  return (
    <aside className="cfg-detail">
      {/* Header */}
      <div className="cfg-detail-hdr">
        <div className="cfg-detail-hdr-info">
          <span className="cfg-detail-badge" style={{ color: tc, borderColor: `${tc}55`, background: `${tc}1A` }}>
            {meta.shape && <span style={{ marginRight: 3 }}>{meta.shape}</span>}
            {meta.label}
          </span>
          <span className="cfg-detail-loc">
            Line <strong>{node.line}</strong>
            {node.func && node.func !== 'main' && (
              <> · <code className="cfg-fn-code">{node.func}</code></>
            )}
          </span>
        </div>
        <button className="cfg-close-btn" onClick={onClose} aria-label="Close detail panel">
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>close</span>
        </button>
      </div>

      {/* Full source line */}
      <div className="cfg-detail-code">
        <div className="cfg-code-line-num">line {node.line}</div>
        <pre className="cfg-code-pre"><code>{codeLines[node.line - 1] || '(empty line)'}</code></pre>
      </div>

      {/* Stats */}
      <div className="cfg-stats-row">
        <div className="cfg-stat">
          <span className="cfg-stat-n" style={{ color: tc }}>{node.hitCount}</span>
          <span className="cfg-stat-l">executions</span>
        </div>
        <div className="cfg-stat">
          <span className="cfg-stat-n" style={{ color: tc }}>#{visits[0] + 1}</span>
          <span className="cfg-stat-l">first step</span>
        </div>
        <div className="cfg-stat">
          <span className="cfg-stat-n" style={{ color: tc }}>#{visits[visits.length - 1] + 1}</span>
          <span className="cfg-stat-l">last step</span>
        </div>
      </div>

      {/* Variables at last visit */}
      {Object.keys(vars).length > 0 && (
        <div className="cfg-section">
          <div className="cfg-section-hdr">Variables at last visit</div>
          <table className="cfg-var-table">
            <tbody>
              {Object.entries(vars).map(([name, val]) => {
                const chg = changed.includes(name);
                return (
                  <tr key={name} className={chg ? 'cfg-var-row--changed' : ''}>
                    <td className="cfg-var-name">{name}</td>
                    <td className="cfg-var-val"><code>{String(val)}</code></td>
                    {chg && <td className="cfg-var-tag">changed</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Call stack (only when non-trivial depth) */}
      {showStack && (
        <div className="cfg-section">
          <div className="cfg-section-hdr">Call stack</div>
          <div className="cfg-stack-list">
            {stack.map((frame, i) => (
              <div key={i} className={`cfg-stack-frame ${i === 0 ? 'cfg-stack-frame--top' : ''}`}>
                <span className="cfg-stack-fn">{frame.function}</span>
                <span className="cfg-stack-loc">:{frame.line}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All execution visits */}
      <div className="cfg-section">
        <div className="cfg-section-hdr">
          All visits
          <span className="cfg-section-count">{visits.length}</span>
        </div>
        <p className="cfg-visits-hint">Click any step to jump there in the debugger</p>
        <div className="cfg-chips">
          {visits.map(idx => {
            const isCur = idx === currentStep;
            return (
              <button
                key={idx}
                className={`cfg-chip ${isCur ? 'cfg-chip--active' : ''}`}
                onClick={() => onJumpToStep?.(idx)}
                title={`Jump to step ${idx + 1}`}
              >
                {isCur && <span className="cfg-chip-dot" />}
                Step {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
