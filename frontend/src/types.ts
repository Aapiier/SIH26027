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
  scheduled_rate_percentage: number;
  critical_emergency_count: number;
  total_block_possession_hours: number;
  total_saved_possession_minutes: number;
  multi_department_bundled_blocks: number;
  solver_latest_runtime_s: number;
  active_plan_status: string;
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
