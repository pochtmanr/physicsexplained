// Seed EM §08 EM waves in vacuum + §09 Waves in matter & optics
// 5 physicists + ~37 glossary terms (including 2 placeholder promotions + 2 forward-ref placeholders)
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-em-05.ts
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
    slug: "willebrord-snell",
    name: "Willebrord Snel van Royen",
    shortName: "Snell",
    born: "1580",
    died: "1626",
    nationality: "Dutch",
    oneLiner: "Leiden astronomer who derived the sine law of refraction in 1621 but never published; two centuries of French textbooks called it Descartes's law. Also pioneered geodetic triangulation — measured the Earth's radius across Holland from a chain of 33 triangles.",
    bio: `Willebrord Snel van Royen was born in Leiden in 1580, the son of a mathematics professor at Leiden University. He learned his mathematics under Ludolph van Ceulen, the most exacting geometer of the late sixteenth century in the Netherlands, and in 1603 — at twenty-three — took over his father's chair when his father retired. His central work was a systematic experimental study of refraction. In 1621 he derived what is now called Snell's law: for light passing between two media, the ratio of the sines of the angles of incidence and refraction is a constant, equal to the ratio of the refractive indices. He established this by careful angle-measurement across glass, water, and air with pins and a geometrical setup, and wrote it into his private notebooks. He never published it. The derivation sat unread on his shelves.

In 1637 Descartes's *Dioptrique* appeared, containing an independent derivation of the same sine law, and France adopted the name "Descartes's law" for the next two centuries. Huygens, decades later, combing Snell's surviving manuscripts, rediscovered the 1621 work and lobbied successfully for the name *Snell's law* in English and Dutch usage — so the same equation carries two different names depending on which language textbook you open. The historical asymmetry is a recurring theme in physics credit: the person who derives a result and publishes beats the person who derives it first and files the notebook away. Beyond the sine law itself, Snell's work on optics included the first clear separation of the concept of refractive index as a material constant, independent of the angle of incidence — a step toward the modern wave theory that would not be completed until Fresnel.

His second enduring contribution was geodetic. In 1615 he set out to measure the Earth's radius by triangulation, surveying a known baseline between Alkmaar and Bergen op Zoom and extending it through a chain of 33 interconnected triangles across the low, flat country of Holland where long sightlines were possible. He computed an Earth's circumference of about 38,653 km — within 3.5% of the modern 40,075 km value. This triangulation method, published in *Eratosthenes Batavus* (1617), became the standard geodetic technique for the next three centuries: every national survey of France, Britain, India, and the United States through the 1800s followed Snell's template. He died in Leiden in 1626 at forty-six, probably of fever. Two of his sons were also named Willebrord — the custom of the time — and scientific citations often conflate the three. His tomb at Pieterskerk is unmarked. A lunar crater bears his name; the law that does is perhaps as close as physics gets to a memorial.`,
    contributions: [
      "Derived Snell's law of refraction (1621): sin θ₁ / sin θ₂ = n₂ / n₁, the foundational relation of geometrical optics",
      "Established refractive index as a material constant independent of angle of incidence",
      "Measured the Earth's radius by geodetic triangulation (1615) across 33 triangles in Holland, within 3.5% of the modern value",
      "Introduced the triangulation-survey method that became the standard geodetic technique for the next three centuries",
      "Held the chair of mathematics at Leiden University from 1603 until his death; his unpublished Snell's-law notebook let Descartes claim priority in France",
    ],
    majorWorks: [
      "Eratosthenes Batavus (1617) — the triangulation-survey treatise that measured the Earth's radius",
      "Doctrinae triangulorum canonicae libri quatuor (1627) — trigonometry textbook published posthumously",
      "Cyclometricus (1621) — on squaring the circle",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
      { branchSlug: "electromagnetism", topicSlug: "total-internal-reflection" },
      { branchSlug: "electromagnetism", topicSlug: "geometric-optics" },
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
    ],
  },
  {
    slug: "augustin-fresnel",
    name: "Augustin-Jean Fresnel",
    shortName: "Fresnel",
    born: "1788",
    died: "1827",
    nationality: "French",
    oneLiner: "French civil engineer who argued wave theory to victory against Laplace's Newton faction at the French Academy, derived the Fresnel equations (1821–23), and designed the lighthouse lens. Died of tuberculosis at 39.",
    bio: `Augustin-Jean Fresnel was born in Broglie, in Normandy, in 1788 — the year before the French Revolution. He was a slow speaker as a child, barely literate until the age of eight, and was orphaned young. He trained at the École Polytechnique and then the Ponts et Chaussées as a civil engineer, working on road and bridge projects across rural France for most of his twenties. The pivot came in 1815: after Napoleon's return during the Hundred Days, Fresnel — who had sided with the monarchy — was dismissed from his engineering post when the Bourbon restoration failed to protect its own supporters. Unemployed in the countryside, with nothing to do, he started doing serious optics. His earliest papers presented a mathematical wave theory of light, directly confronting the Laplacean particle-faction consensus at the French Academy. Arago read the papers, recognised their importance, and the two became lifelong collaborators — Arago protecting Fresnel politically while Fresnel produced the mathematics.

The decisive moment came in 1818. The Academy had posed a prize competition on the theory of diffraction, expecting the particle faction to win. Fresnel submitted a wave-theory derivation — the Fresnel integrals for diffraction of a wave around an obstacle. Poisson, sitting on the committee and hostile to waves, worked out a consequence: if Fresnel's theory was right, a circular obstacle should cast a shadow with a *bright spot* at its exact centre, where all the diffracted wavelets arrived in phase. This was "obviously absurd," Poisson argued, and therefore the wave theory was wrong. Arago performed the experiment: the spot was there. It is now called the Poisson spot — a name applied ironically to someone who never wanted to be associated with it. Wave theory won. Over 1821–1823 Fresnel extended his analysis to derive the amplitude coefficients for reflection and transmission at dielectric interfaces — the four *Fresnel equations* that every optical engineer now uses to design anti-reflective coatings, polarising beam splitters, and laser-cavity Brewster windows.

His other enduring contribution was the Fresnel lens: a design using concentric prism rings that replaced the massive, optically flawed solid lens of earlier lighthouses with a thin, flat, composite optic. The first first-order Fresnel lens was installed at the Cordouan lighthouse in 1822; its beam was visible 32 km out to sea, a range that no prior lighthouse had achieved. Every major lighthouse in the world for the next century used a Fresnel lens; modern solar concentrators and camera flashes still do. He died of tuberculosis in 1827 at thirty-nine. The Royal Society's Copley Medal — which he had been awarded for the wave-theory work — arrived from London a few weeks before his death. Arago delivered the eulogy.`,
    contributions: [
      "Derived the Fresnel equations (1821–23) for reflection and transmission amplitudes at a dielectric interface, foundational for all thin-film optics",
      "Designed the Fresnel lens (1822), first used at the Cordouan lighthouse; every major lighthouse for a century used his design",
      "Established the wave theory of light against the Laplacean particle faction by the 1818 Academy diffraction prize, confirmed by the Poisson spot experiment",
      "Developed the Fresnel diffraction integrals for wave propagation past edges and apertures",
      "Recognised that light is a transverse wave (not longitudinal as most wave theorists had assumed), explaining polarisation via the vector orientation of the wave",
    ],
    majorWorks: [
      "Mémoire sur la diffraction de la lumière (1819) — the Academy-prize-winning wave-theory diffraction paper",
      "Théorie de la lumière (1821–23) — the Fresnel equations",
      "Sur la polarisation de la lumière (1822) — polarisation explained as a transverse-wave phenomenon",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
      { branchSlug: "electromagnetism", topicSlug: "interference" },
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
      { branchSlug: "electromagnetism", topicSlug: "total-internal-reflection" },
    ],
  },
  {
    slug: "david-brewster",
    name: "David Brewster",
    shortName: "Brewster",
    born: "1781",
    died: "1868",
    nationality: "Scottish",
    oneLiner: "Scottish physicist who discovered Brewster's angle (1815) by measurement across dozens of materials. Invented the kaleidoscope (lost the patent to London hawkers within months). Founded the BAAS; twice president of the Royal Society of Edinburgh.",
    bio: `David Brewster was born in Jedburgh in 1781, the son of a schoolmaster. He was educated at the University of Edinburgh and licensed as a Church of Scotland minister — the expected path for a bookish Scottish boy of his generation — but he never held a parish. A severe stage-fright in front of a congregation cured him of the ambition before his first sermon. He turned to optical research, where the only audience was the experimental apparatus on his bench. Between 1812 and 1815 he ran a systematic programme of reflection measurements: light of various polarisations striking glass, water, diamond, mica, and two dozen other materials at varying angles, measuring how much reflected. In 1815 he published what is now called Brewster's law — at the angle θ_B = arctan(n₂/n₁), the reflected ray is purely s-polarised (perpendicular to the plane of incidence), because the p-polarised reflection coefficient passes through zero. This is the principle behind polarising sunglasses for killing road glare, the Brewster-angle microscope for studying monolayers on water, and the Brewster windows in gas-laser cavities.

In 1816 he invented the kaleidoscope. The optical principle — two or three mirrors at shallow angles producing multiply-reflected symmetric patterns — was elementary, but the product was irresistible. He patented it in 1817. Within months of the patent's issue, London optical hawkers had reverse-engineered the device and were selling thousands of unauthorised copies on street corners; the patent proved legally unenforceable because the prior art was too thin and too widely distributed. Brewster spent years chasing infringement cases and lost most of the manufacturing rights. His notebooks show he estimated he would have been wealthy had the patent held. It did not. He later co-invented the lenticular stereoscope (the binocular-like viewing device that sold in the hundreds of thousands in the 1850s–60s photography craze) and improved the polarimeter for chemical analysis.

His institutional legacy is as large as his experimental one. He edited the *Edinburgh Encyclopaedia* for its full 18-volume run between 1808 and 1830. He co-founded the British Association for the Advancement of Science (BAAS) in 1831 — the first large-audience science organisation in the world; its annual regional meetings established the modern template for scientific congresses that every discipline still follows. He was twice president of the Royal Society of Edinburgh. Knighted 1832. Late in life he became fascinated by photography, corresponded with Daguerre and Talbot, and wrote popular science books — *Letters on Natural Magic* was a best-seller explaining stage magic and optical illusions to the Victorian reading public. He died in 1868 at eighty-six, having outlived most of his correspondents.`,
    contributions: [
      "Discovered Brewster's law (1815): at θ_B = arctan(n₂/n₁) the reflected ray is purely s-polarised",
      "Invented the kaleidoscope (1816, patented 1817) and lost the patent to street hawkers within months",
      "Co-invented the lenticular stereoscope, the first widely commercialised binocular viewing device",
      "Co-founded the British Association for the Advancement of Science (1831), the template for modern scientific congresses",
      "Edited the 18-volume Edinburgh Encyclopaedia (1808–1830) and served twice as president of the Royal Society of Edinburgh",
    ],
    majorWorks: [
      "Treatise on New Philosophical Instruments (1813) — Brewster's early compendium of optical apparatus design",
      "The Kaleidoscope (1819) — the monograph on his best-known invention",
      "Letters on Natural Magic (1832) — popular optics and illusions, a Victorian best-seller",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
    ],
  },
  {
    slug: "joseph-fraunhofer",
    name: "Joseph von Fraunhofer",
    shortName: "Fraunhofer",
    born: "1787",
    died: "1826",
    nationality: "Bavarian",
    oneLiner: "Bavarian glassmaker orphaned at 11 and apprenticed under brutal conditions; survived his workshop's 1801 roof collapse. Invented the diffraction grating and catalogued 574 dark lines in the solar spectrum — the Fraunhofer lines.",
    bio: `Joseph Fraunhofer was born in Straubing, Bavaria, in 1787, the eleventh child of a glazier. Both parents died by the time he was eleven, and he was apprenticed to a Munich master glassmaker under conditions close to servitude — long hours, no education, no freedom to leave. In 1801 the workshop's tenement roof collapsed on him, burying him alive in the rubble. The Bavarian Elector Maximilian IV Joseph personally arrived at the rescue site — it had become a public spectacle — and supervised the dig-out. Fraunhofer was pulled out alive. The publicity event changed his life: the Elector gave him books, an eight-hundred-gulden scholarship, and access to formal mathematical training. Within a decade he was the lead optician at the secular Optical Institute of Benediktbeuern (the former monastery that had been turned into a glassworks after the 1803 secularisation), and the best glass-figuring craftsman in Europe.

His 1814 contribution was the diffraction grating. He built it first from a fine array of parallel metal wires under tension, then by ruling glass with a diamond-tipped ruling engine he designed himself — a machine that could cut parallel lines 0.01 mm apart across several centimetres of optical-flat glass. The grating let him measure wavelength directly from the angular spread of diffracted light instead of inferring it from prism refraction, improving resolving power by about an order of magnitude. Applied to sunlight, it revealed a forest of dark absorption lines crossing the solar spectrum. Fraunhofer catalogued 574 of them, assigning the prominent ones alphabetic labels A (in the far red) through K (near the violet). Astronomers still cite the A, B, C (Hα), D (sodium), E (iron), F (Hβ), G, and H (calcium) Fraunhofer lines by those same letters — his labelling is two centuries old and still in use.

The physical *meaning* of the dark lines was unknown to Fraunhofer. He saw they were reproducible and sharp, used them as wavelength standards (he defined "the yellow D-line wavelength" as a laboratory calibration unit), but had no chemistry to identify what caused them. The identification came decades later: Kirchhoff and Bunsen's 1859 spectroscope work showed that each chemical element emits and absorbs a unique pattern of lines, and Kirchhoff matched the Fraunhofer lines to laboratory spectra to identify sodium, iron, calcium, nickel, and dozens of other elements in the Sun's atmosphere. The Sun could be chemically analysed from Earth. That 1860 moment opened the modern science of astrophysics. Fraunhofer did not live to see it. He died of tuberculosis in 1826 at thirty-nine — the same age as Fresnel, in the same decade, on separate sides of the Rhine. He had been ennobled (the "von") shortly before his death.`,
    contributions: [
      "Invented the diffraction-grating spectroscope (1814), first from wires, then ruled on glass with his own diamond-tipped engine",
      "Catalogued 574 dark absorption lines in the solar spectrum and labelled them A–K — the Fraunhofer lines, still referenced by his letters",
      "Built the best achromatic telescope objectives of his era, equipping the main observatories of Europe",
      "Defined the yellow D-line as a wavelength standard, the first reproducible spectroscopic calibration reference",
      "Designed a diamond ruling engine capable of cutting 0.01 mm-spaced parallel lines on optical-flat glass",
    ],
    majorWorks: [
      "Bestimmung des Brechungs- und Farbenzerstreuungs-Vermögens verschiedener Glasarten (1814) — the paper introducing the dark solar lines",
      "Kurzer Bericht von den Resultaten neuerer Versuche über die Gesetze des Lichtes (1821) — on the diffraction grating",
      "Neue Modification des Lichtes durch gegenseitige Einwirkung und Beugung der Strahlen (1823) — further diffraction studies",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
      { branchSlug: "electromagnetism", topicSlug: "interference" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },
  {
    slug: "hippolyte-fizeau",
    name: "Armand-Hippolyte-Louis Fizeau",
    shortName: "Fizeau",
    born: "1819",
    died: "1896",
    nationality: "French",
    oneLiner: "French physicist who switched from medicine to optics after a stutter ended his clinical ambitions. In 1849 made the first terrestrial measurement of the speed of light — a rotating toothed wheel on the Paris-to-Montmartre road.",
    bio: `Armand-Hippolyte-Louis Fizeau was born in Paris in 1819 into a wealthy medical family. He began his studies intending to follow his father into medicine, but a severe stutter closed off any bedside clinical career — nineteenth-century medical practice demanded a confident verbal rapport with patients, and Fizeau could not produce it. He switched to physics at the École Polytechnique, where François Arago — Fresnel's former collaborator, then director of the Paris Observatory — became his mentor. His earliest work was photographic: with Léon Foucault, he made the first daguerreotype photograph of the Sun's surface (1845) and the first clear image of the Moon through a telescope — landmarks of early astrophotography.

His defining experiment came in 1849. Fizeau set up a rotating toothed wheel — 720 teeth around its rim — at his father's house in Suresnes on a hill outside Paris, and a mirror at Montmartre 8.63 km away. A light source behind the wheel was positioned so that light passed through a gap between two teeth, travelled the 8.63 km to the mirror, reflected, and returned through the wheel. By tuning the wheel's rotation speed, Fizeau could arrange for the returning light to pass through the *next* gap (wheel had rotated exactly one tooth-space during the round-trip — light path clear) or be blocked by the next tooth (wheel had rotated half a tooth-space — light path occluded). The transitions between transmission and extinction gave him a direct timing of the 17.26 km round-trip. The result: c ≈ 3.15 × 10⁸ m/s — the first terrestrial measurement of the speed of light, about 5% high of the modern 2.998 × 10⁸. Every previous c-measurement (Rømer 1676, Bradley 1729) had depended on astronomical observation of Jupiter's moons or stellar aberration. Fizeau had brought the measurement indoors.

Foucault followed in 1850 with a rotating-mirror method that improved the accuracy, and their rivalry became legend in Parisian physics — at one point the Academy invited both to present their methods in parallel sessions. Fizeau's other major contributions: he proposed the Doppler effect for light independently in 1848, five years after Doppler's acoustic derivation, so the effect is sometimes called the Doppler–Fizeau effect in French usage; he measured the partial drag of flowing water on the speed of light passing through it (1851), a result that became critical decades later as evidence against the luminiferous ether and in favour of special relativity; and he made early contributions to stellar interferometry that Michelson would fully develop. He received the Copley Medal in 1866. He died in Venteuil in 1896 at seventy-seven, long since the grand old man of French experimental physics.`,
    contributions: [
      "Made the first terrestrial measurement of the speed of light (1849) using a rotating toothed wheel over an 8.63 km path, obtaining c ≈ 3.15 × 10⁸ m/s",
      "Independently proposed the Doppler effect for light (1848), often called the Doppler–Fizeau effect in French literature",
      "Measured the partial drag of flowing water on light (1851), later important as evidence against the stationary ether",
      "Made the first daguerreotype photograph of the Sun's surface with Foucault (1845), founding solar photography",
      "Early contributions to stellar interferometry anticipating Michelson's later work",
    ],
    majorWorks: [
      "Sur une expérience relative à la vitesse de propagation de la lumière (1849) — the toothed-wheel c measurement",
      "Des effets du mouvement sur le ton des vibrations (1848) — the Doppler–Fizeau effect for light",
      "Sur les hypothèses relatives à l'éther lumineux (1851) — the moving-water light-drag experiment",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // ─── §08.1 EM wave equation ──────────────────────────────────────────
  {
    slug: "em-wave-equation-term",
    term: "Electromagnetic wave equation",
    category: "concept",
    shortDefinition: "The second-order PDE ∇²E = (1/c²)∂²E/∂t² (and identically for B), derived from Maxwell's equations in source-free vacuum. Its plane-wave solutions propagate at c = 1/√(μ₀ε₀).",
    description: `The electromagnetic wave equation is what falls out of Maxwell's equations in source-free vacuum (ρ = 0, J = 0) when you take the curl of Faraday's law, substitute Ampère–Maxwell to eliminate ∂B/∂t, and use the vector identity ∇×(∇×E) = ∇(∇·E) − ∇²E together with ∇·E = 0. The result is ∇²E = μ₀ε₀ ∂²E/∂t², identically for B, which is the classical wave equation with propagation speed c = 1/√(μ₀ε₀) ≈ 2.998 × 10⁸ m/s. The same equation holds component-by-component for each Cartesian component of E and B.

This derivation is Maxwell's 1865 triumph. The constants μ₀ and ε₀ were known from laboratory measurements of electrostatics and magnetostatics. Plugging in the measured values gave Maxwell a predicted wave speed that matched Fizeau's 1849 optical measurement of the speed of light to within experimental error. The identification was immediate: light is an electromagnetic wave. Every subsequent electromagnetic wave phenomenon — radio, microwaves, X-rays, gamma rays — is a solution of this same equation at a different frequency. In media with refractive index n, the wave equation is modified to give propagation speed v = c/n; in conductors, a dissipative term ∝ σ ∂E/∂t is added, producing exponential decay with skin depth δ.`,
    relatedPhysicists: ["james-clerk-maxwell", "oliver-heaviside"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
    ],
  },
  {
    slug: "transverse-wave-em",
    term: "Transverse electromagnetic wave",
    category: "concept",
    shortDefinition: "An EM plane wave in which both E and B oscillate perpendicular to the propagation direction k, and perpendicular to each other. The Gauss-law constraints ∇·E = 0 and ∇·B = 0 force the transverse structure in vacuum.",
    description: `An electromagnetic wave in vacuum is transverse: both the electric field E and the magnetic field B oscillate in directions perpendicular to the direction of propagation k. Further, E and B are perpendicular to each other, and the triad (E, B, k) forms a right-handed coordinate system with |B| = |E|/c. This structure is forced by Maxwell's equations: ∇·E = 0 in source-free vacuum rules out any longitudinal component of E along k, and the curl equations tie E and B together in the perpendicular orthogonality.

The transverse structure is what allows polarisation to be a meaningful concept. Because E has two independent degrees of freedom perpendicular to k (rather than a single longitudinal direction), a wave can be linearly polarised along one axis, linearly polarised along the orthogonal axis, or a phased superposition (circular, elliptical). Longitudinal waves — like sound in a gas — have no polarisation, because there is only one direction available for oscillation. Fresnel's 1822 realisation that light must be a transverse wave was the key to explaining polarisation phenomena, which had baffled earlier wave theorists who assumed light oscillated along k like sound.`,
    relatedPhysicists: ["james-clerk-maxwell", "augustin-fresnel"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
    ],
  },
  {
    slug: "speed-of-light",
    term: "Speed of light (c)",
    category: "concept",
    shortDefinition: "c = 1/√(μ₀ε₀) = 2.99792458 × 10⁸ m/s exactly, by SI definition since 1983. The invariant propagation speed of electromagnetic waves in vacuum and the universal speed limit of special relativity.",
    description: `The speed of light c = 2.99792458 × 10⁸ m/s is the propagation speed of electromagnetic waves in vacuum, derived from Maxwell's equations as c = 1/√(μ₀ε₀). Since the 1983 redefinition of the metre, c is not measured — it is *defined* to be exactly 299,792,458 m/s, and the metre is defined as the distance light travels in 1/c seconds. The first terrestrial measurement was Fizeau's 1849 toothed-wheel experiment (≈ 3.15 × 10⁸ m/s, 5% high); Foucault's rotating-mirror method in 1862 reached 0.3% accuracy; Michelson's late-nineteenth-century work pushed to 0.001%. All subsequent refinements confirmed Maxwell's value.

The significance of c extends far beyond electromagnetism. In special relativity (Einstein 1905), c is the invariant speed: every inertial observer measures the same c for light propagation, regardless of their motion. This frame-independence forces the Lorentz transformations, time dilation, length contraction, and mass–energy equivalence E = mc². c also appears in general relativity as the maximum signal-propagation speed — nothing carrying information travels faster. In media, the *phase* velocity of light can exceed c (this is why the refractive index n can be less than 1 near absorption resonances) and the *group* velocity can too under certain conditions, but the *signal* velocity — the speed at which a genuine information-carrying front propagates — is always ≤ c.`,
    relatedPhysicists: ["james-clerk-maxwell", "hippolyte-fizeau"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
    ],
  },

  // ─── §08.2 Plane waves & polarization ────────────────────────────────
  {
    slug: "plane-wave-term",
    term: "Plane wave",
    category: "concept",
    shortDefinition: "An EM wave whose phase is constant on planes perpendicular to the propagation direction k. Written E(r,t) = E₀ cos(k·r − ωt + φ), with ω = c|k| in vacuum. The simplest solution of the wave equation.",
    description: `A plane wave is a solution of the electromagnetic wave equation in which the phase is constant on planes perpendicular to the propagation direction. The canonical form is E(r,t) = E₀ cos(k·r − ωt + φ), where k is the wavevector (|k| = 2π/λ, pointing along the propagation direction), ω is the angular frequency (ω = c|k| in vacuum), and E₀ is a constant vector perpendicular to k specifying amplitude and polarisation.

Plane waves are idealisations — a true plane wave has infinite transverse extent and infinite duration — but they are the natural basis for building all other solutions. Any real wave (a laser pulse, a radio broadcast, sunlight through a window) can be decomposed into a Fourier superposition of plane waves via ∫ dk Ẽ(k) e^{i(k·r − ωt)}. This decomposition underlies the entire theory of wave propagation in linear media: each Fourier component propagates independently with its own dispersion relation ω(k), and the output field is the reassembled superposition. Plane-wave analysis is why we can reason about refraction, diffraction, and interference using the trigonometry of a single k-vector: each component handles itself.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
    ],
  },
  {
    slug: "linear-polarization",
    term: "Linear polarization",
    category: "concept",
    shortDefinition: "An EM wave in which E oscillates along a single fixed line perpendicular to k. Equivalent to a superposition of two circularly polarised waves of equal amplitude with opposite handedness.",
    description: `A linearly polarised electromagnetic wave has its electric field oscillating along a single fixed line perpendicular to the propagation direction k. In complex notation, E(r,t) = Re[ê E₀ e^{i(k·r − ωt)}] with ê a real unit vector perpendicular to k — the polarisation direction. The field goes from +E₀ê to −E₀ê and back each period, with the magnetic field locked at 90° in the perpendicular direction.

Most light sources produce unpolarised light (a rapid random mixture of all polarisation directions), but linear polarisers — sheets of dichroic material like Polaroid film, wire-grid polarisers at long wavelengths, or crystal polarisers for precision work — select a single direction. Once linearly polarised, light obeys Malus's law on passing through a second polariser: I = I₀ cos²θ, where θ is the angle between the two polariser axes. Linear polarisation also emerges naturally from Brewster-angle reflection (the reflected wave is purely s-polarised at θ_B) and from dipole antennas (the emitted wave is linearly polarised along the antenna axis). Equivalently, linear polarisation is a coherent superposition of left- and right-circular polarisations of equal amplitude.`,
    relatedPhysicists: ["augustin-fresnel", "david-brewster"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "circular-polarization",
    term: "Circular polarization",
    category: "concept",
    shortDefinition: "An EM wave whose E-vector rotates in a circle at frequency ω as the wave propagates, tracing a helix in space. Left- and right-handed variants are the two independent polarisation states.",
    description: `A circularly polarised electromagnetic wave has its electric field vector rotating in a circle at the angular frequency ω as the wave propagates, without changing magnitude. In a fixed plane perpendicular to k, the tip of E traces a circle once per period. In the frame of the wave, the field pattern is a helix — right-handed for right-circular (RCP) polarisation, left-handed for left-circular (LCP).

Mathematically, circular polarisation is a coherent superposition of two linear polarisations oscillating 90° out of phase with equal amplitude: E = E₀(ê₁ cos(ωt − kz) ± ê₂ sin(ωt − kz)) for RCP/LCP. Each circular polarisation carries definite angular momentum ±ħ per photon along the propagation axis, so transferring circularly polarised light to matter exerts a torque — the basis of optical-manipulation experiments with suspended absorbing particles. Circular polarisation is produced by passing linearly polarised light through a quarter-wave plate, by reflection off certain chiral media, and naturally by cyclotron radiation from relativistic electrons spiralling in magnetic fields. Radio engineers use circular polarisation for satellite communication because it is insensitive to the relative orientation between transmitting and receiving antennas.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "elliptical-polarization",
    term: "Elliptical polarization",
    category: "concept",
    shortDefinition: "The general polarisation state of a single-frequency EM wave: the E-vector traces an ellipse per cycle. Linear and circular polarisations are the two degenerate limits.",
    description: `Elliptical polarisation is the generic polarisation state of a monochromatic transverse wave. The electric field vector traces an ellipse in the plane perpendicular to k as the wave oscillates, with the ellipse characterised by its semi-major axis, semi-minor axis, orientation angle, and handedness (left or right). Linear polarisation is the degenerate case where the ellipse collapses to a line (semi-minor = 0); circular polarisation is the degenerate case where the ellipse is a circle (semi-major = semi-minor).

Any coherent superposition of two linear polarisations with a relative phase difference produces elliptical polarisation — zero phase difference gives linear polarisation at an intermediate angle, ±90° with equal amplitudes gives circular, anything else gives an ellipse. The Poincaré sphere provides the standard geometric representation: each point on a unit sphere corresponds to a polarisation state, with poles at RCP/LCP, equator at all linear polarisations, and interior points at elliptical states. Optical components like quarter-wave plates and half-wave plates rotate points on the Poincaré sphere in well-defined ways, which is the basis for every polarisation-analysis instrument from laboratory ellipsometers to satellite polarimetric imagers.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "polarization-axis",
    term: "Polarization axis",
    category: "concept",
    shortDefinition: "For a linearly polarised wave, the direction along which E oscillates. For a polariser, the transmission axis along which the incident E-component is passed. Set by the vector structure of the wave, not its scalar amplitude.",
    description: `The polarisation axis is the direction in the plane perpendicular to k along which the electric field oscillates for a linearly polarised wave. It is a vector — specifically, a unit vector ê — defining one of the two independent degrees of freedom for a transverse wave. For a polariser (Polaroid sheet, wire grid, crystal) the polarisation axis (often called the transmission axis) is the direction along which the incident E-component is passed through; the perpendicular component is absorbed or reflected.

When linearly polarised light encounters a polariser, the transmitted intensity follows Malus's law: I = I₀ cos²θ, where θ is the angle between the incident polarisation axis and the polariser's transmission axis. When unpolarised light passes through a polariser, half the intensity is lost (averaged over all input polarisations), and the output is linearly polarised along the transmission axis. Rotating a polariser and observing the transmitted intensity of an incoming beam — the classical ellipsometry test — directly reveals the polarisation state of the beam. The polarisation-axis concept generalises in elliptical polarisation to the orientation of the semi-major axis of the polarisation ellipse.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },

  // ─── §08.4 EM spectrum ───────────────────────────────────────────────
  {
    slug: "em-spectrum",
    term: "Electromagnetic spectrum",
    category: "concept",
    shortDefinition: "The full range of frequencies (or equivalently wavelengths) of EM radiation, from kilohertz radio to zettahertz gamma rays. All regions are the same physical phenomenon — classical EM waves — differing only in ω.",
    description: `The electromagnetic spectrum is the full range of frequencies at which electromagnetic waves can propagate. Conventional labels divide it into regions: radio (below ~300 GHz), microwaves (300 MHz – 300 GHz), infrared (~300 GHz – 430 THz), visible (430 – 750 THz, wavelengths 400–700 nm), ultraviolet (750 THz – 30 PHz), X-ray (30 PHz – 30 EHz), and gamma rays (above ~30 EHz). All regions are the same physical phenomenon — solutions of the same Maxwell wave equation, propagating at c in vacuum — differing only in wavelength λ = c/f.

The boundaries are historical and practical, not physical: the visible window (400–700 nm) is the range transmitted cleanly through Earth's atmosphere and to which evolution tuned vertebrate eyes; radio frequencies are low enough that classical antennas work; gamma rays are produced by nuclear transitions. Each region has distinctive technology: vacuum tubes and solid-state amplifiers for radio, magnetrons and klystrons for microwaves, thermal sources and semiconductor emitters for infrared, arc lamps and lasers for visible, synchrotrons and plasma discharges for UV–X-ray, and radioactive nuclei and cosmic sources for gamma. The unification via Maxwell's equations in 1865 (confirmed experimentally by Hertz's radio-wave detection in 1887) is one of the great syntheses of physics: radio and visible light had appeared to be completely different phenomena until the theory showed them to be the same wave at different frequencies.`,
    relatedPhysicists: ["james-clerk-maxwell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
    ],
  },
  {
    slug: "wavelength-em",
    term: "Wavelength (EM)",
    category: "concept",
    shortDefinition: "The spatial period λ of an EM plane wave, the distance between successive points of equal phase. Related to frequency by λ = c/f in vacuum, λ = c/(nf) in a medium. Ranges from kilometres (longwave radio) to femtometres (gamma).",
    description: `The wavelength λ of an electromagnetic wave is the spatial period of the sinusoidal oscillation — the distance between two successive points of equal phase along the propagation direction. In vacuum, λ = c/f, where f is the frequency in hertz and c = 2.998 × 10⁸ m/s. In a medium with refractive index n, the frequency is unchanged but the wavelength is reduced: λ_medium = λ_vacuum/n. Visible wavelengths span roughly 400 nm (violet) to 700 nm (red); radio wavelengths from metres (FM) to tens of kilometres (submarine VLF); X-rays at tens of picometres; gamma rays below a femtometre.

Wavelength controls which physical effects dominate at a given frequency. When the wavelength is much smaller than the obstacle or aperture under consideration, geometric-optics approximations (ray tracing, shadows with sharp edges) work well; when the wavelength is comparable to or larger than the obstacle, diffraction and interference dominate. This is why visible light casts sharp shadows past a door (λ ≈ 500 nm ≪ 1 m) but long-wave radio (λ ≈ 1 km) bends easily around buildings. Wavelength also sets antenna size: efficient radiation requires antenna dimensions on the order of λ/2 or λ/4, which is why AM radio antennas are tens of metres tall while Wi-Fi antennas are a few centimetres.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
    ],
  },
  {
    slug: "wavenumber",
    term: "Wavenumber",
    category: "concept",
    shortDefinition: "k = 2π/λ, the spatial angular frequency of a wave, measured in rad/m. The wavevector k has magnitude k and direction along propagation. In spectroscopy, wavenumber often means k̃ = 1/λ in cm⁻¹.",
    description: `The wavenumber k = 2π/λ is the spatial analogue of angular frequency ω = 2πf. It measures how many radians of phase the wave accumulates per unit distance along the propagation direction, with units of rad/m. The wavevector **k** is the vector generalisation: its magnitude is the wavenumber, and its direction is the direction of propagation. The phase of a plane wave at position r and time t is written k·r − ωt, making the wavevector a natural Fourier-space variable.

The dispersion relation ω(k) specifies how wavenumber relates to frequency in a given medium: in vacuum, ω = ck (linear, non-dispersive); in a refractive medium, ω = ck/n(ω) (dispersive, since n depends on ω); in a plasma above the cutoff, ω² = c²k² + ω_p². Group velocity v_g = dω/dk and phase velocity v_p = ω/k diverge in dispersive media, which is the origin of pulse spreading in optical fibres and of coloured fringes in prism spectrometers. A separate convention in vibrational spectroscopy uses "wavenumber" to mean k̃ = 1/λ in cm⁻¹ (without the 2π), which is why infrared absorption peaks are usually quoted in units like "1730 cm⁻¹" for a carbonyl stretch — that is the reciprocal wavelength, not the angular wavenumber.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
    ],
  },

  // ─── §09.1 Refractive index (refractive-index exists, only group-velocity-em) ───
  {
    slug: "group-velocity-em",
    term: "Group velocity (EM)",
    category: "concept",
    shortDefinition: "v_g = dω/dk. The speed at which a wave packet's envelope — and therefore its energy and information content — propagates. In a dispersive medium v_g differs from the phase velocity v_p = ω/k.",
    description: `The group velocity v_g = dω/dk is the speed at which a narrow wave packet's envelope propagates through a dispersive medium. It differs from the phase velocity v_p = ω/k, which is the speed at which individual wavefronts move; in a non-dispersive medium (vacuum, or a medium where n is frequency-independent) the two are equal, but in general they are not. Group velocity carries the physical content of a pulse — its energy, its information, its ability to trigger a detector — while phase velocity is a mathematical property of the wave's phase surfaces.

In an optical material with refractive index n(ω), the group velocity is v_g = c/n_g where the group index n_g = n + ω(dn/dω). In regions of *normal dispersion* (dn/dω > 0, typical in the visible for transparent glasses) the group velocity is less than the phase velocity; in regions of *anomalous dispersion* near absorption resonances, dn/dω < 0 and v_g can even exceed c or become negative, without violating relativity because the signal velocity (the speed of the leading edge of an information-carrying pulse) remains ≤ c. Group velocity dispersion (GVD) — the variation of v_g with frequency — is what spreads short optical pulses as they travel through fibres; compensating for GVD with chirped mirrors or prism pairs is a core technique in femtosecond laser technology.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "index-of-refraction" },
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },

  // ─── §09.2 Skin depth ────────────────────────────────────────────────
  {
    slug: "skin-depth",
    term: "Skin depth",
    category: "concept",
    shortDefinition: "δ = √(2/(μσω)), the 1/e penetration depth of an EM wave into a conductor. Fields decay exponentially with depth, so high-frequency currents flow only in a thin surface layer — the skin effect.",
    description: `The skin depth δ = √(2/(μσω)) is the characteristic 1/e decay length for electromagnetic field penetration into a good conductor at angular frequency ω, where μ is the permeability and σ the conductivity. Inside the metal, the plane-wave solution of the modified Maxwell equations (with the conductivity term σE included) gives E(z) = E₀ e^{−z/δ} e^{i(z/δ − ωt)} — a wave that attenuates exponentially and rotates in phase over the same length scale δ. Typical copper skin depths: 9 mm at 50 Hz (power grid); 66 μm at 1 MHz (AM radio); 2 μm at 1 GHz (microwave); 660 nm at 100 GHz.

The practical consequence is the *skin effect*: high-frequency currents flow only in a thin surface layer of a conductor, not through the bulk. This raises the effective AC resistance of a wire above its DC resistance — a 1 cm copper wire at 1 MHz has the same AC resistance as a 66-μm-thick hollow tube of the same outer diameter. Radio transmitters therefore use hollow pipe or Litz wire (many fine strands individually insulated) to reduce losses. The skin effect is also why microwave ovens can be built out of thin sheet metal (the fields never penetrate more than microns into the cavity walls) and why superconducting RF cavities for particle accelerators need only a micron of superconductor bonded to a copper support structure.`,
    relatedPhysicists: ["oliver-heaviside"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "skin-depth-in-conductors" },
    ],
  },

  // ─── §09.3 Fresnel — s-pol / p-pol (+ fresnel-equations as promotion below) ─
  {
    slug: "s-polarization",
    term: "s-polarization",
    category: "concept",
    shortDefinition: "An EM wave incident on an interface with its electric field perpendicular to the plane of incidence (German senkrecht, \"perpendicular\"). Also called TE (transverse electric) polarisation. Reflection coefficient never vanishes except at grazing.",
    description: `s-polarisation (from German *senkrecht*, "perpendicular") refers to an electromagnetic wave striking an interface with its electric field vector perpendicular to the plane of incidence — the plane containing the incoming k-vector and the surface normal. In waveguide and antenna literature the same state is called TE (transverse electric) polarisation because E is entirely transverse to the plane of incidence.

For an s-polarised wave hitting a dielectric interface, the Fresnel reflection coefficient r_s = (n₁cosθ₁ − n₂cosθ₂)/(n₁cosθ₁ + n₂cosθ₂) is always negative (assuming n₂ > n₁) and never crosses zero — s-polarised light always partially reflects at an interface, with the reflection fraction rising monotonically from the normal-incidence value to 100% at grazing. This is why glare off a water surface or glass window is preferentially s-polarised: the p-polarised component is mostly transmitted (especially near Brewster's angle) while the s-component is reflected. Polarising sunglasses and camera filters have their transmission axis vertical precisely to block the horizontally polarised s-reflections from horizontal water and road surfaces.`,
    relatedPhysicists: ["augustin-fresnel"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "p-polarization",
    term: "p-polarization",
    category: "concept",
    shortDefinition: "An EM wave incident on an interface with its electric field parallel to the plane of incidence (German parallel). Also called TM (transverse magnetic) polarisation. Reflection coefficient passes through zero at Brewster's angle.",
    description: `p-polarisation (from German *parallel*) refers to an electromagnetic wave striking an interface with its electric field vector in the plane of incidence — the plane containing the incoming k-vector and the surface normal. In waveguide and antenna literature the same state is called TM (transverse magnetic) polarisation because the magnetic field is entirely transverse to the plane of incidence.

The distinctive feature of p-polarisation at a dielectric interface is that the Fresnel reflection coefficient r_p = (n₂cosθ₁ − n₁cosθ₂)/(n₂cosθ₁ + n₁cosθ₂) passes through zero at Brewster's angle θ_B = arctan(n₂/n₁). At this angle the p-polarised wave is fully transmitted with no reflection. This vanishing of r_p — combined with the non-vanishing r_s — means that unpolarised light reflected at Brewster's angle is *purely* s-polarised, a principle Brewster exploited in his 1815 systematic measurements. Brewster windows in laser cavities use this property to eliminate reflective losses for one polarisation: inserting the window at θ_B ensures the p-polarised gain-medium output passes without loss, while the s-polarised component is discriminated against enough to force oscillation on the clean p-polarised mode.`,
    relatedPhysicists: ["augustin-fresnel", "david-brewster"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },

  // ─── §09.4 Total internal reflection ─────────────────────────────────
  {
    slug: "total-internal-reflection-term",
    term: "Total internal reflection (TIR)",
    category: "phenomenon",
    shortDefinition: "The 100% reflection of light at an interface from a denser to a less dense medium when the angle of incidence exceeds the critical angle θ_c = arcsin(n₂/n₁). The basis of optical fibres, binoculars, and retroreflectors.",
    description: `Total internal reflection occurs when a wave in a denser medium (refractive index n₁) strikes the interface with a less dense medium (n₂ < n₁) at an angle greater than the critical angle θ_c = arcsin(n₂/n₁). Above θ_c, Snell's law sin θ₂ = (n₁/n₂) sin θ₁ would demand sin θ₂ > 1 — mathematically impossible for a real refracted ray — so no light escapes into the second medium and 100% is reflected back into the denser medium. The reflection is perfect (in an ideal lossless system), far cleaner than any metallic mirror, because there is no absorption or transmission channel available.

Applications are everywhere optical. Optical fibres guide light along their core by total internal reflection at the core–cladding interface; the cone of input angles that successfully launch a guided mode is determined by the numerical aperture NA = √(n_core² − n_cladding²). Binocular and camera prism assemblies use TIR at 45° glass–air surfaces to redirect image-forming light paths without the intensity loss a silvered mirror would introduce. Bicycle reflectors and road-sign retroreflectors use corner-cube TIR to bounce light back to its source. Even though all the intensity reflects, an *evanescent wave* penetrates a fraction of a wavelength into the second medium — the basis of frustrated-total-internal-reflection couplers and TIR fluorescence microscopy.`,
    relatedPhysicists: ["willebrord-snell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "total-internal-reflection" },
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
    ],
  },
  {
    slug: "critical-angle",
    term: "Critical angle",
    category: "concept",
    shortDefinition: "θ_c = arcsin(n₂/n₁), the angle of incidence above which total internal reflection occurs at an interface from n₁ to n₂ < n₁. For water–air, θ_c ≈ 48.6°; for glass–air, θ_c ≈ 42°; for diamond–air, θ_c ≈ 24.4°.",
    description: `The critical angle θ_c is the angle of incidence, measured from the normal, above which total internal reflection takes place when a wave travels from a denser medium (n₁) into a less dense medium (n₂ < n₁). It is defined by Snell's law with the transmitted angle set to 90°: n₁ sin θ_c = n₂ · 1, giving θ_c = arcsin(n₂/n₁). At exactly θ_c the refracted ray grazes the interface; beyond θ_c no refracted ray exists.

Typical values illustrate the geometric consequences. Water to air: n₁ = 1.33, θ_c ≈ 48.6° — fish see the entire above-water world compressed into a cone of half-angle 48.6° directly overhead (Snell's window). Ordinary optical glass to air: n ≈ 1.5, θ_c ≈ 42° — the angle at which light inside a glass block starts to fail to escape. Diamond to air: n = 2.42, θ_c ≈ 24.4° — remarkably shallow. This is the geometrical reason diamonds "sparkle": once light enters, almost any internal angle at a face results in TIR, and the light bounces multiple times through the faceted interior before exiting through a face at near-normal incidence, producing high internal reflectivity and strong coloured dispersion along the way. Lapidaries cut brilliants with facet angles calculated precisely so that most entering rays undergo TIR twice before exiting from the crown.`,
    relatedPhysicists: ["willebrord-snell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "total-internal-reflection" },
    ],
  },

  // ─── §09.5 Optical dispersion ────────────────────────────────────────
  {
    slug: "optical-dispersion-term",
    term: "Optical dispersion",
    category: "phenomenon",
    shortDefinition: "The wavelength-dependence of refractive index, n(λ). Causes prism splitting of white light into its colours and chromatic aberration in lenses. Quantified by the Abbe number or the Sellmeier dispersion equation.",
    description: `Optical dispersion is the wavelength-dependence of the refractive index, n(λ). Because Snell's law sin θ_refracted = (n₁/n₂) sin θ_incident has n in it, different wavelengths refract at slightly different angles at any interface — the effect that splits white light into a rainbow when it passes through a glass prism. Newton's 1666 prism experiment established the effect as fundamental; nineteenth-century spectroscopy turned it into quantitative wavelength measurement.

In most optical glasses across the visible range, n decreases monotonically with wavelength — red refracts less than blue, the phenomenon called *normal dispersion*. The Sellmeier equation n²(λ) = 1 + Σᵢ B_i λ² / (λ² − C_i) gives an excellent fit across transparency windows, with the C_i parameters tied to absorption resonances in the UV and IR. Near those resonances, n(λ) behaves non-monotonically — *anomalous dispersion*, with dn/dλ > 0 (blue refracts less than red), first observed in strongly absorbing dyes in the 1860s. In imaging systems, dispersion produces *chromatic aberration*: a simple converging lens has different focal lengths for different colours, producing coloured fringes around high-contrast edges. Achromatic doublets, invented in the 1730s, combine a crown-glass converging lens with a flint-glass diverging lens of different dispersion to cancel the chromatic spread at two specified wavelengths.`,
    relatedPhysicists: ["joseph-fraunhofer"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },
  {
    slug: "abbe-number",
    term: "Abbe number",
    category: "concept",
    shortDefinition: "V_d = (n_d − 1)/(n_F − n_C), a dimensionless measure of optical dispersion in a material. High V_d (~65) means low dispersion (crown glasses); low V_d (~25) means high dispersion (flint glasses).",
    description: `The Abbe number V_d characterises the dispersion of an optical glass by comparing its refractive index at three Fraunhofer lines: the helium d-line (587.6 nm, yellow), the hydrogen F-line (486.1 nm, blue), and the hydrogen C-line (656.3 nm, red). The definition V_d = (n_d − 1)/(n_F − n_C) is dimensionless and reduces to about 30 for typical flint glasses (high dispersion), 60 for typical crown glasses (low dispersion), and can reach 95 for exotic low-dispersion fluorite-like materials used in premium camera telephoto lenses.

The Abbe number is the key design parameter for chromatic-aberration correction. An achromatic doublet combines a crown element (high V_d, weak dispersion) and a flint element (low V_d, strong dispersion) in the right proportions to cancel first-order chromatic aberration at two wavelengths. Apochromatic triplets use three elements of different V_d to cancel at three wavelengths, with residual aberration proportional to the fourth power of bandwidth. Ernst Abbe introduced this number at Zeiss in the 1880s as part of his systematic approach to lens design — the first truly industrial-mathematical optical engineering — and Abbe numbers remain the standard specification on every glass-manufacturer's datasheet today.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },
  {
    slug: "anomalous-dispersion",
    term: "Anomalous dispersion",
    category: "phenomenon",
    shortDefinition: "A frequency range in which dn/dω < 0 (refractive index decreases with frequency), typically near absorption resonances. Occurs when the driving frequency is above a material's resonance and below its relaxation.",
    description: `Anomalous dispersion is a frequency range in which the refractive index n(ω) *decreases* with increasing frequency, i.e., dn/dω < 0, opposite to the normal-dispersion behaviour of transparent glasses in the visible. It always occurs in the vicinity of an absorption resonance — whenever the driving frequency straddles a natural oscillation frequency of the material (an electronic transition, a molecular vibration, a lattice phonon), the Lorentz-model derivation of n(ω) predicts a resonant dip-and-peak structure, with normal dispersion on either side and anomalous dispersion in the narrow absorbing region.

The phenomenon was first observed in strongly absorbing dyes by Leroux (1862) and Christiansen (1870), before Hendrik Lorentz's 1878–1880 electron-oscillator theory gave the quantitative explanation. In the anomalous-dispersion band the phase velocity v_p = c/n can exceed c — since n can be less than 1 in that range — and the group velocity v_g = c/n_g can become very large, become negative, or exceed c. This does not violate special relativity because the signal velocity (the leading edge of a genuine information-carrying pulse) remains at or below c; anomalous-dispersion phase velocities exceeding c are a kinematic property of the phase-surface geometry, not a real propagation speed for a new signal. Modern optics exploits anomalous dispersion in Kramers–Kronig analyses, in chirped-pulse amplification of femtosecond lasers, and in negative-refractive-index metamaterials.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },

  // ─── §09.6 Geometric optics ──────────────────────────────────────────
  {
    slug: "snells-law",
    term: "Snell's law",
    category: "concept",
    shortDefinition: "n₁ sin θ₁ = n₂ sin θ₂. The ratio of the sines of the incidence and refraction angles at an interface equals the inverse ratio of refractive indices. Derived by Snell 1621 (unpublished), Descartes 1637 (published).",
    description: `Snell's law states that at an interface between two transparent media of refractive indices n₁ and n₂, an incident ray making angle θ₁ with the surface normal refracts into a transmitted ray at angle θ₂ satisfying n₁ sin θ₁ = n₂ sin θ₂. The transmitted ray bends toward the normal when entering a denser medium (n₂ > n₁, so θ₂ < θ₁) and away from the normal when entering a less dense medium. Above the critical angle θ_c = arcsin(n₂/n₁) when going from denser to less dense, no transmitted ray exists and total internal reflection takes over.

The law can be derived three ways: from Fermat's principle of least time applied to a path crossing the interface; from matching the tangential component of the wavevector k across the boundary (k_∥ must be continuous, giving n₁ sin θ₁ = n₂ sin θ₂ for light of fixed frequency); or from Huygens's secondary-wavelet construction at the boundary. Snell derived it experimentally in 1621 by meticulous angle-measurement across glass, water, and other media; he never published. Descartes independently derived and published in 1637, and French texts called it "Descartes's law" for two centuries; Huygens rediscovered Snell's original derivation in the 1670s and the Snell name prevailed in English and Dutch usage. Every geometrical-optics analysis — lens design, fibre-optic coupling, underwater optics — starts from Snell's law.`,
    relatedPhysicists: ["willebrord-snell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "geometric-optics" },
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
    ],
  },
  {
    slug: "thin-lens",
    term: "Thin lens",
    category: "concept",
    shortDefinition: "An idealised lens thin enough to neglect the thickness for ray tracing. Obeys the thin-lens equation 1/f = 1/s_o + 1/s_i and the lensmaker's equation 1/f = (n−1)(1/R₁ − 1/R₂).",
    description: `A thin lens is an idealisation in which the lens thickness is negligible compared to the focal length and the object/image distances, so that rays can be treated as bending once at a single plane rather than twice at two separated surfaces. Under this approximation, a thin lens in air with focal length f obeys the *thin-lens equation* 1/f = 1/s_o + 1/s_i, relating the object distance s_o (measured from the lens to the object) and the image distance s_i (measured from the lens to the image). Magnification is m = −s_i/s_o, with sign encoding orientation (negative = inverted).

The focal length itself is given by the lensmaker's equation 1/f = (n − 1)(1/R₁ − 1/R₂), where n is the glass index and R₁, R₂ are the signed radii of curvature of the two surfaces (positive for a convex-toward-incoming-light surface, negative for concave). A biconvex lens with both radii equal in magnitude and n ≈ 1.5 has f ≈ R — a useful rule of thumb. Thin-lens analysis is the starting point for every optical system; real lenses are then corrected for aberrations (spherical, chromatic, coma, astigmatism, field curvature, distortion) by combining multiple thin-lens elements with carefully chosen indices and curvatures. The Kepler telescope, the microscope, the camera lens, and the spectacles on your face are all built from thin-lens formulas as a first approximation.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "geometric-optics" },
    ],
  },
  {
    slug: "focal-length",
    term: "Focal length",
    category: "concept",
    shortDefinition: "f, the distance from a lens or mirror at which parallel incoming rays converge (or appear to diverge from). Positive for converging optics, negative for diverging. Determines magnification, angle of view, and depth of field.",
    description: `The focal length f of a lens or curved mirror is the distance from the optical element to the point at which parallel rays incoming along the optical axis converge (for a converging lens/mirror) or appear to diverge from (for a diverging lens/mirror, where f is taken as negative). It is the single most important parameter of an imaging system, setting the magnification at a given object distance, the angle of view, the depth of field, and the compression/expansion of perspective.

In photography, a 50 mm lens on a full-frame sensor gives roughly the angular field of human central vision (about 46° diagonal); a 24 mm lens is a wide angle (84°); a 200 mm lens is a telephoto (12°). The magnification of a distant object is proportional to f, while the angle of view is inversely proportional — longer focal lengths fill the frame with a smaller part of the scene. In microscope objectives and camera lenses, focal length combines with the numerical aperture NA to set the diffraction-limited resolution (λ/(2·NA), the Abbe limit) and the depth of field (∝ 1/NA²). The lensmaker's equation 1/f = (n−1)(1/R₁ − 1/R₂) computes f from the material index and the surface geometry; in thick or compound systems, f is computed by matrix optics as the element (1/f)-value of the system's ray-transfer matrix.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "geometric-optics" },
    ],
  },

  // ─── §09.7 Interference ──────────────────────────────────────────────
  {
    slug: "constructive-interference",
    term: "Constructive interference",
    category: "phenomenon",
    shortDefinition: "The superposition of two or more coherent waves in phase, producing an amplitude (and intensity) greater than any single wave. Condition: path-length difference = mλ for integer m.",
    description: `Constructive interference occurs when two or more coherent electromagnetic waves arrive at a point in phase — their peaks coincide with peaks, troughs with troughs — producing a resultant amplitude that is the sum of the individual amplitudes. For two equal-amplitude waves, the combined amplitude is 2A₀ and the intensity (proportional to amplitude squared) is 4 times that of a single wave, *not* 2 times — this is a key signature that distinguishes interference from incoherent addition, where intensities add.

The condition for constructive interference is that the path-length difference between the two waves is an integer number of wavelengths: ΔL = mλ for integer m. In Young's double-slit setup, bright fringes appear on a distant screen at angles satisfying d sin θ = mλ, where d is the slit spacing. In thin-film interference, constructive reflection from the top and bottom surfaces of an oil slick or soap bubble occurs at wavelengths where the round-trip optical path is an integer number of wavelengths (with a π phase shift accounted for if one reflection is off a denser medium and the other is not). Constructive interference is the physical basis of all lasers, holograms, interferometric telescopes (VLA, ALMA, VLBI), LIGO-class gravitational-wave detectors, and every spectroscopic instrument that relies on a diffraction grating.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "interference" },
    ],
  },
  {
    slug: "destructive-interference",
    term: "Destructive interference",
    category: "phenomenon",
    shortDefinition: "The superposition of two or more coherent waves in anti-phase, producing an amplitude (and intensity) less than the sum. Total cancellation requires equal amplitudes and a path-length difference of (m+½)λ.",
    description: `Destructive interference occurs when two or more coherent electromagnetic waves arrive at a point 180° out of phase — peaks of one coincide with troughs of the other — producing a resultant amplitude less than the sum of the individual amplitudes. When the two waves have equal amplitudes, the cancellation is total and the resultant intensity is zero, even though each wave by itself carried nonzero energy; the energy has been redistributed elsewhere by constructive interference, not destroyed.

The condition for total destructive interference is a path-length difference of (m + ½)λ for integer m, producing the dark fringes in Young's double-slit pattern (angles satisfying d sin θ = (m + ½)λ), the dark bands in thin-film interference at specific wavelengths, and the nulls in a radio-antenna array pattern. Anti-reflective coatings on camera lenses and eyeglasses exploit controlled destructive interference: a single quarter-wavelength layer of material with index n_c = √(n_air · n_glass) makes the reflection from the top surface cancel the reflection from the glass surface for one specific wavelength, giving the characteristic faint purple-green hue of coated optics. Active noise-cancelling headphones extend the same principle to acoustic waves, synthesising anti-phase signals in real time to cancel ambient noise in the wearer's ears.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "interference" },
    ],
  },
  {
    slug: "coherence-length",
    term: "Coherence length",
    category: "concept",
    shortDefinition: "L_c = c·τ_c ≈ λ²/Δλ, the path-length difference beyond which two parts of a light beam stop being able to interfere. Governs the maximum usable path difference in interferometers and holography.",
    description: `The coherence length L_c is the maximum path-length difference over which two parts of a light beam still produce detectable interference fringes when recombined. Quantitatively, L_c = c · τ_c, where τ_c is the coherence time, and τ_c ≈ 1/Δν ≈ λ²/(c·Δλ) for a source with bandwidth Δν centred at wavelength λ. Coherence length is set by the monochromaticity of the source: a broadband white-light source has L_c ~ 1 μm; a filtered sodium lamp ~ 0.5 mm; a He–Ne laser with a 1 GHz linewidth ~ 30 cm; a stabilised He–Ne or single-mode diode laser with 1 kHz linewidth ~ 300 km.

The practical consequence is the maximum usable path-length difference in interferometry. Michelson interferometers for precision length measurement need the two arms matched to within L_c; Fourier-transform infrared (FTIR) spectrometers scan a mirror over the coherence length of the source to build up the autocorrelation function from which the spectrum is recovered. In holography, coherence length sets how deep an object can be in the recording volume — old He–Ne holography was limited to objects a few centimetres deep, while modern stabilised-laser systems hologram entire rooms. Coherence length is related but not identical to *coherence area*, the transverse extent over which the beam's phase is correlated; the two together characterise the full coherence volume of a light field.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "interference" },
    ],
  },

  // ─── §09.8 Diffraction ───────────────────────────────────────────────
  {
    slug: "diffraction-em",
    term: "Diffraction (EM)",
    category: "phenomenon",
    shortDefinition: "The bending of light around obstacles and the spreading of light beyond apertures, resulting from the wave nature of EM radiation. Sets the resolution limit of every imaging system at about λ/NA.",
    description: `Diffraction is the bending of electromagnetic waves around edges and through apertures, and the spreading of beams that would otherwise propagate as strict geometrical-optics rays. It is a direct consequence of the wave nature of light: every point on a wavefront acts as a source of secondary wavelets (Huygens's principle), and their superposition produces spreading into the geometric shadow whenever a wavefront is truncated by an aperture or obstacle.

The scale of the diffraction effects is set by λ/D, where λ is the wavelength and D is the characteristic aperture size. For visible light (λ ≈ 500 nm) passing through a 1 mm aperture, the angular spread is ~ 0.5 mrad — essentially negligible on a laboratory bench, which is why geometric optics works. Through a 1 μm aperture, the spread is ~ 0.5 rad (~ 30°) — sharply visible. Diffraction sets the fundamental resolution limit of every imaging system: a telescope with aperture D can resolve angular features of about 1.22 λ/D (the Airy-disc criterion); a microscope objective with numerical aperture NA can resolve spatial features of about λ/(2·NA) (the Abbe limit). Bypassing these limits requires non-far-field techniques (near-field microscopy, stimulated-emission-depletion microscopy) or very short wavelengths (electron microscopy, X-ray imaging). Diffraction is the reason telescopes get larger, radio antennas use phased arrays, and EUV lithography at 13.5 nm is the current enabler of semiconductor feature scaling.`,
    relatedPhysicists: ["augustin-fresnel", "joseph-fraunhofer"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
    ],
  },
  {
    slug: "huygens-principle",
    term: "Huygens's principle",
    category: "concept",
    shortDefinition: "Every point on a wavefront acts as a source of secondary spherical wavelets; the envelope of all the wavelets gives the wavefront at the next instant. Christiaan Huygens, 1678; generalised by Fresnel and Kirchhoff.",
    description: `Huygens's principle states that every point on a propagating wavefront acts as a source of secondary spherical wavelets, and the new wavefront at a later instant is the envelope of all those secondary wavelets. Christiaan Huygens proposed this in his *Traité de la lumière* (1678) as part of his wave theory of light, using it to derive reflection, refraction, and the shape of a spherical-wave wavefront around a point source. As formulated by Huygens, the principle was heuristic; it correctly predicted wavefront shapes but could not explain why wavelets appeared to propagate forward but not backward.

Fresnel repaired the theory in the 1810s–20s by adding an obliquity factor (1 + cos χ)/2 that suppresses backward-going wavelets, producing the Huygens–Fresnel principle that correctly predicts diffraction patterns quantitatively. Gustav Kirchhoff in 1883 gave the full mathematical justification via the Kirchhoff integral theorem, deriving the Huygens–Fresnel formula directly from Maxwell's equations as a consequence of Green's theorem applied to the scalar wave equation. The modern view is that Huygens's principle is a restatement of the linearity of the wave equation: a source distribution (including an aperture wavefront treated as a source) determines a field everywhere via a Green's-function integral, which is exactly the Huygens–Fresnel–Kirchhoff construction. Every diffraction-pattern calculation — Fresnel zones, Fraunhofer diffraction, ray propagation in inhomogeneous media — uses some form of this principle.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
      { branchSlug: "electromagnetism", topicSlug: "interference" },
    ],
  },
  {
    slug: "single-slit-diffraction",
    term: "Single-slit diffraction",
    category: "phenomenon",
    shortDefinition: "The intensity pattern I(θ) = I₀ sinc²(πa sin θ/λ) produced when light of wavelength λ passes through a slit of width a. First minimum at sin θ = λ/a; central maximum carries most of the energy.",
    description: `Single-slit diffraction is the intensity pattern produced when a plane wave of wavelength λ passes through an aperture of width a and is observed on a distant screen (Fraunhofer regime) or via a lens. The intensity as a function of angle θ from the straight-through direction is I(θ) = I₀ [sin(πa sin θ/λ) / (πa sin θ/λ)]² — the squared sinc function. The central maximum at θ = 0 contains about 91% of the total energy; minima occur at sin θ = mλ/a for integer m ≠ 0; subsidiary maxima between the minima carry progressively less energy.

The first-minimum condition sin θ ≈ λ/a (for small a, small θ) is the cornerstone of diffraction-limited optics. A telescope of aperture D observes point sources as Airy discs of angular radius 1.22 λ/D — the circular-aperture version of the single-slit rule, with the 1.22 coming from the first zero of the Bessel function J₁. A laser beam of wavelength λ emerging from a beam-waist of diameter 2w₀ diverges into a far-field cone of half-angle θ ≈ λ/(πw₀). A 100 m-diameter radio dish at 21 cm (the hydrogen line) has an angular resolution of ~ 8 arcmin, comparable to the best unaided human eye in the visible. Single-slit diffraction is the simplest quantitative demonstration of wave behaviour and is used in every introductory optics laboratory to measure λ, a, or both.`,
    relatedPhysicists: ["augustin-fresnel"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
    ],
  },
  {
    slug: "double-slit-diffraction",
    term: "Double-slit diffraction",
    category: "phenomenon",
    shortDefinition: "Young's 1801 experiment. Two coherent slits a distance d apart produce an interference pattern of bright fringes at d sin θ = mλ, modulated by the single-slit envelope of each slit's width.",
    description: `Double-slit diffraction — Young's 1801 experiment — demonstrates both interference and diffraction simultaneously. Light of wavelength λ illuminates two parallel slits each of width a, separated by centre-to-centre distance d. On a distant screen, the intensity pattern is I(θ) = I₀ · [sin(πd sin θ/λ)]² / [sin(π(d/N) sin θ/λ)]² · [sin(πa sin θ/λ)/(πa sin θ/λ)]² — for two slits, an interference cosine-squared pattern multiplied by the single-slit sinc² envelope. Bright fringes occur at d sin θ = mλ (integer m) within the envelope; the envelope's first zero at sin θ = λ/a determines how many bright fringes are visible before the single-slit diffraction kills the pattern.

Young's 1801 experiment was the decisive evidence for the wave theory of light against Newton's corpuscular theory: no particle picture could produce alternating bright/dark fringes, but the wave-superposition picture produced them immediately, and the predicted fringe spacing λL/d (for screen distance L) matched measurement. The same setup, performed a century and a quarter later with electrons, photons one at a time, and eventually heavy molecules, established the wave–particle duality that defines quantum mechanics. "The heart of quantum mechanics," Feynman called the double-slit — "the only mystery." In optical laboratories today the double slit is a standard teaching tool; in quantum foundations, it remains the setup of choice for illustrating measurement and superposition.`,
    relatedPhysicists: ["augustin-fresnel"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
      { branchSlug: "electromagnetism", topicSlug: "interference" },
    ],
  },

  // ─── §09.9 Polarization phenomena ────────────────────────────────────
  {
    slug: "brewster-angle",
    term: "Brewster's angle",
    category: "concept",
    shortDefinition: "θ_B = arctan(n₂/n₁), the angle at which reflected light from a dielectric interface is perfectly s-polarised because the p-polarised Fresnel reflection coefficient r_p vanishes. Brewster 1815.",
    description: `Brewster's angle θ_B is the angle of incidence at which light reflected from a dielectric interface is purely s-polarised: the p-polarised component is fully transmitted with no reflection, because the Fresnel coefficient r_p = (n₂ cos θ₁ − n₁ cos θ₂)/(n₂ cos θ₁ + n₁ cos θ₂) passes through zero. Applying Snell's law to r_p = 0 gives tan θ_B = n₂/n₁. For air-to-glass, θ_B ≈ 56°; for air-to-water, θ_B ≈ 53°; for air-to-diamond, θ_B ≈ 67°.

The geometric origin of the effect is striking: at θ_B the reflected ray and the refracted ray are perpendicular to each other, so the dipoles induced in the second medium by the incident wave radiate along their own axis (which is suppressed by the dipole radiation pattern) for the p-polarised component but not for the s-polarised component. David Brewster discovered this in 1815 by systematic angle-and-polarisation measurements across dozens of materials. The effect is exploited in polarising sunglasses (which block horizontally-polarised glare from roads and water), in Brewster windows in laser cavities (where a window oriented at θ_B passes the laser-mode polarisation with zero reflection loss), and in Brewster-angle microscopes (which study molecular monolayers by viewing the sharp extinction at θ_B and the disruption of extinction caused by any change in the surface dielectric).`,
    relatedPhysicists: ["david-brewster", "augustin-fresnel"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
    ],
  },
  {
    slug: "birefringence",
    term: "Birefringence",
    category: "phenomenon",
    shortDefinition: "The property of an optically anisotropic material to have different refractive indices for different polarisations of light. Splits an unpolarised beam into two refracted rays (ordinary and extraordinary).",
    description: `Birefringence, or double refraction, is the optical property of an anisotropic material to exhibit two different refractive indices for two different polarisations of light propagating through it. An unpolarised beam entering a birefringent crystal (calcite, quartz, many plastics under stress) splits into two linearly polarised beams — the *ordinary ray*, which obeys Snell's law with an isotropic index n_o, and the *extraordinary ray*, whose index n_e depends on direction of propagation relative to the crystal's optic axis. The two emerge separated in space and typically with a phase difference, which is what allows wave plates, polarising beam splitters, and optical modulators to be built.

The microscopic origin is crystal anisotropy: the dielectric tensor ε is not scalar but a 3×3 tensor, and the refractive index depends on the angle between the wave's E-field and the crystal's principal axes. Uniaxial crystals (calcite, quartz, ice) have two of the three principal dielectric values equal and one different, so there is a special "optic axis" along which the anisotropy vanishes. Biaxial crystals (mica, topaz) have all three values different. Birefringence can also be induced in normally isotropic materials by stress (stress-birefringence, used for photoelastic analysis of mechanical stress), by an electric field (Kerr effect, used for fast optical shutters), or by a magnetic field (Cotton–Mouton effect). Every liquid-crystal display on every laptop and phone screen uses controlled electrically-induced birefringence as its fundamental switching mechanism.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "malus-law",
    term: "Malus's law",
    category: "concept",
    shortDefinition: "I = I₀ cos²θ. The transmitted intensity of linearly polarised light through an ideal polariser depends on the cosine-squared of the angle between the incident polarisation and the polariser's transmission axis.",
    description: `Malus's law states that when linearly polarised light of intensity I₀ passes through an ideal polariser whose transmission axis makes angle θ with the incident polarisation direction, the transmitted intensity is I = I₀ cos²θ. At θ = 0 the full intensity is transmitted; at θ = 90° (crossed polarisers) the intensity falls to zero; at θ = 45° the intensity is I₀/2. The law is easily derived: the incident field E₀ decomposes into a component E₀ cos θ along the transmission axis (which passes through) and E₀ sin θ perpendicular to it (which is absorbed); the transmitted intensity is proportional to the squared transmitted amplitude, giving cos²θ.

Étienne-Louis Malus discovered the law in 1809 while accidentally looking at reflected sunlight through a calcite crystal from his Paris window: he noticed that as he rotated the crystal, the reflected light alternately appeared and disappeared. The sunlight had been linearly polarised by the glancing reflection off a building across the street, and the calcite was acting as a linear-polarisation analyser. The cos² modulation sealed the geometric regularity. Malus's law is the quantitative basis of every polarisation measurement: an ellipsometer scans θ and fits I(θ) to extract the polarisation state of an unknown beam. It also underlies the operation of quantum-mechanical polarisation measurements — the photon version gives the Born-rule probability of a single-photon transmission, which is the basis of every Bell-inequality test in quantum optics.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },

  // ─── §09.10 Waveguides & fibres ──────────────────────────────────────
  {
    slug: "optical-fiber",
    term: "Optical fiber",
    category: "instrument",
    shortDefinition: "A thin glass fibre of core + cladding structure that guides light by total internal reflection along its length. Loss < 0.2 dB/km at 1.55 μm in silica single-mode fibre; the backbone of global telecommunications.",
    description: `An optical fibre is a thin, flexible glass or plastic rod consisting of a high-index core surrounded by a lower-index cladding; light launched into the core is guided along the fibre's length by repeated total internal reflection at the core–cladding interface. The numerical aperture NA = √(n_core² − n_cladding²) specifies the cone of acceptance angles that will couple into guided modes. Single-mode fibres have core diameters of about 9 μm for 1.55 μm wavelength — small enough that only one transverse mode propagates — and form the backbone of long-distance telecommunications. Multimode fibres have 50–62.5 μm cores, support dozens of modes, and are used for short-haul datacentre interconnects.

The modern era began in 1970 when Corning developed low-loss silica fibre below 20 dB/km; by the 2000s, optical-fibre losses at 1.55 μm had been pushed below 0.2 dB/km, allowing signals to travel tens of kilometres between amplifiers. The three telecom wavelength windows are 850 nm (multimode datacentre), 1.31 μm (low-dispersion single-mode metro), and 1.55 μm (low-loss single-mode long-haul). Wavelength-division multiplexing (WDM) pumps dozens to hundreds of independent wavelength channels through a single fibre, each carrying 10–400 Gbit/s, giving aggregate capacities of 50+ Tbit/s per fibre pair. Submarine fibre cables carry more than 99% of all transoceanic data traffic; Internet, telephone, and video all depend on fibre-optic transmission at the physical layer.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
      { branchSlug: "electromagnetism", topicSlug: "total-internal-reflection" },
    ],
  },
  {
    slug: "waveguide-mode",
    term: "Waveguide mode",
    category: "concept",
    shortDefinition: "A specific transverse field pattern that propagates along a waveguide without distortion, characterised by a propagation constant β and a cutoff frequency below which the mode is evanescent.",
    description: `A waveguide mode is a specific transverse field pattern E(x,y) e^{i(βz − ωt)} that propagates along a waveguide without changing its transverse shape, characterised by a propagation constant β and by its transverse polarisation structure. Each waveguide has a discrete set of guided modes, labelled by integer indices (e.g., TE_mn, TM_mn in rectangular metal waveguides, or LP_mn in optical fibres), and each mode has a cutoff frequency ω_c below which β becomes imaginary and the mode no longer propagates — it becomes evanescent, decaying exponentially along z.

The mode structure comes from solving the transverse Helmholtz equation (∇_⊥² + (k² − β²))E_⊥ = 0 subject to the waveguide's boundary conditions (metal walls for microwave guides, dielectric discontinuity for optical fibres). In a rectangular metal waveguide of dimensions a × b, the dominant TE₁₀ mode has cutoff frequency f_c = c/(2a); the common WR-90 X-band guide (22.9 × 10.2 mm) cuts off at 6.6 GHz and is used up to 12.4 GHz before higher modes start propagating. In a single-mode optical fibre, the V-parameter V = (2π/λ) a · NA must be less than 2.405 for only the fundamental LP₀₁ mode to propagate — the condition used to choose core diameter for a given wavelength. Every microwave filter, every optical-fibre design, every integrated-photonic circuit is built on top of the mode spectrum of its underlying waveguide geometry.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
    ],
  },
  {
    slug: "numerical-aperture",
    term: "Numerical aperture",
    category: "concept",
    shortDefinition: "NA = n sin θ_max. For a fibre, NA = √(n_core² − n_cladding²) gives the sine of the maximum acceptance half-angle. For a microscope objective, NA determines the diffraction-limited resolution λ/(2·NA).",
    description: `The numerical aperture NA of an optical system is a dimensionless measure of the cone of rays that the system can accept or emit. For a microscope objective, NA = n sin θ_max, where n is the index of the medium between the objective and the specimen (1 for air, 1.5 for immersion oil) and θ_max is the half-angle of the cone of rays the objective can collect from the focal plane. For an optical fibre, NA = √(n_core² − n_cladding²) gives sin θ_max, the sine of the maximum acceptance half-angle in the external medium.

NA controls two of the most important properties of any imaging or fibre-coupling system. In microscopy, the diffraction-limited transverse resolution is r = 0.61 λ/NA (Rayleigh criterion), and the depth of field is DoF ≈ λ/NA² — both improve with increasing NA, which is why immersion-oil objectives (NA up to 1.4) resolve more than dry objectives (NA limited to ~1). In fibre optics, NA determines how much light a source (LED, laser, SMA connector) can launch into the fibre: the accepted power scales as NA². Higher-NA fibres couple more cheaply to cheap light sources but have more modal dispersion in multimode operation and tighter bend-loss constraints; telecom single-mode fibres use NA ≈ 0.12, while high-NA fibres for short-distance illumination reach NA ≈ 0.5. NA is quoted on every objective's and fibre's datasheet because it sets the performance envelope of the subsequent system.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
    ],
  },

  // ─── PLACEHOLDER PROMOTIONS (overwrite Session 2 / Session 4 placeholders) ─
  {
    slug: "fresnel-equations",
    term: "Fresnel equations",
    category: "concept",
    shortDefinition: "The four amplitude coefficients (r_s, r_p, t_s, t_p) giving what fraction of a wave's amplitude reflects from or transmits through a dielectric interface, derived from Maxwell boundary conditions. r_p vanishes at Brewster's angle.",
    description: `The Fresnel equations are the four amplitude coefficients — r_s, r_p, t_s, t_p — giving what fraction of a plane electromagnetic wave's amplitude is reflected from or transmitted through a planar interface between two dielectric media of refractive indices n₁ and n₂. They are derived by applying the Maxwell boundary conditions — tangential continuity of E and H, normal continuity of D and B — to a plane wave hitting the interface at angle θ₁, decomposing separately for the two polarisations. For s-polarisation (E perpendicular to the plane of incidence), r_s = (n₁ cos θ₁ − n₂ cos θ₂)/(n₁ cos θ₁ + n₂ cos θ₂). For p-polarisation (E in the plane of incidence), r_p = (n₂ cos θ₁ − n₁ cos θ₂)/(n₂ cos θ₁ + n₁ cos θ₂). The intensity (power) reflectances are R_s = |r_s|², R_p = |r_p|².

The striking feature of r_p is that it passes through zero at Brewster's angle θ_B = arctan(n₂/n₁); at this angle the reflected wave is purely s-polarised, a fact Brewster measured systematically across dozens of materials in 1815. r_s, by contrast, is negative throughout and grows in magnitude monotonically toward 100% at grazing incidence. For n₂ < n₁, both coefficients develop complex phases beyond the critical angle θ_c = arcsin(n₂/n₁), producing total internal reflection with a polarisation-dependent phase shift (exploited in Fresnel rhombs for producing circular polarisation from linear). Applications: lens anti-reflective coatings (quarter-wave layers interfering at the right wavelength), polarising beam splitters (stacks of plates tilted toward Brewster), camera polarising filters, Brewster windows in gas-laser cavities, ellipsometry for thin-film analysis. Augustin-Jean Fresnel derived the equations in 1821–23 from his elastic-solid wave theory of light, decades before Maxwell showed light to be an electromagnetic wave.`,
    relatedPhysicists: ["augustin-fresnel", "james-clerk-maxwell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
    ],
  },
  {
    slug: "electromagnetic-wave",
    term: "Electromagnetic wave",
    category: "phenomenon",
    shortDefinition: "A self-sustaining coupled oscillation of electric and magnetic fields that propagates through vacuum at c = 1/√(μ₀ε₀). E, B, and k are mutually perpendicular. Maxwell's synthesis identified light itself as an electromagnetic wave.",
    description: `An electromagnetic wave is a self-sustaining coupled oscillation of electric and magnetic fields propagating through space. The derivation from Maxwell's equations in source-free vacuum is direct: take the curl of Faraday's law (∇×E = −∂B/∂t), substitute Ampère–Maxwell (∇×B = μ₀ε₀ ∂E/∂t), and use the vector identity ∇×(∇×E) = −∇²E (given ∇·E = 0). The result is the wave equation ∇²E = (1/c²) ∂²E/∂t² with c = 1/√(μ₀ε₀). Identical equations govern B. Plane-wave solutions have the form E = E₀ cos(k·r − ωt) with ω = c|k|, and the electric field, magnetic field, and propagation direction form a mutually perpendicular right-handed triad with |B| = |E|/c.

The wave carries energy density u = ½ε₀|E|² + |B|²/(2μ₀), evenly split between the electric and magnetic parts, and transports that energy at speed c in the propagation direction. The instantaneous energy flux is the Poynting vector S = (1/μ₀) E×B, whose time-average gives the intensity. An electromagnetic wave absorbed by a perfectly absorbing surface exerts radiation pressure P = I/c; reflected off a perfect mirror, it delivers 2I/c. Polarisation states (linear, circular, elliptical) encode the two independent transverse degrees of freedom of E. The spectrum spans radio (below 300 GHz), microwaves, infrared, visible light (400–700 nm), ultraviolet, X-rays, and gamma rays — all the same phenomenon, differing only in ω. Maxwell derived these results in 1865; Hertz confirmed them experimentally at radio frequencies in 1887, sealing the synthesis that light is an electromagnetic wave.`,
    relatedPhysicists: ["james-clerk-maxwell", "hippolyte-fizeau", "augustin-fresnel"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
      { branchSlug: "electromagnetism", topicSlug: "plane-waves-and-polarization" },
      { branchSlug: "electromagnetism", topicSlug: "radiation-pressure" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
    ],
  },

  // ─── Forward-reference placeholders ───────────────────────────────────

  // FORWARD-REF: Huygens himself — referenced as Term slug in MDX. Full treatment in §10 (historical physicists).
  {
    slug: "christiaan-huygens",
    term: "Christiaan Huygens",
    category: "concept",
    shortDefinition: "Dutch physicist and astronomer (1629–1695) who proposed the wave theory of light in Traité de la lumière (1678) and formulated the Huygens construction of secondary wavelets. Full physicist entry in a later session.",
    description: `This is a placeholder entry. Christiaan Huygens was a Dutch mathematician, astronomer, and physicist (1629–1695) whose contributions to optics include the wave theory of light presented in *Traité de la lumière* (1678) and the Huygens construction of secondary wavelets, which remains the first clean statement of what is now called Huygens's principle. He also built the first pendulum clock, discovered Titan, explained Saturn's rings, and derived the centripetal acceleration formula — all in addition to his optical work.

The full physicist entry will appear in a later session. For the specific optical concepts that reference him here — the wave theory, the secondary-wavelet construction, the derivation of Snell's law from wave-front propagation — see the glossary entries for **huygens-principle** and **snells-law**, and the topic treatment in §09.8 diffraction-and-the-double-slit.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
      { branchSlug: "electromagnetism", topicSlug: "geometric-optics" },
    ],
  },

  // FORWARD-REF: Young interference — full treatment already in §09.7, this is just a slug alias
  {
    slug: "young-interference",
    term: "Young's interference experiment",
    category: "phenomenon",
    shortDefinition: "Thomas Young's 1801 double-slit experiment that demonstrated the wave nature of light by producing interference fringes. Full treatment in §09.7 interference and §09.8 diffraction-and-the-double-slit.",
    description: `This is a placeholder entry. Young's interference experiment is the 1801 double-slit demonstration by Thomas Young in which coherent light passing through two parallel slits produced a pattern of bright and dark fringes on a screen, establishing the wave nature of light against Newton's corpuscular theory. The fringe spacing λL/d (where L is the screen distance and d the slit separation) matched the wave-theory prediction and could not be accounted for by any particle model.

The full quantitative treatment appears in §09.7 interference (constructive-interference, destructive-interference, coherence-length) and §09.8 diffraction-and-the-double-slit (see the **double-slit-diffraction** glossary entry). The same experimental setup, performed a century and a quarter later with electrons, photons one at a time, and heavy molecules, became the defining illustration of wave–particle duality in quantum mechanics.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "interference" },
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
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
