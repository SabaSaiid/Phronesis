import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Compass,
  PlusCircle,
  Clock,
  Sun,
  Moon,
  ShieldCheck,
  ChevronLeft,
  ChevronDown,
  BookOpen,
  Trash2,
  X,
  Settings,
  Search,
  Pin,
  Command,
  MoreHorizontal,
  Pencil,
  Copy,
  Download,
  HardDrive,
  Lock,
} from 'lucide-react';
import type { BenchmarkItem } from '../types';
import { formatRelativeTime, formatExactDateTime, groupByDate } from '../lib/formatTime';

// ──────────────────────────────────────────────
// Types & Interfaces
// ──────────────────────────────────────────────

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
  previewText: string;
  isPinned?: boolean;
  data: any;
}

type FilterMode = 'all' | 'pinned' | 'recent' | 'benchmarks';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  history: HistoryItem[];
  benchmarks: BenchmarkItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onSelectBenchmark: (bm: BenchmarkItem) => void;
  onOpenBenchmarksGallery?: () => void;
  onOpenMethodology?: () => void;
  onNewDecision: () => void;
  onDeleteHistoryItem?: (id: string) => void;
  onTogglePinHistoryItem?: (id: string) => void;
  onRenameHistoryItem?: (id: string, newTitle: string) => void;
  onDuplicateHistoryItem?: (item: HistoryItem) => void;
  onExportHistoryItem?: (item: HistoryItem) => void;
  onClearHistory: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentDecisionId?: string;
  onOpenSettings?: () => void;
  onOpenCommandPalette?: () => void;
}

// ──────────────────────────────────────────────
// localStorage keys for persisted sidebar prefs
// ──────────────────────────────────────────────
const LS_SIDEBAR_WIDTH = 'phronesis_sidebar_width';
const LS_SIDEBAR_SECTIONS = 'phronesis_sidebar_sections';
const DEFAULT_WIDTH = 272;
const MIN_WIDTH = 240;
const MAX_WIDTH = 400;

