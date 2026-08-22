import React, { useState } from 'react';
import { BookOpen, ArrowLeft, ArrowRight, Search, Sparkles, Scale, ShieldCheck } from 'lucide-react';
import type { BenchmarkItem } from '../../types';

interface CanonicalDilemmasViewProps {
  benchmarks: BenchmarkItem[];
  onSelectBenchmark: (bm: BenchmarkItem) => void;
  onBackToInput: () => void;
}

export const CanonicalDilemmasView: React.FC<CanonicalDilemmasViewProps> = ({
  benchmarks,
  onSelectBenchmark,
  onBackToInput,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const cleanQ = searchQuery.toLowerCase().trim();
  const filteredBenchmarks = benchmarks.filter(
    (b) => b.title.toLowerCase().includes(cleanQ) || b.narrative.toLowerCase().includes(cleanQ)
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8 animate-fade-in">
      {/* Top Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onBackToInput}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer mr-1"
              title="Back to Decision Input"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/20 text-[var(--color-verdigris)] text-xs font-ui font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reference Library</span>
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-main)]">
            Canonical Dilemmas
          </h1>
          <p className="font-body text-xs sm:text-sm text-[var(--text-muted)] max-w-xl leading-relaxed">
            Pre-calibrated decision scenarios with explicit alternative sets, prior probability states, and payoff matrices for instant mathematical and philosophical auditing.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter dilemmas..."
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl py-2 pl-9 pr-3 text-xs font-ui text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--color-verdigris)] transition-colors"
          />
        </div>
      </div>

      {/* Dilemmas Grid */}
      {filteredBenchmarks.length === 0 ? (
        <div className="p-12 text-center space-y-3 phronesis-card">
          <Sparkles className="w-8 h-8 text-[var(--text-faint)] mx-auto opacity-60" />
          <h3 className="font-display font-medium text-sm text-[var(--text-main)]">
            No matching canonical dilemmas found
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-body">
            Try adjusting your search terms or return to the main decision input.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBenchmarks.map((bm) => {
            const altsCount = bm.structured_decision?.alternatives?.length || 0;
            const statesCount = bm.structured_decision?.states_of_world?.length || 0;

            return (
              <div
                key={bm.id}
                onClick={() => onSelectBenchmark(bm)}
                className="phronesis-card p-5 space-y-4 hover:border-[var(--color-verdigris)]/50 transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm text-[var(--color-verdigris)] font-bold">
                        §
                      </span>
                      <h3 className="font-display font-semibold text-sm sm:text-base text-[var(--text-main)] group-hover:text-[var(--color-verdigris)] transition-colors">
                        {bm.title}
                      </h3>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/20">
                      Pre-Calibrated
                    </span>
                  </div>

                  <p className="font-body text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                    {bm.narrative}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-[11px] font-mono text-[var(--text-faint)]">
                    <span className="flex items-center space-x-1">
                      <Scale className="w-3 h-3 text-[var(--color-slate)]" />
                      <span>{altsCount} Alternatives</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-[var(--color-slate)]" />
                      <span>{statesCount} States</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBenchmark(bm);
                    }}
                    className="text-xs font-ui font-medium text-[var(--color-verdigris)] group-hover:translate-x-1 transition-transform flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Load Workbench</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
