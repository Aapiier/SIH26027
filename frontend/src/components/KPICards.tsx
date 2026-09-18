import React from 'react';
import { DashboardMetrics } from '../types';
import { CheckCircle2, Clock, Layers, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';

interface KPICardsProps {
  metrics: DashboardMetrics | null;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Asset Availability */}
      <div className="bg-surface2 border border-border1 rounded p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">ASSET AVAILABILITY</span>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="font-mono text-2xl font-bold text-emerald-400">
          {metrics.asset_availability_percentage}%
        </div>
        <div className="text-[11px] text-slate-400 mt-1">Delhi-PRYJ Trunk Uptime</div>
      </div>

      {/* 2. Total Requests & Scheduled Rate */}
      <div className="bg-surface2 border border-border1 rounded p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">SCHEDULED RATE</span>
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="font-mono text-2xl font-bold text-indigo-300">
          {metrics.scheduled_rate_percentage}%
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          {metrics.scheduled_tasks_count} / {metrics.total_maintenance_requests} Tasks
        </div>
      </div>

      {/* 3. Multi-Dept Mega Bundles */}
      <div className="bg-surface2 border border-border1 rounded p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">MEGA BUNDLES</span>
          <Layers className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="font-mono text-2xl font-bold text-cyan-300">
          {metrics.multi_department_bundled_blocks}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">ENG + S&T + TRD Synchronized</div>
      </div>

      {/* 4. Possession Hours Saved */}
      <div className="bg-surface2 border border-border1 rounded p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">SAVED POSSESSION</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="font-mono text-2xl font-bold text-amber-300">
          {metrics.total_saved_possession_minutes} <span className="text-sm font-normal text-slate-400">mins</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">Through Joint Shadow Windows</div>
      </div>

      {/* 5. Critical Emergencies Addressed */}
      <div className="bg-surface2 border border-border1 rounded p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">EMERGENCY DEFECTS</span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="font-mono text-2xl font-bold text-rose-400">
          {metrics.critical_emergency_count}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">Tier-1 Safety Prioritized</div>
      </div>

      {/* 6. Solver & Validator Status */}
      <div className="bg-surface2 border border-border1 rounded p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">SOLVER VERDICT</span>
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="font-mono text-lg font-bold text-indigo-200 truncate">
          {metrics.active_plan_status}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Runtime: {metrics.solver_latest_runtime_s}s (CP-SAT)
        </div>
      </div>
    </div>
  );
};
