interface Order {
  id: string;
  plan: string;
  amount_cents: number;
  currency: string;
  state: string;
  created_at: string;
}

export function OrderHistory({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
        No payments yet.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[var(--color-fg-4)]">
      {orders.map((o) => {
        const date = new Date(o.created_at).toLocaleDateString(undefined, {
          month: "short", day: "numeric", year: "numeric",
        });
        const amount = `$${(o.amount_cents / 100).toFixed(2)}`;
        const tone =
          o.state === "completed" ? "text-[var(--color-cyan)]"
          : o.state === "failed" ? "text-[var(--color-magenta)]"
          : "text-[var(--color-fg-3)]";
        return (
          <li key={o.id} className="py-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-mono uppercase tracking-wider text-[var(--color-fg-3)]">{date}</span>
            <span className="text-[var(--color-fg-1)] capitalize">{o.plan}</span>
            <span className="font-mono text-[var(--color-fg-0)]">{amount}</span>
            <span className={`font-mono uppercase tracking-wider ${tone}`}>{o.state}</span>
          </li>
        );
      })}
    </ul>
  );
}
