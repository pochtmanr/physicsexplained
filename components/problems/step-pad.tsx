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
}

export function StepPad({ problem, strings }: Props) {
  const locale = useLocale();
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [states, setStates] = useState<StepState[]>(() =>
    problem.steps.map((_, i) => ({ status: i === 0 ? "active" : "locked", studentExpr: "" })),
  );

  function setAt(i: number, patch: Partial<StepState>) {
    setStates((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  async function submit(i: number, expr: string) {
    setAt(i, { status: "checking", studentExpr: expr });
    try {
      const res = await fetch(`/api/problems/${problem.id}/check`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stepId: problem.steps[i].id, studentExpr: expr, locale }),
      });
      const body = await res.json();
      if (res.status === 401) {
        window.location.href = `/${locale}/sign-in?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (body.verify?.ok) {
        setAt(i, { status: "correct", diagnosis: undefined });
        if (i + 1 < problem.steps.length) {
          setAt(i + 1, { status: "active" });
        } else {
          setWalkthroughOpen(true);
        }
      } else {
        setAt(i, { status: "wrong", diagnosis: body.diagnosis ?? (body.quotaExhausted ? "Daily diagnosis quota reached. Upgrade for unlimited feedback." : "Not quite.") });
      }
    } catch (e) {
      setAt(i, { status: "wrong", diagnosis: `Network error: ${(e as Error).message}` });
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
            onChange={(expr) => setAt(i, { studentExpr: expr })}
            onSubmit={(expr) => submit(i, expr)}
            onShowMe={() => showMe(i)}
          />
        );
      })}

      {strings.walkthrough && (
        <details open={walkthroughOpen} className="mt-6 border border-neutral-700 rounded-lg p-4 bg-neutral-950">
          <summary className="cursor-pointer text-sm text-cyan-400">Solution walkthrough</summary>
          <div className="mt-3 text-sm text-neutral-200 whitespace-pre-line">{strings.walkthrough}</div>
        </details>
      )}
    </div>
  );
}
