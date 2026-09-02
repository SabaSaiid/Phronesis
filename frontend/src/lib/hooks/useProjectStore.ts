import { useState, useCallback, useEffect } from 'react';
import type { ProjectSummary, StructuredDecision, AnalysisBundle, ReportResponse } from '../../types';
import {
  fetchProjects,
  createProject,
  deleteProject,
  fetchHistoryItem
} from '../api';

export interface UseProjectStoreProps {
  showToast: (toast: { type: 'success' | 'error' | 'info'; title: string; description?: string }) => void;
  onDecisionLoadedFromProject: (data: {
    decision: StructuredDecision;
    bundle: AnalysisBundle;
    report: ReportResponse;
    decisionId: string;
    narrative: string;
  }) => void;
  onResetSession: () => void;
}

export function useProjectStore({
  showToast,
  onDecisionLoadedFromProject,
  onResetSession,
}: UseProjectStoreProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [activeProjectContext, setActiveProjectContext] = useState<string | undefined>(undefined);
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);

  const refreshProjects = useCallback(() => {
    fetchProjects().then(setProjects).catch(console.warn);
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleSelectProject = useCallback((projectId: string) => {
    setViewingProjectId(projectId);
  }, []);

  const handleCreateProject = useCallback(async (name: string) => {
    const p = await createProject({ name });
    refreshProjects();
    showToast({
      type: 'success',
      title: 'Project Created',
      description: `Created project container "${p.name}".`,
    });
  }, [refreshProjects, showToast]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    await deleteProject(projectId);
    refreshProjects();
    if (activeProjectId === projectId) {
      setActiveProjectId(undefined);
      setActiveProjectContext(undefined);
    }
    showToast({
      type: 'info',
      title: 'Project Deleted',
      description: 'Project container deleted. Dossiers remain preserved in history.',
    });
  }, [activeProjectId, refreshProjects, showToast]);

  const handleNewDecisionInProject = useCallback((projectId: string, projectContext: string) => {
    setActiveProjectId(projectId);
    setActiveProjectContext(projectContext);
    setViewingProjectId(null);
    onResetSession();
    showToast({
      type: 'info',
      title: 'Project Context Active',
      description: 'New decision will be grouped under this project and receive its shared constraints.',
    });
  }, [onResetSession, showToast]);

  const handleSelectDecisionFromProject = useCallback(async (decisionId: string) => {
    try {
      const item = await fetchHistoryItem(decisionId);
      if (item) {
        onDecisionLoadedFromProject({
          decision: item.structured_decision,
          bundle: item.analysis_bundle,
          report: {
            report_markdown: item.report_markdown || '',
            key_sensitive_variable: item.key_sensitive_variable || '',
            proposed_experiment: item.proposed_experiment || '',
            attributed_sources: item.attributed_sources || [],
            focus_config: item.focus_config || undefined,
            longitudinal_summary: item.longitudinal_summary || '',
            math_summary: {
              expected_utility: item.analysis_bundle?.math_layer?.expected_utility?.utilities || {},
              preferred_eu_alt: item.preferred_eu_alt || '',
              minimax_regret_choice: item.minimax_regret_choice || '',
              inflection_threshold: item.analysis_bundle?.math_layer?.sensitivity_analysis?.inflection_threshold || 0,
            },
          },
          decisionId,
          narrative: item.decision_statement,
        });
      }
    } catch (err: any) {
      console.error('Failed to load project decision:', err);
      showToast({
        type: 'error',
        title: 'Load Failed',
        description: 'Could not load decision record.',
      });
    }
  }, [onDecisionLoadedFromProject, showToast]);

  const clearActiveProject = useCallback(() => {
    setActiveProjectId(undefined);
    setActiveProjectContext(undefined);
  }, []);

  return {
    projects,
    setProjects,
    activeProjectId,
    setActiveProjectId,
    activeProjectContext,
    setActiveProjectContext,
    viewingProjectId,
    setViewingProjectId,
    refreshProjects,
    handleSelectProject,
    handleCreateProject,
    handleDeleteProject,
    handleNewDecisionInProject,
    handleSelectDecisionFromProject,
    clearActiveProject,
  };
}
