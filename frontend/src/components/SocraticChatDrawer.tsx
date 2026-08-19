import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Compass,
  Trash2,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRight,
  Download,
  Bot,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type {
  StructuredDecision,
  AnalysisBundle,
  DeliberationLensId,
  ChatLayoutMode,
  ChatMessage,
  SuggestedAction
} from '../types';
import { sendDeliberationMessage } from '../lib/api';
import { ChatLensSelector, LENSES } from './chat/ChatLensSelector';
import { ChatMessageCard } from './chat/ChatMessageCard';
import { ChatInputBar } from './chat/ChatInputBar';

interface SocraticChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: 'input' | 'editor' | 'report' | 'benchmarks';
  decision?: StructuredDecision | null;
  bundle?: AnalysisBundle | null;
  layoutMode: ChatLayoutMode;
  onChangeLayoutMode: (mode: ChatLayoutMode) => void;
  onInsertText?: (text: string) => void;
  onInsertAlternative?: (alt: { name: string; description: string }) => void;
  onInsertAssumption?: (assump: { text: string; type?: string; testable?: boolean }) => void;
}

export const SocraticChatDrawer: React.FC<SocraticChatDrawerProps> = ({
  isOpen,
  onClose,
  currentStep,
  decision,
  bundle,
  layoutMode,
  onChangeLayoutMode,
  onInsertText,
  onInsertAlternative,
  onInsertAssumption,
}) => {
  const [selectedLens, setSelectedLens] = useState<DeliberationLensId>('socratic');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Greetings. I am your Socratic deliberation companion. I will not make your choice for you, but I will challenge your framing, probe your unstated assumptions, and stress-test trade-offs using multiple philosophical and analytical lenses.\n\nSelect a **Dialectic Lens** above or choose a prompt starter below to begin.',
      timestamp: Date.now(),
      lens: 'socratic',
      suggested_followups: [
        'Surface my blind spots',
        'Brainstorm creative 3rd alternative',
        'What single unknown flips this choice?',
      ],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showContextDetails, setShowContextDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Handle Escape key (only close in drawer or fullscreen mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && layoutMode !== 'docked') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, layoutMode, onClose]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
      lens: selectedLens,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Build math summary payload if available
      let mathSummary: Record<string, any> | undefined = undefined;
      if (bundle && bundle.math_layer) {
        mathSummary = {
          preferred_eu_alt:
            decision?.alternatives.find(
              (a) => a.id === bundle.math_layer.expected_utility.preferred_alternative_id
            )?.name || bundle.math_layer.expected_utility.preferred_alternative_id,
          minimax_regret_choice:
            decision?.alternatives.find(
              (a) => a.id === bundle.math_layer.minimax_regret.minimax_regret_choice
            )?.name || bundle.math_layer.minimax_regret.minimax_regret_choice,
          inflection_threshold:
            bundle.math_layer.sensitivity_analysis.inflection_threshold,
        };
      }

      // Collect flagged biases
      const flaggedBiases = bundle?.bias_layer.flagged_patterns.map((p) => p.name);

      const resp = await sendDeliberationMessage({
        messages: newHistory.map((m) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp,
          lens: m.lens,
        })),
        current_step: currentStep,
        lens: selectedLens,
        structured_decision: decision || null,
        math_summary: mathSummary,
        flagged_biases: flaggedBiases,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: resp.reply_text,
        timestamp: Date.now(),
        lens: (resp.lens_used as DeliberationLensId) || selectedLens,
        suggested_action: resp.suggested_action || undefined,
        suggested_followups: resp.suggested_followups,
        attribution: resp.attribution || undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn('Deliberation API failed, generating fallback response:', err);
      // Fallback local assistant response
      const fallbackMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: `### Deliberation Inquiry\n\nWhen examining your choice through the **${selectedLens.toUpperCase()}** perspective:\n\n1. What is the single highest-risk assumption in your plan?\n2. What irreversible downside are you willing to accept?\n\n*Dialectic Inquiry:* If external circumstances forced a 50% delay, what adjustment would preserve your core integrity?`,
        timestamp: Date.now(),
        lens: selectedLens,
        suggested_followups: [
          'Surface my blind spots',
          'Steelman the alternative path',
          'Design 48h VoI experiment',
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = (action: SuggestedAction) => {
    if (action.action_type === 'insert_alternative' && action.alternative_data && onInsertAlternative) {
      onInsertAlternative(action.alternative_data);
    } else if (action.action_type === 'insert_assumption' && action.assumption_data && onInsertAssumption) {
      onInsertAssumption(action.assumption_data);
    } else if (onInsertText) {
      onInsertText(action.text_to_insert);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Dialogue cleared. Ready for fresh Socratic inquiry.',
        timestamp: Date.now(),
        lens: selectedLens,
        suggested_followups: [
          'Surface my blind spots',
          'Steelman the alternative path',
          'Apply the Stoic dichotomy of control',
        ],
      },
    ]);
  };

  const handleExportTranscript = () => {
    const transcript = messages
      .map((m) => {
        const time = new Date(m.timestamp).toLocaleTimeString();
        const role = m.sender === 'user' ? 'YOU' : `SOCRATIC COMPANION (${m.lens || 'socratic'})`;
        return `### ${role} [${time}]\n\n${m.text}\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phronesis-socratic-dialogue-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const currentLensInfo = LENSES.find((l) => l.id === selectedLens) || LENSES[0];

  // Render Inner Content of the Workspace
  const innerContent = (
    <div className="h-full flex flex-col justify-between bg-[var(--bg-surface)] overflow-hidden">
      {/* Header Bar */}
      <div className="p-3 sm:p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-raised)] select-none">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs border shrink-0 transition-colors"
            style={{
              backgroundColor: `${currentLensInfo.accentColor}15`,
              borderColor: `${currentLensInfo.accentColor}40`,
              color: currentLensInfo.accentColor,
            }}
          >
            <Compass className="w-4.5 h-4.5 animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="font-display font-semibold text-xs sm:text-sm text-[var(--text-main)] truncate">
                Socratic Deliberation
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/20 shrink-0">
                Live
              </span>
            </div>
            <p className="text-[10px] font-ui text-[var(--text-muted)] truncate">
              {currentLensInfo.label} · {currentStep} workbench
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* Export Transcript */}
          <button
            type="button"
            onClick={handleExportTranscript}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            title="Export Dialogue Transcript (.md)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear Session */}
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            title="Clear Dialogue Session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Layout Switcher: Docked vs Drawer */}
          <button
            type="button"
            onClick={() =>
              onChangeLayoutMode(layoutMode === 'docked' ? 'drawer' : 'docked')
            }
            className="hidden sm:inline-flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-verdigris)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            title={layoutMode === 'docked' ? 'Switch to Overlay Drawer' : 'Dock Side-by-Side'}
          >
            {layoutMode === 'docked' ? (
              <PanelRightClose className="w-3.5 h-3.5" />
            ) : (
              <PanelRight className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Layout Switcher: Fullscreen */}
          <button
            type="button"
            onClick={() =>
              onChangeLayoutMode(layoutMode === 'fullscreen' ? 'drawer' : 'fullscreen')
            }
            className="hidden sm:inline-flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-verdigris)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            title={layoutMode === 'fullscreen' ? 'Restore Default Size' : 'Expand Fullscreen'}
          >
            {layoutMode === 'fullscreen' ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            aria-label="Close Deliberation Workspace"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Decision Context Accordion Bar */}
      {decision?.decision_statement && (
        <div className="bg-[var(--bg-app)] border-b border-[var(--border-subtle)] px-3 py-1.5 select-none">
          <button
            type="button"
            onClick={() => setShowContextDetails((prev) => !prev)}
            className="w-full flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="text-[var(--color-verdigris)] font-serif text-xs shrink-0">
                ✦
              </span>
              <span className="text-[10.5px] font-ui font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors truncate">
                Context: {decision.decision_statement}
              </span>
            </div>
            <div className="flex items-center space-x-1 shrink-0 text-[10px] text-[var(--text-faint)]">
              <span>{decision.alternatives.length} alts</span>
              {showContextDetails ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </div>
          </button>

          {/* Expandable Context Summary */}
          {showContextDetails && (
            <div className="mt-2 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-ui space-y-1.5 animate-fade-in">
              <div className="font-medium text-[var(--text-main)]">
                Alternatives in Model:
              </div>
              <ul className="list-disc list-inside text-[var(--text-muted)] space-y-0.5 pl-1">
                {decision.alternatives.map((a) => (
                  <li key={a.id}>
                    <strong>{a.name}</strong>: {a.description || 'No description'}
                  </li>
                ))}
              </ul>
              {bundle?.math_layer && (
                <div className="pt-1 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--color-verdigris)]">
                  Top Expected Utility:{' '}
                  {decision.alternatives.find(
                    (a) =>
                      a.id ===
                      bundle.math_layer.expected_utility.preferred_alternative_id
                  )?.name || bundle.math_layer.expected_utility.preferred_alternative_id}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lens Selector Pills */}
      <ChatLensSelector
        selectedLens={selectedLens}
        onSelectLens={(lens) => setSelectedLens(lens)}
      />

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-ui">
        {messages.map((m) => (
          <ChatMessageCard
            key={m.id}
            message={m}
            onExecuteAction={handleExecuteAction}
            onSelectFollowup={(prompt) => handleSendMessage(prompt)}
          />
        ))}

        {/* Loading Pulsing Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-[var(--text-muted)] p-2 animate-pulse">
            <Bot
              className="w-3.5 h-3.5 animate-spin-slow"
              style={{ color: currentLensInfo.accentColor }}
            />
            <span className="text-xs font-mono">
              Deliberating with {currentLensInfo.label}...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Smart Input Bar */}
      <ChatInputBar
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        selectedLens={selectedLens}
        currentStep={currentStep}
      />
    </div>
  );

  // Layout Rendering Modes:
  // 1. Fullscreen Mode
  if (layoutMode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--bg-app)] animate-fade-in flex flex-col">
        {innerContent}
      </div>
    );
  }

  // 2. Docked Side-by-Side Mode (Embedded in App layout)
  if (layoutMode === 'docked') {
    return (
      <aside className="w-full sm:w-[420px] lg:w-[460px] h-[calc(100vh-3.5rem)] sticky top-14 border-l border-[var(--border-strong)] shadow-lg z-20 flex flex-col animate-slide-in-right shrink-0">
        {innerContent}
      </aside>
    );
  }

  // 3. Drawer Overlay Mode (Default)
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
          className="w-screen max-w-lg bg-[var(--bg-surface)] border-l border-[var(--border-strong)] shadow-2xl flex flex-col justify-between transform transition-transform ease-in-out duration-300 animate-slide-in-right"
          onClick={(e) => e.stopPropagation()}
        >
          {innerContent}
        </aside>
      </div>
    </div>
  );
};
