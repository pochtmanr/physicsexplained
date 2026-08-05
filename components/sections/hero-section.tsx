import Link from "next/link";
import { Sparkles, GitBranch, ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EpicycleScene } from "@/components/physics/epicycle-scene";
import { FramedCard } from "@/components/layout/framed-card";
import { buttonVariants } from "@/components/ui/button";
import { WIDE_CONTAINER } from "@/lib/layout";
import { HeroBackground } from "./hero-background";

/** First public release of the iOS / iPadOS app, announced in the hero. */
const IOS_APP_STORE_HREF =
  "https://apps.apple.com/us/app/physics-exp/id6793272026";

/** Apple's logomark — lucide's `Apple` is a fruit, not the brand. */
function AppleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 384 512"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9m-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3"></path>
    </svg>
  );
}

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
            <a
              href={IOS_APP_STORE_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-5 inline-flex items-center gap-2.5 rounded-full border border-[var(--color-fg-4)] bg-[color-mix(in_srgb,var(--color-fg-4)_22%,transparent)] py-1.5 ps-1.5 pe-3 font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-1)] shadow-[var(--shadow-control)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)]/50 md:text-[11px]"
            >
              <span className="rounded-full bg-[var(--color-cyan)] px-2 py-0.5 text-[10px] leading-none text-white">
                {t("appBadge")}
              </span>
              <AppleMark className="size-3 shrink-0 text-[var(--color-fg-2)] transition-colors group-hover:text-[var(--color-cyan-dim)]" />
              <span>{t("appAnnounce")}</span>
              <ArrowUpRight
                aria-hidden="true"
                size={13}
                strokeWidth={1.6}
                className="shrink-0 text-[var(--color-fg-3)] transition-colors group-hover:text-[var(--color-cyan-dim)] rtl:-scale-x-100"
              />
            </a>
            <h1 className="mt-5 text-[2.5rem] md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-[var(--color-fg-0)]">
              {t("titleLead")}{" "}
              <span className="font-display italic text-[var(--color-cyan)]">
                {t("titleHighlight")}
              </span>
            </h1>
            <p className="mt-6 text-sm md:mt-8 md:text-xl text-[var(--color-fg-1)] max-w-[48ch]">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 md:mt-10 md:flex-row md:flex-wrap md:items-center md:gap-6">
              <Link
                href="/ask"
                className={buttonVariants({ variant: "primary", size: "hero", className: "nav-link" })}
              >
                <Sparkles aria-hidden="true" size={14} strokeWidth={1.6} className="text-white" />
                {t("ctaAsk")}
              </Link>
              <a
                href="#branches"
                className={buttonVariants({ variant: "ghost", size: "hero", className: "nav-link" })}
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
