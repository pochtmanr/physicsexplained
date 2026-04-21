// Seed new physicists + glossary terms from Wave 2 (Module 2 · Conservation Laws).
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-wave-2.ts
import "dotenv/config";
import { createHash } from "node:crypto";
import { getServiceClient } from "@/lib/supabase-server";

interface PhysicistSeed {
  slug: string;
  name: string;
  shortName: string;
  born: string;
  died: string;
  nationality: string;
  oneLiner: string;
  bio: string;
  contributions: string[];
  majorWorks: string[];
  relatedTopics: { branchSlug: string; topicSlug: string }[];
}

interface GlossarySeed {
  slug: string;
  term: string;
  category: "concept" | "phenomenon" | "instrument" | "unit";
  shortDefinition: string;
  description: string;
  history?: string;
  relatedPhysicists?: string[];
  relatedTopics?: { branchSlug: string; topicSlug: string }[];
}

function parseMajorWork(s: string): { title: string; year: string; description: string } {
  const match = s.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) return { title: match[1].trim(), year: match[2].trim(), description: "" };
  return { title: s, year: "", description: "" };
}

const PHYSICISTS: PhysicistSeed[] = [
  {
    slug: "konstantin-tsiolkovsky",
    name: "Konstantin Tsiolkovsky",
    shortName: "Tsiolkovsky",
    born: "1857",
    died: "1935",
    nationality: "Russian",
    oneLiner: "The deaf Russian schoolteacher who derived the rocket equation in 1903 and invented astronautics on paper.",
    bio: "Konstantin Eduardovich Tsiolkovsky was born in 1857 in Izhevskoye, a small village in the Ryazan Governorate of Imperial Russia, the fifth of eighteen children of a Polish-Russian forester. At ten, scarlet fever left him almost completely deaf — a condition that ended his formal schooling and would shape the rest of his life. Largely self-taught from the public library in Moscow, where he spent his late teens reading mathematics and physics for hours a day, he eventually passed teaching examinations and took a position as a mathematics instructor in the provincial town of Borovsk, and later Kaluga, where he lived the rest of his life.\n\nWorking alone, in a small wooden house, with a tin-sheet roof he used as a desk, Tsiolkovsky spent decades on the mathematics of spaceflight. In 1903 — the same year the Wright brothers first flew at Kitty Hawk — he published \"The Exploration of Cosmic Space by Means of Reaction Devices,\" containing the rocket equation Δv = u · ln(m₀/m_f) that still governs every launch from Cape Canaveral to Baikonur. He worked out liquid-fuelled rockets, multi-stage vehicles, orbital mechanics, space suits, closed-cycle life support, and space colonies — most of it before 1920, decades before the engineering existed to test any of it.\n\nHis work was almost entirely ignored in his lifetime by Western aerospace thinkers, who rediscovered similar results independently. But in the Soviet Union he became a cultural hero: Sergei Korolev, architect of Sputnik and Vostok, cited him as his foremost inspiration. Tsiolkovsky died in Kaluga in 1935, still writing, and is buried there. His equation outlived him and underwrites every spaceflight ever attempted.",
    contributions: [
      "Derived the rocket equation (1903), the fundamental constraint of spaceflight",
      "Proposed multi-stage rockets as the solution to the mass-ratio problem",
      "Designed liquid-fuel rockets, space suits, and closed-cycle life support systems decades before they were built",
      "Worked out orbital mechanics and the use of gravity assists long before they were practical",
    ],
    majorWorks: [
      "The Exploration of Cosmic Space by Means of Reaction Devices (1903)",
      "Investigations of Outer Space by Means of Reaction Devices (1911)",
      "The Aims of Astronauts (1914)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" }],
  },
  {
    slug: "simeon-denis-poisson",
    name: "Siméon Denis Poisson",
    shortName: "Poisson",
    born: "1781",
    died: "1840",
    nationality: "French",
    oneLiner: "Put angular momentum on a rigorous vector footing and codified how torque acts on it.",
    bio: "Siméon Denis Poisson was born in 1781 in Pithiviers, south of Paris, and rose through the École Polytechnique to become one of the great French mathematical physicists of the early nineteenth century. Laplace and Lagrange spotted his talent as a student; he was appointed to the faculty at nineteen and remained one of the leading figures at Polytechnique for the rest of his life.\n\nPoisson's work ranged across mechanics, elasticity, heat, electricity, and probability. In mechanics, he reformulated Lagrange's methods in ways that clarified the role of the momentum conjugate to a coordinate, and introduced the brackets that now bear his name — the direct classical ancestor of the quantum commutator. His Traité de Mécanique (1811, revised 1833) laid angular momentum on a rigorous vector footing and codified precisely how torque changes it, the statement that would become τ = dL/dt.\n\nHe was a careful, prodigious author: over three hundred memoirs during his life, including the Poisson distribution (1837), Poisson's equation for gravitational and electrostatic potentials, and the analysis of elastic bodies that introduced the quantity now called Poisson's ratio.",
    contributions: [
      "Poisson brackets — the classical precursor to quantum commutators",
      "Rigorous vector formulation of angular momentum and torque",
      "Poisson's equation for gravitational and electrostatic potentials",
      "Poisson distribution in probability theory (1837)",
      "Poisson's ratio for elastic deformation",
    ],
    majorWorks: [
      "Traité de Mécanique (1811)",
      "Recherches sur la probabilité des jugements en matière criminelle et en matière civile (1837)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "angular-momentum" }],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "rocket-equation",
    term: "Rocket equation",
    category: "concept",
    shortDefinition: "Δv = u · ln(m₀ / m_f) — the velocity a rocket gains by expelling propellant, derived from momentum conservation.",
    description: "The rocket equation, usually called the Tsiolkovsky equation, relates the velocity change Δv a rocket can produce to its exhaust velocity u and the ratio of its initial to final mass. Because the mass ratio enters logarithmically, every increment of additional Δv costs exponentially more propellant — a relation that dominates the economics and engineering of spaceflight.\n\nFor chemical rockets, exhaust velocities are limited by the energy density of the propellant to around 4.5 km/s. Reaching low Earth orbit requires roughly 9.4 km/s of Δv, which forces a mass ratio near 8: eight kilograms of propellant per kilogram of everything else. This is why launch vehicles are mostly fuel tanks, why multi-stage rockets exist, and why electric propulsion (with u ≈ 30 km/s) is so attractive for deep-space missions despite its low thrust.",
    history: "Derived by Konstantin Tsiolkovsky in 1903 in his paper \"The Exploration of Cosmic Space by Means of Reaction Devices.\" Independently rederived by Robert Esnault-Pelterie (1913) and Robert Goddard (1919).",
    relatedPhysicists: ["konstantin-tsiolkovsky", "isaac-newton"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" }],
  },
  {
    slug: "cross-product",
    term: "Cross product",
    category: "concept",
    shortDefinition: "The vector a × b perpendicular to both a and b, with magnitude |a||b|sin θ. The operation that produces torque and angular momentum.",
    description: "The cross product of two three-dimensional vectors a and b is a third vector a × b, perpendicular to the plane the two inputs span. Its magnitude equals |a||b|sin θ, where θ is the angle between them. The direction is fixed by the right-hand rule: curl the fingers from a to b, and the thumb points along a × b.\n\nUnlike the dot product (which eats two vectors and returns a scalar), the cross product preserves direction — which is exactly what's needed for rotational physics. Torque τ = r × F, angular momentum L = r × p, and the magnetic force F = qv × B are all cross products. It is why a bicycle wheel's angular momentum points along its axle, why a spinning top precesses sideways when pushed, and why electromagnetic radiation carries momentum.",
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "angular-momentum" }],
  },
  {
    slug: "central-force",
    term: "Central force",
    category: "concept",
    shortDefinition: "A force directed along the line connecting two bodies, depending only on their separation. Gravity and Coulomb attraction both qualify.",
    description: "A central force acts along the line joining two objects and depends only on the distance between them — not on the angle, not on their velocities, not on any internal state. Gravitational attraction between point masses and the Coulomb force between point charges are the canonical examples.\n\nCentral forces have a beautiful structural consequence: angular momentum about the force centre is conserved. Because the force points directly at the centre, its moment arm is zero, its torque is zero, and dL/dt = 0. Kepler's second law — planets sweep out equal areas in equal times — is exactly this fact, written a century before Newton explained it.",
    relatedPhysicists: ["isaac-newton", "johannes-kepler"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "angular-momentum" }],
  },
  {
    slug: "continuous-symmetry",
    term: "Continuous symmetry",
    category: "concept",
    shortDefinition: "A symmetry that depends on a continuous parameter — the kind Noether's theorem turns into conservation laws.",
    description: "A continuous symmetry is a transformation of a physical system that depends on a continuous parameter and leaves the dynamics unchanged. Translating an experiment by x metres is a continuous symmetry in x. Rotating it by θ radians is one in θ. Shifting the clock by Δt seconds is one in Δt. Each of these takes a continuous family of values, all of which leave the physics identical.\n\nNoether's 1918 theorem is the statement that every continuous symmetry of a Lagrangian system has a conserved quantity attached to it. Time-translation → energy. Space-translation → momentum. Rotation → angular momentum. Discrete symmetries — like reflection or a 90° rotation of a square — do not yield conservation laws in the same way. The continuity is essential; it is what lets the symmetry be built up from infinitesimal pieces that the theorem can act on.",
    relatedPhysicists: ["emmy-noether"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" }],
  },
];

