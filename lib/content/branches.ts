import { GLOSSARY } from "./glossary";
import { PHYSICISTS } from "./physicists";
import type { Branch, Module, Topic } from "./types";

const CLASSICAL_MECHANICS_MODULES: readonly Module[] = [
  { slug: "kinematics-newton", title: "Kinematics & Newton", index: 1 },
  { slug: "conservation-laws", title: "Conservation Laws", index: 2 },
  { slug: "rotation-rigid-bodies", title: "Rotation & Rigid Bodies", index: 3 },
  { slug: "oscillations", title: "Oscillations", index: 4 },
  { slug: "waves", title: "Waves", index: 5 },
  { slug: "orbital-mechanics", title: "Orbital Mechanics", index: 6 },
  { slug: "fluids", title: "Fluids", index: 7 },
  { slug: "lagrangian-hamiltonian", title: "Lagrangian & Hamiltonian", index: 8 },
];

const CLASSICAL_MECHANICS_TOPICS: readonly Topic[] = [
  {
    slug: "the-simple-pendulum",
    title: "THE SIMPLE PENDULUM",
    eyebrow: "FIG.16 · OSCILLATIONS",
    subtitle: "Why every clock that ever ticked ticked the same way.",
    readingMinutes: 10,
    status: "live",
    module: "oscillations",
  },
  {
    slug: "beyond-small-angles",
    title: "BEYOND SMALL ANGLES",
    eyebrow: "FIG.17 · OSCILLATIONS",
    subtitle: "What the pendulum hides when you stop making approximations.",
    readingMinutes: 12,
    status: "live",
    module: "oscillations",
  },
  {
    slug: "oscillators-everywhere",
    title: "OSCILLATORS EVERYWHERE",
    eyebrow: "FIG.18 · OSCILLATIONS",
    subtitle: "The equation that runs half of physics.",
    readingMinutes: 12,
    status: "live",
    module: "oscillations",
  },
  {
    slug: "kepler",
    title: "THE LAWS OF PLANETS",
    eyebrow: "FIG.24 · ORBITAL MECHANICS",
    subtitle:
      "How a German astronomer broke the sky open with three sentences.",
    readingMinutes: 6,
    status: "live",
    module: "orbital-mechanics",
  },
  {
    slug: "universal-gravitation",
    title: "UNIVERSAL GRAVITATION",
    eyebrow: "FIG.25 · ORBITAL MECHANICS",
    subtitle:
      "The force that holds the Moon is the force that drops the apple.",
    readingMinutes: 12,
    status: "live",
    module: "orbital-mechanics",
  },
  {
    slug: "energy-in-orbit",
    title: "ENERGY IN ORBIT",
    eyebrow: "FIG.26 · ORBITAL MECHANICS",
    subtitle: "One equation tells you the speed at every point in space.",
    readingMinutes: 12,
    status: "live",
    module: "orbital-mechanics",
  },
  {
    slug: "tides-and-three-body",
    title: "TIDES AND THE THREE-BODY PROBLEM",
    eyebrow: "FIG.27 · ORBITAL MECHANICS",
    subtitle:
      "When gravity gets complicated, the universe gets interesting.",
    readingMinutes: 12,
    status: "live",
    module: "orbital-mechanics",
  },
    {
          slug: "motion-in-a-straight-line",
          title: "MOTION IN A STRAIGHT LINE",
          eyebrow: "FIG.01 · KINEMATICS & NEWTON",
          subtitle: "Position, velocity, acceleration — the three questions that gave physics its language.",
          readingMinutes: 10,
          status: "live",
          module: "kinematics-newton",
        },
    {
          slug: "vectors-and-projectile-motion",
          title: "VECTORS AND PROJECTILE MOTION",
          eyebrow: "FIG.02 · KINEMATICS & NEWTON",
          subtitle: "How Galileo split one hard problem into two easy ones — and why a cannonball traces a parabola.",
          readingMinutes: 10,
          status: "live",
          module: "kinematics-newton",
        },
    {
          slug: "newtons-three-laws",
          title: "NEWTON'S THREE LAWS",
          eyebrow: "FIG.03 · KINEMATICS & NEWTON",
          subtitle: "The three sentences that still run the world.",
          readingMinutes: 11,
          status: "live",
          module: "kinematics-newton",
        },
    {
          slug: "friction-and-drag",
          title: "FRICTION AND DRAG",
          eyebrow: "FIG.05 · KINEMATICS & NEWTON",
          subtitle: "The forces that quietly take the energy away — and, in doing so, run half of everyday physics.",
          readingMinutes: 12,
          status: "live",
          module: "kinematics-newton",
        },
    {
          slug: "energy-and-work",
          title: "ENERGY AND WORK",
          eyebrow: "FIG.07 · CONSERVATION LAWS",
          subtitle: "The universe keeps a ledger — and the totals always balance.",
          readingMinutes: 12,
          status: "live",
          module: "conservation-laws",
        },
    {
          slug: "momentum-and-collisions",
          title: "MOMENTUM AND COLLISIONS",
          eyebrow: "FIG.08 · CONSERVATION LAWS",
          subtitle: "The quantity nothing can create or destroy — only pass around.",
          readingMinutes: 13,
          status: "live",
          module: "conservation-laws",
        },
    {
          slug: "angular-momentum",
          title: "ANGULAR MOMENTUM",
          eyebrow: "FIG.09 · CONSERVATION LAWS",
          subtitle: "The quantity that makes skaters speed up, planets sweep out equal areas, and pulsars keep time.",
          readingMinutes: 13,
          status: "live",
          module: "conservation-laws",
        },
    {
          slug: "noethers-theorem",
          title: "NOETHER'S THEOREM",
          eyebrow: "FIG.10 · CONSERVATION LAWS",
          subtitle: "Every conservation law comes from a symmetry. Every symmetry gives you a conservation law.",
          readingMinutes: 14,
          status: "live",
          module: "conservation-laws",
        },
    {
          slug: "torque-and-rotational-dynamics",
          title: "TORQUE AND ROTATIONAL DYNAMICS",
          eyebrow: "FIG.11 · ROTATION & RIGID BODIES",
          subtitle: "Forces that turn instead of push — and the geometry that decides how much.",
          readingMinutes: 12,
          status: "live",
          module: "rotation-rigid-bodies",
        },
    {
          slug: "moment-of-inertia",
          title: "MOMENT OF INERTIA",
          eyebrow: "FIG.12 · ROTATION & RIGID BODIES",
          subtitle: "What mass becomes when you spin it.",
          readingMinutes: 13,
          status: "live",
          module: "rotation-rigid-bodies",
        },
    {
          slug: "gyroscopes-and-precession",
          title: "GYROSCOPES AND PRECESSION",
          eyebrow: "FIG.14 · ROTATION & RIGID BODIES",
          subtitle: "Why a spinning top refuses to fall.",
          readingMinutes: 14,
          status: "live",
          module: "rotation-rigid-bodies",
        },
    {
          slug: "the-wobbling-earth",
          title: "THE WOBBLING EARTH",
          eyebrow: "FIG.15 · ROTATION & RIGID BODIES",
          subtitle: "Precession, nutation, and the long memory of the planet.",
          readingMinutes: 14,
          status: "live",
          module: "rotation-rigid-bodies",
        },
    {
          slug: "the-wave-equation",
          title: "THE WAVE EQUATION",
          eyebrow: "FIG.20 · WAVES",
          subtitle: "The equation that runs every wave there is.",
          readingMinutes: 10,
          status: "live",
          module: "waves",
        },
    {
          slug: "standing-waves-and-modes",
          title: "STANDING WAVES AND MODES",
          eyebrow: "FIG.21 · WAVES",
          subtitle: "Why guitar strings only sing certain notes.",
          readingMinutes: 11,
          status: "live",
          module: "waves",
        },
    {
          slug: "doppler-and-shock-waves",
          title: "DOPPLER AND SHOCK WAVES",
          eyebrow: "FIG.22 · WAVES",
          subtitle: "What changes when the source moves.",
          readingMinutes: 11,
          status: "live",
          module: "waves",
        },
    {
          slug: "dispersion-and-group-velocity",
          title: "DISPERSION AND GROUP VELOCITY",
          eyebrow: "FIG.23 · WAVES",
          subtitle: "When different frequencies travel at different speeds.",
          readingMinutes: 12,
          status: "live",
          module: "waves",
        },
    {
          slug: "pressure-and-buoyancy",
          title: "PRESSURE AND BUOYANCY",
          eyebrow: "FIG.28 · FLUIDS",
          subtitle: "Why some things float.",
          readingMinutes: 12,
          status: "live",
          module: "fluids",
        },
    {
          slug: "bernoullis-principle",
          title: "BERNOULLI'S PRINCIPLE",
          eyebrow: "FIG.29 · FLUIDS",
          subtitle: "Faster fluids push less.",
          readingMinutes: 13,
          status: "live",
          module: "fluids",
        },
    {
          slug: "viscosity-and-reynolds-number",
          title: "VISCOSITY AND REYNOLDS NUMBER",
          eyebrow: "FIG.30 · FLUIDS",
          subtitle: "Honey, water, and the line between them.",
          readingMinutes: 13,
          status: "live",
          module: "fluids",
        },
    {
          slug: "turbulence",
          title: "TURBULENCE",
          eyebrow: "FIG.31 · FLUIDS",
          subtitle: "The last unsolved problem of classical physics.",
          readingMinutes: 12,
          status: "live",
          module: "fluids",
        },
    {
          slug: "the-principle-of-least-action",
          title: "THE PRINCIPLE OF LEAST ACTION",
          eyebrow: "FIG.32 · LAGRANGIAN & HAMILTONIAN",
          subtitle: "Nature picks the laziest path.",
          readingMinutes: 11,
          status: "live",
          module: "lagrangian-hamiltonian",
        },
    {
          slug: "the-lagrangian",
          title: "THE LAGRANGIAN",
          eyebrow: "FIG.33 · LAGRANGIAN & HAMILTONIAN",
          subtitle: "Mechanics rewritten as energy minus energy.",
          readingMinutes: 12,
          status: "live",
          module: "lagrangian-hamiltonian",
        },
    {
          slug: "the-hamiltonian",
          title: "THE HAMILTONIAN",
          eyebrow: "FIG.34 · LAGRANGIAN & HAMILTONIAN",
          subtitle: "Position and momentum, two halves of the same thing.",
          readingMinutes: 12,
          status: "live",
          module: "lagrangian-hamiltonian",
        },
    {
          slug: "phase-space",
          title: "PHASE SPACE",
          eyebrow: "FIG.35 · LAGRANGIAN & HAMILTONIAN",
          subtitle: "The space where every possible motion lives.",
          readingMinutes: 13,
          status: "live",
          module: "lagrangian-hamiltonian",
        },
  {
    slug: "circular-motion",
    title: "CIRCULAR MOTION",
    eyebrow: "FIG.04 · KINEMATICS & NEWTON",
    subtitle: "Why the string always pulls inward — and why the Moon never stops falling.",
    readingMinutes: 11,
    status: "live",
    module: "kinematics-newton",
  },
  {
    slug: "non-inertial-frames",
    title: "NON-INERTIAL REFERENCE FRAMES",
    eyebrow: "FIG.06 · KINEMATICS & NEWTON",
    subtitle: "Why a carousel feels like a force — and why the wind turns right in the northern hemisphere.",
    readingMinutes: 13,
    status: "live",
    module: "kinematics-newton",
  },
  {
    slug: "rolling-motion",
    title: "ROLLING MOTION",
    eyebrow: "FIG.13 · ROTATION & RIGID BODIES",
    subtitle: "What a wheel does that a puck can't — and why a hollow cylinder loses every race.",
    readingMinutes: 12,
    status: "live",
    module: "rotation-rigid-bodies",
  },
  {
    slug: "damped-and-driven-oscillations",
    title: "DAMPED & DRIVEN OSCILLATIONS",
    eyebrow: "FIG.19 · OSCILLATIONS",
    subtitle: "Why every real oscillator dies — and why, if you push it just right, it tries to kill you back.",
    readingMinutes: 13,
    status: "live",
    module: "oscillations",
  },
];

