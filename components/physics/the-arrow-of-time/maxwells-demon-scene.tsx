"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  createRng,
  randomRange,
  type Rng,
} from "@/lib/physics/thermodynamics/random";
import {
  erasureCostInUnitsOfK,
  landauerErasureCost,
} from "@/lib/physics/thermodynamics/irreversibility";

/**
 * FIG.13c — Maxwell's demon.
 *
 * A demon sits at a trap-door in the central wall. It lets fast molecules pass
 * only rightward and slow molecules only leftward, so the right chamber heats
 * and the left chamber cools — entropy apparently falling for free. The
 * resolution (Szilard, Landauer, Bennett; deferred to FIG.20) is that every
 * sorting decision writes one bit into the demon's memory, and erasing a bit
 * costs at least k_B ln 2 of entropy. Toggle "account for memory" to watch the
 * erasure ledger pay back exactly what the sorting removed.
 */

const N = 160;
const DOOR_LO = 0.4; // door spans this y-range on the central wall
const DOOR_HI = 0.6;
const MEM_CAPACITY = 24; // bits before the demon must erase
const SEED = 0xd3_70_a1_c4 | 0;

interface M {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function speed(m: M): number {
  return Math.hypot(m.vx, m.vy);
}

function initGas(rng: Rng): M[] {
  const gas: M[] = [];
  for (let i = 0; i < N; i++) {
    const angle = randomRange(rng, 0, Math.PI * 2);
    // Broad speed spread so there is something to sort.
    const sp = randomRange(rng, 0.05, 0.4);
    gas.push({
      x: randomRange(rng, 0.03, 0.97),
      y: randomRange(rng, 0.03, 0.97),
      vx: Math.cos(angle) * sp,
      vy: Math.sin(angle) * sp,
    });
  }
  return gas;
}

const THRESHOLD = 0.22; // fast/slow cut

export function MaxwellsDemonScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();

  const [accountMemory, setAccountMemory] = useState(true);
  const accRef = useRef(accountMemory);
  accRef.current = accountMemory;

  const rngRef = useRef<Rng>(createRng(SEED));
  const gasRef = useRef<M[]>(initGas(rngRef.current));
  const bitsTotalRef = useRef(0); // every decision the demon makes
  const memUsedRef = useRef(0); // bits currently held in memory
  const erasedBitsRef = useRef(0); // bits erased so far (Landauer cost)
  const [hud, setHud] = useState({ tCold: 0, tHot: 0, bits: 0, erased: 0 });

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  function reset() {
    rngRef.current = createRng(SEED);
    gasRef.current = initGas(rngRef.current);
    bitsTotalRef.current = 0;
    memUsedRef.current = 0;
    erasedBitsRef.current = 0;
    setHud({ tCold: 0, tHot: 0, bits: 0, erased: 0 });
  }
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      const step = Math.min(dt, 0.04);
      const gas = gasRef.current;
      for (const m of gas) {
        const nx = m.x + m.vx * step;
        const ny = m.y + m.vy * step;
        // Outer walls.
        if (nx < 0) { m.x = 0; m.vx = Math.abs(m.vx); }
        else if (nx > 1) { m.x = 1; m.vx = -Math.abs(m.vx); }
        else m.x = nx;
        if (ny < 0) { m.y = 0; m.vy = Math.abs(m.vy); }
        else if (ny > 1) { m.y = 1; m.vy = -Math.abs(m.vy); }
        else m.y = ny;

        // Central wall at x = 0.5, with the demon's door at DOOR_LO..DOOR_HI.
        const crossing =
          (m.x - m.vx * step - 0.5) * (m.x - 0.5) < 0; // straddled x = 0.5 this step
        if (crossing) {
          const atDoor = m.y > DOOR_LO && m.y < DOOR_HI;
          let pass = false;
          if (atDoor) {
            const fast = speed(m) > THRESHOLD;
            // Demon's rule: fast go right, slow go left.
            pass = (m.vx > 0 && fast) || (m.vx < 0 && !fast);
            // Each evaluation at the door records one bit of "which molecule".
            bitsTotalRef.current += 1;
            memUsedRef.current += 1;
            if (accRef.current && memUsedRef.current >= MEM_CAPACITY) {
              erasedBitsRef.current += memUsedRef.current; // forced erasure
              memUsedRef.current = 0;
            }
          }
          if (!pass) {
            // Reflect off the closed wall.
            m.x = m.x < 0.5 ? 0.5 - 1e-4 : 0.5 + 1e-4;
            m.vx = -m.vx;
          }
        }
      }

