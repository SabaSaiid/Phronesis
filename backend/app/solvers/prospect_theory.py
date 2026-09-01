"""
Prospect Theory & Risk Preference Solver.

Implements Cumulative Prospect Theory (Tversky & Kahneman 1992) and
Constant Relative Risk Aversion (CRRA) utility for characterizing
non-linear risk preferences in high-stakes decisions.

Literature Foundation:
  - Kahneman, D., & Tversky, A. (1979). Prospect Theory: An Analysis of Decision under Risk.
    Econometrica, 47(2), 263–291.
  - Tversky, A., & Kahneman, D. (1992). Advances in Prospect Theory: Cumulative
    Representation of Uncertainty. Journal of Risk and Uncertainty, 5(4), 297–323.
  - Arrow, K.J. (1965). Aspects of the Theory of Risk-Bearing. Yrjö Hahnsson Foundation.
  - Pratt, J.W. (1964). Risk Aversion in the Small and in the Large.
    Econometrica, 32(1/2), 122–136.

CORE AXIOM: These risk metrics are mirrors revealing implicit risk preferences
in the user's stated payoffs. No optimal risk level is prescribed.
"""
import math
from typing import List, Optional, Dict
from dataclasses import dataclass


# Standard CPT parameters (Tversky & Kahneman 1992, p. 309)
CPT_ALPHA: float = 0.88   # Gain sensitivity (diminishing marginal value)
CPT_BETA: float = 0.88    # Loss sensitivity (diminishing marginal disvalue)
CPT_LAMBDA: float = 2.25  # Loss aversion coefficient


@dataclass
class ProspectTheoryResult:
    """
    Prospect Theory analysis revealing loss-aversion framing vulnerability.
    """
    # CPT value under default Kahneman-Tversky parameters
    cpt_values_per_alt: Dict[str, float]       # CPT value for each alternative
    eu_preferred_alt: str                       # Preferred alternative under standard EU
    cpt_preferred_alt: str                      # Preferred alternative under CPT
    framing_divergence: bool                    # True if EU and CPT rankings differ
    loss_aversion_penalty: float                # Utility units sacrificed due to λ=2.25
    framing_vulnerability_narrative: str        # Observational analysis
    reference_point_sensitivity_narrative: str  # Reference point dependency insight
    # Parameters used for auditability
    alpha_used: float
    beta_used: float
    lambda_used: float


@dataclass
class RiskAverseProfile:
    """
    CRRA risk preference characterization.
    """
    alt_ids: List[str]
    certainty_equivalents: Dict[str, float]  # CE under CRRA(γ) for each alternative
    risk_premiums: Dict[str, float]          # RP = E[U] - CE
    gamma_used: float                        # CRRA coefficient used
    risk_class: str                          # "Risk-Neutral" | "Risk-Averse" | "Risk-Seeking"
    narrative: str


def cpt_value(x: float, alpha: float = CPT_ALPHA, beta: float = CPT_BETA,
              lambda_: float = CPT_LAMBDA, reference_point: float = 50.0) -> float:
    """
    Tversky-Kahneman (1992) CPT value function:
      v(x) = (x - ref)^alpha            if x >= ref
      v(x) = -lambda * (ref - x)^beta   if x < ref

    Utility scores are centered on the reference point (default = midpoint 50).
    """
    delta = x - reference_point
    if delta >= 0:
        return delta ** alpha
    else:
        return -lambda_ * ((-delta) ** beta)


