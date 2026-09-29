import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 58;
const MAX_DIST = 125;
const SPEED = 0.28;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  phase: number; // for pulsing opacity
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:      Math.random() * W,
      y:      Math.random() * H,
      vx:     (Math.random() - 0.5) * SPEED * 2,
      vy:     (Math.random() - 0.5) * SPEED * 2,
      radius: Math.random() * 1.2 + 0.4,
      phase:  Math.random() * Math.PI * 2,
    }));

    let rafId: number;
    let frame = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        // Pulsing alpha
        const pulse = 0.45 + 0.55 * Math.sin(frame * 0.012 + p.phase);
        const alpha = 0.55 * pulse;

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,213,255,${alpha.toFixed(3)})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const lineAlpha = (1 - dist / MAX_DIST) * 0.13;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,213,255,${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
    };

    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
