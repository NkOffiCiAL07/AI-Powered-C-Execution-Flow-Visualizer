import React from 'react';

const NAV = [
  { group: 'Getting Started', items: [
    { id: 'introduction',  label: 'Introduction' },
    { id: 'quick-start',   label: 'Quick Start' },
    { id: 'languages',     label: 'Supported Languages' },
  ]},
  { group: 'Core Concepts', items: [
    { id: 'execution-flow',    label: 'Execution Flow' },
    { id: 'variable-tracking', label: 'Variable Tracking' },
    { id: 'ai-insights',       label: 'AI Insights' },
    { id: 'memory-map',        label: 'Memory Map' },
  ]},
  { group: 'Reference', items: [
    { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts' },
    { id: 'api',                label: 'API Reference' },
    { id: 'faq',                label: 'FAQ' },
  ]},
];

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const Section = ({ id, title, children }) => (
  <section id={id} style={{ marginBottom: '56px', scrollMarginTop: '80px' }}>
    <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
      {title}
    </h2>
    {children}
  </section>
);

const Note = ({ children }) => (
  <div style={{
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderLeft: '3px solid var(--primary)', borderRadius: '8px',
    padding: '14px 18px', fontSize: '0.875rem', color: 'var(--text-secondary)',
    lineHeight: '1.6', margin: '16px 0'
  }}>{children}</div>
);

const shortcuts = [
  { key: '⌘ + ↵',    action: 'Compile & Run code' },
  { key: '⌘ + ⇧ + E', action: 'Explain code with AI' },
  { key: '⌘ + S',    action: 'Save current file' },
  { key: 'Space',     action: 'Play / Pause execution (debugger)' },
  { key: '→ / N',    action: 'Step to next line' },
  { key: '← / B',    action: 'Step back to previous line' },
  { key: 'F',         action: 'Step into function call' },
  { key: 'Esc',       action: 'Reset visualizer' },
  { key: '?',         action: 'Open keyboard shortcuts panel' },
];

const DocsPage = () => {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '72px 0 80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '48px' }}>

        {/* Sidebar */}
        <aside style={{ width: '200px', flexShrink: 0 }}>
          <nav style={{ position: 'sticky', top: '88px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {NAV.map(group => (
              <div key={group.group}>
                <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--primary)', marginBottom: '10px' }}>
                  {group.group}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {group.items.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollTo(item.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0',
                          fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'left',
                          transition: 'color 0.15s', width: '100%'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >{item.label}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <article style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Documentation
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '48px', lineHeight: '1.6' }}>
            Everything you need to get the most out of Traceon.
          </p>

          {/* ── Introduction ── */}
          <Section id="introduction" title="Introduction">
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', marginBottom: '14px' }}>
              Traceon is an AI-powered execution flow visualizer that bridges the gap between raw source code
              and your mental model of how it actually runs. It compiles, instruments, and traces your program —
              then lets you navigate every step interactively with live variable state, call-stack inspection,
              and on-demand AI explanations.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75' }}>
              The platform runs entirely in the browser. No local installation is required — sign in, write or
              paste your code, and start debugging in seconds.
            </p>
          </Section>

          {/* ── Quick Start ── */}
          <Section id="quick-start" title="Quick Start">
            <ol style={{ color: 'var(--text-secondary)', lineHeight: '1.9', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.925rem' }}>
              <li><strong style={{ color: 'var(--text-primary)' }}>Sign in</strong> — click <em>Launch App</em> on the landing page and authenticate with Google.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Create a project</strong> — from the Dashboard, hit <em>New Project</em> and choose a language.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Write or paste your code</strong> — the editor supports full syntax highlighting and live error checking.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Run it</strong> — press <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '1px 7px', fontFamily: 'monospace', fontSize: '0.8em' }}>⌘↵</kbd> or click the <strong>Run</strong> button to compile and execute.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Debug it</strong> — click <strong>Debug</strong> to launch the step-through execution flow visualizer.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Ask AI</strong> — click <strong>Explain</strong> for a plain-English breakdown including complexity analysis.</li>
            </ol>
            <Note>If your code reads from stdin, enter the input values in the <strong>Program Input</strong> box before running or debugging.</Note>
          </Section>

          {/* ── Supported Languages ── */}
          <Section id="languages" title="Supported Languages">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px', marginTop: '8px' }}>
              {[
                { lang: 'C',      icon: 'code', note: 'C11 · compiled via Clang, traced via LLDB' },
                { lang: 'C++',    icon: 'code', note: 'C++17 · compiled via Clang, traced via LLDB' },
                { lang: 'Python', icon: 'terminal', note: 'Python 3 · traced via sys.settrace' },
                { lang: 'Java',   icon: 'coffee', note: 'Java 17 · compiled via javac' },
              ].map(({ lang, icon, note }) => (
                <div key={lang} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }}>{icon}</span>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '0.95rem' }}>{lang}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: '1.5' }}>{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Execution Flow ── */}
          <Section id="execution-flow" title="Execution Flow">
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', marginBottom: '14px' }}>
              The <strong>Execution Flow</strong> tab shows a step-by-step trace of your program. Each step captures:
            </p>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.75', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              <li>The currently executing line (highlighted in the editor)</li>
              <li>All live variables and their values at that moment</li>
              <li>The full call stack</li>
              <li>Any stdout produced up to that point</li>
            </ul>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75' }}>
              Use the playback controls at the bottom of the panel — or keyboard shortcuts — to navigate through
              the trace at your own pace. You can also jump to any step by clicking a node in the flow graph.
            </p>
            <Note>The debugger requires an active project. Create one from the Dashboard, then open it in the editor to unlock the <strong>Debug</strong> button.</Note>
          </Section>

          {/* ── Variable Tracking ── */}
          <Section id="variable-tracking" title="Variable Tracking">
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', marginBottom: '14px' }}>
              The Variable Tracker panel shows every in-scope variable at the current execution step.
              Variables that changed since the previous step are highlighted in amber — unchanged variables
              are dimmed — making it easy to spot what each line actually did.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75' }}>
              Supported types include primitives, strings, arrays, structs, and pointers. For pointer types,
              the address and dereferenced value are both shown.
            </p>
          </Section>

          {/* ── AI Insights ── */}
          <Section id="ai-insights" title="AI Insights">
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', marginBottom: '14px' }}>
              Click <strong>Explain</strong> in the action bar to get an AI-powered analysis of your code.
              The response includes:
            </p>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.75', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              <li>A plain-English overview of what the code does</li>
              <li>Time complexity with justification (Big-O)</li>
              <li>Space complexity with justification</li>
              <li>3–5 key technical observations and improvement hints</li>
            </ul>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', marginBottom: '14px' }}>
              The <strong>Optimize</strong> button is available after running the debugger. It uses live
              performance data (hotspot lines, execution counts) to produce targeted optimization recommendations.
            </p>
            <Note>AI features require a signed-in account. Guest mode only has access to Run — sign in to unlock Explain, Generate, and Optimize.</Note>
          </Section>

          {/* ── Memory Map ── */}
          <Section id="memory-map" title="Memory Map">
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', marginBottom: '14px' }}>
              The <strong>Memory Map</strong> tab (Memory Spectrometer) renders a real-time view of your
              program's heap and stack allocations as execution progresses. It shows:
            </p>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.75', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Stack frames and their local variables</li>
              <li>Heap-allocated objects with their sizes and addresses</li>
              <li>Pointer relationships visualized as arrows</li>
              <li>Buffer boundaries to catch overflow-prone patterns</li>
            </ul>
          </Section>

          {/* ── Keyboard Shortcuts ── */}
          <Section id="keyboard-shortcuts" title="Keyboard Shortcuts">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              {shortcuts.map((s, i) => (
                <div key={s.key} style={{
                  display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 20px',
                  borderBottom: i < shortcuts.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <kbd style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: '3px 10px', fontFamily: 'monospace',
                    fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600',
                    minWidth: '96px', textAlign: 'center', whiteSpace: 'nowrap', flexShrink: 0
                  }}>{s.key}</kbd>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.action}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── API Reference ── */}
          <Section id="api" title="API Reference">
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', marginBottom: '12px' }}>
              The Traceon backend exposes the following REST endpoints:
            </p>
            {[
              { method: 'POST', path: '/analyze',           desc: 'Compile & trace a program; returns a debug session with execution snapshots' },
              { method: 'POST', path: '/analyze/{id}/step', desc: 'Step forward or backward in an active debug session' },
              { method: 'POST', path: '/run',               desc: 'Compile & run code, returns stdout / stderr / exit code' },
              { method: 'POST', path: '/check',             desc: 'Live syntax check (used for in-editor error highlighting)' },
              { method: 'POST', path: '/generate',          desc: 'Generate code from a natural-language prompt (AI)' },
              { method: 'POST', path: '/explain',           desc: 'Return an AI-powered code explanation with complexity analysis' },
              { method: 'GET',  path: '/health',            desc: 'Server health check' },
            ].map(e => (
              <div key={e.path} style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '12px 0', borderBottom: '1px solid var(--border)'
              }}>
                <span style={{
                  background: e.method === 'GET' ? '#d1fae5' : '#fff0eb',
                  color: e.method === 'GET' ? '#065f46' : 'var(--primary)',
                  fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px',
                  letterSpacing: '0.06em', flexShrink: 0, marginTop: '2px'
                }}>{e.method}</span>
                <code style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-primary)', flexShrink: 0, minWidth: '240px' }}>{e.path}</code>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{e.desc}</span>
              </div>
            ))}
          </Section>

          {/* ── FAQ ── */}
          <Section id="faq" title="FAQ">
            {[
              {
                q: 'What languages are supported?',
                a: 'C, C++, Python, and Java. C/C++ programs are compiled with Clang and debugged via LLDB. Python is traced with sys.settrace. Java is compiled with javac and executed on the JVM.'
              },
              {
                q: 'Do I need an account to use Traceon?',
                a: 'You can try the editor as a guest (Run only). To unlock the step-through debugger, AI Explain, AI Generate, projects, and saved files, you need to sign in with a Google account.'
              },
              {
                q: 'Is my code secure?',
                a: 'Your code is sent to the Traceon backend for compilation and execution in a sandboxed environment. It is used solely to produce the trace results and is not stored beyond your active session unless you explicitly save it to a project.'
              },
              {
                q: 'What are the execution limits?',
                a: 'Debug sessions are capped at 500 steps. Python programs have a 15-second execution timeout. For programs that read from stdin, provide input in the Program Input box before clicking Debug.'
              },
              {
                q: 'How do I report a bug or request a feature?',
                a: 'Reach us at nishantkumar19041@gmail.com. Include a description of the issue, the language, and a minimal code example if possible.'
              },
            ].map((item, i, arr) => (
              <div key={item.q} style={{ paddingBottom: '18px', marginBottom: '18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', fontSize: '0.95rem' }}>{item.q}</p>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.65', fontSize: '0.875rem' }}>{item.a}</p>
              </div>
            ))}
          </Section>
        </article>
      </div>
    </div>
  );
};

export default DocsPage;
