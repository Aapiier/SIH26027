import {
  Station,
  TrackSection,
  MaintenanceRequest,
  BlockPlan,
  DashboardMetrics,
  AuditLog,
  TaskExplanation,
  BenchmarkResponse,
  ValidationVerdict,
  OpportunityEvaluation,
  WhatIfResponse,
  ScenarioPreset,
  ScenarioGenerationResult
} from '../types';

export const MOCK_STATIONS: Station[] = [
  { code: 'NDLS', name: 'New Delhi', division: 'Delhi', zone: 'NR', x: 100, y: 250, platforms: 16 },
  { code: 'ANVT', name: 'Anand Vihar Terminal', division: 'Delhi', zone: 'NR', x: 180, y: 210, platforms: 7 },
  { code: 'GZB', name: 'Ghaziabad Junction', division: 'Delhi', zone: 'NR', x: 260, y: 250, platforms: 8 },
  { code: 'ALJN', name: 'Aligarh Junction', division: 'Prayagraj', zone: 'NCR', x: 420, y: 280, platforms: 7 },
  { code: 'TDL', name: 'Tundla Junction', division: 'Prayagraj', zone: 'NCR', x: 560, y: 320, platforms: 5 },
  { code: 'ETW', name: 'Etawah Junction', division: 'Prayagraj', zone: 'NCR', x: 700, y: 350, platforms: 5 },
  { code: 'CNB', name: 'Kanpur Central', division: 'Prayagraj', zone: 'NCR', x: 860, y: 380, platforms: 10 },
  { code: 'PRYJ', name: 'Prayagraj Junction', division: 'Prayagraj', zone: 'NCR', x: 1020, y: 420, platforms: 10 }
];

export const MOCK_SECTIONS: TrackSection[] = [
  { section_id: 'NDLS-GZB', from_stn: 'NDLS', to_stn: 'GZB', distance_km: 25.0, line_type: 'QUADRUPLE', tracks: 4, max_speed: 110, headway_mins: 8 },
  { section_id: 'ANVT-GZB', from_stn: 'ANVT', to_stn: 'GZB', distance_km: 15.0, line_type: 'DOUBLE', tracks: 2, max_speed: 90, headway_mins: 10 },
  { section_id: 'GZB-ALJN', from_stn: 'GZB', to_stn: 'ALJN', distance_km: 105.0, line_type: 'DOUBLE', tracks: 2, max_speed: 130, headway_mins: 10 },
  { section_id: 'ALJN-TDL', from_stn: 'ALJN', to_stn: 'TDL', distance_km: 78.0, line_type: 'DOUBLE', tracks: 2, max_speed: 130, headway_mins: 10 },
  { section_id: 'TDL-ETW', from_stn: 'TDL', to_stn: 'ETW', distance_km: 92.0, line_type: 'DOUBLE', tracks: 2, max_speed: 130, headway_mins: 10 },
  { section_id: 'ETW-CNB', from_stn: 'ETW', to_stn: 'CNB', distance_km: 139.0, line_type: 'DOUBLE', tracks: 2, max_speed: 130, headway_mins: 10 },
  { section_id: 'CNB-PRYJ', from_stn: 'CNB', to_stn: 'PRYJ', distance_km: 194.0, line_type: 'DOUBLE', tracks: 2, max_speed: 130, headway_mins: 10 }
];

export const MOCK_METRICS: DashboardMetrics = {
  asset_availability_percentage: 97.4,
  total_maintenance_requests: 38,
  scheduled_tasks_count: 32,
  unscheduled_tasks_count: 6,
  scheduled_rate_percentage: 84.2,
  emergency_tasks_count: 4,
  critical_emergency_count: 9,
  active_blocks_count: 14,
  total_block_possession_hours: 48.5,
  total_saved_possession_minutes: 690,
  total_saved_possession_hours: 11.5,
  multi_department_bundled_blocks: 8,
  cross_dept_bundles_count: 8,
  solver_latest_runtime_s: 1.84,
  active_plan_status: 'OPTIMAL',
  validation_status: 'PASSED',
  plan_id: 'BP-2024-W38-OPTIMAL',
  content_hash: '9f83a48e71b29d44e51bc389f4178a9c2d1b089e',
  horizon: 'WEEKLY',
  corridor: 'NDLS–PRYJ (High Density Trunk)',
  model_version: 'HistGradientBoosting v3.0'
};

