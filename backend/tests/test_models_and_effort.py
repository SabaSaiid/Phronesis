import pytest
from app.schemas.decision import (
    LLMConfigOverride,
    AnalysisBundle,
    StructuredDecision,
    BiasLayerResult,
    MathLayerResult,
    StoicAnalysisResult,
    CriticalThinkingLayerResult,
    ExpectedUtilityResult,
    MinimaxRegretResult,
    SensitivityAnalysisResult,
    FocusConfig
)
from app.services.llm_client import LLMClient
from app.services.synthesis_service import SynthesisService
from app.services.extraction_service import ExtractionService
from app.api.v1.routes import get_models_catalog

@pytest.mark.asyncio
async def test_models_catalog():
    catalog = await get_models_catalog()
    assert len(catalog.models) >= 4
    providers = [m.provider for m in catalog.models]
    assert "gemini" in providers
    assert "openai" in providers
    assert "anthropic" in providers
    assert "mock" in providers

    mock_mod = next(m for m in catalog.models if m.provider == "mock")
    assert mock_mod.has_key is True

@pytest.mark.asyncio
async def test_llm_config_override_resolution():
    prov, mod, key = LLMClient._resolve_provider_model_key(
        LLMConfigOverride(provider="openai", model="gpt-4o", api_key="test_key_123")
    )
    assert prov == "openai"
    assert mod == "gpt-4o"
    assert key == "test_key_123"

@pytest.mark.asyncio
async def test_extraction_with_model_override_and_project_context():
    narrative = "Deciding whether to take offer A ($150k) or offer B ($170k)."
    override = LLMConfigOverride(provider="mock", model="deterministic")
    proj_context = "User is transitioning careers and prioritizes cashflow over equity."

    decision = await ExtractionService.extract_structured_decision(
        narrative=narrative,
        llm_config=override,
        project_context=proj_context
    )
    assert decision is not None
    assert len(decision.alternatives) >= 2

@pytest.mark.asyncio
async def test_synthesis_depth_directives_across_effort_levels():
    decision = StructuredDecision(
        decision_statement="Choose between Option 1 and Option 2",
        alternatives=[
            {"id": "alt_1", "name": "Option 1", "description": "Desc 1"},
            {"id": "alt_2", "name": "Option 2", "description": "Desc 2"}
        ],
        states_of_world=[
            {"id": "s1", "name": "Good", "prior_probability": 0.5},
            {"id": "s2", "name": "Bad", "prior_probability": 0.5}
        ],
        payoff_matrix=[
            {"alternative_id": "alt_1", "state_id": "s1", "utility": 80.0},
            {"alternative_id": "alt_1", "state_id": "s2", "utility": 40.0},
            {"alternative_id": "alt_2", "state_id": "s1", "utility": 90.0},
            {"alternative_id": "alt_2", "state_id": "s2", "utility": 30.0}
        ]
    )
    math_layer = MathLayerResult(
        expected_utility=ExpectedUtilityResult(utilities={"alt_1": 60.0, "alt_2": 60.0}, preferred_alternative_id="alt_1"),
        minimax_regret=MinimaxRegretResult(regret_matrix={}, maximum_regrets={"alt_1": 10.0, "alt_2": 10.0}, minimax_regret_choice="alt_1", regret_tradeoff_insight=""),
        sensitivity_analysis=SensitivityAnalysisResult(critical_parameter="P(Good)", current_value=0.5, inflection_threshold=0.5, directional_shift="balanced", algebraic_formula="")
    )
    bias_layer = BiasLayerResult(flagged_patterns=[])
    stoic_layer = StoicAnalysisResult(framework_id="stoic", framework_name="Stoicism", field="Philosophy", source="Epictetus", dichotomy_of_control={"internal_controllables": [], "external_uncontrollables": []}, indifferents_analysis={}, surfaced_questions=[])
    ct_layer = CriticalThinkingLayerResult(falsifiability_audit=[])

    # Test Quick Effort
    bundle_quick = AnalysisBundle(
        structured_decision=decision,
        bias_layer=bias_layer,
        math_layer=math_layer,
        philosophy_layer=stoic_layer,
        critical_thinking_layer=ct_layer,
        effort_level="quick",
        focus_config=FocusConfig(focused_layers=["psychology"])
    )
    res_quick = await SynthesisService.synthesize_report(bundle_quick, llm_config=LLMConfigOverride(provider="mock"))
    assert res_quick.report_markdown is not None
    assert res_quick.effort_level == "quick"

    # Test Thorough Effort
    bundle_thorough = AnalysisBundle(
        structured_decision=decision,
        bias_layer=bias_layer,
        math_layer=math_layer,
        philosophy_layer=stoic_layer,
        critical_thinking_layer=ct_layer,
        effort_level="thorough",
        focus_config=FocusConfig(focused_layers=["psychology", "logic", "philosophy", "practical"])
    )
    res_thorough = await SynthesisService.synthesize_report(bundle_thorough, llm_config=LLMConfigOverride(provider="mock"))
    assert res_thorough.report_markdown is not None
    assert res_thorough.effort_level == "thorough"
