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
}

export interface LongitudinalPatternContext {
  total_decisions_logged: number;
  recurring_bias_counts: Record<string, number>;
  average_base_rate_divergence_pct?: number;
  summary_text?: string;
}

export type FocusLayerId = 'psychology' | 'logic' | 'philosophy' | 'practical';

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
  longitudinal_context?: LongitudinalPatternContext;
  focus_config?: FocusConfig;
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
