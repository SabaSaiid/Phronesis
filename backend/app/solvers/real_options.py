"""
Real Options, Reversibility & Convexity (Antifragility) Solver.

Models the option value of waiting, staging, and abandonment under uncertainty,
classifying decision commitment types and computing hurdle rate adjustments
for irreversible vs. staged alternatives.

Literature Foundation:
  - Dixit, A.K., & Pindyck, R.S. (1994). Investment under Uncertainty.
    Princeton University Press. (Real Options theory)
  - McDonald, R., & Siegel, D. (1986). The Value of Waiting to Invest.
    Quarterly Journal of Economics, 101(4), 707–727.
  - Taleb, N.N. (2012). Antifragile: Things That Gain from Disorder. Random House.
    (Convexity, Barbell Strategy)
  - Bezos, J. (1999). Amazon Shareholder Letter: Type 1 vs. Type 2 Decision Framework.

CORE AXIOM: These classifications expose structural commitment properties.
They illuminate reversibility tradeoffs without prescribing a "correct" commitment level.
"""
from typing import List, Optional
from dataclasses import dataclass, field


@dataclass
class RealOptionsResult:
    """
    Real Options analysis characterizing reversibility, option value, and hurdle rates.
    """
    # Reversibility Classification
    reversibility_type: str              # "Type 1 (One-Way Door)" | "Type 2 (Two-Way Door)" | "Mixed"
    reversibility_score: float           # 0.0 (fully irreversible) → 1.0 (fully reversible)
    reversibility_narrative: str

    # Option Value of Waiting
    option_value_of_waiting: float       # Estimated utility value of delaying commitment
    hurdle_premium_pct: float            # % by which expected return must exceed cost-of-waiting
    staging_indicated: bool              # True if staged approach is structurally indicated
    staging_narrative: str

    # Antifragility / Convexity Assessment
    convexity_class: str                 # "Convex (Antifragile)" | "Linear" | "Concave (Fragile)"
    convexity_score: float               # Asymmetry ratio: (max_upside - EU) / (EU - min_downside)
    convexity_narrative: str

    # Barbell Strategy Recommendation (Taleb 2012)
    barbell_applicable: bool
    barbell_narrative: str


def classify_reversibility(
    max_regret: float,
    eu_spread: float,
    explicit_irreversibility_signals: List[str],
) -> tuple:
    """
    Classifies decision reversibility as Type 1 (one-way door) or Type 2 (two-way door)
    based on minimax regret, EU spread, and explicit narrative signals.

    Returns: (reversibility_type, reversibility_score)
    """
    irreversibility_keywords = [
        "quit", "leave", "resign", "burn bridges", "sell house", "give up equity",
        "relocate", "commit funds", "invest capital", "non-compete", "marry",
        "take on debt", "sign lease", "full commitment", "all in", "one way",
        "no going back", "irreversible", "permanent"
    ]
    reversibility_keywords = [
        "trial", "pilot", "experiment", "test", "try", "part-time", "consulting",
        "freelance", "option", "can return", "reversible", "two-way", "undo",
        "cancel", "transfer", "negotiate back", "iterative", "explore first"
    ]

    signals_lower = [s.lower() for s in explicit_irreversibility_signals]
    all_text = " ".join(signals_lower)

    irreversibility_signals = sum(1 for k in irreversibility_keywords if k in all_text)
    reversibility_signals = sum(1 for k in reversibility_keywords if k in all_text)

    # Regret and spread scoring (high regret + high EU spread → more irreversible)
    regret_score = min(1.0, max_regret / 50.0)  # normalized to 0-1 (50 = high regret)
    spread_score = min(1.0, eu_spread / 60.0)

    # Composite irreversibility score
    signal_balance = max(0, irreversibility_signals - reversibility_signals) / max(1, irreversibility_signals + reversibility_signals + 1)
    composite_irreversibility = 0.4 * regret_score + 0.3 * spread_score + 0.3 * signal_balance

    reversibility_score = 1.0 - composite_irreversibility

    if reversibility_score < 0.35:
        rev_type = "Type 1 (One-Way Door / High Commitment)"
    elif reversibility_score < 0.65:
        rev_type = "Mixed Reversibility"
    else:
        rev_type = "Type 2 (Two-Way Door / Exploratory)"

    return rev_type, round(reversibility_score, 3)