const ELECTROMAGNETISM_MODULES: readonly Module[] = [
  { slug: "electrostatics", title: "Electrostatics", index: 1 },
  { slug: "fields-in-matter", title: "Electric Fields in Matter", index: 2 },
  { slug: "magnetostatics", title: "Magnetostatics", index: 3 },
  { slug: "magnetism-in-matter", title: "Magnetic Fields in Matter", index: 4 },
  { slug: "induction", title: "Electrodynamics & Induction", index: 5 },
  { slug: "circuits", title: "Circuits", index: 6 },
  { slug: "maxwell", title: "Maxwell's Equations", index: 7 },
  { slug: "em-waves-vacuum", title: "EM Waves in Vacuum", index: 8 },
  { slug: "waves-in-matter-optics", title: "Waves in Matter & Optics", index: 9 },
  { slug: "radiation", title: "Radiation", index: 10 },
  { slug: "em-relativity", title: "EM & Relativity", index: 11 },
  { slug: "foundations", title: "Foundations", index: 12 },
];

const ELECTROMAGNETISM_TOPICS: readonly Topic[] = [
  {
    slug: "coulombs-law",
    title: "ELECTRIC CHARGE AND COULOMB'S LAW",
    eyebrow: "FIG.01 · ELECTROSTATICS",
    subtitle: "The force between two charges — and why it looks so much like gravity.",
    readingMinutes: 10,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "the-electric-field",
    title: "THE ELECTRIC FIELD",
    eyebrow: "FIG.02 · ELECTROSTATICS",
    subtitle: "When a force has a place of its own.",
    readingMinutes: 11,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "gauss-law",
    title: "GAUSS'S LAW",
    eyebrow: "FIG.03 · ELECTROSTATICS",
    subtitle: "The equation that turns symmetry into an answer.",
    readingMinutes: 12,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "electric-potential",
    title: "ELECTRIC POTENTIAL AND VOLTAGE",
    eyebrow: "FIG.04 · ELECTROSTATICS",
    subtitle: "Energy per charge, and the map every battery reads from.",
    readingMinutes: 11,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "capacitance-and-field-energy",
    title: "CAPACITANCE AND FIELD ENERGY",
    eyebrow: "FIG.05 · ELECTROSTATICS",
    subtitle: "Where the charge goes when you let go of the switch.",
    readingMinutes: 12,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "conductors-and-shielding",
    title: "CONDUCTORS AND THE FARADAY CAGE",
    eyebrow: "FIG.06 · ELECTROSTATICS",
    subtitle: "Why a metal box is the safest place in a lightning storm.",
    readingMinutes: 11,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "method-of-images",
    title: "THE METHOD OF IMAGES",
    eyebrow: "FIG.07 · ELECTROSTATICS",
    subtitle: "A trick that turns a hard problem into a symmetry.",
    readingMinutes: 12,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "polarization-and-bound-charges",
    title: "POLARIZATION AND BOUND CHARGES",
    eyebrow: "FIG.08 · ELECTRIC FIELDS IN MATTER",
    subtitle: "What happens when the charges can't leave, but can lean.",
    readingMinutes: 12,
    status: "live",
    module: "fields-in-matter",
  },
  {
    slug: "dielectrics-and-the-d-field",
    title: "DIELECTRICS AND THE D FIELD",
    eyebrow: "FIG.09 · ELECTRIC FIELDS IN MATTER",
    subtitle: "The extra field that only notices what's free.",
    readingMinutes: 12,
    status: "live",
    module: "fields-in-matter",
  },
  {
    slug: "boundary-conditions-at-interfaces",
    title: "BOUNDARY CONDITIONS AT INTERFACES",
    eyebrow: "FIG.10 · ELECTRIC FIELDS IN MATTER",
    subtitle: "What the field must do when the material changes.",
    readingMinutes: 10,
    status: "live",
    module: "fields-in-matter",
  },
  {
    slug: "piezo-and-ferroelectricity",
    title: "PIEZOELECTRICITY AND FERROELECTRICITY",
    eyebrow: "FIG.11 · ELECTRIC FIELDS IN MATTER",
    subtitle: "The crystals that remember which way they've been pushed.",
    readingMinutes: 11,
    status: "live",
    module: "fields-in-matter",
  },
  {
    slug: "the-lorentz-force",
    title: "CURRENTS AND THE LORENTZ FORCE",
    eyebrow: "FIG.12 · MAGNETOSTATICS",
    subtitle: "Why a moving charge feels what a still one doesn't.",
    readingMinutes: 12,
    status: "live",
    module: "magnetostatics",
  },
  {
    slug: "biot-savart-law",
    title: "THE BIOT–SAVART LAW",
    eyebrow: "FIG.13 · MAGNETOSTATICS",
    subtitle: "The magnetic analogue of Coulomb, one current element at a time.",
    readingMinutes: 12,
    status: "live",
    module: "magnetostatics",
  },
  {
    slug: "amperes-law",
    title: "AMPÈRE'S LAW",
    eyebrow: "FIG.14 · MAGNETOSTATICS",
    subtitle: "The shortcut when the current walks a straight line.",
    readingMinutes: 12,
    status: "live",
    module: "magnetostatics",
  },
  {
    slug: "the-vector-potential",
    title: "THE VECTOR POTENTIAL",
    eyebrow: "FIG.15 · MAGNETOSTATICS",
    subtitle: "The field behind the field.",
    readingMinutes: 13,
    status: "live",
    module: "magnetostatics",
  },
  {
    slug: "magnetic-dipoles",
    title: "MAGNETIC DIPOLES AND TORQUE ON LOOPS",
    eyebrow: "FIG.16 · MAGNETOSTATICS",
    subtitle: "Why a compass turns, in the language of fields.",
    readingMinutes: 11,
    status: "live",
    module: "magnetostatics",
  },
  {
    slug: "magnetization-and-the-h-field",
    title: "MAGNETIZATION AND THE H FIELD",
    eyebrow: "FIG.17 · MAGNETIC FIELDS IN MATTER",
    subtitle: "Matter's answer to an applied magnetic field.",
    readingMinutes: 12,
    status: "live",
    module: "magnetism-in-matter",
  },
  {
    slug: "dia-and-paramagnetism",
    title: "DIAMAGNETISM AND PARAMAGNETISM",
    eyebrow: "FIG.18 · MAGNETIC FIELDS IN MATTER",
    subtitle: "The quiet magnets hiding in almost everything.",
    readingMinutes: 11,
    status: "live",
    module: "magnetism-in-matter",
  },
  {
    slug: "ferromagnetism-and-hysteresis",
    title: "FERROMAGNETISM, DOMAINS, AND HYSTERESIS",
    eyebrow: "FIG.19 · MAGNETIC FIELDS IN MATTER",
    subtitle: "Why iron remembers, and why the memory can be erased.",
    readingMinutes: 13,
    status: "live",
    module: "magnetism-in-matter",
  },
  {
    slug: "superconductivity-and-meissner",
    title: "SUPERCONDUCTIVITY AND THE MEISSNER EFFECT",
    eyebrow: "FIG.20 · MAGNETIC FIELDS IN MATTER",
    subtitle: "When the field is not just weakened — it is thrown out.",
    readingMinutes: 12,
    status: "live",
    module: "magnetism-in-matter",
  },
  {
    slug: "faradays-law",
    title: "FARADAY'S LAW OF INDUCTION",
    eyebrow: "FIG.21 · ELECTRODYNAMICS & INDUCTION",
    subtitle: "A changing magnetic field brings an electric field with it.",
    readingMinutes: 12,
    status: "live",
    module: "induction",
  },
  {
    slug: "lenz-law-and-motional-emf",
    title: "LENZ'S LAW AND MOTIONAL EMF",
    eyebrow: "FIG.22 · ELECTRODYNAMICS & INDUCTION",
    subtitle: "Nature pushes back against the change that caused it.",
    readingMinutes: 11,
    status: "live",
    module: "induction",
  },
  {
    slug: "self-and-mutual-inductance",
    title: "SELF AND MUTUAL INDUCTANCE",
    eyebrow: "FIG.23 · ELECTRODYNAMICS & INDUCTION",
    subtitle: "Why a coil resists its own changing current.",
    readingMinutes: 12,
    status: "live",
    module: "induction",
  },
  {
    slug: "energy-in-magnetic-fields",
    title: "ENERGY IN MAGNETIC FIELDS",
    eyebrow: "FIG.24 · ELECTRODYNAMICS & INDUCTION",
    subtitle: "Where the energy goes when the current ramps up.",
    readingMinutes: 11,
    status: "live",
    module: "induction",
  },
  {
    slug: "eddy-currents",
    title: "EDDY CURRENTS AND MAGNETIC BRAKING",
    eyebrow: "FIG.25 · ELECTRODYNAMICS & INDUCTION",
    subtitle: "The invisible circuits that stop a falling magnet.",
    readingMinutes: 11,
    status: "live",
    module: "induction",
  },
];

