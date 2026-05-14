import React from 'react';

const LandingPage = ({ onStart, onSwitchView }) => {
  return (
    <div className="bg-[#050507] text-on-surface selection:bg-primary/30 min-h-screen relative overflow-x-hidden font-sans">
      {/* Dynamic Background Layer */}
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none"></div>
      
      {/* Immersive Neon Bloom */}
      <div className="fixed top-[-15%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-float pointer-events-none"></div>
      <div className="fixed bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 blur-[150px] rounded-full animate-float pointer-events-none" style={{ animationDelay: '-3s' }}></div>

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#050507]/60 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 w-full max-w-container-max mx-auto relative">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onSwitchView("landing")}>
            <div className="p-2.5 glass-panel rounded-xl group-hover:border-primary/60 transition-all neon-bloom">
              <span className="material-symbols-outlined text-primary text-2xl">terminal</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-white glitch-hover">TRACEON</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            {['Home', 'Docs', 'Pricing', 'Community'].map((item) => (
              <button 
                key={item}
                className={`text-sm font-bold uppercase tracking-widest transition-all hover:text-primary ${item === 'Home' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant'}`}
                onClick={() => onSwitchView(item.toLowerCase() === 'home' ? 'landing' : item.toLowerCase())}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <button className="hidden md:block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-all">
              Sign In
            </button>
            <button className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95 transition-all">
              Launch App
            </button>
          </div>
        </div>
      </header>

      <main className="pt-56 relative z-10">
        {/* Hero Section */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center mb-40">
          <div className="animate-fade-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-3 px-5 py-2 glass-panel rounded-full border border-primary/30 mb-12 cursor-default">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_15px_#ddb7ff]"></span>
              <span className="text-[10px] text-primary uppercase tracking-[0.3em] font-black">System Status: Operational</span>
            </div>
          </div>
          
          <div className="animate-fade-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <h1 className="text-6xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter text-white">
              SEE YOUR CODE'S <br/>
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse-glow">NARRATIVE</span>
            </h1>
          </div>

          <div className="animate-fade-up opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <p className="text-xl md:text-2xl text-on-surface-variant max-w-4xl mx-auto mb-16 leading-relaxed font-medium">
              The world's first <span className="text-white">high-fidelity execution visualizer</span>. 
              Trace complex C++ logic with HUD-grade precision and AI-driven path forecasting.
            </p>
          </div>

          <div className="animate-fade-up opacity-0" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <button 
                onClick={onStart}
                className="group relative bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all hover:bg-primary hover:text-on-primary hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] active:scale-95"
              >
                Start Visualization
              </button>
              <button className="glass-panel text-white border border-white/10 px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all">
                System Demo
              </button>
            </div>
          </div>
        </section>

        {/* Feature Grid with HUD Elements */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[
              { title: "Predictive Pathing", icon: "troubleshoot", color: "#ddb7ff", desc: "LLM-assisted forecasting identifies race conditions and memory leaks before they occur." },
              { title: "Cognitive Mapping", icon: "account_tree", color: "#c0c1ff", desc: "Hierarchical architecture visualization that adapts to your mental model of the codebase." },
              { title: "Memory Insight", icon: "memory", color: "#d2bfe8", desc: "Real-time heap and stack tracking with visual pointers for buffer boundary validation." },
              { title: "Thread Sync", icon: "lan", color: "#ddb7ff", desc: "Visualize thread lifecycles and mutex locks in a synchronized temporal execution graph." }
            ].map((f, i) => (
              <div 
                key={i}
                className="glass-panel p-12 rounded-3xl relative overflow-hidden group"
              >
                {/* HUD Corners */}
                <div className="hud-corner hud-corner-tl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="hud-corner hud-corner-tr opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="hud-corner hud-corner-bl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="hud-corner hud-corner-br opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex items-start gap-8">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center border border-white/5 shadow-inner group-hover:border-primary/40 transition-all">
                    <span className="material-symbols-outlined text-4xl neon-bloom" style={{ color: f.color }}>{f.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-4 tracking-tight uppercase group-hover:text-primary transition-colors">{f.title}</h3>
                    <p className="text-on-surface-variant leading-relaxed text-lg font-medium">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Visualizer Instrument Mockup */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-40">
          <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col h-[800px] scan-effect">
            {/* Instrument Header */}
            <div className="h-16 bg-[#0E0E10] border-b border-white/10 flex items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-error animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-primary/20"></div>
                  <div className="w-3 h-3 rounded-full bg-secondary/20"></div>
                </div>
                <span className="text-[10px] font-black text-on-surface-variant tracking-[0.4em] uppercase">Active Session: TRACE_042</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-[10px] font-mono text-primary/60">FPS: 60.0</div>
                <div className="text-[10px] font-mono text-secondary/60">MEM: 124MB</div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row">
              {/* Sidebar Code */}
              <div className="w-full md:w-80 bg-[#0A0A0C] border-r border-white/5 p-8 font-mono text-xs overflow-hidden">
                <div className="space-y-4 opacity-40">
                  <div className="flex gap-4"><span>01</span><span className="text-secondary">#include &lt;traceon&gt;</span></div>
                  <div className="flex gap-4"><span>02</span><span className="text-white">using namespace flow;</span></div>
                  <div className="flex gap-4 bg-primary/20 -mx-8 px-8 py-2 border-l-4 border-primary opacity-100">
                    <span className="text-primary font-bold">03</span>
                    <span className="text-white font-bold">void engine::init() {'{'}</span>
                  </div>
                  <div className="flex gap-4"><span>04</span><span className="ml-4">process_stream(data);</span></div>
                  <div className="flex gap-4"><span>05</span><span className="ml-4 text-secondary">for</span>(auto& n : buffer)</div>
                  <div className="flex gap-4"><span>06</span><span className="ml-8 text-primary">dispatch(n.id);</span></div>
                </div>
              </div>

              {/* Main Canvas */}
              <div className="flex-1 bg-[#050507] relative p-12 overflow-hidden">
                <div className="absolute inset-0 opacity-20 cyber-grid scale-150 rotate-12"></div>
                {/* SVG Visualizer Flow */}
                <svg className="absolute inset-0 w-full h-full opacity-50">
                  <path className="animate-pulse" d="M 200 400 C 400 200, 600 600, 800 400" fill="transparent" stroke="url(#instr-grad)" strokeWidth="4" strokeDasharray="10 5"></path>
                  <defs>
                    <linearGradient id="instr-grad" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" style={{stopColor:'#ddb7ff',stopOpacity:1}}></stop>
                      <stop offset="100%" style={{stopColor:'#6366f1',stopOpacity:1}}></stop>
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Data Nodes */}
                <div className="absolute top-1/4 left-1/4 glass-panel p-6 rounded-2xl border-primary animate-float">
                  <div className="text-[9px] font-black text-primary uppercase mb-2">Node::Input</div>
                  <div className="text-white font-bold">STREAM_ENTRY</div>
                </div>
                
                <div className="absolute bottom-1/3 right-1/4 glass-panel p-8 rounded-2xl border-secondary scale-125 shadow-2xl">
                  <div className="text-[9px] font-black text-secondary uppercase mb-2">Node::Transform</div>
                  <div className="text-white font-bold mb-3">BUFFER_DISPATCH</div>
                  <div className="flex gap-2">
                    <div className="w-12 h-1 bg-secondary rounded-full opacity-40"></div>
                    <div className="w-8 h-1 bg-secondary rounded-full opacity-20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#050507] py-32 border-t border-white/5">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-start gap-20">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary text-4xl">terminal</span>
              <span className="text-3xl font-black text-white tracking-tighter">TRACEON</span>
            </div>
            <p className="text-on-surface-variant font-medium leading-relaxed">
              Engineering the future of software execution visualization. Built for the next generation of systems architects.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-24">
            {['Product', 'Network', 'Legal'].map((col) => (
              <div key={col} className="space-y-6">
                <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">{col}</h4>
                <ul className="space-y-4">
                  {col === 'Product' && ['Visualizer', 'Docs', 'Pricing'].map(l => <li key={l}><button onClick={() => onSwitchView(l.toLowerCase())} className="text-sm font-bold text-on-surface-variant hover:text-primary transition-all">{l}</button></li>)}
                  {col === 'Network' && ['GitHub', 'Discord', 'Twitter'].map(l => <li key={l}><a href="#" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-all">{l}</a></li>)}
                  {col === 'Legal' && ['Privacy', 'Terms', 'Security'].map(l => <li key={l}><a href="#" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-all">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-32 pt-10 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-40">
          <span>© 2026 TRACEON SYSTEMS</span>
          <span>SaaS Ultra v6.0 // PROD_BUILD</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
