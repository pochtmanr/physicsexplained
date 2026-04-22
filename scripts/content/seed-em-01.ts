// Seed EM §01 Electrostatics (4 physicists + 18 glossary terms).
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-em-01.ts
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
    slug: "charles-augustin-de-coulomb",
    name: "Charles-Augustin de Coulomb",
    shortName: "Coulomb",
    born: "1736",
    died: "1806",
    nationality: "French",
    oneLiner: "French military engineer who measured the inverse-square law of electric force and put electrostatics on a quantitative footing.",
    bio: `Charles-Augustin de Coulomb was born in Angoulême in 1736 into a modest administrative family and trained at the École royale du génie de Mézières, the finest military engineering school in Europe. For nearly twenty years he served as an officer of the Corps du Génie, designing fortifications in Martinique and inspecting military works across France. The West Indian posting ruined his health but gave him his first research problem: how thick must a retaining wall be before the earth behind it would slip? That practical question produced his 1773 memoir on the mechanics of soils, the founding document of modern geotechnical engineering.

Back in France he turned to the subjects that would make his name. In 1781 he published three laws of friction — static versus kinetic, independence from contact area, proportionality to normal load — results so clean that engineers still teach them as Amontons–Coulomb friction. Four years later he built the torsion balance, an instrument sensitive enough to weigh the force between two electrified pith balls, and used it to prove what Joseph Priestley had guessed: electric force falls off as the inverse square of distance, exactly like gravity. A parallel set of experiments established the same law for magnetic poles. These two papers, delivered to the Académie des Sciences between 1785 and 1789, are the foundation on which every later equation of electrostatics rests.

Coulomb survived the Revolution by keeping his head down on a small estate near Blois. Napoleon recalled him to public service as an inspector-general of education, a position he held until his death in 1806. He was a cautious experimentalist, skeptical of grand theories, and most of his papers are organised around a single instrument and a single measurement pushed to the edge of what contemporary precision allowed. The unit of electric charge carries his name because the quantity he measured — how much force one charge exerts on another — is the quantity every later electromagnetic law takes for granted.`,
    contributions: [
      "Established the inverse-square law of electric force experimentally using the torsion balance (1785)",
      "Extended the inverse-square law to magnetic poles, unifying electric and magnetic force laws in form",
      "Formulated the three classical laws of dry friction (static vs kinetic, area-independence, load-proportionality)",
      "Invented the torsion balance, the first instrument sensitive enough to measure forces between small charges",
      "Founded modern soil mechanics with his 1773 memoir on retaining walls and earth pressure",
    ],
    majorWorks: [
      "Essai sur une application des règles de maximis & minimis (1773) — foundation of soil mechanics",
      "Théorie des machines simples (1781) — the three laws of friction",
      "Premier Mémoire sur l'Électricité et le Magnétisme (1785) — inverse-square law of electric force",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "coulombs-law" },
      { branchSlug: "electromagnetism", topicSlug: "the-electric-field" },
    ],
  },
  {
    slug: "benjamin-franklin",
    name: "Benjamin Franklin",
    shortName: "Franklin",
    born: "1706",
    died: "1790",
    nationality: "American",
    oneLiner: "American printer, diplomat, and self-taught scientist who proved lightning was electricity and gave us the signs + and − that every circuit still uses.",
    bio: `Benjamin Franklin was born in Boston in 1706, the fifteenth child of a candle-maker. He left school at ten, apprenticed to his brother as a printer at twelve, and by twenty-three owned the most successful print shop in Philadelphia. Poor Richard's Almanack made him rich; the Pennsylvania Gazette made him famous; and by the time he was forty he had earned enough to retire from business and spend the rest of his life on science, diplomacy, and the founding of a country.

His electrical work began in 1746, when a travelling demonstrator left him with a Leyden jar and a set of parlour tricks. Within six years he had rewritten the subject. Franklin argued that electricity was a single fluid — not two as his rivals believed — and that every object held either an excess of it (which he labelled "positive") or a deficit ("negative"); charging one body necessarily uncharged another by the same amount, so electric charge was conserved. The sign convention stuck even though, a century and a half later, we discovered the electron carries what he had arbitrarily called the negative sign. In June 1752 he flew a kite into a thunderstorm, drew a spark from a key tied to the soaked string, and proved lightning was nothing more than a very large electric discharge. The lightning rod followed a year later and is still the reason skyscrapers and church steeples survive storms.

The Royal Society awarded him the Copley Medal in 1753. Harvard and Yale gave him honorary degrees. When he sailed to London in 1757 as Pennsylvania's agent, he was already the most famous American alive. He later negotiated the alliance with France that won the Revolution, helped write the Declaration of Independence and the Constitution, and published the first American paper on demography. By the time he died in 1790 the streets of Philadelphia were lined with twenty thousand mourners — a quarter of the city's population. Few lives have touched more of what came after: the words "positive" and "negative" on every battery, the conservation law at the base of every circuit, and the rod still standing on every spire owe him a direct debt.`,
    contributions: [
      "Proposed the single-fluid theory of electricity and the conservation of electric charge (1747)",
      "Coined the sign convention 'positive' and 'negative' for electric charge — still in universal use",
      "Demonstrated that lightning is an electrical phenomenon via the kite experiment (1752)",
      "Invented the lightning rod, protecting buildings from strike damage for the first time",
      "Founded the American Philosophical Society and helped establish the University of Pennsylvania",
    ],
    majorWorks: [
      "Experiments and Observations on Electricity (1751) — single-fluid theory, sign convention, conservation of charge",
      "The Kite Experiment (1752) — identified lightning as an electric discharge",
      "Poor Richard's Almanack (1732–1758) — aphorisms and popular science",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "coulombs-law" },
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "carl-friedrich-gauss",
    name: "Carl Friedrich Gauss",
    shortName: "Gauss",
    born: "1777",
    died: "1855",
    nationality: "German",
    oneLiner: "The 'prince of mathematicians' — directed the Göttingen Observatory for forty years and gave electromagnetism the divergence theorem that bears his name.",
    bio: `Carl Friedrich Gauss was born in Brunswick in 1777 to a bricklayer father and an illiterate mother. He corrected his father's payroll arithmetic at the age of three and, according to the classroom legend, summed the integers from one to a hundred in seconds while his schoolmaster expected an hour of silence. The Duke of Brunswick paid for his education; by twenty-one Gauss had completed the Disquisitiones Arithmeticae, a book so dense and original that no mathematician in Europe could read it quickly.

For the next sixty years he was the dominant mathematician of the age and, increasingly, a working astronomer. In 1801 he reconstructed the orbit of the dwarf planet Ceres from a handful of measurements using the method of least squares, and the result made him the obvious choice to direct the new observatory at Göttingen when it opened in 1807. He held that post until his death in 1855 — forty-eight years in the same office, turning out the Gaussian distribution, non-Euclidean geometry, conformal mapping, the fundamental theorem of algebra, and the first modern survey of the Kingdom of Hanover. His motto was pauca sed matura ("few, but ripe"), and half of what we now call nineteenth-century mathematics sat in his private notebooks, unpublished, until his death.

The electromagnetic chapter came late. In the 1830s he collaborated with the physicist Wilhelm Weber on absolute units of magnetism, built Germany's first electric telegraph between the observatory and Weber's lab, and wrote the elegant flux-divergence theorem — what physicists now call Gauss's law — as part of a broader programme on potential theory. The SI unit of magnetic flux density bore his name until 1960, when it was replaced by the tesla; the non-SI unit (1 gauss = 10⁻⁴ T) survives in geophysics and astronomy. In his later years he became increasingly reclusive, refusing to publish speculative results, and the full catalogue of his discoveries was not known until his correspondence was edited decades after his death. Einstein called him the equal of Archimedes and Newton.`,
    contributions: [
      "Formulated Gauss's law relating electric flux through a closed surface to enclosed charge",
      "Developed the divergence theorem connecting surface and volume integrals of vector fields",
      "Introduced the method of least squares and the Gaussian (normal) distribution",
      "Collaborated with Wilhelm Weber on absolute magnetic units and the first electric telegraph (1833)",
      "Directed the Göttingen Observatory for 48 years and led the Hanover geodetic survey",
    ],
    majorWorks: [
      "Disquisitiones Arithmeticae (1801) — number theory; established him at 24 as Europe's leading mathematician",
      "Theoria motus corporum coelestium (1809) — least squares and planetary orbit determination",
      "Allgemeine Theorie des Erdmagnetismus (1839) — the general theory of terrestrial magnetism",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauss-law" },
    ],
  },
  {
    slug: "michael-faraday",
    name: "Michael Faraday",
    shortName: "Faraday",
    born: "1791",
    died: "1867",
    nationality: "English",
    oneLiner: "Self-taught bookbinder's apprentice who became the greatest experimentalist of the 19th century and discovered the induction that runs every generator on Earth.",
    bio: `Michael Faraday was born in 1791 in a London suburb, the third child of a sickly blacksmith. The family was so poor that Faraday later remembered a week in 1801 when his ration was a single loaf of bread. At thirteen he was apprenticed to a bookbinder, and for seven years he read his way through the shop — including a complete Encyclopædia Britannica and a copy of Jane Marcet's Conversations on Chemistry, which he later said changed his life. In 1812 a customer gave him a ticket to hear Humphry Davy lecture at the Royal Institution; Faraday bound the notes into a book, sent it to Davy with a letter asking for work, and was hired as a laboratory assistant the following spring.

He spent the rest of his life at the Royal Institution. In 1821, barely thirty years old, he built the first electric motor — a wire dipped in mercury, rotating endlessly around a magnet. A decade later, in August 1831, he demonstrated electromagnetic induction: a changing magnetic flux through a coil generates a current. That single result is the reason every generator, transformer, and induction motor on Earth works. He then discovered diamagnetism, the Faraday effect (rotation of light's polarisation in a magnetic field), the laws of electrolysis, and the electrostatic shielding now known as the Faraday cage — which he demonstrated in 1836 by sitting inside one while thunderstorms raged outside.

Faraday had almost no mathematics. He thought in pictures — "lines of force" threading through space, fields that occupied the vacuum between charges. He invented the vocabulary: "field," "electrode," "electrolyte," "ion," "anode," "cathode." Maxwell, who came after him, said the whole goal of his own mathematical work was to put Faraday's intuitions into equations. In 1858 the Queen offered Faraday a knighthood; he refused. The Royal Society offered him the presidency twice; he refused both times. He preferred the lab and the annual Christmas Lectures he gave for children from 1827 onwards — a tradition that still runs today. When he died in 1867 he was buried, at his request, in a plain grave with no epitaph.`,
    contributions: [
      "Discovered electromagnetic induction (1831) — the basis of every generator, transformer, and induction motor",
      "Built the first electric motor (1821) and the first dynamo",
      "Discovered the Faraday effect: rotation of light's polarisation plane by a magnetic field",
      "Formulated the laws of electrolysis and coined 'electrode', 'electrolyte', 'anode', 'cathode', 'ion'",
      "Introduced the field concept and the language of 'lines of force' that Maxwell would later mathematise",
      "Demonstrated electrostatic shielding with the Faraday cage (1836)",
    ],
    majorWorks: [
      "Experimental Researches in Electricity (1839–1855) — three volumes collecting thirty years of lab work",
      "On the Physical Character of the Lines of Magnetic Force (1852) — the field concept in full",
      "The Chemical History of a Candle (1861) — the most famous popular science lectures ever given",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electric-field" },
      { branchSlug: "electromagnetism", topicSlug: "conductors-and-shielding" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "electric-charge",
    term: "Electric charge",
    category: "concept",
    shortDefinition: "The fundamental conserved quantity that produces electric forces. Comes in ± signs. Measured in coulombs.",
    description: `Electric charge is the property of matter that makes it respond to electric and magnetic fields. It comes in two signs — positive and negative — and the combined charge of any isolated system never changes. You cannot create net charge out of nothing; you can only move it around or produce pairs of opposite charges that sum to zero.

At the microscopic level, ordinary matter is made of protons (charge +e), electrons (charge −e), and neutrons (neutral), where e ≈ 1.602 × 10⁻¹⁹ coulombs is the elementary charge. Everything electric we see in daily life — lightning, static cling, the current in every wire — traces back to electrons being shuffled from one place to another. A charged balloon has gained or lost perhaps 10¹² extra electrons out of the roughly 10²⁴ it contains; the imbalance is tiny, and yet the forces it produces can lift hair off a scalp.

Charge is conserved with more rigour than almost any other physical quantity. Nuclear reactions, chemical reactions, particle collisions at the LHC: the total charge before always equals the total charge after. This conservation law is the deep reason Kirchhoff's current law holds at every junction in a circuit, and the deep reason antimatter must be produced in charge-neutral pairs.`,
    history: `Benjamin Franklin proposed the sign convention (positive and negative) in the 1740s as part of his single-fluid theory of electricity. He picked the sign of glass-rubbed-with-silk as positive — which, after the electron was identified in 1897, turned out to mean that conventional "current" flows opposite to actual electron motion. Physics has lived with that accident ever since.`,
    relatedPhysicists: ["benjamin-franklin", "charles-augustin-de-coulomb"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "coulombs-law" },
    ],
  },
  {
    slug: "coulomb-unit",
    term: "Coulomb (unit)",
    category: "unit",
    shortDefinition: "The SI unit of electric charge. One coulomb equals the charge carried by 6.24 × 10¹⁸ protons, or the charge that flows past a point in one second when the current is one ampere.",
    description: `The coulomb (symbol C) is the SI unit of electric charge. Since the 2019 SI redefinition it has been defined exactly: one coulomb is the charge of 1/(1.602176634 × 10⁻¹⁹) elementary charges — roughly 6.24 quintillion protons' worth. Equivalently, one coulomb is the charge that passes through a cross-section of a conductor in one second when the current is one ampere.

A coulomb is an enormous amount of charge by human standards. Two one-coulomb charges placed one metre apart would repel each other with about nine billion newtons of force — roughly the weight of a million tonnes. That is why you never encounter "a coulomb" in electrostatics: a lightning bolt transfers only about 5–20 coulombs during its entire stroke, and a well-charged van de Graaff generator carries microcoulombs at most. In circuits, however, coulombs move effortlessly: a 1 A current moves one coulomb per second, so a household appliance drawing 10 A pushes tens of coulombs through its wires each second.

The unit honours Charles-Augustin de Coulomb, who first quantified how charges interact. It is the practical bridge between the microscopic elementary charge and the macroscopic currents that run civilisation.`,
    relatedPhysicists: ["charles-augustin-de-coulomb"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "coulombs-law" },
    ],
  },
  {
    slug: "electric-field",
    term: "Electric field",
    category: "concept",
    shortDefinition: "The force per unit charge that a test charge would feel at a given point. A vector field filling all of space. Units: newtons per coulomb, equivalently volts per metre.",
    description: `The electric field E at a point is defined operationally: place a small positive test charge q there, measure the force F on it, and divide. E = F/q. The field is whatever the test charge does not care about — its value depends only on the source charges, not on q. Electric field has units of newtons per coulomb, or equivalently volts per metre, and is a vector: it has both magnitude and direction at every point in space.

The field concept replaces "action at a distance" with a local picture. In Newton's theory of gravity, the Sun pulls on the Earth across empty space; nobody liked this, but it worked. Faraday and Maxwell replaced it for electromagnetism with a field: the Sun's charges fill the surrounding space with a pattern, and a distant charge feels only the local value of that pattern. When the source wiggles, the pattern wiggles — not instantaneously, but at the speed of light. This upgrade turned out to be the deeper description; the field carries energy, momentum, and information, and eventually (with Einstein) becomes a dynamical thing of its own.

Every charge distribution produces a field; every field exerts a force on any charge you drop into it. Once you know E(r) everywhere, electrostatics is solved — the force on a charge q at position r is simply qE(r). Most of the subject is about calculating that field for a given source, either directly from Coulomb's law or more cleverly via Gauss's law and symmetry.`,
    history: `Michael Faraday introduced the notion of "lines of force" filling the space around charges and magnets in the 1830s — a pictorial language without mathematics. James Clerk Maxwell converted Faraday's pictures into the vector-field partial differential equations of 1861–65 that now bear his name. Einstein later said Faraday and Maxwell completed what Newton had begun: a description of physics in terms of fields rather than particles-at-a-distance.`,
    relatedPhysicists: ["michael-faraday", "charles-augustin-de-coulomb"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electric-field" },
    ],
  },
  {
    slug: "field-line",
    term: "Field line",
    category: "concept",
    shortDefinition: "A curve whose tangent at every point is the direction of the electric field there. Lines begin on positive charges and end on negative ones.",
    description: `A field line is a curve drawn so that its tangent at every point points along the local electric field. Field lines never cross — if they did, the field would have two directions at the crossing point, which is impossible. They begin on positive charges, end on negative charges, and in regions of empty space they simply flow smoothly from one to the other.

Density of field lines encodes the field's strength: where lines are packed close together, the field is strong; where they fan out, it is weak. This is not a convention but a geometric consequence — if you draw lines emanating uniformly from a point charge, the number per unit area falls off as 1/r², matching the 1/r² law of the field itself.

Field lines are a visualisation tool, not a physical object; there is nothing material about them. Their power is in what they let you see at a glance: the dipole's hourglass-shaped pattern, the way lines leave a conductor surface at right angles, the fact that Gaussian surfaces cut through them in predictable numbers. Faraday, who invented them, used the pictures as a way of thinking that eventually became Maxwell's equations.`,
    history: `Michael Faraday drew the first "lines of force" in his notebooks in the 1830s, imagining a physical strand under tension that could store energy and transmit force. Maxwell kept the pictures but replaced the strands with a mathematical vector field; the phrase "field line" stuck.`,
    relatedPhysicists: ["michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electric-field" },
    ],
  },
  {
    slug: "flux",
    term: "Flux",
    category: "concept",
    shortDefinition: "A scalar measure of how much of a vector field passes through a surface, weighted by the field's component normal to the surface.",
    description: `Flux quantifies how much of a vector field pierces a given surface. For a uniform field E through a flat area A with unit normal n̂, the flux is Φ = E·n̂ A — the component of E along n̂ times the area. For curved surfaces and non-uniform fields, you break the surface into infinitesimal patches, compute E·n̂ dA for each, and add them all up. The result is a single number with units of field strength times area.

Intuitively, imagine the vector field as the velocity of a fluid flowing through space; the flux of that velocity through a surface is the volume of fluid crossing per unit time. For the electric field the "fluid" is abstract, but the bookkeeping is the same. Flux through a closed surface tells you whether more field is leaving than entering — which, by Gauss's law, is the same as asking how much charge is enclosed.

Flux is linear: the flux of a sum of fields equals the sum of their fluxes. It is signed: flux out of a closed surface (following the outward normal) is positive, flux in is negative. And it is the main quantity Gauss's law talks about — the whole power of that law comes from recognising that, for symmetric charge distributions, flux integrals collapse to E × (area) and solve themselves.`,
    relatedPhysicists: ["carl-friedrich-gauss", "michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauss-law" },
    ],
  },
  {
    slug: "gaussian-surface",
    term: "Gaussian surface",
    category: "concept",
    shortDefinition: "An imaginary closed surface chosen to exploit symmetry when applying Gauss's law.",
    description: `A Gaussian surface is any closed surface you imagine around a charge distribution in order to apply Gauss's law. The surface is not real — no physical membrane is involved — and you are free to pick whatever shape makes the integral easiest. The art of the method is choosing a surface whose geometry matches the symmetry of the field, so that the flux integral collapses into simple arithmetic.

For a point charge or a spherically symmetric distribution, the right choice is a concentric sphere: on that sphere E is constant in magnitude and perpendicular to the surface, so the flux is just E × (4πr²). For an infinite line of charge, a coaxial cylinder works: E is radial and constant on the side, zero flux through the end caps. For an infinite charged plane, a "pillbox" straddling the plane gives two equal end-cap contributions and no side flux.

The trick is entirely about symmetry. Gauss's law is always true for any closed surface, but the integral is only tractable when you can pull E out of it. If the charge distribution has no useful symmetry, Gauss's law still holds, but you would not use it for calculation — you would use Coulomb's law or a computer instead.`,
    relatedPhysicists: ["carl-friedrich-gauss"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauss-law" },
    ],
  },
  {
    slug: "divergence",
    term: "Divergence",
    category: "concept",
    shortDefinition: "A scalar measure of how much a vector field spreads outward from a point, per unit volume. ∇·F = source density.",
    description: `Divergence is a local version of flux. Where flux asks "how much of the field leaves this big closed surface?", divergence asks "how much does it leave a tiny volume around this one point, per unit volume, in the limit of zero size?". The answer at each point is a scalar: positive where the field is diverging (a source), negative where it is converging (a sink), zero where it is just passing through.

For the electric field, divergence has a spectacular property: ∇·E = ρ/ε₀. The divergence of E at any point equals the local charge density divided by the permittivity of free space. This is the differential form of Gauss's law — it says that charges are the sources and sinks of the electric field, and nothing else is. Empty regions of space have zero divergence; regions with positive charge have positive divergence; regions with negative charge have negative divergence.

The divergence theorem (Gauss's theorem) connects the two viewpoints: the flux of F through a closed surface equals the integral of ∇·F over the enclosed volume. This theorem is why "electric field lines begin and end on charges": wherever the divergence is nonzero, field lines must sprout or terminate. Divergence is the calculus that makes Faraday's intuition about lines of force rigorous.`,
    relatedPhysicists: ["carl-friedrich-gauss"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauss-law" },
    ],
  },
  {
    slug: "gradient",
    term: "Gradient",
    category: "concept",
    shortDefinition: "A vector that points in the direction of steepest increase of a scalar field, with magnitude equal to the rate of that increase.",
    description: `The gradient of a scalar field f is a vector, written ∇f. At every point it points in the direction in which f increases fastest, and its magnitude is the rate of that increase (units of f per unit distance). For the temperature in a room, the gradient points from cool air toward the radiator; for the altitude of a landscape, it points uphill along the steepest slope.

The gradient has a deep connection to electric potential. The electric field is the negative gradient of the electric potential: E = −∇V. This one equation is why knowing the potential everywhere tells you the field everywhere: take the gradient (with a minus sign) and you are done. It also explains why electric field lines are perpendicular to equipotential surfaces — the gradient of any function is always perpendicular to its level sets, the way uphill is always perpendicular to contour lines on a topographic map.

Computationally, the gradient is just three partial derivatives bundled into a vector: ∇f = (∂f/∂x, ∂f/∂y, ∂f/∂z). But conceptually it is one of the most useful objects in physics: it turns scalar potentials (which are easy to store and add up) into vector fields (which are what actually push things around).`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "line-integral",
    term: "Line integral",
    category: "concept",
    shortDefinition: "The integral of a vector field along a curve, measuring the accumulated effect of the field's component tangent to the path.",
    description: `A line integral ∫F·dℓ adds up the component of a vector field F along a curve. At every point along the path, you take the projection of F onto the tangent direction dℓ and integrate. If F is a force and the curve is the trajectory of a particle, the line integral is the work done by the force. If F is an electric field and the curve runs from point A to point B, the line integral equals the potential difference V(A) − V(B).

Line integrals can depend on the path — the work done by friction dragging a box across a room depends on which route you take. But for electric fields produced by static charges, the integral is path-independent: it only depends on the endpoints. That is exactly what it means to say a field is conservative, and it is the condition that lets us define a potential function in the first place. Give the same endpoints, get the same answer, no matter how convoluted the route.

The closed-loop version of this, ∮F·dℓ, is the circulation of the field around a loop. For static electric fields the circulation is always zero — another way of saying that electrostatic fields are conservative. When the field is not static (in time-varying electromagnetism) the circulation can be nonzero, and that is precisely Faraday's law of induction.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "electric-potential-term",
    term: "Electric potential",
    category: "concept",
    shortDefinition: "The electrostatic potential energy per unit charge at a point. A scalar field measured in volts. V = −∫E·dℓ from a reference point.",
    description: `Electric potential V is the electrostatic potential energy per unit charge. If you would have to do work W to bring a small positive test charge q from infinity to a point P, then V(P) = W/q. Units: joules per coulomb, called volts. Because work is a scalar (just a number), potential is a scalar field — one real number at every point in space — which is enormously easier to compute with than the vector electric field.

Once you have the potential, you can get the field by differentiation: E = −∇V, the negative gradient. The minus sign means the field points from high potential toward low potential, the same way water flows from high ground to low. Moving a charge around changes its potential energy by qΔV; two points with no potential difference between them do no work on a charge that moves between them, regardless of route.

Only potential differences matter physically. The absolute zero of potential is a convention: in electrostatics problems it is usually set at infinity; in circuits it is usually set at "ground" — a particular chunk of copper arbitrarily declared to be 0 V. This is why the output of a battery is specified as a voltage (a difference) rather than a single potential, and why connecting one terminal of a battery to "ground" and nothing else does nothing — voltage only does work when it drives current through something.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "volt",
    term: "Volt",
    category: "unit",
    shortDefinition: "The SI unit of electric potential difference. One volt equals one joule of work per coulomb of charge transported. Symbol: V.",
    description: `The volt (symbol V) is the SI unit of electric potential difference. By definition, a potential difference of one volt between two points means that one joule of work is done per coulomb of charge moved between them. Equivalently: 1 V = 1 J/C = 1 kg·m²·s⁻³·A⁻¹ in SI base units.

Volts are the everyday currency of electricity. A flashlight battery delivers 1.5 V across its terminals. Car batteries deliver 12 V. Household wall outlets supply 110–240 V depending on country. High-voltage transmission lines run at hundreds of kilovolts. The van de Graaff generators used in particle physics reach several megavolts. At the low end, the signals inside a neuron move around in tens of millivolts.

The unit honours Alessandro Volta, who in 1800 invented the voltaic pile — a stack of zinc and copper discs separated by brine-soaked cloth — and thereby produced the first steady electric current in human history. Before Volta, every electrical experiment had to be powered by sparks and Leyden jars; after him, steady currents made electrochemistry, electromagnetism, and eventually electric power possible.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "equipotential",
    term: "Equipotential",
    category: "concept",
    shortDefinition: "A surface on which the electric potential is constant. No work is done moving a charge along an equipotential, and the electric field is everywhere perpendicular to it.",
    description: `An equipotential surface is a locus of points that all share the same electric potential V. Because moving a charge between two points with the same potential does no net work, moving along an equipotential surface is free. This is why birds sit safely on power lines: the bird's two feet are at the same potential, so no current flows through it.

Equipotentials are always perpendicular to the electric field. The reason is geometric: the electric field points in the direction of steepest potential decrease (E = −∇V), and the gradient is always perpendicular to level surfaces. Field lines and equipotentials form a right-angle grid, like meridians and parallels on a globe. Drawing them together is the standard way physicists visualise electrostatic configurations.

Conductors in electrostatic equilibrium are automatically equipotentials — any potential gradient inside a conductor would drive current until the charges rearranged and flattened the gradient out. This is why every bare metal wire in a circuit is at a single voltage, why the surface of a conducting sphere is an equipotential no matter how charge is loaded onto it, and why the Faraday cage works: its whole body hovers at one potential, screening whatever is inside.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "capacitance-term",
    term: "Capacitance",
    category: "concept",
    shortDefinition: "The ratio of charge stored on a conductor (or between two conductors) to the voltage that stored it. C = Q/V. Units: farads.",
    description: `Capacitance measures how much charge a conductor — or pair of conductors — can hold per volt of potential difference. Put charge Q on an isolated conductor and it rises to some potential V; the ratio C = Q/V is the capacitance, a purely geometric property of the conductor's shape and size. For a pair of conductors ("a capacitor") the voltage is the potential difference between them, and the capacitance depends on their shapes, separation, and the insulating material between them.

The units are farads (F), defined as one coulomb per volt. A farad is an enormous capacitance; real capacitors range from picofarads (10⁻¹² F) in radio circuits to millifarads in power-supply smoothing and, with modern electrochemical "supercapacitors," tens or hundreds of farads in a fist-sized package. A basic parallel-plate capacitor with plates one metre square and a one-millimetre gap has a capacitance of about 9 nF.

Capacitance is ubiquitous in electronics because it lets circuits store charge, smooth voltage, and time events. A capacitor across a DC line steadies the voltage; a capacitor in series with a resistor sets a time constant τ = RC controlling how fast voltages rise and fall. Every pair of conductors in any circuit has some stray capacitance whether you want it or not — at high frequencies, that parasitic capacitance is often what actually limits performance.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "capacitance-and-field-energy" },
    ],
  },
  {
    slug: "farad",
    term: "Farad",
    category: "unit",
    shortDefinition: "The SI unit of capacitance. One farad holds one coulomb of charge per volt of potential difference. Symbol: F.",
    description: `The farad (symbol F) is the SI unit of capacitance: 1 F = 1 C/V. It measures how much charge a capacitor accumulates per volt applied across it. A capacitor of 1 F charged to 1 V stores 1 C of charge, which is a colossal amount by electronic standards.

Practical capacitors almost never reach a farad. Typical values range from picofarads (pF, 10⁻¹² F) in radio-frequency tuning circuits, through nanofarads (nF) in timing circuits, to microfarads (μF) and millifarads (mF) in power-supply filters. Only modern electrochemical "supercapacitors" — which exploit double-layer charge storage at atom-scale interfaces — break the one-farad barrier, and they reach hundreds to thousands of farads in devices the size of a soup can.

The unit was named in 1881, after Michael Faraday, at the International Electrical Congress in Paris. Faraday never saw a capacitor labelled in farads during his lifetime; the naming was a posthumous tribute from a profession that was still busy laying down the units he had helped make necessary.`,
    relatedPhysicists: ["michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "capacitance-and-field-energy" },
    ],
  },
  {
    slug: "field-energy-density",
    term: "Field energy density",
    category: "concept",
    shortDefinition: "The energy stored per unit volume in an electric field: u = ½ε₀E². Measured in joules per cubic metre.",
    description: `Electric fields carry energy. Wherever an electric field exists, there is an associated energy density u = ½ε₀E² — joules per cubic metre, proportional to the square of the field strength. Integrate that density over all space and you get the total energy it took to assemble whatever charge distribution is sourcing the field. This is where the energy stored in a capacitor actually lives: not on the plates, but in the field between them.

The idea that the field itself stores energy was revolutionary. In the Newtonian action-at-a-distance picture, there was nothing between two charges; energy was just a property of the pair. Faraday and Maxwell said no — the energy is spread through the space around the charges, every cubic metre holding its share of ½ε₀E². The total is the same as the old accounting, but the location is completely different. This picture turned out to be essential once electromagnetic waves were discovered: a light wave propagating through vacuum carries energy in exactly this form, even though there are no charges at all in the space it occupies.

Field energy density is the electric companion of the analogous magnetic expression, u_B = B²/(2μ₀). In a general electromagnetic field both contribute, and their sum is the local energy density of the field. The flow of that energy through space is described by the Poynting vector.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "capacitance-and-field-energy" },
    ],
  },
  {
    slug: "faraday-cage",
    term: "Faraday cage",
    category: "instrument",
    shortDefinition: "A conducting enclosure that blocks external static and low-frequency electric fields by redistributing charge on its surface.",
    description: `A Faraday cage is a conducting enclosure — solid metal or a fine mesh — that shields its interior from external electric fields. Any external field induces charges on the cage's outer surface that arrange themselves to cancel the field inside. Inside a good Faraday cage, the electric field is essentially zero no matter what is happening outside.

The shielding works because conductors are equipotentials in electrostatic equilibrium. If you try to impose an external field, the conduction electrons rearrange themselves until the field inside the conductor — and inside the cavity it encloses — is zero. The rearrangement takes picoseconds; from then on, the interior is protected.

Faraday cages are everywhere in modern life. Microwave oven doors use a metal mesh with holes smaller than the 12 cm microwave wavelength; car bodies and airplane fuselages protect passengers from lightning strikes; MRI machine rooms are wrapped in copper to keep radio interference out; coaxial cables shield signals inside a grounded braid. The electromagnetic isolation rooms used for sensitive measurements and national-security work are industrial Faraday cages built from welded copper sheet.`,
    history: `Michael Faraday built the first experimental Faraday cage in 1836: a room-sized wooden frame sheathed in metal foil. He sat inside it with the most sensitive electroscope he could build while his assistants drove enormous sparks onto the outside. The electroscope never twitched. Faraday wrote in his notebook, "I went into the cube and lived in it, but although I used lighted candles, electrometers, and all other tests of electrical states, I could not find the least influence upon them."`,
    relatedPhysicists: ["michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "conductors-and-shielding" },
    ],
  },
  {
    slug: "induced-charge",
    term: "Induced charge",
    category: "concept",
    shortDefinition: "The surface charge that appears on a conductor in response to a nearby external charge, redistributed until the conductor's interior field is zero.",
    description: `When a charge is placed near a conductor, the mobile electrons inside the conductor rearrange themselves. Negative charge accumulates on the side facing a nearby positive source; positive charge appears on the opposite face. These induced surface charges are not new charges — the total charge of the conductor is unchanged — but they redistribute so that the field inside the conductor's bulk is zero.

Induced charge is the mechanism behind electrostatic attraction of neutral objects. A charged balloon picks up neutral paper scraps because the balloon's field polarises each scrap: positive charge migrates one way, negative the other, and the end closer to the balloon carries the opposite sign and is therefore attracted more strongly than the farther end is repelled. The net force is attractive. The same effect is why dust sticks to TV screens, why rubbed amber picks up straw (the two-thousand-year-old observation that launched electrostatics), and why humidity makes static cling worse — water molecules polarise easily and redistribute surface charges rapidly.

In problems with conductors the induced charge is exactly what makes calculations tractable. You cannot choose where the induced charges sit; they go wherever they need to so as to make the conductor's interior field vanish. The beautiful consequence is that for many geometries — a point charge near a flat conductor, or near a grounded sphere — the induced distribution is equivalent to replacing the conductor with a single fictitious "image charge" at a mathematically convenient location. That is the method of images.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "conductors-and-shielding" },
    ],
  },
  {
    slug: "image-charge",
    term: "Image charge",
    category: "concept",
    shortDefinition: "A fictitious charge placed outside the region of interest whose field, together with the real charge's field, satisfies the conductor's boundary conditions.",
    description: `The method of images is a trick for solving electrostatics problems involving conductors. Instead of integrating over the induced charge distribution on the conductor's surface — which is usually unknown in advance — you replace the conductor with a cleverly placed fictitious "image charge" that, together with the real charge, produces exactly the right boundary conditions.

The canonical example is a point charge +q above an infinite grounded conducting plane. The conductor must be an equipotential at V = 0. Remove the conductor entirely, and instead place a fictitious −q the same distance below where the plane used to be. The two charges together produce a potential that is zero on the plane by symmetry. In the half-space above the plane, the field is identical to the original problem's — but now you have a simple two-charge system you can compute by inspection. The image charge is not real; no actual charge exists below the plane. It is a calculational device that reproduces the effect of the induced surface charges on the real conductor.

The method works because Laplace's equation has unique solutions once boundary conditions are specified. If you find any field that satisfies the equation in the region of interest and matches the boundaries, you have found the field. Image configurations are known for a point charge near a grounded plane, near a grounded sphere, between two intersecting planes, and a handful of other high-symmetry cases. Beyond those, numerical methods take over — but within their domain, images turn problems that would require surface integrals into arithmetic.`,
    history: `Siméon Denis Poisson introduced the method of images in his 1813 work on electrostatics and potential theory, building on the mathematical framework Laplace had developed for gravitation. William Thomson (Lord Kelvin) extended it dramatically in 1848, applying it to the grounded sphere and giving the method its modern, fully geometrical form.`,
    relatedPhysicists: ["simeon-denis-poisson"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "method-of-images" },
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
