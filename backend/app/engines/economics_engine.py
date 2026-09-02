"""
Economics & Valuation Engine (Layer 5).

Orchestrates all four quantitative economic solvers into a unified deterministic
analytical layer, integrating:
  1. Value of Information (EVPI / EVSI) — Raiffa & Schlaifer (1961)
  2. Prospect Theory & Risk Curves — Tversky & Kahneman (1992)
  3. Intertemporal Discounting — Laibson (1997); Samuelson (1937)
  4. Real Options & Convexity — Dixit & Pindyck (1994); Taleb (2012)

All outputs are strictly observational and carry sourced academic attribution.
No prescriptive financial or economic advice is generated.
"""
from typing import List, Dict, Optional, Any
from dataclasses import asdict

from app.schemas.decision import (
    StructuredDecision,
    MathLayerResult,
    EconomicsLayerResult,
    EVPIResultSchema,
    EVSIResultSchema,
    ProspectTheoryResultSchema,
    RiskAverseProfileSchema,
    DiscountingResultSchema,
    IntertemporalComparisonResultSchema,
    RealOptionsResultSchema,
)
from app.engines.base import BaseDeterministicEngine, EngineRegistry
from app.solvers.information_value import compute_evpi, compute_evsi
from app.solvers.prospect_theory import compute_prospect_theory, compute_crra_profile
from app.solvers.intertemporal import compute_discounting_analysis, compare_intertemporal
from app.solvers.real_options import compute_real_options


