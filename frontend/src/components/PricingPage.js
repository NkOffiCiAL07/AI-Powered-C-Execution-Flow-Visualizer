import React from 'react';

const tiers = [
  {
    name: "Alpha",
    price: "$0",
    period: "/mo",
    description: "For individual developers and open source contributors.",
    features: ["Unlimited Local Visualizations", "Basic Flow Analysis", "Community Support", "Single Thread Tracking"],
    buttonText: "Get Started",
    popular: false,
  },
  {
    name: "Beta",
    price: "$19",
    period: "/mo",
    description: "Advanced debugging for professional software engineers.",
    features: ["AI-Powered Analysis", "Multi-Thread Synchronization", "Memory Leak Forecasting", "Priority Support"],
    buttonText: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "High-scale visualization for large engineering teams.",
    features: ["On-Premise Deployment", "Custom LLM Integration", "SLA & Security Audits", "Dedicated Account Manager"],
    buttonText: "Contact Sales",
    popular: false,
  },
];

const PricingPage = ({ onStart }) => (
  <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '72px 24px 80px' }}>
    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        <span style={{
          display: 'inline-block', marginBottom: '14px', padding: '4px 14px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '999px', fontSize: '11px', fontWeight: '700',
          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary)'
        }}>Pricing</span>
        <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{ color: 'rgba(26,19,16,0.55)', fontSize: '1rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.65' }}>
          Scale your understanding from simple scripts to complex distributed systems.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px', alignItems: 'start' }}>
        {tiers.map((tier) => (
          <div key={tier.name} style={{
            background: 'var(--bg-card)',
            border: tier.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
            borderRadius: '16px', padding: '32px', display: 'flex',
            flexDirection: 'column', position: 'relative',
            boxShadow: tier.popular ? '0 8px 32px rgba(201,106,72,0.12)' : '0 2px 8px rgba(100,70,40,0.06)',
            marginTop: tier.popular ? '0' : '0',
          }}>
            {tier.popular && (
              <span style={{
                position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--primary)', color: '#fff', fontSize: '11px', fontWeight: '700',
                letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 16px', borderRadius: '999px'
              }}>Most Popular</span>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', marginBottom: '12px' }}>{tier.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span style={{ fontSize: '2.8rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>{tier.price}</span>
                {tier.period && <span style={{ color: 'rgba(26,19,16,0.45)', fontSize: '0.9rem' }}>{tier.period}</span>}
              </div>
              <p style={{ color: 'rgba(26,19,16,0.55)', fontSize: '0.875rem', lineHeight: '1.55' }}>{tier.description}</p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
              {tier.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--primary)', flexShrink: 0 }}>check_circle</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                if (tier.name === 'Alpha') onStart();
                else if (tier.name === 'Enterprise') window.open('mailto:nishantkumar19041@gmail.com', '_blank');
                else window.open('mailto:nishantkumar19041@gmail.com?subject=Traceon Beta Interest', '_blank');
              }}
              style={{
                width: '100%', padding: '12px 0', borderRadius: '10px', fontWeight: '700',
                fontSize: '0.9rem', cursor: 'pointer', transition: 'opacity 0.15s, transform 0.1s',
                background: tier.popular ? 'var(--primary)' : 'transparent',
                color: tier.popular ? '#fff' : 'var(--text-primary)',
                border: tier.popular ? 'none' : '1.5px solid var(--border-strong, rgba(100,70,40,0.25))',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {tier.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p style={{ textAlign: 'center', marginTop: '36px', fontSize: '0.8rem', color: 'rgba(26,19,16,0.4)' }}>
        All plans include the open-source core engine. No credit card required for Alpha.
      </p>
    </div>
  </div>
);

export default PricingPage;
