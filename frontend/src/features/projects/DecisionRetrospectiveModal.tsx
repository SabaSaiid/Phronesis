import React, { useState } from 'react';
import {
  X,
  History,
  Check
} from 'lucide-react';
import { recordOutcome } from '../../lib/api';
import { useToast } from '../../components/useToast';

interface DecisionRetrospectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionId: string;
  decisionTitle: string;
  alternatives: { id: string; name: string }[];
  onSuccess: () => void;
}

export const DecisionRetrospectiveModal: React.FC<DecisionRetrospectiveModalProps> = ({
  isOpen,
  onClose,
  decisionId,
  decisionTitle,
  alternatives,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [chosenAltId, setChosenAltId] = useState<string>(alternatives[0]?.id || '');
  const [actualUtility, setActualUtility] = useState<number>(75);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenAltId) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Please select which alternative was executed.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await recordOutcome(decisionId, {
        chosen_alternative_id: chosenAltId,
        actual_utility_rating: actualUtility,
        retrospective_notes: notes.trim() || undefined,
      });
      showToast({
        type: 'success',
        title: 'Outcome Recorded',
        description: 'Retrospective calibration data logged for longitudinal intelligence.',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Record Failed',
        description: err.message || 'Failed to submit retrospective outcome.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                Log Decision Retrospective
              </h3>
              <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
                Record the real-world outcome to track your epistemic calibration over time.
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

        {/* Target Decision Statement */}
        <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs font-body text-[var(--text-muted)]">
          Decision: <strong className="text-[var(--text-main)] font-ui">{decisionTitle}</strong>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chosen Alternative */}
          <div className="space-y-1.5">
            <label className="font-ui text-xs font-semibold text-[var(--text-main)]">
              Which alternative was executed in reality?
            </label>
            <select
              value={chosenAltId}
              onChange={(e) => setChosenAltId(e.target.value)}
              className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-2.5 text-xs font-ui text-[var(--text-main)] focus:border-[var(--color-verdigris)] focus:outline-none"
            >
              {alternatives.map((alt) => (
                <option key={alt.id} value={alt.id}>
                  {alt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Realized Utility Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-ui font-semibold text-[var(--text-main)]">
                Realized Satisfaction / Utility Score
              </label>
              <span className="font-data font-bold text-sm text-[var(--color-verdigris)]">
                {actualUtility} / 100
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={actualUtility}
              onChange={(e) => setActualUtility(Number(e.target.value))}
              className="w-full h-1.5 bg-[var(--bg-app)] rounded-lg appearance-none cursor-pointer accent-[var(--color-verdigris)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-faint)] font-ui">
              <span>0 (Complete Failure)</span>
              <span>50 (Moderate Success)</span>
              <span>100 (Flawless Execution)</span>
            </div>
          </div>

          {/* Retrospective Notes & Lessons Learned */}
          <div className="space-y-1.5">
            <label className="font-ui text-xs font-semibold text-[var(--text-main)]">
              Lessons Learned & Observed Blind Spots
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What surprised you? Did an unmodeled risk manifest? What would you do differently?"
              className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-3 text-xs font-body text-[var(--text-main)] leading-relaxed focus:border-[var(--color-verdigris)] focus:outline-none resize-y placeholder:text-[var(--text-faint)]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-ui bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-ui font-medium btn-verdigris shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Retrospective</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
