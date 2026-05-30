import React, { useState } from 'react';

const CommunityPage = () => {
  const [discordToast, setDiscordToast] = useState(false);

  const handleDiscordClick = () => {
    setDiscordToast(true);
    setTimeout(() => setDiscordToast(false), 3500);
  };

  return (
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
          Connect &amp; Get Support
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.65' }}>
          Have a question, found a bug, or want to share what you built with Traceon?
          We'd love to hear from you.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px', marginBottom: '36px' }}>

        {/* Contact / Feedback */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
          padding: '36px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: '14px', transition: 'box-shadow 0.2s',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>mail</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Feedback &amp; Bugs</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.65', flex: 1 }}>
            Found a bug or have a feature request? Drop us an email with a short description and
            a code snippet if relevant — we read everything.
          </p>
          <a
            href="mailto:nishantkumar19041@gmail.com"
            style={{
              display: 'block', padding: '11px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem',
              cursor: 'pointer', background: 'var(--primary)', color: '#fff', border: 'none',
              transition: 'opacity 0.15s', width: '100%', textAlign: 'center',
              textDecoration: 'none', boxSizing: 'border-box',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Send Feedback</a>
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.65', flex: 1 }}>
            Real-time support and discussions with the core team. Ask questions, share projects,
            and get feedback from other engineers using Traceon.
          </p>
          <button
            onClick={handleDiscordClick}
            style={{
              padding: '11px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem',
              cursor: 'pointer', background: 'transparent', color: 'var(--text-primary)',
              border: '1.5px solid rgba(100,70,40,0.25)', transition: 'opacity 0.15s', width: '100%',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Notify Me</button>
          {discordToast && (
            <div style={{
              marginTop: '10px', padding: '10px 16px', borderRadius: '10px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderLeft: '3px solid var(--primary)', fontSize: '0.8rem',
              color: 'var(--text-secondary)', lineHeight: '1.5', textAlign: 'left',
            }}>
              <strong style={{ color: 'var(--primary)' }}>Discord coming soon!</strong>
              {' '}We'll announce launch on our{' '}
              <a href="mailto:nishantkumar19041@gmail.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>mailing list</a>.
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '32px', marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Upcoming Events</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>event_busy</span>
          <span style={{ fontSize: '0.875rem' }}>No upcoming events scheduled. Check back soon.</span>
        </div>
      </div>

      {/* Contact note */}
      <div style={{
        padding: '20px 24px', background: 'var(--bg-secondary)',
        border: '1px solid var(--border)', borderLeft: '3px solid var(--primary)',
        borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '14px'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)', flexShrink: 0 }}>support_agent</span>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
          For account issues, billing questions, or partnership inquiries, email us at{' '}
          <a href="mailto:nishantkumar19041@gmail.com" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            nishantkumar19041@gmail.com
          </a>. We typically respond within 24 hours.
        </p>
      </div>

    </div>
  </div>
  );
};

export default CommunityPage;
