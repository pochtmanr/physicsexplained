import type { ComponentType } from "react";
import { ActionReactionScene } from "@/components/physics/action-reaction-scene";
import { AngularAccelerationScene } from "@/components/physics/angular-acceleration-scene";
import { BeatsScene } from "@/components/physics/beats-scene";
import { CavendishScene } from "@/components/physics/cavendish-scene";
import { CenterOfMassScene } from "@/components/physics/center-of-mass-scene";
import { ChandlerWobbleScene } from "@/components/physics/chandler-wobble-scene";
import { CollisionScene } from "@/components/physics/collision-scene";
import { CoupledPendulumScene } from "@/components/physics/coupled-pendulum-scene";
import { CycloidScene } from "@/components/physics/cycloid-scene";
import { DampedPendulumScene } from "@/components/physics/damped-pendulum-scene";
import { DragRegimesScene } from "@/components/physics/drag-regimes-scene";
import { EccentricitySlider } from "@/components/physics/eccentricity-slider";
import { EllipseConstruction } from "@/components/physics/ellipse-construction";
import { EllipticIntegralScene } from "@/components/physics/elliptic-integral-scene";
import { EnergyBowlScene } from "@/components/physics/energy-bowl-scene";
import { EnergyDiagramScene } from "@/components/physics/energy-diagram-scene";
import { EpicycleScene } from "@/components/physics/epicycle-scene";
import { EquatorialBulgeScene } from "@/components/physics/equatorial-bulge-scene";
import { EulerAnglesScene } from "@/components/physics/euler-angles-scene";
import { FMaScene } from "@/components/physics/f-ma-scene";
import { FirstLawScene } from "@/components/physics/first-law-scene";
import { FreeFallScene } from "@/components/physics/free-fall-scene";
import { FrictionRampScene } from "@/components/physics/friction-ramp-scene";
import { GravPotentialScene } from "@/components/physics/grav-potential-scene";
import { GravityAssistScene } from "@/components/physics/gravity-assist-scene";
import { GravityFieldScene } from "@/components/physics/gravity-field-scene";
import { GyroscopeScene } from "@/components/physics/gyroscope-scene";
import { HarmonyTable } from "@/components/physics/harmony-table";
import { HohmannScene } from "@/components/physics/hohmann-scene";
import { InclinedPlaneScene } from "@/components/physics/inclined-plane-scene";
import { InverseSquareScene } from "@/components/physics/inverse-square-scene";
import { InverseSquareViz } from "@/components/physics/inverse-square-viz";
import { IsochronismScene } from "@/components/physics/isochronism-scene";
import { KinematicsGraphScene } from "@/components/physics/kinematics-graph-scene";
import { LagrangePointsScene } from "@/components/physics/lagrange-points-scene";
import { LagrangianScene } from "@/components/physics/lagrangian-scene";
import { MonkeyHunterScene } from "@/components/physics/monkey-hunter-scene";
import { NonlinearDynamicsScene } from "@/components/physics/nonlinear-dynamics-scene";
import { OrbitEnergyScene } from "@/components/physics/orbit-energy-scene";
import { OrbitScene } from "@/components/physics/orbit-scene";
import { ParallelAxisTheoremScene } from "@/components/physics/parallel-axis-theorem-scene";
import { PendulumScene } from "@/components/physics/pendulum-scene";
import { PeriodVsAmplitudeScene } from "@/components/physics/period-vs-amplitude-scene";
import { PhasePortrait } from "@/components/physics/phase-portrait";
import { PowerScene } from "@/components/physics/power-scene";
import { PrincipalAxesScene } from "@/components/physics/principal-axes-scene";
import { ProjectileScene } from "@/components/physics/projectile-scene";
import { RadiusOfGyrationScene } from "@/components/physics/radius-of-gyration-scene";
import { RampRaceScene } from "@/components/physics/ramp-race-scene";
import { ResonanceCurveScene } from "@/components/physics/resonance-curve-scene";
import { RestoringForceScene } from "@/components/physics/restoring-force-scene";
import { RocheLimitScene } from "@/components/physics/roche-limit-scene";
import { SeparatrixScene } from "@/components/physics/separatrix-scene";
import { ShellTheoremScene } from "@/components/physics/shell-theorem-scene";
import { ShmOscillatorScene } from "@/components/physics/shm-oscillator-scene";
import { SkaterSpinScene } from "@/components/physics/skater-spin-scene";
import { SmallAngleScene } from "@/components/physics/small-angle-scene";
import { SweepAreas } from "@/components/physics/sweep-areas";
import { SymmetryTriptychScene } from "@/components/physics/symmetry-triptych-scene";
import { TangentZoomScene } from "@/components/physics/tangent-zoom-scene";
import { TaylorExpansionScene } from "@/components/physics/taylor-expansion-scene";
import { TerminalVelocityScene } from "@/components/physics/terminal-velocity-scene";
import { TidalForceScene } from "@/components/physics/tidal-force-scene";
import { TorqueLeverScene } from "@/components/physics/torque-lever-scene";
import { UniversalOscillatorScene } from "@/components/physics/universal-oscillator-scene";
import { VectorAdditionScene } from "@/components/physics/vector-addition-scene";
import { VisVivaScene } from "@/components/physics/vis-viva-scene";
import { WaveChainScene } from "@/components/physics/wave-chain-scene";
import { WorkScene } from "@/components/physics/work-scene";

