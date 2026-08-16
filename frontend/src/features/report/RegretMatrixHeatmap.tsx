import React from 'react';
import type { MinimaxRegretResult, StructuredDecision } from '../../types';

interface RegretMatrixHeatmapProps {
  decision: StructuredDecision;
  minimax: MinimaxRegretResult;
}

export const RegretMatrixHeatmap: React.FC<RegretMatrixHeatmapProps> = ({
  decision,
  minimax,
}) => {
  const alts = decision.alternatives;
  const states = decision.states_of_world;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-200">Minimax Regret Matrix: </span>
          <span>Opportunity Cost & Worst-Case Regret</span>
        </div>
        <div className="font-mono text-sage-400 font-medium">
          Minimax Choice: '{alts.find(a => a.id === minimax.minimax_regret_choice)?.name || minimax.minimax_regret_choice}'
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2.5 px-3 font-medium">Alternative</th>
              {states.map((s) => (
                <th key={s.id} className="py-2.5 px-3 font-medium text-center">
                  Regret under '{s.name}'
                </th>
              ))}
              <th className="py-2.5 px-3 font-semibold text-right">Max Regret</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {alts.map((alt) => {
              const maxR = minimax.maximum_regrets[alt.id] ?? 0;
              const isMinimaxChoice = alt.id === minimax.minimax_regret_choice;

              return (
                <tr
                  key={alt.id}
                  className={`transition-colors ${
                    isMinimaxChoice ? 'bg-sage-500/10' : 'hover:bg-space-900/40'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                      <span>{alt.name}</span>
                      {isMinimaxChoice && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-sage-500/20 text-sage-300 font-mono">
                          Minimax Optimal
                        </span>
                      )}
                    </div>
                  </td>
                  {states.map((s) => {
                    const r = minimax.regret_matrix[alt.id]?.[s.id] ?? 0;
                    return (
                      <td key={s.id} className="py-3 px-3 text-center font-mono">
                        <span
                          className={`px-2 py-1 rounded ${
                            r === 0
                              ? 'bg-sage-500/10 text-sage-400'
                              : r > 35
                              ? 'bg-rose-500/20 text-rose-300 font-bold'
                              : 'bg-amber-500/10 text-amber-300'
                          }`}
                        >
                          {r} R
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                    <span className={isMinimaxChoice ? 'text-sage-400' : 'text-slate-400'}>
                      {maxR}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 rounded-lg bg-space-950/60 border border-slate-800 text-xs text-slate-300">
        <span className="text-sage-400 font-semibold">Regret Insight: </span>
        {minimax.regret_tradeoff_insight}
      </div>
    </div>
  );
};
