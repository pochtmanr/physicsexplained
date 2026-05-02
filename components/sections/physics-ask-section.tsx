import Link from "next/link";
import { Sparkles, Gamepad2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WIDE_CONTAINER } from "@/lib/layout";
import { PhysicsAskCard } from "./physics-ask-card";
import { EquationDrift } from "./physics-ask-bg/equation-drift";
import { NodeGraph } from "./physics-ask-bg/node-graph";
import { AsciiArtBg } from "./physics-ask-bg/ascii-art-bg";

export async function PhysicsAskSection() {
  const t = await getTranslations("home.physicsAsk");

  return (
    <section
      id="physics-ask"
      className={`${WIDE_CONTAINER} mt-32 md:mt-48`}
    >
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
        {t("tag")}
      </div>
      <h2 className="mt-6 text-3xl uppercase tracking-tight text-[var(--color-fg-0)] md:text-4xl">
        {t("title")}
      </h2>
      <p className="mt-6 max-w-[58ch] text-sm text-[var(--color-fg-1)] md:mt-8 md:text-xl">
        {t("subtitle")}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-10">
        <Link
          href="/ask"
          className="nav-link btn-tracer group relative inline-flex items-center justify-center gap-2 bg-[var(--color-cyan)] px-4 py-2 font-mono text-xs uppercase tracking-wider !text-white transition-[box-shadow,background-color] duration-[180ms] ease-out hover:bg-[color-mix(in_srgb,var(--color-cyan)_92%,white)] hover:shadow-[0_8px_32px_-8px_color-mix(in_srgb,var(--color-cyan)_60%,transparent),0_0_48px_color-mix(in_srgb,var(--color-cyan)_25%,transparent)] md:px-6 md:py-3 md:text-sm"
        >
          <Sparkles aria-hidden="true" size={14} strokeWidth={1.6} />
          <span>{t("ctaAsk")}</span>
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-[180ms] ease-out group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
          >
            →
          </span>
        </Link>
        <Link
          href="/play"
          className="nav-link btn-tracer group relative inline-flex items-center justify-center gap-2 border border-[var(--color-fg-4)] bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)] transition-[box-shadow,border-color,color] duration-[180ms] ease-out hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan)] hover:shadow-[0_8px_32px_-8px_color-mix(in_srgb,var(--color-cyan)_45%,transparent)] md:px-6 md:py-3 md:text-sm"
        >
          <Gamepad2 aria-hidden="true" size={14} strokeWidth={1.6} />
          <span>{t("ctaPlay")}</span>
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
          variant="default"
          eyebrow={t("cards.ask.eyebrow")}
          kicker={t("cards.ask.kicker")}
          title={t("cards.ask.title")}
          body={t("cards.ask.body")}
          background={
            <AsciiArtBg
              src="/images/landing/ascii-orbit.avif"
              align="right"
              sizes="(min-width: 768px) 66vw, 100vw"
            />
          }
          imageBleed
          className="md:col-span-2"
        />
        <PhysicsAskCard
          href="/ask"
          variant="default"
          eyebrow={t("cards.answers.eyebrow")}
          kicker={t("cards.answers.kicker")}
          title={t("cards.answers.title")}
          body={t("cards.answers.body")}
          background={<EquationDrift />}
        />
        <PhysicsAskCard
          href="/play/orbital-mechanics"
          variant="default"
          eyebrow={t("cards.drop.eyebrow")}
          kicker={t("cards.drop.kicker")}
          title={t("cards.drop.title")}
          body={t("cards.drop.body")}
          background={<NodeGraph />}
          tone="play"
        />
        <PhysicsAskCard
          href="/play/orbital-mechanics"
          variant="default"
          eyebrow={t("cards.trace.eyebrow")}
          kicker={t("cards.trace.kicker")}
          title={t("cards.trace.title")}
          body={t("cards.trace.body")}
          background={
            <AsciiArtBg
              src="/images/landing/ascii-spiral.avif"
              align="left"
              sizes="(min-width: 768px) 66vw, 100vw"
            />
          }
          imageBleed
          tone="play"
          className="md:col-span-2"
        />
      </div>
    </section>
  );
}
