import pytest
import numpy as np
from app.schemas.decision import (
    StructuredDecision,
    Alternative,
    StateOfWorld,
    PayoffCell,
    Assumption
)
from app.engines.math_engine import DecisionTheoryMathEngine

def create_sample_decision() -> StructuredDecision:
    return StructuredDecision(
        decision_statement="Stay at Enterprise vs Join Pre-Seed AI Startup",
        alternatives=[
            Alternative(id="alt_stay", name="Stay at Enterprise", description="Stable role"),
            Alternative(id="alt_startup", name="Join AI Startup", description="High risk, high upside")
        ],
        states_of_world=[
            StateOfWorld(id="state_win", name="Startup Succeeds", prior_probability=0.30),
            StateOfWorld(id="state_fail", name="Startup Fails", prior_probability=0.70)
        ],
        payoff_matrix=[
            PayoffCell(alternative_id="alt_stay", state_id="state_win", utility=50.0),
            PayoffCell(alternative_id="alt_stay", state_id="state_fail", utility=70.0),
            PayoffCell(alternative_id="alt_startup", state_id="state_win", utility=95.0),
            PayoffCell(alternative_id="alt_startup", state_id="state_fail", utility=30.0),
        ],
        goals=["Maximize career growth", "Maintain financial safety"],
        constraints=["Minimum $120k income needed"],
        assumptions=[
            Assumption(id="a1", text="Can find another job if startup fails", testable=True)
        ]
    )

def test_expected_utility_calculation():
    decision = create_sample_decision()
    result = DecisionTheoryMathEngine.compute(decision)

    # Expected Utility:
    # EU(alt_stay) = 0.30 * 50 + 0.70 * 70 = 15 + 49 = 64.0
    # EU(alt_startup) = 0.30 * 95 + 0.70 * 30 = 28.5 + 21 = 49.5
    assert result.expected_utility.utilities["alt_stay"] == 64.0
    assert result.expected_utility.utilities["alt_startup"] == 49.5
    assert result.expected_utility.preferred_alternative_id == "alt_stay"

def test_minimax_regret_calculation():
    decision = create_sample_decision()
    result = DecisionTheoryMathEngine.compute(decision)

    # Regrets:
    # Under state_win: max is 95 -> Regret(stay) = 45, Regret(startup) = 0
    # Under state_fail: max is 70 -> Regret(stay) = 0, Regret(startup) = 40
    # Max Regret:
    # MR(alt_stay) = 45.0
    # MR(alt_startup) = 40.0
    # Minimax Regret Choice: alt_startup (40.0 < 45.0)
    assert result.minimax_regret.maximum_regrets["alt_stay"] == 45.0
    assert result.minimax_regret.maximum_regrets["alt_startup"] == 40.0
    assert result.minimax_regret.minimax_regret_choice == "alt_startup"

def test_sensitivity_inflection_threshold():
    decision = create_sample_decision()
    result = DecisionTheoryMathEngine.compute(decision)

    # Solving for p*(state_win) where EU(stay) = EU(startup):
    # p * 50 + (1-p) * 70 = p * 95 + (1-p) * 30
    # 70 - 20p = 30 + 65p
    # 40 = 85p
    # p* = 40 / 85 ≈ 0.470588...
    # Under formula:
    # numerator = U(a2, s1) - U(a1, s1) = 30 - 70 = -40
    # denominator = (U(a1, s0) - U(a1, s1)) - (U(a2, s0) - U(a2, s1)) = (50 - 70) - (95 - 30) = -20 - 65 = -85
    # p* = -40 / -85 = 40 / 85 ≈ 0.471
    inflection = result.sensitivity_analysis.inflection_threshold
    assert abs(inflection - (40.0 / 85.0)) < 0.01
    assert "prior_probability(state_win)" in result.sensitivity_analysis.critical_parameter

def test_probability_auto_normalization():
    decision = create_sample_decision()
    # Unnormalized probabilities summing to 10.0
    decision.states_of_world[0].prior_probability = 3.0
    decision.states_of_world[1].prior_probability = 7.0
    
    result = DecisionTheoryMathEngine.compute(decision)
    assert result.expected_utility.utilities["alt_stay"] == 64.0
    assert result.expected_utility.utilities["alt_startup"] == 49.5
