import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  currentStep: 'input' | 'editor' | 'report';
  onToggleMobileSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  currentStep,
  onToggleMobileSidebar,
  isDarkMode,
  onToggleTheme,
}) => {
  const steps = [
    { key: 'input', label: '1. Describe' },
    { key: 'editor', label: '2. Calibrate' },
    { key: 'report', label: '3. Audit Report' },
  ] as const;

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-app)]/85 backdrop-blur-md border-b border-[var(--border-subtle)]">
      <div className="max-w-[760px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Mobile Drawer Toggle & Wordmark */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={onReset}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <span className="font-display font-bold text-base tracking-tight text-[var(--text-main)]">
              Phronesis
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
              φρόνησις
            </span>
          </div>
        </div>

        {/* Center: Minimalist Step Breadcrumbs */}
        <nav className="hidden sm:flex items-center space-x-3 text-xs font-ui">
          {steps.map((s, idx) => {
            const isActive = currentStep === s.key;
            return (
              <React.Fragment key={s.key}>
                {idx > 0 && <span className="text-[var(--text-faint)]">→</span>}
                <span
                  className={`
                    ${isActive
                      ? 'font-semibold text-[var(--color-verdigris)] border-b border-[var(--color-verdigris)] pb-0.5'
                      : 'text-[var(--text-muted)] opacity-70'
                    }
                  `}
                >
                  {s.label}
                </span>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right: Theme Toggle & New Button */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-[var(--color-ochre)]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--color-verdigris)]" />
            )}
          </button>

          {currentStep !== 'input' && (
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-1 text-xs font-ui font-medium rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] transition-colors"
            >
              New
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
