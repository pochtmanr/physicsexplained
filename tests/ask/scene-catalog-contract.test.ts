import { describe, expect, it } from "vitest";
import { SCENE_CATALOG } from "@/lib/ask/scene-catalog";
import { SIMULATION_REGISTRY } from "@/lib/content/simulation-registry";

describe("scene catalog contract", () => {
  it("every catalog id has a matching simulation-registry entry", () => {
    const registryIds = new Set(Object.keys(SIMULATION_REGISTRY));
    const missing = SCENE_CATALOG
      .map((e) => e.id)
      .filter((id) => !registryIds.has(id));
    expect(missing).toEqual([]);
  });
});
