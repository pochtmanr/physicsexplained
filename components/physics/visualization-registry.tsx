"use client";

import dynamic from "next/dynamic";

const EllipseConstruction = dynamic(
  () =>
    import("@/components/physics/ellipse-construction").then((m) => ({
      default: m.EllipseConstruction,
    })),
  { ssr: false },
);

const PhasePortrait = dynamic(
  () =>
    import("@/components/physics/phase-portrait").then((m) => ({
      default: m.PhasePortrait,
    })),
  { ssr: false },
);

const RestoringForceScene = dynamic(
  () =>
    import("@/components/physics/restoring-force-scene").then((m) => ({
      default: m.RestoringForceScene,
    })),
  { ssr: false },
);

const ShmOscillatorScene = dynamic(
  () =>
    import("@/components/physics/shm-oscillator-scene").then((m) => ({
      default: m.ShmOscillatorScene,
    })),
  { ssr: false },
);

const IsochronismScene = dynamic(
  () =>
    import("@/components/physics/isochronism-scene").then((m) => ({
      default: m.IsochronismScene,
    })),
  { ssr: false },
);

const InverseSquareViz = dynamic(
  () =>
    import("@/components/physics/inverse-square-viz").then((m) => ({
      default: m.InverseSquareViz,
    })),
  { ssr: false },
);

const EccentricitySlider = dynamic(
  () =>
    import("@/components/physics/eccentricity-slider").then((m) => ({
      default: m.EccentricitySlider,
    })),
  { ssr: false },
);

const EpicycleScene = dynamic(
  () =>
    import("@/components/physics/epicycle-scene").then((m) => ({
      default: m.EpicycleScene,
    })),
  { ssr: false },
);

const SmallAngleScene = dynamic(
  () =>
    import("@/components/physics/small-angle-scene").then((m) => ({
      default: m.SmallAngleScene,
    })),
  { ssr: false },
);

const CycloidScene = dynamic(
  () =>
    import("@/components/physics/cycloid-scene").then((m) => ({
      default: m.CycloidScene,
    })),
  { ssr: false },
);

const SeparatrixScene = dynamic(
  () =>
    import("@/components/physics/separatrix-scene").then((m) => ({
      default: m.SeparatrixScene,
    })),
  { ssr: false },
);

const EnergyDiagramScene = dynamic(
  () =>
    import("@/components/physics/energy-diagram-scene").then((m) => ({
      default: m.EnergyDiagramScene,
    })),
  { ssr: false },
);

const ResonanceCurveScene = dynamic(
  () =>
    import("@/components/physics/resonance-curve-scene").then((m) => ({
      default: m.ResonanceCurveScene,
    })),
  { ssr: false },
);

const CoupledPendulumScene = dynamic(
  () =>
    import("@/components/physics/coupled-pendulum-scene").then((m) => ({
      default: m.CoupledPendulumScene,
    })),
  { ssr: false },
);

const BeatsScene = dynamic(
  () =>
    import("@/components/physics/beats-scene").then((m) => ({
      default: m.BeatsScene,
    })),
  { ssr: false },
);

const DampedPendulumScene = dynamic(
  () =>
    import("@/components/physics/damped-pendulum-scene").then((m) => ({
      default: m.DampedPendulumScene,
    })),
  { ssr: false },
);

const ShellTheoremScene = dynamic(
  () =>
    import("@/components/physics/shell-theorem-scene").then((m) => ({
      default: m.ShellTheoremScene,
    })),
  { ssr: false },
);

const GravityFieldScene = dynamic(
  () =>
    import("@/components/physics/gravity-field-scene").then((m) => ({
      default: m.GravityFieldScene,
    })),
  { ssr: false },
);

const CavendishScene = dynamic(
  () =>
    import("@/components/physics/cavendish-scene").then((m) => ({
      default: m.CavendishScene,
    })),
  { ssr: false },
);

const GravPotentialScene = dynamic(
  () =>
    import("@/components/physics/grav-potential-scene").then((m) => ({
      default: m.GravPotentialScene,
    })),
  { ssr: false },
);

const VisVivaScene = dynamic(
  () =>
    import("@/components/physics/vis-viva-scene").then((m) => ({
      default: m.VisVivaScene,
    })),
  { ssr: false },
);

const OrbitEnergyScene = dynamic(
  () =>
    import("@/components/physics/orbit-energy-scene").then((m) => ({
      default: m.OrbitEnergyScene,
    })),
  { ssr: false },
);

const HohmannScene = dynamic(
  () =>
    import("@/components/physics/hohmann-scene").then((m) => ({
      default: m.HohmannScene,
    })),
  { ssr: false },
);

