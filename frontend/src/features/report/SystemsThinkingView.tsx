import React from 'react';
import type { SystemsLayerResult } from '../../types';
import { Network, Scale, Repeat, ArrowRight } from 'lucide-react';

interface SystemsThinkingViewProps {
  systems: SystemsLayerResult;
  onDrillDown?: (item: { item_type: string; item_id: string; item_title: string; item_context?: Record<string, any> }) => void;
}

export const SystemsThinkingView: React.FC<SystemsThinkingViewProps> = ({
  systems,
  onDrillDown,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Systems Thinking & Strategic Game Theory</h2>
            <p className="text-xs text-slate-400">
              Evaluates non-linear feedback loops (Meadows 2008), costly signaling (Spence 1973), and Rawlsian fairness (Rawls 1971).
            </p>
          </div>
        </div>

        {/* Synthesis Narrative Box */}
        <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed whitespace-pre-line">
          {systems.systems_synthesis_narrative}
        </div>
      </div>

      {/* 3 Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Feedback Loops & Systems Dynamics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Feedback Structures (Meadows)</h3>
              </div>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded text-xs font-mono">
                {systems.feedback_loops.dominant_loop_type} Loop
              </span>
            </div>

            {/* Reinforcing Loops */}
            <div className="space-y-3 mb-4">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-cyan-400" /> Reinforcing (R) Loops:
              </div>
              {systems.feedback_loops.reinforcing_loops_detected.map((r, i) => (
                <div key={i} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed">
                  {r}
                </div>
              ))}
            </div>

            {/* Balancing Loops */}
            <div className="space-y-3 mb-4">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" /> Balancing (B) Constraints:
              </div>
              {systems.feedback_loops.balancing_loops_detected.map((b, i) => (
                <div key={i} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed">
                  {b}
                </div>
              ))}
            </div>

            {/* Delays & Leverage Point */}
            <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg space-y-2">
              <div className="text-xs text-cyan-300 leading-relaxed">
                <span className="font-semibold text-cyan-200">Temporal Delays: </span>
                {systems.feedback_loops.delay_risk_narrative}
              </div>
              <div className="text-xs text-cyan-300 leading-relaxed">
                <span className="font-semibold text-cyan-200">Leverage Point: </span>
                {systems.feedback_loops.leverage_point_narrative}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Meadows (2008)</span>
            {onDrillDown && (
              <button
                onClick={() =>
                  onDrillDown({
                    item_type: 'systems',
                    item_id: 'feedback_loops',
                    item_title: 'Systems Dynamics & Feedback Loops',
                    item_context: { dominant: systems.feedback_loops.dominant_loop_type },
                  })
                }
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Panel 2: Strategic Signaling & Game Theory */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Strategic Signaling & Game Theory</h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs font-medium">
                {systems.game_theory.game_type}
              </span>
            </div>

            {/* Signaling Credibility Badge */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg mb-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Signal Credibility Tier (Spence 1973)</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{systems.game_theory.signaling_credibility}</div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {systems.game_theory.strategic_narrative}
            </p>

            {/* Cooperation vs Defection (Axelrod) */}
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg mb-3 text-xs text-emerald-300 leading-relaxed">
              <span className="font-semibold text-emerald-200">Iterated Game Dynamics (Axelrod): </span>
              {systems.game_theory.cooperation_vs_defection}
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Nash Equilibrium Observation: </span>
              {systems.game_theory.nash_equilibrium_note}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Spence (1973) / Axelrod (1984)</span>
            {onDrillDown && (
              <button
                onClick={() =>
                  onDrillDown({
                    item_type: 'systems',
                    item_id: 'game_theory',
                    item_title: 'Strategic Signaling & Game Theory',
                    item_context: { game_type: systems.game_theory.game_type },
                  })
                }
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Panel 3: Rawlsian Veil of Ignorance Fairness Audit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <h3 className="text-sm font-semibold text-white">Veil of Ignorance Audit (Rawls)</h3>
              </div>
              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded text-xs font-medium">
                {systems.rawlsian_audit.veil_verdict}
              </span>
            </div>

            {/* Least Advantaged Stakeholder */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg mb-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Least-Advantaged Stakeholder Position</div>
              <div className="text-xs font-bold text-rose-300 mt-1">{systems.rawlsian_audit.least_advantaged_stakeholder}</div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {systems.rawlsian_audit.fairness_narrative}
            </p>

            {/* Maximin Alternative */}
            {systems.rawlsian_audit.maximin_alternative && (
              <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg text-xs text-rose-200 leading-relaxed">
                <span className="font-semibold text-rose-100">Maximin Alternative (Safety Floor): </span>
                '{systems.rawlsian_audit.maximin_alternative}' maximizes the lowest possible payoff across all states.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Rawls (1971), A Theory of Justice</span>
            {onDrillDown && (
              <button
                onClick={() =>
                  onDrillDown({
                    item_type: 'systems',
                    item_id: 'rawlsian_audit',
                    item_title: 'Rawlsian Veil of Ignorance Audit',
                    item_context: { verdict: systems.rawlsian_audit.veil_verdict },
                  })
                }
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
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
