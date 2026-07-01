import { describe, it, expect } from "vitest";
import {
  inlinesToMarkdown,
  blocksToMarkdown,
  entryToMarkdown,
} from "@/lib/content/markdown";
import type { Block } from "@/lib/content/blocks";

const opts = { baseUrl: "https://physics.it.com" };

describe("inlinesToMarkdown", () => {
  it("renders plain strings and emphasis", () => {
    expect(
      inlinesToMarkdown(
        ["A ", { kind: "em", inlines: ["gentle"] }, " ", { kind: "strong", inlines: ["push"] }],
        opts,
      ),
    ).toBe("A *gentle* **push**");
  });

  it("renders code and inline formulas", () => {
    expect(
      inlinesToMarkdown(
        [{ kind: "code", text: "v0" }, " where ", { kind: "formula", tex: "E = mc^2" }],
        opts,
      ),
    ).toBe("`v0` where $E = mc^2$");
  });

  it("links terms and physicists to absolute canonical URLs", () => {
    expect(
      inlinesToMarkdown(
        [
          { kind: "term", slug: "angular-momentum", text: "angular momentum" },
          " per ",
          { kind: "physicist", slug: "emmy-noether" },
        ],
        opts,
      ),
    ).toBe(
      "[angular momentum](https://physics.it.com/dictionary/angular-momentum) per [emmy noether](https://physics.it.com/physicists/emmy-noether)",
    );
  });

  it("absolutizes relative link hrefs and keeps external ones", () => {
    expect(
      inlinesToMarkdown(
        [
          { kind: "link", href: "/classical-mechanics/kepler", text: "Kepler" },
          " / ",
          { kind: "link", href: "https://example.com", text: "ext" },
        ],
        opts,
      ),
    ).toBe(
      "[Kepler](https://physics.it.com/classical-mechanics/kepler) / [ext](https://example.com)",
    );
  });
});

describe("blocksToMarkdown", () => {
  it("renders sections with numbered titles and nested children", () => {
    const blocks: Block[] = [
      {
        type: "section",
        index: 1,
        title: "Setting the Stage",
        children: [{ type: "paragraph", inlines: ["Hello."] }],
      },
    ];
    expect(blocksToMarkdown(blocks, opts)).toBe("## 1. Setting the Stage\n\nHello.");
  });

  it("renders headings at levels 3 and 4", () => {
    const blocks: Block[] = [
      { type: "heading", level: 3, text: "Sub" },
      { type: "heading", level: 4, text: "Subsub" },
    ];
    expect(blocksToMarkdown(blocks, opts)).toBe("### Sub\n\n#### Subsub");
  });

  it("renders equations as display math with optional prose", () => {
    const blocks: Block[] = [
      { type: "equation", tex: "F = ma", prose: "Force equals mass times acceleration." },
    ];
    expect(blocksToMarkdown(blocks, opts)).toBe(
      "$$\nF = ma\n$$\n\nForce equals mass times acceleration.",
    );
  });

  it("renders image figures with caption and simulation figures as pointers", () => {
    const blocks: Block[] = [
      {
        type: "figure",
        caption: "An orbit.",
        content: { kind: "image", src: "/images/orbit.png", alt: "Orbit diagram" },
      },
      {
        type: "figure",
        caption: "Try it.",
        content: { kind: "simulation", component: "KeplerOrbits" },
      },
    ];
    expect(blocksToMarkdown(blocks, opts)).toBe(
      "![Orbit diagram](https://physics.it.com/images/orbit.png)\n\n*An orbit.*\n\n" +
        "*[Interactive simulation: KeplerOrbits — view on the web page.]*\n\n*Try it.*",
    );
  });

  it("renders callouts as labelled blockquotes", () => {
    const blocks: Block[] = [
      {
        type: "callout",
        variant: "warning",
        children: [{ type: "paragraph", inlines: ["Careful."] }],
      },
    ];
    expect(blocksToMarkdown(blocks, opts)).toBe("> **Warning:**\n>\n> Careful.");
  });

  it("renders ordered and unordered lists", () => {
    const blocks: Block[] = [
      { type: "list", ordered: false, items: [["one"], ["two"]] },
      { type: "list", ordered: true, items: [["first"], ["second"]] },
    ];
    expect(blocksToMarkdown(blocks, opts)).toBe(
      "- one\n- two\n\n1. first\n2. second",
    );
  });

  it("renders GFM tables and escapes pipes in cells", () => {
    const blocks: Block[] = [
      {
        type: "table",
        header: [["Quantity"], ["Symbol"]],
        rows: [[["Energy"], ["E|joules"]]],
      },
    ];
    expect(blocksToMarkdown(blocks, opts)).toBe(
      "| Quantity | Symbol |\n| --- | --- |\n| Energy | E\\|joules |",
    );
  });
});

describe("entryToMarkdown", () => {
  it("emits title, subtitle, body, and a source footer", () => {
    const md = entryToMarkdown(
      {
        title: "Kepler's Laws",
        subtitle: "Orbits from first principles.",
        blocks: [{ type: "paragraph", inlines: ["Planets move."] }],
      },
      { ...opts, url: "https://physics.it.com/classical-mechanics/kepler" },
    );
    expect(md).toBe(
      "# Kepler's Laws\n\nOrbits from first principles.\n\nPlanets move.\n\n" +
        "---\n\nSource: https://physics.it.com/classical-mechanics/kepler\n",
    );
  });
});
