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
};

/** The guide for a scene, by its component name; undefined if it has none. */
export function getFigureGuide(component: string): FigureGuide | undefined {
  return Object.hasOwn(FIGURE_GUIDES, component) ? FIGURE_GUIDES[component] : undefined;
}

/** Component names of every scene that has a guide. */
export function figureGuideComponents(): string[] {
  return Object.keys(FIGURE_GUIDES);
}