export const BRANCHES: readonly Branch[] = [
  {
    slug: "classical-mechanics",
    index: 1,
    title: "CLASSICAL MECHANICS",
    eyebrow: "§ 01",
    subtitle: "The physics of cannonballs, planets, and pendulums.",
    description:
      "Newton's legacy: forces, motion, and the machinery of the everyday world. Pendulums that keep perfect time, planets that sweep out equal areas, cannonballs that trace parabolas. The math is three hundred years old and still runs the world you live in.",
    modules: CLASSICAL_MECHANICS_MODULES,
    topics: CLASSICAL_MECHANICS_TOPICS,
    status: "live",
  },
  {
    slug: "electromagnetism",
    index: 2,
    title: "ELECTROMAGNETISM",
    eyebrow: "§ 02",
    subtitle: "Light, charge, and the field that holds the world together.",
    description:
      "Maxwell's four equations — the most important four lines in physics — unify electricity, magnetism, and light into a single field theory. Every radio, screen, wire, and star depends on them. The branch ends on the quiet reveal that magnetism was never a second force at all: it is electricity, seen from a moving train.",
    modules: ELECTROMAGNETISM_MODULES,
    topics: ELECTROMAGNETISM_TOPICS,
    status: "live",
  },
  {
    slug: "thermodynamics",
    index: 3,
    title: "THERMODYNAMICS",
    eyebrow: "§ 03",
    subtitle: "Heat, entropy, and why time moves forward.",
    description:
      "Energy flows one way. Entropy only grows. Out of these two facts come steam engines, refrigerators, the arrow of time, and the heat death of the universe. Thermodynamics is the part of physics that feels most like philosophy.",
    modules: [],
    topics: [],
    status: "coming-soon",
  },
  {
    slug: "relativity",
    index: 4,
    title: "RELATIVITY",
    eyebrow: "§ 04",
    subtitle: "The weirdness that hides at the edges of speed.",
    description:
      "Space bends. Time stretches. Mass and energy are the same thing. Einstein's special and general relativity rewrote geometry itself — and predicted everything from GPS corrections to black holes.",
    modules: [],
    topics: [],
    status: "coming-soon",
  },
  {
    slug: "quantum",
    index: 5,
    title: "QUANTUM MECHANICS",
    eyebrow: "§ 05",
    subtitle: "The rules the universe actually runs on.",
    description:
      "At small enough scales, the world stops behaving like a world. Particles are waves, measurements disturb reality, and probabilities replace certainties. Every transistor, laser, and MRI machine runs on quantum mechanics.",
    modules: [],
    topics: [],
    status: "coming-soon",
  },
  {
    slug: "modern-physics",
    index: 6,
    title: "MODERN PHYSICS",
    eyebrow: "§ 06",
    subtitle: "From the nucleus to the Standard Model and beyond.",
    description:
      "Where quantum mechanics meets relativity, and where physics meets its open frontier. Particle physics, nuclear physics, cosmology, and the questions we still can't answer about what the universe is made of.",
    modules: [],
    topics: [],
    status: "coming-soon",
  },
];

