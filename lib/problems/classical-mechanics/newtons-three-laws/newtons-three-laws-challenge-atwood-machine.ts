/**
 * CHALLENGE — Atwood machine: two masses connected over a frictionless pulley.
 *
 * Mass m₁ = 4 kg hangs on the left; mass m₂ = 6 kg hangs on the right.
 * The pulley is massless and frictionless. Find the acceleration of the system
 * and the tension in the string.
 *
 * Physics:
 *   Net force on system = (m₂ - m₁) * g  (heavier side pulls harder)
 *   Total inertia = m₁ + m₂
 *   a = (m₂ - m₁) * g / (m₁ + m₂)
 *   T = m₁ * (g + a)   [tension felt by m₁ accelerating upward]
 *
 * Steps:
 *   1. F_net_system = (m_2 - m_1) * g     (net gravitational driving force)
 *   2. m_total = m_1 + m_2                 (total inertial mass)
 *   3. a = F_net_system / m_total           (system acceleration)
 *   4. T = m_1 * (g + a)                   (string tension from m₁'s free body)
 */

import { acceleration } from "@/lib/physics/newton";
import { G } from "@/lib/physics/friction";

export const inputs: Record<string, { value: number; units: string }> = {
  m_1: { value: 4, units: "kg" },
  m_2: { value: 6, units: "kg" },
  g: { value: G, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const m_1 = inputs.m_1.value;
  const m_2 = inputs.m_2.value;
  const g = inputs.g.value;

  // Step 1: net driving force on the system
  const F_net_system = (m_2 - m_1) * g;

  // Step 2: total inertial mass
  const m_total = m_1 + m_2;

  // Step 3: system acceleration via Newton's second law
  const a = acceleration(F_net_system, m_total);

  // Step 4: string tension from m₁'s free body diagram
  // m₁ accelerates upward: T - m₁*g = m₁*a  =>  T = m₁*(g + a)
  const T = m_1 * (g + a);

  return { F_net_system, m_total, a, T };
}
