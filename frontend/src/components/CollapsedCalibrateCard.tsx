import React from 'react';
import { Sliders, Edit3, CheckCircle2, Scale } from 'lucide-react';
import type { StructuredDecision } from '../types';

interface CollapsedCalibrateCardProps {
  decision: StructuredDecision;
  onEdit: () => void;
  isEditDisabled?: boolean;
}

export const CollapsedCalibrateCard: React.FC<CollapsedCalibrateCardProps> = ({
  decision,
  onEdit,
  isEditDisabled,
}) => {
  const totalProb = decision.states_of_world.reduce((acc, s) => acc + s.prior_probability, 0);
  const isProbValid = Math.abs(totalProb - 1.0) < 0.01;

  return (
    <section id="section-calibrate" className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      <div className="phronesis-card p-4 sm:p-5 space-y-3 relative border-l-2 border-[var(--color-verdigris)]/40">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              2. Model Calibration
            </span>
            <span className="text-[10px] font-mono text-[var(--text-faint)] bg-[var(--bg-app)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
              Completed
            </span>
          </div>

          <button
            type="button"
            onClick={onEdit}
            disabled={isEditDisabled}
            className="px-2.5 py-1 rounded-lg text-xs font-ui font-medium text-[var(--color-verdigris)] hover:bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Re-edit calibration (will regenerate the audit report)"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        {/* Summary Stats Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-ui">
          {/* Decision Statement */}
          <div className="text-sm font-body text-[var(--text-main)] leading-relaxed w-full truncate">
            <span className="text-[var(--text-muted)] font-ui text-xs">Decision: </span>
            {decision.decision_statement}
          </div>

          {/* Alternatives Count */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-app)] border border-[var(--border-subtle)]">
            <Scale className="w-3 h-3 text-[var(--color-verdigris)]" />
            <span className="text-[var(--text-main)] font-medium">
              {decision.alternatives.length} alternative{decision.alternatives.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* States Count */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-app)] border border-[var(--border-subtle)]">
            <span className="text-[var(--text-main)] font-medium">
              {decision.states_of_world.length} state{decision.states_of_world.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Probability Status */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-data ${
              isProbValid
                ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30'
                : 'bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] border border-[var(--color-ochre)]/30'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Priors: {Math.round(totalProb * 100)}%</span>
          </div>

          {/* Assumptions Count */}
          {decision.assumptions.length > 0 && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-app)] border border-[var(--border-subtle)]">
              <span className="text-[var(--text-main)] font-medium">
                {decision.assumptions.length} assumption{decision.assumptions.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Alternatives Preview */}
        <div className="flex flex-wrap gap-2">
          {decision.alternatives.map((alt) => (
            <span
              key={alt.id}
              className="px-2.5 py-1 rounded-lg text-[11px] font-ui font-medium bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)]"
            >
              {alt.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
