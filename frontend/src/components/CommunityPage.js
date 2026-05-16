import React from 'react';

const CommunityPage = () => (
  <div className="landing-root" style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '72px 24px 80px' }}>
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        <span style={{
          display: 'inline-block', marginBottom: '14px', padding: '4px 14px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '999px', fontSize: '11px', fontWeight: '700',
          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary)'
        }}>Community</span>
        <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
          Join the Collective
        </h1>
        <p style={{ color: 'rgba(26,19,16,0.55)', fontSize: '1rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.65' }}>
          Traceon is built by engineers, for engineers. Contribute, learn, and grow with the community.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px', marginBottom: '36px' }}>

        {/* GitHub */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
          padding: '36px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: '14px', transition: 'box-shadow 0.2s',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>terminal</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>GitHub</h3>
          <p style={{ color: 'rgba(26,19,16,0.6)', fontSize: '0.875rem', lineHeight: '1.65', flex: 1 }}>
            The core engine is 100% open source. Star the repo, open issues, or submit a pull request to help shape the project.
          </p>
          <button
            onClick={() => window.open('https://github.com/NkOffiCiAL07/AI-Powered-C-Execution-Flow-Visualizer', '_blank')}
            style={{
              padding: '11px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem',
              cursor: 'pointer', background: 'var(--primary)', color: '#fff', border: 'none',
              transition: 'opacity 0.15s', width: '100%'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >View Repository</button>
        </div>

        {/* Discord */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
          padding: '36px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: '14px',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>forum</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Discord</h3>
          <p style={{ color: 'rgba(26,19,16,0.6)', fontSize: '0.875rem', lineHeight: '1.65', flex: 1 }}>
            Real-time support and architecture discussions with the core team. Ask questions, share projects, get feedback.
          </p>
          <button
            onClick={() => window.open('mailto:nishantkumar19041@gmail.com?subject=Traceon Discord Invite', '_blank')}
            style={{
              padding: '11px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem',
              cursor: 'pointer', background: 'transparent', color: 'var(--text-primary)',
              border: '1.5px solid rgba(100,70,40,0.25)', transition: 'opacity 0.15s', width: '100%'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Request Invite</button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '32px'
      }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Upcoming Events</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { title: 'v1.2 Release Keynote', sub: 'Global Virtual Event', date: 'May 24', accent: 'var(--primary)' },
            { title: 'C++ Flow Analysis Workshop', sub: 'Advanced Debugging Series', date: 'Jun 02', accent: 'var(--primary)' },
          ].map((ev, i, arr) => (
            <div key={ev.title} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <div>
                <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '3px' }}>{ev.title}</p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(26,19,16,0.5)' }}>{ev.sub}</p>
              </div>
              <span style={{
                fontSize: '0.8rem', fontWeight: '700', color: ev.accent,
                fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-secondary)',
                padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)'
              }}>{ev.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Open Source note */}
      <div style={{
        marginTop: '28px', padding: '20px 24px', background: 'var(--bg-secondary)',
        border: '1px solid var(--border)', borderLeft: '3px solid var(--primary)',
        borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '14px'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)', flexShrink: 0 }}>favorite</span>
        <p style={{ fontSize: '0.875rem', color: 'rgba(26,19,16,0.7)', lineHeight: '1.6', margin: 0 }}>
          Traceon is free and open source. If it helps your workflow, consider giving the repository a star or contributing a fix.
        </p>
      </div>

    </div>
  </div>
);

export default CommunityPage;
