export interface Alternative {
  id: string;
  name: string;
  description: string;
}

export interface StateOfWorld {
  id: string;
  name: string;
  prior_probability: number;
}

export interface PayoffCell {
  alternative_id: string;
  state_id: string;
  utility: number;
  narrative?: string;
}

export interface Assumption {
  id: string;
  text: string;
  type: string;
  testable: boolean;
}

export interface StructuredDecision {
  decision_statement: string;
  alternatives: Alternative[];
  states_of_world: StateOfWorld[];
  payoff_matrix: PayoffCell[];
  goals: string[];
  constraints: string[];
  assumptions: Assumption[];
  unknowns: string[];
  domain?: string;
}

export interface FlaggedBiasPattern {
  id: string;
  name: string;
  field: string;
  source: string;
  core_idea: string;
  observed_trigger: string;
  caveat_analysis: string;
  question_to_surface: string;
  grounding_tier?: 'explicit_variable' | 'narrative_nuance';
}

export interface BiasLayerResult {
  flagged_patterns: FlaggedBiasPattern[];
}

export interface ExpectedUtilityResult {
  utilities: Record<string, number>;
  preferred_alternative_id: string;
}

export interface MinimaxRegretResult {
  regret_matrix: Record<string, Record<string, number>>;
  maximum_regrets: Record<string, number>;
  minimax_regret_choice: string;
  regret_tradeoff_insight: string;
}

export interface SensitivityPayoffItem {
  alternative_id: string;
  state_id: string;
  current_value: number;
  inflection_threshold: number;
  insight: string;
}

export interface SensitivityAnalysisResult {
  critical_parameter: string;
  current_value: number;
  inflection_threshold: number;
  directional_shift: string;
  algebraic_formula: string;
  utility_sensitivity: SensitivityPayoffItem[];
}

export interface MathLayerResult {
  expected_utility: ExpectedUtilityResult;
  minimax_regret: MinimaxRegretResult;
  sensitivity_analysis: SensitivityAnalysisResult;
}

export interface StoicAnalysisResult {
  framework_id: string;
  framework_name: string;
  field: string;
  source: string;
  dichotomy_of_control: {
    internal_controllables: string[];
    external_uncontrollables: string[];
  };
  indifferents_analysis: {
    preferred_indifferents: string[];
    virtue_and_agency_tension?: string;
  };
  surfaced_questions: string[];
}

export interface PhilosophyFrameworkResult {
  framework_id: string;
  framework_name: string;
  field: string;
  source: string;
  core_idea: string;
  dimension_analysis: Record<string, any>;
  surfaced_questions: string[];
}

export interface PhilosophyLayerResult {
  frameworks: PhilosophyFrameworkResult[];
  stoic_legacy?: StoicAnalysisResult;
}

export interface FalsifiabilityAuditItem {
  assumption: string;
  falsifiability_grade: string;
  test_method: string;
}

export interface BaseRateComparisonItem {
  reference_class: string;
  domain: string;
  source: string;
  empirical_base_rate: number;
  user_assumption: string;
  divergence_flag: string;
}

export interface CriticalThinkingLayerResult {
  falsifiability_audit: FalsifiabilityAuditItem[];
  base_rate_check?: BaseRateComparisonItem;
  steelmanned_counterargument?: string;
  antifragility_score?: number;
  bayesian_update_narrative?: string;
}

// Economics & Valuation Layer Types
export interface EVPIResult {
  evpi_utility: number;
  evpi_fractional: number;
  voi_ceiling_narrative: string;
  algebraic_derivation: string;
  prior_eu_max: number;
  posterior_eu_max: number;
}

export interface EVSIResult {
  evsi_utility: number;
  information_efficiency: number;
  recommended_threshold_narrative: string;
  reliability_matrix_used: number[][];
}

export interface ProspectTheoryResult {
  cpt_values_per_alt: Record<string, number>;
  eu_preferred_alt: string;
  cpt_preferred_alt: string;
  framing_divergence: boolean;
  loss_aversion_penalty: number;
  framing_vulnerability_narrative: string;
  reference_point_sensitivity_narrative: string;
  alpha_used: number;
  beta_used: number;
  lambda_used: number;
}

export interface RiskAverseProfile {
  alt_ids: string[];
  certainty_equivalents: Record<string, number>;
  risk_premiums: Record<string, number>;
  gamma_used: number;
  risk_class: string;
  narrative: string;
}

