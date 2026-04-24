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
  TravellingWaveScene: lazyScene(() =>
    import("@/components/physics/travelling-wave-scene").then((m) => ({ default: m.TravellingWaveScene })),
  ),
  SuperpositionScene: lazyScene(() =>
    import("@/components/physics/superposition-scene").then((m) => ({ default: m.SuperpositionScene })),
  ),
  StringModesScene: lazyScene(() =>
    import("@/components/physics/string-modes-scene").then((m) => ({ default: m.StringModesScene })),
  ),
  ChladniScene: lazyScene(() =>
    import("@/components/physics/chladni-scene").then((m) => ({ default: m.ChladniScene })),
  ),
  DopplerScene: lazyScene(() =>
    import("@/components/physics/doppler-scene").then((m) => ({ default: m.DopplerScene })),
  ),
  RedshiftScene: lazyScene(() =>
    import("@/components/physics/redshift-scene").then((m) => ({ default: m.RedshiftScene })),
  ),
  WavePacketScene: lazyScene(() =>
    import("@/components/physics/wave-packet-scene").then((m) => ({ default: m.WavePacketScene })),
  ),
  DispersionScene: lazyScene(() =>
    import("@/components/physics/dispersion-scene").then((m) => ({ default: m.DispersionScene })),
  ),
  BuoyancyScene: lazyScene(() =>
    import("@/components/physics/buoyancy-scene").then((m) => ({ default: m.BuoyancyScene })),
  ),
  VenturiScene: lazyScene(() =>
    import("@/components/physics/venturi-scene").then((m) => ({ default: m.VenturiScene })),
  ),
  PoiseuilleProfileScene: lazyScene(() =>
    import("@/components/physics/poiseuille-profile-scene").then((m) => ({ default: m.PoiseuilleProfileScene })),
  ),
  ReynoldsRegimesScene: lazyScene(() =>
    import("@/components/physics/reynolds-regimes-scene").then((m) => ({ default: m.ReynoldsRegimesScene })),
  ),
  KolmogorovSpectrumScene: lazyScene(() =>
    import("@/components/physics/kolmogorov-spectrum-scene").then((m) => ({ default: m.KolmogorovSpectrumScene })),
  ),
  SnellFermatScene: lazyScene(() =>
    import("@/components/physics/snell-fermat-scene").then((m) => ({ default: m.SnellFermatScene })),
  ),
  SymplecticKeplerScene: lazyScene(() =>
    import("@/components/physics/symplectic-kepler-scene").then((m) => ({ default: m.SymplecticKeplerScene })),
  ),
  LiouvilleFlowScene: lazyScene(() =>
    import("@/components/physics/liouville-flow-scene").then((m) => ({ default: m.LiouvilleFlowScene })),
  ),
  VelocityTriangleScene: lazyScene(() =>
    import("@/components/physics/velocity-triangle-scene").then((m) => ({ default: m.VelocityTriangleScene })),
  ),
  CentripetalForceScene: lazyScene(() =>
    import("@/components/physics/centripetal-force-scene").then((m) => ({ default: m.CentripetalForceScene })),
  ),
  AngularVelocityScene: lazyScene(() =>
    import("@/components/physics/angular-velocity-scene").then((m) => ({ default: m.AngularVelocityScene })),
  ),
  NewtonsCannonScene: lazyScene(() =>
    import("@/components/physics/newtons-cannon-scene").then((m) => ({ default: m.NewtonsCannonScene })),
  ),
  CarouselScene: lazyScene(() =>
    import("@/components/physics/carousel-scene").then((m) => ({ default: m.CarouselScene })),
  ),
  CoriolisTurntableScene: lazyScene(() =>
    import("@/components/physics/coriolis-turntable-scene").then((m) => ({ default: m.CoriolisTurntableScene })),
  ),
  CoriolisGlobeScene: lazyScene(() =>
    import("@/components/physics/coriolis-globe-scene").then((m) => ({ default: m.CoriolisGlobeScene })),
  ),
  RotatingProjectileScene: lazyScene(() =>
    import("@/components/physics/rotating-projectile-scene").then((m) => ({ default: m.RotatingProjectileScene })),
  ),
  WheelDecompositionScene: lazyScene(() =>
    import("@/components/physics/wheel-decomposition-scene").then((m) => ({ default: m.WheelDecompositionScene })),
  ),
  RollingRaceScene: lazyScene(() =>
    import("@/components/physics/rolling-race-scene").then((m) => ({ default: m.RollingRaceScene })),
  ),
  RollingSlippingScene: lazyScene(() =>
    import("@/components/physics/rolling-slipping-scene").then((m) => ({ default: m.RollingSlippingScene })),
  ),
  CoinRollingScene: lazyScene(() =>
    import("@/components/physics/coin-rolling-scene").then((m) => ({ default: m.CoinRollingScene })),
  ),
  DampedRegimesScene: lazyScene(() =>
    import("@/components/physics/damped-regimes-scene").then((m) => ({ default: m.DampedRegimesScene })),
  ),
  QualityFactorScene: lazyScene(() =>
    import("@/components/physics/quality-factor-scene").then((m) => ({ default: m.QualityFactorScene })),
  ),

  // EM §01 — coulombs-law
  TwoChargeForceScene: lazyScene(() =>
    import("@/components/physics/two-charge-force-scene").then((m) => ({ default: m.TwoChargeForceScene })),
  ),
  DipoleFieldScene: lazyScene(() =>
    import("@/components/physics/dipole-field-scene").then((m) => ({ default: m.DipoleFieldScene })),
  ),
  ChargeSuperpositionScene: lazyScene(() =>
    import("@/components/physics/charge-superposition-scene").then((m) => ({ default: m.ChargeSuperpositionScene })),
  ),

  // EM §01 — the-electric-field
  FieldLinesPointScene: lazyScene(() =>
    import("@/components/physics/field-lines-point-scene").then((m) => ({ default: m.FieldLinesPointScene })),
  ),
  FieldLinesDipoleScene: lazyScene(() =>
    import("@/components/physics/field-lines-dipole-scene").then((m) => ({ default: m.FieldLinesDipoleScene })),
  ),
  FieldLinesParallelPlatesScene: lazyScene(() =>
    import("@/components/physics/field-lines-parallel-plates-scene").then((m) => ({ default: m.FieldLinesParallelPlatesScene })),
  ),

  // EM §01 — gauss-law (money shot)
  GaussianSurfacesScene: lazyScene(() =>
    import("@/components/physics/gaussian-surfaces-scene").then((m) => ({ default: m.GaussianSurfacesScene })),
  ),
  GaussSymmetryScene: lazyScene(() =>
    import("@/components/physics/gauss-symmetry-scene").then((m) => ({ default: m.GaussSymmetryScene })),
  ),
  FluxThroughSurfaceScene: lazyScene(() =>
    import("@/components/physics/flux-through-surface-scene").then((m) => ({ default: m.FluxThroughSurfaceScene })),
  ),

  // EM §01 — electric-potential
  PotentialSurfaceScene: lazyScene(() =>
    import("@/components/physics/potential-surface-scene").then((m) => ({ default: m.PotentialSurfaceScene })),
  ),
  EquipotentialLinesScene: lazyScene(() =>
    import("@/components/physics/equipotential-lines-scene").then((m) => ({ default: m.EquipotentialLinesScene })),
  ),
  VoltageRampScene: lazyScene(() =>
    import("@/components/physics/voltage-ramp-scene").then((m) => ({ default: m.VoltageRampScene })),
  ),

  // EM §01 — capacitance-and-field-energy
  ParallelPlateCapacitorScene: lazyScene(() =>
    import("@/components/physics/parallel-plate-capacitor-scene").then((m) => ({ default: m.ParallelPlateCapacitorScene })),
  ),
  CapacitorChargingScene: lazyScene(() =>
    import("@/components/physics/capacitor-charging-scene").then((m) => ({ default: m.CapacitorChargingScene })),
  ),
  EnergyDensityScene: lazyScene(() =>
    import("@/components/physics/energy-density-scene").then((m) => ({ default: m.EnergyDensityScene })),
  ),

  // EM §01 — conductors-and-shielding
  FaradayCageScene: lazyScene(() =>
    import("@/components/physics/faraday-cage-scene").then((m) => ({ default: m.FaradayCageScene })),
  ),
  ConductorChargeDistributionScene: lazyScene(() =>
    import("@/components/physics/conductor-charge-distribution-scene").then((m) => ({ default: m.ConductorChargeDistributionScene })),
  ),
  LightningShelterScene: lazyScene(() =>
    import("@/components/physics/lightning-shelter-scene").then((m) => ({ default: m.LightningShelterScene })),
  ),

  // EM §01 — method-of-images
  ImageChargePlaneScene: lazyScene(() =>
    import("@/components/physics/image-charge-plane-scene").then((m) => ({ default: m.ImageChargePlaneScene })),
  ),
  ImageChargeSphereScene: lazyScene(() =>
    import("@/components/physics/image-charge-sphere-scene").then((m) => ({ default: m.ImageChargeSphereScene })),
  ),
  InducedChargeScene: lazyScene(() =>
    import("@/components/physics/induced-charge-scene").then((m) => ({ default: m.InducedChargeScene })),
  ),

  // EM §02 — polarization-and-bound-charges
  DipoleAlignmentScene: lazyScene(() =>
    import("@/components/physics/dipole-alignment-scene").then((m) => ({ default: m.DipoleAlignmentScene })),
  ),
  BoundChargeDensityScene: lazyScene(() =>
    import("@/components/physics/bound-charge-density-scene").then((m) => ({ default: m.BoundChargeDensityScene })),
  ),
  PolarizationVsFieldScene: lazyScene(() =>
    import("@/components/physics/polarization-vs-field-scene").then((m) => ({ default: m.PolarizationVsFieldScene })),
  ),

  // EM §02 — dielectrics-and-the-d-field
  DFieldFreeChargeScene: lazyScene(() =>
    import("@/components/physics/d-field-free-charge-scene").then((m) => ({ default: m.DFieldFreeChargeScene })),
  ),
  DielectricCapacitorScene: lazyScene(() =>
    import("@/components/physics/dielectric-capacitor-scene").then((m) => ({ default: m.DielectricCapacitorScene })),
  ),
  DVsEDifferenceScene: lazyScene(() =>
    import("@/components/physics/d-vs-e-difference-scene").then((m) => ({ default: m.DVsEDifferenceScene })),
  ),

  // EM §02 — boundary-conditions-at-interfaces
  BoundaryEFieldScene: lazyScene(() =>
    import("@/components/physics/boundary-e-field-scene").then((m) => ({ default: m.BoundaryEFieldScene })),
  ),
  BoundaryDFieldScene: lazyScene(() =>
    import("@/components/physics/boundary-d-field-scene").then((m) => ({ default: m.BoundaryDFieldScene })),
  ),
  DielectricRefractionScene: lazyScene(() =>
    import("@/components/physics/dielectric-refraction-scene").then((m) => ({ default: m.DielectricRefractionScene })),
  ),

  // EM §02 — piezo-and-ferroelectricity
  PiezoCrystalScene: lazyScene(() =>
    import("@/components/physics/piezo-crystal-scene").then((m) => ({ default: m.PiezoCrystalScene })),
  ),
  FerroelectricHysteresisScene: lazyScene(() =>
    import("@/components/physics/ferroelectric-hysteresis-scene").then((m) => ({ default: m.FerroelectricHysteresisScene })),
  ),
  DomainSwitchingScene: lazyScene(() =>
    import("@/components/physics/domain-switching-scene").then((m) => ({ default: m.DomainSwitchingScene })),
  ),

  // EM §03 — the-lorentz-force (money shot)
  LorentzTrajectoryScene: lazyScene(() =>
    import("@/components/physics/lorentz-trajectory-scene").then((m) => ({ default: m.LorentzTrajectoryScene })),
  ),
  VelocitySelectorScene: lazyScene(() =>
    import("@/components/physics/velocity-selector-scene").then((m) => ({ default: m.VelocitySelectorScene })),
  ),
  CyclotronScene: lazyScene(() =>
    import("@/components/physics/cyclotron-scene").then((m) => ({ default: m.CyclotronScene })),
  ),

  // EM §03 — biot-savart-law
  WireSegmentFieldScene: lazyScene(() =>
    import("@/components/physics/wire-segment-field-scene").then((m) => ({ default: m.WireSegmentFieldScene })),
  ),
  LoopFieldScene: lazyScene(() =>
    import("@/components/physics/loop-field-scene").then((m) => ({ default: m.LoopFieldScene })),
  ),
  StraightWireFieldScene: lazyScene(() =>
    import("@/components/physics/straight-wire-field-scene").then((m) => ({ default: m.StraightWireFieldScene })),
  ),

  // EM §03 — amperes-law
  AmpereLoopWireScene: lazyScene(() =>
    import("@/components/physics/ampere-loop-wire-scene").then((m) => ({ default: m.AmpereLoopWireScene })),
  ),
  SolenoidFieldScene: lazyScene(() =>
    import("@/components/physics/solenoid-field-scene").then((m) => ({ default: m.SolenoidFieldScene })),
  ),
  ToroidFieldScene: lazyScene(() =>
    import("@/components/physics/toroid-field-scene").then((m) => ({ default: m.ToroidFieldScene })),
  ),

  // EM §03 — the-vector-potential
  VectorPotentialScene: lazyScene(() =>
    import("@/components/physics/vector-potential-scene").then((m) => ({ default: m.VectorPotentialScene })),
  ),
  GaugeFreedomScene: lazyScene(() =>
    import("@/components/physics/gauge-freedom-scene").then((m) => ({ default: m.GaugeFreedomScene })),
  ),
  ASourceCurrentScene: lazyScene(() =>
    import("@/components/physics/a-source-current-scene").then((m) => ({ default: m.ASourceCurrentScene })),
  ),

  // EM §03 — magnetic-dipoles
  DipoleTorqueScene: lazyScene(() =>
    import("@/components/physics/dipole-torque-scene").then((m) => ({ default: m.DipoleTorqueScene })),
  ),
  CompassScene: lazyScene(() =>
    import("@/components/physics/compass-scene").then((m) => ({ default: m.CompassScene })),
  ),
  MagneticDipoleFieldScene: lazyScene(() =>
    import("@/components/physics/magnetic-dipole-field-scene").then((m) => ({ default: m.MagneticDipoleFieldScene })),
  ),

  // EM §04 — magnetization-and-the-h-field
  MagnetizationVectorsScene: lazyScene(() =>
    import("@/components/physics/magnetization-vectors-scene").then((m) => ({ default: m.MagnetizationVectorsScene })),
  ),
  HVsBFieldScene: lazyScene(() =>
    import("@/components/physics/h-vs-b-field-scene").then((m) => ({ default: m.HVsBFieldScene })),
  ),
  ChiVsTemperatureScene: lazyScene(() =>
    import("@/components/physics/chi-vs-temperature-scene").then((m) => ({ default: m.ChiVsTemperatureScene })),
  ),

  // EM §04 — dia-and-paramagnetism
  OrbitalResponseScene: lazyScene(() =>
    import("@/components/physics/orbital-response-scene").then((m) => ({ default: m.OrbitalResponseScene })),
  ),
  ParamagnetAlignmentScene: lazyScene(() =>
    import("@/components/physics/paramagnet-alignment-scene").then((m) => ({ default: m.ParamagnetAlignmentScene })),
  ),
  SusceptibilitySpectrumScene: lazyScene(() =>
    import("@/components/physics/susceptibility-spectrum-scene").then((m) => ({ default: m.SusceptibilitySpectrumScene })),
  ),

  // EM §04 — ferromagnetism-and-hysteresis (money shot)
  HysteresisDomainScene: lazyScene(() =>
    import("@/components/physics/hysteresis-domain-scene").then((m) => ({ default: m.HysteresisDomainScene })),
  ),
  CurieTransitionScene: lazyScene(() =>
    import("@/components/physics/curie-transition-scene").then((m) => ({ default: m.CurieTransitionScene })),
  ),
  DomainWallMotionScene: lazyScene(() =>
    import("@/components/physics/domain-wall-motion-scene").then((m) => ({ default: m.DomainWallMotionScene })),
  ),

  // EM §04 — superconductivity-and-meissner
  MeissnerExpulsionScene: lazyScene(() =>
    import("@/components/physics/meissner-expulsion-scene").then((m) => ({ default: m.MeissnerExpulsionScene })),
  ),
  LevitationScene: lazyScene(() =>
    import("@/components/physics/levitation-scene").then((m) => ({ default: m.LevitationScene })),
  ),
  CriticalTemperatureScene: lazyScene(() =>
    import("@/components/physics/critical-temperature-scene").then((m) => ({ default: m.CriticalTemperatureScene })),
  ),

  // EM §05 — faradays-law
  MagnetThroughCoilScene: lazyScene(() =>
    import("@/components/physics/magnet-through-coil-scene").then((m) => ({ default: m.MagnetThroughCoilScene })),
  ),
  FluxChangeAreaScene: lazyScene(() =>
    import("@/components/physics/flux-change-area-scene").then((m) => ({ default: m.FluxChangeAreaScene })),
  ),
  FaradayDiskScene: lazyScene(() =>
    import("@/components/physics/faraday-disk-scene").then((m) => ({ default: m.FaradayDiskScene })),
  ),

  // EM §05 — lenz-law-and-motional-emf
  LenzOppositionScene: lazyScene(() =>
    import("@/components/physics/lenz-opposition-scene").then((m) => ({ default: m.LenzOppositionScene })),
  ),
  SlidingRodEmfScene: lazyScene(() =>
    import("@/components/physics/sliding-rod-emf-scene").then((m) => ({ default: m.SlidingRodEmfScene })),
  ),
  JumpingRingScene: lazyScene(() =>
    import("@/components/physics/jumping-ring-scene").then((m) => ({ default: m.JumpingRingScene })),
  ),

  // EM §05 — self-and-mutual-inductance
  InductorCurrentBuildupScene: lazyScene(() =>
    import("@/components/physics/inductor-current-buildup-scene").then((m) => ({ default: m.InductorCurrentBuildupScene })),
  ),
  MutualInductionScene: lazyScene(() =>
    import("@/components/physics/mutual-induction-scene").then((m) => ({ default: m.MutualInductionScene })),
  ),
  RLTimeConstantScene: lazyScene(() =>
    import("@/components/physics/rl-time-constant-scene").then((m) => ({ default: m.RLTimeConstantScene })),
  ),

  // EM §05 — energy-in-magnetic-fields
  MagneticEnergyDensityScene: lazyScene(() =>
    import("@/components/physics/magnetic-energy-density-scene").then((m) => ({ default: m.MagneticEnergyDensityScene })),
  ),
  InductorEnergyRampScene: lazyScene(() =>
    import("@/components/physics/inductor-energy-ramp-scene").then((m) => ({ default: m.InductorEnergyRampScene })),
  ),
  CapacitorVsInductorScene: lazyScene(() =>
    import("@/components/physics/capacitor-vs-inductor-scene").then((m) => ({ default: m.CapacitorVsInductorScene })),
  ),

  // EM §05 — eddy-currents (money shot)
  MagnetThroughTubeScene: lazyScene(() =>
    import("@/components/physics/magnet-through-tube-scene").then((m) => ({ default: m.MagnetThroughTubeScene })),
  ),
  InductionHeatingScene: lazyScene(() =>
    import("@/components/physics/induction-heating-scene").then((m) => ({ default: m.InductionHeatingScene })),
  ),
  MagneticBrakeScene: lazyScene(() =>
    import("@/components/physics/magnetic-brake-scene").then((m) => ({ default: m.MagneticBrakeScene })),
  ),

  // EM §06 — dc-circuits-and-kirchhoff
  ResistorLadderScene: lazyScene(() =>
    import("@/components/physics/resistor-ladder-scene").then((m) => ({ default: m.ResistorLadderScene })),
  ),
  NodeLoopLawScene: lazyScene(() =>
    import("@/components/physics/node-loop-law-scene").then((m) => ({ default: m.NodeLoopLawScene })),
  ),
  VoltageDividerScene: lazyScene(() =>
    import("@/components/physics/voltage-divider-scene").then((m) => ({ default: m.VoltageDividerScene })),
  ),

  // EM §06 — rc-circuits
  RcChargingScene: lazyScene(() =>
    import("@/components/physics/rc-charging-scene").then((m) => ({ default: m.RcChargingScene })),
  ),
  RcDischargingScene: lazyScene(() =>
    import("@/components/physics/rc-discharging-scene").then((m) => ({ default: m.RcDischargingScene })),
  ),
  RcTimeConstantScene: lazyScene(() =>
    import("@/components/physics/rc-time-constant-scene").then((m) => ({ default: m.RcTimeConstantScene })),
  ),

  // EM §06 — rl-circuits
  RlRampScene: lazyScene(() =>
    import("@/components/physics/rl-ramp-scene").then((m) => ({ default: m.RlRampScene })),
  ),
  RlDecayScene: lazyScene(() =>
    import("@/components/physics/rl-decay-scene").then((m) => ({ default: m.RlDecayScene })),
  ),
  RlFlybackScene: lazyScene(() =>
    import("@/components/physics/rl-flyback-scene").then((m) => ({ default: m.RlFlybackScene })),
  ),

  // EM §06 — rlc-circuits-and-resonance
  RlcResonanceScene: lazyScene(() =>
    import("@/components/physics/rlc-resonance-scene").then((m) => ({ default: m.RlcResonanceScene })),
  ),
  QFactorScene: lazyScene(() =>
    import("@/components/physics/q-factor-scene").then((m) => ({ default: m.QFactorScene })),
  ),
  RlcBandpassScene: lazyScene(() =>
    import("@/components/physics/rlc-bandpass-scene").then((m) => ({ default: m.RlcBandpassScene })),
  ),

  // EM §06 — ac-circuits-and-phasors
  PhasorDiagramScene: lazyScene(() =>
    import("@/components/physics/phasor-diagram-scene").then((m) => ({ default: m.PhasorDiagramScene })),
  ),
  ImpedanceTriangleScene: lazyScene(() =>
    import("@/components/physics/impedance-triangle-scene").then((m) => ({ default: m.ImpedanceTriangleScene })),
  ),
  PowerFactorScene: lazyScene(() =>
    import("@/components/physics/power-factor-scene").then((m) => ({ default: m.PowerFactorScene })),
  ),

  // EM §06 — transformers
  TransformerCouplingScene: lazyScene(() =>
    import("@/components/physics/transformer-coupling-scene").then((m) => ({ default: m.TransformerCouplingScene })),
  ),
  TurnsRatioScene: lazyScene(() =>
    import("@/components/physics/turns-ratio-scene").then((m) => ({ default: m.TurnsRatioScene })),
  ),
  PowerTransmissionScene: lazyScene(() =>
    import("@/components/physics/power-transmission-scene").then((m) => ({ default: m.PowerTransmissionScene })),
  ),

  // EM §06 — transmission-lines
  TlDistributedScene: lazyScene(() =>
    import("@/components/physics/tl-distributed-scene").then((m) => ({ default: m.TlDistributedScene })),
  ),
  ReflectionCoefficientScene: lazyScene(() =>
    import("@/components/physics/reflection-coefficient-scene").then((m) => ({ default: m.ReflectionCoefficientScene })),
  ),
  StandingWaveRatioScene: lazyScene(() =>
    import("@/components/physics/standing-wave-ratio-scene").then((m) => ({ default: m.StandingWaveRatioScene })),
  ),

  // EM §07 — displacement-current
  AmpereSurfaceMorphScene: lazyScene(() =>
    import("@/components/physics/ampere-surface-morph-scene").then((m) => ({ default: m.AmpereSurfaceMorphScene })),
  ),
  DisplacementFieldBuildupScene: lazyScene(() =>
    import("@/components/physics/displacement-field-buildup-scene").then((m) => ({ default: m.DisplacementFieldBuildupScene })),
  ),
  CapacitorCurrentContinuityScene: lazyScene(() =>
    import("@/components/physics/capacitor-current-continuity-scene").then((m) => ({ default: m.CapacitorCurrentContinuityScene })),
  ),

  // EM §07 — the-four-equations
  MaxwellTableScene: lazyScene(() =>
    import("@/components/physics/maxwell-table-scene").then((m) => ({ default: m.MaxwellTableScene })),
  ),
  IntegralVsDifferentialScene: lazyScene(() =>
    import("@/components/physics/integral-vs-differential-scene").then((m) => ({ default: m.IntegralVsDifferentialScene })),
  ),
  SourceSinkFieldScene: lazyScene(() =>
    import("@/components/physics/source-sink-field-scene").then((m) => ({ default: m.SourceSinkFieldScene })),
  ),

  // EM §07 — gauge-freedom-and-potentials
  GaugeTransformScene: lazyScene(() =>
    import("@/components/physics/gauge-transform-scene").then((m) => ({ default: m.GaugeTransformScene })),
  ),
  LorenzVsCoulombGaugeScene: lazyScene(() =>
    import("@/components/physics/lorenz-vs-coulomb-gauge-scene").then((m) => ({ default: m.LorenzVsCoulombGaugeScene })),
  ),
  PotentialFreedomScene: lazyScene(() =>
    import("@/components/physics/potential-freedom-scene").then((m) => ({ default: m.PotentialFreedomScene })),
  ),

  // EM §07 — the-poynting-vector
  PoyntingFlowScene: lazyScene(() =>
    import("@/components/physics/poynting-flow-scene").then((m) => ({ default: m.PoyntingFlowScene })),
  ),
  CoaxEnergyFlowScene: lazyScene(() =>
    import("@/components/physics/coax-energy-flow-scene").then((m) => ({ default: m.CoaxEnergyFlowScene })),
  ),
  AntennaRadiationPatternScene: lazyScene(() =>
    import("@/components/physics/antenna-radiation-pattern-scene").then((m) => ({ default: m.AntennaRadiationPatternScene })),
  ),

  // EM §07 — maxwell-stress-tensor
  StressTensorFacesScene: lazyScene(() =>
    import("@/components/physics/stress-tensor-faces-scene").then((m) => ({ default: m.StressTensorFacesScene })),
  ),
  FieldPressureScene: lazyScene(() =>
    import("@/components/physics/field-pressure-scene").then((m) => ({ default: m.FieldPressureScene })),
  ),
  FieldMomentumScene: lazyScene(() =>
    import("@/components/physics/field-momentum-scene").then((m) => ({ default: m.FieldMomentumScene })),
  ),

  // EM §09 — fresnel-equations
  FresnelCurvesScene: lazyScene(() =>
    import("@/components/physics/fresnel-curves-scene").then((m) => ({ default: m.FresnelCurvesScene })),
  ),
  BrewsterAngleScene: lazyScene(() =>
    import("@/components/physics/brewster-angle-scene").then((m) => ({ default: m.BrewsterAngleScene })),
  ),
  WaterGlassScene: lazyScene(() =>
    import("@/components/physics/water-glass-scene").then((m) => ({ default: m.WaterGlassScene })),
  ),

  // EM §09 — diffraction-and-the-double-slit
  DoubleSlitBuildupScene: lazyScene(() =>
    import("@/components/physics/double-slit-buildup-scene").then((m) => ({ default: m.DoubleSlitBuildupScene })),
  ),
  SingleSlitScene: lazyScene(() =>
    import("@/components/physics/single-slit-scene").then((m) => ({ default: m.SingleSlitScene })),
  ),
  DiffractionGratingScene: lazyScene(() =>
    import("@/components/physics/diffraction-grating-scene").then((m) => ({ default: m.DiffractionGratingScene })),
  ),

  // EM §09 — polarization-phenomena
  MalusLawScene: lazyScene(() =>
    import("@/components/physics/malus-law-scene").then((m) => ({ default: m.MalusLawScene })),
  ),
  BrewsterAngleDemoScene: lazyScene(() =>
    import("@/components/physics/brewster-angle-demo-scene").then((m) => ({ default: m.BrewsterAngleDemoScene })),
  ),
  CalciteBirefringenceScene: lazyScene(() =>
    import("@/components/physics/calcite-birefringence-scene").then((m) => ({ default: m.CalciteBirefringenceScene })),
  ),

  // EM §08 — deriving-the-em-wave-equation
  MaxwellFourLinesScene: lazyScene(() =>
    import("@/components/physics/maxwell-four-lines-scene").then((m) => ({ default: m.MaxwellFourLinesScene })),
  ),
  VacuumWaveScene: lazyScene(() =>
    import("@/components/physics/vacuum-wave-scene").then((m) => ({ default: m.VacuumWaveScene })),
  ),
  SpeedMeasurementScene: lazyScene(() =>
    import("@/components/physics/speed-measurement-scene").then((m) => ({ default: m.SpeedMeasurementScene })),
  ),

  // EM §08 — plane-waves-and-polarization
  PolarizationMorphScene: lazyScene(() =>
    import("@/components/physics/polarization-morph-scene").then((m) => ({ default: m.PolarizationMorphScene })),
  ),
  PolarizationAxisScene: lazyScene(() =>
    import("@/components/physics/polarization-axis-scene").then((m) => ({ default: m.PolarizationAxisScene })),
  ),
  JonesVectorsScene: lazyScene(() =>
    import("@/components/physics/jones-vectors-scene").then((m) => ({ default: m.JonesVectorsScene })),
  ),

  // EM §08 — radiation-pressure
  PhotonMomentumScene: lazyScene(() =>
    import("@/components/physics/photon-momentum-scene").then((m) => ({ default: m.PhotonMomentumScene })),
  ),
  SolarSailScene: lazyScene(() =>
    import("@/components/physics/solar-sail-scene").then((m) => ({ default: m.SolarSailScene })),
  ),
  NicholsRadiometerScene: lazyScene(() =>
    import("@/components/physics/nichols-radiometer-scene").then((m) => ({ default: m.NicholsRadiometerScene })),
  ),

  // EM §08 — the-electromagnetic-spectrum
  SpectrumBandsScene: lazyScene(() =>
    import("@/components/physics/spectrum-bands-scene").then((m) => ({ default: m.SpectrumBandsScene })),
  ),
  FraunhoferLinesScene: lazyScene(() =>
    import("@/components/physics/fraunhofer-lines-scene").then((m) => ({ default: m.FraunhoferLinesScene })),
  ),
  VisibleBandZoomScene: lazyScene(() =>
    import("@/components/physics/visible-band-zoom-scene").then((m) => ({ default: m.VisibleBandZoomScene })),
  ),

  // EM §09 — index-of-refraction
  MediumDelayScene: lazyScene(() =>
    import("@/components/physics/medium-delay-scene").then((m) => ({ default: m.MediumDelayScene })),
  ),
  DispersionTableScene: lazyScene(() =>
    import("@/components/physics/dispersion-table-scene").then((m) => ({ default: m.DispersionTableScene })),
  ),
  GroupVsPhaseScene: lazyScene(() =>
    import("@/components/physics/group-vs-phase-scene").then((m) => ({ default: m.GroupVsPhaseScene })),
  ),

  // EM §09 — skin-depth-in-conductors
  SkinDepthDecayScene: lazyScene(() =>
    import("@/components/physics/skin-depth-decay-scene").then((m) => ({ default: m.SkinDepthDecayScene })),
  ),
  CrossSectionScene: lazyScene(() =>
    import("@/components/physics/cross-section-scene").then((m) => ({ default: m.CrossSectionScene })),
  ),
  CoaxSkinEffectScene: lazyScene(() =>
    import("@/components/physics/coax-skin-effect-scene").then((m) => ({ default: m.CoaxSkinEffectScene })),
  ),

  // EM §09 — total-internal-reflection
  CriticalAngleScene: lazyScene(() =>
    import("@/components/physics/critical-angle-scene").then((m) => ({ default: m.CriticalAngleScene })),
  ),
  FiberOpticTIRScene: lazyScene(() =>
    import("@/components/physics/fiber-optic-tir-scene").then((m) => ({ default: m.FiberOpticTIRScene })),
  ),
  EvanescentWaveScene: lazyScene(() =>
    import("@/components/physics/evanescent-wave-scene").then((m) => ({ default: m.EvanescentWaveScene })),
  ),

  // EM §09 — optical-dispersion
  PrismSpectrumScene: lazyScene(() =>
    import("@/components/physics/prism-spectrum-scene").then((m) => ({ default: m.PrismSpectrumScene })),
  ),
  RainbowFormationScene: lazyScene(() =>
    import("@/components/physics/rainbow-formation-scene").then((m) => ({ default: m.RainbowFormationScene })),
  ),
  AbbeDiagramScene: lazyScene(() =>
    import("@/components/physics/abbe-diagram-scene").then((m) => ({ default: m.AbbeDiagramScene })),
  ),

  // EM §09 — geometric-optics
  FermatPathTimeScene: lazyScene(() =>
    import("@/components/physics/fermat-path-time-scene").then((m) => ({ default: m.FermatPathTimeScene })),
  ),
  ThinLensRayDiagramScene: lazyScene(() =>
    import("@/components/physics/thin-lens-ray-diagram-scene").then((m) => ({ default: m.ThinLensRayDiagramScene })),
  ),
  ConcaveMirrorScene: lazyScene(() =>
    import("@/components/physics/concave-mirror-scene").then((m) => ({ default: m.ConcaveMirrorScene })),
  ),

  // EM §09 — interference
  TwoSourceInterferenceScene: lazyScene(() =>
    import("@/components/physics/two-source-interference-scene").then((m) => ({ default: m.TwoSourceInterferenceScene })),
  ),
  NewtonsRingsScene: lazyScene(() =>
    import("@/components/physics/newtons-rings-scene").then((m) => ({ default: m.NewtonsRingsScene })),
  ),
  ThinFilmScene: lazyScene(() =>
    import("@/components/physics/thin-film-scene").then((m) => ({ default: m.ThinFilmScene })),
  ),

  // EM §09 — waveguides-and-fibers
  StepIndexFiberScene: lazyScene(() =>
    import("@/components/physics/step-index-fiber-scene").then((m) => ({ default: m.StepIndexFiberScene })),
  ),
  NumericalApertureScene: lazyScene(() =>
    import("@/components/physics/numerical-aperture-scene").then((m) => ({ default: m.NumericalApertureScene })),
  ),
  TelecomBandScene: lazyScene(() =>
    import("@/components/physics/telecom-band-scene").then((m) => ({ default: m.TelecomBandScene })),
  ),

  // EM §10 — larmor-formula
  LarmorRadiationLobeScene: lazyScene(() =>
    import("@/components/physics/larmor-radiation-lobe-scene").then((m) => ({ default: m.LarmorRadiationLobeScene })),
  ),
  LarmorPowerVsAccelerationScene: lazyScene(() =>
    import("@/components/physics/larmor-power-vs-acceleration-scene").then((m) => ({ default: m.LarmorPowerVsAccelerationScene })),
  ),
  LarmorRelativisticComparisonScene: lazyScene(() =>
    import("@/components/physics/larmor-relativistic-comparison-scene").then((m) => ({ default: m.LarmorRelativisticComparisonScene })),
  ),

  // EM §10 — electric-dipole-radiation
  DipoleFieldLinesScene: lazyScene(() =>
    import("@/components/physics/dipole-field-lines-scene").then((m) => ({ default: m.DipoleFieldLinesScene })),
  ),
  NearFarFieldTransitionScene: lazyScene(() =>
    import("@/components/physics/near-far-field-transition-scene").then((m) => ({ default: m.NearFarFieldTransitionScene })),
  ),
  DipolePolarPatternScene: lazyScene(() =>
    import("@/components/physics/dipole-polar-pattern-scene").then((m) => ({ default: m.DipolePolarPatternScene })),
  ),

  // EM §10 — antennas-and-radio
  Hertz1888ApparatusScene: lazyScene(() =>
    import("@/components/physics/hertz-1888-apparatus-scene").then((m) => ({ default: m.Hertz1888ApparatusScene })),
  ),
  HalfWaveDipolePatternScene: lazyScene(() =>
    import("@/components/physics/half-wave-dipole-pattern-scene").then((m) => ({ default: m.HalfWaveDipolePatternScene })),
  ),
  RadioPathLossScene: lazyScene(() =>
    import("@/components/physics/radio-path-loss-scene").then((m) => ({ default: m.RadioPathLossScene })),
  ),

  // EM §10 — synchrotron-radiation
  SynchrotronTangentConeScene: lazyScene(() =>
    import("@/components/physics/synchrotron-tangent-cone-scene").then((m) => ({ default: m.SynchrotronTangentConeScene })),
  ),
  SynchrotronSpectrumScene: lazyScene(() =>
    import("@/components/physics/synchrotron-spectrum-scene").then((m) => ({ default: m.SynchrotronSpectrumScene })),
  ),
  RelativisticBeamingScene: lazyScene(() =>
    import("@/components/physics/relativistic-beaming-scene").then((m) => ({ default: m.RelativisticBeamingScene })),
  ),

  // EM §10 — bremsstrahlung
  CoulombDeflectionScene: lazyScene(() =>
    import("@/components/physics/coulomb-deflection-scene").then((m) => ({ default: m.CoulombDeflectionScene })),
  ),
  ContinuousXraySpectrumScene: lazyScene(() =>
    import("@/components/physics/continuous-xray-spectrum-scene").then((m) => ({ default: m.ContinuousXraySpectrumScene })),
  ),
  ThickTargetShapeScene: lazyScene(() =>
    import("@/components/physics/thick-target-shape-scene").then((m) => ({ default: m.ThickTargetShapeScene })),
  ),

  // EM §10 — radiation-reaction
  AbrahamLorentzPhaseScene: lazyScene(() =>
    import("@/components/physics/abraham-lorentz-phase-scene").then((m) => ({ default: m.AbrahamLorentzPhaseScene })),
  ),
  RunawayVsReducedOrderScene: lazyScene(() =>
    import("@/components/physics/runaway-vs-reduced-order-scene").then((m) => ({ default: m.RunawayVsReducedOrderScene })),
  ),
  RadiationReactionTimescaleScene: lazyScene(() =>
    import("@/components/physics/radiation-reaction-timescale-scene").then((m) => ({ default: m.RadiationReactionTimescaleScene })),
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
