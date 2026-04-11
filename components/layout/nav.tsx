import Link from "next/link";

export function Nav() {
  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between px-8 py-5 backdrop-blur-sm">
      <Link
        href="/"
        className="font-mono text-sm uppercase tracking-[0.2em] text-[var(--color-fg-0)]"
      >
        physics
      </Link>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
        v0
      </div>
    </nav>
  );
}
