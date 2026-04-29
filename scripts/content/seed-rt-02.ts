// Seed RT §03 Spacetime Geometry + §04 Relativistic Dynamics
// 1 physicist (Arthur Compton) + 17 new structural glossary terms
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-rt-02.ts
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
    slug: "arthur-compton",
    name: "Arthur Holly Compton",
    shortName: "Compton",
    born: "1892",
    died: "1962",
    nationality: "American",
    oneLiner: "American physicist, Nobel 1927. His 1923 X-ray-scattering experiment showed photons carry momentum p = h/λ and behave as particles in elastic collisions with electrons — completing the photon's mechanical legitimacy that Einstein's 1905 photoelectric paper had only hinted at. Later led the Manhattan Project's plutonium-production work at the Met Lab.",
    bio: `Arthur Holly Compton was born in Wooster, Ohio, in 1892, the son of a Presbyterian minister and college dean. He studied at the College of Wooster (BS 1913) and Princeton (PhD 1916, working on X-ray reflection from crystals), then took a research fellowship at the Cavendish Laboratory in Cambridge in 1919–1920 under J. J. Thomson and Ernest Rutherford. Returning to the United States, he joined Washington University in St. Louis in 1920, where over the next three years he carried out the experiments that would change the status of the photon.

By 1922 the wave nature of light was experimentally settled. Photons — Einstein's 1905 light quanta — were a theoretical proposal whose mechanical legitimacy was contested. Compton scattered monochromatic Mo Kα X-rays (λ ≈ 0.071 nm) off a graphite target and measured the wavelength of the scattered radiation as a function of scattering angle θ. He found the wavelength shifted: Δλ = λ' − λ = (h/m_e c)(1 − cos θ). The shift is angle-dependent and independent of the incident wavelength — exactly what falls out if one treats the photon as a particle with momentum p = h/λ and applies relativistic energy-momentum conservation to a billiard-ball collision with an electron. Classical wave theory predicted no wavelength shift at all. Compton's 1923 paper in *The Physical Review* was the experiment that finally established the photon as a mechanically legitimate particle. He shared the 1927 Nobel Prize with C. T. R. Wilson, whose cloud chamber had made the recoil electrons visible.

Compton's later career was dominated by World War II. From 1941 he led the Met Lab at the University of Chicago — the Manhattan Project arm responsible for plutonium production. He was the senior figure who hired Enrico Fermi, oversaw the construction of CP-1 (the world's first artificial nuclear reactor, achieving criticality on December 2, 1942), and managed the scale-up to the Hanford production reactors. After the war he served as chancellor of Washington University (1945–1953) and continued teaching there until his death in 1962. His monograph *X-rays and Electrons* (1926) and the late-career *Atomic Quest* (1956) bookend a career that began at the foundation of quantum kinematics and ended at the engineering of plutonium.`,
    contributions: [
      "1923 Compton effect — wavelength shift Δλ = (h/m_e c)(1 − cos θ) of X-rays scattered off electrons; the experiment that established photons as mechanically legitimate particles.",
      "Nobel Prize in Physics 1927 (shared with C. T. R. Wilson) — for the discovery of the effect named after him.",
      "Compton wavelength of the electron λ_C = h/(m_e c) ≈ 2.426 × 10⁻¹² m — the natural scattering length scale.",
      "1941–1945 director of the Manhattan Project's Met Lab at the University of Chicago — hired Fermi; oversaw CP-1 (first artificial reactor, 1942); scaled up to the Hanford plutonium-production reactors.",
      "Chancellor of Washington University in St. Louis, 1945–1953.",
    ],
    majorWorks: [
      "A Quantum Theory of the Scattering of X-rays by Light Elements (1923) — *Physical Review* paper deriving and confirming the Compton wavelength shift; the experimental foundation for photon mechanics.",
      "X-rays and Electrons (1926) — monograph synthesising the quantum kinematics of X-ray scattering; standard graduate-level reference for the next two decades.",
      "Atomic Quest: A Personal Narrative (1956) — late-career memoir of the Manhattan Project from the Met Lab perspective.",
    ],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "compton-scattering" },
      { branchSlug: "relativity", topicSlug: "four-momentum" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // RT §03 ────────────────────────────────────────────────────────────────
  {
    slug: "spacetime",
    term: "Spacetime",
    category: "concept",
    shortDefinition: "The 4-dimensional pseudo-Euclidean manifold of events introduced by Hermann Minkowski in 1908, in which the three spatial coordinates and time enter on equal footing. The geometric arena of special relativity; the substrate on which world-lines, light-cones, and the invariant interval are defined.",
    description: `Spacetime is the four-dimensional pseudo-Euclidean manifold introduced by Hermann Minkowski in 1908 as the geometric arena of special relativity. Each point in spacetime is an *event* — a location in space at a definite time — and the three spatial coordinates (x, y, z) enter on equal footing with the time coordinate (ct). Lorentz transformations are pseudo-orthogonal rotations of this 4D manifold preserving the indefinite-signature metric ds² = c²dt² − dx² − dy² − dz²; observers in different inertial frames disagree on which slice constitutes "now," but all agree on the spacetime distance between any two events. Spacetime is a stage on which physical history unfolds, not a substance: it has no aether, no mechanical properties, no rest frame.

Minkowski announced the reformulation in his Cologne lecture of 21 September 1908, opening with the now-famous declaration that "henceforth space by itself, and time by itself, are doomed to fade away into mere shadows, and only a kind of union of the two will preserve an independent reality." Einstein, his former student at the ETH Zürich, had initially regarded the geometric reformulation as superfluous mathematical decoration; by 1912, working on what would become general relativity, he had come to depend on it completely. The Minkowski metric is the flat-space limit of the metric tensor of general relativity; the entire structure of relativistic physics — kinematics, dynamics, electromagnetism, the Standard Model — is built on top of spacetime as its base manifold.`,
    relatedPhysicists: ["hermann-minkowski", "albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "spacetime-diagrams" },
      { branchSlug: "relativity", topicSlug: "the-invariant-interval" },
      { branchSlug: "relativity", topicSlug: "light-cones-and-causality" },
      { branchSlug: "relativity", topicSlug: "four-vectors-and-proper-time" },
    ],
  },
  {
    slug: "world-line",
    term: "World-line",
    category: "concept",
    shortDefinition: "The locus of events in spacetime traced out by a particle as it moves; a 1D curve in the 4D manifold. Massive particles have timelike world-lines; photons have null world-lines; the proper time elapsed on the particle's clock is the arc length of its world-line in the Minkowski metric.",
    description: `A world-line is the curve traced through spacetime by a particle as time progresses — the geometric record of its entire history, parametrized by proper time. For a particle at rest in some inertial frame, the world-line is a straight line parallel to that frame's time axis. For a particle in uniform motion, the world-line is straight but tilted relative to the time axis; for an accelerating particle, the world-line is curved. The angle a world-line makes with the time axis is constrained by causality: |dx/dt| ≤ c, so a world-line never tilts more than 45° from the vertical in units where c = 1. The 45° envelope is the local light-cone.

Massive particles trace timelike world-lines (interval invariant ds² > 0 between any two events on them) and have well-defined proper time dτ = √(1 − β²) dt integrated along the curve. Photons trace null world-lines (ds² = 0) — light rays in spacetime — for which proper time does not elapse. Tachyons would have spacelike world-lines (ds² < 0); none have ever been observed, and special relativity makes them causally pathological. Hermann Minkowski introduced the term *Weltlinie* in 1908; the geometric content is that all of a particle's kinematics lives in the shape of a single curve, and conservation laws translate into geometric constraints on how curves can intersect at collision events.`,
    relatedPhysicists: ["hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "spacetime-diagrams" },
      { branchSlug: "relativity", topicSlug: "four-vectors-and-proper-time" },
      { branchSlug: "relativity", topicSlug: "the-twin-paradox" },
    ],
  },
  {
    slug: "proper-time",
    term: "Proper time",
    category: "concept",
    shortDefinition: "The time τ measured by a clock carried along a particle's world-line. Related to coordinate time by dτ = dt/γ, so dτ = √(1 − β²) dt; integrated along a timelike world-line gives the arc length in the Minkowski metric. Lorentz-invariant; the geometric content of time dilation.",
    description: `Proper time τ is the time measured by an ideal clock carried along a particle's world-line. It is related to the coordinate time t of any inertial observer by dτ = dt/γ = √(1 − β²) dt, where β = v/c is the particle's instantaneous velocity in that observer's frame. Integrating along a timelike world-line yields the total proper time elapsed: τ = ∫ √(1 − β²) dt. This integral is the arc length of the world-line in the Minkowski metric ds² = c²dt² − dx² − dy² − dz², so proper time has the same geometric status in spacetime that Euclidean arc length has on a Riemannian manifold. It is invariant under Lorentz transformations — every inertial observer agrees on how much proper time elapsed on a given clock between two events on its world-line.

Proper time is the geometric content of time dilation. The lab-frame interpretation "the moving clock ticks slow" is observer-dependent; the invariant statement is that the proper time elapsed along a curved world-line is always less than the proper time elapsed along the straight (inertial) world-line connecting the same two events — the relativistic reverse of the Euclidean triangle inequality. The twin paradox is exactly this: the travelling twin's accelerated world-line has shorter proper-time arc length than the stay-at-home twin's straight one. Proper time is the parameter to use along world-lines because four-velocity, four-acceleration, and four-force are all derivatives with respect to it, and Lorentz-covariance is automatic.`,
    relatedPhysicists: ["hermann-minkowski", "albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "four-vectors-and-proper-time" },
      { branchSlug: "relativity", topicSlug: "the-twin-paradox" },
      { branchSlug: "relativity", topicSlug: "time-dilation" },
    ],
  },
  {
    slug: "invariant-interval",
    term: "Invariant interval",
    category: "concept",
    shortDefinition: "The Lorentz-scalar combination s² = c²Δt² − Δx² − Δy² − Δz² between any two events. Invariant under Lorentz boosts and rotations; the special-relativistic analogue of Euclidean distance; its sign distinguishes timelike (s² > 0), spacelike (s² < 0), and null (s² = 0) separations.",
    description: `The invariant interval is the Lorentz-scalar combination s² = c²Δt² − Δx² − Δy² − Δz² formed from the coordinate differences between any two events in spacetime. Unlike Δt or Δx individually — both of which are frame-dependent and mix into one another under Lorentz boosts — the combination s² takes the same numerical value in every inertial frame. It is the special-relativistic analogue of Euclidean distance: in 3D Euclidean space, observers using different rotated coordinate axes disagree on Δx, Δy, Δz separately but agree on the scalar Δr² = Δx² + Δy² + Δz²; in Minkowski spacetime, observers in different inertial frames disagree on Δt, Δx, Δy, Δz separately but agree on s².

The sign of s² classifies the separation between the two events. If s² > 0 the interval is *timelike*: the events can be connected by a sub-c signal, their temporal order is frame-independent, and a clock can be carried from one to the other (proper time elapsed: Δτ = √(s²)/c). If s² < 0 the interval is *spacelike*: no signal at or below c connects the events, their temporal order is frame-dependent, and the proper distance between them in the frame where they are simultaneous is √(−s²). If s² = 0 the interval is *null*: a light signal connects them. Hermann Minkowski introduced this scalar in 1908; Henri Poincaré had recognised its invariance from Lorentz's 1904 transformation a few years earlier. It is the fundamental scalar of special-relativistic geometry and the building block from which every Lorentz-covariant quantity is constructed.`,
    relatedPhysicists: ["hermann-minkowski", "henri-poincare"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "the-invariant-interval" },
      { branchSlug: "relativity", topicSlug: "spacetime-diagrams" },
      { branchSlug: "relativity", topicSlug: "light-cones-and-causality" },
    ],
  },
  {
    slug: "light-cone",
    term: "Light-cone",
    category: "concept",
    shortDefinition: "The locus of events null-separated from a chosen origin event in spacetime; geometrically a 4D double cone with apex at the origin. The boundary between causally accessible (timelike-interior) and causally inaccessible (spacelike-exterior) regions; the structure that encodes relativistic causality.",
    description: `The light-cone of an event E is the locus of all spacetime events that can be connected to E by a light signal. In 1+1 dimensions it appears in a spacetime diagram as a pair of lines through E at slopes ±c (45° in units c = 1); in 1+3 dimensions it is a 4D double cone with apex at E. The light-cone partitions spacetime into three causally distinct regions. The *future light-cone* contains all events E can causally affect — points lying on or inside the upper cone, reachable by sub-c or null signals from E. The *past light-cone* contains all events that can causally affect E. The *elsewhere* region — outside both cones — contains events spacelike-separated from E, with no possible causal contact.

The light-cone is the fundamental structure encoding relativistic causality. Lorentz transformations preserve it: every inertial observer agrees on which events lie inside, on, or outside the light-cone of any given event. A massive particle's world-line at any instant lies strictly inside its instantaneous future light-cone (timelike everywhere), a photon's world-line lies on the cone (null everywhere), and tachyonic world-lines would lie outside (spacelike everywhere) — which is one of the structural reasons no consistent theory of subluminal-to-superluminal transitions has been found. In general relativity the light-cone tilts with curvature; black hole event horizons are exactly the surfaces where the future light-cone tips over so that all timelike futures point inward toward the singularity.`,
    relatedPhysicists: ["hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "light-cones-and-causality" },
      { branchSlug: "relativity", topicSlug: "the-invariant-interval" },
    ],
  },
  {
    slug: "spacelike",
    term: "Spacelike",
    category: "concept",
    shortDefinition: "A separation between two events with invariant interval s² < 0 — meaning no signal at or below c can connect them. Spacelike-separated events have a frame-dependent temporal order; the relativity of simultaneity is exactly the freedom to choose any timelike frame and slice spacelike directions as 'now.'",
    description: `Two events are spacelike-separated when their invariant interval satisfies s² = c²Δt² − Δx² − Δy² − Δz² < 0 — equivalently, when their spatial separation exceeds what a light signal could traverse in their time difference. No signal travelling at or below c can connect them, so they cannot be in causal contact: neither can affect the other. The proper distance between them — the spatial separation measured in the inertial frame where they are simultaneous — is √(−s²); such a frame always exists for any spacelike separation, and Lorentz boosts can shuffle their temporal order freely.

This frame-dependence of temporal ordering for spacelike-separated events is exactly the relativity of simultaneity. There is no privileged "now" slicing spacetime; instead, every inertial observer carves spacelike hyperplanes orthogonal to their own four-velocity, and rotating between observers tilts the slice. Two spacelike-separated events that are simultaneous in frame S are not simultaneous in any frame S' moving relative to S along the line connecting them, and their order can swap. This is not a paradox — since they cannot causally influence one another, the swap has no observable contradiction. The light-cone of any event partitions the rest of spacetime into the timelike interior (causal contact possible, temporal order absolute) and the spacelike exterior (no causal contact, temporal order frame-dependent).`,
    relatedPhysicists: ["hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "light-cones-and-causality" },
      { branchSlug: "relativity", topicSlug: "the-invariant-interval" },
      { branchSlug: "relativity", topicSlug: "relative-simultaneity" },
    ],
  },
  {
    slug: "timelike",
    term: "Timelike",
    category: "concept",
    shortDefinition: "A separation between two events with invariant interval s² > 0 — meaning a sub-c signal can connect them. Timelike-separated events have a frame-independent temporal order; proper time Δτ = √(s²)/c elapses on a clock travelling between them.",
    description: `Two events are timelike-separated when their invariant interval satisfies s² = c²Δt² − Δx² − Δy² − Δz² > 0 — equivalently, when their spatial separation is small enough that a sub-c signal can traverse it within their time difference. Timelike-separated events lie inside one another's light-cone, so a clock can be carried from one event to the other along a timelike world-line. The proper time elapsed on that clock between them is Δτ = √(s²)/c; in the inertial frame where the two events occur at the same spatial point, Δτ equals the coordinate time difference Δt, and that frame is the rest frame of the carried clock.

The temporal ordering of timelike-separated events is *frame-independent*: every inertial observer agrees on which event came first, because no Lorentz boost can flip Δt > 0 to Δt < 0 inside the light-cone. This is the structural basis of relativistic causality — cause precedes effect in every frame, and "the future" is a well-defined absolute concept for any event (the interior of its future light-cone). A massive particle's world-line is everywhere timelike — its tangent four-velocity has positive norm c² — and the proper time integrated along the world-line is the time measured on the particle's own clock. Timelike intervals are the regime in which classical mechanics and relativistic dynamics live.`,
    relatedPhysicists: ["hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "light-cones-and-causality" },
      { branchSlug: "relativity", topicSlug: "the-invariant-interval" },
      { branchSlug: "relativity", topicSlug: "four-vectors-and-proper-time" },
    ],
  },
  {
    slug: "null-interval",
    term: "Null interval",
    category: "concept",
    shortDefinition: "A separation between two events with invariant interval s² = 0 — meaning a light signal exactly connects them. The world-lines of photons are null curves; the light-cone of any event is the locus of null-separated points; null separations sit on the boundary between timelike and spacelike.",
    description: `A null interval is a separation between two events for which the invariant interval s² = c²Δt² − Δx² − Δy² − Δz² is exactly zero. Geometrically, the events lie on each other's light-cone — the boundary between the timelike interior and the spacelike exterior — and a signal travelling at exactly c connects them. The world-line of a massless particle (photon, gluon, hypothetical graviton) is null everywhere, with tangent vector satisfying k^μ k_μ = 0; proper time does not elapse along it, and the affine parameter used to parametrize null curves cannot be the proper time τ but must be some other parameter λ chosen by the four-momentum normalization.

Null intervals are the signature of light propagation and the boundary case of relativistic kinematics. Two events connected by a light flash are null-separated — the propagation delay exactly matches the spatial separation divided by c, by definition of c as the propagation speed. The Lorentz-invariance of the interval means every inertial observer agrees on which separations are null; the light-cone structure is frame-independent, and "speed c" is the same in every inertial frame because the null condition c²dt² = dx² + dy² + dz² transforms into itself. In quantum field theory, null intervals are the support of light-front quantization and the asymptotic regime of S-matrix elements; the geometry of null surfaces is also the natural language for black hole horizons, gravitational waves, and the cosmological causal past.`,
    relatedPhysicists: ["hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "light-cones-and-causality" },
      { branchSlug: "relativity", topicSlug: "the-invariant-interval" },
    ],
  },
  // RT §04 ────────────────────────────────────────────────────────────────
  {
    slug: "four-momentum",
    term: "Four-momentum",
    category: "concept",
    shortDefinition: "The Lorentz four-vector p^μ = (E/c, p_x, p_y, p_z) combining a particle's energy and three-momentum into a single object that transforms covariantly under boosts. Its invariant norm-squared p^μ p_μ = (E/c)² − |p|² = m²c² is the energy-momentum-mass relation; total four-momentum is conserved in any collision.",
    description: `Four-momentum is the canonical dynamical object of special relativity: a Lorentz four-vector p^μ = (E/c, p_x, p_y, p_z) whose time component is the energy divided by c and whose spatial components are the relativistic three-momentum p = γmv. Under a Lorentz boost, the four components mix exactly as the (ct, x, y, z) coordinates do, so p^μ transforms covariantly — the same boost matrix that rotates spacetime coordinates rotates four-momentum components. This Lorentz-covariance is precisely why four-momentum is the right object to use: conservation of energy and conservation of three-momentum in one frame translate to conservation of all four components of total p^μ in every frame, automatically.

The Minkowski-norm-squared of the four-momentum is the energy-momentum-mass relation: p^μ p_μ = (E/c)² − |p|² = m²c², the most famous Lorentz invariant in physics after the speed of light itself. It says energy and momentum are not independent: a particle's rest mass m is the invariant length of its four-momentum vector (in natural units), and given any two of {E, |p|, m} the third is fixed. For a photon (m = 0) the relation collapses to E = |p|c; for a particle at rest (|p| = 0) it gives Einstein's E = mc²; for relativistic particles in general it is E² = (pc)² + (mc²)². Total four-momentum is conserved in any collision, and the invariance of p^μ p_μ provides the cleanest way to compute thresholds, decay kinematics, and scattering observables: pick the simplest frame, evaluate the scalar, then export the result to any other frame.`,
    relatedPhysicists: ["albert-einstein", "hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "four-momentum" },
      { branchSlug: "relativity", topicSlug: "four-vectors-and-proper-time" },
      { branchSlug: "relativity", topicSlug: "relativistic-collisions" },
      { branchSlug: "relativity", topicSlug: "compton-scattering" },
    ],
  },
  {
    slug: "four-velocity",
    term: "Four-velocity",
    category: "concept",
    shortDefinition: "The Lorentz four-vector u^μ = dx^μ/dτ = γ(c, v_x, v_y, v_z), the tangent to a particle's timelike world-line parametrized by proper time. Its norm u^μ u_μ = c² is constant on every timelike world-line; differentiating it gives four-acceleration, and m·u^μ is the four-momentum.",
    description: `Four-velocity is the tangent vector to a particle's timelike world-line, parametrized by the proper time τ rather than by any frame's coordinate time: u^μ = dx^μ/dτ. Expanding the chain rule dτ = dt/γ gives the explicit form u^μ = γ(c, v_x, v_y, v_z), where v is the particle's three-velocity in the chosen inertial frame and γ = 1/√(1 − β²) is the Lorentz factor. Because τ is a Lorentz scalar, differentiating x^μ with respect to it yields a manifestly covariant four-vector — the first major payoff of the proper-time parametrization.

The Minkowski norm of four-velocity is fixed: u^μ u_μ = γ²(c² − |v|²) = c². This is a constant of motion along every timelike world-line, in every frame, regardless of how the particle accelerates. The invariance has a geometric meaning — the four-velocity is a unit timelike vector when c = 1, and the world-line traces a curve in spacetime at "unit speed" in proper-time parametrization. Differentiating u^μ once more by τ produces the four-acceleration a^μ = du^μ/dτ, which because u·u is constant must satisfy a·u = 0 — four-acceleration is always orthogonal to four-velocity in the Minkowski sense. Multiplying by rest mass gives the four-momentum p^μ = m·u^μ, recovering the dynamical quantity from the kinematic one. Four-velocity is the bridge from the geometry of world-lines to the dynamics of forces and momenta.`,
    relatedPhysicists: ["hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "four-vectors-and-proper-time" },
      { branchSlug: "relativity", topicSlug: "four-momentum" },
    ],
  },
  {
    slug: "four-acceleration",
    term: "Four-acceleration",
    category: "concept",
    shortDefinition: "The Lorentz four-vector a^μ = du^μ/dτ, the second proper-time derivative of a particle's spacetime trajectory. Always orthogonal to four-velocity in the Minkowski metric (a^μ u_μ = 0); non-zero only on accelerated (non-geodesic) world-lines; reduces to the ordinary three-acceleration in the instantaneous rest frame.",
    description: `Four-acceleration is the second proper-time derivative of a particle's spacetime position, a^μ = d²x^μ/dτ² = du^μ/dτ. It is the Lorentz-covariant generalisation of ordinary three-acceleration, expressed in a way that transforms cleanly between inertial frames. In the instantaneous rest frame of the particle (where γ = 1 and v = 0), the spatial components of a^μ reduce exactly to the ordinary three-acceleration dv/dt; the time component vanishes in that frame. In any other frame the components mix, and the four-acceleration carries both the change in spatial velocity and a contribution from the changing γ.

Because the four-velocity has a fixed Minkowski norm u^μ u_μ = c², differentiating both sides with respect to τ yields 2 a^μ u_μ = 0 — the four-acceleration is always orthogonal to the four-velocity in the Minkowski metric. Geometrically, this is the same statement as a unit-tangent vector on a curve being orthogonal to its second derivative on a sphere: the world-line is constrained to move at "unit Minkowski speed," so the only freedom is to change direction, never magnitude. The four-acceleration vanishes identically on inertial (geodesic, straight-line) world-lines and is non-zero everywhere on accelerated ones — it is the precise relativistic measure of "how non-inertial" a trajectory is. The twin paradox's asymmetry resides exactly here: the travelling twin's world-line carries non-vanishing four-acceleration during turnaround; the stay-at-home twin's does not.`,
    relatedPhysicists: ["hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "four-vectors-and-proper-time" },
      { branchSlug: "relativity", topicSlug: "the-twin-paradox" },
    ],
  },
  {
    slug: "four-force",
    term: "Four-force",
    category: "concept",
    shortDefinition: "The Lorentz four-vector F^μ = dp^μ/dτ; the relativistic generalisation of Newton's force. For a particle of constant rest mass, F^μ = m·a^μ. The time component is the rate of energy transfer (power); the spatial components reduce to Newton's second law in the low-β limit.",
    description: `Four-force is the proper-time derivative of four-momentum: F^μ = dp^μ/dτ, the relativistic generalisation of Newton's second law. For a particle of constant rest mass m, the four-momentum factorises as p^μ = m u^μ, and the four-force collapses to F^μ = m·a^μ — manifestly Lorentz-covariant. The time component F⁰ = (1/c)(dE/dτ) tracks the rate at which energy is transferred to the particle, the relativistic generalisation of mechanical power. The spatial components F^i = γ(dp^i/dt) reduce to the ordinary Newtonian force F = ma in the low-β limit and inherit Lorentz transformation properties under boosts.

Because four-force is the τ-derivative of four-momentum, and four-momentum has fixed Minkowski norm m²c² for constant rest mass, the four-force is orthogonal to the four-velocity: F^μ u_μ = 0. This orthogonality is the relativistic version of the work-energy theorem — the time component F⁰ is determined by the spatial components F⁰ = (γ/c) F·v, ensuring that no algebraic freedom violates the constant-rest-mass condition. The Lorentz force on a charged particle, F^μ = qF^μν u_ν, is the canonical example: contracting the antisymmetric electromagnetic field tensor with the four-velocity yields a four-force automatically orthogonal to u, automatically Lorentz-covariant, automatically reducing to qE + qv×B in the lab frame. Four-force is the dynamical bridge from spacetime geometry to forces with definite frame-mixing rules.`,
    relatedPhysicists: ["hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "four-vectors-and-proper-time" },
      { branchSlug: "relativity", topicSlug: "four-momentum" },
    ],
  },
  {
    slug: "rest-energy",
    term: "Rest energy",
    category: "concept",
    shortDefinition: "The energy E₀ = mc² that a massive particle has in its own rest frame, where its three-momentum vanishes and its four-momentum reduces to (mc, 0, 0, 0). The conversion factor between mass and energy; the floor below which a particle's total energy cannot drop.",
    description: `Rest energy is the energy E₀ = mc² that a massive particle possesses in its own rest frame — the inertial frame in which its three-momentum vanishes and its four-momentum reduces to p^μ = (mc, 0, 0, 0). It is the time component of the four-momentum evaluated where the spatial components are zero, multiplied by c, and follows directly from the energy-momentum-mass relation E² = (pc)² + (mc²)² in the limit |p| = 0. For a 1 kg object, E₀ ≈ 9 × 10¹⁶ J — equivalent to roughly 21 megatons of TNT, the energy scale that nuclear fission and fusion reactions tap into.

Rest energy is the floor below which a particle's total energy cannot drop. A free particle's energy in any frame is E = γmc² ≥ mc², with equality only in the rest frame; the kinetic energy K = E − mc² = (γ − 1)mc² is what you add by accelerating. This recasts mass as a form of energy — Einstein's 1905 sequel paper *Does the Inertia of a Body Depend Upon Its Energy Content?* introduced exactly this identification, deriving E₀ = mc² by considering the recoil of a body emitting equal photon pairs and demanding consistency between the lab and rest-frame momentum balances. Binding energies, kinetic energies, and excitation energies all show up on a balance scale as additional mass; nuclear physics, particle creation, and stellar fusion are the regimes where rest-energy bookkeeping is unavoidable.`,
    relatedPhysicists: ["albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "mass-energy-equivalence" },
      { branchSlug: "relativity", topicSlug: "four-momentum" },
    ],
  },
  {
    slug: "mass-energy-equivalence",
    term: "Mass-energy equivalence",
    category: "concept",
    shortDefinition: "Einstein's 1905 result E = mc² — that mass and energy are the same physical quantity expressed in different units, with c² as the conversion factor. Binding energies and kinetic energies register on a balance as mass; the foundation of nuclear physics, fusion, fission, and particle production.",
    description: `Mass-energy equivalence is the principle E = mc² — that mass m and energy E are the same physical quantity expressed in different units, with c² as the conversion factor. Einstein derived it in his 1905 sequel paper *Does the Inertia of a Body Depend Upon Its Energy Content?*, the third of the *Annus Mirabilis* relativity papers, by considering a body that emits equal photons in opposite directions and applying conservation of momentum and energy in two inertial frames. The body loses energy ΔE to radiation, but its mass also drops by ΔE/c² — the mass deficit is the energy carried away. The argument generalises: any system that gains or loses energy gains or loses mass by the same factor 1/c².

The consequences are vast. The ~7 MeV/nucleon binding energy of iron-56 is exactly the mass deficit between iron and the sum of its constituent nucleons; tapping it via fusion (lighter nuclei combining) or fission (heavier nuclei splitting) releases energy converted from rest mass at megaton scales. Particle accelerators routinely create new massive particles by slamming high-energy beams together — the rest mass of the new particles comes from the kinetic energy of the colliders, balanced by four-momentum conservation. Stars run on hydrogen-to-helium fusion, converting roughly 0.7% of their fuel mass into radiation. The Compton effect, pair production, and threshold-energy calculations are all bookkeeping exercises in mass-energy equivalence: the four-momentum invariant p² = m²c² is the central scalar that organises every collision calculation in modern physics.`,
    relatedPhysicists: ["albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "mass-energy-equivalence" },
      { branchSlug: "relativity", topicSlug: "relativistic-collisions" },
      { branchSlug: "relativity", topicSlug: "threshold-energy-and-pair-production" },
    ],
  },
  {
    slug: "threshold-energy",
    term: "Threshold energy",
    category: "concept",
    shortDefinition: "The minimum incoming-particle energy required to produce a given set of final-state particles in a collision, consistent with conservation of four-momentum. Computed cleanly in the centre-of-momentum frame as the total rest energy of the products; in the lab frame, requires extra kinetic energy to satisfy momentum balance.",
    description: `Threshold energy is the minimum incoming-particle energy required for a specified final state to be kinematically allowed in a collision, consistent with conservation of four-momentum. The calculation is cleanest in the centre-of-momentum (CM) frame: at threshold, all final-state particles emerge at rest relative to one another, so the total CM energy must equal the sum of their rest energies. Using the Lorentz-invariant total four-momentum, the CM energy squared is s = (Σ p^μ)·(Σ p_μ), and the threshold condition is √s ≥ Σ m_i c². In the lab frame — where one particle is typically at rest and the other carries all the kinetic energy — the threshold is higher, because some incoming kinetic energy is "wasted" on giving the final state the momentum required to balance the projectile's momentum.

For pair production from a single photon (γ → e⁺ + e⁻ in vacuum), four-momentum conservation forbids the process at any energy: the photon's four-momentum is null (p² = 0), the pair's combined four-momentum is timelike (p² ≥ (2m_e c)² > 0), and a Lorentz-invariant scalar cannot equal both zero and a positive number. A third body — typically a nucleus — is required to carry off momentum, lowering the threshold to E_γ ≥ 2m_e c² ≈ 1.022 MeV in the limit of an infinitely heavy nucleus. Particle physics extends the same logic up the energy ladder: hadron production thresholds, antiproton creation (E_p ≈ 6m_p c² ≈ 5.6 GeV at fixed-target lab kinematics), Higgs production at the LHC. Every threshold calculation is the same exercise in finding the minimum √s consistent with the final-state rest-energy budget.`,
    relatedPhysicists: ["albert-einstein", "paul-dirac"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "threshold-energy-and-pair-production" },
      { branchSlug: "relativity", topicSlug: "relativistic-collisions" },
    ],
  },
  {
    slug: "pair-production",
    term: "Pair production",
    category: "phenomenon",
    shortDefinition: "The conversion of energy into a matter-antimatter particle pair, most commonly a high-energy photon converting to an electron-positron pair near a nucleus: γ + nucleus → e⁺ + e⁻ + nucleus. Threshold ≥ 2m_e c² = 1.022 MeV; first observed by Carl Anderson in 1932 cloud-chamber tracks, confirming Dirac's 1928 antimatter prediction.",
    description: `Pair production is the conversion of electromagnetic energy into a matter-antimatter particle pair, most commonly a high-energy photon producing an electron-positron pair near a heavy nucleus: γ + nucleus → e⁺ + e⁻ + nucleus. The nucleus is required as a third body to absorb momentum — a single photon cannot produce a pair in vacuum, because its four-momentum is null while the pair's combined four-momentum is timelike, and four-momentum conservation has no solution. With a recoiling nucleus to take up the spare momentum, the process is allowed, and the threshold photon energy is E_γ ≥ 2m_e c² ≈ 1.022 MeV in the limit of a nucleus much heavier than the pair.

Paul Dirac's 1928 relativistic wave equation predicted the existence of antimatter as the negative-energy solutions of his equation, reinterpreted as positive-energy "holes" in a filled negative-energy sea — the positron, an electron's antiparticle with charge +e and the same rest mass. Dirac's prediction was treated with scepticism until Carl Anderson, in 1932, observed cloud-chamber tracks of cosmic-ray-induced pairs at Caltech: a curved track with positive curvature in a magnetic field, of the same radius as electron tracks, was an electron's antiparticle. Anderson received the 1936 Nobel for the discovery. Pair production was thereafter the canonical signature of high-energy photon interactions in matter and the experimental confirmation that mass-energy equivalence operates in both directions: matter can be converted into energy, and energy into matter, with c² as the conversion factor in both.`,
    relatedPhysicists: ["paul-dirac", "arthur-compton"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "threshold-energy-and-pair-production" },
      { branchSlug: "relativity", topicSlug: "mass-energy-equivalence" },
    ],
  },
  {
    slug: "compton-shift",
    term: "Compton shift",
    category: "phenomenon",
    shortDefinition: "The wavelength shift Δλ = (h/m_e c)(1 − cos θ) of light scattered off electrons, where θ is the scattering angle. Angle-dependent, independent of the incident wavelength; first measured by Arthur Compton in 1923 with X-rays on graphite — the experiment that established photons as mechanically legitimate particles.",
    description: `The Compton shift is the wavelength change Δλ = λ' − λ = (h/m_e c)(1 − cos θ) experienced by light scattered off a free or weakly-bound electron, where θ is the scattering angle and h/(m_e c) ≈ 2.426 × 10⁻¹² m is the Compton wavelength of the electron. The shift increases monotonically with angle from zero at θ = 0° (forward scattering) to its maximum 2h/(m_e c) at θ = 180° (backward scattering), and is *independent of the incident wavelength* — a striking departure from the classical Thomson-scattering prediction of zero shift. The formula falls out of treating the photon as a relativistic particle with four-momentum (E/c, p) where E = pc = hc/λ, applying conservation of energy and three-momentum to a billiard-ball collision with an electron initially at rest, and solving for the outgoing photon wavelength.

Arthur Compton measured the shift in 1923 at Washington University in St. Louis, scattering monochromatic Mo Kα X-rays (λ ≈ 0.071 nm) off a graphite target and recording the scattered-photon wavelength as a function of angle with a Bragg spectrometer. The data matched the photon-as-particle prediction quantitatively; classical wave theory had no mechanism to produce any shift. The 1923 paper in *The Physical Review* established the photon as a mechanically legitimate particle, completing the transition begun by Einstein's 1905 photoelectric paper. Compton shared the 1927 Nobel Prize with C. T. R. Wilson, whose cloud chamber had made the recoil electrons directly visible. The Compton wavelength remains the natural length scale for any scattering process where photon momentum couples to an electron's rest mass.`,
    relatedPhysicists: ["arthur-compton"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "compton-scattering" },
      { branchSlug: "relativity", topicSlug: "four-momentum" },
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
