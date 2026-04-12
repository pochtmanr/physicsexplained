import Link from "next/link";
import { getAllPhysicists } from "@/lib/content/physicists";
import { WIDE_CONTAINER } from "@/lib/layout";

export function PhysicistsSection() {
  const physicists = getAllPhysicists();
  const preview = physicists.slice(0, 6);

  return (
    <section id="physicists" className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
        § PHYSICISTS
      </div>
      <h2 className="mt-4 text-4xl md:text-5xl font-bold uppercase tracking-tight text-[var(--color-fg-0)]">
        The people behind the laws.
      </h2>
      <p className="mt-6 max-w-[50ch] text-[var(--color-fg-1)]">
        Galileo timed a chandelier against his pulse. Kepler ground eight years
        into the motion of Mars. The site&rsquo;s cast, in brief.
      </p>
      <div className="mt-12 grid grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-3 [&>*]:-mt-px [&>*]:-ml-px">
        {preview.map((p) => (
          <Link
            key={p.slug}
            href={`/physicists/${p.slug}`}
            className="group relative flex h-full min-h-[180px] flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-5 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)] md:min-h-[220px] md:p-6"
          >
            <div className="flex items-start justify-between">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-cyan)]">
                {p.born}&ndash;{p.died}
              </div>
              <span
                aria-hidden="true"
                className="inline-flex h-5 w-5 items-center justify-center text-base leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)]"
              >
                →
              </span>
            </div>
            <div className="mt-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)] md:text-sm">
              {p.shortName}
            </div>
            <p className="mt-2 text-xs leading-snug text-[var(--color-fg-2)] md:text-sm">
              {p.oneLiner}
            </p>
            <div className="mt-auto pt-4">
              <span className="inline-block border border-[var(--color-fg-3)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--color-fg-2)] transition-colors group-hover:border-[var(--color-cyan)] group-hover:text-[var(--color-cyan)]">
                {p.nationality}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {physicists.length > 6 && (
        <div className="mt-10 flex justify-center">
          <Link
            href="/physicists"
            className="inline-flex items-center gap-2 border border-[var(--color-fg-3)] px-6 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          >
            See all {physicists.length} physicists →
          </Link>
        </div>
      )}
    </section>
  );
}
