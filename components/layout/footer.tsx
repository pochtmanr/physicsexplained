import Link from "next/link";
import { BRANCHES } from "@/lib/content/branches";
import { WIDE_CONTAINER } from "@/lib/layout";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-fg-3)]/40 mt-32">
      <div className={`${WIDE_CONTAINER} py-16`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
              PHYSICS · V0.5
            </div>
            <p className="mt-4 text-[var(--color-fg-1)]">
              Visual-first physics explainers.
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
              BRANCHES
            </h3>
            <ul className="mt-4 space-y-2">
              {BRANCHES.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/${b.slug}`}
                    className="font-mono text-sm text-[var(--color-fg-1)] hover:text-[var(--color-cyan)] transition-colors duration-[var(--duration-fast)]"
                  >
                    {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
              BUILT BY
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="font-mono text-sm text-[var(--color-fg-1)] hover:text-[var(--color-cyan)] transition-colors duration-[var(--duration-fast)]"
                >
                  About & Contact
                </Link>
              </li>
              <li>
                <a
                  href="https://www.simnetiq.store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-[var(--color-fg-1)] hover:text-[var(--color-cyan)] transition-colors duration-[var(--duration-fast)]"
                >
                  Simnetiq Ltd
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/simnetiq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-[var(--color-fg-1)] hover:text-[var(--color-cyan)] transition-colors duration-[var(--duration-fast)]"
                >
                  @simnetiq on X
                </a>
              </li>
            </ul>
            <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
              MIT · OPEN SOURCE
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-fg-3)]/40 mt-12 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="font-mono text-xs text-[var(--color-fg-2)]">
            © 2026 Simnetiq Ltd
          </div>
          <div className="font-mono text-xs text-[var(--color-fg-2)]">
            All animations accurate · No tracking · Made with care
          </div>
        </div>
      </div>
    </footer>
  );
}
