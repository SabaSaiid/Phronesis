import React, { useState } from 'react';
import { ArrowRight, Sparkles, BookOpen, Compass, Shield } from 'lucide-react';
import type { BenchmarkItem } from '../../types';

interface NarrativeInputViewProps {
  benchmarks: BenchmarkItem[];
  onExtract: (narrative: string) => Promise<void>;
  onSelectBenchmark: (bm: BenchmarkItem) => void;
  isLoading: boolean;
}

export const NarrativeInputView: React.FC<NarrativeInputViewProps> = ({
  benchmarks,
  onExtract,
  onSelectBenchmark,
  isLoading,
}) => {
  const [narrative, setNarrative] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (narrative.trim().length >= 10) {
      onExtract(narrative);
    }
  };

  return (
    <div className="w-full max-w-[720px] mx-auto px-4 py-8 space-y-10">
      {/* Editorial Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/20 text-[var(--color-verdigris)] text-xs font-ui font-medium">
          <Compass className="w-3.5 h-3.5" />
          <span>Practical Wisdom Under Uncertainty</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-main)] leading-tight">
          Examine Your Decision Under Uncertainty
        </h1>

        <p className="font-body text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
          Phronesis never tells you what to choose. It structures your dilemma, computes mathematical sensitivity, flags cognitive bias patterns with academic citations, and surfaces cheap experiments.
        </p>
      </div>

      {/* Input Prompt Card */}
      <div className="phronesis-card p-6 sm:p-7 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Describe Your Dilemma Once
            </label>
            <span className="font-data text-xs text-[var(--text-faint)]">
              {narrative.length} chars
            </span>
          </div>

          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="e.g. I am deciding whether to remain in my stable enterprise software engineering job or join an early-stage AI startup as a founding engineer. I have $120k in unvested RSUs over 18 months, and the startup has 14 months of runway..."
            rows={7}
            disabled={isLoading}
            className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-4 text-[var(--text-main)] placeholder-[var(--text-faint)] text-sm font-body leading-relaxed focus-visible:ring-2 focus-visible:ring-[var(--color-verdigris)] focus-visible:border-transparent transition-all resize-y"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="text-xs text-[var(--text-muted)] font-ui leading-relaxed">
              Include your alternatives, assumptions, hopes/fears, and key unknowns.
            </div>

            <button
              type="submit"
              disabled={isLoading || narrative.trim().length < 10}
              className={`
                w-full sm:w-auto px-5 py-2.5 rounded-xl font-ui font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer
                ${
                  isLoading || narrative.trim().length < 10
                    ? 'bg-[var(--border-medium)] text-[var(--text-faint)] cursor-not-allowed'
                    : 'btn-verdigris shadow-sm'
                }
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting Model...</span>
                </>
              ) : (
                <>
                  <span>Extract Structured Model</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Canonical Benchmarks Picker */}
        {benchmarks.length > 0 && (
          <div className="pt-5 border-t border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
                <span>Or Explore Canonical Dilemmas</span>
              </span>
              <span className="font-data text-[11px] text-[var(--text-faint)]">
                Instant 1-Click Audit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {benchmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => onSelectBenchmark(bm)}
                  className="p-3.5 rounded-xl bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-verdigris)]/40 transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-xs text-[var(--text-main)] group-hover:text-[var(--color-verdigris)] transition-colors">
                      {bm.title}
                    </h3>
                    <span className="text-xs text-[var(--text-faint)] font-mono">§</span>
                  </div>
                  <p className="font-body text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {bm.narrative}
                  </p>
                  <div className="text-[11px] font-ui text-[var(--color-verdigris)] font-medium pt-0.5">
                    Load & Audit Model →
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Structural Tenets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-ui">
        <div className="phronesis-card p-4 space-y-1.5">
          <div className="flex items-center space-x-1.5 font-semibold text-[var(--text-main)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
            <span>Deterministic Math</span>
          </div>
          <p className="font-body text-[var(--text-muted)] leading-relaxed">
            Expected utility and sensitivity thresholds run through pure Python algebraic solvers with zero LLM drift.
          </p>
        </div>

        <div className="phronesis-card p-4 space-y-1.5">
          <div className="flex items-center space-x-1.5 font-semibold text-[var(--text-main)]">
            <Shield className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
            <span>Sourced Lineage</span>
          </div>
          <p className="font-body text-[var(--text-muted)] leading-relaxed">
            Every cognitive bias and philosophical framework cites peer-reviewed literature (Kahneman, Tversky, Epictetus).
          </p>
        </div>

        <div className="phronesis-card p-4 space-y-1.5">
          <div className="flex items-center space-x-1.5 font-semibold text-[var(--text-main)]">
            <Compass className="w-3.5 h-3.5 text-[var(--color-ochre)]" />
            <span>Value of Information</span>
          </div>
          <p className="font-body text-[var(--text-muted)] leading-relaxed">
            Surfaces the single most decision-sensitive unknown and pairs it with a cheap 48-hour falsification test.
          </p>
        </div>
      </div>
    </div>
  );
};
