"use client";
import { useState } from "react";
import { PlanCards } from "./plan-cards";
import { openRevolutCheckout } from "@/lib/billing/revolut-client";
import type { PlanId } from "@/lib/billing/plans";

interface Props {
  open: boolean;
  onClose: () => void;
  reason: "free_quota_exhausted" | "tokens_exhausted" | "past_due";
  currentPlan: PlanId;
}

const TITLES: Record<Props["reason"], string> = {
  free_quota_exhausted: "You've used your 3 free questions this month",
  tokens_exhausted:     "You've used your monthly allowance",
  past_due:             "Your last payment didn't go through",
};

export function UpgradeModal({ open, onClose, reason, currentPlan }: Props) {
  const [busy, setBusy] = useState<"starter" | "pro" | null>(null);
  if (!open) return null;

  const checkout = async (plan: "starter" | "pro") => {
    setBusy(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) { setBusy(null); return; }
    const { publicId } = (await res.json()) as { publicId: string };
    await openRevolutCheckout(
      publicId,
      () => window.location.reload(),
      () => setBusy(null),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-0)]/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
          {TITLES[reason]}
        </div>
        <p className="mt-3 text-sm text-[var(--color-fg-1)]">
          {reason === "past_due"
            ? "Update your payment to resume where you left off."
            : "Pick a plan to keep going."}
        </p>
        <div className="mt-5">
          <PlanCards currentPlan={currentPlan} onSelect={checkout} busy={busy} hideFree />
        </div>
        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] hover:text-[var(--color-fg-0)]"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
