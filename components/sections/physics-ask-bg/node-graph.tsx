"use client";

import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pulse: number;
};

export function NodeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let nodes: Node[] = [];
    let rgb = "111,184,198";

    function readColor() {
      if (!cvs) return;
      const c = getComputedStyle(cvs).color;
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) rgb = `${m[1]},${m[2]},${m[3]}`;
    }

    function resize() {
      if (!cvs || !ctx) return;
      dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = cvs.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      cvs.width = W * dpr;
      cvs.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      const count = Math.max(8, Math.min(16, Math.floor((W * H) / 9000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        pulse: Math.random() * Math.PI * 2,
      }));
    }

    function draw(now: number) {
      if (!ctx) return;
      const dt = Math.min(48, now - last);
      last = now;
      ctx.clearRect(0, 0, W, H);

      const linkDist = Math.min(140, Math.max(80, Math.hypot(W, H) * 0.22));

      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx * dt * 0.05;
          n.y += n.vy * dt * 0.05;
          n.pulse += 0.006 * dt * 0.05;
        }
        if (n.x < 8) n.vx = Math.abs(n.vx);
        if (n.x > W - 8) n.vx = -Math.abs(n.vx);
        if (n.y < 8) n.vy = Math.abs(n.vy);
        if (n.y > H - 8) n.vy = -Math.abs(n.vy);
      }

      // Edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < linkDist) {
            const alpha = (1 - d / linkDist) * 0.22;
            ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        const pulse = reduce ? 0.7 : 0.55 + Math.sin(n.pulse) * 0.35;
        ctx.fillStyle = `rgba(${rgb},${(pulse * 0.85).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    readColor();
    seed();
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      resize();
      seed();
    };
    window.addEventListener("resize", onResize);

    const themeObserver = new MutationObserver(() => readColor());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-[var(--color-cyan-dim)]"
    />
  );
}
