// Seed Wave 4 (Module 7 · Fluids) physicists + glossary.
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-wave-4.ts
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
    slug: "blaise-pascal",
    name: "Blaise Pascal",
    shortName: "Pascal",
    born: "1623",
    died: "1662",
    nationality: "French",
    oneLiner: "Showed that pressure in a confined fluid travels undiminished in every direction — and gave his name to the SI unit of pressure.",
    bio: "Blaise Pascal was born in Clermont-Ferrand in 1623 to a tax official who withdrew his son from formal schooling to tutor him at home. The experiment worked: by sixteen Pascal had written an essay on conic sections rigorous enough that Descartes refused to believe a teenager had produced it. By nineteen he had built a working mechanical calculator — the Pascaline — to help his father reconcile tax receipts. It was the first adding machine to reach commercial production.\n\nHis work on fluids followed in the 1640s, after Torricelli's mercury barometer reached France. Pascal sent his brother-in-law up the Puy-de-Dôme with a barometer and verified that the mercury column fell as altitude rose — direct evidence that the atmosphere has finite weight. From there he produced two treatises, published posthumously, that laid out what we now call Pascal's principle: a pressure applied to an enclosed fluid transmits undiminished to every point. The hydraulic press is a direct consequence.\n\nAfter 1654 Pascal underwent a religious conversion and turned to theological writing, producing the Pensées and the Lettres provinciales. Parallel to this he co-founded probability theory with Fermat, working out the mathematics of fair stake division in games of chance. He died at thirty-nine, leaving behind a sprawl of work in geometry, hydrostatics, calculus, probability, and devotional philosophy.",
    contributions: [
      "Pascal's principle: pressure in an enclosed fluid transmits undiminished",
      "Experimental proof that atmospheric pressure decreases with altitude",
      "The Pascaline — the first commercially produced mechanical calculator",
      "Co-founded probability theory with Pierre de Fermat",
      "Pascal's triangle and the arithmetic of binomial coefficients",
    ],
    majorWorks: [
      "Traité de l'équilibre des liqueurs (1653)",
      "Traité du triangle arithmétique (1654)",
      "Pensées (1670)",
      "Lettres provinciales (1657)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" }],
  },
  {
    slug: "simon-stevin",
    name: "Simon Stevin",
    shortName: "Stevin",
    born: "1548",
    died: "1620",
    nationality: "Flemish",
    oneLiner: "Flemish engineer who showed that fluid pressure depends only on depth, never on the shape of the container.",
    bio: "Simon Stevin was born in Bruges around 1548 and spent his early career as a bookkeeper and merchant's clerk before enrolling at Leiden University in his mid-thirties. He settled into a life of applied mathematics in service of the young Dutch Republic, eventually becoming quartermaster general of the States Army and tutor to Prince Maurice of Orange.\n\nHis 1586 De Beghinselen des Waterwichts (The Principles of Hydrostatics) is the first rigorous treatment of fluid pressure after Archimedes. Stevin showed, by a geometric argument involving the imaginary freezing of part of a fluid into a rigid shape, that pressure on a horizontal surface depends on the height of the fluid above it and nothing else — not on the shape of the container, not on the total mass of fluid. The result, known as the hydrostatic paradox, dissolves only once you see that the container's walls absorb the extra weight in a wider vessel. He also derived the resolution of forces on an inclined plane, eight decades before Newton, using a clever diagram of beads on a frictionless triangle.\n\nStevin's 1585 pamphlet De Thiende made the case for decimal fractions in commerce, engineering, and currency — a reform Europe took more than a century to adopt fully but which Stevin lived to see take root in the Low Countries. He also built sand yachts that outran horses along Dutch beaches, designed sluice systems that drained swamps into farmland, and coined much of modern Dutch scientific vocabulary.",
    contributions: [
      "Hydrostatic paradox: pressure depends only on fluid depth, not shape",
      "Rigorous derivation of the law of the inclined plane (1586)",
      "Championed decimal fractions for science, commerce, and currency",
      "Practical advances in fortification, drainage, and sluice engineering",
      "Early formulation of the principle of virtual work",
    ],
    majorWorks: [
      "De Thiende (1585)",
      "De Beghinselen des Waterwichts (1586)",
      "Wisconstige Gedachtenissen (1605)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" }],
  },
  {
    slug: "giovanni-venturi",
    name: "Giovanni Battista Venturi",
    shortName: "Venturi",
    born: "1746",
    died: "1822",
    nationality: "Italian",
    oneLiner: "Italian priest and natural philosopher who discovered that constricting a pipe speeds up its flow and drops its pressure.",
    bio: "Giovanni Battista Venturi was born in Bibbiano, Italy, in 1746, and entered the Catholic priesthood in 1769 — the standard route for a quick-minded young man of his generation into the intellectual life of Italy. He taught at the University of Modena for three decades, held several diplomatic posts under the Napoleonic government of northern Italy, and spent his spare time in physics, chemistry, and the history of science.\n\nHis 1797 paper 'Recherches expérimentales sur le principe de la communication latérale du mouvement dans les fluides' laid out what is now called the Venturi effect. Venturi showed experimentally that when fluid flows through a pipe whose cross-section narrows and then widens again, the velocity rises in the narrow section and the static pressure drops there — a direct consequence of mass conservation and Bernoulli's principle working in tandem. He recommended the constricted tube as a flow meter, a usage that became standard in hydraulic engineering throughout the nineteenth century and is still taught in fluid mechanics courses today.\n\nVenturi was also one of the first historians of Leonardo da Vinci's scientific notebooks, transcribing and publishing substantial portions of them in 1797 — a century before the notebooks were fully catalogued. His scientific reputation rests narrower than his interests, but the narrowed pipe and the drop in pressure have proven durable enough to keep his name on every fluids syllabus.",
    contributions: [
      "Venturi effect (1797): fluid speed rises and pressure drops through a pipe constriction",
      "Design of the Venturi meter for measuring flow rate in pipes",
      "Early transcription and publication of Leonardo da Vinci's scientific notebooks",
      "Contributions to the theory of heat and to the history of early modern physics",
    ],
    majorWorks: [
      "Recherches expérimentales sur le principe de la communication latérale du mouvement dans les fluides (1797)",
      "Essai sur les ouvrages physico-mathématiques de Léonard de Vinci (1797)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" }],
  },
  {
    slug: "jean-poiseuille",
    name: "Jean Léonard Marie Poiseuille",
    shortName: "Poiseuille",
    born: "1797",
    died: "1869",
    nationality: "French",
    oneLiner: "Paris doctor who wanted to understand blood flow — and wrote down the governing law of viscous pipe flow in the process.",
    bio: "Jean Léonard Marie Poiseuille was born in Paris in 1797 and trained as a physician at the École Polytechnique and then the Paris medical faculty, graduating in 1828. His dissertation was on the forces driving venous and arterial circulation — an unusually quantitative question for a French medical thesis of the period, and the start of a lifelong obsession.\n\nRather than go into clinical practice, Poiseuille spent his career in a lab. Between 1838 and 1846 he ran meticulous experiments pushing water, mercury, and various salt solutions through fine glass capillaries, measuring flow rate as a function of applied pressure, tube length, and tube radius. In 1840 he published the result now universally known as Poiseuille's law: for laminar flow of a Newtonian fluid through a cylindrical tube, volumetric flow rate scales as R⁴·Δp/(8ηL). The fourth-power dependence on radius is the key: any branched transport system — lungs, circulatory tree, water mains — is dominated by its narrowest vessels.\n\nPoiseuille never wrote down a partial differential equation; the theoretical derivation of his law from Newton's viscosity ansatz was later completed by Hagen in Germany and by Stokes, which is why the result is sometimes called the Hagen-Poiseuille equation. But the phenomenon and the scaling are his. The SI-adjacent unit of viscosity, the poise, is named after him.",
    contributions: [
      "Poiseuille's law for laminar pipe flow (1840) — volumetric flow rate scales as R⁴",
      "First rigorous quantitative experimental study of viscous flow in fine tubes",
      "Empirical determination of the linear pressure-velocity relation for Newtonian fluids",
      "Foundations of hemodynamics — the physics of blood flow through the circulatory system",
    ],
    majorWorks: [
      "Recherches expérimentales sur le mouvement des liquides dans les tubes de très petits diamètres (1840)",
      "Recherches sur la force du cœur aortique (1828)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" }],
  },
  {
    slug: "osborne-reynolds",
    name: "Osborne Reynolds",
    shortName: "Reynolds",
    born: "1842",
    died: "1912",
    nationality: "Irish",
    oneLiner: "Belfast-born engineer whose dye-in-a-pipe experiment defined the transition between laminar and turbulent flow.",
    bio: "Osborne Reynolds was born in Belfast in 1842 into a family of clergymen and scholars. After early engineering work with his father and apprenticeship with a mechanical engineer in London, he took a mathematics degree at Cambridge, graduating as seventh wrangler in 1867. The following year, still in his twenties, he was appointed the first Professor of Engineering at Owens College in Manchester (later the University of Manchester), a chair he held for thirty-seven years.\n\nReynolds' most famous work came in 1883. He set up a glass tube with a bell-mouth inlet, ran water through it, and injected a thin filament of coloured dye at the entrance. At low flow speeds the dye drew a perfectly straight line down the tube; at high speeds the filament tore apart in a chaotic puff. Somewhere in between lay a transition, and Reynolds showed by careful dimensional argument that the transition was governed by a single dimensionless combination: ρvL/η, now called the Reynolds number. The critical value for pipe flow, approximately 2300, has been a bedrock number for engineers ever since.\n\nReynolds also introduced the averaging scheme that bears his name — the Reynolds decomposition of turbulent flow into mean and fluctuating parts, and the resulting Reynolds-averaged Navier-Stokes equations, which remain the workhorse of practical turbulence modelling a century and a half later. He wrote on lubrication theory, on the kinetic theory of gases, and on the mechanics of cricket balls.",
    contributions: [
      "Reynolds number (1883) — dimensionless ratio of inertial to viscous forces",
      "Dye-in-a-pipe experiment demonstrating the laminar-to-turbulent transition",
      "Reynolds decomposition and the Reynolds-averaged Navier-Stokes (RANS) equations",
      "Reynolds lubrication theory for thin fluid films between bearing surfaces",
    ],
    majorWorks: [
      "An experimental investigation of the circumstances which determine whether the motion of water shall be direct or sinuous (1883)",
      "On the dynamical theory of incompressible viscous fluids (1895)",
      "Papers on Mechanical and Physical Subjects (1900)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
    ],
  },
  {
    slug: "edward-mills-purcell",
    name: "Edward Mills Purcell",
    shortName: "Purcell",
    born: "1912",
    died: "1997",
    nationality: "American",
    oneLiner: "Nobel laureate for discovering nuclear magnetic resonance, later famous among fluid dynamicists for his 1977 lecture on life at low Reynolds number.",
    bio: "Edward Mills Purcell was born in Taylorville, Illinois in 1912 and studied electrical engineering at Purdue before switching to physics at Harvard, where he took his Ph.D. under John Van Vleck in 1938. The Second World War pulled him into the MIT Radiation Laboratory, where he led the development of microwave radar receivers and absorbed the techniques for manipulating radiofrequency electromagnetic fields that would shape the rest of his career.\n\nIn 1946, back at Harvard, Purcell and his colleagues Robert Pound and Henry Torrey observed nuclear magnetic resonance in solid paraffin — protons in a sample precessing in a static magnetic field and absorbing energy from a resonant radiofrequency pulse. Felix Bloch at Stanford independently observed the same effect in liquids. They shared the 1952 Nobel Prize in Physics. NMR has since become one of the most productive experimental tools in all of science: the foundation of NMR spectroscopy for chemistry, of magnetic resonance imaging in medicine, and of precision magnetometry.\n\nPurcell's other enduring contribution to the physics culture is a 1977 lecture at the American Institute of Physics titled Life at Low Reynolds Number. In it he explained — with clarity, charm, and a cartoon of a hypothetical 'one-hinge swimmer' — why the Navier-Stokes equations become time-reversible in the creeping-flow limit, why reciprocal motion cannot produce net displacement at low Reynolds number (the scallop theorem), and why every motile bacterium on Earth uses a rotating helical flagellum rather than a paddle.",
    contributions: [
      "Discovery of nuclear magnetic resonance in condensed matter (1946, Nobel Prize 1952)",
      "Foundational NMR techniques underpinning spectroscopy and magnetic-resonance imaging",
      "Life at Low Reynolds Number lecture (1977) — cornerstone of modern microswimmer theory",
      "The scallop theorem on reciprocal motion in creeping flow",
    ],
    majorWorks: [
      "Resonance Absorption by Nuclear Magnetic Moments in a Solid (1946)",
      "Electricity and Magnetism — Berkeley Physics Course Volume 2 (1963)",
      "Life at Low Reynolds Number (1977)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" }],
  },
  {
    slug: "claude-louis-navier",
    name: "Claude-Louis Navier",
    shortName: "Navier",
    born: "1785",
    died: "1836",
    nationality: "French",
    oneLiner: "Engineer who first wrote down the equations of viscous fluid flow.",
    bio: "Claude-Louis Navier was born in Dijon in 1785 and orphaned by fourteen, raised by his great-uncle Emiland Gauthey, the chief engineer of the Canal du Centre. The family craft was hydraulics — rivers, locks, barges — and the boy absorbed it as other boys absorbed Latin. He entered the École Polytechnique in 1802 and the École des Ponts et Chaussées in 1804, coming out at the very top of his cohort and stepping straight into a career as a state engineer.\n\nHis great paper of 1822, Mémoire sur les lois du mouvement des fluides, was an attempt to derive the equations of fluid motion from a molecular picture. He pictured a fluid as a lattice of point particles repelling one another, worked out the macroscopic stress tensor that their interactions would produce, and wrote down a partial differential equation for the velocity field that included — for the first time — a viscous term proportional to the Laplacian of the velocity. The molecular derivation was, in hindsight, wrong in its details: Stokes re-derived the same equation two decades later from a cleaner continuum argument. But the equation was Navier's first, and the name it now bears is just.\n\nNavier's public fame, in his own lifetime, rested on the bridges. He built the Pont des Invalides in Paris (twice — the first version was demolished amid a political quarrel before it opened, a humiliation that broke his health), and his lecture notes at the Ponts et Chaussées became the standard text on the strength of materials across nineteenth-century Europe.",
    contributions: [
      "Wrote down the Navier-Stokes equations of viscous fluid flow in 1822",
      "Founded the modern theory of the strength of elastic materials",
      "First correct equation for the deflection of a loaded beam",
      "Standard French textbook on civil-engineering mechanics",
    ],
    majorWorks: [
      "Mémoire sur les lois du mouvement des fluides (1822)",
      "Résumé des Leçons données à l'École des Ponts et Chaussées (1826)",
      "Rapport et Mémoire sur les ponts suspendus (1823)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
    ],
  },
  {
    slug: "lewis-fry-richardson",
    name: "Lewis Fry Richardson",
    shortName: "Richardson",
    born: "1881",
    died: "1953",
    nationality: "English",
    oneLiner: "Quaker meteorologist who imagined the turbulent cascade — and tried to forecast the weather by hand.",
    bio: "Lewis Fry Richardson was born in 1881 into an English Quaker family, studied at Cambridge, and spent his working life moving between three careers most people would consider incompatible: mathematical physics, meteorology, and the statistical study of war. The Quaker thread runs through all three. He could not in conscience take a university post that required him to contribute to military research, and so he worked at a peat-bog research station, a national physics laboratory, and a small teacher-training college, turning down better offers on principle.\n\nIn 1922 he published Weather Prediction by Numerical Process, the book that invented modern meteorology. It proposed, decades before computers existed, that the atmosphere could be forecast by dividing the globe into a grid of cells and numerically stepping forward the equations of fluid motion and thermodynamics. He estimated, with an accountant's seriousness, the staffing required: 64,000 human computers with slide rules, working in shifts in a domed theatre. His own hand-computed trial forecast famously produced nonsense, because he had no way to filter out the fast-moving acoustic modes of the equations. Forty years later Jule Charney would fix that problem and run the same scheme on ENIAC.\n\nBuried inside Weather Prediction is the four-line verse that every fluid-dynamicist can quote: Big whorls have little whorls that feed on their velocity, and little whorls have lesser whorls and so on to viscosity — in the molecular sense. It is a parody of Swift's couplet about fleas, and it is also the physical picture that Andrey Kolmogorov made quantitative nineteen years later.",
    contributions: [
      "Described the turbulent energy cascade from large to small eddies (1922)",
      "Founded numerical weather prediction with the grid-point method",
      "Introduced the Richardson number, a stability criterion for stratified shear flow",
      "Pioneered the quantitative statistical study of war and international conflict",
    ],
    majorWorks: [
      "Weather Prediction by Numerical Process (1922)",
      "Generalized Foreign Politics (1939)",
      "Statistics of Deadly Quarrels (1960)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "turbulence" }],
  },
  {
    slug: "andrey-kolmogorov",
    name: "Andrey Kolmogorov",
    shortName: "Kolmogorov",
    born: "1903",
    died: "1987",
    nationality: "Russian",
    oneLiner: "The Soviet polymath who axiomatised probability and wrote the one law of turbulence we know.",
    bio: "Andrey Nikolaevich Kolmogorov was born in 1903 in Tambov, Russia, and raised by his aunt after his unmarried mother died in childbirth. He was a restlessly curious child — he published his first mathematical paper at seventeen — and went up to Moscow University in 1920, at a moment when the city was starving and the new Soviet state was half-collapsed. He never left. By the end of that decade he had already rewritten the logical foundations of his subject; by the end of the next he was one of the defining mathematicians of the twentieth century.\n\nHis 1933 monograph Grundbegriffe der Wahrscheinlichkeitsrechnung gave probability theory the measure-theoretic axioms it still uses today — a single, clean framework that made the subject a respectable branch of mathematics rather than a collection of gambler's heuristics. From probability he moved to stochastic processes, from there to dynamical systems (the K in KAM theorem stands for Kolmogorov), to information theory (Kolmogorov complexity), to algorithmic randomness, to classical and celestial mechanics.\n\nIn the summer of 1941, with German armies advancing on Moscow, the academy evacuated to Kazan, and Kolmogorov turned his attention to the one problem every fluid dynamicist had given up on. In three short papers he laid out what is now called the K41 theory: an argument, by pure dimensional analysis, that the energy spectrum in the inertial range of fully-developed turbulence must go as E(k) ∝ ε^(2/3) k^(−5/3). He had not solved the Navier-Stokes equations. He had solved, in a sense, the scaling of the Navier-Stokes equations. Measured ever since, in every turbulent flow in every medium, the spectrum is a straight line with slope −5/3.",
    contributions: [
      "Axiomatised probability theory (1933) on measure-theoretic foundations",
      "Proved the Kolmogorov −5/3 law for turbulent energy spectra (1941)",
      "Co-founded KAM theory — stability of quasi-periodic Hamiltonian motion",
      "Founded algorithmic information theory and Kolmogorov complexity",
    ],
    majorWorks: [
      "Grundbegriffe der Wahrscheinlichkeitsrechnung (1933)",
      "The Local Structure of Turbulence in Incompressible Viscous Fluid (1941)",
      "On Conservation of Conditionally Periodic Motions (1954)",
      "Three Approaches to the Quantitative Definition of Information (1965)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "turbulence" }],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "pressure",
    term: "Pressure",
    category: "concept",
    shortDefinition: "Force per unit area acting perpendicular to a surface. Scalar. Unit: pascal (Pa = N/m²).",
    description: "Pressure is the normal force per unit area exerted on a surface, or transmitted through a fluid. In a static fluid it acts equally in all directions at any given point — this isotropy is what makes fluid pressure scalar, even though force is a vector.\n\nAtmospheric pressure at sea level is about 101 kPa. One additional atmosphere is added for every ten metres descended in water. Human lungs can comfortably push about 10 kPa; a car tyre runs at 200 kPa; a deep-ocean trench at 100 MPa; the centre of the Sun at around 10^16 Pa.",
    relatedPhysicists: ["blaise-pascal", "simon-stevin"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" }],
  },
  {
    slug: "pascal-unit",
    term: "Pascal",
    category: "unit",
    shortDefinition: "The SI unit of pressure: 1 Pa = 1 N/m². Named for Blaise Pascal.",
    description: "One pascal is the pressure exerted by a force of one newton spread over one square metre. In practice it is a small unit: atmospheric pressure is about 101,325 Pa, or 101 kPa. The bar (100,000 Pa) and psi (pounds per square inch, ≈ 6895 Pa) remain common in engineering.\n\nThe unit was officially adopted by the CGPM in 1971, more than three centuries after Pascal's death.",
    relatedPhysicists: ["blaise-pascal"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" }],
  },
  {
    slug: "buoyancy",
    term: "Buoyancy",
    category: "concept",
    shortDefinition: "The upward force on an object immersed in a fluid, equal to the weight of the fluid the object displaces.",
    description: "Archimedes' principle: a body fully or partially submerged in a fluid experiences an upward buoyant force equal to the weight of the fluid it displaces. Derivation: the hydrostatic pressure at the bottom of the body exceeds that at the top by ρ·g·h, where h is the vertical extent; integrated over the body's horizontal cross-section, this gives ρ_fluid·g·V_submerged, which is exactly the weight of displaced fluid.\n\nWhether an object floats, sinks, or hovers depends on the ratio of its density to the fluid's. Ice floats on water because it's 9% less dense; steel sinks because it's eight times denser; a helium balloon rises because helium is one-seventh the density of air.",
    history: "Stated by Archimedes of Syracuse around 250 BCE, according to Vitruvius's anecdote about the crown of King Hiero and the famous naked run through Syracuse shouting 'Eureka!'",
    relatedPhysicists: ["archimedes"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" }],
  },
  {
    slug: "hydrostatic",
    term: "Hydrostatic",
    category: "concept",
    shortDefinition: "Relating to fluids at rest. In the hydrostatic limit, pressure varies only with depth: dp/dz = −ρg.",
    description: "A fluid is hydrostatic when it is at rest, or moving slowly enough that viscous and inertial forces are negligible compared to gravity. In that limit, pressure depends only on vertical position and the column of fluid above: dp/dz = −ρg, so p(z) = p_atm + ρ·g·h for depth h.\n\nThe hydrostatic equation underpins barometers, manometers, the depth-dependent pressure divers experience, and the stratified equilibrium of stars and planetary atmospheres. It fails when the fluid has significant motion — pipe flow, wind, ocean currents — where Bernoulli and Navier-Stokes take over.",
    relatedPhysicists: ["simon-stevin", "blaise-pascal"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" }],
  },
  {
    slug: "atmospheric-pressure",
    term: "Atmospheric pressure",
    category: "concept",
    shortDefinition: "The weight of the column of air above any point, at sea level ≈ 101.325 kPa or 760 mm Hg.",
    description: "Atmospheric pressure is the force per unit area exerted by the weight of the air column above a given point. At sea level the column is about 10 metres-equivalent of water — roughly 101,325 Pa, or one 'atmosphere.' It falls exponentially with altitude, halving roughly every 5.5 km.\n\nTorricelli first measured it in 1644 with a mercury barometer: a glass tube sealed at the top, inverted into a reservoir of mercury, leaves a column about 760 mm high, supported by atmospheric pressure pushing down on the reservoir. Pascal confirmed the atmospheric origin of the pressure in 1648 by sending his brother-in-law up the Puy-de-Dôme and watching the column shrink with altitude.",
    history: "First measured by Evangelista Torricelli in 1644; altitude dependence verified by Blaise Pascal's Puy-de-Dôme experiment in 1648.",
    relatedPhysicists: ["evangelista-torricelli", "blaise-pascal"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" }],
  },
  {
    slug: "bernoullis-principle",
    term: "Bernoulli's principle",
    category: "concept",
    shortDefinition: "Along a streamline in an incompressible, inviscid fluid, p + ½ρv² + ρgh is conserved.",
    description: "Bernoulli's principle is the statement, for steady incompressible inviscid flow, that along any single streamline the sum of static pressure, dynamic pressure, and hydrostatic pressure is constant: p + ½ρv² + ρgh = const. It is an energy-conservation argument for fluids: the three terms are pressure energy, kinetic energy, and gravitational potential energy per unit volume.\n\nThe practical consequence is counter-intuitive: faster-moving fluid has lower static pressure than slower-moving fluid at the same height. Blow across the top of a piece of paper and the paper lifts because the moving air has lower pressure than the still air underneath. Water through a narrowed pipe speeds up and drops in pressure — the Venturi effect. The principle contributes to airplane lift (alongside Newton's third law via downwash), to the spin of thrown baseballs, and to the suction of a perfume atomiser.",
    history: "Daniel Bernoulli published the principle in 1738 in Hydrodynamica; Euler derived it rigorously from his equations of motion in 1757.",
    relatedPhysicists: ["daniel-bernoulli", "leonhard-euler"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" }],
  },
  {
    slug: "streamline",
    term: "Streamline",
    category: "concept",
    shortDefinition: "A curve whose tangent at every point coincides with the local fluid velocity. In steady flow, streamlines are also particle paths.",
    description: "A streamline is a curve that, at every point along its length, is tangent to the velocity vector of the fluid at that point. In steady flow — where velocities do not change with time — streamlines coincide with the paths of individual fluid parcels. In unsteady flow they are instantaneous snapshots and differ from particle trajectories.\n\nStreamlines cannot cross: at any point in a fluid the velocity has a single direction, so exactly one streamline passes through. Dye injected into a flow, or smoke in a wind tunnel, visualises streamlines directly. Bernoulli's principle applies along a streamline, not between streamlines in general.",
    relatedPhysicists: ["leonhard-euler", "daniel-bernoulli"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" }],
  },
  {
    slug: "incompressible-flow",
    term: "Incompressible flow",
    category: "concept",
    shortDefinition: "Fluid motion in which density is effectively constant. Liquids, and gases at Mach ≪ 1.",
    description: "A flow is incompressible when the density of fluid parcels doesn't change measurably with pressure or motion. The continuity equation then reduces to ∇·v = 0 — velocity has zero divergence.\n\nLiquids are almost perfectly incompressible at ordinary pressures (water's density changes by 0.5% under 100 atmospheres). Gases are incompressible in practice when the flow speed is well below the speed of sound (Mach number M ≲ 0.3). Above that, density variations become significant and full compressible flow theory is needed — shock waves, sonic booms, and all the hypersonic machinery.",
    relatedPhysicists: ["daniel-bernoulli", "leonhard-euler"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" }],
  },
  {
    slug: "venturi-effect",
    term: "Venturi effect",
    category: "phenomenon",
    shortDefinition: "The drop in static pressure observed when a fluid flows through a constricted section of pipe.",
    description: "When a fluid flows through a pipe that narrows and then widens, the continuity equation forces the velocity up in the narrow section: A₁v₁ = A₂v₂. Bernoulli's principle then says that the static pressure must drop there to conserve energy: p + ½ρv² = const. The combined result — faster flow, lower pressure at the throat — is the Venturi effect, first measured by Giovanni Battista Venturi in 1797.\n\nThe effect is used in flow meters (the Venturi meter directly reads flow rate from the pressure drop), in carburetors (the throat draws in fuel), in aspirators, in Bunsen burners, and in the narrowed throat of a jet engine's turbine stage.",
    history: "Discovered and quantified by Giovanni Battista Venturi in his 1797 memoir on the lateral communication of motion in fluids.",
    relatedPhysicists: ["giovanni-venturi", "daniel-bernoulli"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" }],
  },
  {
    slug: "viscosity",
    term: "Viscosity",
    category: "concept",
    shortDefinition: "A fluid's internal resistance to shear. For Newtonian fluids, shear stress = η·(du/dy). Unit: Pa·s.",
    description: "Viscosity is the internal friction of a flowing fluid. In a Newtonian fluid, the shear stress between two layers of fluid is proportional to the velocity gradient across them: τ = η·du/dy. The constant η is the dynamic viscosity, with SI units of Pa·s.\n\nWater at 20 °C has a viscosity of about 1 mPa·s; air is about 18 μPa·s; honey is around 10 Pa·s — ten thousand times more viscous than water. Viscosity depends strongly on temperature: liquid viscosity decreases as you heat it (molecules slip past each other more easily), while gas viscosity increases (faster thermal motion transfers more momentum between layers).",
    relatedPhysicists: ["isaac-newton", "jean-poiseuille", "george-gabriel-stokes"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" }],
  },
  {
    slug: "reynolds-number",
    term: "Reynolds number",
    category: "concept",
    shortDefinition: "Dimensionless ratio Re = ρvL/η of inertial to viscous forces. Re ≪ 1: creeping flow. Re ≫ 1: turbulent.",
    description: "The Reynolds number is the dimensionless ratio Re = ρvL/η, where ρ is the fluid density, v a characteristic velocity, L a characteristic length, and η the dynamic viscosity. It measures the relative importance of inertial forces to viscous forces in a flow.\n\nFor Re ≪ 1, viscosity dominates: flow is laminar, reversible, and governed by the Stokes equations. Bacteria, dust in still air, and blood in fine capillaries live here. For Re ≫ 1, inertia dominates: flow becomes turbulent, irreversible, and chaotic. Swimming fish, rivers, and airliners live here. The transition is gradual but historically pinned near Re ≈ 2300 for pipe flow, the value Osborne Reynolds established in his 1883 dye experiment.",
    history: "Introduced by Osborne Reynolds in 1883; generalised and popularised across all flow geometries over the following decades.",
    relatedPhysicists: ["osborne-reynolds"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
    ],
  },
  {
    slug: "laminar-flow",
    term: "Laminar flow",
    category: "concept",
    shortDefinition: "Orderly flow in parallel layers, without mixing across them. Characteristic of low Reynolds number.",
    description: "In laminar flow, fluid moves in smooth parallel layers with negligible exchange between them. The velocity profile is steady, reversible, and predictable. In a straight pipe, laminar flow produces the parabolic Poiseuille profile, with zero velocity at the walls and maximum on the axis.\n\nLaminar flow is the norm at low Reynolds number: thick syrup pouring, blood in capillaries, air over a slowly-flapping wing. Above the critical Re, small perturbations grow and the flow becomes turbulent.",
    relatedPhysicists: ["jean-poiseuille", "osborne-reynolds"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" }],
  },
  {
    slug: "poiseuille-flow",
    term: "Poiseuille flow",
    category: "phenomenon",
    shortDefinition: "Steady laminar flow through a cylindrical pipe driven by a pressure drop. Volumetric flow rate Q = πR⁴Δp/(8ηL).",
    description: "Poiseuille flow is the steady laminar motion of a Newtonian fluid through a straight cylindrical pipe driven by a pressure gradient. The velocity profile is parabolic: zero at the wall, maximum on the axis, with u(r) = (Δp/(4ηL))·(R² − r²). Integrating gives the volumetric flow rate Q = πR⁴·Δp/(8ηL).\n\nThe fourth-power dependence on radius is the headline: a 10% reduction in a blood vessel's radius produces a 34% drop in flow rate. This is why vasoconstriction is such a strong lever for blood pressure, and why calcified arteries are so much more dangerous than they seem.",
    history: "Jean Poiseuille published the experimental law in 1840; Hagen had reached similar conclusions in Germany in 1839, hence the occasional 'Hagen-Poiseuille equation.' The theoretical derivation from Newton's viscosity ansatz came from Stokes later.",
    relatedPhysicists: ["jean-poiseuille"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" }],
  },
  {
    slug: "newtonian-fluid",
    term: "Newtonian fluid",
    category: "concept",
    shortDefinition: "A fluid whose shear stress is strictly proportional to its velocity gradient, with viscosity independent of shear rate.",
    description: "A Newtonian fluid obeys τ = η·du/dy exactly, with η a constant that depends on temperature and pressure but not on the shear rate itself. Water, air, most gases, olive oil, honey, and liquid metals are all Newtonian across their normal operating ranges.\n\nNon-Newtonian fluids don't. Ketchup and toothpaste are shear-thinning (yield stress plus pseudoplasticity); cornstarch slurry is shear-thickening (viscosity rises under stress, letting you literally run across a pool of it); polymer melts and blood are both viscoelastic. Non-Newtonian fluid mechanics is a substantially larger and harder subject.",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" }],
  },
  {
    slug: "turbulence",
    term: "Turbulence",
    category: "phenomenon",
    shortDefinition: "Fluid motion organised into nested vortices across a vast range of scales. The last unsolved problem of classical physics.",
    description: "Turbulence is the chaotic, eddy-rich state of flow that dominates at high Reynolds number. It is characterised by nested whorls of motion, from the largest scale set by the flow geometry down to the viscous dissipation scale, and by rapid mixing, diffusion, and dissipation of energy.\n\nIt is the default state of almost every flow that matters at human scales: atmosphere, ocean, rivers, pipe flow above Re ≈ 2300, aircraft wakes, stellar interiors. And it is unsolved in the deepest sense. The Navier-Stokes equations describe it exactly, but we cannot even prove those equations always have smooth solutions in three dimensions — that is a Millennium Prize Problem. Kolmogorov gave the universal scaling of the inertial range in 1941, but a full theory of turbulence remains out of reach eighty years later.",
    relatedPhysicists: ["claude-louis-navier", "george-gabriel-stokes", "lewis-fry-richardson", "andrey-kolmogorov"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "turbulence" }],
  },
  {
    slug: "navier-stokes-equations",
    term: "Navier-Stokes equations",
    category: "concept",
    shortDefinition: "The PDEs governing viscous fluid flow. Nonlinear, exact, and generally unsolved — smoothness in 3D is a Millennium Problem.",
    description: "The Navier-Stokes equations describe the motion of a viscous Newtonian fluid, combining Newton's second law (mass × acceleration = sum of forces) with the viscous stress tensor implied by the velocity gradient. In vector form for an incompressible fluid: ρ(∂v/∂t + v·∇v) = −∇p + η∇²v + f.\n\nThe first term on the left is the convective acceleration (the nonlinearity that makes turbulence hard); on the right we have pressure gradient, viscous diffusion, and external body forces. Combined with the continuity equation ∇·v = 0, they are the equations of all fluid mechanics at continuum scales.\n\nProving that smooth initial conditions always produce smooth solutions in three dimensions is one of the seven Millennium Prize Problems posted by the Clay Institute in 2000. A positive answer would be a major contribution to turbulence theory; a negative answer (a blow-up in finite time) would be physically extraordinary.",
    history: "First written by Claude-Louis Navier in 1822 from a molecular-mechanics argument. George Stokes re-derived them from continuum mechanics in the 1840s.",
    relatedPhysicists: ["claude-louis-navier", "george-gabriel-stokes"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "turbulence" }],
  },
  {
    slug: "vortex",
    term: "Vortex",
    category: "concept",
    shortDefinition: "A coherent region of swirling fluid — the basic building block of turbulent and near-turbulent flow.",
    description: "A vortex is a region of fluid in which the flow rotates around an axis, either straight or curved. The simplest vortex is a rigid-body rotor, with velocity linearly proportional to distance from the axis. More realistic is the Rankine vortex, with solid-body rotation inside a core radius and potential (1/r) flow outside.\n\nVortices shed from moving objects at intermediate Reynolds number produce the Kármán vortex street behind a cylinder, the wingtip vortices of aircraft, and the cyclones and anticyclones of the atmosphere. At high Reynolds number, vortices nest at every scale — Richardson's cascade — and their statistics obey Kolmogorov's −5/3 law.",
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "turbulence" }],
  },
  {
    slug: "energy-cascade",
    term: "Energy cascade",
    category: "phenomenon",
    shortDefinition: "Richardson's picture: energy injected at large scales is handed down, eddy by eddy, to smaller scales until viscosity dissipates it as heat.",
    description: "In turbulent flow, energy enters at the large scales (driven by pumps, winds, stirrers, boundary conditions) and exits at the small viscous dissipation scale as heat. The intermediate region — the inertial range — is a cascade: large eddies break up into smaller eddies, which break up into still smaller ones, with energy handed down the ladder at a constant rate ε.\n\nThe picture was put into verse by Lewis Fry Richardson in 1922 and made quantitative by Kolmogorov in 1941. Kolmogorov's dimensional argument says the spectrum of kinetic energy E(k) in the inertial range must scale as ε^(2/3) k^(−5/3). Experimentally the law holds across many decades of k in everything from wind-tunnel turbulence to the atmospheric boundary layer to astrophysical plasmas.",
    history: "Pictured by Richardson in 1922; quantified by Kolmogorov in 1941.",
    relatedPhysicists: ["lewis-fry-richardson", "andrey-kolmogorov"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "turbulence" }],
  },
  {
    slug: "kolmogorov-spectrum",
    term: "Kolmogorov spectrum",
    category: "phenomenon",
    shortDefinition: "E(k) ∝ ε^(2/3) k^(−5/3) — the universal inertial-range energy spectrum of fully developed turbulence.",
    description: "The Kolmogorov spectrum describes how kinetic energy is distributed across spatial scales in fully developed turbulence. For wavenumbers k in the inertial range — between the large driving scale and the small viscous dissipation scale — the energy density per unit wavenumber scales as E(k) ∝ ε^(2/3) k^(−5/3), where ε is the rate at which energy cascades through the range.\n\nPlotted on log-log axes, it is a straight line with slope −5/3. The scaling comes from pure dimensional analysis: energy dissipation rate ε has units of m²/s³ and wavenumber k has units of 1/m, and the only combination that gives energy per unit wavenumber is ε^(2/3)·k^(−5/3). Kolmogorov's insight was recognising that dimensional analysis alone would work if you restricted attention to the inertial range. Measured ever since, the −5/3 slope is one of the most robustly-confirmed predictions in all of classical physics.",
    history: "Derived by Andrey Kolmogorov in 1941, in a sequence of three papers written while the Soviet academy was evacuated from Moscow.",
    relatedPhysicists: ["andrey-kolmogorov"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "turbulence" }],
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
