import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ActiveStage,
  StructuredDecision,
  AnalysisBundle,
  ReportResponse,
  BenchmarkItem,
  FocusConfig,
  EffortLevel,
  LLMConfigOverride,
  HistoryItem,
  AttachedDoc
} from '../../types';
import {
  extractDecision,
  extractDecisionFromDocument,
  runDeterministicAnalysis,
  synthesizeReport
} from '../api';

const SESSION_DRAFT_KEY = 'phronesis_session_draft';

export interface UseDecisionSessionProps {
  getEffectiveModelConfig: () => LLMConfigOverride;
  effortLevel: EffortLevel;
  activeProjectId?: string;
  activeProjectContext?: string;
  onAnalysisComplete?: (item: HistoryItem) => void;
  showToast: (toast: { type: 'success' | 'error' | 'info'; title: string; description?: string }) => void;
}

export function useDecisionSession({
  getEffectiveModelConfig,
  effortLevel,
  activeProjectId,
  activeProjectContext,
  onAnalysisComplete,
  showToast,
}: UseDecisionSessionProps) {
  const [activeStage, setActiveStage] = useState<ActiveStage>('input');
  const [submittedNarrative, setSubmittedNarrative] = useState<string>('');
  const [isEditingDescribe, setIsEditingDescribe] = useState(false);

  // Core data
  const [decision, setDecision] = useState<StructuredDecision | null>(null);
  const [bundle, setBundle] = useState<AnalysisBundle | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [currentDecisionId, setCurrentDecisionId] = useState<string | undefined>(undefined);

  // Loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Edit confirmation
  const [pendingEditSection, setPendingEditSection] = useState<'describe' | 'calibrate' | null>(null);

  // Section refs for auto-scroll
  const describeSectionRef = useRef<HTMLDivElement>(null);
  const calibrateSectionRef = useRef<HTMLDivElement>(null);
  const reportSectionRef = useRef<HTMLDivElement>(null);

  // Restore draft from sessionStorage on mount if exists
  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem(SESSION_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.activeStage && parsed.activeStage !== 'input') {
          setActiveStage(parsed.activeStage);
          if (parsed.submittedNarrative) setSubmittedNarrative(parsed.submittedNarrative);
          if (parsed.decision) setDecision(parsed.decision);
          if (parsed.bundle) setBundle(parsed.bundle);
          if (parsed.report) setReport(parsed.report);
          if (parsed.currentDecisionId) setCurrentDecisionId(parsed.currentDecisionId);
        }
      }
    } catch {
      /* noop */
    }
  }, []);

  // Sync draft to sessionStorage
  useEffect(() => {
    try {
      if (activeStage === 'input' && !decision && !submittedNarrative) {
        sessionStorage.removeItem(SESSION_DRAFT_KEY);
      } else {
        sessionStorage.setItem(
          SESSION_DRAFT_KEY,
          JSON.stringify({
            activeStage,
            submittedNarrative,
            decision,
            bundle,
            report,
            currentDecisionId,
          })
        );
      }
    } catch {
      /* noop */
    }
  }, [activeStage, submittedNarrative, decision, bundle, report, currentDecisionId]);

  const scrollToSection = useCallback((sectionRef: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleReset = useCallback(() => {
    setActiveStage('input');
    setSubmittedNarrative('');
    setIsEditingDescribe(false);
    setDecision(null);
    setBundle(null);
    setReport(null);
    setCurrentDecisionId(undefined);
    setError(null);
    setPendingEditSection(null);
    try {
      sessionStorage.removeItem(SESSION_DRAFT_KEY);
    } catch {
      /* noop */
    }
  }, []);

  const handleExtract = async (narrative: string, doc?: AttachedDoc) => {
    setIsLoading(true);
    setError(null);
    try {
      let extracted: StructuredDecision;
      if (doc) {
        extracted = await extractDecisionFromDocument(
          doc,
          narrative,
          getEffectiveModelConfig(),
          activeProjectId
        );
      } else {
        extracted = await extractDecision(
          narrative,
          getEffectiveModelConfig(),
          activeProjectId,
          activeProjectContext
        );
      }
      setSubmittedNarrative(doc ? `${narrative}\n[Attached: ${doc.filename}]`.trim() : narrative);
      setDecision(extracted);
      setBundle(null);
      setReport(null);
      setCurrentDecisionId(undefined);
      setIsEditingDescribe(false);
      setActiveStage('editor');
      scrollToSection(calibrateSectionRef);
      showToast({
        type: 'success',
        title: doc ? 'Document Analyzed' : 'Model Extracted',
        description: doc
          ? `Extracted variables from "${doc.filename}".`
          : 'Alternatives and probability matrices initialized.',
      });
    } catch (err: any) {
      setError(err.message || 'Extraction failed. Please try again.');
      showToast({
        type: 'error',
        title: 'Extraction Error',
        description: err.message || 'Failed to extract decision parameters.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBenchmark = async (bm: BenchmarkItem) => {
    setError(null);
    setSubmittedNarrative(bm.narrative || bm.title);
    setDecision(bm.structured_decision);
    setBundle(null);
    setReport(null);
    setCurrentDecisionId(bm.id);
    setIsEditingDescribe(false);
    setActiveStage('editor');
    scrollToSection(calibrateSectionRef);
    showToast({
      type: 'info',
      title: 'Canonical Dilemma Loaded',
      description: `Loaded "${bm.title}" into the calibration workbench.`,
    });
  };

  const handleRunAnalysis = async (focusConfig?: FocusConfig) => {
    if (!decision) return;
    setIsLoading(true);
    setError(null);
    setLoadingStage('Computing closed-form expected utility & regret matrices...');
    try {
      // 1. Run deterministic engines
      setLoadingStage('Scanning 15 cognitive bias patterns & 4 philosophical frameworks...');
      decision.project_id = activeProjectId;
      const analysisBundle = await runDeterministicAnalysis(decision);
      if (focusConfig) {
        analysisBundle.focus_config = focusConfig;
      }
      analysisBundle.effort_level = effortLevel;
      analysisBundle.project_id = activeProjectId;
      analysisBundle.project_context = activeProjectContext;
      setBundle(analysisBundle);

      // 2. Synthesize report
      setLoadingStage('Synthesizing auditable reasoning dossier with Value of Information...');
      const rep = await synthesizeReport(analysisBundle, getEffectiveModelConfig());
      setReport(rep);

      const historyId = rep.decision_id || `dec-${Date.now()}`;
      setCurrentDecisionId(historyId);

      // Save to history callback
      if (onAnalysisComplete) {
        onAnalysisComplete({
          id: historyId,
          title:
            decision.decision_statement.length > 50
              ? `${decision.decision_statement.slice(0, 48)}...`
              : decision.decision_statement,
          timestamp: Date.now(),
          previewText: decision.decision_statement,
          isPinned: false,
          data: {
            decision,
            bundle: analysisBundle,
            report: rep,
          },
        });
      }

      setActiveStage('report');
      scrollToSection(reportSectionRef);
      showToast({
        type: 'success',
        title: 'Audit Complete',
        description: 'Deterministic solvers and 4-lens philosophy dossier ready.',
      });
    } catch (err: any) {
      setError(err.message || 'Analysis run failed.');
      showToast({
        type: 'error',
        title: 'Audit Error',
        description: err.message || 'Reasoning audit encountered an issue.',
      });
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  const handleRequestEditDescribe = useCallback(() => {
    if (activeStage === 'input') return;
    setPendingEditSection('describe');
  }, [activeStage]);

  const handleRequestEditCalibrate = useCallback(() => {
    if (activeStage === 'editor') return;
    setPendingEditSection('calibrate');
  }, [activeStage]);

  const handleConfirmEdit = useCallback(() => {
    if (pendingEditSection === 'describe') {
      setIsEditingDescribe(true);
      setDecision(null);
      setBundle(null);
      setReport(null);
      setActiveStage('input');
      setPendingEditSection(null);
      scrollToSection(describeSectionRef);
      showToast({
        type: 'info',
        title: 'Editing Description',
        description: 'Modify your dilemma and resubmit to regenerate downstream analysis.',
      });
    } else if (pendingEditSection === 'calibrate') {
      setBundle(null);
      setReport(null);
      setActiveStage('editor');
      setPendingEditSection(null);
      scrollToSection(calibrateSectionRef);
      showToast({
        type: 'info',
        title: 'Editing Calibration',
        description: 'Adjust your model parameters and re-run the reasoning audit.',
      });
    }
  }, [pendingEditSection, scrollToSection, showToast]);

  const handleCancelEdit = useCallback(() => {
    setPendingEditSection(null);
  }, []);

  return {
    activeStage,
    setActiveStage,
    submittedNarrative,
    setSubmittedNarrative,
    isEditingDescribe,
    setIsEditingDescribe,
    decision,
    setDecision,
    bundle,
    setBundle,
    report,
    setReport,
    currentDecisionId,
    setCurrentDecisionId,
    isLoading,
    loadingStage,
    error,
    pendingEditSection,
    describeSectionRef,
    calibrateSectionRef,
    reportSectionRef,
    handleReset,
    handleExtract,
    handleSelectBenchmark,
    handleRunAnalysis,
    handleRequestEditDescribe,
    handleRequestEditCalibrate,
    handleConfirmEdit,
    handleCancelEdit,
    scrollToSection,
  };
}
