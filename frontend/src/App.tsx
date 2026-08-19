import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, type HistoryItem } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { ExportModal } from './components/ExportModal';
import { OrientationModal } from './components/OrientationModal';
import { MethodologyModal } from './components/MethodologyModal';
import { ToastProvider, useToast } from './components/Toast';
import { NarrativeInputView } from './features/input/NarrativeInputView';
import { CanonicalDilemmasView } from './features/benchmarks/CanonicalDilemmasView';
import { ModelEditorView } from './features/editor/ModelEditorView';
import { ReportView } from './features/report/ReportView';
import type {
  StructuredDecision,
  AnalysisBundle,
  ReportResponse,
  BenchmarkItem,
  FocusConfig
} from './types';
import {
  fetchBenchmarks,
  extractDecision,
  runDeterministicAnalysis,
  synthesizeReport
} from './lib/api';
import { AlertCircle, Sparkles } from 'lucide-react';

const LOCAL_STORAGE_THEME_KEY = 'phronesis_theme';
const LOCAL_STORAGE_HISTORY_KEY = 'phronesis_history';
const LOCAL_STORAGE_SIDEBAR_KEY = 'phronesis_sidebar';

function AppContent() {
  const { showToast } = useToast();
  const [step, setStep] = useState<'input' | 'editor' | 'report' | 'benchmarks'>('input');
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  const [decision, setDecision] = useState<StructuredDecision | null>(null);
  const [bundle, setBundle] = useState<AnalysisBundle | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [currentDecisionId, setCurrentDecisionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

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
    setStep('input');
    setDecision(null);
    setBundle(null);
    setReport(null);
    setCurrentDecisionId(undefined);
    setError(null);
  }, []);

  // Global Keyboard Shortcuts (⌘K, ⌘N, ⌘E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
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

  const handleExtract = async (narrative: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const extracted = await extractDecision(narrative);
      setDecision(extracted);
      setBundle(null);
      setReport(null);
      setCurrentDecisionId(undefined);
      setStep('editor');
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
    setDecision(bm.structured_decision);
    setBundle(null);
    setReport(null);
    setCurrentDecisionId(bm.id);
    setStep('editor');
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
        try {
          localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to persist history:', e);
        }
        return updated;
      });

      setStep('report');
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
      if (item.data.bundle && item.data.report) {
        setStep('report');
      } else if (item.data.decision) {
        setStep('editor');
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
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist history after deletion:', e);
      }
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
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist history after pin toggle:', e);
      }
      return updated;
    });
  };

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
        onOpenBenchmarksGallery={() => setStep('benchmarks')}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onNewDecision={handleReset}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onTogglePinHistoryItem={handleTogglePinHistoryItem}
        onClearHistory={handleClearHistory}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        currentDecisionId={currentDecisionId}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Reading & Interaction Column Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onReset={handleReset}
          currentStep={step}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onOpenExport={bundle && report ? () => setIsExportModalOpen(true) : undefined}
        />

        <main className="flex-1 pb-16">
          {error && (
            <div className="max-w-[760px] mx-auto px-4 mt-4">
              <div className="p-3.5 rounded-xl bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)] text-xs text-[var(--text-main)] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-[var(--color-ochre)] shrink-0" />
                <span className="font-ui">{error}</span>
              </div>
            </div>
          )}

          {step === 'input' && (
            <NarrativeInputView
              onExtract={handleExtract}
              isLoading={isLoading}
            />
          )}

          {step === 'benchmarks' && (
            <CanonicalDilemmasView
              benchmarks={benchmarks}
              onSelectBenchmark={handleSelectBenchmark}
              onBackToInput={() => setStep('input')}
            />
          )}

          {step === 'editor' && decision && (
            <ModelEditorView
              decision={decision}
              onUpdateDecision={setDecision}
              onRunAnalysis={handleRunAnalysis}
              onBackToInput={() => setStep('input')}
              isLoading={isLoading}
            />
          )}

          {step === 'report' && bundle && report && (
            <ReportView
              bundle={bundle}
              report={report}
              onEditModel={() => setStep('editor')}
              onNewDecision={handleReset}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          )}
        </main>

        {/* Subtle Disciplined Footer */}
        <footer className="border-t border-[var(--border-subtle)] py-6 text-center text-xs text-[var(--text-faint)] font-mono">
          <p>Phronesis (φρόνησις) · Auditable Human Judgment Under Uncertainty</p>
        </footer>
      </div>

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
        onOpenBenchmarksGallery={() => setStep('benchmarks')}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onNewDecision={handleReset}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={bundle && report ? () => setIsExportModalOpen(true) : undefined}
        onEditModel={decision ? () => setStep('editor') : undefined}
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
