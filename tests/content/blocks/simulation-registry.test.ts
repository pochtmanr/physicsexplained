// tests/content/blocks/simulation-registry.test.ts
import { describe, it, expect } from "vitest";
import { SIMULATION_REGISTRY, getSimulation } from "@/lib/content/simulation-registry";

describe("simulation registry", () => {
  it("includes PendulumScene", () => {
    expect(SIMULATION_REGISTRY.PendulumScene).toBeDefined();
  });

  it("includes PhasePortrait", () => {
    expect(SIMULATION_REGISTRY.PhasePortrait).toBeDefined();
  });

  it("includes ActionReactionScene", () => {
    expect(SIMULATION_REGISTRY.ActionReactionScene).toBeDefined();
  });

  it("getSimulation throws on unknown name", () => {
    expect(() => getSimulation("Nope")).toThrow(/unknown simulation/i);
  });

  it("getSimulation returns component for a known name", () => {
    expect(getSimulation("PendulumScene")).toBe(SIMULATION_REGISTRY.PendulumScene);
  });
});
