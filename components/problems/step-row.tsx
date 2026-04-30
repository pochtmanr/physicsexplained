"use client";
import clsx from "clsx";
import type { ProblemStep } from "@/lib/content/types";

export type StepStatus = "locked" | "active" | "checking" | "correct" | "wrong" | "skipped";

interface Props {
  step: ProblemStep;
  prompt: string;
  hint?: string;
  status: StepStatus;
  studentExpr: string;
  diagnosis?: string;
  onSubmit: (expr: string) => void;
  onChange: (expr: string) => void;
  onShowMe: () => void;
  index: number;
}

export function StepRow({ step, prompt, hint, status, studentExpr, diagnosis, onSubmit, onChange, onShowMe, index }: Props) {
  const isActive = status === "active" || status === "wrong" || status === "checking";
  return (
    <div className={clsx("border rounded-lg p-4 mb-3",
      status === "locked"  && "opacity-50 bg-neutral-950",
      status === "correct" && "border-green-700 bg-green-950/20",
      status === "wrong"   && "border-red-700 bg-red-950/20",
      status === "active"  && "border-cyan-700",
      status === "skipped" && "border-yellow-700 bg-yellow-950/10",
    )}>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-sm text-neutral-400 font-mono">Step {index + 1}</span>
        <h3 className="text-base text-neutral-100">{prompt}</h3>
      </div>

      {status === "correct" && (
        <div className="text-sm text-neutral-400 font-mono">{step.varName} = {studentExpr}</div>
      )}
      {status === "skipped" && (
        <div className="text-sm text-neutral-400 font-mono">{step.varName} = {step.canonicalExpr} <span className="text-yellow-500 ml-2">(revealed)</span></div>
      )}

      {isActive && (
        <>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={studentExpr}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSubmit(studentExpr); }}
              disabled={status === "checking"}
              placeholder={`Enter ${step.varName} ...`}
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 font-mono text-sm"
            />
            <button
              onClick={() => onSubmit(studentExpr)}
              disabled={status === "checking" || !studentExpr.trim()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded text-sm"
            >
              {status === "checking" ? "Checking…" : "Check"}
            </button>
            <button onClick={onShowMe} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm">
              Show me
            </button>
          </div>
          {hint && (
            <details className="mt-2 text-sm text-neutral-400">
              <summary className="cursor-pointer">Hint</summary>
              <p className="mt-1">{hint}</p>
            </details>
          )}
          {diagnosis && (
            <p className="mt-2 text-sm text-red-400">{diagnosis}</p>
          )}
        </>
      )}
    </div>
  );
}
