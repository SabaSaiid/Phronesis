import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, type HistoryItem } from './components/Sidebar';
import { NarrativeInputView } from './features/input/NarrativeInputView';
import { ModelEditorView } from './features/editor/ModelEditorView';
import { ReportView } from './features/report/ReportView';
import type {
  StructuredDecision,
  AnalysisBundle,
  ReportResponse,
  BenchmarkItem
} from './types';
import {
  fetchBenchmarks,
  extractDecision,
  runDeterministicAnalysis,
  synthesizeReport
} from './lib/api';
import { AlertCircle } from 'lucide-react';

const LOCAL_STORAGE_THEME_KEY = 'phronesis_theme';
const LOCAL_STORAGE_HISTORY_KEY = 'phronesis_history';
const LOCAL_STORAGE_SIDEBAR_KEY = 'phronesis_sidebar';

export function App() {
  const [step, setStep] = useState<'input' | 'editor' | 'report'>('input');
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  const [decision, setDecision] = useState<StructuredDecision | null>(null);
  const [bundle, setBundle] = useState<AnalysisBundle | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [currentDecisionId, setCurrentDecisionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

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
    } catch (err: any) {
      setError(err.message || 'Extraction failed. Please try again.');
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
  };

  const handleRunAnalysis = async () => {
    if (!decision) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Run deterministic engines
      const analysisBundle = await runDeterministicAnalysis(decision);
      setBundle(analysisBundle);

      // 2. Synthesize report
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
        data: {
          decision,
          bundle: analysisBundle,
          report: rep,
        },
      };

      setHistory((prev) => {
        const updated = [newHistoryItem, ...prev.filter((item) => item.title !== newHistoryItem.title)].slice(0, 15);
        try {
          localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to persist history:', e);
        }
        return updated;
      });

      setStep('report');
    } catch (err: any) {
      setError(err.message || 'Analysis run failed.');
    } finally {
      setIsLoading(false);
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
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch (e) {
      console.warn('Failed to clear history:', e);
    }
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

  const handleReset = () => {
    setStep('input');
    setDecision(null);
    setBundle(null);
    setReport(null);
    setCurrentDecisionId(undefined);
    setError(null);
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
        onNewDecision={handleReset}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        currentDecisionId={currentDecisionId}
      />

      {/* Main Reading & Interaction Column Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onReset={handleReset}
          currentStep={step}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />

        <main className="flex-1 pb-16">
          {error && (
            <div className="max-w-[720px] mx-auto px-4 mt-4">
              <div className="p-3.5 rounded-xl bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)] text-xs text-[var(--text-main)] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-[var(--color-ochre)] shrink-0" />
                <span className="font-ui">{error}</span>
              </div>
            </div>
          )}

          {step === 'input' && (
            <NarrativeInputView
              benchmarks={benchmarks}
              onExtract={handleExtract}
              onSelectBenchmark={handleSelectBenchmark}
              isLoading={isLoading}
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
            />
          )}
        </main>

        {/* Subtle Disciplined Footer */}
        <footer className="border-t border-[var(--border-subtle)] py-6 text-center text-xs text-[var(--text-faint)] font-mono">
          <p>Phronesis (φρόνησις) · Auditable Human Judgment Under Uncertainty</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
