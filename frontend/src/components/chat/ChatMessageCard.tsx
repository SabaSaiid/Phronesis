import React, { useState } from 'react';
import {
  User,
  Copy,
  Check,
  PlusCircle,
  FlaskConical,
  Layers,
  Sparkles
} from 'lucide-react';
import type { ChatMessage, SuggestedAction } from '../../types';
import { LENSES } from './ChatLensSelector';

interface ChatMessageCardProps {
  message: ChatMessage;
  onExecuteAction?: (action: SuggestedAction) => void;
  onSelectFollowup?: (prompt: string) => void;
}

// Simple lightweight Markdown formatter for rich structured dialogues
export const FormattedMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed font-body">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="font-display font-semibold text-xs sm:text-sm text-[var(--text-main)] pt-1 text-[var(--color-verdigris)] flex items-center space-x-1.5"
            >
              <span>{trimmed.replace('### ', '')}</span>
            </h4>
          );
        }
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={idx} className="font-ui font-semibold text-xs text-[var(--text-main)] pt-1">
              {trimmed.replace('#### ', '')}
            </h5>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-[var(--color-verdigris)]/60 pl-3 py-1 my-1 italic text-[var(--text-muted)] bg-[var(--color-verdigris-subtle)]/40 rounded-r-md"
            >
              <InlineText text={trimmed.replace(/^>\s*/, '')} />
            </blockquote>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || /^\d+\.\s/.test(trimmed)) {
          const bulletContent = trimmed.replace(/^([-•]|\d+\.)\s*/, '');
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1.5">
              <span className="text-[var(--color-verdigris)] shrink-0 font-bold">•</span>
              <div className="flex-1">
                <InlineText text={bulletContent} />
              </div>
            </div>
          );
        }

        // Code blocks / mono lines
        if (trimmed.startsWith('```') || trimmed.endsWith('```')) {
          const code = trimmed.replace(/```[a-z]*/g, '').trim();
          if (!code) return null;
          return (
            <div
              key={idx}
              className="font-mono text-[11px] bg-[var(--bg-app)] p-2.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-main)] overflow-x-auto whitespace-pre my-1.5"
            >
              {code}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx}>
            <InlineText text={line} />
          </p>
        );
      })}
    </div>
  );
};

// Inline helper for bold, italic, code pills
const InlineText: React.FC<{ text: string }> = ({ text }) => {
  // Regex to split by bold **text**, italic *text*, inline code `code`
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-[var(--text-main)]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={i} className="italic text-[var(--text-main)]">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--color-ochre)]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export const ChatMessageCard: React.FC<ChatMessageCardProps> = ({
  message,
  onExecuteAction,
  onSelectFollowup,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === 'user';
  const lensInfo = LENSES.find((l) => l.id === message.lens) || LENSES[0];
  const LensIcon = lensInfo.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-col space-y-2 animate-fade-in ${
        isUser ? 'items-end' : 'items-start'
      }`}
    >
      {/* Header Attribution Line */}
      <div className="flex items-center space-x-1.5 text-[10px] text-[var(--text-faint)] font-mono px-1">
        {isUser ? (
          <>
            <span>You</span>
            <User className="w-3 h-3 text-[var(--color-ochre)]" />
          </>
        ) : (
          <>
            <LensIcon
              className="w-3 h-3"
              style={{ color: lensInfo.accentColor }}
            />
            <span className="font-medium text-[var(--text-muted)]">
              {lensInfo.label}
            </span>
            {message.attribution && (
              <>
                <span>·</span>
                <span className="truncate max-w-[150px] opacity-75">
                  {message.attribution.source}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Message Bubble Container */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl max-w-[95%] sm:max-w-[90%] shadow-2xs leading-relaxed transition-all ${
          isUser
            ? 'bg-[var(--color-verdigris-subtle)] text-[var(--text-main)] border border-[var(--color-verdigris)]/30 rounded-tr-none font-ui'
            : 'bg-[var(--bg-surface-raised)] text-[var(--text-main)] border border-[var(--border-subtle)] rounded-tl-none font-body shadow-xs'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-xs">{message.text}</p>
        ) : (
          <FormattedMarkdown text={message.text} />
        )}

        {/* Structured Action Recommendation Card */}
        {message.suggested_action && (
          <div className="mt-3.5 pt-3 border-t border-[var(--border-subtle)]">
            <div className="p-2.5 rounded-xl bg-[var(--bg-app)] border border-[var(--color-verdigris)]/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[11px] font-ui font-semibold text-[var(--color-verdigris)]">
                  {message.suggested_action.action_type === 'insert_alternative' ? (
                    <Layers className="w-3.5 h-3.5" />
                  ) : message.suggested_action.action_type === 'test_protocol' ? (
                    <FlaskConical className="w-3.5 h-3.5 text-[var(--color-ochre)]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Actionable Recommendation</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-faint)] border border-[var(--border-subtle)]">
                  {message.suggested_action.action_type}
                </span>
              </div>

              <p className="text-[11px] font-body text-[var(--text-muted)] leading-relaxed italic">
                "{message.suggested_action.text_to_insert.trim()}"
              </p>

              {onExecuteAction && (
                <button
                  type="button"
                  onClick={() => onExecuteAction(message.suggested_action!)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg btn-verdigris text-xs font-ui font-medium flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs hover:shadow-xs transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{message.suggested_action.label}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assistant Utility Bar (Copy, Actions) */}
      {!isUser && (
        <div className="flex items-center space-x-3 px-1.5 pt-0.5">
          <button
            type="button"
            onClick={handleCopy}
            className="text-[10px] font-ui text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center space-x-1 cursor-pointer transition-colors"
            title="Copy message text"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[var(--color-verdigris)]" />
                <span className="text-[var(--color-verdigris)]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Dynamic Suggested Follow-Up Prompt Chips */}
      {!isUser && message.suggested_followups && message.suggested_followups.length > 0 && onSelectFollowup && (
        <div className="flex flex-wrap gap-1.5 pt-1 max-w-[95%] sm:max-w-[90%]">
          {message.suggested_followups.map((followup, fIdx) => (
            <button
              key={fIdx}
              type="button"
              onClick={() => onSelectFollowup(followup)}
              className="px-2.5 py-1 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-verdigris)]/40 text-[10.5px] font-ui text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all flex items-center space-x-1 cursor-pointer shadow-2xs group"
            >
              <span className="text-[var(--color-ochre)] font-serif group-hover:translate-x-0.5 transition-transform">
                ↳
              </span>
              <span>{followup}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
