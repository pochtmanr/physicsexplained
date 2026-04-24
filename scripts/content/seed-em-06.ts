// Seed EM §10 Radiation
// 3 physicists (Larmor, Hertz, Dirac) + 15 structural glossary terms + 3 forward-ref placeholders
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-em-06.ts
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
    slug: "joseph-larmor",
    name: "Joseph Larmor",
    shortName: "Larmor",
    born: "1857",
    died: "1942",
    nationality: "Irish",
    oneLiner: "Cambridge mathematical physicist who in 1897 derived P = q²a²/(6πε₀c³), the foundational classical-radiation formula. Lucasian Professor 1903. His scalar-aether Aether and Matter (1900) came within an inch of special relativity, but he opposed Einstein's geometric version to the end.",
    bio: `Joseph Larmor was born in Magheragall, County Antrim, in 1857, the son of a Belfast shopkeeper. He was educated at the Royal Belfast Academical Institution and Queen's College Belfast, then went up to St John's College, Cambridge in 1877, where he finished as Senior Wrangler in the 1880 Mathematical Tripos — the top graduating mathematician of his year, ahead of J. J. Thomson, who finished second. He taught briefly at Queen's College Galway before returning to St John's as a Fellow in 1885, and spent the rest of his career in Cambridge. His mathematical formation was classical: Stokes's fluid mechanics, Maxwell's treatise, and the analytical mechanics of Hamilton and Jacobi. His lifelong project was to write electromagnetism as a branch of mathematical physics on the same footing as celestial mechanics.

The central work came in 1897. In a paper titled "On the theory of the magnetic influence on spectra; and on the radiation from moving ions," Larmor derived the total power radiated by an accelerating point charge: P = q²a²/(6πε₀c³), now universally called the **Larmor formula**. It is the foundational result of classical radiation theory — every antenna, every synchrotron, every X-ray tube, every stellar luminosity is traceable to this equation. In the same decade he worked out the **Larmor precession** ω_L = qB/(2m), the angular frequency at which a classical magnetic moment precesses in an external magnetic field, which half a century later became the basic mechanism of nuclear magnetic resonance. His treatise *Aether and Matter* (1900) developed a scalar-aether model in which moving frames see length-contracted rulers and slowed clocks — the Lorentz transformations in nearly their modern form, published five years before Einstein's 1905 paper. Larmor interpreted these as real physical effects on matter embedded in the aether, not as the geometry of spacetime itself.

He was elected to the Royal Society in 1892, awarded the Copley Medal in 1921, and appointed Lucasian Professor of Mathematics in 1903 — Newton's old chair, which he held until 1932. He was knighted in 1909 and served as a Unionist Member of Parliament for Cambridge University 1911–1922, a seat reserved for graduates until 1950. Despite having written down the Lorentz transformations independently, Larmor never accepted Einstein's 1905 reformulation. He remained a convinced aetherist to the end of his life, writing as late as 1927 that the abolition of the aether was a philosophical error. He retired to Holywood in County Down in 1932 and died there in 1942 at eighty-five. The lunar crater Larmor bears his name; the Larmor formula carries it into every graduate electromagnetism course in the world.`,
    contributions: [
      "Derived the Larmor formula P = q²a²/(6πε₀c³) in 1897 — the foundational classical expression for power radiated by an accelerating charge",
      "Established Larmor precession ω_L = qB/(2m), later the basic mechanism of NMR and electron spin resonance",
      "Derived the Lorentz transformations (length contraction and time dilation) in Aether and Matter (1900), five years before Einstein's 1905 paper — interpreting them as real effects on matter in the aether",
      "Held the Lucasian Chair at Cambridge 1903–1932, teaching mathematical physics to a generation that included G. I. Taylor and Paul Dirac",
      "Opposed Einstein's geometric reformulation of relativity to the end of his life; remained a convinced aether-theorist",
      "Senior Wrangler 1880 (ahead of J. J. Thomson); knighted 1909; Copley Medal 1921; MP for Cambridge University 1911–1922",
    ],
    majorWorks: [
      "On the theory of the magnetic influence on spectra; and on the radiation from moving ions (1897) — the Larmor formula paper",
      "Aether and Matter (1900) — scalar-aether derivation of the Lorentz transformations",
      "Mathematical and Physical Papers (1929) — two-volume collected works",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "larmor-formula" },
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  {
    slug: "heinrich-hertz",
    name: "Heinrich Rudolf Hertz",
    shortName: "Hertz",
    born: "1857",
    died: "1894",
    nationality: "German",
    oneLiner: "Karlsruhe physicist who in 1887–1888 built the first spark-gap transmitter and loop-antenna receiver and measured the radio waves Maxwell had predicted twenty-four years earlier. Died at thirty-six of Wegener's granulomatosis. The SI unit of frequency carries his name.",
    bio: `Heinrich Rudolf Hertz was born in Hamburg in 1857 to a prominent Jewish-turned-Lutheran family — his father was a barrister who later became a senator of the Hanseatic city. He was gifted in languages, in woodwork, and in mathematics; his school reports describe a boy who took everything apart and rebuilt it. He began an engineering course at Dresden and Munich, then switched to physics at the University of Berlin in 1878, where he studied under Gustav Kirchhoff and Hermann von Helmholtz. Helmholtz recognised the talent immediately and set him problems at the research frontier. Hertz took his doctorate in 1880 at twenty-three on electromagnetic induction in rotating conductors, and spent three more years in Berlin as Helmholtz's assistant before moving to a professorship at the Karlsruhe Polytechnic in 1885.

The central work occupied him from 1886 to 1888. The Prussian Academy of Sciences, on Helmholtz's initiative, had offered a prize for the first experimental confirmation of Maxwell's 1865 prediction that accelerating electric charges must radiate transverse electromagnetic waves travelling at the speed of light. Nobody had yet demonstrated it. Hertz designed the apparatus from scratch: an induction coil driven by a battery charged two brass balls separated by a small air gap until the voltage broke down, producing a spark that rang the wire-plus-balls LC circuit at around 50 MHz. A separate loop of wire with a second micro-gap served as the receiver. When the transmitter fired, the receiver produced a faint secondary spark — the first detected radio wave, in the autumn of 1887. Over the following year he measured the wavelength by mapping out standing waves between a wall reflector and the transmitter, computed the propagation speed, and verified it matched Maxwell's c = 1/√(μ₀ε₀). He demonstrated reflection, refraction, and polarisation of the waves — the full set of properties that identified them as electromagnetic. The results were published in *Annalen der Physik* in 1888 and sealed the synthesis.

He moved to a chair at Bonn in 1889 but fell ill soon after. He died in 1894 at thirty-six of what is now recognised as granulomatosis with polyangiitis (formerly Wegener's granulomatosis), an autoimmune disease that attacked his jaw and sinuses and left him in years of pain. In his last year, confined to bed, he prepared *The Principles of Mechanics* for posthumous publication — a reformulation of classical mechanics without force as a primitive concept, that influenced Wittgenstein, Einstein, and the Vienna Circle. The SI unit of frequency, the hertz (Hz), was adopted in his name at the 1930 International Electrotechnical Commission meeting. Marconi, building on Hertz's apparatus, had made a commercial product of transatlantic radio by 1901. Hertz never lived to see it.`,
    contributions: [
      "Built the first spark-gap oscillator (transmitter) and loop-antenna receiver; detected the first laboratory radio waves at Karlsruhe in autumn 1887",
      "Measured the wavelength of electromagnetic waves by standing-wave interference, computed their propagation speed, and confirmed Maxwell's prediction c = 1/√(μ₀ε₀) to within experimental error",
      "Demonstrated reflection, refraction, and polarisation of radio waves in 1888, establishing them as transverse electromagnetic waves identical in nature to light",
      "Published The Principles of Mechanics (posthumous, 1894) — a force-free reformulation of classical mechanics that influenced Wittgenstein and twentieth-century philosophy of science",
      "Discovered the photoelectric effect in passing (1887): ultraviolet light on the spark-gap electrodes lowered the breakdown voltage — an observation Einstein explained in 1905",
      "The SI unit of frequency, the hertz (Hz), was named after him at the 1930 IEC meeting",
    ],
    majorWorks: [
      "Über sehr schnelle elektrische Schwingungen (1887) — the first detection of radio waves",
      "Untersuchungen über die Ausbreitung der elektrischen Kraft (1892) — collected papers on electromagnetic waves",
      "Die Prinzipien der Mechanik (1894, posthumous) — force-free reformulation of classical mechanics",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
    ],
  },
  {
    slug: "paul-dirac",
    name: "Paul Adrien Maurice Dirac",
    shortName: "Dirac",
    born: "1902",
    died: "1984",
    nationality: "British",
    oneLiner: "Cambridge theoretical physicist who in 1928 wrote down the relativistic wave equation for the electron, predicted antimatter, and co-founded quantum electrodynamics. Shared the 1933 Nobel Prize with Schrödinger. The delta function, the Dirac sea, and bra-ket notation all carry his name.",
    bio: `Paul Adrien Maurice Dirac was born in Bristol in 1902. His father was a Swiss-born teacher of French; his early home was famously silent and severe, a childhood Dirac later described as training in speaking only when spoken to and only with exact precision. He studied electrical engineering at Bristol University from 1918, could not find an engineering job in the post-war slump, and took a free mathematics degree at Bristol to fill the time. In 1923 he went up to St John's College, Cambridge as a research student under Ralph Fowler. In 1925 Werner Heisenberg's first quantum paper arrived in Cambridge; Dirac rewrote it within weeks in his own algebraic formulation ("q-numbers") and was doing original quantum mechanics at twenty-three. Over 1925–1927 he produced the transformation theory connecting Heisenberg's matrix mechanics and Schrödinger's wave mechanics, the Dirac delta function, and the first formulation of quantum electrodynamics.

The central work came in 1928. Schrödinger's equation was non-relativistic and could not describe electrons at high energies; the Klein-Gordon equation was relativistic but produced negative probabilities. Dirac demanded a relativistic wave equation that was first-order in time (like Schrödinger's) and compatible with special relativity. The only solution was to introduce four-component spinors and a matrix algebra — the Dirac equation. Spin emerged automatically as a geometric consequence of relativistic covariance, not as a bolt-on assumption. The equation had twice as many solutions as expected, half of them at negative energy. In 1931 he interpreted the negative-energy solutions as antiparticles — predicting a positively charged twin of the electron. The positron was discovered in cosmic rays by Carl Anderson at Caltech the following year. Antimatter, which nobody had any evidence for, had been deduced from an equation. In 1938 he extended the classical Abraham-Lorentz radiation-reaction force to a fully Lorentz-covariant relativistic equation — now the **Abraham-Lorentz-Dirac (ALD) equation** — which inherits the classical pathologies but provides the correct relativistic form that any successor theory must reduce to.

He was Lucasian Professor at Cambridge 1932–1969 and shared the 1933 Nobel Prize in Physics with Erwin Schrödinger for "the discovery of new productive forms of atomic theory." His 1930 *Principles of Quantum Mechanics* is still in print and is the textbook every subsequent textbook is written against. Bra-ket notation, the Dirac delta, the Dirac sea, and Fermi-Dirac statistics (with Fermi, independently) are among his named legacies. He was famously laconic — his colleagues joked about the *dirac*, a unit equal to one word per hour — and resisted biographical attention. In 1971 he retired from Cambridge and took a chair at Florida State University in Tallahassee, where he worked on large-numbers cosmology and magnetic monopoles until his death in 1984 at eighty-two. He is buried in Tallahassee, with a memorial stone at Westminster Abbey beside Newton.`,
    contributions: [
      "Wrote down the Dirac equation (1928), the first relativistic wave equation for the electron, from which spin and the g-factor of 2 emerge automatically",
      "Predicted antimatter in 1931 by interpreting the negative-energy solutions of the Dirac equation as positrons; Anderson discovered the positron in 1932",
      "Co-founded quantum electrodynamics in the 1927 paper on the quantum theory of emission and absorption of radiation — the first quantised treatment of the electromagnetic field",
      "Extended the Abraham-Lorentz radiation-reaction force to the Lorentz-covariant ALD equation in 1938",
      "Introduced the Dirac delta function, bra-ket notation, the transformation theory, and (with Fermi independently) Fermi-Dirac statistics",
      "Shared the 1933 Nobel Prize in Physics with Schrödinger; Lucasian Professor at Cambridge 1932–1969",
    ],
    majorWorks: [
      "The Quantum Theory of the Electron (1928) — the Dirac equation",
      "The Principles of Quantum Mechanics (1930) — the canonical quantum-mechanics textbook; still in print",
      "Classical theory of radiating electrons (1938) — the Abraham-Lorentz-Dirac equation",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // §10.1 larmor-formula ─────────────────────────────────────────────────
  {
    slug: "larmor-formula",
    term: "Larmor formula",
    category: "concept",
    shortDefinition: "The classical expression P = q²a²/(6πε₀c³) for the total electromagnetic power radiated by a non-relativistic point charge of acceleration a. Derived by Joseph Larmor in 1897; the foundational result of classical radiation theory.",
    description: `The Larmor formula gives the total electromagnetic power radiated by a non-relativistic point charge q undergoing instantaneous acceleration a as P = q²a²/(6πε₀c³). It is the foundational result of classical radiation theory: every antenna (§10.3), every synchrotron (§10.4), every bremsstrahlung X-ray tube (§10.5), and every radiating star's luminosity traces back to this one equation. The derivation proceeds from the retarded-potential expression for the far-field electric radiation field E_rad ∝ q·a_⊥/(rc²), computes the Poynting flux S = |E_rad|²/(μ₀c), integrates over a sphere at infinity, and uses the angular integral ∫sin²θ dΩ = 8π/3. The factor of 1/(6π) is a direct geometric consequence of integrating the sin²θ radiation pattern (a doughnut-shaped lobe perpendicular to a) over the full solid angle.

The formula has two critical limitations. It is non-relativistic — for speeds approaching c, the formula generalises to the Liénard result P = (q²γ⁶/6πε₀c³)[a² − (v×a)²/c²], which can exceed the non-relativistic value by a factor of γ⁶ when acceleration is parallel to velocity, or γ⁴ when perpendicular (as in circular motion, where it yields synchrotron radiation). And it is classical — quantum radiation (spontaneous emission, bremsstrahlung at high energies) obeys different spectrum shapes, though the total power agrees with Larmor in the correspondence limit ℏω ≪ mc². Dimensional check: q² has units of C² = A²·s²; ε₀ is F/m = A²·s⁴/(kg·m³); a² is m²/s⁴; c³ is m³/s³. Combining: A²·s² · m²/s⁴ · kg·m³/(A²·s⁴) · 1/m³ = kg·m²/s³ = W. Correct.`,
    history: "Joseph Larmor derived the formula in 1897 at Cambridge, in a paper on the magnetic influence on spectra. Henri Liénard independently extended it to the relativistic case in 1898.",
    relatedPhysicists: ["joseph-larmor"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "larmor-formula" },
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
    ],
  },
  {
    slug: "larmor-power",
    term: "Larmor power",
    category: "concept",
    shortDefinition: "The instantaneous total radiated power P = q²a²/(6πε₀c³) of an accelerating point charge, integrated over all solid angle. Synonym of the Larmor formula result; the quantity that appears as the rate of energy loss in radiation-reaction problems.",
    description: `Larmor power is the instantaneous total electromagnetic power radiated by a non-relativistic accelerating point charge — the result of integrating the radiation Poynting flux over a sphere at infinity. Numerically P = q²a²/(6πε₀c³); for an electron (q = e, m = m_e) at acceleration a this evaluates to about 5.7×10⁻⁵⁴·(a / [m/s²])² watts, a number that makes clear why laboratory-scale accelerations radiate negligibly but particle-accelerator accelerations (~10²⁰ m/s² in a synchrotron bend) do not.

The quantity functions as an energy-conservation bookkeeper: it is the rate at which kinetic energy must be drained from the charge to pay for the outgoing radiation field. This bookkeeping is what motivates the radiation-reaction force of §10.6 — if power P is being radiated, an effective force F_rad must be doing negative work at the same rate, F_rad·v = −P. Working back from P = q²a²/(6πε₀c³) to the simplest local force expression that satisfies this energy-balance constraint on time-averaged over a cycle gives the Abraham-Lorentz result F_rad = (μ₀q²/6πc)·da/dt, which is proportional to the jerk rather than the acceleration itself. The relativistic generalisation (Liénard) retains the same functional dependence on acceleration squared but picks up a γ⁶ or γ⁴ prefactor depending on the angle between v and a. In astrophysical contexts (pulsar spin-down, synchrotron cooling of relativistic electrons in supernova remnants), the Larmor power integrated over the lifetime of a source sets the total radiated energy budget.`,
    relatedPhysicists: ["joseph-larmor"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "larmor-formula" },
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  // §10.2 electric-dipole-radiation ─────────────────────────────────────
  {
    slug: "near-field-zone",
    term: "Near-field zone",
    category: "concept",
    shortDefinition: "The region r ≪ λ surrounding an oscillating source where the field resembles a time-varying instantaneous quasi-static field (amplitude ∝ 1/r³ for a dipole) that stores and returns energy rather than radiating it. Also called the induction zone or reactive zone.",
    description: `The near-field zone is the region surrounding an oscillating source at distances much smaller than a wavelength (r ≪ λ, or equivalently k·r ≪ 1 where k = 2π/λ). In this region the electromagnetic field is dominated by the quasi-static components: for an oscillating electric dipole p(t) = p₀ cos(ωt), the near-field electric field has the same angular structure as an electrostatic dipole (the familiar 3cos²θ − 1 radial pattern and the transverse sinθ dipole lines), but breathing in time as p(t) flips sign. Its amplitude falls as 1/r³ — cube the distance and you have killed the field.

Energy in the near zone sloshes: on one quarter-cycle it flows outward from the source, on the next it flows back in. The time-averaged Poynting flux through a sphere in this region is zero (to leading order in kr). This is the same energy-storage behaviour that characterises capacitor plates or inductor coils — fields that store energy reactively without transporting it away. Antenna engineers call this the **reactive near field**, and a small capacitively or inductively coupled probe placed in this zone will draw energy from the source via direct mutual coupling rather than by collecting radiation. The transition radius where near-field and far-field amplitudes cross is r = λ/(2π) = c/ω; outside this surface the 1/r² crossover to the 1/r radiative component takes over, and beyond about 2D²/λ (for a source of largest dimension D) one is firmly in the **far-field zone** where energy flows outward irreversibly.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
    ],
  },
  {
    slug: "far-field-zone",
    term: "Far-field zone",
    category: "concept",
    shortDefinition: "The region r ≫ λ surrounding an oscillating source where the field is an outgoing spherical wave with amplitude ∝ 1/r and time-averaged Poynting flux that transports energy irreversibly outward. Also called the radiation zone, Fraunhofer zone, or wave zone.",
    description: `The far-field zone is the region at distances much greater than a wavelength from an oscillating source (r ≫ λ, kr ≫ 1). In this region the field takes the form of an outgoing spherical wave: the electric and magnetic components are mutually perpendicular, transverse to the radial direction, in-phase with each other, with |B| = |E|/c, and with amplitudes that fall only as 1/r. This slow falloff is what allows radiation to escape: integrating the Poynting flux S = (1/μ₀)E×B over a sphere of radius r gives a total power independent of r, because the 1/r² decrease of S is exactly compensated by the 4πr² increase of the sphere's surface area. The same power crosses every concentric shell, forever — this is literally light, or radio, or X-rays, depending on ω.

The angular distribution of the far-field intensity is the **radiation pattern**, which for a simple oscillating dipole is the sin²θ doughnut of §10.2. For more complex sources (half-wave dipoles, arrays, reflector antennas) the pattern is obtained as the magnitude-squared Fourier transform of the current distribution on the source evaluated at the radiation wavevector k. The boundary with the near-field zone is conventionally placed at the Fraunhofer distance 2D²/λ, where D is the largest linear dimension of the source — inside this radius the wavefronts have not yet flattened into the quasi-planar form assumed by far-field antenna-pattern formulae; outside it, they have. In astrophysical contexts every observer is automatically in the far field of every source, and the radiation pattern directly determines what fraction of a star's, pulsar's, or synchrotron source's power is pointed at the Earth.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
    ],
  },
  {
    slug: "retarded-time",
    term: "Retarded time",
    category: "concept",
    shortDefinition: "The earlier time t_r = t − |r − r_s(t_r)|/c at which a signal must have left a moving source in order to arrive at the observer at time t. Built into the retarded potentials and all causal electromagnetic radiation formulae.",
    description: `Retarded time is the earlier instant t_r at which electromagnetic information must have left a moving source position r_s(t_r) in order to reach an observer at position r at the present time t. Because electromagnetic signals propagate at the finite speed c, "now here" is determined by "then there" across a light-travel delay |r − r_s(t_r)|/c. The defining equation t_r = t − |r − r_s(t_r)|/c is implicit: the retarded source position depends on the retarded time, which in turn depends on the source's trajectory. For a stationary source the equation collapses trivially to t_r = t − r/c; for a moving source it requires algebraic or numerical inversion.

Retarded time appears in three canonical places. First, the Liénard-Wiechert potentials V(r, t) = (q/4πε₀) · 1/[κ·R]_r and A(r, t) = (q v/4πε₀c²) · 1/[κ·R]_r are evaluated at t_r, with R the retarded source-observer separation and κ = 1 − n̂·v/c the Doppler-like geometric factor. Second, the radiation field of an oscillating dipole carries the argument cos(ω(t − r/c)) rather than cos(ωt), so the "now" field at distance r is set by "then" behaviour of the dipole at time t − r/c. Third, in radiation-reaction problems (§10.6) the self-force of a charge on itself is computed by integrating the retarded field of every element of the charge over every other element, with each pair picking up its own retarded-time shift. The causal structure of classical electromagnetism — effects never precede their causes — is built into retarded time, and the "advanced" solutions (t_a = t + r/c, which formally satisfy Maxwell's equations but violate causality) are discarded by fiat except in certain time-reversal-invariance thought experiments.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "larmor-formula" },
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  // §10.3 antennas-and-radio ─────────────────────────────────────────────
  {
    slug: "hertzian-dipole",
    term: "Hertzian dipole",
    category: "concept",
    shortDefinition: "The idealised point-dipole antenna — an infinitesimally short conductor of length L ≪ λ carrying a uniform oscillating current I(t) = I₀ cos(ωt). Used as the basic radiating element from which the fields of all more complex antennas are built by superposition.",
    description: `The Hertzian dipole is the textbook idealisation of an antenna: an infinitesimally short conducting segment of length L ≪ λ carrying a uniform sinusoidal current I(t) = I₀ cos(ωt). The model treats the dipole as a point source at the origin with oscillating current moment p_m = I₀ L, from which the full electromagnetic field at every point in space is computed by the retarded-potential formalism. The name honours Heinrich Hertz, whose 1887 spark-gap antenna was effectively one at the wavelengths he worked with, though the mathematical idealisation is typically attributed to later theoretical developments by Pocklington and others.

The far-field radiation from a Hertzian dipole is the canonical sin²θ doughnut pattern, with maximum broadside (θ = 90°) and perfect null along the axis (θ = 0° and 180°). The radiated power is P = (μ₀ ω² I₀² L²)/(12πc), the radiation resistance is R_rad = (2π/3)(μ₀c)(L/λ)² ≈ 80π²(L/λ)² Ω, and the directive gain is G = 1.5 (1.76 dBi). The Hertzian dipole is the building block for every more complex antenna: a half-wave dipole is a collection of Hertzian elements with a sinusoidal current envelope, an array is a collection of such dipoles with phase relationships, and a reflector or aperture antenna is the continuous limit. Its shortcomings as a real antenna are also instructive — the radiation resistance scales as (L/λ)² and becomes vanishingly small for L ≪ λ, requiring impractically large matching networks, which is why practical broadcast antennas are always at least a quarter-wavelength long.`,
    relatedPhysicists: ["heinrich-hertz"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
    ],
  },
  {
    slug: "antenna-gain",
    term: "Antenna gain",
    category: "concept",
    shortDefinition: "The dimensionless ratio G = 4π · (maximum radiation intensity)/(total radiated power) that quantifies how much an antenna concentrates its radiation in its peak direction relative to an isotropic radiator. Usually expressed in dBi (decibels over isotropic).",
    description: `Antenna gain is the dimensionless ratio G = 4π U_max/P_rad, where U_max is the maximum radiation intensity (power per unit solid angle) and P_rad is the total power radiated by the antenna. It quantifies the extent to which an antenna concentrates its radiated power in its peak direction compared with a hypothetical isotropic radiator that would spread the same total power uniformly over 4π steradians. Gain is usually expressed in decibels relative to isotropic (dBi): G_dBi = 10 log₁₀(G).

Representative values: an isotropic radiator has G = 1 (0 dBi) by definition. A Hertzian dipole has G = 1.5 (1.76 dBi). A centre-fed half-wave dipole has G ≈ 1.64 (2.15 dBi). A three-element Yagi for VHF television has about 7 dBi. A large parabolic dish for satellite downlink has G up to 40–60 dBi, with its gain-aperture relation G = 4π A_eff/λ². The reciprocity theorem guarantees that an antenna's gain is the same for transmission and reception — a high-gain dish that concentrates outgoing power into a narrow beam equally collects incoming power from that same narrow beam and rejects signals from elsewhere. The gain enters the Friis transmission formula P_r = P_t G_t G_r (λ/4πr)² that governs radio link budgets, and the effective aperture A_eff = G λ²/(4π) gives the equivalent collecting area for reception. Gain above isotropic is always paid for by pattern narrowness: no antenna can have G > 1 in every direction; high gain in one direction requires nulls elsewhere.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
    ],
  },
  {
    slug: "radiation-pattern",
    term: "Radiation pattern",
    category: "concept",
    shortDefinition: "The angular distribution of an antenna's far-field radiated power as a function of direction, dP/dΩ(θ, φ). For a short dipole the pattern is the sin²θ doughnut; for arrays and apertures it is the magnitude-squared Fourier transform of the current distribution.",
    description: `The radiation pattern of an antenna (or any localised source) is the angular distribution of the far-field radiated power per unit solid angle, dP/dΩ(θ, φ), usually plotted normalised to its maximum on a polar or 3D surface. For an oscillating electric dipole — the Hertzian model — the pattern is dP/dΩ ∝ sin²θ, the "doughnut" with zeros along the dipole axis and maximum broadside, independent of azimuthal angle φ. For a centre-fed dipole of arbitrary length the pattern becomes the squared modulus of [cos(kL cosθ/2) − cos(kL/2)]/sinθ, which for a half-wave dipole pinches the sin²θ doughnut into a slightly narrower lobe with gain 1.64. For a continuous current distribution the pattern is the magnitude-squared Fourier transform of the current evaluated at the radiation wavevector k = (ω/c)r̂ — a result that is the antenna-theory analogue of the aperture-diffraction theorem in Fraunhofer optics.

The pattern encodes both the angular selectivity and the angular nulls of an antenna, both of which are operationally important. The directivity is the ratio 4π · dP/dΩ_max / P_rad, which combined with efficiency η yields the antenna gain G = η · directivity. The half-power beamwidth (HPBW) — the angular width between the two −3 dB points — sets the angular resolution in radio-astronomy beam-formed observations. Sidelobe levels determine how much stray signal couples in from unwanted directions. For arrays of radiating elements the pattern is the element pattern multiplied by the array factor, a result that makes phased-array beam-steering (changing the array factor by changing the inter-element phase without moving the antenna) computationally tractable. In astrophysics, the effective radiation pattern of a relativistic beamed source (a pulsar, a blazar) contracts with γ and sweeps past the observer at the rotation frequency to produce the characteristic pulsed-emission light curves.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
    ],
  },
  // §10.4 synchrotron-radiation ─────────────────────────────────────────
  {
    slug: "synchrotron-radiation",
    term: "Synchrotron radiation",
    category: "phenomenon",
    shortDefinition: "The electromagnetic radiation emitted by a relativistic charged particle following a curved trajectory in a magnetic field. Power scales as γ⁴ in circular motion; the spectrum is broad with characteristic frequency ω_c ∝ γ³c/R. Basis of synchrotron light sources and pulsar emission.",
    description: `Synchrotron radiation is the electromagnetic radiation emitted when a relativistic charged particle is bent by a perpendicular magnetic field and therefore undergoes perpendicular acceleration at fixed speed. Because the acceleration is perpendicular to velocity, the Liénard-generalised Larmor formula evaluates to P = q²c β⁴ γ⁴/(6πε₀R²), where R is the radius of curvature and γ = (1 − β²)^(−1/2) is the Lorentz factor. The γ⁴ scaling means radiation losses are negligible at non-relativistic energies but catastrophic at γ > 10⁴ — the fundamental reason circular electron colliders (like LEP at CERN) hit energy walls below the TeV scale while proton colliders (heavier by 1836, radiating 1836⁴ ≈ 10¹³ times less per unit acceleration) do not.

The spectrum is broadband, peaking near the **critical frequency** ω_c = (3/2) γ³ c/R. Above ω_c the spectrum falls exponentially, below ω_c it rises as ω^(1/3). Because of relativistic beaming, the emission at each instant is confined to a narrow forward cone of half-angle 1/γ — the laboratory-frame observer sees a short pulse each time the tangent to the orbit sweeps past, and the Fourier transform of this short pulse is what produces the broad spectrum. First observed as a blue-white arc leaking out of General Electric's 70 MeV synchrotron in April 1947, the phenomenon now powers dedicated **synchrotron light sources** (Diamond, ESRF, APS, NSLS-II) that produce brilliant, tunable, polarised, collimated beams from infrared to hard X-rays for crystallography, spectroscopy, and imaging. Astrophysically, synchrotron radiation is the dominant non-thermal emission mechanism from supernova remnants (Crab Nebula), radio galaxies, AGN jets, and the polarised radio emission of the Milky Way's magnetised interstellar medium. The pulsar mechanism — relativistic electrons accelerated along curved open-field lines of a rotating neutron star — is a close relative.`,
    relatedPhysicists: ["joseph-larmor"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
    ],
  },
  {
    slug: "relativistic-beaming",
    term: "Relativistic beaming",
    category: "phenomenon",
    shortDefinition: "The forward concentration of radiation from a relativistic source into a cone of half-angle ≈ 1/γ, caused by the Lorentz transformation of solid angles. Responsible for pulsar pulsed emission, blazar flux variability, and the lighthouse behaviour of synchrotron sources.",
    description: `Relativistic beaming is the forward concentration of electromagnetic radiation emitted by a source moving at relativistic speed v = βc. In the source's instantaneous rest frame the emission pattern may be the familiar sin²θ doughnut of non-relativistic dipole radiation (roughly isotropic). After Lorentz-boosting into the laboratory frame, however, that pattern collapses into a narrow cone of half-angle θ_beam ≈ 1/γ centred on the direction of motion. A source with γ = 10 beams 97% of its radiation into a 5.7° cone; a blazar jet with γ = 30 beams into a 2° cone; a pulsar with γ = 10⁶ beams into a sub-arcsecond cone.

The mechanism is geometric: solid-angle elements in the rest frame dΩ′ transform to laboratory solid-angle elements dΩ = dΩ′/δ², where the Doppler factor δ = 1/[γ(1 − β·n̂)] exceeds unity in the forward direction and is much less than unity in the backward hemisphere. Photons emitted forward arrive blueshifted and concentrated; photons emitted backward arrive redshifted and dispersed. The observable signatures are dramatic. A relativistic source moving toward the observer brightens by a factor δ^(3+α) (where α is the spectral index) relative to its rest-frame luminosity — a "boost" of orders of magnitude. This is why blazar jets, viewed down the jet axis, outshine their host galaxies; why quasar superluminal motion (apparent velocities > c) is observed on VLBI maps; and why pulsars appear as on-off sources rather than steady glows (the beam points at the observer only during a small fraction of each rotation). The contrast ratio between beam-on and beam-off intensity scales as δ^4 ∼ γ^4, which for γ = 10⁶ is 10²⁴ — the pulsar regime.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
    ],
  },
  // §10.5 bremsstrahlung ─────────────────────────────────────────────────
  {
    slug: "bremsstrahlung",
    term: "Bremsstrahlung",
    category: "phenomenon",
    shortDefinition: "German for braking radiation — the continuous electromagnetic spectrum emitted when a charged particle decelerates in the Coulomb field of a nucleus. Produces the continuum background in X-ray tubes; cuts off sharply at the Duane-Hunt limit E_max = eU.",
    description: `Bremsstrahlung — German for "braking radiation" — is the continuous electromagnetic radiation emitted when a charged particle decelerates in the electrostatic field of another charged particle, typically an atomic nucleus. The physics is a direct application of the Larmor formula: any acceleration produces radiation, and deceleration during a Coulomb scattering event is no exception. An electron passing through a tungsten target in an X-ray tube suffers many small-angle Rutherford deflections; at each close encounter with a nucleus its transverse acceleration peaks, producing a brief pulse of radiation whose Fourier transform contributes to the continuous X-ray spectrum.

The thick-target spectrum (where the electron slows to rest inside the target, radiating many photons on the way) was worked out classically by Hendrik Kramers in 1923 and has the remarkably simple form dN/dE ∝ (E_max − E)/E — a hyperbolic falloff in photon number from near-zero energies up to a sharp cutoff at E_max = eU, the Duane-Hunt limit, where U is the accelerating voltage of the tube. The thin-target spectrum (electron passes through without losing much energy) has a different shape, worked out quantum-mechanically by Hans Bethe and Walter Heitler in 1934. The total bremsstrahlung power radiated per electron scales as Z²/m², which is why heavy-nucleus targets (tungsten, Z = 74) produce efficient bremsstrahlung for electrons but lightweight particles (positrons, electrons) are the preferred projectile. Astrophysical bremsstrahlung is responsible for the thermal X-ray emission from hot ionised gas in galaxy clusters (T ∼ 10⁷ K, kT ∼ 1 keV), where free-free transitions of thermal electrons in the proton Coulomb field produce a characteristic exponential bremsstrahlung spectrum whose slope directly measures the cluster temperature.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
    ],
  },
  {
    slug: "duane-hunt-limit",
    term: "Duane-Hunt limit",
    category: "concept",
    shortDefinition: "The sharp high-energy cutoff of the bremsstrahlung X-ray spectrum at E_max = eU, where U is the accelerating voltage of the tube. Discovered by William Duane and Franklin Hunt at Harvard in 1915 and one of the early confirmations that E = hν.",
    description: `The Duane-Hunt limit is the sharp upper-energy cutoff in the bremsstrahlung continuum produced by an X-ray tube: no photon in the continuous spectrum has energy greater than E_max = eU, where U is the voltage across the tube and e is the electron charge. Equivalently, the spectrum has a minimum wavelength λ_min = hc/(eU) — above which X-rays are found, below which there are none. A tube running at U = 50 kV produces no photons above 50 keV; a 100 kV tube cuts off at 100 keV; every tube cuts off exactly at the accelerating voltage. The cutoff is not a gradual falloff but an absolute wall in the spectrum, verifiable with a Bragg-crystal spectrometer to within the resolution of the instrument.

The interpretation is direct energy conservation at the quantum level. An electron entering the target with kinetic energy eU cannot radiate more energy in a single photon than it brought in. In the most extreme single scattering event the electron gives all its kinetic energy to one bremsstrahlung photon, producing hν_max = eU, i.e. the Duane-Hunt limit. Discovered experimentally by William Duane and Franklin Hunt at Harvard in 1915 — one year after Moseley's X-ray spectroscopy established that atomic X-ray lines depended on Z² — the limit was one of the earliest laboratory demonstrations outside the photoelectric effect that photon energy is quantised as E = hν, with h the same Planck constant that appeared in blackbody radiation and the Bohr atom. Rearranged, the relation λ_min·U = hc/e ≈ 1.2398 keV·nm / (kV) gives a precision determination of the ratio h/e; modern measurements use the same relation at the 10⁻⁹ level to tie macroscopic voltage standards to atomic physics via the Josephson effect.`,
    history: "Discovered by William Duane and Franklin Hunt at Harvard in 1915, in what was one of the first confirmations of E = hν outside Einstein's photoelectric-effect theory.",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
    ],
  },
  // §10.6 radiation-reaction ─────────────────────────────────────────────
  {
    slug: "abraham-lorentz-equation",
    term: "Abraham-Lorentz equation",
    category: "concept",
    shortDefinition: "The third-order equation of motion m·a = F_ext + (μ₀q²/6πc)·ȧ for a radiating classical point charge, combining Newton's second law with a jerk-proportional radiation-reaction force. Derived 1903–1904; harbours runaway solutions and acausal pre-acceleration.",
    description: `The Abraham-Lorentz equation is the classical equation of motion for a point charge radiating electromagnetic energy while subject to an external force F_ext: m·a = F_ext + (μ₀q²/6πc)·ȧ, where ȧ = da/dt is the jerk (third time-derivative of position). The extra term is the **Abraham-Lorentz radiation-reaction force** F_rad = (μ₀q²/6πc)·ȧ, whose coefficient is set by demanding that its time-averaged work balance the Larmor-formula energy-loss rate −P = −q²a²/(6πε₀c³). Max Abraham derived it in 1903 by computing the self-force of a small charged sphere on itself and taking the point-particle limit; Hendrik Antoon Lorentz wrote it into its modern form in 1904.

The equation is structurally anomalous in two ways. First, it is third-order in time (through the jerk term), while Newton's second law is second-order — solving an Abraham-Lorentz problem therefore requires specifying *three* initial conditions rather than two. Second, the third-order character admits **runaway solutions**: a free charge with any initial jerk sees its acceleration grow exponentially as exp(t/τ₀), where τ₀ = q²/(6πε₀mc³) ≈ 6.3×10⁻²⁴ s for an electron, without any external energy source. To kill the runaway one imposes a boundary condition at future infinity, which has the equally unphysical consequence of **pre-acceleration** — the charge begins responding a time ∼ τ₀ before the external force is applied. Landau and Lifshitz proposed a reduced-order regularisation (substitute Ḟ_ext/m for the jerk term, yielding an ordinary second-order equation) that is accurate whenever radiation reaction is a small perturbation. Paul Dirac extended the equation to a Lorentz-covariant relativistic form in 1938 — the ALD equation — whose pathologies are the same. The quantum-field-theoretic treatment of electron self-interaction (QED) resolves the divergences via renormalisation, but at the classical level radiation reaction remains an open seam in the theory.`,
    relatedPhysicists: ["hendrik-antoon-lorentz", "paul-dirac"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  {
    slug: "runaway-solution",
    term: "Runaway solution",
    category: "concept",
    shortDefinition: "A solution of the Abraham-Lorentz equation in which a free charge's acceleration grows exponentially without bound, a ∝ exp(t/τ₀), without any external force or energy source. The most famous pathology of classical radiation-reaction theory.",
    description: `A runaway solution is a solution of the Abraham-Lorentz equation of motion m·a = F_ext + (μ₀q²/6πc)·ȧ in which the acceleration of a free charge grows exponentially in time, a(t) = a₀ exp(t/τ₀), with τ₀ = q²/(6πε₀mc³) ≈ 6.3×10⁻²⁴ s for an electron. In the runaway branch the charge spontaneously accelerates faster and faster forever with no external force and no external energy source — a gross violation of energy conservation.

The runaways arise from the third-order structure of the Abraham-Lorentz equation: demanding that m·a match the radiation-reaction-force jerk term at every instant admits two independent solutions, one in which a decays to match F_ext (physically reasonable) and one in which a grows exponentially (pathological). Mathematically the pathology is eliminated by imposing a boundary condition at t → +∞ that acceleration must approach zero when F_ext is switched off, which selects the non-runaway branch. Physically, this boundary-condition trick buys conservation at the price of causality: the charge begins responding to F_ext a time ∼ τ₀ *before* the force is applied — the notorious **pre-acceleration** problem. Both failure modes (runaway acceleration and pre-acceleration) persist in Paul Dirac's 1938 relativistic extension (the Abraham-Lorentz-Dirac equation). The quantum-field-theoretic treatment of electron self-interaction (QED) resolves the issue via renormalisation — infinite bare quantities compensate the self-energy divergence — but at the classical level the runaway solution remains the cleanest demonstration that classical electrodynamics does not close as a self-consistent theory of point charges. The practical resolution for almost all engineering and astrophysical purposes is to treat radiation reaction as a small perturbation (Landau-Lifshitz reduced-order form), which is well-defined and free of pathologies whenever τ₀·|ȧ|/|a| ≪ 1.`,
    relatedPhysicists: ["paul-dirac"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  {
    slug: "self-energy-divergence",
    term: "Self-energy divergence",
    category: "concept",
    shortDefinition: "The infinite electrostatic field energy U = (q²/8πε₀)·∫ dr/r² stored in the field of a point charge, diverging as 1/r at small radii. Root cause of the pathologies of classical radiation-reaction theory and the target of QED's mass-renormalisation procedure.",
    description: `The self-energy divergence is the fundamental sickness of classical electrodynamics of point charges: the electrostatic field energy U = (ε₀/2)∫|E|² d³r stored in the Coulomb field of a point charge q is infinite. The integrand diverges as 1/r² at small radii and the volume integral therefore diverges logarithmically (for a line charge) or as 1/r (for a point). For a spherical charge of radius a the stored field energy is U = q²/(8πε₀ a), which goes to infinity as a → 0.

The divergence is the root of the radiation-reaction pathologies. The classical electron radius r_e = q²/(4πε₀ mc²) ≈ 2.82×10⁻¹⁵ m is the radius at which the stored field energy equals the electron's rest energy mc²; below r_e the field energy exceeds rest energy, so the electron's total energy in classical electrodynamics is dominated by electromagnetic self-energy before radiation reaction even enters the picture. The Abraham-Lorentz derivation computes the self-force of the charged sphere on itself and takes a → 0, at which point the inertia attributed to the electromagnetic field itself diverges — mass-renormalisation absorbs this into the observable (finite) mass m, but the finite residue is the third-order jerk term that then generates the runaway solutions and pre-acceleration problem.

Quantum electrodynamics resolves the classical divergences via systematic renormalisation: the formally infinite bare mass and bare charge are defined in terms of measured (finite) values at a chosen energy scale, and every observable physical quantity comes out finite. The renormalisation programme works because QED is renormalisable as a field theory — a non-trivial property that was not established until 1948 (Tomonaga, Schwinger, Feynman, Dyson). At the classical level, though, the self-energy divergence is simply a marker that classical electrodynamics is not a self-consistent theory of point charges, and that an ultimate honest treatment must pass through either extended-particle models (obsolete) or quantum field theory (the current standard).`,
    relatedPhysicists: ["paul-dirac"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },

  // ─── Forward-reference placeholders ───────────────────────────────────

  // FORWARD-REF: Rutherford scattering — Term slug referenced in §10.5 bremsstrahlung MDX. Full treatment belongs in a quantum/nuclear branch.
  {
    slug: "rutherford-scattering",
    term: "Rutherford scattering",
    category: "phenomenon",
    shortDefinition: "The elastic Coulomb scattering of a charged particle off a fixed point charge, following the hyperbolic trajectory of inverse-square central-force motion. Differential cross-section dσ/dΩ ∝ 1/sin⁴(θ/2). Full treatment in a later branch.",
    description: `This is a placeholder entry. Rutherford scattering is the classical elastic scattering of a charged particle off a fixed target charge via the Coulomb interaction, following the hyperbolic trajectory of inverse-square central-force motion. The differential scattering cross-section worked out by Ernest Rutherford in 1911 to fit his gold-foil alpha-scattering data was dσ/dΩ = (zZe²/4E)²/sin⁴(θ/2), where z and Z are the projectile and target charges and E is the projectile kinetic energy. The sin⁻⁴(θ/2) small-angle divergence is characteristic of the long-range Coulomb potential and distinguishes it from short-ranged nuclear-force scattering.

In §10.5 bremsstrahlung, Rutherford scattering provides the classical trajectory of the electron passing through the Coulomb field of a tungsten nucleus: the sharp transverse acceleration at the hyperbola's perihelion produces the bremsstrahlung radiation pulse. The full quantitative treatment of Rutherford scattering — including the relativistic Mott and Dirac extensions, the screening of the Coulomb potential by atomic electrons at large impact parameters, and the breakdown of classical scattering when the de Broglie wavelength becomes comparable to the impact parameter — belongs to a later branch (quantum mechanics or nuclear physics).`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
    ],
  },

  // FORWARD-REF: Kramers formula — Term slug referenced in §10.5 bremsstrahlung MDX. Full treatment in an X-ray physics / quantum-mechanics branch.
  {
    slug: "kramers-formula",
    term: "Kramers formula",
    category: "concept",
    shortDefinition: "Hendrik Kramers's 1923 classical thick-target bremsstrahlung spectrum, dN/dE ∝ (E_max − E)/E, giving the continuous-continuum shape of an X-ray tube running at accelerating voltage U with E_max = eU. Full treatment in a later branch.",
    description: `This is a placeholder entry. The Kramers formula is the classical thick-target bremsstrahlung X-ray spectrum derived by the Dutch theoretician Hendrik Anthony Kramers in 1923. For an electron beam fired into a target thick enough that each electron slows to rest inside the target (radiating many photons on the way), integrating the single-scattering bremsstrahlung cross-section over the electron's energy-loss cascade gives the remarkably simple shape dN/dE ∝ (E_max − E)/E, where E is the photon energy and E_max = eU is the Duane-Hunt cutoff set by the accelerating voltage. The continuum climbs hyperbolically from near-zero energies, peaks at low E, and falls linearly to zero at E_max.

The formula is an essential workhorse of medical and industrial X-ray physics: it predicts the continuum-to-characteristic-line ratio in tube spectra, the efficiency of bremsstrahlung production as a function of tube voltage (which scales as Z·U²), and the optimal target material and filtration for a given imaging application. The quantum-mechanical refinement (the Bethe-Heitler cross-section, 1934) reproduces the Kramers shape at low energies and modifies it at relativistic tube voltages. The full treatment of the Kramers formula and its quantum corrections belongs to an X-ray physics or quantum-mechanics chapter in a later branch.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
    ],
  },

  // FORWARD-REF: Bethe-Heitler formula — Term slug referenced in §10.5 bremsstrahlung MDX. Full treatment in a quantum-electrodynamics branch.
  {
    slug: "bethe-heitler-formula",
    term: "Bethe-Heitler formula",
    category: "concept",
    shortDefinition: "The 1934 quantum-mechanical bremsstrahlung cross-section derived by Hans Bethe and Walter Heitler, extending Kramers's classical formula to relativistic electrons and thin targets. Full treatment in a later QED branch.",
    description: `This is a placeholder entry. The Bethe-Heitler formula is the quantum-mechanical differential cross-section for bremsstrahlung emission by a relativistic electron scattering in the Coulomb field of a screened nucleus, derived by Hans Bethe and Walter Heitler in 1934. It was among the first systematic applications of Paul Dirac's electron theory and the newly developed perturbative formalism for quantum electrodynamics to a specific scattering process, and it successfully reproduced the observed X-ray continuum in thin targets where Kramers's classical thick-target formula breaks down.

The formula gives the photon-energy spectrum dσ/dk ∝ Z²α r_e² · [function of (k, E_e, E_e − k, Z)] where α is the fine-structure constant, r_e is the classical electron radius, Z is the target nuclear charge, E_e is the incoming electron energy, and k is the emitted photon energy. At relativistic energies it includes a logarithmic factor from the nuclear-electric-field screening by atomic electrons, and it predicts the pair-production cross-section as a time-reversed cousin by crossing symmetry. The full quantitative derivation via Feynman diagrams and the modern radiative-correction refinements belong to a later quantum-electrodynamics branch.`,
    relatedPhysicists: ["paul-dirac"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
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
