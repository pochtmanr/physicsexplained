import { getTranslations } from "next-intl/server";
import { WIDE_CONTAINER } from "@/lib/layout";
import { PhilosophyCards } from "./philosophy-cards";

interface Rule {
  label: string;
  title: string;
  body: string;
  cta?: string;
}

export async function PhilosophySection() {
  const t = await getTranslations("home.philosophy");
  const rules = t.raw("rules") as readonly Rule[];

  return (
    <section className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
        {t("tag")}
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
        {t("title")}
      </h2>
      <PhilosophyCards rules={rules} />
    </section>
  );
}
