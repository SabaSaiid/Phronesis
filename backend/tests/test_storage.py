import os
import tempfile
import pytest
from app.core.storage import LocalStorage
from app.schemas.decision import (
    StructuredDecision,
    AnalysisBundle,
    ReportResponse,
    ExpectedUtilityResult,
    MinimaxRegretResult,
    SensitivityAnalysisResult,
    MathLayerResult,
    BiasLayerResult,
    FlaggedBiasPattern,
    StoicAnalysisResult,
    CriticalThinkingLayerResult,
    OutcomeRetroRequest,
    FlagFeedbackRequest
)

@pytest.fixture
def temp_db():
    temp_dir = tempfile.mkdtemp()
    db_file = os.path.join(temp_dir, "test_phronesis.db")
    LocalStorage.set_db_path(db_file)
    yield db_file
    if os.path.exists(db_file):
        os.remove(db_file)

def make_sample_bundle():
    d = StructuredDecision(
        decision_statement="Test Career Dilemma",
        domain="career",
        alternatives=[
            {"id": "alt_1", "name": "Option 1", "description": "Stay"},
            {"id": "alt_2", "name": "Option 2", "description": "Move"}
        ],
        states_of_world=[
            {"id": "s1", "name": "Success", "prior_probability": 0.5},
            {"id": "s2", "name": "Fail", "prior_probability": 0.5}
        ],
        payoff_matrix=[
            {"alternative_id": "alt_1", "state_id": "s1", "utility": 60.0},
            {"alternative_id": "alt_1", "state_id": "s2", "utility": 60.0},
            {"alternative_id": "alt_2", "state_id": "s1", "utility": 90.0},
            {"alternative_id": "alt_2", "state_id": "s2", "utility": 30.0}
        ]
    )
    math = MathLayerResult(
        expected_utility=ExpectedUtilityResult(utilities={"alt_1": 60.0, "alt_2": 60.0}, preferred_alternative_id="alt_1"),
        minimax_regret=MinimaxRegretResult(regret_matrix={}, maximum_regrets={"alt_1": 30.0, "alt_2": 30.0}, minimax_regret_choice="alt_1", regret_tradeoff_insight=""),
        sensitivity_analysis=SensitivityAnalysisResult(critical_parameter="p(s1)", current_value=0.5, inflection_threshold=0.5, directional_shift="", algebraic_formula="", utility_sensitivity=[])
    )
    bias = BiasLayerResult(flagged_patterns=[
        FlaggedBiasPattern(
            id="sunk_cost", name="Sunk Cost", field="behavioral_economics", source="K&T", core_idea="",
            observed_trigger="5 years spent", caveat_analysis="", question_to_surface="", grounding_tier="explicit_variable"
        )
    ])
    stoic = StoicAnalysisResult(
        framework_id="stoicism_v1", framework_name="Stoicism", field="philosophy", source="Epictetus",
        dichotomy_of_control={"internal_controllables": [], "external_uncontrollables": []},
        indifferents_analysis={}, surfaced_questions=[]
    )
    ct = CriticalThinkingLayerResult()
    report = ReportResponse(
        report_markdown="# Test Report",
        key_sensitive_variable="p(s1)",
        proposed_experiment="Test experiment",
        attributed_sources=[],
        math_summary={}
    )
    bundle = AnalysisBundle(
        structured_decision=d,
        bias_layer=bias,
        math_layer=math,
        philosophy_layer=stoic,
        critical_thinking_layer=ct
    )
    return d, bundle, report

def test_storage_opt_in_and_save(temp_db):
    d, bundle, report = make_sample_bundle()

    # Memory disabled by default
    assert LocalStorage.is_memory_enabled() is False
    saved = LocalStorage.save_decision("d1", d, bundle, report)
    assert saved is False
    assert len(LocalStorage.list_decisions()) == 0

    # Enable memory
    LocalStorage.set_memory_enabled(True)
    assert LocalStorage.is_memory_enabled() is True

    # Save decision
    saved = LocalStorage.save_decision("d1", d, bundle, report)
    assert saved is True

    # Retrieve decision
    items = LocalStorage.list_decisions()
    assert len(items) == 1
    assert items[0].id == "d1"
    assert items[0].domain == "career"
    assert "sunk_cost" in items[0].flagged_bias_ids

    detail = LocalStorage.get_decision("d1")
    assert detail is not None
    assert detail["decision_statement"] == "Test Career Dilemma"

def test_outcome_retro_and_feedback(temp_db):
    LocalStorage.set_memory_enabled(True)
    d, bundle, report = make_sample_bundle()
    LocalStorage.save_decision("d1", d, bundle, report)

    # Record outcome
    success = LocalStorage.record_outcome(
        "d1",
        OutcomeRetroRequest(
            chosen_alternative_id="alt_2",
            actual_utility_rating=85.0,
            retrospective_notes="Transition was challenging but paid off well."
        )
    )
    assert success is True

    detail = LocalStorage.get_decision("d1")
    assert detail["outcome"] is not None
    assert detail["outcome"]["chosen_alternative_id"] == "alt_2"
    assert detail["outcome"]["actual_utility_rating"] == 85.0

    # Record feedback
    fb_ok = LocalStorage.record_feedback(
        FlagFeedbackRequest(
            decision_id="d1",
            flag_id="sunk_cost",
            flag_type="bias",
            is_positive=True,
            feedback_reason=None
        )
    )
    assert fb_ok is True

def test_threshold_gating_5_decisions(temp_db):
    LocalStorage.set_memory_enabled(True)
    d, bundle, report = make_sample_bundle()

    # Under 5 decisions -> summary should be None
    for i in range(4):
        LocalStorage.save_decision(f"d_{i}", d, bundle, report)
    assert LocalStorage.get_longitudinal_summary("career") is None

    # 5th decision saved -> summary should now be populated!
    LocalStorage.save_decision("d_4", d, bundle, report)
    summary = LocalStorage.get_longitudinal_summary("career")
    assert summary is not None
    assert summary.total_decisions_logged == 5
    assert "sunk_cost" in summary.recurring_bias_counts
    assert "Longitudinal history" in summary.summary_text

def test_export_and_purge(temp_db):
    LocalStorage.set_memory_enabled(True)
    d, bundle, report = make_sample_bundle()
    LocalStorage.save_decision("d1", d, bundle, report)

    data = LocalStorage.export_history()
    assert "decisions" in data
    assert len(data["decisions"]) == 1

    purged = LocalStorage.purge_history()
    assert purged is True
    assert len(LocalStorage.list_decisions()) == 0
