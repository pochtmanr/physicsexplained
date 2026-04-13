import type { Physicist } from "./types";
import { storageUrl } from "../supabase";

export const PHYSICISTS: readonly Physicist[] = [
  {
    slug: "galileo-galilei",
    name: "Galileo Galilei",
    shortName: "Galileo",
    born: "1564",
    died: "1642",
    nationality: "Italian",
    oneLiner:
      "Timed a swinging chandelier against his pulse and found the pendulum's secret.",
    image: storageUrl("physicists/galileo-galilei.avif"),
    bio: "Galileo Galilei was born in Pisa in 1564 and spent most of his working life as a professor of mathematics at Padua and a court philosopher in Florence. In 1583, still a medical student, he sat in Pisa cathedral watching a bronze chandelier sway overhead and timed its swings against his own pulse. Every cycle took the same amount of time, no matter how wide the arc. That observation — isochronism — became the seed of the pendulum clock and of modern mechanics.\n\nIn 1609 he heard that a Dutch spectacle maker had built a device for making distant things look closer. Within months he had ground his own lenses and built a telescope several times better than anything in Europe. He pointed it at the night sky and saw craters on the Moon, four moons orbiting Jupiter, and the phases of Venus. None of it fit the Earth-centered universe he had been taught. He published the observations in Sidereus Nuncius in 1610 and became the most public champion of Copernicus's heliocentric model.\n\nFor that stance the Roman Inquisition tried him in 1633 and sentenced him to house arrest, where he remained until his death in 1642. In those last years, blind and confined, he wrote Two New Sciences — the book that founded the study of motion and materials as quantitative, mathematical subjects.",
    contributions: [
      "discovered isochronism of the pendulum (1583)",
      "improved the telescope and observed Jupiter's moons (1610)",
      "documented the phases of Venus, confirming heliocentrism",
      "established the law of falling bodies",
      "founded the modern science of motion in Two New Sciences",
    ],
    majorWorks: [
      {
        title: "Sidereus Nuncius",
        year: "1610",
        description:
          "First published account of observations made through a telescope. Described lunar craters, the Milky Way as individual stars, and four moons orbiting Jupiter.",
      },
      {
        title: "Il Saggiatore",
        year: "1623",
        description:
          "A polemic on the nature of comets that became a manifesto for the scientific method. Contains Galileo's famous declaration that the book of nature is written in mathematics.",
      },
      {
        title: "Dialogue Concerning the Two Chief World Systems",
        year: "1632",
        description:
          "A conversation among three characters comparing the Ptolemaic and Copernican models. Its persuasive case for heliocentrism led directly to Galileo's trial by the Inquisition.",
      },
      {
        title: "Discourses and Mathematical Demonstrations Relating to Two New Sciences",
        year: "1638",
        description:
          "Galileo's final and most important book. Founded the sciences of materials strength and kinematics, deriving the parabolic trajectory of projectiles and the law of falling bodies.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "isaac-newton",
    name: "Isaac Newton",
    shortName: "Newton",
    born: "1642",
    died: "1727",
    nationality: "English",
    oneLiner:
      "Wrote three laws of motion and one of gravity, and explained almost everything.",
    image: storageUrl("physicists/isaac-newton.avif"),
    bio: "Isaac Newton was born on Christmas Day 1642 at Woolsthorpe Manor in Lincolnshire — the year Galileo died. His father had died three months before. His mother remarried when he was three and left him with his grandmother. He never forgave her for it.\n\nAt twelve he entered the King's School in Grantham, where he distinguished himself not through academics but by building sundials, windmill models, and mechanical contraptions. His mother pulled him out at seventeen to make him a farmer. He hated it. A sympathetic uncle persuaded her to send him back, and in June 1661 he arrived at Trinity College, Cambridge, as a subsizar — a student who earned his keep doing chores for wealthier ones.\n\nThen the plague came. In August 1665, Cambridge shut its doors, and Newton went home to Woolsthorpe for two years. What followed was, by any measure, the most productive stretch of thinking in the history of science. Alone in the countryside at twenty-three, he discovered the generalised binomial theorem, invented calculus, decomposed white light into a spectrum with a prism, and began the chain of reasoning that would become universal gravitation. He told no one.\n\nBack at Cambridge, he succeeded Isaac Barrow as Lucasian Professor of Mathematics in 1669, at twenty-six. He was a terrible teacher — his assistant Humphrey Newton noted he would cut lectures from thirty minutes to fifteen if the room was empty, then retreat to his experiments. Over his entire career he was assigned only three students.\n\nIn 1668 he built the first functional reflecting telescope — an eight-inch device that outperformed every refracting telescope in existence. He demonstrated it to the Royal Society in 1671, was elected Fellow in 1672, and published his theory of colour the same year. Robert Hooke attacked it publicly. Newton was so stung he withdrew from scientific debate for years.\n\nThe work that changed everything began with a short manuscript, De Motu Corporum in Gyrum, sent to Edmond Halley in 1684. Halley recognised its significance and urged Newton to expand it. The result, three years later, was the Philosophiæ Naturalis Principia Mathematica — the Mathematical Principles of Natural Philosophy. Published in 1687, the Principia laid out three laws of motion and a single law of universal gravitation: every mass attracts every other mass with a force proportional to their masses and inversely proportional to the square of the distance between them. From those few sentences Newton derived Kepler's three laws of planetary motion, explained the tides, predicted the trajectories of comets, described the precession of the equinoxes, inferred the oblate shape of the Earth, and provided the first quantitative estimate of the Sun's mass. The book was so dense with geometry that few contemporaries could follow it, but it unified terrestrial and celestial mechanics in one stroke — the first great unification in physics.\n\nIn 1704 he published Opticks, collecting decades of work on light, colour, refraction, and the interference patterns now called Newton's rings. Unlike the Principia, it was written in English and accessible to a wide audience.\n\nNewton's later decades were spent in London. He became Warden of the Royal Mint in 1696, then Master in 1699 — a post he held until his death, increasing the accuracy and security of British coinage. He served as president of the Royal Society from 1703 to 1727. He was knighted by Queen Anne in 1705. He served two terms as Member of Parliament for Cambridge University.\n\nHe also spent enormous energy on things most scientists ignore. He wrote more on alchemy than on physics. He devoted years to biblical chronology and privately rejected the doctrine of the Trinity — a heresy he kept carefully hidden from the Anglican establishment. His feud with Leibniz over the invention of calculus consumed the last two decades of his life and was conducted through proxies, accusations of plagiarism, and a Royal Society investigation that Newton himself secretly authored.\n\nHe died on 31 March 1727, aged eighty-four, and was buried in Westminster Abbey. Nothing in physics was quite the same after him — and nothing would be again until Einstein.",
    contributions: [
      "three laws of motion (Principia, 1687)",
      "universal law of gravitation (Principia, 1687)",
      "derived Kepler's three laws from an inverse-square force",
      "co-invented calculus (method of fluxions, 1665–1666)",
      "built the first reflecting telescope (1668)",
      "decomposed white light into a spectrum (1666)",
      "explained the tides, comets, and precession of the equinoxes",
      "published Opticks (1704) — colour theory and Newton's rings",
      "first theoretical calculation of the speed of sound",
      "formulated Newton's law of cooling",
      "first quantitative estimate of the Sun's mass",
      "generalised binomial theorem (1664–1665)",
    ],
    majorWorks: [
      {
        title: "Philosophiæ Naturalis Principia Mathematica",
        year: "1687",
        description:
          "Three laws of motion and universal gravitation. Derived Kepler's laws, explained tides, comets, precession, and the shape of the Earth. The foundation of classical mechanics.",
      },
      {
        title: "Opticks",
        year: "1704",
        description:
          "Light, colour, refraction, and interference. Demonstrated that colour is intrinsic to light, described Newton's rings, and theorised on the particle nature of light.",
      },
      {
        title: "De Motu Corporum in Gyrum",
        year: "1684",
        description:
          "Short manuscript on orbital mechanics sent to Edmond Halley. The seed that became the Principia.",
      },
      {
        title: "Method of Fluxions",
        year: "1671",
        description:
          "Newton's calculus notation system. Circulated in manuscript for decades before publication. Introduced polar coordinates in a strictly analytic sense.",
      },
      {
        title: "Arithmetica Universalis",
        year: "c. 1707",
        description:
          "Textbook on algebra compiled from Newton's Cambridge lecture notes. Established the method of substitution and elimination for solving simultaneous equations.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "christiaan-huygens",
    name: "Christiaan Huygens",
    shortName: "Huygens",
    born: "1629",
    died: "1695",
    nationality: "Dutch",
    oneLiner:
      "Built the first pendulum clock and turned a curiosity into a timekeeper.",
    image: storageUrl("physicists/christiaan-huygens.avif"),
    bio: "Christiaan Huygens was born in The Hague in 1629 into a wealthy and well-connected Dutch family. He trained as a mathematician, then spent his life moving between astronomy, mechanics, and optics with a quiet, almost obsessive precision. In 1656, building on Galileo's isochronism, he designed and constructed the first working pendulum clock. It was the most accurate timekeeper the world had ever seen, losing only about a minute a day where its predecessors lost a quarter of an hour. Within a decade, pendulum clocks were standard across Europe and the problem of finding longitude on land was essentially solved.\n\nIn parallel he ground his own telescope lenses, and in 1655 he discovered Titan, Saturn's largest moon. A few years later he correctly explained Saturn's strange appearance: the planet is encircled by a thin, flat ring. He published the wave theory of light in Traité de la Lumière in 1690, where he treated light as a disturbance propagating through a medium — an idea that would be eclipsed by Newton's corpuscles for a century before returning in triumph.\n\nHuygens died in 1695. He is one of the few figures in seventeenth-century science who belongs equally to mechanics, astronomy, and optics.",
    contributions: [
      "built the first pendulum clock (1656)",
      "wave theory of light (Traité de la Lumière, 1690)",
      "discovered Titan, Saturn's largest moon",
      "explained the rings of Saturn",
      "derived the formula for centripetal force",
    ],
    majorWorks: [
      {
        title: "Systema Saturnium",
        year: "1659",
        description:
          "The most important work on telescopic astronomy since Sidereus Nuncius. Correctly explained Saturn's ring system and provided refined measurements of planetary distances from the Sun.",
      },
      {
        title: "Horologium Oscillatorium",
        year: "1673",
        description:
          "One of the three landmark works on mechanics in the seventeenth century. Presented pendulum clock designs, solved the tautochrone problem, developed the theory of evolutes, and derived centripetal force.",
      },
      {
        title: "Traité de la Lumière",
        year: "1690",
        description:
          "Set out the wave theory of light, treating it as a disturbance propagating through a medium. Explained reflection and refraction, and derived the law of double refraction in Iceland spar.",
      },
      {
        title: "Cosmotheoros",
        year: "1698",
        description:
          "Published posthumously. Speculated on the possibility of extraterrestrial life and described the physical conditions on other planets, making it one of the earliest works of popular astronomy.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "leon-foucault",
    name: "Léon Foucault",
    shortName: "Foucault",
    born: "1819",
    died: "1868",
    nationality: "French",
    oneLiner:
      "Hung a pendulum in the Panthéon and made the Earth's rotation visible.",
    image: storageUrl("physicists/leon-foucault.avif"),
    bio: "Léon Foucault was born in Paris in 1819 and trained as a physician before abandoning medicine for experimental physics. He had a gift for building instruments that made invisible things visible. In 1851 he suspended a 28-kilogram brass bob on a 67-metre wire from the dome of the Panthéon in Paris and set it swinging. As the hours passed, the plane of the swing slowly rotated relative to the floor — not because the pendulum was turning, but because the Earth underneath it was. For the first time, anyone who walked in off the street could watch the planet rotate beneath their feet.\n\nThe following year Foucault built the first gyroscope and used it to demonstrate the same rotation in a different way. He also invented a method for measuring the speed of light in the laboratory, using a rotating mirror, and showed that light travels more slowly through water than through air — a result that damaged Newton's corpuscular theory and helped restore Huygens's wave picture.\n\nFoucault died in 1868, not yet fifty, from what was probably multiple sclerosis. His pendulum still hangs in museums around the world.",
    contributions: [
      "Foucault pendulum demonstration of Earth's rotation (1851)",
      "invented the gyroscope (1852)",
      "measured the speed of light with a rotating mirror",
      "showed light travels slower in water than in air",
      "developed the Foucault knife-edge test for telescope mirrors",
    ],
    majorWorks: [
      {
        title:
          "Démonstration physique du mouvement de rotation de la terre au moyen du pendule",
        year: "1851",
        description:
          "Published in Comptes rendus de l'Académie des Sciences. Described the Panthéon pendulum experiment that provided the first simple, direct proof of the Earth's rotation.",
      },
      {
        title:
          "Sur les vitesses relatives de la lumière dans l'air et dans l'eau",
        year: "1850",
        description:
          "Showed that light travels more slowly in water than in air using the rotating-mirror method, delivering a decisive blow to Newton's corpuscular theory of light.",
      },
      {
        title:
          "Détermination expérimentale de la vitesse de la lumière: parallaxe du Soleil",
        year: "1862",
        description:
          "Used an improved rotating-mirror apparatus to measure the speed of light in air at 298 000 km/s, within 0.6% of the modern value, and derived a new estimate of the solar parallax.",
      },
      {
        title:
          "Sur les phénomènes d'orientation des corps tournants entraînés par un axe fixe à la surface de la terre",
        year: "1852",
        description:
          "Introduced and named the gyroscope, demonstrating Earth's rotation by a conceptually simpler method than the pendulum.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "johannes-kepler",
    name: "Johannes Kepler",
    shortName: "Kepler",
    born: "1571",
    died: "1630",
    nationality: "German",
    oneLiner:
      "Gave up on circles after eight years and found that orbits are ellipses.",
    image: storageUrl("physicists/johannes-kepler.avif"),
    bio: "Johannes Kepler was born in 1571 in the small German town of Weil der Stadt, to a mercenary father who vanished early and a mother later accused of witchcraft. Sickly, half-blind, and deeply religious, he trained in theology before drifting into astronomy. In 1600 he joined Tycho Brahe in Prague as an assistant, and when Tycho died a year later Kepler inherited his unmatched set of planetary observations.\n\nWhat followed was one of the most remarkable acts of calculation in the history of science. Kepler spent eight years trying to fit Tycho's observations of Mars to a circular orbit. Nothing worked. He tried ovals, egg shapes, every curve he could think of. In 1609 he finally let go of the two assumptions that had ruled astronomy for fifteen centuries — that orbits are circles and that planets move at constant speed — and wrote down the first two laws of planetary motion. A decade later he added the third. The three laws together — orbits are ellipses, equal areas in equal times, and the square of the period is proportional to the cube of the semi-major axis — gave the solar system its first honest mathematical description.\n\nKepler died in 1630, still chasing a harmony he believed God had hidden in the numbers. Newton's laws eventually explained why his rules held, but the rules themselves were Kepler's.",
    contributions: [
      "three laws of planetary motion (1609, 1619)",
      "derived elliptical orbits from Tycho Brahe's Mars data",
      "wrote Astronomia Nova and Harmonices Mundi",
      "improved Galileo's telescope design (Keplerian telescope)",
      "laid the empirical foundation for Newton's gravitation",
    ],
    majorWorks: [
      {
        title: "Mysterium Cosmographicum",
        year: "1596",
        description:
          "Kepler's first major work, proposing that the spacing of the six known planets could be explained by the five Platonic solids nested between their orbital spheres. Wrong in detail, but it established his reputation and led him to Tycho Brahe.",
      },
      {
        title: "Astronomia Nova",
        year: "1609",
        description:
          "The result of ten years of work on Tycho's Mars observations. Introduced the first two laws of planetary motion — elliptical orbits and equal areas in equal times — and demolished the ancient assumption of uniform circular motion.",
      },
      {
        title: "Harmonices Mundi",
        year: "1619",
        description:
          "An ambitious search for geometric harmony in the cosmos. Contains the third law of planetary motion: the square of a planet's orbital period is proportional to the cube of its semi-major axis.",
      },
      {
        title: "Epitome Astronomiae Copernicanae",
        year: "1618–1621",
        description:
          "A three-volume textbook extending all three laws of planetary motion to every known planet and the Moon. Became the most widely read work of Copernican astronomy in the seventeenth century.",
      },
      {
        title: "Tabulae Rudolphinae",
        year: "1627",
        description:
          "Planetary tables computed from Tycho Brahe's observations and Kepler's elliptical astronomy. Their superior accuracy over all predecessors proved the practical value of the new orbital mechanics.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "tycho-brahe",
    name: "Tycho Brahe",
    shortName: "Tycho",
    born: "1546",
    died: "1601",
    nationality: "Danish",
    oneLiner:
      "Measured the sky by naked eye more accurately than anyone ever would again.",
    image: storageUrl("physicists/tycho-brahe.avif"),
    bio: "Tycho Brahe was born in 1546 into the Danish nobility. He lost part of his nose in a duel as a young man and wore a metal prosthetic for the rest of his life. In 1572 he observed a new star — a supernova — in the constellation Cassiopeia, and showed that it lay far beyond the Moon, in a region of the heavens that Aristotle had insisted must be unchanging. It was a direct blow to the ancient cosmos.\n\nThe Danish king was impressed enough to give Tycho the island of Hven and the money to build Uraniborg, the most expensive scientific instrument of the sixteenth century. For twenty years, Tycho and his assistants used massive mural quadrants and sextants to measure the positions of stars and planets with a precision no one had ever achieved and no one would match without a telescope. His measurements of Mars, in particular, were accurate to about one arcminute — good enough to break the ancient circular-orbit model once someone thought to look closely.\n\nThat someone was Johannes Kepler, who joined Tycho in Prague in 1600. When Tycho died the following year — famously and probably falsely, of a burst bladder at a banquet — Kepler inherited his data and turned it into the laws of planetary motion. The telescope age began a decade later, but nothing in it would have been possible without Tycho's naked eye.",
    contributions: [
      "most accurate pre-telescope astronomical observations in history",
      "built the Uraniborg observatory on Hven",
      "observed the 1572 supernova and proved it was beyond the Moon",
      "showed comets are celestial, not atmospheric, objects",
      "left the data set that enabled Kepler's laws",
    ],
    majorWorks: [
      {
        title: "De Nova Stella",
        year: "1573",
        description:
          "Tycho's analysis of the 1572 supernova in Cassiopeia, proving through parallax measurements that the new star lay far beyond the Moon. A direct challenge to the Aristotelian doctrine of an unchanging celestial sphere.",
      },
      {
        title: "De Mundi Aetherei Recentioribus Phaenomenis",
        year: "1588",
        description:
          "A study of the great comet of 1577, demonstrating that it moved through the planetary region rather than the atmosphere. Also introduced the Tychonic system, a geo-heliocentric model placing the Sun in orbit around the Earth while the other planets orbit the Sun.",
      },
      {
        title: "Astronomiae Instauratae Mechanica",
        year: "1598",
        description:
          "A lavishly illustrated catalogue of the instruments at Uraniborg and Stjerneborg. Described the design and use of Tycho's mural quadrants, armillary spheres, and sextants in unprecedented technical detail.",
      },
      {
        title: "Astronomiae Instauratae Progymnasmata",
        year: "1602",
        description:
          "Published posthumously by Kepler. A comprehensive treatise on the 1572 supernova and a revised star catalogue of over 1,000 stars, the most accurate before the telescope era.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "claudius-ptolemy",
    name: "Claudius Ptolemy",
    shortName: "Ptolemy",
    born: "c. 100",
    died: "c. 170",
    nationality: "Greco-Roman",
    oneLiner:
      "Put the Earth at the center of the universe and got away with it for fifteen centuries.",
    image: storageUrl("physicists/claudius-ptolemy.avif"),
    bio: "Claudius Ptolemy lived in Alexandria in the second century of the common era, under Roman rule. Almost nothing is known about his life. What survives is his work — above all the Almagest, a thirteen-book treatise on astronomy that systematized everything the Greek world knew about the heavens and added a great deal of his own measurement and calculation.\n\nThe Almagest set out a geocentric cosmos in which the Earth sits motionless at the center and the Sun, Moon, and planets move around it on combinations of circles — deferents and epicycles — tuned to match the observed motions as precisely as possible. The scheme was mathematically ingenious. It predicted planetary positions well enough to remain the standard reference for astronomers in the Islamic world and medieval Europe for more than fourteen hundred years. Copernicus knew the Almagest intimately; so did Kepler and Galileo.\n\nPtolemy also wrote a Geography that shaped European maps through the Renaissance, and an astrological textbook, the Tetrabiblos, that was still being reprinted in the nineteenth century. His model of the universe was wrong, but it was the wrong model that taught Europe how to calculate.",
    contributions: [
      "wrote the Almagest, the dominant astronomy text for 1500 years",
      "geocentric model with deferents and epicycles",
      "catalogued over 1000 stars",
      "Geography and early world maps with latitude and longitude",
      "Tetrabiblos, the standard treatise on astrology",
    ],
    majorWorks: [
      {
        title: "Almagest (Mathēmatikē Syntaxis)",
        year: "c. 150",
        description:
          "Thirteen-book treatise on astronomy that presented a geocentric model of the universe using deferents and epicycles. Catalogued over 1,000 stars and remained the authoritative astronomical reference for more than 1,400 years.",
      },
      {
        title: "Geography (Geographia)",
        year: "c. 150",
        description:
          "A gazetteer, atlas, and treatise on cartography compiling the geographic knowledge of the Greco-Roman world. Introduced a coordinate system of latitude and longitude and shaped European mapmaking through the Renaissance.",
      },
      {
        title: "Tetrabiblos",
        year: "c. 150",
        description:
          "Four-book treatise on astrology that attempted to place horoscopic practice on an Aristotelian natural-philosophical foundation. Remained the standard astrological text in Europe and the Islamic world for centuries.",
      },
      {
        title: "Planetary Hypotheses",
        year: "c. 150\u2013170",
        description:
          "Went beyond the mathematical models of the Almagest to present a physical realization of the cosmos as a set of nested spheres, estimating the dimensions of the planetary system.",
      },
      {
        title: "Optics",
        year: "c. 160",
        description:
          "Treatise on geometrical optics covering reflection, refraction, and colour. Contains the earliest surviving table of refraction from air to water and influenced Ibn al-Haytham's later Book of Optics.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "nicolaus-copernicus",
    name: "Nicolaus Copernicus",
    shortName: "Copernicus",
    born: "1473",
    died: "1543",
    nationality: "Polish",
    oneLiner:
      "Moved the Earth out of the center of the universe, and kept the circles.",
    image: storageUrl("physicists/nicolaus-copernicus.avif"),
    bio: "Nicolaus Copernicus was born in 1473 in the Polish city of Toruń. He trained in canon law, medicine, and mathematics at universities in Kraków, Bologna, and Padua, and spent most of his adult life as a church administrator in the cathedral chapter at Frombork. Astronomy was a private obsession that he worked on for decades before publishing.\n\nHis book De revolutionibus orbium coelestium appeared in 1543, the year he died. In it he proposed that the Sun, not the Earth, sits at the center of the universe, with the Earth and the other planets moving around it. The idea was not entirely new — some Greek astronomers had suggested it — but Copernicus was the first to work out a full mathematical model. He kept one ancient assumption that would turn out to be wrong: that the orbits are circles. To match the observed motions, he still needed epicycles, though fewer than Ptolemy.\n\nThe heliocentric picture took another century to win out. Galileo's telescope, Kepler's ellipses, and Newton's gravity did the heavy lifting. But the starting point — the move that made the rest possible — was Copernicus's decision to let the Earth be just another planet.",
    contributions: [
      "heliocentric model of the solar system (De revolutionibus, 1543)",
      "gave the Earth a rotational and orbital motion",
      "reduced the number of epicycles needed to fit observations",
      "estimated the order and relative distances of the planets",
      "inspired Kepler, Galileo, and Newton",
    ],
    majorWorks: [
      {
        title: "De revolutionibus orbium coelestium",
        year: "1543",
        description:
          "Six-book treatise proposing a heliocentric model of the universe with the Sun at the center and the Earth as a rotating planet in orbit around it. The founding document of the Copernican Revolution.",
      },
      {
        title: "Commentariolus",
        year: "c. 1514",
        description:
          "Short anonymous manuscript circulated privately among a few friends, outlining the heliocentric hypothesis in seven axioms. The earliest written statement of Copernicus's new cosmology.",
      },
      {
        title: "Monetae cudendae ratio",
        year: "1526",
        description:
          "A treatise on coinage presented to the Prussian Diet at the request of King Sigismund I. Distinguished between the use value and exchange value of commodities, anticipating concepts later developed by Adam Smith.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "urbain-le-verrier",
    name: "Urbain Le Verrier",
    shortName: "Le Verrier",
    born: "1811",
    died: "1877",
    nationality: "French",
    oneLiner:
      "Found a new planet with pen and paper before anyone pointed a telescope at it.",
    image: storageUrl("physicists/urbain-le-verrier.avif"),
    bio: "Urbain Le Verrier was born in Normandy in 1811 and trained as a chemist before switching to celestial mechanics at the Paris Observatory. He was a superb calculator and a difficult colleague. In the 1840s he set out to explain the motion of Uranus, which had been drifting away from its predicted orbit for decades in a way that Newtonian gravity could not account for — unless another, unseen planet was tugging on it.\n\nLe Verrier worked out where that planet would have to be. In September 1846 he sent his coordinates to Johann Galle at the Berlin Observatory. Galle pointed his telescope at the predicted spot that same night and found Neptune, within a degree of Le Verrier's prediction. It was the most spectacular confirmation of Newtonian mechanics ever performed. A planet had been discovered by mathematics.\n\nLe Verrier went on to direct the Paris Observatory and to study the perihelion of Mercury, which also drifts in a way Newton's laws cannot quite explain. He assumed there must be another unseen planet — he called it Vulcan — but this time he was wrong. The Mercury anomaly would wait for Einstein's general relativity to be resolved in 1915.",
    contributions: [
      "predicted Neptune's position from perturbations in Uranus's orbit (1846)",
      "directed the Paris Observatory",
      "identified the anomalous precession of Mercury's perihelion",
      "built tables of planetary motion used for decades",
    ],
    majorWorks: [
      {
        title: "Recherches sur les mouvements de la planète Herschel (dite Uranus)",
        year: "1846",
        description:
          "A 254-page memoir predicting the position of an unseen planet perturbing Uranus. Johann Galle found Neptune within one degree of Le Verrier's coordinates the night he received the letter.",
      },
      {
        title:
          "Détermination nouvelle de l'orbite de Mercure et de ses perturbations",
        year: "1843",
        description:
          "Le Verrier's first major work on Mercury's orbit. Laid the groundwork for his later discovery that Mercury's perihelion precesses faster than Newtonian mechanics can explain.",
      },
      {
        title:
          "Théorie du mouvement de Mercure",
        year: "1859",
        description:
          "Reported the anomalous advance of Mercury's perihelion — 38 arc-seconds per century unaccounted for by known planets. The discrepancy was not resolved until Einstein's general relativity in 1915.",
      },
      {
        title: "Tables du Soleil, de la Lune et des planètes",
        year: "1858",
        description:
          "Comprehensive tables of planetary motion that became the standard reference for French and international ephemerides for the rest of the nineteenth century.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
];

export function getPhysicist(slug: string): Physicist | undefined {
  return PHYSICISTS.find((p) => p.slug === slug);
}

export function getAllPhysicists(): readonly Physicist[] {
  return PHYSICISTS;
}
