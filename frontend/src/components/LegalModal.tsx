import React, { useState } from 'react';
import {
  Scale,
  Shield,
  HelpCircle,
  Code2,
  X,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  Lock,
  Cpu,
  Database,
  Terminal,
  FileText
} from 'lucide-react';

export type LegalModalTab = 'faq' | 'credits' | 'terms' | 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalModalTab;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  badge?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'Core Concepts',
    badge: 'Architecture',
    question: 'What is Phronesis (φρόνησις)?',
    answer:
      'Phronesis is named after the classical Aristotelian concept of practical wisdom. Unlike generic conversational AI or generative oracles that recommend courses of action blindly, Phronesis is a structured decision auditing engine. It decomposes complex dilemmas into expected utility models, tests them against 15 cognitive bias detectors, balances philosophical lenses (Utilitarian, Kantian, Stoic, Virtue Ethics), and computes Value of Information (VoI) to tell you what crucial variable to test before deciding.'
  },
  {
    category: 'Privacy & Sovereignty',
    badge: 'Data Sovereignty',
    question: 'How is my data stored and protected?',
    answer:
      'Phronesis operates under a sovereign, local-first architecture. There is zero centralized database storage, zero cross-user analytics, and zero tracking telemetry. All historical sessions and past decisions are stored strictly on your local machine in SQLite (`~/.phronesis/phronesis.db`) and your browser\'s local storage. You retain complete ownership and can export or wipe your data with one click.'
  },
  {
    category: 'Methodology',
    badge: 'Dual-Process',
    question: 'How does the Tripartite Engine analyze decisions?',
    answer:
      'Phronesis implements Keith Stanovich\'s Tripartite Model of Mind. System 1 handles intuitive appraisal, System 2 executes deterministic closed-form mathematical optimization (Expected Utility and Savage Minimax Regret), and System 3 acts as a metacognitive audit layer to detect heuristic traps, motivated reasoning, and probability distortion.'
  },
  {
    category: 'Methodology',
    badge: 'VoI Calculus',
    question: 'What is Value of Information (VoI) and the 48-Hour Experiment?',
    answer:
      'Value of Information (VoI) measures whether collecting additional evidence before deciding will change the optimal decision path. If uncertainty is high and the expected payoff swing exceeds the cost of delay, Phronesis formulates a concrete, low-risk 48-Hour Falsification Experiment targeting the single most sensitive variable.'
  },
  {
    category: 'Benchmarking',
    badge: 'Dilemmas',
    question: 'What are Canonical Dilemmas?',
    answer:
      'Canonical Dilemmas are curated, high-stakes scenario benchmarks spanning institutional governance, technical architecture trade-offs, bioethics, and crisis management (e.g., The Autonomous Triage Protocol, Sovereign Database Migration, Whistleblower Dilemma). They serve as gold-standard testbeds for auditing structured reasoning.'
  },
  {
    category: 'Controls & Ergonomics',
    badge: 'Workflows',
    question: 'What global keyboard shortcuts are supported?',
    answer:
      'You can navigate Phronesis rapidly with keyboard shortcuts:\n• ⌘K (Ctrl+K): Global Spotlight Command Palette\n• ⌘N (Ctrl+N): Start a New Decision Session\n• ⌘J (Ctrl+J): Toggle Socratic Dialogue Drawer\n• ⌘B (Ctrl+B): Toggle Sidebar collapse\n• Escape: Close modals and drawers.'
  },
  {
    category: 'Data Management',
    badge: 'Export',
    question: 'How do I export, backup, or purge my decision records?',
    answer:
      'You can export individual audit reports in formatted Markdown or JSON from the Report View header, download complete session backups as JSON from the Sovereign Storage badge in the sidebar footer, or wipe all local records permanently via the Settings & Privacy modal.'
  }
];

interface DependencyCredit {
  name: string;
  version: string;
  license: string;
  description: string;
  category: 'Frontend' | 'Backend' | 'Theoretical & Academic';
  url?: string;
}

