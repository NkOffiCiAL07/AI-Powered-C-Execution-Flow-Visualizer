import React, { useState, useEffect, useRef } from 'react';
import LoginModal from './LoginModal';
import { useTheme, isDarkTheme } from '../theme';
import { joinWaitlist } from '../services/api';

/* ── Scroll-reveal hook ── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('revealed'); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

/* ── Animated Count-Up Hook ── */
function useCountUp(target, duration = 1600, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

/* ── Rotating hero word ── */
const HERO_WORDS = ['Narrative', 'Logic', 'Flow', 'Bugs', 'Truth'];
function RotatingWord({ words }) {
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      setVis(false);
      setTimeout(() => { setIdx(i => (i + 1) % words.length); setVis(true); }, 350);
    }, 2800);
    return () => clearInterval(id);
  }, [words.length]);
  return (
    <span className="gradient-text" key={idx} style={{
      display: 'inline-block',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(-10px)',
    }}>
      {words[idx]}
    </span>
  );
}

/* ── Stats ── */
const STATS = [
  { target: 50000, suffix: '+',   label: 'Traces Analyzed',     icon: 'analytics' },
  { target: 4,     suffix: '',    label: 'Languages Supported',  icon: 'code' },
  { target: 200,   suffix: 'ms',  label: 'Avg. Analysis Time',   icon: 'bolt' },
  { target: 99,    suffix: '.9%', label: 'Platform Uptime',      icon: 'verified' },
];
function formatStat(val, s) {
  if (s.target >= 1000) return (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val) + s.suffix;
  return val + s.suffix;
}
function StatsSection({ dark, border09, textMuted38 }) {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const vals = [
    useCountUp(STATS[0].target, 1800, visible),
    useCountUp(STATS[1].target, 900, visible),
    useCountUp(STATS[2].target, 1200, visible),
    useCountUp(STATS[3].target, 1500, visible),
  ];
  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-6 py-20 border-t" style={{ borderColor: border09 }}>
      <div className="text-center mb-14">
        <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full border"
          style={{ color: '#C96A48', borderColor: 'rgba(201,106,72,0.28)', background: 'rgba(201,106,72,0.07)' }}>
          By The Numbers
        </span>
        <h2 className="font-extrabold leading-tight"
          style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Built for Real-World Code
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-8 text-center border"
            style={{ background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(201,106,72,0.03)', borderColor: dark ? 'rgba(232,226,217,0.09)' : 'rgba(201,106,72,0.1)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg,rgba(201,106,72,0.18),rgba(139,62,36,0.08))' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#C96A48' }}>{s.icon}</span>
            </div>
            <div className="text-4xl font-extrabold mb-2 stat-number"
              style={{ fontFamily: 'Space Grotesk, monospace', color: '#C96A48', lineHeight: 1 }}>
              {formatStat(vals[i], s)}
            </div>
            <div className="text-xs uppercase tracking-widest font-bold" style={{ color: textMuted38 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Feature Tabs ── */
const FEATURE_TABS = [
  {
    id: 'flow', icon: 'hub', label: 'Execution Flow',
    headline: 'Visualize Every Execution Path',
    desc: 'Interactive DAG graphs map exactly how your code runs at runtime. Click any node to drill into function calls, loop iterations, and branches — with full variable context at each step.',
    tags: ['DAG Rendering', 'Click-to-Inspect', 'Zoom & Pan', 'Subgraph Collapse'],
    preview: 'flow',
  },
  {
    id: 'ai', icon: 'psychology', label: 'AI Insights',
    headline: 'Plain-English Code Explanations',
    desc: "LLM-powered analysis breaks down every function, loop, and algorithmic decision in plain English. Get Big-O complexity estimates and targeted optimization hints — no expertise required.",
    tags: ['Big-O Analysis', 'Optimization Tips', 'Natural Language Q&A'],
    preview: 'ai',
  },
  {
    id: 'memory', icon: 'memory', label: 'Memory View',
    headline: 'Real-Time Heap & Stack Tracking',
    desc: 'The Memory Spectrometer renders live pointer arithmetic, buffer boundaries, and allocation patterns. Catch overflows and leaks before they crash production.',
    tags: ['Heap Heatmap', 'Pointer Tracking', 'Buffer Boundaries'],
    preview: 'memory',
  },
  {
    id: 'debug', icon: 'bug_report', label: 'Step Debugger',
    headline: 'Step Through With Full State',
    desc: 'Step forward and backward through execution. Variables, call stack, and watchpoints stay live-synced to the flow graph on every tick — no surprises.',
    tags: ['Reverse Stepping', 'Watchpoints', 'Variable Diff'],
    preview: 'debug',
  },
];

function FeaturePreview({ type, dark, border12, textMuted38, textMuted55 }) {
  const bg = dark ? '#141210' : '#F7F3EE';
  const lineColor = dark ? 'rgba(232,226,217,0.08)' : 'rgba(201,106,72,0.08)';

  if (type === 'flow') return (
    <div className="rounded-xl overflow-hidden border mt-6" style={{ borderColor: 'rgba(201,106,72,0.18)', background: bg, padding: '20px' }}>
      <svg width="100%" height="160" viewBox="0 0 400 160">
        <defs>
          <marker id="ft-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="rgba(201,106,72,0.6)" />
          </marker>
        </defs>
        {[['main()', 200, 20, '#C96A48'], ['fetch_nodes()', 90, 70, '#8B3E24'], ['for_loop()', 200, 70, '#B85A38'], ['process(n)', 200, 120, '#8B3E24'], ['return 0', 310, 120, '#22c55e']].map(([label, x, y, color], i) => (
          <g key={i}>
            <rect x={x - 52} y={y - 13} width={104} height={26} rx={6} fill={`${color}18`} stroke={`${color}55`} strokeWidth={1.5} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontWeight={600} fontFamily="Space Grotesk, monospace" fill={color}>{label}</text>
          </g>
        ))}
        {[[200,33,90,57],[200,33,200,57],[90,83,200,107],[200,83,200,107],[200,133,310,107]].map(([x1,y1,x2,y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(201,106,72,0.4)" strokeWidth={1.5} markerEnd="url(#ft-arr)" strokeDasharray="4 2" />
        ))}
      </svg>
    </div>
  );

  if (type === 'ai') return (
    <div className="rounded-xl border mt-6 overflow-hidden" style={{ borderColor: 'rgba(201,106,72,0.18)', background: bg }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${lineColor}` }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#C96A48' }}>psychology</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C96A48' }}>AI Analysis</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: textMuted38, fontFamily: 'JetBrains Mono, monospace' }}>O(n log n)</span>
        </div>
      </div>
      {[
        'This loop runs in O(n log n) due to the nested binary search call inside fetch_nodes().',
        'Optimization: consider caching the sorted index to avoid recomputation on repeated calls.',
        'No memory leaks detected in this execution path.',
      ].map((line, i) => (
        <div key={i} style={{ padding: '10px 18px', borderBottom: i < 2 ? `1px solid ${lineColor}` : 'none', fontSize: '0.78rem', color: textMuted55, lineHeight: 1.6, display: 'flex', gap: 10 }}>
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: 14, color: i === 1 ? '#22c55e' : '#C96A48', marginTop: 1 }}>{i === 1 ? 'lightbulb' : i === 2 ? 'check_circle' : 'info'}</span>
          {line}
        </div>
      ))}
    </div>
  );

  if (type === 'memory') return (
    <div className="rounded-xl border mt-6 overflow-hidden" style={{ borderColor: 'rgba(201,106,72,0.18)', background: bg, padding: '18px' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: textMuted38, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Heap Allocation Map</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {Array.from({ length: 32 }, (_, i) => {
          const intensity = i < 8 ? 0.9 : i < 16 ? 0.45 : i < 24 ? 0.2 : 0.06;
          return <div key={i} style={{ width: 20, height: 20, borderRadius: 3, background: `rgba(201,106,72,${intensity})` }} />;
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        {[['Active', '#C96A48', 0.9], ['Fragmented', '#C96A48', 0.45], ['Free', '#C96A48', 0.12]].map(([lbl, c, a]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: textMuted38 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(201,106,72,${a})` }} />{lbl}
          </div>
        ))}
      </div>
    </div>
  );

  if (type === 'debug') return (
    <div className="rounded-xl border mt-6 overflow-hidden" style={{ borderColor: 'rgba(201,106,72,0.18)', background: bg }}>
      {[
        { line: 3, active: true,  vars: { data: '[1,3,5]', i: '0' } },
        { line: 4, active: false, vars: {} },
        { line: 5, active: false, vars: {} },
        { line: 6, active: false, vars: {} },
      ].map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: row.active ? 'rgba(201,106,72,0.08)' : 'transparent', borderBottom: `1px solid ${lineColor}` }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: row.active ? '#C96A48' : textMuted38, width: 14, textAlign: 'right' }}>{row.line}</span>
          {row.active && <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#C96A48' }}>arrow_right</span>}
          {!row.active && <span style={{ width: 12 }} />}
          {row.active && Object.entries(row.vars).map(([k, v]) => (
            <span key={k} style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4, background: 'rgba(201,106,72,0.12)', color: '#C96A48' }}>
              {k} = {v}
            </span>
          ))}
        </div>
      ))}
    </div>
  );

  return null;
}

