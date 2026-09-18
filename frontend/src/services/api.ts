import {
  DashboardMetrics,
  MaintenanceRequest,
  BlockPlan,
  Station,
  TrackSection,
  AuditLog,
  TaskExplanation,
  BenchmarkResponse,
  ValidationVerdict
} from '../types';

const API_BASE = '/api/v1';

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE}/metrics/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function fetchTasks(
  department?: string,
  severity?: string,
  status?: string
): Promise<MaintenanceRequest[]> {
  const params = new URLSearchParams();
  if (department && department !== 'ALL') params.append('department', department);
  if (severity && severity !== 'ALL') params.append('severity', severity);
  if (status && status !== 'ALL') params.append('status', status);

  const res = await fetch(`${API_BASE}/tasks?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch maintenance tasks');
  return res.json();
}

export async function fetchLatestSchedule(): Promise<BlockPlan | null> {
  try {
    const res = await fetch(`${API_BASE}/schedules/latest`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchStations(): Promise<Station[]> {
  const res = await fetch(`${API_BASE}/network/stations`);
  if (!res.ok) throw new Error('Failed to fetch stations');
  return res.json();
}

export async function fetchSections(): Promise<TrackSection[]> {
  const res = await fetch(`${API_BASE}/network/sections`);
  if (!res.ok) throw new Error('Failed to fetch sections');
  return res.json();
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE}/audit`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function triggerSync(): Promise<any> {
  const res = await fetch(`${API_BASE}/ingestion/sync`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to sync dataset');
  return res.json();
}

export async function triggerPrioritization(): Promise<any> {
  const res = await fetch(`${API_BASE}/tasks/prioritize`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to execute AI prioritization');
  return res.json();
}

export async function triggerOptimization(horizon: string = 'WEEKLY'): Promise<any> {
  const res = await fetch(`${API_BASE}/optimization/solve?horizon=${encodeURIComponent(horizon)}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to execute CP-SAT optimizer');
  return res.json();
}

export async function fetchBenchmark(horizon: string = 'WEEKLY'): Promise<BenchmarkResponse> {
  const res = await fetch(`${API_BASE}/optimization/benchmark?horizon=${encodeURIComponent(horizon)}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to execute optimization benchmark');
  return res.json();
}

export async function validatePlan(planId: string): Promise<ValidationVerdict> {
  const res = await fetch(`${API_BASE}/schedules/${encodeURIComponent(planId)}/validate`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to execute Sentinel validation');
  return res.json();
}

export async function explainTask(requestId: string): Promise<TaskExplanation> {
  const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(requestId)}/explain`);
  if (!res.ok) throw new Error(`Failed to explain task ${requestId}`);
  return res.json();
}

export async function applyManualOverride(payload: {
  plan_id: string;
  item_id: string;
  new_start: string;
  new_end: string;
  justification: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/schedules/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to apply override' }));
    throw new Error(err.detail || 'Failed to apply override');
  }
  return res.json();
}

export async function approveSchedule(planId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/schedules/${encodeURIComponent(planId)}/approve`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to approve schedule');
  return res.json();
}

export async function publishSchedule(planId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/schedules/${encodeURIComponent(planId)}/publish`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to publish schedule');
  return res.json();
}

export async function triggerTrainDelayDisruption(payload: {
  train_number: string;
  section_id: string;
  delay_minutes: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/disruptions/train-delay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to report disruption' }));
    throw new Error(err.detail || 'Failed to report disruption');
  }
  return res.json();
}
