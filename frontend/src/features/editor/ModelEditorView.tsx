import React, { useState, useEffect } from 'react';
import type { StructuredDecision, Assumption, FocusConfig } from '../../types';
import { FocusSelector } from '../../components/FocusSelector';
import {
  Play,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  Scale
} from 'lucide-react';

interface ModelEditorViewProps {
  decision: StructuredDecision;
  onUpdateDecision: (updated: StructuredDecision) => void;
  onRunAnalysis: (focusConfig?: FocusConfig) => Promise<void>;
  isLoading: boolean;
}

export const ModelEditorView: React.FC<ModelEditorViewProps> = ({
  decision,
  onUpdateDecision,
  onRunAnalysis,
  isLoading,
}) => {
  const [model, setModel] = useState<StructuredDecision>(() => JSON.parse(JSON.stringify(decision)));
  const [newAssumptionText, setNewAssumptionText] = useState('');
  const [focusConfig, setFocusConfig] = useState<FocusConfig>({
    focused_layers: ['psychology', 'logic', 'philosophy', 'practical'],
    philosophy_frameworks: [],
  });

  // Keep internal model synchronized if external insertions (e.g. Socratic chat actions) occur
  useEffect(() => {
    setModel(JSON.parse(JSON.stringify(decision)));
  }, [decision]);

  const handlePayoffChange = (altId: string, stateId: string, utility: number) => {
    const clamped = Math.max(0, Math.min(100, utility));
    const newPayoffs = model.payoff_matrix.map((p) => {
      if (p.alternative_id === altId && p.state_id === stateId) {
        return { ...p, utility: clamped };
      }
      return p;
    });
    const updated = { ...model, payoff_matrix: newPayoffs };
    setModel(updated);
    onUpdateDecision(updated);
  };

  const handleProbabilityChange = (stateId: string, newProb: number) => {
    const prob = Math.max(0, Math.min(1, newProb));
    const newStates = model.states_of_world.map((s) => {
      if (s.id === stateId) {
        return { ...s, prior_probability: prob };
      }
      return s;
    });
    const updated = { ...model, states_of_world: newStates };
    setModel(updated);
    onUpdateDecision(updated);
  };

  const handleNormalizeProbabilities = () => {
    const total = model.states_of_world.reduce((acc, s) => acc + s.prior_probability, 0);
    if (total <= 0) return;
    const normalized = model.states_of_world.map((s) => ({
      ...s,
      prior_probability: Math.round((s.prior_probability / total) * 100) / 100,
    }));
    const updated = { ...model, states_of_world: normalized };
    setModel(updated);
    onUpdateDecision(updated);
  };

  const handleDecisionStatementChange = (text: string) => {
    const updated = { ...model, decision_statement: text };
    setModel(updated);
    onUpdateDecision(updated);
  };

  const handleToggleAssumptionTestable = (assumptionId: string) => {
    const updatedAssumptions = model.assumptions.map((a) => {
      if (a.id === assumptionId) {
        return { ...a, testable: !a.testable };
      }
      return a;
    });
    const updated = { ...model, assumptions: updatedAssumptions };
    setModel(updated);
    onUpdateDecision(updated);
  };

  const handleAddAssumption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssumptionText.trim()) return;
    const newA: Assumption = {
      id: `assump-${Date.now()}`,
      text: newAssumptionText.trim(),
      type: 'empirical',
      testable: true,
    };
    const updated = { ...model, assumptions: [...model.assumptions, newA] };
    setModel(updated);
    onUpdateDecision(updated);
    setNewAssumptionText('');
  };

  const handleDeleteAssumption = (id: string) => {
    const updated = { ...model, assumptions: model.assumptions.filter((a) => a.id !== id) };
    setModel(updated);
    onUpdateDecision(updated);
  };

  const totalProb = model.states_of_world.reduce((acc, s) => acc + s.prior_probability, 0);
  const isProbValid = Math.abs(totalProb - 1.0) < 0.01;

  const getPayoff = (altId: string, stateId: string): number => {
    const cell = model.payoff_matrix.find(
      (p) => p.alternative_id === altId && p.state_id === stateId
    );
    return cell ? cell.utility : 50;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Top Navigation & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-main)] tracking-tight">
            Examine & Calibrate Model Parameters
          </h2>
          <p className="font-body text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 leading-relaxed">
            Verify extracted alternatives, priors, and payoff utilities before deterministic reasoning audits run.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRunAnalysis(focusConfig)}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl btn-verdigris font-ui font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Auditing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Reasoning Audit</span>
            </>
          )}
        </button>
      </div>

      {/* Decision Statement Card */}
      <div className="phronesis-card p-5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Decision Statement
          </label>
          <span className="text-[10px] font-mono text-[var(--text-faint)]">
            Core Target
          </span>
        </div>
        <textarea
          rows={2}
          value={model.decision_statement}
          onChange={(e) => handleDecisionStatementChange(e.target.value)}
          className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-3 text-sm font-body text-[var(--text-main)] leading-relaxed focus:border-[var(--color-verdigris)] focus:outline-none resize-y"
        />
      </div>

      {/* Payoff Utility Matrix (Heatmapped interactive cards) */}
      <div className="phronesis-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-sm sm:text-base text-[var(--text-main)] flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[var(--color-verdigris)]" />
              <span>Payoff Utility Matrix</span>
            </h3>
            <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
              Subjective satisfaction scores (0–100 scale) for each alternative under each world state.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {model.alternatives.map((alt) => (
            <div
              key={alt.id}
              className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-3"
            >
              <div>
                <div className="font-ui font-semibold text-sm text-[var(--text-main)]">
                  {alt.name}
                </div>
                {alt.description && (
                  <div className="font-body text-xs text-[var(--text-muted)] mt-0.5">
                    {alt.description}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {model.states_of_world.map((st) => {
                  const val = getPayoff(alt.id, st.id);
                  // Dynamic utility heat tint
                  const isHigh = val >= 70;
                  const isLow = val <= 30;

                  return (
                    <div
                      key={st.id}
                      className={`p-3 rounded-xl bg-[var(--bg-surface)] border transition-all space-y-2 ${
                        isHigh
                          ? 'border-[var(--color-verdigris)]/40 shadow-xs'
                          : isLow
                          ? 'border-rose-500/20'
                          : 'border-[var(--border-subtle)]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-ui text-[var(--text-muted)] truncate max-w-[150px]">
                          Under: <strong className="text-[var(--text-main)]">{st.name}</strong>
                        </span>
                        <span
                          className={`font-data font-bold text-xs ${
                            isHigh
                              ? 'text-[var(--color-verdigris)]'
                              : isLow
                              ? 'text-rose-400'
                              : 'text-[var(--text-main)]'
                          }`}
                        >
                          {val} / 100
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={val}
                        onChange={(e) => handlePayoffChange(alt.id, st.id, Number(e.target.value))}
                        className="w-full h-1.5 bg-[var(--bg-app)] rounded-lg appearance-none cursor-pointer accent-[var(--color-verdigris)] border border-[var(--border-subtle)]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* State Prior Probabilities */}
      <div className="phronesis-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold text-sm sm:text-base text-[var(--text-main)] flex items-center space-x-2">
              <Scale className="w-4 h-4 text-[var(--color-verdigris)]" />
              <span>State Prior Probabilities</span>
            </h3>
            <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
              Your estimated likelihood for each state of the world. Must sum to 100%.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-data ${
                isProbValid
                  ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30'
                  : 'bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] border border-[var(--color-ochre)]/30'
              }`}
            >
              {isProbValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>Sum: {Math.round(totalProb * 100)}%</span>
            </div>

            {!isProbValid && (
              <button
                type="button"
                onClick={handleNormalizeProbabilities}
                className="px-2.5 py-1 rounded-lg text-xs font-ui bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] text-[var(--text-main)] transition-colors cursor-pointer"
              >
                Auto-Normalize
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {model.states_of_world.map((st) => (
            <div
              key={st.id}
              className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-ui font-medium text-[var(--text-main)]">{st.name}</span>
                <span className="font-data font-bold text-[var(--color-verdigris)]">
                  {Math.round(st.prior_probability * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={st.prior_probability}
                onChange={(e) => handleProbabilityChange(st.id, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[var(--bg-surface)] rounded-lg appearance-none cursor-pointer accent-[var(--color-verdigris)] border border-[var(--border-subtle)]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Assumptions, Goals & Constraints */}
      <div className="space-y-4">
        {/* Assumptions with Testable / Value Toggles */}
        <div className="phronesis-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Stated Assumptions ({model.assumptions.length})
            </h4>
            <span className="text-[11px] font-body text-[var(--text-faint)]">
              Click badge to toggle testability
            </span>
          </div>

          <div className="space-y-2">
            {model.assumptions.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <p className="font-body text-[var(--text-main)] leading-relaxed">{a.text}</p>
                  <button
                    type="button"
                    onClick={() => handleToggleAssumptionTestable(a.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-ui font-medium transition-all cursor-pointer ${
                      a.testable
                        ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 hover:opacity-80'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:opacity-80'
                    }`}
                  >
                    {a.testable ? '✓ Empirically Testable' : '○ Value Judgment'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteAssumption(a.id)}
                  className="p-1 rounded text-[var(--text-faint)] hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove assumption"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Assumption Inline Form */}
          <form onSubmit={handleAddAssumption} className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              value={newAssumptionText}
              onChange={(e) => setNewAssumptionText(e.target.value)}
              placeholder="Add another explicit assumption..."
              className="flex-1 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg py-1.5 px-3 text-xs font-body text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--color-verdigris)]"
            />
            <button
              type="submit"
              disabled={!newAssumptionText.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-ui font-medium bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Goals and Constraints 2-col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Goals */}
          <div className="phronesis-card p-4 space-y-2.5">
            <h4 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Explicit Goals ({model.goals.length})
            </h4>
            <ul className="space-y-1.5 text-xs font-body text-[var(--text-main)]">
              {model.goals.map((g, i) => (
                <li key={i} className="p-2 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-start space-x-2">
                  <span className="text-[var(--color-verdigris)] font-bold">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Constraints */}
          <div className="phronesis-card p-4 space-y-2.5">
            <h4 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Hard Constraints ({model.constraints.length})
            </h4>
            <ul className="space-y-1.5 text-xs font-body text-[var(--text-main)]">
              {model.constraints.map((c, i) => (
                <li key={i} className="p-2 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-start space-x-2">
                  <span className="text-[var(--color-slate)] font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Analytical Focus & Depth Steering Section */}
      <FocusSelector
        value={focusConfig}
        onChange={setFocusConfig}
      />

      {/* Sticky Bottom Run Action Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-[var(--bg-surface-glass)] backdrop-blur-md border border-[var(--border-strong)] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-ui text-[var(--text-muted)] flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[var(--color-verdigris)] shrink-0" />
          <span>Ready to execute pure deterministic decision solvers & bias scans.</span>
        </div>

        <button
          type="button"
          onClick={() => onRunAnalysis(focusConfig)}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl btn-verdigris font-ui font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Running Deterministic Solvers...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Reasoning Audit →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
