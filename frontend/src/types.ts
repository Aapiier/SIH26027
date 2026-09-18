export interface Station {
  code: string;
  name: string;
  division: string;
  zone: string;
  x: number;
  y: number;
  platforms: number;
}

export interface TrackSection {
  section_id: string;
  from_stn: string;
  to_stn: string;
  distance_km: number;
  line_type: string;
  tracks: number;
  max_speed: number;
  headway_mins: number;
}

export interface MaintenanceRequest {
  request_id: string;
  department: 'ENGINEERING' | 'SIGNAL_TELECOM' | 'TRD';
  source_system: string;
  asset_id: string;
  section_id: string;
  track_id: string;
  start_km: number;
  end_km: number;
  defect_type: string;
  severity: 'EMERGENCY' | 'CRITICAL' | 'URGENT' | 'ROUTINE';
  duration_minutes: number;
  earliest_start: string;
  latest_deadline: string;
  speed_restriction_kmph: number;
  machinery_required: string[];
  power_block_required: boolean;
  elementary_section_id?: string;
  status: 'PENDING' | 'SCHEDULED' | 'UNSCHEDULED' | 'OVERRIDDEN' | 'COMPLETED';
  scenario_tag?: string;
  ai_priority_score?: number;
  ai_risk_score?: number;
  ai_urgency_level?: string;
  unscheduled_reason?: string;
}

export interface BlockPlanItem {
  item_id: string;
  plan_id: string;
  window_id?: string;
  section_id: string;
  track_id: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  bundled_task_ids: string[];
  assigned_resource_ids: string[];
  justification?: string;
  validation_status: 'PASSED' | 'CONFLICT';
  conflict_reason?: string;
}

export interface BlockPlan {
  plan_id: string;
  horizon: string;
  status: string;
  solver_runtime_s: number;
  total_saved_minutes: number;
  total_blocks_scheduled: number;
  total_tasks_scheduled: number;
  total_unscheduled_tasks: number;
  content_hash: string;
  created_at: string;
  items: BlockPlanItem[];
}

export interface DashboardMetrics {
  asset_availability_percentage: number;
  total_maintenance_requests: number;
  scheduled_tasks_count: number;
  unscheduled_tasks_count: number;
  scheduled_rate_percentage: number;
  emergency_tasks_count: number;
  critical_emergency_count: number;
  active_blocks_count: number;
  total_block_possession_hours: number;
  total_saved_possession_minutes: number;
  total_saved_possession_hours: number;
  multi_department_bundled_blocks: number;
  cross_dept_bundles_count: number;
  solver_latest_runtime_s: number;
  active_plan_status: string;
  validation_status: string;
  plan_id?: string;
  content_hash?: string;
  horizon: string;
  corridor: string;
  model_version: string;
}

export interface AssetInfo {
  asset_id: string;
  asset_name: string;
  category: string;
  department: string;
  health_index: number;
  last_inspected_days_ago: number;
  criticality_weight: number;
  section_id: string;
  track_id: string;
  start_km: number;
  end_km: number;
}

export interface AIRiskContext {
  predicted_failure_risk: number;
  prediction_horizon: string;
  prediction_target: string;
  model_name: string;
  model_version: string;
  calibrated_threshold: number;
  synthetic_notice: string;
  feature_attributions: Record<string, number>;
  tier: string;
  tier_description: string;
}

export interface TaskExplanation {
  request_id: string;
  status: 'SCHEDULED' | 'UNSCHEDULED';
  explanation: string;
  root_cause?: string;
  recommendation?: string;
  block_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  duration_minutes?: number;
  is_bundled?: boolean;
  bundled_task_ids?: string[];
  asset_info?: AssetInfo;
  ai_risk_context?: AIRiskContext;
}

export interface BenchmarkMetrics {
  scheduled_tasks_count: number;
  unscheduled_tasks_count: number;
  scheduled_rate_pct: number;
  scheduled_emergency_count: number;
  scheduled_critical_count: number;
  total_tasks_duration_hours: number;
  total_block_possession_hours: number;
  block_possession_hours_saved: number;
  active_bundles_count: number;
  tasks_in_bundles_count: number;
  cross_department_bundles_count: number;
  weighted_priority_captured: number;
  weighted_risk_captured: number;
  solver_status: string;
  solver_runtime_s: number;
  algorithm_name: string;
}

export interface BenchmarkResponse {
  status: string;
  scenario: string;
  planning_horizon: string;
  total_input_requests: number;
  candidate_windows_available: number;
  baseline: BenchmarkMetrics;
  cpsat_optimizer: BenchmarkMetrics;
  comparison_deltas: {
    possession_hours_saved_delta: number;
    possession_reduction_pct: number;
    bundles_created_delta: number;
    cross_department_bundles_delta: number;
    runtime_difference_s: number;
  };
}

export interface ValidationVerdict {
  status: string;
  validation_verdict: {
    plan_id: string;
    overall_verdict: 'PASSED' | 'FAILED';
    validated_items_count: number;
    conflicts_detected: number;
    content_hash: string;
    details: Array<{
      item_id: string;
      status: 'PASSED' | 'FAILED';
      reasons?: string[];
    }>;
  };
}

export interface AuditLog {
  log_id: string;
  plan_id?: string;
  action: string;
  actor: string;
  previous_state?: any;
  new_state?: any;
  justification?: string;
  content_hash: string;
  timestamp: string;
}

export interface AlternativeWindow {
  window_id: string;
  window_label: string;
  duration_minutes: number;
  score: number;
  status: 'ALTERNATIVE' | 'SUBOPTIMAL' | 'INFEASIBLE';
  reason: string;
}

export interface OpportunityEvaluation {
  item_id: string;
  score: number;
  recommended_window: string;
  section_id: string;
  track_id: string;
  tasks_count: number;
  departments: string[];
  high_risk_assets_addressed: number;
  reasons: string[];
  breakdown: Record<string, number>;
  alternatives: AlternativeWindow[];
  tooltip: string;
}

export interface WhatIfResponse {
  status: string;
  perturbation_type: string;
  current_plan: {
    possession_hours: number;
    scheduled_tasks: number;
    combined_blocks: number;
    total_blocks: number;
  };
  what_if_plan: {
    possession_hours: number;
    scheduled_tasks: number;
    combined_blocks: number;
    total_blocks: number;
  };
  impact: {
    possession_delta_hours: number;
    possession_delta_label: string;
    bundles_lost: number;
    bundles_lost_label: string;
    blocks_moved: number;
    blocks_moved_label: string;
    conflicts_detected: string[];
    reasons: string[];
    is_feasible: boolean;
  };
}

