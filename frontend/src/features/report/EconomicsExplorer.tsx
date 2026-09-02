import React, { useState, useMemo, useCallback } from 'react';
import type { EconomicsLayerResult, StructuredDecision } from '../../types';
import { calculateClientEVPI, calculateClientCPT, calculateClientDiscounting } from '../../lib/decisionMath';
import { DollarSign, ShieldAlert, ArrowRight } from 'lucide-react';

interface EconomicsExplorerProps {
  economics: EconomicsLayerResult;
  decision: StructuredDecision;
  onDrillDown?: (item: { item_type: string; item_id: string; item_title: string; item_context?: Record<string, any> }) => void;
}

export const EconomicsExplorer: React.FC<EconomicsExplorerProps> = ({
  economics,
  decision,
  onDrillDown,
}) => {
  // Interactive Slider States
  const [lambda, setLambda] = useState<number>(economics.prospect_theory.lambda_used || 2.25);
  const [referencePoint, setReferencePoint] = useState<number>(50);
  const [horizonYears, setHorizonYears] = useState<number>(economics.discounting.time_horizon_years || 2);
  const [presentBiasBeta, setPresentBiasBeta] = useState<number>(economics.discounting.beta_used || 0.70);

  const altIds = useMemo(() => decision.alternatives.map((a) => a.id), [decision.alternatives]);
  const stateIds = useMemo(() => decision.states_of_world.map((s) => s.id), [decision.states_of_world]);
  const probabilities = useMemo(() => decision.states_of_world.map((s) => s.prior_probability), [decision.states_of_world]);

  const payoffLookup = useCallback((altId: string, stateId: string) => {
    const cell = decision.payoff_matrix.find((p) => p.alternative_id === altId && p.state_id === stateId);
    return cell ? cell.utility : 50;
  }, [decision.payoff_matrix]);

  // Live dynamic EVPI
  const liveEVPI = useMemo(() => {
    return calculateClientEVPI(altIds, stateIds, probabilities, payoffLookup);
  }, [altIds, stateIds, probabilities, payoffLookup]);

  // Live dynamic CPT
  const liveCPT = useMemo(() => {
    return calculateClientCPT(altIds, stateIds, probabilities, payoffLookup, referencePoint, lambda);
  }, [altIds, stateIds, probabilities, payoffLookup, referencePoint, lambda]);

  // Live dynamic Discounting
  const liveDiscounting = useMemo(() => {
    const futureVal =
      economics.discounting.future_utility_value ??
      (economics.discounting.exponential_discount_factor > 0
        ? economics.discounting.exponential_present_value / economics.discounting.exponential_discount_factor
        : 75);
    return calculateClientDiscounting(horizonYears, futureVal, 0.07, presentBiasBeta);
  }, [horizonYears, presentBiasBeta, economics.discounting]);

  const bestAltName = (id: string) => {
    const a = decision.alternatives.find((alt) => alt.id === id);
    return a ? a.name : id;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="phronesis-card p-6 relative overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-verdigris-subtle)] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 rounded-xl text-[var(--color-verdigris)]">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-semibold text-[var(--text-main)] tracking-tight">
              Quantitative Economics & Valuation Engine
            </h2>
            <p className="text-xs font-body text-[var(--text-muted)] mt-0.5">
              Deterministic peer-reviewed algebraic solvers (Raiffa & Schlaifer 1961; Tversky & Kahneman 1992; Laibson 1997; Dixit & Pindyck 1994)
            </p>
          </div>
        </div>

        {/* Opportunity Cost Narrative */}
        {economics.opportunity_cost_narrative && (
          <div className="mt-4 p-3.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl text-xs font-body text-[var(--text-main)] leading-relaxed">
            <span className="font-semibold text-[var(--color-verdigris)]">Opportunity Cost Shadow Price: </span>
            {economics.opportunity_cost_narrative}
          </div>
        )}
      </div>

      {/* Grid: 4 Core Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Expected Value of Perfect Information (EVPI) */}
        <div className="phronesis-card p-5 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-verdigris)] shadow-2xs" />
                <h3 className="text-sm font-display font-semibold text-[var(--text-main)]">
                  Value of Information (EVPI & EVSI)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 rounded-lg text-xs font-data font-bold">
                EVPI = {liveEVPI.evpi.toFixed(2)} pts
              </span>
            </div>

            <p className="text-xs font-body text-[var(--text-muted)] mb-4 leading-relaxed">
              {economics.evpi.voi_ceiling_narrative}
            </p>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              <div className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-2.5 text-center">
                <div className="text-[10px] uppercase font-ui tracking-wider text-[var(--text-faint)]">Prior Max EU</div>
                <div className="text-sm sm:text-base font-data font-bold text-[var(--text-main)] mt-0.5">{liveEVPI.priorMaxEU.toFixed(1)}</div>
              </div>
              <div className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-2.5 text-center">
                <div className="text-[10px] uppercase font-ui tracking-wider text-[var(--text-faint)]">Posterior EU</div>
                <div className="text-sm sm:text-base font-data font-bold text-[var(--color-verdigris)] mt-0.5">{liveEVPI.posteriorMaxEU.toFixed(1)}</div>
              </div>
              <div className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-2.5 text-center">
                <div className="text-[10px] uppercase font-ui tracking-wider text-[var(--text-faint)]">EVPI Bound</div>
                <div className="text-sm sm:text-base font-data font-bold text-[var(--color-ochre)] mt-0.5">
                  {(liveEVPI.fractionalEVPI * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Algebraic Derivation Code Box */}
            <div className="p-3 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl font-data text-[11px] text-[var(--text-muted)] leading-relaxed overflow-x-auto whitespace-pre">
              {economics.evpi.algebraic_derivation}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-faint)]">
            <span className="font-ui">Howard (1966) / Raiffa & Schlaifer (1961)</span>
            {onDrillDown && (
              <button
                type="button"
                onClick={() =>
                  onDrillDown({
                    item_type: 'solver',
                    item_id: 'evpi_solver',
                    item_title: 'Expected Value of Perfect Information',
                    item_context: { evpi: liveEVPI.evpi, fractional: liveEVPI.fractionalEVPI },
                  })
                }
                className="text-[var(--color-verdigris)] hover:underline flex items-center gap-1 font-ui font-medium cursor-pointer"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Module 2: Cumulative Prospect Theory (CPT) */}
        <div className="phronesis-card p-5 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-ochre)] shadow-2xs" />
                <h3 className="text-sm font-display font-semibold text-[var(--text-main)]">
                  Prospect Theory & Loss Aversion
                </h3>
              </div>
              {economics.prospect_theory.framing_divergence ? (
                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg text-xs font-ui font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Framing Sensitive
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 rounded-lg text-xs font-ui font-medium">
                  Robust to Framing
                </span>
              )}
            </div>

            <p className="text-xs font-body text-[var(--text-muted)] mb-4 leading-relaxed">
              {economics.prospect_theory.framing_vulnerability_narrative}
            </p>

            {/* Interactive Sliders */}
            <div className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-3.5 mb-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-ui text-[var(--text-main)] mb-1">
                  <span>Loss Aversion Multiplier (λ):</span>
                  <span className="font-data font-bold text-[var(--color-ochre)]">{lambda.toFixed(2)}×</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.05"
                  value={lambda}
                  onChange={(e) => setLambda(parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-ochre)] bg-[var(--bg-surface)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-subtle)]"
                />
                <div className="flex justify-between text-[10px] font-ui text-[var(--text-faint)] mt-0.5">
                  <span>1.0x (Risk Neutral)</span>
                  <span>2.25x (Empirical Baseline)</span>
                  <span>3.5x (Severe Aversion)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-ui text-[var(--text-main)] mb-1">
                  <span>Reference Point (Neutral Baseline):</span>
                  <span className="font-data font-bold text-[var(--color-ochre)]">{referencePoint} pts</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={referencePoint}
                  onChange={(e) => setReferencePoint(parseInt(e.target.value))}
                  className="w-full accent-[var(--color-ochre)] bg-[var(--bg-surface)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-subtle)]"
                />
              </div>
            </div>

            {/* CPT Payoffs Table */}
            <div className="space-y-1.5">
              {altIds.map((id) => (
                <div key={id} className="flex items-center justify-between p-2.5 bg-[var(--bg-app)] rounded-lg border border-[var(--border-subtle)] text-xs">
                  <span className="text-[var(--text-main)] font-ui font-medium truncate max-w-[200px]">{bestAltName(id)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-muted)] font-data text-[11px]">
                      CPT Score: <span className="text-[var(--color-ochre)] font-bold">{liveCPT[id]?.toFixed(2) ?? '-'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-faint)]">
            <span className="font-ui">Tversky & Kahneman (1992) / Arrow (1965)</span>
            {onDrillDown && (
              <button
                type="button"
                onClick={() =>
                  onDrillDown({
                    item_type: 'solver',
                    item_id: 'prospect_theory_solver',
                    item_title: 'Cumulative Prospect Theory & Risk Preferences',
                    item_context: { lambda, referencePoint, values: liveCPT },
                  })
                }
                className="text-[var(--color-ochre)] hover:underline flex items-center gap-1 font-ui font-medium cursor-pointer"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Module 3: Intertemporal Discounting & Present-Bias */}
        <div className="phronesis-card p-5 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-verdigris)] shadow-2xs" />
                <h3 className="text-sm font-display font-semibold text-[var(--text-main)]">
                  Intertemporal Choice & Discounting
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 rounded-lg text-xs font-data font-bold">
                Present-Bias Penalty: {liveDiscounting.penalty.toFixed(1)} pts
              </span>
            </div>

            <p className="text-xs font-body text-[var(--text-muted)] mb-4 leading-relaxed">
              {economics.discounting.impatience_narrative}
            </p>

            {/* Time Horizon Slider */}
            <div className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-3.5 mb-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-ui text-[var(--text-main)] mb-1">
                  <span>Decision Time Horizon:</span>
                  <span className="font-data font-bold text-[var(--color-verdigris)]">{horizonYears} Years</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={horizonYears}
                  onChange={(e) => setHorizonYears(parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-verdigris)] bg-[var(--bg-surface)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-subtle)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-ui text-[var(--text-main)] mb-1">
                  <span>Present-Bias Factor (β):</span>
                  <span className="font-data font-bold text-[var(--color-verdigris)]">{presentBiasBeta.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={presentBiasBeta}
                  onChange={(e) => setPresentBiasBeta(parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-verdigris)] bg-[var(--bg-surface)] h-1.5 rounded-lg appearance-none cursor-pointer border border-[var(--border-subtle)]"
                />
                <div className="flex justify-between text-[10px] font-ui text-[var(--text-faint)] mt-0.5">
                  <span>0.3 (High Impatience)</span>
                  <span>0.7 (Median Agent)</span>
                  <span>1.0 (Zero Bias)</span>
                </div>
              </div>
            </div>

            {/* Present Values Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase font-ui tracking-wider text-[var(--text-faint)]">Exponential PV (Samuelson)</div>
                <div className="text-base sm:text-lg font-data font-bold text-[var(--text-main)] mt-1">{liveDiscounting.expPV.toFixed(1)}</div>
              </div>
              <div className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase font-ui tracking-wider text-[var(--color-ochre)]">Hyperbolic PV (Laibson)</div>
                <div className="text-base sm:text-lg font-data font-bold text-[var(--color-ochre)] mt-1">{liveDiscounting.hypPV.toFixed(1)}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-faint)]">
            <span className="font-ui">Laibson (1997) / Samuelson (1937)</span>
            {onDrillDown && (
              <button
                type="button"
                onClick={() =>
                  onDrillDown({
                    item_type: 'solver',
                    item_id: 'discounting_solver',
                    item_title: 'Hyperbolic vs Exponential Discounting',
                    item_context: { horizonYears, beta: presentBiasBeta, expPV: liveDiscounting.expPV, hypPV: liveDiscounting.hypPV },
                  })
                }
                className="text-[var(--color-verdigris)] hover:underline flex items-center gap-1 font-ui font-medium cursor-pointer"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Module 4: Real Options & Convexity (Antifragility) */}
        <div className="phronesis-card p-5 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-verdigris)] shadow-2xs" />
                <h3 className="text-sm font-display font-semibold text-[var(--text-main)]">
                  Real Options & Convexity
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 rounded-lg text-xs font-ui font-semibold">
                {economics.real_options.convexity_class}
              </span>
            </div>

            <p className="text-xs font-body text-[var(--text-muted)] mb-4 leading-relaxed">
              {economics.real_options.reversibility_narrative}
            </p>

            {/* Reversibility & Option Value Cards */}
            <div className="space-y-3 mb-4">
              <div className="p-3.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-ui font-semibold text-[var(--text-main)]">{economics.real_options.reversibility_type}</div>
                  <div className="text-[11px] font-body text-[var(--text-muted)] mt-0.5">
                    Reversibility Score: <span className="font-data font-bold text-[var(--color-verdigris)]">{(economics.real_options.reversibility_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-ui tracking-wider text-[var(--text-faint)]">Option Value of Delay</div>
                  <div className="text-sm sm:text-base font-data font-bold text-[var(--color-verdigris)]">
                    +{economics.real_options.option_value_of_waiting.toFixed(2)} pts
                  </div>
                </div>
              </div>

              {/* Barbell Strategy Alert if applicable */}
              {economics.real_options.barbell_applicable && (
                <div className="p-3.5 bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30 rounded-xl text-xs font-body text-[var(--text-main)] leading-relaxed">
                  <span className="font-semibold text-[var(--color-ochre)]">Taleb Barbell Strategy: </span>
                  {economics.real_options.barbell_narrative}
                </div>
              )}
            </div>

            <p className="text-xs font-body text-[var(--text-muted)] leading-relaxed">
              {economics.real_options.convexity_narrative}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-faint)]">
            <span className="font-ui">Dixit & Pindyck (1994) / Taleb (2012)</span>
            {onDrillDown && (
              <button
                type="button"
                onClick={() =>
                  onDrillDown({
                    item_type: 'solver',
                    item_id: 'real_options_solver',
                    item_title: 'Real Options & Convexity',
                    item_context: { reversibility: economics.real_options.reversibility_type, convexity: economics.real_options.convexity_class },
                  })
                }
                className="text-[var(--color-verdigris)] hover:underline flex items-center gap-1 font-ui font-medium cursor-pointer"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
