import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PendulumScene } from "@/components/physics/pendulum-scene";
import { buttonVariants } from "@/components/ui/button";
import { WIDE_CONTAINER } from "@/lib/layout";
import frameStyles from "./section-frame.module.css";

export async function FeaturedTopicSection() {
  const t = await getTranslations("home.featured");

  return (
    <section className="relative isolate overflow-hidden mt-32 md:mt-48 py-16 md:py-24">
      <div className={frameStyles.gridWash} aria-hidden="true" />
      <div className={`${WIDE_CONTAINER} relative z-10`}>
        <div className={frameStyles.shell}>
          <span className={`${frameStyles.shellCorner} ${frameStyles.scTl}`} aria-hidden="true" />
          <span className={`${frameStyles.shellCorner} ${frameStyles.scTr}`} aria-hidden="true" />
          <span className={`${frameStyles.shellCorner} ${frameStyles.scBl}`} aria-hidden="true" />
          <span className={`${frameStyles.shellCorner} ${frameStyles.scBr}`} aria-hidden="true" />
          <div
            className={`${frameStyles.shellInner} grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center px-6 py-10 md:px-12 md:py-14`}
          >
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
                {t("tag")}
              </div>
              <h2 className="mt-4 text-3xl md:text-4xl uppercase tracking-tight text-[var(--color-fg-0)]">
                {t("title")}
              </h2>
              <div className="text-sm md:text-base text-[var(--color-fg-1)] mt-6 space-y-4">
                <p>{t("body1")}</p>
                <p>{t("body2")}</p>
              </div>
              <div className="mt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
                {t("meta")}
              </div>
              <Link
                href="/classical-mechanics/pendulum"
                className={buttonVariants({ variant: "ghost", size: "cta-row", className: "nav-link mt-8" })}
              >
                <BookOpen aria-hidden="true" size={14} strokeWidth={1.6} />
                {t("cta")}
              </Link>
            </div>
            <div className="border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-6 flex items-center justify-center">
              <PendulumScene theta0={0.35} length={1.2} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
