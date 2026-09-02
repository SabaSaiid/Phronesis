import React, { useState, useMemo } from 'react';
import type {
  AnalysisBundle,
  ReportResponse,
  FocusLayerId,
  DrillDownResponse
} from '../../types';
import { fetchDrillDown } from '../../lib/api';
import { BalanceScaleSensitivity } from './BalanceScaleSensitivity';
import { SensitivityChart } from './SensitivityChart';
import { RegretMatrixHeatmap } from './RegretMatrixHeatmap';
import { EconomicsExplorer } from './EconomicsExplorer';
import { PhilosophyMatrixView } from './PhilosophyMatrixView';
import { CognitivePsychologyView } from './CognitivePsychologyView';
import { SystemsThinkingView } from './SystemsThinkingView';
import { DossierNavRail } from './DossierNavRail';
import { WhatIfSandboxDrawer } from './WhatIfSandboxDrawer';
import { ExecutivePresentationModal } from './ExecutivePresentationModal';
import { GlossaryTerm } from '../../components/GlossaryTerm';
import { useToast } from '../../components/useToast';
import {
  Sparkles,
  FlaskConical,
  BookOpen,
  Brain,
  Scale,
  Compass,
  FileText,
  Target,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  History,
  Share2,
  DollarSign,
  Network,
  Maximize2,
  Sliders
} from 'lucide-react';

