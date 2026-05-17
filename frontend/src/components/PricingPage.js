import React from 'react';
import { useTheme, isDarkTheme } from '../theme';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    label: 'GUEST',
    price: '$0',
    period: '/mo',
    description: 'Try the editor instantly — no sign-in needed.',
    cta: 'Open Editor',
    popular: false,
    features: [
      { text: 'Code editor — C, C++, Python, Java', available: true },
      { text: 'Compile & run code', available: true },
      { text: 'Basic output panel', available: true },
      { text: 'AI code generation', available: false },
      { text: 'AI code explanation', available: false },
      { text: 'Step-by-step debugger', available: false },
      { text: 'Projects & file management', available: false },
      { text: 'Memory Spectrometer', available: false },
      { text: 'AI optimize & hotspot heatmap', available: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    label: 'PRO',
    price: '$2',
    period: '/mo',
    description: 'Full debugging power for engineers who ship.',
    cta: 'Get Pro',
    popular: true,
    badge: 'MOST POPULAR',
    features: [
      { text: 'Everything in Free', available: true, inherit: true },
      { text: 'Step-by-step debugger', available: true },
      { text: 'Projects & file management', available: true },
      { text: 'Memory Spectrometer', available: true },
      { text: 'Hotspot heatmap & AI optimize', available: true },
      { text: 'AI step-level insights', available: true },
      { text: 'Share via URL & export traces', available: true },
      { text: 'Activity dashboard', available: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    label: 'ENTERPRISE',
    price: 'Custom',
    period: '',
    description: 'High-scale visualization for engineering teams.',
    cta: 'Contact Sales',
    popular: false,
    features: [
      { text: 'Everything in Pro', available: true, inherit: true },
      { text: 'Team accounts & shared projects', available: true },
      { text: 'On-premise deployment', available: true },
      { text: 'Custom LLM integration', available: true },
      { text: 'SLA & security audits', available: true },
      { text: 'Dedicated account manager', available: true },
    ],
  },
];

export default function PricingPage({ onStart, onSignIn }) {
  const { theme } = useTheme();
  const dark = isDarkTheme(theme);

  const muted55 = dark ? 'rgba(232,226,217,0.55)' : 'rgba(26,19,16,0.55)';
  const muted40 = dark ? 'rgba(232,226,217,0.40)' : 'rgba(26,19,16,0.40)';
  const muted30 = dark ? 'rgba(232,226,217,0.30)' : 'rgba(26,19,16,0.30)';

  const handleCta = (tier) => {
    if (tier.id === 'free') { onStart(); return; }
    if (tier.id === 'enterprise') { window.open('mailto:nishantkumar19041@gmail.com?subject=Traceon Enterprise', '_blank'); return; }
    if (onSignIn) onSignIn();
    else window.open('mailto:nishantkumar19041@gmail.com?subject=Traceon Pro Interest', '_blank');
  };

  return (
    <div className="landing-root" style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: '1060px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{
            display: 'inline-block', marginBottom: '16px', padding: '4px 14px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '999px', fontSize: '11px', fontWeight: '700',
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary)',
          }}>Pricing</span>
          <h1 style={{
            fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', fontWeight: '800',
            color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.02em',
          }}>
            Simple, Transparent Pricing
          </h1>
          <p style={{ color: muted55, fontSize: '1rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.65' }}>
            Start free with the editor. Unlock the full debugger and AI suite for less than a coffee.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {TIERS.map((tier) => (
            <div key={tier.id} style={{
              background: 'var(--bg-card)',
              border: tier.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: '18px',
              padding: '32px 28px 28px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: tier.popular
                ? '0 8px 40px rgba(201,106,72,0.14)'
                : '0 2px 10px rgba(100,70,40,0.05)',
            }}>

              {/* Most Popular badge */}
              {tier.badge && (
                <span style={{
                  position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--primary)', color: '#fff', fontSize: '10px', fontWeight: '800',
                  letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 16px',
                  borderRadius: '999px', whiteSpace: 'nowrap',
                }}>{tier.badge}</span>
              )}

              {/* Tier label */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.12em', color: 'var(--primary)', marginBottom: '10px',
                }}>{tier.label}</h3>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: tier.price === 'Custom' ? '2.2rem' : '2.8rem',
                    fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1,
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}>{tier.price}</span>
                  {tier.period && (
                    <span style={{ color: muted40, fontSize: '0.875rem' }}>{tier.period}</span>
                  )}
                </div>
                <p style={{ color: muted55, fontSize: '0.875rem', lineHeight: '1.55', margin: 0 }}>
                  {tier.description}
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 20px' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {tier.features.map((f) => (
                  <li key={f.text} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '0.875rem',
                    color: f.available ? 'var(--text-primary)' : muted30,
                    opacity: f.available ? 1 : 0.7,
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '16px', flexShrink: 0,
                      color: f.available
                        ? (f.inherit ? 'var(--accent-blue-bright, #58A6FF)' : 'var(--primary)')
                        : muted30,
                    }}>
                      {f.available ? (f.inherit ? 'layers' : 'check_circle') : 'lock'}
                    </span>
                    <span style={{ fontStyle: f.inherit ? 'italic' : 'normal', fontWeight: f.inherit ? '500' : '400' }}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <button
                onClick={() => handleCta(tier)}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: '10px',
                  fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                  transition: 'opacity 0.15s, transform 0.1s',
                  background: tier.popular ? 'var(--primary)' : 'transparent',
                  color: tier.popular ? '#fff' : 'var(--text-primary)',
                  border: tier.popular ? 'none' : '1.5px solid var(--border-strong, rgba(100,70,40,0.25))',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {tier.cta}
              </button>

            </div>
          ))}
        </div>

        {/* FAQ-style note row */}
        <div style={{
          marginTop: '48px', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {[
            { icon: 'credit_card_off', text: 'No credit card required for Free' },
            { icon: 'lock_open',       text: 'Editor always free, forever' },
            { icon: 'cancel',          text: 'Cancel Pro anytime' },
          ].map(n => (
            <div key={n.text} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: '10px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)', flexShrink: 0 }}>{n.icon}</span>
              <span style={{ fontSize: '0.82rem', color: muted55 }}>{n.text}</span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.78rem', color: muted30 }}>
          All plans include the open-source core engine. Prices are in USD.
        </p>
      </div>
    </div>
  );
}
