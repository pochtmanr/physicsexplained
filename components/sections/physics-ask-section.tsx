import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { WIDE_CONTAINER } from "@/lib/layout";
import { PhysicsAskCard } from "./physics-ask-card";
import { DotField } from "./physics-ask-bg/dot-field";
import { EquationDrift } from "./physics-ask-bg/equation-drift";
import { WaveOrbit } from "./physics-ask-bg/wave-orbit";
import { NodeGraph } from "./physics-ask-bg/node-graph";

export async function PhysicsAskSection() {
  const t = await getTranslations("home.physicsAsk");

  return (
    <section id="physics-ask" className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
        {t("tag")}
      </div>
      <h2 className="mt-6 text-3xl md:text-4xl uppercase tracking-tight text-[var(--color-fg-0)]">
        {t("title")}
      </h2>
      <p className="mt-6 text-sm md:mt-8 md:text-xl text-[var(--color-fg-1)] max-w-[48ch]">
        {t("subtitle")}
      </p>
      <div className="mt-8 md:mt-10">
        <Link
          href="/ask"
          className="nav-link btn-tracer group relative inline-flex items-center gap-2 bg-[var(--color-cyan)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-white transition-[box-shadow,background-color] duration-[180ms] ease-out hover:bg-[color-mix(in_srgb,var(--color-cyan)_92%,white)] hover:shadow-[0_8px_32px_-8px_color-mix(in_srgb,var(--color-cyan)_60%,transparent),0_0_48px_color-mix(in_srgb,var(--color-cyan)_25%,transparent)] md:px-6 md:py-3 md:text-sm"
        >
          {t("ctaOpen")}
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-[180ms] ease-out group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
          >
            →
          </span>
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-0 md:grid-cols-3 [&>*]:-mt-px [&>*]:-ms-px">
        <PhysicsAskCard
          href="/ask"
          variant="inverted"
          eyebrow={t("cards.ask.eyebrow")}
          title={t("cards.ask.title")}
          body={t("cards.ask.body")}
          pill={t("cards.ask.pill")}
          background={<DotField />}
          className="md:col-span-2"
        />
        <PhysicsAskCard
          href="/ask"
          variant="default"
          eyebrow={t("cards.math.eyebrow")}
          title={t("cards.math.title")}
          body={t("cards.math.body")}
          pill={t("cards.math.pill")}
          background={<EquationDrift />}
        />
        <PhysicsAskCard
          href="/ask"
          variant="default"
          eyebrow={t("cards.simulate.eyebrow")}
          title={t("cards.simulate.title")}
          body={t("cards.simulate.body")}
          pill={t("cards.simulate.pill")}
          background={<WaveOrbit />}
        />
        <PhysicsAskCard
          href="/ask"
          variant="accent"
          eyebrow={t("cards.grounded.eyebrow")}
          title={t("cards.grounded.title")}
          body={t("cards.grounded.body")}
          pill={t("cards.grounded.pill")}
          background={<NodeGraph />}
          className="md:col-span-2"
        />
      </div>
    </section>
  );
}
