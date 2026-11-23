/**
 * Guides for figures: what the full view shows beside a scene.
 *
 * A guide is structure only. All of its wording lives in
 * `messages/<locale>/scenes.json` under `<scene>.guide`, and the article
 * paragraphs it quotes are taken from the page itself, so nothing here needs
 * translating and nothing is written twice.
 *
 * To give another scene a guide: add an entry here keyed by the scene's
 * component name (as in the simulation registry), and the matching
 * `guide.items`, `guide.formulas` and `guide.try` strings in every locale.
 */

export interface FigureGuideItem {
  /** Key of the `label` / `text` pair under `<scene>.guide.items`. */
  key: string;
  /** CSS colour of the matching readout or curve in the scene, if it has one. */
  color?: string;
}

export interface FigureGuideFormula {
  /** Key of the caption under `<scene>.guide.formulas`. */
  key: string;
  /** LaTeX. Not translated. */
  tex: string;
}

export interface FigureGuide {
  /** Namespace of the scene's strings in scenes.json, e.g. "freeFall". */
  namespace: string;
  /**
   * The article paragraphs that talk about this figure: how many directly
   * before it and directly after it. They are shown as written, in the
   * reader's language.
   */
  prose: { before: number; after: number };
  /** Numbers the scene displays. */
  readouts: readonly FigureGuideItem[];
  /** Things the reader can change. */
  controls: readonly FigureGuideItem[];
  formulas: readonly FigureGuideFormula[];
  /** How many "try this" steps there are: keys "1" … "n" under `guide.try`. */
  trySteps: number;
  /** Slugs of dictionary entries, physicists and equations, and problem ids. */
  terms: readonly string[];
  physicists: readonly string[];
  equations: readonly string[];
  problems: readonly string[];
}

