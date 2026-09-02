import React, { useState, useEffect } from 'react';
import type { StructuredDecision, ReportResponse, AnalysisBundle } from '../../types';
import {
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ExecutivePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: StructuredDecision;
  report: ReportResponse;
  bundle: AnalysisBundle;
}

export const ExecutivePresentationModal: React.FC<ExecutivePresentationModalProps> = ({
  isOpen,
  onClose,
  decision,
  report,
  bundle,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide((s) => Math.min(totalSlides - 1, s + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((s) => Math.max(0, s - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const preferredAlt = report.math_summary?.preferred_eu_alt || decision.alternatives[0]?.name;
  const minimaxAlt = report.math_summary?.minimax_regret_choice || 'N/A';
  const rawlsianVerdict = bundle.systems_layer?.rawlsian_audit?.veil_verdict || 'Compliant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8 animate-fade-in">
      <div className="w-full max-w-5xl h-[85vh] bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden relative">
        {/* Top Control Bar */}
        <div className="p-4 sm:p-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-raised)]/60">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-wider text-[var(--color-verdigris)] uppercase">
              Phronesis Executive Briefing
            </span>
            <span className="text-xs text-[var(--text-faint)]">/</span>
            <span className="text-xs font-ui text-[var(--text-muted)]">
              Slide {currentSlide + 1} of {totalSlides}
            </span>
          </div>

          {/* Slide Pill Navigation */}
          <div className="flex items-center space-x-1.5">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx
                    ? 'w-8 bg-[var(--color-verdigris)]'
                    : 'w-2 bg-[var(--border-subtle)] hover:bg-[var(--text-muted)]'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Content Area */}
        <div className="flex-1 p-6 sm:p-12 overflow-y-auto flex flex-col justify-center">
          {currentSlide === 0 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in text-center sm:text-left">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 inline-block">
                Slide 1: Strategic Dilemma
              </span>
              <h1 className="font-display text-2xl sm:text-4xl font-semibold text-[var(--text-main)] leading-tight">
                "{decision.decision_statement}"
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
                <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                  <div className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Alternatives Considered ({decision.alternatives.length})
                  </div>
                  <ul className="space-y-1.5 text-sm font-ui text-[var(--text-main)]">
                    {decision.alternatives.map((alt) => (
                      <li key={alt.id} className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-verdigris)]" />
                        <span>{alt.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                  <div className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    States of the World ({decision.states_of_world.length})
                  </div>
                  <ul className="space-y-1.5 text-sm font-ui text-[var(--text-main)]">
                    {decision.states_of_world.map((st) => (
                      <li key={st.id} className="flex items-center justify-between">
                        <span>{st.name}</span>
                        <span className="font-data text-xs text-[var(--color-verdigris)]">
                          {Math.round(st.prior_probability * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentSlide === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 inline-block">
                Slide 2: Mathematical Optimality
              </span>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-main)]">
                  Decision Theory & Expected Utility
                </h2>
                <p className="font-body text-sm text-[var(--text-muted)] mt-1">
                  Evaluated using closed-form von Neumann-Morgenstern expected utility and Savage minimax regret.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="p-6 rounded-2xl bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 space-y-2">
                  <div className="text-xs font-ui font-bold uppercase tracking-wider text-[var(--color-verdigris)]">
                    Expected Utility Leader
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-bold text-[var(--text-main)]">
                    {preferredAlt}
                  </div>
                  <p className="text-xs font-body text-[var(--text-muted)]">
                    Maximizes probability-weighted payoffs across all estimated world states.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 space-y-2">
                  <div className="text-xs font-ui font-bold uppercase tracking-wider text-[var(--color-ochre)]">
                    Minimax Regret (Safety)
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-bold text-[var(--text-main)]">
                    {minimaxAlt}
                  </div>
                  <p className="text-xs font-body text-[var(--text-muted)]">
                    Minimizes the maximum regret incurred in hindsight under worst-case realization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentSlide === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 inline-block">
                Slide 3: Philosophy & Systems Audit
              </span>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-main)]">
                  Multi-Perspective Epistemic & Fairness Audit
                </h2>
                <p className="font-body text-sm text-[var(--text-muted)] mt-1">
                  Synthesized across 8 peer-grounded philosophical traditions and Rawlsian fairness.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-ui font-semibold text-sm text-[var(--text-main)]">
                    Rawlsian Veil of Ignorance Verdict
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-ui font-semibold bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30">
                    {rawlsianVerdict}
                  </span>
                </div>
                {bundle.systems_layer?.rawlsian_audit?.least_advantaged_stakeholder && (
                  <p className="text-xs font-body text-[var(--text-muted)] leading-relaxed">
                    Least-Advantaged Stakeholder:{' '}
                    <strong className="text-[var(--text-main)]">
                      {bundle.systems_layer.rawlsian_audit.least_advantaged_stakeholder}
                    </strong>
                  </p>
                )}
                {bundle.systems_layer?.systems_synthesis_narrative && (
                  <p className="text-xs font-body text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                    {bundle.systems_layer.systems_synthesis_narrative}
                  </p>
                )}
              </div>
            </div>
          )}

          {currentSlide === 3 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] border border-[var(--color-ochre)]/30 inline-block">
                Slide 4: Epistemic Action & VoI
              </span>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-main)]">
                  Value of Information & Recommended Experiment
                </h2>
                <p className="font-body text-sm text-[var(--text-muted)] mt-1">
                  How much uncertainty reduction matters before making an irreversible commitment.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="p-5 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
                  <div className="text-xs font-ui font-bold uppercase tracking-wider text-[var(--color-ochre)]">
                    Key Sensitive Variable
                  </div>
                  <div className="font-display text-lg font-semibold text-[var(--text-main)]">
                    {report.key_sensitive_variable || 'Critical parameter inflection point'}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 space-y-2">
                  <div className="text-xs font-ui font-bold uppercase tracking-wider text-[var(--color-ochre)]">
                    Proposed Empirical Micro-Experiment
                  </div>
                  <p className="text-xs sm:text-sm font-body text-[var(--text-main)] leading-relaxed">
                    {report.proposed_experiment || 'Execute low-cost trial or pilot validation before total capital allocation.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Toolbar */}
        <div className="p-4 sm:p-6 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-raised)]/60">
          <button
            type="button"
            disabled={currentSlide === 0}
            onClick={() => setCurrentSlide((s) => s - 1)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-ui font-medium bg-[var(--bg-surface)] hover:bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-main)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="hidden sm:inline text-xs font-ui text-[var(--text-faint)]">
            Use Left / Right arrow keys or Spacebar to navigate
          </span>

          <button
            type="button"
            disabled={currentSlide === totalSlides - 1}
            onClick={() => setCurrentSlide((s) => s + 1)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-ui font-medium btn-verdigris shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
