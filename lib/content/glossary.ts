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
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
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
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
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
  {
    slug: "electric-charge",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "coulombs-law" },
    ],
  },
  {
    slug: "coulomb-unit",
    category: "unit",
    relatedPhysicists: ["charles-augustin-de-coulomb"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "coulombs-law" },
    ],
  },
  {
    slug: "electric-field",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electric-field" },
    ],
  },
  {
    slug: "field-line",
    category: "concept",
    relatedPhysicists: ["michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electric-field" },
    ],
  },
  {
    slug: "flux",
    category: "concept",
    relatedPhysicists: ["carl-friedrich-gauss", "michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauss-law" },
    ],
  },
  {
    slug: "gaussian-surface",
    category: "concept",
    relatedPhysicists: ["carl-friedrich-gauss"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauss-law" },
    ],
  },
  {
    slug: "divergence",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauss-law" },
    ],
  },
  {
    slug: "gradient",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "line-integral",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "electric-potential-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "volt",
    category: "unit",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "equipotential",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "capacitance-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "capacitance-and-field-energy" },
    ],
  },
  {
    slug: "farad",
    category: "unit",
    relatedPhysicists: ["michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "capacitance-and-field-energy" },
    ],
  },
  {
    slug: "field-energy-density",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "capacitance-and-field-energy" },
    ],
  },
  {
    slug: "faraday-cage",
    category: "instrument",
    relatedPhysicists: ["michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "conductors-and-shielding" },
    ],
  },
  {
    slug: "induced-charge",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "conductors-and-shielding" },
    ],
  },
  {
    slug: "image-charge",
    category: "concept",
    relatedPhysicists: ["simeon-denis-poisson"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "method-of-images" },
    ],
  },
  {
    slug: "polarization",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-and-bound-charges" },
    ],
  },
  {
    slug: "polarization-density",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-and-bound-charges" },
    ],
  },
  {
    slug: "bound-charge",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-and-bound-charges" },
    ],
  },
  {
    slug: "electric-susceptibility",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "dielectric-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "permittivity",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "dielectric-constant",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "displacement-field",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "boundary-conditions-em",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "boundary-conditions-at-interfaces" },
    ],
  },
  {
    slug: "piezoelectricity",
    category: "phenomenon",
    relatedPhysicists: ["pierre-curie"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "piezo-and-ferroelectricity" },
    ],
  },
  {
    slug: "ferroelectricity",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "piezo-and-ferroelectricity" },
    ],
  },
  {
    slug: "lorentz-force",
    category: "concept",
    relatedPhysicists: ["hendrik-antoon-lorentz"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
    ],
  },
  {
    slug: "magnetic-field",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "tesla-unit",
    category: "unit",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
    ],
  },
  {
    slug: "current-density",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
    ],
  },
  {
    slug: "biot-savart-law-term",
    category: "concept",
    relatedPhysicists: ["jean-baptiste-biot", "felix-savart"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "ampere-unit",
    category: "unit",
    relatedPhysicists: ["andre-marie-ampere"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
    ],
  },
  {
    slug: "amperes-law-term",
    category: "concept",
    relatedPhysicists: ["andre-marie-ampere"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
    ],
  },
  {
    slug: "solenoid",
    category: "instrument",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
    ],
  },
  {
    slug: "toroid",
    category: "instrument",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
    ],
  },
  {
    slug: "vector-potential",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-vector-potential" },
    ],
  },
  {
    slug: "gauge-transformation",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-vector-potential" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  {
    slug: "magnetic-dipole-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-dipoles" },
    ],
  },
  {
    slug: "magnetic-moment",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-dipoles" },
    ],
  },
  {
    slug: "weber-unit",
    category: "unit",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-dipoles" },
    ],
  },
  {
    slug: "curl",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
      { branchSlug: "electromagnetism", topicSlug: "the-vector-potential" },
    ],
  },
  {
    slug: "magnetization",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "h-field",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
    ],
  },
  {
    slug: "magnetic-susceptibility",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
    ],
  },
  {
    slug: "magnetic-permeability",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
    ],
  },
  {
    slug: "diamagnetism",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "paramagnetism",
    category: "phenomenon",
    relatedPhysicists: ["pierre-curie"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
    ],
  },
  {
    slug: "ferromagnetism",
    category: "phenomenon",
    relatedPhysicists: ["pierre-curie", "pierre-weiss"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "magnetic-domain",
    category: "concept",
    relatedPhysicists: ["pierre-weiss"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "hysteresis-loop",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
      { branchSlug: "electromagnetism", topicSlug: "piezo-and-ferroelectricity" },
    ],
  },
  {
    slug: "curie-temperature",
    category: "concept",
    relatedPhysicists: ["pierre-curie"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "meissner-effect",
    category: "phenomenon",
    relatedPhysicists: ["walther-meissner"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "critical-temperature",
    category: "concept",
    relatedPhysicists: ["heike-kamerlingh-onnes"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "electromagnetic-induction",
    category: "phenomenon",
    relatedPhysicists: ["michael-faraday", "joseph-henry"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
    ],
  },
  {
    slug: "faradays-law-term",
    category: "concept",
    relatedPhysicists: ["michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
    ],
  },
  {
    slug: "lenzs-law-term",
    category: "concept",
    relatedPhysicists: ["heinrich-lenz"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
  {
    slug: "emf",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
  {
    slug: "motional-emf",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
  {
    slug: "self-inductance",
    category: "concept",
    relatedPhysicists: ["joseph-henry"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "mutual-inductance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "henry-unit",
    category: "unit",
    relatedPhysicists: ["joseph-henry"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "back-emf",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "eddy-current",
    category: "phenomenon",
    relatedPhysicists: ["leon-foucault"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "eddy-currents" },
    ],
  },
  {
    slug: "magnetic-energy-density",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "energy-in-magnetic-fields" },
    ],
  },
  {
    slug: "flux-linkage",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "ohms-law-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "resistance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "resistor",
    category: "instrument",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "kirchhoff-voltage-law",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "kirchhoff-current-law",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "voltage-divider",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "rc-time-constant",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "capacitor-charging",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "rl-time-constant",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rl-circuits" },
    ],
  },
  {
    slug: "quality-factor",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rlc-circuits-and-resonance" },
    ],
  },
  {
    slug: "phasor",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
    ],
  },
  {
    slug: "impedance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "reactance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
    ],
  },
  {
    slug: "ac-frequency",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
    ],
  },
  {
    slug: "transformer",
    category: "instrument",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transformers" },
    ],
  },
  {
    slug: "turns-ratio",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transformers" },
    ],
  },
  {
    slug: "transmission-line-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "characteristic-impedance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "standing-wave-ratio",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "displacement-current",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "displacement-current" },
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
    ],
  },
  {
    slug: "maxwell-equations-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
    ],
  },
  {
    slug: "lorenz-gauge",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  {
    slug: "coulomb-gauge",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
    ],
  },
  {
    slug: "poynting-vector",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
    ],
  },
  {
    slug: "poynting-theorem",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
    ],
  },
  {
    slug: "maxwell-stress-tensor",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "field-momentum",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "radiation-pressure-term",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "back-reaction",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "em-wave-equation-term",
    category: "concept",
    relatedPhysicists: ["james-clerk-maxwell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
    ],
  },
  {
    slug: "transverse-wave-em",
    category: "concept",
    relatedPhysicists: ["james-clerk-maxwell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
    ],
  },
  {
    slug: "speed-of-light",
    category: "concept",
    relatedPhysicists: ["james-clerk-maxwell", "hippolyte-fizeau", "leon-foucault"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
    ],
  },
  {
    slug: "plane-wave-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
    ],
  },
  {
    slug: "linear-polarization",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "circular-polarization",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "elliptical-polarization",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "polarization-axis",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "light-polarization",
    category: "phenomenon",
    relatedPhysicists: ["augustin-fresnel", "david-brewster"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "em-spectrum",
    category: "concept",
    relatedPhysicists: ["james-clerk-maxwell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
    ],
  },
  {
    slug: "wavelength-em",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
    ],
  },
  {
    slug: "wavenumber",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
    ],
  },
  {
    slug: "group-velocity-em",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "index-of-refraction" },
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },
  {
    slug: "skin-depth",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "skin-depth-in-conductors" },
    ],
  },
  {
    slug: "s-polarization",
    category: "concept",
    relatedPhysicists: ["augustin-fresnel"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "p-polarization",
    category: "concept",
    relatedPhysicists: ["augustin-fresnel"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "total-internal-reflection-term",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "total-internal-reflection" },
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
    ],
  },
  {
    slug: "critical-angle",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "total-internal-reflection" },
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
    ],
  },
  {
    slug: "optical-dispersion-term",
    category: "phenomenon",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },
  {
    slug: "abbe-number",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },
  {
    slug: "anomalous-dispersion",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },
  {
    slug: "snells-law",
    category: "concept",
    relatedPhysicists: ["willebrord-snell", "rene-descartes"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
      { branchSlug: "electromagnetism", topicSlug: "geometric-optics" },
      { branchSlug: "electromagnetism", topicSlug: "total-internal-reflection" },
    ],
  },
  {
    slug: "thin-lens",
    category: "instrument",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "geometric-optics" },
    ],
  },
  {
    slug: "focal-length",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "geometric-optics" },
    ],
  },
  {
    slug: "constructive-interference",
    category: "phenomenon",
    relatedPhysicists: ["thomas-young"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "interference" },
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
    ],
  },
  {
    slug: "destructive-interference",
    category: "phenomenon",
    relatedPhysicists: ["thomas-young"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "interference" },
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
    ],
  },
  {
    slug: "coherence-length",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "interference" },
    ],
  },
  {
    slug: "diffraction-em",
    category: "phenomenon",
    relatedPhysicists: ["christiaan-huygens", "thomas-young", "joseph-fraunhofer"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
    ],
  },
  {
    slug: "huygens-principle",
    category: "concept",
    relatedPhysicists: ["christiaan-huygens"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
      { branchSlug: "electromagnetism", topicSlug: "interference" },
    ],
  },
  {
    slug: "single-slit-diffraction",
    category: "phenomenon",
    relatedPhysicists: ["joseph-fraunhofer"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
    ],
  },
  {
    slug: "double-slit-diffraction",
    category: "phenomenon",
    relatedPhysicists: ["thomas-young"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
    ],
  },
  {
    slug: "brewster-angle",
    category: "concept",
    relatedPhysicists: ["david-brewster"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
    ],
  },
  {
    slug: "birefringence",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "malus-law",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "optical-fiber",
    category: "instrument",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
      { branchSlug: "electromagnetism", topicSlug: "total-internal-reflection" },
    ],
  },
  {
    slug: "waveguide-mode",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
    ],
  },
  {
    slug: "numerical-aperture",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
    ],
  },
  // §10.1 larmor-formula
  {
    slug: "larmor-formula",
    category: "concept",
    relatedPhysicists: ["joseph-larmor"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "larmor-formula" },
    ],
  },
  {
    slug: "larmor-power",
    category: "concept",
    relatedPhysicists: ["joseph-larmor"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "larmor-formula" },
    ],
  },
  // §10.2 electric-dipole-radiation
  {
    slug: "near-field-zone",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
    ],
  },
  {
    slug: "far-field-zone",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
    ],
  },
  {
    slug: "retarded-time",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  // §10.3 antennas-and-radio
  {
    slug: "hertzian-dipole",
    category: "concept",
    relatedPhysicists: ["heinrich-hertz"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
    ],
  },
  {
    slug: "antenna-gain",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
    ],
  },
  {
    slug: "radiation-pattern",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
    ],
  },
  // §10.4 synchrotron-radiation
  {
    slug: "synchrotron-radiation",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
    ],
  },
  {
    slug: "relativistic-beaming",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
    ],
  },
  // §10.5 bremsstrahlung
  {
    slug: "bremsstrahlung",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
    ],
  },
  {
    slug: "duane-hunt-limit",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
    ],
  },
  // §10.6 radiation-reaction
  {
    slug: "abraham-lorentz-equation",
    category: "concept",
    relatedPhysicists: ["hendrik-antoon-lorentz"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  {
    slug: "runaway-solution",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  {
    slug: "self-energy-divergence",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  {
    slug: "charge-invariance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "charge-invariance" },
    ],
  },
  {
    slug: "four-current",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "charge-invariance" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "four-vector",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "charge-invariance" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  {
    slug: "lorentz-transformation-of-fields",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "e-and-b-under-lorentz" },
    ],
  },
  {
    slug: "boost-mixing-e-and-b",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "e-and-b-under-lorentz" },
      { branchSlug: "electromagnetism", topicSlug: "magnetism-as-relativistic-electrostatics" },
    ],
  },
  {
    slug: "lorentz-invariants-of-em-field",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "e-and-b-under-lorentz" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
    ],
  },
  {
    slug: "electromagnetic-field-tensor",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
    ],
  },
  {
    slug: "dual-field-tensor",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
    ],
  },
  {
    slug: "length-contraction-of-current",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetism-as-relativistic-electrostatics" },
    ],
  },
  {
    slug: "four-potential",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  {
    slug: "em-lagrangian-density",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  // EM §12 — Foundations
  {
    slug: "gauge-group",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "non-abelian-gauge",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "yang-mills-equations",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "aharonov-bohm-phase",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  {
    slug: "dirac-quantization-condition",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
    ],
  },
  {
    slug: "electromagnetic-duality",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
    ],
  },
  {
    slug: "coherent-state",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "running-coupling",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "anomalous-magnetic-moment",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "classical-limit-of-qed",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  // Backfill (existing in Supabase, missing from glossary.ts):
  {
    slug: "gauge-invariance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  {
    slug: "gauge-theory-origins",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "aharonov-bohm-effect",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  {
    slug: "magnetic-monopole",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
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
