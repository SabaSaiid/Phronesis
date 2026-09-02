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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Cognitive Psychology & Bias Pattern Engine</h2>
            <p className="text-xs text-slate-400">
              Evaluates reasoning against 25 peer-reviewed cognitive patterns with strict Structural Grounding Tiers.
            </p>
          </div>
        </div>

        {/* Tier Filter Chips */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedTier === 'all'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Flagged Patterns ({patterns.length})
          </button>
          <button
            onClick={() => setSelectedTier('explicit_variable')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedTier === 'explicit_variable'
                ? 'bg-blue-500 text-white font-semibold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Explicit Variable
          </button>
          <button
            onClick={() => setSelectedTier('narrative_nuance')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedTier === 'narrative_nuance'
                ? 'bg-purple-500 text-white font-semibold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
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
              className={`bg-slate-900 border ${
                isExplicit ? 'border-blue-500/30' : 'border-purple-500/30'
              } rounded-xl p-5 flex flex-col justify-between transition-all`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{pat.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {pat.field}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          isExplicit
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        }`}
                      >
                        {isExplicit ? 'Explicit Variable' : 'Narrative Nuance'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Core Idea */}
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  {pat.core_idea}
                </p>

                {/* Observed Trigger */}
                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-2 mb-3">
                  <div className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Observed Trigger: </span>
                    {pat.observed_trigger}
                  </div>
                  <div className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Analytical Caveat: </span>
                    {pat.caveat_analysis}
                  </div>
                </div>

                {/* Surfaced Socratic Question */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs italic text-amber-200 leading-relaxed">
                      "{pat.question_to_surface}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer with Academic Source, Feedback, & Deep-Dive */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate max-w-[140px]" title={pat.source}>
                    {pat.source}
                  </span>
                  <div className="flex items-center gap-1 border-l border-slate-800 pl-2 shrink-0">
                    <button
                      onClick={() => handleVote(pat.id, true)}
                      title="Relevant observation"
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                        feedbackMap[pat.id] === true
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {feedbackMap[pat.id] === true ? <Check className="w-3.5 h-3.5" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleVote(pat.id, false)}
                      title="Not relevant / false positive"
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                        feedbackMap[pat.id] === false
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {onDrillDown && (
                  <button
                    onClick={() =>
                      onDrillDown({
                        item_type: 'bias',
                        item_id: pat.id,
                        item_title: pat.name,
                        item_context: { trigger: pat.observed_trigger, caveat: pat.caveat_analysis },
                      })
                    }
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium ml-2 shrink-0"
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
