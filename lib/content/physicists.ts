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
  {
    slug: "pierre-bouguer",
    name: "Pierre Bouguer",
    shortName: "Bouguer",
    born: "1698",
    died: "1758",
    nationality: "French",
    oneLiner:
      "Took pendulums up the Andes and measured how gravity changes with altitude.",
    image: storageUrl("physicists/pierre-bouguer.avif"),
    bio: "Pierre Bouguer was born in 1698 in Le Croisic, Brittany, the son of a royal hydrographer. He showed mathematical ability early: when his father died in 1714, the sixteen-year-old was appointed to succeed him as professor of hydrography. He won prizes from the Académie des Sciences for work on ship masting and the observation of stars near the horizon, and was elected to the Académie in 1731.\n\nIn 1735 the Académie sent two expeditions to measure the shape of the Earth — one to Lapland, one to the equator. Bouguer joined the equatorial mission to Peru (modern Ecuador), led by Charles Marie de La Condamine. The expedition lasted nearly a decade and was plagued by illness, disputes, and the murder of one member. Despite the difficulties, Bouguer made the first systematic gravity measurements at different altitudes, swinging pendulums at sea level and on the slopes of Chimborazo and Pichincha. He found that gravity decreased with altitude, as expected, but by less than a simple inverse-square law would predict — because the mass of the mountain beneath him was pulling upward. The correction he devised, now called the Bouguer anomaly, remains a standard tool in geophysics and mineral exploration.\n\nBouguer also founded photometry. His Essai d'optique sur la gradation de la lumière (1729) was the first work to measure the intensity of light quantitatively. He established that light attenuates exponentially as it passes through a transparent medium — the law now known as the Beer-Bouguer law (or Beer-Lambert law). He invented the first photometer and used it to compare the brightness of the Sun and Moon. These measurements made him the first person to put numbers on how bright things are.",
    contributions: [
      "founded photometry and invented the first photometer (1729)",
      "established the exponential attenuation of light (Beer-Bouguer law)",
      "first systematic gravity measurements at altitude using pendulums",
      "Bouguer anomaly — gravity correction for terrain mass",
      "measured the gravitational attraction of mountains",
    ],
    majorWorks: [
      {
        title: "Essai d'optique sur la gradation de la lumière",
        year: "1729",
        description:
          "The founding work of photometry. Established the exponential law of light absorption in transparent media and introduced methods for comparing the brightness of celestial bodies.",
      },
      {
        title: "La Figure de la Terre",
        year: "1749",
        description:
          "Account of the geodesic expedition to Peru, including Bouguer's gravity measurements at different altitudes, the deflection of a plumb line near mountains, and the first formulation of what is now the Bouguer anomaly.",
      },
      {
        title: "Traité du navire, de sa construction et de ses mouvemens",
        year: "1746",
        description:
          "A comprehensive treatise on naval architecture and ship stability. Introduced the concept of the metacenter — the point that determines whether a ship will right itself or capsize — laying the foundations of naval engineering.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "adrien-marie-legendre",
    name: "Adrien-Marie Legendre",
    shortName: "Legendre",
    born: "1752",
    died: "1833",
    nationality: "French",
    oneLiner:
      "Classified the integrals that no one could solve and gave them his name.",
    image: storageUrl("physicists/adrien-marie-legendre.avif"),
    bio: "Adrien-Marie Legendre was born in Paris in 1752 into a wealthy family and studied at the Collège Mazarin, where he was taught by the abbé Joseph-François Marie. He showed early talent in mathematics and physics, and by his mid-twenties was teaching at the École Militaire.\n\nLegendre's most lasting contribution is his systematic study of elliptic integrals — the integrals that arise whenever you try to compute the arc length of an ellipse, the exact period of a pendulum at finite amplitude, or the motion of a body under a central force that is not exactly inverse-square. These integrals cannot be expressed in terms of elementary functions, and before Legendre no one had organised them. Over forty years he classified them into three canonical forms (now called elliptic integrals of the first, second, and third kind), computed extensive numerical tables, and developed reduction formulas that let any elliptic integral be expressed in terms of the canonical three. His three-volume Traité des fonctions elliptiques (1825-1828) was the definitive reference until Abel and Jacobi inverted the problem and created the theory of elliptic functions.\n\nLegendre also introduced the Legendre polynomials — solutions to Laplace's equation in spherical coordinates — which are indispensable in electrostatics, gravitational theory, and quantum mechanics. He made foundational contributions to number theory, including the law of quadratic reciprocity (which he conjectured and partially proved before Gauss gave the first complete proof). In 1805 he published the first clear statement of the method of least squares for fitting data, a technique that remains the backbone of experimental science and statistics.\n\nHe lost his fortune in the French Revolution and his pension under the Restoration, but continued working into his late seventies. He died in Paris in 1833, largely eclipsed by younger rivals but having built the tools they all used.",
    contributions: [
      "classified elliptic integrals into three canonical forms",
      "introduced Legendre polynomials for spherical problems",
      "first published the method of least squares (1805)",
      "contributions to number theory and quadratic reciprocity",
      "extensive numerical tables of elliptic integrals",
    ],
    majorWorks: [
      {
        title: "Traité des fonctions elliptiques",
        year: "1825–1828",
        description:
          "Three-volume treatise that systematically classified elliptic integrals into three canonical forms and provided reduction formulas and numerical tables. The definitive reference on the subject until the work of Abel and Jacobi.",
      },
      {
        title: "Essai sur la théorie des nombres",
        year: "1798",
        description:
          "The first textbook devoted entirely to number theory. Stated the law of quadratic reciprocity, introduced the Legendre symbol, and conjectured the prime number theorem.",
      },
      {
        title: "Nouvelles méthodes pour la détermination des orbites des comètes",
        year: "1805",
        description:
          "Contained the first published account of the method of least squares, applied to the problem of fitting orbital data. The technique became fundamental to all experimental science.",
      },
      {
        title: "Exercices de calcul intégral",
        year: "1811–1817",
        description:
          "Three volumes developing the theory of elliptic integrals and Euler integrals (beta and gamma functions). Introduced much of the notation and classification still used today.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "nikola-tesla",
    name: "Nikola Tesla",
    shortName: "Tesla",
    born: "1856",
    died: "1943",
    nationality: "Serbian-American",
    oneLiner:
      "Harnessed alternating current and made resonance light up the world.",
    image: storageUrl("physicists/nikola-tesla.avif"),
    bio: "Nikola Tesla was born in 1856 in Smiljan, in the Military Frontier of the Austrian Empire (modern Croatia), the son of a Serbian Orthodox priest. He studied engineering in Graz and physics in Prague, then worked for the Continental Edison Company in Paris before emigrating to the United States in 1884 with four cents in his pocket and a letter of introduction to Thomas Edison.\n\nTesla's central insight was that alternating current — current that reverses direction many times per second — could be generated, transmitted, and converted to mechanical work far more efficiently than Edison's direct current. In 1887-1888 he designed the polyphase AC induction motor and the system of generators, transformers, and transmission lines needed to deliver AC power over long distances. George Westinghouse bought his patents, and the ensuing 'War of Currents' against Edison ended decisively in AC's favour when Westinghouse and Tesla lit the 1893 World's Columbian Exposition in Chicago and built the first large-scale hydroelectric plant at Niagara Falls in 1895.\n\nTesla was obsessed with resonance. His Tesla coil — a resonant transformer circuit invented in 1891 — produced spectacular high-voltage, high-frequency discharges and became the basis for early radio transmission, neon lighting, and X-ray imaging. He understood that every electrical and mechanical system has a natural frequency, and that driving it at that frequency could produce enormous amplification. He claimed, probably with some exaggeration, to have cracked the plaster of buildings near his Houston Street laboratory by tuning a small mechanical oscillator to the building's resonant frequency.\n\nIn his later years Tesla grew increasingly isolated. He announced plans for a wireless energy transmission system, a particle-beam weapon, and other inventions that he never completed. He died alone in a New York hotel room in January 1943. The SI unit of magnetic flux density — the tesla — bears his name.",
    contributions: [
      "polyphase alternating current power system",
      "AC induction motor (1887-1888)",
      "Tesla coil — resonant transformer for high-voltage, high-frequency current (1891)",
      "pioneering work in radio transmission",
      "rotating magnetic field principle",
    ],
    majorWorks: [
      {
        title: "A New System of Alternate Current Motors and Transformers",
        year: "1888",
        description:
          "Lecture delivered to the American Institute of Electrical Engineers presenting the polyphase AC induction motor and the complete system for AC power generation and distribution. The paper that launched the AC revolution.",
      },
      {
        title: "Experiments with Alternate Currents of High Potential and High Frequency",
        year: "1892",
        description:
          "Lecture delivered in London and Paris demonstrating the Tesla coil and wireless energy transfer. Showed phosphorescent lighting, high-frequency heating, and resonant circuits to packed audiences of scientists.",
      },
      {
        title: "On Light and Other High Frequency Phenomena",
        year: "1893",
        description:
          "Lecture to the Franklin Institute describing experiments with high-frequency currents, wireless transmission, and the relationship between electromagnetic waves and light. Anticipated several developments in radio technology.",
      },
      {
        title: "Colorado Springs Notes, 1899-1900",
        year: "1899–1900",
        description:
          "Laboratory journal from Tesla's experiments in Colorado Springs, where he built the largest Tesla coil ever constructed, produced artificial lightning, and claimed to detect signals from other planets. Published posthumously in 1978.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "jules-lissajous",
    name: "Jules Antoine Lissajous",
    shortName: "Lissajous",
    born: "1822",
    died: "1880",
    nationality: "French",
    oneLiner:
      "Pointed light at vibrating mirrors and drew the curves that bear his name.",
    image: storageUrl("physicists/jules-lissajous.avif"),
    bio: "Jules Antoine Lissajous was born in Versailles in 1822 and studied at the École Normale Supérieure in Paris. He spent his career as a professor of physics in Paris, first at the Lycée Saint-Louis and later at other institutions, working primarily on acoustics and the physics of vibration.\n\nLissajous's principal contribution was the development of an optical method for studying vibrations. In 1855 he attached small mirrors to the prongs of tuning forks, bounced a beam of light off them, and projected the result onto a screen. When two forks vibrate at right angles, the reflected spot traces out the looping, interlocking curves now called Lissajous figures. The shape of the curve depends on the ratio of the two frequencies and their relative phase: a 1:1 ratio produces an ellipse, 1:2 produces a figure-eight, and more complex ratios produce increasingly intricate but perfectly regular patterns.\n\nThe method was more than a visual curiosity. Before electronic instruments existed, Lissajous figures provided the most precise way to compare frequencies. If the two tuning forks are slightly detuned, the figure slowly rotates or deforms, making even small frequency differences visible. This technique was used for decades in acoustics laboratories and instrument calibration. The same mathematics describes any pair of coupled oscillations — two pendulums, two electrical circuits, two modes of a vibrating plate — and Lissajous figures remain a standard diagnostic tool on oscilloscopes.\n\nLissajous was awarded the Lacaze Prize by the Académie des Sciences in 1873 for his work on the optical observation of vibrations. He died in Plombières-les-Bains in 1880. His figures appear in every physics textbook that covers oscillations, and the mathematics behind them — superposition of sinusoidal motions at right angles — is one of the cleanest illustrations of how simple ingredients produce complex, beautiful patterns.",
    contributions: [
      "invented optical method for visualising vibrations using mirrors on tuning forks (1855)",
      "Lissajous figures — curves from superposition of perpendicular oscillations",
      "precision frequency comparison technique used before electronic instruments",
      "contributions to experimental acoustics",
    ],
    majorWorks: [
      {
        title: "Mémoire sur l'étude optique des mouvements vibratoires",
        year: "1857",
        description:
          "Presented to the Académie des Sciences. Described the mirror-and-tuning-fork apparatus for producing Lissajous figures and demonstrated how frequency ratios and phase differences determine the shape of the resulting curves.",
      },
      {
        title: "Sur la position des nœuds dans les lames qui vibrent transversalement",
        year: "1850",
        description:
          "Lissajous's doctoral thesis on the transverse vibration of bars. Studied the positions of nodal lines and laid the groundwork for his later optical methods.",
      },
      {
        title: "Note sur un moyen nouveau de mettre en évidence le mouvement vibratoire des corps",
        year: "1855",
        description:
          "First public description of the optical method for observing vibrations. Demonstrated that a beam of light reflected from a vibrating mirror traces the waveform of the vibration on a distant screen.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "henry-cavendish",
    name: "Henry Cavendish",
    shortName: "Cavendish",
    born: "1731",
    died: "1810",
    nationality: "British",
    oneLiner:
      "Weighed the Earth in his garden shed with a torsion balance and two lead balls.",
    image: storageUrl("physicists/henry-cavendish.avif"),
    bio: "Henry Cavendish was born into one of England's wealthiest aristocratic families and spent his entire fortune on science. Painfully shy — contemporary accounts describe him as barely able to speak to anyone, especially women — he communicated almost entirely through written notes, even with servants in his own house.\n\nDespite his reclusiveness, Cavendish was one of the most precise experimenters who ever lived. In 1798, at the age of 67, he performed what is now called the Cavendish experiment: using a torsion balance designed by John Michell (who died before completing the work), he measured the tiny gravitational attraction between lead spheres. The apparatus was so sensitive that he had to observe it by telescope through a window to avoid disturbing it with his body heat.\n\nFrom the measured force, the known masses, and the geometry, Cavendish extracted the density of the Earth — 5.448 times that of water, remarkably close to the modern value of 5.515. This was equivalent to determining the gravitational constant G, though Cavendish himself never expressed it that way. With G and the known value of surface gravity g, Newton's law gives Earth's mass: M = gR²/G. The man who weighed the Earth did it with lead balls, a wire, and extraordinary patience.\n\nCavendish also independently discovered what we now call Coulomb's law of electrostatics, Ohm's law of resistance, Richter's law of chemical equivalents, and the composition of water — but published almost none of it. His unpublished papers, edited by Maxwell a century later, revealed decades of discoveries that others would eventually rediscover and receive credit for.",
    contributions: [
      "measured the gravitational constant G (Cavendish experiment, 1798)",
      "determined the density of the Earth to within 1% of the modern value",
      "independently discovered Coulomb's law of electrostatics",
      "determined the composition of water and atmospheric air",
      "pioneered precise electrical measurements decades before Ohm and Faraday",
    ],
    majorWorks: [
      {
        title: "Experiments to Determine the Density of the Earth",
        year: "1798",
        description:
          "Published in Philosophical Transactions, this paper described the torsion balance experiment that measured the gravitational attraction between known masses. The result — Earth's mean density is 5.448 times that of water — was the first precise determination of a fundamental constant of nature.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "universal-gravitation" },
    ],
  },
  {
    slug: "joseph-louis-lagrange",
    name: "Joseph-Louis Lagrange",
    shortName: "Lagrange",
    born: "1736",
    died: "1813",
    nationality: "Italian-French",
    oneLiner:
      "Rewrote mechanics without a single diagram and found the five points where gravity stands still.",
    image: storageUrl("physicists/joseph-louis-lagrange.avif"),
    bio: "Giuseppe Luigi Lagrangia — later Joseph-Louis Lagrange — was born in Turin and spent his career in Berlin and Paris, becoming one of the greatest mathematicians in history. His masterwork, Mécanique analytique (1788), reformulated all of Newtonian mechanics using pure algebra and calculus, without a single geometric figure. He was reportedly proud of this: the preface announces that the reader will find no diagrams in the entire book.\n\nLagrange's reformulation replaced Newton's forces with a single scalar function — the Lagrangian L = T − V (kinetic minus potential energy) — and derived all equations of motion from a variational principle: the true path between two points is the one that makes the action integral stationary. This approach handles constraints, curved coordinates, and coupled systems with an elegance that Newton's vector forces cannot match.\n\nIn 1772, while studying the three-body problem, Lagrange discovered that there are exactly five points (now called Lagrange points) where a small body can remain in equilibrium relative to two larger orbiting bodies. Three lie on the line connecting the two bodies; two form equilateral triangles. The triangular points (L4 and L5) are stable — a prediction confirmed in 1906 when the first Trojan asteroid was discovered at Jupiter's L4 point.\n\nLagrange survived the French Revolution (unlike his friend Lavoisier), served on the commission that created the metric system, and taught at the École Polytechnique until his death in 1813. His analytical mechanics remains the foundation of theoretical physics: every path from classical mechanics to quantum field theory passes through the Lagrangian.",
    contributions: [
      "reformulated mechanics using the Lagrangian L = T − V (Mécanique analytique, 1788)",
      "discovered the five Lagrange points in the three-body problem (1772)",
      "developed the calculus of variations",
      "contributed to number theory (Lagrange's four-square theorem)",
      "helped create the metric system during the French Revolution",
    ],
    majorWorks: [
      {
        title: "Mécanique analytique",
        year: "1788",
        description:
          "The first comprehensive treatise on mechanics using purely analytical methods. Replaced geometric reasoning with the calculus of variations and introduced generalised coordinates, transforming mechanics from a branch of geometry into a branch of analysis.",
      },
      {
        title: "Essai sur le problème des trois corps",
        year: "1772",
        description:
          "Analytical treatment of the restricted three-body problem. Discovered the five equilibrium points (Lagrange points) and proved the stability of the triangular points L4 and L5.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "henri-poincare",
    name: "Henri Poincaré",
    shortName: "Poincaré",
    born: "1854",
    died: "1912",
    nationality: "French",
    oneLiner:
      "Tried to solve the three-body problem, failed, and discovered chaos instead.",
    image: storageUrl("physicists/henri-poincare.avif"),
    bio: "Jules Henri Poincaré was the last mathematician who could claim mastery of the entire field. He made foundational contributions to topology, complex analysis, celestial mechanics, number theory, and the philosophy of science — often creating entirely new branches of mathematics to solve the problems he encountered.\n\nIn 1887, King Oscar II of Sweden offered a prize for a solution to the n-body problem: prove that the solar system is stable. Poincaré submitted a brilliant memoir on the restricted three-body problem. He proved that no general closed-form solution exists, but went further: he showed that certain orbits exhibit what we now call sensitive dependence on initial conditions — infinitesimally close starting points diverge exponentially. This was the birth of chaos theory, though the word would not be coined for another eighty years.\n\nThe story has a famous twist: Poincaré's original prize-winning memoir contained an error. When his colleague Lars Edvard Phragmén found it during preparation for publication, Poincaré realised the error was more interesting than the original result. The corrected version — which he paid to have reprinted at a cost exceeding the prize money — contained the first description of homoclinic tangles, the geometric structures that make chaotic systems chaotic.\n\nPoincaré also came within a whisker of special relativity (deriving the Lorentz transformations independently of Einstein), laid the groundwork for algebraic topology, and wrote popular science books that are still read today. He died suddenly in 1912 at the height of his powers.",
    contributions: [
      "discovered deterministic chaos in the three-body problem (1890)",
      "founded algebraic topology (Analysis Situs, 1895)",
      "independently derived the Lorentz transformations (1905)",
      "proved the non-existence of general solutions to the three-body problem",
      "introduced the concept of homoclinic orbits and their tangles",
    ],
    majorWorks: [
      {
        title: "Les méthodes nouvelles de la mécanique céleste",
        year: "1892–1899",
        description:
          "Three-volume treatise on celestial mechanics. Introduced qualitative methods for studying differential equations, discovered homoclinic orbits, and laid the mathematical foundations for chaos theory.",
      },
      {
        title: "Sur le problème des trois corps et les équations de la dynamique",
        year: "1890",
        description:
          "The corrected prize memoir for King Oscar II. Demonstrated sensitive dependence on initial conditions in the restricted three-body problem — the first rigorous result in what would become chaos theory.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "nicole-oresme",
    name: "Nicole Oresme",
    shortName: "Oresme",
    born: "c. 1320",
    died: "1382",
    nationality: "French",
    oneLiner:
      "Drew the first graph of motion three centuries before anyone else thought to.",
    image: storageUrl("physicists/nicole-oresme.avif"),
    bio: "Nicole Oresme was born in Normandy around 1320 and educated at the University of Paris, where he later became a master of theology and eventually bishop of Lisieux. He spent most of his life as a churchman and royal counsellor to Charles V of France, for whom he translated Aristotle's Ethics, Politics, and On the Heavens into Middle French — inventing new vocabulary as he went, and helping to turn French into a language capable of discussing science.\n\nHis scientific legacy rests on a single, extraordinary idea. In a treatise titled Tractatus de configurationibus qualitatum et motuum, written around 1350, he proposed that any quantity that varies — speed, temperature, intensity of any kind — could be represented as a geometric figure. A horizontal line stood for time or extension; a vertical line at each point stood for the value of the quantity at that moment; the area under the curve was the total effect. This is the graph, in the modern sense. Oresme was the first person to draw one.\n\nUsing this method he proved what is now called the Merton mean-speed theorem: a body undergoing uniform acceleration from rest covers the same distance in a given time as a body moving at the average of the initial and final speeds. The proof is a triangle whose area equals that of a rectangle of half the height — a geometric argument that anticipates, by nearly three hundred years, the integral of v(t) = at used to derive Galileo's s = ½at².\n\nOresme also argued — against Aristotle and most of his contemporaries — that the Earth's daily rotation was more plausible than a rotating heaven, offered a proto-relativity argument for why we cannot feel the motion, and discussed the possibility of other worlds. He pulled back from fully endorsing heliocentrism out of theological caution, but the reasoning was centuries ahead of its time.\n\nHe died in 1382 as bishop of Lisieux. His manuscripts sat largely unread until the nineteenth century, when historians of science rediscovered them and realised that a medieval French bishop had invented the Cartesian graph and glimpsed the mathematics of uniform acceleration before Galileo was born.",
    contributions: [
      "invented the graphical representation of varying quantities (c. 1350)",
      "first geometric proof of the Merton mean-speed theorem",
      "anticipated the kinematic result s = ½at² for uniform acceleration",
      "argued for the plausibility of a rotating Earth",
      "translated Aristotle into French, expanding the scientific vocabulary of the language",
    ],
    majorWorks: [
      {
        title: "Tractatus de configurationibus qualitatum et motuum",
        year: "c. 1350",
        description:
          "The birthplace of the graph. Oresme represents variable quantities as geometric figures — the horizontal axis for extension in time or space, the vertical for intensity — and proves the mean-speed theorem by computing an area.",
      },
      {
        title: "Livre du ciel et du monde",
        year: "1377",
        description:
          "A French-language commentary on Aristotle's De Caelo, written for Charles V. Contains Oresme's careful argument that the Earth may rotate on its axis and a thoughtful rebuttal of the classical objections to terrestrial motion.",
      },
      {
        title: "De proportionibus proportionum",
        year: "c. 1360",
        description:
          "A treatise on ratios of ratios — effectively an early study of irrational exponents. Oresme argues that the ratios of celestial motions are almost certainly irrational, undermining astrological prediction.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" },
    ],
  },
  {
    slug: "robert-hooke",
    name: "Robert Hooke",
    shortName: "Hooke",
    born: "1635",
    died: "1703",
    nationality: "English",
    oneLiner:
      "The Royal Society's polymath curator — springs, cells, and a bitter rivalry with Newton.",
    image: storageUrl("physicists/robert-hooke.avif"),
    bio: "Robert Hooke was born on the Isle of Wight in 1635, the son of a curate. A sickly child, he taught himself mechanical drawing and model-making, and went up to Christ Church, Oxford, as a servitor — earning his keep doing chores for wealthier students. There he fell in with the circle of experimental philosophers around John Wilkins and Robert Boyle, for whom he built the air pump used in the famous vacuum experiments. It was the apprenticeship of his life.\n\nWhen the Royal Society was founded in 1660, Hooke became its first Curator of Experiments — a salaried position that required him to produce three or four new demonstrations at every weekly meeting. For the next forty years he did exactly that, across an astonishing range of fields. He improved the compound microscope and published Micrographia (1665), whose folding plates of fleas, louse grips, and cork tissue were the first widely read scientific drawings made with a lens. In that book he coined the word 'cell' for the box-like structures he saw in cork. He formulated what is now called Hooke's law — that the restoring force of a spring is proportional to its displacement — and published it in 1678 in the anagrammatic form ceiiinosssttuv, which unscrambles to ut tensio, sic vis (as the extension, so the force).\n\nHe was the City of London's Surveyor after the Great Fire of 1666, working alongside his friend Christopher Wren to rebuild the capital. He designed churches, the Royal College of Physicians, and the Monument to the Great Fire itself — which doubles, by Hooke's intent, as a vertical telescope and a zenith sector for astronomical experiments.\n\nAnd then there was the quarrel with Newton. Hooke had been writing to Newton since the 1670s, claiming — with some justification — that he had glimpsed the inverse-square law of gravitation before Newton did. In letters of 1679–1680 he posed the right question: assuming an inverse-square attraction toward the Sun, what shape would a planet's orbit take? He could not prove the answer was an ellipse. Newton could. When the Principia appeared in 1687, Hooke demanded public credit; Newton grudgingly added a brief acknowledgement and then, in private, cultivated a deep and durable hatred. After Hooke's death in 1703, Newton — then President of the Royal Society — is said to have had the only portrait of Hooke removed. No authenticated image of him survives. The loss is a twist of scientific history that still rankles: the man who named the cell, built Wren's London, and wrote Hooke's law has no face.\n\nHooke remained, to the end, a genuine rival to Newton in range if not in depth. He lacked Newton's mathematical power but had an intuitive reach that often put him first to the right question. In an age of specialists he was the last of the great generalists — the Royal Society's inexhaustible experimenter, the man to whom every new phenomenon in the London of the Restoration was eventually brought.",
    contributions: [
      "formulated Hooke's law of elasticity (1678) — F = −kx",
      "coined the word 'cell' in biology (Micrographia, 1665)",
      "advanced the compound microscope and published the first great microscopy book",
      "proposed an inverse-square law of gravitational attraction in correspondence with Newton (1679)",
      "designed the City of London with Christopher Wren after the Great Fire of 1666",
      "built the air pump used by Boyle in the vacuum experiments",
      "was the first Curator of Experiments at the Royal Society",
    ],
    majorWorks: [
      {
        title: "Micrographia",
        year: "1665",
        description:
          "The first great book of microscopy. Folding plates of fleas, louse grips, fossils, and cork tissue — where Hooke named the box-like structures 'cells', giving biology its foundational word.",
      },
      {
        title: "De Potentia Restitutiva, or of Spring",
        year: "1678",
        description:
          "The publication of Hooke's law of elasticity — ut tensio, sic vis. Contains applications to springs, watch balances, and the theory of sound.",
      },
      {
        title: "An Attempt to Prove the Motion of the Earth from Observations",
        year: "1674",
        description:
          "A short lecture in which Hooke states the programme of universal gravitation: all celestial bodies attract each other with a force that diminishes with distance, and planetary motion results from this attraction combined with inertia.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "evangelista-torricelli",
    name: "Evangelista Torricelli",
    shortName: "Torricelli",
    born: "1608",
    died: "1647",
    nationality: "Italian",
    oneLiner:
      "Galileo's last student — invented the barometer, discovered atmospheric pressure, and wrote the first projectile tables.",
    image: storageUrl("physicists/evangelista-torricelli.avif"),
    bio: "Evangelista Torricelli was born in Faenza in 1608 and orphaned young. A Jesuit uncle arranged for him to study mathematics under Benedetto Castelli, one of Galileo's former pupils, and by the late 1630s Torricelli was working through Galileo's Two New Sciences and writing mathematical commentaries that eventually reached Galileo himself. In October 1641 he moved to Arcetri to serve as Galileo's assistant, secretary, and amanuensis during the old man's final, blind months. Galileo died three months later, and Torricelli was appointed to succeed him as court mathematician to the Grand Duke of Tuscany.\n\nHis most famous experiment came in 1643. Using a glass tube sealed at one end and filled with mercury, Torricelli inverted it into a dish and showed that the mercury column settled to roughly 76 centimetres above the reservoir. Above the column, in the closed top of the tube, was a region of empty space — the first sustained vacuum produced deliberately in the laboratory. The column's height measured the weight of the atmosphere pressing down on the open dish. He had invented the barometer and demonstrated atmospheric pressure in one stroke. The unit of pressure one millimetre of mercury is still called a torr in his honour.\n\nHis Opera Geometrica (1644) ran to several hundred pages of geometry, mechanics, and fluid statics. Two results stand out. First, Torricelli's law on fluid efflux: a liquid draining from a small hole in a tank leaves with the same speed it would have acquired by falling freely from the liquid's surface, v = √(2gh). Second, his systematic study of projectile trajectories: extending Galileo's parabolic theory, he compiled the first serious tables of ranges for different launch speeds and angles, and proved that the family of all parabolic trajectories at a given speed is bounded above by another parabola — the 'safety parabola' or enveloping curve, outside which no shot can reach no matter how you aim. It was the first enveloping curve in the history of mathematics.\n\nTorricelli also contributed to the early calculus of indivisibles, deriving the volume of the hyperbolic solid now called Gabriel's horn — a surface of revolution with finite volume but infinite surface area, the first rigorous paradox of infinity in integration. He died abruptly of typhoid fever in October 1647, aged thirty-nine. His collected papers were published posthumously and remained an important reference for Pascal, Huygens, and Newton.",
    contributions: [
      "invented the mercury barometer and demonstrated atmospheric pressure (1643)",
      "produced the first sustained laboratory vacuum (the 'Torricellian vacuum')",
      "formulated Torricelli's law: v = √(2gh) for fluid efflux from a tank",
      "compiled the first systematic projectile range tables (Opera Geometrica, 1644)",
      "discovered the safety parabola — the enveloping curve of projectile trajectories",
      "early work on the method of indivisibles and the volume of Gabriel's horn",
    ],
    majorWorks: [
      {
        title: "Opera Geometrica",
        year: "1644",
        description:
          "A three-part treatise covering conic sections, the motion of projectiles, and the geometry of solids. Extended Galileo's parabolic theory of trajectories, introduced the safety parabola, and presented Torricelli's law on the efflux of liquids.",
      },
      {
        title: "De Motu Gravium",
        year: "1641",
        description:
          "The earliest of Torricelli's major works on mechanics, completed before he joined Galileo in Arcetri. Works through the kinematics of falling bodies and lays the foundations for the later projectile-range analysis.",
      },
      {
        title: "Lezioni Accademiche",
        year: "published 1715",
        description:
          "Posthumous collection of academic lectures covering wind, sound, the vacuum, and the nature of pressure. Contains the clearest contemporary exposition of the barometric experiment.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "guillaume-amontons",
    name: "Guillaume Amontons",
    shortName: "Amontons",
    born: "1663",
    died: "1705",
    nationality: "French",
    oneLiner:
      "Deaf instrument-maker who distilled the chaos of friction into two clean laws.",
    image: storageUrl("physicists/guillaume-amontons.avif"),
    bio: "Guillaume Amontons was born in Paris in 1663 and lost most of his hearing in his teens from a serious illness. He declined medical treatment that might have restored it — he reasoned that he now had fewer distractions and could concentrate better on his studies. He had no formal university training. What he had was a pair of very good hands, a sharp experimental eye, and a determination to make real physics out of tangible objects.\n\nHe spent his short life in Paris as a private instrument-maker and a Royal Academy of Sciences correspondent. He designed and built hygrometers, barometers, thermometers, and optical telegraphs. In 1699 he delivered his most famous paper to the Academy — De la résistance causée dans les machines — in which he measured the friction between greased and ungreased surfaces of every combination he could contrive. Out of those measurements he drew two startlingly simple rules: the friction force is proportional to the load pressing the surfaces together, and it is independent of the area of contact. A third, closely related observation — that the force is roughly independent of sliding speed — was added later and is sometimes called the third of Amontons' laws.\n\nHis laws were not entirely new. Leonardo da Vinci had written them down in his notebooks around 1500, but those notebooks stayed in private hands for centuries and had no influence on anyone. Amontons is the one who published, argued for his results in front of the Academy, and convinced the rest of European science that something so messy as rubbing surfaces could be captured in two lines of arithmetic.\n\nHe also designed an air thermometer in 1702 that used the change in pressure of a fixed volume of gas as a temperature signal — effectively a constant-volume gas thermometer — and in working with it he came within a whisker of noticing absolute zero: he observed that the pressure extrapolated linearly to zero at a particular low temperature. Amontons died in 1705 at the age of 42, probably from the same condition that had cost him his hearing, leaving only a handful of published memoirs behind. Two of them still run every undergraduate friction problem in the world.",
    contributions: [
      "formulated the classical laws of friction (1699): F ∝ N and F independent of contact area",
      "demonstrated that kinetic friction is roughly independent of sliding speed",
      "designed the air thermometer (1702), anticipating absolute zero",
      "invented an optical telegraph using windmill arms and telescopes",
      "built some of the most accurate barometers and hygrometers of his time",
    ],
    majorWorks: [
      {
        title: "De la résistance causée dans les machines",
        year: "1699",
        description:
          "Memoir to the Royal Academy of Sciences in Paris presenting what are now called Amontons' laws of friction. Reported careful measurements across materials showing that friction depends on load but not on contact area, and laid the experimental foundation for tribology.",
      },
      {
        title: "Moyen de substituer commodément l'action du feu à la force des hommes et des chevaux",
        year: "1699",
        description:
          "An early proposal to use the expansive force of heated air as a source of mechanical work — essentially a design for a hot-air engine, predating practical heat engines by a century.",
      },
      {
        title: "Le thermomètre universel",
        year: "1702",
        description:
          "Description of a constant-volume air thermometer. Amontons observed that the pressure of a fixed volume of air appeared to extrapolate linearly to zero at a particular low temperature — one of the first hints of what would later become absolute zero.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "george-gabriel-stokes",
    name: "George Gabriel Stokes",
    shortName: "Stokes",
    born: "1819",
    died: "1903",
    nationality: "Irish",
    oneLiner:
      "Worked out how slow-moving spheres disturb a fluid, and handed physics half of tribology and all of Brownian-motion analysis.",
    image: storageUrl("physicists/george-gabriel-stokes.avif"),
    bio: "George Gabriel Stokes was born in Skreen, County Sligo, in 1819, the son of a Church of Ireland rector. He read mathematics at Pembroke College, Cambridge, where he was Senior Wrangler in 1841 — the top-ranked student in the Mathematical Tripos. He spent the rest of his working life in Cambridge: elected a Fellow of Pembroke, appointed Lucasian Professor of Mathematics in 1849 (the chair Newton had held), and Master of Pembroke from 1902 until his death. He held the Lucasian chair for fifty-four years — the longest tenure in its history.\n\nStokes worked on almost everything in mathematical physics that moved, flowed, or vibrated. He formulated the Navier-Stokes equations (with Claude-Louis Navier) that govern viscous fluid motion. He proved Stokes' theorem, relating a surface integral of curl to a line integral around its boundary — a foundational result in vector calculus and the mathematical backbone of Maxwell's electromagnetism. He gave the first correct explanation of fluorescence, coining the term, and formulated Stokes' shift — the observation that fluorescent light has a longer wavelength than the exciting light. He studied the diffraction of light, the polarisation of sunlight scattered by the sky, and the spectroscopic structure of sunlight.\n\nHis most-cited result today is Stokes' law of viscous drag, published in 1851 in On the effect of the internal friction of fluids on the motion of pendulums. Working out how a slow, steady sphere disturbs the surrounding fluid, he derived F = 6πηrv — the drag force on a sphere at low Reynolds number. It looks like a small technical result. It turned out to be the key to Millikan's measurement of the electron charge, Perrin's determination of Avogadro's number, the sedimentation theory of colloids, the Einstein-Stokes relation between viscosity and diffusion, and every modern calculation of low-Reynolds-number swimming — from bacteria to microfluidic chips.\n\nStokes was a devout Anglican, served three terms as a Conservative Member of Parliament for Cambridge University, and was created a baronet in 1889 by Queen Victoria. He was President of the Royal Society from 1885 to 1890 and Master of the Mint briefly. His output — more than 140 papers, mostly in the 1840s and 1850s — dominates the transition of mathematical physics from geometry to continuum analysis. He died in Cambridge in 1903, aged 83, and is buried in Mill Road Cemetery.",
    contributions: [
      "derived Stokes' law for viscous drag on a sphere (1851)",
      "co-formulated the Navier-Stokes equations of fluid motion",
      "proved Stokes' theorem in vector calculus",
      "explained fluorescence and introduced the term (1852)",
      "first correct analysis of the polarisation of sunlight",
      "studied pendulum motion in resistant media — the original motivation for Stokes' law",
      "contributed foundational work on optics, diffraction, and spectroscopy",
    ],
    majorWorks: [
      {
        title: "On the theories of the internal friction of fluids in motion, and of the equilibrium and motion of elastic solids",
        year: "1845",
        description:
          "Published derivation of what are now called the Navier-Stokes equations for a Newtonian viscous fluid, starting from molecular considerations and a carefully justified stress tensor.",
      },
      {
        title: "On the effect of the internal friction of fluids on the motion of pendulums",
        year: "1851",
        description:
          "The paper containing Stokes' law: F = 6πηrv for the drag on a sphere at low Reynolds number. Applied the result to correct the periods of pendulums swinging in air and became, a century later, the cornerstone of low-Reynolds-number hydrodynamics.",
      },
      {
        title: "On the change of refrangibility of light",
        year: "1852",
        description:
          "Introduced the term fluorescence and gave the first correct physical explanation: incident ultraviolet light is absorbed and re-emitted at longer wavelengths. Contained what is now called Stokes' shift.",
      },
      {
        title: "On the dynamical theory of diffraction",
        year: "1849",
        description:
          "A mathematically rigorous treatment of the diffraction of light, incorporating polarisation and transverse-wave character, and clarifying the role of the elastic-ether hypothesis then prevalent.",
      },
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "gottfried-wilhelm-leibniz",
    name: "Gottfried Wilhelm Leibniz",
    shortName: "Leibniz",
    born: "1646",
    died: "1716",
    nationality: "German",
    oneLiner:
      "Philosopher-mathematician who coined vis viva — the first attempt at what we now call kinetic energy.",
    bio: "Gottfried Wilhelm Leibniz was born in Leipzig in 1646 and went on to become one of the most versatile intellects of the seventeenth century. He was a diplomat, a librarian to the Duke of Hanover, a historian, a philosopher, a theologian, a jurist, and — as a private passion — a working mathematician. Between the late 1670s and the mid-1680s he developed an infinitesimal calculus independently of Newton and published it before him. The priority dispute that followed poisoned Anglo-continental mathematics for half a century, but Leibniz's notation — dx, dy, ∫ — is what mathematicians use today.\n\nHis 1686 essay Brevis demonstratio erroris memorabilis Cartesii argued against Descartes's definition of the quantity of motion as m·v and proposed instead the scalar m·v² — a quantity Leibniz called vis viva, the \"living force\". The Cartesians and Leibnizians fought over it for the next sixty years. With modern eyes we can see that both were partially right: m·v (signed — a vector) is conserved in collisions, and so is ½·m·v². Leibniz's vis viva missed a factor of two and didn't become the full law of energy conservation for another two centuries, but the idea that motion-squared was conserved was a decisive step toward it.\n\nLeibniz's influence runs through nearly every branch of rational thought. He anticipated symbolic logic three centuries early; his monadology was one of the first systematic attempts at a metaphysical atomism; his principle of sufficient reason remains a standard move in philosophy. He died in Hanover in 1716, mostly forgotten by his patrons and in debt. His collected works are still being published.",
    contributions: [
      "co-invented the infinitesimal calculus (independently of Newton)",
      "introduced the modern notation dx, dy, and ∫ for calculus",
      "proposed vis viva (m·v²) as a conserved quantity of motion (1686)",
      "anticipated binary arithmetic and symbolic logic",
      "developed the monadology as a systematic metaphysics",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "emilie-du-chatelet",
    name: "Gabrielle Émilie Le Tonnelier de Breteuil, Marquise du Châtelet",
    shortName: "Du Châtelet",
    born: "1706",
    died: "1749",
    nationality: "French",
    oneLiner:
      "Translated Newton into French and made the decisive experimental case for vis viva as m·v².",
    bio: "Émilie du Châtelet was born in Paris in 1706 into minor aristocracy and educated, unusually for a girl of her class, in Latin, Greek, mathematics, and the natural sciences. She married the Marquis du Châtelet at 19 and shortly afterwards entered into a famous partnership with Voltaire, with whom she lived and collaborated for fifteen years at the Château de Cirey in Lorraine, building what was effectively a private research institute.\n\nHer most enduring work was the first — and for two centuries the only — French translation of Newton's Principia. Published posthumously in 1759, it included her own extensive commentary and corrections, bringing Newtonian mechanics to the French-speaking world at a moment when Cartesian physics still dominated the French academy.\n\nHer sharpest scientific contribution came earlier, in the dispute over vis viva between the Newtonians (who held the \"quantity of motion\" was m·v) and the Leibnizians (who insisted it was m·v²). She read the German experimentalist Willem 's Gravesande's 1722 results — brass balls dropped from varying heights into clay, leaving craters whose volume varied as the square of the impact velocity — and recognised that they settled the argument decisively in Leibniz's favour. Her 1740 Institutions de Physique made this case rigorously to a French audience and established the energy-side intuition that would mature into the conservation of energy in the nineteenth century. She died in 1749 in childbirth, six days after completing her Newton translation.",
    contributions: [
      "produced the first French translation of Newton's Principia (1759, posthumous)",
      "established, via 's Gravesande's experiments, that kinetic energy scales as m·v²",
      "wrote Institutions de Physique (1740), a major synthesis of Newtonian and Leibnizian thought",
      "co-authored Voltaire's Elements of the Philosophy of Newton",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "james-prescott-joule",
    name: "James Prescott Joule",
    shortName: "Joule",
    born: "1818",
    died: "1889",
    nationality: "English",
    oneLiner:
      "Proved by paddle wheel that mechanical work and heat are two forms of the same thing.",
    bio: "James Prescott Joule was born in Salford, near Manchester, in 1818, the son of a wealthy brewer. Educated privately — one of his tutors was the chemist John Dalton — he lived off the family business and pursued physics as a private obsession for most of his working life. His early papers in the 1840s were rejected by the Royal Society and dismissed as the work of a provincial amateur.\n\nHe is remembered for the paddle-wheel experiments, carried out and refined between 1843 and 1850. The apparatus was simple: a weight on a string drove a shaft that spun a paddle wheel inside an insulated tank of water. The weight fell, the paddle stirred, and the water warmed. Joule measured both the mechanical potential energy given up by the weight and the resulting temperature rise, inferred the heat generated, and showed — over many runs — that the two were exactly proportional. His mechanical equivalent of heat, approximately 4.18 joules per calorie, is one of the foundational constants of thermodynamics. The SI unit of energy, the joule (J), bears his name.\n\nJoule's work was the decisive experimental demonstration that heat is not a fluid (the old caloric theory) but a form of energy convertible from mechanical work. Combined with contemporary insights from Mayer, Helmholtz, and Thomson (Lord Kelvin), it became the first law of thermodynamics: energy is conserved across all its forms, mechanical, thermal, and chemical. Joule collaborated with Kelvin on the Joule–Thomson effect, which is still used in refrigeration and gas liquefaction. He died in Sale in 1889.",
    contributions: [
      "measured the mechanical equivalent of heat to high precision (1843–1850)",
      "established experimentally that heat is a form of energy",
      "laid groundwork for the first law of thermodynamics",
      "discovered the Joule–Thomson effect (with William Thomson)",
      "studied the heating effect of electric currents (Joule heating)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "thomas-young",
    name: "Thomas Young",
    shortName: "Young",
    born: "1773",
    died: "1829",
    nationality: "English",
    oneLiner:
      "Polymath who introduced the word energy to physics, in its modern sense.",
    bio: "Thomas Young was born in Milverton, Somerset, in 1773. A child prodigy fluent in Greek and Latin by age six, he trained as a physician but spent most of his career as an independent scholar in London. His output spans physics, physiology, Egyptology, and linguistics — he contributed substantially to the decipherment of the Rosetta Stone — and he published a large part of his scientific work anonymously to avoid damaging his medical practice.\n\nIn physics he is remembered for the double-slit experiment of 1801–1803, which demonstrated interference of light and revived the wave theory against Newton's corpuscular orthodoxy. Equally important, though less famous, was his 1807 introduction of the word energy in its modern technical sense — the first time the term was used in English scientific writing to describe the quantity ½·m·v², replacing the older and vaguer vis viva. He also named Young's modulus — the elastic constant relating stress to strain — and studied the physiology of vision and colour.\n\nHe died in London in 1829. His gravestone in Westminster Abbey calls him one who \"brought to the studies that interested him a variety of knowledge such as few men have ever possessed\".",
    contributions: [
      "demonstrated the wave nature of light with the double-slit experiment (1803)",
      "introduced the scientific term 'energy' in its modern sense (1807)",
      "defined Young's modulus in elasticity",
      "contributed to the decipherment of Egyptian hieroglyphs",
      "formulated the three-component theory of colour vision",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "james-watt",
    name: "James Watt",
    shortName: "Watt",
    born: "1736",
    died: "1819",
    nationality: "Scottish",
    oneLiner:
      "Engineer whose separate-condenser steam engine powered the industrial revolution and lent his name to the unit of power.",
    bio: "James Watt was born in Greenock, Scotland, in 1736. Trained as an instrument maker at the University of Glasgow, he was asked in 1763 to repair a Newcomen atmospheric engine and became fascinated by its poor efficiency. He worked out that the engine wasted most of its fuel heating and re-cooling the same cylinder on every stroke. His answer — a separate condenser that kept the cylinder continuously hot — was patented in 1769 and transformed the steam engine from a pumping curiosity into the prime mover of the industrial revolution.\n\nWith his business partner Matthew Boulton he founded Boulton & Watt in Birmingham, built engines for mines, mills, and factories across Britain, and introduced quantitative measures of engine output. Selling engines to buyers who thought in horses, Watt invented the unit of horsepower — one horse pulling 150 lb at a steady 2.5 mph, equivalent to about 746 watts in modern units. He went on to invent the centrifugal governor, the parallel motion linkage, and the indicator diagram for measuring engine work.\n\nThe SI unit of power, the watt (W), was named for him in 1960. He died at Heathfield Hall in 1819, a celebrated figure and a wealthy man.",
    contributions: [
      "patented the separate condenser for steam engines (1769)",
      "made the steam engine efficient enough to drive the industrial revolution",
      "invented the centrifugal governor for engine speed regulation",
      "introduced the horsepower as a commercial unit of engine output",
      "designed the indicator diagram for measuring engine cycles",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "rene-descartes",
    name: "René Descartes",
    shortName: "Descartes",
    born: "1596",
    died: "1650",
    nationality: "French",
    oneLiner:
      "Philosopher who first proposed a conservation law for quantity of motion — nearly right, in need of a sign.",
    bio: "René Descartes was born in La Haye en Touraine (now Descartes) in 1596, educated by the Jesuits at La Flèche, and spent most of his adult life in the Dutch Republic, where the intellectual climate was more tolerant. He is remembered in the humanities for the Meditations and Discourse on Method, and in mathematics for inventing analytic geometry — the fusion of algebra and geometry through coordinate systems that still bears the name Cartesian.\n\nIn physics his most consequential move was the 1644 Principia Philosophiae, where he proposed that God had endowed the universe with a fixed quantitas motus — a \"quantity of motion\" — measured as |m·v|, which would be conserved through all the collisions and motions of the material world. It was the first attempt at a conservation law in modern physics. Descartes was close to right: what he called quantity of motion became, with the addition of direction (the vector sign), Newtonian momentum, which is genuinely conserved.\n\nHuygens caught the error within a generation. Descartes's instinct — that something about motion must be preserved under all interactions — became one of the founding assumptions of classical mechanics. He died in Stockholm in 1650, having reluctantly agreed to tutor Queen Christina of Sweden at five in the morning through a Swedish winter, a regime he blamed for his final illness.",
    contributions: [
      "proposed the first conservation law in modern physics (quantity of motion, 1644)",
      "invented analytic geometry and Cartesian coordinates",
      "founded modern continental rationalist philosophy",
      "stated an early version of the law of inertia",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "john-wallis",
    name: "John Wallis",
    shortName: "Wallis",
    born: "1616",
    died: "1703",
    nationality: "English",
    oneLiner:
      "English mathematician who got momentum conservation right, with the sign, in 1668.",
    bio: "John Wallis was born in Ashford, Kent, in 1616, took his MA at Emmanuel College, Cambridge, and spent most of his working life as Savilian Professor of Geometry at Oxford. He was a founding member of the Royal Society, a cryptanalyst for Parliament during the English Civil War, and one of the most productive mathematicians of the seventeenth century. He introduced the symbol ∞ for infinity and contributed key ideas to the development of the calculus — his Arithmetica Infinitorum was one of Newton's main sources.\n\nIn 1668 the Royal Society posed a public challenge: state the laws that govern collisions between bodies. Three correct replies came in, from Wallis, Huygens, and Christopher Wren. Wallis handled perfectly inelastic collisions (bodies that stick together), Wren the elastic case of equal masses, and Huygens the general elastic case. Wallis's key contribution was to treat velocities as signed quantities — vectors, in essence — and so correct the Cartesian error that had treated them as magnitudes. With the sign, momentum conservation held exactly.\n\nHe died in Oxford in 1703, having outlived most of the English mathematicians of his generation and shaped the mathematical climate into which Newton's Principia would arrive.",
    contributions: [
      "introduced the symbol ∞ for infinity",
      "wrote Arithmetica Infinitorum, one of Newton's main sources for calculus",
      "derived the law of perfectly inelastic collisions, with signed velocities (1668)",
      "founded British cryptography during the Civil War",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "leonhard-euler",
    name: "Leonhard Euler",
    shortName: "Euler",
    born: "1707",
    died: "1783",
    nationality: "Swiss",
    oneLiner:
      "The most prolific mathematician in history, who wrote the equations of rigid-body rotation and half the notation used today.",
    bio: "Leonhard Euler was born in Basel in 1707 and trained under the Bernoullis at the University of Basel. He spent most of his career at the Imperial Russian Academy of Sciences in Saint Petersburg, with a long intermediate period at the Berlin Academy under Frederick the Great. He published more than 850 works — essays, monographs, and textbooks — across almost every branch of eighteenth-century mathematics and physics, including much that was simply unknown before him.\n\nHis contributions to classical mechanics begin with the 1736 textbook Mechanica, the first comprehensive treatment of Newtonian mechanics using the new calculus rather than the geometric methods of the Principia. He went on to derive the Euler–Lagrange equations of motion, the Euler equations of rigid-body dynamics (which govern every spinning top, planet, and gyroscope), the Euler equations of fluid flow, and the basic equations for the buckling of columns. The notation he introduced — f(x) for functions, e for the base of natural logarithms, i for the imaginary unit, π in its modern role, Σ for sums — is the notation still in use today.\n\nHe went blind in his right eye in 1738 and completely blind in 1771, but continued to produce mathematics at an astonishing rate through dictation. He died in Saint Petersburg in 1783, working until his last afternoon. His collected works, the Opera Omnia, run to over 70 volumes and are not yet complete.",
    contributions: [
      "wrote the Euler equations of rigid-body rotation",
      "formulated the Euler–Lagrange equations of motion",
      "derived the Euler equations of ideal fluid flow",
      "introduced modern mathematical notation: f(x), e, i, π, Σ",
      "founded the calculus of variations",
      "co-founded graph theory with the Königsberg bridges problem",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "angular-momentum" },
    ],
  },
  {
    slug: "emmy-noether",
    name: "Amalie Emmy Noether",
    shortName: "Noether",
    born: "1882",
    died: "1935",
    nationality: "German",
    oneLiner:
      "Proved that every continuous symmetry of a physical system gives a conservation law — the most beautiful theorem in classical physics.",
    bio: "Emmy Noether was born in Erlangen in 1882, the daughter of the mathematician Max Noether. She wanted to study mathematics at a time when German universities did not admit women, and she audited lectures at Erlangen from 1900 to 1903 — only two women were permitted among nearly a thousand male students. She formally matriculated when rules briefly loosened and took her doctorate in 1907 on invariant theory — work she later dismissed as unremarkable.\n\nFrom 1908 to 1915 she worked as an unpaid assistant at Erlangen. In 1915 Hilbert and Klein, recognising her exceptional talent, invited her to Göttingen to help with the mathematical formulation of general relativity. The university refused to let her hold a paid teaching position on the grounds of her sex. She lectured under Hilbert's name for years. In 1918 she proved the theorem that bears her name: for every continuous symmetry of a physical system there exists a conserved quantity. Conservation of energy from time-translation symmetry; conservation of momentum from space-translation symmetry; conservation of angular momentum from rotational symmetry. The theorem is the skeleton key to all of modern theoretical physics.\n\nShe became a Privatdozent in 1919 and a tenured professor in 1922 — the first woman to hold a full mathematics chair in Germany. She went on to found modern abstract algebra; the structures she introduced (Noetherian rings, Noetherian modules) still bear her name. When the Nazis expelled Jews from German universities in 1933 she emigrated to Bryn Mawr College in the United States. She died there in 1935, aged 53, from complications following surgery. Einstein, unsparing of praise only when he meant it, called her \"the most significant creative mathematical genius thus far produced since the higher education of women began\".",
    contributions: [
      "proved Noether's theorem linking continuous symmetries to conservation laws (1918)",
      "founded modern abstract algebra and the theory of Noetherian rings",
      "contributed the mathematical framework for conservation laws in general relativity",
      "supervised a generation of algebraists who carried her program through the 1930s",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "david-hilbert",
    name: "David Hilbert",
    shortName: "Hilbert",
    born: "1862",
    died: "1943",
    nationality: "German",
    oneLiner:
      "Göttingen mathematician who helped shape general relativity and championed Noether through institutional prejudice.",
    bio: "David Hilbert was born in Königsberg in 1862 and spent most of his career at the University of Göttingen, which he turned into the mathematical capital of the world. He contributed foundational work to algebraic number theory, functional analysis (Hilbert spaces), the axiomatisation of geometry, and the formalist programme in mathematical logic. His 1900 address to the International Congress of Mathematicians in Paris listed 23 unsolved problems that shaped twentieth-century mathematics.\n\nIn physics he worked in parallel with Einstein in 1915 on the field equations of general relativity, arriving at them from a variational principle within a few days of Einstein's final formulation. He recruited Emmy Noether to Göttingen to help with the theory and defended her against the Philosophical Faculty's refusal to appoint her: \"I do not see that the sex of the candidate is an argument against her admission as a Privatdozent. After all, the Senate is not a bathhouse.\" He died in Göttingen in 1943, under the shadow of the Nazi regime that had effectively emptied his department.",
    contributions: [
      "posed the 23 Hilbert problems (1900)",
      "co-derived the field equations of general relativity (1915)",
      "founded the formalist programme in mathematical logic",
      "introduced Hilbert spaces, central to functional analysis and quantum mechanics",
      "championed Emmy Noether's appointment at Göttingen",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "felix-klein",
    name: "Felix Klein",
    shortName: "Klein",
    born: "1849",
    died: "1925",
    nationality: "German",
    oneLiner:
      "Göttingen geometer who co-invited Noether and connected geometry to groups via the Erlangen program.",
    bio: "Felix Klein was born in Düsseldorf in 1849 and spent most of his working life at the University of Göttingen, where he was a dominant administrative figure alongside Hilbert. His 1872 Erlangen Program reorganised geometry around the notion of invariance under groups of transformations: each geometry is characterised by the transformations that leave its defining properties unchanged. This was a deep conceptual rearrangement whose echoes run all through twentieth-century mathematics and physics — including Noether's theorem, which is in effect an Erlangen Program for mechanics.\n\nKlein was also a powerful advocate for improving mathematical education in Germany and for recruiting exceptional talent to Göttingen. Together with Hilbert he invited Emmy Noether to Göttingen in 1915, backed her against the faculty's refusal to appoint her, and helped bring her work on invariance in general relativity to Einstein's attention. He died in 1925, aged 76.",
    contributions: [
      "formulated the Erlangen Program classifying geometries by their invariance groups (1872)",
      "introduced the Klein bottle and developed the theory of non-orientable surfaces",
      "co-founded modern group theory with Sophus Lie",
      "co-invited Emmy Noether to Göttingen",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "albert-einstein",
    name: "Albert Einstein",
    shortName: "Einstein",
    born: "1879",
    died: "1955",
    nationality: "German-Swiss-American",
    oneLiner:
      "Redefined space, time, and gravity — and relied on Emmy Noether to sort out energy conservation in general relativity.",
    bio: "Albert Einstein was born in Ulm in 1879. After early struggles with German schooling he took a degree at the ETH in Zurich, worked as a patent examiner in Bern, and in 1905 — his miraculous year — published four papers that independently founded special relativity, introduced the photon, proved the reality of atoms via Brownian motion, and derived E = m·c². In 1915, after a decade of work, he completed general relativity, which recast gravity as the curvature of spacetime. He was awarded the Nobel Prize in Physics in 1921, for the photoelectric effect.\n\nDuring the development of general relativity he consulted Emmy Noether on a subtle technical question: how to make sense of energy conservation in a theory with local gauge invariance. Her solution became part of the mathematical foundation of the theory; she referred to the result as Noether's second theorem, less famous than the first but equally essential for gauge theories. Einstein emigrated to the United States in 1933 when the Nazis came to power and spent the rest of his career at the Institute for Advanced Study in Princeton. He died in 1955.",
    contributions: [
      "founded special relativity (1905)",
      "derived E = m·c²",
      "published the general theory of relativity (1915)",
      "explained the photoelectric effect, laying groundwork for quantum theory",
      "used Noether's second theorem to clarify energy conservation in general relativity",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "archimedes",
    name: "Archimedes of Syracuse",
    shortName: "Archimedes",
    born: "c. 287 BCE",
    died: "c. 212 BCE",
    nationality: "Greek (Syracusan)",
    oneLiner:
      "Ancient mathematician and engineer who wrote the first rigorous treatise on levers and equilibrium.",
    bio: "Archimedes was born in Syracuse, Sicily, around 287 BCE, and lived most of his life in that city. He is one of a small handful of ancient figures whose mathematical work survives in enough volume to judge him genuinely first-rank: his treatises on the sphere and cylinder, on circles, on spirals, on floating bodies, and on the equilibrium of planes are, by the standards of the time, extraordinary.\n\nHis On the Equilibrium of Planes, probably written around 250 BCE, gives the first rigorous proof of the law of the lever — that two unequal weights on opposite sides of a fulcrum balance when their distances from the fulcrum are inversely proportional to their weights. He also introduced the concept of the center of gravity and computed it for a range of geometric shapes, laying the foundation for what would become mass and moment analysis in mechanics.\n\nHe is equally famous for his engineering: the Archimedean screw for lifting water, compound pulleys that could let one man haul a warship (famously demonstrated for King Hiero II), burning-mirrors that could set enemy ships alight at a distance, and various artillery. He was killed in 212 BCE when Roman forces sacked Syracuse, reportedly while absorbed in a mathematical diagram.",
    contributions: [
      "proved the law of the lever rigorously (On the Equilibrium of Planes)",
      "introduced the concept of center of gravity",
      "derived the area and circumference of circles, and the surface area and volume of the sphere",
      "developed the method of exhaustion — an ancient precursor of integral calculus",
      "discovered the principle of buoyancy (Archimedes' principle)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "jacob-steiner",
    name: "Jakob Steiner",
    shortName: "Steiner",
    born: "1796",
    died: "1863",
    nationality: "Swiss",
    oneLiner:
      "Swiss geometer whose parallel-axis theorem lets moment of inertia be computed about any axis from the centre-of-mass value.",
    bio: "Jakob Steiner was born in Utzenstorf, Switzerland, in 1796, to a peasant family. He did not begin formal schooling until age 14, but by 19 he was teaching mathematics in Yverdon under Pestalozzi and in 1834 was appointed extraordinary professor of mathematics at the University of Berlin, a position he held until his death. He is remembered as one of the greatest pure geometers of the nineteenth century, working almost exclusively in synthetic projective geometry rather than analytic coordinates.\n\nHis name is attached to the parallel-axis theorem in rigid-body mechanics: the moment of inertia of a body about any axis equals the moment of inertia about the parallel axis through its center of mass, plus M·d² for the offset. The theorem is a direct consequence of the definition of the center of mass and is stated in modern engineering textbooks sometimes as Steiner's theorem. He contributed many other results in projective geometry, conic sections, and the theory of surfaces.\n\nHe died in Bern in 1863 and left a substantial bequest to Swiss schools for the education of poor children. The Steiner prize, awarded by the Berlin Academy, still bears his name.",
    contributions: [
      "proved the parallel-axis theorem for moments of inertia (Steiner's theorem)",
      "founded modern synthetic projective geometry",
      "contributed major results on conic sections and ruled surfaces",
      "taught geometry at the University of Berlin for nearly thirty years",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "moment-of-inertia" },
    ],
  },
  {
    slug: "elmer-sperry",
    name: "Elmer Ambrose Sperry",
    shortName: "Sperry",
    born: "1860",
    died: "1930",
    nationality: "American",
    oneLiner:
      "Inventor and industrialist who turned the laboratory gyroscope into the central navigation instrument of twentieth-century ships and aircraft.",
    bio: "Elmer Sperry was born in 1860 in Cortland, New York. A prolific inventor in the American engineering tradition — more than 350 patents to his name — he founded Sperry Gyroscope Company in 1910, and between then and 1930 he built the company that dominated the gyroscopic navigation and control business worldwide.\n\nHis most consequential invention was the gyrocompass (1908), a rapidly spinning flywheel mechanically constrained by gravity and gimbals to align its axis with true (geographic) north, unaffected by magnetic disturbances from iron hulls or geomagnetic anomalies. The Sperry gyrocompass was first adopted by the US Navy in 1910 and became standard equipment on essentially every large ship during the first half of the twentieth century. He went on to develop gyroscopic autopilots for ships and aircraft, gyroscopic stabilisers for ships against roll, and early inertial guidance systems.\n\nHe died in Brooklyn in 1930. The Sperry Corporation he founded went through various mergers and became part of Unisys; its gyroscope division is now part of Honeywell, and the basic gyrocompass and inertial-guidance technology Sperry pioneered is still in use today in submarines, commercial aircraft, and spacecraft.",
    contributions: [
      "invented the Sperry gyrocompass for shipboard navigation (1908)",
      "developed the gyroscopic autopilot for aircraft",
      "designed gyroscopic ship stabilisers",
      "founded Sperry Gyroscope Company (1910)",
      "held over 350 patents, many in electrical and mechanical engineering",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
    ],
  },
  {
    slug: "hipparchus",
    name: "Hipparchus of Nicaea",
    shortName: "Hipparchus",
    born: "c. 190 BCE",
    died: "c. 120 BCE",
    nationality: "Greek",
    oneLiner:
      "Ancient astronomer who discovered the precession of the equinoxes by comparing his own observations with those made 150 years earlier.",
    bio: "Hipparchus was born in Nicaea (in what is now northwestern Turkey) around 190 BCE and did most of his observational work on the island of Rhodes. He is widely regarded as the greatest astronomer of antiquity. Almost none of his original writings survive, but his work is known in detail from quotations, tables, and references in later authors, particularly Ptolemy's Almagest.\n\nHis most famous discovery, around 130 BCE, was the precession of the equinoxes: comparing the celestial longitudes of stars in his own observations with those catalogued by Timocharis of Alexandria 150 years earlier, he noticed a systematic shift of 2° to the east — roughly 48 arcseconds per year. He correctly inferred that this was a slow motion of the Earth's rotational frame (or, in ancient geocentric terms, of the celestial sphere relative to the ecliptic), not of the stars themselves. The physical cause — the torque of the Sun and Moon on the Earth's equatorial bulge — would not be known for 1,800 years, until Newton derived it from gravitational theory.\n\nHipparchus also compiled the first systematic star catalogue of the Western tradition (containing around 850 stars, classified by apparent magnitude on a scale whose logic survives today), developed an early version of trigonometry including a table of chords, and worked out accurate values for the lunar and solar distances and the length of the tropical year. He is a foundational figure in ancient mathematical astronomy.",
    contributions: [
      "discovered the precession of the equinoxes (c. 130 BCE)",
      "compiled the first systematic Western star catalogue (~850 stars)",
      "introduced magnitude classification of stellar brightness",
      "developed an early trigonometry with tables of chords",
      "measured the length of the tropical year to within minutes",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "seth-carlo-chandler",
    name: "Seth Carlo Chandler Jr.",
    shortName: "Chandler",
    born: "1846",
    died: "1913",
    nationality: "American",
    oneLiner:
      "Boston actuary-astronomer who discovered in 1891 that the Earth's rotation axis wobbles with a 433-day period.",
    bio: "Seth Carlo Chandler Jr. was born in Boston in 1846 and spent his professional life as an actuary in the insurance business. He pursued astronomy as an avocation, with unusual rigour, and for decades kept detailed observations and analyses of astronomical data. He worked particularly on latitude observations — measurements of the local latitude of a fixed observatory, which should be constant if the Earth rotated on a perfectly stable axis but would vary if the rotation pole moved with respect to the Earth's crust.\n\nIn 1891, analysing pooled latitude data from observatories worldwide over the previous decades, Chandler discovered a clear periodic variation with a period of about 14 months — substantially longer than the 10-month period Euler had predicted in 1758 for a rigid Earth. Chandler's result was the first direct observational evidence that the Earth is not a perfectly rigid body; its elastic deformation under the stresses of its own wobble lengthens the free-precession period from Euler's 305 days to the observed 433 days. Simon Newcomb worked out the physical explanation within a year of Chandler's discovery.\n\nThe 433-day wobble is now called the Chandler wobble, and its amplitude of a few metres at the surface is tracked to sub-millimetre precision by modern space-geodetic techniques. Chandler died in 1913, never having held a formal academic position, but his name is attached to one of the most carefully measured geophysical phenomena of the twentieth and twenty-first centuries.",
    contributions: [
      "discovered the 433-day Chandler wobble of the Earth's rotation axis (1891)",
      "performed decades of pioneering statistical analysis of latitude observations",
      "provided the first observational evidence that the Earth is not rigid",
      "refined the methodology of combined astronomical catalogues",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
];

export function getPhysicist(slug: string): Physicist | undefined {
  return PHYSICISTS.find((p) => p.slug === slug);
}

export function getAllPhysicists(): readonly Physicist[] {
  return PHYSICISTS;
}

type PhysicistMessage = Partial<
  Pick<
    Physicist,
    "name" | "shortName" | "oneLiner" | "bio" | "contributions" | "majorWorks"
  >
>;

function mergePhysicist(base: Physicist, loc: PhysicistMessage): Physicist {
  return {
    ...base,
    name: loc.name ?? base.name,
    shortName: loc.shortName ?? base.shortName,
    oneLiner: loc.oneLiner ?? base.oneLiner,
    bio: loc.bio ?? base.bio,
    contributions: loc.contributions ?? base.contributions,
    majorWorks: loc.majorWorks ?? base.majorWorks,
  };
}

async function getPhysicistMessages(): Promise<Record<string, PhysicistMessage>> {
  const { getMessages } = await import("next-intl/server");
  const messages = (await getMessages()) as { physicists?: Record<string, PhysicistMessage> };
  return messages.physicists ?? {};
}

export async function getLocalizedPhysicist(
  slug: string,
): Promise<Physicist | undefined> {
  const base = getPhysicist(slug);
  if (!base) return undefined;
  const all = await getPhysicistMessages();
  return mergePhysicist(base, all[slug] ?? {});
}

export async function getAllLocalizedPhysicists(): Promise<readonly Physicist[]> {
  const all = await getPhysicistMessages();
  return PHYSICISTS.map((p) => mergePhysicist(p, all[p.slug] ?? {}));
}
