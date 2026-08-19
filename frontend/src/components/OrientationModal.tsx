import React from 'react';
import {
  Compass,
  Scale,
  FlaskConical,
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface OrientationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrientationModal: React.FC<OrientationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-2xl p-6 space-y-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] text-xs font-ui font-medium">
              <Compass className="w-3.5 h-3.5" />
              <span>Welcome to Phronesis (φρόνησις)</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text-main)]">
              Auditable Human Judgment
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
            aria-label="Close orientation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Core Principles */}
        <div className="space-y-3.5 text-xs font-ui">
          <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-semibold text-[var(--text-main)] text-sm">
                1. No Prescriptive Advice
              </h3>
              <p className="font-body text-[var(--text-muted)] leading-relaxed">
                Phronesis will never command you what to choose ("You should pick X"). It audits your own reasoning model, exposing trade-offs rather than forcing a verdict.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-semibold text-[var(--text-main)] text-sm">
                2. Four Deterministic Lenses
              </h3>
              <p className="font-body text-[var(--text-muted)] leading-relaxed">
                Every dilemma runs through <strong>Decision Math</strong> (Expected Utility & Regret), <strong>Psychology</strong> (Cognitive Biases), <strong>Philosophy</strong> (Stoic, Utilitarian, Kantian, Virtue), and <strong>Critical Thinking</strong>.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--color-ochre)]/30 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] shrink-0">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-semibold text-[var(--color-ochre)] text-sm">
                3. Value of Information (VoI)
              </h3>
              <p className="font-body text-[var(--text-muted)] leading-relaxed">
                Rather than agonizing over guesses, the report identifies your single most sensitive uncertainty and suggests a low-cost 48-hour experiment to test it before committing.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
          <span className="text-[11px] font-body text-[var(--text-faint)]">
            This guide won't show again, but is accessible anytime via ⌘K.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl btn-verdigris font-ui font-medium text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <span>Begin Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
