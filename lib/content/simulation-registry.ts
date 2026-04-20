import type { ComponentType } from "react";
import { PendulumScene } from "@/components/physics/pendulum-scene";
import { PhasePortrait } from "@/components/physics/phase-portrait";

// Allowlist of components that MDX / DB blocks may reference by string name.
// Add a new simulation here before using it in content.
//
// Types: DB-stored props are opaque JSON so the registry stores components as
// ComponentType<any>. The renderer spreads `props` at runtime; invalid prop
// combinations surface as React prop-validation errors, not type errors.
export const SIMULATION_REGISTRY: Record<string, ComponentType<any>> = {
  PendulumScene,
  PhasePortrait,
};

export type SimulationName = keyof typeof SIMULATION_REGISTRY;

export function getSimulation(name: string): ComponentType<any> {
  const component = SIMULATION_REGISTRY[name];
  if (!component) {
    throw new Error(`unknown simulation component: ${name}`);
  }
  return component;
}
