import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  Sparkles,
  Folder,
  X,
  Plus,
  Mic,
  FileText,
  BookOpen,
  FlaskConical,
  Compass
} from 'lucide-react';
import type { BenchmarkItem, LLMConfigOverride, EffortLevel } from '../../types';
import { ModelSelector } from '../../components/ModelSelector';
import { EffortSelector } from '../../components/EffortSelector';

interface NarrativeInputViewProps {
  benchmarks?: BenchmarkItem[];
  onExtract: (narrative: string) => Promise<void>;
  onSelectBenchmark?: (bm: BenchmarkItem) => void;
  isLoading: boolean;
  externalTextToAppend?: string;
  onClearExternalText?: () => void;
  initialNarrative?: string;
  isReEdit?: boolean;
  modelConfig: LLMConfigOverride;
  onModelConfigChange: (override: LLMConfigOverride) => void;
  effortLevel: EffortLevel;
  onEffortLevelChange: (effort: EffortLevel) => void;
  activeProjectId?: string;
  activeProjectName?: string;
  onClearActiveProject?: () => void;
  onOpenBenchmarksGallery?: () => void;
}

const STARTER_DILEMMAS = [
  {
    title: 'Startup vs Big Tech',
    text: 'I am deciding whether to remain in my stable enterprise software engineering job ($190k base + $120k unvested RSUs) or join an early-stage AI startup as a founding engineer (1% equity, $130k salary, 14 months runway). I value autonomy and upside, but worry about burn rate and loss of financial buffer.',
  },
  {
    title: 'Buy vs Rent Home',
    text: 'Deciding whether to purchase a $750k home with a 20% down payment at current 6.5% mortgage rates, or continue renting at $3,200/mo while investing capital in index funds. The key uncertainty is local property appreciation vs opportunity cost of equity over 7 years.',
  },
  {
    title: 'Product Launch vs Polish',
    text: 'We are deciding whether to launch our SaaS v1 immediately with basic features to validate customer demand, or spend 3 more months building advanced analytics and enterprise SSO. The risk is negative early reviews vs losing market timing to competitors.',
  },
  {
    title: 'VC Funding vs Bootstrapping',
    text: 'Deciding between raising a $2M seed round at a $10M valuation to scale marketing quickly, or continuing to bootstrap at $25k MRR growing 8% month-over-month. I am weighing dilution and loss of governance against competitive speed.',
  },
];

const LOADING_STEPS = [
  'Parsing alternatives and states of the world...',
  'Calibrating prior probability distributions...',
  'Mapping payoff matrices and testable assumptions...',
  'Synthesizing deterministic model workbench...',
];

