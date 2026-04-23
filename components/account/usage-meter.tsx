import type { BillingSnapshot } from "@/lib/billing/snapshot";

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function daysUntil(iso: string): number {
  const d = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(d / 86_400_000));
}

export function UsageMeter({ snapshot }: { snapshot: BillingSnapshot }) {
  const warn = snapshot.percentUsed >= 90;
  const barColor = warn ? "bg-[var(--color-magenta)]" : "bg-[var(--color-cyan)]";

  const main =
    snapshot.plan.id === "free"
      ? `${snapshot.freeQuestionsUsed} / ${snapshot.plan.freeQuestions} questions used`
      : `${fmtTokens(snapshot.tokensUsed)} / ${fmtTokens(snapshot.tokensAllowance)} tokens`;

  const sub =
    snapshot.plan.id === "free"
      ? `resets in ${daysUntil(snapshot.cycleEnd)}d`
      : `~ ${snapshot.questionsRemaining.toLocaleString()} questions · resets in ${daysUntil(snapshot.cycleEnd)}d`;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
        <span>{main}</span>
        <span>{snapshot.percentUsed}%</span>
      </div>
      <div className="h-1.5 w-full bg-[var(--color-fg-4)]">
        <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, snapshot.percentUsed)}%` }} />
      </div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">{sub}</div>
    </div>
  );
}
