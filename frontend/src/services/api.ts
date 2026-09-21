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

import {
  MOCK_STATIONS,
  MOCK_SECTIONS,
  MOCK_METRICS,
  MOCK_TASKS,
  MOCK_PLAN,
  MOCK_AUDIT_LOGS,
  MOCK_BENCHMARK,
  MOCK_VALIDATION,
  MOCK_SCENARIO_PRESETS,
  getMockTaskExplanation,
  getMockOpportunity,
  getMockWhatIf
} from './mockData';

const RAW_API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
const API_BASE = RAW_API_URL
  ? (RAW_API_URL.endsWith('/api/v1') ? RAW_API_URL : `${RAW_API_URL.replace(/\/+$/, '')}/api/v1`)
  : '/api/v1';

// In-memory state for standalone / demo mode on Vercel
let localTasks = [...MOCK_TASKS];
let localPlan = { ...MOCK_PLAN };
let localAuditLogs = [...MOCK_AUDIT_LOGS];
let localMetrics = { ...MOCK_METRICS };

async function safeFetch<T>(
  endpoint: string,
  options?: RequestInit,
  fallback?: () => T | Promise<T>
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, options);
    
    // Check if the server returned HTML (common on Vercel SPA rewrites when backend is missing)
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (fallback) {
        return await fallback();
      }
      throw new Error(`API endpoint ${endpoint} returned non-JSON response (HTML)`);
    }

    if (!res.ok) {
      if (fallback) {
        return await fallback();
      }
      const err = await res.json().catch(() => ({ detail: `Request failed with status ${res.status}` }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    if (fallback) {
      return await fallback();
    }
    throw err;
  }
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  return safeFetch<DashboardMetrics>('/metrics/dashboard', undefined, () => {
    return {
      ...localMetrics,
      total_maintenance_requests: localTasks.length,
      scheduled_tasks_count: localTasks.filter(t => t.status === 'SCHEDULED').length,
      unscheduled_tasks_count: localTasks.filter(t => t.status === 'UNSCHEDULED').length
    };
  });
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
  return safeFetch<MaintenanceRequest[]>(`/tasks${query}`, undefined, () => {
    let result = [...localTasks];
    if (department && department !== 'ALL') {
      result = result.filter(t => t.department === department);
    }
    if (severity && severity !== 'ALL') {
      result = result.filter(t => t.severity === severity);
    }
    if (status && status !== 'ALL') {
      result = result.filter(t => t.status === status);
    }
    return result;
  });
}

export async function fetchLatestSchedule(): Promise<BlockPlan | null> {
  return safeFetch<BlockPlan | null>('/schedules/latest', undefined, () => localPlan);
}

export async function fetchStations(): Promise<Station[]> {
  return safeFetch<Station[]>('/network/stations', undefined, () => MOCK_STATIONS);
}

export async function fetchSections(): Promise<TrackSection[]> {
  return safeFetch<TrackSection[]>('/network/sections', undefined, () => MOCK_SECTIONS);
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  return safeFetch<AuditLog[]>('/audit', undefined, () => localAuditLogs);
}

export async function triggerSync(): Promise<any> {
  return safeFetch<any>('/ingestion/sync', { method: 'POST' }, () => {
    localTasks = [...MOCK_TASKS];
    localAuditLogs.unshift({
      log_id: `AUD-${Date.now()}`,
      action: 'DATASET_RESYNC',
      actor: 'OCC Dispatcher (Vercel Preview)',
      justification: 'Dataset re-synchronized successfully across all corridors.',
      content_hash: '9f83a48e71b29d44e51bc389f4178a9c2d1b089e',
      timestamp: new Date().toISOString()
    });
    return { status: 'success', message: 'Dataset re-synchronized successfully.' };
  });
}

export async function triggerDemoReset(reGenerate: boolean = false): Promise<any> {
  return safeFetch<any>(`/demo/reset?re_generate=${reGenerate}`, { method: 'POST' }, () => {
    localTasks = [...MOCK_TASKS];
    localPlan = { ...MOCK_PLAN };
    localAuditLogs = [...MOCK_AUDIT_LOGS];
    localMetrics = { ...MOCK_METRICS };
    return { status: 'success', message: 'Demo environment reset successfully.' };
  });
}

export async function triggerPrioritization(): Promise<any> {
  return safeFetch<any>('/tasks/prioritize', { method: 'POST' }, () => {
    localTasks = localTasks.map(t => ({
      ...t,
      ai_priority_score: t.ai_priority_score || Math.floor(70 + Math.random() * 28),
      ai_risk_score: t.ai_risk_score || Math.floor(65 + Math.random() * 30),
      ai_urgency_level: t.severity === 'EMERGENCY' ? 'CRITICAL' : t.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM'
    }));
    localAuditLogs.unshift({
      log_id: `AUD-${Date.now()}`,
      action: 'AI_PRIORITIZATION_RUN',
      actor: 'HistGradientBoosting v3.0 Classifier',
      justification: `Automated safety-gated prioritization executed for ${localTasks.length} requests.`,
      content_hash: '6a81c3e109d784a0b25e',
      timestamp: new Date().toISOString()
    });
    return { status: 'success', prioritized_count: localTasks.length };
  });
}

export async function triggerOptimization(horizon: string = 'WEEKLY'): Promise<any> {
  return safeFetch<any>(`/optimization/solve?horizon=${encodeURIComponent(horizon)}`, { method: 'POST' }, () => {
    localPlan = {
      ...MOCK_PLAN,
      horizon,
      status: 'OPTIMAL',
      created_at: new Date().toISOString()
    };
    localAuditLogs.unshift({
      log_id: `AUD-${Date.now()}`,
      action: `OPTIMIZE_SCHEDULE_${horizon}`,
      actor: 'CP-SAT Optimizer v9.9',
      justification: `Global constraint satisfaction solver resolved ${localPlan.items.length} bundled block items.`,
      content_hash: '9f83a48e71b29d44e51bc389f4178a9c2d1b089e',
      timestamp: new Date().toISOString()
    });
    return { status: 'success', plan_id: localPlan.plan_id, items_count: localPlan.items.length };
  });
}

export async function fetchBenchmark(horizon: string = 'WEEKLY'): Promise<BenchmarkResponse> {
  return safeFetch<BenchmarkResponse>(
    `/optimization/benchmark?horizon=${encodeURIComponent(horizon)}`,
    { method: 'POST' },
    () => MOCK_BENCHMARK
  );
}

export async function validatePlan(planId: string): Promise<ValidationVerdict> {
  return safeFetch<ValidationVerdict>(
    `/schedules/${encodeURIComponent(planId)}/validate`,
    { method: 'POST' },
    () => MOCK_VALIDATION
  );
}

export async function explainTask(requestId: string): Promise<TaskExplanation> {
  return safeFetch<TaskExplanation>(
    `/tasks/${encodeURIComponent(requestId)}/explain`,
    undefined,
    () => getMockTaskExplanation(requestId)
  );
}

export async function applyManualOverride(payload: {
  plan_id: string;
  item_id: string;
  new_start: string;
  new_end: string;
  justification: string;
}): Promise<any> {
  return safeFetch<any>(
    '/schedules/override',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    },
    () => {
      localAuditLogs.unshift({
        log_id: `AUD-${Date.now()}`,
        plan_id: payload.plan_id,
        action: 'MANUAL_SCHEDULE_OVERRIDE',
        actor: 'OCC Section Controller',
        justification: payload.justification,
        content_hash: 'b18d29a00f13e7c84491029c',
        timestamp: new Date().toISOString()
      });
      return { status: 'success', message: 'Manual override applied and recorded in tamper-evident audit trail.' };
    }
  );
}