export const MOCK_TASKS: MaintenanceRequest[] = [
  {
    request_id: 'REQ-2024-001',
    department: 'ENGINEERING',
    source_system: 'TMS',
    asset_id: 'AST-PWAY-084',
    section_id: 'GZB-ALJN',
    track_id: 'DN_MAIN',
    start_km: 42.5,
    end_km: 44.0,
    defect_type: 'Deep Ballast Screening & Tamping',
    severity: 'CRITICAL',
    duration_minutes: 180,
    earliest_start: new Date(Date.now() + 3600000).toISOString(),
    latest_deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    speed_restriction_kmph: 30,
    machinery_required: ['CSM-09-32', 'DGS-62N'],
    power_block_required: false,
    status: 'SCHEDULED',
    ai_priority_score: 94.2,
    ai_risk_score: 88.5,
    ai_urgency_level: 'HIGH'
  },
  {
    request_id: 'REQ-2024-002',
    department: 'TRD',
    source_system: 'TDMS',
    asset_id: 'AST-OHE-119',
    section_id: 'GZB-ALJN',
    track_id: 'DN_MAIN',
    start_km: 43.1,
    end_km: 43.8,
    defect_type: 'Contact Wire Replacement & Dropper Adjustment',
    severity: 'CRITICAL',
    duration_minutes: 150,
    earliest_start: new Date(Date.now() + 3600000).toISOString(),
    latest_deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    speed_restriction_kmph: 0,
    machinery_required: ['OHE-TOWER-WAGON'],
    power_block_required: true,
    elementary_section_id: 'ES-GZB-43',
    status: 'SCHEDULED',
    ai_priority_score: 91.0,
    ai_risk_score: 85.0,
    ai_urgency_level: 'HIGH'
  },
  {
    request_id: 'REQ-2024-003',
    department: 'SIGNAL_TELECOM',
    source_system: 'SMMS',
    asset_id: 'AST-SIG-042',
    section_id: 'GZB-ALJN',
    track_id: 'DN_MAIN',
    start_km: 43.0,
    end_km: 43.5,
    defect_type: 'Axle Counter & Track Circuit Calibration',
    severity: 'URGENT',
    duration_minutes: 90,
    earliest_start: new Date(Date.now() + 3600000).toISOString(),
    latest_deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    speed_restriction_kmph: 0,
    machinery_required: ['TEST-RIG-ST'],
    power_block_required: false,
    status: 'SCHEDULED',
    ai_priority_score: 86.4,
    ai_risk_score: 79.2,
    ai_urgency_level: 'MEDIUM'
  },
  {
    request_id: 'REQ-2024-004',
    department: 'ENGINEERING',
    source_system: 'TMS',
    asset_id: 'AST-PWAY-091',
    section_id: 'ALJN-TDL',
    track_id: 'UP_MAIN',
    start_km: 112.0,
    end_km: 114.5,
    defect_type: 'Ultrasonic Flaw Detection (USFD) Rail Testing',
    severity: 'EMERGENCY',
    duration_minutes: 240,
    earliest_start: new Date(Date.now() + 7200000).toISOString(),
    latest_deadline: new Date(Date.now() + 86400000).toISOString(),
    speed_restriction_kmph: 20,
    machinery_required: ['SPURT-CAR'],
    power_block_required: false,
    status: 'SCHEDULED',
    ai_priority_score: 98.6,
    ai_risk_score: 96.0,
    ai_urgency_level: 'CRITICAL'
  },
  {
    request_id: 'REQ-2024-005',
    department: 'TRD',
    source_system: 'TDMS',
    asset_id: 'AST-OHE-204',
    section_id: 'TDL-ETW',
    track_id: 'DN_MAIN',
    start_km: 201.2,
    end_km: 203.0,
    defect_type: 'Isolator & Cantilever Assembly Overhaul',
    severity: 'ROUTINE',
    duration_minutes: 120,
    earliest_start: new Date(Date.now() + 86400000).toISOString(),
    latest_deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    speed_restriction_kmph: 0,
    machinery_required: ['OHE-LADDER-TROLLEY'],
    power_block_required: true,
    status: 'SCHEDULED',
    ai_priority_score: 64.0,
    ai_risk_score: 48.0,
    ai_urgency_level: 'LOW'
  },
  {
    request_id: 'REQ-2024-006',
    department: 'ENGINEERING',
    source_system: 'TMS',
    asset_id: 'AST-PWAY-155',
    section_id: 'CNB-PRYJ',
    track_id: 'DN_MAIN',
    start_km: 340.0,
    end_km: 342.0,
    defect_type: 'Turnout Renewal & Switch Setting',
    severity: 'URGENT',
    duration_minutes: 210,
    earliest_start: new Date(Date.now() + 86400000).toISOString(),
    latest_deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    speed_restriction_kmph: 45,
    machinery_required: ['UNIMAT-08-4S'],
    power_block_required: false,
    status: 'UNSCHEDULED',
    unscheduled_reason: 'Timetable headway constraints: No shadow window with >= 210m uninterrupted slot found.',
    ai_priority_score: 78.5,
    ai_risk_score: 72.0,
    ai_urgency_level: 'MEDIUM'
  }
];

