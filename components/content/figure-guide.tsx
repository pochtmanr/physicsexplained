import Link from "next/link";
import katex from "katex";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import type { Block } from "@/lib/content/blocks";
import type { FigureGuide as Guide, FigureGuideItem } from "@/lib/content/figure-guides";
import { getContentEntry } from "@/lib/content/fetch";
import { getEquation } from "@/lib/content/equations";
import { getProblem } from "@/lib/content/problems";
import { deriveProblemTitle } from "@/lib/content/problem-title";
import { getEquationStringsForLocale } from "@/lib/problems/equation-strings";
import { getProblemStringsForLocale } from "@/lib/problems/strings";
import { defaultLocale } from "@/i18n/config";
import { ContentInline } from "@/components/content/content-inline";
import { DifficultyChip } from "@/components/problems/difficulty-chip";
import { FigureGuideItem as LinkedItem } from "@/components/content/figure-guide-item";

export interface FigureGuideProps {
  guide: Guide;
  /** Article paragraphs that describe the figure, in reading order. */
  prose: readonly Extract<Block, { type: "paragraph" }>[];
}

// Sizes come from the `--figure-fs-*` variables the full view sets (globals.css),
// so guide text grows with the figure on a large screen.
const HEADING = "text-[length:var(--figure-fs-13,13px)] font-medium text-[var(--color-fg-0)]";
const ROW = "flex items-baseline justify-between gap-3 border-b border-[var(--color-fg-4)] py-2 last:border-b-0";
// The negative margin gives the focus ring room without shifting the text.
const ROW_LINK = `group ${ROW} -mx-2 rounded-[var(--radius-control)] px-2 outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-cyan)]/50 motion-reduce:transition-none`;

function GuideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    // One card per section (docs/figure-full-view.md).
    <section className="figure-card p-4">
      <h3 className={HEADING}>{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * One reference: a link when `href` is given, plain text when the page it
 * would point to does not exist in the reader's language.
 */
function RowLink({
  href,
  title,
  detail,
  lead,
}: {
  href?: string;
  title: ReactNode;
  detail?: ReactNode;
  lead?: ReactNode;
}) {
  if (!href) {
    return (
      <div className={ROW}>
        <span className="min-w-0">
          <span className="text-[var(--color-fg-0)]">{title}</span>
          {detail ? (
            <span className="mt-0.5 block text-xs leading-snug text-[var(--color-fg-2)]">
              {detail}
            </span>
          ) : null}
        </span>
      </div>
    );
  }
  return (
    <Link href={href} className={ROW_LINK}>
      <span className="min-w-0">
        {lead ? <span className="me-2 inline-block align-middle">{lead}</span> : null}
        <span className="text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)] group-focus-visible:text-[var(--color-cyan)]">
          {title}
        </span>
        {detail ? (
          <span className="mt-0.5 block text-xs leading-snug text-[var(--color-fg-2)]">
            {detail}
          </span>
        ) : null}
      </span>
      <ArrowUpRight
        aria-hidden="true"
        size={14}
        strokeWidth={1.6}
        className="shrink-0 translate-y-0.5 text-[var(--color-fg-2)] transition-colors group-hover:text-[var(--color-cyan)] group-focus-visible:text-[var(--color-cyan)] rtl:-scale-x-100"
      />
    </Link>
  );
}

function Formula({ tex, full = false }: { tex: string; full?: boolean }) {
  // `full` sets limits and fractions at display size while keeping the
  // formula on the text's starting edge (KaTeX's display mode centres it).
  const html = katex.renderToString(full ? `\\displaystyle ${tex}` : tex, {
    throwOnError: true,
    displayMode: false,
  });
  // Maths reads left to right in every language.
  return <span dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * The guide shown beside a figure in full view: the article's own words about
 * it, what each number and control means, the relation behind it, things to
 * try, and where to read further. Built on the server and handed to
 * `<SceneCard>` as a node, so dictionary, people and equation lookups cost
 * the reader's browser nothing.
 *
 * A reference whose page does not exist in this language is left out rather
 * than failing the page.
 */
export async function FigureGuide({ guide, prose }: FigureGuideProps) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "scenes.guide" });
  const scene = await getTranslations({ locale, namespace: `scenes.${guide.namespace}.guide` });
  const tProblems = await getTranslations({ locale, namespace: "common.problems" });

  const [terms, physicists, equations] = await Promise.all([
    Promise.all(
      guide.terms.map(async (slug) => ({
        slug,
        entry: await getContentEntry("glossary", slug, locale),
      })),
    ),
    Promise.all(
      guide.physicists.map(async (slug) => ({
        slug,
        entry: await getContentEntry("physicist", slug, locale),
      })),
    ),
    Promise.all(
      guide.equations.map(async (slug) => {
        const equation = getEquation(slug);
        if (!equation) return null;
        // Equation pages exist only where their text has been written
        // (English so far). Elsewhere the formula is still shown, with its
        // English name, but not as a link to a page that is not there.
        const local = await getEquationStringsForLocale(slug, locale);
        const strings = local ?? (await getEquationStringsForLocale(slug, defaultLocale));
        return { slug, equation, name: strings?.name, hasPage: local !== null, inEnglish: !local };
      }),
    ),
  ]);
  // A problem page likewise exists only in the languages it was written in.
  const problems = (
    await Promise.all(
      guide.problems.map(async (id) => {
        const problem = getProblem(id);
        if (!problem) return null;
        return (await getProblemStringsForLocale(id, locale)) ? problem : null;
      }),
    )
  ).filter((problem) => problem !== null);

  const items = (list: readonly FigureGuideItem[]) => (
    <dl className="space-y-1">
      {list.map((item) => (
        // Linked on hover to the matching curve, readout or control.
        <LinkedItem key={item.key} linkKey={item.key}>
          <dt className="flex items-center gap-2 font-mono text-xs text-[var(--color-fg-0)]">
            {/* The colour of the matching curve or readout, as a line sample;
                the label itself stays in the text colour so it is readable
                in both themes. */}
            {item.color ? (
              <span
                aria-hidden="true"
                className="h-0.5 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            ) : null}
            {scene(`items.${item.key}.label`)}
          </dt>
          <dd className="mt-1 text-[var(--color-fg-1)]">{scene(`items.${item.key}.text`)}</dd>
        </LinkedItem>
      ))}
    </dl>
  );

  const hasReferences =
    terms.some((x) => x.entry) ||
    physicists.some((x) => x.entry) ||
    equations.some(Boolean) ||
    problems.length > 0;

  return (
    // A readable measure where the guide is a wide sheet under the figure.
    <div className="figure-guide-body mx-auto flex max-w-[70ch] flex-col gap-3 p-3 text-sm leading-relaxed text-[var(--color-fg-1)]">
      {prose.length > 0 && (
        <GuideSection title={t("article")}>
          <div className="space-y-3 border-s-2 border-[var(--color-cyan-dim)] ps-3">
            {prose.map((block, i) => (
              <p key={i}>
                {/* No hover previews: the panel scrolls and would clip them. */}
                <ContentInline inlines={block.inlines} previews={false} />
              </p>
            ))}
          </div>
        </GuideSection>
      )}

      {guide.readouts.length > 0 && (
        <GuideSection title={t("readouts")}>{items(guide.readouts)}</GuideSection>
      )}

      {guide.controls.length > 0 && (
        <GuideSection title={t("controls")}>{items(guide.controls)}</GuideSection>
      )}

      {guide.formulas.length > 0 && (
        <GuideSection title={t("formulas")}>
          <ul className="space-y-3">
            {guide.formulas.map((formula) => (
              <li key={formula.key}>
                <div className="overflow-x-auto overflow-y-hidden py-2 text-base text-[var(--color-fg-0)] [scrollbar-width:thin]">
                  <Formula tex={formula.tex} full />
                </div>
                <p className="mt-1 text-[var(--color-fg-1)]">{scene(`formulas.${formula.key}`)}</p>
              </li>
            ))}
          </ul>
        </GuideSection>
      )}

      {guide.trySteps > 0 && (
        <GuideSection title={t("try")}>
          <ol className="space-y-3">
            {Array.from({ length: guide.trySteps }, (_, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-[1.45em] shrink-0 items-center justify-center rounded-full border border-[var(--color-fg-4)] font-mono text-[length:var(--figure-fs-10,10px)] text-[var(--color-fg-2)]"
                >
                  {i + 1}
                </span>
                <span>{scene(`try.${i + 1}`)}</span>
              </li>
            ))}
          </ol>
        </GuideSection>
      )}

      <GuideSection title={t("limits")}>
        <p>{scene("limits")}</p>
      </GuideSection>

      {hasReferences && (
        <GuideSection title={t("references")}>
          <div className="space-y-4">
            {terms.some((x) => x.entry) && (
              <ReferenceGroup title={t("terms")}>
                {terms.map(({ slug, entry }) =>
                  entry ? (
                    <RowLink
                      key={slug}
                      href={`/dictionary/${slug}`}
                      title={entry.title}
                      detail={entry.subtitle ?? undefined}
                    />
                  ) : null,
                )}
              </ReferenceGroup>
            )}
            {physicists.some((x) => x.entry) && (
              <ReferenceGroup title={t("physicists")}>
                {physicists.map(({ slug, entry }) => {
                  if (!entry) return null;
                  const born = typeof entry.meta.born === "string" ? entry.meta.born : "";
                  const died = typeof entry.meta.died === "string" ? entry.meta.died : "";
                  const lifespan = [born, died].filter(Boolean).join(" – ");
                  return (
                    <RowLink
                      key={slug}
                      href={`/physicists/${slug}`}
                      title={entry.title}
                      detail={
                        lifespan || entry.subtitle ? (
                          <>
                            {/* Years read left to right in every language. */}
                            {lifespan ? <bdi dir="ltr">{lifespan}</bdi> : null}
                            {lifespan && entry.subtitle ? " · " : null}
                            {entry.subtitle}
                          </>
                        ) : undefined
                      }
                    />
                  );
                })}
              </ReferenceGroup>
            )}
            {equations.some(Boolean) && (
              <ReferenceGroup title={t("equations")}>
                {equations.map((item) =>
                  item ? (
                    <RowLink
                      key={item.slug}
                      href={item.hasPage ? `/${locale}/equations/${item.slug}` : undefined}
                      title={<Formula tex={item.equation.latex} />}
                      detail={
                        item.name && item.inEnglish ? (
                          <span lang="en" dir="ltr">
                            {item.name}
                          </span>
                        ) : (
                          item.name
                        )
                      }
                    />
                  ) : null,
                )}
              </ReferenceGroup>
            )}
            {problems.length > 0 && (
              <ReferenceGroup title={t("problems")}>
                {problems.map((problem) => (
                  <RowLink
                    key={problem.id}
                    href={`/${locale}/classical-mechanics/${problem.primaryTopicSlug}/problems/${problem.id}`}
                    lead={
                      <DifficultyChip
                        difficulty={problem.difficulty}
                        label={tProblems(`difficulty.${problem.difficulty}`)}
                      />
                    }
                    title={deriveProblemTitle(
                      problem.id,
                      problem.primaryTopicSlug,
                      problem.difficulty,
                    )}
                  />
                ))}
              </ReferenceGroup>
            )}
          </div>
        </GuideSection>
      )}
    </div>
  );
}

function ReferenceGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="font-mono text-[length:var(--figure-fs-10,10px)] uppercase tracking-wider text-[var(--color-fg-2)]">
        {title}
      </h4>
      <div className="mt-1">{children}</div>
    </div>
  );
}
