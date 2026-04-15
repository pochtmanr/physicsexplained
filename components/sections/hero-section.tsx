import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EpicycleScene } from "@/components/physics/epicycle-scene";
import { WIDE_CONTAINER } from "@/lib/layout";

export async function HeroSection() {
  const t = await getTranslations("home.hero");

  return (
    <section
      className={`${WIDE_CONTAINER} relative pt-20 pb-32 min-h-[640px] lg:min-h-[90vh] flex items-center`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-16 items-center w-full">
        <div className="min-w-0">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
            {t("tag")}
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] text-[var(--color-fg-0)]">
            {t("titleLead")}{" "}
            <span className="font-display font-semibold italic text-[var(--color-cyan)]">
              {t("titleHighlight")}
            </span>
          </h1>
          <p className="mt-6 text-sm md:mt-8 md:text-xl text-[var(--color-fg-1)] max-w-[48ch]">
            {t("subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap gap-6 items-center">
            <Link
              href="/classical-mechanics"
              className="inline-flex items-center gap-2 border border-[var(--color-cyan)] px-6 py-3 font-mono text-sm uppercase tracking-wider text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 transition"
            >
              {t("ctaPrimary")}
              <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
                →
              </span>
            </Link>
            <a
              href="#branches"
              className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-[var(--color-fg-2)] hover:text-[var(--color-cyan)]"
            >
              {t("ctaSecondary")}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="relative hidden min-w-0 lg:block">
          <div className="relative mx-auto w-fit">
            <div className="pointer-events-none absolute inset-0 -z-10 scale-[1.6] bg-[radial-gradient(circle_at_center,_rgba(91,233,255,0.2),_transparent_70%)]" />
            <div className="pointer-events-none absolute -top-4 start-0 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
              {t("figLabel")}
            </div>
            <EpicycleScene />
          </div>
        </div>
      </div>
    </section>
  );
}
