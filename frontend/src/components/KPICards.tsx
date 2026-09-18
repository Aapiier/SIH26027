import React from 'react';
import {
  ClipboardList,
  CheckCircle,
  AlertOctagon,
  Layers,
  Clock,
  Zap,
  TrendingDown,
  ShieldCheck,
  Cpu,
  Boxes,
  Activity,
  AlertCircle
} from 'lucide-react';
import { DashboardMetrics } from '../types';

interface KPICardsProps {
  metrics: DashboardMetrics | null;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics }) => {
  const isValPassed = metrics?.validation_status === 'PASSED';

  const cards = [
    {
      title: 'MAINTENANCE DEMAND',
      value: metrics ? `${metrics.total_maintenance_requests}` : '—',
      subtext: `${metrics?.scheduled_tasks_count || 0} Scheduled (${metrics?.scheduled_rate_percentage || 0}%)`,
      icon: ClipboardList,
      color: 'text-blue-400',
      border: 'border-blue-900/40',
      bg: 'bg-blue-950/10'
    },
    {
      title: 'UNSCHEDULED / DEFERRED',
      value: metrics ? `${metrics.unscheduled_tasks_count}` : '—',
      subtext: 'Capacity or window constrained',
      icon: AlertCircle,
      color: 'text-amber-400',
      border: 'border-amber-900/40',
      bg: 'bg-amber-950/10'
    },
    {
      title: 'TIER 1 EMERGENCY GATE',
      value: metrics ? `${metrics.emergency_tasks_count}` : '—',
      subtext: '100% Guaranteed Possession Slots',
      icon: AlertOctagon,
      color: 'text-rose-400',
      border: 'border-rose-900/40',
      bg: 'bg-rose-950/10'
    },
    {
      title: 'CRITICAL PREDICTIVE (1.5)',
      value: metrics ? `${metrics.critical_emergency_count}` : '—',
      subtext: 'High Risk / Severe Defects',
      icon: Zap,
      color: 'text-orange-400',
      border: 'border-orange-900/40',
      bg: 'bg-orange-950/10'
    },
    {
      title: 'ACTIVE POSSESSIONS',
      value: metrics ? `${metrics.active_blocks_count}` : '—',
      subtext: `${metrics?.total_block_possession_hours || 0}h Total Track Closure`,
      icon: Clock,
      color: 'text-cyan-400',
      border: 'border-cyan-900/40',
      bg: 'bg-cyan-950/10'
    },
    {
      title: 'BUNDLES FORMED',
      value: metrics ? `${metrics.multi_department_bundled_blocks}` : '—',
      subtext: `${metrics?.cross_dept_bundles_count || 0} Cross-Department Blocks`,
      icon: Layers,
      color: 'text-indigo-400',
      border: 'border-indigo-900/40',
      bg: 'bg-indigo-950/10'
    },
    {
      title: 'POSSESSION TIME SAVED',
      value: metrics ? `${metrics.total_saved_possession_hours}h` : '—',
      subtext: `${metrics?.total_saved_possession_minutes || 0} mins saved via bundling`,
      icon: TrendingDown,
      color: 'text-emerald-400',
      border: 'border-emerald-900/40',
      bg: 'bg-emerald-950/10'
    },
    {
      title: 'SENTINEL INTEGRITY',
      value: metrics?.validation_status || 'UNVALIDATED',
      subtext: metrics?.content_hash ? `Hash: ${metrics.content_hash.slice(0, 10)}...` : 'Tamper-Evident SHA-256',
      icon: ShieldCheck,
      color: isValPassed ? 'text-emerald-400' : 'text-rose-400',
      border: isValPassed ? 'border-emerald-900/40' : 'border-rose-900/40',
      bg: isValPassed ? 'bg-emerald-950/10' : 'bg-rose-950/10'
    },
    {
      title: 'CP-SAT SOLVER RUNTIME',
      value: metrics ? `${metrics.solver_latest_runtime_s}s` : '—',
      subtext: 'OR-Tools Discrete Optimization',
      icon: Cpu,
      color: 'text-purple-400',
      border: 'border-purple-900/40',
      bg: 'bg-purple-950/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-2.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3 rounded-lg bg-[#111622] border ${card.border} ${card.bg} flex flex-col justify-between shadow-sm transition hover:border-slate-600`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-[#94a3b8] uppercase font-mono">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="my-1">
              <span className={`text-xl font-bold font-mono ${card.color}`}>
                {card.value}
              </span>
            </div>
            <div className="text-[10px] text-[#64748b] truncate" title={card.subtext}>
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
