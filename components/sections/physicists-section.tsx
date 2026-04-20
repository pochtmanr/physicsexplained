import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getContentEntriesByKind } from "@/lib/content/fetch";
import { WIDE_CONTAINER } from "@/lib/layout";

export async function PhysicistsSection() {
  const t = await getTranslations("home.physicists");
  const locale = await getLocale();
  const physicists = await getContentEntriesByKind("physicist", locale);
  const preview = physicists.slice(0, 8);

  return (
    <section id="physicists" className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
        {t("tag")}
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
        {t("title")}
      </h2>
      <p className="mt-6 text-sm md:text-xl text-[var(--color-fg-1)] max-w-[48ch]">
        {t("subtitle")}
      </p>
      <div className="mt-12 grid grid-cols-2 gap-0 sm:grid-cols-3 md:grid-cols-4 [&>*]:-mt-px [&>*]:-ms-px">
        {preview.map((p) => {
          const born = typeof p.meta.born === "string" ? p.meta.born : "";
          const died = typeof p.meta.died === "string" ? p.meta.died : "";
          const shortName =
            typeof p.meta.shortName === "string" ? p.meta.shortName : p.title;
          const oneLiner = p.subtitle ?? "";
          return (
            <Link
              key={p.slug}
              href={`/physicists/${p.slug}`}
              className="group relative flex h-full min-h-[120px] flex-col border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-4 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)] md:min-h-[140px]"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-cyan-dim)]">
                  {born}&ndash;{died}
                </span>
                <span
                  aria-hidden="true"
                  className="inline-flex h-4 w-4 items-center justify-center text-xs leading-none text-[var(--color-fg-3)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] rtl:-scale-x-100 rtl:group-hover:rotate-45"
                >
                  →
                </span>
              </div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)] md:text-xs">
                {shortName}
              </div>
              <p className="mt-1.5 text-[10px] leading-snug text-[var(--color-fg-3)] md:text-[11px] line-clamp-2">
                {oneLiner}
              </p>
            </Link>
          );
        })}
      </div>
      {physicists.length > 8 && (
        <div className="mt-10 flex justify-center">
          <Link
            href="/physicists"
            className="inline-flex items-center gap-2 border border-[var(--color-fg-4)] px-6 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
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
