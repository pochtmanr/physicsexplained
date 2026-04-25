"use client";

import { useEffect, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  tw: number;
};

export function DotField() {
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
    let dots: Dot[] = [];
    let rgbPrefix = "rgba(111,184,198,";

    function readColor() {
      if (!cvs) return;
      const c = getComputedStyle(cvs).color;
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) rgbPrefix = `rgba(${m[1]},${m[2]},${m[3]},`;
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
      const count = Math.floor((W * H) / 2200);
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        r: Math.random() * 1.1 + 0.4,
        tw: Math.random() * Math.PI * 2,
      }));
    }

    function draw(now: number) {
      if (!ctx) return;
      const dt = Math.min(48, now - last);
      last = now;
      ctx.clearRect(0, 0, W, H);

      for (const p of dots) {
        if (!reduce) {
          p.x += p.vx * dt * 0.05;
          p.y += p.vy * dt * 0.05;
          p.tw += 0.005 * dt * 0.05;
        }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        const twinkle = reduce ? 0.55 : 0.45 + Math.sin(p.tw) * 0.35;
        ctx.fillStyle = rgbPrefix + (twinkle * 0.65).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
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

    const themeObserver = new MutationObserver(() => {
      readColor();
    });
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
