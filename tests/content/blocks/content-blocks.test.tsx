// tests/content/blocks/content-blocks.test.tsx
import { vi } from "vitest";

// Stub the Supabase env vars before any module below this is imported, so that
// the supabase client in lib/supabase.ts (transitively pulled by ContentInline
// through PhysicistLink/Term, and by this renderer via storageUrl) doesn't
// throw during test-file evaluation.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-test-key";
});

// PhysicistLink and Term are async Server Components / pull supabase; stub
// them so ContentInline paths inside recursive blocks render from jsdom.
vi.mock("@/components/content/physicist-link", () => ({
  PhysicistLink: ({ slug, children }: { slug: string; children?: React.ReactNode }) => (
    <a href={`/physicists/${slug}`}>{children ?? slug}</a>
  ),
}));

// The guide is an async server component (next-intl/server, database
// lookups). Here it is replaced by a stand-in that shows which article
// paragraphs it was given.
vi.mock("@/components/content/figure-guide", () => ({
  FigureGuide: ({
    guide,
    prose,
  }: {
    guide: { namespace: string };
    prose: { inlines: unknown[] }[];
  }) => (
    <div data-testid="figure-guide" data-scene={guide.namespace}>
      {prose.map((p, i) => (
        <p key={i}>{p.inlines.filter((x) => typeof x === "string").join("")}</p>
      ))}
    </div>
  ),
}));

vi.mock("@/components/content/term", () => ({
  Term: ({ slug, children }: { slug: string; children?: React.ReactNode }) => (
    <a href={`/dictionary/${slug}`}>{children ?? slug}</a>
  ),
}));

