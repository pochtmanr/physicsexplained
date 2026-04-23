export function KillSwitchBanner() {
  return (
    <div className="border-b border-[var(--color-magenta)]/40 bg-[var(--color-magenta)]/[0.06] border-l-2 border-l-[var(--color-magenta)] px-4 py-3 flex flex-wrap items-center gap-3">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-magenta)]">
        Kill switch
      </span>
      <span className="text-sm text-[var(--color-fg-1)]">
        Ask is temporarily disabled. Check back soon.
      </span>
    </div>
  );
}
