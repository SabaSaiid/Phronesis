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
  const optimalChoice = alts.find((a) => a.id === minimax.minimax_regret_choice)?.name || minimax.minimax_regret_choice;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
        <div>
          <span className="font-ui font-semibold text-[var(--text-main)]">Minimax Regret Matrix: </span>
          <span className="font-body text-[var(--text-muted)]">Opportunity Loss & Downside Shield</span>
        </div>
        <div className="font-data text-[var(--color-verdigris)] font-medium">
          Minimax Choice: '{optimalChoice}'
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--bg-app)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-ui">
              <th className="py-2.5 px-3 font-medium">Alternative</th>
              {states.map((s) => (
                <th key={s.id} className="py-2.5 px-3 font-medium text-center">
                  Regret under '{s.name}'
                </th>
              ))}
              <th className="py-2.5 px-3 font-semibold text-right">Max Regret</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)]">
            {alts.map((alt) => {
              const maxR = minimax.maximum_regrets[alt.id] ?? 0;
              const isMinimaxChoice = alt.id === minimax.minimax_regret_choice;

              return (
                <tr
                  key={alt.id}
                  className={`transition-colors ${
                    isMinimaxChoice ? 'bg-[var(--color-verdigris-subtle)]' : 'hover:bg-[var(--bg-surface-raised)]'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="font-ui font-semibold text-[var(--text-main)] flex items-center space-x-1.5">
                      <span>{alt.name}</span>
                      {isMinimaxChoice && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-[var(--color-verdigris)] text-[#F5F2EA] font-ui">
                          Minimax Choice
                        </span>
                      )}
                    </div>
                  </td>
                  {states.map((s) => {
                    const r = minimax.regret_matrix[alt.id]?.[s.id] ?? 0;
                    return (
                      <td key={s.id} className="py-2.5 px-3 text-center font-data">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            r === 0
                              ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium'
                              : r > 35
                              ? 'bg-[var(--border-medium)] text-[var(--text-main)] font-bold'
                              : 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                          }`}
                        >
                          {r} R
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-data font-bold text-[var(--text-main)]">
                    <span className={isMinimaxChoice ? 'text-[var(--color-verdigris)]' : 'text-[var(--text-muted)]'}>
                      {maxR}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-body leading-relaxed">
        <span className="font-ui font-semibold text-[var(--text-main)]">Regret Trade-off: </span>
        {minimax.regret_tradeoff_insight}
      </div>
    </div>
  );
};
