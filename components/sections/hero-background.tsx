"use client";

import { useEffect, useRef } from "react";
import styles from "./hero-background.module.css";

type Hue = "cyan" | "magenta" | "amber";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  tw: number;
  hue: Hue;
};

type Palette = Record<Hue, string>;

function hexToRgbPrefix(hex: string, fallback: string): string {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},`;
}

function readPalette(): Palette {
  if (typeof window === "undefined") {
    return {
      cyan: "rgba(111,184,198,",
      magenta: "rgba(255,106,222,",
      amber: "rgba(245,196,81,",
    };
  }
  const s = getComputedStyle(document.documentElement);
  return {
    cyan: hexToRgbPrefix(s.getPropertyValue("--color-cyan-dim"), "rgba(111,184,198,"),
    magenta: hexToRgbPrefix(s.getPropertyValue("--color-magenta"), "rgba(255,106,222,"),
    amber: hexToRgbPrefix(s.getPropertyValue("--color-amber"), "rgba(245,196,81,"),
  };
}

export function HeroBackground() {
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
    let particles: Particle[] = [];
    let palette = readPalette();
    let isLight = document.documentElement.getAttribute("data-theme") === "light";

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
      const count = Math.floor((W * H) / 14000);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.1 + 0.3,
        tw: Math.random() * Math.PI * 2,
        hue:
          Math.random() < 0.92
            ? "cyan"
            : Math.random() < 0.5
              ? "magenta"
              : "amber",
      }));
    }

    function draw(now: number) {
      if (!ctx) return;
      const dt = Math.min(48, now - last);
      last = now;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const maxR = Math.hypot(cx, cy) || 1;

      // Light bg needs stronger particles — dim teal on off-white reads weakly
      // unless we push alpha up and use slightly larger radii.
      const alphaGain = isLight ? 1.6 : 1;
      const alphaCap = isLight ? 1 : 0.9;
      const radiusGain = isLight ? 1.25 : 1;

      for (const p of particles) {
        if (!reduce) {
          p.x += p.vx * dt * 0.08;
          p.y += p.vy * dt * 0.08;
          p.tw += 0.008 * dt * 0.08;
        }

        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        const d = Math.hypot(p.x - cx, p.y - cy) / maxR;
        const centerFade = 1 - Math.max(0, 0.6 - d);
        const twinkle = reduce ? 0.7 : 0.55 + Math.sin(p.tw) * 0.35;
        const a = Math.min(alphaCap, twinkle * centerFade * 0.9 * alphaGain);

        ctx.fillStyle = palette[p.hue] + a.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * radiusGain, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    seed();
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      resize();
      seed();
    };
    window.addEventListener("resize", onResize);

    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
      isLight = document.documentElement.getAttribute("data-theme") === "light";
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
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.gridWash} />
      <div className={styles.glow} />
      <canvas ref={canvasRef} className={styles.particles} />
      <span className={`${styles.corner} ${styles.tl}`} />
      <span className={`${styles.corner} ${styles.tr}`} />
      <span className={`${styles.corner} ${styles.bl}`} />
      <span className={`${styles.corner} ${styles.br}`} />
    </div>
  );
}
