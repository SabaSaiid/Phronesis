import React, { useState, useEffect } from 'react';
import {
  Folder,
  PlusCircle,
  Clock,
  Brain,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Edit3,
  Save,
  ChevronRight,
  TrendingUp,
  Download
} from 'lucide-react';
import type { Project } from '../../types';
import {
  fetchProject,
  fetchProjectDecisions,
  updateProject,
  deleteProject
} from '../../lib/api';
import { formatTimeAgo } from '../../lib/formatTime';

interface ProjectViewProps {
  projectId: string;
  onNewDecisionInProject: (projectId: string, projectContext: string) => void;
  onSelectDecision: (decisionId: string) => void;
  onCloseProjectView: () => void;
  onProjectDeleted?: () => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({
  projectId,
  onNewDecisionInProject,
  onSelectDecision,
  onCloseProjectView,
  onProjectDeleted,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, dData] = await Promise.all([
        fetchProject(projectId),
        fetchProjectDecisions(projectId)
      ]);
      setProject(pData);
      setDecisions(dData || []);
      setNameInput(pData?.name || '');
      setNoteInput(pData?.background_note || '');
    } catch (err) {
      console.error('Error loading project view:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleSaveHeader = async () => {
    if (!nameInput.trim()) return;
    try {
      setIsSaving(true);
      await updateProject(projectId, {
        name: nameInput.trim(),
        background_note: noteInput.trim()
      });
      setProject((prev: any) => ({
        ...prev,
        name: nameInput.trim(),
        background_note: noteInput.trim()
      }));
      setIsEditingHeader(false);
    } catch (err) {
      console.error('Failed to update project:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? Decisions inside will remain saved as unscoped dossiers.')) {
      return;
    }
    try {
      await deleteProject(projectId);
      onProjectDeleted?.();
      onCloseProjectView();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleExport = () => {
    if (!project) return;
    const exportData = {
      project,
      decisions,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Compute aggregate pattern stats
  const biasFrequency: Record<string, number> = {};
  let outcomesCount = 0;
  let totalUtilitySum = 0;
  let totalUtilityCount = 0;

  decisions.forEach((d) => {
    if (d.flagged_bias_ids) {
      const bList = typeof d.flagged_bias_ids === 'string' ? d.flagged_bias_ids.split(',') : d.flagged_bias_ids;
      bList.forEach((b: string) => {
        const bClean = b.trim();
        if (bClean) biasFrequency[bClean] = (biasFrequency[bClean] || 0) + 1;
      });
    }
    if (d.chosen_alternative_id) {
      outcomesCount++;
      if (d.actual_utility_rating !== null && d.actual_utility_rating !== undefined) {
        totalUtilitySum += Number(d.actual_utility_rating);
        totalUtilityCount++;
      }
    }
  });

  const topBiases = Object.entries(biasFrequency).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const avgUtility = totalUtilityCount > 0 ? (totalUtilitySum / totalUtilityCount).toFixed(1) : null;

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-verdigris-subtle)] flex items-center justify-center text-[var(--color-verdigris)] animate-bounce">
          <Folder className="w-5 h-5" />
        </div>
        <p className="text-xs font-ui text-[var(--text-muted)] animate-pulse">
          Loading project workspace...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-lg font-display font-semibold text-[var(--text-main)]">Project Not Found</h2>
        <button
          type="button"
          onClick={onCloseProjectView}
          className="btn-verdigris px-4 py-2 rounded-xl text-xs font-ui"
        >
          Return to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6 animate-fade-in">
      {/* ─── Breadcrumb & Actions Bar ─── */}
      <div className="flex items-center justify-between text-xs font-ui pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center space-x-2 text-[var(--text-muted)]">
          <button
            type="button"
            onClick={onCloseProjectView}
            className="hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            Workspace
          </button>
          <span>/</span>
          <span className="text-[var(--text-main)] font-semibold flex items-center space-x-1.5">
            <Folder className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
            <span>{project.name}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Export Project Dossiers (JSON)"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Delete project container"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* ─── Project Header Card ─── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        {isEditingHeader ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-medium)] rounded-xl px-3 py-2 text-sm font-ui text-[var(--text-main)] focus:outline-none focus:border-[var(--color-verdigris)]"
                placeholder="e.g. Career Transition 2026"
              />
            </div>

            <div>
              <label className="block text-[11px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Shared Background Note & Constraints (Injected into Prompts)
              </label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={3}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-medium)] rounded-xl p-3 text-xs font-body text-[var(--text-main)] focus:outline-none focus:border-[var(--color-verdigris)] resize-y leading-relaxed"
                placeholder="e.g. Evaluating transition from enterprise staff role to seed startup. Household burn floor is $10k/mo, spouse is supportive but risk-averse..."
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                disabled={isSaving || !nameInput.trim()}
                onClick={handleSaveHeader}
                className="btn-verdigris px-4 py-1.5 rounded-xl text-xs font-ui flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameInput(project.name);
                  setNoteInput(project.background_note || '');
                  setIsEditingHeader(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-ui text-[var(--text-muted)] hover:bg-[var(--bg-surface-raised)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 flex items-center justify-center text-[var(--color-verdigris)] shrink-0 shadow-2xs">
                  <Folder className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-display font-semibold text-[var(--text-main)] truncate leading-tight">
                    {project.name}
                  </h1>
                  <div className="text-[11px] font-mono text-[var(--text-faint)] flex items-center space-x-2 mt-0.5">
                    <span>Created {formatTimeAgo(project.created_at)}</span>
                    <span>•</span>
                    <span>{decisions.length} Decisions</span>
                  </div>
                </div>
              </div>

              {project.background_note ? (
                <div className="mt-3 p-3 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-xs font-body text-[var(--text-muted)] leading-relaxed relative group">
                  <div className="text-[10px] font-ui font-semibold text-[var(--color-verdigris)] uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Brain className="w-3 h-3" />
                    <span>Shared Instructions & Constraints</span>
                  </div>
                  <p className="whitespace-pre-wrap">{project.background_note}</p>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-faint)] italic font-body pt-1">
                  No background note set. Add shared context to automatically ground all decisions in this project.
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-start">
              <button
                type="button"
                onClick={() => setIsEditingHeader(true)}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs font-ui text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Context</span>
              </button>

              <button
                type="button"
                onClick={() => onNewDecisionInProject(project.id, project.background_note || '')}
                className="btn-verdigris px-4 py-1.5 rounded-xl text-xs font-ui flex items-center space-x-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Decision</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Longitudinal Calibration & Pattern Tracker ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Decisions & Outcomes */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-ui font-medium">
            <span>Dossiers & Outcomes</span>
            <CheckCircle2 className="w-4 h-4 text-[var(--color-verdigris)]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-data font-semibold text-[var(--text-main)]">
              {decisions.length}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-ui">
              ({outcomesCount} retrospectives)
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-faint)] font-body">
            {outcomesCount >= 1
              ? `Avg retrospective rating: ${avgUtility || '—'}/100`
              : 'Log outcomes after 30–90 days to track calibration.'}
          </div>
        </div>

