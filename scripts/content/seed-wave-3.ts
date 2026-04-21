// Seed Wave 3 (Module 3 · Rotation & Rigid Bodies) physicists + glossary.
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-wave-3.ts
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
    slug: "johann-bohnenberger",
    name: "Johann Gottlieb Friedrich von Bohnenberger",
    shortName: "Bohnenberger",
    born: "1765",
    died: "1831",
    nationality: "German",
    oneLiner: "Tübingen astronomer who built the first gimbal-mounted gyroscope in 1817.",
    bio: "Johann Gottlieb Friedrich von Bohnenberger was born in 1765 in the Swabian village of Simmozheim, the son of a Lutheran pastor who taught him astronomy and surveying before he had finished school. He studied theology at Tübingen, then mathematics at Göttingen under Lichtenberg and Kästner, and returned to Tübingen in 1796 as professor of mathematics and astronomy — a chair he held until his death thirty-five years later.\n\nHis place in the history of physics rests on a single instrument. In 1817, in his Beschreibung einer Maschine zur Erläuterung der Gesetze der Umdrehung der Erde um ihre Axe, he described a brass sphere mounted at the centre of three concentric gimbal rings, free to tilt and precess in any direction without the outer frame disturbing its axis. When spun up, the sphere's rotation axis stayed fixed in space while the frame was turned. It was the first modern gyroscope — thirty-five years before Foucault's independent rediscovery would give the device its name.\n\nBohnenberger did not publish a dynamical theory of his machine. He demonstrated it in lectures, sold copies to instrument collectors across Europe, and let Poisson and Laplace write the mathematics. When Foucault built his own gimbal gyroscope in 1852 to demonstrate Earth's rotation, he gave the device its modern name but acknowledged Bohnenberger as its inventor. The three-ring gimbal architecture became the canonical form for inertial reference instruments, from the V-2's primitive guidance set to the Apollo Guidance Computer's IMU.",
    contributions: [
      "Invented the first gimbal-mounted demonstration gyroscope (1817) — the physical prototype of every later gyroscopic instrument",
      "Established the three-ring gimbal as the canonical form for inertial reference devices",
      "Conducted the first rigorous trigonometric survey of the Kingdom of Württemberg",
    ],
    majorWorks: [
      "Beschreibung einer Maschine zur Erläuterung der Gesetze der Umdrehung der Erde um ihre Axe (1817)",
      "Anfangsgründe der höheren Analysis (1812)",
      "Astronomie (1811)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" }],
  },
  {
    slug: "pierre-simon-laplace",
    name: "Pierre-Simon Laplace",
    shortName: "Laplace",
    born: "1749",
    died: "1827",
    nationality: "French",
    oneLiner: "Completed Newton's programme and derived the Earth's precession from first principles.",
    bio: "Pierre-Simon Laplace was born in 1749 in Beaumont-en-Auge in Normandy, the son of a cider merchant who expected him to enter the Church. He went instead to the University of Caen to study mathematics, dropped out at nineteen with a letter of introduction to d'Alembert in Paris, and by twenty-four was professor of mathematics at the École Militaire — where he examined, with indifferent marks, a young Corsican named Napoleon Bonaparte. The political neutrality he maintained through the Revolution, Napoleon's empire, and the Bourbon restoration was so pronounced that his contemporaries coined a word for it: he was called serviceable.\n\nHis scientific project was the completion of Newton's Principia. Newton had shown that gravity governed the planets but had left open the question of whether the solar system was stable. Laplace proved, in a sequence of papers between 1773 and 1787, that the major perturbations are periodic rather than secular: the solar system is self-correcting. He collected this work into the five-volume Traité de mécanique céleste (1799–1825). When Napoleon asked him why the book never mentioned God, Laplace replied — or is said to have replied — \"Sire, I had no need of that hypothesis.\"\n\nFor rotational dynamics, his contribution is the precession calculation. In the 1780s Laplace computed, from Newtonian gravity acting on the equatorial bulge, the 26,000-year precession of the equinoxes that Hipparchus had observed in 127 BCE, and the 18.6-year nutation caused by the tilted orbit of the Moon. It was the first planetary-scale gyroscopic calculation ever carried out, and it remains essentially correct. He also gave probability its modern analytical foundations in Théorie analytique des probabilités (1812), proving the central limit theorem and formalising Bayes' rule.",
    contributions: [
      "Proved the dynamical stability of the solar system",
      "First derivation of Earth's 26,000-year axial precession and 18.6-year nutation from Newtonian gravity",
      "Founded the analytical theory of probability, proving the central limit theorem",
      "Developed the Laplace transform, Laplace equation, and spherical harmonics",
    ],
    majorWorks: [
      "Traité de mécanique céleste (1799)",
      "Exposition du système du monde (1796)",
      "Théorie analytique des probabilités (1812)",
      "Mémoire sur la précession des équinoxes (1777)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "milutin-milankovic",
    name: "Milutin Milanković",
    shortName: "Milanković",
    born: "1879",
    died: "1958",
    nationality: "Serbian",
    oneLiner: "Serbian mathematician who turned the Earth's orbital wobbles into a quantitative theory of the ice ages.",
    bio: "Milutin Milanković was born in 1879 in Dalj, then part of Austria-Hungary, into a Serbian family. He trained as a civil engineer in Vienna, specialising in reinforced-concrete structures, but his intellectual ambition was always astronomical: he wanted a mathematical climatology — a theory that could predict, from first principles, the amount of sunlight reaching each latitude of the Earth in each season, at any point in the geologic past.\n\nHe took up a professorship of applied mathematics at the University of Belgrade in 1909 and began the long calculation in 1912. When WWI broke out in 1914, Milanković — a Serbian citizen caught in Austria-Hungary while visiting his home village on his honeymoon — was arrested and interned as a prisoner of war in Budapest. Through the intervention of colleagues, he was granted working access to the library of the Hungarian Academy of Sciences, and he spent the four years of his internment computing the insolation curves by hand. His 1920 Théorie mathématique des phénomènes thermiques produits par la radiation solaire laid out the framework; the 1941 Canon of Insolation completed it.\n\nHis theory was initially received with scepticism — the paleoclimate data of the 1940s could not yet test it. Vindication came decades after his death, when deep-sea sediment cores and Antarctic ice cores from the 1970s onward revealed glacial-interglacial cycles whose spectrum matched Milanković's orbital frequencies almost exactly. The three cycles — eccentricity (~100 kyr), obliquity (~41 kyr), and precession (~23 kyr) — are now known as Milankovitch cycles, and they are the astronomical foundation of modern paleoclimatology.",
    contributions: [
      "Quantitative theory of insolation as a function of latitude, season, and orbital parameters",
      "Identification of precession, obliquity, and eccentricity as the three astronomical drivers of long-term climate",
      "Computation of the 600,000-year insolation history underpinning the modern ice-age theory",
    ],
    majorWorks: [
      "Théorie mathématique des phénomènes thermiques produits par la radiation solaire (1920)",
      "Kanon der Erdbestrahlung und seine Anwendung auf das Eiszeitenproblem (1941)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" }],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "rolling-without-slipping",
    term: "Rolling without slipping",
    category: "concept",
    shortDefinition: "The kinematic constraint v = ω·R that locks a wheel's linear velocity to its rotation so the contact point is momentarily at rest.",
    description: "When a wheel, ball, or cylinder rolls along a surface without its contact patch sliding, the instantaneous velocity of the point touching the ground is zero. The rest of the body moves as a combination of translation of the centre of mass at v_CM and rotation about that centre at angular velocity ω. Locking those motions together gives the constraint v_CM = ω·R, where R is the radius. Differentiating in time yields a_CM = α·R, linking linear and angular acceleration.\n\nThe constraint couples Newton's second law for translation to its rotational counterpart τ = I·α, producing a_CM = F / (m + I/R²) for a body pushed at its axle. Because I depends on how mass is distributed, shapes with mass concentrated at their rim (hoops, hollow cylinders) accelerate more slowly than shapes with mass near the axis (solid cylinders, spheres). This is why a solid ball beats a hollow one down a ramp of equal mass and radius.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
      { branchSlug: "classical-mechanics", topicSlug: "moment-of-inertia" },
    ],
  },
  {
    slug: "perpendicular-axis-theorem",
    term: "Perpendicular axis theorem",
    category: "concept",
    shortDefinition: "For a planar body, I_z = I_x + I_y — the moment about an axis perpendicular to the plane equals the sum of moments about two in-plane axes.",
    description: "For any planar (thin, flat) body lying in the xy-plane, the moment of inertia about the z-axis perpendicular to the plane equals the sum of moments about the two in-plane axes: I_z = I_x + I_y. This follows directly from the definition I = ∫ r² dm, noting that for a point in the plane r² = x² + y².\n\nThe theorem is a shortcut: compute the easy-in-plane moments, add them, and you have the harder perpendicular-axis moment for free. It only applies to planar bodies — a three-dimensional shape does not in general satisfy it. Combined with the parallel-axis theorem (for shifting to off-centre axes), it handles most textbook moment-of-inertia problems without integration.",
    relatedPhysicists: ["leonhard-euler"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "moment-of-inertia" }],
  },
  {
    slug: "inertial-navigation",
    term: "Inertial navigation",
    category: "concept",
    shortDefinition: "Navigation by integrating a vehicle's own rotations and accelerations — no external reference needed.",
    description: "Inertial navigation is the art of knowing where you are, and which way you are pointing, using nothing but instruments carried onboard the vehicle itself. Three orthogonal gyroscopes measure the vehicle's rotation rate about each axis; three orthogonal accelerometers measure its acceleration. A computer integrates the rotation rates to keep track of orientation, and integrates the accelerations twice to keep track of position. No radio, no satellite, no landmark is needed after the initial alignment.\n\nThe principle follows directly from τ = dL/dt: a gyroscope's spin axis does not change direction in the absence of external torque, so a spinning wheel on gimbals is a direction memory that survives any acceleration of its carrier. The first operational inertial navigation system flew on the V-2 rocket in 1944; the Apollo Guidance Computer's IMU flew six crews to the Moon; modern airliners use ring laser gyroscopes with no moving parts; and the MEMS gyroscope in every smartphone is the same concept reduced to a few cubic millimetres of silicon.",
    relatedPhysicists: ["leon-foucault", "johann-bohnenberger", "elmer-sperry"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" }],
  },
  {
    slug: "precession-of-equinoxes",
    term: "Precession of the equinoxes",
    category: "phenomenon",
    shortDefinition: "The slow 26,000-year conical sweep of Earth's rotation axis, which makes the equinoxes drift through the zodiac.",
    description: "Earth is an oblate gyroscope: it spins, it has an equatorial bulge, and the Sun and Moon pull on that bulge from a direction tilted 23.5° from the spin axis. The net gravitational torque makes the axis precess — it traces a slow cone about the ecliptic pole with a period of roughly 25,770 years. As the axis swings, the intersection points of the celestial equator with the ecliptic — the equinoxes — drift westward through the zodiac at about 50 arcseconds per year.\n\nHipparchus noticed the drift around 127 BCE by comparing his own stellar coordinates to those Timocharis had catalogued 150 years earlier. The pole star changes with the cycle: Thuban in 3000 BCE, Polaris now, Vega around 14,000 CE. Newton gave the first physical explanation in the Principia (1687); d'Alembert (1749) and Laplace (1777) made the calculation rigorous.",
    history: "Discovered by Hipparchus c. 127 BCE. First dynamically explained by Newton (1687). Full analytical treatment by d'Alembert (1749) and Laplace (1777).",
    relatedPhysicists: ["hipparchus", "isaac-newton", "jean-d-alembert", "pierre-simon-laplace"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" }],
  },
  {
    slug: "obliquity",
    term: "Obliquity",
    category: "concept",
    shortDefinition: "The tilt angle between a planet's rotation axis and the perpendicular to its orbital plane.",
    description: "Obliquity is the angle between a planet's spin axis and the normal to its orbital plane. Earth's is currently 23.44° and oscillates between about 22.1° and 24.5° over a 41,000-year cycle, slowly damped by tidal friction. Mars has an obliquity of 25.2° that varies much more wildly because it lacks a large moon to stabilise it; Venus is nearly upside-down at 177°; Uranus lies on its side at 98°.\n\nObliquity controls seasons: large obliquity means extreme seasonal temperature differences between summer and winter hemispheres. Over geologic time, the slow modulation of Earth's obliquity combines with eccentricity and precession to drive the Milankovitch cycles — the astronomical pacing of the ice ages.",
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" }],
  },
  {
    slug: "milankovitch-cycles",
    term: "Milankovitch cycles",
    category: "phenomenon",
    shortDefinition: "The three astronomical cycles — eccentricity, obliquity, precession — that drive Earth's ice ages on 10,000- to 100,000-year timescales.",
    description: "Earth's orbit and spin axis evolve slowly under the gravitational perturbations of the other planets. Three cycles dominate: orbital eccentricity varies with periods near 100,000 and 400,000 years; axial obliquity oscillates between about 22.1° and 24.5° on a 41,000-year period; and axial precession — the 26,000-year cone of the rotation axis — shifts which hemisphere receives most sunlight at perihelion.\n\nTogether, these three modulate the total solar energy arriving at high northern latitudes during summer, the quantity Milutin Milanković identified as the key driver of glacial advance and retreat. Deep-sea sediment cores and Antarctic ice cores reveal glacial-interglacial cycles whose spectral peaks match the Milankovitch frequencies almost exactly, confirming his theory more than thirty years after his death.",
    history: "Proposed quantitatively by Milutin Milanković while interned as a WWI POW in Budapest (1914–1918); vindicated by Hays, Imbrie & Shackleton's 1976 analysis of deep-sea sediment cores.",
    relatedPhysicists: ["milutin-milankovic"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" }],
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
