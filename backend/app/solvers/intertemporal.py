"""
Intertemporal Choice & Discounting Solver.

Models temporal preference dynamics including exponential discounting,
quasi-hyperbolic (present-biased) discounting, and Net Present Value
calculations to expose how time horizons and impatience affect the
perceived value of long-term vs. immediate alternatives.

Literature Foundation:
  - Samuelson, P.A. (1937). A Note on Measurement of Utility.
    Review of Economic Studies, 4(2), 155–161. (Exponential Discounting)
  - Ainslie, G. (1975). Specious Reward: A Behavioral Theory of Impulsiveness
    and Impulse Control. Psychological Bulletin, 82(4), 463–496.
  - Laibson, D. (1997). Golden Eggs and Hyperbolic Discounting.
    Quarterly Journal of Economics, 112(2), 443–478. (Beta-Delta Discounting)
  - O'Donoghue, T., & Rabin, M. (1999). Doing It Now or Later.
    American Economic Review, 89(1), 103–124.

CORE AXIOM: These calculations surface the mathematical cost of present-bias
and impatience. They describe tradeoffs; they do not prescribe optimal patience levels.
"""
import math
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class DiscountingResult:
    """
    Results comparing exponential and quasi-hyperbolic discounting trajectories.
    """
    # Time horizon analyzed (years)
    time_horizon_years: float

    # Exponential discounting (Samuelson 1937)
    exponential_discount_factor: float       # e^(-delta * T)
    exponential_present_value: float         # PV under exponential model

    # Quasi-hyperbolic / Beta-Delta (Laibson 1997)
    hyperbolic_discount_factor: float        # beta * delta^T
    hyperbolic_present_value: float          # PV under quasi-hyperbolic model

    # Present-bias wedge
    present_bias_penalty: float              # Utility units sacrificed by short-term bias
    present_bias_penalty_pct: float          # Penalty as % of exponential PV

    # Parameters used
    delta_used: float                        # Long-run discount rate
    beta_used: float                         # Short-run present-bias factor

    # Trajectory data for visualization (t → discount_factor pairs)
    exponential_trajectory: List[Tuple[float, float]]   # [(year, D_exp(t))]
    hyperbolic_trajectory: List[Tuple[float, float]]    # [(year, D_hyp(t))]

    # Narrative
    impatience_narrative: str
    npv_multi_rate_narrative: str            # NPV under 3%, 7%, 12%

    # Undiscounted future utility reference
    future_utility_value: float = 75.0


@dataclass
class IntertemporalComparisonResult:
    """
    Compares two alternatives on long-run vs. short-run intertemporal criteria.
    """
    long_run_preferred_alt: str              # Preferred under exponential discounting
    short_run_preferred_alt: str             # Preferred under hyperbolic discounting
    preference_reversal: bool                # True if rankings differ
    reversal_narrative: str
    patience_leverage_narrative: str         # What additional patience buys


def compute_discount_factor_exponential(delta: float, t: float) -> float:
    """
    Exponential discount factor: D(t) = e^(-delta * t)
    where delta is the continuous-time discount rate (e.g. 0.07 = 7%).
    """
    return math.exp(-delta * t)


def compute_discount_factor_hyperbolic(beta: float, delta: float, t: float) -> float:
    """
    Quasi-hyperbolic (Beta-Delta) discount factor (Laibson 1997):
      D(0) = 1  (no discounting at t=0)
      D(t) = beta * delta^t  for t > 0
    where beta captures short-run present-bias (typically 0.5–0.9)
    and delta captures long-run patience (typically 0.9–0.99 per period).
    """
    if t <= 0:
        return 1.0
    # Convert per-year delta to continuous equivalent
    delta_continuous = max(0.001, delta)
    return beta * math.exp(-delta_continuous * t)


def compute_npv_exponential(
    payoffs: List[float],
    time_points: List[float],
    delta: float,
) -> float:
    """
    Computes Net Present Value under exponential discounting.
    NPV = sum_t D(t) * payoff_t
    """
    return sum(
        compute_discount_factor_exponential(delta, t) * p
        for t, p in zip(time_points, payoffs)
    )


