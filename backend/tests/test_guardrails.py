import pytest
from app.core.guardrails import ReportGuardrail
from app.schemas.decision import (
    StructuredDecision,
    Alternative,
    StateOfWorld,
    PayoffCell,
    AnalysisBundle,
    MathLayerResult,
    ExpectedUtilityResult,
    MinimaxRegretResult,
    SensitivityAnalysisResult,
    BiasLayerResult,
    FlaggedBiasPattern,
    StoicAnalysisResult,
    CriticalThinkingLayerResult,
    FalsifiabilityAuditItem,
    BaseRateComparisonItem
)

def test_guardrail_catches_prescriptive_strings():
    bad_text = "Based on the expected utility, you should choose Option A. Score: 92/100. We recommend that you leave your job."
    is_valid, violations = ReportGuardrail.validate_text(bad_text)
    
    assert is_valid is False
    assert len(violations) >= 2

def test_guardrail_catches_diagnostic_labels():
    bad_text = "Your answers indicate that you have the sunk cost fallacy and you suffer from overconfidence."
    is_valid, violations = ReportGuardrail.validate_text(bad_text)
    
    assert is_valid is False
    assert any("bias|fallacy" in v or "suffer" in v for v in violations)

def test_guardrail_passes_observational_language():
    good_text = (
        "Your stated reasoning exhibits structural characteristics consistent with loss aversion. "
        "Under expected utility calculations, Alternative A yields 64.0 compared to 49.5 for Alternative B. "
        "A low-cost experiment to test the key sensitivity variable is suggested."
    )
    is_valid, violations = ReportGuardrail.validate_text(good_text)
    
    assert is_valid is True
    assert len(violations) == 0

def test_guardrail_sanitizes_prescriptive_phrasing():
    bad_text = "You should choose the startup option because we recommend that you pursue upside."
    sanitized = ReportGuardrail.sanitize_or_fallback(bad_text)
    
    assert "you should choose" not in sanitized.lower()
    assert "we recommend that you" not in sanitized.lower()
    assert "one option to inspect is" in sanitized.lower()

# --- Paraphrase Gap Tests ---

@pytest.mark.parametrize("paraphrase_violation", [
    "The wiser path here is to pursue the startup option.",
    "This reflects a textbook case of anchoring.",
    "You're exhibiting a classic sunk-cost pattern.",
    "It would be prudent to select Option B.",
    "Option A clearly comes out ahead.",
    "You ought to choose the safe route.",
    "We strongly advise you to decline the proposal.",
    "My recommendation is to proceed with Option 1.",
    "The optimal choice is to accept the new role."
])
def test_guardrail_catches_paraphrased_violations(paraphrase_violation: str):
    is_valid, violations = ReportGuardrail.validate_text(paraphrase_violation)
    assert is_valid is False
    assert len(violations) >= 1

    offenders = ReportGuardrail.find_offending_sentences(paraphrase_violation)
    assert len(offenders) >= 1
    assert offenders[0] == paraphrase_violation.strip()

@pytest.mark.asyncio
async def test_llm_boundary_audit_pass():
    compliant_report = (
        "# Decision Reasoning Audit\n\n"
        "Alternative A achieves higher expected utility under current prior probabilities. "
        "Your stated reasoning exhibits structural characteristics consistent with loss aversion. "
        "A 48-hour informational test is suggested to verify the key parameter."
    )
    passed, offending_sent, violation_reason = await ReportGuardrail.audit_boundaries_llm(compliant_report)
    assert passed is True
    assert offending_sent is None

@pytest.mark.asyncio
async def test_llm_boundary_audit_catches_violation():
    non_compliant_report = (
        "# Decision Reasoning Audit\n\n"
        "The wiser path here is to pursue the startup option. Option A clearly comes out ahead."
    )
    passed, offending_sent, violation_reason = await ReportGuardrail.audit_boundaries_llm(non_compliant_report)
    assert passed is False
    assert offending_sent is not None

