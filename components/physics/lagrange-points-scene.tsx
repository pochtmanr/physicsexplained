"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * Visualizes the five Lagrange points of the Sun-Earth system in the
 * co-rotating frame, with an effective potential contour map.
 * Supports zoom slider and click-drag panning.
 */
export function LagrangePointsScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [showOrbits, setShowOrbits] = useState(true);
  const [zoom, setZoom] = useState(1);

  // Pan state: offset in simulation coords
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startPan: { x: number; y: number };
  } | null>(null);

  // Responsive size
  const [size, setSize] = useState({ width: 600, height: 450 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.7, 500) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;

  // Mass ratio (exaggerated for visibility)
  const mu = 0.08;

  const effectivePotential = useCallback(
    (x: number, y: number): number => {
      const r1 = Math.sqrt((x + mu) * (x + mu) + y * y);
      const r2 = Math.sqrt((x - 1 + mu) * (x - 1 + mu) + y * y);
      const r1c = Math.max(r1, 0.05);
      const r2c = Math.max(r2, 0.05);
      return -0.5 * (x * x + y * y) - (1 - mu) / r1c - mu / r2c;
    },
    [],
  );

  // Pan handlers
  const getPointerSimCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { sx: 0, sy: 0 };
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.32 * zoom;
      const sx = (px - cx) / scale + 0.5 - mu + panOffset.x;
      const sy = -(py - cy) / scale + panOffset.y;
      return { sx, sy };
    },
    [width, height, zoom, panOffset],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startPan: { ...panOffset },
      };
    },
    [panOffset],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current?.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const scale = Math.min(width, height) * 0.32 * zoom;
      setPanOffset({
        x: dragRef.current.startPan.x - dx / scale,
        y: dragRef.current.startPan.y + dy / scale,
      });
    },
    [width, height, zoom],
  );

  const handlePointerUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current.active = false;
    }
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.32 * zoom;

      // Map simulation coordinates to canvas (with pan)
      const toCanvasX = (sx: number) =>
        cx + (sx - 0.5 + mu - panOffset.x) * scale;
      const toCanvasY = (sy: number) =>
        cy - (sy - panOffset.y) * scale;

      // Draw effective potential as contour map
      const resolution = 3;
      const imgW = Math.ceil(width / resolution);
      const imgH = Math.ceil(height / resolution);
      const imgData = ctx.createImageData(imgW, imgH);

      const minPot = -4;
      const maxPot = -1.2;

      for (let py = 0; py < imgH; py++) {
        for (let px = 0; px < imgW; px++) {
          const canvasX = px * resolution;
          const canvasY = py * resolution;
          const sx = (canvasX - cx) / scale + 0.5 - mu + panOffset.x;
          const sy = -(canvasY - cy) / scale + panOffset.y;

          let pot = effectivePotential(sx, sy);
          pot = Math.max(minPot, Math.min(maxPot, pot));
          const norm = (pot - minPot) / (maxPot - minPot);

          const idx = (py * imgW + px) * 4;
          if (norm < 0.5) {
            const t2 = norm * 2;
            imgData.data[idx] = Math.floor(10 * (1 - t2));
            imgData.data[idx + 1] = Math.floor(30 * (1 - t2));
            imgData.data[idx + 2] = Math.floor(80 * (1 - t2) + 20);
            imgData.data[idx + 3] = Math.floor(100 * (1 - t2 * 0.5));
          } else {
            const t2 = (norm - 0.5) * 2;
            imgData.data[idx] = Math.floor(60 * t2);
            imgData.data[idx + 1] = Math.floor(15 * (1 - t2));
            imgData.data[idx + 2] = Math.floor(20 * (1 - t2));
            imgData.data[idx + 3] = Math.floor(50 + 40 * t2);
          }
        }
      }

      const offscreen = new OffscreenCanvas(imgW, imgH);
      const offCtx = offscreen.getContext("2d");
      if (offCtx) {
        offCtx.putImageData(imgData, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(offscreen, 0, 0, width, height);
      }

      // Draw contour lines
      const contourLevels = [
        -3.5, -3.0, -2.5, -2.0, -1.8, -1.6, -1.5, -1.45,
      ];
      ctx.lineWidth = 0.5;
      for (const level of contourLevels) {
        ctx.strokeStyle = "rgba(111, 184, 198, 0.12)";
        const step = 4;
        for (let py = 0; py < height; py += step) {
          for (let px = 0; px < width; px += step) {
            const sx = (px - cx) / scale + 0.5 - mu + panOffset.x;
            const sy = -(py - cy) / scale + panOffset.y;
            const pot = effectivePotential(sx, sy);
            if (Math.abs(pot - level) < 0.04) {
              ctx.fillStyle = "rgba(111, 184, 198, 0.08)";
              ctx.fillRect(px, py, 1, 1);
            }
          }
        }
      }

      // Sun at (-mu, 0)
      const sunX = toCanvasX(-mu);
      const sunY = toCanvasY(0);

      // Earth at (1-mu, 0)
      const earthX = toCanvasX(1 - mu);
      const earthY = toCanvasY(0);

      // Earth orbit guide
      if (showOrbits) {
        const orbitCX = toCanvasX(0.5 - mu);
        const orbitR = Math.abs(1 - mu - (-mu)) * scale * 0.5;
        ctx.strokeStyle = "rgba(111, 184, 198, 0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(orbitCX, toCanvasY(0), orbitR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Lagrange points
      const l1x = 1 - mu - Math.pow(mu / 3, 1 / 3);
      const l2x = 1 - mu + Math.pow(mu / 3, 1 / 3);
      const l3x = -(1 + (5 * mu) / 12);
      const l4x = 0.5 - mu;
      const l4y = Math.sqrt(3) / 2;
      const l5x = 0.5 - mu;
      const l5y = -Math.sqrt(3) / 2;

      const lagrangePoints = [
        { label: "L1", x: l1x, y: 0, stable: false, desc: "SOHO" },
        { label: "L2", x: l2x, y: 0, stable: false, desc: "JWST" },
        { label: "L3", x: l3x, y: 0, stable: false, desc: "" },
        { label: "L4", x: l4x, y: l4y, stable: true, desc: "Trojans" },
        { label: "L5", x: l5x, y: l5y, stable: true, desc: "Trojans" },
      ];

      for (const lp of lagrangePoints) {
        const lpx = toCanvasX(lp.x);
        const lpy = toCanvasY(lp.y);

        // Skip if offscreen
        if (lpx < -50 || lpx > width + 50 || lpy < -50 || lpy > height + 50)
          continue;

        // Trojan clusters at L4/L5
        if (lp.stable) {
          const numTrojans = 12;
          for (let i = 0; i < numTrojans; i++) {
            const angle = (i / numTrojans) * Math.PI * 2 + t * 0.15;
            const dist =
              (8 + (12 * (((i * 7 + 3) % numTrojans) / numTrojans))) * zoom;
            const tx = lpx + dist * Math.cos(angle + i * 0.8);
            const ty = lpy + dist * Math.sin(angle + i * 0.8);
            ctx.fillStyle = "rgba(111, 184, 198, 0.35)";
            ctx.beginPath();
            ctx.arc(tx, ty, 1.5 * Math.min(zoom, 2), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Point marker
        const markerR = Math.min(5 * zoom, 8);
        ctx.fillStyle = lp.stable ? "#6FB8C6" : "#FF6B6B";
        ctx.beginPath();
        ctx.arc(lpx, lpy, markerR, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = colors.fg0;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(lp.label, lpx, lpy - markerR - 6);

        if (lp.desc) {
          ctx.fillStyle = colors.fg2;
          ctx.font = "10px monospace";
          ctx.fillText(lp.desc, lpx, lpy + markerR + 14);
        }
      }

      // Draw Sun
      ctx.shadowColor = "rgba(255, 200, 50, 0.8)";
      ctx.shadowBlur = 25;
      ctx.fillStyle = "#FFCC33";
      ctx.beginPath();
      ctx.arc(sunX, sunY, Math.min(12 * zoom, 20), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Sun", sunX, sunY + Math.min(12 * zoom, 20) + 16);

      // Draw Earth
      ctx.shadowColor = "rgba(111, 184, 198, 0.8)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#6FB8C6";
      ctx.beginPath();
      ctx.arc(earthX, earthY, Math.min(6 * zoom, 12), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Earth", earthX, earthY + Math.min(6 * zoom, 12) + 14);

      // Legend
      ctx.fillStyle = "#6FB8C6";
      ctx.beginPath();
      ctx.arc(14, height - 30, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("stable (L4, L5)", 24, height - 26);

      ctx.fillStyle = "#FF6B6B";
      ctx.beginPath();
      ctx.arc(14, height - 14, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.fillText("unstable (L1, L2, L3)", 24, height - 10);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, cursor: "grab", touchAction: "none" }}
        className="block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">Zoom</label>
        <input
          type="range"
          min={0.5}
          max={4}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-28 accent-[#6FB8C6]"
        />
        <span className="w-10 font-mono text-sm text-[var(--color-fg-1)]">
          {zoom.toFixed(1)}x
        </span>
        <button
          onClick={handleReset}
          className="rounded border border-[var(--color-fg-4)] px-2 py-0.5 text-xs text-[var(--color-fg-3)] transition-colors hover:border-[var(--color-fg-3)]"
        >
          Reset
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-[var(--color-fg-3)]">
          <input
            type="checkbox"
            checked={showOrbits}
            onChange={(e) => setShowOrbits(e.target.checked)}
            className="accent-[#6FB8C6]"
          />
          Orbit guides
        </label>
      </div>
    </div>
  );
}
