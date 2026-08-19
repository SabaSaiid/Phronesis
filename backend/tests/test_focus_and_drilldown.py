import pytest
from app.schemas.decision import (
    StructuredDecision,
    AnalysisBundle,
    FocusConfig,
    DrillDownRequest
)
from app.api.v1.routes import analyze_deterministic, synthesize_report
from app.services.drilldown_service import DrillDownService
from app.core.guardrails import ReportGuardrail

@pytest.fixture
def sample_decision():
    return StructuredDecision(
        decision_statement="Choose between staying in stable role vs joining AI startup.",
        alternatives=[
            {"id": "alt_stay", "name": "Stay at Current Role", "description": "Stable salary and RSUs"},
            {"id": "alt_startup", "name": "Join Startup", "description": "High equity and autonomy"}
        ],
        states_of_world=[
            {"id": "state_win", "name": "Startup Boom", "prior_probability": 0.3},
            {"id": "state_loss", "name": "Startup Fails", "prior_probability": 0.7}
        ],
        payoff_matrix=[
            {"alternative_id": "alt_stay", "state_id": "state_win", "utility": 50.0},
            {"alternative_id": "alt_stay", "state_id": "state_loss", "utility": 70.0},
            {"alternative_id": "alt_startup", "state_id": "state_win", "utility": 95.0},
            {"alternative_id": "alt_startup", "state_id": "state_loss", "utility": 30.0}
        ],
        assumptions=[
            {"id": "a1", "text": "Unvested RSUs represent irrecoverable lost value.", "type": "value_attribution", "testable": False}
        ]
    )

@pytest.mark.asyncio
async def test_deterministic_analysis_runs_all_engines(sample_decision):
    bundle = await analyze_deterministic(sample_decision)
    # Ensure all four engines ran in full
    assert bundle.math_layer is not None
    assert bundle.math_layer.expected_utility is not None
    assert bundle.bias_layer is not None
    assert bundle.philosophy_multi_layer is not None
    assert len(bundle.philosophy_multi_layer.frameworks) == 4
    assert bundle.critical_thinking_layer is not None

@pytest.mark.asyncio
async def test_synthesis_with_custom_focus_config(sample_decision):
    bundle = await analyze_deterministic(sample_decision)
    # Set focus on Philosophy only
    bundle.focus_config = FocusConfig(
        focused_layers=["philosophy"],
        philosophy_frameworks=["virtue_ethics_v1"]
    )
    
    report = await synthesize_report(bundle)
    assert report.report_markdown is not None
    assert len(report.report_markdown) > 50
    assert report.focus_config is not None
    assert "philosophy" in report.focus_config.focused_layers
    assert "practical" not in report.focus_config.focused_layers

@pytest.mark.asyncio
async def test_drilldown_bias_item(sample_decision):
    req = DrillDownRequest(
        decision_statement=sample_decision.decision_statement,
        item_type="bias",
        item_id="sunk_cost_fallacy",
        item_title="Sunk Cost Salience",
        item_context={
            "field": "Behavioral Economics",
            "source": "Kahneman & Tversky (1979)",
            "caveat_analysis": "Overweighting unvested RSUs and past 5 years of tenure.",
            "question_to_surface": "Would you choose this path today starting from zero?"
        }
    )
    res = await DrillDownService.generate_drill_down(req)
    assert res.item_id == "sunk_cost_fallacy"
    assert "Sunk Cost" in res.item_title or "Sunk Cost" in res.deep_dive_markdown
    assert len(res.probing_questions) >= 2
    assert res.concrete_action_or_test is not None

@pytest.mark.asyncio
async def test_drilldown_philosophy_item(sample_decision):
    req = DrillDownRequest(
        decision_statement=sample_decision.decision_statement,
        item_type="philosophy",
        item_id="virtue_ethics_v1",
        item_title="Aristotelian Virtue Ethics (Golden Mean)",
        item_context={
            "field": "Classical Ethics",
            "source": "Aristotle, Nicomachean Ethics",
            "core_idea": "Virtue as the middle ground between deficiency and excess."
        }
    )
    res = await DrillDownService.generate_drill_down(req)
    assert res.item_id == "virtue_ethics_v1"
    assert len(res.deep_dive_markdown) > 30
    assert len(res.probing_questions) >= 1

@pytest.mark.asyncio
async def test_fallback_template_condensed_vs_full(sample_decision):
    bundle = await analyze_deterministic(sample_decision)
    # Test with practical unfocused -> math should be condensed in fallback template
    bundle.focus_config = FocusConfig(
        focused_layers=["philosophy", "psychology"],
        philosophy_frameworks=[]
    )
    fallback = ReportGuardrail.generate_fallback_template(bundle)
    assert "Decision Reasoning Audit" in fallback
    assert "Summary:" in fallback # condensed math summary
