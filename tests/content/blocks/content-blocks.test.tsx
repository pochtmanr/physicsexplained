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

vi.mock("@/components/content/term", () => ({
  Term: ({ slug, children }: { slug: string; children?: React.ReactNode }) => (
    <a href={`/dictionary/${slug}`}>{children ?? slug}</a>
  ),
}));

import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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
    // @ts-expect-error test-only polyfill
    globalThis.ResizeObserver = ResizeObserverStub;
  }
  if (typeof globalThis.IntersectionObserver === "undefined") {
    class IntersectionObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = "";
      thresholds = [];
    }
    // @ts-expect-error test-only polyfill
    globalThis.IntersectionObserver = IntersectionObserverStub;
  }
});

// globals: false in vitest.config → auto-cleanup is off; clean the DOM manually.
afterEach(() => cleanup());

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

  it("renders a simulation figure from the registry", () => {
    const blocks: Block[] = [
      {
        type: "figure",
        content: { kind: "simulation", component: "PendulumScene", props: { theta0: 0.3 } },
      },
    ];
    render(<ContentBlocks blocks={blocks} />);
    // PendulumScene renders a <canvas> root inside a <div>; confirming the
    // registered component mounts is sufficient here. (Plan said "SVG" but
    // the real component uses canvas — asserting what actually mounts.)
    expect(document.querySelector("canvas")).toBeTruthy();
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
});
