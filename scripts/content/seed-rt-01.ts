// Seed RT §01 SR Foundations + §02 SR Kinematics
// 1 physicist (Albert Michelson, combined-with-Morley) + 10 new structural glossary terms
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-rt-01.ts
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

function paragraphsToBlocks(text: string): Array<{ type: "paragraph"; inlines: string[] }> {
  return text
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => ({ type: "paragraph" as const, inlines: [p] }));
}

const PHYSICISTS: PhysicistSeed[] = [
  {
    slug: "albert-michelson",
    name: "Albert Abraham Michelson",
    shortName: "Michelson",
    born: "1852",
    died: "1931",
    nationality: "American",
    oneLiner: "German-born American physicist, first US Nobel laureate in science (1907). With Edward Morley, used a precision interferometer in 1887 to measure Earth's motion through the luminiferous aether — and got a null result every time. The negative result they could not explain became Einstein's positive postulate twenty-four years later.",
    bio: `Albert Abraham Michelson was born in Strelno, Prussia (now Strzelno, Poland), in 1852, the son of a Jewish merchant family who emigrated to Murphys Camp in California's Gold Country in 1855 and later San Francisco. He won an at-large appointment to the US Naval Academy from President Ulysses S. Grant in 1869, graduated in 1873, and was retained as an instructor in physics and chemistry. Stationed at Annapolis, he built his first ether-drift apparatus in 1881 — a single-arm interferometer that yielded an inconclusive null. To pursue the experiment with greater precision, he resigned his commission, studied in Berlin under Helmholtz, and accepted a chair of physics at the Case School of Applied Science in Cleveland.

In Cleveland from 1885, Michelson partnered with Edward Williams Morley, a chemist and experimentalist of remarkable mechanical patience at neighbouring Western Reserve University. Together they built the Michelson-Morley apparatus: an interferometer floating on a stone slab on a pool of mercury, isolating it from vibration; two perpendicular optical arms 11 metres long folded by mirrors; and a sodium-flame source whose monochromatic light produced an interference fringe pattern visible through a telescope. They turned the apparatus 90° in steady increments and watched for fringe shifts. None came. They published the result in 1887 in the American Journal of Science. The aether — the luminiferous medium that all of nineteenth-century optics had assumed — refused to make itself measurable. Lorentz and FitzGerald independently proposed that real material contraction in the aether might explain the null; Einstein's 1905 paper would discard the aether entirely and elevate the constancy of c to a postulate.

Michelson went on to a Nobel Prize in 1907 — the first awarded to an American in science — for his measurements of the speed of light, which he progressively pinned down to a precision of one part in ten thousand using rotating-mirror techniques. He also pioneered the Michelson stellar interferometer, which in 1920 enabled the first direct measurement of a stellar diameter (Betelgeuse, 0.05″). The Michelson interferometer principle would reappear a century later in LIGO, the gravitational-wave observatory whose 4-kilometre arms sense displacements smaller than 10⁻¹⁸ m. Michelson died in Pasadena in 1931, working until the end on his final speed-of-light measurement, conducted in a kilometre-long evacuated tube at the Irvine Ranch.`,
    contributions: [
      "1887 Michelson-Morley experiment with Edward Morley — null result for aether-wind effect; the empirical foundation for special relativity.",
      "First American Nobel laureate in science (1907), for optical precision instruments and the metrological measurements of c.",
      "Speed-of-light measurements progressively refined from 299,853 km/s (1879) to 299,796±4 km/s (1926, Mt Wilson–San Antonio Peak).",
      "Michelson stellar interferometer — first direct measurement of stellar angular diameters (Betelgeuse, 1920).",
      "Interferometric metrology defining the metre in terms of optical wavelengths — pre-laser standard later realized in 1960.",
    ],
    majorWorks: [
      "On the Relative Motion of the Earth and the Luminiferous Ether (1887) — joint paper with Edward Morley reporting the null result that became special relativity's empirical foundation.",
      "Light Waves and Their Uses (1903) — popular Lowell Lectures volume; the Michelson interferometer principle for a non-specialist audience.",
      "Studies in Optics (1927) — late synthesis of his interferometric methods, written in his last years at Caltech.",
    ],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "michelson-morley" },
      { branchSlug: "relativity", topicSlug: "einsteins-two-postulates" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // RT §01 ────────────────────────────────────────────────────────────────
  {
    slug: "galilean-invariance",
    term: "Galilean invariance",
    category: "concept",
    shortDefinition: "The principle that the laws of mechanics take the same form in all inertial frames related by Galilean transformations — uniform translation at constant velocity. The pre-relativistic statement of relativity, valid for low speeds.",
    description: `Galilean invariance is the principle that the laws of classical mechanics — Newton's three laws, conservation of momentum, the equations of motion of a free particle — hold in identical form in every inertial frame related to another by a Galilean transformation x' = x − vt, t' = t. Galileo Galilei articulated the idea in 1632 in his *Dialogue Concerning the Two Chief World Systems*, with the famous "ship's cabin" argument: a person sealed below decks performing mechanics experiments cannot tell from those experiments alone whether the ship is at rest in the harbour or sailing at constant velocity in calm water. Newton's first law promotes this observational symmetry to a structural feature of the theory: an inertial frame is defined as one in which a force-free particle moves in a straight line at constant speed, and Newton's second law F = ma holds in identical form in any such frame.

The Galilean transformation preserves time as a universal scalar (t' = t in every frame), preserves Euclidean distances at any single instant, and adds velocities by simple vector addition: u' = u − v. It is the symmetry group of pre-relativistic mechanics. The trouble is that Maxwell's equations are *not* invariant under Galilean transformations — the wave equation derived from them yields a propagation speed c set by the constants ε₀ and μ₀, with no reference to a frame. Either Maxwell is wrong (no), or the Galilean transformation is wrong (yes, in the limit of high relative velocity), or there is a privileged "aether frame" in which Maxwell holds and other frames pick up corrections (the consensus 1860s–1900s, demolished by Michelson-Morley). The resolution is the Lorentz transformation, which reduces to the Galilean transformation in the limit β → 0.`,
    relatedPhysicists: ["galileo-galilei", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "galilean-relativity" },
      { branchSlug: "relativity", topicSlug: "einsteins-two-postulates" },
    ],
  },
  {
    slug: "aether-luminiferous",
    term: "Luminiferous aether",
    category: "concept",
    shortDefinition: "The hypothetical all-pervasive medium that nineteenth-century physics posited as the substrate in which light waves propagate. Searched for via interferometry from 1881 onward; never detected. Discarded by Einstein's 1905 special-relativity paper.",
    description: `The luminiferous aether was the hypothetical all-pervasive medium in which light waves were thought to propagate, by analogy with sound waves in air or water waves in water. The wave theory of light (Young 1801, Fresnel 1816, confirmed via Maxwell's electromagnetic-wave prediction in 1862) seemed to require a medium: a wave is a periodic disturbance of *something*, and electromagnetic waves were no exception. The aether was therefore postulated as a continuous, perfectly elastic, massless solid filling all of space — solid because transverse waves (which light is, per polarisation experiments) require shear restoring forces, and rigid enough to support oscillations at light's frequencies, yet offering no measurable drag on planetary motion. It was an uncomfortable theoretical object from the start.

If the aether existed, the Earth's orbital motion at 30 km/s should produce an "aether wind" detectable by precise comparison of light-propagation times along orthogonal arms. The 1887 Michelson-Morley experiment did exactly this and got a null result — no aether wind to within their precision (a few parts per million of 30 km/s). Lorentz and FitzGerald independently proposed length contraction as a real-material aether effect to explain the null; Einstein's 1905 paper *On the Electrodynamics of Moving Bodies* discarded the aether outright, replacing it with two postulates (the principle of relativity and the constancy of c) from which length contraction and time dilation followed as kinematic consequences requiring no medium. The aether was never detected. The word survives in physics today only as the historical name for the conceptual landscape that special relativity replaced.`,
    relatedPhysicists: ["albert-michelson", "james-clerk-maxwell", "hendrik-antoon-lorentz"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "michelson-morley" },
      { branchSlug: "relativity", topicSlug: "maxwell-and-the-speed-of-light" },
      { branchSlug: "relativity", topicSlug: "einsteins-two-postulates" },
    ],
  },
  {
    slug: "two-postulates",
    term: "The two postulates",
    category: "concept",
    shortDefinition: "Einstein's 1905 axiomatic foundation for special relativity: (1) the laws of physics take the same form in all inertial frames; (2) the speed of light c is the same in all inertial frames, independent of the motion of the source. Everything else follows.",
    description: `Einstein's two postulates of special relativity, stated in the opening pages of *On the Electrodynamics of Moving Bodies* (1905), are: (1) the **principle of relativity** — the laws of physics take the same form in every inertial frame, with no preferred frame and no observable absolute rest; (2) the **constancy of the speed of light** — the speed of light in vacuum c has the same numerical value in every inertial frame, independent of the motion of the source or observer. Postulate (1) generalises Galileo's mechanical relativity to all of physics, including electrodynamics. Postulate (2) elevates the empirical fact of Michelson-Morley's null result to an axiom, and is the genuinely new content: it is incompatible with the Galilean velocity-addition rule, and forces the kinematics to be Lorentzian rather than Galilean.

From these two postulates alone, every kinematic result of special relativity follows by short algebra: the relativity of simultaneity, time dilation, length contraction, the Lorentz transformation, the velocity-addition formula, the relativistic Doppler effect, and the energy-momentum relation E² = (pc)² + (mc²)². The dynamic content of the theory — that mass and energy are equivalent, that the speed of light is the asymptotic limit of any massive particle's speed, that the spacetime interval is invariant under boosts — is similarly derivable. Einstein's reformulation made the aether unnecessary by treating its alleged effects as artefacts of a clinging-to-Galilean perspective; the moment one accepts (2) as a postulate rather than a puzzle, the entire structure becomes geometrically natural.`,
    relatedPhysicists: ["albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "einsteins-two-postulates" },
    ],
  },
  {
    slug: "simultaneity-relative",
    term: "Relativity of simultaneity",
    category: "concept",
    shortDefinition: "The result that two spatially-separated events judged simultaneous in one inertial frame are not simultaneous in any other frame moving relative to the first. The deepest break with Newtonian intuition; the geometric content of the Lorentz transformation's time-mixing.",
    description: `The relativity of simultaneity is the result that two events that occur at different spatial locations and are judged simultaneous in one inertial frame are *not* simultaneous in any other inertial frame moving relative to the first. It is a direct consequence of the constancy of c: if two events at positions x_A and x_B emit light flashes that reach the midpoint x_M = (x_A + x_B)/2 at the same instant in frame S, then in frame S' moving at velocity v relative to S, the midpoint is itself moving, and the light from A and B reaches it at *different* instants. The two events therefore cannot be simultaneous in S' — there is no frame-independent answer to "did A happen at the same time as B?" once the events are spatially separated.

Quantitatively, if events A and B are simultaneous in S with spatial separation Δx along the boost direction, then in S' moving at velocity v their time difference is Δt' = −γ v Δx / c². The sign of Δt' depends on the sign of v: an observer moving in the +x direction sees the rear event (smaller x) precede the front event; an observer moving in the −x direction sees the reverse. Hermann Minkowski's 1908 reformulation made the geometric content explicit: simultaneity slices in spacetime are space-like hyperplanes orthogonal to a particular timelike direction (the time axis of a particular frame), and rotating that timelike direction (i.e. boosting to another frame) tilts the simultaneity slice. There is no privileged absolute "now" — there are only frame-specific simultaneity slices, each as valid as the others. This is the deepest break special relativity makes with Newtonian intuition, and the geometric content of the Lorentz transformation's time-mixing.`,
    relatedPhysicists: ["albert-einstein", "hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "relative-simultaneity" },
      { branchSlug: "relativity", topicSlug: "the-lorentz-transformation" },
    ],
  },
  // RT §02 ────────────────────────────────────────────────────────────────
  {
    slug: "time-dilation",
    term: "Time dilation",
    category: "concept",
    shortDefinition: "The relativistic effect that a clock measured by an inertial observer in motion ticks slower than an identical clock at rest in that observer's frame, by the Lorentz factor γ = 1/√(1 − β²). Symmetric between frames; not an illusion; verified by muon decay, atomic clocks, and GPS.",
    description: `Time dilation is the relativistic kinematic effect that a clock measured by an observer in inertial motion ticks slower than an identical clock at rest in that observer's frame, by the Lorentz factor γ = 1/(1 − β²)^(1/2), where β = v/c. A proper time interval Δτ measured between two events on a single clock's worldline is related to the coordinate time interval Δt measured by an observer who sees that clock moving at velocity v by Δt = γ Δτ. The effect is symmetric: A's clock runs slow as measured from B's frame, *and* B's clock runs slow as measured from A's frame. There is no contradiction because the two measurements use different simultaneity slices to compare ticks — the relativity of simultaneity is what makes the symmetry consistent.

Time dilation is not an illusion or a measurement artefact. The 1941 Rossi-Hall cosmic-ray muon-decay experiment was the first direct verification: muons created at altitude by cosmic-ray showers and observed at sea level survive the trip in numbers far exceeding what their 2.2 μs proper lifetime would allow at non-relativistic speeds, because their lab-frame lifetime is dilated by γ ≈ 30 at typical cosmic-ray energies. Hafele-Keating (1971) flew caesium clocks around the world east and west on commercial airliners and measured the predicted nanosecond-level deviations from ground clocks. The Global Positioning System's atomic-clock corrections include a special-relativistic time-dilation contribution of roughly −7 μs/day (orbital motion, blue-shifting on-board time relative to the ground); without it, GPS positioning would drift by about 2 km in the first 24 hours of operation.`,
    relatedPhysicists: ["albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "time-dilation" },
      { branchSlug: "relativity", topicSlug: "the-lorentz-transformation" },
    ],
  },
  {
    slug: "length-contraction",
    term: "Length contraction",
    category: "concept",
    shortDefinition: "The relativistic effect that an object of proper length L₀ measured in its rest frame appears contracted to L = L₀/γ along the direction of motion when measured by an observer in any inertial frame moving relative to the object. Symmetric; not a material compression; perpendicular dimensions unchanged.",
    description: `Length contraction is the relativistic kinematic effect that an object of proper length L₀ measured in its own rest frame is measured by any inertial observer moving at velocity v along its long axis to have a contracted length L = L₀/γ, where γ = 1/(1 − β²)^(1/2) is the Lorentz factor and β = v/c. Dimensions perpendicular to the direction of motion are unchanged. The contraction is symmetric: A's metre stick is contracted as measured from B's frame, *and* B's metre stick is contracted as measured from A's frame. There is no contradiction because the two measurements use different simultaneity slices — to measure the length of a moving object requires marking the positions of its endpoints *at the same time in the observer's frame*, and "at the same time" is frame-dependent.

Length contraction was first proposed by George FitzGerald (1889) and Hendrik Lorentz (1892) as a physical contraction in the aether — a real shortening of material bodies caused by their motion through the medium, just enough to explain the Michelson-Morley null. Einstein's 1905 reformulation made it instead a geometric kinematic consequence of the Lorentz transformation, with no aether and no material compression: nothing physical happens to the object; its proper length in its own frame is unchanged; only the *measured* length in another frame contracts. Operationally, length contraction explains the §11.4 magnetism-as-relativistic-electrostatics result: in the rest frame of a current's drift electrons, the lattice of positive ions has its spacing contracted, producing a net positive line density and a Coulomb attraction that, in the lab frame, looks like a magnetic force.`,
    relatedPhysicists: ["albert-einstein", "hendrik-antoon-lorentz"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "length-contraction" },
      { branchSlug: "relativity", topicSlug: "the-lorentz-transformation" },
    ],
  },
  {
    slug: "lorentz-transformation",
    term: "Lorentz transformation",
    category: "concept",
    shortDefinition: "The linear coordinate transformation between two inertial frames in special relativity. For a boost along +x at velocity v: t' = γ(t − vx/c²), x' = γ(x − vt), y' = y, z' = z. Replaces the Galilean transformation; reduces to it in the limit β → 0.",
    description: `The Lorentz transformation is the linear coordinate transformation between two inertial frames S and S' in special relativity, where S' moves at velocity v relative to S along the +x direction. The transformation reads t' = γ(t − vx/c²), x' = γ(x − vt), y' = y, z' = z, where γ = 1/(1 − β²)^(1/2) is the Lorentz factor and β = v/c. Time and the spatial coordinate along the boost direction mix linearly; perpendicular coordinates are unchanged. The transformation preserves the spacetime interval ds² = c²dt² − dx² − dy² − dz² (the Minkowski-metric scalar) and reduces to the Galilean transformation t' = t, x' = x − vt in the limit β → 0. From it follow time dilation (set Δx = 0 in S, get Δt' = γ Δt), length contraction (require simultaneity in S', solve for Δx in S), and the relativistic velocity-addition formula u' = (u − v)/(1 − uv/c²).

Hendrik Antoon Lorentz, Dutch, 1853–1928 — distinct from Ludvig Lorenz (no T), Danish, 1829–1891, the radiation-gauge physicist of EM §11.5. The two are routinely confused because their names are nearly identical and both worked on classical electromagnetism. Hendrik Lorentz derived the transformation in 1899–1904 as a mathematical device that left Maxwell's equations covariant, treating the local time t' as an auxiliary parameter rather than a physical coordinate. Henri Poincaré in 1905 named the transformation after Lorentz and recognised that it formed a group. Einstein's 1905 paper *On the Electrodynamics of Moving Bodies* derived the same transformation directly from the two postulates, without an aether, and elevated the local time to the actual time measured by clocks at rest in the moving frame. Hermann Minkowski's 1908 reformulation showed the transformation is a hyperbolic rotation in 4D pseudo-Euclidean spacetime — making the geometric content explicit and the special-relativistic kinematics manifestly invariant.`,
    relatedPhysicists: ["hendrik-antoon-lorentz", "henri-poincare", "albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "the-lorentz-transformation" },
      { branchSlug: "relativity", topicSlug: "time-dilation" },
      { branchSlug: "relativity", topicSlug: "length-contraction" },
      { branchSlug: "electromagnetism", topicSlug: "e-and-b-under-lorentz" },
    ],
  },
  {
    slug: "velocity-addition-relativistic",
    term: "Relativistic velocity addition",
    category: "concept",
    shortDefinition: "The rule for combining velocities in special relativity. For collinear motion: u' = (u − v)/(1 − uv/c²). Replaces the Galilean rule u' = u − v; ensures no combination of subluminal velocities exceeds c.",
    description: `Relativistic velocity addition is the rule for combining velocities consistent with the Lorentz transformation: if a particle has velocity u in frame S and S' moves at velocity v relative to S along the same direction, the particle's velocity in S' is u' = (u − v)/(1 − uv/c²) for collinear motion. The denominator is the new content versus the Galilean rule u' = u − v: it ensures that no combination of subluminal velocities (|u|, |v| < c) ever yields a superluminal result. Set u = c (a light pulse): u' = (c − v)/(1 − v/c) = c. Light's speed is c in every frame, exactly as the second postulate demands. Set u, v ≪ c: the denominator ≈ 1 and the formula reduces to the Galilean rule, recovering Newtonian intuition in the low-speed limit.

The 1851 Fizeau experiment provided the first quantitative test before special relativity existed. Hippolyte Fizeau measured the speed of light in flowing water and found a dragging coefficient (1 − 1/n²) — exactly what the relativistic velocity-addition formula predicts when applied to light at speed c/n in water moving at flow velocity v, expanded to first order in v/c. Fizeau's 1851 result was a direct verification of relativistic velocity addition fifty-four years before Einstein wrote it down — the kind of empirical hint that, in retrospect, made special relativity feel less like a leap and more like an organisation of pre-existing experimental anomalies. The formula generalises to non-collinear motion via the perpendicular-velocity correction u'_⊥ = u_⊥/(γ(1 − uv/c²)), which encodes the kinematic component of relativistic aberration.`,
    relatedPhysicists: ["albert-einstein", "hippolyte-fizeau"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "velocity-addition" },
      { branchSlug: "relativity", topicSlug: "the-lorentz-transformation" },
    ],
  },
  {
    slug: "relativistic-doppler",
    term: "Relativistic Doppler effect",
    category: "phenomenon",
    shortDefinition: "The frequency shift of light from a moving source observed in any inertial frame, including the time-dilation factor γ alongside the classical motion contribution. For a source receding at radial velocity v: f' = f √((1 − β)/(1 + β)). Reduces to the classical Doppler formula plus a γ correction.",
    description: `The relativistic Doppler effect is the frequency shift of light from a source in inertial motion as measured by an observer in any other inertial frame. For a source emitting at proper frequency f₀ and receding from the observer along the line of sight at velocity v = βc, the observed frequency is f = f₀ √((1 − β)/(1 + β)) = f₀/(γ(1 + β)). For approach (v < 0, β < 0), the formula gives a blueshift f > f₀; for recession (β > 0), a redshift f < f₀. The structure is the product of two factors: the classical Doppler shift (1 − β)/(1 + β)^(1/2) accounting for the changing path length of successive wavefronts, and the time-dilation factor 1/γ accounting for the slower ticking of the source's emission clock as measured in the observer's frame.

Christian Doppler in 1842 derived the classical formula for sound and light by considering only the path-length effect. The relativistic version adds the kinematic time-dilation factor and applies symmetrically to electromagnetic waves in vacuum (no medium needed). The redshift-distance relation for galaxies (Hubble 1929) is dominated by cosmological expansion rather than special-relativistic Doppler, but the formula remains exact for galaxies in our cosmological neighbourhood up to peculiar-velocity contributions. Particle physics uses the relativistic Doppler shift continuously: pion lifetimes in flight, atomic transitions in fast ion beams, and the spectroscopy of relativistic jets from active galactic nuclei all rely on inverting the formula to recover the source frame's rest frequency from the observed frequency. The transverse-Doppler effect, where the source has zero radial velocity at the moment of emission but non-zero velocity perpendicular to the line of sight, is the limiting case f = f₀/γ — pure time dilation, no classical contribution.`,
    relatedPhysicists: ["christian-doppler", "albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "relativistic-doppler" },
    ],
  },
  {
    slug: "transverse-doppler",
    term: "Transverse Doppler effect",
    category: "phenomenon",
    shortDefinition: "The relativistic frequency shift observed when the source's velocity is purely perpendicular to the line of sight at the moment of emission. Reduces to f = f₀/γ — pure time dilation, with no classical Doppler contribution. The cleanest experimental test of time dilation.",
    description: `The transverse Doppler effect is the limiting case of the relativistic Doppler shift in which the source's velocity is purely perpendicular to the line of sight at the instant of emission. The classical Doppler formula predicts no frequency shift in this geometry — a radial velocity component is required to change the path length of successive wavefronts. Special relativity disagrees: even with zero radial velocity, the source's emission clock is dilated by the Lorentz factor γ as measured in the observer's frame, and the observed frequency is f = f₀/γ. The shift is always a redshift, regardless of whether the source is approaching or receding, because γ ≥ 1. The effect is small at low velocities (γ − 1 ≈ β²/2) but grows quadratically — at γ = 2 the transverse redshift is 50%.

The transverse Doppler effect is the cleanest experimental signature of relativistic time dilation, isolated from the classical contribution. The 1938 Ives-Stilwell experiment was the first laboratory verification: hydrogen atoms in a discharge tube emitted Hα light at 656.3 nm, and Herbert Ives and George Stilwell observed both the forward (blueshifted) and backward (redshifted) emissions of moving atoms. The arithmetic mean of the two observed wavelengths gave the transverse-Doppler-corrected wavelength rather than the proper wavelength, by exactly the factor γ predicted by special relativity, and at the few-percent precision available in 1938 the effect was unambiguous. Modern verifications use Mössbauer-effect γ-ray sources mounted on rotating disks: the source at the disk's edge has a purely transverse velocity relative to a detector at the centre, and the observed γ-ray frequency shift matches the γ-factor prediction to better than 1 part in 10⁵.`,
    relatedPhysicists: ["albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "relativistic-doppler" },
      { branchSlug: "relativity", topicSlug: "time-dilation" },
    ],
  },
];

