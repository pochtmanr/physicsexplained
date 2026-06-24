/**
 * FIG.15 PRESSURE FROM MOLECULAR COLLISIONS — pure-TS helpers.
 *
 * Daniel Bernoulli, St Petersburg, 1738: a gas is not a continuous fluid but a
 * swarm of tiny particles flying in straight lines between collisions, and the
 * pressure on a wall is nothing but the average rate at which their momentum is
 * delivered to it. Ignored for 120 years, then re-derived by Krönig (1856) and
 * Clausius (1857), this is the founding idea of the kinetic theory.
 *
 * The derivation, in one line: a molecule of mass m and x-velocity v_x bouncing
 * elastically off a wall delivers Δp = 2 m v_x per hit, hitting v_x/(2L) times
 * per second. Sum over N molecules in a box of side L and generalise to three
 * dimensions:
 *
 *   P V = (1/3) N m ⟨v²⟩.
 *
 * Matching this to the ideal gas law P V = N k_B T forces
 *
 *   (1/2) m ⟨v²⟩ = (3/2) k_B T,
 *
 * the quantitative meaning of temperature: the average translational kinetic
 * energy per molecule is (3/2) k_B T. From it, the root-mean-square speed
 * v_rms = √(3 k_B T / m). Light molecules are fast — which is why H₂ leaks out
 * of Earth's atmosphere while N₂ stays bound.
 *
 * SI units: T in kelvin, m in kg per molecule, V in m³, P in Pa. React-free.
 */

/** Boltzmann constant, J/K (exact since the 2019 SI). */
export const K_B = 1.380649e-23;

/** Avogadro constant, 1/mol (exact since the 2019 SI). */
export const N_A = 6.02214076e23;

/** Mean translational kinetic energy per molecule, (3/2) k_B T  [J]. */
export function meanKE(T: number): number {
  return 1.5 * K_B * T;
}

/** Mean-square speed ⟨v²⟩ = 3 k_B T / m at temperature T  [m²/s²]. */
export function meanSquareFromT(T: number, m: number): number {
  return (3 * K_B * T) / m;
}

/** Root-mean-square speed v_rms = √(3 k_B T / m)  [m/s]. */
export function vRms(T: number, m: number): number {
  return Math.sqrt(meanSquareFromT(T, m));
}

/** Temperature implied by a measured mean-square speed: T = m⟨v²⟩ / 3k_B  [K]. */
export function temperatureFromMeanSquare(meanSq: number, m: number): number {
  return (m * meanSq) / (3 * K_B);
}

/**
 * Kinetic pressure from the Bernoulli–Clausius relation P V = (1/3) N m ⟨v²⟩,
 * i.e. P = N m ⟨v²⟩ / (3 V)  [Pa]. With ⟨v²⟩ = 3 k_B T / m this collapses to
 * the ideal gas law P = N k_B T / V — the whole point of the derivation.
 */
export function pressureFromMeanSquare(
  N: number,
  m: number,
  meanSq: number,
  V: number,
): number {
  return (N * m * meanSq) / (3 * V);
}

/** A gas species with its molar mass and a one-line teaching note. */
export interface Species {
  /** Display name. */
  name: string;
  /** Molar mass, kg/mol. */
  molarMass: number;
  /** Per-molecule mass, kg (molarMass / N_A). */
  mass: number;
  /** One real-world consequence of this molecule's speed. */
  note: string;
}

function species(name: string, molarMass: number, note: string): Species {
  return { name, molarMass, mass: molarMass / N_A, note };
}

/**
 * Five gases spanning two decades of molecular mass, lightest first. At a fixed
 * temperature they all share the same mean kinetic energy, so the light ones
 * must move faster: v_rms ∝ 1/√m.
 */
export const SPECIES: readonly Species[] = [
  species("H₂", 0.0020159, "Fast enough to escape Earth's gravity over aeons."),
  species("He", 0.0040026, "Leaks from balloons and from the atmosphere alike."),
  species("N₂", 0.0280134, "The bulk of the air; too heavy to escape."),
  species("Ar", 0.0399480, "A monatomic noble gas, ~1% of the atmosphere."),
  species("Xe", 0.1312930, "Heavy and sluggish; used in ion thrusters."),
];

/** v_rms for a named species at temperature T  [m/s]. */
export function vRmsForSpecies(name: string, T: number): number {
  const s = SPECIES.find((x) => x.name === name) ?? SPECIES[2];
  return vRms(T, s.mass);
}

/**
 * The three characteristic speeds of the 3D Maxwell–Boltzmann distribution at
 * temperature T for a molecule of mass m, in the order they always fall:
 *   most-probable  v_mp  = √(2 k_B T / m)
 *   mean           ⟨v⟩   = √(8 k_B T / πm)
 *   root-mean-sq   v_rms = √(3 k_B T / m).
 * Provided here so the rms-speed scene can mark all three without duplicating
 * the algebra (the distribution itself lives in `maxwell-boltzmann.ts`).
 */
export function characteristicSpeeds(
  T: number,
  m: number,
): { vMp: number; vMean: number; vRms: number } {
  return {
    vMp: Math.sqrt((2 * K_B * T) / m),
    vMean: Math.sqrt((8 * K_B * T) / (Math.PI * m)),
    vRms: Math.sqrt((3 * K_B * T) / m),
  };
}
