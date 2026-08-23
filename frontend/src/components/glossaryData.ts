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