export const MOCK_PLAN: BlockPlan = {
  plan_id: 'BP-2024-W38-OPTIMAL',
  horizon: 'WEEKLY',
  status: 'PUBLISHED',
  solver_runtime_s: 1.84,
  total_saved_minutes: 690,
  total_blocks_scheduled: 14,
  total_tasks_scheduled: 32,
  total_unscheduled_tasks: 6,
  content_hash: '9f83a48e71b29d44e51bc389f4178a9c2d1b089e',
  created_at: new Date().toISOString(),
  items: [
    {
      item_id: 'BLK-001',
      plan_id: 'BP-2024-W38-OPTIMAL',
      window_id: 'WIN-GZB-ALJN-01',
      section_id: 'GZB-ALJN',
      track_id: 'DN_MAIN',
      scheduled_start: new Date(Date.now() + 7200000).toISOString(),
      scheduled_end: new Date(Date.now() + 18000000).toISOString(),
      duration_minutes: 180,
      bundled_task_ids: ['REQ-2024-001', 'REQ-2024-002', 'REQ-2024-003'],
      assigned_resource_ids: ['CSM-09-32', 'OHE-TOWER-WAGON', 'TEAM-SIG-02'],
      justification: 'Triple-Department Coordinated Possession: P-Way tamping, OHE wire overhaul, and S&T calibration combined into a single 180m shadow slot.',
      validation_status: 'PASSED'
    },
    {
      item_id: 'BLK-002',
      plan_id: 'BP-2024-W38-OPTIMAL',
      window_id: 'WIN-ALJN-TDL-02',
      section_id: 'ALJN-TDL',
      track_id: 'UP_MAIN',
      scheduled_start: new Date(Date.now() + 21600000).toISOString(),
      scheduled_end: new Date(Date.now() + 36000000).toISOString(),
      duration_minutes: 240,
      bundled_task_ids: ['REQ-2024-004'],
      assigned_resource_ids: ['SPURT-CAR'],
      justification: 'Emergency USFD testing on high-speed UP line during nocturnal freight window.',
      validation_status: 'PASSED'
    },
    {
      item_id: 'BLK-003',
      plan_id: 'BP-2024-W38-OPTIMAL',
      window_id: 'WIN-TDL-ETW-01',
      section_id: 'TDL-ETW',
      track_id: 'DN_MAIN',
      scheduled_start: new Date(Date.now() + 54000000).toISOString(),
      scheduled_end: new Date(Date.now() + 61200000).toISOString(),
      duration_minutes: 120,
      bundled_task_ids: ['REQ-2024-005'],
      assigned_resource_ids: ['OHE-LADDER-TROLLEY'],
      justification: 'Routine TRD power block aligned with off-peak passenger spacing.',
      validation_status: 'PASSED'
    }
  ]
};

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    log_id: 'AUD-001',
    plan_id: 'BP-2024-W38-OPTIMAL',
    action: 'OPTIMIZE_SCHEDULE_WEEKLY',
    actor: 'CP-SAT Optimizer v9.9',
    justification: 'Global mathematical optimization across 38 maintenance tasks and 120 trains.',
    content_hash: '9f83a48e71b29d44e51bc389f4178a9c2d1b089e',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    log_id: 'AUD-002',
    plan_id: 'BP-2024-W38-OPTIMAL',
    action: 'SENTINEL_SAFETY_VALIDATION',
    actor: 'Sentinel Validator (Automated)',
    justification: 'Verified 7 physical safety invariants. 0 Headway violations, 0 Power isolation conflicts.',
    content_hash: '3a18e28b12f6a91c01e89b2110c73e04',
    timestamp: new Date(Date.now() - 3300000).toISOString()
  },
  {
    log_id: 'AUD-003',
    plan_id: 'BP-2024-W38-OPTIMAL',
    action: 'APPROVE_AND_PUBLISH',
    actor: 'Senior Divisional Operations Manager (Sr. DOM)',
    justification: 'Approved master block schedule with 11.5 hours of corridor downtime savings.',
    content_hash: 'a7c92e104f67d82b3310e9f88c55201a',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  }
];

