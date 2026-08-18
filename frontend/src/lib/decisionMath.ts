/**
 * Decision Theory & Math Engine (TypeScript Port)
 * 
 * Ported pure functions for client-side live recomputation of Expected Utility
 * and sensitivity inflection thresholds on the interactive balance scale visualizer.
 * 
 * NOTE: The exact algebraic formulations implemented here MUST match the backend
 * implementation in `backend/app/engines/math_engine.py`.
 * 
 * Authoritative Single Source of Truth: `DESIGN.md` §3.2 (Layer 2: Decision Theory & Math Engine).
 */

/**
 * Computes Expected Utility for a single alternative across 2 states of the world.
 * Formula: EU(a) = p * U(a, s_1) + (1 - p) * U(a, s_2)
 *
 * @param p Probability of state 1 (range [0, 1])
 * @param u_s1 Payoff utility under state 1
 * @param u_s2 Payoff utility under state 2
 * @returns Expected Utility rounded to 1 decimal place
 */
export function calculateExpectedUtility(p: number, u_s1: number, u_s2: number): number {
  const rawEU = p * u_s1 + (1 - p) * u_s2;
  return Math.round(rawEU * 10) / 10;
}

/**
 * Computes the exact closed-form flipping probability threshold p_1* where EU(a_1) = EU(a_2).
 *
 * Formula (DESIGN.md §3.2):
 * p_1* = [U(a_2, s_2) - U(a_1, s_2)] / [(U(a_1, s_1) - U(a_1, s_2)) - (U(a_2, s_1) - U(a_2, s_2))]
 *
 * @param u1_s1 Payoff for Alternative 1 under State 1
 * @param u1_s2 Payoff for Alternative 1 under State 2
 * @param u2_s1 Payoff for Alternative 2 under State 1
 * @param u2_s2 Payoff for Alternative 2 under State 2
 * @returns Inflection threshold probability p_1* clamped to [0, 1] or null if denominator is near zero.
 */
export function calculateInflectionThreshold(
  u1_s1: number,
  u1_s2: number,
  u2_s1: number,
  u2_s2: number
): { inflectionProbability: number; clampedProbability: number; formula: string } {
  const numerator = u2_s2 - u1_s2;
  const denominator = (u1_s1 - u1_s2) - (u2_s1 - u2_s2);

  let inflectionP = 0.5;
  if (Math.abs(denominator) > 1e-6) {
    inflectionP = numerator / denominator;
  }

  const clampedP = Math.max(0, Math.min(1, inflectionP));
  const formula = `p* = [U(a2, s2) - U(a1, s2)] / [(U(a1, s1) - U(a1, s2)) - (U(a2, s1) - U(a2, s2))]`;

  return {
    inflectionProbability: inflectionP,
    clampedProbability: clampedP,
    formula,
  };
}
