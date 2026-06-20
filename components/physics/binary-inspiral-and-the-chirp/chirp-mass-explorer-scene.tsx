"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  chirpMass,
  inspiralWaveform,
  M_SUN,
  MPC_M,
} from "@/lib/physics/relativity/binary-inspiral-and-the-chirp";
import { Button } from "@/components/ui/button";

/**
 * FIG.52b — Chirp-mass explorer.
 *
 * A reference binary (cyan) is fixed. The user drags m1, m2 of a second binary
 * (magenta). The two early-inspiral waveforms are overlaid. When the second
 * binary's chirp mass matches the reference, the two traces lock together —
 * demonstrating that the early waveform is governed by M_c, almost regardless
 * of how the total mass is split. A "match to chirp mass" button snaps the
 * masses onto the equal-M_c locus.
 */

const REF_M1 = 30;
const REF_M2 = 30;
const DIST = 400 * MPC_M;
const N = 360;

export function ChirpMassExplorerScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [m1, setM1] = useState(15);
  const [m2, setM2] = useState(60);

  const refMc = useMemo(
    () => chirpMass(REF_M1 * M_SUN, REF_M2 * M_SUN) / M_SUN,
    [],
  );
  const userMc = useMemo(() => chirpMass(m1 * M_SUN, m2 * M_SUN) / M_SUN, [m1, m2]);

  const refWave = useMemo(() => {
    const mc = chirpMass(REF_M1 * M_SUN, REF_M2 * M_SUN);
    const M = (REF_M1 + REF_M2) * M_SUN;
    return inspiralWaveform(mc, M, DIST, N);
  }, []);

  const userWave = useMemo(() => {
    const mc = chirpMass(m1 * M_SUN, m2 * M_SUN);
    const M = (m1 + m2) * M_SUN;
    return inspiralWaveform(mc, M, DIST, N);
  }, [m1, m2]);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height, refWave, userWave, refMc, userMc, m1, m2);
  }, [tokens, width, height, refWave, userWave, refMc, userMc, m1, m2]);

  const matchChirp = () => {
    // keep total mass; redistribute so that chirp mass == refMc.
    // M_c = (m1 m2)^{3/5} (m1+m2)^{-1/5}; fix M = m1+m2 and solve for product.
    const M = m1 + m2;
    // (m1 m2)^{3/5} = refMc M^{1/5}  ⇒  m1 m2 = (refMc^{5/3}) M^{1/3}
    const prod = Math.pow(refMc, 5 / 3) * Math.pow(M, 1 / 3);
    const disc = M * M - 4 * prod;
    if (disc < 0) return; // unreachable with this total mass
    const root = Math.sqrt(disc);
    const a = (M + root) / 2;
    const b = (M - root) / 2;
    setM1(Math.round(b));
    setM2(Math.round(a));
  };

  const matched = Math.abs(userMc - refMc) / refMc < 0.01;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two overlaid inspiral waveforms. A fixed reference binary in cyan and an adjustable binary in magenta. When the adjustable binary's chirp mass equals the reference, the two traces overlap; otherwise they drift apart."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0">m₁: {m1} M☉ (magenta binary)</span>
          <input
            type="range"
            min={3}
            max={90}
            step={1}
            value={m1}
            onChange={(e) => setM1(parseInt(e.target.value, 10))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0">m₂: {m2} M☉</span>
          <input
            type="range"
            min={3}
            max={90}
            step={1}
            value={m2}
            onChange={(e) => setM2(parseInt(e.target.value, 10))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm" onClick={matchChirp}>
            match to reference chirp mass
          </Button>
          <span className={matched ? "text-[var(--color-mint)]" : "text-[var(--color-fg-3)]"}>
            {matched ? "MATCHED — waveforms overlap" : "unmatched — waveforms drift"}
          </span>
        </div>
      </div>
    </div>
  );
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  wave: { t: number[]; h: number[] },
  x0: number,
  x1: number,
  midY: number,
  ampPix: number,
  color: string,
  lineWidth: number,
) {
  const t = wave.t;
  const h = wave.h;
  const tMin = t[0];
  const tMax = t[t.length - 1];
  const span = tMax - tMin || 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (let i = 0; i < t.length; i++) {
    const px = x0 + ((t[i] - tMin) / span) * (x1 - x0);
    const py = midY - h[i] * ampPix;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  refWave: { t: number[]; h: number[] },
  userWave: { t: number[]; h: number[] },
  refMc: number,
  userMc: number,
  m1: number,
  m2: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const PAD = 16;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, PAD, W - PAD * 2, H - PAD * 2);
  drawSectionTitle(ctx, PAD + 6, PAD + 6, "WAVEFORM OVERLAY  h(t)", tokens.textMute);

  const midY = H / 2;
  const x0 = PAD + 8;
  const x1 = W - PAD - 8;

  // common amplitude scaling so equal-Mc waves overlay exactly
  let hMax = 1e-30;
  for (const v of refWave.h) hMax = Math.max(hMax, Math.abs(v));
  for (const v of userWave.h) hMax = Math.max(hMax, Math.abs(v));
  const ampPix = (H / 2 - 50) / hMax;

  // zero line
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.5);
  ctx.beginPath();
  ctx.moveTo(x0, midY);
  ctx.lineTo(x1, midY);
  ctx.stroke();

  drawWave(ctx, refWave, x0, x1, midY, ampPix, hexToRgba(tokens.cyan, 0.85), 2.2);
  drawWave(ctx, userWave, x0, x1, midY, ampPix, hexToRgba(tokens.magenta, 0.9), 1.4);

  // HUD: chirp masses
  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = tokens.cyan;
  ctx.fillText(
    `reference  ${REF_M1}+${REF_M2} M☉   M_c = ${refMc.toFixed(2)} M☉`,
    PAD + 8,
    H - PAD - 30,
  );
  ctx.fillStyle = tokens.magenta;
  ctx.fillText(
    `adjustable ${m1}+${m2} M☉   M_c = ${userMc.toFixed(2)} M☉`,
    PAD + 8,
    H - PAD - 16,
  );

  ctx.textAlign = "right";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("merger →", x1, PAD + 8);
}
