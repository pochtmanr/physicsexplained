"use client";
import dynamic from "next/dynamic";
import { createElement, type ComponentType } from "react";
import { SceneSkeleton } from "@/components/layout/scene-skeleton";

// `next/dynamic` with `ssr: false` makes each scene ship as its own async chunk
// instead of being bundled into every topic page. Each entry below must use a
// LITERAL import specifier (not a variable) so the webpack/Turbopack code
// splitter can emit a dedicated chunk per scene.
//
// `loading` renders the SceneSkeleton while the chunk is in flight; with
// `ssr: false` the skeleton also appears in the initial SSR HTML, which is
// fine for a simulation — it's interactive-only content that needs a client
// runtime anyway.

const loading = () => createElement(SceneSkeleton);

function lazyScene<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
): ComponentType<any> {
  return dynamic(loader, { ssr: false, loading });
}

export const SIMULATION_REGISTRY: Record<string, ComponentType<any>> = {
  ActionReactionScene: lazyScene(() =>
    import("@/components/physics/action-reaction-scene").then((m) => ({ default: m.ActionReactionScene })),
  ),
  AngularAccelerationScene: lazyScene(() =>
    import("@/components/physics/angular-acceleration-scene").then((m) => ({ default: m.AngularAccelerationScene })),
  ),
  BeatsScene: lazyScene(() =>
    import("@/components/physics/beats-scene").then((m) => ({ default: m.BeatsScene })),
  ),
  CavendishScene: lazyScene(() =>
    import("@/components/physics/cavendish-scene").then((m) => ({ default: m.CavendishScene })),
  ),
  CenterOfMassScene: lazyScene(() =>
    import("@/components/physics/center-of-mass-scene").then((m) => ({ default: m.CenterOfMassScene })),
  ),
  ChandlerWobbleScene: lazyScene(() =>
    import("@/components/physics/chandler-wobble-scene").then((m) => ({ default: m.ChandlerWobbleScene })),
  ),
  CollisionScene: lazyScene(() =>
    import("@/components/physics/collision-scene").then((m) => ({ default: m.CollisionScene })),
  ),
  CoupledPendulumScene: lazyScene(() =>
    import("@/components/physics/coupled-pendulum-scene").then((m) => ({ default: m.CoupledPendulumScene })),
  ),
  CycloidScene: lazyScene(() =>
    import("@/components/physics/cycloid-scene").then((m) => ({ default: m.CycloidScene })),
  ),
  DampedPendulumScene: lazyScene(() =>
    import("@/components/physics/damped-pendulum-scene").then((m) => ({ default: m.DampedPendulumScene })),
  ),
  DragRegimesScene: lazyScene(() =>
    import("@/components/physics/drag-regimes-scene").then((m) => ({ default: m.DragRegimesScene })),
  ),
  EccentricitySlider: lazyScene(() =>
    import("@/components/physics/eccentricity-slider").then((m) => ({ default: m.EccentricitySlider })),
  ),
  EllipseConstruction: lazyScene(() =>
    import("@/components/physics/ellipse-construction").then((m) => ({ default: m.EllipseConstruction })),
  ),
  EllipticIntegralScene: lazyScene(() =>
    import("@/components/physics/elliptic-integral-scene").then((m) => ({ default: m.EllipticIntegralScene })),
  ),
  EnergyBowlScene: lazyScene(() =>
    import("@/components/physics/energy-bowl-scene").then((m) => ({ default: m.EnergyBowlScene })),
  ),
  EnergyDiagramScene: lazyScene(() =>
    import("@/components/physics/energy-diagram-scene").then((m) => ({ default: m.EnergyDiagramScene })),
  ),
  EpicycleScene: lazyScene(() =>
    import("@/components/physics/epicycle-scene").then((m) => ({ default: m.EpicycleScene })),
  ),
  EquatorialBulgeScene: lazyScene(() =>
    import("@/components/physics/equatorial-bulge-scene").then((m) => ({ default: m.EquatorialBulgeScene })),
  ),
  EulerAnglesScene: lazyScene(() =>
    import("@/components/physics/euler-angles-scene").then((m) => ({ default: m.EulerAnglesScene })),
  ),
  FMaScene: lazyScene(() =>
    import("@/components/physics/f-ma-scene").then((m) => ({ default: m.FMaScene })),
  ),
  FirstLawScene: lazyScene(() =>
    import("@/components/physics/first-law-scene").then((m) => ({ default: m.FirstLawScene })),
  ),
  FreeFallScene: lazyScene(() =>
    import("@/components/physics/free-fall-scene").then((m) => ({ default: m.FreeFallScene })),
  ),
  FrictionRampScene: lazyScene(() =>
    import("@/components/physics/friction-ramp-scene").then((m) => ({ default: m.FrictionRampScene })),
  ),
  GravPotentialScene: lazyScene(() =>
    import("@/components/physics/grav-potential-scene").then((m) => ({ default: m.GravPotentialScene })),
  ),
  GravityAssistScene: lazyScene(() =>
    import("@/components/physics/gravity-assist-scene").then((m) => ({ default: m.GravityAssistScene })),
  ),
  GravityFieldScene: lazyScene(() =>
    import("@/components/physics/gravity-field-scene").then((m) => ({ default: m.GravityFieldScene })),
  ),
  GyroscopeScene: lazyScene(() =>
    import("@/components/physics/gyroscope-scene").then((m) => ({ default: m.GyroscopeScene })),
  ),
  HarmonyTable: lazyScene(() =>
    import("@/components/physics/harmony-table").then((m) => ({ default: m.HarmonyTable })),
  ),
  HohmannScene: lazyScene(() =>
    import("@/components/physics/hohmann-scene").then((m) => ({ default: m.HohmannScene })),
  ),
  InclinedPlaneScene: lazyScene(() =>
    import("@/components/physics/inclined-plane-scene").then((m) => ({ default: m.InclinedPlaneScene })),
  ),
  InverseSquareScene: lazyScene(() =>
    import("@/components/physics/inverse-square-scene").then((m) => ({ default: m.InverseSquareScene })),
  ),
  InverseSquareViz: lazyScene(() =>
    import("@/components/physics/inverse-square-viz").then((m) => ({ default: m.InverseSquareViz })),
  ),
  IsochronismScene: lazyScene(() =>
    import("@/components/physics/isochronism-scene").then((m) => ({ default: m.IsochronismScene })),
  ),
  KinematicsGraphScene: lazyScene(() =>
    import("@/components/physics/kinematics-graph-scene").then((m) => ({ default: m.KinematicsGraphScene })),
  ),
  LagrangePointsScene: lazyScene(() =>
    import("@/components/physics/lagrange-points-scene").then((m) => ({ default: m.LagrangePointsScene })),
  ),
  LagrangianScene: lazyScene(() =>
    import("@/components/physics/lagrangian-scene").then((m) => ({ default: m.LagrangianScene })),
  ),
  MonkeyHunterScene: lazyScene(() =>
    import("@/components/physics/monkey-hunter-scene").then((m) => ({ default: m.MonkeyHunterScene })),
  ),
  NonlinearDynamicsScene: lazyScene(() =>
    import("@/components/physics/nonlinear-dynamics-scene").then((m) => ({ default: m.NonlinearDynamicsScene })),
  ),
  OrbitEnergyScene: lazyScene(() =>
    import("@/components/physics/orbit-energy-scene").then((m) => ({ default: m.OrbitEnergyScene })),
  ),
  OrbitScene: lazyScene(() =>
    import("@/components/physics/orbit-scene").then((m) => ({ default: m.OrbitScene })),
  ),
  ParallelAxisTheoremScene: lazyScene(() =>
    import("@/components/physics/parallel-axis-theorem-scene").then((m) => ({ default: m.ParallelAxisTheoremScene })),
  ),
  PendulumScene: lazyScene(() =>
    import("@/components/physics/pendulum-scene").then((m) => ({ default: m.PendulumScene })),
  ),
  PeriodVsAmplitudeScene: lazyScene(() =>
    import("@/components/physics/period-vs-amplitude-scene").then((m) => ({ default: m.PeriodVsAmplitudeScene })),
  ),
  PhasePortrait: lazyScene(() =>
    import("@/components/physics/phase-portrait").then((m) => ({ default: m.PhasePortrait })),
  ),
  PowerScene: lazyScene(() =>
    import("@/components/physics/power-scene").then((m) => ({ default: m.PowerScene })),
  ),
  PrincipalAxesScene: lazyScene(() =>
    import("@/components/physics/principal-axes-scene").then((m) => ({ default: m.PrincipalAxesScene })),
  ),
  ProjectileScene: lazyScene(() =>
    import("@/components/physics/projectile-scene").then((m) => ({ default: m.ProjectileScene })),
  ),
  RadiusOfGyrationScene: lazyScene(() =>
    import("@/components/physics/radius-of-gyration-scene").then((m) => ({ default: m.RadiusOfGyrationScene })),
  ),
  RampRaceScene: lazyScene(() =>
    import("@/components/physics/ramp-race-scene").then((m) => ({ default: m.RampRaceScene })),
  ),
  ResonanceCurveScene: lazyScene(() =>
    import("@/components/physics/resonance-curve-scene").then((m) => ({ default: m.ResonanceCurveScene })),
  ),
  RestoringForceScene: lazyScene(() =>
    import("@/components/physics/restoring-force-scene").then((m) => ({ default: m.RestoringForceScene })),
  ),
  RocheLimitScene: lazyScene(() =>
    import("@/components/physics/roche-limit-scene").then((m) => ({ default: m.RocheLimitScene })),
  ),
  SeparatrixScene: lazyScene(() =>
    import("@/components/physics/separatrix-scene").then((m) => ({ default: m.SeparatrixScene })),
  ),
  ShellTheoremScene: lazyScene(() =>
    import("@/components/physics/shell-theorem-scene").then((m) => ({ default: m.ShellTheoremScene })),
  ),
  ShmOscillatorScene: lazyScene(() =>
    import("@/components/physics/shm-oscillator-scene").then((m) => ({ default: m.ShmOscillatorScene })),
  ),
  SkaterSpinScene: lazyScene(() =>
    import("@/components/physics/skater-spin-scene").then((m) => ({ default: m.SkaterSpinScene })),
  ),
  SmallAngleScene: lazyScene(() =>
    import("@/components/physics/small-angle-scene").then((m) => ({ default: m.SmallAngleScene })),
  ),
  SweepAreas: lazyScene(() =>
    import("@/components/physics/sweep-areas").then((m) => ({ default: m.SweepAreas })),
  ),
  SymmetryTriptychScene: lazyScene(() =>
    import("@/components/physics/symmetry-triptych-scene").then((m) => ({ default: m.SymmetryTriptychScene })),
  ),
  TangentZoomScene: lazyScene(() =>
    import("@/components/physics/tangent-zoom-scene").then((m) => ({ default: m.TangentZoomScene })),
  ),
  TaylorExpansionScene: lazyScene(() =>
    import("@/components/physics/taylor-expansion-scene").then((m) => ({ default: m.TaylorExpansionScene })),
  ),
  TerminalVelocityScene: lazyScene(() =>
    import("@/components/physics/terminal-velocity-scene").then((m) => ({ default: m.TerminalVelocityScene })),
  ),
  TidalForceScene: lazyScene(() =>
    import("@/components/physics/tidal-force-scene").then((m) => ({ default: m.TidalForceScene })),
  ),
  TorqueLeverScene: lazyScene(() =>
    import("@/components/physics/torque-lever-scene").then((m) => ({ default: m.TorqueLeverScene })),
  ),
  UniversalOscillatorScene: lazyScene(() =>
    import("@/components/physics/universal-oscillator-scene").then((m) => ({ default: m.UniversalOscillatorScene })),
  ),
  VectorAdditionScene: lazyScene(() =>
    import("@/components/physics/vector-addition-scene").then((m) => ({ default: m.VectorAdditionScene })),
  ),
  VisVivaScene: lazyScene(() =>
    import("@/components/physics/vis-viva-scene").then((m) => ({ default: m.VisVivaScene })),
  ),
  WaveChainScene: lazyScene(() =>
    import("@/components/physics/wave-chain-scene").then((m) => ({ default: m.WaveChainScene })),
  ),
  WorkScene: lazyScene(() =>
    import("@/components/physics/work-scene").then((m) => ({ default: m.WorkScene })),
  ),
};

export type SimulationName = keyof typeof SIMULATION_REGISTRY;

export function getSimulation(name: string): ComponentType<any> {
  const component = SIMULATION_REGISTRY[name];
  if (!component) {
    throw new Error(`unknown simulation component: ${name}`);
  }
  return component;
}
