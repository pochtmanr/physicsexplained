import Link from "next/link";
import { PendulumScene } from "@/components/physics/pendulum-scene";
import { WIDE_CONTAINER } from "@/lib/layout";

export function FeaturedTopicSection() {
  return (
    <section className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
            § FEATURED
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
            Start here: The Pendulum.
          </h2>
          <div className="text-[var(--color-fg-1)] mt-6 space-y-4">
            <p>
              The pendulum is the first serious toy physics ever gave us. It
              was how Galileo discovered that time could be measured by motion,
              and how three hundred years of clocks kept pace with the turning
              of the Earth.
            </p>
            <p>
              Its motion looks simple — a bob swinging back and forth — but
              hiding inside that swing is the most important equation in all of
              oscillations. Pull it out, and you get music, lasers, bridges,
              and the guts of quantum mechanics.
            </p>
          </div>
          <div className="mt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
            5 MIN READ · 5 LIVE FIGURES · CLASSICAL MECHANICS
          </div>
          <Link
            href="/classical-mechanics/pendulum"
            className="mt-8 inline-flex items-center border border-[var(--color-cyan)] px-6 py-3 font-mono text-sm uppercase tracking-wider text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 transition"
          >
            → Read the pendulum
          </Link>
        </div>
        <div className="border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-6 flex items-center justify-center">
          <PendulumScene theta0={0.35} length={1.2} width={420} height={360} />
        </div>
      </div>
    </section>
  );
}
