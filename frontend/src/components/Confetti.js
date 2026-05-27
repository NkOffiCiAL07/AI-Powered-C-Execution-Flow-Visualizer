import { useEffect, useRef } from "react";

/* ─── Canvas Confetti Burst ───────────────────────────────────────────────────
   Usage:  <Confetti trigger={someBoolean} />
   When `trigger` flips from false → true a 1.8 s confetti burst fires.
   ─────────────────────────────────────────────────────────────────────────── */
const COLORS = [
  "#C96A48", "#D97757", "#F59E0B", "#22C55E",
  "#3B82F6", "#A855F7", "#EC4899", "#06B6D4",
  "#FBBF24", "#10B981",
];

function rand(min, max) { return Math.random() * (max - min) + min; }

export default function Confetti({ trigger }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const prevRef   = useRef(false);

  useEffect(() => {
    if (!trigger || prevRef.current === trigger) return;
    prevRef.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx   = canvas.getContext("2d");
    const W     = (canvas.width  = window.innerWidth);
    const H     = (canvas.height = window.innerHeight);
    const COUNT = Math.min(180, Math.floor(W / 6));

    const particles = Array.from({ length: COUNT }, () => ({
      x:   rand(W * 0.2, W * 0.8),
      y:   rand(-80, -10),
      vx:  rand(-4, 4),
      vy:  rand(3, 9),
      rot: rand(0, Math.PI * 2),
      vrot: rand(-0.18, 0.18),
      w:   rand(7, 14),
      h:   rand(4, 9),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
      decay: rand(0.008, 0.018),
    }));

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of particles) {
        p.life -= p.decay;
        if (p.life <= 0) continue;
        alive = true;
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.18; // gravity
        p.rot += p.vrot;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) rafRef.current = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
