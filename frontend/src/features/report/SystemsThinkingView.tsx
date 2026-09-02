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
      <div className="phronesis-card p-6 relative overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-verdigris-subtle)] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/30 rounded-xl text-[var(--color-verdigris)]">
            <Network className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-semibold text-[var(--text-main)] tracking-tight">
              Systems Thinking & Strategic Game Theory
            </h2>
            <p className="text-xs font-body text-[var(--text-muted)] mt-0.5">
              Evaluates non-linear feedback loops (Meadows 2008), costly signaling (Spence 1973), and Rawlsian fairness (Rawls 1971).
            </p>
          </div>
        </div>

        {/* Synthesis Narrative Box */}
        {systems.systems_synthesis_narrative && (
          <div className="mt-4 p-3.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl text-xs font-body text-[var(--text-main)] leading-relaxed whitespace-pre-line">
            {systems.systems_synthesis_narrative}
          </div>
        )}
      </div>

      {/* 3 Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Feedback Loops & Systems Dynamics */}
        <div className="phronesis-card p-5 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-verdigris)] shadow-2xs" />
                <h3 className="text-sm font-display font-semibold text-[var(--text-main)]">
                  Feedback Structures (Meadows)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 rounded-lg text-xs font-data font-bold">
                {systems.feedback_loops.dominant_loop_type} Loop
              </span>
            </div>

            {/* Reinforcing Loops */}
            <div className="space-y-3 mb-4">
              <div className="text-xs font-ui font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[var(--color-verdigris)]" /> Reinforcing (R) Loops:
              </div>
              {systems.feedback_loops.reinforcing_loops_detected.map((r, i) => (
                <div key={i} className="p-2.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl text-xs font-body text-[var(--text-muted)] leading-relaxed">
                  {r}
                </div>
              ))}
            </div>

            {/* Balancing Loops */}
            <div className="space-y-3 mb-4">
              <div className="text-xs font-ui font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[var(--color-ochre)]" /> Balancing (B) Constraints:
              </div>
              {systems.feedback_loops.balancing_loops_detected.map((b, i) => (
                <div key={i} className="p-2.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl text-xs font-body text-[var(--text-muted)] leading-relaxed">
                  {b}
                </div>
              ))}
            </div>

            {/* Delays & Leverage Point */}
            <div className="p-3.5 bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/20 rounded-xl space-y-2">
              <div className="text-xs font-body text-[var(--text-main)] leading-relaxed">
                <span className="font-ui font-semibold text-[var(--color-verdigris)]">Temporal Delays: </span>
                {systems.feedback_loops.delay_risk_narrative}
              </div>
              <div className="text-xs font-body text-[var(--text-main)] leading-relaxed">
                <span className="font-ui font-semibold text-[var(--color-verdigris)]">Leverage Point: </span>
                {systems.feedback_loops.leverage_point_narrative}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-faint)]">
            <span className="font-ui">Meadows (2008)</span>
            {onDrillDown && (
              <button
                type="button"
                onClick={() =>
                  onDrillDown({
                    item_type: 'systems',
                    item_id: 'feedback_loops',
                    item_title: 'Systems Dynamics & Feedback Loops',
                    item_context: { dominant: systems.feedback_loops.dominant_loop_type },
                  })
                }
                className="text-[var(--color-verdigris)] hover:underline flex items-center gap-1 font-ui font-medium cursor-pointer"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Panel 2: Strategic Signaling & Game Theory */}
        <div className="phronesis-card p-5 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-verdigris)] shadow-2xs" />
                <h3 className="text-sm font-display font-semibold text-[var(--text-main)]">
                  Strategic Signaling & Game Theory
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-[var(--color-verdigris-subtle)] text-[var(--color-verdigris)] border border-[var(--color-verdigris)]/30 rounded-lg text-xs font-ui font-semibold">
                {systems.game_theory.game_type}
              </span>
            </div>

            {/* Signaling Credibility Badge */}
            <div className="p-3 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl mb-4">
              <div className="text-[10px] uppercase font-ui tracking-wider text-[var(--text-faint)]">Signal Credibility Tier (Spence 1973)</div>
              <div className="text-sm font-data font-bold text-[var(--color-verdigris)] mt-0.5">{systems.game_theory.signaling_credibility}</div>
            </div>

            <p className="text-xs font-body text-[var(--text-muted)] mb-4 leading-relaxed">
              {systems.game_theory.strategic_narrative}
            </p>

            {/* Cooperation vs Defection (Axelrod) */}
            <div className="p-3 bg-[var(--color-verdigris-subtle)] border border-[var(--color-verdigris)]/20 rounded-xl mb-3 text-xs font-body text-[var(--text-main)] leading-relaxed">
              <span className="font-ui font-semibold text-[var(--color-verdigris)]">Iterated Dynamics (Axelrod): </span>
              {systems.game_theory.cooperation_vs_defection}
            </div>

            <div className="p-3 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl text-xs font-body text-[var(--text-muted)] leading-relaxed">
              <span className="font-ui font-semibold text-[var(--text-main)]">Nash Equilibrium Observation: </span>
              {systems.game_theory.nash_equilibrium_note}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-faint)]">
            <span className="font-ui">Spence (1973) / Axelrod (1984)</span>
            {onDrillDown && (
              <button
                type="button"
                onClick={() =>
                  onDrillDown({
                    item_type: 'systems',
                    item_id: 'game_theory',
                    item_title: 'Strategic Signaling & Game Theory',
                    item_context: { game_type: systems.game_theory.game_type },
                  })
                }
                className="text-[var(--color-verdigris)] hover:underline flex items-center gap-1 font-ui font-medium cursor-pointer"
              >
                Deep-Dive <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Panel 3: Rawlsian Veil of Ignorance Fairness Audit */}
        <div className="phronesis-card p-5 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-ochre)] shadow-2xs" />
                <h3 className="text-sm font-display font-semibold text-[var(--text-main)]">
                  Veil of Ignorance Audit (Rawls)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-[var(--color-ochre-subtle)] text-[var(--color-ochre)] border border-[var(--color-ochre)]/30 rounded-lg text-xs font-ui font-semibold">
                {systems.rawlsian_audit.veil_verdict}
              </span>
            </div>

            {/* Least Advantaged Stakeholder */}
            <div className="p-3 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl mb-4">
              <div className="text-[10px] uppercase font-ui tracking-wider text-[var(--text-faint)]">Least-Advantaged Stakeholder Position</div>
              <div className="text-xs font-ui font-bold text-[var(--color-ochre)] mt-1">{systems.rawlsian_audit.least_advantaged_stakeholder}</div>
            </div>

            <p className="text-xs font-body text-[var(--text-muted)] mb-4 leading-relaxed">
              {systems.rawlsian_audit.fairness_narrative}
            </p>

            {/* Maximin Alternative */}
            {systems.rawlsian_audit.maximin_alternative && (
              <div className="p-3 bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/20 rounded-xl text-xs font-body text-[var(--text-main)] leading-relaxed">
                <span className="font-ui font-semibold text-[var(--color-ochre)]">Maximin Alternative (Safety Floor): </span>
                '{systems.rawlsian_audit.maximin_alternative}' maximizes the lowest possible payoff across all states.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-faint)]">
            <span className="font-ui">Rawls (1971), A Theory of Justice</span>
            {onDrillDown && (
              <button
                type="button"
                onClick={() =>
                  onDrillDown({
                    item_type: 'systems',
                    item_id: 'rawlsian_audit',
                    item_title: 'Rawlsian Veil of Ignorance Audit',
                    item_context: { verdict: systems.rawlsian_audit.veil_verdict },
                  })
                }
                className="text-[var(--color-ochre)] hover:underline flex items-center gap-1 font-ui font-medium cursor-pointer"
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
