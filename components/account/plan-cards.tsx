"use client";
import { PLANS, type PlanId } from "@/lib/billing/plans";

interface Props {
  currentPlan: PlanId;
  onSelect: (plan: "starter" | "pro") => void;
  busy?: "starter" | "pro" | null;
  hideFree?: boolean;
}

export function PlanCards({ currentPlan, onSelect, busy, hideFree }: Props) {
  const entries = Object.values(PLANS).filter((p) => !(hideFree && p.id === "free"));
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {entries.map((p) => {
        const isCurrent = p.id === currentPlan;
        const priceLabel = p.priceCents === 0 ? "$0" : `$${(p.priceCents / 100).toFixed(0)}/mo`;
        return (
          <div
            key={p.id}
            className={`border p-4 flex flex-col ${
              isCurrent ? "border-[var(--color-cyan)]" : "border-[var(--color-fg-4)]"
            }`}
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
              {p.label}
            </div>
            <div className="mt-2 text-xl text-[var(--color-fg-0)]">{priceLabel}</div>
            <p className="mt-2 text-xs text-[var(--color-fg-1)] min-h-[2.5em]">{p.blurb}</p>
            <div className="mt-4">
              {p.id === "free" ? (
                <span className="block text-center font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
                  {isCurrent ? "Current" : "—"}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isCurrent || busy === p.id}
                  onClick={() => onSelect(p.id as "starter" | "pro")}
                  className="w-full border border-[var(--color-cyan-dim)] px-3 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] transition-colors hover:bg-[var(--color-cyan-dim)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isCurrent ? "Current" : busy === p.id ? "Opening…" : currentPlan === "pro" ? "Downgrade" : "Upgrade"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
