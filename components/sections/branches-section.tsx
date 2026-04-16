import { getTranslations } from "next-intl/server";
import { BranchCard } from "@/components/layout/branch-card";
import { BRANCHES } from "@/lib/content/branches";
import { WIDE_CONTAINER } from "@/lib/layout";

export async function BranchesSection() {
  const t = await getTranslations("home.branches");

  return (
    <section id="branches" className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
        {t("tag")}
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
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
    </section>
  );
}
