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
  Settings,
  Search,
  Pin,
  Command
} from 'lucide-react';
import type { BenchmarkItem } from '../types';
import { formatRelativeTime } from '../lib/formatTime';

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
  previewText: string;
  isPinned?: boolean;
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
  onTogglePinHistoryItem?: (id: string) => void;
  onClearHistory: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentDecisionId?: string;
  onOpenSettings?: () => void;
  onOpenCommandPalette?: () => void;
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
  onTogglePinHistoryItem,
  onClearHistory,
  isDarkMode,
  onToggleTheme,
  currentDecisionId,
  onOpenSettings,
  onOpenCommandPalette,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter history & benchmarks by search
  const cleanQ = searchQuery.toLowerCase().trim();
  const filteredHistory = history.filter(
    (h) => h.title.toLowerCase().includes(cleanQ) || (h.previewText && h.previewText.toLowerCase().includes(cleanQ))
  );

  const pinnedItems = filteredHistory.filter((h) => h.isPinned);
  const recentItems = filteredHistory.filter((h) => !h.isPinned);

  const filteredBenchmarks = benchmarks.filter(
    (b) => b.title.toLowerCase().includes(cleanQ) || b.narrative.toLowerCase().includes(cleanQ)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)]
          flex flex-col justify-between transition-all duration-200 ease-in-out select-none
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${isOpen ? 'md:w-68' : 'md:w-16'}
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
              className="flex items-center space-x-2.5 cursor-pointer overflow-hidden group text-left focus:outline-none"
              title="Phronesis - Practical Wisdom Under Uncertainty"
            >
              <div className="w-8 h-8 rounded-xl bg-[var(--color-verdigris)]/15 border border-[var(--color-verdigris)]/30 flex items-center justify-center text-[var(--color-verdigris)] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Compass className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
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
                  Practical Wisdom Under Uncertainty
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
          <div className="p-2.5 border-b border-[var(--border-subtle)] flex items-center justify-center">
            <button
              type="button"
              onClick={onToggle}
              className="w-10 h-10 rounded-xl bg-[var(--color-verdigris)]/15 border border-[var(--color-verdigris)]/30 flex items-center justify-center text-[var(--color-verdigris)] hover:scale-105 hover:bg-[var(--color-verdigris)]/25 transition-all shadow-xs cursor-pointer group"
              title="Expand sidebar (Click to open)"
              aria-label="Expand sidebar"
            >
              <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        )}

        {/* Action Button: + New Decision & Quick Search Trigger */}
        {isExpanded ? (
          <div className="p-2.5 space-y-2 border-b border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                onNewDecision();
                onCloseMobile();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-ui font-medium flex items-center justify-between bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] text-[var(--text-main)] hover:border-[var(--color-verdigris)]/60 transition-all shadow-xs cursor-pointer group"
              title="Start New Decision (⌘N)"
            >
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-4 h-4 text-[var(--color-verdigris)] group-hover:rotate-90 transition-transform duration-200 shrink-0" />
                <span>New Decision</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-app)] text-[var(--text-faint)] border border-[var(--border-subtle)]">
                ⌘N
              </span>
            </button>

            {/* Search Input Filter & ⌘K trigger */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dossiers..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-1.5 pl-8 pr-12 text-xs font-ui text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--color-verdigris)] transition-colors"
              />
              {onOpenCommandPalette && (
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[10px] font-mono text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-raised)] transition-colors"
                  title="Open Spotlight Search (⌘K)"
                >
                  ⌘K
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2 flex flex-col items-center space-y-2 border-b border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onNewDecision}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] hover:border-[var(--color-verdigris)]/60 text-[var(--color-verdigris)] transition-all shadow-xs cursor-pointer"
              title="Start New Decision (⌘N)"
              aria-label="Start New Decision"
            >
              <PlusCircle className="w-4.5 h-4.5" />
            </button>

            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Search Command Palette (⌘K)"
                aria-label="Search Command Palette"
              >
                <Command className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Middle Navigation: History & Benchmarks */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
          {/* Pinned Decisions (If any) */}
          {pinnedItems.length > 0 && isExpanded && (
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-ui font-semibold uppercase tracking-wider text-[var(--color-ochre)] flex items-center space-x-1.5">
                  <Pin className="w-3 h-3 fill-current rotate-45" />
                  <span>Pinned Dossiers</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 text-[var(--color-ochre)]">
                  {pinnedItems.length}
                </span>
              </div>

              <div className="space-y-1">
                {pinnedItems.map((item) => {
                  const isActive = currentDecisionId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`
                        group relative flex items-center justify-between rounded-xl transition-all text-xs font-ui
                        ${isActive
                          ? 'bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] font-medium border border-[var(--color-ochre)]/40'
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
                              ? 'bg-[var(--color-ochre)] ring-2 ring-[var(--color-ochre)]/30'
                              : 'bg-[var(--color-ochre)]'
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

                      {onTogglePinHistoryItem && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinHistoryItem(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-[var(--color-ochre)] hover:bg-[var(--bg-surface-raised)] transition-all cursor-pointer"
                          title="Unpin"
                        >
                          <Pin className="w-3 h-3 fill-current rotate-45" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Decisions History Section */}
          <div>
            {isExpanded ? (
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[11px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
                  <span>Recent History</span>
                  {recentItems.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-faint)]">
                      {recentItems.length}
                    </span>
                  )}
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-[10px] text-[var(--text-faint)] hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                    title="Clear history"
                    aria-label="Clear history"
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
              <div className="mx-2 mb-2 p-2.5 rounded-xl bg-[var(--bg-surface-raised)] border border-rose-500/30 text-xs space-y-2 shadow-xs">
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
                    className="px-2 py-1 rounded text-[10px] bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-medium transition-colors cursor-pointer"
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
                {recentItems.length === 0 ? (
                  <div className="px-2 py-3 text-center text-[11px] text-[var(--text-faint)] italic font-body">
                    {searchQuery ? 'No matching decisions found.' : 'No past decisions yet.'}
                  </div>
                ) : (
                  recentItems.map((item) => {
                    const isActive = currentDecisionId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`
                          group relative flex items-center justify-between rounded-xl transition-all text-xs font-ui
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

                        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 pr-1 transition-opacity">
                          {onTogglePinHistoryItem && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePinHistoryItem(item.id);
                              }}
                              className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--color-ochre)] hover:bg-[var(--bg-surface-raised)] transition-all cursor-pointer"
                              title="Pin to top"
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteHistoryItem && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteHistoryItem(item.id);
                              }}
                              className="p-1 rounded text-[var(--text-faint)] hover:text-rose-400 hover:bg-[var(--bg-surface-raised)] transition-all cursor-pointer"
                              title="Delete decision"
                              aria-label="Delete decision"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Collapsed History Icons */
              <div className="flex flex-col items-center space-y-1">
                {history.slice(0, 8).map((item) => {
                  const isActive = currentDecisionId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectHistoryItem(item)}
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center relative transition-all cursor-pointer
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

          {/* Canonical Benchmarks Quick-Access */}
          <div>
            {isExpanded ? (
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--color-slate)]" />
                  <span>Canonical Dilemmas</span>
                </span>
                {filteredBenchmarks.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-faint)]">
                    {filteredBenchmarks.length}
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
                {filteredBenchmarks.map((bm) => {
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
                        w-full text-left p-2 rounded-xl transition-all text-xs font-ui group flex items-center space-x-2 cursor-pointer
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
                        w-10 h-10 rounded-xl flex items-center justify-center relative transition-all cursor-pointer
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

        {/* Footer: User Profile Tile (Logically/ChatGPT style), Settings, and Theme Switcher */}
        {isExpanded ? (
          <div className="p-2.5 border-t border-[var(--border-subtle)] space-y-2 bg-[var(--bg-surface-raised)]">
            {/* User Profile Card (Reflecting Local & Private Zero Data Leakage) */}
            <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-verdigris)] text-[#F5F2EA] flex items-center justify-center font-display font-bold text-xs shrink-0 shadow-2xs">
                  S
                </div>
                <div className="min-w-0">
                  <div className="font-ui font-semibold text-xs text-[var(--text-main)] truncate">
                    Saba Said
                  </div>
                  <div className="text-[9px] font-mono text-[var(--color-verdigris)] flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-verdigris)] animate-pulse" />
                    <span>Local & Private Engine</span>
                  </div>
                </div>
              </div>

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-raised)] transition-colors cursor-pointer"
                  title="Settings & Storage"
                  aria-label="Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bottom Controls Row: Theme Toggle & Telemetry badge */}
            <div className="flex items-center justify-between text-xs font-ui">
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center space-x-1.5 px-2 py-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer text-[11px]"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[var(--color-ochre)] shrink-0" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-1 text-[10px] font-mono text-[var(--text-faint)]">
                <ShieldCheck className="w-3 h-3 text-[var(--color-verdigris)] shrink-0" />
                <span>V2 Solvers</span>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed Bottom Icons */
          <div className="p-2 border-t border-[var(--border-subtle)] flex flex-col items-center space-y-2">
            <div
              className="w-8 h-8 rounded-lg bg-[var(--color-verdigris)] text-[#F5F2EA] flex items-center justify-center font-display font-bold text-xs shadow-2xs"
              title="Saba Said (Local & Private Storage)"
            >
              S
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
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
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-verdigris)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Settings & Privacy"
                aria-label="Settings"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
