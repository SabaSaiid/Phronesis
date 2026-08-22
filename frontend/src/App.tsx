import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Sidebar, type HistoryItem } from './components/Sidebar';
import { ToastProvider, useToast } from './components/Toast';
import { NarrativeInputView } from './features/input/NarrativeInputView';
import { CollapsedDescribeCard } from './components/CollapsedDescribeCard';
import { CollapsedCalibrateCard } from './components/CollapsedCalibrateCard';
import type {
  StructuredDecision,
  AnalysisBundle,
  ReportResponse,
  BenchmarkItem,
  FocusConfig,
  ChatLayoutMode
} from './types';
import {
  fetchBenchmarks,
  extractDecision,
  runDeterministicAnalysis,
  synthesizeReport
} from './lib/api';
import { AlertCircle, Sparkles, AlertTriangle, X } from 'lucide-react';

// Lazy-loaded secondary views and modal dialogs for bundle code-splitting
const CanonicalDilemmasView = lazy(() =>
  import('./features/benchmarks/CanonicalDilemmasView').then((m) => ({ default: m.CanonicalDilemmasView }))
);
const ModelEditorView = lazy(() =>
  import('./features/editor/ModelEditorView').then((m) => ({ default: m.ModelEditorView }))
);
const ReportView = lazy(() =>
  import('./features/report/ReportView').then((m) => ({ default: m.ReportView }))
);
const SocraticChatDrawer = lazy(() =>
  import('./components/SocraticChatDrawer').then((m) => ({ default: m.SocraticChatDrawer }))
);
const SettingsModal = lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const CommandPalette = lazy(() =>
  import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);
const ExportModal = lazy(() =>
  import('./components/ExportModal').then((m) => ({ default: m.ExportModal }))
);
const OrientationModal = lazy(() =>
  import('./components/OrientationModal').then((m) => ({ default: m.OrientationModal }))
);
const MethodologyModal = lazy(() =>
  import('./components/MethodologyModal').then((m) => ({ default: m.MethodologyModal }))
);

const LOCAL_STORAGE_THEME_KEY = 'phronesis_theme';
const LOCAL_STORAGE_HISTORY_KEY = 'phronesis_history';
const LOCAL_STORAGE_SIDEBAR_KEY = 'phronesis_sidebar';
const LOCAL_STORAGE_CHAT_LAYOUT_KEY = 'phronesis_chat_layout';

function safePersistHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(items));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      const pruned = [
        ...items.filter((i) => i.isPinned),
        ...items.filter((i) => !i.isPinned).slice(0, 5),
      ];
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(pruned));
      } catch (err) {
        console.warn('Failed to persist history after pruning:', err);
      }
    } else {
      console.warn('Failed to persist history:', e);
    }
  }
}

/**
 * Session stage for the accumulating-sections architecture.
 * - 'input': Only Describe is visible (initial state or benchmarks gallery)
 * - 'editor': Describe collapsed + Calibrate active
 * - 'report': Describe collapsed + Calibrate collapsed + Report active
 * - 'benchmarks': Special standalone gallery view
 */
type ActiveStage = 'input' | 'editor' | 'report' | 'benchmarks';