/* ── Comparison table ── */
const COMPARISON_ROWS = [
  { feature: 'Visual execution graph',       printf: false,     gdb: false,     traceon: true },
  { feature: 'AI code explanations',         printf: false,     gdb: false,     traceon: true },
  { feature: 'Real-time memory viewer',      printf: false,     gdb: 'partial', traceon: true },
  { feature: 'Sub-200ms analysis',           printf: true,      gdb: false,     traceon: true },
  { feature: 'C / C++ / Python / Java',      printf: true,      gdb: 'partial', traceon: true },
  { feature: 'Zero install, web-based',      printf: false,     gdb: false,     traceon: true },
  { feature: 'Step debugger',                printf: false,     gdb: true,      traceon: true },
  { feature: 'Concurrency visualization',    printf: false,     gdb: false,     traceon: true },
  { feature: 'Big-O complexity analysis',    printf: false,     gdb: false,     traceon: true },
];

function CompCell({ val }) {
  if (val === true)      return <span className="material-symbols-outlined" style={{ color: '#22c55e', fontSize: 20 }}>check_circle</span>;
  if (val === false)     return <span className="material-symbols-outlined" style={{ color: 'rgba(100,70,40,0.25)', fontSize: 20 }}>cancel</span>;
  if (val === 'partial') return <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: 20 }}>change_history</span>;
  return null;
}

/* ── FAQ ── */
const FAQ_ITEMS = [
  { q: 'What languages does Traceon support?',       a: 'Currently C, C++, Python, and Java. Go and Rust are on the roadmap.' },
  { q: 'Is Traceon free to use?',                    a: 'The core feature set is completely free. Pro plans unlock team collaboration, extended execution history, private projects, and priority AI analysis.' },
  { q: 'How does the AI analysis work?',             a: "Traceon captures your program's execution trace and sends it to a large language model that generates human-readable explanations, complexity estimates, and optimization suggestions." },
  { q: 'Do I need to install anything?',             a: 'No. Traceon is fully browser-based. Your code compiles and runs in an isolated sandbox on our servers — nothing to install or configure.' },
  { q: 'Is my code secure?',                         a: 'Yes. Every run is isolated in an ephemeral container that is destroyed immediately after execution. We do not store your source code beyond the session.' },
  { q: 'Can I use Traceon for competitive programming?', a: 'Absolutely — the execution flow graph is extremely popular with competitive programmers for visualizing algorithm branches and optimizing runtime paths.' },
];

