import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  Brain,
  Zap
} from 'lucide-react';
import type { BenchmarkItem } from '../../types';

interface NarrativeInputViewProps {
  benchmarks?: BenchmarkItem[];
  onExtract: (narrative: string) => Promise<void>;
  onSelectBenchmark?: (bm: BenchmarkItem) => void;
  isLoading: boolean;
}

const STARTER_DILEMMAS = [
  {
    title: 'Startup vs Big Tech',
    text: 'I am deciding whether to remain in my stable enterprise software engineering job ($190k base + $120k unvested RSUs) or join an early-stage AI startup as a founding engineer (1% equity, $130k salary, 14 months runway). I value autonomy and upside, but worry about burn rate and loss of financial buffer.',
  },
  {
    title: 'Buy vs Rent Home',
    text: 'Deciding whether to purchase a $750k home with a 20% down payment at current 6.5% mortgage rates, or continue renting at $3,200/mo while investing capital in index funds. The key uncertainty is local property appreciation vs opportunity cost of equity over 7 years.',
  },
  {
    title: 'Product Launch vs Polish',
    text: 'We are deciding whether to launch our SaaS v1 immediately with basic features to validate customer demand, or spend 3 more months building advanced analytics and enterprise SSO. The risk is negative early reviews vs losing market timing to competitors.',
  },
  {
    title: 'VC Funding vs Bootstrapping',
    text: 'Deciding between raising a $2M seed round at a $10M valuation to scale marketing quickly, or continuing to bootstrap at $25k MRR growing 8% month-over-month. I am weighing dilution and loss of governance against competitive speed.',
  },
];

const LOADING_STEPS = [
  'Parsing alternatives and states of the world...',
  'Calibrating prior probability distributions...',
  'Mapping payoff matrices and testable assumptions...',
  'Synthesizing deterministic model workbench...',
];

export const NarrativeInputView: React.FC<NarrativeInputViewProps> = ({
  onExtract,
  isLoading,
}) => {
  const [narrative, setNarrative] = useState('');
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1200);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (narrative.trim().length >= 10 && !isLoading) {
      onExtract(narrative);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (narrative.trim().length >= 10 && !isLoading) {
        onExtract(narrative);
      }
    }
  };

  return (
    <div className="w-full max-w-[760px] mx-auto px-4 py-8 sm:py-12 space-y-6 animate-fade-in">
      {/* Centered Editorial Hero Greeting */}
      <div className="text-center space-y-3 pt-2 sm:pt-4">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-main)] leading-tight">
          Examine Your Decision Under Uncertainty
        </h1>

        <p className="font-body text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
          Phronesis never commands what to choose. It structures your dilemma, computes mathematical sensitivity, flags cognitive bias patterns with academic citations, and surfaces high-leverage 48-hour tests.
        </p>
      </div>

      {/* Floating Prompt Capsule Form */}
      <div className="prompt-capsule p-4 sm:p-5 space-y-3 relative overflow-hidden shadow-sm">
        {isLoading ? (
          /* Multi-step loading extraction visual */
          <div className="py-8 px-4 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/40 flex items-center justify-center text-[var(--color-verdigris)] shadow-sm animate-bounce">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-display font-semibold text-sm text-[var(--text-main)]">
                Extracting Decision Parameters
              </h3>
              <p className="font-ui text-xs text-[var(--color-verdigris)] font-medium animate-pulse">
                {LOADING_STEPS[loadingStepIndex]}
              </p>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center space-x-2 pt-2">
              {LOADING_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === loadingStepIndex
                      ? 'bg-[var(--color-verdigris)] scale-125 ring-2 ring-[var(--color-verdigris)]/30'
                      : idx < loadingStepIndex
                      ? 'bg-[var(--color-verdigris)] opacity-60'
                      : 'bg-[var(--border-medium)]'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1.5">
                <Brain className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
                <span>Describe Your Dilemma Once</span>
              </label>
              <span className="font-data text-[11px] text-[var(--text-faint)]">
                {narrative.length} chars
              </span>
            </div>

            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. I am deciding whether to remain in my stable enterprise software engineering job or join an early-stage AI startup as a founding engineer. I have $120k in unvested RSUs over 18 months, and the startup has 14 months of runway..."
              rows={6}
              disabled={isLoading}
              className="w-full bg-transparent text-[var(--text-main)] placeholder-[var(--text-faint)] text-sm font-body leading-relaxed focus:outline-none resize-y"
            />

            {/* Bottom Controls Bar inside Capsule */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <div className="text-[11px] text-[var(--text-muted)] font-ui flex items-center space-x-1.5 self-start sm:self-center">
                <Zap className="w-3.5 h-3.5 text-[var(--color-ochre)] shrink-0" />
                <span>Include alternatives, key unknowns, and payoff expectations.</span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <span className="hidden sm:inline-flex text-[10px] font-mono text-[var(--text-faint)] px-1.5 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                  ⌘ + Enter
                </span>

                <button
                  type="submit"
                  disabled={isLoading || narrative.trim().length < 10}
                  className={`
                    w-full sm:w-auto px-5 py-2 rounded-xl font-ui font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer
                    ${
                      isLoading || narrative.trim().length < 10
                        ? 'bg-[var(--border-medium)] text-[var(--text-faint)] cursor-not-allowed opacity-60'
                        : 'btn-verdigris shadow-sm'
                    }
                  `}
                >
                  <span>Extract Decision Model</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Starter Dilemma Chips directly under input */}
      <div className="pt-1">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {STARTER_DILEMMAS.map((starter) => (
            <button
              key={starter.title}
              type="button"
              onClick={() => setNarrative(starter.text)}
              className="px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-verdigris)]/50 text-xs font-ui text-[var(--text-main)] transition-all flex items-center space-x-1.5 group cursor-pointer shadow-2xs"
            >
              <span className="text-[var(--color-verdigris)] font-serif group-hover:rotate-45 transition-transform">
                ✦
              </span>
              <span>{starter.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