export function getBranch(slug: string): Branch | undefined {
  return BRANCHES.find((b) => b.slug === slug);
}

export function getTopic(
  branchSlug: string,
  topicSlug: string,
): Topic | undefined {
  const branch = getBranch(branchSlug);
  if (!branch) return undefined;
  return branch.topics.find((t) => t.slug === topicSlug);
}

export function getLiveBranches(): readonly Branch[] {
  return BRANCHES.filter((b) => b.status === "live");
}

export function getAdjacentTopics(
  branchSlug: string,
  topicSlug: string,
): { prev: { branch: Branch; topic: Topic } | null; next: { branch: Branch; topic: Topic } | null } {
  const allLive: { branch: Branch; topic: Topic }[] = [];
  for (const branch of BRANCHES) {
    if (branch.status !== "live") continue;
    for (const topic of branch.topics) {
      if (topic.status !== "live") continue;
      allLive.push({ branch, topic });
    }
  }

  const idx = allLive.findIndex(
    (item) => item.branch.slug === branchSlug && item.topic.slug === topicSlug,
  );
  if (idx === -1) return { prev: null, next: null };

  return {
    prev: idx > 0 ? allLive[idx - 1] : null,
    next: idx < allLive.length - 1 ? allLive[idx + 1] : null,
  };
}

export function getAllRoutes(): string[] {
  const routes: string[] = ["/"];
  for (const branch of BRANCHES) {
    routes.push(`/${branch.slug}`);
    for (const topic of branch.topics) {
      routes.push(`/${branch.slug}/${topic.slug}`);
    }
  }
  routes.push("/physicists");
  for (const physicist of PHYSICISTS) {
    routes.push(`/physicists/${physicist.slug}`);
  }
  routes.push("/dictionary");
  for (const term of GLOSSARY) {
    routes.push(`/dictionary/${term.slug}`);
  }
  return routes;
}