export interface DiscountingResult {
  time_horizon_years: number;
  exponential_discount_factor: number;
  exponential_present_value: number;
  hyperbolic_discount_factor: number;
  hyperbolic_present_value: number;
  present_bias_penalty: number;
  present_bias_penalty_pct: number;
  delta_used: number;
  beta_used: number;
  exponential_trajectory: [number, number][];
  hyperbolic_trajectory: [number, number][];
  impatience_narrative: string;
  npv_multi_rate_narrative: string;
}

export interface IntertemporalComparisonResult {
  long_run_preferred_alt: string;
  short_run_preferred_alt: string;
  preference_reversal: boolean;
  reversal_narrative: string;
  patience_leverage_narrative: string;
}

export interface RealOptionsResult {
  reversibility_type: string;
  reversibility_score: number;
  reversibility_narrative: string;
  option_value_of_waiting: number;
  hurdle_premium_pct: number;
  staging_indicated: boolean;
  staging_narrative: string;
  convexity_class: string;
  convexity_score: number;
  convexity_narrative: string;
  barbell_applicable: boolean;
  barbell_narrative: string;
}

export interface EconomicsLayerResult {
  evpi: EVPIResult;
  evsi: EVSIResult;
  prospect_theory: ProspectTheoryResult;
  crra_profile: RiskAverseProfile;
  discounting: DiscountingResult;
  intertemporal_comparison?: IntertemporalComparisonResult;
  real_options: RealOptionsResult;
  opportunity_cost_narrative: string;
}

// Systems Thinking & Game Theory Layer Types
export interface FeedbackLoopResult {
  reinforcing_loops_detected: string[];
  balancing_loops_detected: string[];
  dominant_loop_type: string;
  delay_risk_narrative: string;
  leverage_point_narrative: string;
}

export interface GameTheoryResult {
  game_type: string;
  signaling_credibility: string;
  strategic_narrative: string;
  nash_equilibrium_note: string;
  cooperation_vs_defection: string;
}

export interface RawlsianAuditResult {
  least_advantaged_stakeholder: string;
  veil_verdict: string;
  fairness_narrative: string;
  maximin_alternative?: string;
}

export interface SystemsLayerResult {
  feedback_loops: FeedbackLoopResult;
  game_theory: GameTheoryResult;
  rawlsian_audit: RawlsianAuditResult;
  systems_synthesis_narrative: string;
}

export interface LongitudinalPatternContext {
  total_decisions_logged: number;
  recurring_bias_counts: Record<string, number>;
  average_base_rate_divergence_pct?: number;
  summary_text?: string;
}

export interface LLMConfigOverride {
  provider?: string;
  model?: string;
  api_key?: string;
}

export interface LLMModelOption {
  provider: string;
  model: string;
  label: string;
  description?: string;
  has_key: boolean;
  is_default: boolean;
}

export interface ModelsCatalogResponse {
  models: LLMModelOption[];
  default_model: {
    provider: string;
    model: string;
  };
}

export type EffortLevel = 'quick' | 'standard' | 'thorough';

export interface Project {
  id: string;
  name: string;
  background_note: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  background_note: string;
  decision_count: number;
  last_decision_at?: string;
  recurring_bias_ids?: string[];
}

export interface CreateProjectRequest {
  name: string;
  background_note?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  background_note?: string;
  archived?: boolean;
}

export type FocusLayerId = 'psychology' | 'logic' | 'philosophy' | 'economics' | 'systems' | 'practical';
export type FocusMode = 'all' | FocusLayerId;

export interface FocusConfig {
  focused_layers: FocusLayerId[];
  philosophy_frameworks?: string[];
}

export interface AnalysisBundle {
  structured_decision: StructuredDecision;
  bias_layer: BiasLayerResult;
  math_layer: MathLayerResult;
  philosophy_layer: StoicAnalysisResult;
  philosophy_multi_layer?: PhilosophyLayerResult;
  critical_thinking_layer: CriticalThinkingLayerResult;
  economics_layer?: EconomicsLayerResult;
  systems_layer?: SystemsLayerResult;
  longitudinal_context?: LongitudinalPatternContext;
  focus_config?: FocusConfig;
  effort_level?: EffortLevel;
  project_id?: string;
  project_context?: string;
}

