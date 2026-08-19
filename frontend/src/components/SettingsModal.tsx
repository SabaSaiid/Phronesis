import React, { useState, useEffect } from 'react';
import { Settings, Shield, Download, Trash2, X, Check, Database } from 'lucide-react';
import { fetchMemorySettings, updateMemorySettings, exportHistory, purgeHistory } from '../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHistoryPurged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onHistoryPurged
}) => {
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchMemorySettings();
      setMemoryEnabled(res.memory_enabled);
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMemory = async () => {
    const nextState = !memoryEnabled;
    try {
      await updateMemorySettings(nextState);
      setMemoryEnabled(nextState);
      setSuccessMsg(nextState ? 'Local memory enabled' : 'Local memory disabled');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.warn('Failed to update memory setting:', err);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportHistory();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phronesis_history_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Export error:', err);
    }
  };

  const handlePurge = async () => {
    try {
      await purgeHistory();
      setShowPurgeConfirm(false);
      onHistoryPurged();
      setSuccessMsg('All local decision records wiped successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.warn('Purge error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] rounded-2xl shadow-xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150 text-xs sm:text-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center space-x-2 text-[var(--text-main)] font-display font-semibold text-base">
            <Settings className="w-4.5 h-4.5 text-[var(--color-verdigris)]" />
            <span>Settings & Privacy Controls</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 flex items-center space-x-2 font-ui">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Local Decision Memory Opt-In */}
        <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 font-ui font-semibold text-[var(--text-main)]">
                <Database className="w-4 h-4 text-[var(--color-verdigris)]" />
                <span>Local Decision Memory</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-body leading-relaxed">
                Stores structured decision summaries locally in SQLite (<code>~/.phronesis/phronesis.db</code>) to detect recurring blind spots across time. Gated behind a 5-decision threshold.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleMemory}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                memoryEnabled ? 'bg-[var(--color-verdigris)]' : 'bg-[var(--color-slate)]/40'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  memoryEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sovereign Privacy & Export Controls */}
        <div className="space-y-3">
          <h4 className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Sovereign Data Controls
          </h4>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] text-[var(--text-main)] font-ui font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
              <span>Export History (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPurgeConfirm(true)}
              className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-ui font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe Data</span>
            </button>
          </div>

          {showPurgeConfirm && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2.5">
              <p className="text-xs text-[var(--text-main)] font-medium">
                Irreversibly delete all decision history, outcomes, and feedback from your local disk?
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePurge}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-ui font-semibold text-xs hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Confirm Delete All
                </button>
                <button
                  type="button"
                  onClick={() => setShowPurgeConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] font-ui text-xs hover:text-[var(--text-main)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center space-x-2 text-[11px] text-[var(--text-faint)] font-ui">
          <Shield className="w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0" />
          <span>Zero cloud databases. 100% private and sovereign.</span>
        </div>
      </div>
    </div>
  );
};