      // Chamber temperatures = mean kinetic energy (½v²) per side.
      let kl = 0, nl = 0, kr = 0, nr = 0;
      for (const m of gas) {
        const ke = 0.5 * (m.vx * m.vx + m.vy * m.vy);
        if (m.x < 0.5) { kl += ke; nl++; } else { kr += ke; nr++; }
      }
      const tCold = nl > 0 ? kl / nl : 0;
      const tHot = nr > 0 ? kr / nr : 0;

      drawScene(ctx, tokens, width, height, gas, memUsedRef.current);

      // Throttle React HUD updates.
      if (bitsTotalRef.current % 5 === 0 || _t < 0.2) {
        setHud({
          tCold,
          tHot,
          bits: bitsTotalRef.current,
          erased: erasedBitsRef.current,
        });
      }
    },
  });

  const erasedK = erasureCostInUnitsOfK(hud.erased);
  const erasedJ = landauerErasureCost(hud.erased);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A demon at a trap-door sorts fast molecules right and slow molecules left; an erasure ledger tracks the k ln2-per-bit cost."
      />
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--color-fg-3)] sm:grid-cols-4">
        <span>
          T_cold (left): <span className="text-[var(--color-blue)]">{hud.tCold.toFixed(3)}</span>
        </span>
        <span>
          T_hot (right): <span className="text-[var(--color-red)]">{hud.tHot.toFixed(3)}</span>
        </span>
        <span>
          decisions: <span className="text-[var(--color-fg-2)]">{hud.bits}</span>
        </span>
        <span>
          erased: <span className="text-[var(--color-amber)]">{hud.erased}</span> bit
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] text-[var(--color-fg-3)]">
          {accountMemory ? (
            <>
              ΔS_erasure = {hud.erased} · k ln2 ={" "}
              <span className="text-[var(--color-amber)]">
                {erasedK.toFixed(2)} k
              </span>{" "}
              = {erasedJ.toExponential(2)} J/K — the sorting is paid for. Second
              law safe.
            </>
          ) : (
            <span className="text-[var(--color-red)]">
              Idealised demon: entropy falls with no ledger — an apparent
              violation, resolved by erasure (FIG.20).
            </span>
          )}
        </p>
        <div className="flex shrink-0 gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setAccountMemory((a) => !a)}
            className={`rounded-sm border px-3 py-1 transition-colors ${
              accountMemory
                ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
                : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
            }`}
          >
            account for memory: {accountMemory ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-sm border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-3)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  gas: M[],
  memUsed: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const boxW = Math.min(W - 4, (H - 4) * 1.8);
  const boxH = Math.min(H - 4, boxW * 0.55);
  const bx = (W - boxW) / 2;
  const by = (H - boxH) / 2;

  // Chamber tints.
  ctx.fillStyle = hexToRgba(tokens.blue, 0.06);
  ctx.fillRect(bx, by, boxW / 2, boxH);
  ctx.fillStyle = hexToRgba(tokens.red, 0.06);
  ctx.fillRect(bx + boxW / 2, by, boxW / 2, boxH);

  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, boxW, boxH);

  // Central wall with the door gap.
  const midX = bx + boxW / 2;
  ctx.strokeStyle = tokens.textMute;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(midX, by);
  ctx.lineTo(midX, by + DOOR_LO * boxH);
  ctx.moveTo(midX, by + DOOR_HI * boxH);
  ctx.lineTo(midX, by + boxH);
  ctx.stroke();

  // The demon: a small marker by the door.
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(midX, by + ((DOOR_LO + DOOR_HI) / 2) * boxH, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Molecules, coloured by speed (blue = slow/cold, red = fast/hot).
  for (const m of gas) {
    ctx.fillStyle = speed(m) > THRESHOLD ? tokens.red : tokens.blue;
    ctx.beginPath();
    ctx.arc(bx + m.x * boxW, by + m.y * boxH, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Memory ledger bar (top-left of the box).
  const ledgerW = boxW * 0.28;
  const ledgerX = bx + 6;
  const ledgerY = by + 6;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.strokeRect(ledgerX + 0.5, ledgerY + 0.5, ledgerW, 6);
  ctx.fillStyle = tokens.amber;
  ctx.fillRect(ledgerX, ledgerY, ledgerW * (memUsed / MEM_CAPACITY), 6);
  ctx.fillStyle = tokens.textFaint;
  ctx.font = tokens.fontHudSmall;
  ctx.textBaseline = "top";
  ctx.fillText("demon memory", ledgerX, ledgerY + 9);

  // Chamber labels.
  ctx.fillStyle = tokens.blue;
  ctx.font = tokens.fontHud;
  ctx.textBaseline = "bottom";
  ctx.fillText("COLD", bx + 8, by + boxH - 6);
  ctx.fillStyle = tokens.red;
  const hot = "HOT";
  ctx.fillText(hot, bx + boxW - 8 - ctx.measureText(hot).width, by + boxH - 6);
}
