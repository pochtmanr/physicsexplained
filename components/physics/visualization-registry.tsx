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
};

export function Visualization({ vizKey }: { vizKey: string }) {
  const Viz = VISUALIZATIONS[vizKey];
  if (!Viz) return null;
  return <Viz />;
}