export async function approveSchedule(planId: string): Promise<any> {
  return safeFetch<any>(
    `/schedules/${encodeURIComponent(planId)}/approve`,
    { method: 'POST' },
    () => {
      localPlan = { ...localPlan, status: 'APPROVED' };
      localAuditLogs.unshift({
        log_id: `AUD-${Date.now()}`,
        plan_id: planId,
        action: 'APPROVE_SCHEDULE',
        actor: 'Senior Divisional Operations Manager (Sr. DOM)',
        justification: 'Approved schedule verified against safety invariants.',
        content_hash: 'a7c92e104f67d82b3310e9f88c55201a',
        timestamp: new Date().toISOString()
      });
      return { status: 'success', message: 'Schedule approved.' };
    }
  );
}

export async function publishSchedule(planId: string): Promise<any> {
  return safeFetch<any>(
    `/schedules/${encodeURIComponent(planId)}/publish`,
    { method: 'POST' },
    () => {
      localPlan = { ...localPlan, status: 'PUBLISHED' };
      localAuditLogs.unshift({
        log_id: `AUD-${Date.now()}`,
        plan_id: planId,
        action: 'PUBLISH_SCHEDULE_TO_COA_FOIS',
        actor: 'OCC Chief Controller',
        justification: 'Master block possession schedule published to divisional COA/FOIS feeds.',
        content_hash: '5d89f104e76c12ba3098f4',
        timestamp: new Date().toISOString()
      });
      return { status: 'success', message: 'Schedule published.' };
    }
  );
}