def compute_npv_hyperbolic(
    payoffs: List[float],
    time_points: List[float],
    beta: float,
    delta: float,
) -> float:
    """
    Computes Net Present Value under quasi-hyperbolic discounting.
    """
    return sum(
        compute_discount_factor_hyperbolic(beta, delta, t) * p
        for t, p in zip(time_points, payoffs)
    )


def compute_discounting_analysis(
    time_horizon_years: float,
    future_utility_value: float,
    immediate_utility_value: float = 0.0,
    delta: float = 0.07,
    beta: float = 0.70,
) -> DiscountingResult:
    """
    Analyzes temporal preference for a single future payoff vs. current state.

    Args:
        time_horizon_years: Years until the primary payoff materializes.
        future_utility_value: Expected utility payoff at the end of the horizon.
        immediate_utility_value: Immediate/current utility state value.
        delta: Long-run annual continuous discount rate (default 7% real return).
        beta: Present-bias factor [0-1], where 1 = no present-bias. Default 0.70
              (Laibson 1997 empirical estimate for median agent).

    Returns:
        DiscountingResult with trajectory data, present-bias penalty, and narrative.
    """
    T = max(0.01, time_horizon_years)

    # Discount factors at the horizon
    D_exp = compute_discount_factor_exponential(delta, T)
    D_hyp = compute_discount_factor_hyperbolic(beta, delta, T)

    # Present values
    pv_exp = D_exp * future_utility_value + immediate_utility_value
    pv_hyp = D_hyp * future_utility_value + immediate_utility_value

    present_bias_penalty = max(0.0, pv_exp - pv_hyp)
    present_bias_pct = (present_bias_penalty / pv_exp * 100) if pv_exp > 0 else 0.0

    # Build trajectory curves (year 0 through T in 10 steps)
    n_steps = max(10, int(T * 4))
    exp_traj = [
        (round(t, 2), round(compute_discount_factor_exponential(delta, t), 4))
        for t in [i * T / n_steps for i in range(n_steps + 1)]
    ]
    hyp_traj = [
        (round(t, 2), round(compute_discount_factor_hyperbolic(beta, delta, t), 4))
        for t in [i * T / n_steps for i in range(n_steps + 1)]
    ]

    # Impatience narrative
    if present_bias_pct < 5:
        impatience_narrative = (
            f"The {T:.1f}-year horizon exhibits low present-bias sensitivity: "
            f"even under quasi-hyperbolic discounting (β={beta}, Laibson 1997), "
            f"the present-bias penalty is only {present_bias_penalty:.1f} utility units "
            f"({present_bias_pct:.1f}% of long-run value). Temporal framing is unlikely "
            f"to be a primary distortion in this reasoning."
        )
    elif present_bias_pct < 20:
        impatience_narrative = (
            f"Moderate present-bias exposure detected over the {T:.1f}-year horizon. "
            f"Under quasi-hyperbolic discounting (β={beta}), the present-bias friction "
            f"costs approximately {present_bias_penalty:.1f} utility units "
            f"({present_bias_pct:.1f}% of exponentially discounted value). "
            f"If transition friction or short-run discomfort is causing preference for "
            f"the immediate alternative, Laibson (1997) and O'Donoghue & Rabin (1999) "
            f"suggest this reflects a measurable and predictable present-bias distortion."
        )
    else:
        impatience_narrative = (
            f"High present-bias detected. The {T:.1f}-year temporal gap imposes a "
            f"{present_bias_penalty:.1f} utility unit present-bias penalty "
            f"({present_bias_pct:.1f}% of long-run exponential PV), consistent with "
            f"hyperbolic time preferences documented by Laibson (1997) and Ainslie (1975). "
            f"Preferences expressed now may reverse when considering the compound long-run "
            f"trajectory — a hallmark of dynamically inconsistent time preferences."
        )

    # Multi-rate NPV narrative
    rates = [0.03, 0.07, 0.12]
    rate_pvs = [(r, round(compute_discount_factor_exponential(r, T) * future_utility_value, 2)) for r in rates]
    npv_narrative = (
        f"Net present utility of the future payoff ({future_utility_value:.0f} units at Year {T:.0f}) "
        f"under varying discount rates: "
        + ", ".join(f"{int(r*100)}%→{pv:.1f}" for r, pv in rate_pvs)
        + ". (Exponential discounting; Samuelson 1937)."
    )

    return DiscountingResult(
        time_horizon_years=T,
        exponential_discount_factor=round(D_exp, 4),
        exponential_present_value=round(pv_exp, 3),
        hyperbolic_discount_factor=round(D_hyp, 4),
        hyperbolic_present_value=round(pv_hyp, 3),
        present_bias_penalty=round(present_bias_penalty, 3),
        present_bias_penalty_pct=round(present_bias_pct, 2),
        delta_used=delta,
        beta_used=beta,
        exponential_trajectory=exp_traj,
        hyperbolic_trajectory=hyp_traj,
        impatience_narrative=impatience_narrative,
        npv_multi_rate_narrative=npv_narrative,
        future_utility_value=round(future_utility_value, 2),
    )


