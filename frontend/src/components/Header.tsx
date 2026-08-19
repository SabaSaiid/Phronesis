import React from 'react';
import { Menu, Sun, Moon, Search, Share2, Plus } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  currentStep: 'input' | 'editor' | 'report';
  onToggleMobileSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenCommandPalette?: () => void;
  onOpenExport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  currentStep,
  onToggleMobileSidebar,
  isDarkMode,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenExport,
}) => {
  const steps = [
    { key: 'input', label: '1. Describe' },
    { key: 'editor', label: '2. Calibrate' },
    { key: 'report', label: '3. Audit Report' },
  ] as const;

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-app)]/85 backdrop-blur-md border-b border-[var(--border-subtle)] transition-colors">
      <div className="max-w-[760px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Mobile Drawer Toggle & Wordmark */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={onReset}
            className="flex items-center space-x-2 cursor-pointer group"
            title="Start fresh decision"
          >
            <span className="font-display font-bold text-base tracking-tight text-[var(--text-main)] group-hover:text-[var(--color-verdigris)] transition-colors">
              Phronesis
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
              φρόνησις
            </span>
          </div>
        </div>

        {/* Center: Minimalist Step Breadcrumbs */}
        <nav className="hidden sm:flex items-center space-x-2.5 text-xs font-ui">
          {steps.map((s, idx) => {
            const isActive = currentStep === s.key;
            return (
              <React.Fragment key={s.key}>
                {idx > 0 && <span className="text-[var(--text-faint)] text-[10px]">→</span>}
                <span
                  className={`
                    px-2 py-0.5 rounded-md transition-all
                    ${
                      isActive
                        ? 'font-semibold text-[var(--color-verdigris)] bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30'
                        : 'text-[var(--text-muted)] opacity-70 hover:opacity-100'
                    }
                  `}
                >
                  {s.label}
                </span>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right: Quick Search, Export, Theme Toggle & New Button */}
        <div className="flex items-center space-x-1.5">
          {/* Spotlight Search Trigger */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer flex items-center space-x-1 text-xs"
              title="Search Spotlight (⌘K)"
              aria-label="Search Command Palette"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline text-[10px] font-mono text-[var(--text-faint)]">⌘K</span>
            </button>
          )}

          {/* Export Report Trigger (Visible on Report view) */}
          {currentStep === 'report' && onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="px-2.5 py-1 rounded-lg text-xs font-ui font-medium text-[var(--color-ochre)] hover:bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 transition-colors flex items-center space-x-1 cursor-pointer"
              title="Export Report"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-[var(--color-ochre)]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--color-verdigris)]" />
            )}
          </button>

          {/* New Decision Shortcut Button */}
          {currentStep !== 'input' && (
            <button
              type="button"
              onClick={onReset}
              className="p-1.5 sm:px-2.5 sm:py-1 text-xs font-ui font-medium rounded-lg text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-colors flex items-center space-x-1 cursor-pointer"
              title="Start New Decision"
            >
              <Plus className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
