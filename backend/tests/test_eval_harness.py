import pytest
from app.api.v1.routes import get_benchmarks
from app.engines.math_engine import DecisionTheoryMathEngine
from app.engines.bias_engine import BiasPatternEngine
from app.engines.philosophy_engine import PhilosophyEngine
from app.engines.critical_thinking_engine import CriticalThinkingEngine
from app.core.guardrails import ReportGuardrail

@pytest.mark.asyncio
async def test_golden_benchmarks_count():
    benchmarks = await get_benchmarks()
    assert len(benchmarks) == 6
    benchmark_ids = [bm.id for bm in benchmarks]
    assert "tech_career_pivot" in benchmark_ids
    assert "saas_build_vs_buy" in benchmark_ids
    assert "mortgage_vs_investing" in benchmark_ids
    assert "relocate_vs_stay" in benchmark_ids
    assert "rewrite_vs_refactor" in benchmark_ids
    assert "cofounder_vs_solo" in benchmark_ids

@pytest.mark.asyncio
async def test_golden_benchmarks_mathematical_invariance():
    benchmarks = await get_benchmarks()
    for bm in benchmarks:
        decision = bm.structured_decision
        # Run math engine 5 times to verify 100% mathematical invariance
        results = [DecisionTheoryMathEngine.compute(decision) for _ in range(5)]
        first_eu = results[0].expected_utility.utilities
        first_p_star = results[0].sensitivity_analysis.inflection_threshold
        first_minimax = results[0].minimax_regret.minimax_regret_choice

        for r in results[1:]:
            assert r.expected_utility.utilities == first_eu, f"Math variance detected in EU for {bm.id}"
            assert r.sensitivity_analysis.inflection_threshold == first_p_star, f"Math variance in inflection threshold for {bm.id}"
            assert r.minimax_regret.minimax_regret_choice == first_minimax, f"Math variance in minimax choice for {bm.id}"

@pytest.mark.asyncio
async def test_golden_benchmarks_bias_and_philosophy():
    benchmarks = await get_benchmarks()
    for bm in benchmarks:
        decision = bm.structured_decision

        # Test Bias Engine
        bias_res = BiasPatternEngine.evaluate(decision)
        assert len(bias_res.flagged_patterns) > 0, f"No bias patterns flagged for {bm.id}"
        for p in bias_res.flagged_patterns:
            assert p.field != "", f"Missing field in {p.name}"
            assert p.source != "", f"Missing source in {p.name}"
            assert p.grounding_tier in ["explicit_variable", "narrative_nuance"], f"Invalid grounding tier in {p.name}"

        # Test Philosophy Engine (all 4 frameworks)
        phil_res = PhilosophyEngine.evaluate(decision)
        assert len(phil_res.frameworks) == 4, f"Expected 4 philosophical frameworks for {bm.id}"
        fw_ids = [fw.framework_id for fw in phil_res.frameworks]
        assert "stoicism_v1" in fw_ids
        assert "utilitarianism_v1" in fw_ids
        assert "kantian_deontology_v1" in fw_ids
        assert "virtue_ethics_v1" in fw_ids

        # Test Critical Thinking Base Rates
        ct_res = CriticalThinkingEngine.evaluate(decision)
        assert len(ct_res.falsifiability_audit) > 0, f"Missing falsifiability audit for {bm.id}"
        assert ct_res.base_rate_check is not None, f"Missing base rate check for {bm.id}"

@pytest.mark.asyncio
async def test_golden_benchmarks_guardrail_fallback_cleanliness():
    benchmarks = await get_benchmarks()
    for bm in benchmarks:
        decision = bm.structured_decision
        math_res = DecisionTheoryMathEngine.compute(decision)
        bias_res = BiasPatternEngine.evaluate(decision)
        phil_res = PhilosophyEngine.evaluate(decision)
        ct_res = CriticalThinkingEngine.evaluate(decision)

        from app.schemas.decision import AnalysisBundle
        bundle = AnalysisBundle(
            structured_decision=decision,
            bias_layer=bias_res,
            math_layer=math_res,
            philosophy_layer=phil_res.stoic_legacy,
            philosophy_multi_layer=phil_res,
            critical_thinking_layer=ct_res
        )

        # Generate deterministic report template
        report_text = ReportGuardrail.generate_fallback_template(bundle)
        is_valid, violations = ReportGuardrail.validate_text(report_text)
        assert is_valid is True, f"Guardrail violations in fallback template for {bm.id}: {violations}"
        assert "[Explicit Variable]" in report_text or "[Narrative Nuance]" in report_text
        assert "Stoic Decision Ethics" in report_text