def compute_prospect_theory(
    alt_ids: List[str],
    state_ids: List[str],
    probabilities: List[float],
    utility_matrix: List[List[float]],
    eu_values: Optional[Dict[str, float]] = None,
    reference_point: float = 50.0,
) -> ProspectTheoryResult:
    """
    Evaluates the decision under Cumulative Prospect Theory and compares against
    standard Expected Utility to detect framing vulnerabilities.

    Args:
        alt_ids: Alternative identifiers.
        state_ids: State of world identifiers.
        probabilities: State prior probabilities.
        utility_matrix: U[i][j] utility for alternative i under state j.
        eu_values: Pre-computed Expected Utility per alternative (for comparison).
        reference_point: The neutral utility reference point (default: 50.0 = midpoint of 0-100 scale).
    """
    n_alts = len(alt_ids)
    n_states = len(state_ids)

    # Normalize probabilities
    total_p = sum(probabilities)
    p = [pp / total_p for pp in probabilities] if total_p > 0 else [1.0 / n_states] * n_states

    # Compute CPT value for each alternative
    # CPT(a_i) = sum_j p_j * v(U[i][j])
    cpt_values: Dict[str, float] = {}
    for i, alt_id in enumerate(alt_ids):
        cpt_val = sum(
            p[j] * cpt_value(utility_matrix[i][j], reference_point=reference_point)
            for j in range(n_states)
        )
        cpt_values[alt_id] = round(cpt_val, 3)

    cpt_preferred = max(cpt_values, key=cpt_values.get)

    # Compute standard EU if not provided
    if eu_values is None:
        eu_values = {}
        for i, alt_id in enumerate(alt_ids):
            eu_values[alt_id] = round(
                sum(p[j] * utility_matrix[i][j] for j in range(n_states)), 2
            )
    eu_preferred = max(eu_values, key=eu_values.get)

    # Loss aversion penalty: difference between CPT with λ=1 vs λ=2.25
    cpt_neutral_values: Dict[str, float] = {}
    for i, alt_id in enumerate(alt_ids):
        cpt_val_neutral = sum(
            p[j] * cpt_value(utility_matrix[i][j], lambda_=1.0, reference_point=reference_point)
            for j in range(n_states)
        )
        cpt_neutral_values[alt_id] = round(cpt_val_neutral, 3)

    # Loss aversion penalty on the EU-preferred alternative
    eu_pref_idx = alt_ids.index(eu_preferred)
    penalty = cpt_neutral_values[eu_preferred] - cpt_values[eu_preferred]
    loss_aversion_penalty = round(max(0.0, penalty), 3)

    framing_divergence = (eu_preferred != cpt_preferred)

    # Framing vulnerability narrative
    if framing_divergence:
        framing_narrative = (
            f"Framing vulnerability detected: Standard Expected Utility (treating gains and losses "
            f"symmetrically) favors '{eu_preferred}', while Cumulative Prospect Theory "
            f"(Tversky & Kahneman 1992, λ={CPT_LAMBDA}) favors '{cpt_preferred}'. "
            f"This divergence suggests the decision ranking is sensitive to how outcomes are mentally "
            f"anchored — whether the reference point is 'current baseline' or 'zero'. "
            f"Examining which framing better reflects the user's true psychological baseline is indicated."
        )
    else:
        framing_narrative = (
            f"Both Expected Utility and Cumulative Prospect Theory (λ={CPT_LAMBDA}) converge on "
            f"'{eu_preferred}' as the leading alternative. The decision ranking appears robust to "
            f"loss-aversion framing, suggesting the preference is not primarily driven by reference-point anchoring."
        )

    # Reference point sensitivity
    ref_narrative = (
        f"The analysis uses a neutral reference point of {reference_point} utility units "
        f"(midpoint of the 0–100 scale). Under loss aversion (λ={CPT_LAMBDA}), losses below this "
        f"reference loom approximately 2.25× more heavily than equivalent gains above it "
        f"(Tversky & Kahneman 1991). Loss-aversion penalty on the preferred alternative: "
        f"{loss_aversion_penalty} utility units."
    )

    return ProspectTheoryResult(
        cpt_values_per_alt=cpt_values,
        eu_preferred_alt=eu_preferred,
        cpt_preferred_alt=cpt_preferred,
        framing_divergence=framing_divergence,
        loss_aversion_penalty=loss_aversion_penalty,
        framing_vulnerability_narrative=framing_narrative,
        reference_point_sensitivity_narrative=ref_narrative,
        alpha_used=CPT_ALPHA,
        beta_used=CPT_BETA,
        lambda_used=CPT_LAMBDA,
    )


def compute_crra_profile(
    alt_ids: List[str],
    state_ids: List[str],
    probabilities: List[float],
    utility_matrix: List[List[float]],
    gamma: float = 1.5,
) -> RiskAverseProfile:
    """
    Computes Certainty Equivalents and Risk Premiums under CRRA utility:
      u(w) = w^(1-γ) / (1-γ)  for γ ≠ 1
      u(w) = ln(w)              for γ = 1 (log utility, CRRA special case)

    CE is derived by inverting the utility function on E[u(w)].

    Args:
        gamma: CRRA coefficient. γ=0 → risk neutral, γ>1 → risk averse, γ<0 → risk seeking.

    Source: Arrow (1965); Pratt (1964).
    """
    n_states = len(state_ids)
    total_p = sum(probabilities)
    p = [pp / total_p for pp in probabilities] if total_p > 0 else [1.0 / n_states] * n_states

    # Scale utilities to strictly positive wealth (add 1 to avoid log(0))
    certainty_equivalents: Dict[str, float] = {}
    risk_premiums: Dict[str, float] = {}

    for i, alt_id in enumerate(alt_ids):
        # Compute expected utility under CRRA
        eu_sum = 0.0
        e_w = sum(p[j] * utility_matrix[i][j] for j in range(n_states))

        for j in range(n_states):
            w = max(utility_matrix[i][j], 0.01)  # strictly positive
            if abs(1 - gamma) < 1e-9:  # γ ≈ 1: log utility
                eu_sum += p[j] * math.log(w)
            else:
                eu_sum += p[j] * (w ** (1 - gamma)) / (1 - gamma)

        # Invert CRRA to get CE
        if abs(1 - gamma) < 1e-9:
            ce = math.exp(eu_sum)
        else:
            inner = eu_sum * (1 - gamma)
            if inner < 0:
                ce = 0.01
            else:
                ce = inner ** (1.0 / (1 - gamma))

        certainty_equivalents[alt_id] = round(ce, 2)
        risk_premiums[alt_id] = round(e_w - ce, 2)

    if gamma > 0.5:
        risk_class = "Risk-Averse"
    elif gamma < -0.5:
        risk_class = "Risk-Seeking"
    else:
        risk_class = "Risk-Neutral"

    best_ce_alt = max(certainty_equivalents, key=certainty_equivalents.get)
    narrative = (
        f"Under CRRA risk preferences (γ={gamma}, {risk_class}), the Certainty Equivalent for "
        f"'{best_ce_alt}' is {certainty_equivalents[best_ce_alt]:.1f} utility units — the certain "
        f"outcome that the decision-maker would find equally desirable to the probabilistic payoff. "
        f"The Risk Premium for '{best_ce_alt}' is {risk_premiums[best_ce_alt]:.1f} utility units "
        f"(the implicit insurance cost embedded in the preference for certainty). "
        f"Source: Arrow (1965); Pratt (1964), Econometrica."
    )

    return RiskAverseProfile(
        alt_ids=alt_ids,
        certainty_equivalents=certainty_equivalents,
        risk_premiums=risk_premiums,
        gamma_used=gamma,
        risk_class=risk_class,
        narrative=narrative,
    )
