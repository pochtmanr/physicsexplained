import Link from "next/link";
import { SweepAreas } from "@/components/physics/sweep-areas";
import { WIDE_CONTAINER } from "@/lib/layout";

export function HeroSection() {
  return (
    <section
      className={`${WIDE_CONTAINER} relative pt-20 pb-32 min-h-[640px] lg:min-h-[90vh] flex items-center`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-16 items-center w-full">
        <div className="min-w-0">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
            PHYSICS · V0.5 · CLASSICAL MECHANICS LIVE
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.02] text-[var(--color-fg-0)]">
            Physics explained
            <br />
            in{" "}
            <span className="font-display font-semibold text-[var(--color-cyan)]">
              motion.
            </span>
            
          </h1>
          <p className="mt-8 text-lg md:text-xl text-[var(--color-fg-1)] max-w-[48ch]">
            From pendulums to planets — real physics, real simulations, no
            videos.
          </p>
          <div className="mt-10 flex flex-wrap gap-6 items-center">
            <Link
              href="/classical-mechanics"
              className="inline-flex items-center border border-[var(--color-cyan)] px-6 py-3 font-mono text-sm uppercase tracking-wider text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 transition"
            >
              Start with classical mechanics → 
            </Link>
            <a
              href="#branches"
              className="font-mono text-sm uppercase tracking-wider text-[var(--color-fg-2)] hover:text-[var(--color-cyan)]"
            >
              Or browse all six branches ↓
            </a>
          </div>
        </div>

        <div className="relative hidden min-w-0 lg:block">
          <div className="relative mx-auto w-fit">
            <div className="pointer-events-none absolute inset-0 -z-10 scale-[1.6] bg-[radial-gradient(circle_at_center,_rgba(91,233,255,0.2),_transparent_70%)]" />
            <div className="pointer-events-none absolute -top-4 left-0 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
              FIG.02 · EQUAL AREAS, EQUAL TIMES
            </div>
            <SweepAreas a={1} e={0.6} T={18} wedges={6} width={560} height={440} />
          </div>
        </div>
      </div>
    </section>
  );
}
