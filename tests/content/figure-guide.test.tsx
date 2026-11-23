import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import katex from "katex";
import { cleanup, render, screen, within } from "@testing-library/react";
import { createTranslator } from "next-intl";
import enScenes from "@/messages/en/scenes.json";
import heScenes from "@/messages/he/scenes.json";
import enCommon from "@/messages/en/common.json";
import heCommon from "@/messages/he/common.json";
import { figureGuideComponents, getFigureGuide } from "@/lib/content/figure-guides";
import { getEquation } from "@/lib/content/equations";
import { GUIDE_BESIDE_QUERY } from "@/components/layout/figure-popup";

const MESSAGES = {
  en: { scenes: enScenes, common: enCommon },
  he: { scenes: heScenes, common: heCommon },
} as const;

let locale: keyof typeof MESSAGES = "en";
const missing: string[] = [];

vi.mock("next-intl/server", () => ({
  getLocale: async () => locale,
  getTranslations: async ({ namespace }: { namespace: string }) =>
    createTranslator({
      locale,
      messages: MESSAGES[locale],
      namespace: namespace as never,
      onError: (error) => missing.push(error.message),
    }),
}));

// Dictionary and people come from the database: one known row each, the
// rest missing, as when a page has not been written in this language.
vi.mock("@/lib/content/fetch", () => ({
  getContentEntry: async (kind: string, slug: string) => {
    if (kind === "glossary" && slug === "derivative") {
      return { title: "Derivative", subtitle: "Rate of change at an instant.", meta: {} };
    }
    if (kind === "physicist" && slug === "isaac-newton") {
      return { title: "Isaac Newton", subtitle: "Laws of motion.", meta: { born: "1643", died: "1727" } };
    }
    return null;
  },
}));

vi.mock("@/lib/problems/equation-strings", () => ({
  getEquationStringsForLocale: async (slug: string, l: string) =>
    l === "en" ? { name: `Name of ${slug}` } : null,
}));

vi.mock("@/lib/problems/strings", () => ({
  getProblemStringsForLocale: async (_id: string, l: string) =>
    l === "en" ? { statement: "…" } : null,
}));

// The real links fetch from the database; the guide only needs their text.
vi.mock("@/components/content/term", () => ({
  Term: ({ slug, children, preview }: { slug: string; children?: React.ReactNode; preview?: boolean }) => (
    <a href={`/dictionary/${slug}`} data-preview={String(preview)}>
      {children ?? slug}
    </a>
  ),
}));
vi.mock("@/components/content/physicist-link", () => ({
  PhysicistLink: ({ slug, children }: { slug: string; children?: React.ReactNode }) => (
    <a href={`/physicists/${slug}`}>{children ?? slug}</a>
  ),
}));

import { FigureGuide } from "@/components/content/figure-guide";

afterEach(() => {
  cleanup();
  missing.length = 0;
  locale = "en";
});

const paragraph = (...inlines: (string | { kind: "term"; slug: string; text: string })[]) => ({
  type: "paragraph" as const,
  inlines,
});

describe("FigureGuide", () => {
  it("renders every guide in every language with no missing string", async () => {
    for (const l of ["en", "he"] as const) {
      locale = l;
      for (const component of figureGuideComponents()) {
        const ui = await FigureGuide({ guide: getFigureGuide(component)!, prose: [] });
        const view = render(ui);
        expect(missing, `${l} ${component}`).toEqual([]);
        // A missing key would be printed as its dotted path.
        expect(view.container.textContent).not.toMatch(/scenes\.|common\./);
        view.unmount();
      }
    }
  });

  it("shows the article's words first, without hover previews", async () => {
    const ui = await FigureGuide({
      guide: getFigureGuide("TangentZoomScene")!,
      prose: [
        paragraph("Slide the two points together."),
        paragraph("That convergence is a ", { kind: "term", slug: "derivative", text: "derivative" }, "."),
      ],
    });
    render(ui);
    const article = screen.getByRole("heading", { name: "From the article" }).parentElement!;
    expect(article).toHaveTextContent(
      "Slide the two points together.That convergence is a derivative.",
    );
    expect(within(article).getByRole("link", { name: "derivative" })).toHaveAttribute(
      "data-preview",
      "false",
    );
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "From the article",
      "What the numbers mean",
      "What you can change",
      "The relation at work",
      "Try this",
      "What this model leaves out",
      "Go deeper",
    ]);
  });

  it("leaves out the article section when there is nothing to quote", async () => {
    render(await FigureGuide({ guide: getFigureGuide("TangentZoomScene")!, prose: [] }));
    expect(screen.queryByRole("heading", { name: "From the article" })).toBeNull();
  });

  it("links what exists and drops references with no page", async () => {
    render(await FigureGuide({ guide: getFigureGuide("TangentZoomScene")!, prose: [] }));
    const refs = screen.getByRole("heading", { name: "Go deeper" }).parentElement!;
    const hrefs = within(refs)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      "/dictionary/derivative", // "velocity" has no row here: dropped
      "/physicists/isaac-newton", // so has "nicole-oresme"
      "/en/equations/velocity-time-relation",
      "/en/classical-mechanics/motion-in-a-straight-line/problems/motion-in-a-straight-line-easy-distance-from-velocity-time",
    ]);
    expect(refs).toHaveTextContent("1643 – 1727 · Laws of motion.");
    expect(refs).toHaveTextContent("Name of velocity-time-relation");
  });

  it("shows but does not link equations and problems with no page in this language", async () => {
    locale = "he";
    const view = render(
      await FigureGuide({ guide: getFigureGuide("TangentZoomScene")!, prose: [] }),
    );
    // The equation keeps its formula and English name, marked as English…
    const name = screen.getByText("Name of velocity-time-relation");
    expect(name).toHaveAttribute("lang", "en");
    // …but nothing links to equation or problem pages that would not load.
    const hrefs = Array.from(view.container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/dictionary/derivative", "/physicists/isaac-newton"]);
  });
});

describe("figure guide data", () => {
  it("has only formulas KaTeX can typeset", () => {
    for (const component of figureGuideComponents()) {
      const guide = getFigureGuide(component)!;
      for (const formula of guide.formulas) {
        expect(
          () => katex.renderToString(`\\displaystyle ${formula.tex}`, { throwOnError: true }),
          `${component} ${formula.key}`,
        ).not.toThrow();
      }
      for (const slug of guide.equations) {
        expect(
          () => katex.renderToString(getEquation(slug)!.latex, { throwOnError: true }),
          slug,
        ).not.toThrow();
      }
    }
  });

  it("has a caption for every formula and no stray captions", () => {
    type Guide = { formulas: Record<string, string> };
    for (const component of figureGuideComponents()) {
      const guide = getFigureGuide(component)!;
      for (const scenes of [enScenes, heScenes]) {
        const strings = (scenes as unknown as Record<string, { guide: Guide }>)[guide.namespace].guide;
        expect(Object.keys(strings.formulas).sort()).toEqual(guide.formulas.map((f) => f.key).sort());
      }
    }
  });

  it("has the same shared labels in both languages", () => {
    expect(Object.keys(heScenes.guide).sort()).toEqual(Object.keys(enScenes.guide).sort());
    for (const value of [...Object.values(enScenes.guide), ...Object.values(heScenes.guide)]) {
      expect(value).toBeTruthy();
    }
  });
});

describe("guide layout breakpoint", () => {
  it("is the same in the stylesheet and in the script", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain(`@media ${GUIDE_BESIDE_QUERY} {`);
  });
});
