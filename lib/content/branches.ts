import { GLOSSARY } from "./glossary";
import { PHYSICISTS } from "./physicists";
import type { Branch, Module, Topic } from "./types";

const CLASSICAL_MECHANICS_MODULES: readonly Module[] = [
  { slug: "oscillations", title: "Oscillations", index: 1 },
  { slug: "orbital-mechanics", title: "Orbital Mechanics", index: 2 },
];

const CLASSICAL_MECHANICS_TOPICS: readonly Topic[] = [
  {
    slug: "the-simple-pendulum",
    title: "THE SIMPLE PENDULUM",
    eyebrow: "FIG.01 · OSCILLATIONS",
    subtitle: "Why every clock that ever ticked ticked the same way.",
    readingMinutes: 10,
    status: "live",
    module: "oscillations",
  },
  {
    slug: "beyond-small-angles",
    title: "BEYOND SMALL ANGLES",
    eyebrow: "FIG.02 · OSCILLATIONS",
    subtitle: "What the pendulum hides when you stop making approximations.",
    readingMinutes: 12,
    status: "live",
    module: "oscillations",
  },
  {
    slug: "oscillators-everywhere",
    title: "OSCILLATORS EVERYWHERE",
    eyebrow: "FIG.03 · OSCILLATIONS",
    subtitle: "The equation that runs half of physics.",
    readingMinutes: 12,
    status: "draft",
    module: "oscillations",
  },
  {
    slug: "kepler",
    title: "THE LAWS OF PLANETS",
    eyebrow: "FIG.04 · ORBITAL MECHANICS",
    subtitle:
      "How a German astronomer broke the sky open with three sentences.",
    readingMinutes: 6,
    status: "live",
    module: "orbital-mechanics",
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
      "Maxwell's four equations — the most important four lines in physics — unify electricity, magnetism, and light into a single field theory. Every radio, screen, wire, and star depends on them.",
    modules: [],
    topics: [],
    status: "coming-soon",
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
