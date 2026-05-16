import React from 'react';

const NAV = [
  { group: 'Getting Started', items: [
    { id: 'introduction', label: 'Introduction' },
    { id: 'installation', label: 'Installation' },
    { id: 'quick-start', label: 'Quick Start' },
  ]},
  { group: 'Core Concepts', items: [
    { id: 'execution-flow', label: 'Execution Flow' },
    { id: 'variable-tracking', label: 'Variable Tracking' },
    { id: 'ai-insights', label: 'AI Insights' },
  ]},
  { group: 'Reference', items: [
    { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts' },
    { id: 'api', label: 'API Reference' },
    { id: 'faq', label: 'FAQ' },
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

const CodeBlock = ({ children }) => (
  <pre style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px',
    padding: '16px 20px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px',
    lineHeight: '1.7', color: 'var(--text-primary)', overflowX: 'auto', margin: '12px 0'
  }}>{children}</pre>
);

const Note = ({ children }) => (
  <div style={{
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderLeft: '3px solid var(--primary)', borderRadius: '8px',
    padding: '14px 18px', fontSize: '0.875rem', color: 'rgba(26,19,16,0.75)',
    lineHeight: '1.6', margin: '16px 0'
  }}>{children}</div>
);

const shortcuts = [
  { key: 'Space', action: 'Play / Pause execution' },
  { key: '→ / N', action: 'Step to next line' },
  { key: '← / B', action: 'Step back to previous line' },
  { key: 'F', action: 'Step into function call' },
  { key: 'Esc', action: 'Reset visualizer' },
];

const DocsPage = () => (
  <div className="landing-root" style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '72px 0 80px' }}>
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
                        fontSize: '0.875rem', color: 'rgba(26,19,16,0.6)', textAlign: 'left',
                        transition: 'color 0.15s', width: '100%'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,19,16,0.6)'}
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
        <p style={{ color: 'rgba(26,19,16,0.5)', fontSize: '0.95rem', marginBottom: '48px', lineHeight: '1.6' }}>
          Everything you need to get started with Traceon.
        </p>

        <Section id="introduction" title="Introduction">
          <p style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75', marginBottom: '14px' }}>
            Traceon is a C/C++ execution flow visualizer that bridges the gap between raw source code and your mental model of how it runs. It uses LLDB and Gemini AI to trace, snapshot, and explain every step of your program's execution.
          </p>
          <Note>Traceon currently supports C and C++ programs compiled with Clang. GCC support is on the roadmap.</Note>
        </Section>

        <Section id="installation" title="Installation">
          <p style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75', marginBottom: '12px' }}>Clone the repository and set up the Python virtual environment:</p>
          <CodeBlock>{`git clone https://github.com/NkOffiCiAL07/AI-Powered-C-Execution-Flow-Visualizer.git
cd AI-Powered-C-Execution-Flow-Visualizer
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt`}</CodeBlock>
          <p style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75', marginTop: '12px' }}>Create a <code style={{ background: 'var(--bg-card)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85em' }}>.env</code> file in the project root:</p>
          <CodeBlock>{`GEMINI_API_KEY=your_key_from_aistudio.google.com`}</CodeBlock>
        </Section>

        <Section id="quick-start" title="Quick Start">
          <p style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75', marginBottom: '12px' }}>Start both servers:</p>
          <CodeBlock>{`# Backend (port 8000)
python run_server.py

# Frontend (port 3000) — in a separate terminal
cd frontend && npm install && npm start`}</CodeBlock>
          <p style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75', marginTop: '12px' }}>Open <strong>http://localhost:3000</strong>, paste your C++ code, and click <strong>Analyze &amp; Run</strong>.</p>
        </Section>

        <Section id="execution-flow" title="Execution Flow">
          <p style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75', marginBottom: '14px' }}>
            The Execution Flow tab shows a step-by-step trace of your program. Each step captures the current line, all live variables, the call stack, and any stdout output at that moment.
          </p>
          <p style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75' }}>
            Use the playback controls at the bottom of the panel — or keyboard shortcuts — to navigate through the trace at your own pace.
          </p>
        </Section>

        <Section id="variable-tracking" title="Variable Tracking">
          <p style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75' }}>
            The Variable Tracker panel shows every in-scope variable at the current execution step. Variables that changed since the last step are highlighted. Primitive types, arrays, and structs are all supported.
          </p>
        </Section>

        <Section id="ai-insights" title="AI Insights">
          <p style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75', marginBottom: '14px' }}>
            Click <strong>Explain Code</strong> in the header to get a Gemini-powered analysis of your code. The AI returns:
          </p>
          <ul style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>A plain-English overview of what the code does</li>
            <li>Time complexity with justification</li>
            <li>Space complexity with justification</li>
            <li>3–5 key technical observations</li>
          </ul>
          <Note>Requires a valid <code style={{ fontFamily: 'monospace' }}>GEMINI_API_KEY</code> from aistudio.google.com. Without a key, a static analysis fallback is used.</Note>
        </Section>

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
                  fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600', minWidth: '40px', textAlign: 'center'
                }}>{s.key}</kbd>
                <span style={{ fontSize: '0.875rem', color: 'rgba(26,19,16,0.7)' }}>{s.action}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="api" title="API Reference">
          <p style={{ color: 'rgba(26,19,16,0.7)', lineHeight: '1.75', marginBottom: '12px' }}>The FastAPI backend exposes the following endpoints at <code style={{ fontFamily: 'monospace', background: 'var(--bg-card)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.85em' }}>http://localhost:8000</code>:</p>
          {[
            { method: 'POST', path: '/analyze', desc: 'Compile & trace a C++ program, returns session + snapshots' },
            { method: 'POST', path: '/run', desc: 'Compile & run code, returns stdout/stderr' },
            { method: 'POST', path: '/analyze/{id}/step', desc: 'Step forward or backward in a debug session' },
            { method: 'POST', path: '/explain', desc: 'Return AI-powered code explanation (Gemini)' },
            { method: 'GET',  path: '/health', desc: 'Server health check' },
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
              <code style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-primary)', flexShrink: 0, minWidth: '220px' }}>{e.path}</code>
              <span style={{ fontSize: '0.875rem', color: 'rgba(26,19,16,0.6)' }}>{e.desc}</span>
            </div>
          ))}
        </Section>

        <Section id="faq" title="FAQ">
          {[
            { q: 'What languages are supported?', a: 'Currently C and C++ (compiled with Clang). Support for other languages is planned.' },
            { q: 'Does it work without a Gemini API key?', a: 'Yes. Without a key, the AI Insights tab uses a static analysis fallback that estimates complexity from code patterns.' },
            { q: 'Is my code sent to a server?', a: 'Your code is sent to the local backend (port 8000) for compilation and tracing. If Gemini is enabled, the code is also sent to Google\'s API for analysis.' },
            { q: 'Can I run it fully offline?', a: 'Yes — remove the GEMINI_API_KEY from .env and the app runs entirely locally with no external calls.' },
          ].map((item, i, arr) => (
            <div key={item.q} style={{ paddingBottom: '18px', marginBottom: '18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', fontSize: '0.95rem' }}>{item.q}</p>
              <p style={{ color: 'rgba(26,19,16,0.65)', lineHeight: '1.65', fontSize: '0.875rem' }}>{item.a}</p>
            </div>
          ))}
        </Section>
      </article>
    </div>
  </div>
);

export default DocsPage;