def test_guardrail_deterministic_fallback_template():
    decision = StructuredDecision(
        decision_statement="Stay at Enterprise vs Join Startup",
        alternatives=[
            Alternative(id="alt_stay", name="Stay at Enterprise", description="Stable role"),
            Alternative(id="alt_startup", name="Join Startup", description="High upside")
        ],
        states_of_world=[
            StateOfWorld(id="s1", name="Success", prior_probability=0.3),
            StateOfWorld(id="s2", name="Failure", prior_probability=0.7)
        ],
        payoff_matrix=[
            PayoffCell(alternative_id="alt_stay", state_id="s1", utility=50),
            PayoffCell(alternative_id="alt_stay", state_id="s2", utility=70),
            PayoffCell(alternative_id="alt_startup", state_id="s1", utility=95),
            PayoffCell(alternative_id="alt_startup", state_id="s2", utility=30),
        ]
    )
    bundle = AnalysisBundle(
        structured_decision=decision,
        math_layer=MathLayerResult(
            expected_utility=ExpectedUtilityResult(
                utilities={"alt_stay": 64.0, "alt_startup": 49.5},
                preferred_alternative_id="alt_stay"
            ),
            minimax_regret=MinimaxRegretResult(
                regret_matrix={"alt_stay": {"s1": 45, "s2": 0}, "alt_startup": {"s1": 0, "s2": 40}},
                maximum_regrets={"alt_stay": 45.0, "alt_startup": 40.0},
                minimax_regret_choice="alt_startup",
                regret_tradeoff_insight="Tradeoff detected"
            ),
            sensitivity_analysis=SensitivityAnalysisResult(
                critical_parameter="prior_probability(s1)",
                current_value=0.3,
                inflection_threshold=0.471,
                directional_shift="If probability exceeds 47.1%, startup leads.",
                algebraic_formula="p* = 40/85",
                utility_sensitivity=[]
            )
        ),
        bias_layer=BiasLayerResult(
            flagged_patterns=[
                FlaggedBiasPattern(
                    id="sunk_cost",
                    name="Sunk Cost Salience",
                    field="Behavioral Economics",
                    source="Kahneman & Tversky (1979)",
                    core_idea="Weighting past investments",
                    observed_trigger="RSUs and tenure",
                    caveat_analysis="Evaluate forward-looking value",
                    question_to_surface="Would you make this choice if unvested equity were zero?"
                )
            ]
        ),
        philosophy_layer=StoicAnalysisResult(
            framework_id="stoic_dichotomy",
            framework_name="Stoic Dichotomy of Control",
            field="Hellenistic Philosophy",
            source="Epictetus, Enchiridion",
            dichotomy_of_control={
                "internal_controllables": ["Execution effort", "Continuous learning"],
                "external_uncontrollables": ["Macro market sentiment"]
            },
            indifferents_analysis={
                "preferred_indifferents": ["Equity upside"],
                "virtue_and_agency_tension": "Tension between internal agency and external market conditions."
            },
            surfaced_questions=["What is within your control?"]
        ),
        critical_thinking_layer=CriticalThinkingLayerResult(
            falsifiability_audit=[
                FalsifiabilityAuditItem(
                    assumption="Can find another job",
                    falsifiability_grade="High",
                    test_method="Reach out to 3 recruiters"
                )
            ],
            base_rate_check=BaseRateComparisonItem(
                reference_class="Early Stage AI",
                domain="Startups",
                source="Statistical Base Rates",
                empirical_base_rate=0.20,
                user_assumption="70% success",
                divergence_flag="Overconfidence"
            ),
            steelmanned_counterargument="Remaining ensures stable tenure."
        )
    )

    fallback_report = ReportGuardrail.generate_fallback_template(bundle)

    # Verify fallback template passes guardrail with zero violations
    is_valid, violations = ReportGuardrail.validate_text(fallback_report)
    assert is_valid is True
    assert len(violations) == 0
    assert "Stay at Enterprise vs Join Startup" in fallback_report
    assert "Expected Utility" in fallback_report
    assert "Sunk Cost Salience" in fallback_report
    assert "Stoic Lens" in fallback_report
