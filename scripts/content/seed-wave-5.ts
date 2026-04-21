// Seed Wave 5 (Module 8 · Lagrangian & Hamiltonian) physicists + glossary.
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-wave-5.ts
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
    slug: "pierre-louis-maupertuis",
    name: "Pierre Louis Moreau de Maupertuis",
    shortName: "Maupertuis",
    born: "1698",
    died: "1759",
    nationality: "French",
    oneLiner: "Stated the first principle of least action in 1744 and led the Lapland expedition that proved Earth is an oblate spheroid.",
    bio: "Maupertuis was a French mathematician, astronomer, and natural philosopher whose life straddled two scientific revolutions. Born in Saint-Malo in 1698 to a wealthy privateer's family, he was tutored at home before heading to Paris to study mathematics. Elected to the Académie des Sciences at twenty-five, he became an early and vocal champion of Newtonian physics in a France still wedded to Descartes — a position that put him in frequent correspondence with Voltaire and Émilie du Châtelet.\n\nHis most public triumph came in 1736, when he led a Royal Academy expedition to Lapland to measure a degree of the meridian near the Arctic Circle. A parallel expedition went to Peru. The question was whether the Earth bulged at the equator (as Newton had predicted) or at the poles (as the Cassini family insisted). Maupertuis, working through a winter of frostbite and reindeer sledges, returned with measurements that confirmed Newton. Voltaire nicknamed him 'the Great Flattener' and never stopped teasing him about it.\n\nIn 1744 Maupertuis presented to the Berlin Academy — where Frederick the Great had lured him as president — a memoir stating what is now called the principle of least action. He claimed that nature, in any process, minimises a quantity he called action — defined roughly as mass times velocity times distance integrated along a path — and he interpreted the principle theologically: God, acting economically, would design the world so that the simplest possible rule governed every motion. Euler, working at Berlin alongside him, produced the rigorous mathematical version the same year.",
    contributions: [
      "First explicit statement of the principle of least action (1744)",
      "Led the 1736 Lapland geodesy expedition that confirmed Newton's oblate Earth prediction",
      "Founding president of the Berlin Academy of Sciences under Frederick the Great",
      "Early proponent of ideas anticipating natural selection (Système de la nature, 1751)",
    ],
    majorWorks: [
      "Discours sur les différentes figures des astres (1732)",
      "La Figure de la Terre (1738)",
      "Accord entre différentes lois de la nature (1744)",
      "Essai de cosmologie (1750)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" }],
  },
  {
    slug: "pierre-de-fermat",
    name: "Pierre de Fermat",
    shortName: "Fermat",
    born: "1607",
    died: "1665",
    nationality: "French",
    oneLiner: "Toulouse magistrate and part-time mathematician who derived Snell's law from the principle of least time.",
    bio: "Fermat was born in 1607 in Beaumont-de-Lomagne, a small town in southwestern France, the son of a wealthy leather merchant. He studied law at the University of Toulouse and in 1631 bought a seat as a magistrate in the parlement of Toulouse — a post he held for the rest of his life. Mathematics was, for him, a hobby. He never published a book, never held an academic position, and left his results scattered through private correspondence with Mersenne, Pascal, Huygens, and Descartes.\n\nHis mathematical range was absurd. With Descartes he independently co-invented analytic geometry — the identification of algebraic equations with curves. With Pascal he founded probability theory, in a correspondence from the summer of 1654 sparked by a gambling problem. He developed a method of 'adequality' that anticipated Newton and Leibniz's calculus by a full generation. And he effectively invented modern number theory single-handedly, proving theorems on prime decomposition and representations of integers. His most famous claim — the margin note in his copy of Diophantus asserting that xⁿ + yⁿ = zⁿ has no nontrivial integer solutions for n > 2 — went unproven for 358 years until Andrew Wiles finished it in 1994.\n\nHis contribution to physics is narrow but foundational. In 1662, replying to a challenge from the Cartesian physicist Claude Clerselier, Fermat published a letter stating that light travels between two points along the path that takes the least time. This principle of least time — Fermat's principle — correctly reproduced Snell's law of refraction. It was the first variational principle in physics, and the seed from which Maupertuis, Euler, and Lagrange would grow the principle of least action.",
    contributions: [
      "Fermat's principle of least time (1662) — first variational principle in physics",
      "Co-founder, with Descartes, of analytic geometry",
      "Co-founder, with Pascal, of probability theory (correspondence of 1654)",
      "Method of adequality — a pre-calculus technique for tangents and extrema",
      "Founding figure of modern number theory — Fermat's little theorem, Fermat's Last Theorem",
    ],
    majorWorks: [
      "Methodus ad disquirendam maximam et minimam (1636)",
      "Synthesis ad refractiones — letter to Clerselier (1662)",
      "Observations on Diophantus (1670)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" }],
  },
  {
    slug: "joseph-liouville",
    name: "Joseph Liouville",
    shortName: "Liouville",
    born: "1809",
    died: "1882",
    nationality: "French",
    oneLiner: "Proved that Hamiltonian flow preserves phase-space volume — the theorem underlying statistical mechanics.",
    bio: "Joseph Liouville was a French mathematician whose career bridged the 19th-century worlds of pure analysis and celestial mechanics. Born in 1809 in Saint-Omer, he graduated from the École Polytechnique in 1827 and spent most of his working life in Paris, teaching at the Collège de France, the Sorbonne, and the École Polytechnique itself.\n\nHe is best known in physics for Liouville's theorem (1838): under Hamiltonian flow, volume in phase space is exactly conserved. The result is the mathematical backbone of statistical mechanics, the classical limit of quantum mechanics, and every modern symplectic integrator. In parallel Liouville did foundational work on transcendental numbers (the first explicit construction of a provably non-algebraic number, 1844), fractional calculus, differential algebra, and what is now called Sturm-Liouville theory of self-adjoint second-order ODEs.\n\nFrom 1836 he edited the Journal de Mathématiques Pures et Appliquées — still running today as 'Liouville's Journal' — through which he brought Évariste Galois's posthumous papers to the world in 1846, single-handedly rescuing Galois theory from obscurity. He died in Paris in 1882, with more than three hundred published papers across analysis, number theory, and mechanics to his name.",
    contributions: [
      "Liouville's theorem on the conservation of phase-space volume (1838)",
      "First explicit construction of a transcendental number (1844)",
      "Sturm-Liouville theory of self-adjoint second-order ODEs",
      "Editor of Journal de Mathématiques Pures et Appliquées; rescued Galois's manuscripts for publication (1846)",
    ],
    majorWorks: [
      "Note sur la théorie de la variation des constantes arbitraires (1838)",
      "Sur des classes très-étendues de quantités transcendantes (1844)",
      "Œuvres mathématiques d'Évariste Galois (1846)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "vladimir-arnold",
    name: "Vladimir Arnold",
    shortName: "Arnold",
    born: "1937",
    died: "2010",
    nationality: "Russian",
    oneLiner: "Kolmogorov's student who wrote the full proof of the KAM theorem at age 26 and reshaped classical mechanics into differential geometry.",
    bio: "Vladimir Igorevich Arnold was nineteen when he solved Hilbert's thirteenth problem, a question that had stood for over fifty years. He was the most brilliant student of Andrey Kolmogorov at Moscow State University, and for the rest of his life he carried the Moscow mathematical tradition — geometric, intuitive, fearless — to the rest of the world.\n\nIn 1963 he published the full proof of what Kolmogorov had sketched in 1954: that most invariant tori of an integrable Hamiltonian system survive small perturbations. The resulting theorem, completed independently by Jürgen Moser in the smooth case, is the KAM theorem, and it is the reason the solar system has not flown apart. Arnold's 1978 textbook Mathematical Methods of Classical Mechanics rewrote the subject from the ground up, treating phase space as a symplectic manifold and making geometry the native language of dynamics.\n\nHe worked across singularity theory, hydrodynamics, algebraic geometry, and dynamical systems with equal fluency. He was loud, opinionated, relentlessly generous to students, and famous for his dictum that 'mathematics is the part of physics where experiments are cheap.' His later years were spent in Paris and Moscow, lecturing to packed halls and writing a stream of essays on the state of mathematical education. He died in Paris in 2010; he is remembered as the most influential Russian mathematician of the second half of the twentieth century.",
    contributions: [
      "Completed the KAM theorem proof (1963)",
      "Solved Hilbert's thirteenth problem at age nineteen",
      "Discovered Arnold diffusion in high-dimensional Hamiltonian systems",
      "Rewrote classical mechanics as the geometry of symplectic manifolds",
      "Founded Russian singularity theory",
    ],
    majorWorks: [
      "Proof of a Theorem of A. N. Kolmogorov (1963)",
      "Mathematical Methods of Classical Mechanics (1978)",
      "Ordinary Differential Equations (1973)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "phase-space" }],
  },
  {
    slug: "jurgen-moser",
    name: "Jürgen Moser",
    shortName: "Moser",
    born: "1928",
    died: "1999",
    nationality: "German-American",
    oneLiner: "The third initial of KAM, who proved that Kolmogorov's theorem survives when the Hamiltonian is merely smooth rather than analytic.",
    bio: "Jürgen Moser was born in Königsberg in 1928. He studied in Göttingen under Franz Rellich and Carl Ludwig Siegel, the last great custodian of nineteenth-century celestial mechanics, and emigrated to the United States in 1955, eventually taking a long professorship at the Courant Institute in New York.\n\nIn 1962, working independently of Kolmogorov and Arnold and with a rather different technique — a convergent-iteration scheme now called the Nash-Moser theorem — he proved the invariant-torus result for smooth Hamiltonians, where analyticity cannot be assumed. The three proofs together are the KAM theorem. Moser spent the rest of his career at ETH Zurich, where he directed the Mathematical Research Institute and trained a generation of analysts on the continent.\n\nHis interests ranged from celestial mechanics to minimal surfaces to integrable systems to the geometry of partial differential equations. He was known for a style that was quiet, precise, and devastatingly direct: colleagues recalled that a 'Moser lecture' was shorter than other lectures and twice as clear. He died in Zurich in 1999.",
    contributions: [
      "Proved the smooth case of the KAM theorem (1962)",
      "Developed the Nash-Moser implicit function theorem for nonlinear PDE",
      "Co-authored Lectures on Celestial Mechanics with Siegel",
      "Moser's twist theorem on area-preserving maps of the annulus",
    ],
    majorWorks: [
      "On Invariant Curves of Area-Preserving Mappings of an Annulus (1962)",
      "Lectures on Celestial Mechanics (1971)",
      "Stable and Random Motions in Dynamical Systems (1973)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "phase-space" }],
  },
  {
    slug: "aleksandr-lyapunov",
    name: "Aleksandr Lyapunov",
    shortName: "Lyapunov",
    born: "1857",
    died: "1918",
    nationality: "Russian",
    oneLiner: "Author of the 1892 doctoral thesis that invented modern stability theory and the exponent that now quantifies every chaotic system.",
    bio: "Aleksandr Mikhailovich Lyapunov was born in Yaroslavl in 1857 and grew up in a family of mathematicians and astronomers. At St. Petersburg University he became the closest student of Pafnuty Chebyshev, and his 1892 doctoral thesis — The General Problem of the Stability of Motion — created a discipline.\n\nBefore Lyapunov, 'stability' had meant different things to different mechanicians; after him it meant one thing, defined rigorously by what is now called a Lyapunov function, and the exponential rate at which nearby trajectories separated could be made a precise numerical quantity, the Lyapunov exponent. He worked mostly on the shapes of rotating equilibrium figures of fluids, an old problem of Newton's that connects to the structure of stars and planets, and he extended probability theory with a sharp version of the central limit theorem.\n\nHe taught in Kharkov and St. Petersburg, was elected to the Academy of Sciences in 1901, and lived the quiet life of a nineteenth-century Russian professor. The Russian Civil War found him living in Odessa in 1918. When his wife died of tuberculosis in October of that year, he shot himself that same day; he lingered three more days before dying. His mathematics has outlived two empires and one superpower.",
    contributions: [
      "Founded modern stability theory in his 1892 doctoral thesis",
      "Introduced Lyapunov functions, Lyapunov stability, and Lyapunov exponents",
      "Proved a strong form of the central limit theorem (1901) under Lyapunov conditions",
      "Studied equilibrium figures of rotating fluids",
    ],
    majorWorks: [
      "The General Problem of the Stability of Motion (1892)",
      "Nouvelle Forme du Théorème sur la Limite de Probabilité (1901)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "phase-space" }],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "action",
    term: "Action",
    category: "concept",
    shortDefinition: "The time-integral of the Lagrangian along a trajectory: S = ∫ L dt = ∫ (T − V) dt. Units of energy × time.",
    description: "Action is the scalar quantity assigned to a candidate trajectory of a mechanical system. You integrate the Lagrangian L = T − V from the start event to the end event along the candidate path, and the resulting number — the action S — scores the path. The physical trajectory is the one for which S is stationary under small variations.\n\nAction has the same units as Planck's constant ℏ; in quantum mechanics each path contributes a phase exp(iS/ℏ), and the classical path emerges as the one around which these phases stop interfering destructively. The ubiquity of action principles — from Newton's mechanics to general relativity to every quantum field theory of the Standard Model — is one of the deepest facts in physics.",
    relatedPhysicists: ["pierre-louis-maupertuis", "leonhard-euler", "joseph-louis-lagrange"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" }],
  },
  {
    slug: "principle-of-least-action",
    term: "Principle of least action",
    category: "concept",
    shortDefinition: "Of all paths a system could take between two fixed events, the one realised in nature is the path for which the action S is stationary.",
    description: "First stated by Maupertuis in 1744 and placed on rigorous footing by Euler the same year, the principle of least action is the variational backbone of classical mechanics. It replaces Newton's moment-by-moment force law with a single global optimisation: choose endpoints, define S = ∫ L dt over all smooth paths connecting them, and the physical path is the one at which δS = 0.\n\nThe same principle, with different Lagrangians, generates Maxwell's electromagnetism, Einstein's general relativity, and every quantum field theory of the Standard Model. 'Least' is historical — the rigorous condition is stationarity, which for almost every classical problem is in fact a local minimum.",
    history: "Stated by Maupertuis in 1744; rigorously derived by Euler the same year; extended by Lagrange in Mécanique analytique (1788). Hamilton rewrote it in 1834 in a form that survived into quantum mechanics.",
    relatedPhysicists: ["pierre-louis-maupertuis", "leonhard-euler", "joseph-louis-lagrange", "pierre-de-fermat"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" }],
  },
  {
    slug: "stationary-action",
    term: "Stationary action",
    category: "concept",
    shortDefinition: "The precise formulation of least action: δS = 0 for every first-order variation of the path vanishing at the endpoints.",
    description: "Calling the principle 'least' action is a useful slogan but technically inaccurate. What the physical path actually satisfies is stationarity: if you perturb the path by any small, endpoint-preserving variation δq(t), the first-order change in S vanishes.\n\nThe second-order change decides whether the extremum is a minimum (usually), a saddle (occasionally, for long time intervals near a conjugate point), or, rarely, a maximum. What matters for physics is only the first-order condition, because that is what is equivalent — via the calculus of variations — to the Euler-Lagrange equation, and hence to Newton's second law.",
    relatedPhysicists: ["leonhard-euler", "joseph-louis-lagrange"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" }],
  },
  {
    slug: "fermats-principle",
    term: "Fermat's principle",
    category: "concept",
    shortDefinition: "Light travels between two points along the path that takes the least time.",
    description: "Stated by Pierre de Fermat in 1662, this was the first variational principle in physics. From it alone — without any assumption about whether light is a particle or a wave — one can derive Snell's law of refraction, the straight-line propagation of light in a uniform medium, and the reflection law for mirrors.\n\nWriting the total travel time as a functional of the path and demanding that it be stationary gives, at any interface between two media of speeds v₁ and v₂, the condition sin θ₁ / v₁ = sin θ₂ / v₂, which is Snell's law. Fermat's principle was the direct conceptual precursor of Maupertuis's principle of least action; it generalises, in modern optics, to the principle of stationary optical path length.",
    history: "Formulated by Pierre de Fermat in 1662 in reply to a challenge from the Cartesian physicist Claude Clerselier, defending the least-time derivation of Snell's law.",
    relatedPhysicists: ["pierre-de-fermat"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" }],
  },
  {
    slug: "euler-lagrange-equations",
    term: "Euler-Lagrange equations",
    category: "concept",
    shortDefinition: "d/dt(∂L/∂q̇) = ∂L/∂q — the differential form of stationary action, equivalent to Newton's second law.",
    description: "The Euler-Lagrange equation converts the global variational condition δS = 0 into a local differential equation for every generalised coordinate: d/dt(∂L/∂q̇ᵢ) = ∂L/∂qᵢ. It follows from integration by parts and the fundamental lemma of the calculus of variations.\n\nFor a Lagrangian L = T − V with T = ½mv² and V = V(q), the Euler-Lagrange equation reproduces exactly Newton's second law F = ma. The power of the formulation is that it works unchanged in any coordinate system: polar, spherical, rotating, constrained. Choose the coordinates that make the constraints vanish, crank through the equation, and the dynamics fall out.",
    history: "Derived by Euler and Lagrange independently in the mid-18th century. Lagrange's 1788 Mécanique analytique brought the formulation to its modern state.",
    relatedPhysicists: ["joseph-louis-lagrange", "leonhard-euler"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-lagrangian" }],
  },
  {
    slug: "generalised-coordinates",
    term: "Generalised coordinates",
    category: "concept",
    shortDefinition: "Any set of independent variables that fully specifies a system's configuration. Not necessarily Cartesian.",
    description: "Generalised coordinates q₁, q₂, …, qₙ are any independent variables sufficient to pin down every configuration of a mechanical system. For a pendulum, a single angle θ is enough. For a double pendulum, two angles. For a bead sliding along a wire, the arc length. Cartesian position (x, y, z) is one legitimate choice, but almost never the most convenient.\n\nThe Lagrangian method works in ANY choice of generalised coordinates — this is its central strength. Constraints that would require explicit normal forces in a Newtonian free-body diagram disappear automatically when the constraint surface is the domain of the generalised coordinate.",
    relatedPhysicists: ["joseph-louis-lagrange"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-lagrangian" }],
  },
  {
    slug: "constraint",
    term: "Constraint",
    category: "concept",
    shortDefinition: "A restriction on the motion of a system — a surface, wire, or fixed distance. In Lagrangian mechanics, absorbed into coordinate choice.",
    description: "A constraint restricts where the degrees of freedom of a system can go. A bead threaded on a wire is constrained to the wire. A pendulum bob is constrained to a sphere of fixed radius. Rigid bodies are constrained to fixed inter-particle distances.\n\nIn Newtonian mechanics, each constraint produces an unknown constraint force (the normal reaction from the wire, the tension in the pendulum string) that must be carried through every free-body diagram and eliminated at the end. Lagrangian mechanics handles constraints by a coordinate change: you choose generalised coordinates along the constraint surface, write down T − V on that surface, crank the Euler-Lagrange equation, and the constraint force never appears. This is why solving a bead-on-wire problem by Lagrange takes three lines while solving it by Newton fills a page.",
    relatedPhysicists: ["joseph-louis-lagrange"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-lagrangian" }],
  },
  {
    slug: "hamiltonian",
    term: "Hamiltonian",
    category: "concept",
    shortDefinition: "A scalar function H(q, p, t) whose partial derivatives, via Hamilton's equations, generate time evolution. For conservative systems, H = T + V.",
    description: "The Hamiltonian is the scalar function H(q, p, t) obtained from the Lagrangian by a Legendre transform: H = Σ pᵢq̇ᵢ − L, with pᵢ = ∂L/∂q̇ᵢ. For a time-independent potential it equals the total energy T + V — a consequence of time-translation symmetry via Noether's theorem.\n\nThe Hamiltonian generates the dynamics through Hamilton's equations: q̇ᵢ = ∂H/∂pᵢ, ṗᵢ = −∂H/∂qᵢ. These are first-order and symmetric in q and p, which makes them the natural setting for phase-space geometry, symplectic integrators, and the canonical quantisation of classical systems into quantum mechanics.",
    relatedPhysicists: ["william-rowan-hamilton"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" }],
  },
  {
    slug: "conjugate-momentum",
    term: "Conjugate momentum",
    category: "concept",
    shortDefinition: "The momentum paired with a generalised coordinate q, defined as p = ∂L/∂q̇.",
    description: "For every generalised coordinate qᵢ, the conjugate momentum is defined by pᵢ = ∂L/∂q̇ᵢ. For a free particle with L = ½mv², this reduces to the familiar p = mv. For a charged particle in a magnetic field it becomes m·v + qA, mixing mechanical momentum with electromagnetic field potential.\n\nConjugate momentum is what appears naturally in the Hamiltonian formulation and in quantum mechanics. When you canonically quantise a system you replace q and p with operators satisfying [q, p] = iℏ, and the 'p' there is always the conjugate momentum, not m·v. This is why the minimal-coupling prescription in electromagnetism is so universal.",
    relatedPhysicists: ["william-rowan-hamilton", "joseph-louis-lagrange"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" }],
  },
  {
    slug: "hamiltons-equations",
    term: "Hamilton's equations",
    category: "concept",
    shortDefinition: "The first-order system q̇ = ∂H/∂p, ṗ = −∂H/∂q generating time evolution in phase space.",
    description: "Hamilton's equations replace the second-order Euler-Lagrange equations with a first-order pair: q̇ᵢ = ∂H/∂pᵢ, ṗᵢ = −∂H/∂qᵢ. Evolution of the system is a flow on 2N-dimensional phase space, and the flow is strictly Hamiltonian in a geometric sense: it preserves the symplectic form dq ∧ dp.\n\nThe symmetry between position and momentum that the equations exhibit is the reason phase space is the natural arena for classical mechanics. Canonical transformations that mix q and p — rotations, reflections, generating-function transformations — leave the form of Hamilton's equations invariant.",
    history: "Derived by William Rowan Hamilton in 1833 as a Legendre transform of the Lagrangian formulation.",
    relatedPhysicists: ["william-rowan-hamilton"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" }],
  },
  {
    slug: "poisson-bracket",
    term: "Poisson bracket",
    category: "concept",
    shortDefinition: "The antisymmetric bilinear {f, g} = Σ (∂f/∂q·∂g/∂p − ∂f/∂p·∂g/∂q). Every observable evolves as df/dt = {f, H}.",
    description: "The Poisson bracket of two phase-space functions f and g is the antisymmetric bilinear operation {f, g} = Σᵢ (∂f/∂qᵢ · ∂g/∂pᵢ − ∂f/∂pᵢ · ∂g/∂qᵢ). Hamilton's equations themselves can be written q̇ = {q, H}, ṗ = {p, H}, and every observable f that does not explicitly depend on time evolves as df/dt = {f, H}.\n\nDirac's canonical quantisation maps the Poisson bracket to the quantum commutator: {f, g}_classical ↔ (1/iℏ)[f̂, ĝ]_quantum. This is not a derivation but a dictionary — it is why position and momentum, whose classical Poisson bracket is {q, p} = 1, have quantum commutator [q̂, p̂] = iℏ.",
    history: "Introduced by Siméon Denis Poisson in the early 19th century; recognised as the classical analog of the quantum commutator by Dirac in 1925.",
    relatedPhysicists: ["simeon-denis-poisson", "william-rowan-hamilton"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" }],
  },
  {
    slug: "liouvilles-theorem",
    term: "Liouville's theorem",
    category: "concept",
    shortDefinition: "Under Hamiltonian flow, phase-space volume is exactly conserved. The foundation of classical statistical mechanics.",
    description: "Liouville's theorem states that the flow generated by a Hamiltonian preserves phase-space volume: if you follow a region R(0) of initial conditions forward in time under Hamilton's equations, the volume of R(t) equals the volume of R(0) for all t. The proof is one-line: the divergence of the phase-space velocity field (q̇, ṗ) vanishes identically, because ∂q̇/∂q + ∂ṗ/∂p = ∂²H/∂q∂p − ∂²H/∂p∂q = 0.\n\nThe consequence is deep. Dissipative systems (friction, damping) shrink phase-space volume as they evolve; conservative Hamiltonian systems cannot. Classical statistical mechanics lives on exactly this geometric fact — the microcanonical ensemble is well-defined precisely because the phase-space measure is preserved by evolution.",
    history: "Proved by Joseph Liouville in 1838.",
    relatedPhysicists: ["joseph-liouville", "william-rowan-hamilton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "symplectic",
    term: "Symplectic",
    category: "concept",
    shortDefinition: "The antisymmetric non-degenerate 2-form dq ∧ dp on phase space. Preserved exactly by Hamiltonian flow.",
    description: "A symplectic structure is an antisymmetric non-degenerate 2-form on a manifold. Phase space carries the canonical symplectic form ω = Σ dqᵢ ∧ dpᵢ, and Hamiltonian flow is defined precisely as the flow that preserves this form. Liouville's theorem (conservation of phase-space volume) is an immediate corollary: volume is ω^n / n! for an n-degree-of-freedom system.\n\nNumerical integrators that preserve the symplectic form — leapfrog, velocity-Verlet, Yoshida — are called symplectic integrators. They do not conserve energy exactly, but their energy error is bounded and oscillates rather than drifting. This is why symplectic integrators are standard for long-time orbital simulations: a conventional forward-Euler integrator drifts a planetary orbit outward, but a leapfrog integrator keeps the orbit closed to machine precision for billions of years.",
    relatedPhysicists: ["william-rowan-hamilton", "joseph-liouville"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "phase-space",
    term: "Phase space",
    category: "concept",
    shortDefinition: "The 2N-dimensional space of (position, momentum) pairs in which every classical state is a single point.",
    description: "Phase space is the 2N-dimensional space of (q, p) pairs for a system with N degrees of freedom. A single point in phase space completely specifies the state of the system: every position and every momentum. A trajectory is a curve in phase space; an ensemble of states is a region.\n\nPhase space is the natural stage for Hamiltonian mechanics, statistical mechanics, and chaos theory. Liouville's theorem says phase-space volume is conserved under Hamiltonian flow. Poincaré recurrence says that a bounded system eventually returns near any previous state. The KAM theorem says that most integrable tori in phase space survive small perturbations. All three are statements about the geometry of phase space rather than about any particular system.",
    relatedPhysicists: ["william-rowan-hamilton", "joseph-liouville", "henri-poincare"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
    ],
  },
  {
    slug: "chaos",
    term: "Chaos",
    category: "phenomenon",
    shortDefinition: "Deterministic dynamics with sensitive dependence on initial conditions — nearby trajectories diverge exponentially.",
    description: "A dynamical system is chaotic when two trajectories starting from arbitrarily close initial conditions separate exponentially fast: |δx(t)| ≈ |δx(0)| · e^(λt), where λ > 0 is the largest Lyapunov exponent. The system is fully deterministic — no randomness — but the exponential amplification of initial-condition error makes long-term prediction impossible in practice.\n\nChaos is common in Hamiltonian systems, typically associated with the destruction of invariant tori that KAM theorem protects only under small perturbations. The double pendulum, the three-body problem, and the driven damped pendulum are canonical chaotic systems. Weather prediction is bounded by the roughly 2-week Lyapunov time of the atmosphere.",
    history: "Discovered by Henri Poincaré in 1890 in his study of the three-body problem; rediscovered by Edward Lorenz in 1963 in a simple model of atmospheric convection.",
    relatedPhysicists: ["henri-poincare", "aleksandr-lyapunov"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "lyapunov-exponent",
    term: "Lyapunov exponent",
    category: "concept",
    shortDefinition: "The exponential rate λ at which nearby trajectories of a dynamical system diverge. Positive λ means chaos.",
    description: "The Lyapunov exponent λ quantifies sensitive dependence on initial conditions: for two trajectories starting at nearly identical phase-space points, the separation grows as |δx(t)| ≈ |δx(0)| · e^(λt) on average. A chaotic system has at least one positive Lyapunov exponent.\n\nFor the atmosphere, λ ≈ 1/(2 weeks) — after two weeks, initial-condition uncertainty has grown by a factor of e, and deterministic weather prediction is essentially useless. For the solar system, λ ≈ 1/(5 million years), which is why planetary positions cannot be predicted beyond a few tens of millions of years into the past or future.",
    history: "Defined by Aleksandr Lyapunov in his 1892 doctoral thesis on the stability of motion; extended to the multiplicative ergodic theorem by Oseledets in 1968.",
    relatedPhysicists: ["aleksandr-lyapunov"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "phase-space" }],
  },
  {
    slug: "kam-theorem",
    term: "KAM theorem",
    category: "concept",
    shortDefinition: "Most invariant tori of a near-integrable Hamiltonian system survive small perturbations. Proves the solar system is mostly stable.",
    description: "The Kolmogorov-Arnold-Moser theorem states that when a small perturbation is added to an integrable Hamiltonian system, most of the invariant tori in phase space (those with sufficiently irrational frequency ratios) survive as slightly deformed tori. Only a measure-zero set of tori is destroyed, and the dynamics on the surviving tori remains quasi-periodic.\n\nThe theorem was sketched by Kolmogorov in 1954, proved in full by Arnold in 1963 (analytic case) and by Moser in 1962 (smooth case). It is the mathematical reason the solar system has remained approximately stable for 4.5 billion years despite the planets continuously perturbing one another — the KAM tori that describe the planets' near-regular motion survive these perturbations.",
    history: "Sketched by Kolmogorov in 1954; proven in full by Arnold (analytic case, 1963) and Moser (smooth case, 1962).",
    relatedPhysicists: ["andrey-kolmogorov", "vladimir-arnold", "jurgen-moser"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "phase-space" }],
  },
  {
    slug: "poincare-recurrence",
    term: "Poincaré recurrence",
    category: "phenomenon",
    shortDefinition: "In a bounded Hamiltonian system, almost every trajectory returns arbitrarily close to its starting state — given enough time.",
    description: "Henri Poincaré proved in 1890 that for a bounded Hamiltonian system (one whose phase-space motion stays in a region of finite volume), almost every trajectory will, given enough time, return arbitrarily close to any point it has previously visited. The proof follows directly from Liouville's theorem: phase-space volume is preserved under evolution, but the total accessible volume is finite, so trajectories must revisit themselves.\n\nThe recurrence times can be astronomically long — longer than the age of the universe for any macroscopic system — but the theorem is exact. It unsettled Boltzmann, who had argued that entropy always increases, and it hints at the statistical-mechanics paradox: why do we observe an arrow of time in a reversible system where every state must be revisited?",
    history: "Proved by Henri Poincaré in 1890 in his prize-winning memoir on the three-body problem; clarified by Ernst Zermelo in 1896 in a sharp critique of Boltzmann's H-theorem.",
    relatedPhysicists: ["henri-poincare", "joseph-liouville"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "phase-space" }],
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
