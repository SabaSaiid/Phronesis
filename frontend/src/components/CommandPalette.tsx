import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  PlusCircle,
  Clock,
  BookOpen,
  Sun,
  Moon,
  Settings,
  Share2,
  Sliders,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import type { BenchmarkItem } from '../types';
import type { HistoryItem } from './Sidebar';
import { formatRelativeTime } from '../lib/formatTime';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  benchmarks: BenchmarkItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onSelectBenchmark: (bm: BenchmarkItem) => void;
  onOpenBenchmarksGallery?: () => void;
  onOpenMethodology?: () => void;
  onNewDecision: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenExport?: () => void;
  onEditModel?: () => void;
  isDarkMode: boolean;
  hasActiveReport: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  history,
  benchmarks,
  onSelectHistoryItem,
  onSelectBenchmark,
  onOpenBenchmarksGallery,
  onOpenMethodology,
  onNewDecision,
  onToggleTheme,
  onOpenSettings,
  onOpenExport,
  onEditModel,
  isDarkMode,
  hasActiveReport,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Actions list
  const actions = [
    {
      id: 'action-new',
      type: 'action',
      title: 'New Decision Analysis',
      subtitle: 'Start blank narrative extraction (⌘N)',
      icon: PlusCircle,
      iconColor: 'text-[var(--color-verdigris)]',
      handler: () => {
        onNewDecision();
        onClose();
      },
    },
    ...(onOpenBenchmarksGallery
      ? [
          {
            id: 'action-benchmarks',
            type: 'action',
            title: 'Browse Canonical Dilemmas Gallery',
            subtitle: 'Explore pre-calibrated reference dilemma library',
            icon: BookOpen,
            iconColor: 'text-[var(--color-verdigris)]',
            handler: () => {
              onOpenBenchmarksGallery();
              onClose();
            },
          },
        ]
      : []),
    ...(onOpenMethodology
      ? [
          {
            id: 'action-methodology',
            type: 'action',
            title: 'Architecture & Theoretical Lineage',
            subtitle: 'Inspect deterministic math, bias models & VoI design',
            icon: BookOpen,
            iconColor: 'text-[var(--color-ochre)]',
            handler: () => {
              onOpenMethodology();
              onClose();
            },
          },
        ]
      : []),
    ...(hasActiveReport && onEditModel
      ? [
          {
            id: 'action-calibrate',
            type: 'action',
            title: 'Calibrate Model Parameters',
            subtitle: 'Adjust probabilities and payoff matrix',
            icon: Sliders,
            iconColor: 'text-[var(--color-verdigris)]',
            handler: () => {
              onEditModel();
              onClose();
            },
          },
        ]
      : []),
    ...(hasActiveReport && onOpenExport
      ? [
          {
            id: 'action-export',
            type: 'action',
            title: 'Export & Share Audit Report',
            subtitle: 'Download Markdown, JSON, or copy summary',
            icon: Share2,
            iconColor: 'text-[var(--color-ochre)]',
            handler: () => {
              onOpenExport();
              onClose();
            },
          },
        ]
      : []),
    {
      id: 'action-theme',
      type: 'action',
      title: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'Toggle aesthetic appearance',
      icon: isDarkMode ? Sun : Moon,
      iconColor: isDarkMode ? 'text-[var(--color-ochre)]' : 'text-[var(--color-verdigris)]',
      handler: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'action-settings',
      type: 'action',
      title: 'Settings & Storage Management',
      subtitle: 'Inspect local storage and engine parameters',
      icon: Settings,
      iconColor: 'text-[var(--text-muted)]',
      handler: () => {
        onOpenSettings();
        onClose();
      },
    },
  ];

  // Filtered items
  const cleanQ = query.toLowerCase().trim();

  const filteredActions = actions.filter(
    (a) => a.title.toLowerCase().includes(cleanQ) || a.subtitle.toLowerCase().includes(cleanQ)
  );

  const filteredHistory = history.filter(
    (h) => h.title.toLowerCase().includes(cleanQ) || (h.previewText && h.previewText.toLowerCase().includes(cleanQ))
  );

  const filteredBenchmarks = benchmarks.filter(
    (b) => b.title.toLowerCase().includes(cleanQ) || b.narrative.toLowerCase().includes(cleanQ)
  );

  const allItems: Array<{
    id: string;
    section: 'Actions' | 'Past Decisions' | 'Canonical Dilemmas';
    title: string;
    subtitle?: string;
    badge?: string;
    icon: any;
    iconColor?: string;
    handler: () => void;
  }> = [
    ...filteredActions.map((a) => ({
      id: a.id,
      section: 'Actions' as const,
      title: a.title,
      subtitle: a.subtitle,
      icon: a.icon,
      iconColor: a.iconColor,
      handler: a.handler,
    })),
    ...filteredHistory.map((h) => ({
      id: h.id,
      section: 'Past Decisions' as const,
      title: h.title,
      subtitle: h.previewText ? `${h.previewText.slice(0, 70)}...` : undefined,
      badge: formatRelativeTime(h.timestamp),
      icon: Clock,
      iconColor: 'text-[var(--color-verdigris)]',
      handler: () => {
        onSelectHistoryItem(h);
        onClose();
      },
    })),
    ...filteredBenchmarks.map((b) => ({
      id: b.id,
      section: 'Canonical Dilemmas' as const,
      title: b.title,
      subtitle: `${b.narrative.slice(0, 75)}...`,
      badge: 'Benchmark',
      icon: BookOpen,
      iconColor: 'text-[var(--color-ochre)]',
      handler: () => {
        onSelectBenchmark(b);
        onClose();
      },
    })),
  ];

  // Handle keyboard arrow navigation & enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].handler();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl overflow-hidden z-10 animate-fade-in flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center space-x-3 bg-[var(--bg-surface-raised)]">
          <Search className="w-4.5 h-4.5 text-[var(--color-verdigris)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search past decisions & dilemmas..."
            className="flex-1 bg-transparent text-sm font-ui text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-faint)]">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors sm:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-[var(--text-faint)] mx-auto opacity-50" />
              <p className="text-xs text-[var(--text-muted)] font-body">
                No matching decisions or commands found for "{query}".
              </p>
            </div>
          ) : (
            allItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.handler}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    w-full text-left p-2.5 rounded-xl flex items-center justify-between space-x-3 transition-colors cursor-pointer group
                    ${
                      isSelected
                        ? 'bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 text-[var(--text-main)]'
                        : 'border border-transparent text-[var(--text-main)] hover:bg-[var(--bg-surface-raised)]'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border-subtle)]
                        ${isSelected ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-app)]'}
                      `}
                    >
                      <Icon className={`w-4 h-4 ${item.iconColor || 'text-[var(--text-muted)]'}`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-ui font-medium truncate">{item.title}</span>
                        {item.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-app)] text-[var(--text-faint)] border border-[var(--border-subtle)]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] font-body text-[var(--text-muted)] truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0 transition-transform ${
                      isSelected ? 'opacity-100 translate-x-0.5' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="p-2.5 bg-[var(--bg-surface-raised)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-faint)] font-mono">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="hidden sm:inline">Phronesis ⌘K Spotlight</span>
        </div>
      </div>
    </div>
  );
};