import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { render as rtlRender, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { figureProse } from "@/components/content/content-blocks";
import { figureGuideComponents, getFigureGuide } from "@/lib/content/figure-guides";
import enScenes from "@/messages/en/scenes.json";
import heScenes from "@/messages/he/scenes.json";
import { getEquation } from "@/lib/content/equations";
import { getProblem } from "@/lib/content/problems";
import type { ReactElement } from "react";
import { NextIntlClientProvider } from "next-intl";
import scenes from "@/messages/en/scenes.json";
import type { Block } from "@/lib/content/blocks";
import { ContentBlocks } from "@/components/content/content-blocks";

// jsdom lacks matchMedia + ResizeObserver; PendulumScene pulls both via
// useReducedMotion and its own container-width effect. Stub them so the
// simulation-figure test can mount the client component. We're not asserting
// the pendulum's behaviour here, just that its SVG root mounts.
beforeAll(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  if (typeof globalThis.ResizeObserver === "undefined") {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    // test-only polyfill
    (globalThis as unknown as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
  }
  if (typeof globalThis.IntersectionObserver === "undefined") {
    // Auto-fires "intersecting" on observe, as if the element were already in
    // the jsdom viewport — so viewport-gated figures mount in tests by default.
    class IntersectionObserverStub {
      #callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.#callback = callback;
      }
      observe() {
        this.#callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = "";
      thresholds = [];
    }
    // test-only polyfill
    (globalThis as unknown as Record<string, unknown>).IntersectionObserver = IntersectionObserverStub;
  }
});

// globals: false in vitest.config → auto-cleanup is off; clean the DOM manually.
afterEach(() => cleanup());

// Figures render inside <SceneCard>, which reads its labels from next-intl —
// in the app every page is under the locale layout's provider.
function render(ui: ReactElement) {
  return rtlRender(
    <NextIntlClientProvider locale="en" messages={{ scenes }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("<ContentBlocks>", () => {
  it("renders a section with a paragraph child", () => {
    const blocks: Block[] = [
      {
        type: "section",
        index: 1,
        title: "Intro",
        children: [{ type: "paragraph", inlines: ["Hello"] }],
      },
    ];
    render(<ContentBlocks blocks={blocks} />);
    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders a display equation", () => {
    const blocks: Block[] = [{ type: "equation", id: "EQ.01", tex: "a = b" }];
    const { container } = render(<ContentBlocks blocks={blocks} />);
    expect(container.querySelector(".katex-display")).toBeTruthy();
  });

  it("renders an image figure using storageUrl", () => {
    const blocks: Block[] = [
      {
        type: "figure",
        caption: "FIG.01",
        content: { kind: "image", src: "figures/x.webp", alt: "x" },
      },
    ];
    const { container } = render(<ContentBlocks blocks={blocks} />);
    expect(container.querySelector("img")?.getAttribute("src")).toContain("/storage/");
  });

  it("renders a simulation figure from the registry", async () => {
    const blocks: Block[] = [
      {
        type: "figure",
        content: { kind: "simulation", component: "PendulumScene", props: { theta0: 0.3 } },
      },
    ];
    render(<ContentBlocks blocks={blocks} />);
    // PendulumScene is now code-split via next/dynamic (ssr: false), so its
    // chunk resolves on a microtask after render. Wait for the <canvas>
    // root to appear. (Plan said "SVG" but the real component uses canvas.)
    await waitFor(() => {
      expect(document.querySelector("canvas")).toBeTruthy();
    });
  });

  it("defers simulation mounting until the figure nears the viewport", async () => {
    // Inert observer: never reports intersection, so a viewport-gated figure
    // must keep showing the skeleton and never fetch/mount the scene.
    const realIO = globalThis.IntersectionObserver;
    class InertIO {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = "";
      thresholds = [];
    }
    (globalThis as unknown as Record<string, unknown>).IntersectionObserver = InertIO;
    try {
      const blocks: Block[] = [
        {
          type: "figure",
          content: { kind: "simulation", component: "PendulumScene", props: { theta0: 0.3 } },
        },
      ];
      render(<ContentBlocks blocks={blocks} />);
      expect(screen.getByText(/loading simulation/i)).toBeInTheDocument();
      // Give any (wrongly) eager dynamic import time to resolve.
      await new Promise((r) => setTimeout(r, 50));
      expect(document.querySelector("canvas")).toBeNull();
    } finally {
      (globalThis as unknown as Record<string, unknown>).IntersectionObserver = realIO;
    }
  });

  it("throws on an unknown simulation name", () => {
    const blocks: Block[] = [
      {
        type: "figure",
        content: { kind: "simulation", component: "Ghost", props: {} },
      },
    ];
    expect(() => render(<ContentBlocks blocks={blocks} />)).toThrow(/unknown simulation/i);
  });

  it("renders a callout with recursive children", () => {
    const blocks: Block[] = [
      {
        type: "callout",
        variant: "math",
        children: [{ type: "paragraph", inlines: ["Small-angle trick."] }],
      },
    ];
    render(<ContentBlocks blocks={blocks} />);
    expect(screen.getByText("Small-angle trick.")).toBeInTheDocument();
  });

  it("renders an ordered list", () => {
    const blocks: Block[] = [
      { type: "list", ordered: true, items: [["one"], ["two"]] },
    ];
    const { container } = render(<ContentBlocks blocks={blocks} />);
    expect(container.querySelector("ol")?.children.length).toBe(2);
  });

  it("renders a table with header + rows", () => {
    const blocks: Block[] = [
      {
        type: "table",
        header: [["Col A"], ["Col B"]],
        rows: [[["1"], ["x"]], [["2"], ["y"]]],
      },
    ];
    const { container } = render(<ContentBlocks blocks={blocks} />);
    expect(container.querySelector("thead th")?.textContent).toBe("Col A");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
  });
});

describe("figure guides", () => {
  const p = (text: string) => ({ type: "paragraph" as const, inlines: [text] });
  const figure = (component: string) => ({
    type: "figure" as const,
    caption: "FIG.01b — from secant to tangent",
    content: { kind: "simulation" as const, component },
  });

  it("quotes the paragraphs next to the figure, and stops at anything else", () => {
    const guide = getFigureGuide("TangentZoomScene")!;
    const blocks = [
      p("far before"),
      { type: "heading" as const, level: 3 as const, text: "h" },
      p("just before"),
      figure("TangentZoomScene"),
      p("just after"),
      p("further after"),
    ];
    const text = (bs: ReturnType<typeof figureProse>) => bs.map((b) => b.inlines.join(""));
    expect(text(figureProse(blocks, 3, guide))).toEqual(["just before", "just after"]);
    // More paragraphs wanted than there are before the heading: take what is there.
    const wide = { ...guide, prose: { before: 5, after: 5 } };
    expect(text(figureProse(blocks, 3, wide))).toEqual([
      "just before",
      "just after",
      "further after",
    ]);
    // A figure at the very start or end has nothing on that side.
    expect(figureProse([figure("TangentZoomScene")], 0, wide)).toEqual([]);
  });

  it("shows the guide in full view for a scene that has one, and only then", () => {
    render(
      <ContentBlocks
        blocks={[p("Slide the two points together."), figure("TangentZoomScene"), p("Shrink Δt.")]}
      />,
    );
    expect(screen.queryByTestId("figure-guide")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open figure with guide" }));
    const guide = screen.getByTestId("figure-guide");
    expect(guide).toHaveAttribute("data-scene", "tangentZoom");
    expect(guide).toHaveTextContent("Slide the two points together.");
    expect(guide).toHaveTextContent("Shrink Δt.");
    expect(screen.getByRole("dialog")).toContainElement(guide);
  });

  it("offers no guide button for a scene without a guide", () => {
    render(<ContentBlocks blocks={[figure("BeatsScene")]} />);
    expect(screen.queryByRole("button", { name: "Open figure with guide" })).toBeNull();
    expect(screen.getByRole("button", { name: "Expand figure" })).toBeInTheDocument();
  });

  it("has every string, in every language, for every guide", () => {
    type Strings = Record<string, Record<string, unknown>>;
    for (const component of figureGuideComponents()) {
      const guide = getFigureGuide(component)!;
      for (const [locale, scenes] of [
        ["en", enScenes],
        ["he", heScenes],
      ] as const) {
        const strings = (scenes as unknown as Strings)[guide.namespace]?.guide as
          | { items: Strings; formulas: Record<string, string>; try: Record<string, string> }
          | undefined;
        expect(strings, `${locale} ${guide.namespace}.guide`).toBeDefined();
        for (const item of [...guide.readouts, ...guide.controls]) {
          expect(strings!.items[item.key]?.label, `${locale} ${component} ${item.key}.label`).toBeTruthy();
          expect(strings!.items[item.key]?.text, `${locale} ${component} ${item.key}.text`).toBeTruthy();
        }
        for (const formula of guide.formulas) {
          expect(strings!.formulas[formula.key], `${locale} ${component} ${formula.key}`).toBeTruthy();
        }
        for (let i = 1; i <= guide.trySteps; i++) {
          expect(strings!.try[String(i)], `${locale} ${component} try.${i}`).toBeTruthy();
        }
        // Nothing written that the guide never shows.
        expect(Object.keys(strings!.items).sort()).toEqual(
          [...guide.readouts, ...guide.controls].map((x) => x.key).sort(),
        );
        expect(Object.keys(strings!.try)).toHaveLength(guide.trySteps);
      }
    }
  });

  it("points only at equations and problems that exist", () => {
    for (const component of figureGuideComponents()) {
      const guide = getFigureGuide(component)!;
      for (const slug of guide.equations) expect(getEquation(slug), slug).toBeDefined();
      for (const id of guide.problems) expect(getProblem(id), id).toBeDefined();
    }
  });
});
