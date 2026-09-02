import React, { useState } from 'react';
import type { BiasLayerResult } from '../../types';
import { Brain, HelpCircle, ArrowRight, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { submitFlagFeedback } from '../../lib/api';

interface CognitivePsychologyViewProps {
  biasLayer: BiasLayerResult;
  decisionId?: string;
  onDrillDown?: (item: { item_type: string; item_id: string; item_title: string; item_context?: Record<string, any> }) => void;
}

export const CognitivePsychologyView: React.FC<CognitivePsychologyViewProps> = ({
  biasLayer,
  decisionId,
  onDrillDown,
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [feedbackMap, setFeedbackMap] = useState<Record<string, boolean>>({});
  const patterns = biasLayer.flagged_patterns || [];

  const handleVote = async (patId: string, isPositive: boolean) => {
    try {
      setFeedbackMap((prev) => ({ ...prev, [patId]: isPositive }));
      await submitFlagFeedback({
        decision_id: decisionId || 'current_session',
        flag_id: patId,
        flag_type: 'bias',
        is_positive: isPositive,
      });
    } catch (e) {
      console.error('Failed to submit flag feedback:', e);
    }
  };

  const filteredPatterns = selectedTier === 'all'
    ? patterns
    : patterns.filter((p) => (p.grounding_tier || 'narrative_nuance') === selectedTier);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="phronesis-card p-6 relative overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-ochre-subtle)] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 rounded-xl text-[var(--color-ochre)]">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-semibold text-[var(--text-main)] tracking-tight">
              Cognitive Psychology & Bias Pattern Engine
            </h2>
            <p className="text-xs font-body text-[var(--text-muted)] mt-0.5">
              Evaluates reasoning against 25 peer-reviewed cognitive patterns with strict Structural Grounding Tiers.
            </p>
          </div>
        </div>

        {/* Tier Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setSelectedTier('all')}
            className={`px-3 py-1 rounded-full text-xs font-ui font-medium transition-all cursor-pointer ${
              selectedTier === 'all'
                ? 'bg-[var(--color-ochre)] text-white font-semibold shadow-xs'
                : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
            }`}
          >
            All Flagged Patterns ({patterns.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTier('explicit_variable')}
            className={`px-3 py-1 rounded-full text-xs font-ui font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTier === 'explicit_variable'
                ? 'bg-[var(--color-verdigris)] text-white font-semibold shadow-xs'
                : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-verdigris)]" />
            Explicit Variable
          </button>
          <button
            type="button"
            onClick={() => setSelectedTier('narrative_nuance')}
            className={`px-3 py-1 rounded-full text-xs font-ui font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTier === 'narrative_nuance'
                ? 'bg-[var(--color-ochre)] text-white font-semibold shadow-xs'
                : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ochre)]" />
            Narrative Nuance
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPatterns.map((pat) => {
          const isExplicit = pat.grounding_tier === 'explicit_variable';

          return (
            <div
              key={pat.id}
              className={`phronesis-card p-5 flex flex-col justify-between transition-all bg-[var(--bg-surface)] border ${
                isExplicit ? 'border-[var(--color-verdigris)]/40 shadow-xs' : 'border-[var(--border-subtle)]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-display font-semibold text-[var(--text-main)]">{pat.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-app)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                        {pat.field}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          isExplicit
                            ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border-[var(--color-verdigris)]/30'
                            : 'bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] border-[var(--color-ochre)]/30'
                        }`}
                      >
                        {isExplicit ? 'Explicit Variable' : 'Narrative Nuance'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Core Idea */}
                <p className="text-xs font-body text-[var(--text-muted)] mb-3 leading-relaxed">
                  {pat.core_idea}
                </p>

                {/* Observed Trigger */}
                <div className="p-3 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl space-y-2 mb-3">
                  <div className="text-xs font-body text-[var(--text-muted)]">
                    <span className="font-ui font-semibold text-[var(--text-main)]">Observed Trigger: </span>
                    {pat.observed_trigger}
                  </div>
                  <div className="text-xs font-body text-[var(--text-muted)]">
                    <span className="font-ui font-semibold text-[var(--text-main)]">Analytical Caveat: </span>
                    {pat.caveat_analysis}
                  </div>
                </div>

                {/* Surfaced Socratic Question */}
                <div className="p-3 bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-[var(--color-ochre)] shrink-0 mt-0.5" />
                    <p className="text-xs font-body italic text-[var(--text-main)] leading-relaxed">
                      "{pat.question_to_surface}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer with Academic Source, Feedback, & Deep-Dive */}
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-faint)]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate max-w-[140px] font-ui" title={pat.source}>
                    {pat.source}
                  </span>
                  <div className="flex items-center gap-1 border-l border-[var(--border-subtle)] pl-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleVote(pat.id, true)}
                      title="Relevant observation"
                      className={`p-1 rounded-md hover:bg-[var(--bg-app)] transition-colors cursor-pointer ${
                        feedbackMap[pat.id] === true
                          ? 'text-[var(--color-verdigris)] bg-[var(--color-verdigris-subtle)]'
                          : 'text-[var(--text-faint)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {feedbackMap[pat.id] === true ? <Check className="w-3.5 h-3.5" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(pat.id, false)}
                      title="Not relevant / false positive"
                      className={`p-1 rounded-md hover:bg-[var(--bg-app)] transition-colors cursor-pointer ${
                        feedbackMap[pat.id] === false
                          ? 'text-rose-500 bg-rose-500/10'
                          : 'text-[var(--text-faint)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {onDrillDown && (
                  <button
                    type="button"
                    onClick={() =>
                      onDrillDown({
                        item_type: 'bias',
                        item_id: pat.id,
                        item_title: pat.name,
                        item_context: { trigger: pat.observed_trigger, caveat: pat.caveat_analysis },
                      })
                    }
                    className="text-[var(--color-ochre)] hover:underline flex items-center gap-1 font-ui font-medium ml-2 shrink-0 cursor-pointer"
                  >
                    Deep-Dive <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