def compare_intertemporal(
    alt_ids: List[str],
    alt_time_horizons: List[float],
    alt_future_utilities: List[float],
    delta: float = 0.07,
    beta: float = 0.70,
) -> IntertemporalComparisonResult:
    """
    Compares multiple alternatives on intertemporal preference rankings, detecting
    preference reversals between short-run (hyperbolic) and long-run (exponential) criteria.
    """
    exp_pvs = {
        alt: compute_discount_factor_exponential(delta, T) * U
        for alt, T, U in zip(alt_ids, alt_time_horizons, alt_future_utilities)
    }
    hyp_pvs = {
        alt: compute_discount_factor_hyperbolic(beta, delta, T) * U
        for alt, T, U in zip(alt_ids, alt_time_horizons, alt_future_utilities)
    }

    long_run_pref = max(exp_pvs, key=exp_pvs.get)
    short_run_pref = max(hyp_pvs, key=hyp_pvs.get)
    reversal = long_run_pref != short_run_pref

    if reversal:
        reversal_narrative = (
            f"Preference reversal detected under temporal discounting: '{long_run_pref}' dominates "
            f"under exponential (long-run) discounting, while '{short_run_pref}' dominates under "
            f"quasi-hyperbolic (present-biased) discounting (β={beta}). This is a structural signature "
            f"of present-biased time preferences (Laibson 1997; O'Donoghue & Rabin 1999): "
            f"the agent's present-self prefers '{short_run_pref}' while their future-self would "
            f"prefer '{long_run_pref}'. Examining whether short-term transition friction is driving "
            f"the ranking is indicated."
        )
        patience_narrative = (
            f"Increasing patience (raising β toward 1.0 or extending commitment) would shift the "
            f"intertemporal preference toward '{long_run_pref}'. "
            f"A staged or pre-committed approach (e.g., Ulysses contract) can help align "
            f"present-self preferences with long-run projected values."
        )
    else:
        reversal_narrative = (
            f"Both exponential and quasi-hyperbolic discounting models converge on '{long_run_pref}' "
            f"as the intertemporal preference leader. The ranking is robust to temporal bias — "
            f"present preferences are consistent with long-run projected values."
        )
        patience_narrative = (
            f"No actionable patience leverage detected — intertemporal preferences are consistent "
            f"across short-run and long-run discounting models."
        )

    return IntertemporalComparisonResult(
        long_run_preferred_alt=long_run_pref,
        short_run_preferred_alt=short_run_pref,
        preference_reversal=reversal,
        reversal_narrative=reversal_narrative,
        patience_leverage_narrative=patience_narrative,
    )
