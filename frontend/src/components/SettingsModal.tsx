import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Shield,
  Download,
  Trash2,
  X,
  Check,
  Database,
  Cpu,
  Eye,
  EyeOff,
  RefreshCw,
  Upload,
  FileText,
  Sun,
  Moon,
  Keyboard,
  Sliders,
  Compass,
  HelpCircle,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Key,
  Activity,
  HardDrive
} from 'lucide-react';
import type {
  StorageStats,
  CustomApiKeys,
  FontSizeOption,
  UserPreferences,
  LLMModelOption,
  EffortLevel,
  FocusMode
} from '../types';
import {
  fetchMemorySettings,
  updateMemorySettings,
  fetchStorageStats,
  exportHistory,
  importHistory,
  purgeHistory,
  fetchModels,
  testApiKey
} from '../lib/api';

export type SettingsTab =
  | 'ai'
  | 'calibration'
  | 'data'
  | 'appearance'
  | 'shortcuts'
  | 'diagnostics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHistoryPurged: () => void;
  onOpenMethodology?: () => void;
  onOpenLegal?: (tab?: 'faq' | 'credits' | 'terms' | 'privacy') => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  initialTab?: SettingsTab;
}

const LOCAL_STORAGE_KEYS = {
  CUSTOM_API_KEYS: 'phronesis_custom_api_keys',
  PREFERENCES: 'phronesis_preferences',
  PREFERRED_MODEL: 'phronesis_preferred_model',
  PREFERRED_EFFORT: 'phronesis_preferred_effort',
  PREFERRED_FOCUS: 'phronesis_preferred_focus',
  FONT_SIZE: 'phronesis_font_size',
  REDUCE_MOTION: 'phronesis_reduce_motion',
  GLOSSARY_TOOLTIPS: 'phronesis_glossary_tooltips',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onHistoryPurged,
  onOpenMethodology,
  onOpenLegal,
  isDarkMode,
  onToggleTheme,
  initialTab = 'ai',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Tab 1: AI & Inference State
  const [models, setModels] = useState<LLMModelOption[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [customKeys, setCustomKeys] = useState<CustomApiKeys>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOM_API_KEYS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { valid: boolean; message: string }>>({});
  const [defaultEffort, setDefaultEffort] = useState<EffortLevel>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEYS.PREFERRED_EFFORT) as EffortLevel) || 'standard';
  });

  // Tab 2: Calibration Defaults
  const [defaultFocus, setDefaultFocus] = useState<FocusMode>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEYS.PREFERRED_FOCUS) as FocusMode) || 'all';
  });
  const [defaultRiskTolerance, setDefaultRiskTolerance] = useState<'risk_neutral' | 'risk_averse' | 'risk_seeking'>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PREFERENCES);
      return saved ? JSON.parse(saved).defaultRiskTolerance || 'risk_neutral' : 'risk_neutral';
    } catch {
      return 'risk_neutral';
    }
  });
  const [biasSensitivity, setBiasSensitivity] = useState<'standard' | 'high'>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PREFERENCES);
      return saved ? JSON.parse(saved).biasSensitivity || 'standard' : 'standard';
    } catch {
      return 'standard';
    }
  });

  // Tab 3: Data & Sovereignty State
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab 4: Appearance & Accessibility
  const [fontSize, setFontSize] = useState<FontSizeOption>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEYS.FONT_SIZE) as FontSizeOption) || 'standard';
  });
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.REDUCE_MOTION) === 'true';
  });
  const [showGlossaryTooltips, setShowGlossaryTooltips] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.GLOSSARY_TOOLTIPS);
    return saved !== null ? saved === 'true' : true;
  });

  // Tab 5: Keyboard Shortcuts Search
  const [shortcutSearch, setShortcutSearch] = useState('');

  // General Notification Banner
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadAllSettings();
    }
  }, [isOpen, initialTab]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const loadAllSettings = async () => {
    try {
      // 1. Memory Settings
      const mem = await fetchMemorySettings();
      setMemoryEnabled(mem.memory_enabled);

      // 2. Storage Telemetry
      loadStorageStats();

      // 3. Models Catalog
      const cat = await fetchModels();
      if (cat.models) {
        setModels(cat.models);
        // Load preferred model
        try {
          const pref = localStorage.getItem(LOCAL_STORAGE_KEYS.PREFERRED_MODEL);
          if (pref) {
            const parsed = JSON.parse(pref);
            if (parsed.provider) setSelectedProvider(parsed.provider);
            if (parsed.model) setSelectedModel(parsed.model);
          } else if (cat.default_model) {
            setSelectedProvider(cat.default_model.provider);
            setSelectedModel(cat.default_model.model);
          }
        } catch {
          /* noop */
        }
      }
    } catch (err) {
      console.warn('Failed to load settings data:', err);
    }
  };

  const loadStorageStats = async () => {
    try {
      setLoadingStats(true);
      const s = await fetchStorageStats();
      setStats(s);
    } catch (err) {
      console.warn('Failed to load storage statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // ──────────────────────────────────────────────
  // AI & Provider Handlers
  // ──────────────────────────────────────────────
  const handleSelectModel = (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.PREFERRED_MODEL,
      JSON.stringify({ provider, model })
    );
    showSuccess(`Default model updated to ${model}`);
  };

  const handleUpdateCustomKey = (provider: string, value: string) => {
    const next = { ...customKeys, [provider]: value.trim() };
    if (!value.trim()) {
      delete next[provider as keyof CustomApiKeys];
    }
    setCustomKeys(next);
    localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOM_API_KEYS, JSON.stringify(next));
  };

  const handleTestKey = async (provider: string) => {
    const key = customKeys[provider as keyof CustomApiKeys];
    if (!key) {
      showError(`Please enter a ${provider.toUpperCase()} API key first.`);
      return;
    }

    try {
      setTestingKey(provider);
      const res = await testApiKey(provider, key);
      setTestResult((prev) => ({ ...prev, [provider]: res }));
      if (res.valid) {
        showSuccess(res.message);
      } else {
        showError(res.message);
      }
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [provider]: { valid: false, message: err.message || 'Key verification failed' }
      }));
      showError(err.message || 'Key verification failed');
    } finally {
      setTestingKey(null);
    }
  };

  const handleUpdateEffort = (effort: EffortLevel) => {
    setDefaultEffort(effort);
    localStorage.setItem(LOCAL_STORAGE_KEYS.PREFERRED_EFFORT, effort);
    showSuccess(`Default reasoning effort set to ${effort.toUpperCase()}`);
  };

  // ──────────────────────────────────────────────
  // Calibration Handlers
  // ──────────────────────────────────────────────
  const handleUpdateFocus = (focus: FocusMode) => {
    setDefaultFocus(focus);
    localStorage.setItem(LOCAL_STORAGE_KEYS.PREFERRED_FOCUS, focus);
    savePreferences({ defaultFocus: focus });
    showSuccess('Default focus lens updated');
  };

  const handleUpdateRiskTolerance = (val: 'risk_neutral' | 'risk_averse' | 'risk_seeking') => {
    setDefaultRiskTolerance(val);
    savePreferences({ defaultRiskTolerance: val });
    showSuccess('Default risk tolerance profile updated');
  };

  const handleUpdateBiasSensitivity = (val: 'standard' | 'high') => {
    setBiasSensitivity(val);
    savePreferences({ biasSensitivity: val });
    showSuccess('Cognitive bias sensitivity updated');
  };

  const savePreferences = (patch: Partial<UserPreferences>) => {
    try {
      const current = localStorage.getItem(LOCAL_STORAGE_KEYS.PREFERENCES);
      const parsed = current ? JSON.parse(current) : {};
      const updated = { ...parsed, ...patch };
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    } catch {
      /* noop */
    }
  };

  // ──────────────────────────────────────────────
  // Data Sovereignty & Memory Handlers
  // ──────────────────────────────────────────────
  const handleToggleMemory = async () => {
    const next = !memoryEnabled;
    try {
      await updateMemorySettings(next);
      setMemoryEnabled(next);
      loadStorageStats();
      showSuccess(next ? 'Local SQLite memory enabled' : 'Local SQLite memory disabled');
    } catch (err: any) {
      showError(err.message || 'Failed to update memory setting');
    }
  };

  const handleExportJSON = async () => {
    try {
      const data = await exportHistory();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phronesis_sovereign_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Complete JSON database backup exported successfully');
    } catch (err: any) {
      showError(err.message || 'Failed to export history');
    }
  };

  const handleExportCSV = async () => {
    try {
      const data = await exportHistory();
      const decisions = data.decisions || [];
      if (decisions.length === 0) {
        showError('No decision records found to export.');
        return;
      }

      const headers = ['ID', 'Timestamp', 'Domain', 'Statement', 'Preferred_EU', 'Minimax_Regret', 'Biases'];
      const rows = decisions.map((d: any) => [
        `"${d.id}"`,
        `"${d.timestamp}"`,
        `"${d.domain || ''}"`,
        `"${(d.decision_statement || '').replace(/"/g, '""')}"`,
        `"${d.preferred_eu_alt || ''}"`,
        `"${d.minimax_regret_choice || ''}"`,
        `"${d.flagged_bias_ids || ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phronesis_decisions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('CSV decisions summary exported successfully');
    } catch (err: any) {
      showError(err.message || 'Failed to export CSV');
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await importHistory(json);
      if (res.status === 'success') {
        showSuccess(res.message || `Imported ${res.imported_decisions} decisions and ${res.imported_projects} projects.`);
        loadStorageStats();
        onHistoryPurged(); // Refresh sidebar history list
      } else {
        showError(res.message || 'Import failed with an error.');
      }
    } catch (err: any) {
      showError(err.message || 'Invalid JSON backup file.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePurge = async () => {
    try {
      await purgeHistory();
      setShowPurgeConfirm(false);
      onHistoryPurged();
      loadStorageStats();
      showSuccess('All local decision records wiped successfully from SQLite');
    } catch (err: any) {
      showError(err.message || 'Failed to purge database');
    }
  };

  // ──────────────────────────────────────────────
  // Appearance Handlers
  // ──────────────────────────────────────────────
  const handleUpdateFontSize = (size: FontSizeOption) => {
    setFontSize(size);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FONT_SIZE, size);
    document.documentElement.setAttribute('data-font-size', size);
    showSuccess(`Font size adjusted to ${size}`);
  };

  const handleToggleReduceMotion = () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    localStorage.setItem(LOCAL_STORAGE_KEYS.REDUCE_MOTION, String(next));
    document.documentElement.setAttribute('data-reduce-motion', String(next));
    showSuccess(next ? 'Reduced motion enabled' : 'Smooth animations restored');
  };

  const handleToggleGlossaryTooltips = () => {
    const next = !showGlossaryTooltips;
    setShowGlossaryTooltips(next);
    localStorage.setItem(LOCAL_STORAGE_KEYS.GLOSSARY_TOOLTIPS, String(next));
    showSuccess(next ? 'Decision theory tooltips enabled' : 'Decision theory tooltips hidden');
  };

  if (!isOpen) return null;

  // Shortcuts list with filtering
  const KEYBOARD_SHORTCUTS = [
    { key: '⌘ + K / Ctrl + K', description: 'Open Global Command Palette & Navigation', category: 'Navigation' },
    { key: '⌘ + Enter / Ctrl + Enter', description: 'Extract and analyze decision dilemma', category: 'Workflow' },
    { key: '⌘ + , / Ctrl + ,', description: 'Open Settings & Sovereignty Control Center', category: 'Settings' },
    { key: '⌘ + / / Ctrl + /', description: 'Toggle keyboard shortcuts cheatsheet', category: 'Help' },
    { key: '⌘ + B / Ctrl + B', description: 'Toggle collapsible sidebar navigation', category: 'Navigation' },
    { key: '⌘ + J / Ctrl + J', description: 'Open Socratic Deliberation chat drawer', category: 'Deliberation' },
    { key: '⌘ + E / Ctrl + E', description: 'Open export modal for active decision report', category: 'Workflow' },
    { key: 'Esc', description: 'Close any active modal, dialog, or drawer', category: 'General' },
    { key: '↑ / ↓', description: 'Navigate through Command Palette search results', category: 'Navigation' },
    { key: 'Enter', description: 'Execute selected command or action', category: 'General' },
  ];

  const filteredShortcuts = KEYBOARD_SHORTCUTS.filter(
    (s) =>
      s.description.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
      s.key.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(shortcutSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-raised)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-[var(--text-main)] flex items-center gap-2">
                <span>Settings & Sovereignty Control Center</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-ui">
                Configure inference providers, calibration defaults, local storage telemetry & privacy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Success / Error Toast Banners */}
        {successMsg && (
          <div className="px-6 py-2.5 bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border-b border-[var(--color-verdigris)]/30 flex items-center space-x-2 text-xs font-ui animate-in fade-in duration-150">
            <Check className="w-4 h-4 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-red-500/10 text-red-400 border-b border-red-500/30 flex items-center space-x-2 text-xs font-ui animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Modal Body: Left Tab Rail + Right Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-48 sm:w-56 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-app)]/50 p-3 space-y-1 overflow-y-auto text-xs font-ui">
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              data-active={activeTab === 'ai'}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left settings-tab-btn text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              <Cpu className="w-4 h-4 shrink-0 text-[var(--color-verdigris)]" />
              <span>AI & Inference</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calibration')}
              data-active={activeTab === 'calibration'}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left settings-tab-btn text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              <Sliders className="w-4 h-4 shrink-0 text-[var(--color-ochre)]" />
              <span>Calibration Defaults</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('data')}
              data-active={activeTab === 'data'}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left settings-tab-btn text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              <Database className="w-4 h-4 shrink-0 text-[var(--color-verdigris)]" />
              <span>Data & Sovereignty</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              data-active={activeTab === 'appearance'}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left settings-tab-btn text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              <Sun className="w-4 h-4 shrink-0 text-[var(--color-ochre)]" />
              <span>Appearance & UI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shortcuts')}
              data-active={activeTab === 'shortcuts'}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left settings-tab-btn text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              <Keyboard className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
              <span>Shortcuts Cheatsheet</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diagnostics')}
              data-active={activeTab === 'diagnostics'}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left settings-tab-btn text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              <Activity className="w-4 h-4 shrink-0 text-[var(--color-verdigris)]" />
              <span>Diagnostics & About</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* ────────────────────────────────────────────── */}
            {/* TAB 1: AI & Inference Engine */}
            {/* ────────────────────────────────────────────── */}
            {activeTab === 'ai' && (
              <div className="space-y-6 animate-in fade-in duration-150 text-xs sm:text-sm">
                <div>
                  <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                    Inference Providers & Models
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-ui">
                    Configure default LLM intelligence for narrative extraction, dialectical steelmanning, and report synthesis.
                  </p>
                </div>

                {/* Default Model Selector Cards */}
                <div className="space-y-3">
                  <label className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                    Default Active Model
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {models.map((m) => {
                      const isSelected = selectedProvider === m.provider && selectedModel === m.model;
                      const hasCustomKey = Boolean(customKeys[m.provider as keyof CustomApiKeys]);
                      const isKeyReady = m.has_key || hasCustomKey || m.provider === 'mock';

                      return (
                        <div
                          key={`${m.provider}-${m.model}`}
                          onClick={() => handleSelectModel(m.provider, m.model)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[var(--color-verdigris-subtle)] border-[var(--color-verdigris)] shadow-xs'
                              : 'bg-[var(--bg-surface-raised)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-sm text-[var(--text-main)] flex items-center gap-1.5">
                                {m.label}
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] uppercase font-data tracking-wider">
                                {m.provider.toUpperCase()}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-ui font-medium ${
                                isKeyReady
                                  ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)]'
                                  : 'bg-[var(--color-slate-subtle)] text-[var(--text-faint)]'
                              }`}
                            >
                              {isKeyReady ? 'Ready' : 'Needs Key'}
                            </span>
                          </div>
                          {m.description && (
                            <p className="mt-2 text-xs text-[var(--text-muted)] font-ui leading-relaxed">
                              {m.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BYOK Custom API Keys */}
                <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-[var(--color-verdigris)]" />
                    <h4 className="font-ui font-semibold text-xs text-[var(--text-main)] uppercase tracking-wider">
                      Bring Your Own Key (BYOK) — Custom API Keys
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-ui">
                    Keys are stored strictly in your local browser sandbox and passed per-request. They are never transmitted to any third-party logging or cloud storage.
                  </p>

                  <div className="space-y-3 pt-2">
                    {/* Gemini Key */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-ui">
                        <span className="font-medium text-[var(--text-main)]">Google Gemini API Key</span>
                        {testResult['gemini'] && (
                          <span
                            className={`text-[11px] ${
                              testResult['gemini'].valid ? 'text-[var(--color-verdigris)]' : 'text-red-400'
                            }`}
                          >
                            {testResult['gemini'].valid ? '✓ Verified' : '✕ Verification Failed'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showKey['gemini'] ? 'text' : 'password'}
                            value={customKeys.gemini || ''}
                            onChange={(e) => handleUpdateCustomKey('gemini', e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full py-2 px-3 pr-9 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] text-xs text-[var(--text-main)] font-data focus:outline-hidden focus:border-[var(--color-verdigris)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey((p) => ({ ...p, gemini: !p.gemini }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                          >
                            {showKey['gemini'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={testingKey === 'gemini' || !customKeys.gemini}
                          onClick={() => handleTestKey('gemini')}
                          className="py-2 px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] hover:border-[var(--color-verdigris)] text-xs font-ui font-medium text-[var(--text-main)] flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
                        >
                          {testingKey === 'gemini' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>Test</span>
                        </button>
                      </div>
                    </div>

                    {/* OpenAI Key */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-ui">
                        <span className="font-medium text-[var(--text-main)]">OpenAI API Key</span>
                        {testResult['openai'] && (
                          <span
                            className={`text-[11px] ${
                              testResult['openai'].valid ? 'text-[var(--color-verdigris)]' : 'text-red-400'
                            }`}
                          >
                            {testResult['openai'].valid ? '✓ Verified' : '✕ Verification Failed'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showKey['openai'] ? 'text' : 'password'}
                            value={customKeys.openai || ''}
                            onChange={(e) => handleUpdateCustomKey('openai', e.target.value)}
                            placeholder="sk-proj-..."
                            className="w-full py-2 px-3 pr-9 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] text-xs text-[var(--text-main)] font-data focus:outline-hidden focus:border-[var(--color-verdigris)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey((p) => ({ ...p, openai: !p.openai }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                          >
                            {showKey['openai'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={testingKey === 'openai' || !customKeys.openai}
                          onClick={() => handleTestKey('openai')}
                          className="py-2 px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] hover:border-[var(--color-verdigris)] text-xs font-ui font-medium text-[var(--text-main)] flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
                        >
                          {testingKey === 'openai' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>Test</span>
                        </button>
                      </div>
                    </div>

                    {/* Anthropic Key */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-ui">
                        <span className="font-medium text-[var(--text-main)]">Anthropic API Key</span>
                        {testResult['anthropic'] && (
                          <span
                            className={`text-[11px] ${
                              testResult['anthropic'].valid ? 'text-[var(--color-verdigris)]' : 'text-red-400'
                            }`}
                          >
                            {testResult['anthropic'].valid ? '✓ Verified' : '✕ Verification Failed'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showKey['anthropic'] ? 'text' : 'password'}
                            value={customKeys.anthropic || ''}
                            onChange={(e) => handleUpdateCustomKey('anthropic', e.target.value)}
                            placeholder="sk-ant-..."
                            className="w-full py-2 px-3 pr-9 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] text-xs text-[var(--text-main)] font-data focus:outline-hidden focus:border-[var(--color-verdigris)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey((p) => ({ ...p, anthropic: !p.anthropic }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                          >
                            {showKey['anthropic'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={testingKey === 'anthropic' || !customKeys.anthropic}
                          onClick={() => handleTestKey('anthropic')}
                          className="py-2 px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] hover:border-[var(--color-verdigris)] text-xs font-ui font-medium text-[var(--text-main)] flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
                        >
                          {testingKey === 'anthropic' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>Test</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Default Reasoning Effort Level */}
                <div className="space-y-2">
                  <label className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                    Default Reasoning Effort
                  </label>
                  <div className="grid grid-cols-3 gap-2 font-ui">
                    {(['quick', 'standard', 'thorough'] as EffortLevel[]).map((eff) => (
                      <button
                        key={eff}
                        type="button"
                        onClick={() => handleUpdateEffort(eff)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize cursor-pointer transition-all ${
                          defaultEffort === eff
                            ? 'bg-[var(--color-verdigris-subtle)] border-[var(--color-verdigris)] text-[var(--color-verdigris)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        {eff} Pass
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────── */}
            {/* TAB 2: Calibration & Decision Defaults */}
            {/* ────────────────────────────────────────────── */}
            {activeTab === 'calibration' && (
              <div className="space-y-6 animate-in fade-in duration-150 text-xs sm:text-sm">
                <div>
                  <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                    Calibration & Decision Science Defaults
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-ui">
                    Preset your preferred analytical lenses, risk parameters, and cognitive bias sensitivity thresholds.
                  </p>
                </div>

                {/* Focus Mode Preset */}
                <div className="space-y-2">
                  <label className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                    Default Analytical Focus Lens
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'all', label: 'Comprehensive All-Layers', desc: 'Balanced 4-layer deliberation' },
                      { id: 'psychology', label: 'Psychology (Cognitive Biases)', desc: 'Scan 15 behavioral heuristic traps' },
                      { id: 'logic', label: 'Logic (Assumption Stress-Test)', desc: 'Dialectical falsification and sensitivity' },
                      { id: 'practical', label: 'Practical (Payoffs & Numbers)', desc: 'Expected utility, minimax regret & VoI' },
                      { id: 'philosophy', label: 'Philosophy (Multi-Framework)', desc: 'Stoic, Utilitarian, Kantian, Virtue Ethics' }
                    ].map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleUpdateFocus(f.id as FocusMode)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          defaultFocus === f.id
                            ? 'bg-[var(--color-ochre-subtle)] border-[var(--color-ochre)] text-[var(--text-main)] shadow-xs'
                            : 'bg-[var(--bg-surface-raised)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
                        }`}
                      >
                        <div className="font-semibold text-xs text-[var(--text-main)] flex items-center justify-between">
                          <span>{f.label}</span>
                          {defaultFocus === f.id && <Check className="w-3.5 h-3.5 text-[var(--color-ochre)]" />}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-ui mt-1">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Tolerance Baseline */}
                <div className="space-y-2">
                  <label className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                    Default Risk Tolerance Posture
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'risk_neutral', label: 'Risk-Neutral', sub: 'Linear E[U]' },
                      { id: 'risk_averse', label: 'Risk-Averse', sub: 'Concave utility' },
                      { id: 'risk_seeking', label: 'Risk-Seeking', sub: 'Convex upside' }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleUpdateRiskTolerance(r.id as any)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          defaultRiskTolerance === r.id
                            ? 'bg-[var(--color-verdigris-subtle)] border-[var(--color-verdigris)] text-[var(--text-main)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <div className="font-semibold text-xs">{r.label}</div>
                        <div className="text-[10px] text-[var(--text-faint)] font-ui">{r.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bias Sensitivity */}
                <div className="space-y-2">
                  <label className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                    Cognitive Bias Detection Threshold
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateBiasSensitivity('standard')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        biasSensitivity === 'standard'
                          ? 'bg-[var(--color-verdigris-subtle)] border-[var(--color-verdigris)] text-[var(--text-main)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <div className="font-semibold text-xs">Standard (Tier 1 Explicit)</div>
                      <div className="text-[11px] text-[var(--text-muted)] font-ui mt-0.5">
                        Surfaces biases with direct mathematical or stated triggers.
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBiasSensitivity('high')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        biasSensitivity === 'high'
                          ? 'bg-[var(--color-verdigris-subtle)] border-[var(--color-verdigris)] text-[var(--text-main)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <div className="font-semibold text-xs">High Sensitivity (Deep Nuance)</div>
                      <div className="text-[11px] text-[var(--text-muted)] font-ui mt-0.5">
                        Surfaces subtle narrative nuances and hidden implicit framing.
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────── */}
            {/* TAB 3: Data, Memory & Sovereignty */}
            {/* ────────────────────────────────────────────── */}
            {activeTab === 'data' && (
              <div className="space-y-6 animate-in fade-in duration-150 text-xs sm:text-sm">
                <div>
                  <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                    Local Data & Sovereign Storage
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-ui">
                    Manage your local SQLite database (`~/.phronesis/phronesis.db`), telemetry counters, backups, and data wiping.
                  </p>
                </div>

                {/* Local Memory Opt-In Toggle */}
                <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5 font-ui font-semibold text-[var(--text-main)]">
                        <Database className="w-4 h-4 text-[var(--color-verdigris)]" />
                        <span>Local Decision Memory</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] font-body leading-relaxed">
                        Saves structured decision summaries and mathematical profiles to local SQLite. Used for cross-decision longitudinal blind-spot detection (gated behind 5+ decisions).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleMemory}
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

                {/* Live Storage Telemetry Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Local Storage Telemetry</span>
                    </h4>
                    <button
                      type="button"
                      onClick={loadStorageStats}
                      disabled={loadingStats}
                      className="text-[11px] text-[var(--color-verdigris)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingStats ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)]">
                      <div className="text-[11px] text-[var(--text-muted)] font-ui">Decisions Logged</div>
                      <div className="text-xl font-bold font-data text-[var(--text-main)] mt-1">
                        {stats ? stats.decision_count : '—'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)]">
                      <div className="text-[11px] text-[var(--text-muted)] font-ui">Active Projects</div>
                      <div className="text-xl font-bold font-data text-[var(--text-main)] mt-1">
                        {stats ? stats.project_count : '—'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)]">
                      <div className="text-[11px] text-[var(--text-muted)] font-ui">Outcomes Rated</div>
                      <div className="text-xl font-bold font-data text-[var(--text-main)] mt-1">
                        {stats ? stats.outcome_count : '—'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)]">
                      <div className="text-[11px] text-[var(--text-muted)] font-ui">Database Size</div>
                      <div className="text-xl font-bold font-data text-[var(--color-verdigris)] mt-1">
                        {stats ? `${Math.round(stats.db_size_bytes / 1024)} KB` : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Format Export & Import */}
                <div className="space-y-3">
                  <h4 className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">
                    Sovereign Backup & Migration
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="py-2.5 px-3 rounded-xl bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border-medium)] text-[var(--text-main)] font-ui font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[var(--color-verdigris)]" />
                      <span>Export JSON Backup</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="py-2.5 px-3 rounded-xl bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border-medium)] text-[var(--text-main)] font-ui font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[var(--color-ochre)]" />
                      <span>Export CSV Table</span>
                    </button>

                    <button
                      type="button"
                      disabled={importing}
                      onClick={handleTriggerFileInput}
                      className="py-2.5 px-3 rounded-xl bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border-medium)] text-[var(--text-main)] font-ui font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[var(--color-verdigris)]" />
                      <span>{importing ? 'Importing...' : 'Restore from JSON'}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Irreversible Data Purge */}
                <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-ui font-semibold text-xs text-red-500 uppercase tracking-wider">
                        Danger Zone
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] font-ui">
                        Irreversibly wipe all decision histories, outcomes, projects, and feedback from local disk.
                      </p>
                    </div>
                    {!showPurgeConfirm && (
                      <button
                        type="button"
                        onClick={() => setShowPurgeConfirm(true)}
                        className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-ui font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Wipe All Local Data</span>
                      </button>
                    )}
                  </div>

                  {showPurgeConfirm && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
                      <div className="flex items-center space-x-2 text-red-500 font-semibold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Are you absolutely certain? This action cannot be undone.</span>
                      </div>
                      <p className="text-xs text-[var(--text-main)]">
                        All past decision matrices, counterarguments, and local calibration histories in SQLite will be permanently deleted.
                      </p>
                      <div className="flex items-center space-x-2.5">
                        <button
                          type="button"
                          onClick={handlePurge}
                          className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white font-ui font-semibold text-xs hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          Yes, Permanently Wipe Everything
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPurgeConfirm(false)}
                          className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] font-ui text-xs hover:text-[var(--text-main)] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────── */}
            {/* TAB 4: Appearance & UI Settings */}
            {/* ────────────────────────────────────────────── */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in duration-150 text-xs sm:text-sm">
                <div>
                  <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                    Appearance & Accessibility
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-ui">
                    Tailor color palettes, reading typography scaling, and interface animation density.
                  </p>
                </div>

                {/* Theme Mode Cards */}
                <div className="space-y-2">
                  <label className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isDarkMode) onToggleTheme();
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        isDarkMode
                          ? 'bg-[var(--color-verdigris-subtle)] border-[var(--color-verdigris)] text-[var(--text-main)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-black/40 text-[var(--color-verdigris)]">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs">Dark (Obsidian Stone)</div>
                          <div className="text-[11px] text-[var(--text-muted)] font-ui">High focus, low glare</div>
                        </div>
                      </div>
                      {isDarkMode && <Check className="w-4 h-4 text-[var(--color-verdigris)]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isDarkMode) onToggleTheme();
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        !isDarkMode
                          ? 'bg-[var(--color-verdigris-subtle)] border-[var(--color-verdigris)] text-[var(--text-main)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs">Light (Clean Parchment)</div>
                          <div className="text-[11px] text-[var(--text-muted)] font-ui">Crisp paper contrast</div>
                        </div>
                      </div>
                      {!isDarkMode && <Check className="w-4 h-4 text-[var(--color-verdigris)]" />}
                    </button>
                  </div>
                </div>

                {/* Typography Reading Scale */}
                <div className="space-y-2">
                  <label className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                    Typography Scale & Reading Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'compact', label: 'Compact', size: '13.5px', desc: 'Dense data views' },
                      { id: 'standard', label: 'Standard', size: '14.5px', desc: 'Balanced default' },
                      { id: 'relaxed', label: 'Relaxed', size: '16.0px', desc: 'Comfortable reading' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleUpdateFontSize(t.id as FontSizeOption)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          fontSize === t.id
                            ? 'bg-[var(--color-verdigris-subtle)] border-[var(--color-verdigris)] text-[var(--text-main)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs">{t.label}</span>
                          <span className="text-[10px] font-data text-[var(--text-faint)]">{t.size}</span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-ui mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessibility Toggles */}
                <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-[var(--text-main)] font-ui">
                        Reduced Motion & Instant Rendering
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-ui">
                        Disables animated transitions for faster execution and motion sensitivity.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleReduceMotion}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        reduceMotion ? 'bg-[var(--color-verdigris)]' : 'bg-[var(--color-slate)]/40'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          reduceMotion ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                    <div>
                      <div className="font-semibold text-xs text-[var(--text-main)] font-ui">
                        Decision Theory Glossary Tooltips
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-ui">
                        Show hover cards explaining Minimax Regret, Value of Information, Sunk Cost, etc.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleGlossaryTooltips}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        showGlossaryTooltips ? 'bg-[var(--color-verdigris)]' : 'bg-[var(--color-slate)]/40'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          showGlossaryTooltips ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────── */}
            {/* TAB 5: Keyboard Shortcuts */}
            {/* ────────────────────────────────────────────── */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4 animate-in fade-in duration-150 text-xs sm:text-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                      Keyboard Shortcuts Cheatsheet
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-ui">
                      Accelerate your deliberation workflow with fast keyboard commands.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={shortcutSearch}
                    onChange={(e) => setShortcutSearch(e.target.value)}
                    placeholder="Search shortcuts..."
                    className="py-1.5 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-medium)] text-xs text-[var(--text-main)] font-ui w-40 sm:w-48 focus:outline-hidden focus:border-[var(--color-verdigris)]"
                  />
                </div>

                <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                  <table className="w-full text-left font-ui">
                    <thead className="bg-[var(--bg-app)] border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Shortcut</th>
                        <th className="py-2.5 px-4">Action</th>
                        <th className="py-2.5 px-4">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                      {filteredShortcuts.map((s, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-surface-raised)] transition-colors">
                          <td className="py-2.5 px-4 font-data text-[var(--color-verdigris)] font-semibold">
                            <span className="py-1 px-2 rounded-md bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/20">
                              {s.key}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[var(--text-main)] font-medium">{s.description}</td>
                          <td className="py-2.5 px-4 text-[var(--text-muted)]">{s.category}</td>
                        </tr>
                      ))}
                      {filteredShortcuts.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-xs text-[var(--text-muted)]">
                            No shortcuts matching "{shortcutSearch}".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────── */}
            {/* TAB 6: Diagnostics & System Status */}
            {/* ────────────────────────────────────────────── */}
            {activeTab === 'diagnostics' && (
              <div className="space-y-6 animate-in fade-in duration-150 text-xs sm:text-sm">
                <div>
                  <h3 className="font-display font-semibold text-base text-[var(--text-main)]">
                    System Invariants & Diagnostics
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-ui">
                    Verify architectural boundaries, deterministic solvers, and open-source licensing.
                  </p>
                </div>

                {/* 3 Core System Invariants */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                        <span>Deterministic Math Solver</span>
                        <span className="text-[10px] py-0.5 px-1.5 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-ui">
                          Active & Verified
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] font-body leading-relaxed">
                        Expected Utility, Minimax Regret, and Inflection Threshold formulas are computed purely via closed-form Python algebra. LLMs perform zero numeric math.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                        <span>Two-Stage Boundary Guardrail</span>
                        <span className="text-[10px] py-0.5 px-1.5 rounded-full bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] font-ui">
                          Strictly Enforced
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] font-body leading-relaxed">
                        Every synthesized report passes programmatic pattern matching and LLM boundary audits. Prescriptive directives ("You must choose X") are strictly rewritten or blocked.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] shrink-0">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                        <span>Zero Cloud Databases / Zero Telemetry</span>
                        <span className="text-[10px] py-0.5 px-1.5 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] font-ui">
                          100% Sovereign
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] font-body leading-relaxed">
                        Zero telemetry trackers, zero user behavior logging, and zero cloud DB sync. All state resides on your local machine.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Links & Quick Actions */}
                <div className="space-y-2">
                  <h4 className="font-ui font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                    Documentation & Lineage
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-ui">
                    {onOpenMethodology && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenMethodology();
                        }}
                        className="p-2.5 rounded-xl bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-medium flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
                        <span>Methodology</span>
                      </button>
                    )}

                    {onOpenLegal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLegal('faq');
                        }}
                        className="p-2.5 rounded-xl bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-medium flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[var(--color-ochre)]" />
                        <span>FAQ & Architecture</span>
                      </button>
                    )}

                    {onOpenLegal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLegal('credits');
                        }}
                        className="p-2.5 rounded-xl bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-medium flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>MIT License</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]/60 flex items-center justify-between text-xs font-ui text-[var(--text-faint)]">
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-[var(--color-verdigris)] shrink-0" />
            <span>Phronesis v2.0 • Aristotelian Practical Wisdom Engine</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[var(--color-verdigris)] text-white font-medium hover:bg-[var(--color-verdigris-hover)] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
