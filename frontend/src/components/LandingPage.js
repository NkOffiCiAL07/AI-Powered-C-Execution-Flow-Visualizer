import React, { useState, useEffect } from 'react';
import LoginModal from './LoginModal';

const MARQUEE_ITEMS = [
  'C/C++ Support', 'AI-Powered Analysis', 'Sub-200ms Traces', 'Memory Leak Detection',
  'Thread Visualization', 'Open Source Core', 'Zero Config Setup', 'CI/CD Integration',
];

const STEPS = [
  {
    icon: 'code',
    n: '01',
    title: 'Write Your C++ Code',
    desc: 'Use the built-in editor with full syntax highlighting and instant error feedback.',
  },
  {
    icon: 'play_circle',
    n: '02',
    title: 'Run Traceon Analysis',
    desc: 'Our engine compiles, instruments, and traces your code in under 200ms.',
  },
  {
    icon: 'hub',
    n: '03',
    title: 'Explore the Flow Graph',
    desc: 'Navigate execution interactively. Click any node for deep-dive AI explanations.',
  },
];

const STATS = [
  { value: '12.4k', label: 'GitHub Stars', icon: 'star' },
  { value: '< 200ms', label: 'Avg. Analysis', icon: 'speed' },
  { value: '50k+', label: 'Traces Run', icon: 'analytics' },
  { value: '99.9%', label: 'Uptime SLA', icon: 'verified' },
];

const CODE_LINES = [
  { n: 1, parts: [{ t: '#include', c: '#818cf8' }, { t: ' <iostream>', c: '#5eead4' }] },
  { n: 2, parts: [] },
  { n: 3, parts: [{ t: 'int ', c: '#c084fc' }, { t: 'main', c: '#fcd34d' }, { t: '() {', c: '#e5e1e4' }], active: true },
  { n: 4, parts: [{ t: '  auto ', c: '#c084fc' }, { t: 'data', c: '#e5e1e4' }, { t: ' = ', c: '#94a3b8' }, { t: 'fetch_nodes', c: '#fcd34d' }, { t: '();', c: '#e5e1e4' }] },
  { n: 5, parts: [{ t: '  ', c: '' }, { t: 'for', c: '#818cf8' }, { t: '(auto& n : data) {', c: '#e5e1e4' }] },
  { n: 6, parts: [{ t: '    process', c: '#fcd34d' }, { t: '(n);', c: '#e5e1e4' }] },
  { n: 7, parts: [{ t: '  }', c: '#94a3b8' }] },
  { n: 8, parts: [{ t: '  return ', c: '#818cf8' }, { t: '0', c: '#fcd34d' }, { t: ';', c: '#e5e1e4' }] },
  { n: 9, parts: [{ t: '}', c: '#94a3b8' }] },
];

const GRAPH_NODES = [
  { id: 'main',    label: 'main()',        type: 'ENTRY',  x: 50, y: 14, color: '#a855f7', rgb: '168,85,247' },
  { id: 'fetch',   label: 'fetch_nodes()', type: 'CALL',   x: 24, y: 40, color: '#6366f1', rgb: '99,102,241' },
  { id: 'loop',    label: 'for(…)',        type: 'LOOP',   x: 74, y: 40, color: '#8b5cf6', rgb: '139,92,246' },
  { id: 'process', label: 'process(n)',   type: 'CALL',   x: 74, y: 66, color: '#7c3aed', rgb: '124,58,237' },
  { id: 'ret',     label: 'return 0',     type: 'EXIT',   x: 50, y: 86, color: '#22c55e', rgb: '34,197,94' },
];

const GRAPH_EDGES = [
  { x1: '50%', y1: '19%', x2: '24%', y2: '36%' },
  { x1: '50%', y1: '19%', x2: '74%', y2: '36%' },
  { x1: '24%', y1: '44%', x2: '50%', y2: '82%' },
  { x1: '74%', y1: '44%', x2: '74%', y2: '62%' },
  { x1: '74%', y1: '70%', x2: '50%', y2: '82%' },
];

const FOOTER_COLS = [
  { title: 'Product',   links: ['Features', 'Docs', 'Changelog', 'Roadmap'] },
  { title: 'Resources', links: ['Blog', 'Tutorials', 'Examples', 'API Reference'] },
  { title: 'Company',   links: ['About', 'Community', 'Pricing', 'Contact'] },
];

