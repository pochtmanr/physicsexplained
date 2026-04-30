/**
 * §05.3 GPS AS RELATIVITY — pure-TS helpers.
 *
 * The working relativity experiment in everyone's pocket. GPS satellites
 * orbit at ~20,200 km altitude (semi-major axis ~26,571 km from Earth's
 * center) and travel at ~3.87 km/s. Two relativistic clock corrections
 * apply, each derivable from a different module of the theory:
 *
 *   • SR (kinematic) time dilation — the orbiting clock runs slow because
 *     it moves at β ≈ 1.3 × 10⁻⁵ in the Earth-centered inertial frame.
 *     Δτ/Δt ≈ −β²/2 ≈ −7.2 μs/day.
 *
 *   • GR (gravitational) time dilation — the orbiting clock runs fast
 *     because it sits at a higher (less negative) gravitational potential
 *     than a clock at Earth's surface. To leading weak-field order:
 *     Δτ/Δt ≈ (Φ_orbit − Φ_surface)/c² ≈ +45.7 μs/day.
 *
 * Net: +38.5 μs/day. Without this correction the satellite-to-ground
 * timing offset would accumulate at c × 38.5 μs ≈ 11.5 km of position
 * drift per day. The receiver firmware applies it; relativity is the
 * calibration.
 *
 * Conventions:
 *   • SI throughout. Speeds in m/s, radii in m, masses in kg, c in m/s.
 *   • "Per day" results are in seconds (or microseconds where labelled).
 *   • Sign convention: positive = orbit clock gains time vs surface.
 */

import { SPEED_OF_LIGHT, G_SI } from "@/lib/physics/constants";

/** Earth's mass, kg (IAU 2015 nominal). */
export const EARTH_MASS_KG = 5.972e24;

/** Earth's mean radius, m (volumetric). */
export const EARTH_RADIUS_M = 6.371e6;

/** GPS orbit altitude above sea level, m (semi-major axis ~26,571 km from
 *  Earth's center; orbital period ~11h 58min, half a sidereal day). */
export const GPS_ORBIT_ALTITUDE_M = 20.2e6;

/** GPS orbital radius from Earth's center, m. */
export const GPS_ORBIT_RADIUS_M = EARTH_RADIUS_M + GPS_ORBIT_ALTITUDE_M;

/** Seconds in one solar day. */
export const SECONDS_PER_DAY = 86400;

/**
 * Orbital speed of a circular orbit at radius r from a body of mass M.
 * Kepler's third law: v = √(GM/r). Defaults to GPS at Earth.
 *
 * @example
 *   gpsOrbitalSpeed() ≈ 3873 m/s   // GPS satellite, β ≈ 1.29 × 10⁻⁵
 */
export function gpsOrbitalSpeed(
  r: number = GPS_ORBIT_RADIUS_M,
  M: number = EARTH_MASS_KG,
  G: number = G_SI,
): number {
  return Math.sqrt((G * M) / r);
}

/**
 * SR (kinematic) time-dilation correction in seconds-per-day.
 *
 * A clock moving at speed v in the Earth-centered inertial frame ticks
 * slower than a clock at rest in that frame by a factor √(1 − β²).
 * Returned value is the integrated offset over one solar day:
 *
 *   Δτ_SR − Δt = (√(1 − β²) − 1) · 86400 s
 *              ≈ −β²/2 · 86400 s   for β ≪ 1
 *
 * Negative — the orbiting clock loses time. At GPS β ≈ 1.29 × 10⁻⁵ the
 * result is ≈ −7.2 μs/day.
 *
 * Note on frames: Earth's surface clock is itself rotating, so a fully
 * rigorous derivation works in the geocentric non-rotating frame and
 * subtracts both clocks' velocities from the orbiting one. The small
 * difference (~10⁻¹⁰ relative) is below textbook precision and is
 * folded into the canonical −7 μs/day figure quoted everywhere.
 */
export function srCorrectionSecondsPerDay(
  orbitalSpeed: number,
  c: number = SPEED_OF_LIGHT,
): number {
  const beta = orbitalSpeed / c;
  const fractional = Math.sqrt(1 - beta * beta) - 1;
  return fractional * SECONDS_PER_DAY;
}

