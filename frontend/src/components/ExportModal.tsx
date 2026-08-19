import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  Share2
} from 'lucide-react';
import type { AnalysisBundle, ReportResponse } from '../types';
import { useToast } from './Toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundle: AnalysisBundle;
  report: ReportResponse;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  bundle,
  report,
}) => {
  const { showToast } = useToast();
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const decisionStatement = bundle.structured_decision.decision_statement;

  // Executive summary text for quick clipboard sharing
  const executiveSummary = `*Phronesis Decision Audit: ${decisionStatement}*

• Critical Unknown: ${bundle.math_layer.sensitivity_analysis.critical_parameter} (Tipping Threshold: ${Math.round(bundle.math_layer.sensitivity_analysis.inflection_threshold * 100)}%)
• Recommended 48-Hour Experiment: ${report.proposed_experiment}
• Dominant Expected Utility: ${bundle.math_layer.expected_utility.preferred_alternative_id}
• Flagged Cognitive Biases: ${bundle.bias_layer.flagged_patterns.map((b) => b.name).join(', ') || 'None'}
• Evaluated via 4 Philosophical Lenses (Stoicism, Utilitarianism, Aristotelian Phronesis, Kantian Deontology).

_Generated with Phronesis (Deterministic Math & Academic Sourced Attributions)_`;

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(report.report_markdown);
      setCopiedType('markdown');
      showToast({
        type: 'success',
        title: 'Markdown Copied',
        description: 'Full markdown audit copied to clipboard.',
      });
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      showToast({
        type: 'error',
        title: 'Copy Failed',
        description: 'Could not access clipboard.',
      });
    }
  };

  const handleCopyExecutiveSummary = async () => {
    try {
      await navigator.clipboard.writeText(executiveSummary);
      setCopiedType('exec');
      showToast({
        type: 'success',
        title: 'Summary Copied',
        description: 'Executive summary copied to clipboard.',
      });
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      showToast({
        type: 'error',
        title: 'Copy Failed',
        description: 'Could not access clipboard.',
      });
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          decision_statement: decisionStatement,
          bundle,
          report,
        },
        null,
        2
      )
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const filename = `phronesis-audit-${Date.now()}.json`;
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast({
      type: 'success',
      title: 'JSON Exported',
      description: `Saved ${filename} to your downloads.`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-6 space-y-5 z-10 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                Export & Share Decision Audit
              </h3>
              <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
                Auditable records with mathematical lineage & academic citations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-raised)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Copy Full Markdown */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="p-4 rounded-xl bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-verdigris)]/40 text-left transition-all space-y-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
                <FileText className="w-4 h-4" />
              </div>
              {copiedType === 'markdown' ? (
                <Check className="w-4 h-4 text-[var(--color-verdigris)]" />
              ) : (
                <Copy className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--text-main)] transition-colors" />
              )}
            </div>
            <div>
              <div className="font-ui font-semibold text-xs text-[var(--text-main)]">
                Copy Full Markdown
              </div>
              <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">
                Formatted markdown for Obsidian, Notion, or GitHub
              </div>
            </div>
          </button>

          {/* Copy Executive Summary */}
          <button
            type="button"
            onClick={handleCopyExecutiveSummary}
            className="p-4 rounded-xl bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-ochre)]/40 text-left transition-all space-y-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)]">
                <Sparkles className="w-4 h-4" />
              </div>
              {copiedType === 'exec' ? (
                <Check className="w-4 h-4 text-[var(--color-ochre)]" />
              ) : (
                <Copy className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--text-main)] transition-colors" />
              )}
            </div>
            <div>
              <div className="font-ui font-semibold text-xs text-[var(--text-main)]">
                Copy Executive Summary
              </div>
              <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">
                Compact briefing bullet points for Slack or email
              </div>
            </div>
          </button>

          {/* Download Raw JSON */}
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="p-4 rounded-xl bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-verdigris)]/40 text-left transition-all space-y-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
                <Download className="w-4 h-4" />
              </div>
              <Download className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--text-main)] transition-colors" />
            </div>
            <div>
              <div className="font-ui font-semibold text-xs text-[var(--text-main)]">
                Download Raw JSON
              </div>
              <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">
                Complete model payload & pure solver matrices
              </div>
            </div>
          </button>

          {/* Print / Save PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-4 rounded-xl bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-slate)]/40 text-left transition-all space-y-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)]">
                <Printer className="w-4 h-4" />
              </div>
              <Printer className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--text-main)] transition-colors" />
            </div>
            <div>
              <div className="font-ui font-semibold text-xs text-[var(--text-main)]">
                Print / Save as PDF
              </div>
              <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">
                Clean printable dossier layout
              </div>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-center text-[11px] text-[var(--text-faint)] font-mono">
          Phronesis Auditable Decision Engine · 100% Deterministic Lineage
        </div>
      </div>
    </div>
  );
};
