"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2, AlertTriangle } from "lucide-react";

interface OrderPayload {
  orderId: string;
  plan: string;
  amountCents: number;
  currency: string;
  state: "pending" | "completed" | "failed" | "refunded";
  createdAt: string;
}

type Phase = "polling" | "success" | "failed" | "timeout" | "error";

const PLAN_LABEL: Record<string, string> = { starter: "Starter", pro: "Pro" };
const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 30; // ~60 seconds

export function ThankYouClient({ orderId, locale }: { orderId: string; locale: string }) {
  const [phase, setPhase] = useState<Phase>("polling");
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      attemptsRef.current += 1;
      try {
        const res = await fetch(`/api/billing/orders/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (cancelled) return;
          setPhase("error");
          return;
        }
        const data = (await res.json()) as OrderPayload;
        if (cancelled) return;
        setOrder(data);

        if (data.state === "completed") { setPhase("success"); return; }
        if (data.state === "failed" || data.state === "refunded") { setPhase("failed"); return; }

        if (attemptsRef.current >= MAX_ATTEMPTS) { setPhase("timeout"); return; }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setPhase("error");
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <div className="w-full border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-8 space-y-5">
      <Header phase={phase} />

      {order && phase === "success" && (
        <div className="mt-4 space-y-3 border-t border-[var(--color-fg-4)] pt-4">
          <Row label="Plan" value={PLAN_LABEL[order.plan] ?? order.plan} />
          <Row label="Amount" value={`${order.currency} ${(order.amountCents / 100).toFixed(2)}`} />
          <Row label="Order ID" value={order.orderId} mono />
        </div>
      )}

      {phase === "success" && (
        <div className="pt-2">
          <Link
            href={`/${locale}/ask`}
            className="inline-block border border-[var(--color-cyan-dim)] bg-[var(--color-cyan-dim)]/10 px-5 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] hover:bg-[var(--color-cyan-dim)]/20"
          >
            Start asking →
          </Link>
          <p className="mt-4 text-xs text-[var(--color-fg-3)]">
            A receipt has been emailed to you.
          </p>
        </div>
      )}

      {(phase === "failed" || phase === "error") && (
        <div className="pt-2 space-y-2">
          <Link
            href={`/${locale}/ask?drawer=billing`}
            className="inline-block border border-[var(--color-fg-3)] px-5 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/30"
          >
            Back to billing
          </Link>
        </div>
      )}

      {phase === "timeout" && (
        <div className="pt-2 space-y-3">
          <p className="text-xs text-[var(--color-fg-2)]">
            We haven&apos;t heard back from the payment processor yet. Your plan will activate
            automatically once confirmed — check back in a minute or reload this page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-block border border-[var(--color-cyan-dim)] px-5 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] hover:bg-[var(--color-cyan-dim)]/10"
          >
            Reload
          </button>
        </div>
      )}
    </div>
  );
}

function Header({ phase }: { phase: Phase }) {
  if (phase === "polling") {
    return (
      <div className="flex items-start gap-3">
        <Loader2 className="mt-1 h-5 w-5 animate-spin text-[var(--color-cyan-dim)]" />
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
            Verifying payment
          </div>
          <p className="mt-1 text-sm text-[var(--color-fg-1)]">
            Hang tight — confirming with the payment processor.
          </p>
        </div>
      </div>
    );
  }
  if (phase === "success") {
    return (
      <div className="flex items-start gap-3">
        <Check className="mt-1 h-5 w-5 text-[var(--color-cyan)]" />
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
            Payment confirmed
          </div>
          <p className="mt-1 text-sm text-[var(--color-fg-1)]">
            Your plan is active. You can start asking now.
          </p>
        </div>
      </div>
    );
  }
  if (phase === "failed") {
    return (
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 text-[var(--color-magenta)]" />
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-magenta)]">
            Payment did not complete
          </div>
          <p className="mt-1 text-sm text-[var(--color-fg-1)]">
            Nothing was charged. You can try again from the billing tab.
          </p>
        </div>
      </div>
    );
  }
  if (phase === "timeout") {
    return (
      <div className="flex items-start gap-3">
        <Loader2 className="mt-1 h-5 w-5 text-[var(--color-fg-3)]" />
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
            Still waiting
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <AlertTriangle className="mt-1 h-5 w-5 text-[var(--color-magenta)]" />
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-magenta)]">
          Could not verify
        </div>
        <p className="mt-1 text-sm text-[var(--color-fg-1)]">
          We couldn&apos;t reach the verification endpoint. Your payment may still go through.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">{label}</span>
      <span className={mono ? "font-mono text-xs text-[var(--color-fg-1)]" : "text-[var(--color-fg-0)]"}>
        {value}
      </span>
    </div>
  );
}
