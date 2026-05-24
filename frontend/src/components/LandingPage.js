import React, { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import { useTheme, isDarkTheme } from '../theme';

const STEPS = [
  { icon: 'code',       n: '01', title: 'Write Your Code',         desc: 'Use the built-in editor with syntax highlighting for C, C++, Python, and Java. Switch languages from the dropdown.' },
  { icon: 'play_circle',n: '02', title: 'Run Traceon Analysis',    desc: 'Our engine compiles, instruments, and traces your code in under 200ms.' },
  { icon: 'hub',        n: '03', title: 'Explore the Flow Graph',  desc: 'Navigate execution interactively. Click any node for deep-dive AI explanations.' },
];


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
  { id: 'process', label: 'process(n)',  type: 'CALL',  x: 74, y: 66, color: '#8B3E24', rgb: '139,62,36' },
  { id: 'ret',     label: 'return 0',    type: 'EXIT',  x: 50, y: 86, color: '#22c55e', rgb: '34,197,94' },
];

const GRAPH_EDGES = [
  { x1: '50%', y1: '19%', x2: '24%', y2: '36%' },
  { x1: '50%', y1: '19%', x2: '74%', y2: '36%' },
  { x1: '24%', y1: '44%', x2: '50%', y2: '82%' },
  { x1: '74%', y1: '44%', x2: '74%', y2: '62%' },
  { x1: '74%', y1: '70%', x2: '50%', y2: '82%' },
];

const FOOTER_COLS = [
  { title: 'Product',   links: ['Features', 'Docs', 'Pricing', 'Release Notes'] },
  { title: 'Resources', links: ['Tutorials', 'Examples', 'API Reference'] },
  { title: 'Company',   links: ['About', 'Community', 'Contact'] },
];

// ─── Set this to your YouTube embed URL or Loom embed URL to activate the demo video.
// YouTube format:  "https://www.youtube.com/embed/YOUR_VIDEO_ID"
// Loom format:     "https://www.loom.com/embed/YOUR_LOOM_ID"
const DEMO_VIDEO_URL = null;

const DEMO_TIMESTAMPS = [
  { time: '0:00', label: 'Editor overview' },
  { time: '0:30', label: 'Compile & run' },
  { time: '1:05', label: 'Step debugger' },
  { time: '1:50', label: 'Memory Spectrometer' },
  { time: '2:30', label: 'AI explain & optimize' },
  { time: '3:10', label: 'Projects & dashboard' },
];

const T = 'rgba(201,106,72,'; // terracotta helper

