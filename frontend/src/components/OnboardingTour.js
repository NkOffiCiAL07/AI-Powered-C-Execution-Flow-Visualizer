import React, { useState, useEffect, useRef } from "react";
import "../styles/OnboardingTour.css";

/* ─── Onboarding Tour ────────────────────────────────────────────────────────
   Shows a 4-step tooltip tour for first-time users.
   Reads / writes localStorage key "traceon_tour_done".
   ─────────────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    target: '[data-tour="analyze"]',
    title: "Analyze & Debug 🚀",
    body: "Click here to compile your code and start the step-through debugger. Watch every variable change in real time.",
    placement: "bottom",
  },
  {
    target: '[data-tour="editor"]',
    title: "Smart Code Editor ✏️",
    body: "Write C, C++, Python, or Java with syntax highlighting, auto-complete snippets, and live error markers.",
    placement: "right",
  },
  {
    target: '[data-tour="flow-tab"]',
    title: "Execution Flow 🔍",
    body: "Step forward and backward through every line. Variables, call stack, and memory are shown live.",
    placement: "bottom",
  },
  {
    target: '[data-tour="ai-btn"]',
    title: "AI Insights 🤖",
    body: "Stuck? Hit AI Insights to get a plain-English explanation of your code, complexity analysis, and optimisation tips.",
    placement: "bottom",
  },
];

function getRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function OnboardingTour({ active, onDone }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const r = getRect(STEPS[step].target);
    setRect(r);
  }, [active, step]);

  if (!active || !rect) return null;

  const s = STEPS[step];
  const PAD = 14;

  // Position tooltip below or to the right of the target
  let tipStyle = {};
  if (s.placement === "bottom") {
    tipStyle = {
      top:  rect.top + rect.height + PAD,
      left: Math.max(8, rect.left + rect.width / 2 - 160),
    };
  } else {
    tipStyle = {
      top:  Math.max(8, rect.top + rect.height / 2 - 60),
      left: rect.left + rect.width + PAD,
    };
  }

  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Spotlight overlay */}
      <div className="tour-overlay" onClick={onDone} />

      {/* Spotlight cutout */}
      <div
        className="tour-spotlight"
        style={{
          top:    rect.top    - 6,
          left:   rect.left   - 6,
          width:  rect.width  + 12,
          height: rect.height + 12,
        }}
      />

      {/* Tooltip card */}
      <div
        ref={boxRef}
        className="tour-card"
        style={tipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress dots */}
        <div className="tour-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`tour-dot${i === step ? " active" : ""}`} />
          ))}
        </div>

        <h4 className="tour-title">{s.title}</h4>
        <p  className="tour-body">{s.body}</p>

        <div className="tour-actions">
          <button className="tour-skip" onClick={onDone}>Skip tour</button>
          <button
            className="tour-next"
            onClick={() => {
              if (isLast) { onDone(); }
              else { setStep(s => s + 1); }
            }}
          >
            {isLast ? "Get started →" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
