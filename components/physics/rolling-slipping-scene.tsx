"use client";

import { useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  requiredStaticFriction,
  SHAPE_FACTOR,
} from "@/lib/physics/rolling";

const CANVAS_W = 440;
const CANVAS_H = 280;
const PIVOT_X = 50;
const PIVOT_Y = 220;
const RAMP_LEN = 320;
const BALL_R = 16;

const CYAN = "#6FB8C6";
const RED = "#FF6B6B";

export function RollingSlippingScene() {
  const colors = useThemeColors();
  const [thetaDeg, setThetaDeg] = useState(20);
  const [muS, setMuS] = useState(0.4);

  const theta = (thetaDeg * Math.PI) / 180;
  const muReq = requiredStaticFriction(SHAPE_FACTOR.solidSphere, theta);
  const isRolling = muReq <= muS;
  const ballColor = isRolling ? CYAN : RED;

  // Position ball partway up the ramp
  const sAlong = 200; // pixels from pivot along ramp
  const ballCx =
    PIVOT_X + sAlong * Math.cos(-theta) - BALL_R * Math.sin(-theta);
  const ballCy =
    PIVOT_Y + sAlong * Math.sin(-theta) - BALL_R * Math.cos(-theta);
  const rampEndX = PIVOT_X + RAMP_LEN * Math.cos(-theta);
  const rampEndY = PIVOT_Y + RAMP_LEN * Math.sin(-theta);

  return (
    <div className="relative w-full pb-4">
      <svg
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="mx-auto block"
      >
        {/* Ground */}
        <line
          x1={20}
          y1={PIVOT_Y}
          x2={CANVAS_W - 20}
          y2={PIVOT_Y}
          stroke={colors.fg3}
          strokeWidth={1}
        />
        {/* Ramp */}
        <line
          x1={PIVOT_X}
          y1={PIVOT_Y}
          x2={rampEndX}
          y2={rampEndY}
          stroke={colors.fg2}
          strokeWidth={2}
        />
        {/* Vertical from ramp top */}
        <line
          x1={rampEndX}
          y1={rampEndY}
          x2={rampEndX}
          y2={PIVOT_Y}
          stroke={colors.fg3}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        {/* Angle arc */}
        <path
          d={`M ${PIVOT_X + 35} ${PIVOT_Y} A 35 35 0 0 0 ${
            PIVOT_X + 35 * Math.cos(-theta)
          } ${PIVOT_Y + 35 * Math.sin(-theta)}`}
          fill="none"
          stroke={colors.fg3}
          strokeWidth={1}
        />
        <text
          x={PIVOT_X + 18}
          y={PIVOT_Y - 10}
          fill={colors.fg2}
          fontSize={11}
          fontFamily="monospace"
        >
          θ
        </text>
        {/* Ball */}
        <circle
          cx={ballCx}
          cy={ballCy}
          r={BALL_R}
          fill={ballColor}
          opacity={0.85}
        />
        <circle
          cx={ballCx}
          cy={ballCy}
          r={BALL_R}
          fill="none"
          stroke={ballColor}
          strokeWidth={1.5}
        />
        {/* Status banner */}
        <text
          x={CANVAS_W / 2}
          y={28}
          fill={ballColor}
          fontSize={14}
          fontFamily="monospace"
          textAnchor="middle"
        >
          {isRolling ? "rolling cleanly" : "slipping — μ_s too low"}
        </text>
      </svg>

      <div className="mt-3 grid grid-cols-2 gap-4 font-mono text-[11px] text-[var(--color-fg-1)]">
        <label className="flex flex-col gap-1">
          <span>
            θ = {thetaDeg}°
          </span>
          <input
            type="range"
            min={0}
            max={80}
            step={1}
            value={thetaDeg}
            onChange={(e) => setThetaDeg(Number(e.target.value))}
            className="accent-[var(--color-cyan)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>μ_s = {muS.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muS}
            onChange={(e) => setMuS(Number(e.target.value))}
            className="accent-[var(--color-cyan)]"
          />
        </label>
      </div>
      <div className="pointer-events-none absolute right-2 top-2">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-[10px] leading-relaxed text-[var(--color-fg-1)] backdrop-blur-sm">
          <div>solid sphere, k = 2/5</div>
          <div>
            μ_req = (k tan θ)/(1+k) = <span style={{ color: ballColor }}>{muReq.toFixed(3)}</span>
          </div>
          <div>μ_s = {muS.toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
}