interface ReportViewProps {
  bundle: AnalysisBundle;
  report: ReportResponse;
  onNewDecision?: () => void;
  onOpenExport?: () => void;
  onApplySandboxModel?: (updated: any) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  bundle,
  report,
  onNewDecision,
  onOpenExport,
  onApplySandboxModel,
}) => {
  const { showToast } = useToast();
  const [showFullMarkdown, setShowFullMarkdown] = useState(false);
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  const {
    structured_decision,
    math_layer,
    bias_layer,
    philosophy_multi_layer,
    critical_thinking_layer,
    longitudinal_context
  } = bundle;

  // Focus configuration — memoize derived arrays so downstream useMemo deps are stable
  const focusConfig = bundle.focus_config || report.focus_config || {
    focused_layers: ['psychology', 'logic', 'philosophy', 'practical'] as FocusLayerId[],
    philosophy_frameworks: [],
  };

  const focusedLayers = useMemo(
    () => focusConfig.focused_layers || ['psychology', 'logic', 'philosophy', 'practical'],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(focusConfig.focused_layers)]
  );

  // Stabilize frameworks reference
  const frameworks = useMemo(
    () => philosophy_multi_layer?.frameworks || [],
    [philosophy_multi_layer?.frameworks]
  );

  // Card expansion states: focused layers start expanded; unfocused layers start collapsed
  const [expandedLayers, setExpandedLayers] = useState<Record<FocusLayerId, boolean>>(() => ({
    practical: focusedLayers.includes('practical'),
    economics: focusedLayers.includes('economics'),
    psychology: focusedLayers.includes('psychology'),
    philosophy: focusedLayers.includes('philosophy'),
    systems: focusedLayers.includes('systems'),
    logic: focusedLayers.includes('logic'),
  }));

  // Single-item drill-down states
  const [drillDownStates, setDrillDownStates] = useState<
    Record<string, { loading: boolean; data?: DrillDownResponse; isOpen: boolean }>
  >({});

  const toggleLayerExpanded = (layerId: FocusLayerId) => {
    setExpandedLayers((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const handleTriggerDrillDown = async (
    itemType: string,
    itemId: string,
    itemTitle: string,
    itemContext: any
  ) => {
    const existing = drillDownStates[itemId];
    if (existing?.data) {
      // Toggle visibility
      setDrillDownStates((prev) => ({
        ...prev,
        [itemId]: { ...existing, isOpen: !existing.isOpen },
      }));
      return;
    }

    setDrillDownStates((prev) => ({
      ...prev,
      [itemId]: { loading: true, isOpen: true },
    }));

    try {
      const res = await fetchDrillDown({
        decision_statement: structured_decision.decision_statement,
        item_type: itemType,
        item_id: itemId,
        item_title: itemTitle,
        item_context: itemContext,
      });
      setDrillDownStates((prev) => ({
        ...prev,
        [itemId]: { loading: false, data: res, isOpen: true },
      }));
      showToast({
        type: 'info',
        title: 'Deep Dive Loaded',
        description: `Unpacked epistemic context for "${itemTitle}".`,
      });
    } catch (err: any) {
      setDrillDownStates((prev) => ({
        ...prev,
        [itemId]: { loading: false, isOpen: false },
      }));
      showToast({
        type: 'error',
        title: 'Drill-Down Error',
        description: err.message || 'Could not load deep dive inquiry.',
      });
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // Offset for the sticky top-nav (~64px) so the section isn't hidden
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Pre-calculated references for summaries
  const bestEuAltId = math_layer.expected_utility.preferred_alternative_id;
  const bestEuAltName = structured_decision.alternatives.find((a) => a.id === bestEuAltId)?.name || bestEuAltId;
  const minimaxAltId = math_layer.minimax_regret.minimax_regret_choice;
  const minimaxAltName = structured_decision.alternatives.find((a) => a.id === minimaxAltId)?.name || minimaxAltId;
  const inflectionPct = Math.round(math_layer.sensitivity_analysis.inflection_threshold * 100);

  // Dynamic Layer Ordering: focused layers come first, unfocused follow
  const orderedLayerIds = useMemo<FocusLayerId[]>(() => {
    const allLayers: FocusLayerId[] = ['practical', 'economics', 'psychology', 'philosophy', 'systems', 'logic'];
    const focusedInOrder = focusedLayers.filter((id) => allLayers.includes(id));
    const unfocused = allLayers.filter((id) => !focusedLayers.includes(id));
    return [...focusedInOrder, ...unfocused];
  }, [focusedLayers]);

  // Render individual layer cards
  const renderLayerCard = (layerId: FocusLayerId) => {
    const isExpanded = expandedLayers[layerId];
    const isFocused = focusedLayers.includes(layerId);

    switch (layerId) {
      // -----------------------------------------------------------------------
      // 1. Practical (Decision Theory Math)
      // -----------------------------------------------------------------------
      case 'practical':
        return (
          <section
            key="practical"
            id="sec-math"
            className={`phronesis-card transition-all duration-300 ${
              isExpanded ? 'p-6 space-y-6' : 'p-4 sm:p-5'
            }`}
          >
            {/* Layer Header */}
            <div
              onClick={() => toggleLayerExpanded('practical')}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFocused
                      ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]'
                      : 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-display font-semibold text-base text-[var(--text-main)] group-hover:text-[var(--color-verdigris)] transition-colors">
                      Decision Theory & <GlossaryTerm term="Sensitivity Threshold">Sensitivity Analysis</GlossaryTerm>
                    </h3>
                    {isFocused && (
                      <span className="font-ui text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium">
                        Focus
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-[var(--text-muted)]">
                    Closed-form <GlossaryTerm term="Expected Utility">Expected Utility</GlossaryTerm> and <GlossaryTerm term="Minimax Regret">Minimax Regret</GlossaryTerm>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-data text-xs text-[var(--color-verdigris)] font-medium hidden sm:inline">
                  Pure Solvers
                </span>
                <button
                  type="button"
                  className="p-1 rounded-lg text-[var(--text-muted)] group-hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
                  aria-label={isExpanded ? 'Collapse layer' : 'Expand layer'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Collapsed One-Line Summary */}
            {!isExpanded ? (
              <div className="pt-2 flex items-center justify-between text-xs font-body text-[var(--text-muted)] border-t border-[var(--border-subtle)] mt-3">
                <p className="truncate pr-2">
                  <strong className="text-[var(--text-main)] font-ui">{bestEuAltName}</strong> leads with highest EU · <strong className="text-[var(--text-main)] font-ui">{minimaxAltName}</strong> optimizes regret · Flip threshold at <strong className="text-[var(--color-verdigris)] font-data">{inflectionPct}%</strong>
                </p>
                <button
                  type="button"
                  onClick={() => toggleLayerExpanded('practical')}
                  className="text-xs font-ui text-[var(--color-verdigris)] hover:underline shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Expand Solvers</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Expanded Full Content */
              <div className="space-y-6 pt-2">
                {/* Expected Utility vs Minimax Summary in 2-col */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* Expected Utility */}
                  <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2.5">
                    <div className="flex items-center justify-between font-ui">
                      <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)] text-[11px]">
                        <GlossaryTerm term="Expected Utility">Expected Utility (EU)</GlossaryTerm>
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
                        <GlossaryTerm term="Minimax Regret">Minimax Regret</GlossaryTerm>
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

                {/* Balance Scale */}
                <div className="pt-2">
                  <BalanceScaleSensitivity
                    decision={structured_decision}
                    sensitivity={math_layer.sensitivity_analysis}
                  />
                </div>

                {/* Collapsible Advanced Charts */}
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
                    <div className="space-y-6 pt-4 animate-fade-in">
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
              </div>
            )}
          </section>
        );

      // -----------------------------------------------------------------------
      // Economics & Valuation (EVPI, CPT, Discounting, Real Options)
      // -----------------------------------------------------------------------
      case 'economics':
        if (!bundle.economics_layer) return null;
        return (
          <section
            key="economics"
            id="sec-economics"
            className={`phronesis-card transition-all duration-300 ${
              isExpanded ? 'p-6 space-y-6' : 'p-4 sm:p-5'
            }`}
          >
            <div
              onClick={() => toggleLayerExpanded('economics')}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFocused
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-display font-semibold text-base text-[var(--text-main)] group-hover:text-emerald-400 transition-colors">
                      Quantitative Economics & <GlossaryTerm term="Value of Information">Valuation Solvers</GlossaryTerm>
                    </h3>
                    {isFocused && (
                      <span className="font-ui text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                        Focus
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-[var(--text-muted)]">
                    EVPI information ceiling, Cumulative Prospect Theory, and Hyperbolic Discounting
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-data text-xs text-emerald-400 font-medium hidden sm:inline">
                  EVPI: {bundle.economics_layer.evpi.evpi_utility.toFixed(2)} pts
                </span>
                <button
                  type="button"
                  className="p-1 rounded-lg text-[var(--text-muted)] group-hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
                  aria-label={isExpanded ? 'Collapse layer' : 'Expand layer'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isExpanded ? (
              <div className="pt-2 flex items-center justify-between text-xs font-body text-[var(--text-muted)] border-t border-[var(--border-subtle)] mt-3">
                <p className="truncate pr-2">
                  EVPI Bound: <strong className="text-emerald-400 font-data">{(bundle.economics_layer.evpi.evpi_fractional * 100).toFixed(1)}%</strong> · Reversibility: <strong className="text-[var(--text-main)] font-ui">{bundle.economics_layer.real_options.reversibility_type}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => toggleLayerExpanded('economics')}
                  className="text-xs font-ui text-[var(--color-verdigris)] hover:underline shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Expand Economics</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <EconomicsExplorer
                  economics={bundle.economics_layer}
                  decision={structured_decision}
                  onDrillDown={({ item_type, item_id, item_title, item_context }) =>
                    handleTriggerDrillDown(item_type, item_id, item_title, item_context)
                  }
                />
              </div>
            )}
          </section>
        );

      // -----------------------------------------------------------------------
      // 2. Psychology (Cognitive Bias Pattern Recognition)
      // -----------------------------------------------------------------------
      case 'psychology':
        return (
          <section
            key="psychology"
            id="sec-bias"
            className={`phronesis-card transition-all duration-300 ${
              isExpanded ? 'p-6 space-y-4' : 'p-4 sm:p-5'
            }`}
          >
            {/* Header */}
            <div
              onClick={() => toggleLayerExpanded('psychology')}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFocused
                      ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]'
                      : 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                  }`}
                >
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-display font-semibold text-base text-[var(--text-main)] group-hover:text-[var(--color-verdigris)] transition-colors">
                      Psychological Lens: Cognitive Bias Pattern Recognition
                    </h3>
                    {isFocused && (
                      <span className="font-ui text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium">
                        Focus
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-[var(--text-muted)]">
                    Evaluated against peer-reviewed behavioral economics literature
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-data text-xs text-[var(--text-muted)]">
                  {bias_layer.flagged_patterns.length} Flagged
                </span>
                <button
                  type="button"
                  className="p-1 rounded-lg text-[var(--text-muted)] group-hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
                  aria-label={isExpanded ? 'Collapse layer' : 'Expand layer'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Collapsed One-Line Summary */}
            {!isExpanded ? (
              <div className="pt-2 flex items-center justify-between text-xs font-body text-[var(--text-muted)] border-t border-[var(--border-subtle)] mt-3">
                <p className="truncate pr-2">
                  {bias_layer.flagged_patterns.length > 0 ? (
                    <span>
                      {bias_layer.flagged_patterns.length} bias pattern(s) flagged: <strong className="text-[var(--text-main)] font-ui">{bias_layer.flagged_patterns.map((p) => p.name).join(', ')}</strong>
                    </span>
                  ) : (
                    'No acute cognitive bias patterns detected above trigger threshold.'
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => toggleLayerExpanded('psychology')}
                  className="text-xs font-ui text-[var(--color-verdigris)] hover:underline shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Expand Biases</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Expanded Full Content */
              <div className="pt-2">
                <CognitivePsychologyView
                  biasLayer={bias_layer}
                  decisionId={report.decision_id}
                  onDrillDown={({ item_type, item_id, item_title, item_context }) =>
                    handleTriggerDrillDown(item_type, item_id, item_title, item_context)
                  }
                />
              </div>
            )}
          </section>
        );

      // -----------------------------------------------------------------------
      // 3. Philosophy (Multi-Framework Philosophical Reflection)
      // -----------------------------------------------------------------------
      case 'philosophy':
        return (
          <section
            key="philosophy"
            id="sec-philosophy"
            className={`phronesis-card transition-all duration-300 ${
              isExpanded ? 'p-6 space-y-4' : 'p-4 sm:p-5'
            }`}
          >
            {/* Header */}
            <div
              onClick={() => toggleLayerExpanded('philosophy')}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFocused
                      ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]'
                      : 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-display font-semibold text-base text-[var(--text-main)] group-hover:text-[var(--color-verdigris)] transition-colors">
                      Multi-Framework Philosophical Reflection
                    </h3>
                    {isFocused && (
                      <span className="font-ui text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium">
                        Focus
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-[var(--text-muted)]">
                    Four parallel evaluative lenses (No framework declared superior)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-data text-xs text-purple-400 font-medium hidden sm:inline">
                  8 Lenses
                </span>
                <button
                  type="button"
                  className="p-1 rounded-lg text-[var(--text-muted)] group-hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
                  aria-label={isExpanded ? 'Collapse layer' : 'Expand layer'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Collapsed One-Line Summary */}
            {!isExpanded ? (
              <div className="pt-2 flex items-center justify-between text-xs font-body text-[var(--text-muted)] border-t border-[var(--border-subtle)] mt-3">
                <p className="truncate pr-2">
                  Evaluated across 8 ethical lenses (Stoic, Utilitarian, Kantian, Virtue Ethics, Existentialist, Care Ethics, Pragmatist, Eastern Flow)
                </p>
                <button
                  type="button"
                  onClick={() => toggleLayerExpanded('philosophy')}
                  className="text-xs font-ui text-[var(--color-verdigris)] hover:underline shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Expand Philosophy</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Expanded Full Content */
              <div className="pt-2">
                <PhilosophyMatrixView
                  philosophy={philosophy_multi_layer || { frameworks }}
                  onDrillDown={({ item_type, item_id, item_title, item_context }) =>
                    handleTriggerDrillDown(item_type, item_id, item_title, item_context)
                  }
                />
              </div>
            )}
          </section>
        );

      // -----------------------------------------------------------------------
      // Systems Thinking & Strategic Game Theory (Meadows, Spence, Rawls)
      // -----------------------------------------------------------------------
      case 'systems':
        if (!bundle.systems_layer) return null;
        return (
          <section
            key="systems"
            id="sec-systems"
            className={`phronesis-card transition-all duration-300 ${
              isExpanded ? 'p-6 space-y-6' : 'p-4 sm:p-5'
            }`}
          >
            <div
              onClick={() => toggleLayerExpanded('systems')}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFocused
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                  }`}
                >
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-display font-semibold text-base text-[var(--text-main)] group-hover:text-cyan-400 transition-colors">
                      Systems Thinking & <GlossaryTerm term="Game Theory">Strategic Game Theory</GlossaryTerm>
                    </h3>
                    {isFocused && (
                      <span className="font-ui text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                        Focus
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-[var(--text-muted)]">
                    Feedback loops, signaling credibility (Spence), and Rawlsian Veil of Ignorance audit
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-data text-xs text-cyan-400 font-medium hidden sm:inline">
                  {bundle.systems_layer.feedback_loops.dominant_loop_type} Loop
                </span>
                <button
                  type="button"
                  className="p-1 rounded-lg text-[var(--text-muted)] group-hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
                  aria-label={isExpanded ? 'Collapse layer' : 'Expand layer'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isExpanded ? (
              <div className="pt-2 flex items-center justify-between text-xs font-body text-[var(--text-muted)] border-t border-[var(--border-subtle)] mt-3">
                <p className="truncate pr-2">
                  Game Type: <strong className="text-[var(--text-main)] font-ui">{bundle.systems_layer.game_theory.game_type}</strong> · Rawlsian: <strong className="text-rose-400 font-ui">{bundle.systems_layer.rawlsian_audit.veil_verdict}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => toggleLayerExpanded('systems')}
                  className="text-xs font-ui text-[var(--color-verdigris)] hover:underline shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Expand Systems</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <SystemsThinkingView
                  systems={bundle.systems_layer}
                  onDrillDown={({ item_type, item_id, item_title, item_context }) =>
                    handleTriggerDrillDown(item_type, item_id, item_title, item_context)
                  }
                />
              </div>
            )}
          </section>
        );

      // -----------------------------------------------------------------------
      // 4. Logic (Critical Thinking & Empirical Grounding)
      // -----------------------------------------------------------------------
      case 'logic':
        return (
          <section
            key="logic"
            id="sec-critical"
            className={`phronesis-card transition-all duration-300 ${
              isExpanded ? 'p-6 space-y-4' : 'p-4 sm:p-5'
            }`}
          >
            {/* Header */}
            <div
              onClick={() => toggleLayerExpanded('logic')}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFocused
                      ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]'
                      : 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-display font-semibold text-base text-[var(--text-main)] group-hover:text-[var(--color-verdigris)] transition-colors">
                      Critical Thinking & Empirical Grounding
                    </h3>
                    {isFocused && (
                      <span className="font-ui text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium">
                        Focus
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-[var(--text-muted)]">
                    <GlossaryTerm term="Steelmanning">Steelmanning</GlossaryTerm>, <GlossaryTerm term="Falsifiability">falsifiability testing</GlossaryTerm>, and <GlossaryTerm term="Base Rate">base-rate checks</GlossaryTerm>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-data text-xs text-[var(--text-muted)]">
                  {critical_thinking_layer.falsifiability_audit.length} Audited
                </span>
                <button
                  type="button"
                  className="p-1 rounded-lg text-[var(--text-muted)] group-hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
                  aria-label={isExpanded ? 'Collapse layer' : 'Expand layer'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Collapsed One-Line Summary */}
            {!isExpanded ? (
              <div className="pt-2 flex items-center justify-between text-xs font-body text-[var(--text-muted)] border-t border-[var(--border-subtle)] mt-3">
                <p className="truncate pr-2">
                  {critical_thinking_layer.falsifiability_audit.length} assumption(s) checked · <GlossaryTerm term="Steelmanning">Steelmanned counterargument</GlossaryTerm> formulated
                </p>
                <button
                  type="button"
                  onClick={() => toggleLayerExpanded('logic')}
                  className="text-xs font-ui text-[var(--color-verdigris)] hover:underline shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Expand Logic</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Expanded Full Content */
              <div className="space-y-4 pt-2">
                {/* Steelmanned Counterargument */}
                {critical_thinking_layer.steelmanned_counterargument && (
                  <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
                    <h4 className="font-ui font-semibold text-xs text-[var(--text-main)] uppercase tracking-wider">
                      <GlossaryTerm term="Steelmanning">Steelmanned Counterargument</GlossaryTerm> Against Dominant Choice
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
                      <span>Empirical <GlossaryTerm term="Base Rate">Base-Rate</GlossaryTerm> Comparison</span>
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

                {/* Falsifiability Audit List with Drill-Down */}
                {critical_thinking_layer.falsifiability_audit.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      <GlossaryTerm term="Falsifiability">Falsifiability Audit</GlossaryTerm> & Verification Protocols:
                    </span>
                    {critical_thinking_layer.falsifiability_audit.map((item, idx) => {
                      const drill = drillDownStates[`assump-${idx}`];
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-body font-medium text-[var(--text-main)]">
                              "{item.assumption}"
                            </span>
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleTriggerDrillDown('assumption', `assump-${idx}`, `Assumption: ${item.assumption}`, {
                                    assumption: item.assumption,
                                    falsifiability_grade: item.falsifiability_grade,
                                    test_method: item.test_method,
                                  })
                                }
                                className={`px-2 py-0.5 rounded-md text-[10px] font-ui transition-all flex items-center space-x-1 cursor-pointer ${
                                  drill?.isOpen
                                    ? 'bg-[var(--color-verdigris)] text-white'
                                    : 'bg-[var(--bg-surface)] text-[var(--color-verdigris)] hover:bg-[var(--color-verdigris-subtle)] border border-[var(--border-subtle)]'
                                }`}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{drill?.isOpen ? 'Close' : 'Drill Down'}</span>
                              </button>
                              <span className="font-ui text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                                Grade: {item.falsifiability_grade}
                              </span>
                            </div>
                          </div>

                          <p className="font-body text-xs text-[var(--text-muted)]">
                            <strong className="text-[var(--color-verdigris)] font-ui">Test Protocol:</strong> {item.test_method}
                          </p>

                          {/* Inline Drill Down */}
                          {drill?.isOpen && (
                            <div className="mt-2 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--color-verdigris)]/30 space-y-2 animate-fade-in">
                              {drill.loading ? (
                                <div className="py-2 text-center text-[11px] font-ui text-[var(--color-verdigris)] animate-pulse">
                                  Formulating epistemic falsification protocol...
                                </div>
                              ) : drill.data ? (
                                <>
                                  <div className="font-body text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-line">
                                    {drill.data.deep_dive_markdown}
                                  </div>
                                  {drill.data.concrete_action_or_test && (
                                    <div className="font-body text-[11px] text-[var(--color-ochre)] font-medium">
                                      Experiment: {drill.data.concrete_action_or_test}
                                    </div>
                                  )}
                                </>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8 animate-fade-in relative">
      {/* Sticky Scrollspy Nav Rail for Large Screens */}
      <DossierNavRail />

      {/* Sticky Table of Contents Sub-Nav */}
      <div className="sticky top-14 z-20 py-2 px-3 rounded-2xl bg-[var(--bg-surface-glass)] backdrop-blur-md border border-[var(--border-subtle)] shadow-sm flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1 text-xs font-ui">
          <button
            type="button"
            onClick={() => scrollToSection('sec-executive')}
            className="px-2.5 py-1 rounded-lg text-[var(--color-verdigris)] hover:bg-[var(--color-verdigris-subtle)] font-medium transition-colors whitespace-nowrap cursor-pointer"
          >
            Executive
          </button>
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
            onClick={() => scrollToSection('sec-economics')}
            className="px-2.5 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors whitespace-nowrap cursor-pointer"
          >
            Economics & VoI
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('sec-bias')}
            className="px-2.5 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors whitespace-nowrap cursor-pointer"
          >
            Cognitive Biases (25)
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('sec-philosophy')}
            className="px-2.5 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors whitespace-nowrap cursor-pointer"
          >
            8 Lenses
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('sec-systems')}
            className="px-2.5 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors whitespace-nowrap cursor-pointer"
          >
            Systems & Game Theory
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

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsWhatIfOpen(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-ui font-medium text-[var(--color-ochre)] bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 hover:bg-[var(--color-ochre)]/20 transition-colors flex items-center space-x-1 whitespace-nowrap cursor-pointer"
            title="Open What-If Sandbox"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">What-If</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPresentationOpen(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-ui font-medium text-[var(--text-main)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-app)] transition-colors flex items-center space-x-1 whitespace-nowrap cursor-pointer"
            title="Present Decision Slides"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
            <span className="hidden md:inline">Present</span>
          </button>

          {onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="px-2.5 py-1 rounded-lg text-xs font-ui font-medium text-[var(--text-main)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-app)] transition-colors flex items-center space-x-1 whitespace-nowrap cursor-pointer shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Editorial Header */}
      <div id="sec-executive" className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
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
            onClick={() => setIsWhatIfOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-ui font-medium bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 text-[var(--color-ochre)] hover:bg-[var(--color-ochre)]/20 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>What-If Sandbox</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPresentationOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-ui font-medium bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
            <span>Present Slides</span>
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
          <span><GlossaryTerm term="Value of Information">Value of Information (VoI)</GlossaryTerm> · Recommended Next Test</span>
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
      {/* DYNAMICALLY ORDERED & COLLAPSIBLE 4 LAYER CARDS                           */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {orderedLayerIds.map((layerId) => renderLayerCard(layerId))}
      </div>

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
          <div className="pt-3 border-t border-[var(--border-subtle)] font-body text-xs sm:text-sm text-[var(--text-main)] leading-relaxed whitespace-pre-wrap animate-fade-in">
            {report.report_markdown}
          </div>
        )}
      </section>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border-subtle)]">


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

      {/* What-If Perturbation Sandbox Drawer */}
      <WhatIfSandboxDrawer
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        model={structured_decision}
        onApplyToModel={onApplySandboxModel}
      />

      {/* Executive Slide Deck Presentation Modal */}
      <ExecutivePresentationModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        decision={structured_decision}
        report={report}
        bundle={bundle}
      />
    </div>
  );
};
