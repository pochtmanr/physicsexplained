import type { ComponentType } from "react";
import { PendulumScene } from "@/components/physics/pendulum-scene";
import { PhasePortrait } from "@/components/physics/phase-portrait";

// Allowlist of components that MDX / DB blocks may reference by string name.
// Add a new simulation here before using it in content.
export const SIMULATION_REGISTRY = {
  PendulumScene,
  PhasePortrait,
} as const satisfies Record<string, ComponentType<Record<string, unknown>>>;

export type SimulationName = keyof typeof SIMULATION_REGISTRY;

export function getSimulation(name: string): ComponentType<Record<string, unknown>> {
  const component = (SIMULATION_REGISTRY as Record<string, ComponentType<Record<string, unknown>>>)[name];
  if (!component) {
    throw new Error(`unknown simulation component: ${name}`);
  }
  return component;
}
