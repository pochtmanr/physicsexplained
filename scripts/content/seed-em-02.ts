// Seed EM §02 Fields-in-matter + §03 Magnetostatics (6 physicists + 26 glossary terms).
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-em-02.ts
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
    slug: "pierre-curie",
    name: "Pierre Curie",
    shortName: "Curie",
    born: "1859",
    died: "1906",
    nationality: "French",
    oneLiner: "French physicist who discovered piezoelectricity and the temperature limit of ferromagnetism, then with Marie Curie isolated radium and polonium.",
    bio: `Pierre Curie was born in Paris in 1859 to a family of physicians who educated him at home rather than entrust him to the lycée system. He received his licence in physics from the Sorbonne at sixteen and a Master's two years later, but the family had no money for further study and he took a junior post as laboratory assistant. Working alongside his older brother Jacques in 1880, he made his first major discovery: certain crystals — quartz, tourmaline, Rochelle salt — produce a measurable voltage when squeezed along specific axes. The brothers called the effect piezoelectricity ("pressure electricity"), and within a year had built the first piezoelectric quartz electrometer, an instrument so sensitive it would later let physicists weigh radioactive samples in micrograms.

His doctoral thesis, defended in 1895, settled a question that had nagged at magnetism for half a century: why does iron lose its magnetic memory when heated? Curie measured the magnetic susceptibility of dozens of materials over wide temperature ranges and showed that every ferromagnet has a sharp critical temperature — now called the Curie temperature — above which the spontaneous magnetisation collapses to zero. The same thesis established the inverse-temperature scaling of paramagnetic susceptibility, Curie's law, which Pierre Weiss later refined into the Curie–Weiss law. These two results were the foundation on which the twentieth-century theory of magnetism would be built.

In the same year he married Marie Skłodowska, a Polish physicist who had come to Paris to study because Polish universities did not admit women. Together they identified two new radioactive elements in pitchblende — polonium (named for her homeland) in July 1898 and radium that December — and shared the 1903 Nobel Prize in Physics with Henri Becquerel. Pierre had finally been promoted to a full professorship at the Sorbonne in 1904. Two years later, walking across the rue Dauphine in heavy rain on 19 April 1906, he slipped under a horse-drawn cart and was killed instantly when the rear wheel crushed his skull. He was forty-six. Marie inherited his chair, becoming the first woman to teach at the Sorbonne, and continued his lectures the week after the funeral. Pierre left behind a remarkable double legacy: piezoelectric crystals now run every quartz watch and ultrasound scanner on the planet, and the Curie temperature still anchors every solid-state textbook on magnetic phase transitions.`,
    contributions: [
      "Discovered piezoelectricity with his brother Jacques (1880) — the foundation of every quartz oscillator and ultrasound transducer",
      "Established the Curie temperature, the critical point above which ferromagnetism vanishes (1895 thesis)",
      "Formulated Curie's law for paramagnetic susceptibility's inverse-temperature scaling",
      "Co-discovered the radioactive elements polonium and radium with Marie Curie (1898)",
      "Built the piezoelectric quartz electrometer, the first instrument able to weigh radioactive samples by their ionising current",
    ],
    majorWorks: [
      "Développement par compression de l'électricité polaire (1880) — discovery of piezoelectricity, with Jacques Curie",
      "Propriétés magnétiques des corps à diverses températures (1895) — doctoral thesis; Curie temperature and Curie's law",
      "Sur une nouvelle substance fortement radio-active, contenue dans la pechblende (1898) — discovery of radium, with Marie Curie and Gustave Bémont",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "piezo-and-ferroelectricity" },
    ],
  },
  {
    slug: "hans-christian-orsted",
    name: "Hans Christian Ørsted",
    shortName: "Ørsted",
    born: "1777",
    died: "1851",
    nationality: "Danish",
    oneLiner: "Danish physicist who founded electromagnetism by accident in an 1820 lecture demonstration when a current-carrying wire deflected a compass needle.",
    bio: `Hans Christian Ørsted was born on Langeland in 1777, the son of a small-town pharmacist. He learned chemistry behind his father's counter, taught himself German and Latin from borrowed textbooks, and walked to Copenhagen at seventeen to enrol at the university. By twenty he had a pharmaceutical degree, by twenty-two a doctorate in Kantian philosophy of science, and by twenty-three he was lecturing in physics at the university with a stipend small enough to require him to keep moonlighting as a pharmacist. He spent the next decade reading Kant, touring Germany on a state grant, and quietly building the conviction that all the forces of nature — electricity, magnetism, chemistry, light — must somehow be manifestations of a single underlying unity.

That conviction paid off in April 1820, in front of a small audience of advanced students at the University of Copenhagen. Ørsted had set up an apparatus to demonstrate the heating of a wire by a Volta cell — by 1820 a routine effect — and as an afterthought left a magnetic compass nearby on the bench. When he closed the circuit, the compass needle swung sharply away from north. He demonstrated the effect twice more for the class, found the deflection confused and unsteady, and put the experiment aside. For three months he kept returning to it in private, varying the current, the wire's orientation, and the compass position, until he understood that the magnetic force around a current-carrying wire was circular — wrapping around the wire rather than pointing along it. In July 1820 he published a four-page paper in Latin describing the effect, sent copies to every major scientific society in Europe, and within weeks had electrified the entire continent's physics community. Ampère heard about it in Paris in September; by November he had derived the full force law between two currents.

Ørsted spent the rest of his career in Copenhagen, founding the Polytechnic Institute (now the Technical University of Denmark) in 1829 and serving as its first director. He isolated metallic aluminium for the first time in 1825 and wrote popular science essays widely read across Scandinavia. The unit of magnetic H-field strength bore his name (oersted, Oe = 79.577 A/m) until SI adopted ampere-per-metre in 1960. His real legacy is conceptual: every theory of electromagnetism written after 1820 starts from the fact that a moving charge produces a magnetic field — the unification Ørsted had spent his life looking for, finally caught in a glance at a wobbling compass needle.`,
    contributions: [
      "Discovered that an electric current deflects a compass needle (April 1820), unifying electricity and magnetism for the first time",
      "Established that the magnetic force around a current-carrying wire is circular, not radial",
      "First isolated metallic aluminium (1825), settling that the element existed independently of its oxide",
      "Founded the Polytechnic Institute of Copenhagen (Den Polytekniske Læreanstalt, now DTU) in 1829",
      "His name became the CGS unit of magnetic H-field strength (oersted), used in geophysics and materials science until SI replaced it in 1960",
    ],
    majorWorks: [
      "Experimenta circa effectum conflictus electrici in acum magneticam (1820) — the four-page Latin paper that founded electromagnetism",
      "Über die Identität der chemischen und elektrischen Kräfte (1813) — early essay on the unity of physical forces",
      "Aanden i Naturen (1850) — The Soul in Nature, his late-life synthesis of philosophy and science",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
      { branchSlug: "electromagnetism", topicSlug: "magnetic-dipoles" },
    ],
  },
  {
    slug: "andre-marie-ampere",
    name: "André-Marie Ampère",
    shortName: "Ampère",
    born: "1775",
    died: "1836",
    nationality: "French",
    oneLiner: "French mathematician and physicist who turned Ørsted's compass-needle observation into the full mathematical theory of electrodynamics in two months flat.",
    bio: `André-Marie Ampère was born in Lyon in 1775 to a prosperous silk merchant who refused to send his son to school and instead let him roam freely through the family library. By thirteen, Ampère had read every one of the twenty-eight volumes of Diderot and d'Alembert's Encyclopédie. He learned Latin so he could read Euler and Bernoulli in the original, taught himself the calculus from Lagrange's textbook, and was reconstructing the orbit of Halley's comet from first principles before he was sixteen. The Revolution shattered this idyll: in November 1793 his father, a mild royalist who had served briefly as a justice of the peace, was guillotined in the Lyon Terror. Ampère collapsed into a year of stunned grief from which, by his own account, he was only rescued by reading the lyric poetry of Antoine Roucher and the botanical treatises of Rousseau.

He recovered, married Julie Carron in 1799, and worked his way up through provincial teaching posts to a chair of mathematics at the École polytechnique in Paris by 1809. Then on 11 September 1820, François Arago demonstrated Ørsted's experiment at a meeting of the Académie des sciences. Ampère had never given electromagnetism a serious thought, but the result struck him with the force of a revelation. Within a week he was experimenting; within two months he had derived the force law between two parallel current-carrying wires (currents in the same direction attract, opposite repel, force scales as 1/r); within a year he had formulated what we now call Ampère's law (the line integral of B around a closed loop equals μ₀ times the enclosed current); and he had coined the words "electrodynamics" and "electric current" — neither of which had existed in 1819. He worked tightly with Biot, who was simultaneously developing his own (more empirical) approach with Savart, but where Biot stayed close to the experimental data, Ampère insisted on a unified mathematical framework. His 1827 Théorie mathématique des phénomènes électrodynamiques uniquement déduite de l'expérience is the founding text of mathematical electromagnetism.

Personally, Ampère was a wreck for most of his life. Julie died in 1803 after four years of marriage; his second marriage to Jeanne Potot in 1806 was so unhappy that they separated within a year. He suffered chronic depression, financial difficulties, and bouts of religious crisis. He died of pneumonia in Marseille in 1836 on a school inspection trip, aged sixty-one, and was buried in the local cemetery before his family could be informed. The SI unit of electric current carries his name. Maxwell, who came after, wrote that "the experimental investigation by which Ampère established the law of the mechanical action between electric currents is one of the most brilliant achievements in science. The whole, theory and experiment, seems as if it had leaped, full grown and full armed, from the brain of the Newton of electricity."`,
    contributions: [
      "Derived the force law between two current-carrying wires within two months of hearing about Ørsted's experiment (1820)",
      "Formulated Ampère's circuital law: ∮B·dℓ = μ₀ I_enc, the magnetostatic counterpart of Gauss's law",
      "Founded mathematical electrodynamics — coined the very words 'electrodynamics' and 'electric current'",
      "Established that magnetism arises from circulating electric currents — the modern microscopic picture of magnetism",
      "Built the first galvanometer (with Johann Schweigger) and the first solenoid, demonstrating that a coil of wire behaves as a bar magnet",
    ],
    majorWorks: [
      "Mémoire sur l'action mutuelle de deux courants électriques (1820) — first announcement of the force law between currents",
      "Théorie mathématique des phénomènes électrodynamiques uniquement déduite de l'expérience (1827) — the founding text of mathematical electromagnetism",
      "Essai sur la philosophie des sciences (1834) — late-life classification of the sciences",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
      { branchSlug: "electromagnetism", topicSlug: "magnetic-dipoles" },
    ],
  },
  {
    slug: "jean-baptiste-biot",
    name: "Jean-Baptiste Biot",
    shortName: "Biot",
    born: "1774",
    died: "1862",
    nationality: "French",
    oneLiner: "French polymath who, with Félix Savart, derived the magnetic-field-from-current-element law in 1820 and later founded the modern study of optical activity.",
    bio: `Jean-Baptiste Biot was born in Paris in 1774, the son of a treasury clerk who pushed him toward a commercial career. He drifted instead into the artillery during the Revolutionary wars, was briefly imprisoned as a royalist sympathiser in 1794, then talked his way into the École polytechnique on its first day of classes in late 1794. He impressed Lagrange and Laplace, who took him on as protégés; by twenty-six he held the chair of mathematical physics at the Collège de France, a post he kept for the next sixty-two years. In 1804 he made the first scientific balloon ascent in history, rising over four kilometres above Paris with Joseph Louis Gay-Lussac to measure the variation of terrestrial magnetism with altitude — a flight more notable for what it ruled out (no measurable variation up to 4,000 m) than for what it discovered.

By 1820 Biot was the senior physicist of the Académie des sciences, established for his work on the polarisation of light in the atmosphere and on the refractive properties of crystals. When Arago demonstrated Ørsted's experiment to the Académie that September, Biot immediately sat down with the young military surgeon Félix Savart, then visiting Paris, to work out a mathematical description of the force exerted on a magnetic pole by an arbitrary segment of current-carrying wire. They presented their result on 30 October 1820, three weeks before Ampère's announcement: the magnetic field at a point produced by a small element dℓ of current I is dB ∝ I dℓ × r̂ / r² — the inverse-square structure of Coulomb's law, with a vector cross-product that captures the rotational geometry Ørsted had observed. The Biot–Savart law, in modern notation with μ₀/4π out front, is still the foundational expression of magnetostatics. Their theoretical style differed sharply from Ampère's: Biot stayed close to the experimental geometry, treating the magnetic pole as the basic interaction; Ampère insisted on a unified field theory built from currents alone. The two approaches converged a generation later in Maxwell's equations.

Biot's interests then pivoted to optics, and in 1815 he had already discovered that solutions of certain organic compounds — sugars, tartaric acid, camphor — rotate the plane of polarised light passing through them, in proportion to concentration and path length. This phenomenon, which he called optical activity, became the foundation of modern stereochemistry; Pasteur's discovery of molecular chirality in 1848 began as a follow-up to Biot's measurements on tartrate crystals. Biot remained scientifically active well into his eighties, publishing a textbook on celestial mechanics, translating the work of Egyptian astronomers from Arabic, and serving as a senator of the Second Empire. He died in Paris in 1862 at the age of eighty-seven, the last surviving member of the generation that had built quantitative French physics out of the wreckage of the Revolution.`,
    contributions: [
      "Co-derived the Biot–Savart law for the magnetic field of a current element with Félix Savart (1820)",
      "Made the first scientific hot-air-balloon ascent (1804) with Gay-Lussac to test the altitude-variation of terrestrial magnetism",
      "Discovered optical activity in 1815 — the rotation of polarised light by sugar solutions and other chiral compounds, founding stereochemistry",
      "Established laws governing the refraction and polarisation of light by crystals, a precursor to modern crystallography",
      "Held the chair of mathematical physics at the Collège de France for 62 years (1800–1862)",
    ],
    majorWorks: [
      "Note sur le magnétisme de la pile de Volta (1820) — first announcement of the Biot–Savart law, with Félix Savart",
      "Traité de physique expérimentale et mathématique (1816) — comprehensive four-volume physics textbook",
      "Recherches expérimentales et mathématiques sur les mouvemens des molécules de la lumière (1814) — optical-activity studies that founded stereochemistry",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "felix-savart",
    name: "Félix Savart",
    shortName: "Savart",
    born: "1791",
    died: "1841",
    nationality: "French",
    oneLiner: "French physician and physicist whose acoustical instruments became laboratory standards, and who collaborated with Biot on the magnetic-field-from-current-element law in 1820.",
    bio: `Félix Savart was born in Mézières in 1791 to a family of military engineers — the same École royale du génie de Mézières that had produced Coulomb a generation earlier. He trained as a military surgeon during the Napoleonic Wars, served in army hospitals along the Rhine, and earned his medical doctorate in Strasbourg in 1816 with a thesis on the construction of stringed musical instruments — an interest he never lost. After Waterloo he set up a small medical practice in Strasbourg, but the patients drifted away as he spent more and more of his time in his workshop, building violins by ear and measuring their acoustic properties with self-designed instruments.

Discouraged by his medical practice, Savart moved to Paris in 1819 to look for academic work. He was introduced to Biot, who recognised in him the rare combination of experimental dexterity and mathematical taste, and brought him on as a collaborator. The two were working together when Arago announced Ørsted's discovery to the Académie des sciences in September 1820. Within weeks they had built the apparatus that would let them measure the magnetic force on a small magnet at varying distances and angles from a long, current-carrying wire. Biot supplied the theoretical framework — that the force should derive from a sum over infinitesimal current elements, each contributing inversely as the square of distance — and Savart supplied the precise experimental geometry that pinned down the cross-product structure (the famous I dℓ × r̂ / r²). Their joint paper of 30 October 1820 beat Ampère's full electrodynamic theory by three weeks and, despite Ampère's later and more general framework, the field-element formula has carried both names ever since.

Savart's first love, however, was acoustics. He invented the toothed wheel that bears his name (the Savart wheel, used to determine the frequency of any periodic sound by comparison with a calibrated rotating cog); he measured the velocity of sound in solids; he showed that the human voice is produced by a vibrating membrane analogous to a violin string. Cherubini, the director of the Paris Conservatoire, hired him to advise on the acoustics of concert halls. In 1827 he was elected to the Académie des sciences and in 1836 he succeeded André-Marie Ampère in the chair of experimental physics at the Collège de France. He died in Paris in 1841 at the age of forty-nine, of a chronic illness that had been worsening for years. The Biot–Savart partnership had lasted only the autumn of 1820, but it was enough to put his name on every undergraduate magnetostatics textbook ever written.`,
    contributions: [
      "Co-derived the Biot–Savart law for the magnetic field of a current element with Jean-Baptiste Biot (1820)",
      "Invented the Savart wheel, a calibrated toothed wheel for measuring the frequency of any periodic sound",
      "Demonstrated that the human voice is produced by a vibrating membrane in the larynx",
      "Measured the speed of sound in solids and the elastic moduli of common materials by acoustic methods",
      "Held the chair of experimental physics at the Collège de France from 1836 until his death in 1841 (succeeding Ampère)",
    ],
    majorWorks: [
      "Mémoire sur la construction des instruments à cordes et à archet (1819) — doctoral thesis on stringed-instrument acoustics",
      "Note sur le magnétisme de la pile de Volta (1820) — first announcement of the Biot–Savart law, with Jean-Baptiste Biot",
      "Recherches sur les vibrations longitudinales (1820s) — series of papers on longitudinal sound vibrations in rods and plates",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "hendrik-antoon-lorentz",
    name: "Hendrik Antoon Lorentz",
    shortName: "Lorentz",
    born: "1853",
    died: "1928",
    nationality: "Dutch",
    oneLiner: "Dutch theoretical physicist who reformulated Maxwell's equations in terms of discrete electrons and wrote the transformations Einstein later promoted into the principle of relativity.",
    bio: `Hendrik Antoon Lorentz was born in Arnhem in 1853 to a middle-class family — his father ran a small market-garden business and his stepmother was the daughter of a clergyman. He was a prodigy of the quiet sort: by ten he was correcting his teachers' arithmetic, by sixteen he was reading Maxwell and Helmholtz in the original, and at the University of Leiden he completed an undergraduate degree in physics in two years and a doctorate at twenty-two on the reflection and refraction of light by Maxwell's electromagnetic theory. The thesis was so original that the University of Leiden created a new chair of theoretical physics for him before he had turned twenty-five — the first such chair anywhere in the Netherlands, and one of the first in Europe — which he would hold until his retirement in 1912.

Lorentz spent the rest of his life refining and extending Maxwell's equations. Maxwell himself had treated electromagnetism as a continuum field theory; Lorentz argued in the 1890s that the macroscopic field equations must be derived from the motions of discrete charged particles — electrons, a word coined by his Irish contemporary G. J. Stoney. The Lorentz force law, F = q(E + v×B), is the bridge between his microscopic electron theory and Maxwell's macroscopic fields. In 1895 he wrote down the coordinate transformations now called the Lorentz transformations as a mathematical device to explain why the Michelson–Morley experiment had detected no motion of the Earth through the luminiferous aether: he proposed that moving objects literally contract along their direction of motion by a factor that, in his hands, was a hypothesis about how matter interacts with the aether. A decade later Einstein would take the same equations and reinterpret them as a property of spacetime itself, but the math was Lorentz's. He shared the second-ever Nobel Prize in Physics with Pieter Zeeman in 1902 for the theoretical explanation of the Zeeman effect, the splitting of spectral lines in a magnetic field — direct experimental evidence that atoms contain orbiting charged particles.

Lorentz was, by universal account, the gentlest and most generous theoretical physicist of his era. He chaired the early Solvay Conferences (1911 onwards), where he managed with extraordinary tact the debates between the older classical generation and the rising quantum physicists; Einstein, who attended every Solvay from 1911 to Lorentz's death, wrote in his obituary, "He meant more to me personally than anybody else I have met in my lifetime." After his retirement in 1912 he chaired the Zuiderzee Works committee that designed the great barrier dam reclaiming a quarter of the Netherlands' inland sea — applying classical hydrodynamics to a problem of national infrastructure. He died in Haarlem in 1928 of an erysipelas infection. The Dutch government suspended all telegraph services for three minutes during his funeral; Einstein and Rutherford gave eulogies. He had presided over the calmest and most consequential hand-off in twentieth-century physics: from the classical electromagnetic worldview that he had perfected to the relativistic and quantum worlds that his work made possible.`,
    contributions: [
      "Formulated the Lorentz force law, F = q(E + v×B), the bridge between microscopic charged particles and macroscopic Maxwell fields",
      "Derived the Lorentz transformations (1895) — the coordinate equations Einstein later promoted into the foundation of special relativity",
      "Founded the electron theory of matter, deriving Maxwell's macroscopic equations from the motion of discrete charged particles",
      "Provided the theoretical explanation of the Zeeman effect — splitting of atomic spectral lines in a magnetic field — for which he shared the 1902 Nobel Prize with Pieter Zeeman",
      "Chaired the early Solvay Conferences (1911–1927), presiding over the transition from classical to quantum physics with universally praised diplomacy",
      "Chaired the Zuiderzee Works committee whose hydrodynamic calculations shaped the great Dutch barrier dam (Afsluitdijk) completed in 1932",
    ],
    majorWorks: [
      "Versuch einer Theorie der electrischen und optischen Erscheinungen in bewegten Körpern (1895) — Lorentz transformations and the contraction hypothesis",
      "The Theory of Electrons (1909) — Columbia lectures collecting his electron theory of matter",
      "Lectures on Theoretical Physics (1927) — late-life synthesis published in three volumes",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "polarization",
    term: "Polarization",
    category: "concept",
    shortDefinition: "The alignment of bound charges inside a dielectric — every atom or molecule turns into a tiny dipole that points along the local electric field.",
    description: `Polarization is what happens to insulating matter when you put it in an electric field. The atoms and molecules of a dielectric have no free electrons to move around, but their internal charges can shift slightly: the electron cloud of each atom drifts a tiny distance against the applied field, while the positive nucleus drifts an even tinier distance with it. The result is a sea of microscopic electric dipoles, each pointing along the local field. The material has been polarized.

Two distinct mechanisms compete depending on the molecule. In atoms and non-polar molecules (like noble gases or N₂), the polarization is induced — the field literally pulls the electron cloud away from the nucleus, creating a dipole that vanishes when the field is switched off. In polar molecules (like H₂O or HCl) the dipoles already exist permanently, but at zero field they point in random directions and average to zero; the applied field aligns them statistically against the constant jostling of thermal motion. Both mechanisms produce the same macroscopic effect: a polarization density P pointing along the field, proportional to it for ordinary materials.

Polarization is not a flow of charge through the material — no electron makes it from one face to the other. It is a strictly local rearrangement, atom by atom, and yet the cumulative effect at the dielectric's surface is dramatic: a layer of positive bound charge appears on one face and an equal layer of negative bound charge on the opposite face. These bound surface charges produce their own field that partially cancels the applied field inside the material — the reason every dielectric weakens whatever field you try to set up across it.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-and-bound-charges" },
    ],
  },
  {
    slug: "polarization-density",
    term: "Polarization density",
    category: "concept",
    shortDefinition: "The vector P = (dipole moment)/(volume), measured in coulombs per square metre, that summarises how strongly a dielectric is polarized at each point.",
    description: `The polarization density P is the macroscopic average of the microscopic dipole moments inside a dielectric. At each point in the material you imagine a tiny volume containing many atoms, sum the dipole moments of those atoms vectorially, and divide by the volume. The result is a vector field P with units of coulombs per square metre — equivalently, dipole moment per cubic metre — that captures how strongly and in what direction the medium is polarized at that point.

For most ordinary materials in moderate fields, P is proportional to the local electric field: P = ε₀ χ_e E, where χ_e is the electric susceptibility, a dimensionless number characteristic of the material (zero for vacuum, of order 1–80 for common dielectrics, much larger for polar liquids like water). When the proportionality fails — at very high fields, in nonlinear optics, or in ferroelectrics that remember a previous polarization — the deviation defines the interesting physics.

The whole point of P is that it lets you forget about the trillions of microscopic dipoles and just keep track of one smooth vector field. Once you know P everywhere inside the dielectric, you can recover the bound charge density (ρ_b = −∇·P inside, σ_b = P·n̂ on surfaces) and the displacement field (D = ε₀E + P) directly from it. P is the bookkeeping variable that bridges the atomic mess and the macroscopic field equations.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-and-bound-charges" },
    ],
  },
  {
    slug: "bound-charge",
    term: "Bound charge",
    category: "concept",
    shortDefinition: "Charge that cannot move freely through a material because it is stuck inside individual atoms or molecules — yet still rearranges locally when the medium is polarized.",
    description: `Bound charge is the central distinction §02 makes: the electrons and nuclei inside a dielectric are not free to wander like the conduction electrons in a metal. They are bound — locked into atomic orbitals and chemical bonds — but they can still shift slightly within their atoms when an external field arrives. That tiny intramolecular shift is what makes a dielectric a dielectric, and the displaced charges are bound charges.

The accounting is clean. Inside a polarized dielectric, the bound charge density is ρ_b = −∇·P: wherever the polarization vector field has a positive divergence (dipoles spreading apart), positive bound charge has effectively been carried away and a negative bound charge density appears. At the boundary between dielectric and vacuum, the bound surface charge density is σ_b = P·n̂, where n̂ is the outward unit normal — the discontinuity in the dipole arrangement leaves an exposed layer of charge on the surface. These two formulas, combined, account for every microscopic charge inside the polarized dielectric in two clean macroscopic numbers.

The complementary concept is free charge: the conduction electrons in a metal, the ions deliberately doped into a semiconductor, the explicit charges you place on a capacitor plate — anything you can move around with a wire. The two together (ρ = ρ_f + ρ_b) source the total electric field via Gauss's law in vacuum form ∇·E = ρ/ε₀, but in matter we usually want to talk about the free charge alone, which is exactly what the displacement field D is engineered to do.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-and-bound-charges" },
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "electric-susceptibility",
    term: "Electric susceptibility",
    category: "concept",
    shortDefinition: "The dimensionless coefficient χ_e in P = ε₀χ_e E that measures how easily a dielectric polarizes in response to an applied electric field.",
    description: `The electric susceptibility χ_e is the proportionality constant linking the polarization density P of a linear dielectric to the electric field E inside it: P = ε₀ χ_e E. It is dimensionless, positive for ordinary insulators, and it captures everything about how easily a material's bound charges shift in response to a field. Vacuum has χ_e = 0 (no charges to polarize). Air is barely polarizable (χ_e ≈ 5 × 10⁻⁴). Common solid insulators range from 1 to 10. Liquid water, with its large permanent dipole moment, reaches χ_e ≈ 79.

Susceptibility is a pure material property — it does not depend on geometry, only on what the material is made of and what conditions (temperature, frequency, applied DC field) it is sitting in. For most everyday dielectrics in modest fields, χ_e is a single positive number. For anisotropic crystals, it becomes a tensor whose principal axes pick out the natural directions of the crystal lattice. For nonlinear materials at high field strengths, χ_e itself depends on E, and the resulting nonlinear susceptibilities are the foundation of every laser-frequency-doubling crystal.

Susceptibility is the natural microscopic variable; permittivity ε = ε₀(1 + χ_e) is the macroscopic one that shows up in field equations. The two are linked by definition. Calculating χ_e from first principles requires quantum mechanics (the polarisability of each atom or molecule, summed over the density of atoms), but measuring it is straightforward — fill a parallel-plate capacitor with the material, see how much extra charge it holds at fixed voltage, divide by the vacuum value.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "dielectric-term",
    term: "Dielectric",
    category: "concept",
    shortDefinition: "An insulating material that can be polarized but does not conduct — its bound charges shift locally in response to a field while no current flows.",
    description: `A dielectric is an insulator considered in its capacity to be polarized by an electric field. The two words describe the same kind of material — glass, ceramic, plastic, dry wood, mineral oil, distilled water — but used in different contexts. We call it an "insulator" when we care about it blocking current; we call it a "dielectric" when we care about it polarizing in a field and storing energy.

The defining behaviour of a dielectric is bound-charge response. Apply an electric field, and the atoms and molecules inside polarize: positive nuclei and negative electron clouds shift in opposite directions by tiny amounts, producing a polarization density P. The polarized medium produces its own internal electric field that opposes the applied field, weakening the net field inside the material by a factor κ — the dielectric constant. This is why putting a slab of glass between the plates of a capacitor lets the same charge sit at a lower voltage, equivalently storing more charge at the same voltage.

Real dielectrics are imperfect. Every real insulator has some tiny conductivity (a leakage current that bleeds charge over hours or days) and a maximum field strength it can tolerate before its bound electrons are torn loose and the material breaks down — the dielectric strength, typically a few MV/m for air and 10–100 MV/m for solid insulators. Ferroelectric dielectrics are the spectacular exception to ordinary linear behaviour: they remember a polarization in zero field, like an electric analogue of a permanent magnet. Most of the §02 chapter is about ordinary linear dielectrics; the ferroelectric story shows up in the §02.4 piezo / ferro topic.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "permittivity",
    term: "Permittivity",
    category: "concept",
    shortDefinition: "The constant ε in D = εE that characterises how a medium permits the establishment of an electric field. SI unit: farad per metre.",
    description: `Permittivity ε is the macroscopic property that ties the displacement field D to the electric field E in a linear dielectric: D = εE. It has units of farads per metre, and for most materials ε = ε₀(1 + χ_e), where ε₀ ≈ 8.854 × 10⁻¹² F/m is the permittivity of free space and χ_e is the dimensionless electric susceptibility of the medium. Vacuum has the smallest permittivity (ε = ε₀); every material medium has a larger one, because its bound charges polarize and partially shield any applied field.

The ratio κ = ε/ε₀ is the relative permittivity, also called the dielectric constant — a dimensionless number that tells you how much the medium amplifies a capacitor's storage capacity relative to vacuum. Air is essentially indistinguishable from vacuum (κ ≈ 1.0006). Glass and most ceramics fall in the range 4–10. Pure water is famously high (κ ≈ 80) thanks to its strong permanent molecular dipoles. Specialty ceramics like barium titanate can reach κ in the thousands and are the workhorse material of every miniature ceramic capacitor.

Permittivity is a frequency-dependent quantity in general: the value of ε that a material shows in response to a static field is not the same as its response at radio frequencies, infrared, or visible light. The frequency-dependence of permittivity (its dispersion) is the entire subject of optics, since the speed of light in a medium is c/√(εμ/ε₀μ₀) — and "the refractive index" is essentially the square root of the relative permittivity at optical frequencies for non-magnetic materials.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "dielectric-constant",
    term: "Dielectric constant",
    category: "concept",
    shortDefinition: "The dimensionless ratio κ = ε/ε₀ of a material's permittivity to that of vacuum. Tells you how much a dielectric amplifies a capacitor's storage capacity.",
    description: `The dielectric constant κ (also written ε_r, the relative permittivity) is a dimensionless number characterising a material's electrical response. It is defined as κ = ε/ε₀, the ratio of the material's permittivity to vacuum permittivity, and it equals 1 + χ_e where χ_e is the electric susceptibility. By definition, vacuum has κ = 1 exactly, and every material medium has κ > 1.

Operationally, κ is the factor by which putting a slab of material between the plates of a capacitor multiplies its capacitance: a vacuum capacitor of capacitance C₀ becomes a capacitor of capacitance κC₀ when filled with the dielectric. This is the easiest way to measure κ in a lab — assemble a parallel-plate capacitor, charge it through a known voltage, fill it with the test material, and read off the new voltage at fixed charge. The voltage drops by a factor of κ, which is the polarization shielding the field inside.

Numerical values cover an enormous range. Vacuum κ = 1; air κ ≈ 1.0006; teflon κ ≈ 2.1; paper κ ≈ 3.5; rubber κ ≈ 7; alumina ceramic κ ≈ 9; methanol κ ≈ 33; water κ ≈ 80; barium titanate κ ≈ 1,200; calcium copper titanate κ > 10⁵. The high-κ materials are dominated by polar molecules (water) or by ferroelectric domains that flip easily in modest fields (barium titanate). The choice of dielectric in a capacitor is always a balance between high κ (more capacitance) and low losses, low temperature dependence, high breakdown strength — there is no universal best material.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "displacement-field",
    term: "Displacement field",
    category: "concept",
    shortDefinition: "The vector D = ε₀E + P whose divergence equals only the free charge density. Lets you do Gauss's law inside a dielectric without tracking bound charges.",
    description: `The electric displacement field D is defined as D = ε₀E + P, where E is the electric field and P is the polarization density. Its great virtue is that its divergence picks up only the free charge density: ∇·D = ρ_f. The bound charges that polarization carries inside a dielectric are entirely absorbed into the definition of D, so when you write Gauss's law for the free charges alone — the deliberately placed charges on capacitor plates, the conduction charges on a metal — D is what you should use.

Without D, applying Gauss's law to a parallel-plate capacitor filled with dielectric requires you to track three charge layers: the free charge on the plates, the bound charge on the dielectric's outer faces (which partially cancels the field), and any free charge that might have leaked into the bulk. With D, you wrap a Gaussian surface around the plate, count only the free surface charge density σ_f sitting on it, and out pops D = σ_f directly — no bookkeeping over induced bound layers. The price of this convenience is that D is not the field that exerts force on a test charge; only E is. Knowing D in a region tells you what free charges are around but not, by itself, how strongly things will be pushed; for that you need to combine D with the material relation D = εE to recover E.

For linear isotropic media D = εE, where ε is the permittivity of the material, and the calculation collapses to a straightforward arithmetic problem. For anisotropic crystals ε becomes a tensor and D and E need not be parallel. For nonlinear or hysteretic materials (ferroelectrics) the relationship is more complicated and history-dependent. But the underlying logic is always the same: D is the surrogate that lets you reason about the free-charge structure of a problem without the dielectric polluting your Gauss integrals.`,
    history: `James Clerk Maxwell introduced the displacement field — and the closely related "displacement current" ∂D/∂t that completes Ampère's law — in his 1865 paper A Dynamical Theory of the Electromagnetic Field. The word "displacement" reflected the mid-Victorian picture of the dielectric as a sea of mechanical molecules that physically displace under an applied field; the modern interpretation in terms of polarization came later, but the variable and its name stuck.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dielectrics-and-the-d-field" },
    ],
  },
  {
    slug: "boundary-conditions-em",
    term: "Boundary conditions (EM)",
    category: "concept",
    shortDefinition: "The matching rules at an interface between two media: the normal component of D jumps by the free surface charge; the tangential component of E is continuous.",
    description: `When the electric field crosses an interface between two media — vacuum to glass, glass to water, conductor to dielectric — its components behave very differently along the surface and across it. The two boundary conditions for static electric fields, derived from Gauss's law and the curl-free property of E, are the matching rules every interface problem starts from.

The normal component of D jumps by the free surface charge density: D_2⊥ − D_1⊥ = σ_f, where the subscripts label the two sides and ⊥ is the component along the outward normal from medium 1 to medium 2. If no free charge sits on the interface (the typical case at a vacuum-dielectric boundary), D⊥ is continuous. The tangential component of E is always continuous across any interface: E_2∥ = E_1∥. These two together pin down the kinks the field lines have to take when crossing from one medium to another, and they are why electric field lines that hit a dielectric surface refract toward or away from the normal — the same kind of bending that light undergoes when it crosses from air into glass.

The conductor case is the special limit. A conductor in electrostatic equilibrium has E = 0 in its bulk, so the tangential component of E just outside the surface must be zero too (otherwise charges would still be sliding along the surface), and the normal component is whatever Gauss's law requires from the local surface charge: E⊥ = σ/ε₀ pointing outward. These are the rules that make the method of images work, that explain why field lines hit a conductor at right angles, and that determine how a Faraday cage screens its interior.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "boundary-conditions-at-interfaces" },
    ],
  },
  {
    slug: "piezoelectricity",
    term: "Piezoelectricity",
    category: "phenomenon",
    shortDefinition: "The appearance of an electric voltage across certain crystals when they are mechanically squeezed — and the converse: the same crystals deform when a voltage is applied.",
    description: `Piezoelectricity is a two-way coupling between mechanical strain and electric polarization that occurs in crystals lacking a centre of symmetry. Squeeze a piezoelectric crystal along the right axis, and a voltage appears across it. Apply a voltage across it, and the crystal deforms by a tiny but extremely repeatable amount (typically picometres per volt). Quartz, tourmaline, Rochelle salt, lead zirconate titanate (PZT), and barium titanate are all piezoelectric.

The microscopic mechanism is geometric. In a non-centrosymmetric crystal, the positive and negative ions sit in lattice positions that, on average, produce no net dipole moment. Squeeze the lattice along a polar axis, however, and the centroids of positive and negative charge shift relative to each other — a polarization appears, and surface charges accumulate on the deformed faces. The same mechanism, run in reverse, lets an applied field push the ions apart or together, deforming the lattice. The two effects are linked by a single tensor, the piezoelectric coefficient, that pins down the conversion factor between strain and polarization.

Modern technology runs on piezoelectricity. Every quartz watch keeps time by counting the vibrations of a tiny tuning-fork-shaped piece of quartz driven at 32,768 Hz. Every ultrasound transducer is a sandwich of PZT ceramic discs that pulse and listen. Sonar, fuel injectors, microbalances, scanning-tunnelling microscopes, ink-jet printers, butane lighters — they all exist because someone needed to convert tiny voltages into tiny motions or vice versa, and a piezoelectric crystal does it cleanly. The global market for piezoelectric devices is in the tens of billions of dollars per year.`,
    history: `Pierre and Jacques Curie discovered piezoelectricity in 1880 at the Sorbonne, working on the symmetry properties of crystals. They predicted the converse effect — that an applied field should deform the crystal — from thermodynamic considerations the following year, and Gabriel Lippmann verified it experimentally within months. The technology lay mostly dormant until World War I, when Paul Langevin built the first practical sonar transducer from a sandwich of quartz crystals to detect German submarines. Quartz oscillators followed in the 1920s, ceramic piezoelectrics (barium titanate, then PZT) in the 1940s, and the field has expanded ever since.`,
    relatedPhysicists: ["pierre-curie"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "piezo-and-ferroelectricity" },
    ],
  },
  {
    slug: "ferroelectricity",
    term: "Ferroelectricity",
    category: "phenomenon",
    shortDefinition: "The presence of a spontaneous electric polarization in certain crystals that can be reversed by an applied field — the electric analogue of ferromagnetism.",
    description: `A ferroelectric is a material with a spontaneous electric polarization in zero applied field — its bound charges have collectively decided to point in one direction even when nothing is pushing on them. Apply an external field strong enough, and the polarization flips to the new direction; remove the field, and the new polarization stays. The material remembers. The polarization-versus-field curve traces out a hysteresis loop almost identical in shape to the magnetisation-versus-field curve of a ferromagnet, which is why the phenomenon is called ferroelectricity even though no iron is involved.

The microscopic origin in barium titanate (BaTiO₃) — the canonical ferroelectric — is a small off-centre displacement of the central titanium ion within its octahedral oxygen cage. Below a critical temperature (the ferroelectric Curie temperature, around 120 °C for BaTiO₃), the lattice spontaneously distorts so that all the Ti⁴⁺ ions in a domain shift slightly in the same direction, producing a uniform spontaneous polarization. Above the Curie temperature the distortion vanishes by thermal fluctuation and the material reverts to ordinary high-permittivity behaviour. Each crystal contains domains of opposite polarization that can be flipped by external fields — the same domain physics as in ferromagnets, with bound electric charges playing the role of magnetic moments.

Ferroelectric materials are everywhere in modern electronics. Their colossal dielectric constants (κ in the thousands) make them the standard material for surface-mount ceramic capacitors. Their hysteresis loop makes them candidate memory elements (FeRAM — ferroelectric RAM — stores a bit in the polarization direction of a tiny BaTiO₃ cell). Their pyroelectric response (polarization changes with temperature) underpins every passive infrared motion sensor in burglar alarms and automatic faucets. And their piezoelectric coefficients are typically large, which is why most modern piezoelectric ceramics (lead zirconate titanate, PZT) are also ferroelectric.`,
    history: `Joseph Valasek, a graduate student at the University of Minnesota, discovered ferroelectricity in 1920 in Rochelle salt while measuring its piezoelectric response — he noticed a hysteresis loop in the polarization curve identical in form to a magnetisation hysteresis loop. The discovery sat largely ignored for two decades; barium titanate was identified as the second ferroelectric in 1944 (independently in the USSR, USA, and Japan) and turned ferroelectricity into a major technological field. Today there are hundreds of known ferroelectrics.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "piezo-and-ferroelectricity" },
    ],
  },
  {
    slug: "lorentz-force",
    term: "Lorentz force",
    category: "concept",
    shortDefinition: "The total electromagnetic force on a point charge: F = q(E + v×B). Bridges Maxwell's macroscopic fields to the motion of individual particles.",
    description: `The Lorentz force is the rule that takes a point charge q moving with velocity v through electric and magnetic fields E and B and tells you the force it feels: F = q(E + v×B). The electric piece, qE, points along the field and acts on the charge whether it is moving or not. The magnetic piece, qv×B, is perpendicular to both v and B, vanishes when the charge stands still, and does no work on the charge — it can change the direction of motion but not the speed.

This formula is the single bridge between the field equations of Maxwell (which describe what E and B are at every point of space) and the dynamics of charged particles (which is what every cathode-ray tube, particle accelerator, mass spectrometer, and ionospheric phenomenon ultimately runs on). Plug in a uniform B field and zero E and you get circular motion at the cyclotron frequency ω = qB/m. Add a perpendicular E and you get drift motion — the famous E×B drift that determines plasma dynamics and is the reason aurorae form rings rather than uniform glows. Crank up E and you accelerate the particle along the field; reverse B and you flip the sense of circulation. Every motion of a charged particle in an electromagnetic field is some combination of these ingredients.

The cross-product structure has subtle consequences. Because the magnetic force is always perpendicular to the velocity, magnetic fields cannot speed particles up (that requires E fields, which is why every accelerator is fundamentally an electric-field device) but they can confine them indefinitely in stable orbits (which is the principle of every cyclotron and synchrotron). The Lorentz force is also the right-hand-rule lover's paradise: thumb along v, fingers along B, palm points the way the force pushes a positive charge.`,
    history: `Hendrik Lorentz wrote down the force law in 1895 as part of his electron theory of matter, deliberately separating the electric and magnetic contributions and giving them a unified vector form. Earlier formulations (Maxwell's, Heaviside's) had contained equivalent content but mixed it into the field equations themselves; Lorentz cleanly distinguished the field equations (which describe what fields exist) from the force law (which describes how fields act on matter), an organisational choice that has structured every electromagnetism textbook since.`,
    relatedPhysicists: ["hendrik-antoon-lorentz"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
    ],
  },
  {
    slug: "magnetic-field",
    term: "Magnetic field",
    category: "concept",
    shortDefinition: "The vector field B that exerts a sideways force on moving charges and steady currents. Sourced by currents and intrinsic spin, never by isolated magnetic charges.",
    description: `The magnetic field B is the vector field that captures one half of electromagnetism — the half produced by currents and changing electric fields, and that pushes sideways on anything carrying charge or current. Where the electric field E pushes along its direction, the magnetic field pushes perpendicular to both itself and the velocity of whatever it acts on (the cross-product in qv×B), which is why charged particles in pure magnetic fields move in circles or helices rather than straight accelerations.

There are no magnetic monopoles. Where electric field lines begin and end on positive and negative charges, magnetic field lines always close on themselves — they have nowhere to begin and nowhere to end. This is the content of ∇·B = 0, one of Maxwell's four equations, and is observed to be an exact law in nature: every "north pole" comes paired with a "south pole" on the same magnet, and cutting the magnet in half just produces two new dipoles. The microscopic source of B is always a moving charge or an intrinsic angular-momentum spin, never a pole sitting alone.

B has units of tesla in SI (kg·s⁻²·A⁻¹) and gauss in CGS (1 T = 10⁴ G). Earth's surface field is about 50 microtesla. A refrigerator magnet is around 5 millitesla at the surface. An MRI machine runs at 1.5 to 3 tesla. The strongest steady fields ever built in a laboratory reach about 45 T. Pulsed fields can briefly hit a few thousand tesla. The magnetic fields near neutron stars exceed 10⁸ T, distorting atoms into pencil-shapes and rewriting how matter works.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "tesla-unit",
    term: "Tesla",
    category: "unit",
    shortDefinition: "The SI unit of magnetic flux density. One tesla equals one weber per square metre, or one newton per ampere-metre. Symbol: T.",
    description: `The tesla (symbol T) is the SI unit of magnetic flux density. It can be written several equivalent ways: 1 T = 1 Wb/m² (one weber per square metre) = 1 N/(A·m) = 1 V·s/m² = 1 kg/(A·s²). The most physically intuitive of these is the force-per-current-per-length form: a wire carrying one ampere, perpendicular to a one-tesla field, experiences a sideways force of one newton per metre of length.

A tesla is a strong field by everyday standards. Earth's surface magnetic field is only about 25–65 microtesla, depending on latitude. A refrigerator magnet is around 5 millitesla at its surface. A typical hospital MRI scanner runs at 1.5 or 3 tesla. The strongest continuous fields produced in the laboratory — using hybrid superconducting and resistive magnets at the National High Magnetic Field Laboratory — reach about 45 tesla. Pulsed magnets driven by capacitor banks can briefly exceed 100 T, and explosively driven flux-compression rigs have hit several thousand tesla for microseconds before destroying themselves. The most extreme natural magnetic fields, on the surface of magnetar neutron stars, are around 10¹¹ T.

The non-SI unit gauss (1 G = 10⁻⁴ T) survives in geophysics and astronomy, where it is more conveniently sized for naturally occurring fields. The tesla replaced the gauss as the SI primary unit in 1960 when the General Conference on Weights and Measures adopted the MKSA (now SI) system formally. The unit was named after Nikola Tesla, the Serbian-American inventor and engineer whose AC induction motor and polyphase electric power systems form the foundation of modern electrical infrastructure.`,
    history: `The unit was officially adopted at the 11th General Conference on Weights and Measures in 1960, named after Nikola Tesla (1856–1943) in recognition of his contributions to electrical engineering and AC power. It replaced the gauss (CGS unit) as the primary SI unit of magnetic flux density. The choice of name was politically delicate — Tesla had died penniless and largely forgotten in 1943, and the 1960 honour was part of a broader rehabilitation of his reputation that had been gathering pace through the 1950s.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
    ],
  },
  {
    slug: "current-density",
    term: "Current density",
    category: "concept",
    shortDefinition: "The vector J = nqv giving the charge passing per unit time through a unit area perpendicular to the flow direction. Units: amperes per square metre.",
    description: `Current density J is the local, vector-valued version of electric current. Where an ammeter reading I tells you how much charge passes through a particular cross-section per second (a single number, in amperes), J at a point tells you how much charge per second passes through a unit area perpendicular to the flow direction at that point, in the direction of the flow. Its magnitude has units of amperes per square metre, and it is a vector pointing along the local direction of charge transport.

For a uniform current flowing through a wire of cross-sectional area A, J = I/A and points along the wire. For a copper wire carrying a kilo-amp through a square millimetre, J ≈ 10⁹ A/m² — a nearly inconceivable density that the wire survives only because the conduction electrons are moving at drift velocities of millimetres per second through a sea of about 10²⁹ free electrons per cubic metre. The microscopic decomposition is J = nqv, where n is the number density of charge carriers, q is each carrier's charge, and v is the average drift velocity.

The total current through any surface is just the integral of J·dA over that surface — the flux of current density through the surface, exactly analogous to the flux of electric field that appears in Gauss's law. This is why current-density is the natural variable for the differential form of Ampère's law (∇×B = μ₀J + …) and for the Biot–Savart integral over an extended source (∫J × r̂ / r² dV). Whenever you go from talking about a wire as a 1-dimensional thread to talking about an extended conductor or a continuous medium, current splits into current-density.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
    ],
  },
  {
    slug: "biot-savart-law-term",
    term: "Biot–Savart law",
    category: "concept",
    shortDefinition: "The integral that gives the magnetic field of a steady current: dB = (μ₀/4π) (I dℓ × r̂) / r². Magnetism's analogue of Coulomb's law.",
    description: `The Biot–Savart law gives the magnetic field at a point produced by an arbitrary distribution of steady currents. In differential form, an infinitesimal current element I dℓ at displacement r from the field point contributes dB = (μ₀ / 4π) (I dℓ × r̂) / r², where r̂ is the unit vector from the source element to the field point and μ₀ is the permeability of free space. To get the total field, integrate this contribution over the entire current-carrying region.

Three things to notice about the formula. First, the inverse-square structure is the same as Coulomb's law for electric fields — the magnetic interaction falls off with distance the same way. Second, the cross-product I dℓ × r̂ encodes the rotational geometry that Ørsted observed in 1820: the magnetic field circulates around the current rather than pointing toward or away from it. Third, the factor μ₀/4π = 10⁻⁷ T·m/A in SI units (exactly, before the 2019 redefinition) is built into the unit of the ampere itself — Biot–Savart was the law used to define the SI ampere from 1948 to 2019.

Biot–Savart is to Ampère's law what Coulomb's law is to Gauss's law: an integral expression that always works, but is rarely the most efficient way to compute. For symmetric current geometries (long straight wire, infinite sheet, solenoid), Ampère's law collapses the integration to arithmetic. For everything else — finite wires, current loops, irregular distributions — Biot–Savart is the workhorse, and its line integral is the calculation that physics students perform a hundred times in their undergraduate years.`,
    relatedPhysicists: ["jean-baptiste-biot", "felix-savart"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "ampere-unit",
    term: "Ampere",
    category: "unit",
    shortDefinition: "The SI base unit of electric current. Since 2019, defined as the flow of exactly 1/(1.602176634 × 10⁻¹⁹) elementary charges per second. Symbol: A.",
    description: `The ampere (symbol A) is one of the seven SI base units, and the only one whose definition is intrinsically electromagnetic. It measures electric current — the rate of charge flow past a point — and one ampere equals one coulomb per second. By the 2019 SI redefinition the ampere is now defined exactly: the elementary charge is fixed at e = 1.602176634 × 10⁻¹⁹ C, and one ampere is the flow of 1/e ≈ 6.241 × 10¹⁸ elementary charges per second.

A typical household appliance draws between 1 A (LED bulb circuit) and 30 A (electric oven). A car starter motor briefly pulls hundreds of amperes from the battery during cranking. A welding arc runs at a few hundred amperes. Industrial electrolysis (aluminium smelting, chlorine production) runs at hundreds of thousands of amperes through cells the size of swimming pools. At the other end, a single neuron firing carries about a picoampere of ionic current; a quiet semiconductor circuit might leak nanoamperes; the dark current of a good photodiode is in femtoamperes.

Before 2019 the ampere had been defined operationally since 1948 in terms of the Biot–Savart force between two parallel wires: one ampere was the current that, flowing in two infinitely long parallel wires one metre apart, would produce a force of exactly 2 × 10⁻⁷ newtons per metre of length. The new definition is more elegant — it pins down the elementary charge directly and lets every other electrical unit follow — but the practical numbers are unchanged to many decimal places. The unit was named in 1881 at the International Electrical Congress in Paris, in honour of André-Marie Ampère.`,
    history: `The ampere was named at the 1881 International Electrical Congress in Paris, in honour of André-Marie Ampère, whose force law between current-carrying wires (1820–27) had founded mathematical electromagnetism. The 1948 SI definition pinned the ampere to the magnetic force between two parallel wires — fixing μ₀ = 4π × 10⁻⁷ T·m/A exactly. The 2019 SI redefinition flipped the logic: the elementary charge e is now fixed exactly, and the ampere is derived from charge per second. As a side effect, μ₀ is no longer exact but is now a measured quantity (still equal to 4π × 10⁻⁷ to many significant figures).`,
    relatedPhysicists: ["andre-marie-ampere"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
    ],
  },
  {
    slug: "amperes-law-term",
    term: "Ampère's law",
    category: "concept",
    shortDefinition: "The line integral of B around a closed loop equals μ₀ times the enclosed current: ∮ B·dℓ = μ₀ I_enc. Magnetism's analogue of Gauss's law.",
    description: `Ampère's law in its static form says that the line integral of the magnetic field B around any closed loop equals μ₀ times the total electric current threading the loop: ∮ B·dℓ = μ₀ I_enc. The "enclosed current" is the integral of current density J·dA over any surface bounded by the loop — and any surface gives the same answer, because charge is conserved.

Ampère's law is to magnetostatics what Gauss's law is to electrostatics. Both are exact integral statements of Maxwell's equations; both let you compute fields the easy way for symmetric current distributions; both fail to determine the field uniquely if the symmetry is broken. The trick is always the same: pick an Amperian loop whose geometry matches the symmetry of the current, so that B is constant in magnitude and parallel to dℓ along the loop. The textbook applications are an infinite straight wire (circular loop concentric with the wire, gives B = μ₀ I / (2πr) immediately), a long solenoid (rectangular loop straddling the windings, gives B = μ₀ n I where n is turns per length), and a toroid (circular loop running through the doughnut hole, gives B = μ₀ N I / (2πr)).

Maxwell completed Ampère's law in 1865 by adding a "displacement current" term: ∮ B·dℓ = μ₀ (I_enc + ε₀ d/dt ∫ E·dA). The extra piece says that a changing electric field acts like a current as far as B is concerned — which is what makes electromagnetic waves possible. For purely steady currents the displacement-current term vanishes and the law reduces to its 1820 form, which is what's used in magnetostatics.`,
    relatedPhysicists: ["andre-marie-ampere"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
    ],
  },
  {
    slug: "solenoid",
    term: "Solenoid",
    category: "instrument",
    shortDefinition: "A long, tightly wound helical coil of wire. Carrying a current, it produces a uniform magnetic field along its axis: B = μ₀ n I.",
    description: `A solenoid is a coil of wire wound into a long cylindrical helix. When current flows through it, each turn produces its own field, and the net result is a strong, uniform magnetic field along the axis inside the coil and a much weaker, leaky field outside. For an idealised infinite solenoid, the inside field is exactly B = μ₀ n I, where n is the number of turns per unit length and I is the current — independent of the radius of the coil and of where you sit inside it.

Real solenoids are finite, but as long as the length is at least several times the diameter, the central region behaves close to ideal. Lab-grade solenoids reach a few hundred millitesla; superconducting solenoids in MRI machines and particle physics experiments reach 1.5 to 12 T routinely; the bore magnets at the LHC and ITER are technologically heroic versions of the same basic device. At the small end, every electric door bell, cigarette lighter, fuel injector, and starter motor is built around a small solenoid that pulls or pushes a ferromagnetic plunger when energised.

Solenoids are the cleanest application of Ampère's law. Apply it to a rectangular Amperian loop straddling the coil's wall — one side inside, one side outside, the two short sides perpendicular to the axis. Outside the field is approximately zero; inside it runs along the axis; the perpendicular short sides contribute nothing because B is perpendicular to dℓ there. The line integral collapses to BL = μ₀ (nL) I, giving B = μ₀ n I in two lines of algebra. No other geometry in undergraduate magnetism rewards Ampère's law so cleanly.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
    ],
  },
  {
    slug: "toroid",
    term: "Toroid",
    category: "instrument",
    shortDefinition: "A coil wound into a doughnut shape. Confines its magnetic field almost entirely to the interior of the doughnut: B = μ₀ N I / (2πr).",
    description: `A toroid is a coil of wire wound around a doughnut-shaped core. If the coil is uniformly wound and the doughnut is closed (no gap), the magnetic field is entirely confined to the interior of the torus and runs in circles around the doughnut hole. The leakage field outside the toroid is negligibly small — far smaller than that of a comparable solenoid, because the field has nowhere to escape to.

Apply Ampère's law to a circular loop concentric with the doughnut hole, lying inside the torus, and you get BL = μ₀ N I, where N is the total number of turns wound on the toroid and L = 2πr is the loop circumference. So B = μ₀ N I / (2πr) inside, dropping smoothly with radius across the doughnut cross-section. Outside the torus (either through the hole or around the outer rim), the loop encloses zero net current — the windings come back through the inside as many times as they go out — and B = 0.

Toroidal coils are everywhere in power electronics. Every switching power supply contains toroidal inductors and transformers because the closed magnetic circuit means almost no stray flux to interfere with neighbouring components. Toroidal transformers in audio amplifiers run quieter and produce less external hum than equivalent E–I core designs. Tokamak fusion reactors confine deuterium-tritium plasma in a toroidal magnetic bottle for the same fundamental reason: a closed-loop B field has no end-points where the plasma could escape along field lines.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
    ],
  },
  {
    slug: "vector-potential",
    term: "Vector potential",
    category: "concept",
    shortDefinition: "The vector field A whose curl gives the magnetic field: B = ∇×A. Lets you compute B from a scalar-like integral over the source currents.",
    description: `The vector potential A is the magnetic counterpart of the electric scalar potential V. Where V satisfies E = −∇V (the electric field is the negative gradient of a scalar function), A satisfies B = ∇×A (the magnetic field is the curl of a vector function). The whole reason A exists is the divergence-free property of B: since ∇·B = 0 and the divergence of any curl is automatically zero, every magnetic field can be written as the curl of some vector field, and A is that vector field.

Operationally, A is often easier to compute than B. For a localised current distribution, A at a point r is given by the integral A(r) = (μ₀/4π) ∫ J(r') / |r−r'| dV', which has the same 1/|r−r'| structure as the electric potential integral and adds vectorially without the cross-products that make Biot–Savart messy. Once you have A, take its curl to get B. For a long straight wire, A points along the wire and falls off as ln(r); take the curl, and you get the familiar 1/r tangential B field. For a magnetic dipole, A has a clean 1/r² structure and reproduces the dipole B field directly.

The vector potential becomes essential — not optional — once you leave classical electromagnetism. In quantum mechanics, the canonical momentum of a charged particle is p − qA rather than just p, which means A appears directly in the Schrödinger equation through the gauge-covariant derivative. The Aharonov–Bohm effect (1959) shows that A produces measurable interference effects in regions where B is exactly zero — proving that A is more than just a calculational convenience. In quantum field theory, A is the photon field, and gauge symmetry built around it is the architectural principle of the Standard Model.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-vector-potential" },
    ],
  },
  {
    slug: "gauge-transformation",
    term: "Gauge transformation",
    category: "concept",
    shortDefinition: "A change A → A + ∇λ, V → V − ∂λ/∂t in the potentials that leaves all physical fields E and B unchanged. The freedom that defines what 'gauge' means.",
    description: `A gauge transformation is a redefinition of the electromagnetic potentials that leaves the physical fields untouched. Since B = ∇×A and the curl of any gradient is zero, you can replace A with A + ∇λ for any scalar function λ(r,t) without changing B. To keep E unchanged at the same time you also need to redefine V → V − ∂λ/∂t. Different choices of λ produce different "gauges" — different vector potentials that all describe the same physical electromagnetic field.

The freedom is convenience, but a powerful one. The Coulomb gauge fixes ∇·A = 0 and is the natural choice for magnetostatics — the integral A(r) = (μ₀/4π) ∫ J(r')/|r−r'| dV' satisfies ∇·A = 0 automatically when J is steady, and A becomes mathematically as well-behaved as the electric scalar potential. The Lorenz gauge ∇·A + (1/c²) ∂V/∂t = 0 is the natural choice for radiation problems, where it makes Maxwell's equations decouple into separate wave equations for V and each component of A. The Weyl gauge sets V = 0 entirely, which is what's commonly used in quantum field theory. None of these choices changes any measurable result; they only change how convenient the math looks.

The deep physical content is that gauge freedom is not a mathematical accident but a fundamental symmetry of the universe. In quantum mechanics, the wavefunction's phase is unobservable, and a gauge transformation A → A + ∇λ is exactly compensated by a phase rotation ψ → exp(iqλ/ℏ) ψ of the wavefunction. The requirement that physics be invariant under this kind of local phase change forces the existence of the electromagnetic field — gauge symmetry derives the photon. The same idea generalised to non-abelian gauge groups produces the strong nuclear force (SU(3) gauge symmetry) and the electroweak theory (SU(2)×U(1)). The whole architecture of the Standard Model is built from gauge transformations.`,
    history: `Hermann Weyl introduced the word "gauge" (German: Eichung, "calibration") in 1918 in a failed attempt to derive electromagnetism from a local rescaling symmetry of distances; the original idea didn't work, but the name stuck. In 1929 Weyl reformulated the symmetry as a local phase change of the quantum wavefunction — the modern electromagnetic gauge transformation. Yang and Mills generalised it to non-abelian gauge symmetries in 1954, and the resulting Yang–Mills theory became the framework of the Standard Model in the 1970s.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-vector-potential" },
    ],
  },
  {
    slug: "magnetic-dipole-term",
    term: "Magnetic dipole",
    category: "concept",
    shortDefinition: "The smallest possible source of a magnetic field — a tiny current loop or a single particle's intrinsic spin. The magnetic equivalent of an electric dipole.",
    description: `A magnetic dipole is the simplest unit of magnetism. It is what you get when you shrink any closed current loop down to a point while keeping its product of current × area constant — or equivalently, the intrinsic angular-momentum spin of an elementary particle like an electron. Far from the source, the magnetic field of any localised current distribution looks like that of a magnetic dipole, the same way the electric field of any localised charge distribution looks like that of an electric dipole far away.

The dipole's strength is a vector m, the magnetic moment, with units of ampere-square-metre (A·m²). For a small flat loop of area A carrying current I, m = IA n̂, where n̂ is the unit normal to the loop in the right-hand-rule sense (curl your fingers along the current, thumb points along m). For a magnetised material, m comes from the cumulative alignment of the atomic moments — primarily electron spins — that build up the bulk magnetisation.

There are no magnetic monopoles in classical or known fundamental physics, so the dipole is the leading term in any multipole expansion of a magnetic field. This is why a bar magnet has both a north and a south pole, why cutting a magnet in half gives you two complete magnets rather than one isolated north and one isolated south, and why the field of a spinning electron, the field of a magnetised iron filing, and the field of the Earth all have the same fundamental structure. The dipole moment is the right concept for thinking about magnetic torques (τ = m × B), magnetic potential energy (U = −m·B), the way compass needles align with fields, and the way MRI machines flip nuclear spins to generate their signals.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-dipoles" },
    ],
  },
  {
    slug: "magnetic-moment",
    term: "Magnetic moment",
    category: "concept",
    shortDefinition: "The vector m = IA n̂ that quantifies the strength and orientation of a magnetic dipole. Determines its torque, energy, and far-field structure in any external field.",
    description: `The magnetic moment m is the vector that fully characterises a magnetic dipole. For a current loop, m equals the current I times the loop's area A, pointing along the normal n̂ defined by the right-hand rule (curl fingers along the current direction, thumb gives m). For a magnetised lump of material, m is the volume integral of the magnetisation M (which is itself the magnetic moment per unit volume).

Magnetic moment determines everything about how a dipole interacts with an external magnetic field. The torque on a dipole is τ = m × B (which is why a compass needle rotates to align with Earth's field). The potential energy is U = −m·B (which is minimised when m is parallel to B, maximised when antiparallel — the basis of every NMR experiment and every MRI scan). The force on a dipole in a non-uniform field is F = ∇(m·B), which is why a strong magnet attracts iron filings: the filings polarise into induced dipoles, and the field gradient pulls them toward the source.

The natural unit for atomic magnetic moments is the Bohr magneton, μ_B = eℏ/(2m_e) ≈ 9.274 × 10⁻²⁴ J/T — the magnetic moment of an electron orbiting the proton in the ground state of hydrogen, and a useful scale for any electronic moment. The electron's intrinsic spin moment is about 1.001 μ_B (with QED corrections); proton magnetic moments are about a thousand times smaller (m_p ≈ 1.41 × 10⁻²⁶ J/T) because nuclear masses are much larger. A typical bar magnet's macroscopic moment is on the order of 0.1–1 A·m², built from the cumulative alignment of about 10²² atomic moments.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-dipoles" },
    ],
  },
  {
    slug: "weber-unit",
    term: "Weber",
    category: "unit",
    shortDefinition: "The SI unit of magnetic flux. One weber is the flux through a one-square-metre area of a one-tesla field. Symbol: Wb.",
    description: `The weber (symbol Wb) is the SI unit of magnetic flux. It is defined by Φ = ∫B·dA — the integral of the magnetic field's normal component over a surface — so 1 Wb = 1 T·m². Equivalently, 1 Wb is the flux that, decreasing uniformly to zero over one second, induces an EMF of one volt in a one-turn coil enclosing it: 1 Wb = 1 V·s.

The weber is a mid-sized electromagnetic unit. A typical bar magnet might carry on the order of a millimicroweber of total flux through its central cross-section. The flux through a 100-turn coil in a small motor, generating useful EMF at line frequency, is a fraction of a millimicroweber per turn. Power transformer cores carry tens of milliwebers of peak AC flux per turn. The total magnetic flux of the Earth's dipole field crossing a hemisphere is about 5 × 10⁹ Wb.

The weber is the natural unit for Faraday's law of induction (EMF = −dΦ/dt, voltage equals rate of change of flux), and for any calculation involving flux quantization in superconductors — where the fundamental quantum of flux is the magnetic flux quantum Φ₀ = h/(2e) ≈ 2.068 × 10⁻¹⁵ Wb, the smallest amount of magnetic flux that can thread through a superconducting ring. SQUID magnetometers (superconducting quantum interference devices) measure changes of fractions of a flux quantum, making them by far the most sensitive magnetic-field detectors ever built — sensitive enough to measure the few-femtotesla magnetic fields produced by neural currents in a working human brain.`,
    history: `The weber was named in 1935 by the International Electrotechnical Commission, in honour of Wilhelm Eduard Weber (1804–1891), the German physicist who built the first practical electromagnetic telegraph between Gauss's observatory and his own laboratory in Göttingen in 1833 (a 1.2 km link), and who established the absolute system of electromagnetic units that defined unit electric current via measurable mechanical force. Weber's collaboration with Gauss is the reason the SI tesla, weber, and gauss all carry German names from the same generation.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-dipoles" },
    ],
  },
  {
    slug: "curl",
    term: "Curl",
    category: "concept",
    shortDefinition: "A vector operation ∇× that measures how much a vector field circulates around a point. Nonzero curl means the field has rotational structure; zero curl means it is conservative.",
    description: `The curl of a vector field F, written ∇×F, is itself a vector field that measures how much F circulates around each point. Imagine dropping a tiny paddle-wheel into a fluid whose velocity is F: the curl at the paddle-wheel's location tells you which axis the wheel will spin around (the direction of ∇×F) and how fast (the magnitude). Where the curl is zero, the wheel sits still; where the curl is nonzero, the wheel spins, and the field has rotational structure.

Mathematically, ∇×F is a determinant-style construction with components (∂F_z/∂y − ∂F_y/∂z, ∂F_x/∂z − ∂F_z/∂x, ∂F_y/∂x − ∂F_x/∂y). Stokes' theorem connects local curl to a closed-loop integral: the flux of ∇×F through any open surface equals the line integral of F around the boundary loop, ∫(∇×F)·dA = ∮F·dℓ. This is the calculus that makes Ampère's law sing: in differential form ∇×B = μ₀J + (1/c²)∂E/∂t says "the curl of the magnetic field at every point equals μ₀ times the local current density plus a displacement-current term", and Stokes' theorem turns that into the integral statement ∮B·dℓ = μ₀ I_enc that's easier to apply.

Curl is one of two fundamental vector-calculus operations that decompose any vector field, the other being divergence. Helmholtz's theorem says any well-behaved vector field is uniquely determined (up to a constant) by its divergence and its curl together — so once you know ρ = ε₀∇·E and J = (1/μ₀)∇×B (plus the displacement-current piece) for the electromagnetic field, you have specified the field completely. Maxwell's equations are exactly the four divergence and curl equations needed to do this for E and B simultaneously.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
      { branchSlug: "electromagnetism", topicSlug: "the-vector-potential" },
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
