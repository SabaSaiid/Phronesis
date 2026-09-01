/**
 * Decision Theory & Math Engine (TypeScript Port)
 * 
 * Ported pure functions for client-side live recomputation of Expected Utility,
 * Minimax Regret, and sensitivity inflection thresholds on the interactive balance scale visualizer.
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
 * Computes Expected Utility for an arbitrary N-state probability distribution and payoff vector.
 *
 * @param probabilities Normalized probabilities summing to 1.0 (or auto-normalized)
 * @param utilities Payoff utility vector matching each state
 * @returns Expected Utility rounded to 1 decimal place
 */
export function calculateExpectedUtilityNState(
  probabilities: number[],
  utilities: number[]
): number {
  if (probabilities.length === 0 || utilities.length === 0) return 50.0;
  const pSum = probabilities.reduce((acc, p) => acc + p, 0);
  const normalizedP = pSum > 0 ? probabilities.map((p) => p / pSum) : probabilities.map(() => 1 / probabilities.length);

  const rawEU = normalizedP.reduce((acc, p, idx) => acc + p * (utilities[idx] ?? 50.0), 0);
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
 * @returns Inflection threshold probability p_1* clamped to [0, 1] and algebraic formula.
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
    inflectionProbability: Math.round(inflectionP * 1000) / 1000,
    clampedProbability: Math.round(clampedP * 1000) / 1000,
    formula,
  };
}

/**
 * Computes the Minimax Regret matrix client-side for dynamic what-if simulation.
 *
 * @param altIds List of alternative IDs
 * @param stateIds List of state of world IDs
 * @param payoffMap Map or matrix of (altId, stateId) -> utility
 */
export function calculateClientMinimaxRegret(
  altIds: string[],
  stateIds: string[],
  payoffLookup: (altId: string, stateId: string) => number
): {
  regretMatrix: Record<string, Record<string, number>>;
  maxRegrets: Record<string, number>;
  minimaxRegretAltId: string;
} {
  // 1. Find max utility for each state: U*_j = max_i U[i, j]
  const uStar: Record<string, number> = {};
  for (const sId of stateIds) {
    let maxVal = -Infinity;
    for (const aId of altIds) {
      const u = payoffLookup(aId, sId);
      if (u > maxVal) maxVal = u;
    }
    uStar[sId] = maxVal;
  }

  // 2. Compute Regret R[i, j] = U*_j - U[i, j]
  const regretMatrix: Record<string, Record<string, number>> = {};
  const maxRegrets: Record<string, number> = {};

  let minMaxRegret = Infinity;
  let minimaxRegretAltId = altIds[0] || '';

  for (const aId of altIds) {
    regretMatrix[aId] = {};
    let maxR = -Infinity;
    for (const sId of stateIds) {
      const r = Math.max(0, (uStar[sId] ?? 50) - payoffLookup(aId, sId));
      const roundedR = Math.round(r * 10) / 10;
      regretMatrix[aId][sId] = roundedR;
      if (roundedR > maxR) maxR = roundedR;
    }
    maxRegrets[aId] = maxR;
    if (maxR < minMaxRegret) {
      minMaxRegret = maxR;
      minimaxRegretAltId = aId;
    }
  }

  return {
    regretMatrix,
    maxRegrets,
    minimaxRegretAltId,
  };
}

/**
 * Computes Expected Value of Perfect Information (EVPI) client-side.
 * Formally: EVPI = sum_j p_j * max_i U[i, j] - max_i sum_j p_j * U[i, j]
 */
