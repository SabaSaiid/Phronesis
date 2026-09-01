import React, { useState } from 'react';
import type { PhilosophyLayerResult } from '../../types';
import { Compass, BookOpen, HelpCircle, ChevronDown, ChevronUp, Sparkles, Scale, Shield, Heart, Lightbulb, Wind, ArrowRight } from 'lucide-react';

interface PhilosophyMatrixViewProps {
  philosophy: PhilosophyLayerResult;
  onDrillDown?: (item: { item_type: string; item_id: string; item_title: string; item_context?: Record<string, any> }) => void;
}

const FRAMEWORK_ICONS: Record<string, React.ReactNode> = {
  stoicism_v1: <Shield className="w-5 h-5 text-amber-400" />,
  utilitarianism_v1: <Scale className="w-5 h-5 text-emerald-400" />,
  kantian_deontology_v1: <BookOpen className="w-5 h-5 text-blue-400" />,
  virtue_ethics_v1: <Sparkles className="w-5 h-5 text-purple-400" />,
  existentialism_v1: <Compass className="w-5 h-5 text-rose-400" />,
  care_ethics_v1: <Heart className="w-5 h-5 text-pink-400" />,
  pragmatism_v1: <Lightbulb className="w-5 h-5 text-yellow-400" />,
  eastern_flow_v1: <Wind className="w-5 h-5 text-cyan-400" />,
};

const FRAMEWORK_ACCENTS: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  stoicism_v1: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  utilitarianism_v1: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  kantian_deontology_v1: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  virtue_ethics_v1: { border: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  existentialism_v1: { border: 'border-rose-500/30', bg: 'bg-rose-500/5', text: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  care_ethics_v1: { border: 'border-pink-500/30', bg: 'bg-pink-500/5', text: 'text-pink-400', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
  pragmatism_v1: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', text: 'text-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  eastern_flow_v1: { border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', text: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
};

export const PhilosophyMatrixView: React.FC<PhilosophyMatrixViewProps> = ({
  philosophy,
  onDrillDown,
}) => {
  const [expandedFw, setExpandedFw] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string>('all');

  const frameworks = philosophy.frameworks || [];

  const fields = ['all', ...Array.from(new Set(frameworks.map((f) => f.field)))];

  const filteredFrameworks = selectedField === 'all'
    ? frameworks
    : frameworks.filter((f) => f.field === selectedField);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">8-Lens Moral & Epistemological Matrix</h2>
            <p className="text-xs text-slate-400">
              Evaluates reasoning across 8 peer-grounded philosophical traditions without declaring any framework privileged.
            </p>
          </div>
        </div>

        {/* Field Filter Chips */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800/80">
          {fields.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedField(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedField === f
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {f === 'all' ? 'All 8 Traditions' : f.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredFrameworks.map((fw) => {
          const accent = FRAMEWORK_ACCENTS[fw.framework_id] || FRAMEWORK_ACCENTS.stoicism_v1;
          const isExpanded = expandedFw === fw.framework_id;

          return (
            <div
              key={fw.framework_id}
              className={`bg-slate-900 border ${accent.border} rounded-xl p-5 transition-all duration-200 flex flex-col justify-between`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${accent.bg} border ${accent.border}`}>
                      {FRAMEWORK_ICONS[fw.framework_id] || <Compass className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">{fw.framework_name}</h3>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono mt-0.5 border ${accent.badge}`}>
                        {fw.field}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Core Idea */}
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  {fw.core_idea}
                </p>

                {/* Sourced Dimension Insights */}
                {fw.dimension_analysis && Object.keys(fw.dimension_analysis).length > 0 && (
                  <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-2 mb-3">
                    {Object.entries(fw.dimension_analysis).map(([key, val]) => (
                      <div key={key} className="text-xs leading-relaxed">
                        <span className="font-semibold text-slate-300 capitalize">
                          {key.replace(/_/g, ' ')}:{' '}
                        </span>
                        <span className="text-slate-400">
                          {typeof val === 'string' ? val : JSON.stringify(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Collapsible Surfaced Socratic Questions */}
                {fw.surfaced_questions && fw.surfaced_questions.length > 0 && (
                  <div>
                    <button
                      onClick={() => setExpandedFw(isExpanded ? null : fw.framework_id)}
                      className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                        Socratic Questions ({fw.surfaced_questions.length})
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <ul className="mt-2 space-y-2 pl-3 border-l-2 border-purple-500/30 text-xs text-slate-300">
                        {fw.surfaced_questions.map((q, idx) => (
                          <li key={idx} className="italic text-slate-300 leading-relaxed">
                            "{q}"
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Footer with Source & Deep Dive */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[220px]" title={fw.source}>
                  {fw.source}
                </span>
                {onDrillDown && (
                  <button
                    onClick={() =>
                      onDrillDown({
                        item_type: 'philosophy',
                        item_id: fw.framework_id,
                        item_title: fw.framework_name,
                        item_context: fw.dimension_analysis,
                      })
                    }
                    className={`${accent.text} hover:underline flex items-center gap-1 font-medium`}
                  >
                    Deep-Dive <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
