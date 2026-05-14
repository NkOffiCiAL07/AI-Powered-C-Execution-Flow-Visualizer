import React from 'react';

const DocsPage = () => {
  return (
    <div className="bg-background text-on-surface min-h-screen pt-24 pb-12">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="sticky top-32 flex flex-col gap-6">
            <div>
              <h3 className="text-primary font-bold uppercase tracking-widest text-xs mb-4">Getting Started</h3>
              <ul className="flex flex-col gap-2">
                <li><a href="#" className="text-on-surface hover:text-primary transition-colors">Introduction</a></li>
                <li><a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Installation</a></li>
                <li><a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Quick Start</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-secondary font-bold uppercase tracking-widest text-xs mb-4">Core Concepts</h3>
              <ul className="flex flex-col gap-2">
                <li><a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Execution Flow</a></li>
                <li><a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Variable Tracking</a></li>
                <li><a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Memory Mapping</a></li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <article className="flex-1 max-w-3xl">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Documentation</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Introduction</h2>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              Traceon is a next-generation C/C++ execution flow visualizer. It bridges the gap between raw source code and mental models of execution logic. By leveraging GDB and LLM-assisted analysis, Traceon provides a high-fidelity narrative of how your code actually runs.
            </p>
            <div className="glass-panel p-6 rounded-xl border border-white/10 bg-surface-container-lowest">
              <h4 className="font-code-md text-sm text-secondary mb-2">// Key Features</h4>
              <ul className="list-disc list-inside text-on-surface-variant gap-2 flex flex-col">
                <li>Real-time visual execution graphs</li>
                <li>Predictive race condition detection</li>
                <li>Visual pointer and memory tracking</li>
                <li>Time-travel debugging snapshots</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Installation</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Get Traceon running locally in seconds.
            </p>
            <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/5 font-code-md text-sm">
              <div className="flex gap-4 mb-2">
                <span className="text-outline">$</span>
                <span className="text-secondary">git clone</span>
                <span className="text-on-surface">https://github.com/traceon/core.git</span>
              </div>
              <div className="flex gap-4">
                <span className="text-outline">$</span>
                <span className="text-secondary">cd</span>
                <span className="text-on-surface">traceon && ./setup.sh</span>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};

export default DocsPage;
