import React from 'react';
import {
  Compass,
  PlusCircle,
  Clock,
  Sun,
  Moon,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Trash2,
  X
} from 'lucide-react';
import type { BenchmarkItem } from '../types';

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
  onClearHistory: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentDecisionId?: string;
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
  onClearHistory,
  isDarkMode,
  onToggleTheme,
  currentDecisionId,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity"
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
        <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div
            onClick={onNewDecision}
            className="flex items-center space-x-2.5 cursor-pointer overflow-hidden group"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--color-verdigris)]/15 border border-[var(--color-verdigris)]/30 flex items-center justify-center text-[var(--color-verdigris)] shrink-0 group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>

            {(isOpen || isMobileOpen) && (
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
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="hidden md:flex p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: + New Decision */}
        <div className="p-2.5">
          <button
            type="button"
            onClick={() => {
              onNewDecision();
              onCloseMobile();
            }}
            className={`
              w-full py-2 px-2.5 rounded-lg text-xs font-ui font-medium flex items-center justify-center space-x-2
              bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)]
              text-[var(--text-main)] transition-colors shadow-2xs cursor-pointer
              ${!isOpen && 'md:p-2 md:justify-center'}
            `}
            title="Start New Decision"
          >
            <PlusCircle className="w-4 h-4 text-[var(--color-verdigris)] shrink-0" />
            {(isOpen || isMobileOpen) && <span>New Decision</span>}
          </button>
        </div>

        {/* Middle Navigation & History */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
          {/* Past Decisions History Section */}
          <div>
            {(isOpen || isMobileOpen) ? (
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[11px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Past Decisions</span>
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearHistory}
                    className="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)]"
                    title="Clear history"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex justify-center mb-1 text-[var(--text-muted)]" title="Past Decisions">
                <Clock className="w-4 h-4" />
              </div>
            )}

            <div className="space-y-0.5">
              {history.length === 0 ? (
                (isOpen || isMobileOpen) && (
                  <div className="px-2 py-3 text-center text-[11px] text-[var(--text-faint)] italic font-body">
                    No past decisions yet.
                  </div>
                )
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectHistoryItem(item);
                      onCloseMobile();
                    }}
                    className={`
                      w-full text-left p-2 rounded-md transition-colors text-xs font-ui group flex items-center space-x-2
                      ${currentDecisionId === item.id
                        ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium border border-[var(--color-verdigris)]/30'
                        : 'text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                      }
                      ${!isOpen && 'md:justify-center md:px-1'}
                    `}
                    title={item.title}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-verdigris)] shrink-0" />
                    {(isOpen || isMobileOpen) && (
                      <span className="truncate flex-1 text-[11px]">
                        {item.title}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Canonical Benchmarks Quick-Access */}
          <div>
            {(isOpen || isMobileOpen) ? (
              <div className="px-2 mb-1.5">
                <span className="text-[11px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1">
                  <BookOpen className="w-3 h-3" />
                  <span>Canonical Dilemmas</span>
                </span>
              </div>
            ) : (
              <div className="flex justify-center mb-1 text-[var(--text-muted)]" title="Canonical Dilemmas">
                <BookOpen className="w-4 h-4" />
              </div>
            )}

            <div className="space-y-0.5">
              {benchmarks.map((bm) => (
                <button
                  key={bm.id}
                  type="button"
                  onClick={() => {
                    onSelectBenchmark(bm);
                    onCloseMobile();
                  }}
                  className={`
                    w-full text-left p-2 rounded-md transition-colors text-xs font-ui group flex items-center space-x-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]
                    ${!isOpen && 'md:justify-center md:px-1'}
                  `}
                  title={bm.title}
                >
                  <span className="text-[10px] text-[var(--color-slate)] shrink-0 font-serif">§</span>
                  {(isOpen || isMobileOpen) && (
                    <span className="truncate flex-1 text-[11px]">
                      {bm.title}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: Theme Toggle & Deterministic Affirmation */}
        <div className="p-2.5 border-t border-[var(--border-subtle)] space-y-2">
          {/* Theme switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`
              w-full p-2 rounded-md text-xs font-ui text-[var(--text-main)] hover:bg-[var(--bg-surface)]
              flex items-center space-x-2 transition-colors
              ${!isOpen && 'md:justify-center md:px-1'}
            `}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-[var(--color-ochre)] shrink-0" />
                {(isOpen || isMobileOpen) && <span>Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[var(--color-verdigris)] shrink-0" />
                {(isOpen || isMobileOpen) && <span>Dark Mode</span>}
              </>
            )}
          </button>

          {/* Sourced Attribution Badge */}
          {(isOpen || isMobileOpen) && (
            <div className="px-2 py-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex items-center space-x-1.5 font-ui">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0" />
              <span className="truncate">Deterministic Math & Citations</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
