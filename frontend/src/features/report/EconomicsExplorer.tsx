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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Quantitative Economics & Valuation Engine</h2>
            <p className="text-xs text-slate-400">
              Deterministic peer-reviewed algebraic solvers (Raiffa & Schlaifer 1961; Tversky & Kahneman 1992; Laibson 1997; Dixit & Pindyck 1994)
            </p>
          </div>
        </div>

        {/* Opportunity Cost Narrative */}
        <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-emerald-400">Opportunity Cost Shadow Price: </span>
          {economics.opportunity_cost_narrative}
        </div>
      </div>

      {/* Grid: 4 Core Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Expected Value of Perfect Information (EVPI) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Value of Information (EVPI & EVSI)</h3>
              </div>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded text-xs font-mono">
                EVPI = {liveEVPI.evpi.toFixed(2)} pts
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {economics.evpi.voi_ceiling_narrative}
            </p>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Prior Max EU</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">{liveEVPI.priorMaxEU.toFixed(1)}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Posterior EU</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">{liveEVPI.posteriorMaxEU.toFixed(1)}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">EVPI Bound</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {(liveEVPI.fractionalEVPI * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Algebraic Derivation Code Box */}
            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg font-mono text-[11px] text-slate-400 leading-relaxed overflow-x-auto whitespace-pre">
              {economics.evpi.algebraic_derivation}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Howard (1966) / Raiffa & Schlaifer (1961)</span>
            {onDrillDown && (
              <button
                onClick={() =>
                  onDrillDown({
                    item_type: 'solver',
                    item_id: 'evpi_solver',
                    item_title: 'Expected Value of Perfect Information',
                    item_context: { evpi: liveEVPI.evpi, fractional: liveEVPI.fractionalEVPI },
                  })
                }
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Module 2: Cumulative Prospect Theory (CPT) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h3 className="text-sm font-semibold text-white">Prospect Theory & Loss Aversion</h3>
              </div>
              {economics.prospect_theory.framing_divergence ? (
                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded text-xs font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Framing Sensitive
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs font-medium">
                  Robust to Framing
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {economics.prospect_theory.framing_vulnerability_narrative}
            </p>

            {/* Interactive Sliders */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 mb-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Loss Aversion Multiplier (λ):</span>
                  <span className="font-mono font-bold text-amber-400">{lambda.toFixed(2)}×</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.05"
                  value={lambda}
                  onChange={(e) => setLambda(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>1.0x (Risk Neutral)</span>
                  <span>2.25x (Kahneman Empirical)</span>
                  <span>3.5x (Severe Aversion)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Reference Point (Neutral Baseline):</span>
                  <span className="font-mono font-bold text-amber-400">{referencePoint} pts</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={referencePoint}
                  onChange={(e) => setReferencePoint(parseInt(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* CPT Payoffs Table */}
            <div className="space-y-1.5">
              {altIds.map((id) => (
                <div key={id} className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800/80 text-xs">
                  <span className="text-slate-300 font-medium truncate max-w-[200px]">{bestAltName(id)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-[11px]">
                      CPT: <span className="text-amber-400 font-semibold">{liveCPT[id]?.toFixed(2) ?? '-'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Tversky & Kahneman (1992) / Arrow (1965)</span>
            {onDrillDown && (
              <button
                onClick={() =>
                  onDrillDown({
                    item_type: 'solver',
                    item_id: 'prospect_theory_solver',
                    item_title: 'Cumulative Prospect Theory & Risk Preferences',
                    item_context: { lambda, referencePoint, values: liveCPT },
                  })
                }
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Module 3: Intertemporal Discounting & Present-Bias */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <h3 className="text-sm font-semibold text-white">Intertemporal Choice & Discounting</h3>
              </div>
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded text-xs font-mono">
                Present-Bias Penalty: {liveDiscounting.penalty.toFixed(1)} pts
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {economics.discounting.impatience_narrative}
            </p>

            {/* Time Horizon Slider */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 mb-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Decision Time Horizon:</span>
                  <span className="font-mono font-bold text-purple-400">{horizonYears} Years</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={horizonYears}
                  onChange={(e) => setHorizonYears(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Present-Bias Factor (β):</span>
                  <span className="font-mono font-bold text-purple-400">{presentBiasBeta.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={presentBiasBeta}
                  onChange={(e) => setPresentBiasBeta(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0.3 (High Impatience)</span>
                  <span>0.7 (Median Agent)</span>
                  <span>1.0 (Zero Present-Bias)</span>
                </div>
              </div>
            </div>

            {/* Present Values Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Exponential PV (Samuelson)</div>
                <div className="text-lg font-bold text-slate-200 mt-1">{liveDiscounting.expPV.toFixed(1)}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-purple-400">Hyperbolic PV (Laibson)</div>
                <div className="text-lg font-bold text-purple-400 mt-1">{liveDiscounting.hypPV.toFixed(1)}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Laibson (1997) / Samuelson (1937)</span>
            {onDrillDown && (
              <button
                onClick={() =>
                  onDrillDown({
                    item_type: 'solver',
                    item_id: 'discounting_solver',
                    item_title: 'Hyperbolic vs Exponential Discounting',
                    item_context: { horizonYears, beta: presentBiasBeta, expPV: liveDiscounting.expPV, hypPV: liveDiscounting.hypPV },
                  })
                }
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Module 4: Real Options & Convexity (Antifragility) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <h3 className="text-sm font-semibold text-white">Real Options & Convexity</h3>
              </div>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-xs font-medium">
                {economics.real_options.convexity_class}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {economics.real_options.reversibility_narrative}
            </p>

            {/* Reversibility & Option Value Cards */}
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{economics.real_options.reversibility_type}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Reversibility Score: <span className="font-mono font-bold text-blue-400">{(economics.real_options.reversibility_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Option Value of Delay</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    +{economics.real_options.option_value_of_waiting.toFixed(2)} pts
                  </div>
                </div>
              </div>

              {/* Barbell Strategy Alert if applicable */}
              {economics.real_options.barbell_applicable && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-300 leading-relaxed">
                  <span className="font-semibold text-indigo-200">Taleb Barbell Strategy: </span>
                  {economics.real_options.barbell_narrative}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {economics.real_options.convexity_narrative}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Dixit & Pindyck (1994) / Taleb (2012)</span>
            {onDrillDown && (
              <button
                onClick={() =>
                  onDrillDown({
                    item_type: 'solver',
                    item_id: 'real_options_solver',
                    item_title: 'Real Options & Convexity',
                    item_context: { reversibility: economics.real_options.reversibility_type, convexity: economics.real_options.convexity_class },
                  })
                }
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
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
