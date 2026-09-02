import React, { useEffect, useState } from 'react';
import {
  FileText,
  Compass,
  Sparkles,
  Network,
  Brain,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';

export interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: NavSection[] = [
  { id: 'sec-executive', label: 'Executive Dossier', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'sec-voi', label: 'Value of Information', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'sec-math', label: 'Decision Mathematics', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'sec-economics', label: 'Economics Explorer', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'sec-bias', label: 'Cognitive Biases', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'sec-philosophy', label: '8-Lens Philosophy', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'sec-systems', label: 'Systems & Game Theory', icon: <Network className="w-3.5 h-3.5" /> },
];

export const DossierNavRail: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('sec-executive');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Dossier Section Navigation"
      className="hidden xl:block fixed left-6 top-28 w-52 p-3 rounded-2xl bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-subtle)] shadow-sm z-30 space-y-1 transition-all"
    >
      <div className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-ui font-bold uppercase tracking-wider text-[var(--text-faint)] mb-1">
        <Layers className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
        <span>Dossier Sections</span>
      </div>

      <div className="space-y-0.5">
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollTo(sec.id)}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-ui text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-semibold shadow-2xs border border-[var(--color-verdigris)]/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]'
              }`}
            >
              <span className={isActive ? 'text-[var(--color-verdigris)]' : 'text-[var(--text-faint)]'}>
                {sec.icon}
              </span>
              <span className="truncate">{sec.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
