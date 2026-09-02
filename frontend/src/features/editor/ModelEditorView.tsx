import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { StructuredDecision, Assumption, FocusConfig } from '../../types';
import { FocusSelector } from '../../components/FocusSelector';
import { PayoffMatrixGrid } from './PayoffMatrixGrid';
import {
  Play,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  Scale,
  LayoutGrid,
  Lock,
  Unlock,
  TrendingUp
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
  const [matrixViewMode, setMatrixViewMode] = useState<'table' | 'cards'>('table');
  const [lockedStates, setLockedStates] = useState<Record<string, boolean>>({});
  const [newAssumptionText, setNewAssumptionText] = useState('');
  const [focusConfig, setFocusConfig] = useState<FocusConfig>({
    focused_layers: ['psychology', 'logic', 'philosophy', 'practical'],
    philosophy_frameworks: [],
  });

  // Ref to skip useEffect re-sync when we ourselves pushed the change upstream
  const internalEditRef = useRef(false);

  // Keep internal model synchronized if external insertions (e.g. Socratic chat actions) occur
  useEffect(() => {
    if (internalEditRef.current) {
      internalEditRef.current = false;
      return;
    }
    setModel(JSON.parse(JSON.stringify(decision)));
  }, [decision]);

  // Helper: propagate changes and mark as internal so useEffect won't loop
  const propagate = useCallback((updated: StructuredDecision) => {
    setModel(updated);
    internalEditRef.current = true;
    onUpdateDecision(updated);
  }, [onUpdateDecision]);

  const handlePayoffChange = (altId: string, stateId: string, utility: number) => {
    const clamped = Math.max(0, Math.min(100, utility));
    const newPayoffs = model.payoff_matrix.map((p) => {
      if (p.alternative_id === altId && p.state_id === stateId) {
        return { ...p, utility: clamped };
      }
      return p;
    });
    const updated = { ...model, payoff_matrix: newPayoffs };
    propagate(updated);
  };

  const handleToggleLockState = (stateId: string) => {
    setLockedStates((prev) => ({ ...prev, [stateId]: !prev[stateId] }));
  };

  const handleProbabilityChange = (stateId: string, newProb: number) => {
    const clamped = Math.max(0, Math.min(1, newProb));
    const currentProb = model.states_of_world.find((s) => s.id === stateId)?.prior_probability ?? 0;
    const delta = clamped - currentProb;

    // Distribute delta among unlocked states if more than 1 unlocked exists
    const unlocked = model.states_of_world.filter((s) => s.id !== stateId && !lockedStates[s.id]);

    let newStates = model.states_of_world.map((s) => {
      if (s.id === stateId) return { ...s, prior_probability: clamped };
      return s;
    });

    if (unlocked.length > 0 && Math.abs(delta) > 0.001) {
      const share = delta / unlocked.length;
      newStates = newStates.map((s) => {
        if (s.id === stateId || lockedStates[s.id]) return s;
        const adjusted = Math.max(0, Math.min(1, s.prior_probability - share));
        return { ...s, prior_probability: Math.round(adjusted * 100) / 100 };
      });
    }

    const updated = { ...model, states_of_world: newStates };
    propagate(updated);
  };

  const handleNormalizeProbabilities = () => {
    const total = model.states_of_world.reduce((acc, s) => acc + s.prior_probability, 0);
    if (total <= 0) return;
    const normalized = model.states_of_world.map((s) => ({
      ...s,
      prior_probability: Math.round((s.prior_probability / total) * 100) / 100,
    }));
    // Fix rounding remainder: adjust last state so they sum to exactly 1.00
    const normTotal = normalized.reduce((acc, s) => acc + s.prior_probability, 0);
    const remainder = Math.round((1.0 - normTotal) * 100) / 100;
    if (remainder !== 0 && normalized.length > 0) {
      normalized[normalized.length - 1].prior_probability += remainder;
    }
    const updated = { ...model, states_of_world: normalized };
    propagate(updated);
  };

  const handleDecisionStatementChange = (text: string) => {
    const updated = { ...model, decision_statement: text };
    propagate(updated);
  };

  const handleToggleAssumptionTestable = (assumptionId: string) => {
    const updatedAssumptions = model.assumptions.map((a) => {
      if (a.id === assumptionId) {
        return { ...a, testable: !a.testable };
      }
      return a;
    });
    const updated = { ...model, assumptions: updatedAssumptions };
    propagate(updated);
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
    propagate(updated);
    setNewAssumptionText('');
  };

  const handleDeleteAssumption = (id: string) => {
    const updated = { ...model, assumptions: model.assumptions.filter((a) => a.id !== id) };
    propagate(updated);
  };

  const handleAddAlternative = () => {
    const newId = `alt_${Date.now()}`;
    const newAlt = {
      id: newId,
      name: `Alternative ${model.alternatives.length + 1}`,
      description: 'Custom added alternative option',
    };
    const newCells = model.states_of_world.map((st) => ({
      alternative_id: newId,
      state_id: st.id,
      utility: 50,
    }));
    const updated: StructuredDecision = {
      ...model,
      alternatives: [...model.alternatives, newAlt],
      payoff_matrix: [...model.payoff_matrix, ...newCells],
    };
    propagate(updated);
  };

  const handleRemoveAlternative = (altId: string) => {
    if (model.alternatives.length <= 2) return;
    const updated: StructuredDecision = {
      ...model,
      alternatives: model.alternatives.filter((a) => a.id !== altId),
      payoff_matrix: model.payoff_matrix.filter((p) => p.alternative_id !== altId),
    };
    propagate(updated);
  };

  const handleAddState = () => {
    const newId = `state_${Date.now()}`;
    const count = model.states_of_world.length + 1;
    const equalProb = Math.round((1.0 / count) * 100) / 100;
    const updatedStates = model.states_of_world.map((st) => ({
      ...st,
      prior_probability: equalProb,
    }));
    const remainder = Math.round((1.0 - (equalProb * count)) * 100) / 100;
    updatedStates.push({
      id: newId,
      name: `State ${count}`,
      prior_probability: equalProb + remainder,
    });
    const newCells = model.alternatives.map((alt) => ({
      alternative_id: alt.id,
      state_id: newId,
      utility: 50,
    }));
    const updated: StructuredDecision = {
      ...model,
      states_of_world: updatedStates,
      payoff_matrix: [...model.payoff_matrix, ...newCells],
    };
    propagate(updated);
  };

  const handleRemoveState = (stateId: string) => {
    if (model.states_of_world.length <= 2) return;
    const remaining = model.states_of_world.filter((s) => s.id !== stateId);
    const total = remaining.reduce((sum, s) => sum + s.prior_probability, 0);
    const rebalanced = remaining.map((s) => ({
      ...s,
      prior_probability: total > 0 ? Math.round((s.prior_probability / total) * 100) / 100 : Math.round((1 / remaining.length) * 100) / 100,
    }));
    const rem = Math.round((1.0 - rebalanced.reduce((sum, s) => sum + s.prior_probability, 0)) * 100) / 100;
    if (rem !== 0 && rebalanced.length > 0) {
      rebalanced[rebalanced.length - 1].prior_probability += rem;
    }
    const updated: StructuredDecision = {
      ...model,
      states_of_world: rebalanced,
      payoff_matrix: model.payoff_matrix.filter((p) => p.state_id !== stateId),
    };
    propagate(updated);
  };

  const totalProb = model.states_of_world.reduce((acc, s) => acc + s.prior_probability, 0);
  const isProbValid = Math.abs(totalProb - 1.0) < 0.01;

  const getPayoff = (altId: string, stateId: string): number => {
    const cell = model.payoff_matrix.find(
      (p) => p.alternative_id === altId && p.state_id === stateId
    );
    return cell ? cell.utility : 50;
  };

  // Compute live Expected Utility preview
  const liveEU = useMemo(() => {
    const map: Record<string, number> = {};
    model.alternatives.forEach((alt) => {
      let eu = 0;
      model.states_of_world.forEach((st) => {
        const cell = model.payoff_matrix.find(
          (p) => p.alternative_id === alt.id && p.state_id === st.id
        );
        const u = cell ? cell.utility : 50;
        eu += st.prior_probability * u;
      });
      map[alt.id] = eu;
    });
    return map;
  }, [model]);

  const leadingAlt = useMemo(() => {
    let bestId = '';
    let bestVal = -Infinity;
    Object.entries(liveEU).forEach(([id, val]) => {
      if (val > bestVal) {
        bestVal = val;
        bestId = id;
      }
    });
    const alt = model.alternatives.find((a) => a.id === bestId);
    return { alt, score: bestVal };
  }, [liveEU, model.alternatives]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6 animate-fade-in">
      {/* Top Navigation & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-display text-2xl font-semibold text-[var(--text-main)] tracking-tight">
              Examine & Calibrate Model Parameters
            </h2>
            {leadingAlt.alt && (
              <span className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-ui font-medium bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30">
                <TrendingUp className="w-3 h-3" />
                <span>Live Leading: <strong>{leadingAlt.alt.name}</strong></span>
                <span className="font-data font-bold">({leadingAlt.score.toFixed(1)} EU)</span>
              </span>
            )}
          </div>
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

      {/* Payoff Utility Matrix (Dual-mode: Grid Matrix vs Card Sliders) */}
      <div className="phronesis-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-sm sm:text-base text-[var(--text-main)] flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[var(--color-verdigris)]" />
              <span>Payoff Utility Matrix</span>
            </h3>
            <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
              Subjective satisfaction scores (0–100 scale) for each alternative under each world state.
            </p>
          </div>

          {/* View Mode Toggle Button */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs font-ui">
              <button
                type="button"
                onClick={() => setMatrixViewMode('table')}
                className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-all cursor-pointer ${
                  matrixViewMode === 'table'
                    ? 'bg-[var(--bg-surface-raised)] text-[var(--color-verdigris)] font-semibold shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Spreadsheet Table View (Tab-navigable)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid Table</span>
              </button>
              <button
                type="button"
                onClick={() => setMatrixViewMode('cards')}
                className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-all cursor-pointer ${
                  matrixViewMode === 'cards'
                    ? 'bg-[var(--bg-surface-raised)] text-[var(--color-verdigris)] font-semibold shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Slider Cards View"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Card Sliders</span>
              </button>
            </div>

            {matrixViewMode === 'cards' && (
              <button
                type="button"
                onClick={handleAddAlternative}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-medium bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] text-[var(--text-main)] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
                <span>Add Alternative</span>
              </button>
            )}
          </div>
        </div>

        {/* Render selected view mode */}
        {matrixViewMode === 'table' ? (
          <PayoffMatrixGrid
            model={model}
            onPayoffChange={handlePayoffChange}
            onAddAlternative={handleAddAlternative}
            onRemoveAlternative={handleRemoveAlternative}
            onAddState={handleAddState}
            onRemoveState={handleRemoveState}
          />
        ) : (
          <div className="space-y-4 pt-2">
            {model.alternatives.map((alt) => (
              <div
                key={alt.id}
                className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-3"
              >
                <div className="flex items-start justify-between">
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
                  {model.alternatives.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAlternative(alt.id)}
                      title="Remove alternative (minimum 2 required)"
                      className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {model.states_of_world.map((st) => {
                    const val = getPayoff(alt.id, st.id);
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
        )}
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
              Your estimated likelihood for each state of the world. Must sum to 100%. Lock states to preserve their values while adjusting others.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAddState}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-ui bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] text-[var(--text-main)] transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3 text-[var(--color-verdigris)]" />
              <span>Add State</span>
            </button>
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
          {model.states_of_world.map((st) => {
            const isLocked = !!lockedStates[st.id];

            return (
              <div
                key={st.id}
                className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleToggleLockState(st.id)}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        isLocked
                          ? 'bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)]'
                          : 'text-[var(--text-faint)] hover:text-[var(--text-main)]'
                      }`}
                      title={isLocked ? 'Unlock state probability' : 'Lock state probability'}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <span className="font-ui font-medium text-[var(--text-main)]">{st.name}</span>
                    {model.states_of_world.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveState(st.id)}
                        title="Remove state (minimum 2 required)"
                        className="p-0.5 rounded text-[var(--text-muted)] hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(st.prior_probability * 100)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleProbabilityChange(st.id, Math.max(0, Math.min(100, val)) / 100);
                      }}
                      className="w-12 h-6 text-center font-data font-bold text-xs matrix-cell-input"
                    />
                    <span className="font-data text-xs text-[var(--color-verdigris)]">%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={st.prior_probability}
                  disabled={isLocked}
                  onChange={(e) => handleProbabilityChange(st.id, parseFloat(e.target.value))}
                  className={`w-full h-1.5 bg-[var(--bg-surface)] rounded-lg appearance-none cursor-pointer accent-[var(--color-verdigris)] border border-[var(--border-subtle)] ${
                    isLocked ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            );
          })}
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
