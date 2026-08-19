import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  ArrowDownLeft,
  Compass
} from 'lucide-react';
import type { StructuredDecision } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  suggestedAction?: {
    label: string;
    textToInsert: string;
  };
}

interface SocraticChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: 'input' | 'editor' | 'report' | 'benchmarks';
  decision?: StructuredDecision | null;
  onInsertText?: (text: string) => void;
}

const STEP_PROMPTS = {
  input: [
    {
      label: 'Surface Blind Spots',
      prompt: 'What are the most common unstated assumptions or blind spots when framing a decision like this?',
    },
    {
      label: 'Brainstorm Alternatives',
      prompt: 'Help me generate 2 distinct, creative alternatives beyond a simplistic yes/no dilemma.',
    },
    {
      label: 'Stoic Framing',
      prompt: 'Apply the Stoic dichotomy of control to this situation: what is within my control vs external fate?',
    },
    {
      label: 'Isolate Key Unknown',
      prompt: 'What single piece of information, if known with 90% certainty, would completely flip this choice?',
    },
  ],
  editor: [
    {
      label: 'Calibrate Utilities',
      prompt: 'How should I think about setting utility ratings (0-100) to avoid extreme overconfidence?',
    },
    {
      label: 'Check Base Rates',
      prompt: 'What empirical base-rates should I keep in mind before locking in prior probabilities?',
    },
    {
      label: 'Steelman Weak Alternative',
      prompt: 'How can I steel-man the least preferred alternative so I do not dismiss it prematurely?',
    },
  ],
  report: [
    {
      label: 'Critique VoI Test',
      prompt: 'How can I make the suggested 48-hour experiment even cheaper and faster to execute?',
    },
    {
      label: 'Explain Regret Matrix',
      prompt: 'Explain the difference between maximizing expected utility vs minimizing maximum regret for this specific decision.',
    },
    {
      label: 'Challenge Philosophical Verdict',
      prompt: 'Where do the Kantian and Utilitarian perspectives clash most sharply in my results?',
    },
  ],
  benchmarks: [
    {
      label: 'Compare Scenarios',
      prompt: 'Which canonical dilemma is most analogous to an asymmetric career transition risk?',
    },
    {
      label: 'Explain Payoff Matrix',
      prompt: 'How are payoff utilities calculated in the canonical benchmarks?',
    },
  ],
};

