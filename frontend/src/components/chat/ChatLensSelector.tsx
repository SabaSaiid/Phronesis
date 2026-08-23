import React from 'react';
import { LENSES } from './lensData';
import type { DeliberationLensId } from '../../types';

// Re-export for backward compatibility
export type { LensInfo } from './lensData';
export { LENSES } from './lensData';

interface ChatLensSelectorProps {
  selectedLens: DeliberationLensId;
  onSelectLens: (lens: DeliberationLensId) => void;
}

export const ChatLensSelector: React.FC<ChatLensSelectorProps> = ({
  selectedLens,
  onSelectLens,
}) => {
  const currentLensInfo = LENSES.find((l) => l.id === selectedLens) || LENSES[0];

  return (
    <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/80 backdrop-blur-xs px-3 py-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Dialectic Lens
        </span>
        <span className="text-[10px] font-mono text-[var(--text-faint)] truncate max-w-[200px]">
          {currentLensInfo.tagline}
        </span>
      </div>

      {/* Horizontal Scrollable Lens Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {LENSES.map((lens) => {
          const Icon = lens.icon;
          const isSelected = selectedLens === lens.id;
          return (
            <button
              key={lens.id}
              type="button"
              onClick={() => onSelectLens(lens.id)}
              className={`
                flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-ui transition-all whitespace-nowrap cursor-pointer shrink-0 shadow-2xs
                ${
                  isSelected
                    ? 'bg-[var(--bg-surface-raised)] text-[var(--text-main)] font-medium border shadow-xs'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-raised)] border border-transparent'
                }
              `}
              style={{
                borderColor: isSelected ? lens.accentColor : undefined,
              }}
              title={`${lens.label} — ${lens.tagline}`}
            >
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: isSelected ? lens.accentColor : 'var(--text-muted)' }}
              />
              <span>{lens.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
