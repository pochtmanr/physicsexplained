import type { Equation } from "./types";

/**
 * Structural metadata for every equation index page on the site.
 *
 * Localised prose (name, whatItSolves, whenToUse, whenNotTo, commonMistakes)
 * lives in messages/<locale>/equations/<slug>.json and is fetched via
 * getEquationStringsForLocale() in lib/problems/equation-strings.ts.
 *
 * Wave 3 orchestrator appends entries here based on the EQUATION_SLUGS
 * lists collected from Wave 2 topic agents.
 */
export const EQUATIONS: readonly Equation[] = [
  // Wave 3 orchestrator appends entries here.

  // ── Kinematics ────────────────────────────────────────────────────────────
  {
    slug: "velocity-time-relation",
    latex: "v = v_0 + at",
    relatedTopicSlugs: ["motion-in-a-straight-line"],
  },
  {
    slug: "position-time-relation",
    latex: "d = v_0 t + \\tfrac{1}{2}at^2",
    relatedTopicSlugs: ["motion-in-a-straight-line"],
  },
  {
    slug: "kinematic-v-squared",
    latex: "v^2 = v_0^2 + 2ad",
    relatedTopicSlugs: ["motion-in-a-straight-line"],
  },
  {
    slug: "relative-velocity-1d",
    latex: "v_{close} = v_A + v_B",
    relatedTopicSlugs: ["motion-in-a-straight-line"],
  },
  {
    slug: "quadratic-formula",
    latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    relatedTopicSlugs: ["motion-in-a-straight-line"],
  },
  {
    slug: "velocity-decomposition",
    latex: "v_x = v_0\\cos\\theta,\\; v_y = v_0\\sin\\theta",
    relatedTopicSlugs: ["vectors-and-projectile-motion"],
  },
  {
    slug: "projectile-time-of-flight",
    latex: "T = \\frac{2v_0\\sin\\theta}{g}",
    relatedTopicSlugs: ["vectors-and-projectile-motion"],
  },
  {
    slug: "projectile-range",
    latex: "R = \\frac{v_0^2\\sin 2\\theta}{g}",
    relatedTopicSlugs: ["vectors-and-projectile-motion"],
  },
  {
    slug: "projectile-peak-height",
    latex: "H = \\frac{(v_0\\sin\\theta)^2}{2g}",
    relatedTopicSlugs: ["vectors-and-projectile-motion"],
  },
  {
    slug: "kinematic-equations",
    latex: "v = v_0 + at,\\; d = v_0 t + \\tfrac{1}{2}at^2,\\; v^2 = v_0^2 + 2ad",
    relatedTopicSlugs: ["vectors-and-projectile-motion"],
  },
  {
    slug: "complementary-angles",
    latex: "\\sin 2\\theta = \\sin(\\pi - 2\\theta)",
    relatedTopicSlugs: ["vectors-and-projectile-motion"],
  },

  // ── Forces ────────────────────────────────────────────────────────────────
  {
    slug: "newtons-second-law",
    latex: "F = ma",
    relatedTopicSlugs: ["newtons-three-laws"],
  },
  {
    slug: "weight-equation",
    latex: "W = mg",
    relatedTopicSlugs: ["newtons-three-laws"],
  },
  {
    slug: "friction-force",
    latex: "F_f = \\mu N",
    relatedTopicSlugs: ["newtons-three-laws", "friction-and-drag"],
  },
  {
    slug: "kinetic-friction",
    latex: "F_k = \\mu_k N",
    relatedTopicSlugs: ["friction-and-drag"],
  },
  {
    slug: "net-force-summation",
    latex: "\\sum F = F_1 + F_2 + \\cdots",
    relatedTopicSlugs: ["newtons-three-laws"],
  },
  {
    slug: "newtons-third-law",
    latex: "F_{12} = -F_{21}",
    relatedTopicSlugs: ["newtons-three-laws"],
  },
  {
    slug: "drag-force-linear",
    latex: "F_d = bv",
    relatedTopicSlugs: ["friction-and-drag"],
  },
  {
    slug: "drag-force-quadratic",
    latex: "F_d = \\tfrac{1}{2}\\rho C_d A v^2",
    relatedTopicSlugs: ["friction-and-drag"],
  },
  {
    slug: "terminal-velocity",
    latex: "v_t = \\frac{mg}{b}\\text{ (linear)},\\quad v_t = \\sqrt{\\frac{2mg}{\\rho C_d A}}\\text{ (quadratic)}",
    relatedTopicSlugs: ["friction-and-drag"],
  },

  // ── Oscillations ──────────────────────────────────────────────────────────
  {
    slug: "small-angle-pendulum-period",
    latex: "T = 2\\pi\\sqrt{\\frac{L}{g}}",
    relatedTopicSlugs: ["the-simple-pendulum"],
  },
  {
    slug: "pendulum-frequency",
    latex: "\\omega = \\sqrt{\\frac{g}{L}}",
    relatedTopicSlugs: ["the-simple-pendulum"],
  },
  {
    slug: "pendulum-energy-conservation",
    latex: "mgh = \\tfrac{1}{2}mv^2",
    relatedTopicSlugs: ["the-simple-pendulum"],
  },
  {
    slug: "small-angle-period-correction",
    latex: "T \\approx T_0\\!\\left(1 + \\frac{\\theta_0^2}{16} + \\frac{11\\theta_0^4}{3072}\\right)",
    relatedTopicSlugs: ["the-simple-pendulum", "beyond-small-angles"],
  },
  {
    slug: "large-angle-pendulum-period",
    latex: "T = 4\\sqrt{\\frac{L}{g}}\\,K\\!\\left(\\sin\\frac{\\theta_0}{2}\\right)",
    relatedTopicSlugs: ["beyond-small-angles"],
  },
  {
    slug: "complete-elliptic-integral",
    latex: "K(k) = \\int_0^{\\pi/2}\\frac{d\\phi}{\\sqrt{1-k^2\\sin^2\\phi}}",
    relatedTopicSlugs: ["beyond-small-angles"],
  },
  {
    slug: "taylor-expansion-period",
    latex: "T = T_0\\sum_{n=0}^{\\infty}\\left[\\frac{(2n)!}{2^{2n}(n!)^2}\\right]^2\\theta_0^{2n}",
    relatedTopicSlugs: ["beyond-small-angles"],
  },
  {
    slug: "simple-harmonic-motion",
    latex: "x'' + \\omega^2 x = 0",
    relatedTopicSlugs: ["oscillators-everywhere"],
  },
  {
    slug: "spring-frequency",
    latex: "\\omega = \\sqrt{\\frac{k}{m}}",
    relatedTopicSlugs: ["oscillators-everywhere"],
  },
  {
    slug: "shm-energy",
    latex: "E = \\tfrac{1}{2}kA^2",
    relatedTopicSlugs: ["oscillators-everywhere"],
  },
  {
    slug: "shm-position",
    latex: "x(t) = A\\cos(\\omega t + \\phi)",
    relatedTopicSlugs: ["oscillators-everywhere"],
  },
  {
    slug: "shm-velocity",
    latex: "v(t) = -A\\omega\\sin(\\omega t + \\phi)",
    relatedTopicSlugs: ["oscillators-everywhere"],
  },
  {
    slug: "shm-acceleration",
    latex: "a(t) = -A\\omega^2\\cos(\\omega t + \\phi)",
    relatedTopicSlugs: ["oscillators-everywhere"],
  },
  {
    slug: "coupled-normal-modes",
    latex: "\\omega_1 = \\omega_0,\\quad \\omega_2 = \\sqrt{\\omega_0^2 + \\omega_C^2}",
    relatedTopicSlugs: ["oscillators-everywhere"],
  },
  {
    slug: "damped-oscillator-position",
    latex: "x(t) = A_0 e^{-\\gamma t/2}\\cos(\\omega_d t + \\phi)",
    relatedTopicSlugs: ["damped-and-driven-oscillations"],
  },
  {
    slug: "damped-amplitude-decay",
    latex: "A(t) = A_0 e^{-\\gamma t/2}",
    relatedTopicSlugs: ["damped-and-driven-oscillations"],
  },
  {
    slug: "q-factor",
    latex: "Q = \\frac{\\omega_0}{\\gamma}",
    relatedTopicSlugs: ["damped-and-driven-oscillations"],
  },
  {
    slug: "driven-oscillator-amplitude",
    latex: "A(\\omega_d) = \\frac{F_0/m}{\\sqrt{(\\omega_0^2-\\omega_d^2)^2+(\\gamma\\omega_d)^2}}",
    relatedTopicSlugs: ["damped-and-driven-oscillations"],
  },
  {
    slug: "resonance",
    latex: "\\omega_d \\approx \\omega_0",
    relatedTopicSlugs: ["damped-and-driven-oscillations"],
  },
  {
    slug: "damped-natural-frequency",
    latex: "\\omega_d = \\sqrt{\\omega_0^2 - \\gamma^2/4}",
    relatedTopicSlugs: ["damped-and-driven-oscillations"],
  },
];

export function getEquation(slug: string): Equation | undefined {
  return EQUATIONS.find((e) => e.slug === slug);
}

export function getEquationsForTopic(topicSlug: string): readonly Equation[] {
  return EQUATIONS.filter((e) => e.relatedTopicSlugs.includes(topicSlug));
}
