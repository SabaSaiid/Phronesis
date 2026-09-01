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
    antifragility_score: Optional[float] = None
    bayesian_update_narrative: Optional[str] = None

# Economics & Valuation Layer Schemas
class EVPIResultSchema(BaseModel):
    evpi_utility: float
    evpi_fractional: float
    voi_ceiling_narrative: str
    algebraic_derivation: str
    prior_eu_max: float
    posterior_eu_max: float

class EVSIResultSchema(BaseModel):
    evsi_utility: float
    information_efficiency: float
    recommended_threshold_narrative: str
    reliability_matrix_used: List[List[float]] = Field(default_factory=list)

class ProspectTheoryResultSchema(BaseModel):
    cpt_values_per_alt: Dict[str, float] = Field(default_factory=dict)
    eu_preferred_alt: str
    cpt_preferred_alt: str
    framing_divergence: bool
    loss_aversion_penalty: float
    framing_vulnerability_narrative: str
    reference_point_sensitivity_narrative: str
    alpha_used: float
    beta_used: float
    lambda_used: float

class RiskAverseProfileSchema(BaseModel):
    alt_ids: List[str] = Field(default_factory=list)
    certainty_equivalents: Dict[str, float] = Field(default_factory=dict)
    risk_premiums: Dict[str, float] = Field(default_factory=dict)
    gamma_used: float
    risk_class: str
    narrative: str

class DiscountingResultSchema(BaseModel):
    time_horizon_years: float
    exponential_discount_factor: float
    exponential_present_value: float
    hyperbolic_discount_factor: float
    hyperbolic_present_value: float
    present_bias_penalty: float
    present_bias_penalty_pct: float
    delta_used: float
    beta_used: float
    exponential_trajectory: List[Any] = Field(default_factory=list)
    hyperbolic_trajectory: List[Any] = Field(default_factory=list)
    impatience_narrative: str
    npv_multi_rate_narrative: str

class IntertemporalComparisonResultSchema(BaseModel):
    long_run_preferred_alt: str
    short_run_preferred_alt: str
    preference_reversal: bool
    reversal_narrative: str
    patience_leverage_narrative: str

class RealOptionsResultSchema(BaseModel):
    reversibility_type: str
    reversibility_score: float
    reversibility_narrative: str
    option_value_of_waiting: float
    hurdle_premium_pct: float
    staging_indicated: bool
    staging_narrative: str
    convexity_class: str
    convexity_score: float
    convexity_narrative: str
    barbell_applicable: bool
    barbell_narrative: str

class EconomicsLayerResult(BaseModel):
    evpi: EVPIResultSchema
    evsi: EVSIResultSchema
    prospect_theory: ProspectTheoryResultSchema
    crra_profile: RiskAverseProfileSchema
    discounting: DiscountingResultSchema
    intertemporal_comparison: Optional[IntertemporalComparisonResultSchema] = None
    real_options: RealOptionsResultSchema
    opportunity_cost_narrative: str

# Systems Thinking & Game Theory Layer Schemas
class FeedbackLoopResultSchema(BaseModel):
    reinforcing_loops_detected: List[str] = Field(default_factory=list)
    balancing_loops_detected: List[str] = Field(default_factory=list)
    dominant_loop_type: str
    delay_risk_narrative: str
    leverage_point_narrative: str

class GameTheoryResultSchema(BaseModel):
    game_type: str
    signaling_credibility: str
    strategic_narrative: str
    nash_equilibrium_note: str
    cooperation_vs_defection: str

class RawlsianAuditResultSchema(BaseModel):
    least_advantaged_stakeholder: str
    veil_verdict: str
    fairness_narrative: str
    maximin_alternative: Optional[str] = None

class SystemsLayerResult(BaseModel):
    feedback_loops: FeedbackLoopResultSchema
    game_theory: GameTheoryResultSchema
    rawlsian_audit: RawlsianAuditResultSchema
    systems_synthesis_narrative: str

class LongitudinalPatternContext(BaseModel):
    total_decisions_logged: int = 0
    recurring_bias_counts: Dict[str, int] = Field(default_factory=dict)
    average_base_rate_divergence_pct: Optional[float] = None
    summary_text: Optional[str] = None

class LLMConfigOverride(BaseModel):
    provider: Optional[str] = Field(default=None, description="gemini, openai, anthropic, or mock")
    model: Optional[str] = Field(default=None, description="Specific model ID e.g. gemini-2.5-flash, gpt-4o")
    api_key: Optional[str] = Field(default=None, description="Optional per-session API key")

class LLMModelOption(BaseModel):
    provider: str
    model: str
    label: str
    description: Optional[str] = ""
    has_key: bool = True
    is_default: bool = False

class ModelsCatalogResponse(BaseModel):
    models: List[LLMModelOption]
    default_model: Dict[str, str]

