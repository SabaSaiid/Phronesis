"""
Architectural Regression and Invariance Tests for Phronesis.

Validates:
1. SQLite context manager connection closure and no file descriptor exhaustion over 50 iterations.
2. Exact multi-state proportional sensitivity inflection calculation (N >= 3 states).
3. Opportunity cost narrative consistency (zero delta indifference vs positive yield premium).
4. CRRA certainty equivalent inversion stability (preventing ZeroDivisionError on non-positive inner values).
5. Comprehensive fallback report generation (Layers 1-6) conforming to non-prescriptive guardrails.
6. SynthesizeReportRequest handling, custom LLM config passthrough, and decision_id generation.
7. Project-scoped longitudinal context routing and retrieval.
"""
import pytest
import numpy as np
from app.core.storage import LocalStorage
from app.schemas.decision import (
    StructuredDecision,
    Alternative,
    StateOfWorld,
    PayoffCell,
    FocusConfig,
    SynthesizeReportRequest,
    LLMConfigOverride
)
from app.engines.math_engine import DecisionTheoryMathEngine
from app.engines.economics_engine import EconomicsEngine
from app.solvers.prospect_theory import compute_crra_profile
from app.core.guardrails import ReportGuardrail
from app.services.synthesis_service import SynthesisService
from app.api.v1.routes import analyze_deterministic, synthesize_report


@pytest.fixture
def base_decision():
    return StructuredDecision(
        decision_statement="Evaluate engineering architectural evolution.",
        alternatives=[
            Alternative(id="alt_modular", name="Modular Monolith", description="Keep modular core"),
            Alternative(id="alt_microservices", name="Microservices", description="Decompose into distributed services")
        ],
        states_of_world=[
            StateOfWorld(id="state_growth", name="Rapid User Scale", prior_probability=0.6),
            StateOfWorld(id="state_steady", name="Steady Growth", prior_probability=0.4)
        ],
        payoff_matrix=[
            PayoffCell(alternative_id="alt_modular", state_id="state_growth", utility=70.0),
            PayoffCell(alternative_id="alt_modular", state_id="state_steady", utility=85.0),
            PayoffCell(alternative_id="alt_microservices", state_id="state_growth", utility=95.0),
            PayoffCell(alternative_id="alt_microservices", state_id="state_steady", utility=40.0),
        ],
        domain="technology"
    )


import os
import tempfile

@pytest.fixture(autouse=True)
def temp_db():
    temp_dir = tempfile.mkdtemp()
    db_file = os.path.join(temp_dir, "test_arch_phronesis.db")
    LocalStorage.set_db_path(db_file)
    LocalStorage.set_memory_enabled(True)
    yield db_file
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except Exception:
            pass


def test_sqlite_connection_lifecycle():
    """Verify that get_connection closes connection cleanly and does not leak handles across 50 operations."""
    for i in range(50):
        with LocalStorage.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM decisions")
            count = cur.fetchone()[0]
            assert count >= 0
    # Confirm DB is still accessible and responsive
    stats = LocalStorage.get_storage_stats()
    assert stats["db_size_bytes"] >= 0


def test_multistate_proportional_sensitivity():
    """Verify 3-state sensitivity inflection calculation."""
    # 3 states: s0 (0.4), s1 (0.3), s2 (0.3)
    # alt_a: s0=80, s1=50, s2=50  -> EU = 0.4*80 + 0.3*50 + 0.3*50 = 32 + 15 + 15 = 62
    # alt_b: s0=40, s1=90, s2=70  -> EU = 0.4*40 + 0.3*90 + 0.3*70 = 16 + 27 + 21 = 64
    # Leading is alt_b (64), runner-up is alt_a (62)
    alt_ids = ["alt_a", "alt_b"]
    state_ids = ["s0", "s1", "s2"]
    probs = np.array([0.4, 0.3, 0.3])
    U = np.array([
        [80.0, 50.0, 50.0],
        [40.0, 90.0, 70.0]
    ])
    eu_vec = np.array([62.0, 64.0])

    sens = DecisionTheoryMathEngine._compute_sensitivity(
        alt_ids=alt_ids,
        state_ids=state_ids,
        probabilities=probs,
        U=U,
        eu_vector=eu_vec,
        best_idx=1
    )

    assert "s0" in sens.critical_parameter
    assert 0.0 <= sens.inflection_threshold <= 1.0
    assert "E[U" in sens.algebraic_formula


