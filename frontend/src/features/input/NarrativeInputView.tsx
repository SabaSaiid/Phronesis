import React, { useState } from 'react';
import { ArrowRight, Sparkles, HelpCircle, Layers, Cpu } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Deterministic Reasoning Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Make Your Decision Mind <span className="gradient-text">Visible & Auditable</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Phronesis never tells you what to choose. It surfaces your hidden assumptions, 
          computes mathematical sensitivity, flags cognitive bias patterns with academic citations, 
          and identifies cheap experiments before you commit.
        </p>
      </div>

      {/* Main Form */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
              <span>Describe Your Real-World Dilemma</span>
              <span className="text-xs text-slate-500 font-normal">(Free text narrative)</span>
            </label>
            <span className="text-xs text-slate-500 font-mono">
              {narrative.length} chars
            </span>
          </div>

          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="e.g. I am deciding whether to remain in my stable enterprise software engineering job or join an early-stage AI startup as a founding engineer. I have $120k in unvested RSUs over 18 months, and the startup has 14 months of runway..."
            rows={7}
            className="w-full bg-space-950/80 border border-slate-700/80 rounded-xl p-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-sans leading-relaxed resize-y"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <HelpCircle className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Include your options, what you fear/hope, past investments, and key uncertainties.</span>
            </div>

            <button
              type="submit"
              disabled={isLoading || narrative.trim().length < 10}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-all ${
                isLoading || narrative.trim().length < 10
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-lg shadow-brand-500/25 cursor-pointer transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Extracting Decision Model...</span>
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

        {/* Benchmark Scenarios Picker */}
        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-sage-400" />
              <span>Or Explore Instant Zero-Key Benchmarks</span>
            </span>
            <span className="text-xs text-sage-400/80 font-mono">1-Click Full Audit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benchmarks.map((bm) => (
              <div
                key={bm.id}
                onClick={() => onSelectBenchmark(bm)}
                className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer border border-slate-800 space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-200 group-hover:text-brand-300 transition-colors">
                    {bm.title}
                  </h3>
                  <Cpu className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-colors" />
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {bm.narrative}
                </p>
                <div className="flex items-center space-x-2 pt-1 text-[11px] text-brand-400 font-medium">
                  <span>Load and Audit Scenario →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tenets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <h4 className="font-semibold text-slate-200">1. Pure Math Solvers</h4>
          <p>Expected utility, minimax regret, and algebraic sensitivity thresholds execute with zero LLM variance.</p>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <h4 className="font-semibold text-slate-200">2. Sourced Attribution</h4>
          <p>Every flagged bias cites peer-reviewed literature (Kahneman, Tversky, Epictetus, Wason).</p>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <h4 className="font-semibold text-slate-200">3. Value of Information</h4>
          <p>Highlights the single most decision-sensitive unknown and pairs it with a cheap 48-hour experiment.</p>
        </div>
      </div>
    </div>
  );
};
