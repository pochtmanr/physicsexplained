// Seed EM §06 Circuits + §07 Maxwell's equations (5 physicists + 29 glossary terms + 3 forward-ref placeholders).
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-em-04.ts
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
    slug: "gustav-kirchhoff",
    name: "Gustav Robert Kirchhoff",
    shortName: "Kirchhoff",
    born: "1824",
    died: "1887",
    nationality: "German",
    oneLiner: "Königsberg-born physicist who, at twenty-one, formulated the node and loop laws of circuit analysis; later co-invented spectroscopy and wrote down the law of thermal radiation that Planck would quantise in 1900.",
    bio: `Gustav Robert Kirchhoff was born in Königsberg in 1824, the son of a law counsellor to the Prussian court. The university in Königsberg was then the most mathematically intense in the German-speaking world — Jacobi had taught there, Neumann was still teaching there — and Kirchhoff was exactly the kind of child the place ate for breakfast. He entered as a seventeen-year-old, took a doctorate at twenty-three, and in between, as an undergraduate, wrote a paper so complete it is still the first thing every electrical engineering student learns. In 1845 he published the two rules now called Kirchhoff's laws: the sum of currents into any node is zero, and the sum of voltage drops around any closed loop is zero. Conservation of charge and conservation of energy, restated for wires. Ohm had given V = IR in 1827 but couldn't handle networks — combinations of resistors with multiple loops defeated his arithmetic. Kirchhoff's two sentences turned any schematic, however tangled, into a system of linear equations a schoolchild could solve. It was the paper a first-year student writes the week before their exam, except he was *doing the research*, not the exam.

After Königsberg he moved to Berlin, then to Breslau, then in 1854 to Heidelberg where he met Robert Bunsen and the second half of his life began. Bunsen had just invented the Bunsen burner — a clean, nearly colourless flame — and wanted to use it to measure how metals vaporised in a flame. Kirchhoff suggested decomposing the flame's light through a prism. The combined instrument, the *Bunsen–Kirchhoff spectroscope*, turned out to do more than identify metals: it made *spectroscopy* a discipline. Each element, they showed in 1859, emits a unique pattern of bright lines when heated, and absorbs the same pattern when light is passed through its cool vapour. Within months they had used the method to discover two new elements (caesium 1860, rubidium 1861) by finding spectral lines that matched nothing known. Then Kirchhoff did the deeper thing: he pointed the spectroscope at the sun, matched the dark Fraunhofer lines in sunlight against his list of element-emission patterns, and showed that the sun contains sodium, iron, calcium, nickel. He had effectively performed chemical analysis on a star. The paper founded astrophysics.

But the move that echoes loudest was his 1859 *law of thermal radiation*: in thermodynamic equilibrium, the ratio of emission to absorption of a surface at any wavelength depends only on temperature, not on the surface itself. An idealised perfect absorber — a *black body* — therefore has a universal, temperature-only emission spectrum that any theory of radiation must reproduce. He could not calculate the spectrum himself. But he posed the problem so sharply that for forty years it became *the* open question of theoretical physics. Planck solved it in 1900 by quantising the oscillators, and the whole of twentieth-century physics unfolded from that solution. Kirchhoff had been dead for thirteen years by then. In his final years he had been confined to a wheelchair after a serious railway accident damaged both his legs; he gave his last Berlin lectures from it and died in 1887. He is the quietest of the nineteenth-century giants: no personal flamboyance, no fights, no cult — just four exact results, each one load-bearing for everything that came after.`,
    contributions: [
      "Formulated Kirchhoff's circuit laws (1845) at twenty-one: current conservation at nodes and voltage conservation around loops, the foundation of all network analysis",
      "Co-invented spectroscopy with Bunsen (1859) and discovered caesium (1860) and rubidium (1861) by their spectral signatures",
      "Identified sodium, iron, calcium, nickel, and dozens of other elements in the sun's atmosphere by matching absorption lines to laboratory emission patterns — founded astrophysics",
      "Stated the law of thermal radiation (1859): emission/absorption ratio depends only on temperature — posed the black-body problem that Planck's 1900 quantisation would solve",
      "Derived the speed of telegraph signals along a wire (with Weber, 1857), finding it close to the speed of light — an early hint of electromagnetic waves a decade before Maxwell",
    ],
    majorWorks: [
      "Ueber den Durchgang eines elektrischen Stromes durch eine Ebene, insbesondere durch eine kreisförmige (1845) — the Kirchhoff laws paper, written as a student",
      "Chemische Analyse durch Spectralbeobachtungen (1860) — with Bunsen; the foundational paper of spectroscopy",
      "Untersuchungen über das Sonnenspectrum und die Spectren der chemischen Elemente (1861–1863) — matching solar Fraunhofer lines to laboratory elements",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
      { branchSlug: "electromagnetism", topicSlug: "rlc-circuits-and-resonance" },
    ],
  },
  {
    slug: "georg-ohm",
    name: "Georg Simon Ohm",
    shortName: "Ohm",
    born: "1789",
    died: "1854",
    nationality: "Bavarian",
    oneLiner: "Bavarian schoolteacher who in 1827 measured the linear relation V = IR between voltage, current, and resistance — and was rejected by the German physics establishment for being 'too mathematical.'",
    bio: `Georg Simon Ohm was born in Erlangen in 1789, the son of a self-educated locksmith. His father had taught himself mathematics out of books and drilled it into both his sons at home; neither received the elite university-track education of their peers, but both came out of adolescence fluent in the calculus of their century — a preparation that placed them, quietly, ahead of most of their professorial contemporaries. Georg taught school in Bamberg, Cologne, and finally Berlin: a succession of underpaid Gymnasium posts where he spent evenings doing experiments on the side. The place he did his most important work was a *Gymnasium in Cologne* — a secondary school — because no German university would hire him.

Between 1825 and 1827 he built a torsion-balance galvanometer of his own design, precise enough to detect tiny currents and calibrated against magnetic deflection. He drove currents through wires of precisely measured length and cross-section, each wire connected to a voltaic pile whose EMF he controlled by varying the number of cells. Systematically, patiently, he measured the current as a function of wire length, wire thickness, and applied voltage. The pattern that fell out was brutally simple: for a given conductor, current is proportional to voltage, and the proportionality constant — what he called the *resistance* — is intrinsic to the wire, scaling linearly with length and inversely with cross-section. He wrote it all up in 1827 in *Die galvanische Kette, mathematisch bearbeitet* — "The galvanic circuit, investigated mathematically" — a book that was part experiment, part mathematical theory of electrical conduction. Every electrical engineer in the world still uses the three letters of that result: V = IR.

The book was received coldly, and the story from here is a parable about what German academic physics in the 1820s valued. *Annalen der Physik* published a hostile review. The reigning figures of Berlin natural philosophy — a school more interested in "facts" and *Naturphilosophie* than in mathematical models — dismissed Ohm's work as "unphysical speculation." His own Prussian education ministry demanded he resign his Cologne teaching post for "false doctrine." He spent the next fifteen years in professional exile, scraping by on private tutoring and temporary research assistantships, unable to secure a stable academic position in Germany. The rescue came from abroad: in 1841 the Royal Society of London awarded him the Copley Medal — the highest scientific honour in the world, previously given to Faraday, Ampère, and Berzelius — and cited his voltage-current work as "the most important contribution to electrical physics since Volta." That single act of international recognition restored Ohm to legitimacy in the German-speaking world. He was finally appointed to a chair at Munich in 1852, two years before his death. The SI unit of resistance, one ohm (Ω), was named in his honour in 1881. The shape of the story is the classic one: an idea so obvious in hindsight that the hindsight itself takes decades to arrive.`,
    contributions: [
      "Discovered Ohm's law (1827): V = IR — current is proportional to voltage, with resistance as a geometry-and-material constant",
      "Built torsion-balance galvanometers precise enough to detect sub-milliampere currents decades before commercial instruments",
      "Showed that resistance of a wire scales linearly with length and inversely with cross-section, defining the concept of *resistivity*",
      "Published *Die galvanische Kette, mathematisch bearbeitet* (1827), the first mathematical theory of electrical conduction in metals",
      "Endured fifteen years of professional exile for the 'offence' of using mathematics to describe electricity; restored by the Royal Society's 1841 Copley Medal",
    ],
    majorWorks: [
      "Die galvanische Kette, mathematisch bearbeitet (1827) — the founding statement of Ohm's law and the theory of resistance in metals",
      "Bestimmung des Gesetzes, nach welchem Metalle die Contaktelektricität leiten (1826) — the preliminary experimental paper in *Schweigger's Journal*",
      "Grundzüge der Physik (1853–1854) — late-career German physics textbook; Ohm's final published work, finished just before his death",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "oliver-heaviside",
    name: "Oliver Heaviside",
    shortName: "Heaviside",
    born: "1850",
    died: "1925",
    nationality: "English",
    oneLiner: "Self-taught English telegraph engineer who reduced Maxwell's twenty quaternion equations to the modern four vector equations, invented operational calculus, impedance, and the telegrapher's equations — all while living in deliberate poverty in Torquay.",
    bio: `Oliver Heaviside was born in Camden Town, London, in 1850, the youngest of four sons in a family that had the formal trappings of respectability but not the income. His father was a wood-engraver and watercolourist who made ends meet teaching drawing; his mother had been a governess. Scarlet fever left Oliver partially deaf as a child, socially isolated, contemptuous of the schoolteachers who confused ignorance with stupidity. He left school at sixteen, self-educated the rest of his life. At eighteen he took a job as a telegraph operator for the Great Northern Telegraph Company, handling cross-Channel cable traffic at the Newcastle end of the Anglo–Danish line. The work was the apprenticeship for everything that followed: cables were then the bleeding edge of electrical engineering, transmission-line physics was the dominant practical problem of the era, and Heaviside spent his evenings reading Maxwell's *Treatise on Electricity and Magnetism* (1873), which he taught himself from the pages.

From 1874 onward, working alone in an unheated room of his brother's house in Newcastle, then later in Paignton and finally Torquay, Heaviside rewrote nearly the entire theory of electromagnetism. Maxwell's original formulation had used the quaternions then fashionable at Cambridge: twenty scalar equations involving the bizarre non-commutative quaternion product. By 1885 Heaviside (independently and roughly simultaneously with Josiah Willard Gibbs in America) had abandoned quaternions for a much cleaner system — what we now call *vector calculus*, with ∇·, ∇×, and ∇ — and had reduced Maxwell's twenty equations to the four vector equations every physics student learns today. In the same years he invented the concept of *impedance* (1886, the complex generalisation of resistance to AC circuits), the telegrapher's equations (1876–1892, which showed that loaded inductive cables transmitted signals cleanly while ordinary cables distorted them — a practical result that made trans-Atlantic telephony possible), and *operational calculus* (a shorthand for solving differential equations by treating d/dt as an algebraic symbol *p*, which later became the Laplace transform as mathematicians filled in the rigour). He predicted in 1902 that the upper atmosphere contained an ionised layer capable of reflecting radio waves — what we now call the Heaviside–Kennelly layer, confirmed experimentally in the 1920s and the reason long-wave radio could go around the curve of the Earth.

He was outside the academic system entirely. The Cambridge professors who initially dismissed his work as "unrigorous" eventually realised he had been right about nearly everything, and offered him fellowships and medals. He refused most of them. When the Royal Society awarded him the Faraday Medal in 1922, he accepted, then refused to attend the ceremony. He lived his last decades in voluntary poverty in a small house in Torquay, writing mathematical manuscripts in the margins of old newspapers, quarrelling in print with engineers who had reinvented his own results without citation, and keeping up a correspondence with Einstein, Kelvin, Lodge, and FitzGerald. In early 1925 his landlady, having not seen him for several days, entered his room and found him dead of injuries from a fall. The modern form of Maxwell's equations — every ∇× and ∇· that has appeared on every electromagnetism blackboard since — is Oliver Heaviside's. He is the reason they fit on a T-shirt.`,
    contributions: [
      "Reduced Maxwell's 20-equation quaternion formulation to the modern 4 vector equations (1884–1885), independently of and contemporaneously with Gibbs",
      "Invented operational calculus (1880s) — the algebraic treatment of d/dt as an operator — later formalised as the Laplace transform",
      "Introduced the concept of impedance (1886) as the complex generalisation of resistance to AC circuits",
      "Derived the telegrapher's equations for transmission lines (1876–1892) and showed that inductive loading could produce distortion-free cables",
      "Predicted the Heaviside–Kennelly ionospheric layer (1902) that reflects long-wave radio back to Earth, enabling long-distance wireless",
    ],
    majorWorks: [
      "Electrical Papers (1892, 2 vols) — collected papers on cable theory, operational calculus, and electromagnetic theory",
      "Electromagnetic Theory (1893–1912, 3 vols) — the systematic book-length exposition of vector electromagnetism and operational calculus",
      "On the Electromagnetic Effects due to the Motion of Electrification through a Dielectric (1888) — early analysis of fields around moving charges, anticipating relativity-era results",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
    ],
  },
  {
    slug: "james-clerk-maxwell",
    name: "James Clerk Maxwell",
    shortName: "Maxwell",
    born: "1831",
    died: "1879",
    nationality: "Scottish",
    oneLiner: "Scottish physicist who unified electricity and magnetism into four equations, derived the speed of light from electric and magnetic constants alone, and in doing so revealed that light is an electromagnetic wave.",
    bio: `James Clerk Maxwell was born in Edinburgh in 1831 to a family of Scottish landed gentry whose country seat, Glenlair, sat in the Galloway hills of Kirkcudbrightshire. His mother died of abdominal cancer when he was eight — the same disease would take him at forty-eight. He was a quick, curious child, already publishing a mathematical paper on oval curves at fourteen (submitted to the Royal Society of Edinburgh by a family friend because the society's rules forbade submissions from minors). Edinburgh University at sixteen, Cambridge at nineteen, where he took the Second Wrangler place in the 1854 Mathematical Tripos and won the Smith's Prize the same year. The Cambridge exam system graded only speed and accuracy, not depth, and Maxwell's habit of thinking slowly and deeply cost him the top wrangler position to a student who ground through the exams faster; the wrangler who beat him has left essentially no trace on the history of physics.

His first great piece of work, the 1857 Adams Prize essay, resolved the two-century puzzle of Saturn's rings. Laplace had argued they must be a solid disc; Maxwell showed, with painstaking stability analysis, that a solid disc would shatter under its own self-gravity and that the rings had to be a swarm of separate particles. The paper did more than settle the astronomical question; it displayed a physical method — mechanical modelling, stability analysis, reasoning from first principles to a result that could be checked observationally — that became Maxwell's signature approach. He applied it next to the kinetic theory of gases, deriving in 1859 the Maxwell distribution of molecular speeds — the first non-trivial application of statistical mechanics, done years before Boltzmann's related work. The distribution underlies thermal physics and chemistry to this day.

Then came the electromagnetism. Faraday's experimental work of the 1830s and 1840s had produced a picture — lines of force, induction, the interpenetration of electric and magnetic effects — that nobody had yet captured mathematically. Maxwell spent the late 1850s and early 1860s translating Faraday's pictures into equations, proceeding stage by stage: "On Faraday's Lines of Force" (1855), "On Physical Lines of Force" (1861–1862, introducing the displacement-current term), and the decisive paper "A Dynamical Theory of the Electromagnetic Field" (1865). That paper laid out twenty coupled partial differential equations for the electric and magnetic fields, incorporating the new displacement-current term he had proposed in 1861. The equations predicted transverse electromagnetic waves propagating through vacuum at a speed calculable from purely electric and magnetic measurements: c = 1/√(ε₀μ₀). The numerical value — derived from laboratory measurements of electrostatic and magnetostatic units — came out to 310,740,000 metres per second, in agreement with Fizeau's 1849 optical measurement of the speed of light. "This velocity is so nearly that of light," Maxwell wrote, "that it seems we have strong reason to conclude that light itself is an electromagnetic disturbance." It was one of the great deductive reveals in the history of science: electricity, magnetism, and optics all the same thing, deducible from four experimentally-grounded equations. His *Treatise on Electricity and Magnetism* (1873) systematised the whole theory. In 1871 he was appointed the first Cavendish Professor at Cambridge, building from scratch the laboratory that would later host J. J. Thomson's discovery of the electron and Watson and Crick's double helix. He died in Cambridge in 1879 of abdominal cancer, aged forty-eight. He is ranked among Newton and Einstein as one of the three supreme theoretical physicists.`,
    contributions: [
      "Formulated the four equations of electromagnetism (1865, with displacement-current term introduced in 1861), unifying electricity, magnetism, and optics",
      "Derived the speed of light c = 1/√(ε₀μ₀) from measurements of purely electric and magnetic constants — the first prediction that light is an electromagnetic wave",
      "Published the Maxwell distribution of molecular speeds (1859), a founding result of kinetic theory and statistical mechanics",
      "Resolved the structure of Saturn's rings (1857) by stability analysis, proving they must be swarms of particles rather than a solid disc",
      "First Cavendish Professor of Experimental Physics at Cambridge (1871), founding the laboratory that dominated twentieth-century British physics",
    ],
    majorWorks: [
      "A Dynamical Theory of the Electromagnetic Field (1865) — the founding paper of electromagnetism with the displacement current, deriving c from ε₀ and μ₀",
      "A Treatise on Electricity and Magnetism (1873) — two-volume book-length exposition, the definitive presentation of Maxwell's theory before Heaviside's vector recasting",
      "Illustrations of the Dynamical Theory of Gases (1859–1867) — the Maxwell distribution and the foundations of the kinetic theory",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "displacement-current" },
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "john-henry-poynting",
    name: "John Henry Poynting",
    shortName: "Poynting",
    born: "1852",
    died: "1914",
    nationality: "English",
    oneLiner: "English physicist who showed in 1884 that S = (1/μ₀)·E×B gives the direction and magnitude of energy flow in the electromagnetic field — closing the bookkeeping of Maxwell's theory and naming the vector that still underwrites every antenna, optical fibre, and solar cell.",
    bio: `John Henry Poynting was born in 1852 in Monton, Lancashire, the son of a Unitarian minister. The Unitarian background mattered: dissenting families in Victorian England were locked out of Oxford and Cambridge until 1871, so educated Unitarians sent their sons to the new non-denominational colleges that were springing up to serve exactly their demographic. Poynting went to Owens College in Manchester, the institution that would later become the University of Manchester, where he took his first degree under James Joule's former colleague Balfour Stewart. Only after the university-tests reform did he move to Trinity College Cambridge in 1872. He placed Third Wrangler in the 1876 Mathematical Tripos, a high placement in the toughest mathematics exam in the world; he also took the advanced Natural Sciences Tripos the same year. His Cambridge tutor was James Clerk Maxwell, then the Cavendish Professor — a direct teacher–student link that would shape the rest of his career.

Poynting's central result came in 1884 in a paper titled *"On the Transfer of Energy in the Electromagnetic Field,"* published in the *Philosophical Transactions of the Royal Society.* Maxwell's equations, as of 1873, said how fields evolved, but the question of where field energy *flowed* — whether it had a direction, whether one could point at a cross-section of space and ask how many joules per second were crossing it — had no clean answer. Poynting supplied it. He started with the field energy densities (½ε₀E² + B²/2μ₀), took their time derivative, applied Maxwell's equations to eliminate ∂E/∂t and ∂B/∂t, and found that the rate of change came out to −∇·S − J·E, where S = (1/μ₀)·E×B. The interpretation was immediate: energy flows across a surface at a rate S·n̂ per unit area, E·J is the rate at which the field does work on matter, and the total is conserved. S is now called the *Poynting vector*, and the entire statement is the *Poynting theorem*. The paper closed a loose end that Maxwell had left open, and showed — strikingly — that the electrical energy in a resistor does not come "along the wire" but flows in from the surrounding field, perpendicular to the wire, from the power supply via the space between the conductors. Every radio antenna, every optical fibre, every solar cell, every wireless charging pad reasons about energy using Poynting's S.

Poynting spent his whole career at Mason Science College in Birmingham (founded 1880, later reorganised as the University of Birmingham 1900, where he became the first professor of physics). He was a quiet, unflashy, scrupulous experimentalist whose non-electromagnetic work included the most precise 1890s measurement of Newton's gravitational constant G (using the common-balance method, a technique of measuring the tiny deflection of a sensitive balance by a massive lead ball nearby — Poynting's value was within 0.2% of the modern accepted value) and a 1903 calculation of how sunlight's radiation pressure drags on interplanetary dust, an effect now called the *Poynting–Robertson effect* that explains why the zodiacal cloud exists at all. His personal life was happy, his temperament mild, and he left behind a generation of Birmingham students who remembered him warmly. He died in 1914 shortly before the First World War, of complications from diabetes. The Poynting Medal of the University of Birmingham, awarded today in theoretical and experimental physics, is named for him.`,
    contributions: [
      "Derived the Poynting theorem (1884) — energy conservation for the electromagnetic field with S = (1/μ₀)·E×B as the energy-flux density",
      "Showed that field energy flows through the space between conductors, not along the wire itself, reshaping the physical picture of circuit energy transfer",
      "Measured Newton's gravitational constant G via common balance (1891), producing one of the best pre-modern values for G",
      "Calculated the Poynting–Robertson effect (1903): solar radiation pressure drags small dust particles into the sun over astronomical timescales",
      "First professor of physics at the University of Birmingham (1900–1914), where he founded the experimental physics tradition that continues today",
    ],
    majorWorks: [
      "On the Transfer of Energy in the Electromagnetic Field (1884) — the founding paper of the Poynting vector and energy conservation in Maxwell's theory",
      "On a Determination of the Mean Density of the Earth (1891) — common-balance G measurement, a landmark in experimental gravitation",
      "Radiation in the Solar System: its Effect on Temperature and its Pressure on Small Bodies (1903) — the paper establishing what would become the Poynting–Robertson effect",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "ohms-law-term",
    term: "Ohm's law",
    category: "concept",
    shortDefinition: "V = IR. For a metallic conductor at fixed temperature, the current through it is proportional to the voltage across it, with the proportionality constant R being the resistance.",
    description: `Ohm's law is the linear relation between current and voltage in metallic conductors: V = IR, where V is the potential difference across the conductor in volts, I is the current through it in amperes, and R is a geometry-and-material constant called the *resistance* in ohms. Ohm measured it in 1827 with torsion-balance galvanometers of his own design, and it remains the first equation every electrical engineer ever writes down. The law is not a fundamental principle — it is an empirical statement that happens to hold for most metals at ordinary temperatures and modest currents, with violations appearing in semiconductors, electrolytes, vacuum tubes, and any conductor pushed hard enough to matter.

The microscopic explanation came only in 1900 with Drude's free-electron model: electrons in a metal are accelerated by the applied electric field, scatter off lattice vibrations and defects with mean free time τ, and settle into a drift velocity v_d = eEτ/m. The current density J = nev_d = (ne²τ/m)E is then proportional to E with conductivity σ = ne²τ/m, which is Ohm's law at the microscopic level (J = σE). The linearity is a direct consequence of the fact that v_d depends linearly on E, which in turn depends on the field being small enough that the scattering time τ is essentially field-independent. Push the field high enough (say, by driving very large currents or approaching breakdown voltages) and τ itself becomes field-dependent, and the material becomes nonlinear.

Ohm's law defines the concept of *resistivity*, a material property ρ such that R = ρℓ/A for a wire of length ℓ and cross-section A. Resistivity is what a materials scientist measures; resistance is what an engineer reads off a meter. At room temperature, ρ ≈ 1.7 × 10⁻⁸ Ω·m for copper, 2.7 × 10⁻⁸ for aluminium, 10⁻⁵ for nichrome (heating elements), and as small as you can detect in a superconductor. The law's practical consequence — that networks of conductors obey linear algebra — is what makes Kirchhoff's two sentences from 1845 enough to solve any DC circuit by hand.`,
    history: `Georg Ohm published the linear V–I relation in his 1827 book *Die galvanische Kette, mathematisch bearbeitet*. The book was received with hostility in Germany — "unphysical speculation" was the standard verdict — and he lost his teaching post. Fifteen years later the Royal Society awarded him the Copley Medal, and the German academic establishment reversed course. The SI unit of resistance was named the *ohm* in 1881. The Drude model gave the microscopic picture in 1900; it is still the standard undergraduate explanation, though modern treatments use the Boltzmann transport equation instead.`,
    relatedPhysicists: ["georg-ohm"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "resistance",
    term: "Resistance",
    category: "concept",
    shortDefinition: "The ratio R = V/I for a conductor obeying Ohm's law. Measured in ohms (Ω). Determined by the conductor's geometry (R = ρℓ/A) and material resistivity ρ.",
    description: `Resistance R is the proportionality constant between voltage and current in a conductor, R = V/I, measured in ohms (1 Ω = 1 V/A). For a uniform wire of length ℓ and cross-section A made of a material with resistivity ρ, the resistance is R = ρℓ/A — longer wires resist more, thicker wires resist less, and the material sets the prefactor.

Resistance also controls how much electrical energy a conductor dissipates as heat. The power dissipated is P = VI = I²R = V²/R, measured in watts. This is called *Joule heating*, and it is the mechanism behind every resistive heater, light bulb filament, kitchen toaster, and space heater. In most circuits it is a loss to be minimised (through low-R conductors); in heating elements it is the design goal (through high-ρ materials like nichrome, chosen to reach red-hot temperatures without oxidising).

Typical values span thirteen orders of magnitude: a 30 cm length of heavy copper wire, about 10⁻³ Ω; a room-temperature 1 kΩ resistor, 10³ Ω; a dry human body between hand and foot, about 10⁵ Ω; a glass insulator, 10¹⁰ Ω or higher. Resistance depends weakly on temperature for most metals (about +0.4% per °C for copper), strongly on temperature for semiconductors (often decreasing by decades as the material warms), and drops to exactly zero in superconductors below their critical temperature.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "resistor",
    term: "Resistor",
    category: "instrument",
    shortDefinition: "A two-terminal passive electrical component designed to present a specific resistance to current flow. Values range from milliohms to gigaohms; tolerances from 10% to 0.01%.",
    description: `A resistor is the simplest electrical component: a two-terminal device whose sole purpose is to obey Ohm's law with a specific, known, stable value of R. Resistors set bias currents, divide voltages, pull logic lines to well-defined states, absorb unwanted energy in circuit loads, and convert current to measurable voltage drops for signal acquisition.

The three common constructions tell the story. *Carbon-film* resistors, a thin layer of carbon-composite vapour-deposited onto a ceramic rod, cover 1 Ω to 10 MΩ at 5% tolerance for pennies apiece — the cheap general-purpose type. *Metal-film* resistors, with the carbon replaced by vapour-deposited nichrome or similar, push tolerance to 0.1% or better and noise to very low levels — the choice for precision analogue circuits and instrumentation. *Wire-wound* resistors, where a precise length of resistance wire is wound around a ceramic former, handle high power dissipation (tens to hundreds of watts) for dummy-load, motor-starting, and braking applications.

Every resistor is marked with its value (either color bands or printed digits), its tolerance (the worst-case deviation from the nominal), and its power rating (the maximum I²R it can sustain without burning up). Push a resistor past its rating and it becomes a one-shot fuse. Specialised variants include *potentiometers* (adjustable resistors with a sliding contact, for volume knobs and calibration trims), *thermistors* (resistance varies strongly with temperature, for temperature sensing), and *varistors* (resistance drops sharply above a threshold voltage, for surge suppression). All are two-terminal descendants of the same Ohm's-law principle.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "kirchhoff-voltage-law",
    term: "Kirchhoff's voltage law (KVL)",
    category: "concept",
    shortDefinition: "The sum of voltage drops around any closed loop in a circuit equals zero. Equivalently: the electrostatic field is conservative, ∮E·dℓ = 0 in the quasi-static limit.",
    description: `Kirchhoff's voltage law says that if you walk around any closed loop in a circuit, adding up the voltage drops across each component you pass through, the total is zero. Stated symbolically: ∑ V_k = 0 around any loop. It is conservation of energy for the circuit: the work done per unit charge to move once around a closed path must return the charge to the same energy it started with. There is no free energy in a loop — what the source supplies, the components absorb.

The deeper origin is that the *electrostatic* field is conservative: ∇×E = 0 in electrostatics, so ∮E·dℓ = 0 around any closed path. In quasi-static circuit analysis — where frequencies are low enough that ∂B/∂t is negligible compared to the resistive voltage drops — Faraday's law reduces to exactly this condition, and Kirchhoff's voltage law follows as a direct corollary. In truly high-frequency regimes (wavelengths comparable to circuit size), induced EMFs from time-varying magnetic flux must be included explicitly, and KVL is replaced by its Faraday-generalised version.

Practically, KVL turns any schematic into a system of linear equations. For each independent loop in the circuit, write ∑V_k = 0, expressing each V_k via Ohm's law (V_R = IR), the capacitor equation (V_C = Q/C), or an EMF source (V_ε = ±ε). The result is one equation per loop, and combined with Kirchhoff's *current* law at each node, the whole network reduces to linear algebra. Every SPICE simulator, every hand-solved homework, every DC circuit analysis runs through this reduction. The two sentences Kirchhoff wrote at twenty-one in 1845 are the whole foundation of network analysis.`,
    relatedPhysicists: ["gustav-kirchhoff"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "kirchhoff-current-law",
    term: "Kirchhoff's current law (KCL)",
    category: "concept",
    shortDefinition: "The sum of currents flowing into any node in a circuit equals the sum of currents flowing out. Equivalently: charge conservation applied to circuit junctions, ∇·J = 0 in steady state.",
    description: `Kirchhoff's current law says that at any node in a circuit — any junction where two or more wires meet — the total current flowing in equals the total current flowing out. Written symbolically: ∑ I_in = ∑ I_out, or equivalently ∑ I_k = 0 (with signs indicating direction). It is conservation of charge applied to a point: charge cannot pile up at a wire junction, so whatever flows in must flow out on the same timescale.

The underlying physics is the continuity equation ∂ρ/∂t + ∇·J = 0. In DC and low-frequency circuits — where the charge density inside conductors is essentially constant — the continuity equation reduces to ∇·J = 0, and integrated over any closed surface surrounding a node, it gives ∮J·dA = 0, which is KCL. In high-frequency regimes where capacitors can charge and discharge appreciably during a single cycle, the displacement current term has to be added to keep the law exact; in practice this means treating capacitors as having a current I_C = C dV/dt flowing "through" them.

KCL is used in tandem with KVL to solve networks. For a circuit with N nodes and B branches, N−1 independent node equations (one fewer than nodes, because the Nth follows from the others) combine with B−(N−1) independent loop equations to uniquely determine all the branch currents. This is *nodal analysis* when node voltages are the unknowns, and *mesh analysis* when loop currents are the unknowns; both ultimately rest on the same two Kirchhoff sentences. SPICE simulators, hand calculations, and every textbook network problem use one or the other formulation.`,
    relatedPhysicists: ["gustav-kirchhoff"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "voltage-divider",
    term: "Voltage divider",
    category: "concept",
    shortDefinition: "Two resistors in series between a voltage source and ground, with the output voltage taken at the midpoint. V_out = V_in · R₂/(R₁+R₂). The simplest non-trivial circuit.",
    description: `A voltage divider is two resistors in series — R₁ connected to the supply voltage V_in, R₂ connected to ground, and the output taken at the node between them. Kirchhoff's voltage law gives V_out = V_in · R₂/(R₁+R₂): the output voltage equals the input scaled by the ratio of the lower resistor to the total. Set R₁ = R₂ for half the input; set R₁ much greater than R₂ for a small fraction; set R₁ ≪ R₂ for nearly the full input.

The catch is that the formula assumes no current is being drawn out of the midpoint. Connect a load R_L to V_out and R₂ is effectively replaced by the parallel combination R₂ ∥ R_L, which shifts V_out. This is why voltage dividers are used as reference generators only when the load has high input impedance (voltmeters, op-amp inputs, MCU analogue-to-digital pins). For power delivery, a regulator or buffer is needed.

Dividers are everywhere. They set bias voltages for amplifier transistors, scale sensor outputs to fit an ADC range, provide reference voltages for comparators, divide high-voltage rails down for measurement, and build the resistance ladder of an R-2R digital-to-analogue converter. The potentiometer — a variable resistor with a sliding contact — is a voltage divider with a continuously adjustable ratio. Every volume knob, every joystick, every slide potentiometer is this circuit.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "rc-time-constant",
    term: "RC time constant",
    category: "concept",
    shortDefinition: "τ = RC. The characteristic time for an RC circuit to charge to 1−1/e ≈ 63% of its final voltage, or discharge to 1/e ≈ 37% of its initial voltage. In seconds when R is in ohms and C in farads.",
    description: `The RC time constant τ = RC sets the timescale for every exponential process in an RC circuit. When a capacitor C is charged through a resistor R by a step voltage V₀, the capacitor voltage rises as V(t) = V₀(1 − e^(−t/τ)): at t = τ it has reached about 63%, at 3τ about 95%, at 5τ about 99.3%. The discharge through R with the source removed goes the other way: V(t) = V₀e^(−t/τ), dropping to 37% at τ, 5% at 3τ, 0.7% at 5τ.

The derivation comes from Kirchhoff's voltage law around the charging loop: V₀ = IR + Q/C, combined with I = dQ/dt. This gives the first-order linear ODE R dQ/dt + Q/C = V₀, whose solution is Q(t) = CV₀(1 − e^(−t/RC)). The exponential shape is a general feature of any first-order linear system with a single conserved quantity (the capacitor charge); the specific timescale RC is set entirely by the two component values.

Practical consequences are everywhere. In digital logic, RC delays limit how fast a signal line can be driven — double C (by adding load or driving longer traces), double the settling time. In audio circuits, RC pairs form first-order filters with the "corner frequency" f_c = 1/(2πRC) where the response rolls off: above f_c the capacitor shorts the signal to ground for a low-pass filter, or vice versa for high-pass. In power-supply bypass, large electrolytic capacitors with small ESR resistors give τ ≈ 1 ms to smooth mains-frequency ripple. In timer ICs like the 555, an RC external network directly sets the oscillation period. In DRAM, the RC product of the cell capacitor and the bitline resistance determines how often the cells must be refreshed (typically milliseconds).`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "capacitor-charging",
    term: "Capacitor charging",
    category: "phenomenon",
    shortDefinition: "The exponential rise V(t) = V₀(1−e^(−t/τ)) of a capacitor's voltage as it is charged through a resistor. Half the energy delivered by the source ends up in the capacitor; half is dissipated in the resistor, regardless of R.",
    description: `When a capacitor is charged through a resistor from a step voltage V₀, its voltage rises exponentially with time constant τ = RC: V_C(t) = V₀(1−e^(−t/τ)). The current into the capacitor starts at V₀/R and decays exponentially to zero on the same timescale. At t = 5τ the process is ≈ 99% complete for practical purposes.

A striking result emerges from the energy bookkeeping. The energy delivered by the source as the capacitor charges from 0 to V₀ is W_source = Q V₀ = CV₀². The energy stored in the capacitor at the end is U_C = ½CV₀². The remaining ½CV₀² is dissipated in the resistor — exactly half of the source's delivered energy, regardless of the value of R. Making R small (fast charging) and making R large (slow charging) both dissipate the same 50% in heat. Only a non-linear or reactive intermediate — a switching regulator, an inductive coupling — can break this even split.

The universality of the 50% loss is why brute-force RC charging is the *wrong* way to store energy efficiently. Real switched-mode power supplies interrupt the current at high frequency and transfer energy via inductors, achieving 85–95% efficiency. But for simple filtering, timing, and decoupling applications, the 50% loss is negligible because the absolute energy involved is tiny. Anywhere in electronics that a waveform needs to be "softened" on the microsecond-to-millisecond scale, an RC charging transient is the tool that does it.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "rl-time-constant",
    term: "RL time constant",
    category: "concept",
    shortDefinition: "τ = L/R. The characteristic time for current in an RL circuit to rise to 1−1/e ≈ 63% of its steady-state value, or decay to 1/e ≈ 37% of its initial value.",
    description: `The RL time constant τ = L/R is the inductive analogue of the RC time constant. When a battery V₀ is switched on across an RL series circuit, the current rises as I(t) = (V₀/R)(1 − e^(−t/τ)), climbing toward the DC steady-state value V₀/R. When the battery is removed and the inductor is shorted through the resistor, the current decays as I(t) = I₀e^(−t/τ). Both timescales are set by L/R alone — the larger the inductance or smaller the resistance, the slower the circuit reacts to changes.

The governing equation comes from Kirchhoff's voltage law: V₀ = IR + L dI/dt. The dI/dt term is the back-EMF from Lenz's law, resisting the change in current. Solving gives the exponential. Physically, the inductor is storing or releasing magnetic-field energy U = ½LI² as the current ramps, and the resistor dissipates power I²R — the time constant balances how fast L can absorb or release energy against how fast R can dissipate it.

Practical consequences: interrupting an inductive circuit — a relay coil, a solenoid, a motor winding — forces the current to change on a timescale shorter than L/R, which means dI/dt becomes enormous, and the back-EMF rises without bound. The result is a spark across the opening switch contacts, which can destroy semiconductors, weld relay contacts, and emit EMI. Every inductive load in practical electronics needs a *flyback diode* (reverse-biased across the coil) to provide a safe path for the collapsing current, clamping the back-EMF to a diode-drop above the supply and letting the current decay with τ set by L over the sum of the diode resistance and the circuit resistance.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rl-circuits" },
    ],
  },
  {
    slug: "quality-factor",
    term: "Quality factor (Q)",
    category: "concept",
    shortDefinition: "Dimensionless number Q = ω₀L/R = 1/(ω₀RC) = (1/R)·√(L/C) for an RLC circuit, measuring how sharply resonant the response is. Equivalently Q = 2π · (energy stored) / (energy lost per cycle).",
    description: `The quality factor Q characterises how sharply an RLC circuit (or any second-order resonator) responds at its natural frequency. For a series RLC at resonance frequency ω₀ = 1/√(LC), Q = ω₀L/R = 1/(ω₀RC) = (1/R)√(L/C). Physically, Q equals 2π times the ratio of energy stored to energy dissipated per cycle: high-Q systems ring for many cycles; low-Q systems damp out in one or two.

The frequency-response curve has a peak at ω₀ with a full width at half maximum of Δω = ω₀/Q. So a Q = 100 circuit has a fractional bandwidth of 1% around ω₀ — narrow and sharp. A Q = 10 circuit has 10% bandwidth — broad and gentle. Q = 1/2 is the critical-damping boundary between underdamped (oscillatory decay) and overdamped (monotonic decay) free response; Q < 1/2 is overdamped, Q > 1/2 is underdamped with the ringing period 2π/ω_d where ω_d = ω₀√(1 − 1/(4Q²)).

Typical values span many orders of magnitude. An RLC circuit on a breadboard: Q ~ 10. A good LC oscillator tank circuit: Q ~ 100–1000. A quartz crystal resonator: Q ~ 10⁴–10⁶. A superconducting microwave cavity for particle accelerators: Q ~ 10⁹–10¹⁰. An atomic clock's trapped-ion transition: Q ~ 10¹⁵ — which is why timekeeping at the 10⁻¹⁸ level is feasible at all. In radio receivers, Q sets selectivity (ability to pick out one station from neighbours); in mechanical engineering, Q sets how long a tuning fork rings; in laser physics, Q of the optical cavity sets the threshold pump power. Same dimensionless number, same physical meaning, same formula.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rlc-circuits-and-resonance" },
    ],
  },
  {
    slug: "phasor",
    term: "Phasor",
    category: "concept",
    shortDefinition: "A complex number representing the amplitude and phase of a sinusoidal quantity. Turns linear differential equations for AC circuits into algebraic equations: V = IZ in the frequency domain.",
    description: `A phasor is a complex number that represents a sinusoidal steady-state signal of known frequency. The real sinusoid V(t) = V₀ cos(ωt + φ) is rewritten as the real part of V₀ e^(j(ωt+φ)) = (V₀ e^(jφ)) · e^(jωt). The time-varying e^(jωt) factor is the same for every signal in the circuit and can be factored out; what remains, Ṽ = V₀ e^(jφ), is the *phasor*: a single complex number carrying both the amplitude V₀ and the phase φ. Two signals of the same frequency are fully characterised by their phasors.

The trick works because the operator d/dt in the time domain becomes multiplication by jω in the phasor domain (d/dt(e^(jωt)) = jω e^(jωt)). So differential equations governing RLC circuits — L dI/dt, C dV/dt, etc. — become algebraic equations in complex impedances. A resistor R becomes impedance R. An inductor L becomes impedance jωL. A capacitor C becomes impedance 1/(jωC) = −j/(ωC). Kirchhoff's laws hold unchanged in the phasor domain, and solving a network reduces to complex algebra: Ṽ = ĨZ, V_divider = V_in · Z₂/(Z₁+Z₂), etc.

Phasors turn the whole analysis of AC circuits into what amounts to DC-style algebra over the complex numbers. The cost is that only linear, single-frequency (or superposed-single-frequency) problems can be handled: non-linear components (diodes, transistors in saturation) or transient responses require returning to the time domain. But for the vast majority of power-frequency, audio, and RF design, phasor analysis is the default working framework. Introduced by Charles Steinmetz in the 1890s at General Electric, building on Heaviside's complex-impedance work, phasors made large-scale AC power systems practically designable for the first time.`,
    history: `Charles Proteus Steinmetz, a German immigrant to GE's Schenectady labs, systematised phasor analysis in 1893 in a paper titled *"Complex Quantities and their Use in Electrical Engineering."* Oliver Heaviside had introduced the complex-impedance concept in 1886, but Steinmetz's presentation made it accessible to practicing engineers and enabled the rapid AC-grid expansion of the 1890s–1910s.`,
    relatedPhysicists: ["oliver-heaviside"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
    ],
  },
  {
    slug: "impedance",
    term: "Impedance",
    category: "concept",
    shortDefinition: "Z = V/I for a component or network driven at a single frequency, generalising resistance to the complex plane. Z = R + jX, where R is the resistance (dissipative) and X is the reactance (energy-storing).",
    description: `Impedance Z is the complex generalisation of resistance to AC circuits. At a single driving frequency ω, every two-terminal linear component has an impedance Z = V/I — the complex ratio of the voltage phasor to the current phasor. A resistor has Z = R (purely real, in phase). An inductor has Z = jωL (purely imaginary, current lags voltage by 90°). A capacitor has Z = 1/(jωC) = −j/(ωC) (purely imaginary, current leads voltage by 90°). Combinations follow the familiar series (Z_total = Z₁ + Z₂) and parallel (1/Z_total = 1/Z₁ + 1/Z₂) rules, now with complex arithmetic.

The magnitude |Z| = √(R²+X²) tells you the ratio of voltage-amplitude to current-amplitude; the phase angle arg(Z) = arctan(X/R) tells you how much the current lags the voltage. Only the real part R dissipates real power (P = ½|I|²R, the average over a cycle); the imaginary part X shuttles energy back and forth between the source and the reactive element (inductor or capacitor) without net dissipation. This distinction — between real power (watts) and reactive power (volt-amperes reactive, VAR) — is what "power factor" corrections on industrial grids are about: the reactive part is real current that electrical wiring has to carry even though it does no net work on the load.

Impedance matching — making the source impedance equal to the load impedance — is the condition for maximum power transfer, derived from dP/dR_L = 0 where P is the power dissipated in the load. It is the design rule behind transmission-line termination (50 Ω coax needs a 50 Ω terminator to prevent reflections), antenna matching networks (a quarter-wave matching transformer between a 75 Ω feedline and a 50 Ω amplifier), and audio amplifier output stages. Heaviside introduced the word *impedance* in 1886 in his cable-theory papers, where the complex ratio of voltage to current in a loaded transmission line first became essential.`,
    relatedPhysicists: ["oliver-heaviside"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "reactance",
    term: "Reactance",
    category: "concept",
    shortDefinition: "The imaginary part X of impedance Z = R + jX. Inductive reactance X_L = ωL is positive; capacitive reactance X_C = −1/(ωC) is negative. Reactance stores energy without dissipating it.",
    description: `Reactance X is the imaginary part of impedance, measured in ohms, characterising how strongly a reactive element (inductor or capacitor) opposes AC current flow at a given frequency. Inductive reactance X_L = ωL grows linearly with frequency — inductors are open circuits at high frequency and short circuits at DC. Capacitive reactance X_C = 1/(ωC) in magnitude (with a negative sign by convention, reflecting the −j in capacitor impedance) falls inversely with frequency — capacitors are open circuits at DC and short circuits at high frequency.

Unlike resistance, reactance does not dissipate power. A pure inductor or capacitor cycles energy in and out of its field each period: during one quarter-cycle it absorbs energy from the source and stores it (½LI² or ½CV²), during the next quarter-cycle it returns it. The integrated power over a full cycle is zero. This is why reactive elements are "loss-free" in principle (actual inductors and capacitors have small resistive losses; ideal ones don't).

The sign convention matters. An RL circuit has X > 0 (current lags voltage), an RC circuit has X < 0 (current leads voltage), and an RLC circuit at resonance has X = 0 (current and voltage in phase, impedance purely resistive, maximum power transfer at matched R). Reactance is why filter circuits work: a low-pass RC filter is just a voltage divider where the "high" arm is R (constant) and the "low" arm is |X_C| = 1/(ωC) (falls with frequency), so high frequencies get attenuated. Every audio equaliser, every radio IF filter, every DSL line-conditioner is built from combinations of reactances.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
    ],
  },
  {
    slug: "ac-frequency",
    term: "AC frequency",
    category: "concept",
    shortDefinition: "The number of full cycles per second of an alternating current or voltage, measured in hertz (Hz). Standard power-grid frequencies are 50 Hz (most of the world) or 60 Hz (North America, parts of South America and Japan).",
    description: `AC frequency f is the number of complete sinusoidal cycles per second of an alternating current or voltage, measured in hertz (Hz). The angular frequency ω = 2πf is the more common symbol in analytical work, because ω appears directly in the exponentials e^(jωt) of phasor analysis and the impedances jωL and 1/(jωC) of reactive elements.

Two standard grid frequencies divide the world: 50 Hz in Europe, Asia outside Japan, Africa, Australia, and most of South America; 60 Hz in North America, parts of South America, and Japan (with a complicated 50/60 Hz split across the country). The difference has historical rather than physical origins: German and American engineers independently chose different defaults in the 1890s. Both are compatible with all standard electrical design; the only visible differences are slightly smaller/lighter transformers at 60 Hz (ferromagnetic cores work a bit more efficiently at higher frequency), and a 50/60 Hz flicker at the stroboscopic edges of fluorescent lighting.

Above power frequencies, AC extends across an enormous range. Audio: 20 Hz – 20 kHz. Ultrasonic: 20 kHz – 1 MHz (sonar, NDT, medical imaging). Radio: 100 kHz (LW) to 30 GHz (microwave) — every broadcast band, cellular, Wi-Fi, satellite, radar. Visible light: 4 × 10¹⁴ – 8 × 10¹⁴ Hz. X-rays: 10¹⁶ – 10¹⁹ Hz. Gamma rays: above 10¹⁹ Hz. At each frequency scale, the wavelength (c/f) determines whether circuit-theory (f low, wavelength large) or field-theory (f high, wavelength comparable to or smaller than circuit dimensions) is the appropriate framework. The boundary is around 100 MHz for most consumer hardware and around 1 GHz for precision instrumentation.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
    ],
  },
  {
    slug: "transformer",
    term: "Transformer",
    category: "instrument",
    shortDefinition: "A two-coil magnetic device that converts AC voltage up or down by the turn ratio: V₂/V₁ = N₂/N₁. The enabler of the electrical power grid.",
    description: `A transformer is two coils wound around a common ferromagnetic core, coupled by mutual inductance M. Drive the *primary* coil (N₁ turns) with an AC voltage V₁, and the changing flux in the core induces an AC voltage V₂ in the *secondary* coil (N₂ turns) in the ratio V₂/V₁ = N₂/N₁. The currents go inversely: I₂/I₁ = N₁/N₂. Power is conserved at the ideal limit: V₁I₁ = V₂I₂ (real transformers are 95–99% efficient, losing the remainder to core hysteresis, eddy currents, and copper resistance).

The mathematics follows from Faraday's law. Assume a tightly-coupled core so every turn sees the same flux Φ. Then V₁ = N₁ dΦ/dt (primary back-EMF) and V₂ = N₂ dΦ/dt (secondary induced EMF). Dividing gives V₂/V₁ = N₂/N₁ directly. Conservation of energy plus ideal coupling gives the inverse ratio on the currents. The same core flux is therefore threading both windings; what's actually being transferred through the core is not electrical energy but magnetic flux, and Poynting's theorem applied to the core and the gap shows energy flowing through the *space* between the windings via the Poynting vector, not through the core material itself. Physics of the device: it is the classic example of AC electromagnetic energy transfer.

Transformers are the reason the electrical grid exists in its present form. Generating stations produce AC at about 20 kV. Step-up transformers raise this to 110–750 kV for long-distance transmission (at higher voltage, the same power carries less current, and I²R losses along the transmission line fall as the square of the current). At each substation a step-down transformer drops to 11 kV for local distribution, and at each street-level pole a further step-down transformer brings it to the 120/240 V of household outlets. Without transformers, grids larger than a few miles would lose more power in the transmission lines than they deliver. Inside equipment, transformers isolate circuits galvanically, match impedances between stages, and provide safety isolation for medical equipment, test instruments, and power supplies.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transformers" },
    ],
  },
  {
    slug: "turns-ratio",
    term: "Turns ratio",
    category: "concept",
    shortDefinition: "n = N₁/N₂, the ratio of primary to secondary turn counts in a transformer. Sets the voltage step (V₁/V₂ = n), the current step (I₁/I₂ = 1/n), and the impedance step (Z_reflected = n²·Z_load).",
    description: `The turns ratio n = N₁/N₂ is the single number that determines everything about an ideal transformer's input-output behaviour. Voltages scale as 1/n viewed from primary to secondary: V₂ = V₁/n. Currents scale as n: I₂ = n·I₁. Both follow from Faraday's law for each winding at the shared core flux, combined with the conservation of power V₁I₁ = V₂I₂.

The impedance transformation is the engineering consequence that matters most. A load Z_L connected across the secondary looks from the primary side like an impedance Z_reflected = n²·Z_L. An 8-ohm loudspeaker connected through a 10:1 step-down transformer looks like an 800-ohm load to the amplifier driving the primary. This is *impedance matching*, used to couple amplifier output stages (typically designed for high-impedance drive) to low-impedance loudspeakers, antenna feedlines to amplifiers, and high-voltage tube stages to low-impedance following stages.

In power distribution, the turns ratios are chosen to step grid voltage up or down at each stage: 20 kV generator to 400 kV transmission is roughly 1:20; 110 kV distribution to 11 kV local is 10:1; 11 kV to 240 V household is about 46:1. Real transformer design also adds features the ideal turns-ratio picture hides — magnetising current (the small current that flows even with no load, setting up the core flux), leakage inductance (flux that doesn't fully couple between windings), and core losses (hysteresis + eddy currents dissipating in the iron). But the first-order design choice is always the turns ratio, and everything else scales from there.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transformers" },
    ],
  },
  {
    slug: "transmission-line-term",
    term: "Transmission line",
    category: "concept",
    shortDefinition: "A pair of conductors (coax, twisted pair, stripline) carrying signals whose wavelength is comparable to or shorter than the line length. Governed by the telegrapher's equations rather than Kirchhoff's laws.",
    description: `A transmission line is a conductor pair — coaxial cable, twisted pair, stripline, waveguide — used to carry high-frequency signals where the wavelength becomes comparable to the physical length of the cable. Below this crossover (roughly λ/10 ≳ cable length), ordinary Kirchhoff's laws apply and the cable is just a wire. Above it, the cable becomes a distributed system: voltage and current vary along its length, reflections bounce off mismatched terminations, and the behaviour is governed by the *telegrapher's equations* of Heaviside (1876–1892).

The telegrapher's equations come from modelling each infinitesimal length of the cable as a ladder of series inductance L (per unit length), series resistance R, shunt capacitance C, and shunt conductance G. Taking Kirchhoff's laws in the distributed limit produces two coupled PDEs: ∂V/∂x = −L ∂I/∂t − RI and ∂I/∂x = −C ∂V/∂t − GV. In the lossless limit (R = G = 0), these reduce to the wave equation with propagation speed v = 1/√(LC), and signals travel along the cable as forward and backward travelling waves. The ratio of voltage to current in a single travelling wave is the characteristic impedance Z₀ = √(L/C), typically 50 Ω for coax and 75 Ω for video cables.

A mismatch between the line impedance Z₀ and the load impedance Z_L creates reflections: part of the incident signal bounces back to the source with reflection coefficient Γ = (Z_L − Z₀)/(Z_L + Z₀). For Z_L = Z₀, Γ = 0 and all power is absorbed (terminated line, no reflection). For Z_L = 0 (short), Γ = −1 (full-amplitude inverted reflection). For Z_L = ∞ (open), Γ = +1 (full-amplitude in-phase reflection). Reflections cause standing waves, power loss, and — in digital high-speed links — signal-integrity failures that manifest as eye-diagram closure. Every FPGA routing tool, every RF amplifier matching network, every antenna balun, and every multi-gigabit signal trace on a modern circuit board is designed around the telegrapher's equations.`,
    relatedPhysicists: ["oliver-heaviside"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "characteristic-impedance",
    term: "Characteristic impedance",
    category: "concept",
    shortDefinition: "Z₀ = √(L/C) for a lossless transmission line. The ratio of voltage to current in a travelling wave propagating along the line. Standard values: 50 Ω (RF), 75 Ω (video), 100 Ω (differential digital), 377 Ω (free space).",
    description: `The characteristic impedance Z₀ of a transmission line is the ratio of voltage to current in a single travelling wave moving along the line. For a lossless line with series inductance L and shunt capacitance C per unit length, Z₀ = √(L/C). For a coaxial cable with inner radius a, outer radius b, and dielectric permittivity ε_r, the detailed calculation gives Z₀ = (60/√ε_r) ln(b/a) Ω — entirely geometric.

Terminating a transmission line in its characteristic impedance — Z_load = Z₀ — eliminates reflections: all the incident power is absorbed, and the line looks like an infinite length of cable to the source. Any other termination creates reflected waves, leading to standing-wave patterns and (for high-power applications) potentially destructive voltage maxima along the line. Impedance matching is therefore the central engineering concern in every RF, high-speed digital, or high-power coaxial design.

Five canonical values cover most practical work. *50 Ω* (RF coaxial) is the industry standard for test equipment, RF amplifiers, antennas, and connectorised measurements — it's the value that minimises the combined power-handling and loss in standard air-dielectric coax geometry. *75 Ω* (video and broadband) is used in cable TV, satellite TV, and some broadband feedlines — it minimises attenuation for long runs. *100 Ω* differential (twisted pair) is used in Ethernet, USB, PCI Express differential pairs. *110 Ω* is the USB 2.0 differential standard. *377 Ω* = √(μ₀/ε₀) is the characteristic impedance of free space, the ratio of E to B magnitudes in a vacuum-propagating electromagnetic wave, and the impedance of a half-wave antenna in free air (modulo geometry factors). The same √(L/C) formula unifies all of them — transmission line or free space, the square-root-of-inductance-over-capacitance is the impedance a wave propagates against.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "standing-wave-ratio",
    term: "Standing-wave ratio (SWR)",
    category: "concept",
    shortDefinition: "VSWR = V_max/V_min = (1+|Γ|)/(1−|Γ|). A measure of transmission-line reflection. SWR = 1 is a perfect match (no reflection); SWR = ∞ is total reflection (open or short).",
    description: `The voltage standing-wave ratio (VSWR, often just SWR) measures the mismatch between a transmission line and its load. When a reflected wave combines with the incident wave along the line, the superposition creates a standing-wave pattern — stationary maxima (where the two add in phase) and minima (where they subtract). VSWR is the ratio of the maximum voltage amplitude to the minimum voltage amplitude along the line: VSWR = V_max/V_min = (1+|Γ|)/(1−|Γ|), where Γ = (Z_L−Z₀)/(Z_L+Z₀) is the reflection coefficient.

Extreme cases: Γ = 0 (perfect match, Z_L = Z₀) gives VSWR = 1 (no standing wave, line looks flat — all incident power absorbed). Γ = ±1 (short or open circuit) gives VSWR = ∞ (full reflection, standing wave with nodes at zero voltage). Intermediate mismatches give intermediate VSWR. A VSWR of 1.5:1 means only about 4% of incident power is reflected — excellent for most RF work. VSWR above 3:1 means 25% reflection, usually unacceptable — amplifiers may shut down, connectors may arc, and transmitted signal quality degrades.

In the field, VSWR is measured with a directional coupler and a detector, either on a bench-top network analyser or a portable hand-held SWR meter. Ham-radio operators tune antennas to minimise SWR before transmitting; FM radio engineers maintain broadcast-transmitter VSWR below 1.1:1 to prevent tower damage; microwave system integrators budget per-element VSWR to stay within link-budget limits. Any mismatched component — an antenna off-resonance, a connector with a loose centre-pin, a bent waveguide — shows up in the VSWR measurement before it shows up in the functional performance. It is the single most useful scalar diagnostic in RF troubleshooting.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "displacement-current",
    term: "Displacement current",
    category: "concept",
    shortDefinition: "The term ε₀ ∂E/∂t Maxwell added to Ampère's law in 1861 to restore consistency with charge conservation. A changing electric field produces a magnetic field just as a current does — and the term makes Maxwell's equations predict light.",
    description: `Displacement current is the term J_d = ε₀ ∂E/∂t that Maxwell added to Ampère's law in 1861–1865 to patch a subtle inconsistency. The original Ampère form, ∇×B = μ₀J, requires ∇·J = 0 (by taking the divergence of both sides, since ∇·(∇×B) = 0). But the continuity equation ∂ρ/∂t + ∇·J = 0 means ∇·J is generally non-zero whenever charge density changes in time. The easiest example is a charging capacitor: current flows into one plate, charge builds up, but in the gap between the plates no actual current flows. Ampère's original law applied to a loop encircling the wire gives μ₀I; applied to a loop in the gap gives 0. The same loop, just shifted in space, would produce contradictory predictions for the magnetic field.

Maxwell's fix was to add a term ε₀ ∂E/∂t on the right-hand side: ∇×B = μ₀(J + ε₀ ∂E/∂t). The modified equation is consistent with charge conservation (take the divergence, use Gauss's law ∇·E = ρ/ε₀, and the continuity equation follows automatically). Physically, the extra term says that a changing electric field produces a magnetic field just as a current of charges does. In the capacitor gap, E is ramping up as the plates charge, and ε₀ ∂E/∂t replaces the missing conduction current exactly — the magnetic field loops around the gap the same way it loops around the wire.

The consequence was enormous. With the displacement-current term included, the coupled Maxwell equations in free space (ρ = 0, J = 0) permit self-sustaining wave solutions: a changing E creates a changing B via displacement current, the changing B creates a changing E via Faraday's law, and the pattern propagates through empty space. The speed comes out to c = 1/√(ε₀μ₀) ≈ 3×10⁸ m/s, which Maxwell immediately recognised as the speed of light. His 1865 paper concludes that light is an electromagnetic wave — one of the great deductive reveals in the history of science, and all of it hinges on the innocuous-looking extra term he inserted to keep Ampère's law self-consistent.`,
    history: `Maxwell introduced the displacement-current term in *On Physical Lines of Force* (1861–1862) and used it in *A Dynamical Theory of the Electromagnetic Field* (1865) to derive the wave equation. Hertz confirmed the prediction experimentally in 1887–1888, generating and detecting EM waves in the lab. The name "displacement current" is a historical artefact of Maxwell's original mechanical model (he pictured a kind of elastic displacement of an ether medium); the term has nothing to do with ordinary current but the name stuck.`,
    relatedPhysicists: ["james-clerk-maxwell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "displacement-current" },
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
    ],
  },
  {
    slug: "maxwell-equations-term",
    term: "Maxwell's equations",
    category: "concept",
    shortDefinition: "The four coupled partial differential equations (∇·E = ρ/ε₀, ∇·B = 0, ∇×E = −∂B/∂t, ∇×B = μ₀J + μ₀ε₀ ∂E/∂t) that fully describe classical electromagnetism. Every electromagnetic phenomenon below the quantum scale follows from them.",
    description: `Maxwell's equations are the four coupled partial differential equations that encode all of classical electromagnetism. In the modern vector-calculus form (due to Heaviside, 1884–1885): Gauss's law ∇·E = ρ/ε₀ (electric flux sources are charges); no-monopole law ∇·B = 0 (magnetic flux has no point sources); Faraday's law ∇×E = −∂B/∂t (changing magnetic fields produce curling electric fields); and Ampère–Maxwell's law ∇×B = μ₀J + μ₀ε₀ ∂E/∂t (currents and changing electric fields produce curling magnetic fields). Combined with the Lorentz force F = q(E + v×B) governing how fields act on matter, these four equations describe every classical electromagnetic phenomenon from static charges to radio waves to the optics of crystals.

The integral forms — ∮E·dA = Q/ε₀, ∮B·dA = 0, ∮E·dℓ = −dΦ_B/dt, ∮B·dℓ = μ₀(I + ε₀ dΦ_E/dt) — are the forms most often applied to specific geometries and are what Maxwell originally wrote in 1865. The differential forms are what Heaviside distilled from Maxwell's original twenty quaternion equations and what every physics textbook uses today. In source-free regions (ρ = 0, J = 0), the equations decouple into the wave equation for both E and B, with propagation speed c = 1/√(ε₀μ₀) — which matched the measured speed of light, identifying light itself as an electromagnetic wave.

Maxwell's equations are Lorentz-covariant: they take the same form in every inertial frame under the Lorentz transformation, a fact that Einstein took as the starting point for special relativity in 1905. They unify the electric and magnetic fields into a single antisymmetric tensor F^μν in four-vector form, which makes their symmetry structure transparent. Extended to general relativity, they couple to spacetime curvature via ∇_μ F^μν = (1/c) J^ν and describe electromagnetism on arbitrary curved backgrounds. At the quantum level, they become the classical limit of quantum electrodynamics (QED), where photons mediate the electromagnetic interaction and Maxwell's four equations re-emerge as the expectation values of the QED field operators. Every practical piece of electrical and optical engineering traces back to these four lines.`,
    relatedPhysicists: ["james-clerk-maxwell", "oliver-heaviside"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
    ],
  },
  {
    slug: "lorenz-gauge",
    term: "Lorenz gauge",
    category: "concept",
    shortDefinition: "The gauge condition ∇·A + (1/c²)∂V/∂t = 0, which decouples Maxwell's equations for the scalar potential V and vector potential A into two separate wave equations with the same speed c. Named for Ludvig Lorenz (not Hendrik Lorentz).",
    description: `The Lorenz gauge is the constraint ∇·A + (1/c²) ∂V/∂t = 0 imposed on the scalar and vector potentials V and A. In electrodynamics the fields E and B can be expressed in terms of potentials as E = −∇V − ∂A/∂t, B = ∇×A; but the potentials are not unique — a gauge transformation V' = V − ∂χ/∂t, A' = A + ∇χ for any scalar function χ leaves E and B invariant. The Lorenz gauge is one particular choice of χ that simplifies Maxwell's equations to a symmetric form.

In the Lorenz gauge, Maxwell's four equations collapse to two uncoupled wave equations: □V = ρ/ε₀ and □A = μ₀J, where □ = (1/c²)∂²/∂t² − ∇² is the d'Alembertian operator. Both potentials satisfy the same wave equation — just with different sources — and both propagate at the same speed c. The symmetry is explicit: V and A are related components of a single four-vector potential A^μ = (V/c, A), and the Lorenz-gauge wave equations combine into the manifestly Lorentz-covariant equation □A^μ = μ₀J^μ. This is why the Lorenz gauge is the default choice in relativistic electrodynamics and in any calculation that needs Lorentz-invariance to be obvious.

The name is frequently misspelled *Lorentz* gauge — understandably, because Hendrik Antoon Lorentz was the much better-known contemporary Dutch physicist. But the gauge is named for the Danish physicist *Ludvig Valentin Lorenz* (1829–1891), who proposed it in 1867, a decade before Hendrik Lorentz's earliest electrodynamics work. The one-letter distinction (z vs. tz) is the only thing separating them in writing, and it is wrong more often than right in textbooks. Both Lorenz's paper and Lorentz's later work are in the long historical arc that produced the modern covariant formulation, but credit for the gauge condition belongs specifically to the older Danish Lorenz.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
    ],
  },
  {
    slug: "coulomb-gauge",
    term: "Coulomb gauge",
    category: "concept",
    shortDefinition: "The gauge condition ∇·A = 0. Reduces the equation for the scalar potential V to the instantaneous Poisson equation, and leaves only the vector potential A subject to a wave equation. Convenient for non-relativistic electrostatics.",
    description: `The Coulomb gauge is the constraint ∇·A = 0 — the vector potential is required to be divergence-free. Like the Lorenz gauge, it exploits the gauge freedom of electrodynamics (a function χ can be added to V and ∇χ added to A without changing E or B) to pick a particular choice that simplifies the equations.

Under the Coulomb gauge, the scalar potential satisfies the *instantaneous* Poisson equation ∇²V = −ρ/ε₀ — the same V you know from electrostatics, with no time-derivative term. Whenever the charge density moves, V at every point in space instantly rearranges to the new Poisson solution. This seems to violate causality — V propagates faster than light! — but it is a gauge artefact: the physical fields E and B (which is what you measure) still propagate at c, because the *gradient* of the instantaneous V exactly cancels the instantaneous part of −∂A/∂t to leave only the retarded, causal E field. The gauge potentials can do unphysical things as long as the observable fields don't.

The vector potential in the Coulomb gauge satisfies the wave equation □A = μ₀J_T, where J_T = J − ε₀ ∂(∇V)/∂t is the *transverse* (divergence-free) part of the current. All the radiation physics — the part of electromagnetism that actually propagates — is in A; the static Coulomb forces are in V. This makes the Coulomb gauge natural for non-relativistic atomic physics, where the quasi-instantaneous Coulomb interaction between electron and nucleus dominates and radiation is a small correction. It is also commonly used in quantum field theory when working with specific gauge-fixed Hamiltonians. For manifestly Lorentz-covariant work, the Lorenz gauge is preferred; for practical atomic calculations, Coulomb gauge wins.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
    ],
  },
  {
    slug: "poynting-vector",
    term: "Poynting vector",
    category: "concept",
    shortDefinition: "S = (1/μ₀)·E×B. The vector whose magnitude gives the energy-flux density (W/m²) of the electromagnetic field and whose direction gives the flow direction. Introduced by Poynting in 1884.",
    description: `The Poynting vector S = (1/μ₀)·E×B is the energy-flux density of the electromagnetic field: the rate at which electromagnetic energy crosses a surface per unit area, with direction given by E×B. Units are watts per square metre. John Henry Poynting introduced it in 1884 in *On the Transfer of Energy in the Electromagnetic Field*, where he showed that the time derivative of the field energy density satisfies ∂u/∂t = −∇·S − J·E — an exact local conservation statement with S playing the role of the energy flux.

The geometry of S is perpendicular to both E and B, which often produces surprising results. In a simple resistive circuit carrying DC current, the E field inside the conductor is parallel to the current (driving the current, E = J/σ), but the E field *outside* the conductor (in the surrounding space) points radially inward from the positive-potential end. The B field circles the conductor. Taking E×B gives a Poynting vector that points *into* the wire from the surrounding space — the energy flows into the wire from the space around it, from the battery through the external fields to the resistor. Energy does not travel "along the wire"; it travels through the space around the wire. This is one of the first deeply counterintuitive results in classical electromagnetism and is due entirely to taking S seriously.

For a plane electromagnetic wave, S points along the direction of propagation and oscillates with the frequency of the wave; its time-average gives the wave's intensity I = (1/2)ε₀cE₀² for amplitude E₀. For sunlight at Earth's surface, I ≈ 1361 W/m² = the solar constant. For radio antenna near-fields, S is complex and reactive (energy cycling in and out of local storage) rather than radiated; for antenna far-fields (beyond a few wavelengths), S becomes purely radiative. The Poynting vector plus Maxwell's four equations plus Poynting's theorem form the complete energy-conservation bookkeeping for electromagnetism — no part of the energy question has been left open since 1884.`,
    relatedPhysicists: ["john-henry-poynting"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
    ],
  },
  {
    slug: "poynting-theorem",
    term: "Poynting's theorem",
    category: "concept",
    shortDefinition: "∂u/∂t + ∇·S = −J·E. The local statement of energy conservation for the electromagnetic field: rate of change of field-energy density plus divergence of energy flux equals the negative of work done by fields on charges.",
    description: `Poynting's theorem is the local statement of energy conservation for the electromagnetic field, derivable in two lines from Maxwell's equations. Start with u = (ε₀/2)E² + B²/(2μ₀), the electromagnetic energy density. Take its time derivative, substitute Maxwell's equations for ∂E/∂t and ∂B/∂t, and rearrange. The result is ∂u/∂t + ∇·S = −J·E, where S = E×B/μ₀ is the Poynting vector. This says: the rate of change of field energy at a point equals the net flow of field energy into the point (via −∇·S) plus the rate at which the field does negative work on the charges there (via −J·E, which is negative when the current is flowing *with* E, i.e., when charges are gaining kinetic energy from the field).

Integrated over a volume Ω with surface ∂Ω, the theorem reads d/dt ∫Ω u dV = −∮∂Ω S·dA − ∫Ω J·E dV. The first term on the right is the power flowing out through the surface; the second is the rate at which the field is giving up energy to charges inside. Energy is conserved — none disappears, none appears from nowhere. The theorem explicitly identifies S as the energy-flux vector and u as the energy density, closing the bookkeeping Maxwell's equations had opened.

The theorem's practical payoff: every electromagnetic energy-flow analysis — radiation from antennas, absorption in solar cells, heating in resistive cookware, thermal radiation from hot objects, power flow through coaxial cables — uses Poynting's theorem as the framework. The antenna engineer computes directivity by integrating |S| over a far-field sphere. The solar-cell designer computes efficiency by comparing absorbed S (the photon flux) to output electrical power. The waveguide designer computes modal power by integrating S across the cross-section. It is the exact conservation statement that makes energy a tractable quantity in electromagnetism.`,
    relatedPhysicists: ["john-henry-poynting"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
    ],
  },
  {
    slug: "maxwell-stress-tensor",
    term: "Maxwell stress tensor",
    category: "concept",
    shortDefinition: "T_ij = ε₀(E_iE_j − ½δ_ij E²) + (1/μ₀)(B_iB_j − ½δ_ij B²). The 3×3 symmetric tensor whose divergence gives the mechanical force per unit volume the electromagnetic field exerts on charges and currents.",
    description: `The Maxwell stress tensor T_ij encodes the mechanical effect of the electromagnetic field on matter as a momentum-flux density. Its components are T_ij = ε₀(E_iE_j − ½δ_ij E²) + (1/μ₀)(B_iB_j − ½δ_ij B²), symmetric in i and j. The divergence ∂_j T_ij gives the force per unit volume on charges and currents at a point; integrating ∮ T_ij n_j dA over a closed surface gives the total electromagnetic force on everything inside.

The components have a physical interpretation familiar from mechanical stress. The diagonal term T_zz = (ε₀/2)(E_z² − E_x² − E_y²) + (1/(2μ₀))(B_z² − B_x² − B_y²), for example, is a *tension* along the field lines when they run in the z-direction and a *pressure* perpendicular to them. Faraday had intuited this in the 1840s with his mental picture of field lines as "rubber bands under tension that repel each other sideways"; the Maxwell stress tensor is the rigorous mathematical statement of that image. Compute it for two parallel current-carrying wires and the tensor naturally reproduces the attractive/repulsive force. Compute it for a charge near a grounded plane and it reproduces the image-charge attraction.

The stress tensor also defines the electromagnetic momentum flux: since force is rate of change of momentum, a momentum-flux density is the right way to localise the field's mechanical action on matter. This leads directly to electromagnetic *momentum density* g = (1/c²)S = ε₀E×B, which carries its own implications — Abraham-Minkowski momentum debates, radiation pressure, recoil of a flashlight as it emits light. For a plane wave of intensity I hitting a perfect absorber, the pressure is I/c (not 2I/c — that's the formula for a perfect reflector, where incident and reflected momentum add). For sunlight at Earth, this is about 4.5 µPa for absorbers, 9 µPa for reflectors — small but nonzero, and the basis for solar-sail propulsion in space.`,
    relatedPhysicists: ["james-clerk-maxwell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "field-momentum",
    term: "Field momentum",
    category: "concept",
    shortDefinition: "g = ε₀ E×B = S/c². The momentum density carried by the electromagnetic field. Integrated over a volume, it gives the total mechanical momentum the field carries, separate from the momentum of charges and currents.",
    description: `The electromagnetic field carries momentum. Its density is g = ε₀ E×B = S/c² (where S is the Poynting vector and c is the speed of light), with units of kilogram-metres per second per cubic metre. Integrated over a volume, ∫ g dV gives the total field momentum inside — a real, mechanical momentum that must be included in any conservation accounting involving the EM field.

The most striking consequence is the *hidden momentum* in seemingly static configurations. A simple example: a stationary charged capacitor sitting in an external magnetic field carries angular momentum because its electric field crossed with the external B gives a non-zero ∫ g dV circulating around the capacitor axis. If you suddenly discharge the capacitor, the mechanical reaction on the container exactly preserves total angular momentum — but only if you count the field's contribution. Without the g-term, angular momentum appears from nowhere; with it, the books balance. The phenomenon is the *Feynman disc paradox* resolved.

For propagating electromagnetic waves, the field momentum points along the direction of propagation and has magnitude |g| = |S|/c² = (energy density)/c. A photon of energy E carries momentum p = E/c — a classical result that falls directly out of ε₀ E×B for a plane wave, predating and motivating the quantum identification. Radiation pressure on an absorbing surface is I/c (intensity over c), which is exactly the momentum flux of the incoming photons. Laser cooling of atoms, optical tweezers, the Yarkovsky effect drifting asteroids over geological time, and the Poynting–Robertson drag on interplanetary dust all rest on the classical field-momentum accounting first made rigorous in Maxwell's and Poynting's 1870s–1880s work.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "radiation-pressure-term",
    term: "Radiation pressure",
    category: "phenomenon",
    shortDefinition: "The mechanical pressure an electromagnetic wave exerts on a surface it strikes: I/c for absorbers, 2I/c for perfect reflectors, where I is the intensity in W/m². Discovered in principle by Maxwell (1871), measured by Lebedev (1901).",
    description: `Radiation pressure is the mechanical force per unit area that an electromagnetic wave exerts on a surface. It follows directly from the field momentum: the wave carries momentum at density S/c², and when the wave is absorbed or reflected, that momentum is transferred to the surface. For a wave of intensity I (W/m²) incident normally on a perfect absorber, the pressure is I/c; on a perfect reflector, the pressure doubles to 2I/c because the photons reverse direction (momentum change of 2p per photon instead of p).

Maxwell predicted radiation pressure in 1871 as a direct consequence of his field-momentum bookkeeping. The predicted magnitude was tiny and hard to measure experimentally because thermal effects — tiny currents of gas molecules heated by absorbed light and pushing back on the surface — often dominate in poor-vacuum conditions. Pyotr Lebedev at Moscow University demonstrated radiation pressure cleanly in 1901 using a torsion balance with polished and blackened vanes in the best vacuum then available; Ernest Fox Nichols and Gordon Hull at Dartmouth did similar experiments in 1903. Both confirmed Maxwell's predictions quantitatively, settling the question.

At Earth-orbit sunlight intensity (1361 W/m², the solar constant), radiation pressure on a perfectly reflecting surface is about 9.1 µPa — a millionth of atmospheric pressure. Over a 10 m × 10 m solar sail this is 0.91 mN, roughly the weight of 90 mg on Earth. Continuous over months, this is enough to change spacecraft velocity by several metres per second — sufficient for mission-altering manoeuvres. Japan's IKAROS (2010) and LightSail 2 (2019) demonstrated solar-sail propulsion in interplanetary space. More extreme cases: inside a high-Q laser cavity, radiation pressure of ~10³ Pa has been achieved; ultra-intense laser-matter experiments reach petapascals. Radiation pressure is also responsible for the outward push on massive stars from radiation, the Poynting–Robertson dragging of dust grains toward the sun, and the optical tweezer technology that won Ashkin the 2018 Nobel Prize.`,
    history: `James Clerk Maxwell predicted radiation pressure in *A Treatise on Electricity and Magnetism* (1873). Pyotr Lebedev measured it experimentally in 1901 with a sensitive torsion balance; Nichols and Hull confirmed the result independently in 1903. Einstein's 1905 light-quanta paper reinterpreted radiation pressure as photon-momentum transfer, a view fully consistent with Maxwell's classical derivation.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "back-reaction",
    term: "Back-reaction",
    category: "concept",
    shortDefinition: "The effect of a radiating charge's own emitted field on its own motion — self-force. Usually small but produces measurable effects like the Abraham–Lorentz radiation-reaction force and the Lamb shift.",
    description: `Back-reaction refers to the effect of an electromagnetic field on the sources that produce it — particularly, the force a radiating charge exerts on itself through its own emitted field. An accelerating charge radiates energy (Larmor formula: P = q²a²/(6πε₀c³) for non-relativistic motion), and by momentum conservation the radiation must carry off momentum, which means the radiating charge feels a reaction force. This self-force is the *Abraham–Lorentz radiation reaction*, F_self = (q²/(6πε₀c³)) da/dt, proportional to the *jerk* (time derivative of acceleration).

The magnitude is usually minuscule. For a 100 MeV electron in a 1 T magnetic field (a typical synchrotron regime), the Abraham–Lorentz force is about 10⁻¹³ times the Lorentz force — negligible for most purposes. But over the enormous orbit distances of circular electron accelerators, the accumulated radiation loss becomes the dominant design constraint: the Large Electron Positron collider at CERN (1989–2000) lost 3% of its 100 GeV beam energy per turn to synchrotron radiation, setting the hard upper limit on circular-collider energies. This is why the next collider generation (LHC's proton focus, linear e+e- colliders for future) stepped away from circular e+ e- rings.

At the classical level, the Abraham–Lorentz equation has pathological "runaway solutions" where an isolated charge accelerates exponentially without any applied force — an artefact of point-particle idealisation that disappears in any sensible quantum treatment. Quantum back-reaction effects like the Lamb shift (the ~1 GHz energy difference between the 2S_½ and 2P_½ levels of hydrogen, caused by the electron's interaction with its own fluctuating quantum electromagnetic field) are observed with very high precision and form the empirical foundation of quantum electrodynamics. Classical back-reaction is a subtle topic with loose ends; quantum back-reaction is the precision-test fabric of QED.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },

  // ─── Forward-reference placeholders ───────────────────────────────────

  // FORWARD-REF: full treatment in §08 EM waves in vacuum
  {
    slug: "electromagnetic-wave",
    term: "Electromagnetic wave",
    category: "phenomenon",
    shortDefinition: "A self-sustaining coupled oscillation of electric and magnetic fields propagating at c = 1/√(μ₀ε₀) through vacuum. Predicted by Maxwell 1865, confirmed by Hertz 1887. Full treatment in §08.",
    description: `This is a placeholder entry. Electromagnetic waves are self-sustaining coupled oscillations of electric and magnetic fields that propagate through vacuum at the speed c = 1/√(μ₀ε₀) ≈ 3×10⁸ m/s. A changing electric field creates a magnetic field (via Ampère–Maxwell's displacement-current term), and a changing magnetic field creates an electric field (via Faraday's law), so an initial disturbance propagates forward indefinitely without needing any material medium.

The full treatment is in §08 "EM waves in vacuum" of the electromagnetism branch — topics deriving-the-em-wave-equation, plane-waves-and-polarization, radiation-pressure, and the-electromagnetic-spectrum. The derivation starts from Maxwell's equations in source-free vacuum (ρ = 0, J = 0), takes the curl of Faraday's law, substitutes Ampère–Maxwell, and produces the wave equation ∇²E = (1/c²)∂²E/∂t² with c directly identified as the speed of propagation.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },

  // FORWARD-REF: full treatment in §07 (this session) / §08
  {
    slug: "electromagnetic-field",
    term: "Electromagnetic field",
    category: "concept",
    shortDefinition: "The unified field consisting of both the electric field E and the magnetic field B (equivalently, the antisymmetric tensor F^μν). Classical electromagnetism is the study of its dynamics. Full treatment across §07–§08.",
    description: `This is a placeholder entry. The electromagnetic field is the unified object that combines the electric field E and the magnetic field B into a single physical entity. Classically it is described by Maxwell's four equations; relativistically it is described by the antisymmetric field tensor F^μν with components F^0i = E_i/c and F^ij = ε_ijk B_k. Under a Lorentz boost, E and B transform into each other — an electric field in one frame becomes partly magnetic in another, and vice versa. There is only one field; the E/B decomposition is frame-dependent.

The full treatment appears across §07 (gauge structure, the four equations, Poynting vector, stress tensor) and §08 (free-space propagation as electromagnetic waves). For the fully covariant tensor formulation, see §11 (EM & relativity).`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },

  // FORWARD-REF: gauge-invariance is a concept complementary to gauge-transformation (already seeded)
  {
    slug: "gauge-invariance",
    term: "Gauge invariance",
    category: "concept",
    shortDefinition: "The property of a physical theory that its observable predictions are unchanged under a gauge transformation. In electromagnetism, E and B are gauge-invariant even though V and A are not. Full treatment in §07.3.",
    description: `This is a placeholder entry. Gauge invariance is the statement that the physical content of electromagnetism does not depend on the specific choice of scalar potential V and vector potential A used to describe the fields. The transformation V → V − ∂χ/∂t, A → A + ∇χ for any smooth scalar function χ leaves the observable fields E = −∇V − ∂A/∂t and B = ∇×A exactly unchanged. Any prediction that can be experimentally measured — force on a charge, radiation pattern, induced EMF — must be gauge-invariant.

The full treatment is in §07.3 "Gauge freedom and potentials." Related concepts include the specific gauge choices (Lorenz gauge, Coulomb gauge), the related concept of gauge-transformation itself, and the quantum-level generalisation where gauge invariance becomes the organising principle of the Standard Model of particle physics.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
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