async function main() {
  const client = getServiceClient();

  console.log(`Seeding ${PHYSICISTS.length} physicists + ${GLOSSARY.length} glossary terms (en)…`);

  let physInserted = 0;
  let physUpdated = 0;
  let glossInserted = 0;
  let glossUpdated = 0;

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

    const { data: existing } = await client
      .from("content_entries")
      .select("source_hash")
      .eq("kind", "physicist")
      .eq("slug", p.slug)
      .eq("locale", "en")
      .maybeSingle();

    if (existing?.source_hash === source_hash) {
      console.log(`  · physicist ${p.slug} (unchanged)`);
      continue;
    }

    const isInsert = !existing;

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
    if (isInsert) {
      physInserted++;
      console.log(`  ✓ physicist ${p.slug} (inserted)`);
    } else {
      physUpdated++;
      console.log(`  ✓ physicist ${p.slug} (updated)`);
    }
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

    const { data: existing } = await client
      .from("content_entries")
      .select("source_hash")
      .eq("kind", "glossary")
      .eq("slug", g.slug)
      .eq("locale", "en")
      .maybeSingle();

    if (existing?.source_hash === source_hash) {
      console.log(`  · glossary ${g.slug} (unchanged)`);
      continue;
    }

    const isInsert = !existing;

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
    if (isInsert) {
      glossInserted++;
      console.log(`  ✓ glossary ${g.slug} (inserted)`);
    } else {
      glossUpdated++;
      console.log(`  ✓ glossary ${g.slug} (updated)`);
    }
  }

  console.log(`physicists: ${physInserted} inserted / ${physUpdated} updated`);
  console.log(`glossary: ${glossInserted} inserted / ${glossUpdated} updated`);
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