export const MOCK_BENCHMARK: BenchmarkResponse = {
  status: 'OPTIMAL',
  scenario: 'High-Density Trunk Corridor (NDLS–PRYJ)',
  planning_horizon: 'WEEKLY',
  total_input_requests: 38,
  candidate_windows_available: 46,
  baseline: {
    scheduled_tasks_count: 24,
    unscheduled_tasks_count: 14,
    scheduled_rate_pct: 63.1,
    scheduled_emergency_count: 4,
    scheduled_critical_count: 7,
    total_tasks_duration_hours: 60.0,
    total_block_possession_hours: 60.0,
    block_possession_hours_saved: 0.0,
    active_bundles_count: 0,
    tasks_in_bundles_count: 0,
    cross_department_bundles_count: 0,
    weighted_priority_captured: 1840.5,
    weighted_risk_captured: 1620.0,
    solver_status: 'HEURISTIC_BASELINE',
    solver_runtime_s: 0.02,
    algorithm_name: 'Manual Sequential Departmental Allocation'
  },
  cpsat_optimizer: {
    scheduled_tasks_count: 32,
    unscheduled_tasks_count: 6,
    scheduled_rate_pct: 84.2,
    scheduled_emergency_count: 4,
    scheduled_critical_count: 9,
    total_tasks_duration_hours: 60.0,
    total_block_possession_hours: 48.5,
    block_possession_hours_saved: 11.5,
    active_bundles_count: 8,
    tasks_in_bundles_count: 18,
    cross_department_bundles_count: 8,
    weighted_priority_captured: 2460.0,
    weighted_risk_captured: 2310.5,
    solver_status: 'OPTIMAL',
    solver_runtime_s: 1.84,
    algorithm_name: 'RailSync AI CP-SAT Multi-Commodity Optimizer'
  },
  comparison_deltas: {
    possession_hours_saved_delta: 11.5,
    possession_reduction_pct: 19.17,
    bundles_created_delta: 8,
    cross_department_bundles_delta: 8,
    runtime_difference_s: 1.82
  }
};

export const MOCK_VALIDATION: ValidationVerdict = {
  status: 'SUCCESS',
  validation_verdict: {
    plan_id: 'BP-2024-W38-OPTIMAL',
    overall_verdict: 'PASSED',
    validated_items_count: 3,
    conflicts_detected: 0,
    content_hash: '9f83a48e71b29d44e51bc389f4178a9c2d1b089e',
    details: [
      { item_id: 'BLK-001', status: 'PASSED', reasons: ['Headway buffer >= 15m verified', 'OHE isolation window matched'] },
      { item_id: 'BLK-002', status: 'PASSED', reasons: ['Freight transit re-routed successfully'] },
      { item_id: 'BLK-003', status: 'PASSED', reasons: ['Traction feeder clear'] }
    ]
  }
};

export const MOCK_SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'BALANCED_OPERATIONS',
    name: 'Balanced Operations (Baseline)',
    description: 'Standard mixed passenger and freight density on the NDLS–PRYJ corridor.',
    planning_days: 7,
    total_trains: 120,
    total_requests: 38
  },
  {
    id: 'HIGH_CONGESTION_PEAK',
    name: 'High Congestion Festival Surge',
    description: 'Heavy passenger train load with reduced shadow window availability.',
    planning_days: 7,
    total_trains: 160,
    total_requests: 45
  },
  {
    id: 'MONSOON_EMERGENCY_DEGRADATION',
    name: 'Monsoon Infrastructure Stress',
    description: 'Elevated asset defect rate requiring urgent P-Way and TRD bundling.',
    planning_days: 7,
    total_trains: 110,
    total_requests: 52
  }
];

