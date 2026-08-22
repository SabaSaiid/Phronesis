import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronDown, Check, Lock, Cpu, Brain, Zap } from 'lucide-react';
import type { LLMModelOption, LLMConfigOverride } from '../types';
import { fetchModels } from '../lib/api';

interface ModelSelectorProps {
  value: LLMConfigOverride;
  onChange: (override: LLMConfigOverride) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<LLMModelOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        const data = await fetchModels();
        if (isMounted && data.models) {
          setModels(data.models);
        }
      } catch (err) {
        console.warn('Could not fetch models catalog:', err);
      }
    };
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find currently active model option
  const activeModel = models.find(
    (m) =>
      (value.provider ? m.provider === value.provider : m.is_default) &&
      (value.model ? m.model === value.model : true)
  ) || models.find((m) => m.is_default) || models[0];

  const handleSelectModel = (option: LLMModelOption) => {
    if (!option.has_key && option.provider !== 'mock') return;
    onChange({
      provider: option.provider,
      model: option.model,
    });
    try {
      localStorage.setItem(
        'phronesis_preferred_model',
        JSON.stringify({ provider: option.provider, model: option.model })
      );
    } catch {
      /* noop */
    }
    setIsOpen(false);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return <Sparkles className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />;
      case 'openai':
        return <Brain className="w-3.5 h-3.5 text-[var(--color-ochre)]" />;
      case 'anthropic':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'mock':
      default:
        return <Cpu className="w-3.5 h-3.5 text-[var(--color-slate)]" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Pill Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-ui transition-all border cursor-pointer ${
          isOpen
            ? 'bg-[var(--bg-surface-raised)] border-[var(--color-verdigris)] shadow-xs ring-1 ring-[var(--color-verdigris)]/30 text-[var(--text-main)]'
            : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border-[var(--border-subtle)] hover:border-[var(--border-medium)] text-[var(--text-main)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Select AI Model & Extraction Engine"
        aria-expanded={isOpen}
      >
        {activeModel ? getProviderIcon(activeModel.provider) : <Sparkles className="w-3.5 h-3.5" />}
        <span className="font-medium truncate max-w-[130px]">
          {activeModel ? activeModel.label : 'Model'}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[var(--text-faint)] transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1.5 sm:bottom-auto sm:top-full sm:mt-1.5 z-50 w-72 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-medium)] shadow-[var(--shadow-elevated)] p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 border-b border-[var(--border-subtle)]">
            <div className="text-[11px] font-ui font-semibold text-[var(--text-main)]">
              Model & Reasoning Engine
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-body leading-tight">
              Deterministic calculations always run identically in Python.
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 py-1 sidebar-scrollbar">
            {models.map((opt) => {
              const isSelected =
                (value.provider === opt.provider && value.model === opt.model) ||
                (!value.provider && opt.is_default);
              const isLocked = !opt.has_key && opt.provider !== 'mock';

              return (
                <button
                  key={`${opt.provider}-${opt.model}`}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleSelectModel(opt)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-start justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30'
                      : isLocked
                      ? 'opacity-40 hover:bg-transparent cursor-not-allowed'
                      : 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-start space-x-2 min-w-0 pr-2">
                    <div className="mt-0.5 shrink-0">{getProviderIcon(opt.provider)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-ui font-medium leading-tight truncate">
                          {opt.label}
                        </span>
                        {opt.is_default && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-app)] text-[var(--text-faint)] border border-[var(--border-subtle)]">
                            Default
                          </span>
                        )}
                      </div>
                      {opt.description && (
                        <p className="text-[10px] text-[var(--text-muted)] font-body truncate mt-0.5">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-[var(--color-verdigris)] stroke-[2.5]" />
                    ) : isLocked ? (
                      <span title="API key not configured in backend">
                        <Lock className="w-3 h-3 text-[var(--text-faint)]" />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-[var(--border-subtle)] px-2 py-1 flex items-center justify-between text-[10px] text-[var(--text-faint)] font-mono">
            <span>Keys configured in backend (.env)</span>
          </div>
        </div>
      )}
    </div>
  );
};
