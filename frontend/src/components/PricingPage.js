import React from 'react';

const PricingPage = () => {
  const tiers = [
    {
      name: "Alpha",
      price: "$0",
      description: "For individual developers and open source contributors.",
      features: ["Unlimited Local Visualizations", "Basic Flow Analysis", "Community Support", "Single Thread Tracking"],
      buttonText: "Get Started",
      color: "primary"
    },
    {
      name: "Beta",
      price: "$19",
      description: "Advanced debugging for professional software engineers.",
      features: ["AI-Powered Predictive Analysis", "Multi-Thread Synchronization", "Memory Leak Forecasting", "Priority Support"],
      buttonText: "Start Free Trial",
      color: "secondary",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "High-scale visualization for large engineering teams.",
      features: ["On-Premise Deployment", "Custom LLM Integration", "SLA & Security Audits", "Dedicated Account Manager"],
      buttonText: "Contact Sales",
      color: "tertiary"
    }
  ];

  return (
    <div className="bg-background text-on-surface min-h-screen pt-32 pb-24">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Simple, Transparent Pricing</h1>
        <p className="text-on-surface-variant text-body-lg max-w-2xl mx-auto">
          Scale your understanding from simple scripts to complex distributed systems.
        </p>
      </div>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div 
            key={tier.name}
            className={`glass-panel p-8 rounded-2xl border ${tier.popular ? 'border-primary/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'border-white/10'} flex flex-col relative`}
          >
            {tier.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Most Popular
              </span>
            )}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="flex items-baseline justify-center gap-1 mb-4">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.price !== "Custom" && <span className="text-on-surface-variant">/mo</span>}
              </div>
              <p className="text-on-surface-variant text-sm">{tier.description}</p>
            </div>
            <ul className="flex flex-col gap-4 mb-8 flex-1">
              {tier.features.map(feature => (
                <li key={feature} className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 ${
              tier.popular 
                ? 'bg-primary text-on-primary shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                : 'bg-surface-container border border-white/10 hover:bg-white/5'
            }`}>
              {tier.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
