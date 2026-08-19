from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class Alternative(BaseModel):
    id: str
    name: str
    description: str

class StateOfWorld(BaseModel):
    id: str
    name: str
    prior_probability: float = Field(ge=0.0, le=1.0)

class PayoffCell(BaseModel):
    alternative_id: str
    state_id: str
    utility: float = Field(ge=0.0, le=100.0)
    narrative: Optional[str] = ""

class Assumption(BaseModel):
    id: str
    text: str
    type: str = Field(default="empirical", description="empirical, value_attribution, causal, counterfactual")
    testable: bool = True

class StructuredDecision(BaseModel):
    decision_statement: str
    alternatives: List[Alternative]
    states_of_world: List[StateOfWorld]
    payoff_matrix: List[PayoffCell]
    goals: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    assumptions: List[Assumption] = Field(default_factory=list)
    unknowns: List[str] = Field(default_factory=list)
    domain: Optional[str] = "general"

    @field_validator("states_of_world")
    def validate_probabilities(cls, states: List[StateOfWorld]) -> List[StateOfWorld]:
        if not states:
            return states
        total_p = sum(s.prior_probability for s in states)
        if total_p <= 0:
            equal_p = 1.0 / len(states)
            for s in states:
                s.prior_probability = equal_p
        elif abs(total_p - 1.0) > 0.001:
            # Auto-normalize
            for s in states:
                s.prior_probability = s.prior_probability / total_p
        return states

class FlaggedBiasPattern(BaseModel):
    id: str
    name: str
    field: str
    source: str
    core_idea: str
    observed_trigger: str
    caveat_analysis: str
    question_to_surface: str
    grounding_tier: str = Field(default="explicit_variable", description="explicit_variable or narrative_nuance")

class BiasLayerResult(BaseModel):
    flagged_patterns: List[FlaggedBiasPattern] = Field(default_factory=list)

class SensitivityPayoffItem(BaseModel):
    alternative_id: str
    state_id: str
    current_value: float
    inflection_threshold: float
    insight: str

class SensitivityAnalysisResult(BaseModel):
    critical_parameter: str
    current_value: float
    inflection_threshold: float
    directional_shift: str
    algebraic_formula: str
    utility_sensitivity: List[SensitivityPayoffItem] = Field(default_factory=list)

class ExpectedUtilityResult(BaseModel):
    utilities: Dict[str, float]
    preferred_alternative_id: str

class MinimaxRegretResult(BaseModel):
    regret_matrix: Dict[str, Dict[str, float]]  # alternative_id -> {state_id: regret}
    maximum_regrets: Dict[str, float]           # alternative_id -> max regret
    minimax_regret_choice: str
    regret_tradeoff_insight: str

class MathLayerResult(BaseModel):
    expected_utility: ExpectedUtilityResult
    minimax_regret: MinimaxRegretResult
    sensitivity_analysis: SensitivityAnalysisResult

class StoicAnalysisResult(BaseModel):
    framework_id: str
    framework_name: str
    field: str
    source: str
    dichotomy_of_control: Dict[str, List[str]] # "internal_controllables", "external_uncontrollables"
    indifferents_analysis: Dict[str, Any]
    surfaced_questions: List[str]

class PhilosophyFrameworkResult(BaseModel):
    framework_id: str
    framework_name: str
    field: str
    source: str
    core_idea: str
    dimension_analysis: Dict[str, Any] = Field(default_factory=dict)
    surfaced_questions: List[str] = Field(default_factory=list)

class PhilosophyLayerResult(BaseModel):
    frameworks: List[PhilosophyFrameworkResult] = Field(default_factory=list)
    stoic_legacy: Optional[StoicAnalysisResult] = None

class FalsifiabilityAuditItem(BaseModel):
    assumption: str
    falsifiability_grade: str # High, Medium, Low
    test_method: str

class BaseRateComparisonItem(BaseModel):
    reference_class: str
    domain: str
    source: str
    empirical_base_rate: float
    user_assumption: str
    divergence_flag: str

class CriticalThinkingLayerResult(BaseModel):
    falsifiability_audit: List[FalsifiabilityAuditItem] = Field(default_factory=list)
    base_rate_check: Optional[BaseRateComparisonItem] = None
    steelmanned_counterargument: Optional[str] = None

class LongitudinalPatternContext(BaseModel):
    total_decisions_logged: int = 0
    recurring_bias_counts: Dict[str, int] = Field(default_factory=dict)
    average_base_rate_divergence_pct: Optional[float] = None
    summary_text: Optional[str] = None

class AnalysisBundle(BaseModel):
    structured_decision: StructuredDecision
    bias_layer: BiasLayerResult
    math_layer: MathLayerResult
    philosophy_layer: StoicAnalysisResult # Preserved for backward compatibility
    philosophy_multi_layer: Optional[PhilosophyLayerResult] = None
    critical_thinking_layer: CriticalThinkingLayerResult
    longitudinal_context: Optional[LongitudinalPatternContext] = None

class SourceAttribution(BaseModel):
    field: str
    source: str
    referenced_item: str

class ReportResponse(BaseModel):
    report_markdown: str
    key_sensitive_variable: str
    proposed_experiment: str
    attributed_sources: List[SourceAttribution] = Field(default_factory=list)
    math_summary: Dict[str, Any] = Field(default_factory=dict)
    longitudinal_summary: Optional[str] = None

class BenchmarkItem(BaseModel):
    id: str
    title: str
    narrative: str
    structured_decision: StructuredDecision

# Feedback & Storage Schemas
class FlagFeedbackRequest(BaseModel):
    decision_id: str
    flag_id: str
    flag_type: str = "bias" # "bias" or "philosophy"
    is_positive: bool
    feedback_reason: Optional[str] = None

class OutcomeRetroRequest(BaseModel):
    chosen_alternative_id: str
    actual_utility_rating: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    retrospective_notes: Optional[str] = None

class HistoryItemSummary(BaseModel):
    id: str
    timestamp: str
    domain: str
    decision_statement: str
    preferred_eu_alt: Optional[str] = None
    minimax_regret_choice: Optional[str] = None
    flagged_bias_ids: List[str] = Field(default_factory=list)
    has_outcome: bool = False
    chosen_alternative_id: Optional[str] = None
    actual_utility_rating: Optional[float] = None