function AppContent() {
  const { showToast } = useToast();

  // --- Session state: accumulating sections ---
  const [activeStage, setActiveStage] = useState<ActiveStage>('input');
  const [submittedNarrative, setSubmittedNarrative] = useState<string>('');
  const [isEditingDescribe, setIsEditingDescribe] = useState(false);

  // Data state (same as before)
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  const [decision, setDecision] = useState<StructuredDecision | null>(null);
  const [bundle, setBundle] = useState<AnalysisBundle | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [currentDecisionId, setCurrentDecisionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [externalTextToAppend, setExternalTextToAppend] = useState<string | undefined>(undefined);
  const [chatLayoutMode, setChatLayoutMode] = useState<ChatLayoutMode>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CHAT_LAYOUT_KEY);
    return (saved as ChatLayoutMode) || 'drawer';
  });

  // Edit-and-regenerate confirmation dialog
  const [pendingEditSection, setPendingEditSection] = useState<'describe' | 'calibrate' | null>(null);

  // Section refs for auto-scroll and anchor-nav
  const describeSectionRef = useRef<HTMLDivElement>(null);
  const calibrateSectionRef = useRef<HTMLDivElement>(null);
  const reportSectionRef = useRef<HTMLDivElement>(null);

  // Layout & Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SIDEBAR_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Apply Theme Class to <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  // Persist Sidebar State
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SIDEBAR_KEY, String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Fetch Benchmarks on mount
  useEffect(() => {
    fetchBenchmarks()
      .then(setBenchmarks)
      .catch((err) => {
        console.warn('Failed to load benchmarks from API:', err);
      });
  }, []);

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
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
  }, []);

  // Derive a `step` value for components that still need the legacy type
  // (Header, Sidebar, SocraticChatDrawer, CommandPalette)
  const currentStep = activeStage as 'input' | 'editor' | 'report' | 'benchmarks';

  // Global Keyboard Shortcuts (⌘K, ⌘N, ⌘J, ⌘B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsChatDrawerOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleReset();
        showToast({
          type: 'info',
          title: 'New Decision',
          description: 'Cleared workspace for fresh analysis.',
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, showToast]);

  // --- Auto-scroll to newest section ---
  const scrollToSection = useCallback((sectionRef: React.RefObject<HTMLDivElement | null>) => {
    // Small delay to let the DOM mount the new section
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  // --- Anchor-nav handler: scroll to section by id ---
  const handleScrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleExtract = async (narrative: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const extracted = await extractDecision(narrative);
      setSubmittedNarrative(narrative);
      setDecision(extracted);
      setBundle(null);
      setReport(null);
      setCurrentDecisionId(undefined);
      setIsEditingDescribe(false);
      setActiveStage('editor');
      scrollToSection(calibrateSectionRef);
      showToast({
        type: 'success',
        title: 'Model Extracted',
        description: 'Alternatives and probability matrices initialized.',
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

  const [isOrientationOpen, setIsOrientationOpen] = useState<boolean>(() => {
    return localStorage.getItem('phronesis_orientation_dismissed') !== 'true';
  });
  const [loadingStage, setLoadingStage] = useState<string>('');

  const handleRunAnalysis = async (focusConfig?: FocusConfig) => {
    if (!decision) return;
    setIsLoading(true);
    setError(null);
    setLoadingStage('Computing closed-form expected utility & regret matrices...');
    try {
      // 1. Run deterministic engines
      setLoadingStage('Scanning 15 cognitive bias patterns & 4 philosophical frameworks...');
      const analysisBundle = await runDeterministicAnalysis(decision);
      if (focusConfig) {
        analysisBundle.focus_config = focusConfig;
      }
      setBundle(analysisBundle);

      // 2. Synthesize report
      setLoadingStage('Synthesizing auditable reasoning dossier with Value of Information...');
      const rep = await synthesizeReport(analysisBundle);
      setReport(rep);

      // 3. Save to history
      const historyId = `dec-${Date.now()}`;
      setCurrentDecisionId(historyId);
      const newHistoryItem: HistoryItem = {
        id: historyId,
        title: decision.decision_statement.length > 50 
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
      };

      setHistory((prev) => {
        const updated = [newHistoryItem, ...prev.filter((item) => item.title !== newHistoryItem.title)].slice(0, 20);
        safePersistHistory(updated);
        return updated;
      });

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

  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (item.data) {
      setDecision(item.data.decision || null);
      setBundle(item.data.bundle || null);
      setReport(item.data.report || null);
      setCurrentDecisionId(item.id);
      setIsEditingDescribe(false);
      setPendingEditSection(null);

      // For history items, set the narrative from the decision statement
      if (item.data.decision) {
        setSubmittedNarrative(item.previewText || item.data.decision.decision_statement);
      }

      if (item.data.bundle && item.data.report) {
        setActiveStage('report');
      } else if (item.data.decision) {
        setActiveStage('editor');
      }
      showToast({
        type: 'info',
        title: 'Dossier Loaded',
        description: `Opened "${item.title}".`,
      });
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch (e) {
      console.warn('Failed to clear history:', e);
    }
    showToast({
      type: 'info',
      title: 'History Cleared',
      description: 'All past local decision records removed.',
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safePersistHistory(updated);
      return updated;
    });
    if (currentDecisionId === id) {
      setCurrentDecisionId(undefined);
    }
  };

  const handleTogglePinHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      );
      safePersistHistory(updated);
      return updated;
    });
  };

  const handleRenameHistoryItem = (id: string, newTitle: string) => {
    setHistory((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, title: newTitle } : item
      );
      safePersistHistory(updated);
      return updated;
    });
  };

  const handleDuplicateHistoryItem = (item: HistoryItem) => {
    const duplicated: HistoryItem = {
      ...item,
      id: `dec-${Date.now()}`,
      title: `${item.title} (copy)`,
      timestamp: Date.now(),
      isPinned: false,
    };
    setHistory((prev) => {
      const updated = [duplicated, ...prev].slice(0, 20);
      safePersistHistory(updated);
      return updated;
    });
    showToast({
      type: 'info',
      title: 'Dossier Duplicated',
      description: `"${duplicated.title}" created.`,
    });
  };

  const handleExportSingleHistoryItem = (item: HistoryItem) => {
    try {
      const payload = { id: item.id, title: item.title, timestamp: item.timestamp, data: item.data };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phronesis_${item.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({
        type: 'success',
        title: 'Exported',
        description: `"${item.title}" saved as JSON.`,
      });
    } catch (err) {
      console.warn('Export failed:', err);
    }
  };

  const handleInsertAlternative = useCallback((alt: { name: string; description: string }) => {
    const newId = `alt_${Date.now()}`;
    const newAlt = {
      id: newId,
      name: alt.name,
      description: alt.description || '',
    };
    setDecision((prev) => {
      if (!prev) {
        return {
          decision_statement: 'New Socratic Decision',
          alternatives: [newAlt],
          states_of_world: [
            { id: 's1', name: 'Optimistic State', prior_probability: 0.5 },
            { id: 's2', name: 'Conservative State', prior_probability: 0.5 },
          ],
          payoff_matrix: [
            { alternative_id: newId, state_id: 's1', utility: 75.0 },
            { alternative_id: newId, state_id: 's2', utility: 45.0 },
          ],
          goals: [],
          constraints: [],
          assumptions: [],
          unknowns: [],
        };
      }
      const newCells = prev.states_of_world.map((s) => ({
        alternative_id: newId,
        state_id: s.id,
        utility: 50.0,
        narrative: 'Initialized from Socratic suggestion',
      }));
      return {
        ...prev,
        alternatives: [...prev.alternatives, newAlt],
        payoff_matrix: [...prev.payoff_matrix, ...newCells],
      };
    });
    if (activeStage === 'input') {
      setActiveStage('editor');
    }
    showToast({
      type: 'success',
      title: 'Alternative Added',
      description: `Added "${alt.name}" to your decision model.`,
    });
  }, [activeStage, showToast]);

  const handleInsertAssumption = useCallback((assump: { text: string; type?: string; testable?: boolean }) => {
    const newAssumption = {
      id: `a_${Date.now()}`,
      text: assump.text,
      type: assump.type || 'empirical',
      testable: assump.testable !== false,
    };
    setDecision((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assumptions: [...prev.assumptions, newAssumption],
      };
    });
    showToast({
      type: 'success',
      title: 'Assumption Added',
      description: 'Added testable assumption to calibration workbench.',
    });
  }, [showToast]);

  const handleChangeChatLayoutMode = useCallback((mode: ChatLayoutMode) => {
    setChatLayoutMode(mode);
    try {
      localStorage.setItem(LOCAL_STORAGE_CHAT_LAYOUT_KEY, mode);
    } catch (e) {
      console.warn('Failed to save chat layout mode:', e);
    }
  }, []);

  // --- Edit-and-regenerate handlers ---
  const handleRequestEditDescribe = useCallback(() => {
    // If we're still at input stage, nothing downstream to regenerate
    if (activeStage === 'input') return;
    // Show confirmation dialog
    setPendingEditSection('describe');
  }, [activeStage]);

  const handleRequestEditCalibrate = useCallback(() => {
    // If we're still at editor stage, just let them keep editing (it's already active)
    if (activeStage === 'editor') return;
    // Show confirmation dialog for regenerating report
    setPendingEditSection('calibrate');
  }, [activeStage]);

  const handleConfirmEdit = useCallback(() => {
    if (pendingEditSection === 'describe') {
      // Re-expand Describe, clear downstream
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
      // Re-expand Calibrate, clear report
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

  // Determine what sections to show
  const showDescribeActive = activeStage === 'input';
  const showDescribeCollapsed = activeStage === 'editor' || activeStage === 'report';
  const showCalibrate = activeStage === 'editor' || activeStage === 'report';
  const showCalibrateCollapsed = activeStage === 'report';
  const showCalibrateActive = activeStage === 'editor';
  const showReport = activeStage === 'report';
  const showBenchmarks = activeStage === 'benchmarks';

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex">
      {/* Collapsible / Responsive Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        history={history}
        benchmarks={benchmarks}
        onSelectHistoryItem={handleSelectHistoryItem}
        onSelectBenchmark={handleSelectBenchmark}
        onOpenBenchmarksGallery={() => setActiveStage('benchmarks')}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onNewDecision={handleReset}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onTogglePinHistoryItem={handleTogglePinHistoryItem}
        onRenameHistoryItem={handleRenameHistoryItem}
        onDuplicateHistoryItem={handleDuplicateHistoryItem}
        onExportHistoryItem={handleExportSingleHistoryItem}
        onClearHistory={handleClearHistory}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        currentDecisionId={currentDecisionId}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Area: Supports Docked Split-Screen Mode */}
      <div className="flex-1 flex min-w-0">
        {/* Primary Reading & Interaction Column Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onReset={handleReset}
            currentStep={currentStep}
            activeStage={activeStage}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
            onOpenExport={bundle && report ? () => setIsExportModalOpen(true) : undefined}
            onToggleChat={() => setIsChatDrawerOpen((prev) => !prev)}
            isChatOpen={isChatDrawerOpen}
            onScrollToSection={handleScrollToSection}
            hasDecision={!!decision}
            hasReport={!!(bundle && report)}
          />

          <main className="flex-1 pb-16">
            {error && (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 mt-4">
                <div className="p-3.5 rounded-xl bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)] text-xs text-[var(--text-main)] flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-[var(--color-ochre)] shrink-0" />
                  <span className="font-ui">{error}</span>
                </div>
              </div>
            )}

            {/* --- ACCUMULATING SECTIONS --- */}
            <div className="space-y-6 py-4">

              {/* SECTION 1: Describe */}
              <div ref={describeSectionRef}>
                {showDescribeCollapsed && !isEditingDescribe && submittedNarrative && (
                  <CollapsedDescribeCard
                    narrative={submittedNarrative}
                    onEdit={handleRequestEditDescribe}
                    isEditDisabled={isLoading}
                  />
                )}

                {(showDescribeActive || isEditingDescribe) && (
                  <NarrativeInputView
                    onExtract={handleExtract}
                    isLoading={isLoading}
                    externalTextToAppend={externalTextToAppend}
                    onClearExternalText={() => setExternalTextToAppend(undefined)}
                    initialNarrative={isEditingDescribe ? submittedNarrative : undefined}
                    isReEdit={isEditingDescribe}
                  />
                )}
              </div>

              {/* SECTION 2: Calibrate */}
              {showCalibrate && (
                <div ref={calibrateSectionRef}>
                  {showCalibrateCollapsed && decision && (
                    <CollapsedCalibrateCard
                      decision={decision}
                      onEdit={handleRequestEditCalibrate}
                      isEditDisabled={isLoading}
                    />
                  )}

                  {showCalibrateActive && decision && (
                    <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] animate-pulse">Loading calibration view...</div>}>
                      <section id="section-calibrate">
                        <ModelEditorView
                          decision={decision}
                          onUpdateDecision={setDecision}
                          onRunAnalysis={handleRunAnalysis}
                          isLoading={isLoading}
                        />
                      </section>
                    </Suspense>
                  )}
                </div>
              )}

              {/* SECTION 3: Audit Report */}
              {showReport && bundle && report && (
                <div ref={reportSectionRef}>
                  <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] animate-pulse">Loading report view...</div>}>
                    <section id="section-report">
                      <ReportView
                        bundle={bundle}
                        report={report}
                        onNewDecision={handleReset}
                        onOpenExport={() => setIsExportModalOpen(true)}
                      />
                    </section>
                  </Suspense>
                </div>
              )}
            </div>

            {/* Benchmarks Gallery (standalone view, not part of session flow) */}
            <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] animate-pulse">Loading view...</div>}>
              {showBenchmarks && (
                <CanonicalDilemmasView
                  benchmarks={benchmarks}
                  onSelectBenchmark={handleSelectBenchmark}
                  onBackToInput={() => setActiveStage('input')}
                />
              )}
            </Suspense>
          </main>

          {/* Subtle Disciplined Footer */}
          <footer className="border-t border-[var(--border-subtle)] py-6 text-center text-xs text-[var(--text-faint)] font-mono">
            <p>Phronesis (φρόνησις) · Auditable Human Judgment Under Uncertainty</p>
          </footer>
        </div>

        {/* Docked Socratic Deliberation Workspace (Side-by-Side Panel) */}
        {isChatDrawerOpen && chatLayoutMode === 'docked' && (
          <Suspense fallback={<div className="w-96 border-l border-[var(--border-subtle)] p-6 text-xs text-[var(--text-muted)]">Loading workspace...</div>}>
            <SocraticChatDrawer
              isOpen={isChatDrawerOpen}
              onClose={() => setIsChatDrawerOpen(false)}
              currentStep={currentStep}
              decision={decision}
              bundle={bundle}
              layoutMode={chatLayoutMode}
              onChangeLayoutMode={handleChangeChatLayoutMode}
              onInsertText={(text) => {
                setExternalTextToAppend(text);
                showToast({
                  type: 'info',
                  title: 'Notes Appended',
                  description: 'Appended Socratic insights directly to your dilemma input.',
                });
              }}
              onInsertAlternative={handleInsertAlternative}
              onInsertAssumption={handleInsertAssumption}
            />
          </Suspense>
        )}
      </div>

      {/* Socratic Deliberation Overlay Drawer / Fullscreen Mode */}
      {isChatDrawerOpen && chatLayoutMode !== 'docked' && (
        <Suspense fallback={null}>
          <SocraticChatDrawer
            isOpen={isChatDrawerOpen}
            onClose={() => setIsChatDrawerOpen(false)}
            currentStep={currentStep}
            decision={decision}
            bundle={bundle}
            layoutMode={chatLayoutMode}
            onChangeLayoutMode={handleChangeChatLayoutMode}
            onInsertText={(text) => {
              setExternalTextToAppend(text);
              showToast({
                type: 'info',
                title: 'Notes Appended',
                description: 'Appended Socratic insights directly to your dilemma input.',
              });
            }}
            onInsertAlternative={handleInsertAlternative}
            onInsertAssumption={handleInsertAssumption}
          />
        </Suspense>
      )}

      {/* Pipeline Progress Indicator (During Reasoning Audit) */}
      {isLoading && loadingStage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl bg-[var(--bg-surface-glass)] backdrop-blur-md border border-[var(--color-verdigris)]/50 shadow-2xl flex items-center space-x-3 animate-fade-in max-w-md w-full mx-4">
          <div className="p-2 rounded-xl bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] shrink-0">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-ui">
              <span className="font-semibold text-[var(--color-verdigris)]">
                Reasoning Audit in Progress
              </span>
              <span className="text-[10px] font-mono text-[var(--text-faint)]">
                Auditing...
              </span>
            </div>
            <p className="font-body text-xs text-[var(--text-main)] truncate animate-pulse">
              {loadingStage}
            </p>
          </div>
        </div>
      )}

      {/* --- Edit-and-Regenerate Confirmation Modal --- */}
      {pendingEditSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                  {pendingEditSection === 'describe'
                    ? 'Edit Dilemma Description?'
                    : 'Edit Model Calibration?'}
                </h3>
                <p className="font-body text-sm text-[var(--text-muted)] leading-relaxed">
                  {pendingEditSection === 'describe'
                    ? 'Editing the description will regenerate both the Calibration and Audit Report sections below. Your current calibration settings and report will be cleared.'
                    : 'Editing the calibration will regenerate the Audit Report section below. Your current report will be cleared.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-xl text-sm font-ui font-medium text-[var(--text-main)] bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEdit}
                className="px-4 py-2 rounded-xl text-sm font-ui font-medium text-white bg-[var(--color-ochre)] hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                {pendingEditSection === 'describe' ? 'Edit & Regenerate' : 'Edit & Re-audit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals with Suspense */}
      <Suspense fallback={null}>
        {/* First-Time Orientation Modal */}
        <OrientationModal
          isOpen={isOrientationOpen}
          onClose={() => {
            setIsOrientationOpen(false);
            try {
              localStorage.setItem('phronesis_orientation_dismissed', 'true');
            } catch (e) {
              console.warn('Failed to save orientation dismiss state:', e);
            }
          }}
        />

        {/* Methodology & Lineage Modal */}
        <MethodologyModal
          isOpen={isMethodologyOpen}
          onClose={() => setIsMethodologyOpen(false)}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onHistoryPurged={() => {
            handleClearHistory();
          }}
        />

        {/* Global Command Palette (⌘K Spotlight) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          history={history}
          benchmarks={benchmarks}
          onSelectHistoryItem={handleSelectHistoryItem}
          onSelectBenchmark={handleSelectBenchmark}
          onOpenBenchmarksGallery={() => setActiveStage('benchmarks')}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
          onNewDecision={handleReset}
          onToggleTheme={handleToggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenExport={bundle && report ? () => setIsExportModalOpen(true) : undefined}
          onEditModel={decision ? () => setActiveStage('editor') : undefined}
          isDarkMode={isDarkMode}
          hasActiveReport={!!(bundle && report)}
        />

        {/* Export & Sharing Modal */}
        {bundle && report && (
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            bundle={bundle}
            report={report}
          />
        )}
      </Suspense>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
