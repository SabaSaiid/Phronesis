import React, { useState, useId } from 'react';
import type { StructuredDecision, SensitivityAnalysisResult } from '../../types';
import { Scale, RotateCcw, Sparkles } from 'lucide-react';
import { calculateExpectedUtility } from '../../lib/decisionMath';

interface BalanceScaleSensitivityProps {
  decision: StructuredDecision;
  sensitivity: SensitivityAnalysisResult;
}

export const BalanceScaleSensitivity: React.FC<BalanceScaleSensitivityProps> = ({
  decision,
  sensitivity,
}) => {
  const alts = decision.alternatives;
  const states = decision.states_of_world;
  const sliderId = useId();
  const initialP = Math.round((states[0]?.prior_probability ?? 0.5) * 100);
  const [sliderP, setSliderP] = useState<number>(initialP);

  if (alts.length < 2 || states.length < 2) {
    return (
      <div className="p-4 text-center text-xs font-data text-[var(--text-muted)]">
        Requires at least 2 alternatives and 2 states for balance scale simulation.
      </div>
    );
  }

  const alt1 = alts[0];
  const alt2 = alts[1];
  const state1 = states[0];
  const state2 = states[1];

  // Helper to fetch utility
  const getUtility = (altId: string, stateId: string): number => {
    const cell = decision.payoff_matrix.find(
      (p) => p.alternative_id === altId && p.state_id === stateId
    );
    return cell ? cell.utility : 50;
  };

  const u1_s1 = getUtility(alt1.id, state1.id);
  const u1_s2 = getUtility(alt1.id, state2.id);
  const u2_s1 = getUtility(alt2.id, state1.id);
  const u2_s2 = getUtility(alt2.id, state2.id);

  const p = sliderP / 100;
  const eu1 = calculateExpectedUtility(p, u1_s1, u1_s2);
  const eu2 = calculateExpectedUtility(p, u2_s1, u2_s2);

  const deltaEU = eu1 - eu2; // positive means alt1 is heavier (tips down left)
  const inflectionPct = Math.round(sensitivity.inflection_threshold * 100);

  // Tilt angle: left heavy = positive rotation (down on left, up on right)
  // Let beam angle be in degrees: -15deg to +15deg
  const maxTilt = 14;
  const tiltAngle = Math.max(-maxTilt, Math.min(maxTilt, -(deltaEU / 25) * maxTilt));

  // Determine winner
  const isAlt1Winning = eu1 > eu2;
  const isAlt2Winning = eu2 > eu1;
  const isBalanced = Math.abs(eu1 - eu2) < 0.2;

  // Geometry coordinates for SVG balance scale
  const svgWidth = 520;
  const svgHeight = 220;
  const fulcrumX = 260;
  const fulcrumY = 65;
  const beamLength = 190; // half length on each side
  const rad = (tiltAngle * Math.PI) / 180;

  // Left tip of beam
  const leftX = fulcrumX - beamLength * Math.cos(rad);
  const leftY = fulcrumY - beamLength * Math.sin(rad);

  // Right tip of beam
  const rightX = fulcrumX + beamLength * Math.cos(rad);
  const rightY = fulcrumY + beamLength * Math.sin(rad);

  // Chain length
  const chainLength = 55;
  const panLeftX = leftX;
  const panLeftY = leftY + chainLength;
  const panRightX = rightX;
  const panRightY = rightY + chainLength;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-[var(--color-verdigris)]" />
            <h4 className="font-display font-semibold text-base text-[var(--text-main)] tracking-tight">
              Scales of Judgment: Sensitivity Simulation
            </h4>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-body">
            Drag the probability of <strong className="font-semibold text-[var(--text-main)]">"{state1.name}"</strong> to observe where judgment physically tips.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[var(--text-muted)]">Tipping threshold:</span>
          <span className="font-data font-semibold text-[var(--color-ochre)] px-2 py-0.5 rounded bg-[var(--color-ochre-subtle)] border border-[var(--color-ochre)]/30">
            p* = {inflectionPct}%
          </span>
        </div>
      </div>

      {/* SVG Balance Scale Visual */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] p-4 flex flex-col items-center justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[500px] h-auto select-none"
          style={{ overflow: 'visible' }}
        >
          {/* Gradients and Filters */}
          <defs>
            <linearGradient id="bronzeBeam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8A8578" />
              <stop offset="50%" stopColor="#5B7A6B" />
              <stop offset="100%" stopColor="#8A8578" />
            </linearGradient>
            <linearGradient id="pillarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5B7A6B" />
              <stop offset="100%" stopColor="#8A8578" />
            </linearGradient>
          </defs>

          {/* Central Pillar & Pedestal Stand */}
          {/* Base pedestal */}
          <path
            d="M 220,195 L 300,195 L 290,180 L 230,180 Z"
            fill="var(--color-slate)"
            opacity="0.6"
          />
          <rect
            x="210"
            y="195"
            width="100"
            height="8"
            rx="3"
            fill="var(--color-slate)"
            opacity="0.8"
          />
          {/* Vertical mast */}
          <line
            x1={fulcrumX}
            y1="40"
            x2={fulcrumX}
            y2="180"
            stroke="url(#pillarGrad)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Top finial / pointer */}
          <circle cx={fulcrumX} cy="35" r="5" fill="var(--color-verdigris)" />
          <polygon
            points={`${fulcrumX - 4},50 ${fulcrumX + 4},50 ${fulcrumX},30`}
            fill="var(--color-verdigris)"
          />

          {/* Central Fulcrum Pivot Ring */}
          <circle
            cx={fulcrumX}
            cy={fulcrumY}
            r="8"
            fill="var(--bg-surface)"
            stroke="var(--color-verdigris)"
            strokeWidth="3"
          />

          {/* Tilting Balance Beam */}
          <line
            x1={leftX}
            y1={leftY}
            x2={rightX}
            y2={rightY}
            stroke="url(#bronzeBeam)"
            strokeWidth="4.5"
            strokeLinecap="round"
            style={{ transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />

          {/* Left Pivot & Chains */}
          <circle cx={leftX} cy={leftY} r="4" fill="var(--color-verdigris)" />
          <line
            x1={leftX}
            y1={leftY}
            x2={panLeftX - 25}
            y2={panLeftY}
            stroke="var(--color-slate)"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.7"
            style={{ transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />
          <line
            x1={leftX}
            y1={leftY}
            x2={panLeftX + 25}
            y2={panLeftY}
            stroke="var(--color-slate)"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.7"
            style={{ transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />
          <line
            x1={leftX}
            y1={leftY}
            x2={panLeftX}
            y2={panLeftY}
            stroke="var(--color-slate)"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.9"
            style={{ transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />

          {/* Left Pan (Alt 1) */}
          <path
            d={`M ${panLeftX - 35},${panLeftY} Q ${panLeftX},${panLeftY + 18} ${panLeftX + 35},${panLeftY} Z`}
            fill={isAlt1Winning ? 'var(--color-verdigris)' : 'var(--color-slate)'}
            opacity={isAlt1Winning ? 0.9 : 0.45}
            style={{ transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />

          {/* Right Pivot & Chains */}
          <circle cx={rightX} cy={rightY} r="4" fill="var(--color-verdigris)" />
          <line
            x1={rightX}
            y1={rightY}
            x2={panRightX - 25}
            y2={panRightY}
            stroke="var(--color-slate)"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.7"
            style={{ transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />
          <line
            x1={rightX}
            y1={rightY}
            x2={panRightX + 25}
            y2={panRightY}
            stroke="var(--color-slate)"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.7"
            style={{ transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />
          <line
            x1={rightX}
            y1={rightY}
            x2={panRightX}
            y2={panRightY}
            stroke="var(--color-slate)"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.9"
            style={{ transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />

          {/* Right Pan (Alt 2) */}
          <path
            d={`M ${panRightX - 35},${panRightY} Q ${panRightX},${panRightY + 18} ${panRightX + 35},${panRightY} Z`}
            fill={isAlt2Winning ? 'var(--color-verdigris)' : 'var(--color-slate)'}
            opacity={isAlt2Winning ? 0.9 : 0.45}
            style={{ transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />
        </svg>

        {/* Pan Labels & Mono Values Overlay */}
        <div className="w-full grid grid-cols-2 gap-4 mt-1 pt-2 border-t border-[var(--border-subtle)] text-xs">
          {/* Left Alternative Info */}
          <div className={`p-2.5 rounded-lg transition-all ${
            isAlt1Winning
              ? 'bg-[var(--bg-surface-raised)] border border-[var(--color-verdigris)] shadow-sm'
              : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] opacity-80'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-ui font-semibold text-[var(--text-main)] truncate max-w-[140px]">
                {alt1.name}
              </span>
              {isAlt1Winning && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--color-verdigris)] text-[#F5F2EA]">
                  Favored
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">Expected Utility:</span>
              <span className="font-data font-bold text-sm text-[var(--text-main)]">
                {eu1.toFixed(1)} <span className="text-[10px] font-normal text-[var(--text-muted)]">EU</span>
              </span>
            </div>
          </div>

          {/* Right Alternative Info */}
          <div className={`p-2.5 rounded-lg transition-all ${
            isAlt2Winning
              ? 'bg-[var(--bg-surface-raised)] border border-[var(--color-verdigris)] shadow-sm'
              : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] opacity-80'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-ui font-semibold text-[var(--text-main)] truncate max-w-[140px]">
                {alt2.name}
              </span>
              {isAlt2Winning && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--color-verdigris)] text-[#F5F2EA]">
                  Favored
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">Expected Utility:</span>
              <span className="font-data font-bold text-sm text-[var(--text-main)]">
                {eu2.toFixed(1)} <span className="text-[10px] font-normal text-[var(--text-muted)]">EU</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Probability Slider */}
      <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor={sliderId} className="font-ui font-medium text-[var(--text-main)] flex items-center space-x-1.5">
            <span>Simulate Probability of State:</span>
            <span className="font-semibold text-[var(--color-verdigris)]">"{state1.name}"</span>
          </label>
          <div className="font-data font-bold text-sm text-[var(--text-main)]">
            P = {sliderP}%
          </div>
        </div>

        {/* Custom Range Slider with Inflection Marker */}
        <div className="relative pt-1 pb-3">
          <input
            id={sliderId}
            type="range"
            min="0"
            max="100"
            value={sliderP}
            onChange={(e) => setSliderP(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[var(--bg-app)] accent-[var(--color-verdigris)] border border-[var(--border-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-verdigris)]"
          />

          {/* Tipping Point Ochre Marker on Slider Track */}
          {inflectionPct >= 0 && inflectionPct <= 100 && (
            <div
              className="absolute top-0 flex flex-col items-center pointer-events-none transform -translate-x-1/2"
              style={{ left: `${inflectionPct}%` }}
            >
              <div className="w-2.5 h-2.5 rotate-45 bg-[var(--color-ochre)] shadow-sm mt-0.5" />
              <div className="mt-4 px-1.5 py-0.5 rounded bg-[var(--bg-surface-raised)] border border-[var(--color-ochre)] text-[10px] font-data text-[var(--color-ochre)] whitespace-nowrap shadow-sm">
                p* = {inflectionPct}%
              </div>
            </div>
          )}
        </div>

        {/* Preset Quick-Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-[var(--text-muted)] font-ui">Presets:</span>
            <button
              type="button"
              onClick={() => setSliderP(initialP)}
              className="px-2 py-1 rounded bg-[var(--bg-app)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[11px] font-data text-[var(--text-main)] transition-colors"
            >
              Initial Prior ({initialP}%)
            </button>
            {inflectionPct >= 0 && inflectionPct <= 100 && (
              <button
                type="button"
                onClick={() => setSliderP(inflectionPct)}
                className="px-2 py-1 rounded bg-[var(--color-ochre-subtle)] hover:bg-[var(--color-ochre)]/20 border border-[var(--color-ochre)]/40 text-[11px] font-data text-[var(--color-ochre)] font-medium transition-colors"
              >
                At Tipping Point ({inflectionPct}%)
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSliderP(initialP)}
            className="flex items-center space-x-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Dynamic Analytical Verdict */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex items-start space-x-2.5">
        <Sparkles className="w-4 h-4 text-[var(--color-verdigris)] shrink-0 mt-0.5" />
        <div className="leading-relaxed font-body">
          {isBalanced ? (
            <span>
              At <span className="font-data font-semibold text-[var(--text-main)]">P = {sliderP}%</span>, expected utilities are exactly balanced (<span className="font-data">{eu1.toFixed(1)} EU</span>). Both alternatives provide equal expected value.
            </span>
          ) : isAlt1Winning ? (
            <span>
              At <span className="font-data font-semibold text-[var(--text-main)]">P = {sliderP}%</span>, the scale tips toward <strong className="font-ui font-semibold text-[var(--text-main)]">{alt1.name}</strong> by <span className="font-data font-semibold text-[var(--color-verdigris)]">+{Math.abs(deltaEU).toFixed(1)} EU</span>. {sensitivity.directional_shift}
            </span>
          ) : (
            <span>
              At <span className="font-data font-semibold text-[var(--text-main)]">P = {sliderP}%</span>, the scale tips toward <strong className="font-ui font-semibold text-[var(--text-main)]">{alt2.name}</strong> by <span className="font-data font-semibold text-[var(--color-verdigris)]">+{Math.abs(deltaEU).toFixed(1)} EU</span>. {sensitivity.directional_shift}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
