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
      <div className="phronesis-card p-6 relative overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-verdigris-subtle)] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 rounded-xl text-[var(--color-verdigris)]">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-semibold text-[var(--text-main)] tracking-tight">
              8-Lens Moral & Epistemological Matrix
            </h2>
            <p className="text-xs font-body text-[var(--text-muted)] mt-0.5">
              Evaluates reasoning across 8 peer-grounded philosophical traditions without declaring any framework privileged.
            </p>
          </div>
        </div>

        {/* Field Filter Chips */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">
          {fields.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSelectedField(f)}
              className={`px-3 py-1 rounded-full text-xs font-ui font-medium transition-all cursor-pointer ${
                selectedField === f
                  ? 'bg-[var(--color-verdigris)] text-white shadow-xs font-semibold'
                  : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
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
          const isExpanded = expandedFw === fw.framework_id;

          return (
            <div
              key={fw.framework_id}
              className="phronesis-card p-5 transition-all duration-200 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 text-[var(--color-verdigris)]">
                      {FRAMEWORK_ICONS[fw.framework_id] || <Compass className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-semibold text-[var(--text-main)] leading-snug">{fw.framework_name}</h3>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono mt-0.5 border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-muted)]">
                        {fw.field}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Core Idea */}
                <p className="text-xs font-body text-[var(--text-muted)] mb-3 leading-relaxed">
                  {fw.core_idea}
                </p>

                {/* Sourced Dimension Insights */}
                {fw.dimension_analysis && Object.keys(fw.dimension_analysis).length > 0 && (
                  <div className="p-3.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl space-y-2 mb-3">
                    {Object.entries(fw.dimension_analysis).map(([key, val]) => (
                      <div key={key} className="text-xs font-body leading-relaxed">
                        <span className="font-ui font-semibold text-[var(--text-main)] capitalize">
                          {key.replace(/_/g, ' ')}:{' '}
                        </span>
                        <span className="text-[var(--text-muted)]">
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
                      type="button"
                      onClick={() => setExpandedFw(isExpanded ? null : fw.framework_id)}
                      className="flex items-center justify-between w-full text-xs font-ui font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
                        Socratic Questions ({fw.surfaced_questions.length})
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <ul className="mt-2 space-y-2 pl-3 border-l-2 border-[var(--color-verdigris)]/40 text-xs font-body text-[var(--text-main)] animate-fade-in">
                        {fw.surfaced_questions.map((q, idx) => (
                          <li key={idx} className="italic text-[var(--text-muted)] leading-relaxed">
                            "{q}"
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Footer with Source & Deep Dive */}
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-faint)]">
                <span className="truncate max-w-[220px] font-ui" title={fw.source}>
                  {fw.source}
                </span>
                {onDrillDown && (
                  <button
                    type="button"
                    onClick={() =>
                      onDrillDown({
                        item_type: 'philosophy',
                        item_id: fw.framework_id,
                        item_title: fw.framework_name,
                        item_context: fw.dimension_analysis,
                      })
                    }
                    className="text-[var(--color-verdigris)] hover:underline flex items-center gap-1 font-ui font-medium cursor-pointer"
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