const FIGURE_GUIDES: Readonly<Record<string, FigureGuide>> = {
  InclinedPlaneScene: {
    namespace: "inclinedPlane",
    prose: { before: 2, after: 0 },
    readouts: [
      { key: "acceleration", color: "var(--color-cyan)" },
      { key: "rollTime" },
      { key: "marks", color: "var(--color-cyan)" },
    ],
    controls: [{ key: "angle" }],
    formulas: [
      { key: "distance", tex: "d = \\tfrac{1}{2}\\,a\\,t^2" },
      { key: "slope", tex: "a = g\\sin\\theta" },
    ],
    trySteps: 3,
    terms: ["acceleration", "kinematic-equations"],
    physicists: ["galileo-galilei"],
    equations: ["position-time-relation"],
    problems: ["motion-in-a-straight-line-medium-final-velocity-from-acceleration"],
  },
  TangentZoomScene: {
    namespace: "tangentZoom",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "secant", color: "var(--color-cyan)" },
      { key: "tangent" },
      { key: "curve" },
    ],
    controls: [{ key: "time" }, { key: "interval" }],
    formulas: [
      { key: "average", tex: "\\bar{v} = \\dfrac{\\Delta x}{\\Delta t}" },
      {
        key: "instant",
        tex: "v = \\lim_{\\Delta t \\to 0} \\dfrac{\\Delta x}{\\Delta t} = \\dfrac{dx}{dt}",
      },
    ],
    trySteps: 3,
    terms: ["derivative", "velocity"],
    physicists: ["isaac-newton", "nicole-oresme"],
    equations: ["velocity-time-relation"],
    problems: ["motion-in-a-straight-line-easy-distance-from-velocity-time"],
  },
  FreeFallScene: {
    namespace: "freeFall",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "hammerLands" },
      { key: "featherLands", color: "var(--color-amber)" },
      { key: "featherSpeed", color: "var(--color-amber)" },
      { key: "slowMotion" },
    ],
    controls: [{ key: "air" }],
    formulas: [
      { key: "drag", tex: "m\\,\\dfrac{dv}{dt} = m g - b v" },
      { key: "terminal", tex: "v_t = \\dfrac{m g}{b}" },
    ],
    trySteps: 3,
    terms: ["free-fall", "acceleration"],
    physicists: ["galileo-galilei", "isaac-newton"],
    equations: ["position-time-relation", "kinematic-v-squared"],
    problems: ["motion-in-a-straight-line-hard-stopping-distance-with-reaction-time"],
  },
  KinematicsGraphScene: {
    namespace: "kinematicsGraph",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "x", color: "var(--color-cyan)" },
      { key: "v", color: "var(--color-mint)" },
      { key: "a", color: "var(--color-purple)" },
    ],
    controls: [
      { key: "position" },
      { key: "velocity" },
      { key: "acceleration" },
      { key: "scrub" },
    ],
    formulas: [
      { key: "position", tex: "x = x_0 + v_0 t + \\tfrac{1}{2}\\,a\\,t^2" },
      { key: "velocity", tex: "v = \\dfrac{dx}{dt} = v_0 + a t" },
    ],
    trySteps: 3,
    terms: ["velocity", "acceleration", "derivative", "kinematic-equations"],
    physicists: ["nicole-oresme", "galileo-galilei"],
    equations: ["velocity-time-relation", "position-time-relation"],
    problems: [
      "motion-in-a-straight-line-medium-final-velocity-from-acceleration",
      "motion-in-a-straight-line-exam-overtaking-with-acceleration",
    ],
  },
  CarouselScene: {
    namespace: "carousel",
    prose: { before: 3, after: 0 },
    readouts: [
      { key: "omega" },
      { key: "riderRadius", color: "var(--color-cyan)" },
      { key: "ballDistance", color: "var(--color-magenta)" },
    ],
    controls: [{ key: "frame" }, { key: "scrub" }],
    formulas: [
      { key: "centrifugal", tex: "a_{\\text{cf}} = \\Omega^2 r" },
      { key: "angle", tex: "\\theta = \\Omega\\,t" },
    ],
    trySteps: 3,
    terms: ["centrifugal-force", "inertial-frame"],
    physicists: ["jean-d-alembert"],
    equations: ["newtons-second-law"],
    problems: [],
  },
  CoriolisTurntableScene: {
    namespace: "coriolisTurntable",
    prose: { before: 2, after: 0 },
    readouts: [
      { key: "omega" },
      { key: "v0", color: "var(--color-cyan)" },
      { key: "coriolis", color: "var(--color-magenta)" },
    ],
    controls: [{ key: "scrub" }],
    formulas: [
      { key: "coriolis", tex: "\\vec a_C = -2\\,\\vec\\Omega \\times \\vec v_{\\text{rot}}" },
      { key: "path", tex: "\\vec r_{\\text{rot}}(t) = R(-\\Omega t)\\,\\vec v_0\\,t" },
    ],
    trySteps: 3,
    terms: ["coriolis-force", "inertial-frame"],
    physicists: ["gaspard-gustave-de-coriolis"],
    equations: ["newtons-second-law"],
    problems: [],
  },
  CoriolisGlobeScene: {
    namespace: "coriolisGlobe",
    prose: { before: 1, after: 0 },
    readouts: [{ key: "period", color: "var(--color-cyan)" }, { key: "rate" }],
    controls: [{ key: "latitude" }],
    formulas: [
      { key: "foucault", tex: "T = \\dfrac{24\\ \\text{h}}{\\sin\\varphi}" },
      { key: "vertical", tex: "\\Omega_\\perp = \\Omega\\sin\\varphi" },
    ],
    trySteps: 3,
    terms: ["coriolis-force"],
    physicists: ["leon-foucault"],
    equations: [],
    problems: [],
  },
  RotatingProjectileScene: {
    namespace: "rotatingProjectile",
    prose: { before: 1, after: 0 },
    readouts: [
      { key: "v0" },
      { key: "g", color: "var(--color-cyan)" },
      { key: "coriolis", color: "var(--color-magenta)" },
    ],
    controls: [{ key: "omega" }, { key: "scrub" }],
    formulas: [
      {
        key: "rotating",
        tex: "m\\,\\vec a_{\\text{rot}} = m\\vec g - 2m\\,\\vec\\Omega \\times \\vec v_{\\text{rot}}",
      },
      { key: "coriolis", tex: "|\\vec a_C| = 2\\,|\\Omega|\\,|\\vec v_{\\text{rot}}|" },
    ],
    trySteps: 3,
    terms: ["coriolis-force", "centrifugal-force"],
    physicists: ["gaspard-gustave-de-coriolis"],
    equations: ["newtons-second-law", "projectile-range"],
    problems: [],
  },
  FirstLawScene: {
    namespace: "firstLaw",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "velocity", color: "var(--color-cyan)" },
      { key: "friction", color: "var(--color-red)" },
      { key: "stopDistance" },
    ],
    controls: [{ key: "mu" }],
    formulas: [
      { key: "decel", tex: "a = -\\mu g" },
      { key: "stop", tex: "d = \\dfrac{v_0^2}{2\\mu g}" },
    ],
    trySteps: 3,
    terms: ["inertia", "friction", "newtons-laws-of-motion"],
    physicists: ["galileo-galilei", "isaac-newton"],
    equations: ["friction-force"],
    problems: ["newtons-three-laws-medium-friction-on-flat-surface"],
  },
  FMaScene: {
    namespace: "fMa",
    prose: { before: 0, after: 1 },
    readouts: [
      { key: "acceleration", color: "var(--color-cyan)" },
      { key: "velocity" },
      { key: "position" },
    ],
    controls: [{ key: "force" }, { key: "mass" }],
    formulas: [
      { key: "second", tex: "F = m\\,a" },
      { key: "position", tex: "x = \\tfrac{1}{2}\\,a\\,t^2" },
    ],
    trySteps: 3,
    terms: ["force", "mass", "acceleration", "inertia"],
    physicists: ["isaac-newton"],
    equations: ["newtons-second-law"],
    problems: ["newtons-three-laws-easy-acceleration-from-net-force"],
  },
  ActionReactionScene: {
    namespace: "actionReaction",
    prose: { before: 1, after: 2 },
    readouts: [
      { key: "vA", color: "var(--color-amber)" },
      { key: "vB", color: "var(--color-cyan)" },
      { key: "momentum" },
      { key: "forces", color: "var(--color-red)" },
    ],
    controls: [{ key: "ratio" }],
    formulas: [
      { key: "third", tex: "\\vec F_{AB} = -\\vec F_{BA}" },
      { key: "momentum", tex: "m_A v_A = -\\,m_B v_B" },
    ],
    trySteps: 3,
    terms: ["force", "momentum", "newtons-laws-of-motion"],
    physicists: ["isaac-newton"],
    equations: ["newtons-third-law"],
    problems: [],
  },
  VectorAdditionScene: {
    namespace: "vectorAddition",
    prose: { before: 2, after: 0 },
    readouts: [
      { key: "a", color: "var(--color-mint)" },
      { key: "b", color: "var(--color-purple)" },
      { key: "sum", color: "var(--color-cyan)" },
      { key: "direction" },
      { key: "parallelogram" },
    ],
    controls: [{ key: "drag" }],
    formulas: [
      { key: "sum", tex: "\\vec a + \\vec b = (a_x + b_x,\\; a_y + b_y)" },
      { key: "magnitude", tex: "|\\vec v| = \\sqrt{v_x^2 + v_y^2}" },
    ],
    trySteps: 3,
    terms: ["vector"],
    physicists: ["galileo-galilei"],
    equations: ["velocity-decomposition"],
    problems: ["vectors-and-projectile-motion-hard-velocity-at-given-time"],
  },
  ProjectileScene: {
    namespace: "projectile",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "vx", color: "var(--color-mint)" },
      { key: "vy", color: "var(--color-purple)" },
      { key: "range" },
      { key: "peak" },
      { key: "flightTime" },
      { key: "g" },
    ],
    controls: [{ key: "angle" }, { key: "speed" }],
    formulas: [
      {
        key: "path",
        tex: "y = x\\tan\\theta - \\dfrac{g}{2v^2\\cos^2\\theta}\\,x^2",
      },
      { key: "range", tex: "R = \\dfrac{v^2 \\sin 2\\theta}{g}" },
    ],
    trySteps: 3,
    terms: ["projectile-motion", "parabola", "range"],
    physicists: ["galileo-galilei", "evangelista-torricelli"],
    equations: [
      "velocity-decomposition",
      "projectile-range",
      "projectile-peak-height",
      "projectile-time-of-flight",
    ],
    problems: [
      "vectors-and-projectile-motion-easy-range-given-angle-and-speed",
      "vectors-and-projectile-motion-challenge-complementary-angles-same-range",
    ],
  },
  MonkeyHunterScene: {
    namespace: "monkeyHunter",
    prose: { before: 2, after: 1 },
    readouts: [
      { key: "aim" },
      { key: "meetTime", color: "var(--color-cyan)" },
      { key: "drop", color: "var(--color-amber)" },
    ],
    controls: [{ key: "speed" }],
    formulas: [
      { key: "meet", tex: "t = \\dfrac{D}{v\\cos\\theta}" },
      { key: "drop", tex: "\\Delta y = \\tfrac{1}{2}\\,g\\,t^2" },
    ],
    trySteps: 3,
    terms: ["monkey-and-hunter", "free-fall"],
    physicists: ["galileo-galilei"],
    equations: ["velocity-decomposition", "kinematic-equations"],
    problems: ["vectors-and-projectile-motion-exam-position-and-speed-mid-flight"],
  },
  FrictionRampScene: {
    namespace: "frictionRamp",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "critical", color: "var(--color-cyan)" },
      { key: "muKinetic" },
      { key: "acceleration" },
      { key: "speed" },
    ],
    controls: [{ key: "angle" }, { key: "muStatic" }],
    formulas: [
      { key: "threshold", tex: "\\tan\\theta \\le \\mu_s" },
      { key: "slide", tex: "a = g\\,(\\sin\\theta - \\mu_k\\cos\\theta)" },
    ],
    trySteps: 3,
    terms: ["static-friction", "kinetic-friction", "friction"],
    physicists: ["guillaume-amontons"],
    equations: ["friction-force", "kinetic-friction"],
    problems: ["friction-and-drag-medium-acceleration-on-rough-ramp"],
  },
  TerminalVelocityScene: {
    namespace: "terminalVelocity",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "speed", color: "var(--color-cyan)" },
      { key: "terminal" },
      { key: "tau" },
      { key: "forces" },
    ],
    controls: [{ key: "drag" }, { key: "scrub" }],
    formulas: [
      { key: "motion", tex: "m\\,\\dfrac{dv}{dt} = m g - b v" },
      { key: "solution", tex: "v(t) = v_t\\left(1 - e^{-t/\\tau}\\right),\\quad \\tau = \\dfrac{m}{b}" },
    ],
    trySteps: 3,
    terms: ["terminal-velocity", "drag", "stokes-law"],
    physicists: ["george-gabriel-stokes"],
    equations: ["drag-force-linear", "terminal-velocity"],
    problems: ["friction-and-drag-hard-terminal-velocity-stokes-sphere"],
  },
  DragRegimesScene: {
    namespace: "dragRegimes",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "crossover", color: "var(--color-cyan)" },
      { key: "linear", color: "var(--color-amber)" },
      { key: "quadratic", color: "var(--color-magenta)" },
      { key: "total", color: "var(--color-cyan)" },
    ],
    controls: [{ key: "b" }, { key: "k" }],
    formulas: [
      { key: "total", tex: "F = b\\,v + k\\,v^2" },
      { key: "crossover", tex: "v_\\times = \\dfrac{b}{k}" },
    ],
    trySteps: 3,
    terms: ["drag", "reynolds-number", "stokes-law", "viscosity"],
    physicists: ["george-gabriel-stokes", "isaac-newton"],
    equations: ["drag-force-linear", "drag-force-quadratic"],
    problems: ["friction-and-drag-exam-terminal-velocity-quadratic-drag"],
  },
  VelocityTriangleScene: {
    namespace: "velocityTriangle",
    prose: { before: 1, after: 0 },
    readouts: [
      { key: "speed", color: "var(--color-cyan)" },
      { key: "dv", color: "var(--color-magenta)" },
      { key: "accel" },
    ],
    controls: [],
    formulas: [
      { key: "triangle", tex: "|\\Delta \\vec v| \\approx v\\,\\Delta\\theta" },
      { key: "accel", tex: "a = \\dfrac{|\\Delta \\vec v|}{\\Delta t} = \\dfrac{v^2}{r}" },
    ],
    trySteps: 3,
    terms: ["centripetal-force", "velocity", "acceleration"],
    physicists: ["christiaan-huygens", "isaac-newton"],
    equations: [],
    problems: [],
  },
  CentripetalForceScene: {
    namespace: "centripetalForce",
    prose: { before: 1, after: 0 },
    readouts: [
      { key: "force", color: "var(--color-magenta)" },
      { key: "params" },
      { key: "string" },
      { key: "gravity" },
      { key: "friction" },
    ],
    controls: [],
    formulas: [
      { key: "force", tex: "F = \\dfrac{m v^2}{r}" },
      { key: "newton", tex: "\\vec F = m\\,\\vec a" },
    ],
    trySteps: 3,
    terms: ["centripetal-force", "static-friction", "newtons-laws-of-motion"],
    physicists: ["isaac-newton"],
    equations: ["newtons-second-law"],
    problems: [],
  },
  AngularVelocityScene: {
    namespace: "angularVelocity",
    prose: { before: 2, after: 0 },
    readouts: [
      { key: "omega" },
      { key: "speed", color: "var(--color-cyan)" },
      { key: "radius" },
    ],
    controls: [{ key: "period" }],
    formulas: [
      { key: "omega", tex: "\\omega = \\dfrac{2\\pi}{T}" },
      { key: "speed", tex: "v = \\omega\\,r" },
    ],
    trySteps: 3,
    terms: ["angular-velocity", "velocity"],
    physicists: ["christiaan-huygens"],
    equations: [],
    problems: [],
  },
  NewtonsCannonScene: {
    namespace: "newtonsCannon",
    prose: { before: 4, after: 0 },
    readouts: [
      { key: "vOrb" },
      { key: "real" },
      { key: "regime" },
    ],
    controls: [{ key: "muzzle" }],
    formulas: [
      { key: "balance", tex: "\\dfrac{m v^2}{r} = \\dfrac{G M m}{r^2}" },
      { key: "orbit", tex: "v_{\\text{orb}} = \\sqrt{\\dfrac{G M}{r}}" },
    ],
    trySteps: 3,
    terms: ["escape-velocity", "gravitational-field", "free-fall", "ellipse"],
    physicists: ["isaac-newton"],
    equations: [],
    problems: [],
  },
  SkaterSpinScene: {
    namespace: "skaterSpin",
    prose: { before: 2, after: 1 },
    readouts: [
      { key: "inertia", color: "var(--color-amber)" },
      { key: "omega" },
      { key: "angularMomentum", color: "var(--color-mint)" },
      { key: "energy" },
    ],
    controls: [{ key: "pullIn" }],
    formulas: [
      { key: "conservation", tex: "L = I\\,\\omega = \\text{const}" },
      { key: "energy", tex: "KE = \\tfrac{1}{2} I \\omega^2 = \\dfrac{L^2}{2I}" },
    ],
    trySteps: 3,
    terms: ["angular-momentum", "moment-of-inertia", "torque"],
    physicists: ["leonhard-euler"],
    equations: [],
    problems: [],
  },
  SymmetryTriptychScene: {
    namespace: "symmetryTriptych",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "shift", color: "var(--color-cyan)" },
      { key: "conserved", color: "var(--color-mint)" },
    ],
    controls: [{ key: "symmetry" }],
    formulas: [
      { key: "time", tex: "\\dfrac{\\partial \\mathcal{L}}{\\partial t} = 0 \\;\\Rightarrow\\; E = \\text{const}" },
      { key: "space", tex: "\\dfrac{\\partial \\mathcal{L}}{\\partial x} = 0 \\;\\Rightarrow\\; p = \\dfrac{\\partial \\mathcal{L}}{\\partial \\dot{x}} = \\text{const}" },
      { key: "rotation", tex: "\\dfrac{\\partial \\mathcal{L}}{\\partial \\varphi} = 0 \\;\\Rightarrow\\; L_z = \\text{const}" },
    ],
    trySteps: 3,
    terms: ["symmetry", "continuous-symmetry", "invariance", "lagrangian", "conservation-of-energy"],
    physicists: ["emmy-noether"],
    equations: [],
    problems: [],
  },
  CenterOfMassScene: {
    namespace: "centerOfMass",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "r1" },
      { key: "r2" },
      { key: "balance" },
      { key: "com", color: "var(--color-magenta)" },
    ],
    controls: [{ key: "ratio" }, { key: "scrub" }],
    formulas: [
      { key: "balance", tex: "m_1 r_1 = m_2 r_2" },
      { key: "momentum", tex: "M\\,\\vec V_{\\text{CM}} = \\vec p_1 + \\vec p_2" },
    ],
    trySteps: 3,
    terms: ["center-of-mass", "momentum"],
    physicists: ["isaac-newton"],
    equations: ["newtons-third-law"],
    problems: [],
  },
  CollisionScene: {
    namespace: "collision",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "vA", color: "var(--color-amber)" },
      { key: "vB", color: "var(--color-cyan)" },
      { key: "momentum" },
      { key: "energy" },
    ],
    controls: [{ key: "restitution" }, { key: "ratio" }, { key: "scrub" }],
    formulas: [
      { key: "momentum", tex: "m_A v_A + m_B v_B = m_A v_A' + m_B v_B'" },
      { key: "restitution", tex: "e = \\dfrac{v_B' - v_A'}{v_A - v_B}" },
    ],
    trySteps: 3,
    terms: ["momentum", "coefficient-of-restitution", "elastic-collision", "inelastic-collision"],
    physicists: ["christiaan-huygens", "john-wallis"],
    equations: [],
    problems: [],
  },
  WorkScene: {
    namespace: "work",
    prose: { before: 1, after: 0 },
    readouts: [
      { key: "force", color: "var(--color-magenta)" },
      { key: "displacement" },
      { key: "work", color: "var(--color-magenta)" },
    ],
    controls: [{ key: "scrub" }],
    formulas: [
      { key: "work", tex: "W = F\\,d" },
      { key: "angle", tex: "W = F\\,d\\cos\\theta" },
    ],
    trySteps: 3,
    terms: ["work", "kinetic-energy"],
    physicists: ["james-prescott-joule"],
    equations: [],
    problems: [],
  },
  EnergyBowlScene: {
    namespace: "energyBowl",
    prose: { before: 1, after: 1 },
    readouts: [
      { key: "ke", color: "var(--color-cyan)" },
      { key: "pe", color: "var(--color-amber)" },
      { key: "heat", color: "var(--color-red)" },
    ],
    controls: [{ key: "friction" }],
    formulas: [
      { key: "mechanical", tex: "E = \\tfrac{1}{2}\\,m v^2 + m g y" },
      { key: "ledger", tex: "E_0 = \\text{KE} + \\text{PE} + Q" },
    ],
    trySteps: 3,
    terms: ["conservation-of-energy", "kinetic-energy", "potential-energy", "friction", "heat"],
    physicists: ["hermann-von-helmholtz", "james-prescott-joule"],
    equations: [],
    problems: [],
  },
  PowerScene: {
    namespace: "power",
    prose: { before: 0, after: 1 },
    readouts: [
      { key: "work", color: "var(--color-magenta)" },
      { key: "fastPower" },
      { key: "slowPower" },
    ],
    controls: [{ key: "scrub" }],
    formulas: [
      { key: "average", tex: "P = \\dfrac{W}{t}" },
      { key: "instant", tex: "P = \\dfrac{dW}{dt} = F\\,v" },
    ],
    trySteps: 3,
    terms: ["power", "work"],
    physicists: ["james-watt"],
    equations: [],
    problems: [],
  },
};

/** The guide for a scene, by its component name; undefined if it has none. */
export function getFigureGuide(component: string): FigureGuide | undefined {
  return Object.hasOwn(FIGURE_GUIDES, component) ? FIGURE_GUIDES[component] : undefined;
}

/** Component names of every scene that has a guide. */
export function figureGuideComponents(): string[] {
  return Object.keys(FIGURE_GUIDES);
}
