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
