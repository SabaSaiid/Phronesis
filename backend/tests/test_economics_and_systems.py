"""
Integration tests for Economics Engine (Layer 5) and Systems Engine (Layer 6).
"""
import pytest
from app.schemas.decision import (
    StructuredDecision,
    Alternative,
    StateOfWorld,
    PayoffCell,
    Assumption
)
from app.engines.economics_engine import EconomicsEngine
from app.engines.systems_engine import SystemsEngine
from app.engines.base import EngineRegistry


@pytest.fixture
def career_decision():
    return StructuredDecision(
        decision_statement="Deciding whether to leave corporate executive role to launch AI deep-tech startup.",
        alternatives=[
            Alternative(id="stay_corp", name="Stay in Executive Role", description="Retain corporate salary, stability, and unvested stock."),
            Alternative(id="found_startup", name="Found AI Startup", description="Commit full time, invest initial capital, and build software flywheel.")
        ],
        states_of_world=[
            StateOfWorld(id="ai_boom", name="AI Super-cycle Boom", prior_probability=0.4),
            StateOfWorld(id="macro_winter", name="Macro Tech Winter", prior_probability=0.6)
        ],
        payoff_matrix=[
            PayoffCell(alternative_id="stay_corp", state_id="ai_boom", utility=65.0, narrative="Decent compensation, missed upside."),
            PayoffCell(alternative_id="stay_corp", state_id="macro_winter", utility=70.0, narrative="Safe haven income."),
            PayoffCell(alternative_id="found_startup", state_id="ai_boom", utility=95.0, narrative="Massive equity compound growth."),
            PayoffCell(alternative_id="found_startup", state_id="macro_winter", utility=25.0, narrative="Downside runway stress.")
        ],
        goals=["Maximize 5-year wealth creation", "Maintain family baseline security"],
        constraints=["Only 18 months of personal runway available", "Cannot easily undo resignation"],
        assumptions=[
            Assumption(id="a1", text="AI foundation models will continue compound capability growth.", type="empirical", testable=True),
            Assumption(id="a2", text="Can raise seed venture capital within 6 months.", type="empirical", testable=True)
        ],
        unknowns=["Whether enterprise customers will commit to pilot contracts"],
        domain="venture_capital"
    )


def test_engine_registry_contains_all_v3_engines():
    engines = EngineRegistry.list_engines()
    engine_ids = [e["engine_id"] for e in engines]
    assert "math_engine_v1" in engine_ids
    assert "bias_engine_v1" in engine_ids
    assert "philosophy_engine_v1" in engine_ids
    assert "critical_thinking_engine_v1" in engine_ids
    assert "economics_engine_v1" in engine_ids
    assert "systems_engine_v1" in engine_ids


def test_economics_engine_evaluation(career_decision):
    result = EconomicsEngine.evaluate(career_decision)
    assert result.evpi is not None
    assert result.evpi.evpi_utility >= 0.0
    assert result.evpi.voi_ceiling_narrative != ""
    assert result.prospect_theory is not None
    assert result.prospect_theory.cpt_values_per_alt != {}
    assert result.crra_profile is not None
    assert result.crra_profile.risk_class == "Risk-Averse"
    assert result.discounting is not None
    assert result.discounting.exponential_present_value > 0
    assert result.real_options is not None
    assert result.opportunity_cost_narrative != ""


def test_systems_engine_evaluation(career_decision):
    result = SystemsEngine.evaluate(career_decision)
    assert result.feedback_loops is not None
    assert len(result.feedback_loops.reinforcing_loops_detected) > 0
    assert result.game_theory is not None
    assert result.game_theory.game_type != ""
    assert result.rawlsian_audit is not None
    assert result.rawlsian_audit.least_advantaged_stakeholder != ""
    assert result.systems_synthesis_narrative != ""
