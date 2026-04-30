"use client";
import clsx from "clsx";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { ProblemStep } from "@/lib/content/types";

export type StepStatus = "locked" | "active" | "checking" | "correct" | "wrong" | "skipped";

interface Props {
  step: ProblemStep;
  prompt: string;
  hint?: string;
  status: StepStatus;
  studentExpr: string;
  diagnosis?: string;
  /** Set when the user is anonymous and got a wrong answer — show sign-in CTA. */
  requiresAuthForDiagnosis?: boolean;
  /** Set when the user has used up their free 5/day diagnoses. */
  quotaExhausted?: boolean;
  onSubmit: (expr: string) => void;
  onChange: (expr: string) => void;
  onShowMe: () => void;
  /** Re-open a CORRECT or SKIPPED step for editing. */
  onEdit: () => void;
  index: number;
}

export function StepRow({
  step, prompt, hint, status, studentExpr, diagnosis,
  requiresAuthForDiagnosis, quotaExhausted,
  onSubmit, onChange, onShowMe, onEdit, index,
}: Props) {
  const locale = useLocale();
  const isInputVisible = status === "active" || status === "wrong" || status === "checking";
  const isResolved = status === "correct" || status === "skipped";

  return (
    <div
      className={clsx(
        "border rounded-lg p-4 mb-3 transition-colors",
        status === "locked"   && "opacity-50 bg-neutral-950 border-neutral-900",
        status === "correct"  && "border-emerald-700/60 bg-emerald-950/15",
        status === "wrong"    && "border-rose-700/60 bg-rose-950/10",
        status === "active"   && "border-cyan-700/60",
        status === "checking" && "border-cyan-700/60",
        status === "skipped"  && "border-amber-700/50 bg-amber-950/10",
      )}
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-3">
          <span className="text-xs uppercase tracking-wider text-neutral-500 font-mono">
            Step {index + 1}
          </span>
          <h3 className="text-sm text-neutral-100">{prompt}</h3>
        </div>
        {isResolved && (
          <button
            onClick={onEdit}
            className="text-xs text-cyan-500 hover:text-cyan-300 underline-offset-2 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {status === "correct" && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-emerald-400 text-sm">✓</span>
          <code className="text-sm text-neutral-300 font-mono">
            {step.varName} = {studentExpr}
          </code>
        </div>
      )}

      {status === "skipped" && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-amber-400 text-xs uppercase">revealed</span>
          <code className="text-sm text-neutral-300 font-mono">
            {step.varName} = {step.canonicalExpr}
          </code>
        </div>
      )}

      {isInputVisible && (
        <>
          <div className="flex flex-wrap gap-2 mt-2">
            <input
              type="text"
              value={studentExpr}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSubmit(studentExpr); }}
              disabled={status === "checking"}
              placeholder={`Enter ${step.varName} ...`}
              className="flex-1 min-w-[12rem] bg-neutral-950 border border-neutral-800 focus:border-cyan-700 outline-none rounded px-3 py-2 font-mono text-sm text-neutral-100 placeholder:text-neutral-600"
            />
            <button
              onClick={() => onSubmit(studentExpr)}
              disabled={status === "checking" || !studentExpr.trim()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm text-neutral-50 font-mono uppercase tracking-wider"
            >
              {status === "checking" ? "Checking…" : "Check"}
            </button>
            <button
              onClick={onShowMe}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-sm text-neutral-300 font-mono uppercase tracking-wider"
            >
              Show me
            </button>
          </div>

          {hint && (
            <details className="mt-3 text-sm text-neutral-400">
              <summary className="cursor-pointer hover:text-neutral-200 select-none">Hint</summary>
              <p className="mt-1 pl-3 border-l border-neutral-800">{hint}</p>
            </details>
          )}

          {status === "wrong" && diagnosis && !requiresAuthForDiagnosis && !quotaExhausted && (
            <p className="mt-3 text-sm text-rose-300 leading-relaxed">{diagnosis}</p>
          )}

          {status === "wrong" && !diagnosis && !requiresAuthForDiagnosis && !quotaExhausted && (
            <p className="mt-3 text-sm text-rose-300">
              Not quite — try again, or use <em>Show me</em> to reveal the canonical step.
            </p>
          )}

          {requiresAuthForDiagnosis && (
            <div className="mt-3 p-3 rounded border border-cyan-800/40 bg-cyan-950/15 text-sm text-neutral-200">
              That answer didn&apos;t match.{" "}
              <Link
                href={`/${locale}/sign-in?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                className="text-cyan-400 hover:text-cyan-300 underline-offset-2 hover:underline"
              >
                Sign in
              </Link>{" "}
              to get an AI tutor explanation of where the algebra went off — or use <em>Show me</em> for the canonical step.
            </div>
          )}

          {quotaExhausted && (
            <div className="mt-3 p-3 rounded border border-amber-800/40 bg-amber-950/15 text-sm text-neutral-200">
              You&apos;ve used today&apos;s free AI feedback (5/day).{" "}
              <Link
                href={`/${locale}/billing`}
                className="text-cyan-400 hover:text-cyan-300 underline-offset-2 hover:underline"
              >
                Upgrade
              </Link>{" "}
              for unlimited diagnoses, or use <em>Show me</em> for the canonical step.
            </div>
          )}
        </>
      )}
    </div>
  );
}
