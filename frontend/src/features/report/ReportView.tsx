import React, { useState } from 'react';
import type {
  AnalysisBundle,
  ReportResponse,
} from '../../types';
import { SensitivityChart } from './SensitivityChart';
import { RegretMatrixHeatmap } from './RegretMatrixHeatmap';
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
  AlertCircle
} from 'lucide-react';

interface ReportViewProps {
  bundle: AnalysisBundle;
  report: ReportResponse;
  onEditModel: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  bundle,
  report,
  onEditModel,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'sources'>('dashboard');

  const { structured_decision, math_layer, bias_layer, philosophy_layer, critical_thinking_layer } = bundle;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Top Action & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sage-500/10 text-sage-400 text-xs font-mono font-medium mb-1">
            <span>Deterministic Reasoning Audit</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Decision Audit & Value-of-Information
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {structured_decision.decision_statement}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onEditModel}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-space-900 hover:bg-space-850 border border-slate-700 text-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-brand-400" />
            <span>Tweak Parameters</span>
          </button>
        </div>
      </div>

      {/* Value of Information (VoI) Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-950/80 via-space-900 to-space-950 border border-brand-500/30 p-6 sm:p-8 space-y-4 glow-brand relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider">
          <FlaskConical className="w-4 h-4 text-brand-400" />
          <span>Value of Information (VoI) — Recommended Next Experiment</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            Most Sensitive Variable: <span className="text-brand-300 font-mono">{math_layer.sensitivity_analysis.critical_parameter}</span>
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Instead of forcing an immediate irreversible verdict, sensitivity analysis reveals your choice is hyper-sensitive to one specific unknown. 
            Before committing capital or tenure, execute this low-cost test:
          </p>
        </div>

        <div className="p-4 rounded-xl bg-space-950/80 border border-brand-500/20 text-xs sm:text-sm text-brand-100 flex items-start space-x-3">
          <Target className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-brand-300">48-Hour Low-Cost Test: </span>
            <span>
              {critical_thinking_layer.falsifiability_audit[0]?.test_method || report.proposed_experiment}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            activeTab === 'dashboard'
              ? 'bg-space-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4 text-brand-400" />
          <span>Analytical Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            activeTab === 'report'
              ? 'bg-space-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-sage-400" />
          <span>Report Synthesis</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            activeTab === 'sources'
              ? 'bg-space-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Sourced Attributions ({report.attributed_sources.length})</span>
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Top Math Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expected Utility Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200 uppercase tracking-wider">
                  Expected Utility (Probabilistic)
                </span>
                <span className="font-mono text-brand-400">Pure Vector Math</span>
              </div>
              
              <div className="space-y-2">
                {structured_decision.alternatives.map((alt) => {
                  const val = math_layer.expected_utility.utilities[alt.id] ?? 0;
                  const isTop = alt.id === math_layer.expected_utility.preferred_alternative_id;
                  return (
                    <div key={alt.id} className="flex items-center justify-between p-2.5 rounded-lg bg-space-950/60 border border-slate-800/80 text-xs">
                      <span className="text-slate-200 font-medium">{alt.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-100">{val} EU</span>
                        {isTop && (
                          <span className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-mono">
                            Highest EU
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Minimax Regret Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200 uppercase tracking-wider">
                  Minimax Regret (Downside Risk)
                </span>
                <span className="font-mono text-sage-400">Worst-Case Minimize</span>
              </div>

              <div className="space-y-2">
                {structured_decision.alternatives.map((alt) => {
                  const val = math_layer.minimax_regret.maximum_regrets[alt.id] ?? 0;
                  const isMinimax = alt.id === math_layer.minimax_regret.minimax_regret_choice;
                  return (
                    <div key={alt.id} className="flex items-center justify-between p-2.5 rounded-lg bg-space-950/60 border border-slate-800/80 text-xs">
                      <span className="text-slate-200 font-medium">{alt.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-100">{val} Max Regret</span>
                        {isMinimax && (
                          <span className="px-1.5 py-0.5 rounded bg-sage-500/20 text-sage-300 text-[10px] font-mono">
                            Minimizes Regret
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Sensitivity Curve & Regret Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <SensitivityChart decision={structured_decision} sensitivity={math_layer.sensitivity_analysis} />
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <RegretMatrixHeatmap decision={structured_decision} minimax={math_layer.minimax_regret} />
            </div>
          </div>

          {/* Layer 1: Cognitive Bias Flags (with academic citations) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  Layer 1: Cognitive Bias Pattern Recognition
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {bias_layer.flagged_patterns.length} Pattern(s) Flagged
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bias_layer.flagged_patterns.map((pat) => (
                <div key={pat.id} className="p-4 rounded-xl bg-space-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-amber-300">{pat.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {pat.field}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 italic">
                    Source: {pat.source}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {pat.caveat_analysis}
                  </p>

                  <div className="p-3 rounded-lg bg-space-900 border border-slate-800/80 text-xs text-slate-200">
                    <span className="text-amber-400 font-medium">Reframing Question: </span>
                    <span>{pat.question_to_surface}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layer 3: Stoic Philosophy Lens */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-brand-400" />
                <div>
                  <h3 className="font-bold text-base text-white">
                    Layer 3: {philosophy_layer.framework_name}
                  </h3>
                  <p className="text-xs text-slate-400">Source: {philosophy_layer.source}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Internal Controllables */}
              <div className="p-4 rounded-xl bg-space-950/70 border border-sage-500/20 space-y-2">
                <h4 className="font-semibold text-sage-400 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Internal Controllables (Prohairesis)</span>
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  {philosophy_layer.dichotomy_of_control.internal_controllables.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-sage-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* External Uncontrollables */}
              <div className="p-4 rounded-xl bg-space-950/70 border border-rose-500/20 space-y-2">
                <h4 className="font-semibold text-rose-400 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>External Uncontrollables (Indifferents)</span>
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  {philosophy_layer.dichotomy_of_control.external_uncontrollables.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {philosophy_layer.indifferents_analysis?.virtue_and_agency_tension && (
              <div className="p-3.5 rounded-xl bg-space-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="text-brand-400 font-semibold">Agency vs. Preferred Indifferents: </span>
                {philosophy_layer.indifferents_analysis.virtue_and_agency_tension}
              </div>
            )}
          </div>

          {/* Layer 4: Critical Thinking & Steelmanning */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-sage-400" />
              <h3 className="font-bold text-base text-white">
                Layer 4: Critical Thinking & Steelmanned Counter-Thesis
              </h3>
            </div>

            {/* Steelmanned Counterargument */}
            {critical_thinking_layer.steelmanned_counterargument && (
              <div className="p-4 rounded-xl bg-brand-950/30 border border-brand-500/20 space-y-2">
                <h4 className="font-semibold text-xs text-brand-300 uppercase tracking-wider">
                  Steelmanned Counterargument Against Dominant Option
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {critical_thinking_layer.steelmanned_counterargument}
                </p>
              </div>
            )}

            {/* Base Rate Comparison */}
            {critical_thinking_layer.base_rate_check && (
              <div className="p-4 rounded-xl bg-space-950/70 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span>Empirical Base-Rate Reality Check</span>
                  <span className="font-mono text-sage-400">
                    Ref: {critical_thinking_layer.base_rate_check.empirical_base_rate}%
                  </span>
                </div>
                <p className="text-slate-400">
                  {critical_thinking_layer.base_rate_check.divergence_flag}
                </p>
                <div className="text-[11px] text-slate-500 italic">
                  Source: {critical_thinking_layer.base_rate_check.source}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Synthesized Markdown Audit
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Strict Caveat & Grounding Verified
            </span>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-slate-200 space-y-4 font-sans leading-relaxed whitespace-pre-wrap">
            {report.report_markdown}
          </div>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-base text-white">Intellectual Lineage & Sourced Attributions</h3>
            <p className="text-xs text-slate-400">
              All findings cite peer-reviewed decision literature and philosophical texts. Phronesis never presents algorithmic outputs as personal AI opinions.
            </p>
          </div>

          <div className="divide-y divide-slate-800/80">
            {report.attributed_sources.map((src, i) => (
              <div key={i} className="py-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{src.referenced_item}</span>
                  <span className="font-mono text-[10px] text-brand-400 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                    {src.field}
                  </span>
                </div>
                <p className="text-slate-400 font-mono text-[11px]">
                  {src.source}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
