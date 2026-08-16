import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StepProgressBar } from './components/StepProgressBar';
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

export function App() {
  const [step, setStep] = useState<'input' | 'editor' | 'report'>('input');
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  const [decision, setDecision] = useState<StructuredDecision | null>(null);
  const [bundle, setBundle] = useState<AnalysisBundle | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBenchmarks()
      .then(setBenchmarks)
      .catch((err) => {
        console.warn('Failed to load benchmarks from API:', err);
      });
  }, []);

  const handleExtract = async (narrative: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const extracted = await extractDecision(narrative);
      setDecision(extracted);
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
      
      setStep('report');
    } catch (err: any) {
      setError(err.message || 'Analysis run failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setDecision(null);
    setBundle(null);
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-space-950 flex flex-col selection:bg-brand-500/30 selection:text-brand-100">
      <Header onReset={handleReset} currentStep={step} />

      <main className="flex-1 pb-16">
        <StepProgressBar
          currentStep={step}
          onNavigate={(targetStep) => setStep(targetStep)}
          canEdit={!!decision}
          canReport={!!bundle && !!report}
        />

        {error && (
          <div className="max-w-4xl mx-auto px-4 mb-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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
          />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        <p>Phronesis (φρόνησις) — Auditable Human Judgment Under Uncertainty</p>
      </footer>
    </div>
  );
}

export default App;
