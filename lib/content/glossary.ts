import type { GlossaryCategory, GlossaryTerm } from "./types";

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    slug: "pendulum-clock",
    term: "pendulum clock",
    category: "instrument",
    shortDefinition:
      "Mechanical clock regulated by a swinging pendulum; first accurate timekeeper, built by Huygens in 1656.",
    description:
      "A pendulum clock uses the steady swing of a weighted rod as its timing element. Because a small-angle pendulum's period depends only on its length and the local gravity, it can be tuned once and then run for years with very little drift.\n\nFor nearly three hundred years — from the mid-seventeenth century until the arrival of quartz oscillators in the 1930s — the pendulum clock was the most accurate timekeeper in the world. A good one loses less than a second a day.",
    history:
      "Christiaan Huygens designed and built the first working pendulum clock in 1656, directly inspired by Galileo's 1583 discovery that a pendulum's period is independent of its amplitude. The new clocks were accurate enough to synchronize scientific experiments across continents and to make the longitude problem tractable on land.",
    illustration: "/images/dictionary/pendulum-clock.svg",
    relatedPhysicists: ["christiaan-huygens", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "telescope",
    term: "telescope",
    category: "instrument",
    shortDefinition:
      "Optical instrument that makes distant objects appear closer; Galileo's 1609 version revealed the Moon's craters and Jupiter's moons.",
    description:
      "A refracting telescope uses a large front lens to gather light and a smaller eyepiece to magnify the image. The first versions were essentially long cardboard tubes with two lenses in them.\n\nThe telescope did not just extend the eye. It rewrote astronomy. Within a year of Galileo pointing one at the sky, the Moon had craters, Jupiter had moons, Venus had phases, and the Milky Way was a crowd of stars. None of those things fit the ancient picture of a perfect, unchanging heavens.",
    history:
      "Dutch spectacle makers built the first telescopes around 1608. Galileo heard about the device in 1609, built a better one within months, and pointed it at the night sky — the first person to do systematic astronomy with optics.",
    illustration: "/images/dictionary/telescope.svg",
    relatedPhysicists: ["galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "quadrant",
    term: "quadrant",
    category: "instrument",
    shortDefinition:
      "Pre-telescope astronomical instrument for measuring the angular position of stars and planets.",
    description:
      "A quadrant is, in its simplest form, a quarter-circle of wood or metal marked with degrees. You sight a star along one edge and read its altitude above the horizon from a plumb line or a pointer. Larger, wall-mounted versions — mural quadrants — could be several metres across and fixed to a stone wall aligned with the meridian.\n\nBefore the telescope, the quadrant was how astronomers turned the night sky into numbers. The bigger the instrument, the finer the angles it could resolve.",
    history:
      "Tycho Brahe's mural quadrant at Uraniborg, built in the 1580s, had a radius of about two metres and reached an accuracy of roughly one arcminute — close to the theoretical limit of the naked eye. It is the instrument that produced the Mars data Kepler later used to derive his laws of planetary motion.",
    illustration: "/images/dictionary/quadrant.svg",
    relatedPhysicists: ["tycho-brahe", "johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "astrolabe",
    term: "astrolabe",
    category: "instrument",
    shortDefinition:
      "Ancient inclinometer and analog computer for astronomical calculations, used for position, time, and star identification.",
    description:
      "An astrolabe is a flat brass disc engraved with a stereographic projection of the celestial sphere, overlaid with a rotating star map. By aligning the instrument with a particular star or the Sun, a user could read off the local time, the altitude of celestial bodies, and their own approximate latitude.\n\nIt was part sighting instrument, part slide rule, part pocket planetarium — and for nearly a thousand years it was the most sophisticated scientific instrument in existence.",
    history:
      "The astrolabe descends from Hellenistic Greek designs and was perfected by Islamic astronomers between roughly the 8th and 13th centuries. Medieval European astronomers inherited it through translations from Arabic, and it remained in widespread use until the sextant displaced it at sea in the eighteenth century.",
    illustration: "/images/dictionary/astrolabe.svg",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "isochronism",
    term: "isochronism",
    category: "concept",
    shortDefinition:
      "Property of oscillating with a constant period regardless of amplitude; Galileo's 1583 discovery.",
    description:
      "Isochronism says that the time it takes an oscillator to complete one full cycle does not depend on how big the swing is. Small swings and large swings take the same amount of time.\n\nFor a pendulum this is only exactly true in the small-angle limit, where sin θ can be replaced by θ. Push the amplitude past about fifteen degrees and the period starts to stretch measurably. But in the small-angle regime, the effect is invisible to the naked eye — which is exactly why Galileo noticed it from a chandelier in a cathedral.",
    history:
      "Galileo observed isochronism in 1583 while watching a bronze chandelier sway in Pisa cathedral. He timed its swings against his pulse and found them constant regardless of amplitude. The discovery led, within a generation, to the pendulum clock.",
    visualization: "isochronism",
    relatedPhysicists: ["galileo-galilei", "christiaan-huygens"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "restoring-force",
    term: "restoring force",
    category: "concept",
    shortDefinition:
      "Force proportional to displacement and directed back toward equilibrium: F = −kx.",
    description:
      "A restoring force is any force that tries to push a system back to its resting state, and whose strength grows with how far the system has been displaced. The simplest form is F = −kx, where x is the displacement and k is a stiffness constant. The minus sign is the whole point: the force always points back toward zero.\n\nThis is the mathematical seed of every oscillator in physics. Pendulums, springs, plucked strings, vibrating atoms in a crystal, LC circuits, the modes of a quantum field — all of them share the same equation, with only the constants changing.",
    visualization: "restoring-force",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "phase-portrait",
    term: "phase portrait",
    category: "concept",
    shortDefinition:
      "Plot of position versus velocity showing the trajectory of a dynamical system.",
    description:
      "A phase portrait is a picture of a system's state. The horizontal axis is position, the vertical axis is velocity, and every point in the plane corresponds to one possible state of the system. As time passes, the state traces out a curve.\n\nFor an undamped oscillator — an ideal pendulum, or a mass on a frictionless spring — the curve is closed: an ellipse or a circle, depending on the units. The system keeps retracing the same orbit forever, because energy is trading back and forth between position and motion without ever leaking away.",
    visualization: "phase-portrait",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "simple-harmonic-oscillator",
    term: "simple harmonic oscillator",
    category: "concept",
    shortDefinition:
      "System with a linear restoring force F = −kx; its solution is a pure sinusoid.",
    description:
      "A simple harmonic oscillator is any system whose equation of motion reduces to a mass times acceleration equal to minus a constant times displacement. The solution is a sine wave: position oscillates smoothly back and forth at a single frequency that depends only on the mass and the stiffness.\n\nThe simple harmonic oscillator is arguably the most important model in physics. Pendulums at small angles are SHOs. Springs are SHOs. LC circuits are SHOs. Atoms in a crystal lattice vibrate as SHOs. Every mode of every quantum field is an SHO. Whenever a stable equilibrium is gently disturbed, the first approximation is always a simple harmonic oscillator.",
    visualization: "shm-oscillator",
    relatedPhysicists: ["galileo-galilei", "christiaan-huygens", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "epicycle",
    term: "epicycle",
    category: "concept",
    shortDefinition:
      "Small circle whose center moves along a larger one; Ptolemy's device for saving uniform circular motion.",
    description:
      "An epicycle is a small circle whose center rides around the circumference of a larger circle, called the deferent. A planet placed on the epicycle traces out a looping path in the sky — sometimes moving forward, sometimes apparently backward — as seen from a central Earth.\n\nPtolemy used nested epicycles to reproduce the observed motions of the planets while preserving the ancient assumption that all celestial motion is built from uniform circles. The model was mathematically elaborate but predictively decent, and it dominated astronomy for more than a thousand years. Kepler finally discarded it when he showed that planetary orbits are ellipses.",
    history:
      "The epicycle scheme was systematized by Ptolemy in the Almagest in the second century and remained the standard model of the heavens until Kepler's first law in 1609. Copernicus's 1543 heliocentric system still used epicycles — just fewer of them.",
    visualization: "epicycle",
    relatedPhysicists: ["claudius-ptolemy", "nicolaus-copernicus", "johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "ellipse",
    term: "ellipse",
    category: "concept",
    shortDefinition:
      "Closed curve where the sum of distances from any point to two foci is constant.",
    description:
      "An ellipse is a stretched circle. The defining property: pick any point on the curve, draw a line from it to each of two interior points called the foci, and the two lengths will always add to the same number. A circle is the special case where the two foci coincide.\n\nKepler's first law says that every planet moves on an ellipse with the sun at one focus. The shape is characterized by two numbers — the semi-major axis, which sets the size, and the eccentricity, which sets how squished the shape is.",
    visualization: "ellipse-construction",
    relatedPhysicists: ["johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "focus",
    term: "focus",
    category: "concept",
    shortDefinition:
      "One of two interior points that define an ellipse; the central body sits at one focus in a Keplerian orbit.",
    description:
      "An ellipse has two foci, sitting on its long axis on either side of the center. They are the two points used in the defining property of the ellipse: the sum of distances from any point on the curve to the two foci is constant.\n\nIn a Keplerian orbit, one of the foci is occupied by the central body — the sun, or whatever massive object the orbit bends around. The other focus is empty. A circular orbit is the degenerate case where both foci coincide at the center.",
    relatedPhysicists: ["johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "eccentricity",
    term: "eccentricity",
    category: "concept",
    shortDefinition:
      "Dimensionless number between 0 and 1 describing how squished an ellipse is.",
    description:
      "Eccentricity is a single number, written e, that captures the shape of an ellipse. At e = 0 the ellipse is a perfect circle. As e grows toward 1 the ellipse stretches, becoming longer and thinner. At e = 1 it degenerates into a parabola; beyond that, the curve opens up into a hyperbola.\n\nEarth's orbit has an eccentricity of about 0.017 — almost circular. Mercury, the most eccentric of the classical planets, has an eccentricity of about 0.21. Many comets have eccentricities close to 1, on long elongated paths that swing in past the sun and back out to the outer solar system.",
    visualization: "eccentricity-slider",
    relatedPhysicists: ["johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "semi-major-axis",
    term: "semi-major axis",
    category: "concept",
    shortDefinition:
      "Half the longest diameter of an ellipse; appears in Kepler's third law as T² ∝ a³.",
    description:
      "The semi-major axis is half the length of the longest chord of an ellipse. It is the natural measure of the orbit's size — a kind of average distance between the orbiting body and the central focus.\n\nKepler's third law relates the semi-major axis a to the orbital period T by T² ∝ a³. For bodies orbiting the same central mass, the ratio T² / a³ is a constant. Newton's law of gravity explains why: the constant is 4π² / GM, where M is the mass at the focus.",
    relatedPhysicists: ["johannes-kepler", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "inverse-square-law",
    term: "inverse-square law",
    category: "concept",
    shortDefinition:
      "Force or intensity that falls as 1/r² with distance; the form of Newton's gravity and Coulomb's law.",
    description:
      "An inverse-square law is any relationship in which a quantity decreases with the square of the distance from its source. Double the distance, one-quarter the strength. Triple it, one-ninth. The form shows up whenever something — force, light, sound — spreads out uniformly from a point over the surface of a sphere, because the area of that sphere grows as r².\n\nNewton's law of universal gravitation and Coulomb's law of electrostatics are both inverse-square laws. It is specifically the inverse-square form of gravity that makes Kepler's laws geometrically exact: any other power would give open, non-closing orbits.",
    visualization: "inverse-square",
    relatedPhysicists: ["isaac-newton", "johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
];

export function getTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug);
}

export function getAllTerms(): readonly GlossaryTerm[] {
  return GLOSSARY;
}

export function getTermsByCategory(
  category: GlossaryCategory,
): readonly GlossaryTerm[] {
  return GLOSSARY.filter((t) => t.category === category);
}
