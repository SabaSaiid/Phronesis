import os
import tempfile
import pytest
from app.core.storage import LocalStorage
from app.schemas.decision import (
    StructuredDecision,
    AnalysisBundle,
    ReportResponse,
    BiasLayerResult,
    FlaggedBiasPattern,
    MathLayerResult,
    StoicAnalysisResult,
    CriticalThinkingLayerResult,
    ExpectedUtilityResult,
    MinimaxRegretResult,
    SensitivityAnalysisResult
)

@pytest.fixture(autouse=True)
def setup_temp_db():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
        temp_path = tf.name
    LocalStorage.set_db_path(temp_path)
    LocalStorage.set_memory_enabled(True)
    yield
    if os.path.exists(temp_path):
        try:
            os.remove(temp_path)
        except Exception:
            pass

def test_project_crud():
    # 1. Create Project
    pid = LocalStorage.create_project(name="Career Pivot 2026", background_note="Aiming for higher technical autonomy.")
    assert pid is not None

    # 2. Get Project
    p = LocalStorage.get_project(pid)
    assert p is not None
    assert p["name"] == "Career Pivot 2026"
    assert p["background_note"] == "Aiming for higher technical autonomy."
    assert p["decision_count"] == 0

    # 3. List Projects
    projects = LocalStorage.list_projects()
    assert len(projects) == 1
    assert projects[0]["id"] == pid

    # 4. Update Project
    upd_res = LocalStorage.update_project(pid, name="Career Pivot 2026 (Updated)", background_note="Updated Note")
    assert upd_res is True
    p_updated = LocalStorage.get_project(pid)
    assert p_updated["name"] == "Career Pivot 2026 (Updated)"
    assert p_updated["background_note"] == "Updated Note"

    # 5. Delete Project
    del_res = LocalStorage.delete_project(pid)
    assert del_res is True
    assert LocalStorage.get_project(pid) is None

def test_project_scoped_retrieval_and_decision_association():
    pid = LocalStorage.create_project(name="Startup Decisions", background_note="Seed stage analysis")

    decision = StructuredDecision(
        decision_statement="Join startup as founding engineer or stay",
        domain="career",
        alternatives=[
            {"id": "alt_1", "name": "Stay", "description": "Stay"},
            {"id": "alt_2", "name": "Join", "description": "Join"}
        ],
        states_of_world=[
            {"id": "s1", "name": "Win", "prior_probability": 0.5},
            {"id": "s2", "name": "Loss", "prior_probability": 0.5}
        ],
        payoff_matrix=[
            {"alternative_id": "alt_1", "state_id": "s1", "utility": 70.0},
            {"alternative_id": "alt_1", "state_id": "s2", "utility": 70.0},
            {"alternative_id": "alt_2", "state_id": "s1", "utility": 95.0},
            {"alternative_id": "alt_2", "state_id": "s2", "utility": 30.0}
        ]
    )
    math_layer = MathLayerResult(
        expected_utility=ExpectedUtilityResult(utilities={"alt_1": 70.0, "alt_2": 62.5}, preferred_alternative_id="alt_1"),
        minimax_regret=MinimaxRegretResult(regret_matrix={}, maximum_regrets={"alt_1": 25.0, "alt_2": 40.0}, minimax_regret_choice="alt_1", regret_tradeoff_insight=""),
        sensitivity_analysis=SensitivityAnalysisResult(critical_parameter="P(Win)", current_value=0.5, inflection_threshold=0.6, directional_shift="favors alt_2 as P(Win) increases", algebraic_formula="")
    )
    bias_pattern = FlaggedBiasPattern(
        id="sunk_cost",
        name="Sunk Cost Salience",
        field="Behavioral Economics",
        source="Kahneman",
        core_idea="Weighing past investments",
        observed_trigger="RSUs mentioned",
        caveat_analysis="Investments are past",
        question_to_surface="Would you choose this if starting fresh?"
    )
    bias_layer = BiasLayerResult(flagged_patterns=[bias_pattern])
    stoic_layer = StoicAnalysisResult(framework_id="stoic", framework_name="Stoicism", field="Philosophy", source="Epictetus", dichotomy_of_control={"internal_controllables": [], "external_uncontrollables": []}, indifferents_analysis={}, surfaced_questions=[])
    ct_layer = CriticalThinkingLayerResult(falsifiability_audit=[])

    bundle = AnalysisBundle(
        structured_decision=decision,
        bias_layer=bias_layer,
        math_layer=math_layer,
        philosophy_layer=stoic_layer,
        critical_thinking_layer=ct_layer,
        project_id=pid
    )
    report = ReportResponse(
        report_markdown="# Report",
        key_sensitive_variable="P(Win)",
        proposed_experiment="Test market",
        project_id=pid
    )

    # Save 5 decisions inside the project
    for i in range(5):
        did = f"dec_{i+1}"
        saved = LocalStorage.save_decision(did, decision, bundle, report)
        assert saved is True

    # Check project details has decision count = 5
    p_info = LocalStorage.get_project(pid)
    assert p_info["decision_count"] == 5

    # Check project decisions listing
    p_decs = LocalStorage.get_project_decisions(pid)
    assert len(p_decs) == 5

    # Check project-scoped longitudinal summary (Tier 1)
    summary = LocalStorage.get_longitudinal_summary(target_domain="career", project_id=pid)
    assert summary is not None
    assert summary.total_decisions_logged == 5
    assert "Startup Decisions" in summary.summary_text
    assert "sunk_cost" in summary.summary_text