const TidalForceScene = dynamic(
  () =>
    import("@/components/physics/tidal-force-scene").then((m) => ({
      default: m.TidalForceScene,
    })),
  { ssr: false },
);

const RocheLimitScene = dynamic(
  () =>
    import("@/components/physics/roche-limit-scene").then((m) => ({
      default: m.RocheLimitScene,
    })),
  { ssr: false },
);

const LagrangePointsScene = dynamic(
  () =>
    import("@/components/physics/lagrange-points-scene").then((m) => ({
      default: m.LagrangePointsScene,
    })),
  { ssr: false },
);

const InclinedPlaneScene = dynamic(
  () =>
    import("@/components/physics/inclined-plane-scene").then((m) => ({
      default: m.InclinedPlaneScene,
    })),
  { ssr: false },
);

const TangentZoomScene = dynamic(
  () =>
    import("@/components/physics/tangent-zoom-scene").then((m) => ({
      default: m.TangentZoomScene,
    })),
  { ssr: false },
);

const FreeFallScene = dynamic(
  () =>
    import("@/components/physics/free-fall-scene").then((m) => ({
      default: m.FreeFallScene,
    })),
  { ssr: false },
);

const KinematicsGraphScene = dynamic(
  () =>
    import("@/components/physics/kinematics-graph-scene").then((m) => ({
      default: m.KinematicsGraphScene,
    })),
  { ssr: false },
);

const FirstLawScene = dynamic(
  () =>
    import("@/components/physics/first-law-scene").then((m) => ({
      default: m.FirstLawScene,
    })),
  { ssr: false },
);

const FMaScene = dynamic(
  () =>
    import("@/components/physics/f-ma-scene").then((m) => ({
      default: m.FMaScene,
    })),
  { ssr: false },
);

const ActionReactionScene = dynamic(
  () =>
    import("@/components/physics/action-reaction-scene").then((m) => ({
      default: m.ActionReactionScene,
    })),
  { ssr: false },
);

const ProjectileScene = dynamic(
  () =>
    import("@/components/physics/projectile-scene").then((m) => ({
      default: m.ProjectileScene,
    })),
  { ssr: false },
);

const VectorAdditionScene = dynamic(
  () =>
    import("@/components/physics/vector-addition-scene").then((m) => ({
      default: m.VectorAdditionScene,
    })),
  { ssr: false },
);

const MonkeyHunterScene = dynamic(
  () =>
    import("@/components/physics/monkey-hunter-scene").then((m) => ({
      default: m.MonkeyHunterScene,
    })),
  { ssr: false },
);

const FrictionRampScene = dynamic(
  () =>
    import("@/components/physics/friction-ramp-scene").then((m) => ({
      default: m.FrictionRampScene,
    })),
  { ssr: false },
);

const TerminalVelocityScene = dynamic(
  () =>
    import("@/components/physics/terminal-velocity-scene").then((m) => ({
      default: m.TerminalVelocityScene,
    })),
  { ssr: false },
);

const DragRegimesScene = dynamic(
  () =>
    import("@/components/physics/drag-regimes-scene").then((m) => ({
      default: m.DragRegimesScene,
    })),
  { ssr: false },
);

const GyroscopeScene = dynamic(
  () =>
    import("@/components/physics/gyroscope-scene").then((m) => ({
      default: m.GyroscopeScene,
    })),
  { ssr: false },
);

const ChandlerWobbleScene = dynamic(
  () =>
    import("@/components/physics/chandler-wobble-scene").then((m) => ({
      default: m.ChandlerWobbleScene,
    })),
  { ssr: false },
);

const CollisionScene = dynamic(
  () =>
    import("@/components/physics/collision-scene").then((m) => ({
      default: m.CollisionScene,
    })),
  { ssr: false },
);

const TorqueLeverScene = dynamic(
  () =>
    import("@/components/physics/torque-lever-scene").then((m) => ({
      default: m.TorqueLeverScene,
    })),
  { ssr: false },
);

const SkaterSpinScene = dynamic(
  () =>
    import("@/components/physics/skater-spin-scene").then((m) => ({
      default: m.SkaterSpinScene,
    })),
  { ssr: false },
);

const SymmetryTriptychScene = dynamic(
  () =>
    import("@/components/physics/symmetry-triptych-scene").then((m) => ({
      default: m.SymmetryTriptychScene,
    })),
  { ssr: false },
);

const EnergyBowlScene = dynamic(
  () =>
    import("@/components/physics/energy-bowl-scene").then((m) => ({
      default: m.EnergyBowlScene,
    })),
  { ssr: false },
);