# Project Schemas
class Project(BaseModel):
    id: str
    name: str
    background_note: str = ""
    created_at: str
    updated_at: str
    archived: bool = False

class ProjectSummary(BaseModel):
    id: str
    name: str
    background_note: str = ""
    decision_count: int = 0
    last_decision_at: Optional[str] = None
    recurring_bias_ids: List[str] = Field(default_factory=list)

class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    background_note: Optional[str] = Field(default="", max_length=10000)

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    background_note: Optional[str] = Field(default=None, max_length=10000)
    archived: Optional[bool] = None

class FocusConfig(BaseModel):
    focused_layers: List[str] = Field(
        default_factory=lambda: ["psychology", "logic", "philosophy", "economics", "systems", "practical"],
        description="List of focused layers: psychology, logic, philosophy, economics, systems, practical"
    )
    philosophy_frameworks: List[str] = Field(
        default_factory=list,
        description="Specific philosophy frameworks to foreground when philosophy is active"
    )

class AnalysisBundle(BaseModel):
    structured_decision: StructuredDecision
    bias_layer: BiasLayerResult
    math_layer: MathLayerResult
    philosophy_layer: StoicAnalysisResult # Preserved for backward compatibility
    philosophy_multi_layer: Optional[PhilosophyLayerResult] = None
    critical_thinking_layer: CriticalThinkingLayerResult
    economics_layer: Optional[EconomicsLayerResult] = None
    systems_layer: Optional[SystemsLayerResult] = None
    longitudinal_context: Optional[LongitudinalPatternContext] = None
    focus_config: Optional[FocusConfig] = None
    effort_level: Optional[str] = Field(default="standard", description="quick, standard, or thorough")
    project_id: Optional[str] = None
    project_context: Optional[str] = None

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
    focus_config: Optional[FocusConfig] = None
    effort_level: Optional[str] = "standard"
    project_id: Optional[str] = None

class DrillDownRequest(BaseModel):
    decision_statement: str
    item_type: str = Field(description="bias, philosophy, assumption, base_rate")
    item_id: str
    item_title: str
    item_context: Dict[str, Any] = Field(default_factory=dict)

class DrillDownResponse(BaseModel):
    item_id: str
    item_title: str
    deep_dive_markdown: str
    academic_context: Optional[str] = None
    probing_questions: List[str] = Field(default_factory=list)
    concrete_action_or_test: Optional[str] = None

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
    retrospective_notes: Optional[str] = Field(default=None, max_length=10000)

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

# Socratic Deliberation Chat Schemas
class SuggestedActionSchema(BaseModel):
    action_type: str = Field(default="append_narrative", description="insert_alternative, insert_assumption, append_narrative, test_protocol")
    label: str
    text_to_insert: str
    alternative_data: Optional[Dict[str, Any]] = None
    assumption_data: Optional[Dict[str, Any]] = None

class ChatMessageSchema(BaseModel):
    id: str
    sender: str  # "user" | "assistant"
    text: str = Field(min_length=1, max_length=10000)
    timestamp: Optional[int] = None
    lens: Optional[str] = "socratic"
    suggested_action: Optional[SuggestedActionSchema] = None
    suggested_followups: Optional[List[str]] = Field(default_factory=list)

class DeliberationRequest(BaseModel):
    messages: List[ChatMessageSchema]
    current_step: Optional[str] = "input"
    lens: Optional[str] = "socratic"
    structured_decision: Optional[StructuredDecision] = None
    math_summary: Optional[Dict[str, Any]] = None
    flagged_biases: Optional[List[str]] = Field(default_factory=list)

class DeliberationResponse(BaseModel):
    reply_text: str
    suggested_action: Optional[SuggestedActionSchema] = None
    suggested_followups: List[str] = Field(default_factory=list)
    attribution: Optional[SourceAttribution] = None
    lens_used: str = "socratic"

# Settings & Telemetry Schemas
class StorageStatsResponse(BaseModel):
    decision_count: int
    project_count: int
    outcome_count: int
    feedback_count: int
    db_size_bytes: int
    db_path: str
    memory_enabled: bool

class ImportHistoryRequest(BaseModel):
    version: Optional[str] = "2.0"
    projects: Optional[List[Dict[str, Any]]] = None
    decisions: Optional[List[Dict[str, Any]]] = None
    outcomes: Optional[List[Dict[str, Any]]] = None
    feedback: Optional[List[Dict[str, Any]]] = None

class ImportHistoryResponse(BaseModel):
    status: str
    imported_projects: int
    imported_decisions: int
    imported_outcomes: int
    imported_feedback: int
    message: Optional[str] = None

class TestKeyRequest(BaseModel):
    provider: str
    api_key: str

class TestKeyResponse(BaseModel):
    valid: bool
    provider: str
    message: str


