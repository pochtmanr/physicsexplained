"use client";
import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { UsageMeter } from "./usage-meter";
import { PlanCards } from "./plan-cards";
import { OrderHistory } from "./order-history";
import { openRevolutCheckout } from "@/lib/billing/revolut-client";
import type { BillingSnapshot } from "@/lib/billing/snapshot";
import type { PlanId } from "@/lib/billing/plans";

interface Props {
  snapshot: BillingSnapshot | null;
  orders: Array<{ id: string; plan: string; amount_cents: number; currency: string; state: string; created_at: string }>;
}

export function BillingTab({ snapshot, orders }: Props) {
  const [busy, setBusy] = useState<"starter" | "pro" | null>(null);
  const [cancelling, startCancel] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? "en";

  if (!snapshot) {
    return <div className="text-[var(--color-fg-3)] font-mono text-xs uppercase tracking-wider">No billing data.</div>;
  }

  const checkout = async (plan: "starter" | "pro") => {
    setBusy(plan); setErr(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        setErr(typeof message === "string" ? message : "Checkout failed");
        setBusy(null);
        return;
      }
      const { publicId, orderId } = (await res.json()) as { publicId: string; orderId: string };
      await openRevolutCheckout({
        publicId,
        onSuccess: () => {
          window.location.href = `/${locale}/billing/thank-you?order=${encodeURIComponent(orderId)}`;
        },
        onError: (e) => { setErr((e as Error)?.message ?? "Payment error"); setBusy(null); },
        onCancel: () => setBusy(null),
      });
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  };

  const cancel = () => startCancel(async () => {
    setErr(null);
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    if (!res.ok) setErr(`Cancel failed (${res.status})`);
    else window.location.reload();
  });

  const status = snapshot.status;
  return (
    <div className="space-y-6">
      <section className="border border-[var(--color-fg-4)] p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">Current plan</div>
          <StatusPill status={status} />
        </div>
        <div className="text-xl text-[var(--color-fg-0)]">
          {snapshot.plan.label}
          <span className="text-[var(--color-fg-3)]"> · </span>
          {snapshot.plan.priceCents === 0 ? "Free" : `$${(snapshot.plan.priceCents / 100).toFixed(0)}/mo`}
        </div>
        <UsageMeter snapshot={snapshot} />
        {snapshot.nextChargeAt && status === "active" && snapshot.plan.id !== "free" && (
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
            Next charge: {new Date(snapshot.nextChargeAt).toLocaleDateString()}
          </div>
        )}
        {status === "canceled" && (
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
            Access until {new Date(snapshot.cycleEnd).toLocaleDateString()}
          </div>
        )}
      </section>

      <section>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)] mb-3">Change plan</div>
        <PlanCards currentPlan={snapshot.plan.id as PlanId} onSelect={checkout} busy={busy} />
      </section>

      {snapshot.plan.id !== "free" && status === "active" && (
        <button
          type="button"
          onClick={cancel}
          disabled={cancelling}
          className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] underline hover:text-[var(--color-magenta)]"
        >
          {cancelling ? "Cancelling…" : "Cancel subscription"}
        </button>
      )}

      {err && <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)]">{err}</div>}

      <section>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)] mb-3">Payments</div>
        <OrderHistory orders={orders} />
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "past_due" | "canceled" }) {
  const cls =
    status === "active" ? "border-[var(--color-cyan-dim)] text-[var(--color-cyan-dim)]"
    : status === "canceled" ? "border-[var(--color-fg-3)] text-[var(--color-fg-3)]"
    : "border-[var(--color-magenta)] text-[var(--color-magenta)]";
  return (
    <span className={`inline-block border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  );
}