/**
 * GR (gravitational) time-dilation correction in seconds-per-day.
 *
 * A clock at gravitational potential Φ ticks at a rate proportional to
 * √(1 + 2Φ/c²) ≈ 1 + Φ/c² (weak-field, Newtonian potential). The ratio
 * of orbit-clock rate to surface-clock rate is:
 *
 *   Δτ_orbit / Δτ_surface ≈ 1 + (Φ_orbit − Φ_surface)/c²
 *                          = 1 + (GM/c²)(1/R_⊕ − 1/r)
 *
 * Higher altitude → less negative potential → orbit clock ticks faster.
 * Returned value is the offset over one day:
 *
 *   Δτ_orbit − Δτ_surface ≈ (GM/c²)(1/R_⊕ − 1/r) · 86400 s
 *
 * At GPS altitude (r ≈ 26,571 km, R_⊕ ≈ 6,371 km) the result is
 * ≈ +45.7 μs/day. Positive — the orbit clock gains time.
 */
export function grCorrectionSecondsPerDay(
  orbitRadius: number,
  surfaceRadius: number = EARTH_RADIUS_M,
  M: number = EARTH_MASS_KG,
  G: number = G_SI,
  c: number = SPEED_OF_LIGHT,
): number {
  const phi_orbit = (-G * M) / orbitRadius;
  const phi_surface = (-G * M) / surfaceRadius;
  const fractional = (phi_orbit - phi_surface) / (c * c);
  return fractional * SECONDS_PER_DAY;
}

/**
 * Net SR + GR correction in microseconds-per-day at canonical GPS
 * altitude. Positive = orbit clock gains time vs ground clock.
 *
 * @example
 *   netCorrectionMicrosecondsPerDay() ≈ +38.5 μs/day
 */
export function netCorrectionMicrosecondsPerDay(
  orbitRadius: number = GPS_ORBIT_RADIUS_M,
  surfaceRadius: number = EARTH_RADIUS_M,
  M: number = EARTH_MASS_KG,
  G: number = G_SI,
  c: number = SPEED_OF_LIGHT,
): number {
  const v = gpsOrbitalSpeed(orbitRadius, M, G);
  const sr = srCorrectionSecondsPerDay(v, c);
  const gr = grCorrectionSecondsPerDay(orbitRadius, surfaceRadius, M, G, c);
  return (sr + gr) * 1e6;
}

/**
 * Position drift per day if the +38.5 μs/day correction is not applied.
 * A timing error of Δt produces a pseudorange error of c · Δt; uncorrected,
 * GPS positions drift at:
 *
 *   drift_km/day = c · |Δt_net| / 1000
 *                ≈ 11.5 km/day
 *
 * The drift compounds linearly. After one hour, ~480 m. After one week,
 * ~80 km. After one month, ~350 km — useless for navigation. The receiver
 * applies the broadcast correction; without it, GPS would not work.
 */
export function uncorrectedDriftKmPerDay(
  orbitRadius: number = GPS_ORBIT_RADIUS_M,
  surfaceRadius: number = EARTH_RADIUS_M,
  M: number = EARTH_MASS_KG,
  G: number = G_SI,
  c: number = SPEED_OF_LIGHT,
): number {
  const net_us = netCorrectionMicrosecondsPerDay(
    orbitRadius,
    surfaceRadius,
    M,
    G,
    c,
  );
  const drift_seconds = Math.abs(net_us) * 1e-6;
  return (c * drift_seconds) / 1000;
}

/**
 * Position drift after an arbitrary elapsed time, in meters. Linear in
 * elapsed time (the correction rate is constant for a circular orbit).
 *
 * @example
 *   uncorrectedDriftMeters(3600) ≈ 481 m       // after 1 hour
 *   uncorrectedDriftMeters(86400) ≈ 11_546 m   // after 1 day
 *   uncorrectedDriftMeters(7 * 86400) ≈ 80 822 m  // after 1 week
 */
export function uncorrectedDriftMeters(
  elapsedSeconds: number,
  orbitRadius: number = GPS_ORBIT_RADIUS_M,
  surfaceRadius: number = EARTH_RADIUS_M,
  M: number = EARTH_MASS_KG,
  G: number = G_SI,
  c: number = SPEED_OF_LIGHT,
): number {
  const drift_km_per_day = uncorrectedDriftKmPerDay(
    orbitRadius,
    surfaceRadius,
    M,
    G,
    c,
  );
  const drift_m_per_second = (drift_km_per_day * 1000) / SECONDS_PER_DAY;
  return drift_m_per_second * elapsedSeconds;
}
