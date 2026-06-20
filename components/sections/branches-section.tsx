import Link from "next/link";
import { Atom } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BranchCard } from "@/components/layout/branch-card";
import { buttonVariants } from "@/components/ui/button";
import { BRANCHES } from "@/lib/content/branches";
import { WIDE_CONTAINER } from "@/lib/layout";

export async function BranchesSection() {
  const t = await getTranslations("home.branches");
  const tHero = await getTranslations("home.hero");

  return (
    <section id="branches" className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
        {t("tag")}
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl uppercase tracking-tight text-[var(--color-fg-0)]">
        {t("sectionTitle")}
      </h2>
      <p className="mt-6 text-sm md:text-xl text-[var(--color-fg-1)] max-w-[48ch]">
        {t("sectionSubtitle")}
      </p>
      <div className="mt-12 grid grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-3 [&>*]:-mt-px [&>*]:-ms-px">
        {BRANCHES.map((b) => (
          <BranchCard key={b.slug} branch={b} />
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link
          href="/classical-mechanics"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "nav-link" })}
        >
          <Atom aria-hidden="true" size={14} strokeWidth={1.6} />
          {tHero("ctaPrimary")}
        </Link>
      </div>
    </section>
  );
}
