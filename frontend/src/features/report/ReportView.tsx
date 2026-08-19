import React, { useState } from 'react';
import type { AnalysisBundle, ReportResponse } from '../../types';
import { submitFlagFeedback } from '../../lib/api';
import { BalanceScaleSensitivity } from './BalanceScaleSensitivity';
import { SensitivityChart } from './SensitivityChart';
import { RegretMatrixHeatmap } from './RegretMatrixHeatmap';
import { useToast } from '../../components/Toast';
import {
  Sparkles,
  FlaskConical,
  BookOpen,
  Brain,
  Scale,
  Compass,
  FileText,
  Sliders,
  Target,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Check,
  Layers,
  History,
  Share2
} from 'lucide-react';

interface ReportViewProps {
  bundle: AnalysisBundle;
  report: ReportResponse;
  onEditModel: () => void;
  onNewDecision?: () => void;
  onOpenExport?: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  bundle,
  report,
  onEditModel,
  onNewDecision,
  onOpenExport,
}) => {
  const { showToast } = useToast();
  const [showFullMarkdown, setShowFullMarkdown] = useState(false);
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);
  const [activePhilosophyTab, setActivePhilosophyTab] = useState<string>('stoicism_v1');
  const [feedbackStates, setFeedbackStates] = useState<Record<string, { voted: boolean; isPositive?: boolean }>>({});

  const {
    structured_decision,
    math_layer,
    bias_layer,
    philosophy_layer,
    philosophy_multi_layer,
    critical_thinking_layer,
    longitudinal_context
  } = bundle;

  const handleFeedback = async (flagId: string, flagType: 'bias' | 'philosophy', isPositive: boolean) => {
    try {
      await submitFlagFeedback({
        decision_id: structured_decision.decision_statement,
        flag_id: flagId,
        flag_type: flagType,
        is_positive: isPositive
      });
      setFeedbackStates(prev => ({
        ...prev,
        [flagId]: { voted: true, isPositive }
      }));
      showToast({
        type: 'success',
        title: 'Feedback Recorded',
        description: isPositive ? 'Flag confirmed helpful.' : 'Flag noted for calibration.',
      });
    } catch (err) {
      console.warn('Feedback submission error:', err);
      showToast({
        type: 'error',
        title: 'Submission Failed',
        description: 'Could not record calibration feedback.',
      });
    }
  };

  const frameworks = philosophy_multi_layer?.frameworks || [];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full max-w-[760px] mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Sticky Table of Contents Sub-Nav */}
      <div className="sticky top-14 z-20 py-2 px-3 rounded-2xl bg-[var(--bg-surface-glass)] backdrop-blur-md border border-[var(--border-subtle)] shadow-sm flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1 text-xs font-ui">
          <button
            type="button"
            onClick={() => scrollToSection('sec-voi')}
            className="px-2.5 py-1 rounded-lg text-[var(--color-ochre)] hover:bg-[var(--color-ochre-subtle)] font-medium transition-colors whitespace-nowrap cursor-pointer"
          >
            VoI Test
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('sec-math')}
            className="px-2.5 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors whitespace-nowrap cursor-pointer"
          >
            Math & Scale
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('sec-bias')}
            className="px-2.5 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors whitespace-nowrap cursor-pointer"
          >
            Cognitive Biases
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('sec-philosophy')}
            className="px-2.5 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors whitespace-nowrap cursor-pointer"
          >
            4 Lenses
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('sec-critical')}
            className="px-2.5 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors whitespace-nowrap cursor-pointer"
          >
            Critical Thinking
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('sec-lineage')}
            className="px-2.5 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors whitespace-nowrap cursor-pointer"
          >
            Citations
          </button>
        </div>

        {onOpenExport && (
          <button
            type="button"
            onClick={onOpenExport}
            className="px-2.5 py-1 rounded-lg text-xs font-ui font-medium text-[var(--color-ochre)] bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 hover:bg-[var(--color-ochre)]/20 transition-colors flex items-center space-x-1 whitespace-nowrap cursor-pointer shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
      </div>

      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] text-xs font-ui font-medium mb-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Auditable Reasoning Dossier</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-main)] tracking-tight">
            Decision Audit & Sensitivity Dossier
          </h2>
          <p className="font-body text-xs sm:text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
            "{structured_decision.decision_statement}"
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={onEditModel}
            className="px-3.5 py-2 rounded-xl text-xs font-ui font-medium bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] text-[var(--text-main)] flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
            <span>Tweak Parameters</span>
          </button>
        </div>
      </div>

      {/* Longitudinal Memory Banner (If Gated >= 5 decisions) */}
      {(longitudinal_context?.summary_text || report.longitudinal_summary) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--color-verdigris)]/30 space-y-2">
          <div className="flex items-center space-x-2 text-[var(--color-verdigris)] text-xs font-ui font-semibold">
            <History className="w-4 h-4" />
            <span>Longitudinal Decision Memory ({longitudinal_context?.total_decisions_logged || 5}+ Decisions Logged)</span>
          </div>
          <p className="font-body text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
            {longitudinal_context?.summary_text || report.longitudinal_summary}
          </p>
        </div>
      )}

      {/* Signature Ochre Hero: Value of Information (VoI) Callout */}
      <section id="sec-voi" className="phronesis-voi-card p-6 sm:p-7 space-y-4 relative overflow-hidden">
        <div className="flex items-center space-x-2 text-[var(--color-ochre)] text-xs font-ui font-semibold uppercase tracking-wider">
          <FlaskConical className="w-4 h-4 text-[var(--color-ochre)]" />
          <span>Value of Information (VoI) · Recommended Next Test</span>
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-[var(--text-main)]">
            Critical Sensitive Variable:{' '}
            <span className="font-data font-bold text-[var(--color-ochre)]">
              {math_layer.sensitivity_analysis.critical_parameter}
            </span>
          </h3>
          <p className="font-body text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            Rather than forcing an immediate irreversible verdict, sensitivity derivation reveals this choice is hyper-sensitive to a single uncertainty. Before committing capital or tenure, execute this low-cost test:
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--color-ochre)]/30 text-xs sm:text-sm text-[var(--text-main)] flex items-start space-x-3 shadow-2xs">
          <Target className="w-4 h-4 text-[var(--color-ochre)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-ui font-semibold text-[var(--color-ochre)]">
              48-Hour Falsification Experiment:{' '}
            </span>
            <span className="font-body text-[var(--text-main)] leading-relaxed">
              {critical_thinking_layer.falsifiability_audit[0]?.test_method || report.proposed_experiment}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LAYER CARD: Decision Theory & Mathematical Analysis                       */}
      {/* ========================================================================= */}
      <section id="sec-math" className="phronesis-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                Decision Theory & Sensitivity Analysis
              </h3>
              <p className="font-body text-xs text-[var(--text-muted)]">
                Closed-form mathematical expected utility and minimax regret
              </p>
            </div>
          </div>
          <span className="font-data text-xs text-[var(--color-verdigris)] font-medium">
            Pure Solvers
          </span>
        </div>

        {/* Expected Utility vs Minimax Summary in 2-col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Expected Utility */}
          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between font-ui">
              <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)] text-[11px]">
                Expected Utility (EU)
              </span>
              <span className="font-data text-[10px] text-[var(--text-faint)]">Vector Math</span>
            </div>

            <div className="space-y-1.5">
              {structured_decision.alternatives.map((alt) => {
                const val = math_layer.expected_utility.utilities[alt.id] ?? 0;
                const isTop = alt.id === math_layer.expected_utility.preferred_alternative_id;
                return (
                  <div
                    key={alt.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
                  >
                    <span className="font-ui text-[var(--text-main)] font-medium truncate max-w-[140px]">
                      {alt.name}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-data font-bold text-[var(--text-main)]">
                        {val} <span className="font-normal text-[var(--text-muted)]">EU</span>
                      </span>
                      {isTop && (
                        <span className="font-ui text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium">
                          Favored
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Minimax Regret */}
          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between font-ui">
              <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)] text-[11px]">
                Minimax Regret
              </span>
              <span className="font-data text-[10px] text-[var(--text-faint)]">Downside Floor</span>
            </div>

            <div className="space-y-1.5">
              {structured_decision.alternatives.map((alt) => {
                const maxR = math_layer.minimax_regret.maximum_regrets[alt.id] ?? 0;
                const isMinimax = alt.id === math_layer.minimax_regret.minimax_regret_choice;
                return (
                  <div
                    key={alt.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
                  >
                    <span className="font-ui text-[var(--text-main)] font-medium truncate max-w-[140px]">
                      {alt.name}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-data font-bold text-[var(--text-main)]">
                        {maxR} <span className="font-normal text-[var(--text-muted)]">Max R</span>
                      </span>
                      {isMinimax && (
                        <span className="font-ui text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium">
                          Optimal
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIGNATURE ELEMENT: The Interactive Balance Scale */}
        <div className="pt-2">
          <BalanceScaleSensitivity
            decision={structured_decision}
            sensitivity={math_layer.sensitivity_analysis}
          />
        </div>

        {/* Collapsible Advanced Mathematical Charts */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
            className="w-full flex items-center justify-between text-xs font-ui text-[var(--text-muted)] hover:text-[var(--text-main)] py-1 transition-colors cursor-pointer"
          >
            <span className="font-medium">
              {showAdvancedCharts ? 'Hide' : 'Show'} Detailed Sensitivity Curve & Regret Matrix
            </span>
            {showAdvancedCharts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvancedCharts && (
            <div className="space-y-6 pt-4">
              <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                <SensitivityChart
                  decision={structured_decision}
                  sensitivity={math_layer.sensitivity_analysis}
                />
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                <RegretMatrixHeatmap
                  decision={structured_decision}
                  minimax={math_layer.minimax_regret}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LAYER CARD: Psychological Lens (Cognitive Bias Pattern Recognition)       */}
      {/* ========================================================================= */}
      <section id="sec-bias" className="phronesis-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                Psychological Lens: Cognitive Bias Pattern Recognition
              </h3>
              <p className="font-body text-xs text-[var(--text-muted)]">
                Evaluated against peer-reviewed behavioral economics literature
              </p>
            </div>
          </div>
          <span className="font-data text-xs text-[var(--text-muted)]">
            {bias_layer.flagged_patterns.length} Flagged
          </span>
        </div>

        {bias_layer.flagged_patterns.length === 0 ? (
          <div className="p-4 rounded-xl bg-[var(--bg-app)] text-xs text-[var(--text-muted)] font-body text-center">
            No acute cognitive bias triggers detected in current assumptions.
          </div>
        ) : (
          <div className="space-y-4">
            {bias_layer.flagged_patterns.map((pat) => {
              const fb = feedbackStates[pat.id];
              const isExplicit = pat.grounding_tier === 'explicit_variable';
              return (
                <div
                  key={pat.id}
                  className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-display font-semibold text-sm text-[var(--text-main)]">
                          {pat.name}
                        </h4>
                        <span
                          className={`font-ui text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isExplicit
                              ? 'bg-[var(--color-ochre)]/15 text-[var(--color-ochre)] border border-[var(--color-ochre)]/30'
                              : 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]'
                          }`}
                        >
                          {isExplicit ? 'Explicit Variable' : 'Narrative Nuance'}
                        </span>
                      </div>
                      <div className="font-body text-[11px] text-[var(--text-muted)] italic mt-0.5">
                        Attributed: {pat.source}
                      </div>
                    </div>

                    {/* Discreet Thumbs Up / Down Feedback */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {fb?.voted ? (
                        <span className="font-ui text-[10px] text-[var(--color-verdigris)] flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Feedback saved</span>
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleFeedback(pat.id, 'bias', true)}
                            title="Helpful / Accurate Flag"
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-verdigris)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(pat.id, 'bias', false)}
                            title="False Positive / Misidentified"
                            className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="font-body text-xs text-[var(--text-main)] leading-relaxed">
                    {pat.caveat_analysis}
                  </p>

                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                    <span className="font-ui font-semibold text-[var(--color-verdigris)]">
                      Reframing Inquiry:{' '}
                    </span>
                    <span className="font-body text-[var(--text-main)] italic">
                      "{pat.question_to_surface}"
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* LAYER CARD: Multi-Framework Philosophical Reflection (4 Parallel Lenses)   */}
      {/* ========================================================================= */}
      <section id="sec-philosophy" className="phronesis-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                Multi-Framework Philosophical Reflection
              </h3>
              <p className="font-body text-xs text-[var(--text-muted)]">
                Four parallel evaluative lenses (No framework declared superior)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
            <span className="font-data text-xs text-[var(--color-verdigris)] font-medium">
              4 Lenses
            </span>
          </div>
        </div>

        {/* Framework Selector Tabs */}
        {frameworks.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
              {frameworks.map((fw) => (
                <button
                  key={fw.framework_id}
                  type="button"
                  onClick={() => setActivePhilosophyTab(fw.framework_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-ui font-medium transition-all cursor-pointer ${
                    activePhilosophyTab === fw.framework_id
                      ? 'bg-[var(--bg-surface)] text-[var(--color-verdigris)] shadow-sm border border-[var(--border-subtle)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {fw.framework_name.split('(')[0].trim()}
                </button>
              ))}
            </div>

            {/* Selected Framework Body */}
            {frameworks
              .filter((fw) => fw.framework_id === activePhilosophyTab)
              .map((fw) => (
                <div key={fw.framework_id} className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-semibold text-sm text-[var(--text-main)]">
                        {fw.framework_name}
                      </h4>
                      <p className="font-body text-[11px] text-[var(--text-muted)] italic">
                        Source: {fw.source}
                      </p>
                    </div>
                    <span className="font-ui text-[10px] text-[var(--color-verdigris)] px-2 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)]">
                      {fw.field}
                    </span>
                  </div>

                  <p className="font-body text-xs text-[var(--text-main)] leading-relaxed">
                    {fw.core_idea}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                    <span className="font-ui font-semibold text-xs text-[var(--color-verdigris)]">
                      Socratic Reflective Inquiries:
                    </span>
                    <ul className="space-y-1.5 font-body text-xs text-[var(--text-main)]">
                      {fw.surfaced_questions.map((q, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                          <span className="text-[var(--color-verdigris)] font-bold shrink-0">?</span>
                          <span className="italic">"{q}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          /* Legacy Stoic Fallback */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
              <h4 className="font-ui font-semibold text-[var(--color-verdigris)] flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Internal Controllables</span>
              </h4>
              <ul className="space-y-1.5 font-body text-[var(--text-main)]">
                {philosophy_layer.dichotomy_of_control.internal_controllables.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-[var(--color-verdigris)] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
              <h4 className="font-ui font-semibold text-[var(--text-muted)] flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>External Indifferents</span>
              </h4>
              <ul className="space-y-1.5 font-body text-[var(--text-main)]">
                {philosophy_layer.dichotomy_of_control.external_uncontrollables.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-[var(--color-slate)] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* LAYER CARD: Critical Thinking & Empirical Grounding                       */}
      {/* ========================================================================= */}
      <section id="sec-critical" className="phronesis-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                Critical Thinking & Empirical Grounding
              </h3>
              <p className="font-body text-xs text-[var(--text-muted)]">
                Steelmanning, falsifiability testing, and base-rate checks
              </p>
            </div>
          </div>
        </div>

        {/* Steelmanned Counterargument */}
        {critical_thinking_layer.steelmanned_counterargument && (
          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
            <h4 className="font-ui font-semibold text-xs text-[var(--text-main)] uppercase tracking-wider">
              Steelmanned Counterargument Against Dominant Choice
            </h4>
            <p className="font-body text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
              {critical_thinking_layer.steelmanned_counterargument}
            </p>
          </div>
        )}

        {/* Base Rate Comparison */}
        {critical_thinking_layer.base_rate_check && (
          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[var(--text-main)] font-ui font-semibold">
              <span>Empirical Base-Rate Comparison</span>
              <span className="font-data text-[var(--color-verdigris)]">
                Reference Base Rate: {critical_thinking_layer.base_rate_check.empirical_base_rate}%
              </span>
            </div>
            <p className="font-body text-[var(--text-muted)] leading-relaxed">
              {critical_thinking_layer.base_rate_check.divergence_flag}
            </p>
            <div className="font-body text-[11px] text-[var(--text-faint)] italic">
              Source: {critical_thinking_layer.base_rate_check.source}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* LAYER CARD: Intellectual Lineage & Sourced Attributions                   */}
      {/* ========================================================================= */}
      <section id="sec-lineage" className="phronesis-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                Intellectual Lineage & Attributed Citations
              </h3>
              <p className="font-body text-xs text-[var(--text-muted)]">
                Every analytical observation is grounded in published literature
              </p>
            </div>
          </div>
          <span className="font-data text-xs text-[var(--text-muted)]">
            {report.attributed_sources.length} Sources
          </span>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {report.attributed_sources.map((src, i) => (
            <div key={i} className="py-3 space-y-1 text-xs first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="font-ui font-semibold text-[var(--text-main)]">
                  {src.referenced_item}
                </span>
                <span className="font-ui text-[10px] text-[var(--color-verdigris)] px-2 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)]">
                  {src.field}
                </span>
              </div>
              <p className="font-body text-[11px] text-[var(--text-muted)] italic">
                {src.source}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Collapsible Synthesized Markdown Report View */}
      <section className="phronesis-card p-5 space-y-3">
        <button
          type="button"
          onClick={() => setShowFullMarkdown(!showFullMarkdown)}
          className="w-full flex items-center justify-between text-xs font-ui text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[var(--color-verdigris)]" />
            <span className="font-semibold uppercase tracking-wider">
              {showFullMarkdown ? 'Hide' : 'View'} Complete Synthesized Markdown Audit
            </span>
          </div>
          {showFullMarkdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFullMarkdown && (
          <div className="pt-3 border-t border-[var(--border-subtle)] font-body text-xs sm:text-sm text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
            {report.report_markdown}
          </div>
        )}
      </section>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={onEditModel}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-ui text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-[var(--border-medium)] flex items-center justify-center space-x-2 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
          <span>Calibrate Inputs & Re-run</span>
        </button>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-ui text-xs font-medium text-[var(--color-ochre)] bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 hover:bg-[var(--color-ochre)]/20 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
          )}

          {onNewDecision && (
            <button
              type="button"
              onClick={onNewDecision}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl btn-verdigris font-ui font-medium text-xs flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Analyze Another Decision</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
