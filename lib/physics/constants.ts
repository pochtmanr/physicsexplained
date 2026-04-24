/**
 * Physical constants in SI units.
 * Source: CODATA 2018 and IAU 2012.
 */

/** Gravitational constant, m^3 kg^-1 s^-2 */
export const G_SI = 6.6743e-11;

/** Standard gravity at Earth's surface, m/s^2 */
export const g_SI = 9.80665;

/** One astronomical unit in meters (IAU 2012 definition) */
export const AU_M = 1.495978707e11;

/** One Julian year in seconds */
export const YEAR_S = 365.25 * 86400;

/** Standard gravitational parameter of the Sun, m^3/s^2 */
export const GM_SUN_SI = 1.32712440018e20;

/** Vacuum permittivity, F/m (CODATA 2018) */
export const EPSILON_0 = 8.8541878128e-12;

/** Coulomb's constant, k_e = 1 / (4π ε₀), N·m²/C² */
export const K_COULOMB = 1 / (4 * Math.PI * EPSILON_0);

/** Elementary charge, C (exact, SI 2019 redefinition) */
export const ELEMENTARY_CHARGE = 1.602176634e-19;

/** Vacuum permeability, H/m (CODATA 2018) */
export const MU_0 = 1.25663706212e-6;

/** Speed of light in vacuum, m/s (exact, SI 2019 redefinition) */
export const SPEED_OF_LIGHT = 2.99792458e8;

/** Bohr magneton, J/T (CODATA 2018) — used by magnetic-dipole topic */
export const BOHR_MAGNETON = 9.2740100783e-24;

/** Fine-structure constant α = e²/(4πε₀ ℏc) ≈ 1/137 (CODATA 2018, dimensionless) */
export const ALPHA_FINE = 7.2973525693e-3;
