import { getTranslations } from "next-intl/server";
import { WIDE_CONTAINER } from "@/lib/layout";

interface Rule {
  label: string;
  title: string;
  body: string;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        {rules.map((rule) => (
          <div
            key={rule.label}
            className="border-s border-[var(--color-fg-3)] ps-6"
          >
            <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
              {rule.label}
            </div>
            <h3 className="mt-3 text-xl font-semibold text-[var(--color-fg-0)]">
              {rule.title}
            </h3>
            <p className="mt-3 text-[var(--color-fg-1)]">{rule.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
