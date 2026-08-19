import React from 'react';
import {
  Scale,
  Shield,
  Compass,
  X,
  FlaskConical,
  CheckCircle2
} from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-2xl p-6 space-y-6 animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] text-xs font-ui font-medium">
              <Compass className="w-3.5 h-3.5" />
              <span>Phronesis (φρόνησις) Architecture</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text-main)]">
              Methodology & Theoretical Lineage
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
            aria-label="Close methodology modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="space-y-4 text-xs font-ui">
          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-[var(--text-main)] text-sm">
                1. Deterministic Math
              </h3>
            </div>
            <p className="font-body text-[var(--text-muted)] leading-relaxed text-xs">
              Expected utility, minimax regret, and inflection threshold formulas run through pure Python closed-form algebraic solvers. No LLM hallucinations in numeric calculation or probability balancing.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px] text-[var(--text-faint)]">
              <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">Expected Utility (EU)</span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">Savage Minimax Regret</span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">Threshold Sensitivity</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-[var(--text-main)] text-sm">
                2. Sourced Lineage
              </h3>
            </div>
            <p className="font-body text-[var(--text-muted)] leading-relaxed text-xs">
              Every cognitive bias pattern and philosophy lens is explicitly grounded with academic literature citations. We audit your reasoning against Nobel-laureate heuristics (Kahneman & Tversky), empirical forecasting (Tetlock), and classical philosophical traditions (Stoic, Utilitarian, Kantian, Virtue Ethics).
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px] text-[var(--text-faint)]">
              <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">15 Bias Detectors</span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">Peer-Reviewed Citations</span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">4 Ethical Frameworks</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--color-ochre)]/30 space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)]">
                <FlaskConical className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-[var(--color-ochre)] text-sm">
                3. Value of Information (VoI)
              </h3>
            </div>
            <p className="font-body text-[var(--text-muted)] leading-relaxed text-xs">
              Rather than forcing premature commitment under high uncertainty, Phronesis isolates the single variable with the highest decision inflection leverage and designs a concrete, low-cost 48-hour falsification test.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px] text-[var(--text-faint)]">
              <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">Inflection Detection</span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">48-Hour Experiment Design</span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">Falsifiable Assumptions</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 flex items-center justify-between border-t border-[var(--border-subtle)]">
          <div className="flex items-center space-x-2 text-[11px] text-[var(--text-faint)] font-ui">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
            <span>Local & Private · Zero Cloud Database Leakage</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl btn-verdigris font-ui font-medium text-xs cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
