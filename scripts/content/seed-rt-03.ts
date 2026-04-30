// Seed RT §05 SR Applications + §06 Equivalence Principle
// 2 physicists (Roland Eötvös, Pound-Rebka combined) + 10 new structural glossary terms
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-rt-03.ts
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
    slug: "roland-eotvos",
    name: "Loránd (Roland) Eötvös",
    shortName: "Eötvös",
    born: "1848",
    died: "1919",
    nationality: "Hungarian",
    oneLiner: "Hungarian physicist who built the torsion balance that constrained the difference between inertial and gravitational mass to a few parts in 10⁹ — the first high-precision laboratory test of the equivalence principle. His 1889 and 1922 (posthumous) measurements stood as the state of the art until lunar laser ranging in the 1970s.",
    bio: `Loránd Eötvös was born in 1848 in Pest (now Budapest) into a politically prominent family — his father József was a writer and Minister of Education in the Habsburg-Hungarian government. He studied physics in Heidelberg and Königsberg under Bunsen, Helmholtz, and Kirchhoff, completing his doctorate in 1870, and returned to teach at Budapest University, where he spent his entire research career. Across forty years he turned the institution into a world-class physics centre and trained a generation of Hungarian-born physicists who would later seed Western European and American science (von Neumann, Wigner, Szilard, and Teller all passed through the orbit of Hungarian physics that Eötvös had built).

His scientific reputation rests on a single instrument and the question it answered. The torsion balance — a horizontal beam suspended from a fine fibre, with two test masses of different composition at the ends — is sensitive to any difference in the gravitational acceleration the two masses experience. If gravitational mass differed even slightly from inertial mass, the rotating Earth's varying gravitational pull and centrifugal force at different latitudes would produce a tiny torque on the beam. Eötvös measured this torque on materials as different as platinum, brass, copper, glass, water, and asbestos. The 1889 results constrained the equivalence ratio to one part in 10⁸; refined apparatus and the 1922 posthumous re-analysis (Eötvös, Pekár, Fekete) tightened it to a few parts in 10⁹. No deviation was found. The result became the most-cited experimental support for what Einstein would later canonise as the *Äquivalenzprinzip* — the equivalence principle that founds general relativity.

Eötvös also developed the gravity gradiometry that bears his name. His torsion balance, in modified form, was widely deployed in oil and mineral prospecting in the early twentieth century — the first significant industrial use of precision gravimetry. He served as Minister of Religion and Education in 1894 and as president of the Hungarian Academy of Sciences. He died in Budapest in 1919. The MICROSCOPE satellite mission, launched in 2016, finally improved on his bound by six orders of magnitude — but for nearly a hundred years, Eötvös's number was the number.`,
    contributions: [
      "1889 + 1922 Eötvös experiment — torsion-balance comparison of inertial and gravitational mass; constrained the equivalence ratio to ≲ 10⁻⁹.",
      "Gravity gradiometry — the modified Eötvös torsion balance became the first practical instrument for prospecting density anomalies in subsurface rock.",
      "The Eötvös effect — measured east-west motion alters apparent gravity due to Coriolis, the prediction confirmed in his 1908 sea voyage.",
      "President of the Hungarian Academy of Sciences (1889–1905); founder of the Royal Hungarian Society of Natural Sciences.",
      "Minister of Religion and Education, Kingdom of Hungary, 1894 — drove the modernization of Hungarian secondary-school physics curricula.",
    ],
    majorWorks: [
      "Über die Anziehung der Erde auf verschiedene Substanzen (1889) — the original torsion-balance result; published in the proceedings of the Hungarian Academy.",
      "Beiträge zum Gesetz der Proportionalität von Trägheit und Gravität (1922) — the posthumous Eötvös-Pekár-Fekete refinement; the canonical equivalence-principle constraint until the 1970s.",
    ],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "inertial-vs-gravitational-mass" },
      { branchSlug: "relativity", topicSlug: "einsteins-elevator" },
    ],
  },
  {
    slug: "pound-rebka",
    name: "Robert Pound and Glen Rebka",
    shortName: "Pound & Rebka",
    born: "1919 / 1931",
    died: "2010 / 2015",
    nationality: "American",
    oneLiner: "American physicists at Harvard whose 1960 experiment in the 22.5-meter Jefferson tower measured the gravitational redshift predicted by general relativity, using the recently-discovered Mössbauer effect to make a recoilless gamma-ray source sharp enough to resolve a frequency shift of Δν/ν ≈ 2.46 × 10⁻¹⁵.",
    bio: `Robert Vivian Pound (1919–2010) was a Canadian-American experimental physicist who joined the Harvard physics department in 1948 after wartime radar work at MIT and a brief stay at Bell Labs. He was a co-discoverer of nuclear magnetic resonance in solids (with Edward Purcell, 1946), and through the 1950s built a reputation as one of the most skilled microwave and radio-frequency experimentalists alive. Glen Anderton Rebka Jr. (1931–2015) arrived at Harvard as a graduate student in 1958, shortly after Rudolf Mössbauer's 1958 discovery of recoilless gamma-ray emission in solid lattices.

The Mössbauer effect made it possible to produce gamma-ray sources whose emission lines were narrow enough to resolve frequency shifts at the parts-per-quadrillion level. Pound and Rebka realized this could be used to test general relativity's prediction that a photon climbing out of a gravitational potential should redshift — that is, lose energy / drop in frequency — by a factor Δν/ν = gh/c² for a tower of height h on Earth's surface. The Jefferson Physical Laboratory tower at Harvard was 22.5 meters tall, predicting Δν/ν = (9.8 m/s²)(22.5 m)/(3 × 10⁸ m/s)² ≈ 2.46 × 10⁻¹⁵ — far below any pre-Mössbauer detection threshold.

Their 1960 paper *Apparent Weight of Photons* (Pound & Rebka, Physical Review Letters 4, 337) reported a measured fractional shift of (2.57 ± 0.26) × 10⁻¹⁵ — the predicted value to better than 10% precision. A 1965 refinement (Pound & Snider) tightened agreement to 1%. The result was the first laboratory confirmation of the equivalence principle's most direct kinematic prediction, derivable from EP alone (no field equations required). The Pound-Rebka experiment remains the canonical undergraduate example of how a precision laboratory instrument can probe the geometry of spacetime. Rebka went on to become professor at the University of Wyoming; Pound continued at Harvard until his retirement in 1989, mentoring two generations of precision experimentalists.`,
    contributions: [
      "1960 Pound-Rebka experiment — first laboratory measurement of the gravitational redshift Δν/ν = gh/c² predicted by GR's equivalence principle; agreement to better than 10%, refined to 1% in Pound-Snider 1965.",
      "Application of the Mössbauer effect (Mössbauer 1958) to high-precision frequency-shift measurement — the technique that made the Jefferson tower experiment feasible.",
      "Pound co-discovered nuclear magnetic resonance in solids (with Edward Purcell and Henry Torrey, 1946) — shared the 1952 Nobel Prize landscape; founded NMR-spectroscopy practice.",
      "Robert Pound — president of the American Physical Society 1973; National Medal of Science 1990.",
      "Glen Rebka — long career in nuclear physics at the University of Wyoming after the Harvard collaboration ended.",
    ],
    majorWorks: [
      "Apparent Weight of Photons (Pound & Rebka 1960) — Physical Review Letters 4, 337; the original result.",
      "Effect of Gravity on Nuclear Resonance (Pound & Snider 1965) — Physical Review B 140, 788; the 1% refinement.",
    ],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "gravitational-redshift" },
      { branchSlug: "relativity", topicSlug: "einsteins-elevator" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // RT §05 ────────────────────────────────────────────────────────────────
  {
    slug: "barn-pole-paradox",
    term: "Barn-pole paradox",
    category: "concept",
    shortDefinition: "A textbook puzzle in which a pole longer than a barn at rest fits inside the barn at relativistic speed because length contraction shortens it in the barn frame, while in the pole frame the doors open and close non-simultaneously. Two observers, two stories, no contradiction — once the relativity of simultaneity is taken seriously.",
    description: `The barn-pole paradox is a textbook puzzle that dramatises the relativity of simultaneity. Take a pole of proper length L₀ flying at relativistic speed v through a barn of proper length L_b < L₀. In the barn's rest frame, the pole is length-contracted to L₀/γ; if γ is large enough, L₀/γ < L_b and the pole fits inside the barn entirely. The barn-frame observer slams both doors shut simultaneously while the pole is wholly inside, then re-opens the front door before the pole exits the back. The pole-frame observer sees the barn length-contracted to L_b/γ < L₀, far smaller than the pole — there is no instant at which the pole fits.

Both stories are correct because the two door-closings are spacelike-separated events whose temporal ordering is frame-dependent. In the barn frame they are simultaneous; in the pole frame they happen sequentially — back door first (then immediately re-opens), front door second — and the pole is always partly outside the barn at any given instant in its own frame. The relativity of simultaneity is the substance of the resolution: there is no frame-independent answer to the question "is the pole inside the barn?" because "inside at the same time" presupposes a simultaneity slicing of spacetime that observers in relative motion do not share. The "paradox" dissolves once you stop demanding that fact.`,
    relatedPhysicists: ["albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "the-barn-pole-paradox" },
      { branchSlug: "relativity", topicSlug: "relative-simultaneity" },
      { branchSlug: "relativity", topicSlug: "length-contraction" },
    ],
  },
  {
    slug: "bell-spaceship-paradox",
    term: "Bell's spaceship paradox",
    category: "concept",
    shortDefinition: "A thought experiment in which two identical rockets, accelerating identically in the launch frame, are connected by a thin string. The launch-frame distance between them is constant, but the string snaps. The resolution is that 'rigid' acceleration must Born-rigidly contract the rod, while two-rocket setups violate that constraint.",
    description: `Bell's spaceship paradox, posed by John Stewart Bell in 1976, is a sharper relativistic puzzle than the barn-pole. Two identical rockets, launched simultaneously in the lab frame, accelerate with identical proper-acceleration profiles. A thin string is tied between them at rest. In the lab frame, both rockets have the same world-line shape, just translated, so their separation never changes. Yet in the instantaneous rest frame of either rocket, the leading rocket is moving away from the trailing one — the proper distance between them grows monotonically. The string, whose unstressed length is its proper length, must stretch and eventually snap.

The resolution is that a "rigid" rod under acceleration cannot have all its points accelerate identically in the launch frame. Born rigidity (Max Born, 1909) requires that the trailing end of a rigid rod accelerate slightly faster than its leading end so that the rod's proper length stays constant — the difference exactly cancels length contraction. Bell's two-rocket setup explicitly enforces equal launch-frame acceleration, which is *not* Born-rigid, so the structure between the rockets is stressed beyond its breaking point. The puzzle was a CERN cafeteria argument that Bell turned into a published note; he reported that a non-trivial fraction of CERN theorists initially got it wrong, calling it "a relativity test that no working physicist should fail."`,
    relatedPhysicists: [],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "bells-spaceship-paradox" },
      { branchSlug: "relativity", topicSlug: "length-contraction" },
    ],
  },
  {
    slug: "born-rigidity",
    term: "Born rigidity",
    category: "concept",
    shortDefinition: "Max Born's 1909 definition of relativistic rigidity: a body is Born-rigid if its proper length stays constant during acceleration. A truly rigid rod must have its trailing end accelerate faster than its leading end so that length contraction cancels exactly — the constraint that Bell's two-rocket setup violates.",
    description: `Born rigidity is Max Born's 1909 definition of what it means for an extended body to be rigid in special relativity. A body is Born-rigid if its proper length — the length measured in its own instantaneous rest frame — remains constant throughout its motion, including during acceleration. The condition imposes a non-trivial constraint on the accelerations of different points of the body: the trailing end must accelerate slightly faster than the leading end so that length contraction in the launch frame exactly compensates the would-be stretching. The result is the Rindler congruence — a family of hyperbolic world-lines whose spatial separation in the lab frame shrinks just enough to keep the proper length fixed.

Born rigidity is the relativistic replacement for Newtonian rigidity, and it is far more restrictive. The Herglotz-Noether theorem (1909–1910) proves that a Born-rigid body has only three degrees of freedom — it can translate but cannot rotate without distortion, and its motion is fully determined by the trajectory of any single point. This is why Bell's spaceship paradox bites: the two-rocket setup, with each rocket carrying the same launch-frame acceleration profile, explicitly violates Born rigidity. The proper distance between the rockets grows, the string between them snaps, and no purely kinematic appeal to "constant separation in the launch frame" rescues the rigid-rod intuition. Born rigidity is the contrast that makes the spaceship-paradox resolution exact.`,
    relatedPhysicists: [],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "bells-spaceship-paradox" },
      { branchSlug: "relativity", topicSlug: "length-contraction" },
    ],
  },
  {
    slug: "gps-correction",
    term: "GPS clock correction",
    category: "concept",
    shortDefinition: "The combined SR + GR clock-rate correction applied by every GPS satellite firmware: kinematic time dilation slows the orbiting clock by ~7 μs/day, gravitational time dilation speeds it up by ~45 μs/day, net correction ~+38 μs/day. Without the correction, position fixes would drift roughly 11 km per day.",
    description: `Every GPS satellite carries a caesium or rubidium atomic clock whose ticking rate is offset before launch by exactly the amount required to compensate two relativistic effects. Special-relativistic time dilation: the satellite's orbital speed is roughly 3.87 km/s, giving γ slightly above 1, so the satellite clock ticks slower than ground clocks by about 7.2 μs per day. General-relativistic time dilation: the satellite orbits at about 20,200 km altitude, where gravitational potential is higher (less negative) than at Earth's surface, so by the equivalence principle its clock ticks *faster* than ground clocks by about 45.9 μs per day. The two effects partially cancel; the net is +38.7 μs per day.

If the correction were not applied, position fixes from GPS trilateration would degrade catastrophically: a 38.7-μs error per day, multiplied by the speed of light, would inject a ~11.6 km/day error into the satellite-to-receiver pseudorange. The fact that GPS works at all is a continuous, civilian-scale verification of both special and general relativity to roughly one part in 10¹⁰. Engineers building the system in the 1970s initially debated whether to bother with the correction; the Air Force operationally confirmed within hours of the first satellite launch in 1978 that without it, the system was unusable. GPS is the textbook example of relativity moving from theoretical exotica to load-bearing infrastructure.`,
    relatedPhysicists: ["albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "gps-as-relativity" },
      { branchSlug: "relativity", topicSlug: "time-dilation" },
      { branchSlug: "relativity", topicSlug: "gravitational-redshift" },
    ],
  },
  {
    slug: "precision-lorentz-tests",
    term: "Precision Lorentz tests",
    category: "concept",
    shortDefinition: "The modern experimental program that constrains hypothetical Lorentz-violating extensions of special relativity to parts in 10⁻¹⁸ or better — Hughes-Drever magnetic-resonance comparisons, Kennedy-Thorndike interferometric asymmetries, and modern atomic-clock-comparison searches for any frame-dependence of fundamental physics.",
    description: `Precision Lorentz tests are the family of high-precision experiments that constrain hypothetical violations of Lorentz invariance — the symmetry under boosts that lies at the heart of special relativity. The program has three historical strands. Hughes-Drever experiments (1959–1961, refined continuously since) compare the magnetic-resonance frequencies of nuclei in different orientations relative to the cosmic rest frame; any anisotropy in inertia or fundamental couplings would produce a sidereal modulation of the resonance frequency. Kennedy-Thorndike experiments (1932 onward) use interferometers whose two arms have different lengths so that the round-trip time is sensitive not only to anisotropy but also to boost magnitude, complementing the orientation sensitivity of Michelson-Morley.

Modern realisations push these bounds to parts in 10⁻¹⁸ or better using optical-lattice atomic clocks, hydrogen masers in vacuum, and cryogenic sapphire oscillators compared across orientation and boost. The Standard-Model Extension (Kostelecký 1998 onward) provides an effective-field-theory framework parametrising every conceivable Lorentz-violating term as coefficients c_TT, c_XX, c_YZ, etc.; precision Lorentz tests are now constraints on those coefficients. No deviation has been observed in any sector. The experimental program is partially motivated by quantum gravity — some candidate theories (loop quantum gravity, string-inspired scenarios) admit Planck-scale Lorentz violation that would propagate downward as suppressed but observable effects; the null results push that scale below the Planck mass and above. Precision Lorentz tests remain among the most stringent symmetry constraints in physics.`,
    relatedPhysicists: ["hendrik-antoon-lorentz", "albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "precision-tests-of-sr" },
      { branchSlug: "relativity", topicSlug: "michelson-morley" },
    ],
  },
  // RT §06 ────────────────────────────────────────────────────────────────
  {
    slug: "equivalence-principle",
    term: "Equivalence principle",
    category: "concept",
    shortDefinition: "Einstein's foundational GR axiom: no local experiment can distinguish a freely falling laboratory in a gravitational field from an inertial laboratory in flat spacetime. Comes in three increasingly strong forms — weak (m_g = m_i), Einstein (WEP + local Lorentz invariance + local position invariance), and strong (extends to self-gravitating bodies).",
    description: `The equivalence principle is the foundational axiom from which Einstein constructed general relativity. In its sharpest form: no local experiment performed inside a sufficiently small, freely falling laboratory can detect the presence of a gravitational field. A clock, a spring, a beam of light, a chemical reaction, a nuclear decay — all behave inside the falling lab exactly as they would in inertial flat-space conditions. Equivalently, the laws of physics in a freely falling frame *are* the laws of special relativity, with no gravitational corrections. This is what allows gravity to be reinterpreted as the geometry of spacetime: if free-fall trajectories in a gravitational field are locally indistinguishable from inertial trajectories in flat space, then "freely falling" is the relativistic generalisation of "inertial," and gravity is not a force but a property of the spacetime manifold itself.

The principle comes in three increasingly strong forms. The *weak equivalence principle* (WEP) demands only that all test particles fall identically — m_grav = m_inertial regardless of composition. The *Einstein equivalence principle* (EEP) adds local Lorentz invariance (no preferred frames inside the falling lab) and local position invariance (no preferred locations); EEP is the form that implies gravity is geometric. The *strong equivalence principle* (SEP) extends EEP to self-gravitating bodies, demanding that even objects whose own gravitational binding energy is significant (planets, stars) free-fall identically. WEP is constrained to ≲ 10⁻¹⁵ by MICROSCOPE 2017+; EEP and SEP are tested by precision-clock experiments and lunar laser ranging, with no deviation observed at any scale.`,
    relatedPhysicists: ["albert-einstein", "roland-eotvos"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "einsteins-elevator" },
      { branchSlug: "relativity", topicSlug: "inertial-vs-gravitational-mass" },
      { branchSlug: "relativity", topicSlug: "gravitational-redshift" },
      { branchSlug: "relativity", topicSlug: "gravity-as-geometry" },
    ],
  },
  {
    slug: "weak-equivalence-principle",
    term: "Weak equivalence principle",
    category: "concept",
    shortDefinition: "The statement that gravitational mass equals inertial mass for any test particle, regardless of composition — equivalently, that all bodies in vacuum fall with identical acceleration. Galileo's Pisa-tower observation, Eötvös's torsion-balance precision result, and the MICROSCOPE 2017 satellite null result confirm it to ≲ 10⁻¹⁵.",
    description: `The weak equivalence principle (WEP) asserts that gravitational mass and inertial mass are the same physical quantity for any test particle. Equivalently: in a vacuum, all bodies fall with identical acceleration regardless of their composition, internal structure, or chemical identity. The classical statement is Galileo's: drop a lead ball and a wooden ball from the Leaning Tower of Pisa, and they reach the ground simultaneously. The relativistic recasting is that a body's response to a gravitational field is determined entirely by spacetime geometry, not by any body-specific charge or coupling — the gravitational analogue of charge-to-mass ratios is universal.

WEP is the cleanest experimental signature of the equivalence principle and the most directly testable. Eötvös's torsion-balance experiments (1889, posthumously refined 1922) constrained any composition-dependent deviation to ≲ 10⁻⁹; the Adelberger group's "Eöt-Wash" experiments at the University of Washington pushed the bound to ~10⁻¹³ in the 1990s; the MICROSCOPE satellite mission (2017–2019) measured platinum and titanium test masses in free-fall around Earth and reported a null result at the ≲ 10⁻¹⁵ level. Lunar laser ranging tests the related Nordtvedt parameter — a combined WEP+SEP constraint — to comparable precision. Any nonzero violation would falsify the geometric interpretation of gravity and force a return to gravity-as-force in some sector. None has ever been observed.`,
    relatedPhysicists: ["roland-eotvos", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "inertial-vs-gravitational-mass" },
      { branchSlug: "relativity", topicSlug: "einsteins-elevator" },
    ],
  },
  {
    slug: "einstein-equivalence-principle",
    term: "Einstein equivalence principle",
    category: "concept",
    shortDefinition: "The form of the equivalence principle Einstein needed for general relativity: WEP + local Lorentz invariance + local position invariance. Inside any sufficiently small freely falling laboratory, the laws of physics reduce to special relativity, and any deviation would be measurable by a sensitive enough experiment.",
    description: `The Einstein equivalence principle (EEP) strengthens the weak equivalence principle by adding two further demands. *Local Lorentz invariance*: inside a sufficiently small freely falling laboratory, the laws of physics are isotropic and independent of the lab's velocity — the inertial laws of special relativity hold exactly. *Local position invariance*: those same laws are independent of where in spacetime the lab is located — no privileged points, no privileged time. Combined with WEP, these three constituents give the form of the equivalence principle Einstein needed for general relativity: gravity is locally indistinguishable from flat-space inertia, and all sufficiently small free-fall frames are physically equivalent.

EEP is the precise content of "gravity is geometry." If it holds, then any deviation between gravitational and inertial frames is a frame-effect, not a property-effect — something that can always be transformed away by going to free-fall. The geodesic equation that governs free-fall in GR is the natural consequence: bodies follow extremal world-lines through spacetime, and gravitational acceleration is a coordinate-system artefact. Tests of EEP separate the three constituents: WEP via Eötvös-class experiments; local Lorentz invariance via precision Lorentz tests (Hughes-Drever, atomic clocks); local position invariance via precision-clock comparison at different gravitational potentials (Gravity Probe A, optical-lattice clock networks). All current data are consistent with EEP at the most sensitive bounds achievable. Schiff's conjecture, never proven, holds that EEP is logically equivalent to a metric theory of gravity — making EEP the single principle from which GR's geometric content follows.`,
    relatedPhysicists: ["albert-einstein"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "einsteins-elevator" },
      { branchSlug: "relativity", topicSlug: "gravity-as-geometry" },
      { branchSlug: "relativity", topicSlug: "gravitational-redshift" },
    ],
  },
  {
    slug: "eotvos-parameter",
    term: "Eötvös parameter",
    category: "concept",
    shortDefinition: "The dimensionless ratio η = (m_g − m_i)/m_i quantifying the fractional difference between gravitational and inertial mass for a given material. Eötvös's torsion-balance experiments constrained η ≲ 10⁻⁹; modern Eöt-Wash and MICROSCOPE measurements push the bound to ≲ 10⁻¹⁵.",
    description: `The Eötvös parameter η is the dimensionless figure of merit for tests of the weak equivalence principle. Defined as η = (m_grav − m_inertial)/m_inertial — or, more precisely, as the differential acceleration between two test bodies of different composition divided by the local gravitational acceleration g — it parametrises any composition-dependent violation of WEP. A nonzero η in any direction or for any material pair would falsify the universality of free-fall and the geometric interpretation of gravity built on top of it. The parameter is named for Loránd Eötvös, whose 1889 and posthumous 1922 torsion-balance results established the first precision bound, η ≲ 10⁻⁹, against materials ranging from platinum and brass to glass and asbestos.

Modern bounds have tightened by six orders of magnitude. The Adelberger group's Eöt-Wash rotating-torsion-balance experiments at the University of Washington reached η ≲ 10⁻¹³ in the 1990s and 2000s, comparing aluminium-beryllium pairs against the gravitational pull of the Sun, the Galactic centre, and dark-matter halo gradients. The MICROSCOPE satellite mission, launched in 2016, measured platinum-titanium pairs in freefall around Earth and reported η ≲ 10⁻¹⁵ in 2017 (with refined null results published through 2022) — the current world bound. No nonzero η has ever been observed at any precision. The persistent null result is one of the strongest empirical underpinnings of general relativity's geometric foundation; any future detection would force revision of the equivalence principle and likely point to new physics in the matter-gravity coupling.`,
    relatedPhysicists: ["roland-eotvos"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "inertial-vs-gravitational-mass" },
      { branchSlug: "relativity", topicSlug: "einsteins-elevator" },
    ],
  },
  {
    slug: "mossbauer-effect",
    term: "Mössbauer effect",
    category: "phenomenon",
    shortDefinition: "Recoilless gamma-ray emission and absorption by nuclei bound in a solid lattice. The lattice absorbs the recoil momentum collectively, leaving the gamma-ray energy unbroadened by Doppler — producing emission lines narrow enough to resolve frequency shifts at parts-per-quadrillion precision. The technique that made the Pound-Rebka 1960 gravitational redshift measurement feasible.",
    description: `The Mössbauer effect is the phenomenon in which a nucleus bound in a solid crystal lattice can emit or absorb a gamma-ray photon without imparting recoil energy to the emitting/absorbing nucleus itself. In a free atom, gamma-ray emission carries off energy hν while the recoiling nucleus also carries kinetic energy E_r = (hν)²/(2Mc²); the photon is therefore Doppler-shifted off the resonance frequency by exactly E_r/h, and absorption by an identical nucleus is suppressed. In a solid lattice, by contrast, the recoil momentum can be absorbed collectively by the entire crystal, whose effective mass is enormous, so the recoil energy E_r per photon vanishes for a fraction of events. Those recoilless photons retain the natural linewidth of the nuclear excited state — typically Γ ≪ 1 part in 10¹².

Rudolf Mössbauer discovered the effect in 1958 while a graduate student at Heidelberg, working with iridium-191 sources; he received the 1961 Nobel Prize. The technique gave experimentalists, for the first time, a frequency reference precise enough to detect shifts at the parts-per-quadrillion level. Pound and Rebka used iron-57 (14.4 keV gamma) in their 1960 Jefferson tower experiment to measure the GR-predicted gravitational redshift Δν/ν ≈ 2.5 × 10⁻¹⁵ — a measurement that would have been unthinkable without recoilless emission. Mössbauer spectroscopy went on to become a workhorse technique in solid-state physics, chemistry, and materials science, exploiting the same parts-per-quadrillion sensitivity to probe local electronic and magnetic environments inside crystals.`,
    relatedPhysicists: ["pound-rebka"],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "gravitational-redshift" },
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