const LandingPage = ({ onStart, onSwitchView, onLogin, user }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [activeNodeIdx, setActiveNodeIdx] = useState(0);

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
  const textMuted38 = dark ? 'rgba(232,226,217,0.38)' : 'rgba(26,19,16,0.38)';
  const textMuted40 = dark ? 'rgba(232,226,217,0.40)' : 'rgba(26,19,16,0.4)';
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

  const launch = () => {
    if (user) {
      user.role === 'member' ? onSwitchView('dashboard') : onStart();
    } else {
      setIsLoginOpen(true);
    }
  };

  const getFooterLinkAction = (label) => {
    const actions = {
      'Docs':          () => onSwitchView('docs'),
      'Tutorials':     () => onSwitchView('docs'),
      'Examples':      () => onSwitchView('editor'),
      'API Reference': () => onSwitchView('docs'),
      'Community':     () => onSwitchView('community'),
      'Pricing':       () => onSwitchView('pricing'),
    };
    return actions[label] || null;
  };

  const getFooterLinkHref = (label) => {
    const hrefs = {
      'Contact': 'mailto:nishantkumar19041@gmail.com',
    };
    return hrefs[label] || null;
  };

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
            {[['Home','landing'],['Docs','docs'],['Pricing','pricing'],['Community','community']].map(([label, view]) => (
              <button key={label} className="nav-link" onClick={() => onSwitchView(view)}>{label}</button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="nav-link hidden md:block" style={{ cursor: 'default', opacity: 0.8 }}>
                  {user.name?.split(' ')[0] || 'Hi'}
                </span>
                <button className="cta-primary px-5 py-2 rounded-lg text-sm font-bold" onClick={launch}>
                  {user.role === 'member' ? 'Dashboard' : 'Editor'}
                </button>
              </>
            ) : (
              <>
                <button className="nav-link hidden md:block" onClick={launch}>Sign In</button>
                <button className="cta-primary px-5 py-2 rounded-lg text-sm font-bold" onClick={launch}>Launch App</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex flex-col overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="cyber-grid absolute inset-0 opacity-20" />
            <div className="absolute rounded-full blur-[140px] animate-float-orb"
              style={{ width: 560, height: 560, top: '10%', left: '20%', background: `radial-gradient(circle,${T}0.14) 0%,transparent 70%)` }} />
            <div className="absolute rounded-full blur-[120px] animate-float-orb"
              style={{ width: 440, height: 440, bottom: '20%', right: '15%', background: `radial-gradient(circle,rgba(139,62,36,0.10) 0%,transparent 70%)`, animationDelay: '2s' }} />
          </div>

          {/* Main CTA content — fills available space, centered vertically */}
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
                <span className="gradient-text">Narrative</span>
              </h1>

              <p className="mb-10 max-w-2xl mx-auto leading-relaxed"
                style={{ fontSize: 'clamp(1rem,2.2vw,1.2rem)', color: textMuted55 }}>
                Transform complex C, C++, Python, and Java execution paths into intuitive, high-fidelity visual graphs.
                Debug with precision using{' '}
                <span style={{ color: '#C96A48', fontWeight: 600 }}>AI-driven flow analysis</span>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user?.role === 'member' ? (
                  /* Member: header already has Dashboard — hero gives direct editor access */
                  <button onClick={() => onSwitchView('editor')} className="cta-primary flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm w-full sm:w-auto justify-center">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>code</span>
                    Open Editor
                  </button>
                ) : (
                  /* Guest / logged-out: full CTA pair */
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
            </div>
          </div>

          {/* Stats strip — pinned to the bottom of the hero, separated by a border */}
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

            {/* Scroll indicator — sits below stats, inside the strip */}
            <div className="flex flex-col items-center pb-5 gap-1.5 opacity-35 select-none">
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: textMuted50 }}>Scroll</span>
              <div className="w-5 h-7 rounded-full border flex items-start justify-center pt-1.5" style={{ borderColor: border25 }}>
                <div className="w-1 h-2 rounded-full animate-scroll-bounce" style={{ background: '#C96A48' }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── DEMO VIDEO ── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4"
              style={{ borderColor: `${T}0.28)`, color: '#C96A48', background: `${T}0.07)` }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>play_circle</span>
              Walkthrough
            </div>
            <h2 className="font-extrabold mb-3"
              style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              See Traceon in Action
            </h2>
            <p style={{ color: textMuted55, fontSize: '0.95rem', maxWidth: 420, margin: '0 auto' }}>
              A 4-minute walkthrough covering the editor, debugger, Memory Spectrometer, and AI features.
            </p>
          </div>

          {/* Video frame */}
          <div style={{
            position: 'relative', borderRadius: '18px', overflow: 'hidden',
            border: `1px solid ${T}0.18)`,
            boxShadow: dark
              ? '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(232,226,217,0.06)'
              : '0 32px 80px rgba(100,70,40,0.12), 0 0 0 1px rgba(201,106,72,0.08)',
            aspectRatio: '16/9', background: dark ? '#141210' : '#F2EDE7',
          }}>
            {DEMO_VIDEO_URL ? (
              <iframe
                src={DEMO_VIDEO_URL}
                title="Traceon Walkthrough"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            ) : (
              /* Placeholder — shown until DEMO_VIDEO_URL is set */
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                {/* Decorative mock UI lines */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}>
                  {[15, 30, 45, 60, 75].map(top => (
                    <div key={top} style={{ position: 'absolute', left: '8%', right: '8%', top: `${top}%`, height: '1px', background: '#C96A48' }} />
                  ))}
                  {[20, 40, 60, 80].map(left => (
                    <div key={left} style={{ position: 'absolute', top: '10%', bottom: '10%', left: `${left}%`, width: '1px', background: '#C96A48' }} />
                  ))}
                </div>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: `${T}0.15)`, border: `2px solid ${T}0.35)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 1,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#C96A48', marginLeft: 4 }}>play_arrow</span>
                </div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: textMuted40, position: 'relative', zIndex: 1 }}>
                  Demo video coming soon
                </p>
                <p style={{ fontSize: '0.75rem', color: textMuted30, position: 'relative', zIndex: 1, maxWidth: 260, textAlign: 'center', lineHeight: 1.6 }}>
                  Record with <strong style={{ color: textMuted40 }}>Cmd+Shift+5</strong> or Loom, then set <code style={{ fontSize: '0.7rem', padding: '1px 5px', background: `${T}0.1)`, borderRadius: 4, color: '#C96A48' }}>DEMO_VIDEO_URL</code>
                </p>
              </div>
            )}
          </div>

          {/* Timestamp chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            {DEMO_TIMESTAMPS.map(ts => (
              <span key={ts.time} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: '999px',
                border: `1px solid ${T}0.2)`, background: `${T}0.06)`,
                fontSize: '0.78rem', color: textMuted55, fontWeight: 500,
              }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#C96A48', fontWeight: 700, fontSize: '0.72rem' }}>{ts.time}</span>
                {ts.label}
              </span>
            ))}
          </div>
        </section>

        {/* ── FEATURES BENTO GRID ── */}
        <section className="max-w-7xl mx-auto px-6 py-32">
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

            {/* Large card — Predictive Path */}
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

            {/* Small card — Cognitive Mapping */}
            {[
              { title: 'Cognitive Mapping',    icon: 'account_tree', desc: 'Hierarchical visualization that adapts to your mental model of the codebase.' },
              { title: 'Memory Insight',       icon: 'memory',       desc: 'Real-time heap & stack allocation tracking with visual pointer arithmetic and buffer boundaries.' },
              { title: 'Concurrency Mapping',  icon: 'lan',          desc: 'Visualize thread lifecycles, mutex locks, and synchronization points in a temporal graph.' },
              { title: 'Sub-200ms Analysis',   icon: 'speed',        desc: 'Lightning-fast trace analysis with streaming output for instant feedback loops.' },
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

            {/* Large card — AI Explanation */}
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

        {/* ── HOW IT WORKS ── */}
        <section className="max-w-6xl mx-auto px-6 py-28 border-t" style={{ borderColor: border09 }}>
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

                {/* ── Step 3 only: mini animated flow graph ── */}
                {i === 2 && (() => {
                  // Node centers in SVG coordinate space (viewBox 0 0 240 188)
                  const MN = [
                    { id: 'main',    label: 'main()',    type: 'ENTRY', cx: 120, cy: 28,  hw: 36, hh: 11, color: '#C96A48', rgb: '201,106,72' },
                    { id: 'fetch',   label: 'fetch()',   type: 'CALL',  cx: 58,  cy: 82,  hw: 30, hh: 11, color: '#8B3E24', rgb: '139,62,36' },
                    { id: 'loop',    label: 'for(…)',    type: 'LOOP',  cx: 182, cy: 82,  hw: 30, hh: 11, color: '#B85A38', rgb: '184,90,56' },
                    { id: 'process', label: 'process()', type: 'CALL',  cx: 182, cy: 136, hw: 30, hh: 11, color: '#8B3E24', rgb: '139,62,36' },
                    { id: 'ret',     label: 'return 0',  type: 'EXIT',  cx: 120, cy: 170, hw: 36, hh: 11, color: '#22c55e', rgb: '34,197,94' },
                  ];
                  // Edges as [fromIdx, toIdx]
                  const ME = [[0,1],[0,2],[1,4],[2,3],[3,4]];
                  const ec = dark ? 'rgba(232,226,217,0.16)' : 'rgba(100,70,40,0.18)';
                  const nb = dark ? '#1E1A17' : '#FFFAF6';
                  const nb2 = dark ? 'rgba(232,226,217,0.14)' : 'rgba(201,106,72,0.22)';
                  const tc = dark ? '#E8E2D9' : '#1A1310';
                  return (
                    <div style={{
                      margin: '20px auto 0',
                      width: '100%', maxWidth: '240px',
                      borderRadius: '14px', overflow: 'hidden',
                      border: `1px solid ${T}0.18)`,
                      background: dark ? 'rgba(20,18,16,0.75)' : 'rgba(242,237,231,0.85)',
                      boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 8px 28px rgba(100,70,40,0.10)',
                    }}>
                      {/* toolbar */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px',
                        borderBottom: `1px solid ${T}0.12)`,
                        background: dark ? 'rgba(28,25,23,0.92)' : 'rgba(252,250,247,0.92)',
                      }}>
                        {['#ff5f57','#febc2e','#28c840'].map(c => (
                          <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
                        ))}
                        <span style={{ marginLeft: 4, fontSize: '9px', fontWeight: 700, color: textMuted38, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Flow Graph
                        </span>
                      </div>

                      {/* Pure-SVG graph — viewBox keeps every node exactly placed */}
                      <svg width="100%" viewBox="0 0 240 188" style={{ display: 'block' }}>
                        <defs>
                          <marker id="lp-arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                            <path d="M0,0 L5,2.5 L0,5 z" fill={ec} />
                          </marker>
                          <marker id="lp-arr-a" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                            <path d="M0,0 L5,2.5 L0,5 z" fill="rgba(201,106,72,0.75)" />
                          </marker>
                        </defs>

                        {/* Edges */}
                        {ME.map(([fi, ti], ei) => {
                          const f = MN[fi], t = MN[ti];
                          const active = fi === activeNodeIdx || ti === activeNodeIdx;
                          const x1 = f.cx, y1 = f.cy + f.hh + 1;
                          const x2 = t.cx, y2 = t.cy - t.hh - 5;
                          const my = (y1 + y2) / 2;
                          return (
                            <path key={ei}
                              d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
                              fill="none"
                              stroke={active ? 'rgba(201,106,72,0.72)' : ec}
                              strokeWidth={active ? 1.6 : 1}
                              strokeDasharray={active ? 'none' : '5 3'}
                              markerEnd={active ? 'url(#lp-arr-a)' : 'url(#lp-arr)'}
                              style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
                            />
                          );
                        })}

                        {/* Nodes */}
                        {MN.map((node, ni) => {
                          const active = ni === activeNodeIdx;
                          return (
                            <g key={node.id} style={{ transition: 'all 0.4s' }}>
                              {active && (
                                <rect
                                  x={node.cx - node.hw - 3} y={node.cy - node.hh - 3}
                                  width={(node.hw + 3) * 2} height={(node.hh + 3) * 2}
                                  rx={8} fill={`rgba(${node.rgb},0.12)`}
                                />
                              )}
                              <rect
                                x={node.cx - node.hw} y={node.cy - node.hh}
                                width={node.hw * 2} height={node.hh * 2}
                                rx={5}
                                fill={active ? node.color : nb}
                                stroke={active ? node.color : nb2}
                                strokeWidth={active ? 1.5 : 1}
                              />
                              <text
                                x={node.cx} y={node.cy + 3.5}
                                textAnchor="middle" dominantBaseline="middle"
                                fontSize={8.5} fontWeight={active ? 700 : 500}
                                fontFamily="Space Grotesk, ui-monospace, monospace"
                                fill={active ? '#fff' : tc}
                                style={{ transition: 'fill 0.4s' }}
                              >
                                {node.label}
                              </text>
                              {active && (
                                <text
                                  x={node.cx} y={node.cy + node.hh + 8}
                                  textAnchor="middle"
                                  fontSize={6.5} fontWeight={700}
                                  fontFamily="Space Grotesk, monospace"
                                  fill={node.color}
                                  letterSpacing="0.06em"
                                >
                                  {node.type}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>

                      {/* Progress dots */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        padding: '6px 10px',
                        borderTop: `1px solid ${T}0.10)`,
                      }}>
                        {MN.map((_, ni) => (
                          <div key={ni} style={{
                            width: ni === activeNodeIdx ? 14 : 5, height: 5, borderRadius: 3,
                            background: ni === activeNodeIdx ? '#C96A48' : (dark ? 'rgba(232,226,217,0.18)' : 'rgba(100,70,40,0.18)'),
                            transition: 'all 0.35s ease',
                          }} />
                        ))}
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

          {/* Demo window */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ borderColor: border14, background: 'var(--bg-card)', boxShadow: dark ? '0 32px 80px rgba(232,226,217,0.05), 0 0 0 1px rgba(232,226,217,0.04)' : '0 32px 80px rgba(100,70,40,0.12), 0 0 0 1px rgba(100,70,40,0.06)' }}>
            {/* Window chrome */}
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

            {/* Split pane */}
            <div className="flex flex-col md:flex-row h-[520px]">
              {/* Code editor — light theme matching the app */}
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

              {/* Graph panel — keep subtle warm bg */}
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

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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

              <div className="flex flex-wrap items-center justify-center gap-10 mt-16 pt-14 border-t" style={{ borderColor: border10 }}>
                {[
                  { value: '50k+',    label: 'Traces Analyzed' },
                  { value: '< 200ms', label: 'Avg. Analysis' },
                  { value: '4',       label: 'Languages' },
                  { value: '99.9%',   label: 'Uptime' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl font-extrabold mb-1" style={{ color: '#C96A48', fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</div>
                    <div className="text-xs uppercase tracking-widest font-bold" style={{ color: textMuted38 }}>{s.label}</div>
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
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      aria-label={s.label} className="social-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{s.icon}</span>
                    </a>
                  ) : (
                    <button key={s.label} type="button" aria-label={s.label} className="social-icon"
                      onClick={s.onClick}>
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
