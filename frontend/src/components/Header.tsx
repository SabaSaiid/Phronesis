import React from 'react';
import { Menu, Share2, Plus, MessageSquareQuote, PenTool, Sliders, LineChart, Check, RotateCcw } from 'lucide-react';
import { DayNightToggle } from './DayNightToggle';

interface HeaderProps {
  onReset: () => void;
  currentStep: 'input' | 'editor' | 'report' | 'benchmarks' | 'project';
  activeStage: 'input' | 'editor' | 'report' | 'benchmarks' | 'project';
  onToggleMobileSidebar: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onOpenExport?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onScrollToSection: (sectionId: string) => void;
  hasDecision: boolean;
  hasReport: boolean;
  isTemporarySession?: boolean;
  onToggleTemporarySession?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  currentStep,
  activeStage,
  onToggleMobileSidebar,
  isDarkMode = false,
  onToggleTheme,
  onOpenExport,
  onToggleChat,
  isChatOpen,
  onScrollToSection,
  hasDecision,
  hasReport,
  isTemporarySession = false,
  onToggleTemporarySession,
}) => {
  const steps = [
    {
      key: 'input',
      sectionId: 'section-describe',
      label: '1. Describe',
      icon: PenTool,
      accessible: true,
    },
    {
      key: 'editor',
      sectionId: 'section-calibrate',
      label: '2. Calibrate',
      icon: Sliders,
      accessible: hasDecision,
    },
    {
      key: 'report',
      sectionId: 'section-report',
      label: '3. Audit Report',
      icon: LineChart,
      accessible: hasReport,
    },
  ] as const;

  const showStepper = activeStage === 'editor' || activeStage === 'report';

  return (
    <header className="sticky top-0 z-30 bg-transparent backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 h-14 flex items-center justify-between">
        {/* Left: Mobile Drawer Toggle */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Anchor-Nav Step Indicators (scroll-to-section on click) */}
        {showStepper ? (
          <nav className="flex items-center space-x-2.5 text-xs font-ui animate-fade-in" aria-label="Decision progress">
            {steps.map((s, idx) => {
              const isActive = activeStage === s.key;
              const isPast =
                (activeStage === 'report' && (s.key === 'input' || s.key === 'editor')) ||
                (activeStage === 'editor' && s.key === 'input');
              const Icon = s.icon;
              const canNavigate = s.accessible;

              return (
                <React.Fragment key={s.key}>
                  {idx > 0 && <span className="text-[var(--text-faint)] text-[10px]">→</span>}
                  <button
                    type="button"
                    onClick={() => canNavigate && onScrollToSection(s.sectionId)}
                    disabled={!canNavigate}
                    className={`
                      px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5
                      ${
                        isActive
                          ? 'font-semibold text-[var(--color-verdigris)] bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 shadow-2xs cursor-pointer'
                          : isPast
                          ? 'text-[var(--text-muted)] opacity-80 hover:opacity-100 hover:text-[var(--color-verdigris)] cursor-pointer'
                          : 'text-[var(--text-faint)] opacity-50 cursor-not-allowed'
                      }
                    `}
                    aria-label={`Scroll to ${s.label}`}
                    title={canNavigate ? `Scroll to ${s.label}` : `${s.label} (not available yet)`}
                  >
                    {isPast ? (
                      <Check className="w-3 h-3 text-[var(--color-verdigris)]" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        ) : (
          <div className="w-1" />
        )}

        {/* Right: Day/Night Animated Switch, Temporary Deliberation, Export, Socratic Deliberate, New Button */}
        <div className="flex items-center space-x-2.5">
          {/* Animated Day / Night Mode Toggle */}
          {onToggleTheme && (
            <DayNightToggle
              size="sm"
              checked={isDarkMode}
              onChange={onToggleTheme}
              ariaLabel={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            />
          )}

          {/* Temporary Deliberation / Ephemeral Mode Toggle */}
          {onToggleTemporarySession && (
            <button
              type="button"
              onClick={onToggleTemporarySession}
              className={`temp-chat-toggle ${isTemporarySession ? 'active' : ''}`}
              title={
                isTemporarySession
                  ? 'Temporary Deliberation is ON (Session not saved to history)'
                  : 'Turn on Temporary Deliberation (Ephemeral session without saving history)'
              }
              aria-label="Toggle temporary deliberation"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isTemporarySession ? 'text-[var(--color-ochre)]' : 'text-[var(--text-muted)]'}`} />
            </button>
          )}

          {/* Socratic Deliberation Chat Trigger */}
          {onToggleChat && (
            <button
              type="button"
              onClick={onToggleChat}
              className={`
                px-2.5 py-1 rounded-lg text-xs font-ui font-medium transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs
                ${
                  isChatOpen
                    ? 'bg-[var(--color-verdigris)] text-white shadow-xs'
                    : 'text-[var(--text-main)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-verdigris)]/50'
                }
              `}
              title="Socratic Deliberation Chat (⌘J)"
              aria-label="Toggle Socratic Companion"
            >
              <MessageSquareQuote className={`w-3.5 h-3.5 ${isChatOpen ? 'text-white' : 'text-[var(--color-verdigris)]'}`} />
              <span className="hidden sm:inline">Deliberate</span>
              <span className="hidden md:inline text-[9px] font-mono opacity-60 ml-0.5">⌘J</span>
            </button>
          )}

          {/* Export Report Trigger (Visible when report exists) */}
          {activeStage === 'report' && onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="px-2.5 py-1 rounded-lg text-xs font-ui font-medium text-[var(--color-ochre)] hover:bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
              title="Export Report"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          {/* New Decision Shortcut Button */}
          {currentStep !== 'input' && (
            <button
              type="button"
              onClick={onReset}
              className="p-1.5 sm:px-2.5 sm:py-1 text-xs font-ui font-medium rounded-lg text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
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