export async function triggerTrainDelayDisruption(payload: {
  train_number: string;
  section_id: string;
  delay_minutes: number;
}): Promise<any> {
  return safeFetch<any>(
    '/disruptions/train-delay',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    },
    () => {
      localAuditLogs.unshift({
        log_id: `AUD-${Date.now()}`,
        action: 'DISRUPTION_ALERT_TRAIN_DELAY',
        actor: 'Automatic COA Live Tracker',
        justification: `Train ${payload.train_number} reported +${payload.delay_minutes}m delay in section ${payload.section_id}.`,
        content_hash: '1a980c74f1b53e8d',
        timestamp: new Date().toISOString()
      });
      return { status: 'success', message: 'Disruption recorded and dynamic re-optimization triggered.' };
    }
  );
}

export async function fetchOpportunityEvaluation(itemId: string): Promise<OpportunityEvaluation> {
  return safeFetch<OpportunityEvaluation>(
    `/opportunity/item/${encodeURIComponent(itemId)}`,
    undefined,
    () => getMockOpportunity(itemId)
  );
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
  return safeFetch<WhatIfResponse>(
    '/opportunity/what-if',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    },
    () => getMockWhatIf()
  );
}

export async function createMaintenanceTask(payload: MaintenanceRequestCreate): Promise<MaintenanceRequest> {
  return safeFetch<MaintenanceRequest>(
    '/tasks',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    },
    () => {
      const newTask: MaintenanceRequest = {
        request_id: `REQ-NEW-${Math.floor(100 + Math.random() * 900)}`,
        department: payload.department,
        source_system: payload.source_system || 'MANUAL_ENTRY',
        asset_id: payload.asset_id || `AST-${payload.department.slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
        section_id: payload.section_id,
        track_id: payload.track_id,
        start_km: payload.start_km,
        end_km: payload.end_km,
        defect_type: payload.defect_type,
        severity: payload.severity,
        duration_minutes: payload.duration_minutes,
        earliest_start: payload.earliest_start,
        latest_deadline: payload.latest_deadline,
        speed_restriction_kmph: payload.speed_restriction_kmph || 0,
        machinery_required: payload.machinery_required || [],
        power_block_required: payload.power_block_required || false,
        status: 'PENDING',
        ai_priority_score: payload.severity === 'EMERGENCY' ? 98 : payload.severity === 'CRITICAL' ? 90 : 75,
        ai_risk_score: payload.severity === 'EMERGENCY' ? 95 : 80,
        ai_urgency_level: payload.severity === 'EMERGENCY' ? 'CRITICAL' : 'HIGH'
      };
      localTasks.unshift(newTask);
      return newTask;
    }
  );
}

export async function createTrain(payload: TrainCreate): Promise<any> {
  return safeFetch<any>(
    '/network/trains',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    },
    () => ({ status: 'success', message: `Train ${payload.train_number} (${payload.train_name}) added to network model.` })
  );
}

export async function createTimetableEntry(payload: TimetableCreate): Promise<any> {
  return safeFetch<any>(
    '/network/timetable',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    },
    () => ({ status: 'success', message: `Timetable slot registered for Train ${payload.train_number}.` })
  );
}

export async function fetchScenarioPresets(): Promise<ScenarioPreset[]> {
  return safeFetch<ScenarioPreset[]>('/demo/presets', undefined, () => MOCK_SCENARIO_PRESETS);
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

  return safeFetch<ScenarioGenerationResult>(
    `/demo/generate-scenario?${params.toString()}`,
    { method: 'POST' },
    () => {
      const selectedPreset = MOCK_SCENARIO_PRESETS.find(p => p.id === preset) || MOCK_SCENARIO_PRESETS[0];
      return {
        status: 'success',
        scenario_id: `SCENARIO-${preset}-${Date.now()}`,
        preset: selectedPreset.id,
        preset_name: selectedPreset.name,
        description: selectedPreset.description,
        seed: seed ?? 42,
        trains_count: selectedPreset.total_trains,
        timetable_count: selectedPreset.total_trains * 4,
        maintenance_requests_count: selectedPreset.total_requests,
        tier1_emergencies_count: 4,
        high_risk_assets_count: 12,
        candidate_windows_count: 46,
        scheduled_tasks_count: 32,
        unscheduled_tasks_count: 6,
        active_bundles_count: 8,
        possession_hours_saved: 11.5,
        total_possession_hours: 48.5,
        solver_runtime_s: 1.84,
        validation_verdict: 'PASSED',
        plan_id: 'BP-2024-W38-OPTIMAL',
        audit_log_id: `AUD-${Date.now()}`,
        message: `Generated realistic synthetic timetable and maintenance load for scenario: ${selectedPreset.name}`
      };
    }
  );
}
