// Seed EM §11 EM and Relativity
// 1 physicist (Minkowski) + 11 new structural glossary terms + 1 promotion + 3 §12 forward-ref placeholders
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-em-07.ts
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
    slug: "hermann-minkowski",
    name: "Hermann Minkowski",
    shortName: "Minkowski",
    born: "1864",
    died: "1909",
    nationality: "German",
    oneLiner: "German mathematician who in 1907–1908 reformulated Einstein's special relativity as the geometry of a four-dimensional pseudo-Euclidean spacetime, giving electromagnetism its natural Lorentz-covariant home in the field tensor F^{μν}. Einstein's former teacher at ETH Zürich. Died at 44 of acute appendicitis in 1909, four years after publishing the geometry that would shape the rest of physics.",
    bio: `Hermann Minkowski was born in Aleksotas, Russian Empire (now part of Kaunas, Lithuania), in 1864, the son of a German-Jewish merchant family who emigrated to Königsberg in East Prussia when he was eight. He studied mathematics at the universities of Königsberg and Berlin, took his doctorate in 1885 under Ferdinand von Lindemann with a dissertation on quadratic forms, and held early professorships at Bonn (1892) and Königsberg (1894) before being called to ETH Zürich in 1896. There, his lectures on calculus and analytic mechanics were attended by a young Albert Einstein, who later remarked that Minkowski had considered him a lazy student — the relationship was one of mutual irritation, and Minkowski never fully forgave Einstein for cutting most of his classes. In 1902 Minkowski accepted a chair at Göttingen, joining David Hilbert (his close friend from Königsberg days) at what was then the world's leading centre for mathematical physics.

The central work that bears his name came late and quickly. In 1907, two years after Einstein's special-relativity paper, Minkowski recognised that the symmetry group of Maxwell's equations and the Lorentz transformations was the symmetry group of a four-dimensional pseudo-Euclidean geometry — and that the spacetime interval ds² = c²dt² − dx² − dy² − dz² was the natural invariant of that geometry. His 1907 paper *Die Grundgleichungen für die elektromagnetischen Vorgänge in bewegten Körpern* and 1908 Cologne lecture *Raum und Zeit* announced the result: "Henceforth space by itself, and time by itself, are doomed to fade away into mere shadows, and only a kind of union of the two will preserve an independent reality." The reformulation made the field tensor F^{μν} a natural rank-2 antisymmetric object, the four-current J^μ a natural Lorentz vector, and the entire structure of electromagnetism manifestly covariant under the Lorentz group. Einstein, who had initially dismissed the geometric reformulation as superfluous mathematical decoration, later acknowledged that without Minkowski's geometry he could not have developed general relativity.

Minkowski died in Göttingen on 12 January 1909 of acute appendicitis, four months after the Cologne lecture and four years after publishing the geometric framework that would define the rest of twentieth-century physics. He was 44. His mathematical legacy beyond relativity was substantial: the *geometry of numbers* (1896), a deep theory of lattice points and convex bodies that became foundational to algebraic number theory; significant work on quadratic forms and Diophantine approximation; and the *Minkowski inequality* in functional analysis. The lunar crater Minkowski bears his name, as do the Minkowski space and Minkowski metric of every special-relativity textbook ever written.`,
    contributions: [
      "Reformulated special relativity as the geometry of a four-dimensional pseudo-Euclidean spacetime in 1907–1908 — the framework every working physicist now uses",
      "Identified the spacetime interval ds² = c²dt² − dx² − dy² − dz² as the Lorentz-invariant scalar of a 4D geometry, giving Maxwell's equations a manifestly covariant form",
      "Made the electromagnetic field tensor F^{μν} a natural rank-2 antisymmetric object and the four-current J^μ a natural four-vector, packaging the six EM components into one covariant container",
      "Was Einstein's former calculus and analytic-mechanics teacher at ETH Zürich (1896–1902); Einstein had skipped most of his lectures, and the relationship was one of mutual irritation",
      "Founded the geometry of numbers (1896), a deep theory of lattice points and convex bodies that became foundational to algebraic number theory",
      "Was David Hilbert's close friend from Königsberg student days and his colleague at Göttingen from 1902 until his sudden death from acute appendicitis in 1909 at age 44",
    ],
    majorWorks: [
      "Geometrie der Zahlen (1896) — the foundational treatise on the geometry of numbers, defining lattice geometry as a tool of number theory",
      "Die Grundgleichungen für die elektromagnetischen Vorgänge in bewegten Körpern (1907) — the four-dimensional reformulation of Maxwell's equations and special relativity",
      "Raum und Zeit (1908) — the famous Cologne lecture: 'space by itself, and time by itself, are doomed to fade away into mere shadows'",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
      { branchSlug: "electromagnetism", topicSlug: "e-and-b-under-lorentz" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // §11.1 charge-invariance ──────────────────────────────────────────────
  {
    slug: "charge-invariance",
    term: "Charge invariance",
    category: "concept",
    shortDefinition: "The principle that electric charge is a Lorentz scalar — every inertial observer measures the same total charge in a given closed volume, regardless of relative motion. The one quantity in classical electrodynamics that no boost can mix away.",
    description: `Charge invariance is the experimental and theoretical fact that electric charge is a Lorentz scalar: every inertial observer, in every state of uniform motion, measures the same total charge enclosed in a given closed volume. Length contracts, mass-energy mixes, electric and magnetic field components rotate into each other under boosts — but the integrated charge in a closed region is frame-independent. Formally, Q = ∫ J⁰ d³x is the integral of the time component of the four-current J^μ = (cρ, **J**) over a constant-time hypersurface, and the local conservation law ∂_μ J^μ = 0 (which expresses ∂ρ/∂t + ∇·**J** = 0 in 3-space language) means the flux of J^μ through any closed three-surface bounding the same charge content gives the same Q.

The intuition is geometric. In the lab frame, a parallel-plate capacitor of length L₀ holds N magenta dots on one plate. Boost to a frame moving at βc along the plate's length. In the new frame, the plate length contracts to L₀/γ — but the N dots on it stay N dots. You can count them. They sit on a physical plate and counting is frame-independent. The charge per unit length (line density ρ) does change under boost — it scales as γ for a moving lattice — but the total Q = ρL = (γρ₀)(L₀/γ) = ρ₀L₀ is invariant. The 1856 Weber–Kohlrausch measurement of √(1/μ₀ε₀) = c, six years before Maxwell's 1862 prediction that light is an EM wave, was the first quantitative hint that c was lurking inside the unit definition of charge — a fact only fully understood after the four-dimensional packaging of charge and current into J^μ was made explicit.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "charge-invariance" },
    ],
  },
  {
    slug: "four-current",
    term: "Four-current",
    category: "concept",
    shortDefinition: "The Lorentz four-vector J^μ = (cρ, J_x, J_y, J_z) packaging charge density and current density into a single covariant object. Sources the field tensor F^{μν} via Maxwell's equation ∂_μ F^{μν} = μ₀ J^ν.",
    description: `The four-current is the Lorentz four-vector J^μ = (cρ, **J**) that combines electric charge density ρ (the time component, multiplied by c for unit-matching) and current density **J** (the spatial three-components) into a single covariant object. Under a Lorentz boost, ρ and **J** mix exactly the way the components of any four-vector (ct, **x**) mix — a fact that turns the apparently separate concepts of "stationary charge" and "flowing current" into manifestations of the same underlying object viewed from different frames. A static charge distribution in the lab frame becomes both a charge density and a current density in any boosted frame; conversely, a pure current in one frame may not be electrically neutral in another.

The four-current sources the electromagnetic field tensor F^{μν} via the inhomogeneous Maxwell equation in covariant form: ∂_μ F^{μν} = μ₀ J^ν. With ν = 0 this reproduces Gauss's law ∇·E = ρ/ε₀; with ν = i ∈ {1, 2, 3} it reproduces the Ampère–Maxwell law ∇×B = μ₀**J** + μ₀ε₀ ∂E/∂t. The continuity equation ∂_μ J^μ = 0, which expresses local charge conservation, follows automatically from the antisymmetry of F^{μν}: contracting both indices of ∂_μ ∂_ν F^{μν} kills the right-hand side because partials commute and F^{μν} is antisymmetric. Charge conservation is therefore not an extra postulate but a structural consequence of the Lagrangian formulation — Noether's theorem applied to the gauge symmetry A_μ → A_μ + ∂_μΛ.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "charge-invariance" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
    ],
  },
  {
    slug: "four-vector",
    term: "Four-vector",
    category: "concept",
    shortDefinition: "A quantity X^μ = (X⁰, X¹, X², X³) that transforms under Lorentz boosts the same way the spacetime coordinates (ct, x, y, z) do. The natural container for any pair of scalar-plus-three-vector quantities in special relativity.",
    description: `A four-vector is a quantity X^μ with four components (X⁰, X¹, X², X³) — one "time-like" and three "space-like" — that transforms under Lorentz boosts the same way the spacetime coordinates (ct, x, y, z) do. The transformation rule is X'^μ = Λ^μ_ν X^ν, where Λ^μ_ν is the Lorentz boost matrix. The four-vector is the basic building block of special-relativistic physics: every physical quantity that pairs a "scalar" with a "three-vector" — energy with momentum, charge density with current density, scalar potential with vector potential — turns out to be a four-vector when properly examined.

The Lorentz-invariant inner product of two four-vectors uses the Minkowski metric η_{μν} = diag(+1, −1, −1, −1) (in the mostly-minus convention used by Griffiths and Jackson) or its sign-flipped sibling. For a single four-vector X^μ, the Minkowski "length-squared" X^μ X_μ = (X⁰)² − |**X**|² is a Lorentz scalar — the same in every frame. For X^μ = (E/c, **p**) this is m²c², the rest-mass invariant; for X^μ = (cρ, **J**) it is c²ρ² − |**J**|², an invariant of the four-current. The transformation properties also dictate which combinations of more elementary quantities can themselves be four-vectors: ∂_μ = (∂/c∂t, ∇) is a covariant four-vector, and the four-velocity U^μ = γ(c, **v**) of a particle is a contravariant four-vector. These structural rules make the construction of Lorentz-covariant physical theories almost mechanical — choose your dynamical variables to transform as four-vectors (or higher tensors), build invariants by index contraction, and any equation that equates two tensors of the same rank holds in every frame.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "charge-invariance" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  // §11.2 e-and-b-under-lorentz ─────────────────────────────────────────
  {
    slug: "lorentz-transformation-of-fields",
    term: "Lorentz transformation of fields",
    category: "concept",
    shortDefinition: "The closed-form rule by which the components of E and B transform under a Lorentz boost. Parallel components are unchanged; perpendicular components mix linearly with the perpendicular components of the OTHER field. Derived by Hendrik Lorentz in 1895.",
    description: `The Lorentz transformation of electromagnetic fields gives the closed-form rule by which the three components of **E** and three components of **B** transform under a Lorentz boost between two inertial frames. For a boost along +x at velocity v = βc, with γ = 1/√(1−β²) the Lorentz factor: the parallel components E_x and B_x are unchanged; the perpendicular components mix linearly with the perpendicular components of the other field. Explicitly: E'_y = γ(E_y − v B_z), E'_z = γ(E_z + v B_y), B'_y = γ(B_y + v E_z/c²), B'_z = γ(B_z − v E_y/c²). The result was derived by Hendrik Antoon Lorentz in 1895, ten years before Einstein's special-relativity paper gave the geometric meaning, and is the basis for understanding how a configuration that looks "magnetic" in one frame can look "electric" (or partly electric) in another.

The transformation makes immediate sense once F^{μν} is recognised as a rank-2 antisymmetric tensor: under a Lorentz boost, a tensor transforms as F'^{μν} = Λ^μ_α Λ^ν_β F^{αβ}, and the closed-form result above is just this contraction written component-by-component. The pedagogical consequence is that the electric and magnetic fields are not independent physical entities but two faces of one geometric object F^{μν}, and the apparent "type" of a field depends on the observer's state of motion. A pure electric field of a static point charge in the lab frame becomes an electric field plus a magnetic field in any boosted frame; a pure magnetic field of a current-carrying solenoid in the lab frame becomes a magnetic field plus an electric field in any frame moving past. Two scalar invariants (E·B and |E|² − c²|B|²) are constructed from F^{μν} and pinned down regardless of frame, and these constrain which transformations are physically achievable.`,
    relatedPhysicists: ["hendrik-antoon-lorentz", "albert-einstein"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "e-and-b-under-lorentz" },
    ],
  },
  {
    slug: "boost-mixing-e-and-b",
    term: "Boost mixing of E and B",
    category: "phenomenon",
    shortDefinition: "The phenomenon that under a Lorentz boost, electric and magnetic field components rotate into each other. A pure-E field in one frame becomes E and B in any boosted frame; a pure-B field becomes E and B; the two are not separate physical entities.",
    description: `Boost mixing of E and B is the phenomenon that the components of the electric and magnetic fields perpendicular to a Lorentz boost direction rotate into each other under that boost, so a configuration that appears purely electric in one inertial frame appears as a mixture of electric and magnetic fields in any frame moving past, and vice versa. The transformation is closed-form (see "Lorentz transformation of fields"), but the conceptual content is that **E** and **B** are not two independent physical objects — they are projections of a single rank-2 antisymmetric tensor F^{μν} onto the time and space directions of a particular observer's reference frame.

The most striking manifestation is in §11.4 magnetism-as-relativistic-electrostatics: two parallel current-carrying wires in the lab frame produce a magnetic attraction (no electric force, because both wires are net-neutral). Boost into the rest frame of the drift electrons in one wire and the lattice ions of the other wire are now moving — their length contracts by γ, the lattice line density increases, and a net electric field appears between the wires. The "magnetic" attraction in the lab frame becomes a "Coulomb" attraction in the boosted frame, with the same magnitude. Same force, different name. The phenomenon also explains why a moving observer near a stationary charge sees a magnetic field (the test charge's worldline pierces the boosted-frame's slicing of spacetime, picking up a current density that sources a B-field) and why the apparent type of field is not a frame-independent classification — only the two scalar invariants E·B and |E|² − c²|B|² are.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "e-and-b-under-lorentz" },
      { branchSlug: "electromagnetism", topicSlug: "magnetism-as-relativistic-electrostatics" },
    ],
  },
  {
    slug: "lorentz-invariants-of-em-field",
    term: "Lorentz invariants of the EM field",
    category: "concept",
    shortDefinition: "The two scalar quantities — E·B and |E|² − c²|B|² — that every observer agrees on, regardless of their motion. Constructed as tensor traces from F^{μν}; classify the field as 'electric-like', 'magnetic-like', or 'null'.",
    description: `The two Lorentz invariants of the electromagnetic field are the scalar quantities **E**·**B** and |**E**|² − c²|**B**|², both of which retain the same numerical value in every inertial frame. In tensor language they correspond to two independent scalar contractions of the field tensor F^{μν} with itself: ½ F^{μν} F_{μν} = c²|**B**|² − |**E**|²/c² (the kinetic part of the EM Lagrangian density up to a sign convention), and ¼ *F^{μν} F_{μν} ∝ −**E**·**B**/c (the dual-tensor contraction that vanishes on parity-respecting field configurations). Because they are scalars built from a tensor by index contraction, they are Lorentz-invariant by construction.

Operationally these two numbers classify the electromagnetic field into three types. (1) If **E**·**B** = 0 and |**E**|² > c²|**B**|², the field is "electric-like" and a frame exists where **B** = 0 entirely (a pure electrostatic field viewed from the right inertial observer). (2) If **E**·**B** = 0 and |**E**|² < c²|**B**|², the field is "magnetic-like" and a frame exists where **E** = 0 (a pure magnetostatic field). (3) If **E**·**B** ≠ 0, no boost can eliminate either field — the situation of a generic electromagnetic wave or a generic configuration with both static and dynamic components. The invariants therefore answer the natural question "is this configuration secretly just a Coulomb field?" with a frame-independent yes/no test, and they recover the §11.4 result (a magnetic-only force in the lab frame is generically electric-like in the right boosted frame) as a special case of the second classification.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "e-and-b-under-lorentz" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
    ],
  },
  // §11.3 the-electromagnetic-field-tensor ──────────────────────────────
  {
    slug: "electromagnetic-field-tensor",
    term: "Electromagnetic field tensor",
    category: "concept",
    shortDefinition: "The rank-2 antisymmetric 4×4 tensor F^{μν} that packages the three components of E and three components of B into one Lorentz-covariant object, with F^{0i} = E_i/c and F^{ij} = -ε_{ijk} B_k. Also called the Faraday tensor.",
    description: `The electromagnetic field tensor F^{μν} is the rank-2 antisymmetric 4×4 tensor that packages the three components of the electric field and three components of the magnetic field into one Lorentz-covariant object. Its components in mostly-minus signature (Griffiths/Jackson convention) are F^{0i} = E_i/c (the time-space components encode E divided by c for unit-matching) and F^{ij} = −ε_{ijk} B_k (the space-space components encode B with the Levi-Civita epsilon). The diagonal F^{μμ} = 0 by antisymmetry, and the six independent components below the diagonal are determined by the antisymmetry F^{μν} = −F^{νμ}: exactly the right number to hold the three E and three B values.

The tensor's defining property is that it transforms as F'^{μν} = Λ^μ_α Λ^ν_β F^{αβ} under Lorentz boosts, which automatically generates the closed-form §11.2 transformation of E and B from a single rule. The two compact equations ∂_μ F^{μν} = μ₀ J^ν and ∂_μ *F^{μν} = 0 (where *F^{μν} = ½ ε^{μνρσ} F_{ρσ} is the dual tensor) reproduce all four of Maxwell's equations: the first encodes Gauss's law (ν = 0) and Ampère–Maxwell (ν = i); the second encodes Faraday's law and the absence of magnetic monopoles. The tensor formulation also makes Lorentz invariants visible as tensor traces: ½ F^{μν} F_{μν} ∝ c²|**B**|² − |**E**|²/c² is the kinetic part of the EM Lagrangian, and ¼ *F^{μν} F_{μν} ∝ −**E**·**B**/c is the parity-odd invariant. Hermann Minkowski's 1907–1908 reformulation made this packaging the natural starting point for relativistic electrodynamics.`,
    relatedPhysicists: ["hermann-minkowski", "albert-einstein", "james-clerk-maxwell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  {
    slug: "dual-field-tensor",
    term: "Dual field tensor",
    category: "concept",
    shortDefinition: "The Hodge dual *F^{μν} = (1/2) ε^{μνρσ} F_{ρσ} of the electromagnetic field tensor, obtained by swapping E and cB (up to signs in mostly-minus signature). Sources magnetic monopoles in the symmetric Maxwell equations; never observed sourced.",
    description: `The dual electromagnetic field tensor *F^{μν} (often written F̃^{μν} or with a Hodge-star prefix) is the Hodge dual of F^{μν} obtained by contracting two of its indices with the rank-4 Levi-Civita symbol: *F^{μν} = ½ ε^{μνρσ} F_{ρσ}. The operation effectively swaps the electric and magnetic components of F^{μν} (up to factors of c and signs that depend on the metric signature). Where F^{μν} has F^{0i} = E_i/c, the dual has *F^{0i} = −B_i (with sign conventions varying by source); where F^{μν} has F^{ij} = −ε_{ijk} B_k, the dual has *F^{ij} = (1/c) ε_{ijk} E_k. The dual tensor is itself antisymmetric, so it carries the same six independent components as F^{μν} — but rearranged.

The dual is the natural object to source magnetic monopoles, if they existed. The symmetric Maxwell equations would read ∂_μ F^{μν} = μ₀ J^ν (electric four-current sourcing F) and ∂_μ *F^{μν} = μ₀ J_m^ν (magnetic four-current sourcing *F), restoring perfect E↔B duality. In the actual universe the second equation is ∂_μ *F^{μν} = 0 — the electromagnetic field tensor is closed under exterior differentiation precisely because no magnetic monopoles have ever been observed despite four decades of dedicated searches. The most stringent monopole bounds come from the MoEDAL detector at the Large Hadron Collider and from cosmological-relic searches in lunar regolith. Paul Dirac's 1931 argument that monopoles are *consistent* with quantum mechanics — and that their existence would force electric charge to be quantised in units of e = 2πℏ/(g·μ₀c) where g is the magnetic charge — remains one of the cleanest theoretical arguments for charge quantisation, which is otherwise an unexplained empirical fact.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
    ],
  },
  // §11.4 magnetism-as-relativistic-electrostatics ─────────────────────
  {
    slug: "length-contraction-of-current",
    term: "Length contraction of current",
    category: "phenomenon",
    shortDefinition: "The relativistic effect that a current-carrying lattice, viewed in the rest frame of its drift electrons, has its inter-ion spacing contracted by the Lorentz factor γ. Produces the net + charge density that explains magnetic attraction as relativistic electrostatics.",
    description: `Length contraction of current is the application of special-relativistic length contraction to the lattice of stationary positive ions in a current-carrying wire, viewed from the rest frame of the drift electrons. In the lab frame, the lattice ions are at rest with line density n₀ (positive charge per unit length, n₀·e where e is the elementary charge), and the drifting electrons have line density n₀ as well (negative, equal magnitude) — the wire is net-neutral. Boost into the electrons' rest frame and the situation inverts: the cyan electrons sit still, but the magenta lattice now drifts at −v_drift relative to the boosted observer. The lattice's spacing shrinks by 1/γ, so its measured line density in the boosted frame becomes γ·n₀.

Symmetrically, the cyan electrons in the lab frame had line density n₀ but were moving at +v_drift; their rest-frame density is therefore n₀/γ (lower, by inverse contraction). In the electron rest frame they sit still at this lower density. The asymmetry — γ·n₀ for the lattice, n₀/γ for the electrons — produces a net positive charge density per unit length of e·n₀·(γ − 1/γ). This is the electric field source in the boosted frame that, evaluated as a Coulomb attraction between two parallel current-carrying wires, exactly reproduces the magnetic force F = μ₀I²/(2πd) of the lab frame after accounting for the transverse-force factor of 1/γ between frames. The "click" moment is visible in §11.4's two-panel scene: as the slider moves β past 0.3, the magenta lattice in the right panel visibly bunches together while the cyan electrons stay at their original spacing, and the + density readout climbs from zero to a finite value. Same physical force, different observer; magnetic attraction is the relativistic consequence of electrostatic attraction.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetism-as-relativistic-electrostatics" },
    ],
  },
  // §11.5 four-potential-and-em-lagrangian ─────────────────────────────
  {
    slug: "four-potential",
    term: "Four-potential",
    category: "concept",
    shortDefinition: "The Lorentz four-vector A^μ = (φ/c, A_x, A_y, A_z) packaging the scalar potential φ and vector potential A into one covariant object. The fundamental dynamical variable of electromagnetism in the Lagrangian formulation; the EM field tensor F^{μν} = ∂^μA^ν − ∂^νA^μ.",
    description: `The four-potential is the Lorentz four-vector A^μ = (φ/c, A_x, A_y, A_z) that packages the scalar potential φ and vector potential **A** of classical electrodynamics into a single Lorentz-covariant object. Under a Lorentz boost, the time component (φ/c) and space components (**A**) mix exactly the way (ct, **x**) mix — a fact that turns the apparently separate concepts of "electric potential" and "vector potential" into manifestations of the same underlying object viewed from different inertial frames. A static charge in the lab frame produces a pure φ field (no **A**); boost into a moving frame and the same physical object now produces both φ' and **A**'.

The field tensor F^{μν} is constructed from the four-potential as F^{μν} = ∂^μ A^ν − ∂^ν A^μ, where ∂^μ = (∂/c∂t, −∇) is the contravariant four-gradient. This construction makes the homogeneous Maxwell equations ∂_μ *F^{μν} = 0 automatic (the antisymmetry of F under permutations and the equality of mixed partials kill the right-hand side identically — the Bianchi identity), so only the inhomogeneous pair ∂_μ F^{μν} = μ₀ J^ν need be enforced as dynamical equations. The four-potential is also subject to gauge freedom: the transformation A_μ → A_μ + ∂_μ Λ for any scalar function Λ leaves F^{μν} unchanged (because ∂_μ ∂_ν Λ is symmetric in μ, ν while F^{μν} is antisymmetric). Common gauges include the **Lorenz gauge** ∂_μ A^μ = 0 (manifestly Lorentz-covariant; named for Ludvig Lorenz 1867, NOT Hendrik Lorentz) and the **Coulomb gauge** ∇·**A** = 0 (frame-dependent but convenient for static problems). The four-potential A^μ is the fundamental dynamical variable of electromagnetism in the Lagrangian formulation, and the EM Lagrangian L = −¼ F_{μν} F^{μν} − A_μ J^μ depends only on derivatives of A^μ — not on A^μ itself in any gauge-invariant combination.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
    ],
  },
  {
    slug: "em-lagrangian-density",
    term: "EM Lagrangian density",
    category: "concept",
    shortDefinition: "The Lorentz-invariant scalar L = −¼F_{μν}F^{μν} − A_μJ^μ from which all of classical electromagnetism follows. Euler-Lagrange recovers Maxwell's equations; gauge invariance via Noether gives charge conservation. The cleanest sentence in physics.",
    description: `The electromagnetic Lagrangian density is the Lorentz-invariant scalar L = −¼ F_{μν} F^{μν} − A_μ J^μ from which all of classical electromagnetism follows by the principle of least action. The first term is the kinetic contribution, ½ ε₀ (|**E**|² − c²|**B**|²) up to constants and sign conventions, encoding the field's own dynamics; the factor of −¼ (rather than −½) is set so that F^{μν} is antisymmetric and pairs of indices are summed without double-counting. The second term is the source coupling, which in 3-space components reads ρφ − **A**·**J** — the standard interaction energy of charge with potential and current with vector potential. Both terms are Lorentz scalars, so the integrated action S = ∫ L d⁴x is a Lorentz invariant.

Apply the Euler-Lagrange equation to A_ν as the dynamical field: the variation δS/δA_ν = 0 gives the inhomogeneous Maxwell equation ∂_μ F^{μν} = μ₀ J^ν, recovering Gauss's law (ν = 0) and Ampère–Maxwell (ν = 1, 2, 3). The other two Maxwell equations (Faraday's law and no-monopoles) follow automatically from F^{μν} = ∂^μ A^ν − ∂^ν A^μ via the Bianchi identity. The Lagrangian is invariant under the gauge transformation A_μ → A_μ + ∂_μ Λ; integrating the source-coupling term by parts and dropping a boundary term shows this invariance requires ∂_μ J^μ = 0, which is local charge conservation. This is Noether's theorem (1918) applied to the gauge symmetry: the symmetry of the Lagrangian generates the conservation law of the four-current. The EM Lagrangian is therefore the entire theory of classical electromagnetism in two terms — the kinetic part −¼ F_{μν} F^{μν} (built from the field tensor) and the source part −A_μ J^μ (linear in the four-potential and four-current). The deeper connection to Yang-Mills theory and the Standard Model lives in the same structure: replace the abelian U(1) gauge group of electromagnetism with a non-abelian SU(N) and the resulting Lagrangian becomes the kinetic term of the strong or weak nuclear force.`,
    relatedPhysicists: ["james-clerk-maxwell", "joseph-louis-lagrange", "emmy-noether"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  // PROMOTION: gauge-invariance — was a Session 4 forward-ref placeholder; now a full §11.5 entry
  {
    slug: "gauge-invariance",
    term: "Gauge invariance",
    category: "concept",
    shortDefinition: "The principle that the equations of electromagnetism are unchanged under the gauge transformation A_μ → A_μ + ∂_μΛ for any scalar function Λ. Together with Noether's theorem, gauge invariance implies charge conservation. The template for every gauge theory in the Standard Model.",
    description: `Gauge invariance is the principle that the physical content of electromagnetism — the field tensor F^{μν}, Maxwell's equations, and all measurable quantities — is unchanged under the **gauge transformation** A_μ → A_μ + ∂_μΛ, where Λ(x) is any sufficiently smooth scalar function of spacetime. The transformation modifies the four-potential A^μ but leaves the antisymmetric combination F^{μν} = ∂^μ A^ν − ∂^ν A^μ invariant, because the symmetry of mixed partials ∂_μ ∂_ν Λ = ∂_ν ∂_μ Λ kills the change in F. The same invariance applies to the EM Lagrangian L = −¼ F_{μν} F^{μν} − A_μ J^μ when integrated over spacetime: the kinetic term is gauge-invariant by construction, and the source-coupling term, while it shifts under the transformation by an amount A_μ J^μ → A_μ J^μ + (∂_μΛ) J^μ, satisfies (∂_μΛ) J^μ = ∂_μ(Λ J^μ) − Λ (∂_μ J^μ); the first is a boundary term and the second vanishes because of charge conservation ∂_μ J^μ = 0.

Noether's 1918 theorem makes the relation a two-way street: any continuous symmetry of the Lagrangian implies a corresponding conservation law. Apply it to the gauge symmetry A_μ → A_μ + ∂_μΛ — the conservation law that emerges is precisely ∂_μ J^μ = 0, charge conservation. This is the deep reason charge is conserved: not because of a separate experimental input, but as a structural consequence of gauge invariance. The same logic generalises to non-abelian gauge groups: SU(2) gauge invariance in the weak sector implies weak-isospin conservation, SU(3) gauge invariance in the strong sector implies colour-charge conservation, and the entire Standard Model is built on gauge invariance under the group SU(3)×SU(2)×U(1). The pattern that began with a curious algebraic redundancy of the electromagnetic potential (Maxwell-Helmholtz 1865; Lorenz 1867) is, in retrospect, the template for every fundamental force in the universe.`,
    relatedPhysicists: ["emmy-noether", "james-clerk-maxwell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  // §12 forward-ref placeholders ────────────────────────────────────────
  // FORWARD-REF: full treatment in §12.1
  {
    slug: "gauge-theory-origins",
    term: "Gauge theory origins",
    category: "concept",
    shortDefinition: "The intellectual lineage that connects electromagnetism's 1865-1867 gauge-freedom observation to the Yang-Mills construction (1954) and the Standard Model. Full treatment in §12.1.",
    description: `This is a placeholder entry. The phrase "gauge theory origins" describes the intellectual lineage that runs from the observation of gauge freedom in classical electromagnetism (Maxwell-Helmholtz 1865, Ludvig Lorenz 1867) through Hermann Weyl's 1918 attempt to unify gravitation and electromagnetism via a "gauge" of conformal length, to Chen-Ning Yang and Robert Mills's 1954 generalisation to non-abelian gauge groups, to Glashow-Salam-Weinberg's 1967–1968 electroweak unification and the development of QCD in the 1970s. The pattern is that a gauge symmetry — a redundancy in the description of a physical configuration — implies the existence of a force-carrying gauge boson and a conservation law via Noether's theorem. The full treatment of this lineage and its modern incarnation as the gauge-theoretic backbone of the Standard Model belongs to §12.1 (gauge-theory-origins), which closes the EM branch by showing that the gauge invariance discovered in classical electromagnetism is the template every fundamental force in nature obeys.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  // FORWARD-REF: full treatment in §12.2
  {
    slug: "aharonov-bohm-effect",
    term: "Aharonov-Bohm effect",
    category: "phenomenon",
    shortDefinition: "The 1959 prediction (and 1960 observation) that quantum charged particles passing through a region of zero magnetic field but non-zero vector potential nonetheless acquire a phase shift proportional to the enclosed flux. Demonstrates that the four-potential is more fundamental than the field. Full treatment in §12.2.",
    description: `This is a placeholder entry. The Aharonov-Bohm effect, predicted by Yakir Aharonov and David Bohm in 1959 and first observed experimentally by Robert Chambers in 1960, is the quantum-mechanical phenomenon that a charged particle following a path that encloses a region of non-zero magnetic flux acquires a phase shift e/ℏ × ∮ A·dl, even when the magnetic field B is identically zero everywhere along the particle's worldline. The classic experimental setup is two-slit electron interference with a tightly-shielded solenoid placed between the slits: when the solenoid carries current the interference fringes shift, even though no electron ever encounters a non-zero B. The effect demonstrates that the electromagnetic four-potential A^μ — not just the field tensor F^{μν} — is the fundamental object in quantum electrodynamics, and that two configurations with the same F^{μν} but different A^μ are genuinely physically distinct in the quantum domain. The full treatment of the Aharonov-Bohm effect, its quantum-mechanical derivation, and its broader implications for gauge theory belongs to §12.2 (aharonov-bohm-effect).`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  // FORWARD-REF: full treatment in §12.3
  {
    slug: "magnetic-monopole",
    term: "Magnetic monopole",
    category: "phenomenon",
    shortDefinition: "A hypothetical particle carrying isolated magnetic charge, sourcing the dual field tensor *F^{μν} the way an electron sources F^{μν}. Predicted to exist in many quantum field theories; never observed despite four decades of search. Full treatment in §12.3.",
    description: `This is a placeholder entry. A magnetic monopole is a hypothetical elementary particle that carries an isolated magnetic charge g, sourcing the dual electromagnetic field tensor *F^{μν} the way an electron sources F^{μν}. If monopoles existed, the symmetric Maxwell equations would read ∂_μ F^{μν} = μ₀ J^ν (electric four-current sourcing F) and ∂_μ *F^{μν} = μ₀ J_m^ν (magnetic four-current sourcing *F), restoring perfect E↔B duality at the level of the field equations. Paul Dirac in 1931 showed that the existence of a single magnetic monopole anywhere in the universe would force electric charge to be quantised in integer multiples of e = 2πℏ/(g μ₀ c), turning the empirical fact of charge quantisation into a theoretical consequence. Despite four decades of dedicated searches — at the LHC's MoEDAL detector, in cosmological-relic surveys of lunar regolith and ocean sediment, and in dedicated solenoid experiments — no magnetic monopole has ever been observed. The full treatment of monopoles, the Dirac quantisation argument, the symmetric Maxwell equations, and the modern E↔B duality of magnetic-monopole-bearing field theories belongs to §12.3 (magnetic-monopoles-and-duality).`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
    ],
  },
];

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