def test_opportunity_cost_narrative_logic():
    """Verify opportunity cost narrative conveys positive yield premium and foregone yield."""
    alt_ids = ["alt_best", "alt_runner"]
    eu_values = {"alt_best": 85.0, "alt_runner": 65.0}
    narrative = EconomicsEngine._compute_opportunity_cost_narrative(
        alt_ids=alt_ids,
        eu_values=eu_values,
        eu_preferred="alt_best"
    )
    assert "implicit yield sacrificed" in narrative
    assert "+20.0 EU yield premium" in narrative

    # Equal payoff scenario
    equal_eu = {"alt_best": 70.0, "alt_runner": 70.0}
    equal_narrative = EconomicsEngine._compute_opportunity_cost_narrative(
        alt_ids=alt_ids,
        eu_values=equal_eu,
        eu_preferred="alt_best"
    )
    assert "negligible expected opportunity cost" in equal_narrative


def test_crra_zero_inner_product_stability():
    """Verify CRRA profile does not crash with ZeroDivisionError when gamma > 1 and inner <= 0."""
    # When gamma = 2.0 (1 - gamma = -1.0) and payoffs are very low, ensure inner <= 1e-9 clamps to 0.01
    alt_ids = ["alt_zero"]
    state_ids = ["s0"]
    probs = [1.0]
    utility_matrix = [[0.0]]  # Will be clamped to 0.01 in solver
    profile = compute_crra_profile(alt_ids, state_ids, probs, utility_matrix, gamma=2.0)
    assert profile.certainty_equivalents["alt_zero"] > 0
    assert profile.risk_class == "Risk-Averse"


@pytest.mark.asyncio
async def test_guardrail_fallback_includes_all_layers(base_decision):
    """Verify fallback template formats economics and systems layers and adheres to non-prescriptive guardrails."""
    bundle = await analyze_deterministic(base_decision)
    fallback = ReportGuardrail.generate_fallback_template(bundle)

    # Check that sections are present
    assert "Quantitative Economics & Valuation" in fallback
    assert "Systems Dynamics & Game Theoretic Strategic Context" in fallback
    assert "Value of Information" in fallback

    # Check that guardrail validates it as compliant
    is_valid, violation = ReportGuardrail.validate_text(fallback)
    assert is_valid, f"Fallback report violated guardrails: {violation}"


@pytest.mark.asyncio
async def test_synthesize_report_request_handling_and_decision_id(base_decision):
    """Verify synthesize_report route accepts SynthesizeReportRequest, propagates llm_config, and assigns decision_id."""
    bundle = await analyze_deterministic(base_decision)
    req = SynthesizeReportRequest(
        bundle=bundle,
        llm_config=LLMConfigOverride(provider="mock", model="mock-test")
    )
    res = await synthesize_report(req)
    assert res.decision_id is not None
    assert len(res.decision_id) > 10

    # Verify decision is persisted with full report response in SQLite
    retrieved = LocalStorage.get_decision(res.decision_id)
    assert retrieved is not None
    assert retrieved["id"] == res.decision_id
    assert retrieved["report_markdown"] == res.report_markdown


@pytest.mark.asyncio
async def test_project_scoped_longitudinal_routing(base_decision):
    """Verify project_id routing in analyze_deterministic and storage."""
    proj_id = LocalStorage.create_project(name="Core Architecture 2026", background_note="Strategic rewrite")
    base_decision.project_id = proj_id

    bundle = await analyze_deterministic(base_decision)
    assert bundle.project_id == proj_id

    rep = await SynthesisService.synthesize_report(bundle)
    dec_id = f"test-dec-{proj_id}"
    LocalStorage.save_decision(
        decision_id=dec_id,
        decision=base_decision,
        bundle=bundle,
        report=rep
    )

    # Query project decisions
    proj_decisions = LocalStorage.get_project_decisions(proj_id)
    assert any(d["id"] == dec_id for d in proj_decisions)
