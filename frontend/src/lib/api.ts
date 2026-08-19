import type {
  StructuredDecision,
  AnalysisBundle,
  ReportResponse,
  BenchmarkItem,
  HistoryItemSummary,
  FlagFeedbackRequest,
  OutcomeRetroRequest,
  DrillDownRequest,
  DrillDownResponse
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

export async function fetchDrillDown(req: DrillDownRequest): Promise<DrillDownResponse> {
  const res = await fetch(`${API_BASE}/analyze/drill-down`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to generate deep dive inquiry');
  }
  return res.json();
}

// V2 Feedback & Local Memory API
export async function submitFlagFeedback(req: FlagFeedbackRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/feedback/flag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error('Failed to record feedback');
  }
}

export async function fetchHistory(): Promise<HistoryItemSummary[]> {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) {
    throw new Error('Failed to fetch decision history');
  }
  return res.json();
}

export async function fetchHistoryItem(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/history/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch decision details');
  }
  return res.json();
}

export async function recordOutcome(decisionId: string, req: OutcomeRetroRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/history/${decisionId}/outcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error('Failed to record outcome retrospective');
  }
}

export async function exportHistory(): Promise<any> {
  const res = await fetch(`${API_BASE}/history/export`);
  if (!res.ok) {
    throw new Error('Failed to export history');
  }
  return res.json();
}

export async function purgeHistory(): Promise<void> {
  const res = await fetch(`${API_BASE}/history/purge`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to purge history');
  }
}

export async function fetchMemorySettings(): Promise<{ memory_enabled: boolean }> {
  const res = await fetch(`${API_BASE}/settings/memory`);
  if (!res.ok) {
    return { memory_enabled: false };
  }
  return res.json();
}

export async function updateMemorySettings(enabled: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/settings/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) {
    throw new Error('Failed to update memory settings');
  }
}
