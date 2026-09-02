import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastProvider } from './components/Toast';
import { useToast } from './components/useToast';
import { NarrativeInputView } from './features/input/NarrativeInputView';
import { CollapsedDescribeCard } from './components/CollapsedDescribeCard';
import { CollapsedCalibrateCard } from './components/CollapsedCalibrateCard';
import type {
  BenchmarkItem,
  ChatLayoutMode,
  LLMConfigOverride,
  EffortLevel,
  HistoryItem
} from './types';
import { fetchBenchmarks } from './lib/api';
import { useDecisionSession } from './lib/hooks/useDecisionSession';
import { useHistoryStore } from './lib/hooks/useHistoryStore';
import { useProjectStore } from './lib/hooks/useProjectStore';
import { AlertCircle, Sparkles, AlertTriangle, X } from 'lucide-react';

// Lazy-loaded secondary views and modal dialogs for bundle code-splitting
const CanonicalDilemmasView = lazy(() =>
  import('./features/benchmarks/CanonicalDilemmasView').then((m) => ({ default: m.CanonicalDilemmasView }))
);
const ProjectView = lazy(() =>
  import('./features/projects/ProjectView').then((m) => ({ default: m.ProjectView }))
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
const LegalModal = lazy(() =>
  import('./components/LegalModal').then((m) => ({ default: m.LegalModal }))
);

const LOCAL_STORAGE_THEME_KEY = 'phronesis_theme';
const LOCAL_STORAGE_SIDEBAR_KEY = 'phronesis_sidebar';
const LOCAL_STORAGE_CHAT_LAYOUT_KEY = 'phronesis_chat_layout';

function AppContent() {
  const { showToast } = useToast();

  // Model & Reasoning Effort configuration
  const [modelConfig, setModelConfig] = useState<LLMConfigOverride>(() => {
    try {
      const saved = localStorage.getItem('phronesis_preferred_model');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [effortLevel, setEffortLevel] = useState<EffortLevel>(() => {
    try {
      const saved = localStorage.getItem('phronesis_preferred_effort');
      return (saved as EffortLevel) || 'standard';
    } catch {
      return 'standard';
    }
  });

  const getEffectiveModelConfig = useCallback((): LLMConfigOverride => {
    const base = { ...modelConfig };
    try {
      const customKeysRaw = localStorage.getItem('phronesis_custom_api_keys');
      if (customKeysRaw) {
        const customKeys = JSON.parse(customKeysRaw);
        const provider = (base.provider || 'gemini').toLowerCase();
        if (customKeys[provider] && !base.api_key) {
          base.api_key = customKeys[provider];
        }
      }
    } catch {
      /* noop */
    }
    return base;
  }, [modelConfig]);

  // 1. History Store Hook
  const historyStore = useHistoryStore(showToast);

  // 2. Decision Session Hook
  const session = useDecisionSession({
    getEffectiveModelConfig,
    effortLevel,
    onAnalysisComplete: historyStore.addHistoryItem,
    showToast,
  });

  // 3. Project Store Hook
  const projectStore = useProjectStore({
    showToast,
    onDecisionLoadedFromProject: ({ decision, bundle, report, decisionId, narrative }) => {
      session.setDecision(decision);
      session.setBundle(bundle);
      session.setReport(report);
      session.setCurrentDecisionId(decisionId);
      session.setSubmittedNarrative(narrative);
      session.setActiveStage('report');
    },
    onResetSession: session.handleReset,
  });

  // Data state: benchmarks
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  useEffect(() => {
    fetchBenchmarks().then(setBenchmarks).catch(console.warn);
  }, []);

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'faq' | 'credits' | 'terms' | 'privacy'>('faq');
  const [isOrientationOpen, setIsOrientationOpen] = useState(() => {
    try {
      return localStorage.getItem('phronesis_orientation_dismissed') !== 'true';
    } catch {
      return true;
    }
  });

  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [externalTextToAppend, setExternalTextToAppend] = useState<string | undefined>(undefined);
  const [chatLayoutMode, setChatLayoutMode] = useState<ChatLayoutMode>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CHAT_LAYOUT_KEY);
    return (saved as ChatLayoutMode) || 'drawer';
  });

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

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => setIsDarkMode((prev) => !prev);

  const handleOpenLegal = useCallback((tab: 'faq' | 'credits' | 'terms' | 'privacy' = 'faq') => {
    setLegalTab(tab);
    setIsLegalOpen(true);
  }, []);

  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (item.data) {
      session.setDecision(item.data.decision || null);
      session.setBundle(item.data.bundle || null);
      session.setReport(item.data.report || null);
      session.setCurrentDecisionId(item.id);
      session.setIsEditingDescribe(false);

      if (item.data.decision) {
        session.setSubmittedNarrative(item.previewText || item.data.decision.decision_statement);
      }

      if (item.data.bundle && item.data.report) {
        session.setActiveStage('report');
      } else if (item.data.decision) {
        session.setActiveStage('editor');
      }
      showToast({
        type: 'info',
        title: 'Dossier Loaded',
        description: `Opened "${item.title}".`,
      });
    }
  };

  const handleInsertAlternative = useCallback((alt: { name: string; description: string }) => {
    const newId = `alt_${Date.now()}`;
    const newAlt = {
      id: newId,
      name: alt.name,
      description: alt.description || '',
    };
    session.setDecision((prev) => {
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
    if (session.activeStage === 'input') {
      session.setActiveStage('editor');
    }
    showToast({
      type: 'success',
      title: 'Alternative Added',
      description: `Added "${alt.name}" to your decision model.`,
    });
  }, [session, showToast]);

  const handleInsertAssumption = useCallback((assump: { text: string; type?: string; testable?: boolean }) => {
    const newAssumption = {
      id: `a_${Date.now()}`,
      text: assump.text,
      type: assump.type || 'empirical',
      testable: assump.testable !== false,
    };
    session.setDecision((prev) => {
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
  }, [session, showToast]);

  const handleChangeChatLayoutMode = useCallback((mode: ChatLayoutMode) => {
    setChatLayoutMode(mode);
    try {
      localStorage.setItem(LOCAL_STORAGE_CHAT_LAYOUT_KEY, mode);
    } catch (e) {
      console.warn('Failed to save chat layout mode:', e);
    }
  }, []);

  // Global Keyboard Shortcuts (⌘K, ⌘N, ⌘J, ⌘B, ⌘,)
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
      } else if ((e.metaKey || e.ctrlKey) && (e.key === ',' || e.key === '/')) {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        session.handleReset();
        projectStore.clearActiveProject();
        showToast({
          type: 'info',
          title: 'New Decision',
          description: 'Cleared workspace for fresh analysis.',
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, projectStore, showToast]);

  // Section anchor scroll
  const handleScrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Step and section visibility
  const currentStep = session.activeStage as 'input' | 'editor' | 'report' | 'benchmarks';
  const showDescribeActive = session.activeStage === 'input';
  const showDescribeCollapsed = session.activeStage === 'editor' || session.activeStage === 'report';
  const showCalibrate = session.activeStage === 'editor' || session.activeStage === 'report';
  const showCalibrateCollapsed = session.activeStage === 'report';
  const showCalibrateActive = session.activeStage === 'editor';
  const showReport = session.activeStage === 'report';
  const showBenchmarks = session.activeStage === 'benchmarks';
  const showProject = session.activeStage === 'project' && !!projectStore.viewingProjectId;

  const activeProjectObj = projectStore.projects.find((p) => p.id === projectStore.activeProjectId);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex">
      {/* Collapsible / Responsive Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        history={historyStore.history}
        benchmarks={benchmarks}
        projects={projectStore.projects}
        activeProjectId={projectStore.viewingProjectId || projectStore.activeProjectId}
        onSelectProject={projectStore.handleSelectProject}
        onCreateProject={projectStore.handleCreateProject}
        onDeleteProject={projectStore.handleDeleteProject}
        onSelectHistoryItem={handleSelectHistoryItem}
        onSelectBenchmark={session.handleSelectBenchmark}
        onOpenBenchmarksGallery={() => session.setActiveStage('benchmarks')}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onNewDecision={() => {
          session.handleReset();
          projectStore.clearActiveProject();
        }}
        onDeleteHistoryItem={historyStore.handleDeleteHistoryItem}
        onTogglePinHistoryItem={historyStore.handleTogglePinHistoryItem}
        onRenameHistoryItem={historyStore.handleRenameHistoryItem}
        onDuplicateHistoryItem={historyStore.handleDuplicateHistoryItem}
        onExportHistoryItem={historyStore.handleExportSingleHistoryItem}
        onClearHistory={historyStore.handleClearHistory}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        currentDecisionId={session.currentDecisionId}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenLegal={handleOpenLegal}
      />

      {/* Main Content Area: Supports Docked Split-Screen Mode */}
      <div className="flex-1 flex min-w-0">
        {/* Primary Reading & Interaction Column Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onReset={() => {
              session.handleReset();
              projectStore.clearActiveProject();
            }}
            currentStep={currentStep}
            activeStage={session.activeStage}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
            onOpenExport={session.bundle && session.report ? () => setIsExportModalOpen(true) : undefined}
            onToggleChat={() => setIsChatDrawerOpen((prev) => !prev)}
            isChatOpen={isChatDrawerOpen}
            onScrollToSection={handleScrollToSection}
            hasDecision={!!session.decision}
            hasReport={!!(session.bundle && session.report)}
            isTemporarySession={historyStore.isTemporarySession}
            onToggleTemporarySession={historyStore.handleToggleTemporarySession}
          />

          <main className="flex-1 pb-16">
            {session.error && (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 mt-4">
                <div className="p-3.5 rounded-xl bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)] text-xs text-[var(--text-main)] flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-[var(--color-ochre)] shrink-0" />
                  <span className="font-ui">{session.error}</span>
                </div>
              </div>
            )}

            {/* --- ACCUMULATING SECTIONS (When not in full-page standalone views) --- */}
            {!showBenchmarks && !showProject && (
              <div className="space-y-6 py-4">

                {/* SECTION 1: Describe */}
                <div ref={session.describeSectionRef}>
                  {showDescribeCollapsed && !session.isEditingDescribe && session.submittedNarrative && (
                    <CollapsedDescribeCard
                      narrative={session.submittedNarrative}
                      onEdit={session.handleRequestEditDescribe}
                      isEditDisabled={session.isLoading}
                    />
                  )}

                  {(showDescribeActive || session.isEditingDescribe) && (
                    <NarrativeInputView
                      onExtract={session.handleExtract}
                      isLoading={session.isLoading}
                      externalTextToAppend={externalTextToAppend}
                      onClearExternalText={() => setExternalTextToAppend(undefined)}
                      initialNarrative={session.isEditingDescribe ? session.submittedNarrative : undefined}
                      isReEdit={session.isEditingDescribe}
                      modelConfig={modelConfig}
                      onModelConfigChange={setModelConfig}
                      effortLevel={effortLevel}
                      onEffortLevelChange={setEffortLevel}
                      activeProjectId={projectStore.activeProjectId}
                      activeProjectName={activeProjectObj?.name}
                      onClearActiveProject={projectStore.clearActiveProject}
                      onOpenBenchmarksGallery={() => session.setActiveStage('benchmarks')}
                    />
                  )}
                </div>

                {/* SECTION 2: Calibrate */}
                {showCalibrate && (
                  <div ref={session.calibrateSectionRef}>
                    {showCalibrateCollapsed && session.decision && (
                      <CollapsedCalibrateCard
                        decision={session.decision}
                        onEdit={session.handleRequestEditCalibrate}
                        isEditDisabled={session.isLoading}
                      />
                    )}

                    {showCalibrateActive && session.decision && (
                      <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] animate-pulse">Loading calibration view...</div>}>
                        <section id="section-calibrate">
                          <ModelEditorView
                            decision={session.decision}
                            onUpdateDecision={session.setDecision}
                            onRunAnalysis={session.handleRunAnalysis}
                            isLoading={session.isLoading}
                          />
                        </section>
                      </Suspense>
                    )}
                  </div>
                )}

                {/* SECTION 3: Audit Report */}
                {showReport && session.bundle && session.report && (
                  <div ref={session.reportSectionRef}>
                    <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] animate-pulse">Loading report view...</div>}>
                      <section id="section-report">
                        <ReportView
                          bundle={session.bundle}
                          report={session.report}
                          onNewDecision={() => {
                            session.handleReset();
                            projectStore.clearActiveProject();
                          }}
                          onOpenExport={() => setIsExportModalOpen(true)}
                          onApplySandboxModel={(updated) => {
                            session.setDecision(updated);
                            session.setBundle(null);
                            session.setReport(null);
                            session.setActiveStage('editor');
                            showToast({
                              type: 'info',
                              title: 'Perturbations Applied',
                              description: 'Model updated with sandbox parameters. Re-run reasoning audit to refresh dossier.',
                            });
                          }}
                        />
                      </section>
                    </Suspense>
                  </div>
                )}
              </div>
            )}

            {/* Project Workspace View */}
            {showProject && projectStore.viewingProjectId && (
              <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] animate-pulse">Loading project view...</div>}>
                <ProjectView
                  projectId={projectStore.viewingProjectId}
                  onNewDecisionInProject={projectStore.handleNewDecisionInProject}
                  onSelectDecision={projectStore.handleSelectDecisionFromProject}
                  onCloseProjectView={() => {
                    projectStore.setViewingProjectId(null);
                    session.setActiveStage('input');
                  }}
                  onProjectDeleted={() => {
                    projectStore.refreshProjects();
                    projectStore.setViewingProjectId(null);
                    session.setActiveStage('input');
                  }}
                />
              </Suspense>
            )}

            {/* Benchmarks Gallery (standalone view, not part of session flow) */}
            <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] animate-pulse">Loading view...</div>}>
              {showBenchmarks && (
                <CanonicalDilemmasView
                  benchmarks={benchmarks}
                  onSelectBenchmark={session.handleSelectBenchmark}
                  onBackToInput={() => session.setActiveStage('input')}
                />
              )}
            </Suspense>
          </main>

          {/* Subtle Disciplined Footer */}
          <footer className="py-6 text-center text-xs text-[var(--text-faint)] font-mono">
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
              decision={session.decision}
              bundle={session.bundle}
              layoutMode={chatLayoutMode}
              onChangeLayoutMode={handleChangeChatLayoutMode}
              llmConfig={getEffectiveModelConfig()}
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
            decision={session.decision}
            bundle={session.bundle}
            layoutMode={chatLayoutMode}
            onChangeLayoutMode={handleChangeChatLayoutMode}
            llmConfig={getEffectiveModelConfig()}
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
      {session.isLoading && session.loadingStage && (
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
              {session.loadingStage}
            </p>
          </div>
        </div>
      )}

      {/* --- Edit-and-Regenerate Confirmation Modal --- */}
      {session.pendingEditSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                  {session.pendingEditSection === 'describe'
                    ? 'Edit Dilemma Description?'
                    : 'Edit Model Calibration?'}
                </h3>
                <p className="font-body text-sm text-[var(--text-muted)] leading-relaxed">
                  {session.pendingEditSection === 'describe'
                    ? 'Editing the description will regenerate both the Calibration and Audit Report sections below. Your current calibration settings and report will be cleared.'
                    : 'Editing the calibration will regenerate the Audit Report section below. Your current report will be cleared.'}
                </p>
              </div>
              <button
                type="button"
                onClick={session.handleCancelEdit}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={session.handleCancelEdit}
                className="px-4 py-2 rounded-xl text-sm font-ui font-medium text-[var(--text-main)] bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={session.handleConfirmEdit}
                className="px-4 py-2 rounded-xl text-sm font-ui font-medium text-white bg-[var(--color-ochre)] hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                {session.pendingEditSection === 'describe' ? 'Edit & Regenerate' : 'Edit & Re-audit'}
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
            historyStore.handleClearHistory();
          }}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
          onOpenLegal={handleOpenLegal}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />

        {/* Global Command Palette (⌘K Spotlight) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          history={historyStore.history}
          benchmarks={benchmarks}
          onSelectHistoryItem={handleSelectHistoryItem}
          onSelectBenchmark={session.handleSelectBenchmark}
          onOpenBenchmarksGallery={() => session.setActiveStage('benchmarks')}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
          onNewDecision={() => {
            session.handleReset();
            projectStore.clearActiveProject();
          }}
          onToggleTheme={handleToggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenExport={session.bundle && session.report ? () => setIsExportModalOpen(true) : undefined}
          onEditModel={session.decision ? () => session.setActiveStage('editor') : undefined}
          onOpenLegal={handleOpenLegal}
          isDarkMode={isDarkMode}
          hasActiveReport={!!(session.bundle && session.report)}
        />

        {/* Legal, Help & Governance Modal */}
        <LegalModal
          isOpen={isLegalOpen}
          onClose={() => setIsLegalOpen(false)}
          initialTab={legalTab}
        />

        {/* Export & Sharing Modal */}
        {session.bundle && session.report && (
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            bundle={session.bundle}
            report={session.report}
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
