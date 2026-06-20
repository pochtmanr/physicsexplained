import Link from "next/link";
import { Sparkles, Gamepad2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
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
          className={buttonVariants({ variant: "ghost", size: "sm", className: "nav-link" })}
        >
          <Sparkles aria-hidden="true" size={14} strokeWidth={1.6} />
          <span>{t("ctaAsk")}</span>
        </Link>
        <Link
          href="/play"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "nav-link" })}
        >
          <Gamepad2 aria-hidden="true" size={14} strokeWidth={1.6} />
          <span>{t("ctaPlay")}</span>
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
