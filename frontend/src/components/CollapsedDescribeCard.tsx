import React from 'react';
import { PenTool, Edit3, ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsedDescribeCardProps {
  narrative: string;
  onEdit: () => void;
  isEditDisabled?: boolean;
}

export const CollapsedDescribeCard: React.FC<CollapsedDescribeCardProps> = ({
  narrative,
  onEdit,
  isEditDisabled,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const displayText = isExpanded ? narrative : (narrative.length > 200 ? narrative.slice(0, 200) + '…' : narrative);

  return (
    <section id="section-describe" className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      <div className="phronesis-card p-4 sm:p-5 space-y-2 relative border-l-2 border-[var(--color-verdigris)]/40">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <PenTool className="w-3.5 h-3.5" />
            </div>
            <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              1. Dilemma Description
            </span>
            <span className="text-[10px] font-mono text-[var(--text-faint)] bg-[var(--bg-app)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
              Completed
            </span>
          </div>

          <button
            type="button"
            onClick={onEdit}
            disabled={isEditDisabled}
            className="px-2.5 py-1 rounded-lg text-xs font-ui font-medium text-[var(--color-verdigris)] hover:bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Edit this description (will regenerate sections below)"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        {/* Collapsed Narrative Text */}
        <div className="text-sm font-body text-[var(--text-main)] leading-relaxed whitespace-pre-line">
          {displayText}
        </div>

        {/* Expand/Collapse Toggle (only if long) */}
        {narrative.length > 200 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-[11px] font-ui text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Show full description</span>
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
};
