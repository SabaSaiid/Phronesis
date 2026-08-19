import React, { useState, useEffect } from 'react';
import {
  Compass,
  PlusCircle,
  Clock,
  Sun,
  Moon,
  ShieldCheck,
  ChevronLeft,
  BookOpen,
  Trash2,
  X,
  Settings
} from 'lucide-react';
import type { BenchmarkItem } from '../types';
import { formatRelativeTime } from '../lib/formatTime';

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
  previewText: string;
  data: any; // Saved full state or decision
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  history: HistoryItem[];
  benchmarks: BenchmarkItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onSelectBenchmark: (bm: BenchmarkItem) => void;
  onNewDecision: () => void;
  onDeleteHistoryItem?: (id: string) => void;
  onClearHistory: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentDecisionId?: string;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  isMobileOpen,
  onCloseMobile,
  history,
  benchmarks,
  onSelectHistoryItem,
  onSelectBenchmark,
  onNewDecision,
  onDeleteHistoryItem,
  onClearHistory,
  isDarkMode,
  onToggleTheme,
  currentDecisionId,
  onOpenSettings,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const isExpanded = isOpen || isMobileOpen;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)]
          flex flex-col justify-between transition-all duration-200 ease-in-out select-none
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${isOpen ? 'md:w-64' : 'md:w-16'}
        `}
      >
        {/* Top Header */}
        {isExpanded ? (
          <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between min-w-0">
            <button
              type="button"
              onClick={() => {
                onNewDecision();
                onCloseMobile();
              }}
              className="flex items-center space-x-2.5 cursor-pointer overflow-hidden group text-left focus:outline-hidden"
              title="Phronesis - Practical Wisdom Under Risk"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--color-verdigris)]/15 border border-[var(--color-verdigris)]/30 flex items-center justify-center text-[var(--color-verdigris)] shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <div className="truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="font-display font-bold text-sm tracking-tight text-[var(--text-main)]">
                    Phronesis
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    φρόνησις
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-ui truncate">
                  Practical Wisdom Under Risk
                </div>
              </div>
            </button>

            {/* Desktop Collapse Button */}
            <button
              type="button"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className="hidden md:flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors shrink-0 cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Collapsed Desktop Header */
          <div className="p-2 border-b border-[var(--border-subtle)] flex items-center justify-center">
            <button
              type="button"
              onClick={onToggle}
              className="w-10 h-10 rounded-lg bg-[var(--color-verdigris)]/15 border border-[var(--color-verdigris)]/30 flex items-center justify-center text-[var(--color-verdigris)] hover:scale-105 hover:bg-[var(--color-verdigris)]/25 transition-all shadow-2xs cursor-pointer group"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        )}

        {/* Action Button: + New Decision */}
        {isExpanded ? (
          <div className="p-2.5">
            <button
              type="button"
              onClick={() => {
                onNewDecision();
                onCloseMobile();
              }}
              className="w-full py-2 px-3 rounded-lg text-xs font-ui font-medium flex items-center justify-center space-x-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] text-[var(--text-main)] hover:border-[var(--color-verdigris)]/50 transition-all shadow-2xs cursor-pointer group"
              title="Start New Decision"
            >
              <PlusCircle className="w-4 h-4 text-[var(--color-verdigris)] group-hover:rotate-90 transition-transform duration-200 shrink-0" />
              <span>New Decision</span>
            </button>
          </div>
        ) : (
          <div className="p-2 flex justify-center">
            <button
              type="button"
              onClick={onNewDecision}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] hover:border-[var(--color-verdigris)]/50 text-[var(--color-verdigris)] transition-all shadow-2xs cursor-pointer"
              title="Start New Decision"
              aria-label="Start New Decision"
            >
              <PlusCircle className="w-4.5 h-4.5" />
            </button>
          </div>
        )}

        {/* Middle Navigation: History & Benchmarks */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
          {/* Past Decisions History Section */}
          <div>
            {isExpanded ? (
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[11px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
                  <span>Past Decisions</span>
                  {history.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-faint)]">
                      {history.length}
                    </span>
                  )}
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-[10px] text-[var(--text-faint)] hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                    title="Clear all history"
                    aria-label="Clear all history"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex justify-center mb-1 text-[var(--text-muted)]" title="Past Decisions">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                  Hist
                </span>
              </div>
            )}

            {/* Clear All Confirmation Modal/Card */}
            {isExpanded && showClearConfirm && (
              <div className="mx-2 mb-2 p-2.5 rounded-lg bg-[var(--bg-surface-raised)] border border-red-500/30 text-xs space-y-2 shadow-xs">
                <p className="text-[11px] text-[var(--text-main)] font-medium">
                  Clear all {history.length} decisions?
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory();
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-1 rounded text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 rounded text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* History List */}
            {isExpanded ? (
              <div className="space-y-1">
                {history.length === 0 ? (
                  <div className="px-2 py-3 text-center text-[11px] text-[var(--text-faint)] italic font-body">
                    No past decisions yet.
                  </div>
                ) : (
                  history.map((item) => {
                    const isActive = currentDecisionId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`
                          group relative flex items-center justify-between rounded-lg transition-all text-xs font-ui
                          ${isActive
                            ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium border border-[var(--color-verdigris)]/30'
                            : 'text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-transparent'
                          }
                        `}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectHistoryItem(item);
                            onCloseMobile();
                          }}
                          className="flex-1 text-left p-2 overflow-hidden flex items-start space-x-2 cursor-pointer"
                          title={item.title}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                              isActive
                                ? 'bg-[var(--color-verdigris)] ring-2 ring-[var(--color-verdigris)]/30'
                                : 'bg-[var(--color-slate)]'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-[11px] font-medium leading-tight">
                              {item.title}
                            </div>
                            {item.timestamp && (
                              <div className="text-[9px] text-[var(--text-faint)] mt-0.5 font-mono">
                                {formatRelativeTime(item.timestamp)}
                              </div>
                            )}
                          </div>
                        </button>

                        {onDeleteHistoryItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteHistoryItem(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded text-[var(--text-faint)] hover:text-red-400 hover:bg-[var(--bg-surface-raised)] transition-all cursor-pointer"
                            title="Delete decision"
                            aria-label="Delete decision"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Collapsed History Icons */
              <div className="flex flex-col items-center space-y-1">
                {history.map((item) => {
                  const isActive = currentDecisionId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectHistoryItem(item)}
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center relative transition-all cursor-pointer
                        ${isActive
                          ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/40 shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                        }
                      `}
                      title={`${item.title} (${formatRelativeTime(item.timestamp)})`}
                      aria-label={item.title}
                    >
                      <Clock className="w-4 h-4" />
                      {isActive && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-verdigris)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Canonical Benchmarks Quick-Access (6 Scenarios) */}
          <div>
            {isExpanded ? (
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--color-slate)]" />
                  <span>Canonical Dilemmas</span>
                </span>
                {benchmarks.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-faint)]">
                    {benchmarks.length}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex justify-center mb-1 text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]" title="Canonical Dilemmas">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                  Bench
                </span>
              </div>
            )}

            {isExpanded ? (
              <div className="space-y-1">
                {benchmarks.map((bm) => {
                  const isActive = currentDecisionId === bm.id;
                  return (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => {
                        onSelectBenchmark(bm);
                        onCloseMobile();
                      }}
                      className={`
                        w-full text-left p-2 rounded-lg transition-all text-xs font-ui group flex items-center space-x-2 cursor-pointer
                        ${isActive
                          ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium border border-[var(--color-verdigris)]/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-transparent'
                        }
                      `}
                      title={bm.title}
                    >
                      <span className={`text-[11px] font-serif shrink-0 ${isActive ? 'text-[var(--color-verdigris)] font-bold' : 'text-[var(--color-slate)]'}`}>
                        §
                      </span>
                      <span className="truncate flex-1 text-[11px]">
                        {bm.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Collapsed Canonical Dilemmas Icons */
              <div className="flex flex-col items-center space-y-1">
                {benchmarks.map((bm) => {
                  const isActive = currentDecisionId === bm.id;
                  return (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => onSelectBenchmark(bm)}
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center relative transition-all cursor-pointer
                        ${isActive
                          ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/40 shadow-xs font-bold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                        }
                      `}
                      title={bm.title}
                      aria-label={bm.title}
                    >
                      <span className="font-serif text-sm">§</span>
                      {isActive && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-verdigris)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Theme Toggle, Settings & Deterministic Affirmation */}
        {isExpanded ? (
          <div className="p-2.5 border-t border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center space-x-1">
              {/* Theme switcher */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex-1 p-2 rounded-lg text-xs font-ui text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-subtle)] flex items-center space-x-2 transition-colors cursor-pointer"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[var(--color-ochre)] shrink-0" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0" />
                    <span>Dark</span>
                  </>
                )}
              </button>

              {/* Settings modal trigger */}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="p-2 rounded-lg text-xs font-ui text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-subtle)] flex items-center space-x-1 transition-colors cursor-pointer"
                  title="Settings & Privacy"
                  aria-label="Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0" />
                  <span>Settings</span>
                </button>
              )}
            </div>

            {/* Sourced Attribution Badge */}
            <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex items-center space-x-1.5 font-ui">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0" />
              <span className="truncate">Deterministic Math & Citations</span>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-[var(--border-subtle)] flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-4.5 h-4.5 text-[var(--color-ochre)]" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-[var(--color-verdigris)]" />
              )}
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--color-verdigris)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Settings & Privacy"
                aria-label="Settings"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
            )}

            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--color-verdigris)] hover:bg-[var(--bg-surface)] transition-colors"
              title="Deterministic Math & Citations (Auditable)"
            >
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
