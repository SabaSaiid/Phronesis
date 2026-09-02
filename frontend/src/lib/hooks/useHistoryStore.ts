import { useState, useCallback } from 'react';
import type { HistoryItem } from '../../types';

const LOCAL_STORAGE_HISTORY_KEY = 'phronesis_history';

function safePersistHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(items));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      const pruned = [
        ...items.filter((i) => i.isPinned),
        ...items.filter((i) => !i.isPinned).slice(0, 5),
      ];
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(pruned));
      } catch (err) {
        console.warn('Failed to persist history after pruning:', err);
      }
    } else {
      console.warn('Failed to persist history:', e);
    }
  }
}

export function useHistoryStore(
  showToast: (toast: { type: 'success' | 'error' | 'info'; title: string; description?: string }) => void
) {
  const [isTemporarySession, setIsTemporarySession] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleTemporarySession = useCallback(() => {
    setIsTemporarySession((prev) => {
      const next = !prev;
      showToast({
        type: next ? 'info' : 'success',
        title: next ? 'Temporary Deliberation Active' : 'Normal Session Restored',
        description: next
          ? 'Decisions and deliberations in this session will not be saved to history.'
          : 'History persistence is now enabled.',
      });
      return next;
    });
  }, [showToast]);

  const addHistoryItem = useCallback((item: HistoryItem) => {
    if (isTemporarySession) return;
    setHistory((prev) => {
      const updated = [item, ...prev.filter((i) => i.title !== item.title)].slice(0, 30);
      safePersistHistory(updated);
      return updated;
    });
  }, [isTemporarySession]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch (e) {
      console.warn('Failed to clear history:', e);
    }
    showToast({
      type: 'info',
      title: 'History Cleared',
      description: 'All past local decision records removed.',
    });
  }, [showToast]);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safePersistHistory(updated);
      return updated;
    });
  }, []);

  const handleTogglePinHistoryItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      );
      safePersistHistory(updated);
      return updated;
    });
  }, []);

  const handleRenameHistoryItem = useCallback((id: string, newTitle: string) => {
    setHistory((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, title: newTitle } : item
      );
      safePersistHistory(updated);
      return updated;
    });
  }, []);

  const handleDuplicateHistoryItem = useCallback((item: HistoryItem) => {
    const duplicated: HistoryItem = {
      ...item,
      id: `dec-${Date.now()}`,
      title: `${item.title} (copy)`,
      timestamp: Date.now(),
      isPinned: false,
    };
    setHistory((prev) => {
      const updated = [duplicated, ...prev].slice(0, 30);
      safePersistHistory(updated);
      return updated;
    });
    showToast({
      type: 'info',
      title: 'Dossier Duplicated',
      description: `"${duplicated.title}" created.`,
    });
  }, [showToast]);

  const handleExportSingleHistoryItem = useCallback((item: HistoryItem) => {
    try {
      const payload = { id: item.id, title: item.title, timestamp: item.timestamp, data: item.data };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phronesis_${item.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({
        type: 'success',
        title: 'Exported',
        description: `"${item.title}" saved as JSON.`,
      });
    } catch (err) {
      console.warn('Export failed:', err);
    }
  }, [showToast]);

  return {
    history,
    setHistory,
    isTemporarySession,
    handleToggleTemporarySession,
    addHistoryItem,
    handleClearHistory,
    handleDeleteHistoryItem,
    handleTogglePinHistoryItem,
    handleRenameHistoryItem,
    handleDuplicateHistoryItem,
    handleExportSingleHistoryItem,
  };
}
