import numpy as np
from typing import Dict, List, Tuple
from app.schemas.decision import (
    StructuredDecision,
    MathLayerResult,
    ExpectedUtilityResult,
    MinimaxRegretResult,
    SensitivityAnalysisResult,
    SensitivityPayoffItem
)

class DecisionTheoryMathEngine:
    """
    Pure deterministic mathematical engine for decision theory.
    - Zero stochasticity or LLM dependencies
    - Exact algebraic solvers for Expected Utility, Minimax Regret, and Sensitivity Analysis

    Authoritative Single Source of Truth: `DESIGN.md` §3.2 (Layer 2: Decision Theory & Math Engine).
    Any changes to Expected Utility or inflection threshold formulas must stay synchronized
    with `DESIGN.md` §3.2 and the TypeScript client port in `frontend/src/lib/decisionMath.ts`.
    """

    @staticmethod
    def compute(decision: StructuredDecision) -> MathLayerResult:
        alt_ids = [a.id for a in decision.alternatives]
        state_ids = [s.id for s in decision.states_of_world]
        probabilities = np.array([s.prior_probability for s in decision.states_of_world], dtype=float)

        # Normalize probabilities if sum != 1.0
        p_sum = np.sum(probabilities)
        if p_sum > 0:
            probabilities = probabilities / p_sum
        else:
            probabilities = np.ones(len(state_ids)) / len(state_ids)

        # Build Utility Matrix U: shape (num_alts, num_states)
        payoff_dict: Dict[Tuple[str, str], float] = {
            (p.alternative_id, p.state_id): p.utility for p in decision.payoff_matrix
        }
        
        U = np.zeros((len(alt_ids), len(state_ids)), dtype=float)
        for i, aid in enumerate(alt_ids):
            for j, sid in enumerate(state_ids):
                U[i, j] = payoff_dict.get((aid, sid), 50.0)

        # 1. Expected Utility: EU = U @ p
        eu_vector = U @ probabilities
        eu_dict = {alt_ids[i]: round(float(eu_vector[i]), 2) for i in range(len(alt_ids))}
        best_eu_idx = int(np.argmax(eu_vector))
        best_eu_alt = alt_ids[best_eu_idx]

        # 2. Minimax Regret
        # Best payoff achievable under state j: U*_j = max_i U[i, j]
        u_star = np.max(U, axis=0) # shape (num_states,)
        # Regret Matrix R[i, j] = U*_j - U[i, j]
        R = u_star - U
        max_regrets = np.max(R, axis=1) # shape (num_alts,)
        
        regret_matrix_dict = {}
        for i, aid in enumerate(alt_ids):
            regret_matrix_dict[aid] = {
                state_ids[j]: round(float(R[i, j]), 2) for j in range(len(state_ids))
            }
        
        max_regrets_dict = {
            alt_ids[i]: round(float(max_regrets[i]), 2) for i in range(len(alt_ids))
        }
        
        minimax_regret_idx = int(np.argmin(max_regrets))
        minimax_regret_alt = alt_ids[minimax_regret_idx]

        # Regret tradeoff insight
        if best_eu_alt == minimax_regret_alt:
            regret_insight = (
                f"Alternative '{best_eu_alt}' dominates under both Expected Utility ({eu_dict[best_eu_alt]}) "
                f"and Minimax Regret (worst-case regret of {max_regrets_dict[best_eu_alt]})."
            )
        else:
            regret_insight = (
                f"Preference tension detected: '{best_eu_alt}' leads on Expected Utility ({eu_dict[best_eu_alt]}), "
                f"but '{minimax_regret_alt}' minimizes worst-case regret ({max_regrets_dict[minimax_regret_alt]} vs {max_regrets_dict[best_eu_alt]})."
            )

        # 3. Sensitivity Analysis & Inflection Derivation
        sensitivity = DecisionTheoryMathEngine._compute_sensitivity(
            alt_ids, state_ids, probabilities, U, eu_vector, best_eu_idx
        )

        return MathLayerResult(
            expected_utility=ExpectedUtilityResult(
                utilities=eu_dict,
                preferred_alternative_id=best_eu_alt
            ),
            minimax_regret=MinimaxRegretResult(
                regret_matrix=regret_matrix_dict,
                maximum_regrets=max_regrets_dict,
                minimax_regret_choice=minimax_regret_alt,
                regret_tradeoff_insight=regret_insight
            ),
            sensitivity_analysis=sensitivity
        )

    @staticmethod
    def _compute_sensitivity(
        alt_ids: List[str],
        state_ids: List[str],
        probabilities: np.ndarray,
        U: np.ndarray,
        eu_vector: np.ndarray,
        best_idx: int
    ) -> SensitivityAnalysisResult:
        num_alts, num_states = U.shape
        
        # If single alternative or single state
        if num_alts < 2 or num_states < 2:
            return SensitivityAnalysisResult(
                critical_parameter="N/A",
                current_value=1.0,
                inflection_threshold=1.0,
                directional_shift="Insufficient alternatives or states for sensitivity analysis.",
                algebraic_formula="EU(a1) = EU(a2)",
                utility_sensitivity=[]
            )

        # Find runner-up alternative
        sorted_indices = np.argsort(-eu_vector)
        a1_idx = sorted_indices[0]
        a2_idx = sorted_indices[1]
        
        a1_name = alt_ids[a1_idx]
        a2_name = alt_ids[a2_idx]

        # 2-state exact algebraic inflection for primary state p0
        # p0* = (U(a2, s1) - U(a1, s1)) / ((U(a1, s0) - U(a1, s1)) - (U(a2, s0) - U(a2, s1)))
        u_a1_s0 = U[a1_idx, 0]
        u_a1_s1 = U[a1_idx, 1] if num_states >= 2 else U[a1_idx, 0]
        u_a2_s0 = U[a2_idx, 0]
        u_a2_s1 = U[a2_idx, 1] if num_states >= 2 else U[a2_idx, 0]

        denominator = (u_a1_s0 - u_a1_s1) - (u_a2_s0 - u_a2_s1)
        numerator = u_a2_s1 - u_a1_s1

        if abs(denominator) > 1e-6:
            p_inflection = numerator / denominator
            # Clamp to meaningful probability bounds
            p_inflection_clamped = max(0.0, min(1.0, float(p_inflection)))
        else:
            p_inflection = 0.5
            p_inflection_clamped = 0.5

        formula_str = (
            f"p*({state_ids[0]}) = [U({a2_name}, {state_ids[1]}) - U({a1_name}, {state_ids[1]})] / "
            f"[(U({a1_name}, {state_ids[0]}) - U({a1_name}, {state_ids[1]})) - "
            f"(U({a2_name}, {state_ids[0]}) - U({a2_name}, {state_ids[1]}))]"
        )

        curr_p = float(probabilities[0])
        p_inf_round = round(float(p_inflection_clamped), 3)

        if p_inflection < 0 or p_inflection > 1:
            shift_desc = f"Option '{a1_name}' strictly dominates '{a2_name}' across all probability distributions."
        else:
            if curr_p < p_inf_round:
                shift_desc = f"If probability of '{state_ids[0]}' increases from {round(curr_p, 2)} to >{p_inf_round}, '{a2_name}' becomes the higher expected utility option."
            else:
                shift_desc = f"If probability of '{state_ids[0]}' drops from {round(curr_p, 2)} to <{p_inf_round}, '{a2_name}' becomes the higher expected utility option."

        # Utility sensitivity: what single payoff shift in runner-up flips the outcome?
        # Target: EU(a2) with U'[a2, s_j] = EU(a1)
        # Delta = (EU(a1) - EU(a2)) / p_j
        eu_delta = eu_vector[a1_idx] - eu_vector[a2_idx]
        utility_sensitivity_items: List[SensitivityPayoffItem] = []

        for j in range(num_states):
            p_j = probabilities[j]
            if p_j > 0.01:
                needed_u_a2 = U[a2_idx, j] + (eu_delta / p_j)
                if 0 <= needed_u_a2 <= 100:
                    utility_sensitivity_items.append(
                        SensitivityPayoffItem(
                            alternative_id=a2_name,
                            state_id=state_ids[j],
                            current_value=round(float(U[a2_idx, j]), 1),
                            inflection_threshold=round(float(needed_u_a2), 1),
                            insight=(
                                f"If payoff for '{a2_name}' under '{state_ids[j]}' improves from "
                                f"{round(float(U[a2_idx, j]), 1)} to {round(float(needed_u_a2), 1)}, it reaches parity with '{a1_name}'."
                            )
                        )
                    )

        return SensitivityAnalysisResult(
            critical_parameter=f"prior_probability({state_ids[0]})",
            current_value=round(curr_p, 3),
            inflection_threshold=p_inf_round,
            directional_shift=shift_desc,
            algebraic_formula=formula_str,
            utility_sensitivity=utility_sensitivity_items
        )
