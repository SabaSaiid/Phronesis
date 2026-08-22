import React, { useState, useEffect, useRef } from 'react';
import { Gauge, ChevronDown, Check, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';
import type { EffortLevel } from '../types';

interface EffortSelectorProps {
  value: EffortLevel;
  onChange: (effort: EffortLevel) => void;
  disabled?: boolean;
}

interface EffortOption {
  id: EffortLevel;
  label: string;
  sublabel: string;
  badge: string;
  icon: React.ElementType;
}

const EFFORT_OPTIONS: EffortOption[] = [
  {
    id: 'quick',
    label: 'Quick Pass',
    sublabel: 'Crisp summaries, latency < 2s, skips counterarg pass',
    badge: 'Fast',
    icon: Zap,
  },
  {
    id: 'standard',
    label: 'Standard',
    sublabel: 'Balanced depth following your Focus Mode selections',
    badge: 'Default',
    icon: Layers,
  },
  {
    id: 'thorough',
    label: 'Thorough Pass',
    sublabel: 'Extended multi-paragraph analysis + multi-thesis counterargs',
    badge: 'Deep',
    icon: Sparkles,
  },
];

export const EffortSelector: React.FC<EffortSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption = EFFORT_OPTIONS.find((o) => o.id === value) || EFFORT_OPTIONS[1];

  const handleSelectEffort = (effort: EffortLevel) => {
    onChange(effort);
    try {
      localStorage.setItem('phronesis_preferred_effort', effort);
    } catch {
      /* noop */
    }
    setIsOpen(false);
  };

  const IconComponent = activeOption.icon;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Pill Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-ui transition-all border cursor-pointer ${
          isOpen
            ? 'bg-[var(--bg-surface-raised)] border-[var(--color-verdigris)] shadow-xs ring-1 ring-[var(--color-verdigris)]/30 text-[var(--text-main)]'
            : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border-[var(--border-subtle)] hover:border-[var(--border-medium)] text-[var(--text-main)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Reasoning Effort & Synthesis Depth"
        aria-expanded={isOpen}
      >
        <IconComponent className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
        <span className="font-medium">{activeOption.label}</span>
        <ChevronDown
          className={`w-3 h-3 text-[var(--text-faint)] transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1.5 sm:bottom-auto sm:top-full sm:mt-1.5 z-50 w-76 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] shadow-[var(--shadow-elevated)] p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 border-b border-[var(--border-subtle)]">
            <div className="text-[11px] font-ui font-semibold text-[var(--text-main)] flex items-center space-x-1.5">
              <Gauge className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
              <span>Reasoning Depth & Compute Budget</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-body leading-tight mt-0.5">
              Sets global synthesis depth. Focus Mode layer selections further refine depth.
            </div>
          </div>

          <div className="space-y-1 py-1">
            {EFFORT_OPTIONS.map((opt) => {
              const isSelected = value === opt.id;
              const OptIcon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectEffort(opt.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-start justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30'
                      : 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-start space-x-2 min-w-0 pr-2">
                    <div className="mt-0.5 shrink-0">
                      <OptIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--color-verdigris)]' : 'text-[var(--text-muted)]'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-ui font-medium leading-tight">
                          {opt.label}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-app)] text-[var(--text-faint)] border border-[var(--border-subtle)]">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] font-body leading-snug mt-0.5">
                        {opt.sublabel}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[var(--color-verdigris)] stroke-[2.5]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-[var(--border-subtle)] px-2 py-1.5 flex items-center space-x-1.5 text-[10px] text-[var(--color-verdigris)] font-ui">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Guardrail audit passes run with 100% rigor across all modes.</span>
          </div>
        </div>
      )}
    </div>
  );
};