export function calculateClientEVPI(
  altIds: string[],
  stateIds: string[],
  probabilities: number[],
  payoffLookup: (altId: string, stateId: string) => number
): {
  evpi: number;
  priorMaxEU: number;
  posteriorMaxEU: number;
  fractionalEVPI: number;
} {
  const pSum = probabilities.reduce((a, b) => a + b, 0);
  const p = pSum > 0 ? probabilities.map((val) => val / pSum) : probabilities.map(() => 1 / probabilities.length);

  // 1. Prior max EU
  let priorMaxEU = -Infinity;
  for (const aId of altIds) {
    let eu = 0;
    for (let j = 0; j < stateIds.length; j++) {
      eu += p[j] * payoffLookup(aId, stateIds[j]);
    }
    if (eu > priorMaxEU) priorMaxEU = eu;
  }

  // 2. Posterior max EU under perfect information
  let posteriorMaxEU = 0;
  for (let j = 0; j < stateIds.length; j++) {
    let maxUForState = -Infinity;
    for (const aId of altIds) {
      const u = payoffLookup(aId, stateIds[j]);
      if (u > maxUForState) maxUForState = u;
    }
    posteriorMaxEU += p[j] * maxUForState;
  }

  const evpi = Math.max(0, posteriorMaxEU - priorMaxEU);
  const fractionalEVPI = priorMaxEU > 0 ? evpi / priorMaxEU : 0;

  return {
    evpi: Math.round(evpi * 100) / 100,
    priorMaxEU: Math.round(priorMaxEU * 100) / 100,
    posteriorMaxEU: Math.round(posteriorMaxEU * 100) / 100,
    fractionalEVPI: Math.round(fractionalEVPI * 1000) / 1000,
  };
}

/**
 * Computes Cumulative Prospect Theory (CPT) values client-side for dynamic slider adjustments.
 * Tversky & Kahneman (1992): v(x) = (x - ref)^alpha if x >= ref, else -lambda * (ref - x)^beta
 */
export function calculateClientCPT(
  altIds: string[],
  stateIds: string[],
  probabilities: number[],
  payoffLookup: (altId: string, stateId: string) => number,
  refPoint: number = 50,
  lambda: number = 2.25,
  alpha: number = 0.88,
  beta: number = 0.88
): Record<string, number> {
  const pSum = probabilities.reduce((a, b) => a + b, 0);
  const p = pSum > 0 ? probabilities.map((val) => val / pSum) : probabilities.map(() => 1 / probabilities.length);

  const cptValues: Record<string, number> = {};

  for (const aId of altIds) {
    let sum = 0;
    for (let j = 0; j < stateIds.length; j++) {
      const u = payoffLookup(aId, stateIds[j]);
      const delta = u - refPoint;
      let val = 0;
      if (delta >= 0) {
        val = Math.pow(delta, alpha);
      } else {
        val = -lambda * Math.pow(-delta, beta);
      }
      sum += p[j] * val;
    }
    cptValues[aId] = Math.round(sum * 100) / 100;
  }

  return cptValues;
}

/**
 * Computes discounting curves (exponential vs quasi-hyperbolic) for interactive time-horizon exploration.
 */
export function calculateClientDiscounting(
  timeHorizonYears: number,
  futureValue: number,
  delta: number = 0.07,
  beta: number = 0.70
): {
  expPV: number;
  hypPV: number;
  penalty: number;
  penaltyPct: number;
  trajectory: { year: number; expPV: number; hypPV: number }[];
} {
  const T = Math.max(0.1, timeHorizonYears);
  const expFactor = Math.exp(-delta * T);
  const hypFactor = beta * Math.exp(-delta * T);

  const expPV = Math.round(expFactor * futureValue * 10) / 10;
  const hypPV = Math.round(hypFactor * futureValue * 10) / 10;
  const penalty = Math.max(0, Math.round((expPV - hypPV) * 10) / 10);
  const penaltyPct = expPV > 0 ? Math.round((penalty / expPV) * 1000) / 10 : 0;

  const trajectory: { year: number; expPV: number; hypPV: number }[] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const yr = Math.round((i * T / steps) * 10) / 10;
    const ef = Math.exp(-delta * yr);
    const hf = yr === 0 ? 1 : beta * Math.exp(-delta * yr);
    trajectory.push({
      year: yr,
      expPV: Math.round(ef * futureValue * 10) / 10,
      hypPV: Math.round(hf * futureValue * 10) / 10,
    });
  }

  return {
    expPV,
    hypPV,
    penalty,
    penaltyPct,
    trajectory,
  };
}


