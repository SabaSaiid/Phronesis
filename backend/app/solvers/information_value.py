"""
Expected Value of Perfect Information (EVPI) & Sample Information (EVSI) Solver.

Provides exact deterministic computation of information value bounds using
standard Bayesian decision theory formulations.

Literature Foundation:
  - Raiffa, H., & Schlaifer, R. (1961). Applied Statistical Decision Theory.
    Harvard Business School Press.
  - Howard, R. A. (1966). Information Value Theory.
    IEEE Transactions on Systems Science and Cybernetics, 2(1), 22–26.
  - Pratt, J. W., Raiffa, H., & Schlaifer, R. (1964). The Foundations of
    Decision under Uncertainty: An Elementary Exposition.
    Journal of the American Statistical Association, 59(306), 353–375.

CORE AXIOM: These metrics are diagnostic heuristics exposing the upper bound on
the value of information acquisition. They never prescribe a decision.
"""
import os
import json
import functools
import numpy as np
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field


@functools.lru_cache(maxsize=1)
def get_voi_experiments() -> List[dict]:
    kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "voi_experiments.json")
    if not os.path.exists(kb_path):
        return []
    try:
        with open(kb_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


@dataclass
class EVPIResult:
    """
    Expected Value of Perfect Information (EVPI).

    Formally: EVPI = E_s[max_a U(a,s)] - max_a E_s[U(a,s)]

    Interpretation: The maximum rational expenditure of time, money, or effort
    to fully eliminate all uncertainty before committing to a decision.
    """
    evpi_utility: float            # EVPI in the same 0-100 utility units
    evpi_fractional: float         # EVPI as fraction of current preferred EU (0-1 scale)
    voi_ceiling_narrative: str     # Human-readable observational interpretation
    algebraic_derivation: str      # Explicit formula substitution for auditability
    prior_eu_max: float            # Current max expected utility without information
    posterior_eu_max: float        # Expected max utility under perfect information
    suggested_experiments: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class EVSIResult:
    """
    Expected Value of Sample Information (EVSI) for a noisy experiment.

    Models the value of partial information from an imperfect test/experiment
    with known reliability rates per state.
    """
    evsi_utility: float                      # EVSI value in utility units
    information_efficiency: float            # EVSI / EVPI ratio (0-1)
    recommended_threshold_narrative: str     # Whether experiment appears justified
    reliability_matrix_used: List[List[float]]  # P(signal_k | state_j) matrix used


def compute_evpi(
    probabilities: List[float],
    utility_matrix: List[List[float]],
    alt_ids: List[str],
    state_ids: List[str],
    context_text: Optional[str] = None,
) -> EVPIResult:
    """
    Computes EVPI exactly via the Raiffa-Schlaifer (1961) formulation:

      EVPI = E_s[max_a U(a,s)] - max_a E_s[U(a,s)]
           = sum_j p_j * max_i U[i,j] - max_i sum_j p_j * U[i,j]

    Args:
        probabilities: Prior state probabilities summing to 1.0.
        utility_matrix: U[i][j] where i=alternative index, j=state index.
        alt_ids: Alternative identifier list for narrative generation.
        state_ids: State identifier list for narrative generation.
        context_text: Optional text from decision narrative/goals for VoI protocol matching.

    Returns:
        EVPIResult with exact EVPI, fractional bound, derivation string, and matched experiments.
    """
    p = np.array(probabilities, dtype=float)
    p_sum = p.sum()
    if p_sum > 0:
        p = p / p_sum
    else:
        p = np.ones(len(p)) / len(p)

    U = np.array(utility_matrix, dtype=float)

    # 1. Prior max EU: max_i EU(a_i) = max_i sum_j p_j * U[i,j]
    eu_per_alt = U @ p
    prior_eu_max = float(np.max(eu_per_alt))
    best_prior_alt = alt_ids[int(np.argmax(eu_per_alt))]

    # 2. Posterior max EU under perfect information:
    #    E_s[max_a U(a,s)] = sum_j p_j * max_i U[i,j]
    max_u_per_state = np.max(U, axis=0)  # shape: (num_states,)
    posterior_eu_max = float(np.dot(p, max_u_per_state))

    # 3. EVPI = Posterior EU - Prior EU
    evpi = max(0.0, posterior_eu_max - prior_eu_max)
    evpi_fractional = (evpi / prior_eu_max) if prior_eu_max > 0 else 0.0

    # Build algebraic derivation string
    p_str = ", ".join(f"p({s})={round(float(pj), 3)}" for s, pj in zip(state_ids, p))
    posterior_terms = " + ".join(
        f"{round(float(p[j]), 3)}×{round(float(max_u_per_state[j]), 1)}"
        for j in range(len(state_ids))
    )
    algebraic = (
        f"EVPI = E[max_a U(a,s)] − max_a EU(a)\n"
        f"     = [{posterior_terms}] − {round(prior_eu_max, 2)}\n"
        f"     = {round(posterior_eu_max, 2)} − {round(prior_eu_max, 2)}\n"
        f"     = {round(evpi, 3)} utility units"
    )

    # Match suggested low-cost experiments from VoI playbook
    matched_experiments: List[Dict[str, Any]] = []
    experiments_pool = get_voi_experiments()
    if experiments_pool:
        search_corpus = f"{' '.join(alt_ids)} {' '.join(state_ids)} {context_text or ''}".lower()
        scored_exps = []
        for exp in experiments_pool:
            score = sum(1.0 for kw in exp.get("keywords", []) if kw in search_corpus)
            scored_exps.append((score, exp))
        scored_exps.sort(key=lambda x: x[0], reverse=True)
        # Select top 2 if score > 0, otherwise default to first 1
        top_picks = [e for s, e in scored_exps if s > 0][:2]
        if not top_picks and experiments_pool:
            top_picks = [experiments_pool[0]]
        matched_experiments = top_picks

    # Narrative ceiling interpretation
    if evpi < 0.5:
        narrative = (
            f"The structural uncertainty cost is negligible (EVPI = {round(evpi, 2)} utility units). "
            f"The current probability-weighted evidence strongly concentrates expected value around "
            f"'{best_prior_alt}'. Additional information acquisition beyond low-cost sanity checks "
            f"yields diminishing returns."
        )
    elif evpi < 5.0:
        narrative = (
            f"EVPI = {round(evpi, 2)} utility units ({round(evpi_fractional * 100, 1)}% of current preferred EU). "
            f"The decision exhibits moderate state uncertainty. A targeted, time-boxed informational test "
            f"costing less than this ceiling is analytically justified before committing."
        )
    else:
        narrative = (
            f"EVPI = {round(evpi, 2)} utility units — a high uncertainty cost representing "
            f"{round(evpi_fractional * 100, 1)}% of the current best expected outcome. "
            f"This indicates the decision is highly sensitive to which state of the world materializes. "
            f"Staged commitment (pilot, proof of concept, or market validation) is structurally indicated "
            f"by the mathematical information cost, independent of any single value judgment."
        )

    return EVPIResult(
        evpi_utility=round(evpi, 3),
        evpi_fractional=round(evpi_fractional, 4),
        voi_ceiling_narrative=narrative,
        algebraic_derivation=algebraic,
        prior_eu_max=round(prior_eu_max, 3),
        posterior_eu_max=round(posterior_eu_max, 3),
        suggested_experiments=matched_experiments,
    )


def compute_evsi(
    probabilities: List[float],
    utility_matrix: List[List[float]],
    alt_ids: List[str],
    state_ids: List[str],
    reliability_matrix: Optional[List[List[float]]] = None,
) -> EVSIResult:
    """
    Computes EVSI for a noisy experiment with a given reliability (likelihood) matrix.

    Reliability matrix P(signal_k | state_j):
      - Rows = signal outcomes (k signals)
      - Cols = true states (j states)
      - Default: assume a moderately reliable 2-signal test (70% correct per state).

    EVSI = E_z[max_a sum_s P(s|z) U(a,s)] - max_a EU(a)

    Sourced: Raiffa & Schlaifer (1961) §3.4; Howard (1966) p. 24.
    """
    p = np.array(probabilities, dtype=float)
    p_sum = p.sum()
    if p_sum > 0:
        p = p / p_sum
    else:
        p = np.ones(len(p)) / len(p)

    U = np.array(utility_matrix, dtype=float)
    n_alts, n_states = U.shape

    # Default: 2-signal test with ~70% reliability per state (conservative estimate)
    if reliability_matrix is None:
        n_signals = 2
        r = 0.70  # P(correct signal | true state)
        lik = np.full((n_signals, n_states), (1 - r) / (n_signals - 1))
        for k in range(n_signals):
            lik[k, k % n_states] = r
    else:
        lik = np.array(reliability_matrix, dtype=float)
        n_signals = lik.shape[0]

    # Prior EU (without sample info)
    eu_per_alt = U @ p
    prior_eu_max = float(np.max(eu_per_alt))

    # Compute marginal P(signal=k) = sum_j P(signal=k|state=j) * P(state=j)
    marginal_signals = lik @ p  # shape: (n_signals,)

    # E_z[max_a sum_s P(s|z) U(a,s)]
    expected_max_posterior = 0.0
    for k in range(n_signals):
        p_z_k = float(marginal_signals[k])
        if p_z_k < 1e-9:
            continue
        # Posterior P(state_j | signal_k) via Bayes
        posterior = lik[k] * p / p_z_k  # shape: (n_states,)
        # Best EU given this signal
        eu_given_signal = U @ posterior
        best_eu_given_signal = float(np.max(eu_given_signal))
        expected_max_posterior += p_z_k * best_eu_given_signal

    evsi = max(0.0, expected_max_posterior - prior_eu_max)

    # EVPI for efficiency ratio
    evpi_res = compute_evpi(probabilities, utility_matrix, alt_ids, state_ids)
    efficiency = (evsi / evpi_res.evpi_utility) if evpi_res.evpi_utility > 0 else 1.0

    threshold_narrative = (
        f"With EVSI = {round(evsi, 2)} utility units and EVPI = {round(evpi_res.evpi_utility, 2)}, "
        f"this experiment captures {round(efficiency * 100, 1)}% of maximum possible information value. "
        + (
            "The experiment is structurally cost-effective if its total cost is below this utility ceiling."
            if efficiency > 0.3 else
            "The experiment's reliability is low relative to EVPI — a higher-fidelity signal design is advisable."
        )
    )

    return EVSIResult(
        evsi_utility=round(evsi, 3),
        information_efficiency=round(efficiency, 4),
        recommended_threshold_narrative=threshold_narrative,
        reliability_matrix_used=(lik.tolist()),
    )
