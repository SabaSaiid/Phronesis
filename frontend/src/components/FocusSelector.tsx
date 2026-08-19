import React from 'react';
import type { FocusConfig, FocusLayerId } from '../types';
import {
  Brain,
  Sparkles,
  Compass,
  Scale,
  Check,
  Layers,
  Info
} from 'lucide-react';

interface FocusSelectorProps {
  value: FocusConfig;
  onChange: (config: FocusConfig) => void;
}

interface FocusOption {
  id: FocusLayerId;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

const FOCUS_OPTIONS: FocusOption[] = [
  {
    id: 'psychology',
    label: 'Psychology',
    sublabel: 'Check my reasoning for bias',
    icon: Brain,
  },
  {
    id: 'logic',
    label: 'Logic',
    sublabel: 'Stress-test my assumptions',
    icon: Sparkles,
  },
  {
    id: 'philosophy',
    label: 'Philosophy',
    sublabel: 'Weigh this against values and meaning',
    icon: Compass,
  },
  {
    id: 'practical',
    label: 'Practical',
    sublabel: 'Just show me the numbers',
    icon: Scale,
  },
];

const PHILOSOPHY_FRAMEWORKS = [
  { id: 'stoicism_v1', label: 'Stoicism', description: 'Agency & Dichotomy of Control' },
  { id: 'utilitarianism_v1', label: 'Utilitarianism', description: 'Consequentialist Stakeholder Balance' },
  { id: 'kantian_deontology_v1', label: 'Kantian Deontology', description: 'Universalizability & Duty' },
  { id: 'virtue_ethics_v1', label: 'Virtue Ethics', description: 'Character Cultivation & Golden Mean' },
];

export const FocusSelector: React.FC<FocusSelectorProps> = ({ value, onChange }) => {
  const { focused_layers, philosophy_frameworks = [] } = value;

  const isBalanced = focused_layers.length === 4;

  const handleToggleLayer = (id: FocusLayerId) => {
    let nextLayers: FocusLayerId[];
    if (focused_layers.includes(id)) {
      // Don't allow deselecting the last remaining one if user wants some focus, but if all deselected, fallback to balanced
      nextLayers = focused_layers.filter((l) => l !== id);
      if (nextLayers.length === 0) {
        nextLayers = ['psychology', 'logic', 'philosophy', 'practical'];
      }
    } else {
      nextLayers = [...focused_layers, id];
    }
    onChange({
      ...value,
      focused_layers: nextLayers,
    });
  };

  const handleSetBalanced = () => {
    onChange({
      focused_layers: ['psychology', 'logic', 'philosophy', 'practical'],
      philosophy_frameworks: [],
    });
  };

  const handleTogglePhilosophyFramework = (fwId: string) => {
    let nextFws: string[];
    if (philosophy_frameworks.includes(fwId)) {
      nextFws = philosophy_frameworks.filter((f) => f !== fwId);
    } else {
      nextFws = [...philosophy_frameworks, fwId];
    }
    onChange({
      ...value,
      philosophy_frameworks: nextFws,
    });
  };

  const isPhilosophyActive = focused_layers.includes('philosophy');

  return (
    <div className="phronesis-card p-5 sm:p-6 space-y-4">
      {/* Header with Title & Balanced Preset Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[var(--color-verdigris)]" />
            <h3 className="font-display font-semibold text-sm sm:text-base text-[var(--text-main)]">
              Analytical Focus & Depth Steering
            </h3>
          </div>
          <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
            Choose which lenses to foreground first in the dossier. All 4 engines always execute in full.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSetBalanced}
            className={`px-2.5 py-1 rounded-lg text-xs font-ui transition-all cursor-pointer ${
              isBalanced
                ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/40 font-medium'
                : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
            }`}
          >
            {isBalanced ? '✓ Balanced (All 4)' : 'Reset to Balanced'}
          </button>
        </div>
      </div>

      {/* Selectable Focus Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {FOCUS_OPTIONS.map((opt) => {
          const isSelected = focused_layers.includes(opt.id);
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleToggleLayer(opt.id)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-start space-x-3 group relative ${
                isSelected
                  ? 'bg-[var(--color-verdigris-subtle)]/70 border-[var(--color-verdigris)] shadow-xs ring-1 ring-[var(--color-verdigris)]/30'
                  : 'bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-[var(--border-medium)] opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[var(--color-verdigris)] text-white shadow-2xs'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0 pr-5">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`font-ui font-semibold text-xs sm:text-sm ${
                      isSelected ? 'text-[var(--text-main)]' : 'text-[var(--text-main)]'
                    }`}
                  >
                    {opt.label}
                  </span>
                </div>
                <p className="font-body text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
                  "{opt.sublabel}"
                </p>
              </div>

              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[var(--color-verdigris)] border-[var(--color-verdigris)] text-white'
                    : 'border-[var(--border-medium)] bg-[var(--bg-surface)]'
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Secondary Selector: Specific Philosophy Frameworks to Foreground */}
      {isPhilosophyActive && (
        <div className="pt-2 animate-fade-in">
          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--color-verdigris)]/30 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-ui font-semibold text-[var(--color-verdigris)] flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Foreground Specific Ethical Framework(s):</span>
              </span>
              <span className="text-[11px] font-body text-[var(--text-faint)]">
                {philosophy_frameworks.length === 0 ? 'All 4 Lenses in Rotation' : `${philosophy_frameworks.length} Selected`}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {PHILOSOPHY_FRAMEWORKS.map((fw) => {
                const isFwSelected = philosophy_frameworks.includes(fw.id);
                return (
                  <button
                    key={fw.id}
                    type="button"
                    onClick={() => handleTogglePhilosophyFramework(fw.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-ui transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isFwSelected
                        ? 'bg-[var(--color-verdigris)] text-white shadow-2xs font-medium'
                        : 'bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)]'
                    }`}
                    title={fw.description}
                  >
                    <span>{fw.label}</span>
                    {isFwSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Auditability Guarantee Notice */}
      <div className="flex items-center space-x-1.5 text-[11px] font-ui text-[var(--text-faint)] pt-1">
        <Info className="w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0" />
        <span>
          <strong>Auditability Guarantee:</strong> Unselected layers are never skipped; they render collapsed below with full underlying computations preserved.
        </span>
      </div>
    </div>
  );
};
