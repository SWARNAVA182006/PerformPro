import { useEffect, useRef } from 'react';

const AnimatedBackground = ({ opacity = 1 }) => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── Constants ────────────────────────────────────────────────────────────
    const NODE_COUNT     = 70;
    const MICRO_COUNT    = 50;
    const ORB_COUNT      = 6;
    const MAX_LINK_DIST  = 160;
    const MOUSE_RADIUS   = 130;
    const PULSE_EVERY    = 80; // frames between new pulse spawns

    const COLORS = [
      [99,102,241],   // indigo
      [139,92,246],   // violet
      [6,182,212],    // cyan
      [236,72,153],   // pink
      [16,185,129],   // emerald
      [245,158,11],   // amber
    ];

    let W = 0, H = 0;
    let nodes  = [];
    let micros = [];
    let orbs   = [];
    let pulses = [];
    let frame  = 0;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const rnd  = (a, b) => Math.random() * (b - a) + a;
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const lerp = (a, b, t) => a + (b - a) * t;
    const wrap = (v, min, max) => v < min ? max : v > max ? min : v;

    // ── Factory functions ─────────────────────────────────────────────────────
    const makeNode = () => {
      const spd = rnd(0.08, 0.25);
      const ang = rnd(0, Math.PI * 2);
      return {
        x: rnd(0, W), y: rnd(0, H),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        angle: ang,
        turnRate: rnd(0.003, 0.012) * (Math.random() < 0.5 ? 1 : -1),
        speed: spd,
        r: rnd(1.5, 3.5),
        color: pick(COLORS),
        phase: rnd(0, Math.PI * 2),
        depth: rnd(0.5, 1.0),
      };
    };

    const makeMicro = () => {
      const ang = rnd(0, Math.PI * 2);
      const spd = rnd(0.04, 0.12);
      return {
        x: rnd(0, W), y: rnd(0, H),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        angle: ang,
        turnRate: rnd(0.005, 0.015) * (Math.random() < 0.5 ? 1 : -1),
        speed: spd,
        r: rnd(0.4, 1.1),
        color: pick(COLORS),
        phase: rnd(0, Math.PI * 2),
      };
    };

    const makeOrb = () => {
      const ang = rnd(0, Math.PI * 2);
      const spd = rnd(0.08, 0.2);
      return {
        x: rnd(0, W), y: rnd(0, H),
        angle: ang,
        turnRate: rnd(0.002, 0.007) * (Math.random() < 0.5 ? 1 : -1),
        speed: spd,
        r: rnd(0.18, 0.32) * Math.max(window.innerWidth, window.innerHeight),
        color: pick(COLORS),
        alpha: rnd(0.04, 0.09),
      };
    };

    // ── Init / Resize ─────────────────────────────────────────────────────────
    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      nodes  = Array.from({ length: NODE_COUNT  }, makeNode);
      micros = Array.from({ length: MICRO_COUNT }, makeMicro);
      orbs   = Array.from({ length: ORB_COUNT   }, makeOrb);
    };

    // ── Mouse ─────────────────────────────────────────────────────────────────
    const onMouseMove  = e => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    // ── Draw loop ─────────────────────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // ── 1. ORBS — large glowing blobs, always wandering ──────────────────
      for (const o of orbs) {
        // Change direction every frame by turnRate + tiny random jitter
        o.angle += o.turnRate + (Math.random() - 0.5) * 0.004;
        // Randomly flip turn direction occasionally
        if (Math.random() < 0.004) o.turnRate *= -1;
        // Vary speed slightly each frame
        o.speed = Math.max(0.05, Math.min(0.22, o.speed + (Math.random() - 0.5) * 0.008));

        o.x += Math.cos(o.angle) * o.speed;
        o.y += Math.sin(o.angle) * o.speed;

        // Wrap around — always stay on screen
        o.x = wrap(o.x, -o.r, W + o.r);
        o.y = wrap(o.y, -o.r, H + o.r);

        const grd = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        const [r, g, b] = o.color;
        grd.addColorStop(0,    `rgba(${r},${g},${b},${o.alpha})`);
        grd.addColorStop(0.45, `rgba(${r},${g},${b},${o.alpha * 0.35})`);
        grd.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 2. MICRO PARTICLES — tiny dots always moving ──────────────────────
      for (const m of micros) {
        m.angle   += m.turnRate + (Math.random() - 0.5) * 0.008;
        m.speed    = Math.max(0.03, Math.min(0.14, m.speed + (Math.random() - 0.5) * 0.005));
        m.x       += Math.cos(m.angle) * m.speed;
        m.y       += Math.sin(m.angle) * m.speed;
        m.x        = wrap(m.x, -10, W + 10);
        m.y        = wrap(m.y, -10, H + 10);
        m.phase   += 0.035;

        const pulse = 0.3 + 0.5 * Math.sin(m.phase);
        const [r, g, b] = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${pulse * 0.55})`;
        ctx.fill();
      }

      // ── 3. MAIN NODES — with mouse repulsion ─────────────────────────────
      for (const n of nodes) {
        // Continuous angle-based movement with random turn every frame
        n.angle   += n.turnRate + (Math.random() - 0.5) * 0.006;
        n.speed    = Math.max(0.06, Math.min(0.28, n.speed + (Math.random() - 0.5) * 0.004));
        if (Math.random() < 0.003) n.turnRate *= -1; // occasional direction flip

        n.vx = Math.cos(n.angle) * n.speed;
        n.vy = Math.sin(n.angle) * n.speed;

        // Mouse repulsion
        const dx = n.x - mx, dy = n.y - my;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_RADIUS && d > 0) {
          const f = (1 - d / MOUSE_RADIUS) * 1.2;
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }

        n.x = wrap(n.x + n.vx, -80, W + 80);
        n.y = wrap(n.y + n.vy, -80, H + 80);
        n.phase += 0.018;
      }

      // ── 4. LINKS between nearby nodes ────────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 > MAX_LINK_DIST * MAX_LINK_DIST) continue;
          const t = 1 - Math.sqrt(d2) / MAX_LINK_DIST;
          const [r, g, b] = nodes[i].color;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${t * 0.18 * nodes[i].depth * nodes[j].depth})`;
          ctx.lineWidth   = t * 1.2;
          ctx.stroke();
        }
      }

      // ── 5. PULSES — traveling sparks along links ─────────────────────────
      if (frame % PULSE_EVERY === 0 && nodes.length > 1) {
        const from = pick(nodes);
        const near = nodes.filter(n => {
          const dx = n.x - from.x, dy = n.y - from.y;
          return n !== from && dx * dx + dy * dy < MAX_LINK_DIST * MAX_LINK_DIST;
        });
        if (near.length) {
          pulses.push({ from, to: pick(near), t: 0, speed: rnd(0.012, 0.028), color: pick(COLORS) });
        }
      }

      pulses = pulses.filter(p => {
        p.t += p.speed;
        if (p.t >= 1) return false;
        const x = lerp(p.from.x, p.to.x, p.t);
        const y = lerp(p.from.y, p.to.y, p.t);
        const [r, g, b] = p.color;
        const g2 = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g2.addColorStop(0,   `rgba(${r},${g},${b},1)`);
        g2.addColorStop(0.4, `rgba(${r},${g},${b},0.3)`);
        g2.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = g2; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},1)`; ctx.fill();
        return true;
      });

      // ── 6. DRAW NODES ─────────────────────────────────────────────────────
      for (const n of nodes) {
        const glow   = 0.5 + 0.5 * Math.sin(n.phase);
        const radius = n.r * (1 + glow * 0.6);
        const [r, g, b] = n.color;
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 5);
        grd.addColorStop(0,   `rgba(${r},${g},${b},${(0.4 + glow * 0.3) * n.depth})`);
        grd.addColorStop(0.5, `rgba(${r},${g},${b},${0.05 * n.depth})`);
        grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(n.x, n.y, radius * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.9)`; ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize',     resize);
    window.addEventListener('mousemove',  onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize',     resize);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity }}
    />
  );
};

export default AnimatedBackground;
