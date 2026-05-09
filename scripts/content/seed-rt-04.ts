// Seed RT §07 Tensor Calculus + §08 Curvature & EFE
// 2 physicists (Bernhard Riemann, Tullio Levi-Civita) + 14 new structural glossary terms + gravitational-redshift alias
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-rt-04.ts
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
    slug: "bernhard-riemann",
    name: "Bernhard Riemann",
    shortName: "Riemann",
    born: "1826",
    died: "1866",
    nationality: "German",
    oneLiner: "German mathematician whose 1854 habilitation lecture *Über die Hypothesen welche der Geometrie zu Grunde liegen* generalised geometry to spaces of arbitrary dimension and intrinsic curvature, defining the metric and curvature tensors that fifty-eight years later became Einstein's mathematical language for general relativity.",
    bio: `Bernhard Riemann was born in 1826 in Breselenz near Hannover, the son of a Lutheran pastor. He entered the University of Göttingen in 1846 to study theology at his father's wish, but soon transferred to mathematics under Carl Friedrich Gauss; after a stay at Berlin under Jacobi and Dirichlet he returned to Göttingen and completed his doctorate in 1851 under Gauss's supervision on the foundations of complex-function theory. His habilitation followed in 1854 with the lecture *Über die Hypothesen welche der Geometrie zu Grunde liegen* — the talk that generalised geometry to n-dimensional spaces of intrinsic curvature and prepared, without anyone realising at the time, the mathematical machinery of general relativity.

The 1854 lecture defined intrinsic curvature without any reference to embedding in a higher-dimensional ambient space — geometry from the inside, the way an ant on a surface might infer its own curvature from triangle-angle deficits without ever leaving the surface. Riemann introduced what would become the metric tensor (the rule for measuring infinitesimal distances ds² = g_{μν} dx^μ dx^ν) and what would become the Riemann curvature tensor (the obstruction to vectors returning to themselves under parallel transport around a closed loop). The lecture was hand-written, delivered on 10 June 1854 to an audience of three — Gauss and two assessors. Gauss reportedly walked home that afternoon "in unusual silence and emotion." The text was published only posthumously in 1868, and the geometric apparatus it founded became canonically known as Riemannian geometry.

Riemann's other achievements would have made an ordinary mathematician immortal. The 1859 paper *Über die Anzahl der Primzahlen unter einer gegebenen Grösse* introduced what is now called the Riemann zeta function and stated the Riemann hypothesis — the central open problem of analytic number theory. He founded the rigorous theory of complex manifolds (Riemann surfaces) in his 1857 work on Abelian functions; the Riemann integral remains the standard rigorous definition of integration in real analysis. He died of tuberculosis on 20 July 1866 at age 39 in Selasca on Lake Maggiore, Italy. His work sat largely unused by physicists for half a century, until Marcel Grossmann in 1912 introduced Einstein to the Riemann-Christoffel-Levi-Civita machinery — the toolkit that, three years later, Einstein used to write the field equations of general relativity.`,
    contributions: [
      "1854 habilitation lecture *Über die Hypothesen welche der Geometrie zu Grunde liegen* — generalised geometry to n-dimensional manifolds with intrinsic curvature; introduced what became the metric tensor and the Riemann curvature tensor.",
      "Riemann zeta function and the Riemann hypothesis (1859) — the central open problem of analytic number theory.",
      "Riemann surfaces — the rigorous foundation of complex-function theory and the prototype of modern complex-analytic geometry.",
      "Riemann integral — the standard rigorous definition of integration in real analysis.",
      "The Cauchy-Riemann equations (independently with Cauchy) — the analyticity conditions for complex differentiability.",
    ],
    majorWorks: [
      "Über die Hypothesen welche der Geometrie zu Grunde liegen (1854/1868) — the habilitation lecture; founded Riemannian geometry.",
      "Über die Anzahl der Primzahlen unter einer gegebenen Grösse (1859) — Riemann hypothesis paper.",
      "Theorie der Abelschen Functionen (1857) — Riemann surfaces.",
    ],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "manifolds-and-tangent-spaces" },
      { branchSlug: "relativity", topicSlug: "the-metric-tensor" },
      { branchSlug: "relativity", topicSlug: "the-riemann-tensor" },
    ],
  },
  {
    slug: "tullio-levi-civita",
    name: "Tullio Levi-Civita",
    shortName: "Levi-Civita",
    born: "1873",
    died: "1941",
    nationality: "Italian",
    oneLiner: "Italian mathematician whose 1900 collaboration with Gregorio Ricci-Curbastro produced the *absolute differential calculus* (now called tensor calculus), and whose 1917 introduction of the connection and parallel transport gave general relativity its modern geometric foundation.",
    bio: `Tullio Levi-Civita was born in 1873 in Padua, completed his doctorate at the University of Padua in 1894 under Gregorio Ricci-Curbastro, and spent his career first at Padua and later at the University of Rome, where he was appointed in 1918. With Ricci-Curbastro he co-authored the 1900 paper *Méthodes de calcul différentiel absolu et leurs applications* in *Mathematische Annalen* (volume 54, pages 125–201) — the work that systematised the index calculus on manifolds and provided the language Einstein would learn from Marcel Grossmann in Zurich in 1912 and use in November 1915 to write the field equations of general relativity. Without the *calcolo differenziale assoluto* there would have been no covariant tensor formalism for Einstein to write his theory in.

His 1917 paper *Nozione di parallelismo in una varietà qualunque* (Rendiconti del Circolo Matematico di Palermo, volume 42, pages 173–204) introduced the affine connection and parallel transport intrinsically, without reference to any embedding of the manifold in a higher-dimensional space. The concept gave the Christoffel symbols their modern geometric interpretation as connection coefficients, and the unique torsion-free metric-compatible connection that emerges from any Riemannian metric — what the world now calls the Levi-Civita connection — bears his name. So does the totally antisymmetric Levi-Civita symbol ε^{ijk}, which appears throughout differential geometry, electromagnetism, and field theory whenever an orientation has to be tracked. His correspondence with Einstein on the mathematical foundations of general relativity spanned twenty years and is one of the most consequential mathematician-physicist exchanges in the modern record.

Levi-Civita made important contributions to analytical mechanics and the three-body problem throughout his career, and trained a generation of Italian and international students. In 1938, after the racial laws of Mussolini's regime were passed, he was dismissed from his Rome professorship — he was Jewish — and stripped of all academic honours. He died in Rome on 29 December 1941, isolated and impoverished, his last years marked by the Nazi occupation closing in around the city. The connection that bears his name remains the standard tool with which every working physicist computes geodesics, curvature, and the field equations.`,
    contributions: [
      "1900 *Méthodes de calcul différentiel absolu* (with Ricci-Curbastro) — systematised tensor calculus on manifolds; the language Einstein needed for general relativity.",
      "1917 *Nozione di parallelismo in una varietà qualunque* — introduced the affine connection and parallel transport intrinsically; defined what is now called the Levi-Civita connection.",
      "The Levi-Civita symbol ε^{ijk} (totally antisymmetric Levi-Civita tensor density) — fundamental in differential geometry and physics.",
      "Three-body problem and analytical mechanics — extensive contributions throughout his career.",
      "Twenty-year correspondence with Einstein on the mathematical foundations of general relativity.",
    ],
    majorWorks: [
      "Méthodes de calcul différentiel absolu et leurs applications (1900, with Ricci-Curbastro) — Mathematische Annalen 54, 125–201; founded tensor calculus.",
      "Nozione di parallelismo in una varietà qualunque (1917) — Rendiconti del Circolo Matematico di Palermo 42, 173–204; introduced parallel transport.",
      "The Absolute Differential Calculus (1925/1927 English translation) — the canonical textbook.",
    ],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "tensors-on-curved-space" },
      { branchSlug: "relativity", topicSlug: "christoffels-and-parallel-transport" },
      { branchSlug: "relativity", topicSlug: "geodesics" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // RT §07 ────────────────────────────────────────────────────────────────
  {
    slug: "manifold",
    term: "Manifold",
    category: "concept",
    shortDefinition: "An n-dimensional space that locally looks Euclidean. Each point has a neighbourhood homeomorphic to ℝⁿ; a *smooth* manifold adds a differentiable structure compatible across overlapping coordinate patches. A sphere is a 2-manifold; spacetime in general relativity is a 4-manifold.",
    description: `A manifold is an n-dimensional space whose points each have a neighbourhood homeomorphic to ℝⁿ — locally, the manifold looks like ordinary flat Euclidean space, even when its global shape is curved or topologically non-trivial. The 2-sphere is the prototypical example: a small patch around any point on the sphere can be flattened onto a piece of paper without much distortion, even though the sphere as a whole cannot. The notion of "locally Euclidean" is made precise by demanding that the manifold be covered by an atlas of overlapping coordinate charts whose pairwise transition maps are continuous; a *smooth* manifold strengthens this by requiring the transition maps to be infinitely differentiable, which is the condition that lets one do calculus on the manifold without specifying any particular embedding.

In general relativity the spacetime arena is a four-dimensional smooth manifold. Tensors live at each point on this manifold, and the metric tensor g_{μν}(x) — which determines lengths, angles, and proper times — varies smoothly across it. Crucially, the manifold is the abstract underlying object, defined without reference to any larger space it might be sitting inside; intrinsic curvature, parallel transport, and geodesic flow can all be defined without ever invoking an embedding. This intrinsic point of view, due to Riemann's 1854 habilitation lecture, is what allowed Einstein to formulate gravity as the geometry of spacetime rather than a force acting through some background space.`,
    relatedPhysicists: ["bernhard-riemann"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "manifolds-and-tangent-spaces" },
    ],
  },
  {
    slug: "tangent-space",
    term: "Tangent space",
    category: "concept",
    shortDefinition: "At each point p of a smooth n-manifold M, the n-dimensional vector space T_p M of all tangent vectors at p. Tangent vectors transform as ∂x^μ/∂x'^ν under coordinate change — the prototype of contravariant index behaviour. The disjoint union of all tangent spaces is the tangent bundle TM.",
    description: `The tangent space T_p M at a point p of a smooth n-dimensional manifold M is the n-dimensional vector space of all tangent vectors at p. Concretely, a tangent vector at p can be defined as the velocity of a smooth curve passing through p, or equivalently as a linear directional-derivative operator acting on smooth functions defined near p. Every tangent space is isomorphic to ℝⁿ, but the isomorphism depends on choice of coordinates; the basis {∂/∂x^μ} provided by a coordinate chart gives one natural frame, but no privileged one. Vectors in T_p M live at p and at p only — one cannot meaningfully add tangent vectors at distinct points without first specifying a connection that lets one transport them.

The transformation law for tangent vectors under a change of coordinates x → x'(x) is V'^μ = (∂x'^μ/∂x^ν) V^ν — the prototype of "contravariant" index behaviour, the upper index. The dual space, the cotangent space T*_p M, contains the covectors (one-forms) that transform with the inverse Jacobian and carry lower indices. The disjoint union of all tangent spaces over all points of M is the tangent bundle TM, a 2n-dimensional manifold in its own right; sections of TM are vector fields, and the entire calculus of differential geometry is built on the relationship between the manifold, its tangent bundle, and the tensor bundles obtained from tangent and cotangent spaces by tensor product.`,
    relatedPhysicists: ["bernhard-riemann"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "manifolds-and-tangent-spaces" },
    ],
  },
  {
    slug: "metric-tensor",
    term: "Metric tensor",
    category: "concept",
    shortDefinition: "Symmetric (0,2) tensor g_{μν} that defines distances, angles, and proper times on a manifold. ds² = g_{μν} dx^μ dx^ν. In flat SR spacetime g = η = diag(+1, −1, −1, −1); in GR g_{μν}(x) varies with position and encodes all gravitational information.",
    description: `The metric tensor g_{μν} is the symmetric (0,2) tensor field on a manifold that turns it into a *Riemannian* (or, in physics, *pseudo-Riemannian*) manifold by defining an inner product on every tangent space. Its primary job is to assign a length to infinitesimal displacements: the line element ds² = g_{μν} dx^μ dx^ν is the squared arc-length of a coordinate increment dx^μ, and integrating ∫ √(g_{μν} dx^μ/dλ · dx^ν/dλ) dλ along a curve gives the proper length (or, with the GR signature, the proper time). The metric also defines angles between vectors, raises and lowers tensor indices via g^{μν} g_{νρ} = δ^μ_ρ, and is the only structural object on the manifold needed to derive the Levi-Civita connection and from it the curvature tensors.

In special relativity the metric is flat: η_{μν} = diag(+1, −1, −1, −1) (using the +−−− signature) and is the same at every point of Minkowski space. In general relativity the metric is g_{μν}(x) — a tensor field whose components depend on position. The dependence is exactly what encodes gravity: every gravitational effect, from time dilation in the Schwarzschild solution to the cosmological expansion of the FLRW spacetime, is read off the spatial variation of g_{μν}. Einstein's field equations are equations *for* the metric — given matter content T_{μν}, they determine g_{μν} up to coordinate freedom. Riemann's 1854 lecture introduced the idea; Einstein and Grossmann adopted it in 1912.`,
    relatedPhysicists: ["bernhard-riemann", "albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "the-metric-tensor" },
      { branchSlug: "relativity", topicSlug: "tensors-on-curved-space" },
    ],
  },
  {
    slug: "christoffel-symbols",
    term: "Christoffel symbols",
    category: "concept",
    shortDefinition: "The connection coefficients Γ^ρ_{μν} = (1/2) g^{ρσ}(∂_μ g_{νσ} + ∂_ν g_{μσ} − ∂_σ g_{μν}) computed from the metric. Not tensors — they don't transform tensorially — but appear in covariant derivatives and the geodesic equation. Define the unique torsion-free metric-compatible Levi-Civita connection.",
    description: `The Christoffel symbols Γ^ρ_{μν} are the connection coefficients computed directly from the metric tensor by the formula Γ^ρ_{μν} = (1/2) g^{ρσ}(∂_μ g_{νσ} + ∂_ν g_{μσ} − ∂_σ g_{μν}). They are symmetric in their lower two indices, Γ^ρ_{μν} = Γ^ρ_{νμ}, which is the torsion-free condition; together with metric-compatibility (∇_λ g_{μν} = 0), this picks out a *unique* connection from the infinite family of possible affine connections on a Riemannian manifold — the Levi-Civita connection, named after Tullio Levi-Civita's 1917 introduction of the geometric notion of parallel transport on a general manifold.

Christoffel symbols are *not* tensors. Their transformation law under a coordinate change picks up an inhomogeneous term involving second derivatives of the coordinate transformation, which is exactly the term needed to make covariant derivatives transform tensorially. They appear in the covariant derivative of a contravariant vector, ∇_μ V^ρ = ∂_μ V^ρ + Γ^ρ_{μν} V^ν, and with a minus sign in the covariant derivative of a covariant one. Most physically, they appear in the geodesic equation d²x^μ/dλ² + Γ^μ_{αβ} (dx^α/dλ)(dx^β/dλ) = 0, where they encode the gravitational acceleration that a freely-falling particle experiences relative to a coordinate-line frame — the apparent force of gravity recast as a curvature artefact of the chosen chart.`,
    relatedPhysicists: ["tullio-levi-civita"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "christoffels-and-parallel-transport" },
      { branchSlug: "relativity", topicSlug: "geodesics" },
    ],
  },
  {
    slug: "parallel-transport",
    term: "Parallel transport",
    category: "concept",
    shortDefinition: "The operation that moves a vector along a curve while keeping it as parallel as possible — its covariant derivative along the curve vanishes: D V^μ/dλ = 0. On flat space this returns the same vector; on a curved space it generally rotates. The rotation around a closed loop is the holonomy and is a direct measure of curvature.",
    description: `Parallel transport is the operation of carrying a vector along a curve on a manifold while keeping it as parallel as possible to itself in the local geometric sense — that is, demanding that its covariant derivative along the curve vanish: D V^μ/dλ ≡ (dx^ν/dλ) ∇_ν V^μ = (dV^μ/dλ) + Γ^μ_{νρ} (dx^ν/dλ) V^ρ = 0. The condition is a first-order ordinary differential equation for the components V^μ(λ) along the curve, and given an initial vector at one end, integration produces a uniquely transported vector at every point along the curve. The transport depends on the path between two points, not just on the endpoints — except on flat space, where parallel transport is path-independent and reduces to ordinary translation of vectors.

On a curved manifold, parallel transport along different paths between the same two endpoints generally gives different vectors at the endpoint. More dramatically, parallel-transporting a vector around a closed loop generally rotates it: the rotation angle is the holonomy, and its non-vanishing is a direct measure of curvature. The classic illustration is on a 2-sphere: a vector parallel-transported around a spherical triangle picks up an angular deficit equal to the enclosed area divided by R², which is the Gauss-Bonnet relation for that geometry. Parallel transport, defined intrinsically by Levi-Civita in 1917, is the geometric content of the Christoffel symbols and the conceptual root from which the Riemann curvature tensor is derived.`,
    relatedPhysicists: ["tullio-levi-civita"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "christoffels-and-parallel-transport" },
      { branchSlug: "relativity", topicSlug: "the-riemann-tensor" },
    ],
  },
  {
    slug: "holonomy",
    term: "Holonomy",
    category: "concept",
    shortDefinition: "The rotation a vector picks up when parallel-transported around a closed loop on a manifold. Vanishes if and only if the curvature is zero. On a 2-sphere of radius R, transporting around a loop enclosing area A rotates the vector by A/R² — the spherical-triangle holonomy reveal that motivates the Riemann tensor.",
    description: `Holonomy is the linear map produced on the tangent space at a point by parallel-transporting vectors around a closed loop based at that point. On a flat manifold the holonomy of every loop is the identity — vectors come back to themselves regardless of path. On a curved manifold the holonomy is non-trivial: parallel transport around a loop generally rotates a vector by a non-zero angle, and the rotation depends on the geometry enclosed by the loop. The set of all holonomies forms the holonomy group of the manifold, a subgroup of the orthogonal group O(n) for a Riemannian metric (and of the Lorentz group for a Lorentzian one). The holonomy vanishes for every loop if and only if the manifold is flat.

The classical illustration lives on the 2-sphere of radius R. Parallel-transporting a vector around a spherical triangle whose vertices are the north pole and two points on the equator produces a rotation equal to the area A enclosed divided by R². This is the spherical-triangle "money shot" reveal — the holonomy of an infinitesimal loop is exactly the Riemann curvature tensor contracted against the loop's bi-vector area element, which is how Riemann curvature is sometimes most concretely defined: R^ρ_{σμν} measures the holonomy per unit area in the (μ, ν) plane acting on a vector with σ and ρ indices. Curvature is what holonomy detects, and holonomy is what makes curvature locally measurable without leaving the manifold.`,
    relatedPhysicists: [],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "christoffels-and-parallel-transport" },
      { branchSlug: "relativity", topicSlug: "the-riemann-tensor" },
    ],
  },
  {
    slug: "geodesic-equation",
    term: "Geodesic equation",
    category: "concept",
    shortDefinition: "d²x^μ/dλ² + Γ^μ_{αβ} (dx^α/dλ)(dx^β/dλ) = 0. The trajectory of a freely-falling particle in curved spacetime; the curve whose tangent is parallel-transported along itself. Generalises the Newtonian straight line. In GR, free-fall = geodesic motion.",
    description: `The geodesic equation, d²x^μ/dλ² + Γ^μ_{αβ} (dx^α/dλ)(dx^β/dλ) = 0, governs the trajectory of a freely-falling test particle in curved spacetime. It can be derived in two equivalent ways: by extremising the proper-time action S = ∫ √(g_{μν} dx^μ dx^ν) along the curve (the curve of extremal proper time between two events), or by demanding that the curve's own tangent vector be parallel-transported along itself, which is the geometric definition of "as straight as possible." The Christoffel symbols Γ^μ_{αβ} encode the gravitational acceleration relative to a coordinate-line frame; the equation says that this acceleration plus the coordinate acceleration sums to zero, which is the relativistic statement of Newton's first law in a curved spacetime.

Geodesics generalise the straight lines of Euclidean geometry to arbitrary Riemannian and pseudo-Riemannian manifolds. On a 2-sphere they are the great circles; on Minkowski spacetime they are straight lines at constant velocity; on Schwarzschild spacetime they are the timelike orbits and null light-paths around a black hole. The equivalence principle makes the identification "free-fall = geodesic" an axiom: no force acts on a body in free-fall, so by Newton's first law its world-line should be the relativistic generalisation of a straight line, and that is precisely the geodesic. A test particle's response to gravity in general relativity is fully encoded in this single second-order ordinary differential equation, parametrised by an affine parameter (proper time τ for timelike geodesics, an arbitrary affine parameter for null ones).`,
    relatedPhysicists: ["albert-einstein", "tullio-levi-civita"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "geodesics" },
      { branchSlug: "relativity", topicSlug: "christoffels-and-parallel-transport" },
    ],
  },
  // RT §08 ────────────────────────────────────────────────────────────────
  {
    slug: "riemann-tensor",
    term: "Riemann curvature tensor",
    category: "concept",
    shortDefinition: "R^ρ_{σμν} = ∂_μ Γ^ρ_{νσ} − ∂_ν Γ^ρ_{μσ} + Γ^ρ_{μλ} Γ^λ_{νσ} − Γ^ρ_{νλ} Γ^λ_{μσ}. The (1,3) tensor that fully characterises spacetime curvature; 20 algebraically independent components in 4D. Vanishes if and only if the manifold is flat. Bianchi identity ∇_λ R^ρ_{σμν} + cyclic = 0 underwrites the divergence-free Einstein tensor.",
    description: `The Riemann curvature tensor R^ρ_{σμν} is the (1,3) tensor that fully characterises the curvature of a Riemannian or pseudo-Riemannian manifold. Computed from the Christoffel symbols by R^ρ_{σμν} = ∂_μ Γ^ρ_{νσ} − ∂_ν Γ^ρ_{μσ} + Γ^ρ_{μλ} Γ^λ_{νσ} − Γ^ρ_{νλ} Γ^λ_{μσ}, it measures the failure of covariant derivatives to commute and equivalently the holonomy of parallel transport around an infinitesimal loop. The Riemann tensor vanishes identically if and only if the manifold is flat — a global statement, even though it is computed pointwise. In a four-dimensional spacetime it has 256 components reduced by symmetries to 20 algebraically independent ones, encoding the full local curvature information that gravity carries.

The Riemann tensor satisfies algebraic symmetries (R_{ρσμν} = R_{μνρσ} = −R_{σρμν} = −R_{ρσνμ}, plus a cyclic identity in the last three indices) and the differential Bianchi identity ∇_λ R^ρ_{σμν} + ∇_μ R^ρ_{σνλ} + ∇_ν R^ρ_{σλμ} = 0. Contracting the Bianchi identity twice yields ∇^μ G_{μν} = 0, the divergence-free property of the Einstein tensor that lets G_{μν} = (8πG/c⁴) T_{μν} couple consistently to a conserved stress-energy tensor — the structural reason general relativity's field equations have exactly the form they do. The Riemann tensor traces down through the Ricci tensor R_{μν} = R^λ_{μλν} and Ricci scalar R = g^{μν} R_{μν}, the inputs to Einstein's equations.`,
    relatedPhysicists: ["bernhard-riemann"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "the-riemann-tensor" },
      { branchSlug: "relativity", topicSlug: "ricci-and-the-einstein-tensor" },
    ],
  },
  {
    slug: "ricci-tensor",
    term: "Ricci tensor",
    category: "concept",
    shortDefinition: "R_{μν} = R^λ_{μλν} — the trace of the Riemann tensor over its first and third indices. Symmetric (0,2) tensor with 10 independent components in 4D. Appears directly on the geometric side of Einstein's field equations: R_{μν} − (1/2) R g_{μν} = (8πG/c⁴) T_{μν}.",
    description: `The Ricci tensor R_{μν} is the contraction of the Riemann curvature tensor over its first and third indices: R_{μν} = R^λ_{μλν} = g^{λρ} R_{ρμλν}. It is a symmetric (0,2) tensor field on the manifold; in four spacetime dimensions it has ten algebraically independent components, fewer than the Riemann tensor's 20 because the trace operation collapses the algebraic structure. Geometrically, R_{μν} measures how the volume of a small geodesic ball deviates from the corresponding volume in flat space along the directions selected by μ and ν — the *trace* part of curvature, the part that controls volume contraction (or expansion) under geodesic flow, as distinct from the trace-free Weyl part of Riemann that controls tidal shearing.

The physical importance of the Ricci tensor is that it appears directly in the geometric side of Einstein's field equations: G_{μν} = R_{μν} − (1/2) R g_{μν} = (8πG/c⁴) T_{μν}. Among all tensors derivable from the metric and its first two derivatives, the combination on the left-hand side is essentially uniquely picked out by the requirement of being symmetric, having the right number of derivatives, and being divergence-free (so that it can couple consistently to a conserved stress-energy tensor T_{μν}). The Ricci tensor is named after Gregorio Ricci-Curbastro, Levi-Civita's collaborator on the 1900 *Méthodes de calcul différentiel absolu*. The trace of the Ricci tensor with the inverse metric gives the Ricci scalar R, the simplest scalar invariant of curvature.`,
    relatedPhysicists: ["bernhard-riemann"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "ricci-and-the-einstein-tensor" },
      { branchSlug: "relativity", topicSlug: "einsteins-field-equations" },
    ],
  },
  {
    slug: "ricci-scalar",
    term: "Ricci scalar",
    category: "concept",
    shortDefinition: "R = g^{μν} R_{μν} — the contraction of the Ricci tensor with the inverse metric. A scalar field at each point of spacetime. Positive R indicates positively-curved (sphere-like) geometry; negative R indicates negatively-curved (saddle-like). The simplest scalar curvature invariant.",
    description: `The Ricci scalar R = g^{μν} R_{μν} is the trace of the Ricci tensor against the inverse metric and the simplest scalar invariant constructible from the curvature of a Riemannian or pseudo-Riemannian manifold. As a scalar field on the manifold, it is a coordinate-independent function R(x) whose value at each point characterises the local "average" curvature in a single number. On a 2-sphere of radius a, R = 2/a² is positive everywhere — the sphere is positively curved. On a hyperbolic 2-space of radius a, R = −2/a² is negative everywhere — the saddle-like geometry. On flat Minkowski spacetime, R = 0; on the Schwarzschild solution outside the horizon, R = 0 (vacuum solution), although the Riemann tensor is far from zero — the Ricci scalar is too coarse an invariant to detect tidal curvature.

The Ricci scalar plays a privileged role in the action principle for general relativity. The Einstein-Hilbert action S = (c⁴/16πG) ∫ R √(−g) d⁴x — varied with respect to the metric g^{μν} — gives Einstein's field equations in vacuum, and adding a matter Lagrangian recovers the full field equations with the stress-energy tensor on the right-hand side. The fact that R is the unique non-trivial scalar with the right dimensions and number of derivatives is the structural reason for the form of the field equations. Hilbert's November 1915 derivation by this variational method occurred almost simultaneously with Einstein's; the action is named for both.`,
    relatedPhysicists: ["bernhard-riemann"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "ricci-and-the-einstein-tensor" },
      { branchSlug: "relativity", topicSlug: "einsteins-field-equations" },
    ],
  },
  {
    slug: "einstein-tensor",
    term: "Einstein tensor",
    category: "concept",
    shortDefinition: "G_{μν} = R_{μν} − (1/2) R g_{μν}. The unique divergence-free combination of Ricci and metric — ∇^μ G_{μν} = 0, a consequence of the contracted Bianchi identities. The geometric side of Einstein's field equations G_{μν} = (8πG/c⁴) T_{μν}.",
    description: `The Einstein tensor G_{μν} = R_{μν} − (1/2) R g_{μν} is the symmetric (0,2) tensor built from the Ricci tensor and the metric that occupies the geometric side of Einstein's field equations. Its defining property — the property that picks it out from among all linear combinations of R_{μν} and R g_{μν} — is that it is divergence-free: ∇^μ G_{μν} = 0. This identity follows from contracting the second Bianchi identity ∇_λ R^ρ_{σμν} + (cyclic) = 0 twice, and it is what allows G_{μν} to couple consistently to the stress-energy tensor T_{μν}, which is itself conserved (∇^μ T_{μν} = 0) by the requirement of energy-momentum conservation. The Einstein tensor is therefore not a free choice; it is essentially uniquely fixed by the demand for a divergence-free, symmetric (0,2) tensor depending only on the metric and its first two derivatives.

In four spacetime dimensions the Einstein tensor has ten independent components, matching the ten independent components of the symmetric stress-energy tensor it equals on the right side of the field equations. In vacuum (T_{μν} = 0), the field equations reduce to G_{μν} = 0, which because of the trace structure is equivalent to R_{μν} = 0 — the vacuum Einstein equations. The Schwarzschild and Kerr black-hole solutions, gravitational waves in vacuum, and the de Sitter/anti-de Sitter spacetimes are all solutions of R_{μν} = 0 (with or without a cosmological-constant term Λ g_{μν}). Einstein introduced the tensor in his November 1915 *Feldgleichungen der Gravitation* paper.`,
    relatedPhysicists: ["albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "ricci-and-the-einstein-tensor" },
      { branchSlug: "relativity", topicSlug: "einsteins-field-equations" },
    ],
  },
  {
    slug: "stress-energy-tensor",
    term: "Stress-energy tensor",
    category: "concept",
    shortDefinition: "T_{μν} — the symmetric (0,2) tensor whose components encode energy density (T_{00}), momentum density (T_{0i}), pressure (T_{ii}), and shear stress (T_{ij}, i≠j). Conserved: ∇^μ T_{μν} = 0. The matter side of Einstein's field equations. Perfect fluid: T_{μν} = (ρ + p/c²) u_μ u_ν − p g_{μν}.",
    description: `The stress-energy tensor T_{μν} is the symmetric (0,2) tensor field that encodes the local distribution and flow of energy and momentum in a relativistic field theory. Its components carry direct physical interpretations: T_{00} is the energy density, T_{0i} is the momentum density (equivalently, the energy flux), T_{ii} is the pressure (the diagonal spatial components), and T_{ij} for i ≠ j is the shear stress (the off-diagonal spatial components). Together these ten independent components describe how energy and momentum are distributed in space and how they flow across surfaces in spacetime. The conservation law ∇^μ T_{μν} = 0 is the relativistic generalisation of the conservation of energy and momentum — equivalent in flat spacetime to ∂^μ T_{μν} = 0, the condition that energy and three-momentum are conserved at every point.

The stress-energy tensor sits on the matter side of Einstein's field equations: G_{μν} = (8πG/c⁴) T_{μν}. Different matter sectors contribute different forms. A perfect fluid (no shear, isotropic pressure) has T_{μν} = (ρ + p/c²) u_μ u_ν − p g_{μν}, where ρ is the rest-frame energy density, p the pressure, and u^μ the fluid four-velocity. The electromagnetic field contributes T_{μν} = (1/μ₀)(F_{μλ} F_ν^λ − (1/4) g_{μν} F_{λρ} F^{λρ}) — quadratic in the field tensor F_{μν}. A scalar field, a Dirac spinor, dust, radiation, dark energy: each has a characteristic T_{μν}, and the *sum* of all sectors sources spacetime curvature via Einstein's equations. The conservation law is *forced* by the Bianchi-identity-implied divergence-freedom of the Einstein tensor — geometry demands that matter satisfy ∇^μ T_{μν} = 0.`,
    relatedPhysicists: [],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "the-stress-energy-tensor" },
      { branchSlug: "relativity", topicSlug: "einsteins-field-equations" },
    ],
  },
  {
    slug: "einstein-field-equations",
    term: "Einstein field equations",
    category: "concept",
    shortDefinition: "G_{μν} = (8πG/c⁴) T_{μν}. Ten coupled nonlinear partial differential equations relating spacetime geometry (left) to matter-energy distribution (right). The defining equations of general relativity. Published November 1915 by Einstein; near-simultaneously derived by Hilbert via the Einstein-Hilbert action.",
    description: `The Einstein field equations G_{μν} = (8πG/c⁴) T_{μν} are the ten coupled nonlinear partial differential equations that constitute the dynamical content of general relativity. The left-hand side, the Einstein tensor G_{μν} = R_{μν} − (1/2) R g_{μν}, is a functional of the metric tensor g_{μν} and its first two derivatives; the right-hand side, the stress-energy tensor T_{μν}, encodes the distribution of energy and momentum in matter and non-gravitational fields. The equations relate the geometry of spacetime to its matter content — in John Wheeler's slogan, "matter tells spacetime how to curve, spacetime tells matter how to move." Their nonlinearity is essential: the gravitational field carries energy and momentum, and that energy itself sources further gravity, so the equations are not amenable to superposition the way Maxwell's equations or Newton's law of gravity are.

Einstein presented the equations in their final form on 25 November 1915 to the Prussian Academy of Sciences, in his paper *Die Feldgleichungen der Gravitation*; David Hilbert independently derived equivalent equations five days earlier, on 20 November, by varying the Einstein-Hilbert action S = (c⁴/16πG) ∫ R √(−g) d⁴x. The publication-priority footnote is delicate but the consensus is that Einstein established the physical theory while Hilbert independently gave it a variational derivation. The equations admit a one-parameter family of generalisations through the addition of a cosmological constant term, G_{μν} + Λ g_{μν} = (8πG/c⁴) T_{μν}, which Einstein included in 1917 (and later regretted) and which observational cosmology has since 1998 found to be non-zero — Λ ≈ 1.1 × 10⁻⁵² m⁻², the dark-energy contribution. The equations are the single most quoted equation of twentieth-century physics and remain experimentally verified to high precision in every regime that has been probed, from solar-system orbits to binary-pulsar timing to gravitational-wave inspirals. See the topic page *einsteins-field-equations* for the full derivation and discussion.`,
    relatedPhysicists: ["albert-einstein", "david-hilbert"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "einsteins-field-equations" },
      { branchSlug: "relativity", topicSlug: "the-newtonian-limit" },
    ],
  },
  {
    slug: "newtonian-limit",
    term: "Newtonian limit",
    category: "concept",
    shortDefinition: "The regime where Einstein's field equations reduce to Newton's: weak gravity (g_{μν} = η_{μν} + h_{μν}, |h| ≪ 1), slow sources (v ≪ c), static configuration. In this limit G_{00} ≈ −2∇²Φ/c² and T_{00} ≈ ρc², so EFE becomes ∇²Φ = 4πGρ — the Poisson equation of Newtonian gravity.",
    description: `The Newtonian limit is the regime in which Einstein's field equations reduce continuously to Newton's law of gravity. Three conditions define the limit: gravity is weak, so the metric departs only slightly from Minkowski (g_{μν} = η_{μν} + h_{μν} with |h_{μν}| ≪ 1); the sources are slow-moving (v ≪ c) and the configuration is static or nearly so; and the stress-energy tensor is dominated by rest-mass density (T_{00} ≈ ρc² ≫ p, momentum-flux components negligible). Under these conditions one identifies the gravitational potential Φ with the metric perturbation through h_{00} = −2Φ/c² — the time-time component of the metric carries the Newtonian potential — and works out, after some index-juggling, that G_{00} ≈ −2∇²Φ/c². The 00-component of the field equations then reads ∇²Φ = 4πGρ, which is exactly Poisson's equation for the Newtonian gravitational potential.

The recovery of Newton in this limit is what legitimises general relativity. Newtonian gravity, with all its centuries of experimental verification, must reappear as the slow-moving weak-field reduction of any acceptable relativistic theory of gravity — and the Einstein field equations satisfy this requirement structurally, with the constant 8πG/c⁴ on the right-hand side fixed precisely by demanding agreement. The same limit also reproduces the geodesic equation's reduction to Newton's second law with gravitational force −∇Φ, since in the Newtonian limit the geodesic equation's spatial components yield d²x^i/dt² ≈ −∂^i Φ. Beyond Newton, the next-order corrections in the post-Newtonian expansion encode the perihelion precession of Mercury, light deflection by the Sun, and the Shapiro time delay — the classical solar-system tests of GR.`,
    relatedPhysicists: ["isaac-newton", "albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "the-newtonian-limit" },
      { branchSlug: "relativity", topicSlug: "einsteins-field-equations" },
    ],
  },
  // §07 forward-ref alias ────────────────────────────────────────────
  {
    slug: "covariant-derivative",
    term: "Covariant derivative",
    category: "concept",
    shortDefinition: "The generalisation of the partial derivative to curved manifolds, ∇_μ V^ν = ∂_μ V^ν + Γ^ν_{μρ} V^ρ. Unlike ∂_μ V^ν (which is not a tensor on a curved space), the covariant derivative is a (1,1) tensor — the Christoffel correction Γ exactly cancels the non-tensorial transformation behaviour of the partial derivative.",
    description: `The covariant derivative is the operator that takes the partial-derivative concept to curved manifolds while preserving tensor character. The naïve partial derivative ∂_μ V^ν of a vector field on a curved space fails to transform as a tensor under a change of coordinates — when you differentiate, the basis vectors themselves change, and the partial derivative picks up extra terms that don't cancel covariantly. The fix is the Christoffel correction: define ∇_μ V^ν = ∂_μ V^ν + Γ^ν_{μρ} V^ρ, where Γ are the connection coefficients computed from the metric. The added term exactly compensates the non-tensorial contribution from the changing basis, and the result transforms as a (1,1) tensor.

The covariant derivative reduces to the ordinary partial derivative on a flat manifold (where Γ = 0 in Cartesian coordinates) but differs from it in any curved or curvilinear-coordinate setting. Parallel transport is defined by demanding that the covariant derivative along a curve vanish: ∇_{ẋ} V = 0 — a vector is "parallel-transported" when its covariant derivative along the curve's tangent vanishes. The Riemann curvature tensor (§08.1) is the commutator of two covariant derivatives, [∇_μ, ∇_ν] V^ρ = R^ρ_{σμν} V^σ — the failure of covariant derivatives to commute IS the curvature.`,
    relatedPhysicists: ["tullio-levi-civita"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "christoffels-and-parallel-transport" },
      { branchSlug: "relativity", topicSlug: "the-riemann-tensor" },
    ],
  },
  // §08 alias forward-ref ──────────────────────────────────────────────
  {
    slug: "gravitational-redshift",
    term: "Gravitational redshift",
    category: "phenomenon",
    shortDefinition: "Photons climbing out of a gravitational potential lose energy and frequency: Δν/ν = gh/c² for a tower of height h on Earth's surface; equivalently, clocks at lower potential tick slower than clocks at higher potential. A direct consequence of the equivalence principle, derivable without the field equations.",
    description: `Gravitational redshift is the energy-and-frequency loss suffered by a photon as it climbs out of a gravitational potential well. For a tower of height h on Earth's surface, a photon emitted at the bottom and received at the top is observed at a frequency reduced by Δν/ν = gh/c² — equivalently, clocks at lower gravitational potential tick slower than clocks at higher potential by the same fractional amount. The effect is a direct consequence of the equivalence principle alone — the same kinematic argument that says a uniformly accelerated rocket would observe identical Doppler shifts on internal photon-exchange experiments — and so is derivable without invoking the full field equations of general relativity. The Pound-Rebka experiment in 1960 measured Δν/ν ≈ 2.46 × 10⁻¹⁵ in a 22.5-meter tower at Harvard's Jefferson Physical Laboratory using the Mössbauer effect, the first laboratory test of GR. The full topic page treats the derivation, the Pound-Rebka apparatus, and the cosmological-redshift connection in detail.`,
    relatedPhysicists: ["albert-einstein", "pound-rebka"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "gravitational-redshift" },
      { branchSlug: "relativity", topicSlug: "einsteins-field-equations" },
      { branchSlug: "relativity", topicSlug: "the-newtonian-limit" },
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
