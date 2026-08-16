import React from 'react';
import { PenTool, Sliders, LineChart, Check } from 'lucide-react';

interface StepProgressBarProps {
  currentStep: 'input' | 'editor' | 'report';
  onNavigate: (step: 'input' | 'editor' | 'report') => void;
  canEdit: boolean;
  canReport: boolean;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  onNavigate,
  canEdit,
  canReport,
}) => {
  const steps = [
    { id: 'input', label: '1. Describe Dilemma', icon: PenTool, accessible: true },
    { id: 'editor', label: '2. Review & Refine Model', icon: Sliders, accessible: canEdit },
    { id: 'report', label: '3. Reasoning Audit & VoI', icon: LineChart, accessible: canReport },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-800 -z-0" />
        
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = (currentStep === 'editor' && step.id === 'input') ||
                         (currentStep === 'report' && (step.id === 'input' || step.id === 'editor'));

          return (
            <button
              key={step.id}
              disabled={!step.accessible}
              onClick={() => onNavigate(step.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full z-10 transition-all text-xs font-medium ${
                isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 ring-2 ring-brand-400/40'
                  : isDone
                  ? 'bg-space-850 text-slate-200 border border-slate-700 hover:border-brand-500/50 cursor-pointer'
                  : 'bg-space-900 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isActive ? 'bg-white/20' : isDone ? 'bg-sage-500/20 text-sage-400' : 'bg-slate-800'
              }`}>
                {isDone ? <Check className="w-3 h-3 text-sage-400" /> : <Icon className="w-3 h-3" />}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
