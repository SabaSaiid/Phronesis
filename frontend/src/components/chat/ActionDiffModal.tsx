import React from 'react';
import type { StructuredDecision } from '../../types';
import {
  X,
  Check,
  AlertCircle,
  GitCommit
} from 'lucide-react';

interface ProposedDiff {
  type: 'add_alternative' | 'add_assumption' | 'adjust_probability' | 'custom';
  title: string;
  description: string;
  currentValue?: string;
  proposedValue: string;
  apply: (current: StructuredDecision) => StructuredDecision;
}

interface ActionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  diff: ProposedDiff | null;
  currentModel: StructuredDecision;
  onApply: (updated: StructuredDecision) => void;
}

export const ActionDiffModal: React.FC<ActionDiffModalProps> = ({
  isOpen,
  onClose,
  diff,
  currentModel,
  onApply,
}) => {
  if (!isOpen || !diff) return null;

  const handleApply = () => {
    const updated = diff.apply(currentModel);
    onApply(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                Review Proposed Model Modification
              </h3>
              <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
                Inspect AI-suggested changes to your decision parameters before applying.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Change description */}
        <div className="space-y-3">
          <div className="font-ui font-semibold text-sm text-[var(--text-main)]">
            {diff.title}
          </div>
          <p className="font-body text-xs text-[var(--text-muted)] leading-relaxed">
            {diff.description}
          </p>

          {/* Before & After Visual Diff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                Current Model
              </span>
              <div className="text-xs font-body text-[var(--text-muted)] line-through">
                {diff.currentValue || '(None / Not present)'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-verdigris)] font-semibold">
                Proposed Change
              </span>
              <div className="text-xs font-body font-semibold text-[var(--text-main)]">
                {diff.proposedValue}
              </div>
            </div>
          </div>
        </div>

        {/* Warning / Audit Notice */}
        <div className="p-3 rounded-xl bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/20 flex items-start space-x-2 text-xs font-body text-[var(--text-main)]">
          <AlertCircle className="w-4 h-4 text-[var(--color-ochre)] shrink-0 mt-0.5" />
          <span>
            Applying this modification will update the active decision model and invalidate previous downstream audit conclusions.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-ui bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            Reject Change
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded-xl text-xs font-ui font-medium btn-verdigris shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Modification</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export type { ProposedDiff };
