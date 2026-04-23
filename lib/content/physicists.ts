import type { Physicist } from "./types";
import { storageUrl } from "../supabase";

/**
 * Structural metadata for every physicist referenced across the site.
 *
 * Localised prose (`name`, `shortName`, `oneLiner`, `bio`, `contributions`,
 * `majorWorks`) lives in Supabase (`content_entries` where `kind='physicist'`).
 * Fetch it via `getContentEntry("physicist", slug, locale)` from
 * `@/lib/content/fetch`.
 */
export const PHYSICISTS: readonly Physicist[] = [
  {
    slug: "galileo-galilei",
    born: "1564",
    died: "1642",
    nationality: "Italian",
    image: storageUrl("physicists/galileo-galilei.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "isaac-newton",
    born: "1642",
    died: "1727",
    nationality: "English",
    image: storageUrl("physicists/isaac-newton.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "christiaan-huygens",
    born: "1629",
    died: "1695",
    nationality: "Dutch",
    image: storageUrl("physicists/christiaan-huygens.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "leon-foucault",
    born: "1819",
    died: "1868",
    nationality: "French",
    image: storageUrl("physicists/leon-foucault.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
      { branchSlug: "electromagnetism", topicSlug: "eddy-currents" },
    ],
  },
  {
    slug: "gaspard-gustave-de-coriolis",
    born: "1792",
    died: "1843",
    nationality: "French",
    image: storageUrl("physicists/gaspard-gustave-de-coriolis.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
  {
    slug: "johannes-kepler",
    born: "1571",
    died: "1630",
    nationality: "German",
    image: storageUrl("physicists/johannes-kepler.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "tycho-brahe",
    born: "1546",
    died: "1601",
    nationality: "Danish",
    image: storageUrl("physicists/tycho-brahe.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "claudius-ptolemy",
    born: "c. 100",
    died: "c. 170",
    nationality: "Greco-Roman",
    image: storageUrl("physicists/claudius-ptolemy.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "nicolaus-copernicus",
    born: "1473",
    died: "1543",
    nationality: "Polish",
    image: storageUrl("physicists/nicolaus-copernicus.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "urbain-le-verrier",
    born: "1811",
    died: "1877",
    nationality: "French",
    image: storageUrl("physicists/urbain-le-verrier.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "kepler" },
    ],
  },
  {
    slug: "pierre-bouguer",
    born: "1698",
    died: "1758",
    nationality: "French",
    image: storageUrl("physicists/pierre-bouguer.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-simple-pendulum" },
    ],
  },
  {
    slug: "adrien-marie-legendre",
    born: "1752",
    died: "1833",
    nationality: "French",
    image: storageUrl("physicists/adrien-marie-legendre.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "nikola-tesla",
    born: "1856",
    died: "1943",
    nationality: "Serbian-American",
    image: storageUrl("physicists/nikola-tesla.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
      { branchSlug: "electromagnetism", topicSlug: "transformers" },
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
    ],
  },
  {
    slug: "jules-lissajous",
    born: "1822",
    died: "1880",
    nationality: "French",
    image: storageUrl("physicists/jules-lissajous.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "henry-cavendish",
    born: "1731",
    died: "1810",
    nationality: "British",
    image: storageUrl("physicists/henry-cavendish.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "universal-gravitation" },
    ],
  },
  {
    slug: "joseph-louis-lagrange",
    born: "1736",
    died: "1813",
    nationality: "Italian-French",
    image: storageUrl("physicists/joseph-louis-lagrange.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "henri-poincare",
    born: "1854",
    died: "1912",
    nationality: "French",
    image: storageUrl("physicists/henri-poincare.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "tides-and-three-body" },
    ],
  },
  {
    slug: "nicole-oresme",
    born: "c. 1320",
    died: "1382",
    nationality: "French",
    image: storageUrl("physicists/nicole-oresme.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "motion-in-a-straight-line" },
    ],
  },
  {
    slug: "robert-hooke",
    born: "1635",
    died: "1703",
    nationality: "English",
    image: storageUrl("physicists/robert-hooke.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "newtons-three-laws" },
      { branchSlug: "classical-mechanics", topicSlug: "oscillators-everywhere" },
    ],
  },
  {
    slug: "evangelista-torricelli",
    born: "1608",
    died: "1647",
    nationality: "Italian",
    image: storageUrl("physicists/evangelista-torricelli.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "vectors-and-projectile-motion" },
    ],
  },
  {
    slug: "guillaume-amontons",
    born: "1663",
    died: "1705",
    nationality: "French",
    image: storageUrl("physicists/guillaume-amontons.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "george-gabriel-stokes",
    born: "1819",
    died: "1903",
    nationality: "Irish",
    image: storageUrl("physicists/george-gabriel-stokes.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "friction-and-drag" },
    ],
  },
  {
    slug: "gottfried-wilhelm-leibniz",
    born: "1646",
    died: "1716",
    nationality: "German",
    image: storageUrl("physicists/gottfried-wilhelm-leibniz.webp"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "emilie-du-chatelet",
    born: "1706",
    died: "1749",
    nationality: "French",
    image: storageUrl("physicists/emilie-du-chatelet.webp"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "james-prescott-joule",
    born: "1818",
    died: "1889",
    nationality: "English",
    image: storageUrl("physicists/james-prescott-joule.webp"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
      { branchSlug: "electromagnetism", topicSlug: "rlc-circuits-and-resonance" },
    ],
  },
  {
    slug: "thomas-young",
    born: "1773",
    died: "1829",
    nationality: "English",
    image: storageUrl("physicists/thomas-young.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "james-watt",
    born: "1736",
    died: "1819",
    nationality: "Scottish",
    image: storageUrl("physicists/james-watt.webp"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "energy-and-work" },
    ],
  },
  {
    slug: "rene-descartes",
    born: "1596",
    died: "1650",
    nationality: "French",
    image: storageUrl("physicists/rene-descartes.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "john-wallis",
    born: "1616",
    died: "1703",
    nationality: "English",
    image: storageUrl("physicists/john-wallis.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "leonhard-euler",
    born: "1707",
    died: "1783",
    nationality: "Swiss",
    image: storageUrl("physicists/leonhard-euler.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "angular-momentum" },
    ],
  },
  {
    slug: "emmy-noether",
    born: "1882",
    died: "1935",
    nationality: "German",
    image: storageUrl("physicists/emmy-noether.webp"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "david-hilbert",
    born: "1862",
    died: "1943",
    nationality: "German",
    image: storageUrl("physicists/david-hilbert.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "felix-klein",
    born: "1849",
    died: "1925",
    nationality: "German",
    image: storageUrl("physicists/felix-klein.webp"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "albert-einstein",
    born: "1879",
    died: "1955",
    nationality: "German-Swiss-American",
    image: storageUrl("physicists/albert-einstein.webp"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "noethers-theorem" },
    ],
  },
  {
    slug: "archimedes",
    born: "c. 287 BCE",
    died: "c. 212 BCE",
    nationality: "Greek (Syracusan)",
    image: storageUrl("physicists/archimedes.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "jacob-steiner",
    born: "1796",
    died: "1863",
    nationality: "Swiss",
    image: storageUrl("physicists/jacob-steiner.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "moment-of-inertia" },
    ],
  },
  {
    slug: "elmer-sperry",
    born: "1860",
    died: "1930",
    nationality: "American",
    image: storageUrl("physicists/elmer-sperry.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
    ],
  },
  {
    slug: "hipparchus",
    born: "c. 190 BCE",
    died: "c. 120 BCE",
    nationality: "Greek",
    image: storageUrl("physicists/hipparchus.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "seth-carlo-chandler",
    born: "1846",
    died: "1913",
    nationality: "American",
    image: storageUrl("physicists/seth-carlo-chandler.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "jean-d-alembert",
    born: "1717",
    died: "1783",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "brook-taylor",
    born: "1685",
    died: "1731",
    nationality: "English",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "beyond-small-angles" },
    ],
  },
  {
    slug: "daniel-bernoulli",
    born: "1700",
    died: "1782",
    nationality: "Swiss",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wave-equation" },
      { branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" },
    ],
  },
  {
    slug: "william-rowan-hamilton",
    born: "1805",
    died: "1865",
    nationality: "Irish",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" },
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
    ],
  },
  {
    slug: "john-william-strutt-rayleigh",
    born: "1842",
    died: "1919",
    nationality: "English",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "dispersion-and-group-velocity" },
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "pythagoras",
    born: "c. 570 BCE",
    died: "c. 495 BCE",
    nationality: "Greek (Ionian)",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "joseph-fourier",
    born: "1768",
    died: "1830",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "ernst-chladni",
    born: "1756",
    died: "1827",
    nationality: "German",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "hermann-von-helmholtz",
    born: "1821",
    died: "1894",
    nationality: "German",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "standing-waves-and-modes" },
    ],
  },
  {
    slug: "christian-doppler",
    born: "1803",
    died: "1853",
    nationality: "Austrian",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" },
    ],
  },
  {
    slug: "christophe-buys-ballot",
    born: "1817",
    died: "1890",
    nationality: "Dutch",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" },
    ],
  },
  {
    slug: "ernst-mach",
    born: "1838",
    died: "1916",
    nationality: "Austrian",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" },
    ],
  },
  {
    slug: "vesto-slipher",
    born: "1875",
    died: "1969",
    nationality: "American",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "doppler-and-shock-waves" },
    ],
  },
  {
    slug: "simeon-denis-poisson",
    born: "1781",
    died: "1840",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "angular-momentum" },
      { branchSlug: "electromagnetism", topicSlug: "method-of-images" },
      { branchSlug: "electromagnetism", topicSlug: "the-vector-potential" },
    ],
  },
  {
    slug: "konstantin-tsiolkovsky",
    born: "1857",
    died: "1935",
    nationality: "Russian",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "momentum-and-collisions" },
    ],
  },
  {
    slug: "johann-bohnenberger",
    born: "1765",
    died: "1831",
    nationality: "German",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
    ],
  },
  {
    slug: "pierre-simon-laplace",
    born: "1749",
    died: "1827",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "gyroscopes-and-precession" },
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "milutin-milankovic",
    born: "1879",
    died: "1958",
    nationality: "Serbian",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-wobbling-earth" },
    ],
  },
  {
    slug: "blaise-pascal",
    born: "1623",
    died: "1662",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" },
    ],
  },
  {
    slug: "simon-stevin",
    born: "1548",
    died: "1620",
    nationality: "Flemish",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "pressure-and-buoyancy" },
    ],
  },
  {
    slug: "giovanni-venturi",
    born: "1746",
    died: "1822",
    nationality: "Italian",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "bernoullis-principle" },
    ],
  },
  {
    slug: "jean-poiseuille",
    born: "1797",
    died: "1869",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
    ],
  },
  {
    slug: "osborne-reynolds",
    born: "1842",
    died: "1912",
    nationality: "Irish",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
    ],
  },
  {
    slug: "edward-mills-purcell",
    born: "1912",
    died: "1997",
    nationality: "American",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
    ],
  },
  {
    slug: "claude-louis-navier",
    born: "1785",
    died: "1836",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
      { branchSlug: "classical-mechanics", topicSlug: "viscosity-and-reynolds-number" },
    ],
  },
  {
    slug: "lewis-fry-richardson",
    born: "1881",
    died: "1953",
    nationality: "English",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
    ],
  },
  {
    slug: "andrey-kolmogorov",
    born: "1903",
    died: "1987",
    nationality: "Russian",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "turbulence" },
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "pierre-louis-maupertuis",
    born: "1698",
    died: "1759",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" },
    ],
  },
  {
    slug: "pierre-de-fermat",
    born: "1607",
    died: "1665",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-principle-of-least-action" },
    ],
  },
  {
    slug: "joseph-liouville",
    born: "1809",
    died: "1882",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "the-hamiltonian" },
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "vladimir-arnold",
    born: "1937",
    died: "2010",
    nationality: "Russian",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "jurgen-moser",
    born: "1928",
    died: "1999",
    nationality: "German-American",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "aleksandr-lyapunov",
    born: "1857",
    died: "1918",
    nationality: "Russian",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "phase-space" },
    ],
  },
  {
    slug: "charles-augustin-de-coulomb",
    born: "1736",
    died: "1806",
    nationality: "French",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "coulombs-law" },
      { branchSlug: "electromagnetism", topicSlug: "the-electric-field" },
    ],
  },
  {
    slug: "benjamin-franklin",
    born: "1706",
    died: "1790",
    nationality: "American",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "coulombs-law" },
      { branchSlug: "electromagnetism", topicSlug: "electric-potential" },
    ],
  },
  {
    slug: "carl-friedrich-gauss",
    born: "1777",
    died: "1855",
    nationality: "German",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauss-law" },
    ],
  },
  {
    slug: "michael-faraday",
    born: "1791",
    died: "1867",
    nationality: "English",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electric-field" },
      { branchSlug: "electromagnetism", topicSlug: "conductors-and-shielding" },
      { branchSlug: "electromagnetism", topicSlug: "the-vector-potential" },
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
      { branchSlug: "electromagnetism", topicSlug: "energy-in-magnetic-fields" },
      { branchSlug: "electromagnetism", topicSlug: "eddy-currents" },
    ],
  },
  {
    slug: "pierre-curie",
    born: "1859",
    died: "1906",
    nationality: "French",
    image: storageUrl("physicists/pierre-curie.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "piezo-and-ferroelectricity" },
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
    ],
  },
  {
    slug: "hans-christian-orsted",
    born: "1777",
    died: "1851",
    nationality: "Danish",
    image: storageUrl("physicists/hans-christian-orsted.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "andre-marie-ampere",
    born: "1775",
    died: "1836",
    nationality: "French",
    image: storageUrl("physicists/andre-marie-ampere.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "jean-baptiste-biot",
    born: "1774",
    died: "1862",
    nationality: "French",
    image: storageUrl("physicists/jean-baptiste-biot.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "felix-savart",
    born: "1791",
    died: "1841",
    nationality: "French",
    image: storageUrl("physicists/felix-savart.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "hendrik-antoon-lorentz",
    born: "1853",
    died: "1928",
    nationality: "Dutch",
    image: storageUrl("physicists/hendrik-antoon-lorentz.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
    ],
  },
  {
    slug: "pierre-weiss",
    born: "1865",
    died: "1940",
    nationality: "French",
    image: storageUrl("physicists/pierre-weiss.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
    ],
  },
  {
    slug: "walther-meissner",
    born: "1882",
    died: "1974",
    nationality: "German",
    image: storageUrl("physicists/walther-meissner.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "heike-kamerlingh-onnes",
    born: "1853",
    died: "1926",
    nationality: "Dutch",
    image: storageUrl("physicists/heike-kamerlingh-onnes.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "joseph-henry",
    born: "1797",
    died: "1878",
    nationality: "American",
    image: storageUrl("physicists/joseph-henry.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "heinrich-lenz",
    born: "1804",
    died: "1865",
    nationality: "Russian",
    image: storageUrl("physicists/heinrich-lenz.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
  {
    slug: "gustav-kirchhoff",
    born: "1824",
    died: "1887",
    nationality: "German",
    image: storageUrl("physicists/gustav-kirchhoff.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
      { branchSlug: "electromagnetism", topicSlug: "rlc-circuits-and-resonance" },
    ],
  },
  {
    slug: "georg-ohm",
    born: "1789",
    died: "1854",
    nationality: "German",
    image: storageUrl("physicists/georg-ohm.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "oliver-heaviside",
    born: "1850",
    died: "1925",
    nationality: "British",
    image: storageUrl("physicists/oliver-heaviside.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
    ],
  },
  {
    slug: "james-clerk-maxwell",
    born: "1831",
    died: "1879",
    nationality: "Scottish",
    image: storageUrl("physicists/james-clerk-maxwell.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "displacement-current" },
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "john-henry-poynting",
    born: "1852",
    died: "1914",
    nationality: "British",
    image: storageUrl("physicists/john-henry-poynting.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
    ],
  },
];

export function getPhysicist(slug: string): Physicist | undefined {
  return PHYSICISTS.find((p) => p.slug === slug);
}

export function getAllPhysicists(): readonly Physicist[] {
  return PHYSICISTS;
}