const WorkScene = dynamic(
  () =>
    import("@/components/physics/work-scene").then((m) => ({
      default: m.WorkScene,
    })),
  { ssr: false },
);

const PowerScene = dynamic(
  () =>
    import("@/components/physics/power-scene").then((m) => ({
      default: m.PowerScene,
    })),
  { ssr: false },
);

const CenterOfMassScene = dynamic(
  () =>
    import("@/components/physics/center-of-mass-scene").then((m) => ({
      default: m.CenterOfMassScene,
    })),
  { ssr: false },
);

const AngularAccelerationScene = dynamic(
  () =>
    import("@/components/physics/angular-acceleration-scene").then((m) => ({
      default: m.AngularAccelerationScene,
    })),
  { ssr: false },
);

const GravityAssistScene = dynamic(
  () =>
    import("@/components/physics/gravity-assist-scene").then((m) => ({
      default: m.GravityAssistScene,
    })),
  { ssr: false },
);

const ParallelAxisTheoremScene = dynamic(
  () =>
    import("@/components/physics/parallel-axis-theorem-scene").then((m) => ({
      default: m.ParallelAxisTheoremScene,
    })),
  { ssr: false },
);

const RadiusOfGyrationScene = dynamic(
  () =>
    import("@/components/physics/radius-of-gyration-scene").then((m) => ({
      default: m.RadiusOfGyrationScene,
    })),
  { ssr: false },
);

const PrincipalAxesScene = dynamic(
  () =>
    import("@/components/physics/principal-axes-scene").then((m) => ({
      default: m.PrincipalAxesScene,
    })),
  { ssr: false },
);

const EulerAnglesScene = dynamic(
  () =>
    import("@/components/physics/euler-angles-scene").then((m) => ({
      default: m.EulerAnglesScene,
    })),
  { ssr: false },
);

const EquatorialBulgeScene = dynamic(
  () =>
    import("@/components/physics/equatorial-bulge-scene").then((m) => ({
      default: m.EquatorialBulgeScene,
    })),
  { ssr: false },
);

const LagrangianScene = dynamic(
  () =>
    import("@/components/physics/lagrangian-scene").then((m) => ({
      default: m.LagrangianScene,
    })),
  { ssr: false },
);

const EllipticIntegralScene = dynamic(
  () =>
    import("@/components/physics/elliptic-integral-scene").then((m) => ({
      default: m.EllipticIntegralScene,
    })),
  { ssr: false },
);

const NonlinearDynamicsScene = dynamic(
  () =>
    import("@/components/physics/nonlinear-dynamics-scene").then((m) => ({
      default: m.NonlinearDynamicsScene,
    })),
  { ssr: false },
);

const WheelDecompositionScene = dynamic(
  () =>
    import("@/components/physics/wheel-decomposition-scene").then((m) => ({
      default: m.WheelDecompositionScene,
    })),
  { ssr: false },
);

const RollingRaceScene = dynamic(
  () =>
    import("@/components/physics/rolling-race-scene").then((m) => ({
      default: m.RollingRaceScene,
    })),
  { ssr: false },
);

const RollingSlippingScene = dynamic(
  () =>
    import("@/components/physics/rolling-slipping-scene").then((m) => ({
      default: m.RollingSlippingScene,
    })),
  { ssr: false },
);

const CoinRollingScene = dynamic(
  () =>
    import("@/components/physics/coin-rolling-scene").then((m) => ({
      default: m.CoinRollingScene,
    })),
  { ssr: false },
);

const VelocityTriangleScene = dynamic(
  () =>
    import("@/components/physics/velocity-triangle-scene").then((m) => ({
      default: m.VelocityTriangleScene,
    })),
  { ssr: false },
);

const CentripetalForceScene = dynamic(
  () =>
    import("@/components/physics/centripetal-force-scene").then((m) => ({
      default: m.CentripetalForceScene,
    })),
  { ssr: false },
);

const AngularVelocityScene = dynamic(
  () =>
    import("@/components/physics/angular-velocity-scene").then((m) => ({
      default: m.AngularVelocityScene,
    })),
  { ssr: false },
);

const NewtonsCannonScene = dynamic(
  () =>
    import("@/components/physics/newtons-cannon-scene").then((m) => ({
      default: m.NewtonsCannonScene,
    })),
  { ssr: false },
);

const CarouselScene = dynamic(
  () =>
    import("@/components/physics/carousel-scene").then((m) => ({
      default: m.CarouselScene,
    })),
  { ssr: false },
);

