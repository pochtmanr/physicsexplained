// Seed new physicists + glossary terms from Wave 1 (Module 5 · Waves) directly
// into Supabase content_entries. Run: pnpm exec tsx --conditions=react-server scripts/content/seed-wave-1.ts
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
  const match = s.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) return { title: match[1].trim(), year: match[2].trim(), description: "" };
  return { title: s, year: "", description: "" };
}

const PHYSICISTS: PhysicistSeed[] = [
  {
    slug: "jean-d-alembert",
    name: "Jean le Rond d'Alembert",
    shortName: "d'Alembert",
    born: "1717",
    died: "1783",
    nationality: "French",
    oneLiner: "The foundling who wrote down the wave equation at twenty-nine and solved it in the same paper.",
    bio: "Left on the steps of the church of Saint-Jean-le-Rond in Paris in 1717, d'Alembert grew up as the illegitimate son of an artillery officer and a salon hostess. He trained in law, medicine, and finally mathematics, teaching himself analysis from borrowed books.\n\nIn 1743 his Traité de dynamique reformulated Newtonian mechanics in terms of what is now called d'Alembert's principle: the force of inertia opposing motion can be treated as a real force, turning every dynamics problem into a statics problem. Three years later, in a memoir to the Berlin Academy, he wrote down the partial differential equation for a vibrating string and proved its general solution is a right-moving plus a left-moving waveform — an insight that would structure the theory of every wave in physics.\n\nHe co-edited the Encyclopédie with Diderot, writing its mathematical articles. He fought with Euler, Bernoulli, and Clairaut about everything from the shape of the Earth to the three-body problem. He worked out the precession equations for the Earth's axis. He refused Frederick the Great's offer to preside over the Berlin Academy. He died, respected and tired, in 1783.",
    contributions: [
      "Derived the one-dimensional wave equation and its general solution f(x − vt) + g(x + vt) (1746)",
      "D'Alembert's principle reformulating Newtonian dynamics (1743)",
      "Worked out the precession of the equinoxes from first principles (1749)",
      "Co-editor of the Encyclopédie with Diderot",
    ],
    majorWorks: [
      "Traité de dynamique (1743)",
      "Recherches sur la courbe que forme une corde tendue mise en vibration (1747)",
      "Encyclopédie (1751–1772)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "brook-taylor",
    name: "Brook Taylor",
    shortName: "Taylor",
    born: "1685",
    died: "1731",
    nationality: "English",
    oneLiner: "The Cambridge mathematician whose 1713 analysis of the vibrating string launched the whole theory of waves.",
    bio: "Brook Taylor is remembered today for the series that bears his name — the expansion of any smooth function around a point as a sum of derivative terms. But his contemporaries knew him equally as the man who first cracked a physical problem that had resisted everyone before him: how a plucked string moves.\n\nIn his 1713 paper to the Royal Society, Taylor argued that the restoring force on each small element of a tensioned string is proportional to the string's curvature. From this he derived the period of the fundamental mode and showed that it agreed with observation. His analysis was incomplete — he treated only the lowest mode — but it set the mathematical template that d'Alembert, Euler, and Bernoulli would finish over the next forty years.\n\nTaylor's Methodus Incrementorum (1715) contained, buried in its pages, the series expansion now known to every calculus student. Its significance went unrecognised in his lifetime; Lagrange, decades later, called it \"the main foundation of the differential calculus.\" Taylor died young of a fever in 1731, aged forty-six.",
    contributions: [
      "First analysis of the vibrating string (1713)",
      "Taylor series expansion of functions",
      "Founded the calculus of finite differences",
      "Early work on perspective in geometry",
    ],
    majorWorks: [
      "Methodus Incrementorum Directa et Inversa (1715)",
      "Linear Perspective (1715)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "daniel-bernoulli",
    name: "Daniel Bernoulli",
    shortName: "Bernoulli",
    born: "1700",
    died: "1782",
    nationality: "Swiss",
    oneLiner: "The Basel mathematician who insisted, against Euler's objections, that every vibration is a sum of sinusoids.",
    bio: "Daniel Bernoulli belonged to the most extraordinary family in the history of mathematics — uncle, father, brothers, and cousins all produced first-rank work in calculus and mechanics. He trained as a physician but spent his career as a mathematician in Basel, Saint Petersburg, and again in Basel.\n\nHis 1738 Hydrodynamica introduced the principle that bears his name, relating the pressure, velocity, and height of a fluid along a streamline. It laid the foundation of fluid dynamics and anticipated the kinetic theory of gases by more than a century. His work on oscillating bodies, compound pendulums, and the vibrating string led him, around 1750, to propose that the general motion of a finite string is a superposition of sinusoidal modes — a fundamental and its harmonics — each with its own amplitude and phase.\n\nHis friend and rival Euler refused to believe it. Only an \"arbitrary\" function, Euler argued, could represent a plucked string, and he did not see how a sum of sines could. The dispute remained unresolved in their lifetimes; Fourier settled it in their favour sixty years later, by proving that any reasonable function can be decomposed into sinusoids.",
    contributions: [
      "Bernoulli's principle for fluids (1738)",
      "First correct formulation of modal superposition for vibrating bodies (c. 1750)",
      "Early kinetic theory of gases",
      "Foundational work on the St. Petersburg paradox in probability",
    ],
    majorWorks: [
      "Hydrodynamica (1738)",
      "Réflexions et éclaircissements sur les nouvelles vibrations des cordes (1753)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" },
    ],
  },
  {
    slug: "william-rowan-hamilton",
    name: "William Rowan Hamilton",
    shortName: "Hamilton",
    born: "1805",
    died: "1865",
    nationality: "Irish",
    oneLiner: "The Irish polymath who gave mechanics its deepest reformulation and named the group velocity in the same decade.",
    bio: "William Rowan Hamilton was an Irish mathematician and physicist whose reach across disciplines was almost embarrassing. Born in Dublin in 1805, he was reading Latin, Greek and Hebrew by age five, had a working knowledge of a dozen languages by his early teens, and was appointed Andrews Professor of Astronomy at Trinity College Dublin — and Royal Astronomer of Ireland — while still an undergraduate. He held the post for the rest of his life.\n\nHis contributions to physics begin with optics, where in the 1820s and 1830s he developed a variational principle that treated rays of light as paths that extremised a characteristic function. It was inside this programme, in a paper read to the Royal Irish Academy in 1839, that he wrote down the formula v_g = dω/dk and distinguished it explicitly from the phase velocity of an individual ray. Rayleigh would later generalise the argument, but the identity is Hamilton's.\n\nHamilton then transposed the same variational machinery onto classical mechanics, producing the Hamilton-Jacobi equation and the Hamiltonian formulation that underlies most of modern physics — quantum mechanics in particular was built on Hamilton's framework a century after his death. Along the way he invented the quaternions (famously carved into Dublin's Broom Bridge in 1843 when he worked them out on a walk), introduced the term 'scalar' and 'vector', and laid the groundwork for modern linear algebra.",
    contributions: [
      "Defined the group velocity v_g = dω/dk in optics (1839)",
      "Developed the Hamilton-Jacobi equation and Hamiltonian mechanics",
      "Invented the quaternions (1843)",
      "Introduced the principle of varying action in optics and mechanics",
      "Coined the modern meaning of 'scalar' and 'vector'",
    ],
    majorWorks: [
      "Theory of Systems of Rays (1828)",
      "On a General Method in Dynamics (1835)",
      "Lectures on Quaternions (1853)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" },
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
    ],
  },
  {
    slug: "john-william-strutt-rayleigh",
    name: "John William Strutt, 3rd Baron Rayleigh",
    shortName: "Rayleigh",
    born: "1842",
    died: "1919",
    nationality: "English",
    oneLiner: "The English aristocrat-physicist who gave sound and light their modern treatment and explained, almost in passing, why the sky is blue.",
    bio: "John William Strutt, who inherited the title of Lord Rayleigh in 1873, was the systematiser-in-chief of nineteenth-century wave physics. His two-volume Theory of Sound (1877-78) gathered every thread of classical acoustics — standing waves, resonators, damping, propagation in pipes and rooms — into a single coherent treatment that remained the standard reference for a century. It is in the Theory of Sound that the modern derivation of group velocity appears, extending Hamilton's 1839 identity with explicit attention to what happens when dispersion is present.\n\nRayleigh's contributions spread across almost every branch of classical physics. He explained why the sky is blue by showing that short-wavelength light scatters more strongly off air molecules than long-wavelength light — the phenomenon now called Rayleigh scattering. He co-discovered argon with William Ramsay in 1894, work that won him the Nobel Prize in Physics in 1904. He derived the Rayleigh-Jeans law of blackbody radiation, whose failure at short wavelengths pointed Planck toward quantum theory. He worked out the stability of fluid jets, the surface-wave modes that carry earthquakes, and half a dozen instruments that still bear his name.\n\nHe was, by all accounts, a relentlessly careful experimentalist who did most of his serious work in a private laboratory on the family estate at Terling Place. Einstein, asked late in life which physicists he most admired, named Rayleigh among the first three.",
    contributions: [
      "Modern derivation of group velocity in Theory of Sound (1877)",
      "Rayleigh scattering — explanation of why the sky is blue",
      "Rayleigh-Jeans law of blackbody radiation",
      "Co-discovery of argon (1894, Nobel Prize 1904)",
      "Rayleigh surface waves in elastic solids",
    ],
    majorWorks: [
      "The Theory of Sound, Vols I-II (1877)",
      "On the Light from the Sky, its Polarization and Colour (1871)",
      "Scientific Papers (1899)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" },
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "pythagoras",
    name: "Pythagoras of Samos",
    shortName: "Pythagoras",
    born: "c. 570 BCE",
    died: "c. 495 BCE",
    nationality: "Greek (Ionian)",
    oneLiner: "Heard the harmonic ladder 2,500 years before anyone could derive it.",
    bio: "Pythagoras is the oldest named figure in Western physics, and much of what's attributed to him is probably the work of his followers, the Pythagoreans, a secretive mathematical-religious brotherhood. What survives is a cluster of ideas: numbers govern the world, the universe is ordered by proportion, and the order can be heard.\n\nThe story goes that Pythagoras walked past a blacksmith's shop and noticed that hammers of different weights rang in consonant intervals when their weights were in simple integer ratios. Whether true or not (the physics of hammer weights doesn't quite work out), the core observation — that two vibrating strings sound consonant when their lengths are in ratios like 2:1, 3:2, 4:3 — does. He strung a single string over a movable bridge (the monochord) and built up an entire musical theory from integer proportions.\n\nHe never asked what vibration was, let alone what a wave was. He never wrote down an equation in the modern sense. But he noticed that something countable — some hidden discrete structure — sat underneath something continuous and audible. That observation, two and a half millennia before Fourier formalised it, is the seed of this entire topic.",
    contributions: [
      "Discovered (or his school did) that consonant musical intervals correspond to simple integer ratios of string length",
      "Introduced the monochord as a scientific instrument for studying vibration",
      "Founded the Pythagorean school, which carried the 'number is nature' programme into Plato and onward",
    ],
    majorWorks: [],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "joseph-fourier",
    name: "Jean-Baptiste Joseph Fourier",
    shortName: "Joseph Fourier",
    born: "1768",
    died: "1830",
    nationality: "French",
    oneLiner: "Claimed any shape is a sum of sines. Was right. Broke mathematics.",
    bio: "Fourier had an unusual CV even for his generation. Son of a tailor, orphaned at nine, educated at a Benedictine school, radicalised in the Revolution, arrested twice for the wrong politics at the wrong moment, rescued from the guillotine by Robespierre's own fall. He taught at the École Polytechnique, got drafted into Napoleon's Egyptian campaign, and spent three years governing Lower Egypt before returning to France.\n\nBack home, as prefect of Grenoble, he started studying heat flow in solids — a practical problem, not a glamorous one. In 1807 he submitted a paper arguing that the temperature profile in a bar, however it started, could be written as a sum of sinusoids, and that each sinusoid would decay on its own independent timescale. Lagrange and Laplace, two of the great mathematicians of the age, read it and said flatly: not possible. Discontinuous functions can't equal sums of smooth ones. They blocked its publication. Fourier expanded the argument into a book, Théorie analytique de la chaleur (1822), and forced the issue.\n\nHe was right, in a sense nobody in 1807 could have made precise. It took Dirichlet, Riemann, Lebesgue and the invention of measure theory to state clearly when his claim holds. But the tool Fourier invented — writing a function as a sum of its modal components — is now the most-used technique in physics. Quantum mechanics, optics, signal processing, MRI, JPEG, seismology, spectroscopy: all run on it.",
    contributions: [
      "Proved that a wide class of periodic functions can be decomposed as infinite sums of sines and cosines — the Fourier series",
      "Derived the heat equation and solved it by modal decomposition",
      "First clear statement of what we now call the greenhouse effect (1824)",
      "Developed dimensional analysis as a self-consistent discipline",
    ],
    majorWorks: [
      "Théorie analytique de la chaleur (1822)",
      "Mémoire sur la propagation de la chaleur dans les corps solides (1807)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "ernst-chladni",
    name: "Ernst Florens Friedrich Chladni",
    shortName: "Ernst Chladni",
    born: "1756",
    died: "1827",
    nationality: "German",
    oneLiner: "Drew a violin bow across a sand-sprinkled plate and watched the eigenmodes fall out.",
    bio: "Chladni was trained as a lawyer — his father insisted — and hated it. The moment his father died, he turned to music and physics. He had no academic post, no laboratory, and no formal scientific education beyond an amateur's reading. He paid his way by touring Europe performing acoustic demonstrations, accompanied by his own invention, a glass-rod instrument he called the euphon.\n\nIn 1787 he published Entdeckungen über die Theorie des Klanges (Discoveries on the Theory of Sound), which laid out the experimental technique that made him famous: fix a thin metal plate at its centre, sprinkle fine sand on it, and draw a violin bow along one edge. The plate rings at one of its eigenfrequencies, and the sand, bouncing on antinodes and rolling to the motionless nodal lines, traces those nodes out as a sharp geometric pattern. Different frequencies give different patterns — stars, crosses, concentric rings, asymmetric flowers.\n\nChladni could demonstrate the patterns. He could not derive them. The mathematics — a fourth-order plate equation — was beyond anyone at the time. Napoleon, who saw a demonstration in Paris in 1809, was so taken with it that he offered a 3,000-franc prize through the Academy for a theoretical explanation. Sophie Germain won it (on her third try) in 1816; her theory was still not quite right, and the full treatment wasn't settled until the twentieth century.\n\nChladni also founded the scientific study of meteorites. His 1794 book arguing that 'stones from the sky' really did come from space, and weren't just folklore, was mocked for a decade before he was vindicated.",
    contributions: [
      "Discovered the experimental technique of visualising vibrational nodes with sand (Chladni figures)",
      "Catalogued eigenmodes of plates and rods",
      "Established that meteorites are extraterrestrial, founding modern meteoritics",
      "Invented the euphon and the clavicylinder, early friction-based musical instruments",
    ],
    majorWorks: [
      "Entdeckungen über die Theorie des Klanges (1787)",
      "Die Akustik (1802)",
      "Über den Ursprung der von Pallas gefundenen Eisenmasse (1794)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "hermann-von-helmholtz",
    name: "Hermann von Helmholtz",
    shortName: "Helmholtz",
    born: "1821",
    died: "1894",
    nationality: "German",
    oneLiner: "Army doctor turned founding father of physiological acoustics, energy conservation, and half of nineteenth-century physics.",
    bio: "Helmholtz trained as a military surgeon in Berlin — the state paid for his medical school in exchange for eight years of army service — but his real interests were in physics and physiology. His 1847 essay Über die Erhaltung der Kraft (On the Conservation of Force) was the first rigorous mathematical statement of energy conservation, welding together Joule's experiments, Mayer's speculations, and Clausius's thermodynamics into a single principle.\n\nHe then turned to the physics of perception. His three-volume Handbook of Physiological Optics (1856–67) laid the foundations of modern vision science. His 1863 On the Sensations of Tone did the same for hearing, combining Fourier decomposition of complex waveforms with anatomy of the inner ear to explain why a violin and a clarinet playing the same note sound different. The book became the standard text on acoustics for more than a century.\n\nHe held chairs at Königsberg, Bonn, Heidelberg, and finally Berlin. His students included Heinrich Hertz — who would go on to discover radio waves — and Max Planck, who inherited his Berlin chair. When the Reichsanstalt, the German national standards institute, was founded in 1887, Helmholtz was its first president. He was the pre-eminent scientist of late-nineteenth-century Germany, and one of the last figures to bridge physics, physiology, and philosophy in a single career.",
    contributions: [
      "First rigorous mathematical statement of conservation of energy (1847)",
      "Founded physiological acoustics in On the Sensations of Tone (1863)",
      "Handbook of Physiological Optics — the foundation of modern vision science",
      "Helmholtz resonators, now standard in acoustic engineering",
      "Early work on vortex dynamics in fluids",
    ],
    majorWorks: [
      "Über die Erhaltung der Kraft (1847)",
      "Handbuch der physiologischen Optik (1867)",
      "Die Lehre von den Tonempfindungen (1863)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "christian-doppler",
    name: "Christian Doppler",
    shortName: "Doppler",
    born: "1803",
    died: "1853",
    nationality: "Austrian",
    oneLiner: "Predicted in 1842 that moving sources would shift the frequency of the waves they emit.",
    bio: "Christian Andreas Doppler was born in Salzburg in 1803, the son of a stonemason. Too frail for the family trade, he was steered into mathematics by a shrewd teacher and worked his way through the Polytechnic in Vienna to professorships in Prague and, eventually, Vienna.\n\nIn 1842, while lecturing at the Estates Institute in Prague, he delivered the paper that would carry his name: Über das farbige Licht der Doppelsterne. In it, he argued in little more than a page that the observed frequency of a wave — sound, light, water — depends on the motion of its source. He applied the idea (incorrectly, as it turned out) to the apparent colour of binary stars, which served as the opening chapter of astrophysics.\n\nHe was right about the mechanism and wrong about the stellar colours. Experimental confirmation came from Buys Ballot in 1845. Doppler died of tuberculosis in Venice in 1853, before living to see his effect become the measurement tool of an entire century.",
    contributions: [
      "Proposed the Doppler effect (1842)",
      "Early work on aberration, colour theory, and mathematical optics",
    ],
    majorWorks: ["Über das farbige Licht der Doppelsterne (1842)"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" }],
  },
  {
    slug: "christophe-buys-ballot",
    name: "Christophe Hendrik Diederik Buys Ballot",
    shortName: "Buys Ballot",
    born: "1817",
    died: "1890",
    nationality: "Dutch",
    oneLiner: "Confirmed the Doppler effect in 1845 using trumpet players on a moving train.",
    bio: "Buys Ballot was the founding director of the Royal Netherlands Meteorological Institute and the man who turned weather observation in Europe from folklore into a network science. His name is attached to a law of wind directions that any sailor still knows.\n\nIn 1845 he set up what remains one of the most entertaining experiments in physics. He hired an open railway flatcar on the Utrecht–Maarssen line, stationed a group of trumpet players on it, and had them hold a single pure tone as the train sped past a platform of listeners with perfect pitch. The sharpness on approach, the flatness on departure, matched Doppler's paper to the half-tone. Repeated a dozen times over three days, it settled the question.\n\nHe spent the rest of his career building the international telegraphic weather network that made modern forecasting possible.",
    contributions: [
      "First experimental confirmation of the Doppler effect (1845)",
      "Buys Ballot's law on wind direction relative to pressure",
      "Founder of the Royal Netherlands Meteorological Institute (1854)",
    ],
    majorWorks: ["Akustische Versuche auf der Niederländischen Eisenbahn (1845)"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" }],
  },
  {
    slug: "ernst-mach",
    name: "Ernst Mach",
    shortName: "Mach",
    born: "1838",
    died: "1916",
    nationality: "Austrian",
    oneLiner: "Photographed the shock cone of supersonic projectiles and gave the dimensionless number that bears his name.",
    bio: "Ernst Mach was trained as a physicist in Vienna but ended up something closer to a philosopher of science. He spent his career at the University of Prague and later Vienna, working across acoustics, optics, fluid dynamics, and the theory of perception.\n\nIn 1887 he and his student Peter Salcher captured the first photographs of a supersonic bullet, using a schlieren apparatus to make the compressed air around the projectile visible. The V-shaped shock wave trailing the bullet matched his geometric prediction exactly. The half-angle of that cone depends only on the ratio of projectile speed to sound speed — the quantity now called the Mach number.\n\nHis writings on inertia and reference frames — Mach's principle — profoundly influenced Einstein, though Mach himself never accepted general relativity. He is the rare physicist whose name survives as a unit, a cone, and a philosophical position.",
    contributions: [
      "Geometry and photography of supersonic shock waves (1887)",
      "Mach number, the dimensionless speed ratio v / c_sound",
      "Mach's principle on inertia and the distant masses",
    ],
    majorWorks: [
      "Photographische Fixierung der durch Projectile in der Luft eingeleiteten Vorgänge (1887)",
      "Die Mechanik in ihrer Entwicklung (1883)",
    ],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" }],
  },
  {
    slug: "vesto-slipher",
    name: "Vesto Melvin Slipher",
    shortName: "Slipher",
    born: "1875",
    died: "1969",
    nationality: "American",
    oneLiner: "Measured the first galactic redshifts in 1912, a decade before Hubble's expansion law.",
    bio: "Vesto Slipher joined Lowell Observatory in 1901 and stayed for fifty-three years, rising to its directorship. The observatory was founded by Percival Lowell to study Mars, but Slipher pointed its 24-inch refractor at fainter, less fashionable objects — the spiral nebulae that nobody yet knew were galaxies.\n\nIn 1912 he obtained a high-dispersion spectrum of the Andromeda nebula and measured a radial velocity of −300 km/s — the first Doppler measurement of a galaxy. Over the next decade he catalogued the radial velocities of dozens more, finding almost all of them receding from Earth at hundreds or thousands of kilometres per second. The pattern was unmistakable but the framework to interpret it did not yet exist.\n\nWhen Edwin Hubble plotted those velocities against his 1924 distance estimates and found the linear law that now bears Hubble's name, the velocities on that plot were Slipher's. He did the hard observational work; others collected the glory. He also oversaw Clyde Tombaugh's discovery of Pluto in 1930 at the same observatory.",
    contributions: [
      "First measurement of galactic redshift (Andromeda, 1912)",
      "Catalogued radial velocities for dozens of spiral nebulae (1912–1925)",
      "Discovery of interstellar absorption lines",
    ],
    majorWorks: ["The radial velocity of the Andromeda Nebula (1913)"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" }],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "wave-equation",
    term: "Wave equation",
    category: "concept",
    shortDefinition: "The linear PDE whose solutions are any right-mover plus any left-mover at speed v.",
    description: "A second-order linear partial differential equation relating a field's acceleration in time to its curvature in space. In one spatial dimension it reads ∂²y/∂t² = v²∂²y/∂x², where v is the phase velocity set by the medium.\n\nd'Alembert showed in 1746 that every solution is of the form y(x,t) = f(x − vt) + g(x + vt) — an arbitrary shape moving right plus an arbitrary shape moving left, both at speed v, both shape-preserving. The same equation appears with different constants for strings, sound, light, elastic solids, transmission lines, plasma oscillations, and gravitational waves, making it one of the most universal equations in physics.",
    history: "Brook Taylor analysed a single mode of the vibrating string in 1713. Jean le Rond d'Alembert wrote down the PDE and proved its general solution in 1746. Euler and Daniel Bernoulli fought for three decades over what counted as a valid solution; Fourier's 1807 decomposition of arbitrary shapes into sinusoids ultimately settled the debate in Bernoulli's favour.",
    relatedPhysicists: ["jean-d-alembert", "brook-taylor", "daniel-bernoulli", "leonhard-euler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "wavelength",
    term: "Wavelength",
    category: "concept",
    shortDefinition: "The spatial period of a wave — distance crest to crest, symbol λ.",
    description: "The distance between two successive points on a periodic wave that are in phase — typically crest to crest or trough to trough. Denoted λ (lambda), measured in metres.\n\nFor a sinusoidal wave y = A sin(kx − ωt), the wavelength is λ = 2π/k, where k is the wavenumber. It combines with frequency f to give the phase velocity v = fλ, so in a medium where v is fixed (e.g. sound in air, light in vacuum), choosing a wavelength determines the frequency and vice versa.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "frequency",
    term: "Frequency",
    category: "concept",
    shortDefinition: "Number of oscillation cycles per unit time, symbol f, measured in hertz.",
    description: "How many complete oscillation cycles a wave or oscillator performs per second. Denoted f and measured in hertz (Hz), where 1 Hz = 1 cycle/second.\n\nFor a sinusoidal signal, frequency is the reciprocal of the period, f = 1/T. Angular frequency ω = 2πf is often more convenient in equations because it replaces factors of 2π with clean derivatives of sin(ωt) and cos(ωt). Energy in a wave scales as f², which is why high-frequency radiation (UV, X-rays, gamma rays) is far more energetic per photon than radio or microwaves.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "phase-velocity",
    term: "Phase velocity",
    category: "concept",
    shortDefinition: "The speed v_p = ω/k at which an individual crest of a sinusoidal wave moves. Can exceed c; carries no information.",
    description: "For a plane wave of the form cos(kx − ωt), the phase velocity is the speed at which a point of constant phase — a crest or a trough — travels: v_p = ω/k. It is the speed you would measure by watching one specific crest and timing its progress.\n\nPhase velocity is, perhaps counter-intuitively, not bounded by the speed of light. X-rays in glass, radio waves in an ionosphere, and microwaves in a waveguide all have v_p greater than c. Relativity is not violated because a pure sine wave, being infinite in extent and time, carries no information. Information requires modulation, and modulation builds a wave packet, which travels at the group velocity.",
    history: "The phase-versus-group distinction was crystallised by William Rowan Hamilton in 1839 and given its modern treatment by Lord Rayleigh in the Theory of Sound (1877).",
    relatedPhysicists: ["william-rowan-hamilton", "john-william-strutt-rayleigh", "jean-d-alembert"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" },
    ],
  },
  {
    slug: "superposition-principle",
    term: "Superposition principle",
    category: "concept",
    shortDefinition: "For any linear system, the sum of two solutions is also a solution: waves add, they don't collide.",
    description: "A property of every linear system: if y₁(x,t) and y₂(x,t) both satisfy the governing equation, so does y₁ + y₂. For waves, this means two disturbances on the same medium simply add together wherever they overlap, then continue unchanged along their separate paths.\n\nSuperposition is the reason music is intelligible, radio signals can share the spectrum, and two laser beams cross without scattering. It is a direct consequence of the linearity of the wave equation, Maxwell's equations in vacuum, and Schrödinger's equation. When the underlying equations are non-linear — shock waves in gas, rogue waves at sea, solitons in optical fibres — the principle fails, and overlapping waves scatter, steepen, or merge instead of passing cleanly through each other.",
    relatedPhysicists: ["jean-d-alembert", "daniel-bernoulli"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "standing-wave",
    term: "Standing wave",
    category: "concept",
    shortDefinition: "A wave pattern locked in place by interference, with fixed nodes and antinodes that don't propagate.",
    description: "A standing wave is what you get when two travelling waves of equal amplitude run through the same medium in opposite directions. Everywhere they reinforce, you get an antinode that oscillates at double amplitude. Everywhere they cancel, you get a node that never moves. The pattern does not travel — it pulses in place.\n\nStanding waves are the generic response of any bounded medium to excitation. Pluck a string fixed at both ends and the outgoing wave reflects off each end, runs back, and the superposition of the incoming and reflecting waves is a standing wave. Same for sound in pipes, electrons in atoms, light in laser cavities, and water in bathtubs. The boundaries select which standing-wave patterns can fit, and those patterns are the modes.",
    relatedPhysicists: ["joseph-fourier", "hermann-von-helmholtz"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" }],
  },
  {
    slug: "mode",
    term: "Mode",
    category: "concept",
    shortDefinition: "An allowed standing-wave pattern of a bounded system, labelled by an integer.",
    description: "A mode is one of the discrete standing-wave patterns that a bounded system can support. For a string fixed at both ends, mode n has exactly n half-wavelengths between the ends, frequency n times the fundamental, and a specific spatial shape sin(n π x / L). The integer n is called the mode number.\n\nModes are the fundamental language of linear wave physics. Any motion of the system, no matter how complicated, is a superposition of modes — each oscillating independently at its own frequency. The modes form a basis for the space of all possible motions. This is true for strings, drums, organ pipes, crystals, and the electrons in atoms; the same integer labelling runs through the whole of modern physics.",
    relatedPhysicists: ["joseph-fourier", "leonhard-euler"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" }],
  },
  {
    slug: "node",
    term: "Node",
    category: "concept",
    shortDefinition: "A point on a standing wave that never moves.",
    description: "A node is a point in a standing-wave pattern where the amplitude is permanently zero. The wave is oscillating around it, but the point itself never moves. For a string fixed at both ends in its nth mode, there are n + 1 nodes total: the two fixed ends, plus (n − 1) evenly spaced inside.\n\nFor a surface like a Chladni plate, nodes form curves, not points. Sand sprinkled on the plate migrates to these nodal lines and settles there, because the plate isn't moving beneath it. Physically, nodes are where two counter-propagating travelling waves always cancel exactly.",
    relatedPhysicists: ["ernst-chladni"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" }],
  },
  {
    slug: "antinode",
    term: "Antinode",
    category: "concept",
    shortDefinition: "A point on a standing wave where the oscillation reaches its full peak amplitude.",
    description: "An antinode is the opposite of a node: a point where a standing wave swings through its full peak amplitude every cycle. On a string in its nth mode, antinodes lie halfway between adjacent nodes, so there are exactly n of them.\n\nAntinodes are where the energy is — the medium is doing its most violent work there. If you want to excite a particular mode most efficiently, drive the system at one of its antinodes. If you want to kill a mode, clamp it at an antinode. This is how a guitarist plays artificial harmonics: lightly touching the string at a node forbids modes that don't have a node there, leaving only the higher harmonics to ring out.",
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" }],
  },
  {
    slug: "harmonic-series",
    term: "Harmonic series",
    category: "concept",
    shortDefinition: "The ladder of integer-multiple frequencies that a bounded system supports above its fundamental.",
    description: "When a string or an open pipe resonates, it doesn't pick one frequency — it picks a set. The lowest is the fundamental, f₁. Above it sit integer multiples: 2·f₁, 3·f₁, 4·f₁ and so on. That sequence is the harmonic series. Which harmonics a given system emphasises is what makes a violin sound different from a flute, even on the same note — that mix is called timbre.\n\nNot every resonator has a full harmonic series. A pipe closed at one end and open at the other supports only odd harmonics: f₁, 3·f₁, 5·f₁, … This is why a clarinet (closed–open) and a flute (open–open) of similar length sound an octave apart and have distinctly different tonal palettes.",
    history: "Pythagoras, around 500 BCE, discovered that consonant musical intervals correspond to simple integer ratios of string length — the first empirical hint of the series. The full physical derivation had to wait until the vibrating-string analyses of Taylor (1713), Bernoulli (1750s) and d'Alembert (1746).",
    relatedPhysicists: ["pythagoras", "hermann-von-helmholtz"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" }],
  },
  {
    slug: "fourier-series",
    term: "Fourier series",
    category: "concept",
    shortDefinition: "The decomposition of an arbitrary periodic function into a sum of sines and cosines.",
    description: "A Fourier series writes a function f(x) on an interval [0, L] as an infinite sum of sinusoids. For a function that vanishes at both endpoints, the expansion is f(x) = Σ bₙ sin(n π x / L), where the coefficients bₙ are integrals of f against each mode. Any reasonable shape — including ones with corners and sudden jumps — can be reconstructed this way.\n\nFourier series are the way physicists reach linearity. In a system where modes oscillate independently, writing a complicated initial shape as a sum of modes converts a hard PDE into a batch of easy ODEs, one per mode. This trick runs through the whole of wave physics, diffusion, quantum mechanics, optics, and signal processing. Its discrete cousin, the Fast Fourier Transform, is one of the most-executed algorithms in the world.",
    history: "Joseph Fourier introduced the technique in his 1807 manuscript on heat flow and defended it at book length in 1822. Lagrange initially blocked its publication, arguing that discontinuous functions couldn't equal sums of continuous ones. The full rigorous theory took Dirichlet, Riemann, Lebesgue and most of the 19th century to establish.",
    relatedPhysicists: ["joseph-fourier"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" }],
  },
  {
    slug: "doppler-effect",
    term: "Doppler effect",
    category: "phenomenon",
    shortDefinition: "The shift in observed frequency when a wave source and observer move relative to each other.",
    description: "When a source of waves moves relative to its medium, the wavefronts emitted ahead of it bunch up and those behind it stretch apart. An observer in front of the source intercepts wavefronts more often than they are emitted — a higher frequency. An observer behind the source intercepts them less often — a lower frequency.\n\nThe effect applies to every kind of wave: sound, light, water, seismic. For sound, the formula is asymmetric in the source and observer velocities because the medium fixes a preferred frame. For light in vacuum, no preferred frame exists, and the shift depends only on the relative velocity.",
    history: "Predicted by Christian Doppler in 1842 and experimentally confirmed by Christophe Buys Ballot in 1845 using trumpet players on a moving railway flatcar.",
    relatedPhysicists: ["christian-doppler", "christophe-buys-ballot"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" }],
  },
  {
    slug: "redshift",
    term: "Redshift",
    category: "phenomenon",
    shortDefinition: "The stretching of a wave's wavelength when source and observer move apart.",
    description: "When a light source recedes from the observer, the observed wavelength is longer than the emitted wavelength. For visible light, that shift moves spectral lines toward the red end of the spectrum — hence the name.\n\nRedshift is quantified by the dimensionless z = (λ_obs − λ_src) / λ_src. For small recession velocities, z ≈ v/c. Most galaxies in the universe are redshifted; the amount of redshift correlates with distance, which is the basis of Hubble's law and the evidence for cosmic expansion.",
    history: "First measured for a galaxy (Andromeda, which is actually blueshifted) by Vesto Slipher in 1912. The pattern of galactic redshifts — nearly all positive — became the foundation of observational cosmology.",
    relatedPhysicists: ["christian-doppler", "vesto-slipher"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" }],
  },
  {
    slug: "blueshift",
    term: "Blueshift",
    category: "phenomenon",
    shortDefinition: "The compression of a wave's wavelength when source and observer move together.",
    description: "The mirror image of redshift. When a light source approaches the observer, the observed wavelength is shorter than the emitted wavelength. Spectral lines shift toward the blue end of the spectrum.\n\nIn astronomy, blueshift is rare: the Andromeda galaxy is one of the few that is approaching us, at about 300 km/s. Most of the universe is redshifted. Within our own galaxy, stars orbiting the Milky Way's core show blueshifts and redshifts depending on which side of their orbit they are on.",
    relatedPhysicists: ["christian-doppler", "vesto-slipher"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" }],
  },
  {
    slug: "sonic-boom",
    term: "Sonic boom",
    category: "phenomenon",
    shortDefinition: "The sharp pressure impulse heard when the Mach cone of a supersonic source sweeps past an observer.",
    description: "When a source moves faster than the speed of sound in its medium, the pressure wavefronts it emits cannot run ahead of it. They pile up on a cone trailing behind the source, called the Mach cone. The air along the surface of this cone is at higher pressure than the surroundings.\n\nWhen the cone sweeps past an observer on the ground, they experience a sudden jump in pressure followed by a sudden drop — the characteristic double-crack of a sonic boom. The boom is not emitted only at the moment a vehicle crosses the sound barrier; it is emitted continuously for as long as the vehicle stays supersonic.",
    history: "The geometry was worked out and photographed by Ernst Mach in 1887. Supersonic flight in aircraft was first achieved by Chuck Yeager in the Bell X-1 on 14 October 1947.",
    relatedPhysicists: ["ernst-mach"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" }],
  },
  {
    slug: "mach-number",
    term: "Mach number",
    category: "concept",
    shortDefinition: "The ratio of a source's speed to the speed of sound in the surrounding medium.",
    description: "The Mach number M = v / c_sound is the dimensionless speed of an object relative to the speed of sound in its medium. M < 1 is subsonic. M = 1 is exactly the speed of sound — the 'sound barrier.' M > 1 is supersonic. M > 5 is usually called hypersonic.\n\nThe Mach cone trailing a supersonic object has a half-angle θ given by sin θ = 1/M. At Mach 2 the half-angle is 30°. At Mach 10 it is about 5.7°. The faster the object, the narrower the cone.",
    history: "Named for Ernst Mach, who first photographed supersonic shock waves in 1887 and worked out the cone geometry.",
    relatedPhysicists: ["ernst-mach"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" }],
  },
  {
    slug: "dispersion",
    term: "Dispersion",
    category: "phenomenon",
    shortDefinition: "The dependence of wave speed on wavelength or frequency — the reason a pulse spreads and a prism makes a rainbow.",
    description: "A medium is called dispersive when its wave speed depends on the wavelength (or equivalently, on the wavenumber k). Formally: whenever ω(k) is not a straight line through the origin, the medium disperses. Vacuum, to high precision, does not. Glass, water, plasma, optical fibre, and the ocean all do.\n\nThe practical consequence is that any real pulse — which is always a superposition of many frequencies — cannot keep its shape. The red part arrives at a different time from the blue part, and the envelope broadens. The broadening rate is set by the second derivative d²ω/dk², called the group velocity dispersion parameter β. Fibre engineers compensate β by cascading segments of opposite-sign dispersion so that the accumulated smear cancels over a link.",
    history: "Newton showed in 1666 that glass disperses white light into a spectrum. The word 'dispersion' itself, in its modern wave-physics sense, came into general use in the nineteenth century with the work of Fresnel, Cauchy, and Rayleigh.",
    relatedPhysicists: ["isaac-newton", "john-william-strutt-rayleigh"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" }],
  },
  {
    slug: "group-velocity",
    term: "Group velocity",
    category: "concept",
    shortDefinition: "The speed v_g = dω/dk at which a wave packet's envelope — and therefore its energy and information — propagates.",
    description: "The group velocity is the derivative of the dispersion relation ω(k) evaluated at the carrier wavenumber: v_g = dω/dk. It is the speed at which the envelope of a narrow-band wave packet moves, and therefore the speed at which any physical signal carried by the wave actually travels.\n\nFor causal signals, v_g is bounded by the speed of light. In a non-dispersive medium, v_g = v_p. In a normally dispersive medium (shorter wavelengths slower) v_g < v_p. In deep-water gravity waves v_g = v_p/2 — the crests within an ocean-swell packet appear at the trailing edge and vanish at the leading edge. For a free Schrödinger particle v_g = 2 v_p.",
    history: "First written down by William Rowan Hamilton in 1839, generalised by Rayleigh in 1877. Stokes had observed the v_g = v_p/2 behaviour of water waves in 1847.",
    relatedPhysicists: ["william-rowan-hamilton", "john-william-strutt-rayleigh"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" }],
  },
  {
    slug: "wave-packet",
    term: "Wave packet",
    category: "concept",
    shortDefinition: "A localised wave formed by superposing many plane-wave components with a narrow band of wavenumbers.",
    description: "A wave packet is a finite-in-extent disturbance built by adding together plane waves whose wavenumbers cluster around a central value k₀. The packet has two characteristic speeds: the phase velocity of its carrier (v_p = ω₀/k₀) and the group velocity of its envelope (v_g = dω/dk at k₀). The narrower the spread in k, the longer the packet is in space — the Fourier uncertainty that sits at the heart of quantum mechanics.\n\nUnder a non-linear dispersion relation, the packet broadens as it propagates because different Fourier components travel at slightly different group velocities. The broadening is governed by the curvature β = d²ω/dk², and for a Gaussian packet σ(t) = σ₀·√(1 + (βt/σ₀²)²).",
    relatedPhysicists: ["william-rowan-hamilton"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" }],
  },
  {
    slug: "refractive-index",
    term: "Refractive index",
    category: "concept",
    shortDefinition: "The ratio n = c/v_p of the vacuum speed of light to the phase velocity in the medium.",
    description: "The refractive index of a medium is defined as n = c/v_p, where v_p is the phase velocity of light of a given wavelength in the medium. By Snell's law (sin θ₁ / sin θ₂ = n₂/n₁), it also determines the angle at which light bends at an interface.\n\nCommon values: vacuum 1, air ~1.0003, water ~1.333, crown glass ~1.52, diamond ~2.42. The index always depends on wavelength — it is slightly larger for violet than for red — and that variation is what makes a prism split white light and a raindrop produce a rainbow. The empirical Cauchy formula n(λ) ≈ A + B/λ² captures the dependence for transparent materials across the visible band.",
    history: "Snell's law, governing how light bends according to the ratio of indices, was formulated by Willebrord Snellius around 1621 and published by Descartes in 1637. Cauchy gave his empirical n(λ) fit in 1836.",
    relatedPhysicists: ["rene-descartes", "isaac-newton"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" }],
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
