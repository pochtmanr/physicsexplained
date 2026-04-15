import type { GlossaryCategory, GlossaryTerm } from "./types";
import { storageUrl } from "../supabase";

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    slug: "pendulum-clock",
    term: "pendulum clock",
    category: "instrument",
    shortDefinition:
      "Mechanical clock regulated by a swinging pendulum; first accurate timekeeper, built by Huygens in 1656.",
    description:
      "A pendulum clock uses the steady swing of a weighted rod as its timing element. The underlying physics is elegant: for small amplitudes, the period T = 2π√(l/g) depends only on the pendulum's length and the local gravitational acceleration. Neither the mass of the bob nor the size of the swing matters — a property called isochronism. This means you can tune a pendulum clock once by adjusting the rod length and it will keep time for years with very little drift.\n\nThe mechanism works through an escapement — a toothed wheel that advances by exactly one tooth per swing, converting the pendulum's continuous oscillation into discrete ticks. The escapement also delivers a small impulse to the pendulum on each cycle, replacing the energy lost to air resistance and friction at the pivot. A falling weight or a coiled spring provides the energy source. The genius of the design is that the escapement couples the timekeeping element (the pendulum) to the energy source without disturbing the pendulum's natural frequency.\n\nSeveral types emerged over the centuries. Longcase clocks (grandfather clocks) housed a seconds pendulum — about one metre long, with a two-second period — inside a tall wooden case. Regulators were high-precision observatory clocks with minimal ornamentation, temperature-compensated pendulums, and jewelled bearings, achieving accuracies of a few hundredths of a second per day. Wall regulators and Vienna regulators were lighter, simpler variants for domestic and commercial use. Marine chronometers, though often spring-driven, sometimes incorporated pendulum-like balances for land-based astronomical timekeeping.\n\nFor nearly three hundred years — from the mid-seventeenth century until the arrival of quartz oscillators in the 1930s — the pendulum clock was the most accurate timekeeper in the world. Its influence on science was immense: it made precise measurement of time routine, enabled the synchronisation of astronomical observations across continents, and turned the study of gravity into an exact science. Variations in g from place to place were first detected by the slight speeding up or slowing down of pendulum clocks transported between latitudes.",
    history:
      "Galileo first observed the isochronism of the pendulum in 1583, reportedly timing the swings of a chandelier in Pisa cathedral against his own pulse. He sketched designs for a pendulum-regulated clock late in life, but never built one. His son Vincenzo began construction in 1649 but died before finishing it.\n\nChristiaan Huygens, working independently, designed and built the first working pendulum clock in 1656, patented in 1657. His clocks were immediately ten to sixty times more accurate than any previous timekeeper, reducing daily errors from fifteen minutes to about fifteen seconds. Huygens also recognised the theoretical limitation: a circular pendulum is only approximately isochronous. In his masterwork Horologium Oscillatorium (1673), he proved that a cycloidal pendulum — one whose bob follows a cycloid rather than a circular arc — is perfectly isochronous at all amplitudes, and he built clocks with cycloidal cheeks at the pivot to enforce this path.\n\nThe eighteenth century brought refinements in temperature compensation. George Graham invented the mercury pendulum around 1721, in which the thermal expansion of a mercury column in the bob raised the centre of mass to counteract the lengthening of the rod. John Harrison, better known for his marine chronometers, devised the gridiron pendulum using alternating rods of brass and steel whose expansions cancelled. By the late nineteenth century, observatory regulators by Riefler and Shortt achieved errors below ten milliseconds per day — a precision that stood until electronic oscillators arrived.\n\nThe pendulum clock's decline began in the 1920s with quartz crystal oscillators and was sealed by the caesium atomic clock in 1955. But for three centuries, every advance in timekeeping, navigation, geodesy, and experimental physics depended on the swinging pendulum.",
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
      "Optical instrument that gathers light and magnifies distant objects; from Newton's 1668 reflector to the James Webb Space Telescope.",
    description:
      "A telescope is a light bucket. Its job is not really to magnify — magnification is cheap, you can stack eyepieces — but to *collect* photons and bring them to a sharp focus. Two numbers describe almost everything. The first is **aperture**, the diameter D of the primary lens or mirror. Light-gathering power scales with the area of the aperture, D². Resolving power — the smallest angle the instrument can distinguish — is set by diffraction: the Rayleigh limit gives θ ≈ 1.22 λ/D. Bigger aperture means more light *and* finer detail. The second is **focal length**, which together with the eyepiece sets the magnification. A large aperture with modest magnification reveals faint structure; a small aperture cranked to high power just shows you a bigger blur.\n\n## Newton's reflector — the canonical example\n\n[[image:0]]\n\nThe cleanest illustration of how a modern telescope works is the one Newton built in 1668. Frustrated by the rainbow fringing that plagued every refractor of his era — light of different colours bending by different amounts as it passed through a lens, an effect we now call *chromatic aberration* — he replaced the front lens entirely with a concave mirror at the back of the tube. A mirror reflects all wavelengths by the same angle, so the colour fringing simply disappears. Light enters the open top of the tube, travels its full length, strikes the parabolic primary mirror, and converges back upward. Just before reaching focus it hits a small flat secondary mirror set at 45°, which deflects the converging cone out through the side wall of the tube into the eyepiece. The whole instrument was barely 15 centimetres long with a 3.3-centimetre speculum-metal primary, yet it outperformed refractors five times its size.\n\nThis layout is now called a Newtonian reflector, and almost every serious telescope built since — from the home Dobsonian on a tripod to the 6.5-metre segmented giant of JWST — is a variation on the same idea: a curved primary mirror that does the optical work, and a smaller secondary that folds the light path to a usable focus. The modern amateur reflector is essentially Newton's design with a precision-figured glass mirror, an aluminised reflective coating, a computerised mount, and a CCD camera at the focus. Four centuries of materials science have not changed the optical principle.\n\n## Why mirrors won\n\nLenses and mirrors trade off in three ways. (1) Chromatic aberration is fundamental to refractors and absent from reflectors. Achromatic doublets (crown plus flint glass) cancel it at two wavelengths; apochromats add a third element to cancel it at three; nothing eliminates it entirely. (2) A lens must be supported only at the rim — light has to pass through it — so it sags under its own weight as it gets bigger. The largest refractor ever built, the Yerkes 40-inch (1897), is essentially the size limit. A mirror can be supported from behind across its full back surface, so it can be made much larger and lighter. (3) A lens absorbs light at every internal interface, especially in the ultraviolet and infrared. A coated mirror reflects efficiently across a much wider band. For all three reasons, every research telescope built since the early twentieth century is a reflector.\n\n## Variations on the Newtonian theme\n\n[[image:1]]\n\nFolding the light path differently gives different families. The **Cassegrain** uses a convex secondary that sends the converging cone back *through* a hole in the primary, producing a long effective focal length in a short tube — compact and ideal for spacecraft. The **Ritchey–Chrétien**, used in Hubble and most modern professionals, is a Cassegrain with hyperbolic mirrors that eliminate the off-axis blur called *coma*, giving sharp images across a wide field. The **Schmidt–Cassegrain** and **Maksutov–Cassegrain** add a thin corrector plate at the front to fix spherical aberration in a spherical (and therefore cheap to figure) primary; these are the workhorses of consumer astronomy, the kind of telescope that fits on a dining table and still resolves Saturn's rings and the cloud bands of Jupiter.\n\n## Space telescopes — why leave the planet\n\nFor four hundred years, the limit on optical astronomy was not the telescope but the air above it. Earth's atmosphere does three bad things to incoming light. It **scatters and absorbs** — most of the ultraviolet is gone before it reaches the ground, the infrared is chopped into narrow windows by water vapour, and X-rays don't make it at all. It **glows** at infrared wavelengths because warm air is itself a thermal radiator. And it **boils** — turbulent cells of varying refractive index continuously distort the wavefront of incoming light, smearing point sources into a fuzzy disc several arcseconds across. Even a perfect telescope on the ground can only match the sharpness of a small one in space, because the air sets the floor on what you can resolve. This atmospheric blurring is what astronomers call *seeing*, and it is the reason the great observatories sit on the highest, driest, most stable mountaintops on Earth — and the reason the very best instruments are now built to fly above it.\n\nGround-based observatories fight the atmosphere with **adaptive optics**: a deformable mirror, behind the primary, that flexes hundreds of times per second to undo the wavefront distortions measured by sensing a bright reference star (or, increasingly, a laser-induced artificial star projected high in the sodium layer of the upper atmosphere). It works astonishingly well — modern 8-metre instruments can match Hubble's resolution in the infrared. But it cannot recover what the air absorbs, and it cannot make the ground sky as dark as space.\n\n### Hubble Space Telescope (1990)\n\nHubble was the first true general-purpose space observatory: a 2.4-metre Ritchey–Chrétien reflector in low Earth orbit, sensitive from the near-ultraviolet through the visible to the near-infrared. Above the atmosphere, its diffraction-limited resolution is about 0.05 arcseconds — better than any ground-based optical telescope at the time of its launch. A famous flaw in the primary mirror's figure was repaired in 1993 by astronauts installing corrective optics (COSTAR), and Hubble has been refurbished four more times since by Space Shuttle servicing missions. The Hubble Deep Field and Ultra Deep Field — long exposures of seemingly empty patches of sky that turned out to contain thousands of galaxies — rewrote our picture of cosmic history.\n\n### James Webb Space Telescope (JWST, 2021)\n\n[[image:2]]\n\nJWST is a different kind of instrument. Where Hubble looks in visible light from low Earth orbit, JWST is built for the **infrared** and lives a million miles from home, at the second Sun–Earth Lagrange point (**L2**). The two design choices are connected.\n\n*Why infrared.* Distant galaxies are receding from us so fast that their light is stretched by cosmological redshift — what was emitted as ultraviolet or visible light arrives at Earth as infrared. To see the first galaxies, formed a few hundred million years after the Big Bang, you have to look in the infrared. Infrared also penetrates dust, which lets JWST peer inside star-forming regions and the disks where planets are being assembled. And infrared spectroscopy is how you read the chemical composition of an exoplanet's atmosphere as the planet transits in front of its star.\n\n*Why L2.* L2 is one of the five Lagrange points where the gravity of the Sun and Earth combine with orbital motion to produce a stable equilibrium. At L2, a spacecraft orbits the Sun in lockstep with Earth, always on the night side, in a region that is permanently shielded from solar radiation. JWST does not sit exactly at L2 — it follows a wide *halo orbit* around the point, kept on station by tiny periodic thruster firings — but the Sun, Earth, and Moon are always on the same side of it. That matters because of the next design choice.\n\n*The sunshield.* An infrared telescope cannot tolerate warmth. Anything above a few tens of kelvins is itself a bright infrared source, and would drown the telescope in its own thermal glow. JWST carries a five-layer **sunshield** the size of a tennis court (about 21 × 14 m). Each layer is a thin sheet of aluminised Kapton; together they reflect away the heat of the Sun, Earth, and Moon, dropping the temperature on the telescope side from roughly 85 °C on the sunward face to about −233 °C (40 K) on the cold side. The mid-infrared instrument MIRI sits inside its own additional cryocooler to reach 7 K. The sunshield is the reason JWST had to be folded for launch and unfurled in space — a sequence of more than 300 single-point failure mechanisms that all had to work, and did.\n\n*The mirror.* The 6.5-metre primary is too large to fit inside any rocket fairing, so it is built as **18 hexagonal segments** of beryllium, each polished to a few nanometres of figure error and coated with a thin layer of gold (gold reflects infrared more efficiently than aluminium). The segments unfolded after launch and were aligned by a months-long *wavefront sensing* process — measuring the diffraction pattern of bright stars and adjusting the position and tilt of each segment with seven actuators apiece, until all 18 acted as a single 6.5-metre mirror. Beryllium was chosen because it is light, stiff, and barely changes shape as it cools.\n\n*What it sees.* JWST has already confirmed galaxies at redshift z > 13 — light that left them only ~330 million years after the Big Bang. It has resolved the atmospheres of exoplanets hundreds of light-years away, detecting carbon dioxide, methane, and water vapour in their transit spectra. It is currently mapping star formation inside dust clouds that Hubble could not penetrate. Each of those results required all four of the design choices above to work: the orbit, the cooling, the segmented mirror, and the infrared instruments behind it.\n\n## Beyond visible and infrared\n\nThe word *telescope* now extends across the entire electromagnetic spectrum. Radio telescopes use parabolic dishes or arrays of dipole antennas, with apertures synthesised from continent-spanning interferometers (the Event Horizon Telescope is the entire Earth pretending to be one dish). X-ray telescopes use *grazing-incidence* nested mirrors because X-rays would punch straight through anything they hit at normal incidence — the reflection only works at angles below about a degree. Gamma-ray telescopes don't focus at all; they detect cascades of particles produced when high-energy photons hit the upper atmosphere or a dense target. Gravitational-wave detectors like LIGO are telescopes for ripples in spacetime itself, and use kilometre-scale laser interferometers in place of mirrors and lenses.\n\nThe telescope did not just extend the eye. It rewrote astronomy. Within a year of Galileo pointing one at the sky, the Moon had craters, Jupiter had moons, Venus had phases, and the Milky Way was a crowd of stars. None of that fit the ancient picture of a perfect, unchanging heavens. Four centuries later, the descendants of that cardboard tube look back far enough in time to see galaxies as they were when the universe was a few hundred million years old. The instrument is the same — gather more light, look further — only the engineering has changed.",
    history:
      "The first telescope patent was filed by Hans Lippershey, a Dutch spectacle maker, in October 1608. Within months the device was known across Europe. Galileo heard about it in mid-1609, built his own improved version — eventually reaching about 20× magnification — and turned it skyward. His observations, published in Sidereus Nuncius (1610), were incendiary: mountains on the Moon, four satellites orbiting Jupiter, countless stars invisible to the naked eye, and the phases of Venus. Each discovery struck at the foundations of Aristotelian–Ptolemaic astronomy.\n\nJohannes Kepler analysed the optics of Galileo's design in Dioptrice (1611) and proposed the Keplerian telescope with two convex lenses, which became the standard for astronomical work. Throughout the seventeenth century, telescopes grew longer to reduce chromatic aberration — some exceeding 30 metres — until Newton's 1668 reflector cut the Gordian knot by replacing the lens with a mirror. He built the prototype himself — casting the speculum-metal disc, grinding the curve, polishing the surface, fashioning the tube and the eyepiece — and demonstrated it to the Royal Society in 1671. The reflecting telescope has dominated serious astronomy ever since.\n\nThe eighteenth and nineteenth centuries were the age of the great reflectors. William Herschel built a series of increasingly powerful telescopes, culminating in his 40-foot reflector in 1789, with which he discovered Uranus, catalogued thousands of nebulae, and mapped the shape of the Milky Way. Lord Rosse's 72-inch Leviathan of Parsonstown (1845) was the first to resolve the spiral structure of galaxies.\n\nThe twentieth century brought the shift to mountaintop observatories, photographic plates replacing the eye, and the era of giant reflectors: the 100-inch Hooker telescope at Mount Wilson (1917), where Hubble proved the universe extends beyond our galaxy, and the 200-inch Hale telescope at Palomar (1948), which remained the world's largest for decades. Modern instruments — the Keck twins (10 m), the VLT (four 8.2 m units), and the forthcoming Extremely Large Telescope (39 m) — use segmented mirrors, laser-guide-star adaptive optics to correct for atmospheric turbulence, and interferometric techniques that were unthinkable a century ago.\n\nThe same era also democratised the instrument. Amateur reflectors built on Newton's original pattern — now with precision-figured glass mirrors, computerised GoTo mounts, and cooled CMOS cameras — routinely image galaxies and nebulae from suburban gardens that would have required a professional observatory in 1950.\n\nThe leap into space began with small ultraviolet observatories (OAO-2, IUE) in the 1960s and 1970s. The Hubble Space Telescope, launched on STS-31 in April 1990, was the first true space observatory in the modern sense — a 2.4-metre Ritchey–Chrétien optimised across the UV, visible, and near-infrared. A flaw in the primary mirror's figure was corrected in 1993 by astronauts installing the COSTAR optics package, and Hubble was serviced four more times by Space Shuttle crews, the last in 2009.\n\nIts successor, the James Webb Space Telescope, launched on Christmas Day 2021 aboard an Ariane 5 from Kourou. Over the following month it executed the most complex deployment sequence ever attempted in space: unfolding the sunshield, tensioning all five layers, swinging the secondary mirror tower into position, and unlocking the 18 hexagonal segments of the primary. After arrival at L2 in late January 2022 and several months of mirror alignment and instrument commissioning, full science operations began in July 2022. Within months JWST had detected the most distant galaxies ever confirmed, resolved the atmospheres of exoplanets hundreds of light-years away, and produced infrared images of star-forming regions that simply could not be obtained from the ground. Four centuries separate Galileo's cardboard tube from JWST's gold-coated beryllium, but the underlying recipe has not changed: collect more light, and look further.",
    images: [
      { src: storageUrl("dictionary/newton-telescope.avif") },
      { src: storageUrl("dictionary/home-telescope.avif") },
      { src: storageUrl("dictionary/jwst.avif") },
    ],
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
      "A quadrant is, in its simplest form, a quarter-circle of wood or metal marked with degrees from 0 to 90. You sight a celestial object along one edge, a plumb line or pointer indicates the angle, and you read the altitude above the horizon from the graduated arc. The principle is pure geometry: the angle subtended at the observer's eye between the horizon and the object is the altitude, and a quarter-circle is exactly the range needed to cover everything from the horizon (0°) to the zenith (90°).\n\nSeveral distinct types evolved over the centuries. The simplest portable quadrant was a small handheld device — a wooden or brass quarter-disc with a plumb bob hanging from the apex and two sighting holes (pinnules) along one straight edge. The observer aimed at a star through the pinnules and read where the plumb line crossed the arc. These were cheap, easily carried, and accurate to perhaps half a degree — adequate for basic navigation and timekeeping.\n\nThe mural quadrant was the precision instrument of pre-telescopic astronomy. Permanently mounted on a wall aligned exactly north-south (the local meridian), it could be made very large — Tycho Brahe's had a radius of about two metres. Size matters because the angular spacing between degree marks grows with the radius, making finer subdivisions possible. Transversals — diagonal lines connecting marks on adjacent concentric arcs — allowed readings to fractions of an arcminute without the instrument itself being impossibly huge.\n\nThe horary quadrant was a specialised variant designed for telling time from the Sun's altitude. Its face was engraved with hour lines computed for a specific latitude. By measuring the Sun's altitude and reading the intersection with the correct date curve, a user could determine the time of day without any calculation — effectively an analog computer for solar timekeeping.\n\nBefore the telescope, the quadrant was how astronomers turned the night sky into numbers. The bigger the instrument, the finer the angles it could resolve. The precision of the data depended entirely on the quality of the graduation, the rigidity of the frame, the alignment of the sighting edge, and the patience of the observer. There was no optical magnification — the ultimate limit was the resolving power of the human eye, about one arcminute under ideal conditions.",
    history:
      "Quadrants trace back to antiquity — Ptolemy describes the use of graduated instruments for measuring celestial altitudes in the Almagest (c. 150 CE), and similar tools were used in Babylonian astronomy centuries earlier. Islamic astronomers of the medieval period refined the design significantly. Al-Khwarizmi and later scholars developed the sine quadrant (rubʿ al-mujayyab), which carried trigonometric grids on its face and could solve problems in spherical astronomy by mechanical manipulation rather than calculation.\n\nThe zenith of the naked-eye quadrant came with Tycho Brahe at Uraniborg on the island of Hven (1576–1597). Tycho's great mural quadrant, built into the fabric of his observatory, had a brass arc of about 1.9 metres radius, graduated with transversals to single arcminutes. He cross-checked every observation against multiple instruments and applied systematic corrections for atmospheric refraction — a practice far ahead of his contemporaries. The resulting star catalogue and planetary tables, especially the extraordinarily precise Mars observations, were the raw material from which Kepler extracted his three laws of planetary motion. Without Tycho's quadrant, there would have been no first law.\n\nAfter the invention of the telescope (1608) and its adaptation for graduated instruments, the quadrant evolved into the telescopic quadrant and eventually the transit instrument and the mural circle. The sextant — a sixth of a circle rather than a quarter, equipped with mirrors for double-reflection measurement — replaced the quadrant for navigation at sea in the mid-eighteenth century. But for two millennia before that, the quadrant was the primary tool for measuring the geometry of the sky.",
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
      "An astrolabe is a flat brass disc that carries a two-dimensional map of the sky, mechanically rotatable to simulate the sky's daily motion. The key mathematical trick is stereographic projection — projecting the celestial sphere onto a plane from one of its poles. This projection has a remarkable property: it maps circles on the sphere to circles on the plane, so the celestial equator, the tropics, the ecliptic, and the horizon all appear as arcs of circles on the instrument's face. The result is a working model of the visible heavens that can be set for any time and date by rotating one plate against another.\n\nThe instrument consists of several stacked components. The mater is the main body — a hollow disc with a raised rim (the limb) graduated in degrees or hours. Inside the mater sits a tympan (or climate plate), engraved with the coordinate grid for a specific latitude: the horizon, altitude circles (almucantars), and azimuth lines. On top of the tympan rotates the rete — an openwork star map showing the ecliptic and pointers for the brightest stars. The rete is the most visually striking part: a lattice of brass with small pointed tips marking perhaps twenty to thirty stars. On the back, a sighting bar called the alidade pivots at the centre and is used to measure the altitude of a star or the Sun.\n\nTo use an astrolabe for timekeeping: sight the Sun or a known star through the alidade, read its altitude from the back, then rotate the rete until that star's pointer sits on the correct altitude circle on the tympan. The position of the rete against the hour scale on the limb then gives the local time. To identify an unknown star: measure its altitude and azimuth, set the rete to the current time, and see which star pointer falls on the correct position. The instrument could also determine the direction of Mecca (qibla), predict sunrise and sunset, find the length of daylight, compute the ascendant for astrological purposes, and perform basic surveying.\n\nIt was part sighting instrument, part slide rule, part pocket planetarium — and for nearly a thousand years it was the most sophisticated scientific instrument in existence. A well-made astrolabe could determine local time to within about fifteen minutes and latitude to within a degree or two — not competitive with modern instruments, but extraordinary for its era.\n\nSeveral variants developed for different purposes. The planispheric astrolabe — the standard type described above — was the most common. The mariner's astrolabe was a stripped-down version for use at sea: a heavy, open-frame brass ring with an alidade, designed only to measure the Sun's noon altitude for latitude determination. It dispensed with the rete and tympan entirely, sacrificing the analog-computer functions for robustness in wind and spray. The universal astrolabe (saphaea), developed by the Andalusian astronomer al-Zarqālī in the eleventh century, used a different projection that worked at any latitude with a single plate, eliminating the need to carry interchangeable tympans. The spherical astrolabe — rare and technically demanding to build — projected the sky onto the surface of a small globe rather than a flat disc, avoiding the distortions inherent in any planar projection.",
    history:
      "The mathematical foundation — stereographic projection — was known to Hipparchus in the second century BCE, and the concept of a star map on a rotating disc may date to this period. The Roman architect Vitruvius describes an anaphoric clock (a water-clock with a rotating star map) around 25 BCE that embodies the same principle. Claudius Ptolemy gave a systematic treatment of stereographic projection in his Planisphaerium (c. 150 CE), and the instrument in something like its mature form may have existed by the fourth or fifth century CE. Theon of Alexandria is often credited with an early description.\n\nThe astrolabe reached its full development in the Islamic world between the eighth and thirteenth centuries. Scholars at the courts of Baghdad, Damascus, Cairo, Córdoba, and Samarkand refined the mathematics, standardised the construction, wrote detailed treatises on its use, and produced instruments of extraordinary craftsmanship. The earliest surviving dated astrolabe is from 927/928 CE. Islamic makers introduced innovations including the universal plate, additional tympans for multiple latitudes, and inscriptions in both Arabic and Latin for cross-cultural trade.\n\nEuropean contact with Islamic science — through translations in Toledo, Sicily, and the Crusader states — brought the astrolabe to the Latin West by the eleventh century. Geoffrey Chaucer wrote a treatise on the astrolabe for his young son in 1391, one of the earliest technical manuals in English. The instrument was standard equipment for educated Europeans — astronomers, navigators, surveyors, physicians (who used it for astrological timing of treatments) — until the sixteenth century.\n\nThe astrolabe's decline was gradual. For navigation, the mariner's astrolabe gave way to the cross-staff and then the sextant in the seventeenth and eighteenth centuries. For astronomy, the telescope (1608) and the pendulum clock (1656) made direct measurement far more precise than any analog computation on a brass disc could achieve. For timekeeping, portable mechanical clocks outperformed it. By the nineteenth century the astrolabe was a collector's item and a symbol of medieval science — though working replicas are still made today, and the instrument remains one of the most beautiful examples of applied mathematics ever built in metal.",
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
    visualization: "damped-pendulum",
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
    visualization: "beats",
    description:
      "Beats are the slow, periodic rise and fall of amplitude that occurs when two oscillations of nearly equal frequency are superimposed. If two signals have frequencies f₁ and f₂, their sum oscillates at the average frequency (f₁ + f₂)/2 with an envelope that pulses at the beat frequency |f₁ − f₂|.\n\nMusicians use beats constantly. When tuning a guitar string against a reference tone, you hear a pulsing wah-wah-wah that slows down as the two frequencies approach each other and vanishes when they match. Piano tuners listen for beats between strings that are supposed to sound the same note.\n\nIn coupled pendulums, beats appear as energy transfer. Start one pendulum swinging and the other still; the first gradually stops while the second picks up the motion, then the process reverses. The beat frequency is the difference between the two normal-mode frequencies of the coupled system. The phenomenon is the time-domain signature of two close spectral lines — the same mathematics appears in quantum mechanics, radio engineering, and acoustics.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "shell-theorem",
    term: "shell theorem",
    category: "concept",
    shortDefinition:
      "A uniform spherical shell attracts an external particle as if all its mass were at the centre; it exerts zero net force on an internal particle.",
    visualization: "shell-theorem",
    description:
      "Newton proved two remarkable results in Book I of the Principia. First, a uniform thin spherical shell attracts any external point mass exactly as if the shell's entire mass were concentrated at its centre. Second, the same shell exerts zero net gravitational force on any particle inside it — every inward pull is perfectly cancelled by a pull from the opposite side.\n\nThe shell theorem is the reason planets and stars can be treated as point masses when computing their gravitational influence on distant objects. It also explains why gravity inside a uniform hollow sphere is zero, and why the gravitational acceleration inside a solid uniform sphere grows linearly with distance from the centre (only the mass interior to your radius contributes). Newton reportedly delayed publication of the Principia by nearly twenty years because he could not initially prove this result with sufficient rigour.",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "universal-gravitation" },
    ],
  },
  {
    slug: "gravitational-field",
    term: "gravitational field",
    category: "concept",
    shortDefinition:
      "The vector field g(r) = −GM/r² r̂ giving the acceleration any test mass would experience at each point in space.",
    description:
      "The gravitational field is a map of acceleration: at every point in space, it tells you the direction and magnitude of the gravitational pull a small test mass would feel. For a point mass M, the field is g = −GM/r² directed radially inward. The concept separates the source of gravity (M) from its effect (the acceleration felt by m), which becomes essential when you have many sources or want to describe gravity as a property of space itself.\n\nThe field concept leads naturally to gravitational potential Φ = −GM/r, a scalar whose gradient gives the field: g = −∇Φ. Equipotential surfaces are spheres around an isolated mass. The potential energy of a test mass m is U = mΦ = −GMm/r, negative because you must add energy to pull the mass to infinity. This sign convention — zero at infinity, more negative means more tightly bound — runs through all of orbital mechanics.",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "universal-gravitation" },
    ],
  },
  {
    slug: "vis-viva",
    term: "vis viva equation",
    category: "concept",
    shortDefinition:
      "v² = GM(2/r − 1/a) — gives the orbital speed at any distance r for an orbit with semi-major axis a.",
    visualization: "vis-viva",
    description:
      "The vis-viva equation is the master formula of orbital mechanics. It combines conservation of energy and the geometry of conic sections into a single expression: v² = GM(2/r − 1/a), where r is the current distance from the central body and a is the semi-major axis of the orbit. For a circular orbit (r = a everywhere), it reduces to v = √(GM/a). At perihelion the speed is maximum; at aphelion, minimum.\n\nThe name comes from Leibniz's 'vis viva' (living force), his term for what we now call kinetic energy. The equation encodes the total orbital energy: E = −GMm/(2a). Negative energy means a bound elliptical orbit. Zero energy means a parabolic escape trajectory. Positive energy means a hyperbolic flyby. Every Hohmann transfer, every gravity assist, every satellite orbit change is computed from this equation.",
    relatedPhysicists: ["isaac-newton", "johannes-kepler"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-in-orbit" },
    ],
  },
  {
    slug: "escape-velocity",
    term: "escape velocity",
    category: "concept",
    shortDefinition:
      "The minimum speed needed to escape a gravitational field: v_esc = √(2GM/r). For Earth's surface, ~11.2 km/s.",
    description:
      "Escape velocity is the speed at which a body's kinetic energy exactly equals the magnitude of its gravitational potential energy, giving zero total energy. At this speed, the body follows a parabolic trajectory and reaches infinity with zero residual speed. Any faster and it escapes on a hyperbola; any slower and it falls back.\n\nCrucially, escape velocity depends only on the mass of the central body and the distance from its centre — not on the direction of launch or the mass of the escaping object. A bullet fired horizontally at 11.2 km/s from Earth's surface (ignoring air resistance) escapes just as surely as one fired straight up. For the Moon the escape velocity is 2.4 km/s; for Jupiter, 60 km/s; for the Sun's surface, 618 km/s. The concept extends to escaping the entire solar system: at Earth's orbit, the escape velocity from the Sun is about 42 km/s.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-in-orbit" },
    ],
  },
  {
    slug: "hohmann-transfer",
    term: "Hohmann transfer",
    category: "concept",
    shortDefinition:
      "The most fuel-efficient two-burn manoeuvre for moving between two circular orbits; uses a half-ellipse as the transfer path.",
    visualization: "hohmann",
    description:
      "A Hohmann transfer orbit is an elliptical trajectory that touches the inner circular orbit at its periapsis and the outer circular orbit at its apoapsis. The spacecraft makes two engine burns: the first accelerates it from the inner orbit onto the transfer ellipse, and the second — half an orbit later — circularises it into the outer orbit. The total velocity change (Δv) is the minimum possible for a two-impulse transfer between coplanar circular orbits.\n\nWalter Hohmann, a German civil engineer and amateur rocketry enthusiast, published the idea in 1925 in his book Die Erreichbarkeit der Himmelskörper (The Attainability of Celestial Bodies). His calculation showed that interplanetary travel was energetically feasible — a revolutionary insight at a time when most scientists considered space travel fantasy. Every Mars mission, every geostationary satellite insertion, and every orbit-raising manoeuvre uses Hohmann's geometry or a close variant.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-in-orbit" },
    ],
  },
  {
    slug: "tidal-force",
    term: "tidal force",
    category: "phenomenon",
    shortDefinition:
      "The differential gravitational pull across an extended body; stretches along the line to the attractor and compresses perpendicular to it.",
    visualization: "tidal-force",
    description:
      "Tidal forces arise because gravity is not uniform across an extended body. The near side of a body is pulled more strongly than the centre, and the centre more strongly than the far side. The net effect is a stretching along the line connecting the two bodies and a compression perpendicular to it. The tidal acceleration scales as Δa ≈ 2GMd/r³, where d is the size of the body and r is the distance to the attractor.\n\nThe Moon's tidal force raises two bulges in Earth's oceans — one on the side facing the Moon (pulled more than Earth's centre) and one on the far side (pulled less, effectively left behind). The Sun produces a tidal force about 44% as strong as the Moon's. When Sun and Moon align (new and full moon), their tidal forces add to produce spring tides; when perpendicular (quarter moons), they partially cancel to produce neap tides.",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "roche-limit",
    term: "Roche limit",
    category: "concept",
    shortDefinition:
      "The minimum orbital distance at which tidal forces overcome self-gravity; closer than this, a moon is torn apart.",
    visualization: "roche-limit",
    description:
      "The Roche limit is the orbital radius inside which the tidal force from a planet exceeds the self-gravity holding a satellite together. For a fluid body, the Roche limit is approximately d = 2.44 R_p (ρ_p / ρ_s)^(1/3), where R_p is the planet's radius and ρ_p, ρ_s are the densities of planet and satellite.\n\nÉdouard Roche derived this result in 1848 while studying the stability of satellites. Saturn's rings lie almost entirely within Saturn's Roche limit — they are the debris of a moon (or moons) that ventured too close, or material that could never accrete into a moon in the first place. When comet Shoemaker-Levy 9 passed inside Jupiter's Roche limit in 1992, it broke into a chain of fragments that slammed into Jupiter two years later. The Roche limit sets a fundamental boundary: inside it, rings; outside it, moons.",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "lagrange-points",
    term: "Lagrange points",
    category: "concept",
    shortDefinition:
      "Five equilibrium positions in the restricted three-body problem where gravitational and centrifugal forces balance.",
    visualization: "lagrange-points",
    description:
      "In the restricted three-body problem — two massive bodies in circular orbit plus one massless test particle — there are exactly five points where the test particle can remain stationary in the rotating frame. Three (L1, L2, L3) lie on the line connecting the two massive bodies and are unstable equilibria (saddle points of the effective potential). Two (L4, L5) form equilateral triangles with the two bodies and are stable — the Coriolis force in the rotating frame provides a restoring mechanism despite the potential being a local maximum.\n\nJoseph-Louis Lagrange discovered these points in 1772 while studying the three-body problem analytically. L1 (between Sun and Earth) hosts the SOHO solar observatory. L2 (beyond Earth from the Sun) hosts the James Webb Space Telescope. L4 and L5 of the Sun-Jupiter system are home to the Trojan asteroids — over 12,000 known objects librating around these stable points. The concept extends to any two-body system: Earth-Moon Lagrange points are candidates for future space stations.",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "gravity-assist",
    term: "gravity assist",
    category: "concept",
    shortDefinition:
      "Technique in which a spacecraft gains or loses speed by flying close to a planet, exchanging momentum through the planet's gravitational field.",
    description:
      "A gravity assist — also called a gravitational slingshot — exploits the fact that a spacecraft's speed relative to a planet is unchanged by a flyby, but the direction of its velocity vector rotates. In the planet's reference frame the encounter is elastic: the spacecraft swings around and leaves at the same speed it arrived. But the planet is moving relative to the Sun, so when you transform back to the heliocentric frame the spacecraft's speed has changed. A trailing flyby (approaching the planet from behind in its orbit) adds the planet's orbital velocity, boosting the spacecraft. A leading flyby subtracts it, slowing the spacecraft down.\n\nThe energy comes from the planet's orbital kinetic energy. The planet slows down by an imperceptibly tiny amount — its mass is so large that the momentum transfer is negligible for it but transformative for the spacecraft. Conservation of energy and momentum are satisfied exactly; no propellant is consumed.\n\nGravity assists are essential to deep-space mission design. Voyager 2 used assists at Jupiter, Saturn, and Uranus to reach Neptune. Cassini flew past Venus twice, Earth once, and Jupiter once to reach Saturn. The Parker Solar Probe uses repeated Venus flybys to shed angular momentum and tighten its orbit around the Sun. Without gravity assists, most outer-planet missions would require prohibitively large rockets or impossibly long flight times.",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-in-orbit" },
    ],
  },
    {
          slug: "velocity",
          term: "velocity",
          category: "concept",
          shortDefinition: "The rate of change of position with respect to time; a vector in 2D and 3D, a signed scalar in 1D.",
          description: "Velocity answers the question: how fast is something moving, and in what direction? In one dimension, it is a single signed number — positive for motion to the right, negative for motion to the left. In two or three dimensions, velocity is a vector, carrying both a speed (its magnitude) and a direction. It is distinct from speed, which is the magnitude of velocity and always positive.\n\nMathematically, velocity is the time derivative of position: v = dx/dt. If you plot position against time, the velocity at any instant is the slope of the tangent line at that point. A horizontal line on a position-time graph means zero velocity — the object is at rest. A steep line means fast motion. A line that curves upward means velocity is increasing, which is acceleration.\n\nThe SI unit of velocity is metres per second. Other common units include kilometres per hour, miles per hour, and the more specialised knots (nautical miles per hour, used in navigation and aviation). For everyday motion, these are interchangeable through simple conversion factors. For cosmic motion — galaxies receding, stars orbiting — astronomers use kilometres per second, and for light and gravitational waves, the natural unit is the fraction of c.\n\nVelocity is the bridge between position and acceleration. Integrate acceleration over time and you recover velocity. Differentiate position over time and you recover velocity. It sits in the middle of the derivative chain, and almost every law of motion — Newton's second, the work-energy theorem, the momentum principle — is written in terms of it.",
          relatedPhysicists: ["galileo-galilei", "isaac-newton"],
          relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" }],
        },
    {
          slug: "acceleration",
          term: "acceleration",
          category: "concept",
          shortDefinition: "The rate of change of velocity with respect to time; positive when speeding up, negative when slowing down.",
          description: "Acceleration is the second step in the chain of derivatives that describes motion. If position tells you where something is, and velocity tells you how that position is changing, then acceleration tells you how the velocity itself is changing. Mathematically, a = dv/dt = d²x/dt².\n\nThe most familiar example is free fall near the Earth's surface, where every object — in the absence of air resistance — accelerates downward at approximately 9.81 m/s² regardless of mass. This constant is called g, and it defines the local strength of gravity. It is the reason a feather and a hammer, dropped together in a vacuum, land at the same moment. Galileo suspected this; the Apollo 15 astronaut David Scott proved it live on the Moon in 1971.\n\nIn one dimension, acceleration is a signed number: positive means speeding up in the direction of motion, negative means slowing down (deceleration is just negative acceleration along the direction of travel). In higher dimensions, acceleration is a vector that can change either the magnitude or the direction of velocity — or both. A car rounding a curve at constant speed is still accelerating, because its velocity vector is rotating.\n\nThe SI unit is metres per second squared (m/s²), which reads as 'metres per second, per second' — the change in velocity (metres per second) per unit of time (per second). Newton's second law, F = ma, ties acceleration directly to force: the amount of push needed to change an object's motion is proportional to the acceleration you want to produce.",
          relatedPhysicists: ["galileo-galilei", "isaac-newton"],
          relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" }],
        },
    {
          slug: "free-fall",
          term: "free fall",
          category: "phenomenon",
          shortDefinition: "Motion under gravity alone, with no air resistance or other forces — every object accelerates at the same rate.",
          description: "Free fall is what happens when gravity is the only force acting on an object. No air resistance, no friction, no buoyancy — just the steady pull of a planet or star. In free fall near the Earth's surface, every object accelerates downward at g ≈ 9.81 m/s², regardless of mass. A hammer falls at exactly the same rate as a feather, and a bowling ball falls at exactly the same rate as a golf ball. Aristotle thought otherwise; Galileo proved him wrong.\n\nThe reason everything falls the same is deep. The force of gravity on an object is proportional to its mass (F = mg), but the acceleration a force produces is inversely proportional to mass (a = F/m). The two mass terms cancel exactly, leaving an acceleration that depends only on the local gravitational field. This is called the equivalence of inertial and gravitational mass, and Einstein would later turn it into the foundation of general relativity.\n\nOn Earth, air resistance usually spoils the demonstration. A feather drifts, a parachute glides, a sheet of paper flutters — all because the surrounding air pushes back. Strip the air away, and the physics becomes visible. In 1971, astronaut David Scott dropped a hammer and a feather together on the surface of the Moon during the Apollo 15 mission. The footage is still striking: they touch the lunar dust at the same instant, because on the airless Moon, free fall is the only motion.\n\nIn a more technical sense, any body moving under gravity alone is in free fall, even if it is not falling downward. A spacecraft in orbit is in free fall — it is continuously falling toward the Earth, but its sideways motion is fast enough that the Earth curves away underneath it at the same rate. Astronauts inside the International Space Station are weightless because they, too, are in free fall, falling around the Earth together with the station.",
          relatedPhysicists: ["galileo-galilei", "isaac-newton"],
          relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" }],
        },
    {
          slug: "kinematic-equations",
          term: "kinematic equations",
          category: "concept",
          shortDefinition: "The three algebraic relations that describe motion under constant acceleration: v = v₀ + at, x = x₀ + v₀t + ½at², and v² = v₀² + 2a(x − x₀).",
          description: "Under constant acceleration — the simplest non-trivial case of motion — three compact equations describe everything. Given any three of the five quantities (initial position x₀, initial velocity v₀, acceleration a, elapsed time t, final velocity v, final position x), you can solve for the rest.\n\nThe first, v = v₀ + at, says that velocity grows linearly with time. Start at v₀, add a constant amount every second, and that is your current velocity. The second, x = x₀ + v₀t + ½at², says that position is the sum of three parts: where you started, how far you would have travelled at the initial velocity, and the extra distance covered because you were accelerating. The factor of ½ is not arbitrary — it is the area of the triangular region under a linearly growing velocity graph, a geometric identity that Nicole Oresme had proven three centuries before Galileo. The third, v² = v₀² + 2a(x − x₀), is the work-energy theorem in disguise, and it has no time in it at all: given a starting speed and a distance covered under constant acceleration, you know the final speed directly, without tracking how long the journey took.\n\nThese equations are the working tools of introductory mechanics. Projectile problems, brake distances, rocket burns, falling-object drops — anything where acceleration can be treated as constant — collapse to algebraic exercises once you write them down. The moment acceleration stops being constant, the equations fail, and you need calculus proper. But inside their domain they are exact, not approximate, and they are the residue of the more general calculus of motion boiled down to pure algebra.",
          relatedPhysicists: ["galileo-galilei", "nicole-oresme"],
          relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" }],
        },
    {
          slug: "derivative",
          term: "derivative",
          category: "concept",
          shortDefinition: "The instantaneous rate of change of one quantity with respect to another; geometrically, the slope of the tangent line to a curve.",
          description: "A derivative is the mathematics of change. If a quantity y depends on another quantity x, the derivative dy/dx tells you how fast y changes when x changes by a tiny amount. In physics, the most important derivative is the time derivative: velocity is the derivative of position, acceleration is the derivative of velocity, and force — through F = ma — reaches into the second derivative of position itself.\n\nGeometrically, a derivative is a slope. Draw a curve. Pick a point on it. Now pick a nearby point and draw the straight line through both — that is a secant, and its slope is the average rate of change between them. Now slide the second point closer and closer to the first. The secant rotates, and in the limit where the two points merge, it becomes the tangent line — the line that just touches the curve at that single point. The slope of that tangent is the derivative. Nicole Oresme, in the fourteenth century, used exactly this area-under-the-velocity-curve idea to derive what we now call the mean-speed theorem, long before calculus existed as a formal subject.\n\nNewton and Leibniz independently invented the derivative in the 1660s and 1670s, each with their own notation and each with their own priority fight. Newton called it a fluxion; Leibniz wrote it dy/dx, and his notation won. The derivative is the first half of calculus — the other half is the integral, which undoes it. Together, they are the mathematical language in which almost every law of modern physics is written.",
          relatedPhysicists: ["isaac-newton", "nicole-oresme"],
          relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" }],
        },
  {
    slug: "inertia",
    term: "inertia",
    category: "concept",
    shortDefinition:
      "The tendency of a body to resist changes in its motion; the first of Newton's three laws.",
    description:
      "Inertia is the property of matter that keeps a body doing whatever it is already doing. A body at rest stays at rest. A body in motion keeps moving in a straight line at constant speed. Nothing happens to the motion unless a force acts. The word itself means 'sluggishness' or 'laziness' in Latin, and in a literal sense that is what inertia is — a reluctance on the part of matter to have its motion changed.\n\nNewton's first law is the formal statement of inertia. It sounds obvious today, but it replaced two thousand years of Aristotelian physics in which motion was assumed to require a continuous cause. A cart needed horses, an arrow needed the air pushing it along. Galileo was the first to see past this picture. He rolled balls on polished planes and noticed that the smoother the surface, the further they travelled. In the limit of a perfectly smooth surface — no friction — the ball would never stop. Motion, he concluded, is not what needs explaining. Deceleration is.\n\nMass is the quantitative measure of inertia. A heavy body is hard to start moving and hard to stop once moving. A light body yields easily to a push. In Newton's second law, F = ma, the mass is precisely the constant that tells you how much acceleration a given force will produce. Double the mass and the same force produces half the acceleration. This is why inertia and mass are so often used as synonyms, though strictly speaking inertia is the phenomenon and mass is the number that quantifies it.\n\nInertia is frame-dependent in a subtle way. It shows up cleanly only in frames of reference that are not themselves accelerating — inertial frames. Inside a braking car, objects lurch forward as if pulled by an invisible hand, and it can look as though inertia has been broken. What has really happened is that the car itself is accelerating, and the occupant, in trying to continue in a straight line at constant speed as the first law demands, appears to surge forward relative to the decelerating vehicle.",
    history:
      "Galileo glimpsed inertia in his inclined-plane experiments in the early 1600s, though he never stated it as a general principle. Descartes came closer, giving a clear statement of rectilinear inertia in his Principles of Philosophy (1644). Newton finally codified it as the first of three laws in the Principia (1687), using the Latin word vis insita — the 'innate force' by which a body persists in its state.",
    relatedPhysicists: ["isaac-newton", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
    ],
  },
  {
    slug: "mass",
    term: "mass",
    category: "concept",
    shortDefinition:
      "The quantitative measure of a body's inertia; the m in F = ma.",
    description:
      "Mass is the number that tells you how stubborn a body is. It is what you feel when you try to accelerate something — the resistance that a bowling ball offers and a tennis ball does not. In Newton's second law, F = ma, mass is the constant of proportionality between applied force and resulting acceleration. Push twice as hard on the same object and you get twice the acceleration; double the mass and the same force produces half the acceleration. Mass is the quantitative embodiment of inertia.\n\nThe SI unit of mass is the kilogram. Historically the kilogram was defined as the mass of a particular platinum-iridium cylinder kept in a vault outside Paris, but in 2019 the definition was rewritten in terms of Planck's constant, severing the SI at last from any specific chunk of metal. Other common units include the gram, the tonne (1000 kg), the pound (in engineering contexts), and the atomic mass unit (for molecules and atoms).\n\nMass is not the same thing as weight. Weight is the force of gravity on an object — weight is what a scale measures when you stand on it — and it depends on where you are. On the Moon, a person has the same mass but one-sixth the weight. Out in deep space far from any gravitating body, weight goes to zero, but mass does not. Push a floating astronaut and she still resists accelerating; push her harder and she accelerates more.\n\nThere are, at a deeper level, two distinct concepts called mass in classical physics. Inertial mass is the m in F = ma — the resistance to acceleration. Gravitational mass is the m in F = mg — how strongly gravity pulls on the object. Newton noticed that the two appear to be identical for every object he could test. Galileo's observation that all bodies fall at the same rate is precisely this equivalence: the inertial and gravitational masses cancel in a = F/m = mg/m = g. Einstein elevated the equivalence to a postulate in 1907 and built general relativity on top of it.",
    history:
      "The modern concept of mass as distinct from weight emerged in the seventeenth century, most clearly in Newton's Principia (1687). Before Newton, weight was the common-sense measure of quantity of matter; he carefully distinguished the two and noted, on the basis of pendulum experiments, that the ratio of inertial to gravitational mass is the same for all substances.",
    relatedPhysicists: ["isaac-newton", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
    ],
  },
  {
    slug: "force",
    term: "force",
    category: "concept",
    shortDefinition:
      "A push or a pull; mathematically, the cause of acceleration — F = ma.",
    description:
      "A force is anything that pushes or pulls on a body. In the formal language of mechanics, force is whatever can change a body's momentum. Newton's second law, F = ma, is simultaneously the definition of force and the recipe for computing motion: given the force, you know the acceleration; given the acceleration, you know the force. The SI unit is the newton, defined as the force required to accelerate one kilogram at one metre per second squared.\n\nForces come in many varieties. Gravity pulls every mass toward every other mass. The normal force is the contact force a surface exerts perpendicular to itself, keeping you from falling through the floor. Tension is the force transmitted along a rope or cable. Friction resists relative motion between surfaces in contact. Drag resists motion through a fluid. Electric and magnetic forces act between charges and currents. The nuclear forces bind atomic nuclei. Each of these is an independent physical law that specifies a particular force in terms of the state of the bodies involved.\n\nForces add as vectors. If two forces act on a body at the same time, the net force is their vector sum, and it is the net force that enters Newton's second law. A body can have many forces acting on it and still be in equilibrium if they cancel — a book on a table has gravity pulling down and the normal force pushing up, and the two exactly annul each other. When forces do not cancel, the body accelerates in the direction of the net force.\n\nCrucially, Newton's laws do not tell you what forces exist in the universe. They tell you what forces do once you know them. Newton himself supplied the first great example beyond the three laws: universal gravitation, a specific force law saying every pair of masses attracts with an inverse-square force. Later physicists added Coulomb's law, Hooke's law, the Lorentz force, and many more. Each is an empirical discovery that slots into the second law as the right-hand side.",
    history:
      "The word 'force' had been used loosely for centuries before Newton, but it was Newton who made it a precise, quantitative concept in the Principia (1687). He defined it as whatever changes the motion of a body, and fixed its measure through the second law. The newton was named in his honour and adopted as the SI unit in 1948.",
    relatedPhysicists: ["isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
    ],
  },
  {
    slug: "newtons-laws-of-motion",
    term: "Newton's laws of motion",
    category: "concept",
    shortDefinition:
      "The three laws — inertia, F = ma, and equal-and-opposite reaction — that launched classical mechanics in 1687.",
    description:
      "Newton's laws of motion are three statements, published together in the opening pages of the Philosophiæ Naturalis Principia Mathematica in 1687, that became the foundation of classical mechanics. They are the simplest complete description of how forces and motion relate.\n\nThe first law — the law of inertia — says that a body continues in its state of rest or of uniform motion in a straight line unless acted upon by a force. Aristotle had taught for two thousand years that motion required a continuous cause. Galileo saw past that, and Newton turned the observation into a first principle: motion is not what needs explaining. Only changes in motion do.\n\nThe second law — F = ma — says that the net force on a body equals its mass times the acceleration it produces. In its original momentum form, F = dp/dt, the law generalises to bodies whose mass changes with time, such as rockets burning fuel. This single equation is the working engine of classical mechanics. Every specific dynamical problem — a swinging pendulum, a falling apple, an orbiting planet — reduces to writing down the force and applying the second law.\n\nThe third law — action and reaction — says that every force comes paired with an equal and opposite force on a different body. If A pushes B, then B pushes A with the same strength in the opposite direction. Rockets, walking, swimming, a bird pushing down on the air: all are third-law phenomena. Momentum conservation, a pillar of modern physics, is a direct consequence.\n\nThe three laws together hold only in inertial reference frames — frames that are not themselves accelerating. In a braking car or a rotating carousel, Newton's laws in their bare form fail, and fictitious forces have to be introduced to make the arithmetic work. Einstein's theories of relativity modified but did not overthrow the laws: special relativity preserved the second law in its momentum form, and general relativity reinterpreted gravity as the geometry of spacetime, with freely falling bodies following straight lines through it.",
    history:
      "Newton published the three laws at the opening of Book I of the Principia Mathematica in 1687. The work synthesised two decades of private calculation done at Woolsthorpe during the plague years 1665–1666. From the three laws plus the law of universal gravitation, Newton derived Kepler's three laws of planetary motion, explained the tides, and predicted the return of comets. The laws remained the unchallenged framework of physics for more than two hundred years.",
    relatedPhysicists: ["isaac-newton", "galileo-galilei", "robert-hooke"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
    ],
  },
  {
    slug: "inertial-frame",
    term: "inertial frame",
    category: "concept",
    shortDefinition:
      "A reference frame in which Newton's laws hold in their simple form; one that is not itself accelerating.",
    description:
      "An inertial frame is a reference frame in which a body with no forces on it moves in a straight line at constant speed. Equivalently, it is a frame in which Newton's laws of motion hold without modification. Any frame moving at constant velocity relative to an inertial frame is also inertial, which is the content of Galilean relativity: uniform motion cannot be distinguished from rest by any experiment performed inside the frame.\n\nNon-inertial frames — frames that are accelerating or rotating — break Newton's laws in their simple form. A passenger in a braking car sees coffee lurch forward as if pulled by a ghost. No force is actually doing the pulling; what is happening is that the car is decelerating while the coffee, obeying the first law, tries to continue at the original speed. Describing the motion from inside the car requires introducing fictitious forces — the pseudo-force that makes the coffee 'lurch', the centrifugal force on a carousel, the Coriolis force on the rotating Earth — that have no real source but are bookkeeping devices for the frame's own acceleration.\n\nThe surface of the Earth is very nearly inertial for everyday mechanics but not exactly — it rotates once a day. Foucault's pendulum, hanging in the Panthéon in 1851, made the rotation visible: the plane of its swing appears to rotate because the ground beneath rotates with the Earth. In most experiments the deviation from inertial behaviour is too small to matter, but it becomes important in meteorology (cyclones spin because of Coriolis), in ballistics over long distances, and in precision navigation.\n\nEinstein's special relativity (1905) kept the concept of inertial frames and upgraded Galilean relativity: the laws of physics, including the speed of light, are the same in every inertial frame. General relativity (1915) went further and identified the inertial frames with those of free fall — an astronaut in orbit, falling freely around the Earth, is in an inertial frame, even though a ground-based observer would say she is accelerating. Newton's first law, in its modern form, reads: a body left alone follows a straight line through spacetime.",
    history:
      "The concept of an inertial frame is implicit in Newton's Principia (1687), where the first law tacitly assumes a frame in which it can be stated cleanly. The term 'inertial frame' (Inertialsystem) was coined by Ludwig Lange in 1885, and the idea was sharpened by Einstein's work on special relativity in 1905.",
    relatedPhysicists: ["isaac-newton", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
    ],
  },
  {
    slug: "vector",
    term: "vector",
    category: "concept",
    shortDefinition:
      "A quantity with both magnitude and direction; represented as an arrow and added tip-to-tail.",
    description:
      "A vector is the mathematical object used to describe anything that has both a size and a direction: velocity, force, acceleration, displacement, electric and magnetic fields. Drawn as an arrow, its length stands for the magnitude and its orientation stands for the direction. In two or three dimensions, a vector is conveniently written as an ordered list of components — its projections onto the chosen axes. The magnitude is recovered from those components by Pythagoras: |v| = √(vₓ² + v_y² + v_z²).\n\nTwo operations dominate. The first is addition: to combine two vectors, place them tip-to-tail — the resultant runs from the starting point of the first to the ending point of the second. Equivalently, add the components. Geometrically, if you draw a parallelogram whose sides are the two vectors, the resultant is the diagonal. The second is scalar multiplication: stretching or compressing a vector by a number, with a negative scalar flipping the direction.\n\nVectors are the language in which classical mechanics is written once motion leaves the one-dimensional line. A projectile's velocity has a horizontal component that stays constant and a vertical component that changes with gravity; the total velocity is the vector sum of the two, and the speed is its magnitude. In higher-dimensional physics — relativity, electromagnetism, quantum mechanics — vectors generalise to tensors and state-vectors, but the elementary two- and three-dimensional arrows are still the working tools of everyday problems.",
    history:
      "The idea of a directed quantity existed informally in Newton's Principia as the 'parallelogram of forces'. The modern notation is much younger: William Rowan Hamilton introduced quaternions in 1843 as a way to multiply three-dimensional directed quantities, and Josiah Willard Gibbs and Oliver Heaviside in the 1880s stripped the quaternion formalism down to what we now call vector algebra — dot product, cross product, and component notation.",
    relatedPhysicists: ["isaac-newton", "galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "projectile-motion",
    term: "projectile motion",
    category: "phenomenon",
    shortDefinition:
      "Motion of an object fired into the air under gravity alone; the trajectory is a parabola in vacuum.",
    description:
      "Projectile motion is what happens when you launch an object and then let gravity act alone on it. Ignore air resistance and the equations split cleanly along two axes: horizontally, nothing pulls the object so its speed stays constant; vertically, gravity accelerates it downward at g. Combining the two, the horizontal position grows linearly with time while the vertical position follows the familiar free-fall quadratic. Eliminate time between them and the y-coordinate becomes a quadratic function of x — a parabola.\n\nThree derived quantities summarise any flight that launches and lands at the same height. The time of flight is T = 2·v·sinθ/g. The peak height is H = (v·sinθ)²/(2g). The range, or horizontal distance covered, is R = v²·sin(2θ)/g. Because sin(2θ) peaks at 2θ = 90°, the maximum range (in vacuum) is achieved at a launch angle of 45°, and any two angles that sum to 90° give the same range — one flat and fast, one high and slow.\n\nIn the real world, air resistance breaks the clean picture. A baseball, a cricket ball, a tennis serve, a golf drive — none of them follow a true parabola. Drag skews the trajectory asymmetrically, the descent is steeper than the ascent, and the range is reduced. The optimal launch angle drops below 45°. For projectiles moving at speeds where quadratic drag dominates — anything more than a gentle throw — the equations of motion have no closed-form solution and must be integrated numerically.",
    history:
      "Galileo derived the parabolic trajectory in Two New Sciences (1638), the first correct quantitative theory of projectile motion in history. His student Evangelista Torricelli compiled the first serious range tables in Opera Geometrica (1644) and discovered the safety parabola — the enveloping curve that bounds the family of trajectories for a fixed launch speed. Newton addressed air resistance in Book II of the Principia (1687), the starting point for modern ballistics and aerodynamics.",
    relatedPhysicists: ["galileo-galilei", "evangelista-torricelli", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "parabola",
    term: "parabola",
    category: "concept",
    shortDefinition:
      "Conic section given by a quadratic in one variable; the trajectory of a projectile under gravity alone.",
    description:
      "A parabola is the curve you get by slicing a cone parallel to one of its sides. Equivalently, it is the set of points equidistant from a fixed point (the focus) and a fixed straight line (the directrix). In Cartesian coordinates it takes the form y = a·x² + b·x + c: a quadratic function of a single variable. The shape has a single minimum or maximum — the vertex — and a mirror-symmetry axis passing through it.\n\nApollonius of Perga studied parabolas as pure geometry in the third century BCE. They re-entered physics through Galileo, who showed in 1638 that the trajectory of a projectile under constant gravity is a parabola, and again through Kepler, whose analysis of orbits revealed that a parabolic path is the boundary case between a closed elliptical orbit and an open hyperbolic escape — the trajectory an object follows when it has exactly the escape energy.\n\nParabolas also appear in optics and engineering: a parabolic mirror focuses parallel incoming rays to a single point, which is why reflecting telescopes, satellite dishes, and solar concentrators all use parabolic surfaces. Suspension bridges hang in a cable shape that is very nearly parabolic when the roadway is uniform. The curve is the characteristic signature of any physical process where one quantity depends on the square of another.",
    relatedPhysicists: ["galileo-galilei", "evangelista-torricelli"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "range",
    term: "range",
    category: "concept",
    shortDefinition:
      "Horizontal distance covered by a projectile before it returns to its launch height; maximised at 45° in vacuum.",
    description:
      "The range of a projectile is the horizontal distance it travels between launch and return to its starting height. For a shot fired from level ground at speed v and angle θ in vacuum, the range has a compact closed form: R = v²·sin(2θ)/g. The formula shows two things at once. First, range scales as the square of the launch speed, so doubling the muzzle velocity quadruples how far the shot goes. Second, the angular dependence sin(2θ) is symmetric about 45°, so the maximum reachable distance is R_max = v²/g, achieved at θ = 45°, and any pair of complementary angles (θ and 90° − θ) gives exactly the same range.\n\nIn practice, projectiles almost never launch and land at the same height, and the air is never absent. If the launch height is above the landing height — a shot-put released from shoulder height, an arrow fired from a hill, a ball thrown from a cliff — the optimal angle drops below 45°. If drag matters — as it does for any fast projectile in air — the optimal angle drops further still, typically into the 30°–40° range for sports balls. Artillery fire tables from the seventeenth century onward tabulated ranges for a grid of angles and charge weights, because no simple formula suffices once the physics is realistic.",
    history:
      "Evangelista Torricelli compiled the first systematic projectile range tables in Opera Geometrica (1644), applying Galileo's parabolic theory to artillery practice. He also discovered that for a fixed launch speed, the family of trajectories at every possible angle is bounded from above by another parabola — the safety parabola — outside which no shot can reach.",
    relatedPhysicists: ["galileo-galilei", "evangelista-torricelli"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "monkey-and-hunter",
    term: "monkey and the hunter",
    category: "phenomenon",
    shortDefinition:
      "Classic thought experiment: a dart fired straight at a monkey that falls at the trigger still hits the monkey, because both are in the same free fall.",
    description:
      "The monkey-and-hunter demonstration pits a hunter against a clever monkey hanging from a tree branch. The hunter aims the dart gun directly along the line of sight to the monkey. The monkey, watching the trigger, releases the branch at the exact instant the gun fires. The question is whether the dart still strikes the monkey, and whether the answer depends on the dart's speed.\n\nIt does not depend on speed. The dart follows a parabola starting from the muzzle along the aim line; if gravity were switched off, it would travel in a straight line and hit the original position of the monkey. Gravity pulls the dart below that straight line by exactly ½·g·t² after time t. But gravity also pulls the monkey down by ½·g·t² in the same time, from its original height. Both the dart and the monkey drop the same vertical distance below their respective starting points. So as long as the dart travels fast enough to cover the horizontal distance before either hits the ground, it collides with the monkey mid-air.\n\nThe underlying principle is the same one Galileo demonstrated with the feather and the hammer on the Moon: gravity accelerates every body identically, regardless of mass or starting velocity. Two objects released into free fall from the same instant share the same vertical motion. Their horizontal motions are independent — which is exactly the decomposition that makes projectile motion tractable in the first place. The monkey-and-hunter demo is pedagogically perfect because the shared free fall is hidden in plain sight.",
    history:
      "The thought experiment — sometimes credited informally to Galileo but first written up in its modern form in the late nineteenth century — has been a staple of physics teaching since at least the 1960s, performed with a spring-released target and an electromagnet-triggered dart gun in thousands of university lecture halls around the world.",
    relatedPhysicists: ["galileo-galilei"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "friction",
    term: "friction",
    category: "concept",
    shortDefinition:
      "Force that opposes relative motion between two surfaces in contact, converting kinetic energy into heat.",
    description:
      "Friction is the umbrella name for a family of dissipative forces that arise when two surfaces are pressed together and one tries to slide against the other. At the macroscopic level it is captured by two numbers — the static coefficient μ_s, which sets the maximum force the surfaces can exert before they break loose, and the kinetic coefficient μ_k, which sets the force while they are sliding. Both scale with the normal force pressing the surfaces together, not with the contact area — a surprising empirical fact first nailed down by Guillaume Amontons in 1699.\n\nAt the microscopic level, friction is the net result of innumerable tiny interactions between the asperities (high points) of the two surfaces. Even a highly polished metal surface looks jagged on the nanometre scale, and when two such surfaces touch they make contact only at a sparse set of points. When they slide, those contact points deform, cold-weld briefly, and tear free again, each event converting a tiny amount of mechanical energy into thermal motion of the atoms. The macroscopic result is a drag force that feels proportional to the normal force and roughly independent of speed.\n\nFriction is the mechanism by which almost all everyday mechanical systems lose energy. It is why hockey pucks slow down, why brakes work, and why the air warms slightly in a gust of wind. It is also the mechanism by which almost anything useful happens mechanically: walking, writing, climbing, gripping, tying knots, and driving cars all depend on the friction between surfaces behaving the way Amontons' laws say it should.",
    relatedPhysicists: ["guillaume-amontons", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "static-friction",
    term: "static friction",
    category: "concept",
    shortDefinition:
      "The friction force that resists the onset of sliding; can match applied forces up to a maximum of μ_s · N.",
    description:
      "Static friction is the force a stationary surface exerts to keep an object from sliding. Unlike most forces in physics, it is not a fixed quantity — it is whatever it needs to be to cancel the applied force, up to a ceiling. Push a heavy box gently and nothing happens: static friction rises to exactly match your push. Push harder and static friction rises with you. Push harder still, and at some threshold you exceed the ceiling — static friction has no more to give, the box breaks loose, and from that moment on kinetic friction takes over.\n\nThe ceiling is set by the static-friction coefficient μ_s and the normal force N pressing the surfaces together: F_s ≤ μ_s · N. This is an inequality, not an equation. Static friction only provides as much force as the situation demands, never more. μ_s is larger than the kinetic coefficient μ_k — it takes more force to start a block sliding than to keep it sliding, because stationary surfaces settle into each other and their asperities cold-weld in a way that has to be torn apart all at once to break loose.\n\nStatic friction is why everything sits still. The book on the shelf, the coin on the table, the car parked on a hill — all are held by static friction, and all would fail gracelessly if it were removed. The transition from static to kinetic is the moment the world switches from inaction to motion, and it is captured by a single elegant condition on an inclined plane: the block slips when tan θ = μ_s.",
    relatedPhysicists: ["guillaume-amontons"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "kinetic-friction",
    term: "kinetic friction",
    category: "concept",
    shortDefinition:
      "The friction force acting on a body that is already sliding; has fixed magnitude μ_k · N, independent of speed.",
    description:
      "Kinetic friction is the force two surfaces exert on each other while one is sliding across the other. In the textbook model it has a fixed magnitude, μ_k · N, where μ_k is the kinetic-friction coefficient and N is the normal force pressing the surfaces together. It acts opposite to the direction of motion and does not depend on how fast the sliding goes — a block moving at 1 m/s and a block moving at 10 m/s feel the same kinetic friction (within the textbook approximation).\n\nThe kinetic coefficient μ_k is always less than the static coefficient μ_s. That inequality is why a stuck box is hardest to move in the first centimetre: once it is sliding, the grip of the surface slackens and a smaller sustained push keeps it going. The physical reason is that once the asperities of the two surfaces are bouncing across each other they never have time to settle and weld in the way they do at rest.\n\nKinetic friction is the steady energy drain of moving things. A puck sliding across ice, a book skidded across a desk, a car braking on a road — in each case kinetic friction sets the deceleration (a = μ_k · g for horizontal motion) and is the conduit by which kinetic energy becomes heat. In reality μ_k has a mild speed dependence at very high velocities, and can drop suddenly on an ice skate (the blade pressure melts a tiny film of liquid water), but for everyday problems the constant-μ_k model is accurate to within a few percent.",
    relatedPhysicists: ["guillaume-amontons"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "drag",
    term: "drag",
    category: "concept",
    shortDefinition:
      "Resistive force exerted on a body moving through a fluid; linear in velocity at low speeds, quadratic at high speeds.",
    description:
      "Drag is what a fluid does to a solid that is trying to move through it. Unlike contact friction between two solid surfaces, drag depends on speed — and the dependence comes in two flavours. At low velocities, where the fluid flows smoothly around the object without tearing into eddies, drag is linear in velocity and set by the fluid's viscosity: F = b · v. This is the Stokes regime, and it is what governs the motion of dust motes in air or ball-bearings in honey. At high velocities, where the object has to shove fluid mass out of the way and leaves a turbulent wake behind it, drag is quadratic: F = ½ · ρ · C_d · A · v². This is the Newtonian regime, and it is what governs cars, aircraft, baseballs, cyclists, and falling skydivers.\n\nThe crossover between the two regimes is controlled by a dimensionless number — the Reynolds number Re = ρ·v·L / η, which measures the ratio of inertial to viscous effects. Below Re ≈ 1 the linear regime rules; above it the quadratic regime takes over. Most macroscopic objects in everyday air or water are firmly in the quadratic regime, while microscopic objects (cells, dust, aerosols) are firmly in the linear one.\n\nDrag has a characteristic consequence that plain friction does not: because the drag force grows with speed, a body falling under gravity in a fluid reaches a terminal velocity at which drag exactly balances gravity, and from that moment on it falls at constant speed. The approach to terminal velocity is exponential in the linear regime and slightly different in the quadratic, but in both cases it is the signature that distinguishes drag from contact friction.",
    relatedPhysicists: ["george-gabriel-stokes", "isaac-newton"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "terminal-velocity",
    term: "terminal velocity",
    category: "concept",
    shortDefinition:
      "The steady speed at which a falling body's drag exactly cancels gravity, leaving zero net force.",
    description:
      "Terminal velocity is the speed at which a body falling through a fluid stops accelerating, because the drag force pushing up has grown to match the weight pulling down. From that point on the net force is zero, and by Newton's second law the velocity is constant — the body coasts down at the same speed indefinitely.\n\nIn the linear-drag regime (slow motion in a viscous fluid), setting m·g = b·v_t gives v_t = m·g / b. A ball-bearing dropped in a tall tube of glycerine reaches this speed within fractions of a second and then sinks at a steady rate. The approach is exponential, with time constant τ = m/b: after one τ the ball is at 63% of v_t, after three it is at 95%, after five it is within 1%.\n\nIn the quadratic-drag regime (fast motion in air), setting m·g = ½ρC_d A v_t² gives v_t = √(2m·g / ρC_d A). A 90 kg skydiver in a belly-down posture reaches about 55 m/s — the stable free-fall speed that has been verified thousands of times in sport parachuting. Pulling the ripcord increases A dramatically, drops v_t to something like 6 m/s, and allows a survivable landing.\n\nTerminal velocity is why raindrops don't kill people, why small animals survive falls that would break larger ones, and why parachutes work at all. The dependence on size is the key: for geometrically similar objects, v_t scales as √(L), so bigger things fall faster. A cat dropped from a second-storey window is in trouble; a mouse dropped from the same height walks away.",
    relatedPhysicists: ["george-gabriel-stokes"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "stokes-law",
    term: "Stokes' law",
    category: "concept",
    shortDefinition:
      "The drag force on a sphere of radius r moving slowly through a fluid of viscosity η: F = 6πηrv.",
    description:
      "Stokes' law is the exact expression for the drag force on a small, slow-moving sphere in a viscous fluid. Its form is startlingly clean — F = 6πηrv, where η is the dynamic viscosity of the fluid, r is the radius of the sphere, and v is the speed. There are no fudge factors, no dimensionless drag coefficients, and no shape parameters: a small enough sphere in a thick enough fluid feels exactly this much drag and no more.\n\nThe law was derived by George Gabriel Stokes in 1851 as an exact solution of the Navier-Stokes equations in the low-Reynolds-number limit, where the inertia of the fluid can be ignored relative to its viscosity. It applies when Re = ρ·v·L / η is much less than 1 — which means slow motion, small objects, viscous fluids, or some combination. A grain of pollen falling in still air, a bacterium swimming in water, and a ball-bearing sinking in glycerine are all firmly in the Stokes regime.\n\nTwo famous applications followed. First, Robert Millikan's oil-drop experiment (1909) used Stokes' law to measure the terminal velocity of charged oil droplets in air and from it inferred the charge on a single electron — one of the foundational experimental results of atomic physics. Second, Jean Perrin (1908) used Stokes' law to analyse the Brownian motion of suspended particles and produced the first definitive measurement of Avogadro's number, clinching the atomic hypothesis.\n\nOutside its regime of validity the law breaks down badly. By Re ≈ 1 the inertial contribution to drag is comparable to the viscous one, and by Re ≈ 1000 the drag is almost entirely quadratic in velocity and Stokes is off by orders of magnitude. Within its regime, though, it is one of the cleanest exact results in continuum mechanics.",
    relatedPhysicists: ["george-gabriel-stokes"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
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
