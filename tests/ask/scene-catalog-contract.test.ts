import { describe, expect, it } from "vitest";
import { SCENE_CATALOG } from "@/lib/ask/scene-catalog";
import { GENERATED_SCENE_META, GENERATED_SCENE_IDS } from "@/lib/ask/scene-meta.generated";
import { SIMULATION_REGISTRY } from "@/lib/content/simulation-registry";

describe("scene catalog contract", () => {
  const registryIds = new Set(Object.keys(SIMULATION_REGISTRY));

  it("every curated catalog id has a matching simulation-registry entry", () => {
    const missing = SCENE_CATALOG
      .map((e) => e.id)
      .filter((id) => !registryIds.has(id));
    expect(missing).toEqual([]);
  });

  it("every generated-meta id has a matching simulation-registry entry", () => {
    const missing = GENERATED_SCENE_IDS.filter((id) => !registryIds.has(id));
    expect(missing).toEqual([]);
  });

  it("every curated id also has generated meta (showScene fallback chain is total)", () => {
    const missing = SCENE_CATALOG
      .map((e) => e.id)
      .filter((id) => !GENERATED_SCENE_META[id]);
    expect(missing).toEqual([]);
  });

  it("generated captions are non-empty", () => {
    const empty = GENERATED_SCENE_IDS.filter((id) => !GENERATED_SCENE_META[id].caption.trim());
    expect(empty).toEqual([]);
  });
});
