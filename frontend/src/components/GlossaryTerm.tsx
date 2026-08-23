import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { GLOSSARY_DEFINITIONS } from './glossaryData';

// Re-export for backward compatibility
export { GLOSSARY_DEFINITIONS } from './glossaryData';

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
