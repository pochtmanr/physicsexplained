"use client";

import { useState } from "react";

/**
 * RIEMANN SYMMETRY COUNTER SCENE — §08 THE RIEMANN TENSOR
 *
 * Visual breakdown of the counting argument that reduces 4⁴ = 256 raw components
 * to 20 algebraically independent ones in 4D:
 *
 *   Step 0: 4⁴ = 256 raw components.
 *   Step 1: Antisymmetry in (μ, ν): R^ρ_{σμν} = -R^ρ_{σνμ} → 4² × C(4,2) = 16×6 = 96.
 *   Step 2: Antisymmetry in (ρ, σ) with lowered first index → × C(4,2)/4 → ×6/4 → 36.
 *   Step 3: Symmetry under pair swap (ρσ ↔ μν) → 21.
 *   Step 4: First Bianchi identity R^ρ_{[σμν]} = 0 → removes 1 → 20.
 *
 * The scene shows a bar chart and a table. The user can step through each
 * reduction to see how the count drops.
 */

interface Step {
  label: string;
  count: number;
  explanation: string;
  color: string;
}

const STEPS: Step[] = [
  {
    label: "Raw components",
    count: 256,
    explanation: "Four free indices, each running 0–3 in 4D: 4⁴ = 256 entries.",
    color: "#64748b",
  },
  {
    label: "Antisymmetry in (μ, ν)",
    count: 96,
    explanation:
      "R^ρ_{σμν} = −R^ρ_{σνμ}: the last two indices are antisymmetric. Only C(4,2) = 6 independent pairs remain instead of 16 ordered pairs. 4 × 4 × 6 = 96.",
    color: "#3b82f6",
  },
  {
    label: "Antisymmetry in (ρ, σ)",
    count: 36,
    explanation:
      "After lowering the first index: R_{ρσμν} = −R_{σρμν}. The first two indices also antisymmetrise. 6 × 6 = 36 independent (ρσ)(μν) block pairs.",
    color: "#8b5cf6",
  },
  {
    label: "Pair-swap symmetry",
    count: 21,
    explanation:
      "R_{ρσμν} = R_{μνρσ}: the two antisymmetric pairs can be swapped. This is a symmetry of a 6×6 symmetric matrix: C(6,2) + 6 = 15 + 6 = 21.",
    color: "#ec4899",
  },
  {
    label: "First Bianchi identity",
    count: 20,
    explanation:
      "R^ρ_{[σμν]} = 0: the totally antisymmetric part vanishes. In 4D this gives exactly one additional constraint per fully antisymmetric set of four indices. 21 − 1 = 20.",
    color: "#f59e0b",
  },
];

const DIM_DATA: { n: number; count: number }[] = [
  { n: 1, count: 0 },
  { n: 2, count: 1 },
  { n: 3, count: 6 },
  { n: 4, count: 20 },
];

const BAR_MAX = 256;
const BAR_H = 28;
const BAR_GAP = 8;

export function RiemannSymmetryCounterScene() {
  const [activeStep, setActiveStep] = useState(STEPS.length - 1);

  const visibleSteps = STEPS.slice(0, activeStep + 1);
  const current = STEPS[activeStep];

  return (
    <div className="flex flex-col gap-4 font-mono text-sm">
      {/* Bar chart */}
      <div className="rounded-lg border border-white/10 bg-[#0f172a] p-4">
        <p className="mb-3 text-xs text-white/40">Independent Riemann components — 4D</p>
        <div className="flex flex-col gap-2">
          {visibleSteps.map((step, i) => {
            const widthPct = (step.count / BAR_MAX) * 100;
            return (
              <div
                key={i}
                className="flex cursor-pointer items-center gap-2"
                onClick={() => setActiveStep(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setActiveStep(i)}
              >
                <div className="w-36 shrink-0 truncate text-right text-[11px] text-white/60">
                  {step.label}
                </div>
                <div className="relative flex-1" style={{ height: `${BAR_H}px` }}>
                  <div
                    className="absolute inset-y-0 left-0 flex items-center justify-end pr-2 transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      minWidth: 32,
                      background: step.color,
                      opacity: i === activeStep ? 1 : 0.45,
                      borderRadius: 4,
                    }}
                  >
                    <span className="text-xs font-bold text-white">{step.count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="mt-2 flex items-center justify-end gap-1 text-[11px] text-white/40"
          style={{ paddingLeft: 152 }}
        >
          <span>0</span>
          <div className="flex-1 border-t border-white/10" />
          <span>256</span>
        </div>
        <p className="mt-3 leading-relaxed text-xs text-white/70">{current.explanation}</p>
        {/* Step navigation */}
        <div className="mt-3 flex gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`h-2 flex-1 rounded transition-colors ${i === activeStep ? "bg-amber-400" : i < activeStep ? "bg-white/30" : "bg-white/10"}`}
            />
          ))}
        </div>
        <p className="mt-1 text-center text-[10px] text-white/30">click a bar or step to walk through</p>
      </div>

      {/* Cross-dimension table */}
      <div className="rounded-lg border border-white/10 bg-[#0f172a] p-4">
        <p className="mb-3 text-xs text-white/40">Independent components n²(n²−1)/12 across dimensions</p>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-1 text-left font-normal text-white/40">Dim n</th>
              <th className="py-1 text-left font-normal text-white/40">4⁴ raw</th>
              <th className="py-1 text-left font-normal text-white/40">Independent</th>
              <th className="py-1 text-left font-normal text-white/40">Physical meaning</th>
            </tr>
          </thead>
          <tbody>
            {DIM_DATA.map(({ n, count }) => (
              <tr
                key={n}
                className={`border-b border-white/5 ${n === 4 ? "text-amber-400" : "text-white/70"}`}
              >
                <td className="py-1 font-bold">{n}</td>
                <td className="py-1">{n ** 4}</td>
                <td className="py-1 font-bold">{count}</td>
                <td className="py-1 text-white/40">
                  {n === 1 && "Always flat"}
                  {n === 2 && "Gaussian curvature K"}
                  {n === 3 && "Ricci tensor only (Weyl = 0)"}
                  {n === 4 && "20 scalars — spacetime curvature"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-white/30">
          Formula: n²(n²−1)/12. In 2D a single number (Gaussian curvature) characterises the geometry.
          In 4D spacetime, 20 numbers per point are needed.
        </p>
      </div>
    </div>
  );
}
