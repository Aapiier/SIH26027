import {
  DashboardMetrics,
  MaintenanceRequest,
  MaintenanceRequestCreate,
  TrainCreate,
  TimetableCreate,
  BlockPlan,
  Station,
  TrackSection,
  AuditLog,
  TaskExplanation,
  BenchmarkResponse,
  ValidationVerdict,
  OpportunityEvaluation,
  WhatIfResponse,
  ScenarioPreset,
  ScenarioGenerationResult
} from '../types';

const RAW_API_URL = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_BACKEND_URL;
const API_BASE = RAW_API_URL
  ? (RAW_API_URL.endsWith('/api/v1') ? RAW_API_URL : `${RAW_API_URL.replace(/\/+$/, '')}/api/v1`)
  : '/api/v1';

/**
 * Safe fetch wrapper that validates Content-Type and handles non-JSON / HTML fallback responses
 * preventing "Unexpected token '<', <!doctype... is not valid JSON" errors after deployment.
 */
async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error(`Unable to connect to backend server at ${API_BASE}. ${netErr.message || ''}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Backend API endpoint returned non-JSON response (${res.status} ${res.statusText}). Ensure backend server is running and accessible.`
    );
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: `HTTP error ${res.status}: ${res.statusText}` }));
    throw new Error(errorBody.detail || errorBody.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  return fetchJson<DashboardMetrics>('/metrics/dashboard');
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

  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchJson<MaintenanceRequest[]>(`/tasks${query}`);
}

export async function fetchLatestSchedule(): Promise<BlockPlan | null> {
  try {
    return await fetchJson<BlockPlan>('/schedules/latest');
  } catch {
    return null;
  }
}

export async function fetchStations(): Promise<Station[]> {
  return fetchJson<Station[]>('/network/stations');
}

export async function fetchSections(): Promise<TrackSection[]> {
  return fetchJson<TrackSection[]>('/network/sections');
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  return fetchJson<AuditLog[]>('/audit');
}

export async function triggerSync(): Promise<any> {
  return fetchJson<any>('/ingestion/sync', { method: 'POST' });
}

export async function triggerDemoReset(reGenerate: boolean = false): Promise<any> {
  return fetchJson<any>(`/demo/reset?re_generate=${reGenerate}`, { method: 'POST' });
}

export async function triggerPrioritization(): Promise<any> {
  return fetchJson<any>('/tasks/prioritize', { method: 'POST' });
}

export async function triggerOptimization(horizon: string = 'WEEKLY'): Promise<any> {
  return fetchJson<any>(`/optimization/solve?horizon=${encodeURIComponent(horizon)}`, { method: 'POST' });
}

export async function fetchBenchmark(horizon: string = 'WEEKLY'): Promise<BenchmarkResponse> {
  return fetchJson<BenchmarkResponse>(`/optimization/benchmark?horizon=${encodeURIComponent(horizon)}`, { method: 'POST' });
}

export async function validatePlan(planId: string): Promise<ValidationVerdict> {
  return fetchJson<ValidationVerdict>(`/schedules/${encodeURIComponent(planId)}/validate`, { method: 'POST' });
}

export async function explainTask(requestId: string): Promise<TaskExplanation> {
  return fetchJson<TaskExplanation>(`/tasks/${encodeURIComponent(requestId)}/explain`);
}

export async function applyManualOverride(payload: {
  plan_id: string;
  item_id: string;
  new_start: string;
  new_end: string;
  justification: string;
}): Promise<any> {
  return fetchJson<any>('/schedules/override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function approveSchedule(planId: string): Promise<any> {
  return fetchJson<any>(`/schedules/${encodeURIComponent(planId)}/approve`, { method: 'POST' });
}

export async function publishSchedule(planId: string): Promise<any> {
  return fetchJson<any>(`/schedules/${encodeURIComponent(planId)}/publish`, { method: 'POST' });
}

export async function triggerTrainDelayDisruption(payload: {
  train_number: string;
  section_id: string;
  delay_minutes: number;
}): Promise<any> {
  return fetchJson<any>('/disruptions/train-delay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function fetchOpportunityEvaluation(itemId: string): Promise<OpportunityEvaluation> {
  return fetchJson<OpportunityEvaluation>(`/opportunity/item/${encodeURIComponent(itemId)}`);
}

export async function simulateWhatIf(payload: {
  perturbation_type: string;
  train_number?: string;
  section_id?: string;
  delay_minutes?: number;
  item_id?: string;
  extra_minutes?: number;
  shift_minutes?: number;
}): Promise<WhatIfResponse> {
  return fetchJson<WhatIfResponse>('/opportunity/what-if', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function createMaintenanceTask(payload: MaintenanceRequestCreate): Promise<MaintenanceRequest> {
  return fetchJson<MaintenanceRequest>('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function createTrain(payload: TrainCreate): Promise<any> {
  return fetchJson<any>('/network/trains', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function createTimetableEntry(payload: TimetableCreate): Promise<any> {
  return fetchJson<any>('/network/timetable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function fetchScenarioPresets(): Promise<ScenarioPreset[]> {
  return fetchJson<ScenarioPreset[]>('/demo/presets');
}

export async function triggerGenerateScenario(
  preset: string = 'BALANCED_OPERATIONS',
  seed?: number
): Promise<ScenarioGenerationResult> {
  const params = new URLSearchParams();
  params.append('preset', preset);
  if (seed !== undefined && seed !== null) {
    params.append('seed', seed.toString());
  }

  return fetchJson<ScenarioGenerationResult>(`/demo/generate-scenario?${params.toString()}`, {
    method: 'POST'
  });
}
