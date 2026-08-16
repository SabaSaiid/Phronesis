import React from 'react';
import { Compass, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  currentStep: 'input' | 'editor' | 'report';
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-space-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          onClick={onReset}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-sage-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 group-hover:border-brand-400 transition-colors shadow-sm">
            <Compass className="w-5 h-5 transition-transform group-hover:rotate-45" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">Phronesis</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50 font-mono">
                φρόνησις
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Question the decision. Examine the mind.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-space-900 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-sage-400" />
            <span>Deterministic Math & Sourced Attribution</span>
          </div>
          
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-space-800 border border-transparent hover:border-slate-700 transition-all font-medium"
          >
            New Decision
          </button>
        </div>
      </div>
    </header>
  );
};
