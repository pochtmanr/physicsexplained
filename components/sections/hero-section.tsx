import Link from "next/link";
import { Sparkles, GitBranch } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EpicycleScene } from "@/components/physics/epicycle-scene";
import { FramedCard } from "@/components/layout/framed-card";
import { buttonVariants } from "@/components/ui/button";
import { WIDE_CONTAINER } from "@/lib/layout";
import { HeroBackground } from "./hero-background";

export async function HeroSection() {
  const t = await getTranslations("home.hero");

  return (
    <section className="relative isolate overflow-hidden pt-8 pb-12 md:pt-20 md:pb-32 md:min-h-[720px] lg:min-h-[95vh] flex items-center">
      <HeroBackground />
      <div className={`${WIDE_CONTAINER} relative z-10`}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          <div className="min-w-0">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
              {t("tag")}
            </div>
            <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-[var(--color-fg-0)]">
              {t("titleLead")}{" "}
              <span className="font-display italic text-[var(--color-cyan)]">
                {t("titleHighlight")}
              </span>
            </h1>
            <p className="mt-6 text-sm md:mt-8 md:text-xl text-[var(--color-fg-1)] max-w-[48ch]">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 items-center md:mt-10 md:gap-6">
              <Link
                href="/ask"
                className={buttonVariants({ variant: "primary", size: "sm", className: "nav-link" })}
              >
                <Sparkles aria-hidden="true" size={14} strokeWidth={1.6} className="text-white" />
                {t("ctaAsk")}
              </Link>
              <a
                href="#branches"
                className={buttonVariants({ variant: "ghost", size: "sm", className: "nav-link" })}
              >
                <GitBranch aria-hidden="true" size={14} strokeWidth={1.6} />
                {t("ctaSecondary")}
              </a>
            </div>
          </div>

          <div className="hidden lg:block min-w-0">
            <FramedCard figLabel={t("fig1Label")}>
              <EpicycleScene />
            </FramedCard>
          </div>
        </div>
      </div>
    </section>
  );
}
