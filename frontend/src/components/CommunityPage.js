import React from 'react';

const CommunityPage = () => {
  return (
    <div className="bg-background text-on-surface min-h-screen pt-32 pb-24">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Join the Collective</h1>
          <p className="text-on-surface-variant text-body-lg max-w-2xl mx-auto">
            Traceon is built by engineers, for engineers. Contribute, learn, and grow with the global community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="glass-panel p-10 rounded-2xl border border-white/10 flex flex-col items-center text-center gap-6 group hover:border-primary/50 transition-all duration-300">
            <span className="material-symbols-outlined text-6xl text-primary group-hover:scale-110 transition-transform">terminal</span>
            <h3 className="text-2xl font-bold">GitHub</h3>
            <p className="text-on-surface-variant">The core engine is 100% open source. Help us refine the algorithms and add support for more architectures.</p>
            <button
              onClick={() => window.open('https://github.com/NkOffiCiAL07/AI-Powered-C-Execution-Flow-Visualizer', '_blank')}
              className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)]">View Repository</button>
          </div>
          
          <div className="glass-panel p-10 rounded-2xl border border-white/10 flex flex-col items-center text-center gap-6 group hover:border-secondary/50 transition-all duration-300">
            <span className="material-symbols-outlined text-6xl text-secondary group-hover:scale-110 transition-transform">forum</span>
            <h3 className="text-2xl font-bold">Discord</h3>
            <p className="text-on-surface-variant">Real-time support and architectural discussions with the core team and 12,000+ engineers.</p>
            <button
              onClick={() => window.open('mailto:nishantkumar19041@gmail.com?subject=Traceon Discord Invite', '_blank')}
              className="bg-secondary text-white px-8 py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)]">Join Server</button>
          </div>
        </div>

        <div className="glass-panel p-12 rounded-2xl border border-white/5 bg-surface-container-low text-center">
          <h3 className="text-2xl font-bold mb-6">Upcoming Events</h3>
          <div className="flex flex-col gap-4 max-w-xl mx-auto">
            <div className="flex justify-between items-center p-4 border-b border-white/5">
              <div className="text-left">
                <p className="font-bold">v1.2 Release Keynote</p>
                <p className="text-xs text-on-surface-variant">Global Virtual Event</p>
              </div>
              <span className="text-primary font-code-md">May 24</span>
            </div>
            <div className="flex justify-between items-center p-4 border-b border-white/5">
              <div className="text-left">
                <p className="font-bold">C++ Flow Analysis Workshop</p>
                <p className="text-xs text-on-surface-variant">Advanced Debugging Series</p>
              </div>
              <span className="text-secondary font-code-md">June 02</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