export const NarrativeInputView: React.FC<NarrativeInputViewProps> = ({
  onExtract,
  isLoading,
  externalTextToAppend,
  onClearExternalText,
  initialNarrative,
  isReEdit,
  modelConfig,
  onModelConfigChange,
  effortLevel,
  onEffortLevelChange,
  activeProjectName,
  onClearActiveProject,
  onOpenBenchmarksGallery,
}) => {
  const [narrative, setNarrative] = useState(initialNarrative || '');
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  const plusMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close plus menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (externalTextToAppend) {
      setNarrative((prev) =>
        prev ? `${prev.trim()}\n\n${externalTextToAppend.trim()}` : externalTextToAppend.trim()
      );
      onClearExternalText?.();
    }
  }, [externalTextToAppend, onClearExternalText]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1200);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(240, Math.max(56, textareaRef.current.scrollHeight))}px`;
    }
  }, [narrative]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (narrative.trim().length >= 10 && !isLoading) {
      onExtract(narrative);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = narrative.trim().length >= 10 && !isLoading;

  return (
    <section id="section-describe" className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-7 animate-fade-in flex flex-col items-center justify-center min-h-[65vh]">
      {/* Centered Minimal Hero Greeting (ChatGPT Style) */}
      {!isReEdit && (
        <div className="text-center space-y-2 max-w-xl">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-main)]">
            Ready when you are.
          </h1>
          <p className="font-body text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            State your dilemma, strategic crossroads, or career choice. Phronesis structures the math, models downside regrets, and isolates key flipping variables.
          </p>
        </div>
      )}

      {/* Floating Prompt Capsule Form */}
      <div className="w-full max-w-3xl relative">
        {/* Scoped Project Banner if attached */}
        {activeProjectName && (
          <div className="mb-2 flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 text-xs font-ui text-[var(--color-verdigris)]">
            <div className="flex items-center space-x-2 truncate">
              <Folder className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate">Scoped Project: <strong>{activeProjectName}</strong></span>
            </div>
            {onClearActiveProject && (
              <button
                type="button"
                onClick={onClearActiveProject}
                className="p-0.5 hover:bg-[var(--color-verdigris)]/20 rounded transition-colors cursor-pointer text-[var(--color-verdigris)]"
                title="Detach project"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          /* Multi-step loading extraction visual */
          <div className="prompt-capsule p-8 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/40 flex items-center justify-center text-[var(--color-verdigris)] shadow-sm animate-bounce">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h3 className="font-display font-semibold text-sm text-[var(--text-main)]">
                Extracting Decision Parameters
              </h3>
              <p className="font-ui text-xs text-[var(--color-verdigris)] font-medium animate-pulse">
                {LOADING_STEPS[loadingStepIndex]}
              </p>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center space-x-2 pt-1">
              {LOADING_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === loadingStepIndex
                      ? 'bg-[var(--color-verdigris)] scale-125 ring-2 ring-[var(--color-verdigris)]/30'
                      : idx < loadingStepIndex
                      ? 'bg-[var(--color-verdigris)] opacity-60'
                      : 'bg-[var(--border-medium)]'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="prompt-capsule p-3.5 sm:p-4 space-y-2.5 relative">
            {/* Top Textarea Row */}
            <div className="px-1.5 pt-1">
              <textarea
                ref={textareaRef}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything or describe your decision..."
                rows={2}
                disabled={isLoading}
                className="w-full bg-transparent text-[var(--text-main)] placeholder-[var(--text-faint)] text-sm sm:text-base font-body leading-relaxed focus:outline-none resize-none overflow-y-auto"
              />
            </div>

            {/* Bottom Controls Row: Left [+] Action Button, Right [Model/Effort, Mic, Send Button] */}
            <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
              {/* Left: [+] Context Action Menu Button (Screenshot 2) */}
              <div className="relative" ref={plusMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                  title="Add context, benchmarks, or protocols"
                  aria-label="Add context or actions"
                >
                  <Plus className={`w-4 h-4 transition-transform ${isPlusMenuOpen ? 'rotate-45 text-[var(--color-verdigris)]' : ''}`} />
                </button>

                {/* Floating Context Popover Menu (Screenshot 2 style) */}
                {isPlusMenuOpen && (
                  <div className="chatgpt-popover absolute left-0 bottom-full mb-2 w-72 sm:w-80 p-2 z-50 animate-fade-in space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-ui font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                      Deliberation Tools
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        onOpenBenchmarksGallery?.();
                      }}
                      className="chatgpt-popover-item"
                    >
                      <BookOpen className="w-4 h-4 text-[var(--color-verdigris)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-ui font-medium leading-tight">Canonical Dilemmas</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">Browse startup, career & financial benchmarks</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        setNarrative((prev) =>
                          prev
                            ? `${prev}\n\n[Explicit Constraints]: \n[Prior Probabilities]: `
                            : `[Decision Statement]: \n[Key Alternatives]: \n[Critical Uncertainties]: `
                        );
                        textareaRef.current?.focus();
                      }}
                      className="chatgpt-popover-item"
                    >
                      <FileText className="w-4 h-4 text-[var(--color-ochre)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-ui font-medium leading-tight">Structured Template</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">Insert structured decision scaffolding</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        setNarrative((prev) =>
                          `${prev}\n\n[VoI Inquiry]: What test under $100 and <4 hours can falsify our critical assumption?`
                        );
                        textareaRef.current?.focus();
                      }}
                      className="chatgpt-popover-item"
                    >
                      <FlaskConical className="w-4 h-4 text-[var(--color-ochre)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-ui font-medium leading-tight">48-Hour VoI Protocol</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">Target high-leverage empirical falsification</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        setNarrative((prev) =>
                          `${prev}\n\n[Dialectic Prompt]: Apply the Stoic Dichotomy of Control to separate agency from external adiaphora.`
                        );
                        textareaRef.current?.focus();
                      }}
                      className="chatgpt-popover-item"
                    >
                      <Compass className="w-4 h-4 text-[var(--color-verdigris)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-ui font-medium leading-tight">Dialectic Lens Prompt</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">Inject multi-framework philosophical lens</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Model & Effort Selectors, Mic Icon, Submit Circle Button */}
              <div className="flex items-center space-x-2">
                <ModelSelector
                  value={modelConfig}
                  onChange={onModelConfigChange}
                  disabled={isLoading}
                />

                <EffortSelector
                  value={effortLevel}
                  onChange={onEffortLevelChange}
                  disabled={isLoading}
                />

                {/* Voice / Mic Indicator */}
                <button
                  type="button"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                  title="Voice input (dictation)"
                  onClick={() => textareaRef.current?.focus()}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Submit Circle Action Button (ChatGPT-style) */}
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!canSubmit}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs
                    ${
                      canSubmit
                        ? 'bg-[var(--color-verdigris)] text-white hover:opacity-90 active:scale-95'
                        : 'bg-[var(--bg-app)] text-[var(--text-faint)] cursor-not-allowed opacity-50 border border-[var(--border-subtle)]'
                    }
                  `}
                  title="Extract Decision Model (⌘ + Enter)"
                  aria-label="Extract Decision Model"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Starter Dilemma Chips below Capsule */}
      {!isReEdit && (
        <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-1">
          {STARTER_DILEMMAS.map((starter) => (
            <button
              key={starter.title}
              type="button"
              onClick={() => {
                setNarrative(starter.text);
                textareaRef.current?.focus();
              }}
              className="px-3 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-verdigris)]/50 text-xs font-ui text-[var(--text-main)] transition-all flex items-center space-x-1.5 group cursor-pointer shadow-2xs"
            >
              <span className="text-[var(--color-verdigris)] text-[10px] group-hover:scale-110 transition-transform">
                ✦
              </span>
              <span>{starter.title}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
