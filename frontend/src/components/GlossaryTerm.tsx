import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

export const GLOSSARY_DEFINITIONS: Record<string, { term: string; definition: string; category?: string }> = {
  'Expected Utility': {
    term: 'Expected Utility (EU)',
    definition: 'A mathematical weighted average of subjective satisfaction scores, calculated by multiplying each outcome utility by its prior probability.',
    category: 'Decision Theory',
  },
  'Minimax Regret': {
    term: 'Minimax Regret',
    definition: 'A decision rule that minimizes the worst-case missed opportunity across all future states, prioritizing downside regret avoidance over upside gambling.',
    category: 'Decision Theory',
  },
  'Sensitivity Threshold': {
    term: 'Sensitivity Threshold (p*)',
    definition: 'The precise probability or payoff boundary where the mathematically favored alternative flips to another choice.',
    category: 'Sensitivity Analysis',
  },
  'Value of Information': {
    term: 'Value of Information (VoI)',
    definition: 'The strategic benefit of conducting a low-cost empirical test to reduce key uncertainty before executing an irreversible commitment.',
    category: 'Decision Strategy',
  },
  'Prohairesis': {
    term: 'Prohairesis (Moral Agency)',
    definition: 'The Stoic concept of reasoned faculty of choice—the only realm truly within your absolute and inviolable control.',
    category: 'Stoic Ethics',
  },
  'Preferred Indifferents': {
    term: 'Preferred Indifferents (Proēgmena)',
    definition: 'External outcomes like compensation, prestige, or comfort that are natural to prefer, but carry no intrinsic moral standing in Stoic agency.',
    category: 'Stoic Ethics',
  },
  'Falsifiability': {
    term: 'Falsifiability',
    definition: 'The scientific requirement that an empirical assumption must specify observable real-world conditions that would disprove it.',
    category: 'Critical Thinking',
  },
  'Base Rate': {
    term: 'Base Rate',
    definition: 'The empirical statistical frequency of an outcome across an objective reference class (e.g. startup survival or project duration averages).',
    category: 'Critical Thinking',
  },
  'Steelmanning': {
    term: 'Steelmanning',
    definition: 'Constructing the most robust, charitable counter-argument against your preferred path before making a final commitment.',
    category: 'Critical Thinking',
  },
  'Golden Mean': {
    term: 'Golden Mean (Mesotēs)',
    definition: 'Aristotle\'s principle that virtue is the disciplined middle ground between the vices of deficiency (inertia/cowardice) and excess (recklessness).',
    category: 'Virtue Ethics',
  },
};

interface GlossaryTermProps {
  term: keyof typeof GLOSSARY_DEFINITIONS | string;
  children?: React.ReactNode;
}

export const GlossaryTerm: React.FC<GlossaryTermProps> = ({ term, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const entry = GLOSSARY_DEFINITIONS[term] || {
    term,
    definition: 'Technical concept in decision theory and philosophical analysis.',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <span className="relative inline-flex items-center">
      <span
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-help inline-flex items-center space-x-0.5 border-b border-dotted border-[var(--color-verdigris)] hover:text-[var(--color-verdigris)] transition-colors group"
      >
        <span>{children || term}</span>
        <HelpCircle className="w-3 h-3 text-[var(--color-verdigris)]/70 group-hover:text-[var(--color-verdigris)] inline shrink-0" />
      </span>

      {isOpen && (
        <div
          ref={popoverRef}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 p-3 rounded-xl bg-[var(--bg-surface-glass)] backdrop-blur-md border border-[var(--border-strong)] shadow-xl z-50 animate-fade-in text-left pointer-events-auto"
        >
          <div className="flex items-center justify-between text-[10px] font-ui uppercase tracking-wider mb-1">
            <span className="font-semibold text-[var(--color-verdigris)]">
              {entry.category || 'Concept'}
            </span>
            <span className="text-[var(--text-faint)]">Plain Language</span>
          </div>

          <h4 className="font-display font-semibold text-xs text-[var(--text-main)] mb-1">
            {entry.term}
          </h4>

          <p className="font-body text-xs text-[var(--text-muted)] leading-relaxed">
            {entry.definition}
          </p>

          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--border-strong)]" />
        </div>
      )}
    </span>
  );
};