        {/* Metric 2: Recurring Biases */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xs space-y-2 md:col-span-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-ui font-medium">
            <span className="flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-[var(--color-ochre)]" />
              <span>Recurring Cognitive Patterns (Project Scope)</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--text-faint)]">
              {decisions.length >= 5 ? 'Active in Memory (N≥5)' : `Needs ${5 - decisions.length} more for memory`}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {topBiases.length > 0 ? (
              topBiases.map(([bId, count]) => (
                <span
                  key={bId}
                  className="px-2.5 py-1 rounded-lg bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 text-[var(--color-ochre)] text-xs font-ui font-medium flex items-center space-x-1.5"
                >
                  <span className="font-mono text-[10px]">§</span>
                  <span className="capitalize">{bId.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-mono opacity-80">({count}x)</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-[var(--text-faint)] italic font-body">
                No cognitive biases flagged yet in this project.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Decision Timeline ─── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-ui font-semibold text-[var(--text-main)] flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[var(--color-verdigris)]" />
            <span>Decision Timeline ({decisions.length})</span>
          </h2>
        </div>

        {decisions.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] mx-auto">
              <PlusCircle className="w-5 h-5 text-[var(--color-verdigris)]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-ui font-medium text-[var(--text-main)]">No decisions in this project yet</h3>
              <p className="text-xs font-body text-[var(--text-muted)] max-w-sm mx-auto">
                Start your first reasoning audit under this project to automatically track longitudinal patterns.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNewDecisionInProject(project.id, project.background_note || '')}
              className="btn-verdigris px-4 py-2 rounded-xl text-xs font-ui shadow-sm inline-flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Decision</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {decisions.map((item) => {
              const biasList = item.flagged_bias_ids
                ? (typeof item.flagged_bias_ids === 'string' ? item.flagged_bias_ids.split(',') : item.flagged_bias_ids)
                : [];
              const hasOutcome = Boolean(item.chosen_alternative_id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectDecision(item.id)}
                  className="w-full text-left p-4 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-verdigris)]/50 transition-all shadow-2xs group flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 text-[11px] text-[var(--text-faint)] font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(item.timestamp)}</span>
                      {item.domain && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{item.domain}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-sm font-ui font-semibold text-[var(--text-main)] group-hover:text-[var(--color-verdigris)] transition-colors line-clamp-1">
                      {item.decision_statement}
                    </h3>

                    {/* Tags & Biases */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {item.preferred_eu_alt && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                          EU: {item.preferred_eu_alt}
                        </span>
                      )}
                      {biasList.slice(0, 2).map((b: string) => (
                        <span
                          key={b}
                          className="text-[10px] font-ui px-2 py-0.5 rounded-md bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] border border-[var(--color-ochre)]/20"
                        >
                          {b.trim()}
                        </span>
                      ))}
                      {biasList.length > 2 && (
                        <span className="text-[10px] font-mono text-[var(--text-faint)]">
                          +{biasList.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Outcome Status Badge */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    {hasOutcome ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-ui font-medium bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Outcome Logged {item.actual_utility_rating ? `(${item.actual_utility_rating}/100)` : ''}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-[10px] font-ui text-[var(--text-faint)] bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                        Pending Outcome
                      </span>
                    )}

                    <ChevronRight className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--color-verdigris)] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
