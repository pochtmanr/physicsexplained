"use client";

import { useEffect, useRef } from "react";

export function WaveOrbit() {
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
    let t = 0;
    let last = performance.now();
    let cyan = "rgba(111,184,198,";
    let cyanSolid = "rgba(111,184,198,1)";

    function readColor() {
      if (!cvs) return;
      const c = getComputedStyle(cvs).color;
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) {
        cyan = `rgba(${m[1]},${m[2]},${m[3]},`;
        cyanSolid = `rgba(${m[1]},${m[2]},${m[3]},1)`;
      }
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

    function drawWave(amp: number, freq: number, yOffset: number, alpha: number, phase: number) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(0, H / 2 + yOffset);
      for (let x = 0; x <= W; x += 4) {
        const y = H / 2 + yOffset + Math.sin(x * freq + phase) * amp;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = cyan + alpha.toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function draw(now: number) {
      if (!ctx) return;
      const dt = Math.min(48, now - last);
      last = now;
      if (!reduce) t += dt * 0.0006;
      ctx.clearRect(0, 0, W, H);

      const baseAmp = Math.min(28, H * 0.18);
      const freq = 0.022;

      drawWave(baseAmp, freq, 8, 0.22, t * 1.2);
      drawWave(baseAmp * 0.85, freq * 1.15, -10, 0.16, -t * 0.9);
      drawWave(baseAmp * 0.7, freq * 0.85, 22, 0.1, t * 0.6 + 1.3);

      // Orbiting dot riding the primary wave
      const dotPhase = (reduce ? 0.5 : (t * 0.35) % 1);
      const dotX = dotPhase * W;
      const dotY = H / 2 + 8 + Math.sin(dotX * freq + t * 1.2) * baseAmp;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = cyanSolid;
      ctx.shadowColor = cyanSolid;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    }

    resize();
    readColor();
    raf = requestAnimationFrame(draw);

    const onResize = () => resize();
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
