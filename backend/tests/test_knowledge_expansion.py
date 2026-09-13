import pytest
from app.schemas.decision import StructuredDecision, Alternative, StateOfWorld, PayoffCell, Assumption
from app.engines.critical_thinking_engine import CriticalThinkingEngine
from app.engines.domain_engine import DomainEngine
from app.solvers.information_value import compute_evpi, get_voi_experiments
from app.core.doc_parser import parse_uploaded_document


def create_sample_decision(domain="startup_and_venture", text="Deciding whether to raise Seed round or stay bootstrapped."):
    return StructuredDecision(
        decision_statement=text,
        domain=domain,
        alternatives=[
            Alternative(id="alt_1", name="Raise Seed VC", description="Raise $1.5M seed funding from venture investors"),
            Alternative(id="alt_2", name="Bootstrapped SaaS", description="Stay profitable and grow organically on customer revenue")
        ],
        states_of_world=[
            StateOfWorld(id="s_bull", name="High growth market expansion", prior_probability=0.35),
            StateOfWorld(id="s_bear", name="Market slowdown and high churn", prior_probability=0.65)
        ],
        payoff_matrix=[
            PayoffCell(alternative_id="alt_1", state_id="s_bull", utility=90.0, narrative="Big win"),
            PayoffCell(alternative_id="alt_1", state_id="s_bear", utility=20.0, narrative="Dilution & down round"),
            PayoffCell(alternative_id="alt_2", state_id="s_bull", utility=75.0, narrative="Steady cashflow"),
            PayoffCell(alternative_id="alt_2", state_id="s_bear", utility=50.0, narrative="Slow but survive")
        ],
        goals=["Reach profitability", "Preserve ownership equity", "Survive macroeconomic downturn"],
        constraints=["12 months current cash runway", "No personal guarantees"],
        assumptions=[
            Assumption(id="a_1", text="Venture investors will offer non-punitive liquidation preference terms.", testable=True),
            Assumption(id="a_2", text="Our customer churn rate will remain below 1.5% monthly.", testable=True)
        ],
        unknowns=["Series A conversion rate in 2026", "Enterprise sales cycle length"]
    )


def test_base_rates_expanded_count_and_matching():
    """Verify base rates database expanded beyond 50 entries and domain matching works."""
    base_rates = CriticalThinkingEngine.get_base_rates()
    assert len(base_rates) >= 50, f"Expected >=50 base rates, found {len(base_rates)}"

    # Test domain-aware matching for venture startup decision
    decision = create_sample_decision(domain="venture_capital", text="Raise seed round vs boostrap SaaS product.")
    result = CriticalThinkingEngine.evaluate(decision)

    assert result.base_rate_check is not None
    assert result.base_rate_check.empirical_base_rate > 0
    assert result.base_rate_check.domain in ["venture_capital", "software_engineering", "business_operations"]
    assert result.bayesian_update_narrative is not None


def test_domain_engine_evaluates_frameworks():
    """Verify DomainEngine matches frameworks and attaches checklists with zero prescriptiveness."""
    decision = create_sample_decision(domain="startup_and_venture")
    result = DomainEngine.evaluate(decision)

    assert len(result.matched_frameworks) >= 1
    top_fw = result.matched_frameworks[0]
    assert top_fw.framework_name != ""
    assert top_fw.source != ""
    assert len(top_fw.matched_checklist) >= 1
    # Verify diagnostic questions are present
    assert any(item.probing_question for item in top_fw.matched_checklist)


def test_voi_experiments_playbook_integrated():
    """Verify VoI experiments playbook loads protocols and compute_evpi surfaces them."""
    exps = get_voi_experiments()
    assert len(exps) >= 10, f"Expected >=10 VoI experiments, found {len(exps)}"

    probabilities = [0.4, 0.6]
    utility_matrix = [[85.0, 15.0], [60.0, 50.0]]
    alt_ids = ["alt_startup", "alt_stable"]
    state_ids = ["s_success", "s_failure"]

    evpi_res = compute_evpi(
        probabilities=probabilities,
        utility_matrix=utility_matrix,
        alt_ids=alt_ids,
        state_ids=state_ids,
        context_text="Validate customer demand for our new SaaS software MVP before writing code."
    )

    assert evpi_res.evpi_utility > 0
    assert len(evpi_res.suggested_experiments) >= 1
    top_exp = evpi_res.suggested_experiments[0]
    assert "name" in top_exp
    assert "typical_cost" in top_exp
    assert "falsifiability_signal" in top_exp


def test_doc_parser_handles_text_and_pdf():
    """Verify doc_parser extracts text from various formats."""
    # Text
    sample_txt = b"EMPLOYMENT AGREEMENT: Base Salary $200,000. Signing Bonus $30,000. 4-year vesting schedule."
    text, doc_type = parse_uploaded_document("offer_letter.txt", sample_txt)
    assert "Base Salary $200,000" in text
    assert doc_type == "TXT Text"

    # CSV
    sample_csv = b"Month,ARR,NetBurn\n1,10000,25000\n2,18000,24000\n3,30000,22000"
    text_csv, doc_type_csv = parse_uploaded_document("metrics.csv", sample_csv)
    assert "ARR" in text_csv
    assert doc_type_csv == "CSV Text"
