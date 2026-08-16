import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import type { SensitivityAnalysisResult, StructuredDecision } from '../../types';

interface SensitivityChartProps {
  decision: StructuredDecision;
  sensitivity: SensitivityAnalysisResult;
}

export const SensitivityChart: React.FC<SensitivityChartProps> = ({
  decision,
  sensitivity,
}) => {
  const alts = decision.alternatives;
  const states = decision.states_of_world;
  
  if (states.length < 2 || alts.length < 2) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 font-mono">
        Sensitivity chart requires at least 2 states and 2 alternatives.
      </div>
    );
  }

  const s0 = states[0];
  const s1 = states[1];

  // Helper to get utility for alt under state
  const getU = (altId: string, stateId: string): number => {
    const p = decision.payoff_matrix.find(
      (cell) => cell.alternative_id === altId && cell.state_id === stateId
    );
    return p ? p.utility : 50;
  };

  // Generate data points from p(s0) = 0.0 to 1.0
  const data = [];
  for (let p = 0; p <= 1.01; p += 0.05) {
    const p0 = Math.round(p * 100) / 100;
    const p1 = Math.round((1.0 - p0) * 100) / 100;
    const point: Record<string, number> = {
      p0: Math.round(p0 * 100),
    };

    alts.forEach((alt) => {
      const u0 = getU(alt.id, s0.id);
      const u1 = getU(alt.id, s1.id);
      const eu = p0 * u0 + p1 * u1;
      point[alt.name] = Math.round(eu * 10) / 10;
    });

    data.push(point);
  }

  const inflectionP0 = Math.round(sensitivity.inflection_threshold * 100);
  const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899'];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1">
        <div>
          <span className="font-semibold text-slate-200">Probability Sensitivity Curve: </span>
          <span>Expected Utility vs. P({s0.name})</span>
        </div>
        <div className="font-mono text-brand-400 font-medium">
          Inflection Threshold p* = {Math.round(sensitivity.inflection_threshold * 100)}%
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="p0"
              stroke="#64748B"
              fontSize={11}
              unit="%"
              tickLine={false}
              label={{ value: `P(${s0.name})`, position: 'insideBottom', offset: -4, fill: '#64748B', fontSize: 10 }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              domain={[0, 100]}
              tickLine={false}
              label={{ value: 'Expected Utility', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F8FAFC',
              }}
              formatter={(value: any, name: any) => [`${value} EU`, name]}
              labelFormatter={(label) => `P(${s0.name}) = ${label}%`}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
            {inflectionP0 >= 0 && inflectionP0 <= 100 && (
              <ReferenceLine
                x={inflectionP0}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: `p* = ${inflectionP0}% (Decision Flips)`,
                  fill: '#F59E0B',
                  fontSize: 10,
                  position: 'top',
                }}
              />
            )}
            {alts.map((alt, idx) => (
              <Line
                key={alt.id}
                type="monotone"
                dataKey={alt.name}
                stroke={colors[idx % colors.length]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-3 rounded-lg bg-space-950/60 border border-slate-800 text-xs text-slate-300 font-mono">
        <span className="text-amber-400 font-semibold">Inflection Rule: </span>
        {sensitivity.directional_shift}
      </div>
    </div>
  );
};
