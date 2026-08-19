import React from 'react';
import {
  Compass,
  Scale,
  Shield,
  BookOpen,
  TrendingUp,
  Award,
  FlaskConical,
  Eye
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DeliberationLensId } from '../../types';

export interface LensInfo {
  id: DeliberationLensId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  tagline: string;
  accentColor: string;
}

export const LENSES: LensInfo[] = [
  {
    id: 'socratic',
    label: 'Socratic Inquirer',
    shortLabel: 'Socratic',
    icon: Compass,
    tagline: 'Challenges framing, isolates unknown key flipping variables',
    accentColor: 'var(--color-verdigris)',
  },
  {
    id: 'steelman',
    label: "Devil's Advocate",
    shortLabel: 'Steelman',
    icon: Scale,
    tagline: 'Constructs the strongest case for your least preferred path',
    accentColor: 'var(--color-ochre)',
  },
  {
    id: 'stoic',
    label: 'Stoic Agency',
    shortLabel: 'Stoic',
    icon: Shield,
    tagline: 'Applies the Dichotomy of Control: agency vs external adiaphora',
    accentColor: '#10B981',
  },
  {
    id: 'kantian',
    label: 'Kantian Ethics',
    shortLabel: 'Kantian',
    icon: BookOpen,
    tagline: 'Tests universalizability & treats people as ends in themselves',
    accentColor: '#8B5CF6',
  },
  {
    id: 'utilitarian',
    label: 'Utilitarian Impact',
    shortLabel: 'Utilitarian',
    icon: TrendingUp,
    tagline: 'Audits multi-stakeholder aggregate flourishing vs suffering',
    accentColor: '#3B82F6',
  },
  {
    id: 'virtue',
    label: 'Virtue Ethics',
    shortLabel: 'Virtue',
    icon: Award,
    tagline: 'Character cultivation and the Golden Mean between extremes',
    accentColor: '#EC4899',
  },
  {
    id: 'voi',
    label: '48h VoI Protocol',
    shortLabel: '48h VoI',
    icon: FlaskConical,
    tagline: 'Low-cost (<$100, <4h) falsification experiments before deciding',
    accentColor: '#F59E0B',
  },
  {
    id: 'bias',
    label: 'Bias Auditor',
    shortLabel: 'Bias Audit',
    icon: Eye,
    tagline: 'Screens for sunk cost, loss aversion, anchoring & overconfidence',
    accentColor: '#EF4444',
  },
];

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
