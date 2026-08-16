import type {
  StructuredDecision,
  AnalysisBundle,
  ReportResponse,
  BenchmarkItem
} from '../types';

const API_BASE = '/api/v1';

export async function fetchBenchmarks(): Promise<BenchmarkItem[]> {
  const res = await fetch(`${API_BASE}/benchmarks`);
  if (!res.ok) {
    throw new Error(`Failed to load benchmarks: ${res.statusText}`);
  }
  return res.json();
}

export async function extractDecision(narrative: string): Promise<StructuredDecision> {
  const res = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ narrative }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to extract decision');
  }
  const data = await res.json();
  return data.structured_decision;
}

export async function runDeterministicAnalysis(decision: StructuredDecision): Promise<AnalysisBundle> {
  const res = await fetch(`${API_BASE}/analyze/deterministic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decision),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to run analysis');
  }
  return res.json();
}

export async function synthesizeReport(bundle: AnalysisBundle): Promise<ReportResponse> {
  const res = await fetch(`${API_BASE}/report/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to synthesize report');
  }
  return res.json();
}

export async function fetchCounterargument(decision: StructuredDecision, leadingAltId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/analyze/counterargument`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structured_decision: decision,
      leading_alternative_id: leadingAltId,
    }),
  });
  if (!res.ok) {
    throw new Error('Failed to generate counterargument');
  }
  const data = await res.json();
  return data.steelmanned_counterargument;
}
