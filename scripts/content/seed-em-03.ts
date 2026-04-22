// Seed EM §04 Magnetism-in-matter + §05 Induction (5 physicists + 24 glossary terms).
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-em-03.ts
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
    slug: "pierre-weiss",
    name: "Pierre Weiss",
    shortName: "Weiss",
    born: "1865",
    died: "1940",
    nationality: "French",
    oneLiner: "Alsatian physicist who invented the concept of magnetic domains and wrote the first mean-field theory in condensed-matter physics.",
    bio: `Pierre Weiss was born in Mulhouse in 1865, when Alsace was still French. He was eight when the Franco-Prussian War transferred his home city to the German Empire; he spent his adolescence in a German-speaking gymnasium and his undergraduate years at the ETH Zürich, taking his engineering degree in 1887. He picked up a doctorate in physics at the Sorbonne in 1896 and spent the rest of his career shuttling between Zurich, Rennes, and Strasbourg — every move following the shifting political borders of his native region. Few physicists of his generation worked across three national scientific traditions; Weiss worked in all three and was fluent in all three.

His 1907 paper "L'hypothèse du champ moléculaire et la propriété ferromagnétique" is the founding document of modern ferromagnetism. Pierre Curie had already shown that ferromagnets lose their magnetisation above a critical temperature, and that paramagnets obey χ = C/T. But Curie's law couldn't explain why a piece of iron retains magnetisation when the applied field is removed, or why ferromagnets exhibit hysteresis. Weiss proposed a single sharp idea: inside a ferromagnet, each atomic magnetic moment feels not just the external field but an enormous internal "molecular field" produced by the average alignment of all its neighbours. This mean-field self-consistency turned Curie's law into the Curie–Weiss law, χ = C/(T − T_c), and predicted — correctly — that the transition to ferromagnetism would be a genuine phase transition at T_c. The molecular field is fictitious as a microscopic entity (exchange interactions, not classical dipole sums, actually do the work, as Heisenberg would show in 1928), but as a mean-field device it gave quantitative predictions that matched iron, nickel, and cobalt.

Weiss needed a second idea to explain everyday ferromagnetism: if every magnet were uniformly magnetised, every piece of iron would lift nails on contact. He proposed that bulk ferromagnets are divided into tiny regions — he called them *domains* — each uniformly magnetised but pointing in different directions, so the macroscopic average cancels out. An external field doesn't rotate atomic moments; it grows the domains aligned with the field at the expense of misaligned ones, via boundary motion. Domain boundaries were first seen experimentally by Francis Bitter in 1931 using magnetic-powder patterns, twenty-four years after Weiss had predicted them. Weiss himself also pioneered high-field electromagnet design — the Bitter magnets at his Strasbourg laboratory reached the highest sustained fields in Europe through the 1920s — and served as director of the Strasbourg physics institute until the 1940 German invasion forced him south to Lyon, where he died later that year. The mean-field approach he invented became the template for every subsequent order-parameter theory, from superconductivity to superfluid helium to the Ising model: average everything, solve self-consistently, get the phase transition.`,
    contributions: [
      "Proposed the molecular-field hypothesis (1907) — the first mean-field theory in condensed-matter physics, explaining ferromagnetic order",
      "Derived the Curie–Weiss law χ = C/(T − T_c) for paramagnets above the ferromagnetic transition temperature",
      "Coined the term *magnetic domain* and predicted the domain structure of bulk ferromagnets two decades before experimental confirmation",
      "Designed high-field water-cooled electromagnets at Strasbourg that reached the strongest sustained fields in 1920s Europe",
      "Served as director of the physics institute in Strasbourg and trained a generation of French and Swiss experimental magnetism researchers",
    ],
    majorWorks: [
      "L'hypothèse du champ moléculaire et la propriété ferromagnétique (1907) — founding paper of mean-field ferromagnetism",
      "Le magnétisme (1926) — comprehensive French-language textbook summarising his domain-and-molecular-field theory",
      "Les équations fondamentales du ferromagnétisme (1930s lectures) — late-career refinement of the mean-field formalism",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
    ],
  },
  {
    slug: "walther-meissner",
    name: "Walther Meißner",
    shortName: "Meißner",
    born: "1882",
    died: "1974",
    nationality: "German",
    oneLiner: "German low-temperature physicist who, with Robert Ochsenfeld in 1933, discovered that superconductors actively expel magnetic flux — the defining property that makes superconductivity a phase of matter.",
    bio: `Walther Meißner was born in Berlin in 1882, the son of a middle-class family of civil servants. He studied mechanical engineering and then physics at the Technische Hochschule Berlin and at the University of Munich, where he wrote his doctorate under Max Planck on the interaction of radiation and matter. He joined the Physikalisch-Technische Reichsanstalt (PTR) — Germany's national metrology laboratory in Charlottenburg, the equivalent of Britain's NPL or America's NIST — in 1908 and stayed for a quarter-century. His assignment: build a low-temperature capability that could rival the Dutch. Kamerlingh Onnes at Leiden had been the world's only source of liquid helium since 1908, and Germany needed its own.

It took Meißner fourteen years, but in 1925 the PTR brought its first helium liquefier online — the third in the world after Leiden and Toronto. With helium in hand, Meißner spent the late 1920s systematically measuring the superconducting transitions of metal after metal: niobium, tantalum, thorium. He found five new elemental superconductors by 1930, doubling the known list. Then, in October 1933, he and his postdoc Robert Ochsenfeld ran an experiment no one at Leiden had thought to try: they cooled tin and lead cylinders through T_c *in the presence of* an applied magnetic field, and measured the field just outside the sample. What they found shocked the community. As the sample crossed T_c, the external magnetic field redistributed as if the cylinder had suddenly become a perfect diamagnet — the flux was expelled from the interior, not merely frozen in place. Before this result, superconductivity was understood as "perfect conduction": infinite electrical conductivity that, by Lenz's law, would freeze in whatever flux was present at the moment of transition. After the Meißner–Ochsenfeld paper, superconductivity was understood as a distinct thermodynamic phase of matter with the active expulsion of magnetic flux as its signature. The Londons' 1935 phenomenological theory and BCS theory in 1957 built on this foundation; neither would have been possible without the Meißner effect as a boundary condition.

Meißner became professor of technical physics at the Technische Hochschule München in 1934 and stayed in Munich through the war, through the destruction of his laboratory in an Allied air raid in 1944, and through the lean years of rebuilding. In 1946 he was elected president of the Bavarian Academy of Sciences, a post he held for fifteen years. He established a low-temperature institute in Herrsching on Lake Ammersee that later moved to Garching and, in 2002, was renamed the Walther-Meißner-Institut in his honour — today one of the world's leading superconductivity laboratories, specialising in the study of high-T_c materials. Meißner himself lived to see the first BCS-era experiments confirming his 1933 work in detail, and died in 1974 at the age of ninety-one, still publishing review articles on the state of low-temperature physics.`,
    contributions: [
      "Discovered the Meißner effect (1933) with Robert Ochsenfeld — the active expulsion of magnetic flux from a superconductor on cooling through T_c",
      "Demonstrated that superconductivity is a distinct thermodynamic phase, not merely perfect conductivity",
      "Built Germany's first helium liquefier at the PTR in Berlin (1925), breaking Leiden's twenty-year monopoly on helium-temperature physics",
      "Discovered five new elemental superconductors (niobium, tantalum, thorium, titanium, thallium) during the late 1920s",
      "Founded the Munich low-temperature laboratory that became the Walther-Meißner-Institut, one of the leading superconductivity centres in Europe",
    ],
    majorWorks: [
      "Ein neuer Effekt bei Eintritt der Supraleitfähigkeit (1933) — with Robert Ochsenfeld; discovery of the Meißner effect",
      "Messungen mit Hilfe von flüssigem Helium (late 1920s series) — systematic measurements of elemental superconductors at the PTR",
      "Entwicklung der Tieftemperaturphysik (1960) — historical review of low-temperature physics from Kamerlingh Onnes to BCS",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "heike-kamerlingh-onnes",
    name: "Heike Kamerlingh Onnes",
    shortName: "Kamerlingh Onnes",
    born: "1853",
    died: "1926",
    nationality: "Dutch",
    oneLiner: "Dutch experimental virtuoso who first liquefied helium in 1908 and, three years later, discovered that mercury's electrical resistance vanishes below 4.2 K — the discovery of superconductivity.",
    bio: `Heike Kamerlingh Onnes was born in Groningen in 1853 to a family of industrialists; his father ran a tileworks. He studied at the universities of Heidelberg, where he worked with Bunsen and Kirchhoff, and Groningen, where he took his doctorate in 1879 on a new proof of the rotation of the Earth. In 1882, at twenty-nine, he was appointed to the chair of experimental physics at Leiden, a post he would hold for forty-two years. He took it up with a singular and unusual mission statement, which he carved into the stone lintel above the entrance to the Leiden physics building: *door meten tot weten* — "through measuring, to knowing." The phrase is still visible today. He meant it programmatically: Leiden would be an experimental factory for taking physics to the lowest possible temperatures and watching what happened there.

The programme was methodical and relentless. Where other laboratories treated cryogenics as a sideline, Kamerlingh Onnes built a vertically integrated workshop with instrument-makers, glassblowers, machinists, and liquefier operators — the template for what later became big-science laboratory organisation. By 1894 his group had liquefied air; by 1898 hydrogen (20 K); in July 1908, after more than a decade of engineering the helium-liquefaction problem, he produced the first 60 millilitres of liquid helium in a silvered glass vessel, reaching 4.2 K — a temperature no laboratory on Earth had ever achieved before. For three years Leiden was the only place in the world where experiments below 4 K were possible. Kamerlingh Onnes used the helium to study the low-temperature resistance of metals. On 8 April 1911, his student Gilles Holst watched the resistance of a fine mercury thread drop smoothly as the sample cooled — and then, between 4.22 K and 4.19 K, fall abruptly to a value so small that Holst could not distinguish it from zero with the galvanometer available. Kamerlingh Onnes repeated the experiment through May with different mercury purities and circuit geometries. The phenomenon was real. He named it *supraconductivity* (later anglicised to *superconductivity*) and announced it at the Solvay Conference of 1911. He received the Nobel Prize in 1913 for the liquefaction of helium, with a citation that also called out his "investigations on the properties of matter at low temperatures."

For the rest of his life, Kamerlingh Onnes pushed deeper into the superconducting state. He built superconducting magnets out of lead wire and demonstrated persistent currents circulating for hours with no measurable decay — the first experimental demonstration that the zero-resistance state was genuinely zero. He trained a generation of Dutch cryogenicists who went on to dominate the field, including Willem Keesom (who later discovered the superfluid transition in helium-II). He died in Leiden in 1926 at seventy-two, leaving behind the experimental template that every low-temperature physics laboratory in the world still uses: measure more precisely than anyone else has, push the boundary conditions further than anyone else has, and watch carefully for the moment when nature does something you did not expect.`,
    contributions: [
      "Liquefied helium for the first time (10 July 1908) at Leiden, reaching 4.2 K and opening the era of sub-4 K physics",
      "Discovered superconductivity (April 1911) in solid mercury — the first observation of zero electrical resistance as a thermodynamic phase",
      "Demonstrated persistent currents in superconducting lead rings, experimentally confirming that the resistance is truly zero and not merely small",
      "Founded the Leiden cryogenic laboratory as the template for modern experimental big-science, with integrated workshops and dedicated technical staff",
      "Awarded the 1913 Nobel Prize in Physics for his low-temperature investigations, in particular the liquefaction of helium",
    ],
    majorWorks: [
      "The Liquefaction of Helium (1908) — report to the Royal Netherlands Academy describing the first helium liquefaction",
      "Further Experiments with Liquid Helium: On the Change of Electrical Resistance of Pure Metals at Very Low Temperatures (1911) — discovery of superconductivity in mercury",
      "Persistent Currents in Superconductors (1914) — first demonstration of loss-free current in a closed superconducting loop",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "joseph-henry",
    name: "Joseph Henry",
    shortName: "Henry",
    born: "1797",
    died: "1878",
    nationality: "American",
    oneLiner: "Self-taught American physicist who independently discovered electromagnetic induction and self-inductance, built the first practical electromagnets, and became the founding secretary of the Smithsonian Institution.",
    bio: `Joseph Henry was born in Albany, New York, in 1797 to a Scottish immigrant day-labourer who died when Henry was nine. He was sent to live with relatives in the Catskills, apprenticed to a watchmaker, and flirted briefly with a career in the theatre before a borrowed copy of George Gregory's *Lectures on Experimental Philosophy* — picked up almost by accident at age sixteen — set him on the path of science. He paid his way through the Albany Academy (a local secondary school) by tutoring, surveying, and road-building, and in 1826 was hired to teach mathematics and natural philosophy there. Between 1827 and 1832, while teaching a full load of classes, he conducted the experiments that made him the most important American physicist of the nineteenth century.

Henry's central insight was that a long coil of insulated wire, wrapped tightly around a soft-iron core, would produce an electromagnet far more powerful than the bare-iron, loosely-wound versions then in use. In 1831 he built an electromagnet for Yale College that lifted 2,063 pounds; a larger one for Princeton lifted 3,500. No previous device had come within a factor of ten of that performance. Working with these powerful magnets, he discovered electromagnetic self-induction in 1832 — the fact that a changing current in a coil induces a back-EMF in the same coil, resisting the change — independently of Faraday, who had discovered mutual induction in London a few months earlier. Henry also built the first practical electromechanical relay in 1835, the device that Samuel Morse would later adapt (without attribution) into the repeater that made long-distance telegraphy possible. In 1835 Princeton hired him as professor of natural philosophy. In 1846, when Congress at last decided what to do with the strange bequest left to the United States by the English chemist James Smithson, Henry was named the first Secretary of the Smithsonian Institution — effectively the chief administrative and scientific officer of the Republic's new national museum and research organisation.

Henry's greatest regret was publication delay. He discovered self-induction in 1832 but, in the characteristic reticence of American scientists of the period, did not publish until Faraday's 1834 papers on mutual induction made clear that an independent discovery claim would be lost unless asserted. By then European priority belonged to Faraday. When the SI unit system was revised in 1960, the unit of inductance (volt-seconds per ampere) was named the *henry* in his honour — a belated European acknowledgement of American priority. He died in 1878 in Washington, DC, and was buried with state honours. His Albany-era notebooks, now at the Smithsonian, contain the earliest recorded descriptions of back-EMF, the step-down transformer principle, and the sensitive-relay telegraph — three ideas on which most of twentieth-century electrical engineering rests.`,
    contributions: [
      "Independently discovered electromagnetic self-induction (1832), contemporaneous with Faraday's work on mutual induction",
      "Built the first practical high-force electromagnets — 3,500 lbs of lift at Princeton in 1831, an order of magnitude beyond any previous device",
      "Invented the electromagnetic relay (1835), the key technology later used by Morse to make long-distance telegraphy commercially viable",
      "First described the back-EMF produced by a changing current, along with the principle of the step-down transformer",
      "Served as the first Secretary of the Smithsonian Institution (1846–1878), shaping American scientific infrastructure for a generation",
    ],
    majorWorks: [
      "On the Production of Currents and Sparks of Electricity from Magnetism (1832) — first announcement of self-induction",
      "Contributions to Electricity and Magnetism (1839) — collected Princeton papers on induction and the relay",
      "Meteorology in Its Connection with Agriculture (1855–1859) — lectures from his Smithsonian period establishing the first U.S. national weather service",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "heinrich-lenz",
    name: "Heinrich Friedrich Emil Lenz",
    shortName: "Lenz",
    born: "1804",
    died: "1865",
    nationality: "Russian-German",
    oneLiner: "Baltic-German physicist working in St. Petersburg who formulated the sign rule of electromagnetic induction in 1834 and independently derived Joule's law of resistive heating.",
    bio: `Heinrich Lenz was born in 1804 in Dorpat (now Tartu, Estonia), then a German-speaking university town within the Russian Empire. He entered the University of Dorpat at eighteen to study chemistry and physics, but his academic career took an unexpected turn when, at twenty-two, he was invited to serve as the physicist on Otto von Kotzebue's third circumnavigation of the globe aboard the Russian sloop *Predpriyatiye* (1823–1826). For three years Lenz measured seawater salinity, ocean temperatures at depth, and atmospheric pressure across the Pacific and Atlantic; his data — some of the first systematic oceanographic measurements ever taken — were still being cited a century later. He returned to St. Petersburg in 1828, joined the Academy of Sciences the following year, and in 1836 became professor of physics at St. Petersburg University, where he spent the rest of his life.

Lenz's 1834 paper "Über die Bestimmung der Richtung der durch elektrodynamische Vertheilung erregten galvanischen Ströme" ("On the Determination of the Direction of Galvanic Currents Excited by Electrodynamic Distribution") gave the rule that now carries his name: the direction of an induced current is always such that the magnetic field it produces opposes the change in flux that caused the induction. Faraday had already given the quantitative relationship — EMF proportional to rate of change of flux — but had treated the sign as an experimental convention. Lenz recognised it as a consequence of energy conservation: if the induced current reinforced the change, a small perturbation would feed back into itself and grow without bound, violating energy conservation. Instead, the induced current must subtract energy from the changing flux, turning the induction process into the electromagnetic analogue of inertia. The minus sign in Faraday's law — EMF = −dΦ/dt — is Lenz's contribution, and every textbook derivation of energy conservation in induced circuits routes through his argument.

Independently of James Prescott Joule, Lenz also established in 1842 that the heat dissipated in a resistor is proportional to the square of the current and to the resistance — the relation now known either as Joule's law or the Joule–Lenz law depending on tradition (Germans, Russians, and much of continental Europe call it Joule–Lenz; Anglophones call it Joule's law and usually omit Lenz). Lenz's measurements, made with self-built precision calorimeters, were actually more accurate than Joule's early results, but Joule published first and with greater fanfare. Lenz remained scientifically active into his sixties, holding the deanship of the physics faculty at St. Petersburg and serving as rector of the university from 1863. In January 1865, while on a European holiday in Rome, he suffered a fatal stroke while walking on the cliffs above the city; he was sixty-one. The rule of electromagnetic induction that bears his name is, in its simplest form, the principle every engineer uses to design eddy-current brakes, induction cookers, and regenerative motor systems: push against a magnetic change and the magnetic change pushes back.`,
    contributions: [
      "Formulated Lenz's law (1834): the direction of an induced current is always such as to oppose the change in flux that caused it",
      "Provided the energy-conservation interpretation of Faraday's minus sign — induced currents subtract energy from the inducing change",
      "Independently of Joule, established the I²R heating law (1842), now called the Joule–Lenz law in continental Europe",
      "Conducted pioneering oceanographic measurements on the Kotzebue circumnavigation (1823–1826), among the first systematic data on ocean temperature and salinity profiles",
      "Co-founded Russian physics as an academic discipline, serving as professor and later rector of St. Petersburg University",
    ],
    majorWorks: [
      "Über die Bestimmung der Richtung der durch elektrodynamische Vertheilung erregten galvanischen Ströme (1834) — founding statement of Lenz's law",
      "Über die Gesetze, nach welchen der Magnet auf eine Spirale eine momentane Wirkung ausübt (1838) — further work on induced currents",
      "Handbuch der Physik (1860) — Russian-language textbook; the first comprehensive physics textbook written in Russian",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "magnetization",
    term: "Magnetization",
    category: "concept",
    shortDefinition: "The vector M = (magnetic dipole moment)/(volume) inside a magnetised material, measured in amperes per metre. The magnetic analogue of polarization density.",
    description: `Magnetization is what matter does in a magnetic field. Every atom in the material carries a small magnetic moment — from the orbital motion of its electrons, from the intrinsic spin of those electrons, sometimes from the nucleus. In most materials at zero field these moments point randomly, and the macroscopic average is zero. Apply an external field and the moments either align with it (paramagnetism), tilt slightly against it (diamagnetism), or — in ferromagnets — spontaneously align with each other over huge collective regions, so that even without a field the material remembers a direction.

The magnetization density M is the bookkeeping quantity that summarises all this atomic detail in a single vector field. At each point in the material, take a tiny volume containing many atoms, sum their dipole moments vectorially, and divide by the volume: the result is M, measured in amperes per metre (equivalently, in A·m² per m³). M points in the direction the atomic moments are preferentially aligned, and its magnitude tells you how strongly they are aligned. For ordinary linear materials, M is proportional to the applied H-field: M = χ H, where χ is the magnetic susceptibility — positive for paramagnets, negative for diamagnets, and huge (of order 10³ or more) for ferromagnets.

The power of M is that it lets you forget about the trillions of microscopic moments and just track one smooth field. Once you know M everywhere inside the material, you can recover the bound current density (J_b = ∇×M inside, K_b = M×n̂ on surfaces) that ultimately generates the material's contribution to the magnetic field, and you can define the H-field (H = B/μ₀ − M) that separates the free-current part from the matter-response part. M is the magnetic analogue of the polarization density P in dielectrics: the single vector that bridges the atomic mess and the macroscopic field equations.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "h-field",
    term: "H-field",
    category: "concept",
    shortDefinition: "The auxiliary magnetic field H = B/μ₀ − M, in amperes per metre. Its circulation around a loop is determined by free currents only, ignoring bound currents inside magnetised matter.",
    description: `The H-field is the "currents-we-control" part of the magnetic field. Inside a magnetised material, the microscopic magnetic field B is produced by two populations of current: free currents, which are the ones you drive through wires with a power supply, and bound currents, which are the tiny atomic circulations that add up to the material's magnetization M. Writing B as the sum of these two contributions and rearranging gives H = B/μ₀ − M — the auxiliary field whose curl is driven purely by free current density, ∇×H = J_free.

Mathematically, this is the exact analogue of what the displacement field D does in dielectrics: D = ε₀E + P tracks the free-charge part of electrostatics, and H = B/μ₀ − M tracks the free-current part of magnetostatics. Ampère's law, restated for H, reads ∮H·dℓ = I_free — no factor of μ₀ and no explicit bound-current term, because M has already absorbed the bound currents into its definition. In SI units H is measured in amperes per metre.

The H-field is an experimentalist's tool. If you wind a solenoid around a chunk of iron and run 1 A through N turns per metre, the H-field inside the iron is exactly N·I = N amperes per metre, regardless of what the iron is doing. The iron's response shows up separately as M — an enormous M, in fact, often thousands of times larger than H itself. The B-field inside is then B = μ₀(H + M), dominated by the M term. H cleanly separates "what you put in" (current through the coil) from "how the material responded" (magnetization), which is exactly what you want when characterising magnetic materials.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
    ],
  },
  {
    slug: "magnetic-susceptibility",
    term: "Magnetic susceptibility",
    category: "concept",
    shortDefinition: "The dimensionless ratio χ = M/H measuring how strongly a linear magnetic material is magnetised by an applied H-field. Negative for diamagnets, positive and small for paramagnets, large for ferromagnets.",
    description: `Magnetic susceptibility χ is the simplest possible model of a magnetic material: the magnetization is proportional to the applied H-field, M = χ H, and χ is a single dimensionless number that characterises the material. The relative permeability is related by μ_r = 1 + χ, and the B-field inside is B = μ₀(1 + χ)H = μ₀μ_r H.

Three regimes appear in the periodic table. Diamagnetic materials have χ slightly negative, typically of order −10⁻⁵, because every electron orbit in any atom Lenz-responds to an applied field by developing a tiny counter-current that opposes it — a universal response, usually swamped by stronger effects when present. Paramagnetic materials have χ positive and small, of order 10⁻³ to 10⁻⁵, because thermal motion competes with the field's tendency to align their permanent atomic magnetic moments; Curie's law gives χ ≈ C/T, with the susceptibility dropping as temperature rises. Ferromagnetic materials, below their Curie temperature, have enormous effective susceptibilities — χ of order 10³ to 10⁶ — because neighbouring atomic moments spontaneously align via exchange interaction, so even a tiny applied field propagates through the whole domain structure.

Susceptibility is only useful for linear materials — those where the M-vs-H curve is a straight line through the origin. Ferromagnets obey this approximately at very low fields, but above that they saturate, hysterese, and remember previous magnetisations; for ferromagnets you need the full B-vs-H loop, not a single susceptibility number. For dia- and paramagnets, though, χ is an accurate description over the entire range of experimentally accessible fields.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
    ],
  },
  {
    slug: "magnetic-permeability",
    term: "Magnetic permeability",
    category: "concept",
    shortDefinition: "The factor μ that relates B to H in a linear magnetic material: B = μH. Vacuum has μ = μ₀; other materials are characterised by the relative permeability μ_r = μ/μ₀ = 1 + χ.",
    description: `Magnetic permeability μ is the constant of proportionality between the B-field and the H-field inside a linear magnetic material: B = μH. In vacuum, μ equals the vacuum permeability μ₀ = 4π × 10⁻⁷ T·m/A (exact until the 2019 SI redefinition, now a measured value close to that). Inside matter, μ is larger or smaller depending on whether the material's magnetization adds to or subtracts from the applied field: μ = μ₀(1 + χ) = μ₀ μ_r.

The relative permeability μ_r is a dimensionless number that's often more convenient to work with. Most non-magnetic materials have μ_r ≈ 1 to six decimal places — air, glass, copper, water are all effectively vacuum from the magnetic point of view. Paramagnets like aluminium have μ_r a tiny bit above 1, diamagnets like bismuth a tiny bit below. Ferromagnets are the outliers: soft iron can reach μ_r ≈ 5,000, mu-metal ≈ 50,000, supermalloy ≈ 800,000. These are the materials engineers use to channel magnetic flux — inside a transformer core or a motor stator, they behave like perfect conductors of the B-field, squeezing flux lines into whatever shape the iron takes.

Permeability is only a useful concept in the linear regime. Ferromagnets are nonlinear: the M-vs-H curve saturates, and the B-vs-H curve shows hysteresis. In this regime μ is not a single number; it's either a *differential* permeability dB/dH that varies along the loop, or an *effective* permeability defined at one particular operating point. Manufacturers of magnetic materials quote both, plus the saturation B_sat and the coercive H_c, to characterise the material completely.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
    ],
  },
  {
    slug: "diamagnetism",
    term: "Diamagnetism",
    category: "phenomenon",
    shortDefinition: "The universal property of all matter to develop a weak magnetization *opposite* to an applied field. In most materials it is swamped by para- or ferromagnetism, but in closed-shell atoms it dominates.",
    description: `Diamagnetism is the universal, always-present magnetic response of electrons in orbital motion. Apply a magnetic field to any electron orbit and, by Lenz's law, the orbit adjusts: electrons moving one way around speed up slightly, electrons moving the opposite way slow down. The net change produces a tiny magnetic moment pointing *against* the applied field. Every atom in every material does this. The susceptibility is small and negative, typically χ ≈ −10⁻⁵.

In most materials diamagnetism is hidden. If the atoms carry permanent magnetic moments — unpaired electron spins or uncompensated orbital angular momenta — then the much larger paramagnetic (or ferromagnetic) response from moment-alignment swamps the diamagnetic counter-current. Diamagnetism becomes visible only in materials whose atoms have fully closed shells: noble gases, water, many organic molecules, copper, gold, bismuth, superconductors. Bismuth is the strongest ordinary diamagnet (χ ≈ −1.7 × 10⁻⁴); water is weakly diamagnetic (χ ≈ −9 × 10⁻⁶), just enough that a levitating-frog demonstration in a 16 T Bitter magnet famously worked in Nijmegen in 1997.

Superconductors are the extreme case: they exhibit *perfect* diamagnetism, χ = −1, expelling applied flux entirely from their interiors (the Meißner effect). This is qualitatively different from ordinary diamagnetism — an ordinary diamagnet merely reduces the field inside, while a superconductor drives it to zero — but both share the same sign: a magnetization opposing the applied field, a material that weakly (or, in the superconducting case, perfectly) pushes magnetic fields away. The modern quantum picture comes from Landau's diamagnetism theory (1930), which derives the effect from the quantisation of electron orbits in a magnetic field into Landau levels.`,
    history: `Diamagnetism was discovered by Michael Faraday in 1845, when he showed that a piece of bismuth placed between the poles of a strong electromagnet oriented itself *perpendicular* to the field — the opposite of what iron filings do. He coined the word "diamagnetic" (from Greek *dia-*, "across") to distinguish this behaviour from "paramagnetic" alignment with the field. Langevin gave the first classical theory in 1905; Landau gave the quantum theory in 1930.`,
    relatedPhysicists: ["michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "paramagnetism",
    term: "Paramagnetism",
    category: "phenomenon",
    shortDefinition: "The weak alignment of permanent atomic magnetic moments with an applied field, competing against thermal randomisation. Susceptibility is positive and follows Curie's law χ = C/T.",
    description: `Paramagnetism is what happens in materials whose atoms carry permanent magnetic moments — unpaired electron spins, incompletely filled d-shells or f-shells — but where those moments don't interact strongly enough with each other to spontaneously align. At zero field, thermal agitation keeps the moments pointing in random directions and the macroscopic magnetization averages to zero. Apply an external field, and each moment feels a torque that tries to align it with the field. The tendency to align is opposed by thermal noise.

The balance between field-alignment energy (−μ·B, lowest when m is parallel to B) and thermal energy (k_B T per mode) determines the equilibrium magnetization. In the weak-field, high-temperature limit where μB ≪ k_B T, statistical mechanics gives Curie's law: χ = C/T, where the Curie constant C = n μ²/(3 k_B), n is the number density of atoms, and μ is the individual atomic moment. The susceptibility falls as temperature rises — heat jostles the moments harder, and the same applied field can align a smaller fraction of them. In the opposite, low-temperature or strong-field limit, the magnetization saturates when all the moments point along the field.

Typical paramagnetic susceptibilities are small but consistently positive: aluminium χ ≈ +2 × 10⁻⁵, platinum χ ≈ +2.6 × 10⁻⁴, oxygen (at STP) χ ≈ +1.9 × 10⁻⁶. The fact that oxygen is paramagnetic while nitrogen is diamagnetic is visible as a classroom demo: liquid-air mixtures spill out of a funnel differently in the gap of a strong magnet, with the oxygen pulling toward the poles. Rare-earth salts — gadolinium, dysprosium, erbium sulfates — are strongly paramagnetic at room temperature and become the working substances of adiabatic-demagnetisation refrigerators used to reach milli-kelvin temperatures.`,
    relatedPhysicists: ["pierre-curie"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
    ],
  },
  {
    slug: "ferromagnetism",
    term: "Ferromagnetism",
    category: "phenomenon",
    shortDefinition: "The spontaneous parallel alignment of atomic magnetic moments via quantum exchange interaction, producing permanent magnetization below a critical Curie temperature. The origin of magnetism in iron, nickel, cobalt, and everyday magnets.",
    description: `Ferromagnetism is the collective quantum-mechanical behaviour that turns a pile of iron atoms into a bar magnet. In paramagnets, each atomic moment responds to the external field independently; in ferromagnets, neighbouring atomic moments talk to each other through the exchange interaction — a quantum-mechanical consequence of the Pauli exclusion principle that energetically rewards parallel spin alignment between nearby electrons. Below a critical temperature T_c (the Curie temperature, 1043 K for iron, 627 K for nickel, 1388 K for cobalt) the exchange coupling overpowers thermal randomisation, and huge collective regions of atoms align spontaneously. Above T_c, thermal motion wins and the material becomes an ordinary paramagnet.

The spontaneous alignment is local, not global. A bulk piece of iron would produce enormous external fields if every atom aligned with every other atom; instead, the material breaks up into *domains*, typically micron-scale regions each with uniform magnetization but pointing in different directions, so that the macroscopic average on the scale of a naked-eye sample is near zero. Apply an external field and the domains aligned with the field grow at the expense of the others — domain walls sweep across the material. The process is path-dependent: remove the field and some of the alignment persists, producing the *remanence* M_r that makes a magnetised nail still stick to a refrigerator. Further driving the field in the opposite direction eventually unpins the walls, and the whole curve traces out a hysteresis loop.

Ferromagnets are the strongest magnets in everyday experience. Their effective susceptibility is of order 10³–10⁶, their permeabilities are correspondingly enormous, and they can produce remanent magnetizations approaching the saturation limit, about 2 T for iron, 2.4 T for pure cobalt. They are also where twentieth-century condensed-matter physics was born: Weiss's 1907 molecular-field theory, Heisenberg's 1928 exchange-interaction paper, the 1930s domain studies by Landau and Lifshitz, and the modern micromagnetic simulations that design hard-disk heads and magnetic MRAM all come from the same continuous thread of ferromagnetism research.`,
    relatedPhysicists: ["pierre-curie", "pierre-weiss"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "magnetic-domain",
    term: "Magnetic domain",
    category: "concept",
    shortDefinition: "A microscopic region inside a ferromagnet in which all atomic moments point in the same direction. Bulk ferromagnets are partitioned into many such domains, averaging to zero or near-zero net magnetization at rest.",
    description: `A magnetic domain is a region — typically 0.1 to 100 micrometres across — inside a ferromagnetic material where every atomic moment points in the same direction. Inside one domain the magnetization is uniform and saturated, carrying the full M_s the material is capable of; outside, in the next domain, the magnetization points a different way. Bulk ferromagnets at rest are carved up into millions of domains in a pattern that, averaged over macroscopic scales, often gives near-zero net magnetization. This is why a bar of "unmagnetised" iron does not lift nails even though each of its iron atoms is strongly ferromagnetic.

Domains exist because they lower the total magnetic energy of the sample. A uniformly magnetised block of iron would create enormous external field lines wrapping around from one pole to the other — field energy scaling with the cube of the sample size. Breaking the block into oppositely-pointing domains lets the flux close inside the material, dramatically reducing the external field energy. The cost is a network of *domain walls*, thin regions (100 Å thick in iron) where the magnetization direction rotates from one domain's orientation to the next. The equilibrium domain pattern balances the two: enough walls to shut off the external field, not so many that the wall energy exceeds what is saved.

Applying an external magnetic field doesn't flip atomic moments one by one; it pushes the domain walls. Domains aligned with the field grow by absorbing neighbouring misaligned domains; walls sweep through the material like ripples through water. At low fields the walls move reversibly; above the *coercive field* H_c they jump abruptly across pinning sites and the process becomes irreversible — the fingerprint of hysteresis. Pierre Weiss predicted domains in 1907 from energy arguments; Francis Bitter first imaged them in 1931 by sprinkling fine ferromagnetic powder on a polished iron surface. Today, magnetic-force microscopy, Kerr-effect imaging, and X-ray magnetic circular dichroism give direct pictures of domains in nanometre detail, and domain-wall engineering is the basis of almost every modern magnetic memory technology.`,
    relatedPhysicists: ["pierre-weiss"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "hysteresis-loop",
    term: "Hysteresis loop",
    category: "concept",
    shortDefinition: "The closed curve traced by B (or M) versus H in a ferromagnet under a cycled applied field. Its enclosed area equals the energy dissipated per unit volume per cycle.",
    description: `A hysteresis loop is the graphical fingerprint of a ferromagnetic material. Start with an unmagnetised sample and slowly increase the applied H-field: the magnetization climbs along the initial-magnetisation curve, at first slowly (reversible domain-wall bowing), then rapidly as walls unpin and sweep through the material, and finally saturates as every domain aligns with the field. Reverse the field's direction and the magnetization does *not* retrace the same curve — it stays large all the way down past H = 0, leaving a remanent magnetization M_r, and only drops to zero when the reversed field reaches the coercive field −H_c. Continue reversing to saturation, cycle back, and the system traces a closed loop: the hysteresis loop.

The loop's shape encodes the material's character. A *hard* ferromagnet (good for permanent magnets) has a large remanence, a large coercive field, and a wide, square loop: neodymium-iron-boron magnets hold about M_r ≈ 1.1 T and require H_c ≈ 900 kA/m to demagnetise. A *soft* ferromagnet (good for transformer cores and electromagnets) has the opposite: small coercive field, narrow and tall loop, so that the magnetization can be cycled quickly with minimal energy loss. Pure iron with silicon addition, for instance, has H_c ≈ 40 A/m — forty times smaller than the external H-field of a hand-held magnet.

The area enclosed by the loop is the energy dissipated per unit volume per cycle. As the field drives M around the loop, microscopic domain walls jump past pinning defects irreversibly, and the work done by the external circuit goes into heat. For a transformer cycling 50 times a second, this *hysteresis loss* can reach tens of watts per kilogram of core. Every transformer designer's first optimisation is to choose a core material whose loop encloses the smallest possible area at the operating frequency — pushing M_r and H_c as small as metallurgy allows while keeping the permeability high.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
      { branchSlug: "electromagnetism", topicSlug: "piezo-and-ferroelectricity" },
    ],
  },
  {
    slug: "curie-temperature",
    term: "Curie temperature",
    category: "concept",
    shortDefinition: "The critical temperature T_c above which a ferromagnet loses its spontaneous magnetization and becomes an ordinary paramagnet. 1043 K for iron, 627 K for nickel, 1388 K for cobalt.",
    description: `The Curie temperature T_c is the sharp threshold above which a ferromagnet gives up its spontaneous order. Below T_c, quantum exchange interactions between neighbouring atomic moments energetically reward parallel alignment, and the material carries permanent magnetization. Above T_c, thermal motion k_B T overwhelms the exchange energy: the moments wobble too violently for neighbours to stay aligned, and the spontaneous magnetization drops to zero. The material becomes an ordinary paramagnet, with susceptibility now following the Curie–Weiss law χ = C/(T − T_c).

The transition is a genuine thermodynamic phase transition — a *continuous* (second-order) one, in Landau's classification. The spontaneous magnetization vanishes smoothly as T → T_c from below, typically as M ∝ (T_c − T)^β with β ≈ 0.326 for three-dimensional ferromagnets (the 3D-Heisenberg universality class). The magnetic heat capacity diverges logarithmically at T_c. The susceptibility above T_c blows up as T approaches T_c from above. Every experimental signature of a second-order transition is present, and indeed the Curie transition was the first phase transition for which Landau's mean-field theory (via Pierre Weiss's 1907 molecular field) gave quantitatively correct predictions near T_c.

Different ferromagnets have dramatically different Curie temperatures. Iron: 1043 K (770 °C). Nickel: 627 K (354 °C). Cobalt: 1388 K (1115 °C). Gadolinium: 292 K (just below room temperature) — which is why a gadolinium sphere at room temperature is only weakly magnetic but becomes a strong ferromagnet when refrigerated. Some permanent-magnet alloys are engineered for very high T_c: samarium-cobalt magnets stay ferromagnetic up to 1000 K, making them the standard choice for high-temperature applications like aerospace motors. Below T_c, the exchange coupling wins; above, thermal noise does. The crossover is sharp, universal, and the founding example in the whole theory of critical phenomena.`,
    relatedPhysicists: ["pierre-curie"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "meissner-effect",
    term: "Meißner effect",
    category: "phenomenon",
    shortDefinition: "The active expulsion of magnetic flux from the interior of a superconductor on cooling below T_c in an applied field. The signature that superconductivity is a distinct thermodynamic phase, not mere zero resistance.",
    description: `The Meißner effect is the experimental fact that reshaped the understanding of superconductivity. Before 1933, superconductors were understood as "perfect conductors": materials whose electrical resistance drops to zero below a critical temperature T_c. By Lenz's law, a perfect conductor cooled in an applied magnetic field *should* trap whatever flux was passing through it at the moment of the transition — the currents needed to oppose flux changes could flow indefinitely, freezing the flux in place. A perfect conductor first cooled to zero resistance and *then* placed in a field should exclude the new field, but a perfect conductor cooled in an already-applied field should retain it.

Walther Meißner and Robert Ochsenfeld in October 1933 discovered that superconductors do not behave this way. Cooling tin and lead cylinders through T_c in an applied field, they watched the flux actively expelled from the interior as the transition was crossed. The state of the superconductor, they showed, depended only on temperature and external field — not on history. Flux expulsion happens whether you apply the field first and cool, or cool first and apply the field: the equilibrium state below T_c has zero B in the interior, full stop. Superconductivity is therefore not perfect conduction; it is a thermodynamic phase of matter whose defining property is perfect diamagnetism, χ = −1.

The depth to which the field penetrates before being expelled is the London penetration depth λ, typically 10⁻⁷ metres. Superconducting surface currents flow in a thin shell of that depth, producing a magnetization exactly opposing the applied field and driving B → 0 in the bulk. Above a critical field H_c the superconducting state collapses entirely and the material reverts to normal conduction; between zero and H_c, the Meißner state persists. The London brothers' 1935 phenomenological theory and BCS theory in 1957 both have flux expulsion built in from the start — any microscopic model of superconductivity must predict the Meißner effect, and any theory that does not fails the experimental test immediately.`,
    relatedPhysicists: ["walther-meissner"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "critical-temperature",
    term: "Critical temperature",
    category: "concept",
    shortDefinition: "The temperature T_c below which a superconductor exhibits zero resistance and the Meißner effect. Ranges from 1.2 K (aluminium) to 135 K (cuprate high-T_c materials) to above 250 K in hydride compounds under pressure.",
    description: `The critical temperature T_c of a superconductor is the threshold below which the material transitions abruptly from normal electrical conduction to the superconducting state. Above T_c, resistivity follows the ordinary metallic temperature dependence. At T_c, resistance drops discontinuously to zero — experimentally indistinguishable from zero, with persistent currents in superconducting rings observed to decay with time constants longer than the age of the universe. Simultaneously, the Meißner effect switches on: any magnetic flux threading the sample is actively expelled.

The first superconductors discovered by Kamerlingh Onnes in 1911 had tiny T_c values: mercury 4.15 K, lead 7.2 K, tin 3.7 K — all accessible only with liquid helium. For seventy-five years this defined the experimental cost of superconductivity: helium is expensive to produce, lose, and handle, which is why superconducting MRI magnets and accelerator magnets remained the only widely-deployed technologies through the mid-1980s. Nb₃Sn at 18 K and Nb₃Ge at 23 K were the practical limits reached by 1973.

The 1986 discovery of cuprate superconductors by Bednorz and Müller broke the barrier: La-Ba-Cu-O with T_c ≈ 35 K, then YBa₂Cu₃O₇ at 92 K (above the 77 K boiling point of liquid nitrogen, transforming the economics of the technology), then mercury-barium-calcium-copper-oxides reaching 135 K at atmospheric pressure and 164 K under pressure. In the late 2010s, ultra-high-pressure hydride materials pushed T_c above 250 K (H₃S, 203 K at 150 GPa; LaH₁₀, 250 K at 170 GPa), with room-temperature superconductivity now appearing plausible if not yet routine. The theoretical upper limit — whether there is one, and what sets it — remains one of the open questions of condensed-matter physics.`,
    relatedPhysicists: ["heike-kamerlingh-onnes"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "electromagnetic-induction",
    term: "Electromagnetic induction",
    category: "phenomenon",
    shortDefinition: "The generation of an electromotive force in a circuit whenever the magnetic flux through it changes. Discovered by Faraday and Henry in 1831, it is the foundation of every electric generator, transformer, and inductive sensor ever built.",
    description: `Electromagnetic induction is the phenomenon Michael Faraday and Joseph Henry independently discovered in 1831: whenever the magnetic flux threading a closed circuit changes, an electromotive force appears in the circuit that drives a current. The flux can change in three qualitatively different ways — the circuit can move through a non-uniform magnetic field, the magnet can move past a stationary circuit, or the field itself can change in time — and in every case the induced EMF equals the rate of change of flux: EMF = −dΦ/dt. The minus sign (Lenz's law) enforces energy conservation: the induced current always flows in the direction whose own magnetic field opposes the change driving it.

The discovery transformed physics. Before 1831, electricity and magnetism were coupled only in one direction: a current creates a magnetic field (Ørsted, Ampère). After 1831, the coupling was bidirectional: a changing field creates a current, and the interplay between the two became the foundation of Maxwell's dynamical electromagnetism. Induction is what makes possible every technology that converts between mechanical and electrical energy: alternators in power plants (rotating magnets inducing AC voltage in stator coils), transformers (changing primary current inducing secondary voltage via a linked iron core), induction motors (stator fields inducing rotor currents that feel force back on the stator), inductive cooktops (kHz magnetic fields inducing eddy currents in the pan), wireless charging (resonant coupling between phone and pad), and the dynamo in your bicycle light.

The sign convention and the choice of surface integration for Φ require care (right-hand rule, orientation of the circuit loop, which side of the surface is "positive"), but once set up consistently the law is breathtakingly universal. It applies to single-turn loops, multi-turn coils (where Φ is replaced by the flux linkage λ = NΦ), rotating machines, and even free electrons in an applied time-varying vector potential. The integral form ∮E·dℓ = −dΦ_B/dt is one of Maxwell's four equations, and the differential form ∇×E = −∂B/∂t is its pointwise statement: any time-varying magnetic field creates a circulating electric field, anywhere in space, circuit or no circuit.`,
    relatedPhysicists: ["michael-faraday", "joseph-henry"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
    ],
  },
  {
    slug: "faradays-law-term",
    term: "Faraday's law",
    category: "concept",
    shortDefinition: "EMF = −dΦ_B/dt. The induced electromotive force in a closed loop equals the negative rate of change of magnetic flux through the loop. The first of Maxwell's time-dependent equations.",
    description: `Faraday's law is the quantitative statement of electromagnetic induction: the electromotive force induced in a closed loop equals the negative rate of change of the magnetic flux through the loop, EMF = −dΦ_B/dt, with Φ_B = ∫B·dA. It is the first of the two time-dependent equations in Maxwell's system (the other being the Ampère–Maxwell law with displacement current) and the one that couples electricity back to magnetism, closing the loop opened by Ørsted's 1820 discovery that currents create magnetic fields.

The equation appears in two forms. The integral form, ∮E·dℓ = −d/dt ∫B·dA, relates the circulation of the electric field around a closed loop to the time-derivative of the magnetic flux through any surface bounded by that loop. The differential form, ∇×E = −∂B/∂t, says the same thing pointwise: the curl of the electric field at any point equals the negative rate of change of the magnetic field at that point. The differential form is the one that survives in special relativity (Maxwell's equations are manifestly Lorentz-covariant when written with the four-potential); the integral form is more useful for engineering calculations with specific circuit geometries.

The sign convention is critical and sometimes confusing. Choose an orientation for the circuit loop (say, counterclockwise looking from the +z axis). The positive direction of the area vector dA follows from the right-hand rule (thumb along +z). The flux Φ_B is then positive if B points in the +z direction through the loop. A decreasing positive flux (Φ_B decreasing with time) gives a positive EMF, which drives current in the counterclockwise direction — in agreement with Lenz's law, since the induced current's field points in +z, opposing the decrease in the original flux. Every mistake students make in induction problems traces back to sloppy sign bookkeeping at this step. Get the signs right and the rest of the problem unwinds itself.`,
    relatedPhysicists: ["michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
    ],
  },
  {
    slug: "lenzs-law-term",
    term: "Lenz's law",
    category: "concept",
    shortDefinition: "The direction of an induced current is always such that its own magnetic field opposes the change in flux that caused the induction. Equivalently: the minus sign in Faraday's law is a consequence of energy conservation.",
    description: `Lenz's law is the qualitative statement that fixes the sign of every induced current: the induced current flows in whichever direction makes its own magnetic field oppose the change driving the induction. If the flux through a loop is increasing, the induced current creates a field pointing *against* the existing flux, trying to reduce it back. If the flux is decreasing, the induced current creates a field pointing *with* the existing flux, trying to hold it up. Either way, the induced response pushes back against the change.

The deep reason for the sign is energy conservation. Imagine for a moment that the induced current went the other way, reinforcing the flux change instead of opposing it. Pushing a bar magnet toward a loop would make a current flow that amplified the flux, attracting the magnet more strongly, which would make the flux grow faster, which would drive more current… a runaway positive feedback that produces unlimited energy from nothing. Lenz's sign is what prevents this. The induced current must extract energy from the process that's driving the change, converting the work done against the induced force into electrical (and eventually thermal) energy. The minus sign in EMF = −dΦ/dt is not an experimental convention; it is a direct consequence of the first law of thermodynamics applied to the induction process.

Engineering applications exploit the opposition literally. Eddy-current brakes on roller coasters and electric vehicles pass a conducting plate through a strong magnet; the induced currents oppose the motion by dissipation, slowing the vehicle without any mechanical contact. Induction cooktops dump kHz-frequency eddy currents into ferromagnetic cookware; the induced currents fight the changing field, dissipating energy as heat inside the pan. Generator back-torque — the reason it's physically hard to turn the shaft of a dynamo with its terminals shorted — is Lenz's law directly: the induced current in the armature produces a magnetic moment that pushes back against the magnet doing the turning.`,
    relatedPhysicists: ["heinrich-lenz"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
  {
    slug: "emf",
    term: "Electromotive force (EMF)",
    category: "concept",
    shortDefinition: "The work per unit charge done by a source on charges as they move around a closed circuit, measured in volts. Despite the name, EMF is not a force; it is the energy-per-charge a battery, generator, or induction process supplies.",
    description: `Electromotive force — historically abbreviated EMF, a term coined by Volta in 1801 — is a measure of the energy per unit charge that some non-electrostatic source delivers to a circuit. The name is a misnomer twice over: EMF is not a force (it has units of volts, energy per charge, not newtons), and it is not always "electro" in origin. A chemical battery delivers EMF from redox reactions at its electrodes. A thermocouple delivers EMF from the Seebeck effect at a bimetallic junction. A solar cell delivers EMF from photons striking a p–n junction. An electromagnetic induction process delivers EMF from a changing magnetic flux. All of these are lumped together under the single quantity ε, the work per unit charge that the source does as charges are carried from its low-potential terminal to its high-potential terminal.

Mathematically, EMF is the closed-loop integral of the effective force per unit charge around the circuit: ε = ∮ (F_source/q) · dℓ. In electrostatics alone, this integral is zero — the electrostatic field is conservative, ∮E·dℓ = 0 — so a purely electrostatic circuit cannot drive a steady current. Something non-conservative has to enter: a battery's chemical field, an induction-induced non-conservative electric field (∇×E_ind = −∂B/∂t), a motional EMF from v×B acting on charges in a moving wire. EMF is a measure of that non-conservative contribution, and its existence is what drives currents.

In circuit analysis, EMF sources are drawn as idealised voltage sources — the ε's in Kirchhoff's voltage law around a loop, balancing the iR drops across resistors and the q/C voltages across capacitors. The "terminal voltage" measured across a real battery with current flowing differs from its EMF by the internal-resistance drop: V_term = ε − Ir. For a resistanceless source like an ideal induction coil, V_term equals ε exactly. The unit of EMF is the volt, the same unit used for electric potential differences — both are energy per charge — but the physical origins of the two are distinct and it is worth holding them apart conceptually.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
  {
    slug: "motional-emf",
    term: "Motional EMF",
    category: "concept",
    shortDefinition: "The EMF induced in a conductor moving through a magnetic field, driven by the magnetic part of the Lorentz force on free charges inside the conductor. Equals (v × B) · ℓ for a straight rod of length ℓ moving with velocity v in field B.",
    description: `Motional EMF is the induction mechanism that operates when a conductor physically moves through a static magnetic field. Every free charge q in the conductor feels the Lorentz force F = qv×B, where v is the velocity of the conductor relative to the field source. In a straight rod moving perpendicular to both B and its own length ℓ, this force drives positive charges toward one end of the rod and negative toward the other, setting up an electrostatic field inside the rod that, in steady state, exactly balances the magnetic force on each free charge. The potential difference between the ends is ε = (v × B) · ℓ — and if the rod is part of a closed circuit, this potential difference is an EMF that drives a current around the loop.

The canonical example is the "rails-and-rod" circuit: a U-shaped conducting rail sits in a uniform B-field, and a straight conducting rod slides along the rails, closing the loop. As the rod moves with velocity v, the flux through the loop changes at rate dΦ/dt = B · ℓ · v (the rate at which new area is swept out), and the induced EMF is Bℓv. Plug it into the loop resistance R and the current is I = Bℓv/R. The force on the rod due to this current in the magnetic field is F_mag = IℓB, pointing opposite the velocity — exactly what you'd expect from Lenz's law, and exactly the retarding force you need to apply to keep the rod moving at constant v. The mechanical power you supply, F_mag · v = B²ℓ²v²/R, equals the electrical power dissipated in the circuit, I²R. Energy conservation closes the book.

Motional EMF is the operating principle of every electric generator ever built. Rotate a multi-turn coil in a magnetic field (or, equivalently, rotate a magnet past a stationary coil), and the v × B term varies sinusoidally in time, producing the AC voltage that reaches your wall socket. It is also why a loop of wire walked through the Earth's magnetic field picks up a tiny EMF (microvolt scale, but real and measurable). Faraday's law in its rate-of-flux form includes motional EMF automatically when the boundary of the loop is moving; the two cases — stationary circuit with changing B, moving circuit with constant B — are unified by the covariant formulation in special relativity, where the distinction between v × B and ∂A/∂t is frame-dependent.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
  {
    slug: "self-inductance",
    term: "Self-inductance",
    category: "concept",
    shortDefinition: "The property of a coil that makes it oppose changes in its own current, characterised by L = Φ/I, where Φ is the flux the coil produces through itself. Units of henry (H = V·s/A).",
    description: `Self-inductance is the electromagnetic analogue of inertia. When current flows through a coil, it produces a magnetic field, and that field threads flux through the coil's own turns. If the current changes, the flux changes, and Faraday's law demands that an EMF appear in the coil opposing the change — a back-EMF. The proportionality constant between current and self-flux is the self-inductance: L = Φ_self / I, or equivalently V_L = −L dI/dt. The minus sign is Lenz's law: the back-EMF opposes the change in current.

L depends only on the coil's geometry and the magnetic properties of its environment, not on the current flowing through it (at least for linear materials). For a long solenoid of length ℓ, cross-section A, and n turns per metre, L = μ₀ n² ℓ A — scaling linearly with the core volume and quadratically with turn density. Inserting a ferromagnetic core multiplies L by the relative permeability μ_r, which can easily be 10³ or 10⁴ — which is why power-frequency inductors are almost always wound around iron laminations, and why RF chokes that need a well-defined inductance often *omit* the core (better linearity, lower dissipation). In SI units, L is measured in henries: 1 H = 1 V·s/A — the inductance of a coil in which a current changing at 1 A/s induces an EMF of 1 V.

The current in an inductive circuit doesn't change instantaneously. Switch on a battery in series with an inductor L and resistor R, and the current rises exponentially with time constant τ = L/R: I(t) = (V/R)(1 − e^(−t/τ)). Switch it off and the current dies exponentially on the same timescale — except that if the circuit is abruptly opened, the back-EMF required to bring the current to zero in zero time is formally infinite, which is why opening an inductive circuit produces a spark. Energy storage: the inductor stores U = ½LI² joules in its magnetic field, and that energy must go *somewhere* when the current is interrupted — through an arc, through a snubber resistor, or (in a switching power supply) transferred deliberately into a capacitor for reuse.`,
    relatedPhysicists: ["joseph-henry"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "mutual-inductance",
    term: "Mutual inductance",
    category: "concept",
    shortDefinition: "The coupling between two separated coils: M = Φ₁₂/I₂, the flux that coil 2's current produces through coil 1 per unit coil-2 current. The operating principle of every transformer.",
    description: `Mutual inductance M quantifies the magnetic coupling between two separate coils. Run a current I₂ through coil 2, and some fraction of the magnetic flux it produces links through coil 1; the amount of that linked flux per unit I₂ is the mutual inductance, M = Φ₁₂/I₂. A changing current in coil 2 then induces an EMF in coil 1: V₁ = −M dI₂/dt. Reciprocity (a consequence of the underlying symmetry of Maxwell's equations) requires that M₁₂ = M₂₁ — the mutual inductance is the same number whether you call coil 2 the driver and coil 1 the target, or vice versa.

The magnitude of M depends on geometry, separation, and the presence of any ferromagnetic or shielding material between the two coils. For two ideal coaxial solenoids of the same length, perfectly coupled with a ferromagnetic core, M approaches its maximum value, the geometric mean M = √(L₁ L₂). In the general case this is written M = k √(L₁L₂), where 0 ≤ k ≤ 1 is the *coupling coefficient*, a dimensionless measure of how completely the two coils share flux. Tightly wound transformers on a single toroidal core achieve k ≈ 0.99; loosely coupled air-core coils in a radio oscillator might have k ≈ 0.1.

Mutual inductance is the operating principle of the transformer. Primary current in coil 1 creates flux, which threads through coil 2; changing primary current induces EMF in coil 2. For an ideal transformer with N₁ and N₂ turns, the EMFs are in the ratio V₁/V₂ = N₁/N₂, and the currents in the inverse ratio I₁/I₂ = N₂/N₁ (from conservation of power, ignoring small losses). Transformers step voltage up for efficient long-distance transmission and down for household delivery; they isolate circuits galvanically; they match impedances between amplifier stages; they inject signals into RF chains. In the 21st century, resonant mutual-inductance coupling powers phone charging pads, implanted medical devices, and contactless access cards. The underlying physics is the same as Henry's 1832 Albany Academy demonstration.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "henry-unit",
    term: "Henry",
    category: "unit",
    shortDefinition: "The SI unit of inductance. One henry is the inductance of a coil in which a current changing at one ampere per second induces an EMF of one volt. Symbol: H. 1 H = 1 V·s/A.",
    description: `The henry (symbol H) is the SI unit of inductance, both self- and mutual. Its defining relation is V = L dI/dt: a one-henry coil develops a one-volt back-EMF when its current changes at one ampere per second. Equivalently, 1 H = 1 Wb/A (one weber of self-flux per ampere of current) = 1 V·s/A = 1 Ω·s.

Typical inductances span many orders of magnitude. Small RF air-core coils in AM-radio tuners are on the order of microhenries (µH). Power-frequency transformer primaries typically have inductances of tens of millihenries (mH) to henries, depending on core geometry. Industrial filter chokes used to smooth rectified power-supply ripple can reach tens of henries in a single unit. At the other extreme, superconducting storage inductors proposed for grid-scale energy storage would have inductances in the kilohenry range, storing energy at the mass-of-a-car scale. The henry is a convenient size for ordinary electrical engineering.

The unit was named for Joseph Henry, the American physicist who independently discovered self-induction in the early 1830s. In the original 1881 SI-precursor agreements, the unit of inductance was called the "quad" or simply left unnamed; Joseph Henry's name was attached by the International Electrotechnical Commission in 1893, a decade and a half after his death, partly as a belated acknowledgement that Faraday-priority alone did not capture the historical reality. The henry has remained the SI unit of inductance unchanged ever since.`,
    relatedPhysicists: ["joseph-henry"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "back-emf",
    term: "Back-EMF",
    category: "concept",
    shortDefinition: "The EMF induced in an inductor or motor winding that opposes the change in current or rotation driving it. In a DC motor at steady state, back-EMF roughly equals the supply voltage minus the resistive drop.",
    description: `Back-EMF is the induced EMF that acts against whatever is driving a current or motion. In an inductor, the back-EMF is −L dI/dt: turn up the current and the coil pushes back with a voltage opposing the increase. In a DC motor, the back-EMF has a second origin: as the rotor spins, its armature windings sweep through the stator field, and the resulting motional EMF (kω, where ω is angular velocity and k is a motor-constant) subtracts from the applied supply voltage.

In steady-state motor operation, back-EMF is what limits the current. The armature current obeys I = (V_supply − k ω)/R_arm, where R_arm is the armature resistance (typically small). When the motor spins freely at its no-load speed, kω approaches V_supply and the current drops nearly to zero. When a mechanical load slows the motor down, ω decreases, kω decreases, and the current rises to supply the required torque. If the motor stalls entirely (ω = 0), the back-EMF vanishes and the armature current shoots up to V_supply/R_arm — stall current can be ten or twenty times the running current, which is why motors need overload protection and soft-start circuitry.

Back-EMF is also a useful sensor. Brushless DC motors without shaft encoders often infer rotor position by watching the back-EMF waveform on the unenergised phase, a technique called sensorless control. The same principle underlies regenerative braking in electric vehicles: at high speed the motor's back-EMF exceeds the battery voltage, and the current flow reverses — the motor becomes a generator, returning mechanical kinetic energy to the battery. Every practical motor or generator design has back-EMF management at its core, and every textbook treatment of DC machines routes through the single equation V_supply = I R_arm + k ω.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "eddy-current",
    term: "Eddy current",
    category: "phenomenon",
    shortDefinition: "A circulating current induced inside a bulk conductor by a changing magnetic flux. Eddy currents dissipate energy as heat, and Lenz's law ensures the force on the conductor always opposes the relative motion of source and conductor.",
    description: `Eddy currents are the circulating induced currents that appear inside a solid piece of conductor whenever it is exposed to a changing magnetic flux. Unlike the currents in a wire-loop circuit, which flow along the one path the wire defines, eddy currents flow in whatever closed loops the bulk conductor's geometry allows — swirling patterns shaped by the field gradient, the conductor's shape, and the skin depth at the operating frequency. The name comes from the resemblance of these circulating patterns to the eddies in a stream.

By Lenz's law, the induced eddy currents always flow in whichever direction makes their own magnetic field oppose the flux change driving them. This turns eddy currents into the electromagnetic equivalent of viscous drag. Drop a strong magnet down a vertical copper pipe: as the magnet falls, it changes the flux through each horizontal slice of copper, inducing eddy currents in those slices; those currents' fields push back on the magnet, slowing its descent to a slow terminal velocity. Swing a copper plate between the poles of a strong electromagnet, and the plate comes to rest in seconds, its kinetic energy dissipated as resistive heating from the eddies. Roller-coaster brake fins exploit exactly this: no mechanical contact, no wear, no brake fade.

The same physics is a nuisance in transformers and motors. The iron cores of these machines sit in rapidly alternating fluxes; eddy currents induced in the bulk iron dissipate energy as heat, reducing efficiency and causing the core to overheat. Two standard fixes — used since the early 1900s — cut the eddy-current paths: either laminate the core (stack it from thin, insulated sheets) so that eddy-current loops can't extend perpendicular to the lamination plane, or use a high-resistivity ferrite rather than metallic iron, making even tiny eddy loops highly dissipative. In induction cooktops, the same effect is turned to a productive end: 20–50 kHz magnetic fields couple into iron-containing pans and dump 1–3 kW of eddy-current heating directly into the food.`,
    relatedPhysicists: ["leon-foucault"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "eddy-currents" },
    ],
  },
  {
    slug: "magnetic-energy-density",
    term: "Magnetic energy density",
    category: "concept",
    shortDefinition: "The energy stored per unit volume of a magnetic field: u_B = B²/(2μ₀) in vacuum, u_B = ½ BH in linear matter. The magnetic counterpart of the electric field energy density ε₀E²/2.",
    description: `Every magnetic field carries energy, and that energy is distributed through space at a density u_B = B²/(2μ₀) (in vacuum or non-magnetic material), or more generally u_B = ½ B·H inside linear magnetic media. This parallels the electric case — an electric field stores ε₀E²/2 per unit volume — and once you take both together, u_total = ε₀E²/2 + B²/(2μ₀), you have the energy density of the electromagnetic field in every point of space, independent of whether any circuit is nearby.

The derivation comes from tracking the energy delivered to a coil as its current is built up from zero. For an inductor, the work done by the external source against the back-EMF is dW = V I dt = (L dI/dt) I dt = L I dI, integrated from 0 to I gives U = ½ L I². Substitute L in terms of the coil geometry and I in terms of B inside the coil, and U expressed as a volume integral becomes exactly ∫ (B²/2μ₀) dV — the field-localised picture. The energy, you discover, isn't really "in the coil"; it's in the space *around* the coil, stored in the magnetic field itself.

Practical implications: a solenoid running 10 T (an MRI-scale superconducting magnet) stores B²/(2μ₀) ≈ 4 × 10⁷ J/m³ — forty megajoules per cubic metre, enough energy in a one-litre bore to vaporise a kilogram of water. This is why superconducting magnet quenches are dangerous: the stored magnetic energy has to go somewhere on timescales set by the quench physics. Inductive energy storage systems, including proposed superconducting magnetic energy storage (SMES) for grid applications, exploit this high energy density — the trade-off is that keeping B high requires keeping the superconductor cold, which costs its own energy. In pulsed-power applications (capacitor banks feeding pulsed magnets, Z-pinch experiments), the inductance's ½LI² stored during current ramp-up becomes the dominant energy reservoir, and managing its release on discharge is the main engineering problem.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "energy-in-magnetic-fields" },
    ],
  },
  {
    slug: "flux-linkage",
    term: "Flux linkage",
    category: "concept",
    shortDefinition: "The total flux threading a multi-turn coil, summed across all turns: λ = N Φ for N turns each enclosing flux Φ. The quantity Faraday's law naturally refers to for real coils rather than single loops.",
    description: `Flux linkage, usually written λ, is the total magnetic flux threading through a coil, counted once for each turn the flux passes through. For a simple N-turn coil where every turn encloses the same flux Φ (a good approximation for tightly-wound solenoids), the flux linkage is just λ = N Φ. For a more complicated geometry — overlapping coils, coils with varying pitch, coils wound around non-uniform cores — λ is the proper sum ∑ Φ_k over all turns, and different turns may enclose different fluxes.

The significance of flux linkage is that Faraday's law, when applied to real coils rather than idealised single loops, refers to λ rather than to Φ: EMF = −dλ/dt. For the tight-winding case this is just EMF = −N dΦ/dt, which is why a 1000-turn coil produces 1000× the induced voltage of a single-turn coil in the same field. For the general case it is why engineers compute self-inductance as L = λ/I rather than as Φ/I — the factor of N is baked into λ from the start.

Flux linkage also gives a uniform way to talk about inductance. For a single air-core solenoid, L = μ₀ n² ℓ A = N × (Φ/I) = λ/I. For two mutually coupled coils, M₁₂ = λ₁₂/I₂, where λ₁₂ is the flux linkage through coil 1 due to the current in coil 2. Writing everything in terms of λ avoids the bookkeeping confusion of "flux per turn" vs "total flux" and scales cleanly from single-loop circuits (λ = Φ, N = 1) to complex multi-winding machines.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
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
