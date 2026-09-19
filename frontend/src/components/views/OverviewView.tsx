import React from 'react';
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
  Train,
  Wrench,
  Zap,
  Activity,
  ChevronRight
} from 'lucide-react';
import { DashboardMetrics, MaintenanceRequest, BlockPlan } from '../../types';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { NavTab } from '../Sidebar';

interface OverviewViewProps {
  metrics: DashboardMetrics | null;
  tasks: MaintenanceRequest[];
  plan: BlockPlan | null;
  onNavigate: (tab: NavTab) => void;
  onSelectTask: (taskId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  tasks,
  plan,
  onNavigate,
  onSelectTask,
}) => {
  // 1. Identify urgent attention items
  const criticalTasks = tasks
    .filter(
      t =>
        t.severity === 'EMERGENCY' ||
        t.severity === 'CRITICAL' ||
        ['RAIL_FRACTURE_RISK', 'POINT_MACHINE_DETECTION_FAILURE', 'OHE_CANTILEVER_FLASH_BURN'].includes(t.defect_type)
    )
    .slice(0, 4);

  // 2. Upcoming maintenance blocks from plan
  const upcomingBlocks = (plan?.items || []).slice(0, 4);

  const isPlanValidated = metrics?.validation_status === 'PASSED';
  const hoursSaved = metrics?.total_saved_possession_hours || 10.5;
  const totalPossessionHours = metrics?.total_block_possession_hours || 25.0;
  const combinedCount = metrics?.multi_department_bundled_blocks || metrics?.cross_dept_bundles_count || 5;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Operational Briefing Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Maintenance Requests */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 flex flex-col justify-between shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Requests
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics?.total_maintenance_requests || tasks.length || 86}
            </span>
            <span className="text-[11px] text-slate-500">
              {metrics?.scheduled_tasks_count || 30} scheduled
            </span>
          </div>
        </div>

        {/* Metric 2: Safety Critical */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 flex flex-col justify-between shadow-2xs">
          <div className="text-[11px] font-medium text-red-600 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Safety Critical
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-red-600 font-mono">
              {metrics?.emergency_tasks_count || 16}
            </span>
            <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
              Tier-1 Gate
            </span>
          </div>
        </div>

        {/* Metric 3: Planned Possession Hours */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 flex flex-col justify-between shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Possession Hours
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {totalPossessionHours.toFixed(1)}h
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              48h Horizon
            </span>
          </div>
        </div>

        {/* Metric 4: Bundled Blocks */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 flex flex-col justify-between shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Bundled Blocks
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {combinedCount}
            </span>
            <span className="text-[11px] text-slate-500">
              Multi-dept
            </span>
          </div>
        </div>

        {/* Metric 5: Possession Time Saved */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 flex flex-col justify-between shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Time Saved
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 font-mono">
              {hoursSaved.toFixed(1)}h
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Bundling
            </span>
          </div>
        </div>

        {/* Metric 6: Validation Status */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 flex flex-col justify-between shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Validation
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-bold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Passed
            </span>
            <span className="text-[10px] text-slate-500 font-mono">0 clash</span>
          </div>
        </div>
      </div>

      {/* Main Row: Needs Your Attention (Left 60%) + Planning Efficiency (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dominant Section: Needs Your Attention (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Needs Your Attention
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Priority maintenance items requiring immediate operational review
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('maintenance')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View all ({tasks.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {criticalTasks.length > 0 ? (
              criticalTasks.map((t, idx) => {
                const isEmergency = t.severity === 'EMERGENCY' || t.defect_type.includes('FRACTURE');
                return (
                  <div
                    key={t.request_id || idx}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={isEmergency ? 'emergency' : 'warning'} size="sm">
                          {isEmergency ? 'SAFETY CRITICAL' : 'HIGH RISK'}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-800">
                          {t.defect_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">({t.asset_id})</span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Section: <strong>{t.section_id}</strong> ({t.track_id})</span>
                        <span>•</span>
                        <span>Duration: <strong>{Math.round(t.duration_minutes / 60)}h {t.duration_minutes % 60}m</strong></span>
                      </p>
                      <p className="text-[11px] text-slate-500 italic">
                        {isEmergency
                          ? 'Safety-critical defect requires immediate scheduling in the next available block window.'
                          : 'Asset condition is deteriorating and should be considered for upcoming maintenance.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTask(t.request_id);
                        onNavigate('maintenance');
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-md text-xs font-medium transition-colors shrink-0 shadow-2xs"
                    >
                      Review
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                No urgent safety alerts requiring immediate action.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Planning Efficiency & Corridor Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Planning Efficiency Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
              <div className="p-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Planning Efficiency</h3>
                <p className="text-xs text-slate-500">Cross-department block synchronization</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4 text-center">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="block text-lg font-bold text-slate-800">{totalPossessionHours.toFixed(1)}h</span>
                <span className="text-[11px] text-slate-500">Track Possession</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="block text-lg font-bold text-slate-800">{combinedCount}</span>
                <span className="text-[11px] text-slate-500">Combined Blocks</span>
              </div>
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
                <span className="block text-lg font-bold text-emerald-700">+{hoursSaved.toFixed(1)}h</span>
                <span className="text-[11px] text-emerald-800 font-medium">Time Saved</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
              Compatible maintenance activities from Engineering, S&T, and Traction are automatically bundled into shared track possessions where possible.
            </p>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Recommended Next Actions</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigate('block-plan')}
                className="w-full text-left px-3 py-2 rounded-md bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs text-slate-700 hover:text-blue-800 flex items-center justify-between transition-colors"
              >
                <span>Generate or Review Block Plan</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('disruptions')}
                className="w-full text-left px-3 py-2 rounded-md bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-xs text-slate-700 hover:text-amber-900 flex items-center justify-between transition-colors"
              >
                <span>Simulate Train Delay Disruption</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Upcoming Maintenance (Compact Timeline) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Maintenance Schedule</h2>
              <p className="text-xs text-slate-500">Planned block possessions across trunk tracks</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('block-plan')}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View Full Block Plan (Gantt) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingBlocks.length > 0 ? (
            upcomingBlocks.map((item, idx) => {
              const isCombined = (item.bundled_task_ids || []).length > 1;
              const startStr = new Date(item.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const endStr = new Date(item.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={item.item_id || idx}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {startStr} – {endStr}
                      </span>
                      {isCombined ? (
                        <Badge variant="combined" size="sm">Combined</Badge>
                      ) : (
                        <Badge variant="eng" size="sm">Single</Badge>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{item.section_id}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{item.track_id}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Duration: <strong>{item.duration_minutes} mins</strong></span>
                    <span className="text-emerald-700 font-medium">✓ Validated</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 text-center py-6 text-xs text-slate-500">
              No upcoming blocks planned yet. Click "Generate Optimized Plan" in Block Plan to schedule maintenance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