const OPEN_SOURCE_CREDITS: DependencyCredit[] = [
  // Frontend
  {
    name: 'React 19 & React DOM',
    version: '^19.2.8',
    license: 'MIT',
    description: 'Component-based UI foundation with modern concurrent rendering and hooks',
    category: 'Frontend',
    url: 'https://react.dev'
  },
  {
    name: 'Vite',
    version: '^8.2.0',
    license: 'MIT',
    description: 'Next-generation frontend tooling and ultra-fast ES module bundler',
    category: 'Frontend',
    url: 'https://vitejs.dev'
  },
  {
    name: 'TailwindCSS v4',
    version: '^4.3.3',
    license: 'MIT',
    description: 'Utility-first CSS framework powered by modern CSS theme tokens',
    category: 'Frontend',
    url: 'https://tailwindcss.com'
  },
  {
    name: 'Lucide React',
    version: '^1.31.0',
    license: 'ISC',
    description: 'Crisp, harmonious open-source SVG icon library',
    category: 'Frontend',
    url: 'https://lucide.dev'
  },
  {
    name: 'Recharts',
    version: '^3.10.1',
    license: 'MIT',
    description: 'Declarative charting library built on React components and SVG',
    category: 'Frontend',
    url: 'https://recharts.org'
  },
  {
    name: 'clsx & tailwind-merge',
    version: '^2.1.1 / ^3.6.0',
    license: 'MIT',
    description: 'Dynamic class construction and collision-safe Tailwind class merging',
    category: 'Frontend',
    url: 'https://github.com/lukeed/clsx'
  },

  // Backend
  {
    name: 'FastAPI',
    version: '>=0.110.0',
    license: 'MIT',
    description: 'High-performance asynchronous Python web framework for REST APIs',
    category: 'Backend',
    url: 'https://fastapi.tiangolo.com'
  },
  {
    name: 'Uvicorn',
    version: '>=0.28.0',
    license: 'BSD-3-Clause',
    description: 'Lightning-fast ASGI server implementation for Python',
    category: 'Backend',
    url: 'https://www.uvicorn.org'
  },
  {
    name: 'Pydantic & Pydantic-Settings',
    version: '>=2.6.0',
    license: 'MIT',
    description: 'Data validation and settings management using Python type hints',
    category: 'Backend',
    url: 'https://docs.pydantic.dev'
  },
  {
    name: 'NumPy',
    version: '>=1.26.0',
    license: 'BSD-3-Clause',
    description: 'Fundamental package for scientific computing and closed-form algebra',
    category: 'Backend',
    url: 'https://numpy.org'
  },
  {
    name: 'HTTPX',
    version: '>=0.27.0',
    license: 'BSD-3-Clause',
    description: 'Fully featured HTTP client for Python 3 with async support',
    category: 'Backend',
    url: 'https://www.python-httpx.org'
  },
  {
    name: 'Google GenAI / Anthropic / OpenAI SDKs',
    version: 'Latest',
    license: 'Apache-2.0 / MIT',
    description: 'Multi-provider LLM API client interfaces for extraction and Socratic dialogue',
    category: 'Backend',
    url: 'https://github.com/google-gemini/generative-ai-python'
  },

  // Academic Lineage
  {
    name: 'Aristotle — Nicomachean Ethics',
    version: 'Classic (Book VI)',
    license: 'Public Domain',
    description: 'Conceptual origin of φρόνησις (phronesis): practical wisdom bridging virtue and action',
    category: 'Theoretical & Academic'
  },
  {
    name: 'Daniel Kahneman & Amos Tversky',
    version: '1979 / 2011',
    license: 'Academic Literature',
    description: 'Prospect Theory, Heuristics and Biases, Availability Cascades, and Loss Aversion foundations',
    category: 'Theoretical & Academic'
  },
  {
    name: 'Keith E. Stanovich',
    version: '2009 / 2011',
    license: 'Academic Literature',
    description: 'Tripartite Model of Mind: System 1 (Autonomous), System 2 (Algorithmic), System 3 (Reflective)',
    category: 'Theoretical & Academic'
  },
  {
    name: 'Howard Raiffa & Ronald A. Howard',
    version: '1968 / 1983',
    license: 'Academic Literature',
    description: 'Decision Analysis and Value of Information (VoI) Expected Value of Perfect Information (EVPI)',
    category: 'Theoretical & Academic'
  }
];

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'faq'
}) => {
  const [activeTab, setActiveTab] = useState<LegalModalTab>(initialTab);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [creditsFilter, setCreditsFilter] = useState<'All' | 'Frontend' | 'Backend' | 'Theoretical & Academic'>('All');

  // Sync tab if initialTab changes when opening
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const toggleFaq = (idx: number) => {
    setExpandedFaqIndex((prev) => (prev === idx ? null : idx));
  };

  const filteredFaqs = FAQ_DATA.filter(
    (item) =>
      item.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(faqSearchQuery.toLowerCase())
  );

  const filteredCredits = OPEN_SOURCE_CREDITS.filter((item) =>
    creditsFilter === 'All' ? true : item.category === creditsFilter
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 pt-5 pb-3 border-b border-[var(--border-subtle)] flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] text-xs font-ui font-medium">
              <Scale className="w-3.5 h-3.5" />
              <span>Governance, Compliance & Transparency</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text-main)]">
              Legal, Help & Governance
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] shrink-0 flex items-center space-x-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-3.5 py-2.5 text-xs font-ui font-medium flex items-center space-x-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'faq'
                ? 'border-[var(--color-verdigris)] text-[var(--color-verdigris)] font-semibold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help & FAQ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credits')}
            className={`px-3.5 py-2.5 text-xs font-ui font-medium flex items-center space-x-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'credits'
                ? 'border-[var(--color-verdigris)] text-[var(--color-verdigris)] font-semibold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Open Source Credits</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-2.5 text-xs font-ui font-medium flex items-center space-x-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'terms'
                ? 'border-[var(--color-verdigris)] text-[var(--color-verdigris)] font-semibold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2.5 text-xs font-ui font-medium flex items-center space-x-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'privacy'
                ? 'border-[var(--color-verdigris)] text-[var(--color-verdigris)] font-semibold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Main Content Area (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs font-ui leading-relaxed">
          {/* ════════════════════════════════════════════════════════════════
              TAB 1: HELP & FAQ
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <p className="text-[var(--text-muted)] text-xs font-body">
                  Everything you need to know about Phronesis’s decision calculus, privacy architecture, and navigation.
                </p>
                <div className="w-full sm:w-56">
                  <input
                    type="text"
                    placeholder="Search FAQ..."
                    value={faqSearchQuery}
                    onChange={(e) => setFaqSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-hidden focus:border-[var(--color-verdigris)] font-ui transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredFaqs.length === 0 ? (
                  <div className="p-6 text-center text-[var(--text-muted)] bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)]">
                    No matching FAQ items found for "{faqSearchQuery}".
                  </div>
                ) : (
                  filteredFaqs.map((faq, idx) => {
                    const isExpanded = expandedFaqIndex === idx;
                    return (
                      <div
                        key={faq.question}
                        className={`rounded-xl border transition-all ${
                          isExpanded
                            ? 'bg-[var(--bg-surface-raised)] border-[var(--border-medium)] shadow-xs'
                            : 'bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(idx)}
                          className="w-full px-4 py-3 text-left flex items-center justify-between space-x-3 cursor-pointer group"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {faq.badge && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] shrink-0">
                                {faq.badge}
                              </span>
                            )}
                            <span className="font-medium text-xs sm:text-sm text-[var(--text-main)] group-hover:text-[var(--color-verdigris)] transition-colors">
                              {faq.question}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-[var(--color-verdigris)]' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3.5 pt-1 border-t border-[var(--border-subtle)]/50 text-[var(--text-muted)] font-body text-xs leading-relaxed whitespace-pre-line animate-fade-in">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 2: OPEN SOURCE CREDITS
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'credits' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-1">
                <p className="text-[var(--text-muted)] text-xs font-body">
                  Phronesis is built on the shoulders of giants — from open-source software to Nobel-laureate decision science.
                </p>
                <div className="flex items-center space-x-1 bg-[var(--bg-app)] p-1 rounded-xl border border-[var(--border-subtle)] shrink-0">
                  {(['All', 'Frontend', 'Backend', 'Theoretical & Academic'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCreditsFilter(cat)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-ui transition-colors cursor-pointer ${
                        creditsFilter === cat
                          ? 'bg-[var(--bg-surface-raised)] text-[var(--text-main)] font-semibold shadow-2xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCredits.map((dep) => (
                  <div
                    key={dep.name}
                    className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-ui font-semibold text-xs text-[var(--text-main)] group-hover:text-[var(--color-verdigris)] transition-colors">
                          {dep.name}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[var(--color-verdigris)] shrink-0">
                          {dep.license}
                        </span>
                      </div>
                      <p className="text-[11px] font-body text-[var(--text-muted)] leading-relaxed">
                        {dep.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]/60 text-[10px] font-mono text-[var(--text-faint)]">
                      <span>{dep.version}</span>
                      {dep.url && (
                        <a
                          href={dep.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-[var(--color-verdigris)] hover:underline"
                        >
                          <span>Docs</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 3: TERMS OF SERVICE
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'terms' && (
            <div className="space-y-4 font-body text-xs text-[var(--text-muted)] leading-relaxed">
              <div className="p-4 rounded-xl bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 space-y-1.5 font-ui">
                <div className="flex items-center space-x-2 text-[var(--color-verdigris)] font-semibold text-sm">
                  <Scale className="w-4 h-4 shrink-0" />
                  <span>PolyForm Noncommercial License 1.0.0</span>
                </div>
                <p className="text-xs text-[var(--text-main)] leading-relaxed">
                  Copyright © 2026 Saba Saiid (<a href="https://github.com/SabaSaiid/Phronesis" target="_blank" rel="noreferrer" className="underline font-mono">github.com/SabaSaiid/Phronesis</a>).
                </p>
              </div>

              <div className="space-y-3 font-body">
                <section className="space-y-1.5">
                  <h4 className="font-ui font-semibold text-xs text-[var(--text-main)] uppercase tracking-wider">
                    1. Permitted Noncommercial Use
                  </h4>
                  <p>
                    The Licensor grants you a copyright and patent license for personal use, research, scientific experiment, public knowledge benefit, testing, amateur pursuits, and educational institution projects without any anticipated commercial application.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-ui font-semibold text-xs text-[var(--text-main)] uppercase tracking-wider">
                    2. Commercial Restrictions & New Works
                  </h4>
                  <p>
                    You may not use or distribute this software for revenue generation, commercial enterprise operations, closed-source proprietary re-distribution, or monetized SaaS without explicit licensing from the author. Changes and new works must preserve copyright notices.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-ui font-semibold text-xs text-[var(--text-main)] uppercase tracking-wider">
                    3. No Advisory or Professional Liability
                  </h4>
                  <p>
                    Phronesis is an epistemic reasoning and cognitive auditing tool, not a certified financial advisor, licensed attorney, or clinical medical diagnostic system. All calculations (Expected Utility, Minimax Regret, VoI) are informational models. As far as the law allows, the software comes "AS IS", without warranty of any kind.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-ui font-semibold text-xs text-[var(--text-main)] uppercase tracking-wider">
                    4. Patent Defense & Violations
                  </h4>
                  <p>
                    If you make any claim that the software infringes a patent, your license terminates immediately. First-time unintentional violations must be rectified within 32 days of receiving notice.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 4: PRIVACY POLICY
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 font-body text-xs text-[var(--text-muted)] leading-relaxed">
              <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center space-x-2 text-[var(--color-verdigris)] font-ui font-semibold text-sm">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Sovereign Local-First Privacy Pledge</span>
                </div>
                <p className="text-xs text-[var(--text-main)] leading-relaxed">
                  We believe personal dilemmas, business strategies, and private thoughts should never be harvested, monetized, or pooled into remote cloud databases.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-ui">
                <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center space-x-2 font-semibold text-xs text-[var(--text-main)]">
                    <Database className="w-4 h-4 text-[var(--color-verdigris)] shrink-0" />
                    <span>100% Local Storage</span>
                  </div>
                  <p className="text-[11px] font-body text-[var(--text-muted)] leading-relaxed">
                    Decision records reside in local SQLite (`~/.phronesis/phronesis.db`) and browser `localStorage`. No cloud data warehouses exist.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center space-x-2 font-semibold text-xs text-[var(--text-main)]">
                    <Cpu className="w-4 h-4 text-[var(--color-verdigris)] shrink-0" />
                    <span>Ephemeral LLM Payload</span>
                  </div>
                  <p className="text-[11px] font-body text-[var(--text-muted)] leading-relaxed">
                    When narrative extraction or Socratic chat is invoked, prompts are dispatched statelessly to your configured LLM API provider without persistence.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center space-x-2 font-semibold text-xs text-[var(--text-main)]">
                    <Shield className="w-4 h-4 text-[var(--color-verdigris)] shrink-0" />
                    <span>Zero Analytics / Trackers</span>
                  </div>
                  <p className="text-[11px] font-body text-[var(--text-muted)] leading-relaxed">
                    No third-party trackers, no behavioral pixel cookies, no Google Analytics, and no telemetry pings.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center space-x-2 font-semibold text-xs text-[var(--text-main)]">
                    <Terminal className="w-4 h-4 text-[var(--color-verdigris)] shrink-0" />
                    <span>Full Data Sovereignty</span>
                  </div>
                  <p className="text-[11px] font-body text-[var(--text-muted)] leading-relaxed">
                    Export your full history as JSON anytime. Permanently purge and wipe your local database instantly with a single button.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-faint)] flex items-center justify-between">
                <span>Database Path: ~/.phronesis/phronesis.db</span>
                <span className="text-[var(--color-verdigris)]">Sovereign & Isolated</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-app)] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-[11px] text-[var(--text-faint)] font-ui">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-verdigris)]" />
            <span>Phronesis Governance · PolyForm Noncommercial 1.0.0</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl btn-verdigris font-ui font-medium text-xs cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