function FAQSection({ dark, border09, textMuted55 }) {
  const [open, setOpen] = useState(null);
  const T = 'rgba(201,106,72,';
  const borderColor = dark ? 'rgba(232,226,217,0.09)' : 'rgba(100,70,40,0.09)';
  return (
    <section className="max-w-3xl mx-auto px-6 py-24 border-t" style={{ borderColor: border09 }}>
      <div className="text-center mb-14">
        <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full border"
          style={{ color: '#C96A48', borderColor: `${T}0.28)`, background: `${T}0.07)` }}>
          FAQ
        </span>
        <h2 className="font-extrabold"
          style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Common Questions
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="rounded-2xl border overflow-hidden"
            style={{ borderColor: open === i ? `${T}0.28)` : borderColor, background: open === i ? `${T}0.04)` : 'transparent', transition: 'all 0.25s ease' }}>
            <button className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              onClick={() => setOpen(open === i ? null : i)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>{item.q}</span>
              <span className="material-symbols-outlined shrink-0"
                style={{ color: '#C96A48', fontSize: 20, transition: 'transform 0.25s ease', transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>
            <div className="faq-answer" style={{ maxHeight: open === i ? '200px' : '0px', opacity: open === i ? 1 : 0 }}>
              <p style={{ padding: '0 24px 20px', fontSize: '0.9rem', color: textMuted55, lineHeight: 1.7 }}>{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Testimonials grid (replaces single-card carousel) ── */
const TESTIMONIALS = [
  { name: 'Arjun Mehta',   role: 'CS Student, IIT Delhi',       avatar: 'AM', stars: 5, text: 'Traceon completely changed how I debug. Watching variables change step-by-step made pointer bugs obvious instantly.' },
  { name: 'Priya Singh',   role: 'Backend Engineer',             avatar: 'PS', stars: 5, text: 'The AI Insights feature saved me hours. It explained a complex memory issue in plain English — something no debugger had done before.' },
  { name: 'Lucas Weber',   role: 'Competitive Programmer',       avatar: 'LW', stars: 5, text: 'The execution flow graph is legendary. I can see exactly which branches my algorithm takes and optimize accordingly.' },
  { name: 'Chen Wei',      role: 'Software Dev, Startup',        avatar: 'CW', stars: 5, text: 'Deployed faster because I caught edge cases early. The heatmap showed me exactly which lines were bottlenecks.' },
  { name: 'Sarah Okonkwo', role: 'Systems Engineer',             avatar: 'SO', stars: 5, text: 'The concurrency visualization saved my team days of debugging a race condition. Nothing else shows mutex locks this clearly.' },
  { name: 'Raj Patel',     role: 'CS Teaching Assistant, MIT',   avatar: 'RP', stars: 5, text: 'I use Traceon to explain recursive algorithms to students. Seeing the call graph build live is worth more than a textbook.' },
];

function TestimonialsSection({ dark, border09 }) {
  const T = 'rgba(201,106,72,';
  const bgCard = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)';
  const borderCard = dark ? 'rgba(232,226,217,0.1)' : 'rgba(201,106,72,0.12)';
  const textMuted = dark ? 'rgba(232,226,217,0.5)' : 'rgba(26,19,16,0.5)';
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 border-t" style={{ borderColor: border09 }}>
      <div className="text-center mb-14">
        <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full border"
          style={{ color: '#C96A48', borderColor: `${T}0.28)`, background: `${T}0.07)` }}>
          Loved by Developers
        </span>
        <h2 className="font-extrabold"
          style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          What Engineers Say
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="rounded-2xl p-7 border flex flex-col gap-4 landing-card"
            style={{ background: bgCard, borderColor: borderCard, backdropFilter: 'blur(8px)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${T}0.35)`; e.currentTarget.style.boxShadow = dark ? '0 16px 48px rgba(0,0,0,0.3)' : '0 16px 48px rgba(100,70,40,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = borderCard; e.currentTarget.style.boxShadow = 'none'; }}>
            <div className="flex gap-0.5">
              {Array.from({ length: t.stars }, (_, j) => (
                <span key={j} className="material-symbols-outlined" style={{ fontSize: 14, color: '#C96A48' }}>star</span>
              ))}
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-primary)', fontStyle: 'italic', flex: 1 }}>"{t.text}"</p>
            <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: dark ? 'rgba(232,226,217,0.08)' : 'rgba(201,106,72,0.1)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                style={{ background: 'linear-gradient(135deg,#C96A48,#8B3E24)' }}>{t.avatar}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{t.name}</div>
                <div style={{ fontSize: '0.72rem', color: textMuted }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── How it works ── */
const STEPS = [
  { icon: 'code',        n: '01', title: 'Write Your Code',       desc: 'Use the built-in editor with syntax highlighting for C, C++, Python, and Java.' },
  { icon: 'play_circle', n: '02', title: 'Run Traceon Analysis',  desc: 'Our engine compiles, instruments, and traces your code in under 200ms.' },
  { icon: 'hub',         n: '03', title: 'Explore the Flow Graph',desc: 'Navigate execution interactively. Click any node for deep-dive AI explanations.' },
];

/* ── Code & Graph preview data ── */
const CODE_LINES = [
  { n: 1,  parts: [{ t: '#include', c: '#7C3AED' }, { t: ' <iostream>', c: '#2D6A4F' }] },
  { n: 2,  parts: [] },
  { n: 3,  parts: [{ t: 'int ', c: '#7C3AED' }, { t: 'main', c: '#C96A48' }, { t: '() {', c: '#1A1310' }], active: true },
  { n: 4,  parts: [{ t: '  auto ', c: '#7C3AED' }, { t: 'data', c: '#1A1310' }, { t: ' = ', c: '#888' }, { t: 'fetch_nodes', c: '#C96A48' }, { t: '();', c: '#1A1310' }] },
  { n: 5,  parts: [{ t: '  ', c: '' }, { t: 'for', c: '#7C3AED' }, { t: '(auto& n : data) {', c: '#1A1310' }] },
  { n: 6,  parts: [{ t: '    process', c: '#C96A48' }, { t: '(n);', c: '#1A1310' }] },
  { n: 7,  parts: [{ t: '  }', c: '#888' }] },
  { n: 8,  parts: [{ t: '  return ', c: '#7C3AED' }, { t: '0', c: '#C96A48' }, { t: ';', c: '#1A1310' }] },
  { n: 9,  parts: [{ t: '}', c: '#888' }] },
];
const GRAPH_NODES = [
  { id: 'main',    label: 'main()',       type: 'ENTRY', x: 50, y: 14, color: '#C96A48', rgb: '201,106,72' },
  { id: 'fetch',   label: 'fetch_nodes()',type: 'CALL',  x: 24, y: 40, color: '#8B3E24', rgb: '139,62,36' },
  { id: 'loop',    label: 'for(…)',       type: 'LOOP',  x: 74, y: 40, color: '#B85A38', rgb: '184,90,56' },
  { id: 'process', label: 'process(n)',   type: 'CALL',  x: 74, y: 66, color: '#8B3E24', rgb: '139,62,36' },
  { id: 'ret',     label: 'return 0',     type: 'EXIT',  x: 50, y: 86, color: '#22c55e', rgb: '34,197,94' },
];
const GRAPH_EDGES = [
  { x1: '50%', y1: '19%', x2: '24%', y2: '36%' },
  { x1: '50%', y1: '19%', x2: '74%', y2: '36%' },
  { x1: '24%', y1: '44%', x2: '50%', y2: '82%' },
  { x1: '74%', y1: '44%', x2: '74%', y2: '62%' },
  { x1: '74%', y1: '70%', x2: '50%', y2: '82%' },
];

/* ── Hero app mockup ── */
const MOCKUP_CODE = [
  [{ t: '#include ', c: '#7C3AED' }, { t: '<iostream>', c: '#2D6A4F' }],
  [],
  [{ t: 'int ', c: '#7C3AED' }, { t: 'fibonacci', c: '#C96A48' }, { t: '(int n) {', c: 'rgba(232,226,217,0.75)' }],
  [{ t: '  if ', c: '#7C3AED' }, { t: '(n <= 1) ', c: 'rgba(232,226,217,0.7)' }, { t: 'return ', c: '#7C3AED' }, { t: 'n', c: '#C96A48' }, { t: ';', c: 'rgba(232,226,217,0.4)' }],
  [{ t: '  return ', c: '#7C3AED' }, { t: 'fibonacci', c: '#C96A48' }, { t: '(n-1)', c: 'rgba(232,226,217,0.7)' }, { t: ' + ', c: '#C96A48' }],
  [{ t: '         fibonacci', c: '#C96A48' }, { t: '(n-2);', c: 'rgba(232,226,217,0.5)' }],
  [{ t: '}', c: 'rgba(232,226,217,0.35)' }],
  [],
  [{ t: 'int ', c: '#7C3AED' }, { t: 'main', c: '#C96A48' }, { t: '() {', c: 'rgba(232,226,217,0.75)' }],
  [{ t: '  cout', c: '#C96A48' }, { t: ' << ', c: 'rgba(232,226,217,0.5)' }, { t: 'fibonacci', c: '#C96A48' }, { t: '(8);', c: 'rgba(232,226,217,0.5)' }],
];

function HeroMockup() {
  const [activeNode, setActiveNode] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActiveNode(n => (n + 1) % 5), 1400);
    return () => clearInterval(id);
  }, []);

  const NODES = [
    { label: 'fibonacci(8)', type: 'ENTRY', cx: 50,  cy: 18, color: '#C96A48', rgb: '201,106,72' },
    { label: 'fib(7)',        type: 'CALL',  cx: 28,  cy: 42, color: '#B85A38', rgb: '184,90,56' },
    { label: 'fib(6)',        type: 'CALL',  cx: 72,  cy: 42, color: '#B85A38', rgb: '184,90,56' },
    { label: 'fib(5)',        type: 'CALL',  cx: 28,  cy: 67, color: '#9B4A2C', rgb: '155,74,44' },
    { label: 'return 1',      type: 'BASE',  cx: 72,  cy: 67, color: '#22c55e', rgb: '34,197,94' },
  ];
  const EDGES = [[0,1],[0,2],[1,3],[2,4]];

  return (
    <div className="hero-mockup w-full max-w-5xl mx-auto mt-14 rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(201,106,72,0.2)', boxShadow: '0 48px 120px rgba(0,0,0,0.18), 0 0 0 1px rgba(201,106,72,0.06), inset 0 1px 0 rgba(255,255,255,0.04)', background: '#1C1917' }}>

      {/* Browser chrome */}
      <div style={{ background: '#231F1C', borderBottom: '1px solid rgba(232,226,217,0.06)', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.75 }} />)}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '4px 22px', borderRadius: 6, background: 'rgba(232,226,217,0.04)', border: '1px solid rgba(232,226,217,0.07)', fontSize: '11px', color: 'rgba(232,226,217,0.32)', fontFamily: 'JetBrains Mono, monospace' }}>
            app.traceon.dev/editor
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 5, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Running</span>
        </div>
      </div>

      {/* App layout */}
      <div style={{ display: 'flex', height: 'clamp(300px,38vw,420px)' }}>

        {/* Icon sidebar */}
        <div style={{ width: 46, background: '#1A1614', borderRight: '1px solid rgba(232,226,217,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14, gap: 10, flexShrink: 0 }}>
          {[['folder_open',false],['code',true],['hub',false],['memory',false],['psychology',false]].map(([icon, active], i) => (
            <div key={i} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(201,106,72,0.15)' : 'transparent', border: active ? '1px solid rgba(201,106,72,0.28)' : 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: active ? '#C96A48' : 'rgba(232,226,217,0.2)' }}>{icon}</span>
            </div>
          ))}
        </div>

        {/* File tree */}
        <div style={{ width: 148, background: '#1E1A17', borderRight: '1px solid rgba(232,226,217,0.05)', paddingTop: 10, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '2px 10px 8px', fontSize: 8, fontWeight: 800, color: 'rgba(232,226,217,0.2)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Explorer</div>
          {[{ n: 'src/', indent: 0, folder: true },{ n: 'main.cpp', indent: 1, active: true },{ n: 'fibonacci.h', indent: 1 },{ n: 'utils.cpp', indent: 1 },{ n: 'tests/', indent: 0, folder: true },{ n: 'test_fib.cpp', indent: 1 }].map((f, i) => (
            <div key={i} style={{ padding: `3px 10px 3px ${10 + f.indent * 12}px`, display: 'flex', alignItems: 'center', gap: 5, background: f.active ? 'rgba(201,106,72,0.12)' : 'transparent', borderLeft: f.active ? '2px solid #C96A48' : '2px solid transparent' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 11, color: f.active ? '#C96A48' : f.folder ? 'rgba(232,226,217,0.3)' : 'rgba(232,226,217,0.2)', flexShrink: 0 }}>{f.folder ? 'folder' : 'description'}</span>
              <span style={{ fontSize: 10, color: f.active ? '#E8E2D9' : 'rgba(232,226,217,0.35)', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }}>{f.n}</span>
            </div>
          ))}
        </div>

        {/* Code editor */}
        <div style={{ width: '36%', borderRight: '1px solid rgba(232,226,217,0.05)', display: 'flex', flexDirection: 'column', background: '#1C1917', flexShrink: 0 }}>
          <div style={{ padding: '6px 12px', borderBottom: '1px solid rgba(232,226,217,0.05)', display: 'flex', gap: 5, alignItems: 'center' }}>
            <div style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(201,106,72,0.12)', border: '1px solid rgba(201,106,72,0.22)', fontSize: 9, color: '#C96A48', fontFamily: 'JetBrains Mono, monospace' }}>main.cpp</div>
            <div style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, color: 'rgba(232,226,217,0.22)', fontFamily: 'JetBrains Mono, monospace' }}>fibonacci.h</div>
            <button style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 5, background: 'linear-gradient(135deg,#C96A48,#8B3E24)', fontSize: 9, color: '#fff', fontWeight: 700, border: 'none', cursor: 'default', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 10 }}>play_arrow</span>Run
            </button>
          </div>
          <div style={{ flex: 1, padding: '8px 4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', lineHeight: 1.75, overflow: 'hidden' }}>
            {MOCKUP_CODE.map((line, li) => (
              <div key={li} style={{ display: 'flex', gap: 8, padding: '0 4px', borderRadius: 3, background: li === 4 ? 'rgba(201,106,72,0.1)' : 'transparent', borderLeft: li === 4 ? '2px solid rgba(201,106,72,0.55)' : '2px solid transparent' }}>
                <span style={{ width: 14, textAlign: 'right', color: li === 4 ? 'rgba(201,106,72,0.6)' : 'rgba(232,226,217,0.18)', userSelect: 'none', fontSize: 9, paddingTop: 1 }}>{li + 1}</span>
                <span>{line.length === 0 ? <span> </span> : line.map((p, pi) => <span key={pi} style={{ color: p.c }}>{p.t}</span>)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flow graph panel */}
        <div style={{ flex: 1, background: '#141210', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '6px 14px', borderBottom: '1px solid rgba(232,226,217,0.05)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#C96A48' }}>hub</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(232,226,217,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Execution Flow</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
              <span style={{ fontSize: 9, color: 'rgba(232,226,217,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>5 nodes</span>
              <span style={{ fontSize: 9, color: 'rgba(201,106,72,0.7)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>· O(2ⁿ)</span>
            </div>
          </div>

          {/* Graph SVG */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(201,106,72,0.12) 1px, transparent 1px)', backgroundSize: '22px 22px', opacity: 0.55 }} />
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <marker id="mk-arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0,0 L5,2.5 L0,5 z" fill="rgba(201,106,72,0.45)" />
                </marker>
                <marker id="mk-arr-g" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0,0 L5,2.5 L0,5 z" fill="rgba(34,197,94,0.45)" />
                </marker>
              </defs>
              {EDGES.map(([fi, ti], ei) => {
                const f = NODES[fi], t2 = NODES[ti];
                const isGreen = t2.color === '#22c55e';
                return (
                  <line key={ei}
                    x1={`${f.cx}%`} y1={`${f.cy + 5}%`}
                    x2={`${t2.cx}%`} y2={`${t2.cy - 5}%`}
                    stroke={isGreen ? 'rgba(34,197,94,0.35)' : 'rgba(201,106,72,0.38)'}
                    strokeWidth="1.3"
                    strokeDasharray="4 3"
                    markerEnd={isGreen ? 'url(#mk-arr-g)' : 'url(#mk-arr)'}
                    style={{ transition: 'stroke 0.4s' }}
                  />
                );
              })}
              {NODES.map((node, ni) => {
                const active = ni === activeNode;
                return (
                  <g key={ni}>
                    {active && <ellipse cx={`${node.cx}%`} cy={`${node.cy}%`} rx="15%" ry="8%" fill={`rgba(${node.rgb},0.12)`} />}
                    <rect
                      x={`calc(${node.cx}% - 40px)`} y={`calc(${node.cy}% - 13px)`}
                      width="80px" height="26px" rx="6"
                      fill={active ? node.color : `rgba(${node.rgb},0.12)`}
                      stroke={active ? node.color : `rgba(${node.rgb},0.4)`}
                      strokeWidth={active ? 1.5 : 1}
                      style={{ transition: 'all 0.35s ease' }}
                    />
                    <text x={`${node.cx}%`} y={`calc(${node.cy}% + 4px)`}
                      textAnchor="middle" fontSize={8.5} fontFamily="Space Grotesk, monospace"
                      fontWeight={active ? 700 : 500}
                      fill={active ? '#fff' : `rgba(${node.rgb},0.9)`}
                      style={{ transition: 'fill 0.35s' }}>
                      {node.label}
                    </text>
                    {active && (
                      <text x={`${node.cx}%`} y={`calc(${node.cy}% + 18px)`}
                        textAnchor="middle" fontSize={6.5} fontWeight={700}
                        fontFamily="Space Grotesk, monospace"
                        fill={node.color} letterSpacing="0.08em">
                        {node.type}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* AI insight strip */}
          <div style={{ borderTop: '1px solid rgba(232,226,217,0.06)', background: 'rgba(16,14,12,0.95)', padding: '8px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#C96A48' }}>psychology</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#C96A48', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Analysis</span>
              <span style={{ marginLeft: 'auto', padding: '1px 7px', borderRadius: 3, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 8, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>O(2ⁿ) — Exponential</span>
            </div>
            <p style={{ fontSize: 9, color: 'rgba(232,226,217,0.45)', lineHeight: 1.6, margin: 0 }}>
              Recursive tree overlapping subproblems detected.{' '}
              <span style={{ color: '#C96A48' }}>Tip: memoize results to reduce to O(n).</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Marquee strip ── */
const MARQUEE_ITEMS = [
  { icon: 'hub',          text: 'Execution Flow Graph' },
  { icon: 'psychology',   text: 'AI Code Analysis' },
  { icon: 'memory',       text: 'Memory Spectrometer' },
  { icon: 'bug_report',   text: 'Step Debugger' },
  { icon: 'lan',          text: 'Concurrency View' },
  { icon: 'bolt',         text: 'Sub-200ms Analysis' },
  { icon: 'variable_add', text: 'Variable Tracker' },
  { icon: 'account_tree', text: 'Call Graph' },
  { icon: 'speed',        text: 'Performance Heatmap' },
  { icon: 'code_blocks',  text: 'Multi-Language Support' },
  { icon: 'troubleshoot', text: 'Predictive Path Analysis' },
  { icon: 'verified',     text: '99.9% Uptime SLA' },
];

function MarqueeStrip({ dark }) {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  const sep = dark ? 'rgba(232,226,217,0.12)' : 'rgba(100,70,40,0.12)';
  return (
    <div style={{ borderTop: `1px solid ${sep}`, borderBottom: `1px solid ${sep}`, padding: '13px 0', overflow: 'hidden', background: dark ? 'rgba(255,255,255,0.015)' : 'rgba(201,106,72,0.02)' }}>
      <div className="marquee-wrap">
        <div className="marquee-track">
          {doubled.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 32px', whiteSpace: 'nowrap' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#C96A48', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: dark ? 'rgba(232,226,217,0.55)' : 'rgba(26,19,16,0.5)', fontFamily: 'Space Grotesk, sans-serif' }}>{item.text}</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(201,106,72,0.35)', flexShrink: 0, marginLeft: 8 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FOOTER_COLS = [
  { title: 'Product',   links: ['Features', 'Docs', 'Pricing', 'Release Notes'] },
  { title: 'Resources', links: ['Blog', 'Tutorials', 'Examples', 'API Reference'] },
  { title: 'Company',   links: ['About', 'Community', 'Contact'] },
];

const T = 'rgba(201,106,72,';

const LandingPage = ({ onStart, onSwitchView, onLogin, onSignIn, user, serverDown }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [activeNodeIdx, setActiveNodeIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('flow');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistState, setWaitlistState] = useState('idle');

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setActiveNodeIdx(n => (n + 1) % GRAPH_NODES.length), 1800);
    return () => clearInterval(id);
  }, []);

  const { theme } = useTheme();
  const dark = isDarkTheme(theme);

  const textMuted55 = dark ? 'rgba(232,226,217,0.55)' : 'rgba(26,19,16,0.55)';
  const textMuted50 = dark ? 'rgba(232,226,217,0.50)' : 'rgba(26,19,16,0.5)';
  const textMuted40 = dark ? 'rgba(232,226,217,0.40)' : 'rgba(26,19,16,0.4)';
  const textMuted38 = dark ? 'rgba(232,226,217,0.38)' : 'rgba(26,19,16,0.38)';
  const textMuted35 = dark ? 'rgba(232,226,217,0.35)' : 'rgba(26,19,16,0.35)';
  const textMuted30 = dark ? 'rgba(232,226,217,0.30)' : 'rgba(26,19,16,0.3)';
  const textMuted25 = dark ? 'rgba(232,226,217,0.25)' : 'rgba(26,19,16,0.25)';
  const demoCodeText = dark ? '#E8E2D9' : '#1A1310';
  const demoEditorBg = dark ? '#1C1917' : '#F7F3EE';
  const demoGraphBg  = dark ? '#141210' : '#F2EDE7';
  const navBg        = dark ? 'rgba(35,31,28,0.94)'  : 'rgba(250,249,247,0.92)';
  const border09 = dark ? 'rgba(232,226,217,0.09)' : 'rgba(100,70,40,0.09)';
  const border10 = dark ? 'rgba(232,226,217,0.10)' : 'rgba(100,70,40,0.1)';
  const border12 = dark ? 'rgba(232,226,217,0.12)' : 'rgba(100,70,40,0.12)';
  const border14 = dark ? 'rgba(232,226,217,0.14)' : 'rgba(100,70,40,0.14)';
  const border25 = dark ? 'rgba(232,226,217,0.25)' : 'rgba(100,70,40,0.25)';
  const border08 = dark ? 'rgba(232,226,217,0.08)' : 'rgba(100,70,40,0.08)';

  const activeTabData = FEATURE_TABS.find(f => f.id === activeTab);

  const revealFeatureTabs = useScrollReveal(0.1);
  const revealBento       = useScrollReveal(0.08);
  const revealComparison  = useScrollReveal(0.08);
  const revealHowItWorks  = useScrollReveal(0.08);
  const revealTestimonials = useScrollReveal(0.08);
  const revealFaq         = useScrollReveal(0.1);

  const launch = () => {
    if (user) {
      user.role === 'member' ? onSwitchView('dashboard') : onStart();
    } else {
      if (onSignIn) {
        onSignIn();
      } else {
        setIsLoginOpen(true);
      }
    }
  };

  const handleWaitlist = async (e) => {
    e.preventDefault();
    const email = waitlistEmail.trim();
    if (!email) return;
    setWaitlistState('loading');
    try {
      await joinWaitlist(email);
      setWaitlistState('done');
      setWaitlistEmail('');
    } catch {
      setWaitlistState('error');
      setTimeout(() => setWaitlistState('idle'), 3000);
    }
  };

  const getFooterLinkAction = (label) => {
    const actions = {
      'Docs':           () => onSwitchView('docs'),
      'Tutorials':      () => onSwitchView('docs'),
      'Examples':       () => onSwitchView('editor'),
      'API Reference':  () => onSwitchView('docs'),
      'Blog':           () => onSwitchView('blog'),
      'Community':      () => onSwitchView('community'),
      'Pricing':        () => onSwitchView('pricing'),
      'Release Notes':  () => onSwitchView('news'),
      'Features':       () => onSwitchView('docs'),
      'About':          () => onSwitchView('community'),
    };
    return actions[label] || null;
  };

  const getFooterLinkHref = (label) => ({ 'Contact': 'mailto:nishantkumar19041@gmail.com' })[label] || null;

  const handleViewDemo = () => {
    if (localStorage.getItem('traceon_demo_used')) {
      setIsLoginOpen(true);
    } else {
      localStorage.setItem('traceon_demo_used', 'true');
      onStart();
    }
  };

  return (
    <div className="landing-root" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 w-full z-50" style={{ background: navBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${border10}` }}>
        <div className="flex justify-between items-center px-6 md:px-12 h-16 w-full max-w-7xl mx-auto">
          <button className="flex items-center gap-3" onClick={() => onSwitchView('landing')}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#C96A48,#8B3E24)', boxShadow: '0 0 18px rgba(201,106,72,0.35)' }}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>terminal</span>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>Traceon</span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {[['Home','landing'],['Docs','docs'],['Blog','blog'],['Pricing','pricing'],['Community','community'],['News','news']].map(([label, view]) => (
              <button key={label} className="nav-link" onClick={() => onSwitchView(view)}>{label}</button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {serverDown && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Backend is not running. Run: python run_server.py">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444' }} />
                Offline
              </span>
            )}
            {user ? (
              <>
                <span className="nav-link hidden md:inline" style={{ cursor: 'default', opacity: 0.8 }}>
                  {user.name?.split(' ')[0] || 'Hi'}
                </span>
                <button className="cta-primary px-5 py-2 rounded-lg text-sm font-bold" onClick={launch}>
                  {user.role === 'member' ? 'Dashboard' : 'Editor'}
                </button>
              </>
            ) : (
              <>
                <button className="nav-link text-xs sm:text-sm font-semibold" onClick={launch}>Sign In</button>
                <button className="cta-primary px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold" onClick={launch}>Launch App</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex flex-col overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="cyber-grid absolute inset-0 opacity-20" />
            <div className="absolute rounded-full blur-[140px] animate-float-orb"
              style={{ width: 560, height: 560, top: '10%', left: '20%', background: `radial-gradient(circle,${T}0.14) 0%,transparent 70%)` }} />
            <div className="absolute rounded-full blur-[120px] animate-float-orb"
              style={{ width: 440, height: 440, bottom: '20%', right: '15%', background: `radial-gradient(circle,rgba(139,62,36,0.10) 0%,transparent 70%)`, animationDelay: '2s' }} />
          </div>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-10"
            style={{ transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)', opacity: heroReady ? 1 : 0, transform: heroReady ? 'translateY(0)' : 'translateY(28px)' }}>

            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 cursor-default select-none"
                style={{ background: `${T}0.08)`, borderColor: `${T}0.28)` }}>
                <span className="w-2 h-2 rounded-full animate-pulse-ring" style={{ background: '#C96A48', flexShrink: 0 }} />
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#C96A48' }}>Alpha Release — Early Access</span>
              </div>

              <h1 className="font-extrabold mb-6 leading-tight"
                style={{ fontSize: 'clamp(2.6rem,7vw,5rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                See Your Code's{' '}
                <RotatingWord words={HERO_WORDS} />
              </h1>

              <p className="mb-10 max-w-2xl mx-auto leading-relaxed"
                style={{ fontSize: 'clamp(1rem,2.2vw,1.2rem)', color: textMuted55 }}>
                Transform complex C, C++, Python, and Java execution paths into intuitive, high-fidelity visual graphs.
                Debug with precision using{' '}
                <span style={{ color: '#C96A48', fontWeight: 600 }}>AI-driven flow analysis</span>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user?.role === 'member' ? (
                  <button onClick={() => onSwitchView('editor')} className="cta-primary flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm w-full sm:w-auto justify-center">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>code</span>
                    Open Editor
                  </button>
                ) : (
                  <>
                    <button onClick={launch} className="cta-primary flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm w-full sm:w-auto justify-center">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
                      {user ? 'Go to Editor' : 'Start Visualizing — Free'}
                    </button>
                    <button onClick={handleViewDemo} className="cta-secondary flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm w-full sm:w-auto justify-center">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                      View Demo
                    </button>
                  </>
                )}
              </div>

              {/* Waitlist capture */}
              {!user && waitlistState !== 'done' && (
                <form onSubmit={handleWaitlist}
                  style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <p style={{ fontSize: '0.78rem', color: textMuted40, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Get notified of new features &amp; updates
                  </p>
                  <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}>
                    <input type="email" placeholder="you@example.com" value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)} required
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${border25}`, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(201,106,72,0.55)'}
                      onBlur={e => e.target.style.borderColor = border25} />
                    <button type="submit" disabled={waitlistState === 'loading'}
                      style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#C96A48', color: '#fff', fontWeight: '700', fontSize: '0.8rem', cursor: waitlistState === 'loading' ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', opacity: waitlistState === 'loading' ? 0.7 : 1, transition: 'opacity 0.15s' }}>
                      {waitlistState === 'loading' ? '…' : 'Notify Me'}
                    </button>
                  </div>
                  {waitlistState === 'error' && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', margin: 0 }}>Something went wrong — try again.</p>
                  )}
                </form>
              )}
              {!user && waitlistState === 'done' && (
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '0.875rem', fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                  You're on the list — we'll keep you posted!
                </div>
              )}

              {/* Social proof micro-line */}
              <p style={{ marginTop: '24px', fontSize: '0.78rem', color: textMuted35 }}>
                Trusted by <span style={{ color: '#C96A48', fontWeight: 700 }}>2,000+</span> engineers, students & researchers
              </p>
            </div>
          </div>

          {/* ── HERO APP MOCKUP ── */}
          <div className="relative z-10 w-full px-4 md:px-10" style={{ marginTop: 0 }}>
            <HeroMockup />
          </div>

          {/* Stats strip */}
          <div className="relative z-10 w-full" style={{ borderTop: `1px solid ${border10}` }}>
            <div className="max-w-3xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {[
                { value: '< 200ms', label: 'Avg. Analysis' },
                { value: '50k+',    label: 'Traces Run' },
                { value: '4',       label: 'Languages' },
                { value: '99.9%',   label: 'Uptime SLA' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xl font-extrabold" style={{ color: '#C96A48', fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.1 }}>{s.value}</span>
                  <span className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: textMuted38 }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center pb-5 gap-1.5 opacity-35 select-none">
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: textMuted50 }}>Scroll</span>
              <div className="w-5 h-7 rounded-full border flex items-start justify-center pt-1.5" style={{ borderColor: border25 }}>
                <div className="w-1 h-2 rounded-full animate-scroll-bounce" style={{ background: '#C96A48' }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── GLOW DIVIDER ── */}
        <div className="glow-divider mx-auto" style={{ maxWidth: '80%', margin: '0 auto' }} />

        {/* ── MARQUEE ── */}
        <MarqueeStrip dark={dark} />

        {/* ── TECH STACK STRIP ── */}
        <div style={{ borderBottom: `1px solid ${border09}` }}>
          <div className="max-w-6xl mx-auto px-6 py-8">
            <p className="text-center text-xs font-bold uppercase tracking-widest mb-7" style={{ color: textMuted35 }}>
              Works with your stack
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
              {[
                { icon: 'terminal',  label: 'C / C++' },
                { icon: 'code',      label: 'Python' },
                { icon: 'coffee',    label: 'Java' },
                { icon: 'build',     label: 'GCC / Clang' },
                { icon: 'cloud',     label: 'Docker' },
                { icon: 'webhook',   label: 'REST API' },
                { icon: 'extension', label: 'VS Code' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2"
                  style={{ opacity: 0.45, transition: 'opacity 0.2s', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.45}>
                  <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#C96A48' }}>{item.icon}</span>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURE TABS SHOWCASE ── */}
        <section ref={revealFeatureTabs} className="scroll-reveal max-w-7xl mx-auto px-6 py-28">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4"
              style={{ borderColor: `${T}0.28)`, color: '#C96A48', background: `${T}0.07)` }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>auto_awesome</span>
              Feature Deep-Dive
            </div>
            <h2 className="font-extrabold mb-4"
              style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Everything In One{' '}
              <span className="gradient-text-alt">Platform</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: textMuted50 }}>
              From execution tracing to AI explanations — pick a feature and see it live.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Tab list */}
            <div className="flex flex-row lg:flex-col gap-2 lg:w-56 shrink-0 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {FEATURE_TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="feature-tab-btn flex items-center gap-3 px-4 py-3.5 rounded-xl text-left shrink-0"
                    style={{ background: isActive ? `${T}0.1)` : 'transparent', border: `1px solid ${isActive ? `${T}0.32)` : 'transparent'}`, minWidth: 148 }}>
                    <span className="material-symbols-outlined" style={{ color: isActive ? '#C96A48' : textMuted50, fontSize: '20px', flexShrink: 0 }}>{tab.icon}</span>
                    <span style={{ fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text-primary)' : textMuted55, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Preview panel */}
            <div className="flex-1 rounded-2xl border overflow-hidden"
              style={{ borderColor: border14, background: 'var(--bg-card)', boxShadow: dark ? '0 24px 64px rgba(0,0,0,0.3)' : '0 24px 64px rgba(100,70,40,0.1)' }}>
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: border10, background: 'var(--bg-secondary)' }}>
                {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
                <span style={{ marginLeft: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: textMuted40 }}>
                  traceon — {activeTabData?.label}
                </span>
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  Live
                </div>
              </div>
              {/* Content */}
              <div key={activeTab} style={{ padding: '32px', minHeight: 320, animation: 'view-in 0.3s ease both' }}>
                <h3 className="font-extrabold mb-3"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {activeTabData?.headline}
                </h3>
                <p style={{ fontSize: '0.93rem', color: textMuted55, lineHeight: 1.7, maxWidth: 540 }}>
                  {activeTabData?.desc}
                </p>
                <div className="flex flex-wrap gap-2 mt-5">
                  {activeTabData?.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold border"
                      style={{ color: '#C96A48', borderColor: `${T}0.28)`, background: `${T}0.08)` }}>{tag}</span>
                  ))}
                </div>
                <FeaturePreview
                  type={activeTabData?.preview}
                  dark={dark}
                  border12={border12}
                  textMuted38={textMuted38}
                  textMuted55={textMuted55}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES BENTO GRID ── */}
        <section ref={revealBento} className="scroll-reveal max-w-7xl mx-auto px-6 py-20 border-t" style={{ borderColor: border09 }}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4"
              style={{ borderColor: `${T}0.28)`, color: '#C96A48', background: `${T}0.07)` }}>
              Core Capabilities
            </div>
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Everything You Need to{' '}
              <span className="gradient-text-alt">Debug Faster</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: textMuted50 }}>
              From execution tracing to AI-driven explanations, Traceon is your complete debugging intelligence platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 p-8 rounded-2xl border relative overflow-hidden landing-card"
              style={{ background: `${T}0.04)`, borderColor: `${T}0.14)` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${T}0.38)`; e.currentTarget.style.background = `${T}0.08)`; e.currentTarget.style.boxShadow = dark ? '0 24px 64px rgba(232,226,217,0.07), 0 0 32px rgba(201,106,72,0.08)' : '0 24px 64px rgba(100,70,40,0.10), 0 0 32px rgba(201,106,72,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${T}0.14)`; e.currentTarget.style.background = `${T}0.04)`; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="absolute top-0 right-0 w-56 h-56 rounded-full blur-[90px] pointer-events-none" style={{ background: `${T}0.10)` }} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${T}0.12)`, border: `1px solid ${T}0.28)` }}>
                  <span className="material-symbols-outlined" style={{ color: '#C96A48', fontSize: '24px' }}>troubleshoot</span>
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>Predictive Path Analysis</h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: textMuted55 }}>
                  Leverage Traceon's LLM-assisted forecasting to identify potential race conditions and memory leaks before they occur in production. Get probabilistic hotspot detection on complex codebases.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Race Conditions', 'Memory Leaks', 'Deadlock Detection'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold border"
                      style={{ color: '#C96A48', borderColor: `${T}0.28)`, background: `${T}0.08)` }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {[
              { title: 'Cognitive Mapping',   icon: 'account_tree', desc: 'Hierarchical visualization that adapts to your mental model of the codebase.' },
              { title: 'Memory Insight',      icon: 'memory',       desc: 'Real-time heap & stack allocation tracking with visual pointer arithmetic and buffer boundaries.' },
              { title: 'Concurrency Mapping', icon: 'lan',          desc: 'Visualize thread lifecycles, mutex locks, and synchronization points in a temporal graph.' },
              { title: 'Sub-200ms Analysis',  icon: 'speed',        desc: 'Lightning-fast trace analysis with streaming output for instant feedback loops.' },
            ].map(card => (
              <div key={card.title} className="p-6 rounded-2xl border relative overflow-hidden landing-card"
                style={{ background: `${T}0.03)`, borderColor: `${T}0.12)` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${T}0.36)`; e.currentTarget.style.background = `${T}0.07)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${T}0.12)`; e.currentTarget.style.background = `${T}0.03)`; }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none" style={{ background: `${T}0.10)` }} />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${T}0.12)`, border: `1px solid ${T}0.25)` }}>
                    <span className="material-symbols-outlined" style={{ color: '#C96A48', fontSize: '20px' }}>{card.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: textMuted55 }}>{card.desc}</p>
                </div>
              </div>
            ))}

            <div className="md:col-span-2 p-8 rounded-2xl border relative overflow-hidden landing-card"
              style={{ background: `${T}0.04)`, borderColor: `${T}0.14)` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${T}0.38)`; e.currentTarget.style.background = `${T}0.08)`; e.currentTarget.style.boxShadow = dark ? '0 24px 64px rgba(232,226,217,0.07)' : '0 24px 64px rgba(100,70,40,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${T}0.14)`; e.currentTarget.style.background = `${T}0.04)`; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="absolute top-0 left-0 w-56 h-56 rounded-full blur-[90px] pointer-events-none" style={{ background: `${T}0.10)` }} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${T}0.12)`, border: `1px solid ${T}0.28)` }}>
                  <span className="material-symbols-outlined" style={{ color: '#C96A48', fontSize: '24px' }}>psychology</span>
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>AI Code Explanation</h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: textMuted55 }}>
                  Instant AI-generated summaries, Big-O complexity analysis, and optimization hints powered by advanced language models. Understand any execution path at a glance, no expertise required.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Big-O Analysis', 'Optimization Tips', 'Code Summaries'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold border"
                      style={{ color: '#C96A48', borderColor: `${T}0.28)`, background: `${T}0.08)` }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section ref={revealComparison} className="scroll-reveal max-w-5xl mx-auto px-6 py-24 border-t" style={{ borderColor: border09 }}>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4"
              style={{ borderColor: `${T}0.28)`, color: '#C96A48', background: `${T}0.07)` }}>
              Why Traceon
            </div>
            <h2 className="font-extrabold mb-4"
              style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Traceon vs{' '}
              <span className="gradient-text">The Alternatives</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: textMuted50 }}>
              See exactly what you gain over traditional debugging tools.
            </p>
          </div>

          <div className="rounded-2xl border overflow-hidden"
            style={{ borderColor: border14, boxShadow: dark ? '0 24px 64px rgba(0,0,0,0.25)' : '0 24px 64px rgba(100,70,40,0.08)' }}>
            {/* Header */}
            <div className="grid grid-cols-4 gap-0 border-b" style={{ borderColor: border10, background: 'var(--bg-secondary)' }}>
              {[
                { label: 'Feature', align: 'left', accent: false },
                { label: 'printf', align: 'center', accent: false },
                { label: 'GDB', align: 'center', accent: false },
                { label: 'Traceon', align: 'center', accent: true },
              ].map(col => (
                <div key={col.label} style={{
                  padding: '16px 20px', textAlign: col.align, fontWeight: 800, fontSize: '0.82rem',
                  fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: col.accent ? '#C96A48' : textMuted38,
                  background: col.accent ? `${T}0.07)` : 'transparent',
                  borderLeft: col.accent ? `1px solid ${T}0.18)` : 'none',
                  borderRight: col.accent ? `1px solid ${T}0.18)` : 'none',
                }}>{col.label}</div>
              ))}
            </div>
            {/* Rows */}
            {COMPARISON_ROWS.map((row, i) => (
              <div key={i} className="grid grid-cols-4 gap-0 border-b comp-row"
                style={{ borderColor: border09, background: i % 2 === 0 ? 'transparent' : (dark ? 'rgba(255,255,255,0.01)' : 'rgba(100,70,40,0.015)') }}>
                <div style={{ padding: '14px 20px', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>{row.feature}</div>
                {['printf', 'gdb', 'traceon'].map((col, ci) => (
                  <div key={col} style={{
                    padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: col === 'traceon' ? `${T}0.04)` : 'transparent',
                    borderLeft: col === 'traceon' ? `1px solid ${T}0.12)` : 'none',
                    borderRight: col === 'traceon' ? `1px solid ${T}0.12)` : 'none',
                  }}>
                    <CompCell val={row[col]} />
                  </div>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-4 gap-0" style={{ background: 'var(--bg-secondary)' }}>
              <div style={{ padding: '14px 20px' }} />
              <div style={{ padding: '14px 20px' }} />
              <div style={{ padding: '14px 20px' }} />
              <div style={{ padding: '12px 20px', background: `${T}0.08)`, borderLeft: `1px solid ${T}0.18)`, borderRight: `1px solid ${T}0.18)`, borderBottom: `1px solid ${T}0.18)`, borderRadius: '0 0 12px 0' }}>
                <button className="cta-primary w-full py-2.5 rounded-lg text-xs font-bold" onClick={launch}>
                  Try Free →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section ref={revealHowItWorks} className="scroll-reveal max-w-6xl mx-auto px-6 py-28 border-t" style={{ borderColor: border09 }}>
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4"
              style={{ borderColor: `${T}0.28)`, color: '#C96A48', background: `${T}0.07)` }}>
              Simple Workflow
            </div>
            <h2 className="font-extrabold mb-4"
              style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              From Code to Insight in{' '}
              <span className="gradient-text">3 Steps</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: textMuted50 }}>
              No configuration required. Traceon integrates directly into your dev workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative" style={{ alignItems: 'start' }}>
            <div className="hidden md:block absolute"
              style={{ top: 40, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,106,72,0.35),rgba(139,62,36,0.3),transparent)' }} />
            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center step-icon"
                    style={{ background: `${T}0.06)`, border: `1px solid ${T}0.18)` }}>
                    <span className="material-symbols-outlined" style={{ color: '#C96A48', fontSize: '32px' }}>{step.icon}</span>
                  </div>
                  <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: 'linear-gradient(135deg,#C96A48,#8B3E24)', color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed max-w-xs" style={{ color: textMuted55 }}>{step.desc}</p>

                {i === 2 && (() => {
                  const MN = [
                    { id: 'main',    label: 'main()',    type: 'ENTRY', cx: 120, cy: 28,  hw: 36, hh: 11, color: '#C96A48', rgb: '201,106,72' },
                    { id: 'fetch',   label: 'fetch()',   type: 'CALL',  cx: 58,  cy: 82,  hw: 30, hh: 11, color: '#8B3E24', rgb: '139,62,36' },
                    { id: 'loop',    label: 'for(…)',    type: 'LOOP',  cx: 182, cy: 82,  hw: 30, hh: 11, color: '#B85A38', rgb: '184,90,56' },
                    { id: 'process', label: 'process()', type: 'CALL',  cx: 182, cy: 136, hw: 30, hh: 11, color: '#8B3E24', rgb: '139,62,36' },
                    { id: 'ret',     label: 'return 0',  type: 'EXIT',  cx: 120, cy: 170, hw: 36, hh: 11, color: '#22c55e', rgb: '34,197,94' },
                  ];
                  const ME = [[0,1],[0,2],[1,4],[2,3],[3,4]];
                  const ec = dark ? 'rgba(232,226,217,0.16)' : 'rgba(100,70,40,0.18)';
                  const nb = dark ? '#1E1A17' : '#FFFAF6';
                  const nb2 = dark ? 'rgba(232,226,217,0.14)' : 'rgba(201,106,72,0.22)';
                  const tc = dark ? '#E8E2D9' : '#1A1310';
                  return (
                    <div style={{ margin: '20px auto 0', width: '100%', maxWidth: '240px', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${T}0.18)`, background: dark ? 'rgba(20,18,16,0.75)' : 'rgba(242,237,231,0.85)', boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 8px 28px rgba(100,70,40,0.10)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderBottom: `1px solid ${T}0.12)`, background: dark ? 'rgba(28,25,23,0.92)' : 'rgba(252,250,247,0.92)' }}>
                        {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />)}
                        <span style={{ marginLeft: 4, fontSize: '9px', fontWeight: 700, color: textMuted38, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Flow Graph</span>
                      </div>
                      <svg width="100%" viewBox="0 0 240 188" style={{ display: 'block' }}>
                        <defs>
                          <marker id="lp-arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill={ec} /></marker>
                          <marker id="lp-arr-a" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill="rgba(201,106,72,0.75)" /></marker>
                        </defs>
                        {ME.map(([fi, ti], ei) => {
                          const f = MN[fi], t2 = MN[ti];
                          const active = fi === activeNodeIdx || ti === activeNodeIdx;
                          const x1 = f.cx, y1 = f.cy + f.hh + 1, x2 = t2.cx, y2 = t2.cy - t2.hh - 5, my = (y1 + y2) / 2;
                          return <path key={ei} d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} fill="none" stroke={active ? 'rgba(201,106,72,0.72)' : ec} strokeWidth={active ? 1.6 : 1} strokeDasharray={active ? 'none' : '5 3'} markerEnd={active ? 'url(#lp-arr-a)' : 'url(#lp-arr)'} style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }} />;
                        })}
                        {MN.map((node, ni) => {
                          const active = ni === activeNodeIdx;
                          return (
                            <g key={node.id} style={{ transition: 'all 0.4s' }}>
                              {active && <rect x={node.cx - node.hw - 3} y={node.cy - node.hh - 3} width={(node.hw + 3) * 2} height={(node.hh + 3) * 2} rx={8} fill={`rgba(${node.rgb},0.12)`} />}
                              <rect x={node.cx - node.hw} y={node.cy - node.hh} width={node.hw * 2} height={node.hh * 2} rx={5} fill={active ? node.color : nb} stroke={active ? node.color : nb2} strokeWidth={active ? 1.5 : 1} />
                              <text x={node.cx} y={node.cy + 3.5} textAnchor="middle" dominantBaseline="middle" fontSize={8.5} fontWeight={active ? 700 : 500} fontFamily="Space Grotesk, ui-monospace, monospace" fill={active ? '#fff' : tc} style={{ transition: 'fill 0.4s' }}>{node.label}</text>
                              {active && <text x={node.cx} y={node.cy + node.hh + 8} textAnchor="middle" fontSize={6.5} fontWeight={700} fontFamily="Space Grotesk, monospace" fill={node.color} letterSpacing="0.06em">{node.type}</text>}
                            </g>
                          );
                        })}
                      </svg>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 10px', borderTop: `1px solid ${T}0.10)` }}>
                        {MN.map((_, ni) => <div key={ni} style={{ width: ni === activeNodeIdx ? 14 : 5, height: 5, borderRadius: 3, background: ni === activeNodeIdx ? '#C96A48' : (dark ? 'rgba(232,226,217,0.18)' : 'rgba(100,70,40,0.18)'), transition: 'all 0.35s ease' }} />)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </section>

        {/* ── LIVE DEMO PREVIEW ── */}
        <section className="max-w-7xl mx-auto px-6 py-28 border-t" style={{ borderColor: border09 }}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4"
              style={{ borderColor: 'rgba(34,197,94,0.3)', color: '#16a34a', background: 'rgba(34,197,94,0.07)' }}>
              Live Preview
            </div>
            <h2 className="font-extrabold mb-4"
              style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Execution Graph{' '}
              <span className="gradient-text-alt">Visualizer</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: textMuted50 }}>
              Synchronized source-to-flow mapping for deep architectural inspection.
            </p>
          </div>

          <div className="rounded-2xl border overflow-hidden"
            style={{ borderColor: border14, background: 'var(--bg-card)', boxShadow: dark ? '0 32px 80px rgba(232,226,217,0.05), 0 0 0 1px rgba(232,226,217,0.04)' : '0 32px 80px rgba(100,70,40,0.12), 0 0 0 1px rgba(100,70,40,0.06)' }}>
            <div className="flex items-center gap-2 px-6 py-3.5 border-b"
              style={{ background: 'var(--bg-secondary)', borderColor: border10 }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444', opacity: 0.7 }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b', opacity: 0.7 }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e', opacity: 0.7 }} />
              <div className="ml-4 px-4 py-1 rounded border text-xs"
                style={{ borderColor: border12, color: textMuted40, background: 'var(--bg-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                traceon — main.cpp
              </div>
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                Analysis Running
              </div>
            </div>

            <div className="flex flex-col md:flex-row h-[520px]">
              <div className="w-full md:w-2/5 flex flex-col border-b md:border-b-0 md:border-r"
                style={{ background: demoEditorBg, borderColor: border10 }}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b text-xs font-bold"
                  style={{ borderColor: border08, color: textMuted40 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#C96A48' }}>code</span>
                  main.cpp
                  <span className="ml-auto px-2 py-0.5 rounded text-[10px]"
                    style={{ background: 'rgba(201,106,72,0.1)', color: '#C96A48', border: '1px solid rgba(201,106,72,0.2)' }}>C++17</span>
                </div>
                <div className="flex-1 p-4 overflow-hidden" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', lineHeight: '1.7' }}>
                  {CODE_LINES.map((line, i) => (
                    <div key={i} className="flex gap-3 px-2 rounded transition-all duration-300"
                      style={{ background: line.active ? 'rgba(201,106,72,0.1)' : 'transparent' }}>
                      <span className="w-5 text-right select-none shrink-0 text-xs"
                        style={{ color: line.active ? '#C96A48' : textMuted25, paddingTop: '1px' }}>{line.n}</span>
                      <span>
                        {line.parts.length === 0
                          ? <span>&nbsp;</span>
                          : line.parts.map((p, j) => <span key={j} style={{ color: p.c === '#1A1310' ? demoCodeText : p.c }}>{p.t}</span>)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 relative overflow-hidden" style={{ background: demoGraphBg }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage: `radial-gradient(circle, rgba(201,106,72,0.15) 1px, transparent 1px)`, backgroundSize: '28px 28px', opacity: 0.6 }} />
                <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                  <defs>
                    <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                      <polygon points="0 0,8 3,0 6" fill="rgba(201,106,72,0.55)" />
                    </marker>
                    <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C96A48" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#8B3E24" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  {GRAPH_EDGES.map((e, i) => (
                    <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                      stroke="url(#lg1)" strokeWidth="1.5" markerEnd="url(#arr)"
                      className="edge-animated" style={{ animationDelay: `${i * 0.4}s` }} />
                  ))}
                </svg>
                {GRAPH_NODES.map((node) => (
                  <div key={node.id} className="absolute -translate-x-1/2 -translate-y-1/2 graph-node"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    onMouseEnter={e => { e.currentTarget.querySelector('.node-box').style.boxShadow = `0 0 28px rgba(${node.rgb},0.35)`; e.currentTarget.querySelector('.node-box').style.borderColor = `rgba(${node.rgb},0.7)`; }}
                    onMouseLeave={e => { e.currentTarget.querySelector('.node-box').style.boxShadow = `0 0 14px rgba(${node.rgb},0.15)`; e.currentTarget.querySelector('.node-box').style.borderColor = `rgba(${node.rgb},0.3)`; }}>
                    <div className="node-box px-4 py-2.5 rounded-xl border text-center"
                      style={{ background: `rgba(${node.rgb},0.08)`, borderColor: `rgba(${node.rgb},0.3)`, boxShadow: `0 0 14px rgba(${node.rgb},0.15)`, transition: 'all 0.2s ease', minWidth: '90px' }}>
                      <div className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: node.color }}>{node.type}</div>
                      <div className="text-xs font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{node.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── ANIMATED STATS ── */}
        <StatsSection dark={dark} border09={border09} textMuted38={textMuted38} textMuted55={textMuted55} />

        {/* ── TESTIMONIALS GRID ── */}
        <div ref={revealTestimonials} className="scroll-reveal">
          <TestimonialsSection dark={dark} border09={border09} />
        </div>

        {/* ── FAQ ── */}
        <div ref={revealFaq} className="scroll-reveal">
          <FAQSection dark={dark} border09={border09} textMuted55={textMuted55} />
        </div>

        {/* ── FINAL CTA ── */}
        <section className="max-w-7xl mx-auto px-6 py-28 border-t" style={{ borderColor: border09 }}>
          <div className="relative rounded-3xl px-10 py-20 md:px-24 text-center overflow-hidden border"
            style={{ background: `${T}0.05)`, borderColor: `${T}0.16)` }}>
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[130px] pointer-events-none" style={{ background: `${T}0.12)` }} />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[130px] pointer-events-none" style={{ background: 'rgba(139,62,36,0.09)' }} />
            <div className="absolute inset-0 pointer-events-none opacity-25"
              style={{ backgroundImage: `linear-gradient(${T}0.06) 1px,transparent 1px),linear-gradient(90deg,${T}0.06) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-6"
                style={{ borderColor: `${T}0.28)`, color: '#C96A48', background: `${T}0.08)` }}>
                <span className="w-2 h-2 rounded-full animate-pulse-ring" style={{ background: '#C96A48', flexShrink: 0 }} />
                Ready to Ship
              </div>
              <h2 className="font-extrabold mb-6"
                style={{ fontSize: 'clamp(2.2rem,6vw,4rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--text-primary)' }}>
                Debug Faster.{' '}
                <span className="gradient-text">Ship with Confidence.</span>
              </h2>
              <p className="max-w-2xl mx-auto mb-12 leading-relaxed" style={{ fontSize: '1.125rem', color: textMuted55 }}>
                Traceon gives you the execution intelligence to catch bugs before they reach production.
                Trusted by engineers who care about code quality.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <button className="ghost-btn flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-sm"
                  onClick={() => onSwitchView('pricing')}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#C96A48' }}>local_offer</span>
                  View Pricing
                </button>
                <button className="cta-primary flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm"
                  onClick={() => user?.role === 'member' ? onSwitchView('editor') : launch()}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {user?.role === 'member' ? 'code' : 'rocket_launch'}
                  </span>
                  {user?.role === 'member' ? 'Open Editor' : 'Start for Free'}
                </button>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center justify-center gap-8">
                {[
                  { icon: 'lock', text: 'No credit card required' },
                  { icon: 'check_circle', text: 'Free tier forever' },
                  { icon: 'speed', text: 'Ready in under 30 seconds' },
                  { icon: 'groups', text: '2,000+ engineers trust Traceon' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2" style={{ fontSize: '0.82rem', color: textMuted50 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#C96A48' }}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t py-16" style={{ borderColor: border10, background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-14">
            <div className="col-span-2">
              <button className="flex items-center gap-3 mb-4" onClick={() => onSwitchView('landing')}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#C96A48,#8B3E24)' }}>
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>terminal</span>
                </div>
                <span className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>Traceon</span>
              </button>
              <p className="text-sm leading-relaxed mb-6" style={{ color: textMuted50, maxWidth: 280 }}>
                The AI-powered C, C++, Python, and Java execution flow visualizer for engineers who demand precision.
              </p>
              <div className="flex gap-2.5">
                {[
                  { icon: 'description', label: 'Docs',      onClick: () => onSwitchView('docs') },
                  { icon: 'group',       label: 'Community', onClick: () => onSwitchView('community') },
                  { icon: 'mail',        label: 'Email',     href: 'mailto:nishantkumar19041@gmail.com' },
                ].map(s => (
                  s.href ? (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="social-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{s.icon}</span>
                    </a>
                  ) : (
                    <button key={s.label} type="button" aria-label={s.label} className="social-icon" onClick={s.onClick}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{s.icon}</span>
                    </button>
                  )
                ))}
              </div>
            </div>
            {FOOTER_COLS.map(col => (
              <div key={col.title}>
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: textMuted38 }}>{col.title}</div>
                <ul className="flex flex-col gap-3">
                  {col.links.map(link => {
                    const action = getFooterLinkAction(link);
                    const href = getFooterLinkHref(link);
                    return (
                      <li key={link}>
                        {href ? (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="footer-link">{link}</a>
                        ) : (
                          <a href="#0" className="footer-link"
                            onClick={action ? (e) => { e.preventDefault(); action(); } : undefined}
                          >{link}</a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t" style={{ borderColor: border10 }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: textMuted30, fontFamily: 'JetBrains Mono, monospace' }}>
              © {new Date().getFullYear()} TRACEON SYSTEMS. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(link => (
                <button key={link} type="button" className="text-xs transition-colors"
                  style={{ color: textMuted35, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#C96A48'}
                  onMouseLeave={e => e.currentTarget.style.color = textMuted35}
                  onClick={() => alert(`${link} — Coming Soon`)}>
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Fixed atmosphere */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 rounded-full blur-[220px]"
          style={{ width: 800, height: 800, background: `${T}0.06)` }} />
        <div className="absolute bottom-0 right-1/4 rounded-full blur-[200px]"
          style={{ width: 640, height: 640, background: 'rgba(139,62,36,0.05)' }} />
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={onLogin} />
    </div>
  );
};

export default LandingPage;