export const SocraticChatDrawer: React.FC<SocraticChatDrawerProps> = ({
  isOpen,
  onClose,
  currentStep,
  decision,
  onInsertText,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Greetings. I am your Socratic deliberation companion. I will not make your choice for you, but I will challenge your framing, probe your unstated assumptions, and help you stress-test trade-offs. What aspects of your dilemma should we examine?',
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputValue.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate intelligent Socratic synthesis
    setTimeout(() => {
      let reply = '';
      let suggestedAction: ChatMessage['suggestedAction'] | undefined = undefined;
      const lower = query.toLowerCase();

      if (lower.includes('blind spot') || lower.includes('unstated assumption')) {
        reply = `When examining situations with high uncertainty, three frequent blind spots emerge:\n\n1. **Base-Rate Neglect**: Treating your scenario as unique while ignoring historical success/failure frequencies in this reference class.\n2. **False Dichotomy**: Assuming you must choose between extremes rather than staggering commitments with an option to pivot.\n3. **Sunk Cost Entanglement**: Factoring past emotional or capital investments that cannot be recovered.\n\n*Question for you:* Which of your assumptions is least supported by empirical verification?`;
        suggestedAction = {
          label: 'Insert Blind Spot Check',
          textToInsert: ' Key Unknowns: Examining base rates, potential pivot triggers, and non-recoverable commitments.',
        };
      } else if (lower.includes('alternative') || lower.includes('brainstorm')) {
        reply = `To broaden your alternative space beyond binary choice:\n\n• **Option C (Parallel De-risking)**: Keep current baseline while committing 10-15 hours/week to a low-exposure trial.\n• **Option D (Conditioned Pivot)**: Commit fully to the high-upside alternative for 90 days with explicit, non-negotiable exit thresholds.\n\n*Which of these mitigates irreversible downside while preserving upside?*`;
        suggestedAction = {
          label: 'Insert 3rd Alternative',
          textToInsert: ' Alternative 3: Hybrid Parallel De-risking (maintain primary baseline with milestone-gated trial exploration over 90 days).',
        };
      } else if (lower.includes('stoic') || lower.includes('control')) {
        reply = `Under the Epictetan **Dichotomy of Control**:\n\n• **Internals (Within Agency)**: Your ethical standards, diligence of preparation, risk calibration, and emotional composure.\n• **Externals (Indifferents)**: Market macroeconomic shifts, counterparty decisions, timeline delays, and competitor actions.\n\n*Stoic Maxim:* Never predicate peace of mind on outcomes governed by external agents.`;
      } else if (lower.includes('voi') || lower.includes('48-hour') || lower.includes('experiment')) {
        reply = `A high-leverage 48-hour Value of Information (VoI) experiment must satisfy three criteria:\n\n1. **Cost < $100 & < 4 hours of effort**.\n2. **Definite Falsification**: It must produce observable evidence that could force you to abandon your dominant assumption.\n3. **Direct Contact with Reality**: Customer interview, contract clause audit, or synthetic prototype testing.`;
        suggestedAction = {
          label: 'Insert 48h Test Template',
          textToInsert: ' 48-Hour Falsification Protocol: Conduct 3 structured stakeholder discovery calls to validate whether the core payoff assumption holds true.',
        };
      } else if (decision?.decision_statement) {
        reply = `Reflecting on your current dilemma:\n*"${decision.decision_statement}"*\n\nConsider: If you were advising a trusted colleague in this exact position, what advice would you give them from an objective 3rd-person vantage point? Often our own risk tolerance is distorted by immediate loss aversion.`;
      } else {
        reply = `A rigorous decision audit requires examining the payoff asymmetry:\n\n1. What is the **worst-case irreversible outcome** if your optimistic assumption is completely wrong?\n2. What is the **regret ratio** of acting and failing vs remaining passive and missing the inflection point?\n\nHow would you quantify the psychological cost of each?`;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: Date.now(),
        suggestedAction,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-fresh',
        sender: 'assistant',
        text: 'Conversation cleared. Ready for a fresh Socratic inquiry on your active dilemma.',
        timestamp: Date.now(),
      },
    ]);
  };

  const currentPrompts = STEP_PROMPTS[currentStep] || STEP_PROMPTS.input;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          className="w-screen max-w-md bg-[var(--bg-surface)] border-l border-[var(--border-strong)] shadow-2xl flex flex-col justify-between transform transition-transform ease-in-out duration-300 animate-slide-in-right"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-raised)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-verdigris)]/15 border border-[var(--color-verdigris)]/30 flex items-center justify-center text-[var(--color-verdigris)] shadow-2xs">
                <Compass className="w-4.5 h-4.5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-display font-semibold text-sm text-[var(--text-main)]">
                    Socratic Companion
                  </h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/20">
                    Ephemeral
                  </span>
                </div>
                <p className="text-[10px] font-ui text-[var(--text-muted)]">
                  Temporary deliberation & blind spot challenge
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Quick Context-Aware Starter Chips */}
          <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
            <div className="flex items-center space-x-1.5 mb-2 text-[10px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <Sparkles className="w-3 h-3 text-[var(--color-ochre)]" />
              <span>Prompt Starters ({currentStep})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentPrompts.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSend(p.prompt)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-verdigris)]/40 text-[11px] font-ui text-[var(--text-main)] transition-colors cursor-pointer text-left shadow-2xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-ui">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col space-y-1.5 ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] text-[var(--text-faint)] font-mono">
                  {m.sender === 'user' ? (
                    <>
                      <span>You</span>
                      <User className="w-3 h-3 text-[var(--color-ochre)]" />
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-[var(--color-verdigris)]" />
                      <span>Socratic Dialogue</span>
                    </>
                  )}
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[92%] leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-[var(--color-verdigris-subtle)] text-[var(--text-main)] border border-[var(--color-verdigris)]/30 rounded-tr-none font-ui'
                      : 'bg-[var(--bg-surface-raised)] text-[var(--text-main)] border border-[var(--border-subtle)] rounded-tl-none font-body shadow-2xs'
                  }`}
                >
                  {m.text}
                </div>

                {/* Optional Assistant Actions (Copy / Insert into Narrative) */}
                {m.sender === 'assistant' && (
                  <div className="flex items-center space-x-2 pt-0.5 px-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.text, m.id)}
                      className="text-[10px] font-ui text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-[var(--color-verdigris)]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {m.suggestedAction && onInsertText && (
                      <button
                        type="button"
                        onClick={() => {
                          onInsertText(m.suggestedAction!.textToInsert);
                        }}
                        className="text-[10px] font-ui text-[var(--color-verdigris)] hover:underline flex items-center space-x-1 cursor-pointer"
                        title="Insert into main dilemma input"
                      >
                        <ArrowDownLeft className="w-3 h-3" />
                        <span>{m.suggestedAction.label}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-[var(--text-muted)] p-2 animate-pulse">
                <Bot className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
                <span className="text-xs font-mono">Deliberating Socratic response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Field */}
          <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-raised)]">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or challenge assumptions..."
                className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl py-2.5 pl-3.5 pr-10 text-xs font-ui text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--color-verdigris)] transition-colors"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                className={`absolute right-1.5 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  inputValue.trim() && !isTyping
                    ? 'text-[var(--color-verdigris)] hover:bg-[var(--color-verdigris-subtle)]'
                    : 'text-[var(--text-faint)] cursor-not-allowed'
                }`}
                title="Send inquiry"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--text-faint)] font-mono mt-2 px-1">
              <span>Private in-memory session</span>
              <span>ESC to close</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
