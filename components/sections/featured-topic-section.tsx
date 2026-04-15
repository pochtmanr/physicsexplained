import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PendulumScene } from "@/components/physics/pendulum-scene";
import { WIDE_CONTAINER } from "@/lib/layout";

export async function FeaturedTopicSection() {
  const t = await getTranslations("home.featured");

  return (
    <section className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
            {t("tag")}
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
            {t("title")}
          </h2>
          <div className="text-[var(--color-fg-1)] mt-6 space-y-4">
            <p>{t("body1")}</p>
            <p>{t("body2")}</p>
          </div>
          <div className="mt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
            {t("meta")}
          </div>
          <Link
            href="/classical-mechanics/pendulum"
            className="mt-8 inline-flex items-center gap-2 border border-[var(--color-cyan)] px-6 py-3 font-mono text-sm uppercase tracking-wider text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 transition"
          >
            {t("cta")}
            <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
              →
            </span>
          </Link>
        </div>
        <div className="border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-6 flex items-center justify-center">
          <PendulumScene theta0={0.35} length={1.2} />
        </div>
      </div>
    </section>
  );
}
