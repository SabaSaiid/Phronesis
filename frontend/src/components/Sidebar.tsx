import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Compass,
  Plus,
  Clock,
  Sun,
  Moon,
  ChevronDown,
  BookOpen,
  Trash2,
  X,
  Settings,
  Search,
  Pin,
  MoreHorizontal,
  Pencil,
  Copy,
  Download,
  Folder,
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
  FlaskConical,
  HelpCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import type { BenchmarkItem, ProjectSummary } from '../types';
import { groupByDate } from '../lib/formatTime';

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

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  history: HistoryItem[];
  benchmarks?: BenchmarkItem[];
  projects?: ProjectSummary[];
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onCreateProject?: (name: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onMoveDecisionToProject?: (decisionId: string, projectId: string | null) => Promise<void>;
  onSelectHistoryItem: (item: HistoryItem) => void;
  onSelectBenchmark?: (bm: BenchmarkItem) => void;
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
  onOpenLegal?: (tab?: 'faq' | 'credits' | 'terms' | 'privacy') => void;
}

const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 220;
const MAX_WIDTH = 380;
const LS_SIDEBAR_WIDTH = 'phronesis_sidebar_width';

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  isMobileOpen,
  onCloseMobile,
  history,
  benchmarks: _benchmarks,
  projects = [],
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject: _onDeleteProject,
  onSelectHistoryItem,
  onSelectBenchmark: _onSelectBenchmark,
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
  onOpenLegal,
}) => {
  // Sidebar Width State
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LS_SIDEBAR_WIDTH);
      return saved ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(saved))) : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });

  const [isResizing, setIsResizing] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [activeContextMenuId, setActiveContextMenuId] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNavMoreOpen, setIsNavMoreOpen] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setActiveContextMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resize handling
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
      try {
        localStorage.setItem(LS_SIDEBAR_WIDTH, String(newWidth));
      } catch {
        /* noop */
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const pinnedItems = useMemo(() => history.filter((item) => item.isPinned), [history]);
  const recentItems = useMemo(() => history.filter((item) => !item.isPinned), [history]);
  const groupedRecents = useMemo(() => {
    const g = groupByDate(recentItems);
    const sections = [
      { label: 'Today', items: g.today },
      { label: 'Yesterday', items: g.yesterday },
      { label: 'Previous 7 Days', items: g.pastWeek },
      { label: 'Older', items: g.older },
    ];
    return sections.filter((s) => s.items.length > 0);
  }, [recentItems]);

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !onCreateProject) return;
    try {
      await onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreatingProject(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleStartRename = (item: HistoryItem) => {
    setEditingItemId(item.id);
    setEditTitleInput(item.title);
    setActiveContextMenuId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitleInput.trim() && onRenameHistoryItem) {
      onRenameHistoryItem(id, editTitleInput.trim());
    }
    setEditingItemId(null);
  };

  const isExpanded = isOpen || isMobileOpen;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        ref={sidebarRef}
        style={{ width: isExpanded ? `${sidebarWidth}px` : '56px' }}
        className={`
          fixed md:relative top-0 bottom-0 left-0 z-40
          h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)]
          flex flex-col justify-between transition-all duration-200 ease-out select-none
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Resize Handle on Right Edge */}
        {isExpanded && (
          <div
            onMouseDown={startResizing}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--color-verdigris)] transition-colors z-50 group hidden md:block"
            title="Drag to resize sidebar"
          />
        )}

        {/* ═══ Header Section ═══ */}
        <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
          {isExpanded ? (
            <>
              {/* App Brand */}
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 flex items-center justify-center text-[var(--color-verdigris)]">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="font-display font-semibold text-sm text-[var(--text-main)] tracking-tight">
                  Phronesis
                </span>
              </div>

              {/* Header Right Action Icons */}
              <div className="flex items-center space-x-1">
                {onOpenCommandPalette && (
                  <button
                    type="button"
                    onClick={onOpenCommandPalette}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                    title="Search dossiers & actions (⌘K)"
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onToggle}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer hidden md:flex"
                  title="Collapse sidebar (⌘B)"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer md:hidden"
                  aria-label="Close mobile sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Collapsed Rail Header */
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={onToggle}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Expand sidebar (⌘B)"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-[var(--color-verdigris)]" />
              </button>
            </div>
          )}
        </div>

        {/* ═══ Top Action Button: New Decision ═══ */}
        <div className="p-2.5 space-y-2">
          {isExpanded ? (
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
                <Plus className="w-4 h-4 text-[var(--color-verdigris)] group-hover:scale-110 transition-transform shrink-0" />
                <span>New decision</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-faint)]">⌘N</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onNewDecision}
              className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] text-[var(--color-verdigris)] transition-all shadow-xs cursor-pointer"
              title="New decision (⌘N)"
              aria-label="New decision"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {/* Quick Nav Rail (Screenshot 1 style) */}
          {isExpanded && (
            <div className="space-y-0.5 pt-1 text-xs font-ui">
              {/* Library (Canonical Dilemmas) */}
              <button
                type="button"
                onClick={() => {
                  onOpenBenchmarksGallery?.();
                  onCloseMobile();
                }}
                className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer text-left"
              >
                <BookOpen className="w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0" />
                <span className="font-medium">Library</span>
              </button>

              {/* Projects */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors group">
                  <button
                    type="button"
                    onClick={() => {
                      if (projects[0]) onSelectProject?.(projects[0].id);
                    }}
                    className="flex items-center space-x-2.5 flex-1 text-left cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5 text-[var(--color-ochre)] shrink-0" />
                    <span className="font-medium">Projects</span>
                  </button>
                  {onCreateProject && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingProject((prev) => !prev)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-faint)] hover:text-[var(--color-verdigris)] transition-opacity cursor-pointer"
                      title="New Project"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Inline New Project Input */}
                {isCreatingProject && (
                  <form onSubmit={handleCreateProjectSubmit} className="p-2 mx-1 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--color-verdigris)]/40 space-y-1.5 shadow-2xs">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project name..."
                      autoFocus
                      className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--color-verdigris)]"
                    />
                  </form>
                )}

                {/* Project List */}
                {projects.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectProject?.(p.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between pl-7 pr-2 py-1 rounded-lg text-[11px] font-ui transition-colors cursor-pointer ${
                      activeProjectId === p.id
                        ? 'text-[var(--color-verdigris)] font-medium bg-[var(--color-verdigris-subtle)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="font-mono text-[9px] text-[var(--text-faint)]">{p.decision_count}</span>
                  </button>
                ))}
              </div>

              {/* Scheduled / VoI Tests */}
              <button
                type="button"
                onClick={() => {
                  onOpenMethodology?.();
                  onCloseMobile();
                }}
                className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer text-left"
              >
                <FlaskConical className="w-3.5 h-3.5 text-[var(--color-ochre)] shrink-0" />
                <span className="font-medium">Scheduled VoI</span>
              </button>

              {/* More Navigation (Methodology, Governance) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNavMoreOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <MoreHorizontal className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0" />
                    <span className="font-medium">More</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-[var(--text-faint)] transition-transform ${isNavMoreOpen ? 'rotate-180' : ''}`} />
                </button>

                {isNavMoreOpen && (
                  <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[var(--border-subtle)] ml-3 my-0.5 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenMethodology?.();
                        setIsNavMoreOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
                    >
                      Methodology
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenLegal?.('faq');
                        setIsNavMoreOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
                    >
                      Help & FAQ
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ Scrollable History: Pinned & Recents ═══ */}
        <div className="flex-1 overflow-y-auto px-2 space-y-3 py-2 scrollbar-none border-t border-[var(--border-subtle)]">
          {isExpanded ? (
            <>
              {/* Pinned Section */}
              {pinnedItems.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-ui font-semibold uppercase tracking-wider text-[var(--text-faint)] flex items-center space-x-1">
                    <Pin className="w-3 h-3 text-[var(--color-verdigris)]" />
                    <span>Pinned</span>
                  </div>
                  <div className="space-y-0.5">
                    {pinnedItems.map((item) => (
                      <div
                        key={item.id}
                        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-ui transition-colors cursor-pointer ${
                          currentDecisionId === item.id
                            ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium'
                            : 'text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                        }`}
                        onClick={() => {
                          onSelectHistoryItem(item);
                          onCloseMobile();
                        }}
                      >
                        <span className="truncate pr-2">{item.title}</span>
                        {onTogglePinHistoryItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePinHistoryItem(item.id);
                            }}
                            className="p-1 rounded text-[var(--color-verdigris)] hover:opacity-75 transition-opacity"
                            title="Unpin"
                          >
                            <Pin className="w-3 h-3 fill-current" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recents Section */}
              <div className="space-y-2">
                <div className="px-2 text-[10px] font-ui font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                  Recents
                </div>

                {groupedRecents.length === 0 ? (
                  <div className="px-2 py-4 text-center text-xs text-[var(--text-faint)] font-body">
                    No decisions logged yet.
                  </div>
                ) : (
                  groupedRecents.map((group) => (
                    <div key={group.label} className="space-y-0.5">
                      <div className="px-2 pt-1 text-[9px] font-mono text-[var(--text-faint)] uppercase">
                        {group.label}
                      </div>

                      {group.items.map((item) => {
                        const isEditing = editingItemId === item.id;
                        const isSelected = currentDecisionId === item.id;

                        if (isEditing) {
                          return (
                            <div key={item.id} className="p-1.5 rounded-lg bg-[var(--bg-surface-raised)] border border-[var(--color-verdigris)]/40">
                              <input
                                type="text"
                                value={editTitleInput}
                                onChange={(e) => setEditTitleInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(item.id);
                                  if (e.key === 'Escape') setEditingItemId(null);
                                }}
                                onBlur={() => handleSaveRename(item.id)}
                                autoFocus
                                className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--text-main)] focus:outline-none"
                              />
                            </div>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-ui transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-medium'
                                : 'text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                            }`}
                            onClick={() => {
                              onSelectHistoryItem(item);
                              onCloseMobile();
                            }}
                          >
                            <span className="truncate pr-2">{item.title}</span>

                            {/* 3-Dot Item Context Menu Trigger */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveContextMenuId((prev) => (prev === item.id ? null : item.id));
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--bg-surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-opacity cursor-pointer shrink-0"
                              title="Decision options"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {/* Floating Item Context Menu */}
                            {activeContextMenuId === item.id && (
                              <div
                                ref={contextMenuRef}
                                className="chatgpt-popover absolute right-2 top-8 w-44 p-1.5 z-50 space-y-0.5 animate-fade-in shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {onTogglePinHistoryItem && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onTogglePinHistoryItem(item.id);
                                      setActiveContextMenuId(null);
                                    }}
                                    className="chatgpt-popover-item text-xs py-1"
                                  >
                                    <Pin className="w-3 h-3 text-[var(--color-verdigris)]" />
                                    <span>{item.isPinned ? 'Unpin' : 'Pin to top'}</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleStartRename(item)}
                                  className="chatgpt-popover-item text-xs py-1"
                                >
                                  <Pencil className="w-3 h-3 text-[var(--text-muted)]" />
                                  <span>Rename</span>
                                </button>

                                {onDuplicateHistoryItem && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDuplicateHistoryItem(item);
                                      setActiveContextMenuId(null);
                                    }}
                                    className="chatgpt-popover-item text-xs py-1"
                                  >
                                    <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                                    <span>Duplicate</span>
                                  </button>
                                )}

                                {onExportHistoryItem && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onExportHistoryItem(item);
                                      setActiveContextMenuId(null);
                                    }}
                                    className="chatgpt-popover-item text-xs py-1"
                                  >
                                    <Download className="w-3 h-3 text-[var(--text-muted)]" />
                                    <span>Export</span>
                                  </button>
                                )}

                                {onDeleteHistoryItem && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteHistoryItem(item.id);
                                      setActiveContextMenuId(null);
                                    }}
                                    className="chatgpt-popover-item text-xs py-1 text-rose-500 hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-500" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Collapsed Icons */
            <div className="flex flex-col items-center space-y-1.5">
              {history.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectHistoryItem(item)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                    currentDecisionId === item.id
                      ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/40'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)]'
                  }`}
                  title={item.title}
                >
                  {item.isPinned ? <Pin className="w-3.5 h-3.5 text-[var(--color-verdigris)]" /> : <Clock className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═══ Bottom User Profile Pill & Popup Menu (Screenshots 1 & 3) ═══ */}
        <div className="p-2 border-t border-[var(--border-subtle)] relative" ref={profileMenuRef}>
          {isExpanded ? (
            <>
              {/* Profile Pill */}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="w-full p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] flex items-center justify-between cursor-pointer transition-colors shadow-2xs group"
                title="Account, Theme & Settings"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-verdigris)] text-white flex items-center justify-center font-display font-bold text-xs shrink-0 shadow-2xs">
                    SA
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="font-ui font-semibold text-xs text-[var(--text-main)] truncate leading-tight">
                      Saba Said
                    </div>
                    <div className="text-[9px] font-mono text-[var(--color-verdigris)] flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-verdigris)]" />
                      <span>Prohairesis Active</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className={`w-3.5 h-3.5 text-[var(--text-faint)] group-hover:text-[var(--text-main)] transition-transform ${isProfileMenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Upward Profile Floating Popover (Screenshot 3 style) */}
              {isProfileMenuOpen && (
                <div className="chatgpt-popover absolute left-2 right-2 bottom-full mb-2 p-2 z-50 animate-fade-in space-y-1">
                  {/* User info Header */}
                  <div className="px-2.5 py-1.5 border-b border-[var(--border-subtle)] mb-1">
                    <div className="font-ui font-semibold text-xs text-[var(--text-main)]">Saba Said</div>
                    <div className="text-[10px] text-[var(--text-faint)]">Local Workspace Sovereign</div>
                  </div>

                  {/* Theme Switcher Toggle inside Profile */}
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="chatgpt-popover-item"
                  >
                    {isDarkMode ? (
                      <Sun className="w-4 h-4 text-[var(--color-ochre)]" />
                    ) : (
                      <Moon className="w-4 h-4 text-[var(--color-verdigris)]" />
                    )}
                    <div className="flex-1 text-left font-ui">
                      {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    </div>
                  </button>

                  {/* Methodology Modal Trigger */}
                  {onOpenMethodology && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenMethodology();
                        setIsProfileMenuOpen(false);
                      }}
                      className="chatgpt-popover-item"
                    >
                      <Sparkles className="w-4 h-4 text-[var(--color-verdigris)]" />
                      <div className="flex-1 text-left font-ui">Methodology & Guide</div>
                    </button>
                  )}

                  {/* Settings Modal Trigger */}
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSettings();
                        setIsProfileMenuOpen(false);
                      }}
                      className="chatgpt-popover-item"
                    >
                      <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                      <div className="flex-1 text-left font-ui">Settings</div>
                    </button>
                  )}

                  {/* Help & Governance */}
                  {onOpenLegal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenLegal('faq');
                        setIsProfileMenuOpen(false);
                      }}
                      className="chatgpt-popover-item"
                    >
                      <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" />
                      <div className="flex-1 text-left font-ui">Help & FAQ</div>
                    </button>
                  )}

                  <div className="border-t border-[var(--border-subtle)] my-1" />

                  {/* Clear Session / History */}
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory();
                      setIsProfileMenuOpen(false);
                    }}
                    className="chatgpt-popover-item text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <div className="flex-1 text-left font-ui text-rose-500">Clear All History</div>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Collapsed Profile Button */
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onToggle}
                className="w-8 h-8 rounded-lg bg-[var(--color-verdigris)] text-white flex items-center justify-center font-display font-bold text-xs shadow-2xs cursor-pointer"
                title="Saba Said (Click to expand)"
              >
                SA
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