function paragraphsToBlocks(text: string): Array<{ type: "paragraph"; inlines: string[] }> {
  return text
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => ({ type: "paragraph" as const, inlines: [p] }));
}

async function main() {
  const client = getServiceClient();

  console.log(`Seeding ${PHYSICISTS.length} physicists + ${GLOSSARY.length} glossary terms (en)…`);

  for (const p of PHYSICISTS) {
    const blocks = paragraphsToBlocks(p.bio);
    const meta = {
      shortName: p.shortName,
      born: p.born,
      died: p.died,
      nationality: p.nationality,
      contributions: p.contributions,
      majorWorks: p.majorWorks.map(parseMajorWork),
      relatedTopics: p.relatedTopics.map(({ branchSlug, topicSlug }) => ({ branchSlug, topicSlug })),
    };
    const payload = JSON.stringify({ title: p.name, subtitle: p.oneLiner, blocks, meta });
    const source_hash = createHash("sha256").update(payload).digest("hex");

    const { error } = await client.from("content_entries").upsert({
      kind: "physicist",
      slug: p.slug,
      locale: "en",
      title: p.name,
      subtitle: p.oneLiner,
      blocks,
      aside_blocks: [],
      meta,
      source_hash,
    });
    if (error) throw new Error(`physicist ${p.slug}: ${error.message}`);
    console.log(`  ✓ physicist ${p.slug}`);
  }

  for (const g of GLOSSARY) {
    const blocks = paragraphsToBlocks(g.description);
    const meta: Record<string, unknown> = {
      category: g.category,
      relatedPhysicists: g.relatedPhysicists ?? [],
      relatedTopics: (g.relatedTopics ?? []).map(({ branchSlug, topicSlug }) => ({ branchSlug, topicSlug })),
    };
    if (g.history) meta.history = g.history;
    const payload = JSON.stringify({ title: g.term, subtitle: g.shortDefinition, blocks, meta });
    const source_hash = createHash("sha256").update(payload).digest("hex");

    const { error } = await client.from("content_entries").upsert({
      kind: "glossary",
      slug: g.slug,
      locale: "en",
      title: g.term,
      subtitle: g.shortDefinition,
      blocks,
      aside_blocks: [],
      meta,
      source_hash,
    });
    if (error) throw new Error(`glossary ${g.slug}: ${error.message}`);
    console.log(`  ✓ glossary ${g.slug}`);
  }

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
