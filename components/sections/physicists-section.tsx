import Link from "next/link";
import { getMessages, getTranslations } from "next-intl/server";
import { getAllLocalizedPhysicists } from "@/lib/content/physicists";
import { WIDE_CONTAINER } from "@/lib/layout";

export async function PhysicistsSection() {
  const t = await getTranslations("home.physicists");
  const physicists = await getAllLocalizedPhysicists();
  const preview = physicists.slice(0, 6);
  const messages = (await getMessages()) as {
    common?: { pages?: { physicists?: { nationalities?: Record<string, string> } } };
  };
  const nationalityMap =
    messages.common?.pages?.physicists?.nationalities ?? {};

  return (
    <section id="physicists" className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
        {t("tag")}
      </div>
      <h2 className="mt-4 text-4xl md:text-5xl font-bold uppercase tracking-tight text-[var(--color-fg-0)]">
        {t("title")}
      </h2>
      <p className="mt-6 max-w-[50ch] text-[var(--color-fg-1)]">
        {t("subtitle")}
      </p>
      <div className="mt-12 grid grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-3 [&>*]:-mt-px [&>*]:-ms-px">
        {preview.map((p) => (
          <Link
            key={p.slug}
            href={`/physicists/${p.slug}`}
            className="group relative flex h-full min-h-[180px] flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-5 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)] md:min-h-[220px] md:p-6"
          >
            <div className="flex items-start justify-between">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-cyan)]">
                {p.born}&ndash;{p.died}
              </div>
              <span
                aria-hidden="true"
                className="inline-flex h-5 w-5 items-center justify-center text-base leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] rtl:-scale-x-100 rtl:group-hover:rotate-45"
              >
                →
              </span>
            </div>
            <div className="mt-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)] md:text-sm">
              {p.shortName}
            </div>
            <p className="mt-2 text-xs leading-snug text-[var(--color-fg-2)] md:text-sm">
              {p.oneLiner}
            </p>
            <div className="mt-auto pt-4">
              <span className="inline-block border border-[var(--color-fg-3)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--color-fg-2)] transition-colors group-hover:border-[var(--color-cyan)] group-hover:text-[var(--color-cyan)]">
                {nationalityMap[p.nationality] ?? p.nationality}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {physicists.length > 6 && (
        <div className="mt-10 flex justify-center">
          <Link
            href="/physicists"
            className="inline-flex items-center gap-2 border border-[var(--color-fg-3)] px-6 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          >
            {t("viewAll", { count: physicists.length })}{" "}
            <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
              →
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