function loadSectionState(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(LS_SIDEBAR_SECTIONS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveSectionState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(LS_SIDEBAR_SECTIONS, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

// ──────────────────────────────────────────────
// Highlight search substring in text
// ──────────────────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="sidebar-search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ──────────────────────────────────────────────
// SidebarSection — Collapsible Accordion
// ──────────────────────────────────────────────
function SidebarSection({
  id,
  label,
  icon: Icon,
  iconClassName,
  count,
  isOpen,
  onToggle,
  headerRight,
  children,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  iconClassName?: string;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-2 mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center space-x-1.5 text-[11px] font-ui font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer group text-left"
          aria-expanded={isOpen}
          aria-controls={`sidebar-section-${id}`}
        >
          <Icon className={`w-3.5 h-3.5 ${iconClassName || 'text-[var(--color-verdigris)]'}`} />
          <span>{label}</span>
          {typeof count === 'number' && count > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-faint)] leading-none">
              {count}
            </span>
          )}
          <ChevronDown
            className={`w-3 h-3 text-[var(--text-faint)] transition-transform duration-200 ${
              isOpen ? '' : '-rotate-90'
            }`}
          />
        </button>
        {headerRight}
      </div>

      <div
        id={`sidebar-section-${id}`}
        className="sidebar-accordion-content"
        data-collapsed={!isOpen ? 'true' : 'false'}
      >
        <div className="sidebar-accordion-inner">{children}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Context Menu for History Items
// ──────────────────────────────────────────────
function ItemContextMenu({
  isPinned,
  onPin,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
  onClose,
}: {
  item: HistoryItem;
  isPinned: boolean;
  onPin?: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const actions = [
    onPin && {
      label: isPinned ? 'Unpin' : 'Pin to Top',
      icon: Pin,
      onClick: onPin,
      className: 'text-[var(--color-ochre)]',
    },
    onRename && {
      label: 'Rename',
      icon: Pencil,
      onClick: onRename,
    },
    onDuplicate && {
      label: 'Duplicate',
      icon: Copy,
      onClick: onDuplicate,
    },
    onExport && {
      label: 'Export JSON',
      icon: Download,
      onClick: onExport,
    },
    onDelete && {
      label: 'Delete',
      icon: Trash2,
      onClick: onDelete,
      className: 'text-rose-400 hover:!bg-rose-500/10',
    },
  ].filter(Boolean) as {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    className?: string;
  }[];

  return (
    <div
      ref={menuRef}
      className="sidebar-context-menu absolute right-0 top-full mt-1 z-50 min-w-[150px] rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] shadow-[var(--shadow-elevated)] py-1"
    >
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
            onClose();
          }}
          className={`w-full text-left px-3 py-1.5 text-[11px] font-ui flex items-center space-x-2 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer ${
            action.className || 'text-[var(--text-main)]'
          }`}
        >
          <action.icon className="w-3.5 h-3.5 shrink-0" />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// SidebarItem — History Item with rich features
// ──────────────────────────────────────────────
function SidebarItem({
  item,
  isActive,
  searchQuery,
  dotColor,
  activeBg,
  activeBorder,
  onSelect,
  onPin,
  onDelete,
  onRename,
  onDuplicate,
  onExport,
}: {
  item: HistoryItem;
  isActive: boolean;
  searchQuery: string;
  dotColor: string;
  activeBg: string;
  activeBorder: string;
  onSelect: () => void;
  onPin?: () => void;
  onDelete?: () => void;
  onRename?: (newTitle: string) => void;
  onDuplicate?: () => void;
  onExport?: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== item.title && onRename) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  };

  return (
    <div
      className={`
        group relative flex items-center justify-between rounded-xl transition-all text-xs font-ui
        ${
          isActive
            ? `${activeBg} font-medium border ${activeBorder}`
            : 'text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-transparent'
        }
      `}
    >
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={() => {
          if (onRename) {
            setRenameValue(item.title);
            setIsRenaming(true);
          }
        }}
        className="flex-1 text-left p-2 overflow-hidden flex items-start space-x-2 cursor-pointer"
        title={`${item.title}\n${formatExactDateTime(item.timestamp)}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
            isActive ? `${dotColor} ring-2 ring-current/30` : dotColor
          }`}
        />
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-[11px] font-medium bg-[var(--bg-input)] border border-[var(--color-verdigris)] rounded px-1 py-0.5 focus:outline-none text-[var(--text-main)]"
            />
          ) : (
            <div className="truncate text-[11px] font-medium leading-tight">
              <HighlightText text={item.title} query={searchQuery} />
            </div>
          )}
          {item.timestamp && !isRenaming && (
            <div className="text-[9px] text-[var(--text-faint)] mt-0.5 font-mono">
              {formatRelativeTime(item.timestamp)}
            </div>
          )}
        </div>
      </button>

      {/* Hover action buttons + context menu */}
      <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 pr-1 transition-opacity relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
          className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-raised)] transition-all cursor-pointer"
          title="More actions"
          aria-label="More actions"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {isMenuOpen && (
          <ItemContextMenu
            item={item}
            isPinned={!!item.isPinned}
            onPin={onPin}
            onRename={
              onRename
                ? () => {
                    setRenameValue(item.title);
                    setIsRenaming(true);
                  }
                : undefined
            }
            onDuplicate={onDuplicate}
            onExport={onExport}
            onDelete={onDelete}
            onClose={() => setIsMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Collapsed Rail Hover Popover
// ──────────────────────────────────────────────
function CollapsedItemWithPreview({
  item,
  isActive,
  icon: Icon,
  onSelect,
  onPin,
}: {
  item: { id: string; title: string; timestamp?: number; previewText?: string };
  isActive: boolean;
  icon: React.ElementType;
  onSelect: () => void;
  onPin?: () => void;
}) {
  const [showPopover, setShowPopover] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShowPopover(true), 300);
  };
  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowPopover(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center relative transition-all cursor-pointer
          ${
            isActive
              ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/40 shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
          }
        `}
        aria-label={item.title}
      >
        <Icon className="w-4 h-4" />
        {isActive && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-verdigris)]" />
        )}
      </button>

      {/* Glassmorphic floating preview */}
      {showPopover && (
        <div className="sidebar-popover absolute left-full top-1/2 -translate-y-1/2 ml-2 w-56 p-3 z-50 animate-fade-in">
          <div className="text-[11px] font-ui font-semibold text-[var(--text-main)] mb-1 leading-snug">
            {item.title}
          </div>
          {item.previewText && item.previewText !== item.title && (
            <div className="text-[10px] font-body text-[var(--text-muted)] mb-1.5 line-clamp-2 leading-relaxed">
              {item.previewText}
            </div>
          )}
          {item.timestamp && (
            <div className="text-[9px] font-mono text-[var(--text-faint)] mb-2">
              {formatExactDateTime(item.timestamp)}
            </div>
          )}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="px-2 py-1 rounded-md text-[9px] font-ui font-medium bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] hover:bg-[var(--color-verdigris)]/20 transition-colors cursor-pointer"
            >
              Open
            </button>
            {onPin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPin();
                }}
                className="px-2 py-1 rounded-md text-[9px] font-ui font-medium text-[var(--text-faint)] hover:text-[var(--color-ochre)] hover:bg-[var(--color-ochre-subtle)] transition-colors cursor-pointer"
              >
                Pin
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Sovereign Storage Inspector Popover
// ──────────────────────────────────────────────
function SovereignStoragePopover({
  historyCount,
  onClose,
  onExportAll,
}: {
  historyCount: number;
  onClose: () => void;
  onExportAll?: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Calculate localStorage usage
  const storageKB = useMemo(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('phronesis_')) {
          total += (localStorage.getItem(key) || '').length;
        }
      }
      return (total * 2) / 1024; // UTF-16 → bytes → KB
    } catch {
      return 0;
    }
  }, []);

  return (
    <div
      ref={popoverRef}
      className="sidebar-sovereign-popover absolute bottom-full left-0 right-0 mb-2 mx-2 p-3 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] shadow-[var(--shadow-elevated)] z-50"
    >
      <div className="flex items-center space-x-2 mb-2.5">
        <Lock className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
        <span className="text-[11px] font-ui font-semibold text-[var(--text-main)]">
          Sovereign Storage
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-[10px] font-ui">
          <span className="text-[var(--text-muted)] flex items-center space-x-1.5">
            <HardDrive className="w-3 h-3" />
            <span>Local Footprint</span>
          </span>
          <span className="font-mono text-[var(--text-main)]">{storageKB.toFixed(1)} KB</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-ui">
          <span className="text-[var(--text-muted)]">Saved Dossiers</span>
          <span className="font-mono text-[var(--text-main)]">{historyCount}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-ui">
          <span className="text-[var(--text-muted)]">Telemetry</span>
          <span className="font-mono text-[var(--color-verdigris)]">None — 100% Local</span>
        </div>
      </div>

      {onExportAll && (
        <button
          type="button"
          onClick={onExportAll}
          className="w-full py-1.5 rounded-lg text-[10px] font-ui font-medium bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)] hover:border-[var(--color-verdigris)] hover:bg-[var(--color-verdigris-subtle)] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <Download className="w-3 h-3" />
          <span>Backup All Dossiers (JSON)</span>
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Sidebar Export
// ──────────────────────────────────────────────

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  isMobileOpen,
  onCloseMobile,
  history,
  benchmarks,
  onSelectHistoryItem,
  onSelectBenchmark,
  onOpenBenchmarksGallery,
  onOpenMethodology,
  onNewDecision,
  onDeleteHistoryItem,
  onTogglePinHistoryItem,
  onRenameHistoryItem,
  onDuplicateHistoryItem,
  onExportHistoryItem,
  onClearHistory,
  isDarkMode,
  onToggleTheme,
  currentDecisionId,
  onOpenSettings,
  onOpenCommandPalette,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSovereignPopover, setShowSovereignPopover] = useState(false);

  // Collapsible sections persisted state
  const [sectionState, setSectionState] = useState<Record<string, boolean>>(() => {
    const saved = loadSectionState();
    return {
      pinned: saved.pinned !== false,
      today: saved.today !== false,
      yesterday: saved.yesterday !== false,
      pastWeek: saved.pastWeek !== false,
      older: saved.older !== false,
      benchmarks: saved.benchmarks !== false,
    };
  });

  const toggleSection = (key: string) => {
    setSectionState((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveSectionState(next);
      return next;
    });
  };

  // Resizable sidebar width (expanded only)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LS_SIDEBAR_WIDTH);
      return saved ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Number(saved))) : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handleMove = (me: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + me.clientX - startX));
        setSidebarWidth(newWidth);
      };

      const handleUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        // persist
        try {
          localStorage.setItem(LS_SIDEBAR_WIDTH, String(sidebarWidth));
        } catch {
          /* noop */
        }
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [sidebarWidth]
  );

  const handleResizeDoubleClick = () => {
    setSidebarWidth(DEFAULT_WIDTH);
    try {
      localStorage.setItem(LS_SIDEBAR_WIDTH, String(DEFAULT_WIDTH));
    } catch {
      /* noop */
    }
  };

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

  // ── Filter & search logic ──
  const cleanQ = searchQuery.toLowerCase().trim();

  const filteredHistory = useMemo(() => {
    let items = history;
    if (filterMode === 'pinned') items = items.filter((h) => h.isPinned);
    if (filterMode === 'recent') items = items.filter((h) => !h.isPinned);
    if (filterMode === 'benchmarks') return [];
    if (cleanQ) {
      items = items.filter(
        (h) =>
          h.title.toLowerCase().includes(cleanQ) ||
          (h.previewText && h.previewText.toLowerCase().includes(cleanQ))
      );
    }
    return items;
  }, [history, filterMode, cleanQ]);

  const pinnedItems = filteredHistory.filter((h) => h.isPinned);
  const recentItems = filteredHistory.filter((h) => !h.isPinned);

  // Group recent items by date
  const dateGroups = useMemo(() => groupByDate(recentItems), [recentItems]);

  const filteredBenchmarks = useMemo(() => {
    if (filterMode === 'pinned' || filterMode === 'recent') return [];
    return benchmarks.filter(
      (b) =>
        !cleanQ ||
        b.title.toLowerCase().includes(cleanQ) ||
        b.narrative.toLowerCase().includes(cleanQ)
    );
  }, [benchmarks, filterMode, cleanQ]);

  // ── Filter chips ──
  const filterChips: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pinned', label: 'Pinned' },
    { key: 'recent', label: 'Recent' },
    { key: 'benchmarks', label: 'Benchmarks' },
  ];

  // ── Render helpers ──

  const renderHistoryItem = (item: HistoryItem, dotColor: string, activeBg: string, activeBorder: string) => {
    const isActive = currentDecisionId === item.id;
    return (
      <SidebarItem
        key={item.id}
        item={item}
        isActive={isActive}
        searchQuery={cleanQ}
        dotColor={dotColor}
        activeBg={activeBg}
        activeBorder={activeBorder}
        onSelect={() => {
          onSelectHistoryItem(item);
          onCloseMobile();
        }}
        onPin={onTogglePinHistoryItem ? () => onTogglePinHistoryItem(item.id) : undefined}
        onDelete={onDeleteHistoryItem ? () => onDeleteHistoryItem(item.id) : undefined}
        onRename={
          onRenameHistoryItem ? (newTitle: string) => onRenameHistoryItem(item.id, newTitle) : undefined
        }
        onDuplicate={onDuplicateHistoryItem ? () => onDuplicateHistoryItem(item) : undefined}
        onExport={onExportHistoryItem ? () => onExportHistoryItem(item) : undefined}
      />
    );
  };

  const renderDateGroup = (label: string, sectionKey: string, items: HistoryItem[]) => {
    if (items.length === 0) return null;
    return (
      <SidebarSection
        key={sectionKey}
        id={sectionKey}
        label={label}
        icon={Clock}
        count={items.length}
        isOpen={sectionState[sectionKey] !== false}
        onToggle={() => toggleSection(sectionKey)}
      >
        <div className="space-y-0.5 px-0.5">
          {items.map((item) =>
            renderHistoryItem(
              item,
              'bg-[var(--color-slate)]',
              'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]',
              'border-[var(--color-verdigris)]/30'
            )
          )}
        </div>
      </SidebarSection>
    );
  };

  // Determine expanded sidebar width style
  const expandedWidthStyle = isExpanded
    ? { width: isMobileOpen ? 288 : sidebarWidth }
    : undefined;

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
        ref={sidebarRef}
        style={expandedWidthStyle}
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)]
          flex flex-col justify-between transition-all duration-200 ease-in-out select-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${!isExpanded ? 'md:w-16' : ''}
        `}
      >
        {/* Resize Handle (expanded desktop only) */}
        {isOpen && !isMobileOpen && (
          <div
            className="sidebar-resize-handle hidden md:block"
            onMouseDown={handleResizeStart}
            onDoubleClick={handleResizeDoubleClick}
            title="Drag to resize sidebar • Double-click to reset"
          />
        )}

        {/* ═══ Top Header ═══ */}
        {isExpanded ? (
          <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between min-w-0">
            <button
              type="button"
              onClick={() => {
                onNewDecision();
                onCloseMobile();
              }}
              className="flex items-center space-x-2.5 cursor-pointer overflow-hidden group text-left focus:outline-none"
              title="Phronesis — Practical Wisdom Under Uncertainty"
            >
              <div className="w-8 h-8 rounded-xl bg-[var(--color-verdigris)]/15 border border-[var(--color-verdigris)]/30 flex items-center justify-center text-[var(--color-verdigris)] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Compass className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="font-display font-bold text-sm tracking-tight text-[var(--text-main)]">
                    Phronesis
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">φρόνησις</span>
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
              title="Collapse sidebar (⌘B)"
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
              title="Expand sidebar (⌘B)"
              aria-label="Expand sidebar"
            >
              <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        )}

        {/* ═══ Action Button: New Decision & Search ═══ */}
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
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-app)] text-[var(--text-faint)] border border-[var(--border-subtle)]">
                ⌘N
              </span>
            </button>

            {/* Search Input with ⌘K */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dossiers..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-1.5 pl-8 pr-12 text-xs font-ui text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--color-verdigris)] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-faint)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
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

            {/* Filter Chips */}
            <div className="flex items-center space-x-1">
              {filterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilterMode(chip.key)}
                  data-active={filterMode === chip.key ? 'true' : 'false'}
                  className="sidebar-filter-chip px-2 py-0.5 rounded-full text-[9px] font-ui font-medium border border-[var(--border-subtle)] text-[var(--text-faint)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
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

        {/* ═══ Scrollable Navigation Area ═══ */}
        <div className="flex-1 overflow-y-auto sidebar-scrollbar px-2 space-y-3 py-2">
          {isExpanded ? (
            <>
              {/* ─── Pinned Dossiers ─── */}
              {pinnedItems.length > 0 && (
                <SidebarSection
                  id="pinned"
                  label="Pinned Dossiers"
                  icon={Pin}
                  iconClassName="text-[var(--color-ochre)] fill-current rotate-45 w-3 h-3"
                  count={pinnedItems.length}
                  isOpen={sectionState.pinned !== false}
                  onToggle={() => toggleSection('pinned')}
                >
                  <div className="space-y-0.5 px-0.5">
                    {pinnedItems.map((item) =>
                      renderHistoryItem(
                        item,
                        'bg-[var(--color-ochre)]',
                        'bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)]',
                        'border-[var(--color-ochre)]/40'
                      )
                    )}
                  </div>
                </SidebarSection>
              )}

              {/* ─── Chronological History Groups ─── */}
              {filterMode !== 'benchmarks' && (
                <>
                  {renderDateGroup('Today', 'today', dateGroups.today)}
                  {renderDateGroup('Yesterday', 'yesterday', dateGroups.yesterday)}
                  {renderDateGroup('Previous 7 Days', 'pastWeek', dateGroups.pastWeek)}
                  {renderDateGroup('Older', 'older', dateGroups.older)}

                  {/* Empty state */}
                  {recentItems.length === 0 && pinnedItems.length === 0 && (
                    <div className="px-2 py-4 text-center text-[11px] text-[var(--text-faint)] italic font-body">
                      {searchQuery
                        ? 'No matching decisions found.'
                        : 'No past decisions yet. Start your first reasoning audit.'}
                    </div>
                  )}

                  {/* Clear All Confirmation */}
                  {showClearConfirm && (
                    <div className="mx-1 mb-2 p-2.5 rounded-xl bg-[var(--bg-surface-raised)] border border-rose-500/30 text-xs space-y-2 shadow-xs">
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

                  {/* Clear button */}
                  {history.length > 0 && !showClearConfirm && (
                    <div className="px-2">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(true)}
                        className="text-[10px] text-[var(--text-faint)] hover:text-rose-400 flex items-center space-x-1 p-1 rounded transition-colors cursor-pointer"
                        title="Clear all history"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear history</span>
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ─── Canonical Dilemmas ─── */}
              {filteredBenchmarks.length > 0 && (
                <SidebarSection
                  id="benchmarks"
                  label="Canonical Dilemmas"
                  icon={BookOpen}
                  iconClassName="text-[var(--color-slate)] w-3.5 h-3.5"
                  count={filteredBenchmarks.length}
                  isOpen={sectionState.benchmarks !== false}
                  onToggle={() => toggleSection('benchmarks')}
                  headerRight={
                    onOpenBenchmarksGallery ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenBenchmarksGallery();
                          onCloseMobile();
                        }}
                        className="text-[10px] text-[var(--color-verdigris)] hover:underline font-mono cursor-pointer"
                        title="View all canonical dilemmas"
                      >
                        View all →
                      </button>
                    ) : undefined
                  }
                >
                  <div className="space-y-0.5 px-0.5">
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
                            ${
                              isActive
                                ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium border border-[var(--color-verdigris)]/30'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-transparent'
                            }
                          `}
                          title={bm.title}
                        >
                          <span
                            className={`text-[11px] font-serif shrink-0 ${
                              isActive ? 'text-[var(--color-verdigris)] font-bold' : 'text-[var(--color-slate)]'
                            }`}
                          >
                            §
                          </span>
                          <span className="truncate flex-1 text-[11px]">
                            <HighlightText text={bm.title} query={cleanQ} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </SidebarSection>
              )}

              {/* ─── Methodology Link ─── */}
              {onOpenMethodology && (
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenMethodology();
                      onCloseMobile();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-ui text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors flex items-center space-x-2 cursor-pointer"
                    title="Engine Architecture & Methodology"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0" />
                    <span>Methodology & Lineage</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ═══ Collapsed Rail Mode ═══ */
            <div className="flex flex-col items-center space-y-1">
              {/* Collapsed History Icons with hover preview */}
              {history.slice(0, 8).map((item) => (
                <CollapsedItemWithPreview
                  key={item.id}
                  item={item}
                  isActive={currentDecisionId === item.id}
                  icon={item.isPinned ? Pin : Clock}
                  onSelect={() => onSelectHistoryItem(item)}
                  onPin={onTogglePinHistoryItem ? () => onTogglePinHistoryItem(item.id) : undefined}
                />
              ))}

              {/* Collapsed Benchmarks Divider */}
              {benchmarks.length > 0 && (
                <>
                  <div className="w-6 border-t border-[var(--border-subtle)] my-1" />
                  {benchmarks.map((bm) => {
                    const isActive = currentDecisionId === bm.id;
                    return (
                      <CollapsedItemWithPreview
                        key={bm.id}
                        item={{ id: bm.id, title: bm.title, previewText: bm.narrative }}
                        isActive={isActive}
                        icon={() => <span className="font-serif text-sm">§</span>}
                        onSelect={() => onSelectBenchmark(bm)}
                      />
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* ═══ Footer ═══ */}
        {isExpanded ? (
          <div className="p-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] relative">
            {/* Sovereign Storage Popover */}
            {showSovereignPopover && (
              <SovereignStoragePopover
                historyCount={history.length}
                onClose={() => setShowSovereignPopover(false)}
                onExportAll={
                  onExportHistoryItem
                    ? () => {
                        // Export all as a batch — trigger the callback for each item
                        // or better, create a single JSON blob
                        const blob = new Blob(
                          [JSON.stringify(history.map((h) => ({ id: h.id, title: h.title, timestamp: h.timestamp, data: h.data })), null, 2)],
                          { type: 'application/json' }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `phronesis_backup_${new Date().toISOString().slice(0, 10)}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setShowSovereignPopover(false);
                      }
                    : undefined
                }
              />
            )}

            <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between shadow-2xs">
              <button
                type="button"
                onClick={() => setShowSovereignPopover((prev) => !prev)}
                className="flex items-center space-x-2.5 min-w-0 cursor-pointer group text-left"
                title="View sovereign storage details"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--color-verdigris)] text-[#F5F2EA] flex items-center justify-center font-display font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  S
                </div>
                <div className="min-w-0">
                  <div className="font-ui font-semibold text-xs text-[var(--text-main)] truncate leading-tight">
                    Saba Said
                  </div>
                  <div className="text-[9px] font-mono text-[var(--color-verdigris)] flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-verdigris)] animate-pulse" />
                    <span>Local & Sovereign</span>
                  </div>
                </div>
              </button>

              <div className="flex items-center space-x-0.5">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-raised)] transition-colors cursor-pointer"
                  aria-label="Toggle theme"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDarkMode ? (
                    <Sun className="w-3.5 h-3.5 text-[var(--color-ochre)]" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
                  )}
                </button>

                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-raised)] transition-colors cursor-pointer"
                    title="Settings & Privacy"
                    aria-label="Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed Bottom Icons */
          <div className="p-2 border-t border-[var(--border-subtle)] flex flex-col items-center space-y-1.5">
            <div
              className="w-8 h-8 rounded-lg bg-[var(--color-verdigris)] text-[#F5F2EA] flex items-center justify-center font-display font-bold text-xs shadow-2xs"
              title="Saba Said (Local & Sovereign)"
            >
              S
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-[var(--color-ochre)]" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--color-verdigris)]" />
              )}
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Settings & Privacy"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