const LandingPage = ({ onStart, onSwitchView, onLogin }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const launch = () => setIsLoginOpen(true);

  return (
    <div className="bg-background text-on-surface min-h-screen relative overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── NAVBAR ── */}
      <header
        className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ background: 'rgba(19,19,21,0.88)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex justify-between items-center px-6 md:px-12 h-16 w-full max-w-7xl mx-auto">
          {/* Logo */}
          <button className="flex items-center gap-3" onClick={() => onSwitchView('landing')}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)', boxShadow: '0 0 18px rgba(168,85,247,0.4)' }}
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>terminal</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Traceon</span>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {[['Home', 'landing'], ['Docs', 'docs'], ['Pricing', 'pricing'], ['Community', 'community']].map(([label, view]) => (
              <button
                key={label}
                className="nav-link"
                onClick={() => onSwitchView(view)}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            <button
              className="nav-link hidden md:block"
              onClick={launch}
            >
              Sign In
            </button>
            <button
              className="cta-primary px-5 py-2 rounded-lg text-sm font-bold"
              onClick={launch}
            >
              Launch App
            </button>
          </div>
        </div>
      </header>

      <main>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16 overflow-hidden">
          {/* Background atmosphere */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="cyber-grid absolute inset-0 opacity-25" />
            <div
              className="absolute rounded-full blur-[140px] animate-float-orb"
              style={{ width: 560, height: 560, top: '10%', left: '20%', background: 'radial-gradient(circle,rgba(168,85,247,0.22) 0%,transparent 70%)' }}
            />
            <div
              className="absolute rounded-full blur-[120px] animate-float-orb"
              style={{ width: 440, height: 440, bottom: '15%', right: '15%', background: 'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)', animationDelay: '2s' }}
            />
            <div
              className="absolute rounded-full blur-[180px]"
              style={{ width: 700, height: 700, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 60%)' }}
            />
          </div>

          {/* Content */}
          <div
            className="relative z-10 max-w-4xl mx-auto"
            style={{ transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)', opacity: heroReady ? 1 : 0, transform: heroReady ? 'translateY(0)' : 'translateY(28px)' }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 cursor-default select-none"
              style={{ background: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse-ring" style={{ background: '#a855f7', flexShrink: 0 }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#c084fc' }}>
                Alpha Release — Early Access
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-extrabold mb-6 leading-tight"
              style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em', color: '#fff' }}
            >
              See Your Code's{' '}
              <span className="gradient-text">Narrative</span>
            </h1>

            {/* Subtitle */}
            <p
              className="mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', color: '#988d9f' }}
            >
              Transform complex C/C++ execution paths into intuitive, high-fidelity visual graphs.
              Debug with precision using{' '}
              <span style={{ color: '#c084fc' }}>AI-driven flow analysis</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={launch}
                className="cta-primary flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm w-full sm:w-auto justify-center"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
                Start Visualizing — Free
              </button>
              <button
                onClick={onStart}
                className="cta-secondary flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm w-full sm:w-auto justify-center"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                View Demo
              </button>
            </div>

            {/* Inline stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {STATS.map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-2xl font-extrabold" style={{ color: '#ddb7ff', fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</span>
                  <span className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: '#3a3343' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 select-none">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#988d9f' }}>Scroll</span>
            <div className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>
              <div className="w-1 h-2.5 rounded-full animate-scroll-bounce" style={{ background: '#a855f7' }} />
            </div>
          </div>
        </section>

        {/* ── MARQUEE BELT ── */}
        <div
          className="w-full py-5 border-y overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.012)' }}
        >
          <div className="flex animate-marquee whitespace-nowrap">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <React.Fragment key={i}>
                <span className="mx-6 text-xs font-bold uppercase tracking-widest" style={{ color: '#3a3343' }}>{item}</span>
                <span style={{ color: '#3a3343' }}>•</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── FEATURES BENTO GRID ── */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4"
              style={{ borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8', background: 'rgba(99,102,241,0.08)' }}>
              Core Capabilities
            </div>
            <h2
              className="font-extrabold text-white mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
            >
              Everything You Need to{' '}
              <span className="gradient-text-alt">Debug Faster</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#988d9f' }}>
              From execution tracing to AI-driven explanations, Traceon is your complete debugging intelligence platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Large card — Predictive Path */}
            <div
              className="md:col-span-2 p-8 rounded-2xl border relative overflow-hidden landing-card"
              style={{ background: 'rgba(168,85,247,0.04)', borderColor: 'rgba(168,85,247,0.14)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.42)'; e.currentTarget.style.background = 'rgba(168,85,247,0.08)'; e.currentTarget.style.boxShadow = '0 24px 64px rgba(0,0,0,0.45), 0 0 32px rgba(168,85,247,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.14)'; e.currentTarget.style.background = 'rgba(168,85,247,0.04)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="absolute top-0 right-0 w-56 h-56 rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(168,85,247,0.12)' }} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#a855f7', fontSize: '24px' }}>troubleshoot</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Predictive Path Analysis</h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#988d9f' }}>
                  Leverage Traceon's LLM-assisted forecasting to identify potential race conditions and memory leaks before they occur in production. Get probabilistic hotspot detection on complex codebases.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Race Conditions', 'Memory Leaks', 'Deadlock Detection'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold border"
                      style={{ color: '#a855f7', borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.1)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Small card — Cognitive Mapping */}
            <div
              className="p-6 rounded-2xl border relative overflow-hidden landing-card"
              style={{ background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.14)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.42)'; e.currentTarget.style.background = 'rgba(99,102,241,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.14)'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none" style={{ background: 'rgba(99,102,241,0.14)' }} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#6366f1', fontSize: '20px' }}>account_tree</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Cognitive Mapping</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#988d9f' }}>Hierarchical visualization that adapts to your mental model of the codebase.</p>
              </div>
            </div>

            {/* Small card — Memory Insight */}
            <div
              className="p-6 rounded-2xl border relative overflow-hidden landing-card"
              style={{ background: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.14)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.42)'; e.currentTarget.style.background = 'rgba(139,92,246,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.14)'; e.currentTarget.style.background = 'rgba(139,92,246,0.04)'; }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none" style={{ background: 'rgba(139,92,246,0.14)' }} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#8b5cf6', fontSize: '20px' }}>memory</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Memory Insight</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#988d9f' }}>Real-time heap & stack allocation tracking with visual pointer arithmetic and buffer boundaries.</p>
              </div>
            </div>

            {/* Small card — Concurrency */}
            <div
              className="p-6 rounded-2xl border relative overflow-hidden landing-card"
              style={{ background: 'rgba(124,58,237,0.04)', borderColor: 'rgba(124,58,237,0.14)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.42)'; e.currentTarget.style.background = 'rgba(124,58,237,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.14)'; e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#7c3aed', fontSize: '20px' }}>lan</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Concurrency Mapping</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#988d9f' }}>Visualize thread lifecycles, mutex locks, and synchronization points in a temporal graph.</p>
              </div>
            </div>

            {/* Small card — Speed */}
            <div
              className="p-6 rounded-2xl border relative overflow-hidden landing-card"
              style={{ background: 'rgba(34,197,94,0.04)', borderColor: 'rgba(34,197,94,0.14)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.42)'; e.currentTarget.style.background = 'rgba(34,197,94,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.14)'; e.currentTarget.style.background = 'rgba(34,197,94,0.04)'; }}
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#22c55e', fontSize: '20px' }}>speed</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Sub-200ms Analysis</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#988d9f' }}>Lightning-fast trace analysis with streaming output for instant feedback loops.</p>
              </div>
            </div>

            {/* Large card — AI Explanation */}
            <div
              className="md:col-span-2 p-8 rounded-2xl border relative overflow-hidden landing-card"
              style={{ background: 'rgba(192,132,252,0.04)', borderColor: 'rgba(192,132,252,0.14)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(192,132,252,0.42)'; e.currentTarget.style.background = 'rgba(192,132,252,0.08)'; e.currentTarget.style.boxShadow = '0 24px 64px rgba(0,0,0,0.45), 0 0 32px rgba(192,132,252,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(192,132,252,0.14)'; e.currentTarget.style.background = 'rgba(192,132,252,0.04)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="absolute top-0 left-0 w-56 h-56 rounded-full blur-[90px] pointer-events-none" style={{ background: 'rgba(192,132,252,0.12)' }} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(192,132,252,0.18)', border: '1px solid rgba(192,132,252,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#c084fc', fontSize: '24px' }}>psychology</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Code Explanation</h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#988d9f' }}>
                  Instant AI-generated summaries, Big-O complexity analysis, and optimization hints powered by advanced language models. Understand any execution path at a glance, no expertise required.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Big-O Analysis', 'Optimization Tips', 'Code Summaries'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold border"
                      style={{ color: '#c084fc', borderColor: 'rgba(192,132,252,0.3)', background: 'rgba(192,132,252,0.1)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section
          className="max-w-6xl mx-auto px-6 py-28 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4"
              style={{ borderColor: 'rgba(168,85,247,0.3)', color: '#a855f7', background: 'rgba(168,85,247,0.08)' }}>
              Simple Workflow
            </div>
            <h2
              className="font-extrabold text-white mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
            >
              From Code to Insight in{' '}
              <span className="gradient-text">3 Steps</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#988d9f' }}>
              No configuration required. Traceon integrates directly into your dev workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute"
              style={{
                top: 40, left: '20%', right: '20%', height: 1,
                background: 'linear-gradient(90deg,transparent,rgba(168,85,247,0.4),rgba(99,102,241,0.4),transparent)',
              }}
            />

            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="relative mb-8">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center step-icon"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#a855f7', fontSize: '32px' }}>{step.icon}</span>
                  </div>
                  <div
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)', color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#988d9f' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── LIVE DEMO PREVIEW ── */}
        <section
          className="max-w-7xl mx-auto px-6 py-28 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4"
              style={{ borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}>
              Live Preview
            </div>
            <h2
              className="font-extrabold text-white mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
            >
              Execution Graph{' '}
              <span className="gradient-text-alt">Visualizer</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#988d9f' }}>
              Synchronized source-to-flow mapping for deep architectural inspection.
            </p>
          </div>

          {/* Demo window */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              borderColor: 'rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.01)',
              boxShadow: '0 48px 120px rgba(0,0,0,0.65), 0 0 48px rgba(168,85,247,0.07)',
            }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center gap-2 px-6 py-3.5 border-b"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444', opacity: 0.7 }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b', opacity: 0.7 }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e', opacity: 0.7 }} />
              <div
                className="ml-4 px-4 py-1 rounded border text-xs"
                style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#4d4354', background: 'rgba(255,255,255,0.02)', fontFamily: 'JetBrains Mono, monospace' }}
              >
                traceon — main.cpp
              </div>
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ animation: 'pulse 2s infinite' }} />
                Analysis Running
              </div>
            </div>

            {/* Split pane */}
            <div className="flex flex-col md:flex-row h-[520px]">

              {/* Code editor */}
              <div
                className="w-full md:w-2/5 flex flex-col border-b md:border-b-0 md:border-r"
                style={{ background: '#0d0d12', borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-b text-xs font-bold"
                  style={{ borderColor: 'rgba(255,255,255,0.05)', color: '#4d4354' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#6366f1' }}>code</span>
                  main.cpp
                  <span className="ml-auto px-2 py-0.5 rounded text-[10px]"
                    style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                    C++17
                  </span>
                </div>
                <div className="flex-1 p-4 overflow-hidden" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', lineHeight: '1.7' }}>
                  {CODE_LINES.map((line, i) => (
                    <div
                      key={i}
                      className="flex gap-3 px-2 rounded transition-all duration-300"
                      style={{ background: line.active ? 'rgba(168,85,247,0.1)' : 'transparent' }}
                    >
                      <span
                        className="w-5 text-right select-none shrink-0 text-xs"
                        style={{ color: line.active ? '#a855f7' : '#2e2a35', paddingTop: '1px' }}
                      >
                        {line.n}
                      </span>
                      <span>
                        {line.parts.length === 0
                          ? <span>&nbsp;</span>
                          : line.parts.map((p, j) => <span key={j} style={{ color: p.c }}>{p.t}</span>)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graph panel */}
              <div className="flex-1 relative overflow-hidden" style={{ background: '#08080e' }}>
                {/* Dot grid */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(168,85,247,0.18) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                    opacity: 0.5,
                  }}
                />

                {/* SVG edges */}
                <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                  <defs>
                    <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                      <polygon points="0 0,8 3,0 6" fill="rgba(168,85,247,0.55)" />
                    </marker>
                    <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  {GRAPH_EDGES.map((e, i) => (
                    <line
                      key={i}
                      x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                      stroke="url(#lg1)"
                      strokeWidth="1.5"
                      markerEnd="url(#arr)"
                      className="edge-animated"
                      style={{ animationDelay: `${i * 0.4}s` }}
                    />
                  ))}
                </svg>

                {/* Graph nodes */}
                {GRAPH_NODES.map((node) => (
                  <div
                    key={node.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 graph-node"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    onMouseEnter={e => { e.currentTarget.querySelector('.node-box').style.boxShadow = `0 0 28px rgba(${node.rgb},0.45)`; e.currentTarget.querySelector('.node-box').style.borderColor = `rgba(${node.rgb},0.8)`; }}
                    onMouseLeave={e => { e.currentTarget.querySelector('.node-box').style.boxShadow = `0 0 18px rgba(${node.rgb},0.2)`; e.currentTarget.querySelector('.node-box').style.borderColor = `rgba(${node.rgb},0.35)`; }}
                  >
                    <div
                      className="node-box px-4 py-2.5 rounded-xl border text-center"
                      style={{
                        background: `rgba(${node.rgb},0.1)`,
                        borderColor: `rgba(${node.rgb},0.35)`,
                        boxShadow: `0 0 18px rgba(${node.rgb},0.2)`,
                        transition: 'all 0.2s ease',
                        minWidth: '90px',
                      }}
                    >
                      <div className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: node.color }}>{node.type}</div>
                      <div className="text-xs font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{node.label}</div>
                    </div>
                  </div>
                ))}

                {/* Scan overlay */}
                <div className="absolute inset-0 scan-effect pointer-events-none opacity-40" />
              </div>
            </div>
          </div>
        </section>

        {/* ── OPEN SOURCE / COMMUNITY CTA ── */}
        <section
          className="max-w-7xl mx-auto px-6 py-28 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <div
            className="relative rounded-3xl px-10 py-20 md:px-24 text-center overflow-hidden border"
            style={{ background: 'rgba(168,85,247,0.04)', borderColor: 'rgba(168,85,247,0.14)' }}
          >
            {/* Orbs */}
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[130px] pointer-events-none" style={{ background: 'rgba(168,85,247,0.16)' }} />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[130px] pointer-events-none" style={{ background: 'rgba(99,102,241,0.12)' }} />
            {/* Grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'linear-gradient(rgba(168,85,247,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.06) 1px,transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-6"
                style={{ borderColor: 'rgba(168,85,247,0.3)', color: '#a855f7', background: 'rgba(168,85,247,0.1)' }}>
                Open Source
              </div>
              <h2
                className="font-extrabold text-white mb-6"
                style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em', lineHeight: 1.1 }}
              >
                Open Core.{' '}
                <span className="gradient-text">Community Driven.</span>
              </h2>
              <p
                className="max-w-2xl mx-auto mb-12 leading-relaxed"
                style={{ fontSize: '1.125rem', color: '#988d9f' }}
              >
                Transparent Traceon algorithms for a transparent future. Join{' '}
                <strong style={{ color: '#ddb7ff' }}>12,000+</strong> engineers building the next generation of C++ debugging tools.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  className="ghost-btn flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#a855f7' }}>star</span>
                  Star on GitHub
                  <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <span style={{ color: '#ddb7ff', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>12.4k</span>
                </button>
                <button
                  className="cta-primary flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm"
                  onClick={launch}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>rocket_launch</span>
                  Start for Free
                </button>
              </div>

              {/* Mini stats */}
              <div
                className="flex flex-wrap items-center justify-center gap-10 mt-16 pt-14 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                {[
                  { value: '12.4k', label: 'GitHub Stars' },
                  { value: '50k+', label: 'Traces Analyzed' },
                  { value: '< 200ms', label: 'Avg. Analysis' },
                  { value: '99.9%', label: 'Uptime' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="text-3xl font-extrabold mb-1"
                      style={{ color: '#ddb7ff', fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      {s.value}
                    </div>
                    <div className="text-xs uppercase tracking-widest font-bold" style={{ color: '#3a3343' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer
        className="border-t py-16"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-14">
            {/* Brand column */}
            <div className="col-span-2">
              <button className="flex items-center gap-3 mb-4" onClick={() => onSwitchView('landing')}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }}
                >
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>terminal</span>
                </div>
                <span className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Traceon</span>
              </button>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#3a3343', maxWidth: 280 }}>
                The AI-powered C/C++ execution flow visualizer for engineers who demand precision.
              </p>
              <div className="flex gap-2.5">
                {[
                  { icon: 'terminal', label: 'GitHub' },
                  { icon: 'description', label: 'Docs' },
                  { icon: 'group', label: 'Community' },
                  { icon: 'mail', label: 'Email' },
                ].map((s) => (
                  <a key={s.label} href="#0" aria-label={s.label} className="social-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{s.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#3a3343' }}>{col.title}</div>
                <ul className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#0" className="footer-link">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: '#2e2a35', fontFamily: 'JetBrains Mono, monospace' }}
            >
              © 2025 TRACEON SYSTEMS. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                <a key={link} href="#0" className="text-xs transition-colors" style={{ color: '#2e2a35' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#988d9f'}
                  onMouseLeave={e => e.currentTarget.style.color = '#2e2a35'}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Fixed atmosphere */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 rounded-full blur-[220px]"
          style={{ width: 800, height: 800, background: 'rgba(168,85,247,0.055)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 rounded-full blur-[200px]"
          style={{ width: 640, height: 640, background: 'rgba(99,102,241,0.045)' }}
        />
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={onLogin} />
    </div>
  );
};

export default LandingPage;
