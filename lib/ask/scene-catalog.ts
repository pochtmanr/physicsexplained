// Curated subset of SIMULATION_REGISTRY scenes exposed to the AI.
// To add a scene: append an entry here, then run `pnpm ask:sync-scenes`.
// The scene id MUST exist in components/physics/simulation-registry.ts —
// validated by tests/ask/scene-catalog-contract.test.ts (not here, to keep
// this file safe to import from CLI scripts without pulling React/Next).
import { z } from "zod";

export interface SceneCatalogEntry {
  id: string;
  label: string;
  description: string;
  tags: string[];
  topicSlugs: string[];
  paramsSchema: z.ZodObject<z.ZodRawShape>;
}

// Start small — about a dozen scenes covering the most common ground.
export const SCENE_CATALOG: SceneCatalogEntry[] = [
  {
    id: "DampedPendulumScene",
    label: "Damped pendulum",
    description: "A pendulum losing energy to friction. Shows amplitude decay and phase.",
    tags: ["oscillation", "damping", "mechanics"],
    topicSlugs: ["classical-mechanics/oscillators-everywhere", "classical-mechanics/damped-and-driven-oscillations"],
    paramsSchema: z.object({
      theta0: z.number().min(-1.5).max(1.5).describe("Initial angle (rad)"),
      length: z.number().min(0.1).max(5).describe("Pendulum length (m)"),
    }).partial(),
  },
  {
    id: "CoupledPendulumScene",
    label: "Coupled pendulums",
    description: "Two pendulums coupled by a spring; normal modes and beats.",
    tags: ["oscillation", "coupling", "normal-modes"],
    topicSlugs: ["classical-mechanics/oscillators-everywhere"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "PhaseSpaceScene",
    label: "Phase-space portrait",
    description: "Trajectories in (theta, theta-dot) phase space for a pendulum.",
    tags: ["oscillation", "phase-space", "mechanics"],
    topicSlugs: ["classical-mechanics/phase-space", "classical-mechanics/beyond-small-angles"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "EnergyBowlScene",
    label: "Energy bowl",
    description: "A particle rolling in a potential well; kinetic/potential exchange.",
    tags: ["energy", "mechanics"],
    topicSlugs: ["classical-mechanics/energy-and-work"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "EccentricitySlider",
    label: "Orbit eccentricity",
    description: "Drag a slider to change orbit eccentricity from circle to parabola.",
    tags: ["orbit", "kepler", "ellipse"],
    topicSlugs: ["classical-mechanics/kepler"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "EllipseConstruction",
    label: "Ellipse construction",
    description: "Draw an ellipse with two foci and a taut string.",
    tags: ["geometry", "ellipse", "kepler"],
    topicSlugs: ["classical-mechanics/kepler"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "BeatsScene",
    label: "Beats",
    description: "Two sine waves at close frequencies produce a slow beat envelope.",
    tags: ["waves", "interference", "beats"],
    topicSlugs: ["classical-mechanics/oscillators-everywhere"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "CollisionScene",
    label: "1D collision",
    description: "Elastic vs inelastic 1D collision between two masses.",
    tags: ["momentum", "collision", "mechanics"],
    topicSlugs: ["classical-mechanics/momentum-and-collisions"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "FieldLinesPointScene",
    label: "Field lines — point charge",
    description: "Radial electric field lines around a single point charge.",
    tags: ["electric-field", "field-lines", "electrostatics"],
    topicSlugs: ["electromagnetism/the-electric-field"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "FieldLinesDipoleScene",
    label: "Field lines — dipole",
    description: "Electric field lines of a + and − charge pair.",
    tags: ["dipole", "field-lines", "electrostatics"],
    topicSlugs: ["electromagnetism/the-electric-field"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "GaussianSurfacesScene",
    label: "Gaussian surfaces",
    description: "Pick a symmetry and see the Gaussian surface that exploits it.",
    tags: ["gauss", "flux", "electrostatics"],
    topicSlugs: ["electromagnetism/gauss-law"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "EquipotentialLinesScene",
    label: "Equipotential lines",
    description: "Perpendicular equipotential contours over a field.",
    tags: ["potential", "equipotential", "electrostatics"],
    topicSlugs: ["electromagnetism/electric-potential"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "ParallelPlateCapacitorScene",
    label: "Parallel-plate capacitor",
    description: "Uniform field between two plates; voltage and charge linkage.",
    tags: ["capacitor", "field", "electrostatics"],
    topicSlugs: ["electromagnetism/capacitance-and-field-energy"],
    paramsSchema: z.object({}).partial(),
  },
  {
    id: "ActionReactionScene",
    label: "Action-reaction pair",
    description: "Newton's third law visualized with two bodies.",
    tags: ["newton", "forces", "mechanics"],
    topicSlugs: ["classical-mechanics/newtons-three-laws"],
    paramsSchema: z.object({}).partial(),
  },
];

export function getSceneEntry(id: string): SceneCatalogEntry | undefined {
  return SCENE_CATALOG.find((e) => e.id === id);
}
