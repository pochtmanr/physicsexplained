import { describe, expect, it } from "vitest";
import { parseMdx } from "@/scripts/content/parse-mdx";
import {
  collectSimulationFigures,
  humanizeSceneId,
  splitFigCaption,
} from "@/scripts/ask/scene-catalog-lib";

const FIXTURE_MDX = `
<TopicHeader eyebrow="FIG.13 · MAGNETOSTATICS" title="The Biot–Savart Law" subtitle="Currents make fields" />

<Section index={1} title="One segment">

Some prose.

<SceneCard caption="FIG.13a — one straight current segment, hover for dB direction">
  <WireSegmentFieldScene />
</SceneCard>

<Callout variant="aside">

<SceneCard caption="FIG.13b — concentric B-field rings around a vertical current">
  <StraightWireFieldScene theta0={(10 * Math.PI) / 180} />
</SceneCard>

</Callout>

<SceneCard caption="FIG.13a — one straight current segment, hover for dB direction">
  <WireSegmentFieldScene />
</SceneCard>

<SceneCard caption="An image, not a simulation">
  <img src="/x.png" alt="x" />
</SceneCard>

</Section>
`;

describe("catalog generator MDX walker", () => {
  const parsed = parseMdx(FIXTURE_MDX);
  const figures = collectSimulationFigures(parsed.blocks, "electromagnetism/biot-savart-law", parsed.title);

  it("finds figures nested inside sections and callouts, skipping images", () => {
    expect(figures.map((f) => f.component)).toEqual([
      "WireSegmentFieldScene",
      "StraightWireFieldScene",
      "WireSegmentFieldScene",
    ]);
  });

  it("captures caption, slug, and essay title per figure", () => {
    const straight = figures.find((f) => f.component === "StraightWireFieldScene")!;
    expect(straight.caption).toBe("FIG.13b — concentric B-field rings around a vertical current");
    expect(straight.topicSlug).toBe("electromagnetism/biot-savart-law");
    expect(straight.sourceTitle).toBe("The Biot–Savart Law");
  });

  it("evaluates numeric prop expressions (Math.PI)", () => {
    const straight = figures.find((f) => f.component === "StraightWireFieldScene")!;
    expect(straight.props.theta0).toBeCloseTo((10 * Math.PI) / 180);
  });
});

describe("splitFigCaption", () => {
  it("splits a standard FIG caption", () => {
    expect(splitFigCaption("FIG.13b — concentric B-field rings")).toEqual({
      figLabel: "FIG.13b",
      rest: "concentric B-field rings",
    });
  });

  it("handles plain hyphens and no letter suffix", () => {
    expect(splitFigCaption("FIG.57 - phase plane")).toEqual({ figLabel: "FIG.57", rest: "phase plane" });
  });

  it("returns null label for captions without a FIG prefix", () => {
    expect(splitFigCaption("The Abbe diagram")).toEqual({ figLabel: null, rest: "The Abbe diagram" });
  });
});

describe("humanizeSceneId", () => {
  it("strips the Scene suffix and lowercases following words", () => {
    expect(humanizeSceneId("StraightWireFieldScene")).toBe("Straight wire field");
  });

  it("keeps all-caps acronym runs", () => {
    expect(humanizeSceneId("RLCCircuitScene")).toBe("RLC circuit");
  });
});