const CoriolisTurntableScene = dynamic(
  () =>
    import("@/components/physics/coriolis-turntable-scene").then((m) => ({
      default: m.CoriolisTurntableScene,
    })),
  { ssr: false },
);

const CoriolisGlobeScene = dynamic(
  () =>
    import("@/components/physics/coriolis-globe-scene").then((m) => ({
      default: m.CoriolisGlobeScene,
    })),
  { ssr: false },
);

const RotatingProjectileScene = dynamic(
  () =>
    import("@/components/physics/rotating-projectile-scene").then((m) => ({
      default: m.RotatingProjectileScene,
    })),
  { ssr: false },
);

const VISUALIZATIONS: Record<string, React.ComponentType> = {
  "ellipse-construction": EllipseConstruction,
  "phase-portrait": () => <PhasePortrait theta0={0.5} length={1.5} />,
  "restoring-force": RestoringForceScene,
  "shm-oscillator": ShmOscillatorScene,
  "isochronism": IsochronismScene,
  "inverse-square": InverseSquareViz,
  "eccentricity-slider": EccentricitySlider,
  "epicycle": EpicycleScene,
  "small-angle": SmallAngleScene,
  "cycloid": CycloidScene,
  "separatrix": SeparatrixScene,
  "energy-diagram": () => <EnergyDiagramScene />,
  "resonance-curve": () => <ResonanceCurveScene />,
  "coupled-pendulum": () => <CoupledPendulumScene />,
  "damped-pendulum": () => <DampedPendulumScene />,
  "beats": () => <BeatsScene />,
  "shell-theorem": () => <ShellTheoremScene />,
  "gravity-field": () => <GravityFieldScene />,
  "cavendish": () => <CavendishScene />,
  "grav-potential": () => <GravPotentialScene />,
  "vis-viva": () => <VisVivaScene />,
  "orbit-energy": () => <OrbitEnergyScene />,
  "hohmann": () => <HohmannScene />,
  "tidal-force": () => <TidalForceScene />,
  "roche-limit": () => <RocheLimitScene />,
  "lagrange-points": () => <LagrangePointsScene />,
  "inclined-plane": InclinedPlaneScene,
  "tangent-zoom": TangentZoomScene,
  "free-fall": FreeFallScene,
  "kinematics-graph": KinematicsGraphScene,
  "first-law": FirstLawScene,
  "f-ma": FMaScene,
  "action-reaction": ActionReactionScene,
  "projectile": ProjectileScene,
  "vector-addition": VectorAdditionScene,
  "monkey-hunter": MonkeyHunterScene,
  "friction-ramp": FrictionRampScene,
  "terminal-velocity": TerminalVelocityScene,
  "drag-regimes": DragRegimesScene,
  "gyroscope": GyroscopeScene,
  "chandler-wobble": ChandlerWobbleScene,
  "collision": CollisionScene,
  "torque-lever": TorqueLeverScene,
  "skater-spin": SkaterSpinScene,
  "symmetry-triptych": SymmetryTriptychScene,
  "energy-bowl": EnergyBowlScene,
  "work": WorkScene,
  "power": PowerScene,
  "center-of-mass": CenterOfMassScene,
  "angular-acceleration": AngularAccelerationScene,
  "gravity-assist": GravityAssistScene,
  "parallel-axis-theorem": ParallelAxisTheoremScene,
  "radius-of-gyration": RadiusOfGyrationScene,
  "principal-axes": PrincipalAxesScene,
  "euler-angles": EulerAnglesScene,
  "equatorial-bulge": EquatorialBulgeScene,
  "lagrangian": LagrangianScene,
  "elliptic-integral": EllipticIntegralScene,
  "nonlinear-dynamics": NonlinearDynamicsScene,
  "velocity-triangle": VelocityTriangleScene,
  "centripetal-force": CentripetalForceScene,
  "angular-velocity": AngularVelocityScene,
  "newtons-cannon": NewtonsCannonScene,
  "carousel": CarouselScene,
  "coriolis-turntable": CoriolisTurntableScene,
  "coriolis-globe": CoriolisGlobeScene,
  "rotating-projectile": RotatingProjectileScene,
  "wheel-decomposition": WheelDecompositionScene,
  "rolling-race": RollingRaceScene,
  "rolling-slipping": RollingSlippingScene,
  "coin-rolling": CoinRollingScene,
};

export function Visualization({ vizKey }: { vizKey: string }) {
  const Viz = VISUALIZATIONS[vizKey];
  if (!Viz) return null;
  return <Viz />;
}
