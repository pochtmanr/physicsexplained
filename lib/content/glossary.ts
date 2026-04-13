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
  {
    slug: "tautochrone",
    term: "tautochrone",
    category: "concept",
    shortDefinition:
      "Curve where descent time is independent of starting point; the cycloid.",
    description:
      "The tautochrone problem asks: is there a curve along which a frictionless bead, released from any height, always reaches the bottom in exactly the same time? The answer is the cycloid — the curve traced by a point on the rim of a rolling wheel.\n\nThe result is counterintuitive. A bead released near the top of a cycloid has farther to travel, but the steepness of the upper portion accelerates it so sharply that it arrives at the bottom at precisely the same instant as a bead released from a point barely above it. The two effects — longer path and greater acceleration — cancel exactly, for any starting point.\n\nHuygens recognised the practical value immediately. An ordinary pendulum is only approximately isochronous; its period stretches as the amplitude grows. But if the bob is constrained to swing along a cycloidal arc — by wrapping the string around cycloidal cheeks at the pivot — the oscillation becomes perfectly isochronous at every amplitude. He built clocks on this principle and published the proof in Horologium Oscillatorium.",
    history:
      "Christiaan Huygens proved in Horologium Oscillatorium (1673) that the cycloid is the tautochrone curve. The proof was a landmark in the early calculus of curves and led directly to the theory of evolutes.",
    visualization: "cycloid",
    relatedPhysicists: ["christiaan-huygens"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "cycloid",
    term: "cycloid",
    category: "concept",
    shortDefinition:
      "Curve traced by a point on a rolling circle; solves both tautochrone and brachistochrone.",
    description:
      "A cycloid is the path traced by a point on the rim of a circle as it rolls along a straight line without slipping. In parametric form, x = r(t − sin t) and y = r(1 − cos t), where r is the radius of the rolling circle and t is the angle through which it has turned.\n\nThe cycloid has two remarkable physical properties. First, it is the tautochrone: a frictionless bead sliding down a cycloidal track reaches the bottom in the same time regardless of where it starts. Second, it is the brachistochrone: of all smooth curves connecting two points at different heights, the cycloid is the one along which a bead under gravity descends in the least time. Johann Bernoulli posed the brachistochrone challenge in 1696; Newton, Leibniz, l'Hôpital, and Jakob Bernoulli all solved it.\n\nThese properties made the cycloid central to seventeenth- and eighteenth-century mathematics and directly influenced the development of the calculus of variations.",
    relatedPhysicists: ["christiaan-huygens"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "elliptic-integral",
    term: "elliptic integral",
    category: "concept",
    shortDefinition:
      "Integral involving square root of cubic/quartic polynomial; gives the exact period of a large-angle pendulum.",
    description:
      "An elliptic integral is an integral of the form ∫R(t, √P(t)) dt, where P(t) is a polynomial of degree three or four and R is a rational function. These integrals cannot, in general, be evaluated in terms of elementary functions — they define genuinely new transcendental quantities.\n\nThe complete elliptic integral of the first kind, K(k), appears whenever you write down the exact period of a pendulum swinging through a finite angle. The standard result is T = 4√(l/g) · K(sin(θ₀/2)), where θ₀ is the maximum angle. For small angles K reduces to π/2, recovering the familiar T = 2π√(l/g). For large angles K grows without bound as θ₀ approaches π, meaning the period stretches toward infinity as the pendulum nears the top.\n\nK(k) can be computed efficiently using the arithmetic-geometric mean (AGM): iterate aₙ₊₁ = (aₙ + bₙ)/2 and bₙ₊₁ = √(aₙbₙ) starting from a₀ = 1, b₀ = √(1 − k²). The sequences converge quadratically to a common limit M, and K(k) = π/(2M). This makes numerical evaluation fast and precise.",
    relatedPhysicists: ["adrien-marie-legendre"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "separatrix",
    term: "separatrix",
    category: "concept",
    shortDefinition:
      "Phase-space boundary between qualitatively different motions.",
    description:
      "A separatrix is a curve in phase space that divides regions of qualitatively different behaviour. Cross it, and the system does something fundamentally different — not just more or less of the same thing.\n\nFor a simple pendulum, the separatrix is the figure-eight curve in the (θ, ω) phase plane that passes through the unstable equilibrium at θ = ±π. Inside the loops, the pendulum oscillates back and forth — this is libration. Outside the loops, the pendulum has enough energy to swing over the top and keep rotating in one direction. On the separatrix itself, the pendulum takes infinite time to asymptotically approach the vertical, never quite reaching it.\n\nThe energy on the separatrix equals exactly mgl — the potential energy at the top. Any trajectory with less energy is trapped inside; any trajectory with more escapes into rotation. The separatrix is the watershed between two fundamentally different kinds of motion.",
    visualization: "separatrix",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "libration",
    term: "libration",
    category: "concept",
    shortDefinition:
      "Bounded oscillation within a potential well, as opposed to full rotation.",
    description:
      "Libration is the back-and-forth oscillation of a system that remains trapped within a potential well, never accumulating enough energy to escape over the barrier. The pendulum swinging left and right without going over the top is librating.\n\nThe term comes from the Latin libra, a balance — the same root as the zodiac sign. In celestial mechanics it describes the apparent rocking of the Moon that lets us see slightly more than half its surface over time. In the phase portrait of a pendulum, libration orbits are the closed loops inside the separatrix: the system rocks back and forth, periodically reversing direction.\n\nLibration contrasts with rotation, where the system has enough energy to pass over the potential barrier and keep going in the same angular direction indefinitely. The boundary between the two regimes is the separatrix.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "nonlinear-dynamics",
    term: "nonlinear dynamics",
    category: "concept",
    shortDefinition:
      "Study of systems where output is not proportional to input; chaos, solitons, turbulence.",
    description:
      "A system is nonlinear when its response is not proportional to its input. Double the push, and you do not get double the result — you might get three times as much, or half, or something qualitatively different. Most of physics is nonlinear. The linear systems that fill introductory textbooks are approximations, valid near equilibrium and nowhere else.\n\nThe simple pendulum is the gentlest entry point into nonlinear dynamics. At small angles the restoring force is proportional to displacement, and the motion is a pure sinusoid. But push harder and the sin θ in the equation of motion can no longer be replaced by θ. The period starts to depend on amplitude. The phase portrait develops a separatrix. Push harder still and the pendulum rotates rather than oscillates — a qualitative change that no linear model can produce.\n\nNonlinear dynamics encompasses chaos (sensitive dependence on initial conditions), solitons (stable wave packets), bifurcations (sudden qualitative changes in behaviour), and turbulence (the unsolved problem). The pendulum, being exactly solvable, is where most physicists meet nonlinearity for the first time.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "potential-well",
    term: "potential well",
    category: "concept",
    shortDefinition:
      "Region of potential energy that traps a system; shape determines oscillation character.",
    description:
      "A potential well is a dip in the potential energy landscape where a system can be trapped. Think of a marble in a bowl: it rolls back and forth, always returning to the bottom. The shape of the bowl determines the character of the oscillation.\n\nFor a pendulum, the potential energy is U(θ) = mgl(1 − cos θ). Near the bottom this looks like a parabola — U ≈ ½mglθ² — and the motion is simple harmonic. But farther out the well flattens and the walls eventually curve over into the next period of the cosine. The departures from the parabolic approximation are what make the large-angle pendulum nonlinear.\n\nEvery stable equilibrium in physics sits at the bottom of a potential well. The quadratic approximation near the minimum always gives simple harmonic motion. The interesting physics — anharmonicity, amplitude-dependent frequency, chaos — comes from the higher-order terms in the shape of the well.",
    visualization: "energy-diagram",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "damping",
    term: "damping",
    category: "concept",
    shortDefinition:
      "Energy dissipation causing oscillation amplitude to decay exponentially.",
    description:
      "Damping is the process by which an oscillating system loses energy to its environment, causing the amplitude of oscillation to decrease over time. In the simplest model, the damping force is proportional to velocity: F = −γv, where γ is the damping coefficient. The amplitude then decays exponentially as e^(−γt/2m).\n\nThree regimes emerge depending on the ratio of damping to stiffness. In the underdamped case, the system oscillates with gradually shrinking amplitude — a struck tuning fork, a plucked guitar string, a pendulum in air. In the critically damped case, the system returns to equilibrium as fast as possible without oscillating — this is what door closers and car shock absorbers aim for. In the overdamped case, the system creeps back to rest sluggishly, without any oscillation at all — like a pendulum immersed in honey.\n\nNo real oscillator is perfectly undamped. Air resistance, friction at the pivot, internal flexing of the material — something always drains energy. The question is only how fast.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "q-factor",
    term: "quality factor",
    category: "concept",
    shortDefinition:
      "Quality factor Q = ω₀/γ; number of oscillations before energy drops to 1/e.",
    description:
      "The quality factor Q of an oscillator is a dimensionless number that measures how slowly it loses energy relative to how fast it oscillates. Formally, Q = ω₀/γ, where ω₀ is the natural angular frequency and γ is the damping rate. Equivalently, Q is roughly the number of oscillations the system completes before its energy falls to 1/e (about 37%) of its initial value.\n\nA high Q means the oscillator rings for a long time. A tuning fork has Q around 1,000 — it sustains a clear tone for many seconds. A quartz crystal oscillator in a wristwatch has Q around 10⁵, which is why it keeps such good time. Atomic clocks reach Q values of 10¹⁰ or more. A low Q means rapid energy loss: a pendulum swinging in water might have Q of 5 or 10.\n\nQ also controls the sharpness of resonance. A high-Q oscillator responds intensely but only within a very narrow band of driving frequencies. A low-Q oscillator responds more broadly but less dramatically. This tradeoff between selectivity and bandwidth runs through all of oscillator physics, from radio receivers to laser cavities.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "resonance",
    term: "resonance",
    category: "phenomenon",
    shortDefinition:
      "Amplitude peak when driving frequency matches natural frequency.",
    description:
      "Resonance occurs when a periodic driving force is applied to an oscillator at or near its natural frequency. The system absorbs energy efficiently, and the amplitude builds up to a peak limited only by damping. At exact resonance, the driving force is always in phase with the velocity, so every push adds energy.\n\nThe phenomenon is everywhere. A child on a swing learns resonance intuitively — push at the right moment and the arc grows. A wine glass shatters when a singer hits its natural frequency. The Tacoma Narrows Bridge collapsed in 1940 when wind vortices drove it at a resonant mode. MRI scanners use resonance to flip nuclear spins at precisely the right radio frequency.\n\nMathematically, the steady-state amplitude of a driven, damped oscillator is A(ω) = F₀/m / √((ω₀² − ω²)² + γ²ω²). The peak occurs near ω = ω₀ and its height is proportional to Q. Sharper peak, narrower bandwidth, more selective response — the same tradeoff that defines Q.",
    visualization: "resonance-curve",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "normal-modes",
    term: "normal modes",
    category: "concept",
    shortDefinition:
      "Independent oscillation patterns of a coupled system; any motion is their superposition.",
    description:
      "Normal modes are the independent oscillation patterns of a system with more than one degree of freedom. In each normal mode, every part of the system oscillates at the same frequency and passes through equilibrium at the same time. Any motion of the system, no matter how complicated, can be written as a sum of its normal modes.\n\nThe simplest example is two identical pendulums connected by a spring. The system has two normal modes. In one, both pendulums swing together in the same direction at the same frequency — the spring never stretches. In the other, they swing in opposite directions, stretching and compressing the spring, at a higher frequency. If you start one pendulum swinging and hold the other still, the energy sloshes back and forth between them — a phenomenon called beating — because you have excited both normal modes simultaneously and they drift in and out of phase.\n\nNormal-mode analysis extends to any number of coupled oscillators: molecules, crystal lattices, vibrating strings, drumheads. It is the bridge between the physics of one oscillator and the physics of waves.",
    visualization: "coupled-pendulum",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "beats",
    term: "beats",
    category: "phenomenon",
    shortDefinition:
      "Amplitude modulation from superposition of two close frequencies; f_beat = |f₁ − f₂|.",
    description:
      "Beats are the slow, periodic rise and fall of amplitude that occurs when two oscillations of nearly equal frequency are superimposed. If two signals have frequencies f₁ and f₂, their sum oscillates at the average frequency (f₁ + f₂)/2 with an envelope that pulses at the beat frequency |f₁ − f₂|.\n\nMusicians use beats constantly. When tuning a guitar string against a reference tone, you hear a pulsing wah-wah-wah that slows down as the two frequencies approach each other and vanishes when they match. Piano tuners listen for beats between strings that are supposed to sound the same note.\n\nIn coupled pendulums, beats appear as energy transfer. Start one pendulum swinging and the other still; the first gradually stops while the second picks up the motion, then the process reverses. The beat frequency is the difference between the two normal-mode frequencies of the coupled system. The phenomenon is the time-domain signature of two close spectral lines — the same mathematics appears in quantum mechanics, radio engineering, and acoustics.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
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