export function getMockTaskExplanation(requestId: string): TaskExplanation {
  const task = MOCK_TASKS.find((t) => t.request_id === requestId) || MOCK_TASKS[0];
  const isScheduled = task.status === 'SCHEDULED';

  return {
    request_id: requestId,
    status: isScheduled ? 'SCHEDULED' : 'UNSCHEDULED',
    explanation: isScheduled
      ? `Task ${requestId} was successfully assigned to block BLK-001. Cross-department bundling reduced total possession time by 120 minutes.`
      : `Task ${requestId} could not be placed due to tight timetable headway constraints without causing >30m passenger train delays.`,
    root_cause: isScheduled ? undefined : 'Peak express train transit cluster between 14:00 and 17:30.',
    recommendation: isScheduled
      ? 'Execute alongside OHE maintenance crew with combined power block isolation.'
      : 'Consider shifting to the nocturnal freight window on Day 3 or applying a manual override.',
    block_id: isScheduled ? 'BLK-001' : undefined,
    duration_minutes: task.duration_minutes,
    is_bundled: isScheduled,
    bundled_task_ids: isScheduled ? ['REQ-2024-001', 'REQ-2024-002', 'REQ-2024-003'] : [],
    asset_info: {
      asset_id: task.asset_id,
      asset_name: `${task.department} Primary Track Asset (${task.track_id})`,
      category: task.department === 'ENGINEERING' ? 'Track / Permanent Way' : task.department === 'TRD' ? 'Traction Overhead 25kV' : 'Signaling & Telecom',
      department: task.department,
      health_index: 74.5,
      last_inspected_days_ago: 12,
      criticality_weight: 0.88,
      section_id: task.section_id,
      track_id: task.track_id,
      start_km: task.start_km,
      end_km: task.end_km
    },
    ai_risk_context: {
      predicted_failure_risk: (task.ai_risk_score || 80) / 100,
      prediction_horizon: '14 Days',
      prediction_target: 'Degradation Exceedance (Speed Restriction / Rail Fracture)',
      model_name: 'HistGradientBoosting Asset Failure Classifier',
      model_version: 'v3.0-calibrated',
      calibrated_threshold: 0.65,
      synthetic_notice: 'Trained on multi-year SECR/NCR historical inspection and defect logs.',
      feature_attributions: {
        'Cumulative Gross Tonnage (GMT)': 0.34,
        'Days Since Last Tamping': 0.28,
        'Ambient Temperature Variance': 0.19,
        'Track Quality Index (TQI)': 0.19
      },
      tier: 'Tier 2 — Critical Preventive',
      tier_description: 'Risk score exceeds threshold. Prioritized for bundling within current weekly cycle.'
    }
  };
}

export function getMockOpportunity(itemId: string): OpportunityEvaluation {
  return {
    item_id: itemId,
    score: 92.5,
    recommended_window: 'WIN-GZB-ALJN-01 (08:00 – 11:00)',
    section_id: 'GZB-ALJN',
    track_id: 'DN_MAIN',
    tasks_count: 3,
    departments: ['ENGINEERING', 'TRD', 'SIGNAL_TELECOM'],
    high_risk_assets_addressed: 2,
    reasons: [
      'Multi-department synergy: 3 departments sharing 1 physical possession.',
      'Corridor savings: 120 minutes of line occupation saved versus separate blocks.',
      'Headway buffer: Exceeds required 15-minute safety clearance from Express 12004.'
    ],
    breakdown: {
      'Bundling Synergy (P-Way + TRD + S&T)': 35,
      'Timetable Headway Buffer Compliance': 25,
      'High-Risk Asset Mitigation': 20,
      'Resource Proximity & Machine Availability': 12.5
    },
    alternatives: [
      {
        window_id: 'WIN-GZB-ALJN-02',
        window_label: '14:00 – 16:30 (Day 2)',
        duration_minutes: 150,
        score: 68.0,
        status: 'ALTERNATIVE',
        reason: 'Requires rescheduling of Container Freight Train CF-402.'
      },
      {
        window_id: 'WIN-GZB-ALJN-03',
        window_label: '22:00 – 01:00 (Day 3)',
        duration_minutes: 180,
        score: 54.0,
        status: 'SUBOPTIMAL',
        reason: 'Night vision constraints for OHE inspection crew.'
      }
    ],
    tooltip: 'Composite 0–100 score derived from bundling efficiency, risk mitigation, and train disruption impact.'
  };
}

export function getMockWhatIf(): WhatIfResponse {
  return {
    status: 'SIMULATED',
    perturbation_type: 'TRAIN_DELAY_INJECTION',
    current_plan: {
      possession_hours: 48.5,
      scheduled_tasks: 32,
      combined_blocks: 8,
      total_blocks: 14
    },
    what_if_plan: {
      possession_hours: 46.0,
      scheduled_tasks: 31,
      combined_blocks: 7,
      total_blocks: 14
    },
    impact: {
      possession_delta_hours: -2.5,
      possession_delta_label: '2.5 hrs reduction (Shifted window)',
      bundles_lost: 1,
      bundles_lost_label: '1 bundle split into sequential possessions',
      blocks_moved: 2,
      blocks_moved_label: '2 blocks shifted by +45 minutes',
      conflicts_detected: [],
      reasons: [
        'Injected 35m delay on Train 12424 (Rajdhani Exp) compresses shadow slot at GZB-ALJN.',
        'Optimizer automatically rescheduled Block BLK-001 by +45m to maintain 15m headway buffer.'
      ],
      is_feasible: true
    }
  };
}