@EngineRegistry.register
class EconomicsEngine(BaseDeterministicEngine):
    """
    Pure deterministic Economics & Valuation Engine.
    Zero LLM dependencies. All computation via sourced algebraic solvers.
    """
    engine_id = "economics_engine_v1"
    engine_name = "Economics & Valuation Engine"
    layer_number = 5

    @classmethod
    def evaluate(
        cls,
        decision: StructuredDecision,
        math_result: Optional[MathLayerResult] = None,
        **kwargs: Any
    ) -> EconomicsLayerResult:
        """
        Runs all economic solvers over the StructuredDecision.

        Args:
            decision: The verified StructuredDecision schema.
            math_result: Optional pre-computed math layer for efficiency.

        Returns:
            EconomicsLayerResult with EVPI, Prospect Theory, Discounting, and Real Options.
        """
        alt_ids = [a.id for a in decision.alternatives]
        state_ids = [s.id for s in decision.states_of_world]
        probabilities = [s.prior_probability for s in decision.states_of_world]

        # Build utility matrix: U[i][j]
        payoff_lookup: Dict[tuple, float] = {
            (p.alternative_id, p.state_id): p.utility for p in decision.payoff_matrix
        }
        utility_matrix: List[List[float]] = []
        for alt in decision.alternatives:
            row = [payoff_lookup.get((alt.id, s.id), 50.0) for s in decision.states_of_world]
            utility_matrix.append(row)

        payoff_values = [cell.utility for cell in decision.payoff_matrix]
        payoff_max = max(payoff_values) if payoff_values else 80.0
        payoff_min = min(payoff_values) if payoff_values else 20.0

        # --- 1. Value of Information (EVPI / EVSI) ---
        evpi_result = compute_evpi(probabilities, utility_matrix, alt_ids, state_ids)
        evsi_result = compute_evsi(probabilities, utility_matrix, alt_ids, state_ids)

        # --- 2. Prospect Theory & Risk Preferences ---
        # Pre-compute EU values if math_result available
        eu_values: Optional[Dict[str, float]] = None
        eu_preferred_alt = alt_ids[0] if alt_ids else ""
        if math_result:
            eu_values = dict(math_result.expected_utility.utilities)
            eu_preferred_alt = math_result.expected_utility.preferred_alternative_id

        prospect_result = compute_prospect_theory(
            alt_ids=alt_ids,
            state_ids=state_ids,
            probabilities=probabilities,
            utility_matrix=utility_matrix,
            eu_values=eu_values,
        )
        crra_result = compute_crra_profile(
            alt_ids=alt_ids,
            state_ids=state_ids,
            probabilities=probabilities,
            utility_matrix=utility_matrix,
            gamma=1.5,  # Moderate risk aversion (Arrow 1965 midpoint)
        )

        # --- 3. Intertemporal Discounting ---
        # Estimate time horizon from narrative signals
        time_horizon = cls._estimate_time_horizon(decision)

        # Use the best EU alternative's max payoff as future utility proxy
        best_alt_idx = alt_ids.index(eu_preferred_alt) if eu_preferred_alt in alt_ids else 0
        best_alt_payoffs = utility_matrix[best_alt_idx] if utility_matrix else [50.0]
        future_utility = sum(p * u for p, u in zip(probabilities, best_alt_payoffs))

        discounting_result = compute_discounting_analysis(
            time_horizon_years=time_horizon,
            future_utility_value=future_utility,
            delta=0.07,
            beta=0.70,
        )

        intertemporal_comparison = None
        if len(alt_ids) >= 2:
            # Estimate time horizon per alternative from descriptions
            alt_horizons = [time_horizon] * len(alt_ids)
            alt_future_utils = [
                sum(p * utility_matrix[i][j] for j, p in enumerate(probabilities))
                for i in range(len(alt_ids))
            ]
            intertemporal_comparison = compare_intertemporal(
                alt_ids=alt_ids,
                alt_time_horizons=alt_horizons,
                alt_future_utilities=alt_future_utils,
            )

        # --- 4. Real Options & Convexity ---
        max_regret_values: Dict[str, float] = {}
        eu_values_for_options: Dict[str, float] = {}

        if math_result:
            max_regret_values = dict(math_result.minimax_regret.maximum_regrets)
            eu_values_for_options = dict(math_result.expected_utility.utilities)
        else:
            for i, alt_id in enumerate(alt_ids):
                eu_val = sum(probabilities[j] * utility_matrix[i][j] for j in range(len(state_ids)))
                eu_values_for_options[alt_id] = round(eu_val, 2)
            max_regret_values = {alt_id: payoff_max - eu_values_for_options[alt_id] for alt_id in alt_ids}

        # Collect narrative signals for reversibility detection
        narrative_signals = (
            [decision.decision_statement]
            + [a.description for a in decision.alternatives]
            + decision.constraints
            + [assump.text for assump in decision.assumptions]
        )

        real_options_result = compute_real_options(
            alt_ids=alt_ids,
            eu_values=eu_values_for_options,
            max_regret_values=max_regret_values,
            payoff_max=payoff_max,
            payoff_min=payoff_min,
            time_horizon_years=time_horizon,
            narrative_signals=narrative_signals,
        )

        # --- 5. Opportunity Cost Shadow Price ---
        opp_cost_narrative = cls._compute_opportunity_cost_narrative(
            alt_ids=alt_ids,
            eu_values=eu_values_for_options,
            eu_preferred=eu_preferred_alt,
        )

        return EconomicsLayerResult(
            evpi=EVPIResultSchema(**asdict(evpi_result)),
            evsi=EVSIResultSchema(**asdict(evsi_result)),
            prospect_theory=ProspectTheoryResultSchema(**asdict(prospect_result)),
            crra_profile=RiskAverseProfileSchema(**asdict(crra_result)),
            discounting=DiscountingResultSchema(**asdict(discounting_result)),
            intertemporal_comparison=IntertemporalComparisonResultSchema(**asdict(intertemporal_comparison)) if intertemporal_comparison else None,
            real_options=RealOptionsResultSchema(**asdict(real_options_result)),
            opportunity_cost_narrative=opp_cost_narrative,
        )

    @staticmethod
    def _estimate_time_horizon(decision: StructuredDecision) -> float:
        """
        Heuristically estimates the decision's primary time horizon in years
        from narrative, assumptions, and goals text.
        """
        all_text = (
            decision.decision_statement + " " +
            " ".join(a.description for a in decision.alternatives) + " " +
            " ".join(decision.goals) + " " +
            " ".join(assump.text for assump in decision.assumptions)
        ).lower()

        # Search for explicit year/month mentions
        horizon = 1.0  # default 1-year horizon

        for marker, value in [
            ("10 year", 10.0), ("10-year", 10.0), ("decade", 10.0),
            ("5 year", 5.0), ("5-year", 5.0),
            ("3 year", 3.0), ("3-year", 3.0),
            ("2 year", 2.0), ("2-year", 2.0), ("24 month", 2.0),
            ("18 month", 1.5), ("18-month", 1.5),
            ("1 year", 1.0), ("1-year", 1.0), ("12 month", 1.0),
            ("6 month", 0.5), ("6-month", 0.5), ("quarter", 0.25),
        ]:
            if marker in all_text:
                horizon = value
                break

        return horizon

    @staticmethod
    def _compute_opportunity_cost_narrative(
        alt_ids: List[str],
        eu_values: Dict[str, float],
        eu_preferred: str,
    ) -> str:
        """
        Computes and narrates the opportunity cost of selecting the preferred alternative
        vs. its closest competitor.
        """
        if len(alt_ids) < 2:
            return "Insufficient alternatives to compute opportunity cost shadow price."

        sorted_alts = sorted(alt_ids, key=lambda a: eu_values.get(a, 0), reverse=True)
        best = sorted_alts[0]
        runner_up = sorted_alts[1] if len(sorted_alts) > 1 else sorted_alts[0]

        best_eu = eu_values.get(best, 0)
        runner_eu = eu_values.get(runner_up, 0)
        delta = round(best_eu - runner_eu, 2)

        if delta == 0:
            return (
                f"Selecting either '{best}' or '{runner_up}' carries negligible expected opportunity cost "
                f"(both yield ~{best_eu:.1f} Expected Utility units), indicating near-indifference on expected payoff alone."
            )
        else:
            return (
                f"Choosing the runner-up alternative '{runner_up}' instead of the leading choice '{best}' "
                f"carries an expected opportunity cost of {delta:.1f} Expected Utility units — the implicit yield "
                f"sacrificed by not pursuing the payoff-maximizing path. Conversely, selecting '{best}' captures "
                f"a +{delta:.1f} EU yield premium over the closest competitor."
            )
