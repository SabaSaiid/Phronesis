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
  ReferenceLine,
} from 'recharts';
import type { SensitivityAnalysisResult, StructuredDecision } from '../../types';

interface SensitivityChartProps {
  decision: StructuredDecision;
  sensitivity: SensitivityAnalysisResult;
}

export const SensitivityChart: React.FC<SensitivityChartProps> = React.memo(({
  decision,
  sensitivity,
}) => {
  const alts = decision.alternatives;
  const states = decision.states_of_world;

  if (states.length < 2 || alts.length < 2) {
    return (
      <div className="p-4 text-center text-xs font-data text-[var(--text-muted)]">
        Sensitivity chart requires at least 2 states and 2 alternatives.
      </div>
    );
  }

  const s0 = states[0];
  const s1 = states[1];

  const getU = (altId: string, stateId: string): number => {
    const p = decision.payoff_matrix.find(
      (cell) => cell.alternative_id === altId && cell.state_id === stateId
    );
    return p ? p.utility : 50;
  };

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
  const colors = ['#5B7A6B', '#8A8578', '#B8863B', '#1B1F22'];

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
        <div>
          <span className="font-ui font-semibold text-[var(--text-main)]">Expected Utility Curves: </span>
          <span className="font-body text-[var(--text-muted)]">vs. P({s0.name})</span>
        </div>
        <div className="font-data text-[var(--color-ochre)] font-semibold">
          p* = {inflectionP0}% (Flips Decision)
        </div>
      </div>

      <div className="h-60 sm:h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="p0"
              stroke="var(--text-muted)"
              fontSize={10}
              unit="%"
              tickLine={false}
              label={{ value: `P(${s0.name})`, position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 10 }}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={10}
              domain={[0, 100]}
              tickLine={false}
              label={{ value: 'EU', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface-raised)',
                borderColor: 'var(--border-medium)',
                borderRadius: '8px',
                fontSize: '11px',
                color: 'var(--text-main)',
                fontFamily: 'JetBrains Mono',
              }}
              formatter={(value: any, name: any) => [`${value} EU`, name]}
              labelFormatter={(label) => `P(${s0.name}) = ${label}%`}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            {inflectionP0 >= 0 && inflectionP0 <= 100 && (
              <ReferenceLine
                x={inflectionP0}
                stroke="var(--color-ochre)"
                strokeDasharray="4 4"
                label={{
                  value: `p* = ${inflectionP0}%`,
                  fill: 'var(--color-ochre)',
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
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-body leading-relaxed">
        <span className="font-ui font-semibold text-[var(--text-main)]">Sensitivity Shift: </span>
        {sensitivity.directional_shift}
      </div>
    </div>
  );
});

