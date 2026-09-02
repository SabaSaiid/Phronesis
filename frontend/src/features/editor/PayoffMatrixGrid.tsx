import React from 'react';
import type { StructuredDecision } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface PayoffMatrixGridProps {
  model: StructuredDecision;
  onPayoffChange: (altId: string, stateId: string, utility: number) => void;
  onAddAlternative: () => void;
  onRemoveAlternative: (altId: string) => void;
  onAddState: () => void;
  onRemoveState: (stateId: string) => void;
}

export const PayoffMatrixGrid: React.FC<PayoffMatrixGridProps> = ({
  model,
  onPayoffChange,
  onAddAlternative,
  onRemoveAlternative,
  onAddState,
  onRemoveState,
}) => {

  const getPayoff = (altId: string, stateId: string): number => {
    const cell = model.payoff_matrix.find(
      (p) => p.alternative_id === altId && p.state_id === stateId
    );
    return cell ? cell.utility : 50;
  };

  const getCellBgTint = (val: number) => {
    if (val >= 80) return 'rgba(91, 122, 107, 0.22)'; // high verdigris
    if (val >= 60) return 'rgba(91, 122, 107, 0.12)';
    if (val >= 40) return 'transparent';
    if (val >= 20) return 'rgba(244, 63, 94, 0.08)'; // mild rose
    return 'rgba(244, 63, 94, 0.18)'; // high rose
  };

  const getCellTextColor = (val: number) => {
    if (val >= 75) return 'var(--color-verdigris)';
    if (val <= 25) return '#f43f5e';
    return 'var(--text-main)';
  };

  const handleQuickPreset = (preset: 'best-worst' | 'neutral' | 'spread') => {
    model.alternatives.forEach((alt, aIdx) => {
      model.states_of_world.forEach((st, sIdx) => {
        let val = 50;
        if (preset === 'best-worst') {
          val = (aIdx + sIdx) % 2 === 0 ? 85 : 25;
        } else if (preset === 'neutral') {
          val = 50;
        } else if (preset === 'spread') {
          val = Math.min(100, Math.max(0, 30 + (aIdx * 20) + (sIdx * 15)));
        }
        onPayoffChange(alt.id, st.id, val);
      });
    });
  };

  return (
    <div className="space-y-4">
      {/* Action bar above grid */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-[var(--text-muted)] font-ui">
          <span className="text-[11px]">Quick Presets:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset('best-worst')}
            className="px-2 py-0.5 rounded bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] transition-colors cursor-pointer text-[10.5px]"
          >
            Polarized (85/25)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('neutral')}
            className="px-2 py-0.5 rounded bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] transition-colors cursor-pointer text-[10.5px]"
          >
            Reset Neutral (50)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('spread')}
            className="px-2 py-0.5 rounded bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] transition-colors cursor-pointer text-[10.5px]"
          >
            Progressive Spread
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onAddAlternative}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-ui bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-app)] border border-[var(--border-medium)] text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[var(--color-verdigris)]" />
            <span>Add Row (Alt)</span>
          </button>
          <button
            type="button"
            onClick={onAddState}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-ui bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-app)] border border-[var(--border-medium)] text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[var(--color-ochre)]" />
            <span>Add Column (State)</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface)] shadow-2xs">
        <table className="w-full text-left border-collapse min-w-[550px]">
          <thead>
            <tr className="bg-[var(--bg-app)] border-b border-[var(--border-subtle)] text-xs font-ui">
              <th className="p-3.5 font-semibold text-[var(--text-main)] w-1/3">
                Alternatives / States
              </th>
              {model.states_of_world.map((st) => (
                <th
                  key={st.id}
                  className="p-3 text-center border-l border-[var(--border-subtle)] font-medium text-[var(--text-main)]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate max-w-[140px] text-xs" title={st.name}>
                      {st.name}
                    </span>
                    {model.states_of_world.length > 2 && (
                      <button
                        type="button"
                        onClick={() => onRemoveState(st.id)}
                        className="p-0.5 rounded text-[var(--text-faint)] hover:text-rose-400 transition-colors"
                        title="Delete state column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] font-mono font-normal text-[var(--color-verdigris)] mt-0.5">
                    p = {Math.round(st.prior_probability * 100)}%
                  </div>
                </th>
              ))}
              <th className="w-10 p-2 text-center border-l border-[var(--border-subtle)] text-[10px] text-[var(--text-faint)]">
                Row
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
            {model.alternatives.map((alt) => (
              <tr key={alt.id} className="hover:bg-[var(--bg-surface-raised)]/40 transition-colors">
                <td className="p-3.5">
                  <div className="font-ui font-semibold text-xs sm:text-sm text-[var(--text-main)]">
                    {alt.name}
                  </div>
                  {alt.description && (
                    <div className="text-[11px] font-body text-[var(--text-muted)] truncate max-w-[240px] mt-0.5">
                      {alt.description}
                    </div>
                  )}
                </td>
                {model.states_of_world.map((st) => {
                  const val = getPayoff(alt.id, st.id);

                  return (
                    <td
                      key={st.id}
                      className="p-2 text-center border-l border-[var(--border-subtle)] transition-colors relative"
                      style={{ backgroundColor: getCellBgTint(val) }}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={val}
                          onChange={(e) => {
                            const num = parseInt(e.target.value) || 0;
                            onPayoffChange(alt.id, st.id, Math.max(0, Math.min(100, num)));
                          }}
                          className="w-16 h-8 text-center font-data font-bold text-xs matrix-cell-input cursor-text"
                          style={{ color: getCellTextColor(val) }}
                        />
                        <span className="text-[10px] font-mono text-[var(--text-faint)]">/100</span>
                      </div>
                    </td>
                  );
                })}
                <td className="p-2 text-center border-l border-[var(--border-subtle)]">
                  {model.alternatives.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onRemoveAlternative(alt.id)}
                      className="p-1 rounded text-[var(--text-faint)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete alternative row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] font-body text-[var(--text-faint)] italic">
        Tip: Click any cell to type numbers directly, or use Tab to navigate through matrix payoffs.
      </p>
    </div>
  );
};
