"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import type { Problem } from "@/lib/content/types";
import { StepRow, type StepStatus } from "./step-row";

interface ProblemStrings {
  steps: Record<string, { prompt: string; hint?: string; commonMistakes?: readonly string[] }>;
  walkthrough?: string;
}

interface Props {
  problem: Problem;
  strings: ProblemStrings;
}

interface StepState {
  status: StepStatus;
  studentExpr: string;
  diagnosis?: string;
  requiresAuthForDiagnosis?: boolean;
  quotaExhausted?: boolean;
}

export function StepPad({ problem, strings }: Props) {
  const locale = useLocale();
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [states, setStates] = useState<StepState[]>(() =>
    problem.steps.map((_, i) => ({
      status: i === 0 ? "active" : "locked",
      studentExpr: "",
    })),
  );

  function setAt(i: number, patch: Partial<StepState>) {
    setStates((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  /**
   * Re-open a CORRECT or SKIPPED step for editing. Lock all later steps so
   * the student doesn't end up with stale "next" steps revealed when they
   * change a prerequisite.
   */
  function editStep(i: number) {
    setStates((prev) =>
      prev.map((s, idx) => {
        if (idx < i) return s;
        if (idx === i) {
          return {
            ...s,
            status: "active",
            diagnosis: undefined,
            requiresAuthForDiagnosis: undefined,
            quotaExhausted: undefined,
          };
        }
        return { status: "locked", studentExpr: "" };
      }),
    );
  }

  async function submit(i: number, expr: string) {
    setAt(i, {
      status: "checking",
      studentExpr: expr,
      diagnosis: undefined,
      requiresAuthForDiagnosis: undefined,
      quotaExhausted: undefined,
    });
    try {
      const res = await fetch(`/api/problems/${problem.id}/check`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stepId: problem.steps[i].id, studentExpr: expr, locale }),
      });
      const body = await res.json();

      if (body.verify?.ok) {
        setAt(i, { status: "correct" });
        if (i + 1 < problem.steps.length) {
          setAt(i + 1, { status: "active" });
        } else {
          setWalkthroughOpen(true);
        }
        return;
      }

      // Wrong (or non-2xx). Stay on the step; surface whatever the route told us.
      setAt(i, {
        status: "wrong",
        diagnosis: body.diagnosis,
        requiresAuthForDiagnosis: !!body.requiresAuthForDiagnosis,
        quotaExhausted: !!body.quotaExhausted,
      });
    } catch (e) {
      setAt(i, {
        status: "wrong",
        diagnosis: `Network error: ${(e as Error).message}`,
      });
    }
  }

  function showMe(i: number) {
    setAt(i, { status: "skipped", studentExpr: problem.steps[i].canonicalExpr });
    if (i + 1 < problem.steps.length) setAt(i + 1, { status: "active" });
    else setWalkthroughOpen(true);
  }

  return (
    <div>
      {problem.steps.map((step, i) => {
        const s = states[i];
        const stepStrings = strings.steps[step.id] ?? { prompt: step.id, hint: undefined, commonMistakes: [] };
        return (
          <StepRow
            key={step.id}
            step={step}
            index={i}
            prompt={stepStrings.prompt}
            hint={stepStrings.hint}
            status={s.status}
            studentExpr={s.studentExpr}
            diagnosis={s.diagnosis}
            requiresAuthForDiagnosis={s.requiresAuthForDiagnosis}
            quotaExhausted={s.quotaExhausted}
            onChange={(expr) => setAt(i, { studentExpr: expr })}
            onSubmit={(expr) => submit(i, expr)}
            onShowMe={() => showMe(i)}
            onEdit={() => editStep(i)}
          />
        );
      })}

      {strings.walkthrough && (
        <details
          open={walkthroughOpen}
          onToggle={(e) => setWalkthroughOpen((e.target as HTMLDetailsElement).open)}
          className="mt-6 border border-[var(--color-fg-4)] p-4"
        >
          <summary className="cursor-pointer select-none font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] hover:text-[var(--color-cyan)]">
            Solution walkthrough
          </summary>
          <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-fg-1)]">
            {strings.walkthrough}
          </div>
        </details>
      )}
    </div>
  );
}
