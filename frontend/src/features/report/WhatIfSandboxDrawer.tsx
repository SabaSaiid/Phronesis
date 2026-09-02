import React, { useState, useMemo, useEffect } from 'react';
import type { StructuredDecision } from '../../types';
import {
  X,
  Sparkles,
  RotateCcw,
  Check,
  Sliders,
  Scale
} from 'lucide-react';

interface WhatIfSandboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  model: StructuredDecision;
  onApplyToModel?: (updated: StructuredDecision) => void;
}

export const WhatIfSandboxDrawer: React.FC<WhatIfSandboxDrawerProps> = ({
  isOpen,
  onClose,
  model,
  onApplyToModel,
}) => {
  const [sandboxModel, setSandboxModel] = useState<StructuredDecision>(() =>
    JSON.parse(JSON.stringify(model))
  );

  useEffect(() => {
    if (isOpen) {
      setSandboxModel(JSON.parse(JSON.stringify(model)));
    }
  }, [isOpen, model]);

  const handleReset = () => {
    setSandboxModel(JSON.parse(JSON.stringify(model)));
  };

  const handleProbChange = (stateId: string, prob: number) => {
    const clamped = Math.max(0, Math.min(1, prob));
    setSandboxModel((prev) => ({
      ...prev,
      states_of_world: prev.states_of_world.map((s) =>
        s.id === stateId ? { ...s, prior_probability: clamped } : s
      ),
    }));
  };

  const handlePayoffChange = (altId: string, stateId: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setSandboxModel((prev) => ({
      ...prev,
      payoff_matrix: prev.payoff_matrix.map((p) =>
        p.alternative_id === altId && p.state_id === stateId ? { ...p, utility: clamped } : p
      ),
    }));
  };

  // Compute baseline EU
  const baselineEU = useMemo(() => {
    const map: Record<string, number> = {};
    model.alternatives.forEach((alt) => {
      let eu = 0;
      model.states_of_world.forEach((st) => {
        const cell = model.payoff_matrix.find(
          (p) => p.alternative_id === alt.id && p.state_id === st.id
        );
        eu += st.prior_probability * (cell ? cell.utility : 50);
      });
      map[alt.id] = eu;
    });
    return map;
  }, [model]);

  // Compute sandbox EU
  const sandboxEU = useMemo(() => {
    const map: Record<string, number> = {};
    const totalProb = sandboxModel.states_of_world.reduce((s, st) => s + st.prior_probability, 0) || 1;
    sandboxModel.alternatives.forEach((alt) => {
      let eu = 0;
      sandboxModel.states_of_world.forEach((st) => {
        const cell = sandboxModel.payoff_matrix.find(
          (p) => p.alternative_id === alt.id && p.state_id === st.id
        );
        // Normalize against total prob if user adjusted
        const normProb = st.prior_probability / totalProb;
        eu += normProb * (cell ? cell.utility : 50);
      });
      map[alt.id] = eu;
    });
    return map;
  }, [sandboxModel]);

  const bestSandboxAlt = useMemo(() => {
    let bestId = '';
    let bestVal = -Infinity;
    Object.entries(sandboxEU).forEach(([id, val]) => {
      if (val > bestVal) {
        bestVal = val;
        bestId = id;
      }
    });
    return sandboxModel.alternatives.find((a) => a.id === bestId);
  }, [sandboxEU, sandboxModel.alternatives]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl h-full bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-raised)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 text-[var(--color-ochre)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                What-If Perturbation Sandbox
              </h3>
              <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
                Stress-test how prior probabilities or payoffs alter the leading recommendation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Perturbation Workspace */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Real-time Outcome Delta Banner */}
          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-ui font-semibold text-xs text-[var(--text-main)] uppercase tracking-wider">
                Live Expected Utility Comparison
              </span>
              {bestSandboxAlt && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 font-ui font-semibold text-[11px]">
                  Winner: {bestSandboxAlt.name}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {sandboxModel.alternatives.map((alt) => {
                const sEU = sandboxEU[alt.id] ?? 0;
                const bEU = baselineEU[alt.id] ?? 0;
                const delta = sEU - bEU;

                return (
                  <div key={alt.id} className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <div className="font-ui font-semibold text-[var(--text-main)]">{alt.name}</div>
                      <div className="text-[10px] text-[var(--text-faint)]">
                        Baseline: {bEU.toFixed(1)} EU
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-data font-bold text-sm text-[var(--text-main)]">
                        {sEU.toFixed(1)} EU
                      </div>
                      <div className={`text-[11px] font-data font-semibold ${
                        delta > 0.1 ? 'text-[var(--color-verdigris)]' : delta < -0.1 ? 'text-rose-500' : 'text-[var(--text-faint)]'
                      }`}>
                        {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 1: Probability Sliders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-ui font-semibold text-xs text-[var(--text-main)]">
              <span className="flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
                <span>Perturb State Prior Likelihoods</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {sandboxModel.states_of_world.map((st) => (
                <div key={st.id} className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-ui text-[var(--text-main)]">{st.name}</span>
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
                    onChange={(e) => handleProbChange(st.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[var(--bg-surface)] rounded-lg appearance-none cursor-pointer accent-[var(--color-verdigris)]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Payoffs per Alternative */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-ui font-semibold text-xs text-[var(--text-main)]">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-[var(--color-ochre)]" />
                <span>Perturb Alternative Payoffs</span>
              </span>
            </div>

            <div className="space-y-3">
              {sandboxModel.alternatives.map((alt) => (
                <div key={alt.id} className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
                  <div className="font-ui font-semibold text-[var(--text-main)]">{alt.name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {sandboxModel.states_of_world.map((st) => {
                      const cell = sandboxModel.payoff_matrix.find(
                        (p) => p.alternative_id === alt.id && p.state_id === st.id
                      );
                      const val = cell ? cell.utility : 50;

                      return (
                        <div key={st.id} className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--text-muted)] truncate">{st.name}</span>
                            <span className="font-data font-bold text-[var(--color-ochre)]">{val}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={val}
                            onChange={(e) => handlePayoffChange(alt.id, st.id, Number(e.target.value))}
                            className="w-full h-1 bg-[var(--bg-app)] rounded appearance-none cursor-pointer accent-[var(--color-ochre)]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-ui bg-[var(--bg-surface)] hover:bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline</span>
          </button>

          {onApplyToModel && (
            <button
              type="button"
              onClick={() => {
                onApplyToModel(sandboxModel);
                onClose();
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-ui font-medium btn-verdigris shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Perturbations to Model</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
