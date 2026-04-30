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
        "border p-4 mb-3 transition-colors",
        status === "locked"   && "opacity-50 border-[var(--color-fg-4)]",
        status === "correct"  && "border-emerald-700/60 bg-emerald-950/15",
        status === "wrong"    && "border-rose-700/60 bg-rose-950/10",
        status === "active"   && "border-[var(--color-cyan)]",
        status === "checking" && "border-[var(--color-cyan)]",
        status === "skipped"  && "border-amber-700/50 bg-amber-950/10",
      )}
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
            Step {index + 1}
          </span>
          <h3 className="text-sm text-[var(--color-fg-0)]">{prompt}</h3>
        </div>
        {isResolved && (
          <button
            onClick={onEdit}
            className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] underline-offset-2 hover:text-[var(--color-cyan)] hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {status === "correct" && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-emerald-400">✓</span>
          <code className="font-mono text-sm text-[var(--color-fg-1)]">
            {step.varName} = {studentExpr}
          </code>
        </div>
      )}

      {status === "skipped" && (
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-xs uppercase tracking-wider text-amber-400">
            revealed
          </span>
          <code className="font-mono text-sm text-[var(--color-fg-1)]">
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
              className="flex-1 min-w-[12rem] border border-[var(--color-fg-4)] bg-transparent px-3 py-2 font-mono text-sm text-[var(--color-fg-0)] outline-none placeholder:text-[var(--color-fg-3)] focus:border-[var(--color-cyan)]"
            />
            <button
              onClick={() => onSubmit(studentExpr)}
              disabled={status === "checking" || !studentExpr.trim()}
              className="btn-tracer inline-flex items-center gap-2 border border-[var(--color-cyan)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)] transition hover:bg-[var(--color-cyan)]/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "checking" ? "Checking…" : "Check"}
            </button>
            <button
              onClick={onShowMe}
              className="inline-flex items-center gap-2 border border-[var(--color-fg-4)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan)]"
            >
              Show me
            </button>
          </div>

          {hint && (
            <details className="mt-3 text-sm text-[var(--color-fg-1)]">
              <summary className="cursor-pointer select-none hover:text-[var(--color-fg-0)]">
                Hint
              </summary>
              <p className="mt-1 border-l border-[var(--color-fg-4)] pl-3">{hint}</p>
            </details>
          )}

          {status === "wrong" && diagnosis && !requiresAuthForDiagnosis && !quotaExhausted && (
            <p className="mt-3 text-sm leading-relaxed text-rose-300">{diagnosis}</p>
          )}

          {status === "wrong" && !diagnosis && !requiresAuthForDiagnosis && !quotaExhausted && (
            <p className="mt-3 text-sm text-rose-300">
              Not quite — try again, or use <em>Show me</em> to reveal the canonical step.
            </p>
          )}

          {requiresAuthForDiagnosis && (
            <div className="mt-3 border border-cyan-800/40 bg-cyan-950/15 p-3 text-sm text-[var(--color-fg-0)]">
              That answer didn&apos;t match.{" "}
              <Link
                href={`/${locale}/sign-in?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                className="text-[var(--color-cyan)] underline-offset-2 hover:underline"
              >
                Sign in
              </Link>{" "}
              to get an AI tutor explanation of where the algebra went off — or use <em>Show me</em> for the canonical step.
            </div>
          )}

          {quotaExhausted && (
            <div className="mt-3 border border-amber-800/40 bg-amber-950/15 p-3 text-sm text-[var(--color-fg-0)]">
              You&apos;ve used today&apos;s free AI feedback (5/day).{" "}
              <Link
                href={`/${locale}/billing`}
                className="text-[var(--color-cyan)] underline-offset-2 hover:underline"
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
