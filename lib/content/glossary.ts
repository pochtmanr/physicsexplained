import type { GlossaryCategory, GlossaryTerm } from "./types";
import { storageUrl } from "../supabase";

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    slug: "pendulum-clock",
    category: "instrument",
    illustration: "/images/dictionary/pendulum-clock.avif",
    relatedPhysicists: ["christiaan-huygens", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "telescope",
    category: "instrument",
    images: [
      { src: storageUrl("dictionary/newton-telescope.avif") },
      { src: storageUrl("dictionary/home-telescope.avif") },
      { src: storageUrl("dictionary/jwst.avif") },
    ],
    relatedPhysicists: ["galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "quadrant",
    category: "instrument",
    illustration: "/images/dictionary/quadrant.svg",
    relatedPhysicists: ["tycho-brahe", "johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "astrolabe",
    category: "instrument",
    illustration: "/images/dictionary/astrolabe.svg",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "isochronism",
    category: "concept",
    visualization: "isochronism",
    relatedPhysicists: ["galileo-galilei", "christiaan-huygens"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "restoring-force",
    category: "concept",
    visualization: "restoring-force",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "phase-portrait",
    category: "concept",
    visualization: "phase-portrait",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "simple-harmonic-oscillator",
    category: "concept",
    visualization: "shm-oscillator",
    relatedPhysicists: ["galileo-galilei", "christiaan-huygens", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "epicycle",
    category: "concept",
    visualization: "epicycle",
    relatedPhysicists: ["claudius-ptolemy", "nicolaus-copernicus", "johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "ellipse",
    category: "concept",
    visualization: "ellipse-construction",
    relatedPhysicists: ["johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "focus",
    category: "concept",
    visualization: "ellipse-construction",
    relatedPhysicists: ["johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "eccentricity",
    category: "concept",
    visualization: "eccentricity-slider",
    relatedPhysicists: ["johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "semi-major-axis",
    category: "concept",
    visualization: "ellipse-construction",
    relatedPhysicists: ["johannes-kepler", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "inverse-square-law",
    category: "concept",
    visualization: "inverse-square",
    relatedPhysicists: ["isaac-newton", "johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "tautochrone",
    category: "concept",
    visualization: "cycloid",
    relatedPhysicists: ["christiaan-huygens"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "cycloid",
    category: "concept",
    visualization: "cycloid",
    relatedPhysicists: ["christiaan-huygens"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "elliptic-integral",
    category: "concept",
    visualization: "elliptic-integral",
    relatedPhysicists: ["adrien-marie-legendre"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "separatrix",
    category: "concept",
    visualization: "separatrix",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "libration",
    category: "concept",
    visualization: "separatrix",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "nonlinear-dynamics",
    category: "concept",
    visualization: "nonlinear-dynamics",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "potential-well",
    category: "concept",
    visualization: "energy-diagram",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "damping",
    category: "concept",
    visualization: "damped-pendulum",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "q-factor",
    category: "concept",
    visualization: "damped-pendulum",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "resonance",
    category: "phenomenon",
    visualization: "resonance-curve",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "normal-modes",
    category: "concept",
    visualization: "coupled-pendulum",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "beats",
    category: "phenomenon",
    visualization: "beats",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "shell-theorem",
    category: "concept",
    visualization: "shell-theorem",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "universal-gravitation" },
    ],
  },
  {
    slug: "gravitational-field",
    category: "concept",
    visualization: "gravity-field",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "universal-gravitation" },
    ],
  },
  {
    slug: "vis-viva",
    category: "concept",
    visualization: "vis-viva",
    relatedPhysicists: ["isaac-newton", "johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-in-orbit" },
    ],
  },
  {
    slug: "escape-velocity",
    category: "concept",
    visualization: "grav-potential",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-in-orbit" },
    ],
  },
  {
    slug: "hohmann-transfer",
    category: "concept",
    visualization: "hohmann",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-in-orbit" },
    ],
  },
  {
    slug: "tidal-force",
    category: "phenomenon",
    visualization: "tidal-force",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "roche-limit",
    category: "concept",
    visualization: "roche-limit",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "lagrange-points",
    category: "concept",
    visualization: "lagrange-points",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "gravity-assist",
    category: "concept",
    visualization: "gravity-assist",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-in-orbit" },
    ],
  },
  {
    slug: "velocity",
    category: "concept",
    relatedPhysicists: ["galileo-galilei", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" },
    ],
  },
  {
    slug: "acceleration",
    category: "concept",
    relatedPhysicists: ["galileo-galilei", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" },
    ],
  },
  {
    slug: "free-fall",
    category: "phenomenon",
    relatedPhysicists: ["galileo-galilei", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" },
    ],
  },
  {
    slug: "kinematic-equations",
    category: "concept",
    relatedPhysicists: ["galileo-galilei", "nicole-oresme"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" },
    ],
  },
  {
    slug: "derivative",
    category: "concept",
    relatedPhysicists: ["isaac-newton", "nicole-oresme"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" },
    ],
  },
  {
    slug: "inertia",
    category: "concept",
    visualization: "first-law",
    relatedPhysicists: ["isaac-newton", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
    ],
  },
  {
    slug: "mass",
    category: "concept",
    visualization: "f-ma",
    relatedPhysicists: ["isaac-newton", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
    ],
  },
  {
    slug: "force",
    category: "concept",
    visualization: "f-ma",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
    ],
  },
  {
    slug: "newtons-laws-of-motion",
    category: "concept",
    visualization: "action-reaction",
    relatedPhysicists: ["isaac-newton", "galileo-galilei", "robert-hooke"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
    ],
  },
  {
    slug: "inertial-frame",
    category: "concept",
    visualization: "first-law",
    relatedPhysicists: ["isaac-newton", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
    ],
  },
  {
    slug: "vector",
    category: "concept",
    visualization: "vector-addition",
    relatedPhysicists: ["isaac-newton", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "projectile-motion",
    category: "phenomenon",
    visualization: "projectile",
    relatedPhysicists: ["galileo-galilei", "evangelista-torricelli", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "parabola",
    category: "concept",
    visualization: "projectile",
    relatedPhysicists: ["galileo-galilei", "evangelista-torricelli"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "range",
    category: "concept",
    visualization: "projectile",
    relatedPhysicists: ["galileo-galilei", "evangelista-torricelli"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "monkey-and-hunter",
    category: "phenomenon",
    visualization: "monkey-hunter",
    relatedPhysicists: ["galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "friction",
    category: "concept",
    visualization: "friction-ramp",
    relatedPhysicists: ["guillaume-amontons", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "static-friction",
    category: "concept",
    visualization: "friction-ramp",
    relatedPhysicists: ["guillaume-amontons"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "kinetic-friction",
    category: "concept",
    visualization: "friction-ramp",
    relatedPhysicists: ["guillaume-amontons"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "drag",
    category: "concept",
    visualization: "drag-regimes",
    relatedPhysicists: ["george-gabriel-stokes", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "terminal-velocity",
    category: "concept",
    visualization: "terminal-velocity",
    relatedPhysicists: ["george-gabriel-stokes"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "stokes-law",
    category: "concept",
    visualization: "drag-regimes",
    relatedPhysicists: ["george-gabriel-stokes"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "work",
    category: "concept",
    visualization: "work",
    relatedPhysicists: ["gottfried-wilhelm-leibniz", "thomas-young"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "kinetic-energy",
    category: "concept",
    visualization: "energy-bowl",
    relatedPhysicists: ["emilie-du-chatelet", "thomas-young"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "potential-energy",
    category: "concept",
    visualization: "energy-bowl",
    relatedPhysicists: ["gottfried-wilhelm-leibniz", "joseph-louis-lagrange"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "conservation-of-energy",
    category: "concept",
    visualization: "energy-bowl",
    relatedPhysicists: ["james-prescott-joule", "emilie-du-chatelet", "emmy-noether"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "power",
    category: "concept",
    visualization: "power",
    relatedPhysicists: ["james-watt"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "momentum",
    category: "concept",
    visualization: "collision",
    relatedPhysicists: ["rene-descartes", "christiaan-huygens", "john-wallis", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "impulse",
    category: "concept",
    visualization: "collision",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "center-of-mass",
    category: "concept",
    visualization: "center-of-mass",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "elastic-collision",
    category: "concept",
    visualization: "collision",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "inelastic-collision",
    category: "concept",
    visualization: "collision",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "coefficient-of-restitution",
    category: "concept",
    visualization: "collision",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "angular-momentum",
    category: "concept",
    visualization: "skater-spin",
    relatedPhysicists: ["johannes-kepler", "leonhard-euler", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "angular-momentum" },
    ],
  },
  {
    slug: "moment-of-inertia",
    category: "concept",
    visualization: "skater-spin",
    relatedPhysicists: ["leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "angular-momentum" },
      { branchSlug: "classical-mechanics", topicSlug: "moment-of-inertia" },
    ],
  },
  {
    slug: "torque",
    category: "concept",
    visualization: "torque-lever",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "angular-momentum" },
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "centripetal-force",
    category: "concept",
    visualization: "skater-spin",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "angular-momentum" },
    ],
  },
  {
    slug: "precession",
    category: "phenomenon",
    visualization: "gyroscope",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "angular-momentum" },
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
    ],
  },
  {
    slug: "symmetry",
    category: "concept",
    visualization: "symmetry-triptych",
    relatedPhysicists: ["emmy-noether", "felix-klein"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "noethers-theorem",
    category: "concept",
    visualization: "symmetry-triptych",
    relatedPhysicists: ["emmy-noether", "david-hilbert", "albert-einstein"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "lagrangian",
    category: "concept",
    visualization: "lagrangian",
    relatedPhysicists: ["joseph-louis-lagrange", "emmy-noether"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "invariance",
    category: "concept",
    visualization: "symmetry-triptych",
    relatedPhysicists: ["emmy-noether"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "moment-arm",
    category: "concept",
    visualization: "torque-lever",
    relatedPhysicists: ["archimedes"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "lever",
    category: "instrument",
    visualization: "torque-lever",
    relatedPhysicists: ["archimedes"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "static-equilibrium",
    category: "concept",
    visualization: "torque-lever",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "angular-acceleration",
    category: "concept",
    visualization: "angular-acceleration",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "parallel-axis-theorem",
    category: "concept",
    visualization: "parallel-axis-theorem",
    relatedPhysicists: ["jacob-steiner"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "moment-of-inertia" },
    ],
  },
  {
    slug: "radius-of-gyration",
    category: "concept",
    visualization: "radius-of-gyration",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "moment-of-inertia" },
    ],
  },
  {
    slug: "principal-axes",
    category: "concept",
    visualization: "principal-axes",
    relatedPhysicists: ["leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "moment-of-inertia" },
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
    ],
  },
  {
    slug: "gyroscope",
    category: "instrument",
    visualization: "gyroscope",
    relatedPhysicists: ["leon-foucault", "elmer-sperry"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
    ],
  },
  {
    slug: "nutation",
    category: "phenomenon",
    visualization: "gyroscope",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "euler-angles",
    category: "concept",
    visualization: "euler-angles",
    relatedPhysicists: ["leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
    ],
  },
  {
    slug: "axial-precession",
    category: "phenomenon",
    visualization: "chandler-wobble",
    relatedPhysicists: ["hipparchus", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "chandler-wobble",
    category: "phenomenon",
    visualization: "chandler-wobble",
    relatedPhysicists: ["seth-carlo-chandler", "leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "equatorial-bulge",
    category: "phenomenon",
    visualization: "equatorial-bulge",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
];

export function getTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug);
}

export function getAllTerms(): readonly GlossaryTerm[] {
  return GLOSSARY;
}

export function getTermsByCategory(
  category: GlossaryCategory,
): readonly GlossaryTerm[] {
  return GLOSSARY.filter((t) => t.category === category);
}
