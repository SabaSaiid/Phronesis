import React, { useState } from 'react';
import type { StructuredDecision } from '../../types';
import { Play, Sliders, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ModelEditorViewProps {
  decision: StructuredDecision;
  onUpdateDecision: (updated: StructuredDecision) => void;
  onRunAnalysis: () => Promise<void>;
  onBackToInput: () => void;
  isLoading: boolean;
}

export const ModelEditorView: React.FC<ModelEditorViewProps> = ({
  decision,
  onUpdateDecision,
  onRunAnalysis,
  onBackToInput,
  isLoading,
}) => {
  const [model, setModel] = useState<StructuredDecision>(JSON.parse(JSON.stringify(decision)));

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

  const totalProb = model.states_of_world.reduce((acc, s) => acc + s.prior_probability, 0);
  const isProbValid = Math.abs(totalProb - 1.0) < 0.01;

  const getPayoff = (altId: string, stateId: string): number => {
    const cell = model.payoff_matrix.find(
      (p) => p.alternative_id === altId && p.state_id === stateId
    );
    return cell ? cell.utility : 50;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-mono font-medium mb-1">
            <span>Human-in-the-Loop Review</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Examine & Refine Decision Model
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Verify extracted alternatives, probability priors, and payoff utilities before deterministic analysis runs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToInput}
            className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-space-900 border border-slate-800 transition-colors"
          >
            ← Edit Narrative
          </button>
          
          <button
            onClick={onRunAnalysis}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Running Engines...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Reasoning Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Decision Statement Card */}
      <div className="glass-panel p-5 rounded-2xl space-y-2 border border-slate-800">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Decision Statement
        </label>
        <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
          {model.decision_statement}
        </p>
      </div>

      {/* Payoff Utility Matrix (Alternatives x States) */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-base text-slate-100 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-brand-400" />
              <span>Payoff Utility Matrix (0 - 100 Scale)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Subjective satisfaction score for each alternative under each state of the world.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-3 px-4 font-medium w-1/3">Alternative Path</th>
                {model.states_of_world.map((s) => (
                  <th key={s.id} className="py-3 px-4 font-medium">
                    <div className="space-y-0.5">
                      <div className="text-slate-200">{s.name}</div>
                      <div className="text-xs text-brand-400 font-mono">
                        P = {Math.round(s.prior_probability * 100)}%
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {model.alternatives.map((alt) => (
                <tr key={alt.id} className="hover:bg-space-900/40 transition-colors">
                  <td className="py-4 px-4 align-top">
                    <div className="font-semibold text-slate-200">{alt.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{alt.description}</div>
                  </td>
                  {model.states_of_world.map((st) => {
                    const val = getPayoff(alt.id, st.id);
                    return (
                      <td key={st.id} className="py-4 px-4 align-middle">
                        <div className="space-y-2 min-w-[140px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-300">
                              {val} / 100
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              val >= 75 ? 'bg-sage-500/20 text-sage-300' : val >= 45 ? 'bg-brand-500/20 text-brand-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {val >= 75 ? 'High Upside' : val >= 45 ? 'Moderate' : 'Low Downside'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={val}
                            onChange={(e) => handlePayoffChange(alt.id, st.id, Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Probabilities Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-slate-100">
              State Prior Probabilities
            </h3>
            <p className="text-xs text-slate-400">
              Must sum to 1.0 (100%). Drag sliders or use auto-normalize.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono ${
              isProbValid ? 'bg-sage-500/10 text-sage-400 border border-sage-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {isProbValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>Sum: {Math.round(totalProb * 100)}%</span>
            </div>

            {!isProbValid && (
              <button
                onClick={handleNormalizeProbabilities}
                className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                Auto-Normalize to 100%
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {model.states_of_world.map((st) => (
            <div key={st.id} className="p-4 rounded-xl bg-space-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{st.name}</span>
                <span className="font-mono text-brand-400 font-bold">
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
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Assumptions, Goals & Constraints */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assumptions */}
        <div className="glass-panel p-5 rounded-xl space-y-3 border border-slate-800">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Stated Assumptions</span>
            <span className="text-[10px] font-mono text-slate-500">{model.assumptions.length}</span>
          </h4>
          <div className="space-y-2">
            {model.assumptions.map((a) => (
              <div key={a.id} className="p-2.5 rounded-lg bg-space-950/60 border border-slate-800/60 text-xs space-y-1">
                <p className="text-slate-200">{a.text}</p>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                  <span className={`px-1.5 py-0.2 rounded ${a.testable ? 'bg-sage-500/10 text-sage-400' : 'bg-slate-800 text-slate-400'}`}>
                    {a.testable ? 'Empirical / Testable' : 'Value Judgment'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="glass-panel p-5 rounded-xl space-y-3 border border-slate-800">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Explicit Goals</span>
            <span className="text-[10px] font-mono text-slate-500">{model.goals.length}</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {model.goals.map((g, i) => (
              <li key={i} className="p-2.5 rounded-lg bg-space-950/60 border border-slate-800/60 flex items-start space-x-2">
                <span className="text-brand-400 font-bold">•</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Constraints */}
        <div className="glass-panel p-5 rounded-xl space-y-3 border border-slate-800">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Hard Constraints</span>
            <span className="text-[10px] font-mono text-slate-500">{model.constraints.length}</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {model.constraints.map((c, i) => (
              <li key={i} className="p-2.5 rounded-lg bg-space-950/60 border border-slate-800/60 flex items-start space-x-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