def compute_real_options(
    alt_ids: List[str],
    eu_values: dict,
    max_regret_values: dict,
    payoff_max: float,
    payoff_min: float,
    time_horizon_years: float = 1.0,
    narrative_signals: Optional[List[str]] = None,
) -> RealOptionsResult:
    """
    Computes real options analysis for a structured decision.

    Args:
        alt_ids: Alternative identifiers.
        eu_values: Expected utility per alternative.
        max_regret_values: Minimax regret per alternative.
        payoff_max: Maximum payoff in the utility matrix.
        payoff_min: Minimum payoff in the utility matrix.
        time_horizon_years: Decision time horizon in years.
        narrative_signals: Text signals from narrative for reversibility detection.
    """
    narrative_signals = narrative_signals or []

    # 1. Reversibility Classification
    best_alt = max(eu_values, key=eu_values.get)
    best_eu = eu_values[best_alt]
    best_max_regret = max_regret_values.get(best_alt, 0.0)
    eu_spread = payoff_max - payoff_min

    rev_type, rev_score = classify_reversibility(
        max_regret=best_max_regret,
        eu_spread=eu_spread,
        explicit_irreversibility_signals=narrative_signals,
    )

    if rev_score < 0.35:
        rev_narrative = (
            f"The leading alternative ('{best_alt}') exhibits structural characteristics "
            f"of a **Type 1 (One-Way Door)** commitment — high worst-case regret "
            f"({best_max_regret:.1f} utility units) and wide payoff spread suggest "
            f"the decision is costly to reverse. This classification is inspired by the "
            f"Bezos (1999) framework: one-way doors warrant deliberate, high-rigor deliberation "
            f"before commitment. Dixit & Pindyck (1994) formalize the premium for waiting "
            f"under irreversibility."
        )
        staging_indicated = True
    elif rev_score < 0.65:
        rev_narrative = (
            f"'{best_alt}' exhibits **mixed reversibility** — some elements are recoverable, "
            f"others are not. Structuring the commitment in staged tranches (Bayesian Sequential "
            f"Experimentation) could reduce the option cost while preserving upside access."
        )
        staging_indicated = True
    else:
        rev_narrative = (
            f"'{best_alt}' exhibits **Type 2 (Two-Way Door)** characteristics — the commitment "
            f"appears relatively reversible, exploratory, or iterative. Lower deliberation overhead "
            f"is analytically justified. Speed of experimentation has higher marginal value than "
            f"waiting (McDonald & Siegel 1986)."
        )
        staging_indicated = False

    # 2. Option Value of Waiting
    # Simplified: OVW ≈ regret * discount_factor_of_waiting * (1 - reversibility_score)
    # This models the uncertainty premium for commitment under ambiguity
    discount_waiting = 1.0 / (1.0 + 0.15 * max(0.1, time_horizon_years))  # 15% opportunity cost of delay
    option_value_of_waiting = best_max_regret * (1 - rev_score) * discount_waiting
    hurdle_premium_pct = round((option_value_of_waiting / best_eu * 100) if best_eu > 0 else 0.0, 1)

    staging_narrative = (
        f"Option Value of Waiting = {option_value_of_waiting:.2f} utility units. "
        f"The preferred alternative must offer an expected return at least {hurdle_premium_pct:.1f}% "
        f"above the cost-of-waiting hurdle to justify immediate commitment over staged exploration. "
        f"(Source: Dixit & Pindyck 1994, §2.3)."
    ) if staging_indicated else (
        f"No material waiting premium detected (reversibility score = {rev_score:.2f}). "
        f"Staged exploration offers limited additional information value relative to the "
        f"opportunity cost of delay."
    )

    # 3. Antifragility / Convexity Assessment (Taleb 2012)
    # Convexity ratio: (max_upside - EU) / (EU - min_downside)
    upside_delta = payoff_max - best_eu
    downside_delta = best_eu - payoff_min

    if downside_delta > 0.5:
        convexity_ratio = upside_delta / downside_delta
    else:
        convexity_ratio = upside_delta / 0.5

    if convexity_ratio > 2.0:
        convexity_class = "Convex (Antifragile)"
        convexity_score = min(1.0, convexity_ratio / 5.0)
        convexity_narrative = (
            f"The payoff distribution exhibits **convexity** (upside delta: {upside_delta:.1f}, "
            f"downside delta: {downside_delta:.1f}, ratio: {convexity_ratio:.1f}x). "
            f"Antifragile structures benefit from variance and volatility — the expected gain from "
            f"favorable states disproportionately exceeds the expected loss from adverse states. "
            f"(Taleb 2012, *Antifragile*, Ch. 11: 'Convexity is Antifragility.')."
        )
    elif convexity_ratio > 0.8:
        convexity_class = "Linear (Variance-Neutral)"
        convexity_score = 0.5
        convexity_narrative = (
            f"The payoff distribution appears roughly linear (upside ≈ downside, ratio: {convexity_ratio:.1f}x). "
            f"Standard Expected Utility calculations are most reliable in this regime. "
            f"Taleb (2012) would characterize this as a 'dumbbell-excluded middle' situation "
            f"worthy of examining whether a non-linear restructuring is available."
        )
    else:
        convexity_class = "Concave (Fragile)"
        convexity_score = max(0.0, convexity_ratio / 2.0)
        convexity_narrative = (
            f"The payoff distribution exhibits **concavity** — downside exposure ({downside_delta:.1f}) "
            f"materially exceeds upside potential ({upside_delta:.1f}, ratio: {convexity_ratio:.1f}x). "
            f"Taleb (2012) classifies this as a *fragile* structure that suffers disproportionately "
            f"from adverse variance. A Barbell Strategy (isolating a minimum safe floor while "
            f"retaining a small high-upside speculative bet) may be worth evaluating."
        )

    # 4. Barbell Strategy (Taleb 2012, Ch. 11)
    barbell_applicable = (convexity_class == "Concave (Fragile)") or (rev_score < 0.40)
    barbell_narrative = (
        f"**Barbell Strategy applicable** (Taleb 2012): Structuring a base of highly conservative, "
        f"recoverable actions (e.g., part-time consulting, pilot program, savings reserve) alongside "
        f"a limited-downside, high-upside exploratory position could convert the fragile "
        f"commitment structure into a convex one. This is not a recommendation — it is a "
        f"structural observation about the asymmetry of the current payoff matrix."
    ) if barbell_applicable else (
        f"The payoff structure does not strongly indicate a Barbell restructuring — "
        f"upside asymmetry is already favorable relative to downside exposure."
    )

    return RealOptionsResult(
        reversibility_type=rev_type,
        reversibility_score=rev_score,
        reversibility_narrative=rev_narrative,
        option_value_of_waiting=round(option_value_of_waiting, 3),
        hurdle_premium_pct=hurdle_premium_pct,
        staging_indicated=staging_indicated,
        staging_narrative=staging_narrative,
        convexity_class=convexity_class,
        convexity_score=round(convexity_score, 3),
        convexity_narrative=convexity_narrative,
        barbell_applicable=barbell_applicable,
        barbell_narrative=barbell_narrative,
    )
