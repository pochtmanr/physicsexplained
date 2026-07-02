"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
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
  carnotCycleStates,
  carnotHeats,
  carnotPVPath,
  carnotEfficiency,
  type CarnotParams,
} from "@/lib/physics/thermodynamics/carnot";

/**
 * FIG.08a — The Carnot cycle in the P–V plane.
 *
 * One mole of ideal gas traces the four reversible legs: isothermal expansion
 * along the hot isotherm (absorbing Q_h), adiabatic expansion down to T_c,
 * isothermal compression along the cold isotherm (rejecting Q_c), and adiabatic
 * compression back to the start. Press "run cycle" to walk the gas around the
 * loop; the enclosed area is the net work. Drag the temperatures and watch the
 * measured efficiency W/Q_h track the bound 1 − T_c/T_h exactly — they are the
 * same number, which is Carnot's theorem in one readout.
 */

const N_MOLES = 1;
const GAMMA = 5 / 3;
const V_START = 0.01; // m³
const EXPANSION_RATIO = 2;
const SAMPLES_PER_LEG = 60;

export function CarnotCycleScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tHot, setTHot] = useState(600);
  const [tCold, setTCold] = useState(300);
  const [playing, setPlaying] = useState(true);

  const phaseRef = useRef(0);
  const playingRef = useRef(playing);
  const lastRef = useRef<number | null>(null);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    const loop = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      if (playingRef.current) phaseRef.current = (phaseRef.current + dt * 0.18) % 1;
      const ctx = applyDpr(canvas, width, height);
      if (ctx) draw(ctx, tokens, { tHot, tCold, phase: phaseRef.current }, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lastRef.current = null;
    };
  }, [tHot, tCold, tokens, width, height]);

  const params: CarnotParams = {
    nMoles: N_MOLES,
    gamma: GAMMA,
    tHot,
    tCold,
    vStart: V_START,
    expansionRatio: EXPANSION_RATIO,
  };
  const { qHot, qCold, work, efficiency } = carnotHeats(params);
  const formulaEff = carnotEfficiency(tHot, tCold);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Pressure–volume diagram of the Carnot cycle: two isotherms and two adiabats forming a closed loop, with a marker tracing the gas around it and readouts for the heat in, heat out, net work, and efficiency."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0" style={{ color: "var(--color-red)" }}>
            T_h: {tHot} K
          </span>
          <input
            type="range"
            min={360}
            max={900}
            step={10}
            value={tHot}
            onChange={(e) => setTHot(Math.max(tCold + 30, parseFloat(e.target.value)))}
            className="flex-1"
            style={{ accentColor: "var(--color-red)" }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0" style={{ color: "var(--color-blue)" }}>
            T_c: {tCold} K
          </span>
          <input
            type="range"
            min={200}
            max={560}
            step={10}
            value={tCold}
            onChange={(e) => setTCold(Math.min(tHot - 30, parseFloat(e.target.value)))}
            className="flex-1"
            style={{ accentColor: "var(--color-blue)" }}
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }}
        >
          {playing ? "pause" : "run cycle"}
        </button>
        <span className="text-[var(--color-fg-3)]">
          Q_h = {qHot.toFixed(0)} J · Q_c = {qCold.toFixed(0)} J · W = {work.toFixed(0)} J
        </span>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        η = W/Q_h = {(efficiency * 100).toFixed(1)}% — and 1 − T_c/T_h ={" "}
        {(formulaEff * 100).toFixed(1)}%. The same number.
      </p>
    </div>
  );
}

interface DrawState {
  tHot: number;
  tCold: number;
  phase: number;
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  s: DrawState,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 16, 4, "CARNOT CYCLE  P–V", tokens.textMute);

  const params: CarnotParams = {
    nMoles: N_MOLES,
    gamma: GAMMA,
    tHot: s.tHot,
    tCold: s.tCold,
    vStart: V_START,
    expansionRatio: EXPANSION_RATIO,
  };
  const path = carnotPVPath(params, SAMPLES_PER_LEG);
  const states = carnotCycleStates(params);

  const PAD = 16;
  const x0 = PAD + 26;
  const x1 = W - PAD - 4;
  const y0 = PAD + 18;
  const y1 = H - PAD - 18;

  const vMin = Math.min(...path.map((p) => p.v));
  const vMax = Math.max(...path.map((p) => p.v));
  const pMin = 0;
  const pMax = Math.max(...path.map((p) => p.p)) * 1.06;

  const sx = (v: number) => x0 + ((v - vMin) / (vMax - vMin)) * (x1 - x0);
  const sy = (p: number) => y1 - ((p - pMin) / (pMax - pMin)) * (y1 - y0);

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, y1);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText("P", x0 - 4, y0 - 12);
  ctx.fillText("V", x1 - 8, y1 + 4);

  // filled enclosed area
  ctx.beginPath();
  path.forEach((pt, i) => {
    const X = sx(pt.v);
    const Y = sy(pt.p);
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  });
  ctx.closePath();
  ctx.fillStyle = hexToRgba(tokens.amber, 0.12);
  ctx.fill();

  // legs, colored: 0 hot isotherm, 1 adiabat, 2 cold isotherm, 3 adiabat
  const legColor = [tokens.red, tokens.textFaint, tokens.blue, tokens.textFaint];
  for (let leg = 0; leg < 4; leg++) {
    ctx.strokeStyle = legColor[leg];
    ctx.lineWidth = leg % 2 === 0 ? 2.4 : 1.4;
    ctx.beginPath();
    for (let i = 0; i < SAMPLES_PER_LEG; i++) {
      const pt = path[leg * SAMPLES_PER_LEG + i];
      const X = sx(pt.v);
      const Y = sy(pt.p);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }

  // corner dots + labels
  const labels = ["1", "2", "3", "4"];
  states.forEach((st, i) => {
    const X = sx(st.v);
    const Y = sy(st.p);
    ctx.fillStyle = tokens.textMute;
    ctx.beginPath();
    ctx.arc(X, Y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(labels[i], X + 5, Y - 10);
  });

  // moving marker
  const idx = Math.floor(s.phase * path.length) % path.length;
  const m = path[idx];
  const mx = sx(m.v);
  const my = sy(m.p);
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(mx, my, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(mx, my, 9, 0, Math.PI * 2);
  ctx.stroke();

  // leg annotations near the marker's current leg
  const legNames = [
    "isothermal expansion — absorbs Q_h",
    "adiabatic expansion — cools to T_c",
    "isothermal compression — rejects Q_c",
    "adiabatic compression — back to T_h",
  ];
  const curLeg = Math.floor(idx / SAMPLES_PER_LEG) % 4;
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD;
  ctx.textAlign = "right";
  ctx.fillText(legNames[curLeg], x1, y0 - 2);
  ctx.textAlign = "left";

  // reservoir tags on the two isotherms
  ctx.fillStyle = tokens.red;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(`T_h = ${s.tHot} K`, sx(states[0].v) + 6, sy(states[0].p) + 6);
  ctx.fillStyle = tokens.blue;
  ctx.fillText(`T_c = ${s.tCold} K`, sx(states[3].v) - 2, sy(states[2].p) - 6);
}
