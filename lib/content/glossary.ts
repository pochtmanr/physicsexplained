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
  {
    slug: "wave-equation",
    category: "concept",
    relatedPhysicists: ["jean-d-alembert", "brook-taylor", "daniel-bernoulli", "leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "wavelength",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "frequency",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "phase-velocity",
    category: "concept",
    relatedPhysicists: ["william-rowan-hamilton", "john-william-strutt-rayleigh", "jean-d-alembert"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" },
    ],
  },
  {
    slug: "superposition-principle",
    category: "concept",
    relatedPhysicists: ["jean-d-alembert", "daniel-bernoulli"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "standing-wave",
    category: "concept",
    relatedPhysicists: ["joseph-fourier", "hermann-von-helmholtz"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "mode",
    category: "concept",
    relatedPhysicists: ["joseph-fourier", "leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "node",
    category: "concept",
    relatedPhysicists: ["ernst-chladni"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "antinode",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "harmonic-series",
    category: "concept",
    relatedPhysicists: ["pythagoras", "hermann-von-helmholtz"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "fourier-series",
    category: "concept",
    relatedPhysicists: ["joseph-fourier"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "doppler-effect",
    category: "phenomenon",
    relatedPhysicists: ["christian-doppler", "christophe-buys-ballot"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" },
    ],
  },
  {
    slug: "redshift",
    category: "phenomenon",
    relatedPhysicists: ["christian-doppler", "vesto-slipher"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" },
    ],
  },
  {
    slug: "blueshift",
    category: "phenomenon",
    relatedPhysicists: ["christian-doppler", "vesto-slipher"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" },
    ],
  },
  {
    slug: "sonic-boom",
    category: "phenomenon",
    relatedPhysicists: ["ernst-mach"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" },
    ],
  },
  {
    slug: "mach-number",
    category: "concept",
    relatedPhysicists: ["ernst-mach"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" },
    ],
  },
  {
    slug: "dispersion",
    category: "phenomenon",
    relatedPhysicists: ["isaac-newton", "john-william-strutt-rayleigh"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" },
    ],
  },
  {
    slug: "group-velocity",
    category: "concept",
    relatedPhysicists: ["william-rowan-hamilton", "john-william-strutt-rayleigh"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" },
    ],
  },
  {
    slug: "wave-packet",
    category: "concept",
    relatedPhysicists: ["william-rowan-hamilton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" },
    ],
  },
  {
    slug: "refractive-index",
    category: "concept",
    relatedPhysicists: ["rene-descartes", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" },
    ],
  },
  {
    slug: "rocket-equation",
    category: "concept",
    relatedPhysicists: ["konstantin-tsiolkovsky", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "cross-product",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "angular-momentum" },
    ],
  },
  {
    slug: "central-force",
    category: "concept",
    relatedPhysicists: ["isaac-newton", "johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "angular-momentum" },
    ],
  },
  {
    slug: "continuous-symmetry",
    category: "concept",
    visualization: "symmetry-triptych",
    relatedPhysicists: ["emmy-noether"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "rolling-without-slipping",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
      { branchSlug: "classical-mechanics", topicSlug: "moment-of-inertia" },
    ],
  },
  {
    slug: "perpendicular-axis-theorem",
    category: "concept",
    relatedPhysicists: ["leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "moment-of-inertia" },
    ],
  },
  {
    slug: "inertial-navigation",
    category: "concept",
    relatedPhysicists: ["leon-foucault", "johann-bohnenberger", "elmer-sperry"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
    ],
  },
  {
    slug: "precession-of-equinoxes",
    category: "phenomenon",
    visualization: "chandler-wobble",
    relatedPhysicists: ["hipparchus", "isaac-newton", "jean-d-alembert"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "obliquity",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "milankovitch-cycles",
    category: "phenomenon",
    relatedPhysicists: ["milutin-milankovic"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "pressure",
    category: "concept",
    relatedPhysicists: ["blaise-pascal", "simon-stevin"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" },
    ],
  },
  {
    slug: "pascal-unit",
    category: "unit",
    relatedPhysicists: ["blaise-pascal"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" },
    ],
  },
  {
    slug: "buoyancy",
    category: "concept",
    relatedPhysicists: ["archimedes"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" },
    ],
  },
  {
    slug: "hydrostatic",
    category: "concept",
    relatedPhysicists: ["simon-stevin", "blaise-pascal"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" },
    ],
  },
  {
    slug: "atmospheric-pressure",
    category: "concept",
    relatedPhysicists: ["evangelista-torricelli", "blaise-pascal"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" },
    ],
  },
  {
    slug: "bernoullis-principle",
    category: "concept",
    relatedPhysicists: ["daniel-bernoulli", "leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" },
    ],
  },
  {
    slug: "streamline",
    category: "concept",
    relatedPhysicists: ["leonhard-euler", "daniel-bernoulli"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" },
    ],
  },
  {
    slug: "incompressible-flow",
    category: "concept",
    relatedPhysicists: ["daniel-bernoulli", "leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" },
    ],
  },
  {
    slug: "venturi-effect",
    category: "phenomenon",
    relatedPhysicists: ["giovanni-venturi", "daniel-bernoulli"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" },
    ],
  },
  {
    slug: "viscosity",
    category: "concept",
    relatedPhysicists: ["isaac-newton", "jean-poiseuille", "george-gabriel-stokes"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
    ],
  },
  {
    slug: "reynolds-number",
    category: "concept",
    relatedPhysicists: ["osborne-reynolds"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
    ],
  },
  {
    slug: "laminar-flow",
    category: "concept",
    relatedPhysicists: ["jean-poiseuille", "osborne-reynolds"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
    ],
  },
  {
    slug: "poiseuille-flow",
    category: "phenomenon",
    relatedPhysicists: ["jean-poiseuille"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
    ],
  },
  {
    slug: "newtonian-fluid",
    category: "concept",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
    ],
  },
  {
    slug: "turbulence",
    category: "phenomenon",
    relatedPhysicists: ["claude-louis-navier", "george-gabriel-stokes", "lewis-fry-richardson", "andrey-kolmogorov"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
    ],
  },
  {
    slug: "navier-stokes-equations",
    category: "concept",
    relatedPhysicists: ["claude-louis-navier", "george-gabriel-stokes"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
    ],
  },
  {
    slug: "vortex",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
    ],
  },
  {
    slug: "energy-cascade",
    category: "phenomenon",
    relatedPhysicists: ["lewis-fry-richardson", "andrey-kolmogorov"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
    ],
  },
  {
    slug: "kolmogorov-spectrum",
    category: "phenomenon",
    relatedPhysicists: ["andrey-kolmogorov"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
    ],
  },
  {
    slug: "action",
    category: "concept",
    relatedPhysicists: ["pierre-louis-maupertuis", "leonhard-euler", "joseph-louis-lagrange"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" },
    ],
  },
  {
    slug: "principle-of-least-action",
    category: "concept",
    relatedPhysicists: ["pierre-louis-maupertuis", "leonhard-euler", "joseph-louis-lagrange", "pierre-de-fermat"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" },
    ],
  },
  {
    slug: "stationary-action",
    category: "concept",
    relatedPhysicists: ["leonhard-euler", "joseph-louis-lagrange"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" },
    ],
  },
  {
    slug: "fermats-principle",
    category: "concept",
    relatedPhysicists: ["pierre-de-fermat"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" },
    ],
  },
  {
    slug: "euler-lagrange-equations",
    category: "concept",
    relatedPhysicists: ["joseph-louis-lagrange", "leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-lagrangian" },
    ],
  },
  {
    slug: "generalised-coordinates",
    category: "concept",
    relatedPhysicists: ["joseph-louis-lagrange"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-lagrangian" },
    ],
  },
  {
    slug: "constraint",
    category: "concept",
    relatedPhysicists: ["joseph-louis-lagrange"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-lagrangian" },
    ],
  },
  {
    slug: "hamiltonian",
    category: "concept",
    relatedPhysicists: ["william-rowan-hamilton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
    ],
  },
  {
    slug: "conjugate-momentum",
    category: "concept",
    relatedPhysicists: ["william-rowan-hamilton", "joseph-louis-lagrange"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
    ],
  },
  {
    slug: "hamiltons-equations",
    category: "concept",
    relatedPhysicists: ["william-rowan-hamilton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
    ],
  },
  {
    slug: "poisson-bracket",
    category: "concept",
    relatedPhysicists: ["simeon-denis-poisson", "william-rowan-hamilton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
    ],
  },
  {
    slug: "liouvilles-theorem",
    category: "concept",
    relatedPhysicists: ["joseph-liouville", "william-rowan-hamilton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "symplectic",
    category: "concept",
    relatedPhysicists: ["william-rowan-hamilton", "joseph-liouville"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "phase-space",
    category: "concept",
    relatedPhysicists: ["william-rowan-hamilton", "joseph-liouville", "henri-poincare"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
    ],
  },
  {
    slug: "chaos",
    category: "phenomenon",
    relatedPhysicists: ["henri-poincare", "aleksandr-lyapunov"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "lyapunov-exponent",
    category: "concept",
    relatedPhysicists: ["aleksandr-lyapunov"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "kam-theorem",
    category: "concept",
    relatedPhysicists: ["andrey-kolmogorov", "vladimir-arnold", "jurgen-moser"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "poincare-recurrence",
    category: "phenomenon",
    relatedPhysicists: ["henri-poincare", "joseph-liouville"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "angular-velocity",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "circular-motion" },
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "centrifugal-force",
    category: "concept",
    relatedPhysicists: ["christiaan-huygens"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
  {
    slug: "coriolis-force",
    category: "concept",
    relatedPhysicists: ["gaspard-gustave-de-coriolis"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
  {
    slug: "forced-oscillation",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "damped-and-driven-oscillations" },
    ],
  },
  {
    slug: "amplitude-response",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "damped-and-driven-oscillations" },
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
