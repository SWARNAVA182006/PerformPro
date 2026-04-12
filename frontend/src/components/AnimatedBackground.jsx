import { useEffect, useRef } from 'react';

/**
 * AnimatedBackground
 * Renders a full-screen canvas with a continuously drifting constellation:
 *  - Glowing nodes that float and pulse
 *  - Lines drawn between nearby nodes (opacity scales with distance)
 *  - Occasional "data pulse" that travels along a line
 *  - All in the app's indigo / cyan / violet palette
 */
const AnimatedBackground = ({ opacity = 1 }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── Config ──────────────────────────────────────────────────────────────
    const NODE_COUNT    = 55;
    const MAX_DIST      = 160;   // max px to draw a connecting line
    const SPEED_MAX     = 0.45;
    const PULSE_INTERVAL= 120;   // frames between spawning data pulses
    const COLORS = [
      [99,  102, 241],   // indigo
      [139, 92,  246],   // violet
      [6,   182, 212],   // cyan
      [236, 72,  153],   // pink
      [16,  185, 129],   // emerald (rare)
    ];

    // ── State ───────────────────────────────────────────────────────────────
    let W = 0, H = 0;
    let nodes   = [];
    let pulses  = [];   // { from, to, t (0→1), progress, color }
    let frame   = 0;

    // ── Helpers ─────────────────────────────────────────────────────────────
    const rand  = (min, max) => Math.random() * (max - min) + min;
    const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
    const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

    const mkNode = () => {
      const c = pick(COLORS);
      return {
        x:     rand(0, W),
        y:     rand(0, H),
        vx:    rand(-SPEED_MAX, SPEED_MAX),
        vy:    rand(-SPEED_MAX, SPEED_MAX),
        r:     rand(1.5, 3.5),
        color: c,
        phase: rand(0, Math.PI * 2),   // for pulse-glow
        phaseSpeed: rand(0.008, 0.02),
      };
    };

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      nodes = Array.from({ length: NODE_COUNT }, mkNode);
    };

    // ── Draw ─────────────────────────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;

      // ── Update nodes ────────────────────────────────────────────────────
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.phase += n.phaseSpeed;

        // Soft wrap with fade (bounce off edges gently)
        if (n.x < -50)  n.x = W + 50;
        if (n.x > W+50) n.x = -50;
        if (n.y < -50)  n.y = H + 50;
        if (n.y > H+50) n.y = -50;
      }

      // ── Draw connection lines ────────────────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d2 = dist2(nodes[i], nodes[j]);
          if (d2 > MAX_DIST * MAX_DIST) continue;

          const t   = 1 - Math.sqrt(d2) / MAX_DIST;   // 0 → 1  (1 = closest)
          const [r, g, b] = nodes[i].color;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${t * 0.25})`;
          ctx.lineWidth   = t * 1.2;
          ctx.stroke();
        }
      }

      // ── Spawn data pulses ────────────────────────────────────────────────
      if (frame % PULSE_INTERVAL === 0) {
        const from = pick(nodes);
        // Pick a nearby node as the target
        const candidates = nodes.filter(n => {
          if (n === from) return false;
          const d = dist2(from, n);
          return d < MAX_DIST * MAX_DIST;
        });
        if (candidates.length) {
          pulses.push({
            from, to: pick(candidates),
            progress: 0,
            color: pick(COLORS),
            speed: rand(0.012, 0.025),
          });
        }
      }

      // ── Draw & update data pulses ────────────────────────────────────────
      pulses = pulses.filter(p => {
        p.progress += p.speed;
        if (p.progress >= 1) return false;

        const x = p.from.x + (p.to.x - p.from.x) * p.progress;
        const y = p.from.y + (p.to.y - p.from.y) * p.progress;
        const [r, g, b] = p.color;

        // Glow corona
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 8);
        grd.addColorStop(0,   `rgba(${r},${g},${b},0.9)`);
        grd.addColorStop(0.4, `rgba(${r},${g},${b},0.3)`);
        grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},1)`;
        ctx.fill();

        return true;
      });

      // ── Draw nodes ───────────────────────────────────────────────────────
      for (const n of nodes) {
        const glow   = 0.5 + 0.5 * Math.sin(n.phase);   // 0 → 1 pulsing
        const radius = n.r + glow * 1.2;
        const [r, g, b] = n.color;

        // Outer glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 4);
        grd.addColorStop(0,   `rgba(${r},${g},${b},${0.35 + glow * 0.2})`);
        grd.addColorStop(0.5, `rgba(${r},${g},${b},0.08)`);
        grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.8 + glow * 0.2})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    // ── Bootstrap ────────────────────────────────────────────────────────────
    resize();
    window.addEventListener('resize', resize);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity,
      }}
    />
  );
};

export default AnimatedBackground;
