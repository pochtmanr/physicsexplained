// Seed Wave 6 (Module 4 · Non-inertial frames + gap-closure glossary).
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-wave-6.ts
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
  const match = s.match(/^(.+?)\s*\(([^)]+)\)\s*(—\s*(.+))?$/);
  if (match) return { title: match[1].trim(), year: match[2].trim(), description: match[4]?.trim() ?? "" };
  return { title: s, year: "", description: "" };
}

const PHYSICISTS: PhysicistSeed[] = [
  {
    slug: "gaspard-gustave-de-coriolis",
    name: "Gaspard-Gustave de Coriolis",
    shortName: "Coriolis",
    born: "1792",
    died: "1843",
    nationality: "French",
    oneLiner: "French engineer who, in 1835, named the fictitious force that makes weather rotate and pendulums drift.",
    bio: `Gaspard-Gustave de Coriolis was born in Paris in 1792, the son of a Royalist officer who fled the Revolution to Nancy when the boy was still small. He entered the École Polytechnique in 1808 — second in his class — and the École des Ponts et Chaussées the following year, training as a civil engineer. He taught mechanics at the Polytechnique for the rest of his life, took the chair of machine theory at the École Centrale in 1832, and served as director of studies at the Polytechnique from 1838 until his death five years later.

His public legacy is in the technical meaning he gave to three words. In 1829's Du Calcul de l'Effet des Machines he coined travail ("work") as the integral of force over distance, fixing in place the definition every physicist still uses. He replaced Leibniz's vis viva with the modern kinetic energy ½mv², halving the prefactor and putting energy bookkeeping on a rational footing. And in 1835's Sur les équations du mouvement relatif des systèmes de corps he derived, for the first time, the complete equations of motion in a rotating reference frame — identifying the two non-inertial acceleration terms we now call centrifugal and Coriolis.

Coriolis was explicit that these forces were computational conveniences, not real physical interactions. His interest was industrial: waterwheels, turbines, and the billiard-table kinematics that appear in his last book, Théorie Mathématique des Effets du Jeu de Billard (1835). He never connected his mathematical result to weather or ballistics; that leap came decades later, when meteorologists studying trade winds and artillery officers calculating long-range gunnery rediscovered his equations and realised they explained what they had been observing. The force that now bears his name was invented to balance an accounting equation in rotating machinery and only afterwards found the planet it belonged to.`,
    contributions: [
      "Derived the complete equations of motion in a rotating reference frame (1835)",
      "Identified and named the centrifugal and Coriolis fictitious accelerations",
      "Introduced the modern definitions of mechanical work (travail) and kinetic energy (½mv²)",
      "Published the first mathematical theory of billiards as a problem in rigid-body dynamics",
    ],
    majorWorks: [
      "Du Calcul de l'Effet des Machines (1829) — introduced work and kinetic energy",
      "Sur les équations du mouvement relatif des systèmes de corps (1835) — introduced centrifugal and Coriolis forces",
      "Théorie Mathématique des Effets du Jeu de Billard (1835)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "angular-velocity",
    term: "Angular velocity",
    category: "concept",
    shortDefinition: "Rate of rotation, measured in radians per second: ω = dθ/dt. A vector aligned with the rotation axis (right-hand rule).",
    description: `Angular velocity ω describes how fast something rotates. For a point moving in a circle of radius r, the linear speed and angular speed are locked by v = ωr — a single revolution covers 2πr in 2π radians. The connection is geometric, not dynamical: it holds whether the rotation is caused by gravity, a motor, a spring, or nothing at all.

Angular velocity carries a direction as well as a magnitude. By convention the vector ω points along the rotation axis, with sign given by the right-hand rule: curl the fingers of your right hand in the direction of rotation, and the thumb points along ω. For planar motion (a spinning record, a wheel on a car) the vector reduces to a single signed scalar along the axis perpendicular to the plane.

Newton's laws in their most familiar form (F = ma) refer to linear motion, but a parallel set of equations governs rotation: τ = Iα relates torque to angular acceleration exactly the way F = ma relates force to linear acceleration. Angular velocity is the rotational cousin of linear velocity, and most of the machinery of circular motion — centripetal acceleration ω²r, rotational kinetic energy ½Iω², angular momentum Iω — lives in its shadow.`,
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "circular-motion" },
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "centrifugal-force",
    term: "Centrifugal force",
    category: "concept",
    shortDefinition: "The outward fictitious force that appears in a rotating reference frame, with magnitude Ω²r.",
    description: `Centrifugal force is not a real force. It is a bookkeeping term that appears when you write Newton's second law in a rotating frame of reference. The true force on a body moving in a circle points inward (the centripetal force); an observer rotating with the body, however, sees the body apparently pushed outward, and to make Newton's laws work from that observer's point of view you add a fictitious outward force of magnitude mΩ²r. That force is called centrifugal.

You feel something centrifugal-like every time a car takes a sharp turn. In the road's frame, the only real horizontal force on you is the inward push of your seat belt and the seat's friction. In your own frame — which is rotating with the car — you feel as if you are being thrown outward, because your body wants to continue in a straight line and the car is pulling you off that line. Call that sensation centrifugal if you like; it is the fictitious force needed to explain your apparent acceleration from inside the turning car.

The same accounting trick explains the slightly flattened shape of the Earth (spinning Earth + effective centrifugal potential makes the equator bulge), the water rising up the walls of a spinning bucket (Newton's famous thought experiment), and why a space station has to spin to simulate gravity: in the rotating frame of the station, centrifugal force pulls you toward the outer wall, and that becomes your local "down."`,
    history: `Christiaan Huygens introduced the Latin phrase vis centrifuga (fleeing-the-center force) in his 1659 manuscript De Vi Centrifuga, computing its magnitude as mΩ²r nearly thirty years before Newton's Principia. Newton reused the term but reconceived centripetal (seeking-the-center) as the physically real force; "centrifugal" survived only as the fictitious counterpart in rotating frames.`,
    relatedPhysicists: ["christiaan-huygens", "gaspard-gustave-de-coriolis"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
  {
    slug: "coriolis-force",
    term: "Coriolis force",
    category: "concept",
    shortDefinition: "The fictitious force -2m Ω×v that deflects moving objects in a rotating reference frame.",
    description: `The Coriolis force is the second of the two fictitious forces that appear when Newton's laws are written in a rotating reference frame. Unlike centrifugal force, which depends only on position, the Coriolis force depends on velocity: its direction is perpendicular to both the rotation axis Ω and the velocity v. On a rotating planet, an object moving north in the northern hemisphere gets deflected east; moving south, west. The deflection is the same size regardless of direction.

The magnitude is 2mΩv·sin(latitude) — proportional to the planet's rotation rate, the object's speed, and the sine of latitude. At the equator the Coriolis deflection vanishes. At the poles it is maximal. Trade winds, hurricane spin directions, the rotation of Foucault pendulums, the drift of long-range artillery, and the systematic deflection of freely falling objects all trace back to this one term.

Because the Coriolis force is fictitious — an artifact of describing physics from a rotating observer's perspective — it vanishes in an inertial frame. From space, a hurricane is simply air with conserved angular momentum flowing in toward a low-pressure center; the spin is the consequence. From the ground, it looks like an invisible lateral push. Both descriptions are correct. Which is simpler depends on whether you want to compute the orbit of a satellite or forecast tomorrow's weather.`,
    history: `Gaspard-Gustave de Coriolis derived the force in 1835 while analysing rotating machinery, not weather. Meteorologists rediscovered it for atmospheric circulation later in the century; the name "Coriolis force" for the meteorological effect was not standard until the 1920s.`,
    relatedPhysicists: ["gaspard-gustave-de-coriolis", "leon-foucault"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
  {
    slug: "forced-oscillation",
    term: "Forced oscillation",
    category: "concept",
    shortDefinition: "An oscillator being driven by a periodic external force, settling into a steady state at the drive frequency.",
    description: `A forced oscillator is any oscillating system being pushed by an external periodic force — a child on a swing getting nudged in time, an electrical circuit fed a sine-wave voltage, a mass on a spring jostled by a motor. The governing equation adds a driving term F₀·cos(ω_d·t) to the homogeneous oscillator equation, so the motion is a sum of two pieces: a transient that decays away at the system's natural frequency, and a steady state that oscillates forever at the drive frequency.

Which piece dominates depends on how long you watch and how much damping the system has. Over many cycles, damping kills the transient and only the steady state survives. The system's own natural frequency is no longer audible in the motion; the driver dictates everything.

The amplitude of the steady state depends on how close the drive frequency ω_d is to the system's natural frequency ω₀. Far from resonance the response is small; near resonance it can become enormous. This is how radios tune to stations, how MRI machines excite specific nuclear spins, and how a shattered wine glass meets its end.`,
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "damped-and-driven-oscillations" },
    ],
  },
  {
    slug: "amplitude-response",
    term: "Amplitude response",
    category: "concept",
    shortDefinition: "The steady-state amplitude of a driven oscillator as a function of drive frequency — peaked near resonance.",
    description: `The amplitude response of a driven damped oscillator is the function A(ω_d) giving the steady-state oscillation amplitude for a fixed driving force F₀ as the drive frequency ω_d is swept. For a linear second-order oscillator the formula is

  A(ω_d) = F₀ / √[(ω₀² − ω_d²)² + γ²ω_d²]

where ω₀ is the natural frequency and γ is the damping rate. The function peaks near ω_d ≈ ω₀, with a peak height proportional to the quality factor Q = ω₀/γ and a peak width inversely proportional to Q. High-Q systems (a quartz crystal) have tall, narrow peaks; low-Q systems (a shock absorber) have broad, shallow ones.

Amplitude response is the everyday face of resonance. It explains why a violin string sings sweetly at some pitches and hardly at all at others, why a well-tuned AM radio rejects every station except one, and why the Tacoma Narrows bridge found a wind frequency that matched its natural mode and destroyed itself. Engineering a system to resonate strongly (MRI, radio, laser) means maximising Q at the desired frequency; engineering it to survive (buildings, bridges, electronics) means damping any resonance that could be excited by the environment.`,
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "damped-and-driven-oscillations" },
    ],
  },
  {
    slug: "moment-arm",
    term: "Moment arm",
    category: "concept",
    shortDefinition: "The perpendicular distance from a rotation axis to the line of action of a force. Torque = force × moment arm.",
    description: `The moment arm is the perpendicular distance from an axis of rotation to the line along which a force acts. Torque — the rotational analogue of force — is equal to force times moment arm. A wrench works because applying a small force far from the bolt produces a large torque; a door handle is mounted opposite the hinge because moving the handle in close would demand a stronger push to swing the door.

Geometrically, the moment arm is what is left of a force's geometric relationship to the axis after you strip away any part of the force pointing along the line connecting them. Only the perpendicular component rotates; the parallel component just tries to translate the rigid body's center of mass (a push that does no rotational work). This is why a bolt cannot be loosened by pulling directly along the wrench handle toward the bolt — there is no moment arm, and no torque, no matter how hard you pull.

For a rolling body on an incline, the moment arm appears in a subtle way: static friction at the contact point provides the torque that spins the body up to match its accelerating translation. The contact point sits at radius R from the wheel's center, so friction's moment arm about the axle is R. This is the geometric reason rolling KE depends on the shape factor I/(mR²) rather than on R alone — R sets both the moment arm and the lever length on both sides of Newton's second law for rotation, and the ratio is what matters.`,
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "rolling-motion" },
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
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