export interface SourceAttribution {
  field: string;
  source: string;
  referenced_item: string;
}

export interface ReportResponse {
  report_markdown: string;
  key_sensitive_variable: string;
  proposed_experiment: string;
  attributed_sources: SourceAttribution[];
  math_summary: {
    expected_utility: Record<string, number>;
    preferred_eu_alt: string;
    minimax_regret_choice: string;
    inflection_threshold: number;
  };
  longitudinal_summary?: string;
  focus_config?: FocusConfig;
  effort_level?: EffortLevel;
  project_id?: string;
}

export interface DrillDownRequest {
  decision_statement: string;
  item_type: 'bias' | 'philosophy' | 'assumption' | 'base_rate' | string;
  item_id: string;
  item_title: string;
  item_context?: Record<string, any>;
}

export interface DrillDownResponse {
  item_id: string;
  item_title: string;
  deep_dive_markdown: string;
  academic_context?: string;
  probing_questions: string[];
  concrete_action_or_test?: string;
}

export interface BenchmarkItem {
  id: string;
  title: string;
  narrative: string;
  structured_decision: StructuredDecision;
}

export interface HistoryItemSummary {
  id: string;
  timestamp: string;
  domain: string;
  decision_statement: string;
  preferred_eu_alt?: string;
  minimax_regret_choice?: string;
  flagged_bias_ids: string[];
  has_outcome: boolean;
  chosen_alternative_id?: string;
  actual_utility_rating?: number;
}

export interface FlagFeedbackRequest {
  decision_id: string;
  flag_id: string;
  flag_type: 'bias' | 'philosophy';
  is_positive: boolean;
  feedback_reason?: string;
}

export interface OutcomeRetroRequest {
  chosen_alternative_id: string;
  actual_utility_rating?: number;
  retrospective_notes?: string;
}

// Deliberation Chatbox Types
export type DeliberationLensId =
  | 'socratic'
  | 'steelman'
  | 'stoic'
  | 'kantian'
  | 'utilitarian'
  | 'virtue'
  | 'voi'
  | 'bias';

export type ChatLayoutMode = 'drawer' | 'docked' | 'fullscreen';

export interface SuggestedAction {
  action_type: 'insert_alternative' | 'insert_assumption' | 'append_narrative' | 'test_protocol' | string;
  label: string;
  text_to_insert: string;
  alternative_data?: {
    name: string;
    description: string;
  };
  assumption_data?: {
    text: string;
    type?: string;
    testable?: boolean;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  lens?: DeliberationLensId;
  suggested_action?: SuggestedAction;
  suggested_followups?: string[];
  attribution?: SourceAttribution;
}

export interface DeliberationRequest {
  messages: Array<{
    id: string;
    sender: string;
    text: string;
    timestamp?: number;
    lens?: string;
  }>;
  current_step?: string;
  lens?: DeliberationLensId;
  structured_decision?: StructuredDecision | null;
  math_summary?: Record<string, any>;
  flagged_biases?: string[];
}

export interface DeliberationResponse {
  reply_text: string;
  suggested_action?: SuggestedAction | null;
  suggested_followups: string[];
  attribution?: SourceAttribution | null;
  lens_used: string;
}

// ──────────────────────────────────────────────
// Settings & Telemetry Interfaces
// ──────────────────────────────────────────────
export interface StorageStats {
  decision_count: number;
  project_count: number;
  outcome_count: number;
  feedback_count: number;
  db_size_bytes: number;
  db_path: string;
  memory_enabled: boolean;
}

export interface ImportHistoryResponse {
  status: string;
  imported_projects: number;
  imported_decisions: number;
  imported_outcomes: number;
  imported_feedback: number;
  message?: string;
}

export interface CustomApiKeys {
  gemini?: string;
  openai?: string;
  anthropic?: string;
}

export type FontSizeOption = 'compact' | 'standard' | 'relaxed';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  fontSize: FontSizeOption;
  reduceMotion: boolean;
  defaultEffort: EffortLevel;
  defaultFocus: FocusMode;
  defaultRiskTolerance: 'risk_neutral' | 'risk_averse' | 'risk_seeking';
  biasSensitivity: 'standard' | 'high';
  showGlossaryTooltips: boolean;
  autoFallbackOffline: boolean;
}

export interface TestKeyResponse {
  valid: boolean;
  provider: string;
  message: string;
}


