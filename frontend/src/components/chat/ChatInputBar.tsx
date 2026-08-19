import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles } from 'lucide-react';
import type { DeliberationLensId } from '../../types';

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  selectedLens: DeliberationLensId;
  currentStep: 'input' | 'editor' | 'report' | 'benchmarks';
}

const STEP_PROMPTS: Record<string, string[]> = {
  input: [
    'Surface unstated blind spots',
    'Brainstorm creative 3rd alternative',
    'What single unknown flips this choice?',
  ],
  editor: [
    'How should I calibrate 0-100 utilities?',
    'Check empirical base rates for this domain',
    'Steelman the least preferred path',
  ],
  report: [
    'Critique this 48h VoI experiment',
    'Explain Expected Utility vs Minimax Regret',
    'Where do Stoic and Kantian lenses clash?',
  ],
  benchmarks: [
    'Which canonical dilemma matches career pivot?',
    'Explain the benchmark payoff derivation',
  ],
};

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  isLoading,
  selectedLens,
  currentStep,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [inputValue]);

  // Initialize Web Speech API for voice dictation
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    onSendMessage(trimmed);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const promptStarters = STEP_PROMPTS[currentStep] || STEP_PROMPTS.input;

  return (
    <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] space-y-2.5">
      {/* Quick Prompt Starter Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Sparkles className="w-3 h-3 text-[var(--color-ochre)] shrink-0" />
        {promptStarters.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInputValue(prompt);
              setTimeout(() => textareaRef.current?.focus(), 50);
            }}
            className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-app)] border border-[var(--border-subtle)] hover:border-[var(--color-verdigris)]/40 text-[10.5px] font-ui text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Auto-expanding Smart Input Form */}
      <div className="relative flex items-end bg-[var(--bg-app)] border border-[var(--border-subtle)] focus-within:border-[var(--color-verdigris)] rounded-xl transition-all shadow-2xs">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Inquire through ${selectedLens} lens, explore trade-offs, or challenge assumptions...`}
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent py-2.5 pl-3.5 pr-20 text-xs font-ui text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none resize-none max-h-36 leading-relaxed"
        />

        {/* Right Input Controls (Voice & Send) */}
        <div className="absolute right-1.5 bottom-1.5 flex items-center space-x-1">
          {/* Voice Dictation Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
            }`}
            title={isRecording ? 'Stop Voice Recording' : 'Voice Dictate'}
          >
            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              inputValue.trim() && !isLoading
                ? 'bg-[var(--color-verdigris)] text-white shadow-xs hover:opacity-90'
                : 'text-[var(--text-faint)] opacity-40 cursor-not-allowed'
            }`}
            title="Send Inquiry (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="flex items-center justify-between text-[10px] text-[var(--text-faint)] font-mono px-1">
        <span>Enter to send · Shift+Enter for newline</span>
        <span>{inputValue.length} chars</span>
      </div>
    </div>
  );
};