// Allowlist of components that MDX / DB blocks may reference by string name.
// Add a new simulation here before using it in content.
//
// Types: DB-stored props are opaque JSON so the registry stores components as
// ComponentType<any>. The renderer spreads `props` at runtime; invalid prop
// combinations surface as React prop-validation errors, not type errors.
export const SIMULATION_REGISTRY: Record<string, ComponentType<any>> = {
  ActionReactionScene,
  AngularAccelerationScene,
  BeatsScene,
  CavendishScene,
  CenterOfMassScene,
  ChandlerWobbleScene,
  CollisionScene,
  CoupledPendulumScene,
  CycloidScene,
  DampedPendulumScene,
  DragRegimesScene,
  EccentricitySlider,
  EllipseConstruction,
  EllipticIntegralScene,
  EnergyBowlScene,
  EnergyDiagramScene,
  EpicycleScene,
  EquatorialBulgeScene,
  EulerAnglesScene,
  FMaScene,
  FirstLawScene,
  FreeFallScene,
  FrictionRampScene,
  GravPotentialScene,
  GravityAssistScene,
  GravityFieldScene,
  GyroscopeScene,
  HarmonyTable,
  HohmannScene,
  InclinedPlaneScene,
  InverseSquareScene,
  InverseSquareViz,
  IsochronismScene,
  KinematicsGraphScene,
  LagrangePointsScene,
  LagrangianScene,
  MonkeyHunterScene,
  NonlinearDynamicsScene,
  OrbitEnergyScene,
  OrbitScene,
  ParallelAxisTheoremScene,
  PendulumScene,
  PeriodVsAmplitudeScene,
  PhasePortrait,
  PowerScene,
  PrincipalAxesScene,
  ProjectileScene,
  RadiusOfGyrationScene,
  RampRaceScene,
  ResonanceCurveScene,
  RestoringForceScene,
  RocheLimitScene,
  SeparatrixScene,
  ShellTheoremScene,
  ShmOscillatorScene,
  SkaterSpinScene,
  SmallAngleScene,
  SweepAreas,
  SymmetryTriptychScene,
  TangentZoomScene,
  TaylorExpansionScene,
  TerminalVelocityScene,
  TidalForceScene,
  TorqueLeverScene,
  UniversalOscillatorScene,
  VectorAdditionScene,
  VisVivaScene,
  WaveChainScene,
  WorkScene,
};

export type SimulationName = keyof typeof SIMULATION_REGISTRY;

export function getSimulation(name: string): ComponentType<any> {
  const component = SIMULATION_REGISTRY[name];
  if (!component) {
    throw new Error(`unknown simulation component: ${name}`);
  }
  return component;
}
