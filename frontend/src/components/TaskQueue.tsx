import React, { useState } from 'react';
import { MaintenanceRequest } from '../types';
import {
  ListFilter,
  AlertTriangle,
  Zap,
  HelpCircle,
  CheckCircle,
  Clock,
  Activity,
  ShieldAlert,
  Search,
  Layers,
  ChevronRight
} from 'lucide-react';

interface TaskQueueProps {
  tasks: MaintenanceRequest[];
  onExplainClick: (taskId: string) => void;
}

export const TaskQueue: React.FC<TaskQueueProps> = ({ tasks, onExplainClick }) => {
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTasks = tasks.filter(t => {
    if (filterDept !== 'ALL' && t.department !== filterDept) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;

    if (filterTier === 'TIER_1') {
      const isEm = t.severity === 'EMERGENCY' || ['RAIL_FRACTURE_RISK', 'POINT_MACHINE_DETECTION_FAILURE', 'OHE_CANTILEVER_FLASH_BURN'].includes(t.defect_type);
      if (!isEm) return false;
    } else if (filterTier === 'TIER_1_5') {
      const isCrit = t.severity === 'CRITICAL' || ['IMR_ULTRASONIC_FLAW', 'CONTACT_WIRE_PARTING_RISK', 'TRACK_CIRCUIT_INTERMITTENT_DROP'].includes(t.defect_type);
      if (!isCrit) return false;
    } else if (filterTier === 'TIER_2') {
      const isRoutine = ['URGENT', 'ROUTINE'].includes(t.severity);
      if (!isRoutine) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.request_id.toLowerCase().includes(q) ||
        t.asset_id.toLowerCase().includes(q) ||
        t.section_id.toLowerCase().includes(q) ||
        t.defect_type.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="bg-[#111622] border border-[#252f44] rounded-xl p-4 flex flex-col gap-3 shadow-sm text-[#dfe2ee]">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#252f44] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800">
            <ListFilter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Maintenance Demand & AI Prioritization Queue
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 font-mono text-cyan-300">
                {filteredTasks.length} of {tasks.length}
              </span>
            </h2>
            <p className="text-xs text-[#94a3b8]">
              Integrated TMS, SMMS & TDMS requests with calibrated predictive failure risk.
            </p>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search request / asset / defect..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#0b0f17] border border-[#1e293b] rounded px-3 py-1 text-xs text-[#e2e8f0] placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="bg-[#0b0f17] border border-[#1e293b] rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Departments</option>
            <option value="ENGINEERING">Engineering (P-Way)</option>
            <option value="SIGNAL_TELECOM">S&T (Signalling)</option>
            <option value="TRD">TRD (Traction OHE)</option>
          </select>

          <select
            value={filterTier}
            onChange={e => setFilterTier(e.target.value)}
            className="bg-[#0b0f17] border border-[#1e293b] rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Priority Tiers</option>
            <option value="TIER_1">Tier 1: Emergency Safety Gate</option>
            <option value="TIER_1_5">Tier 1.5: Critical Predictive</option>
            <option value="TIER_2">Tier 2: AI-Prioritized Work</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#0b0f17] border border-[#1e293b] rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="UNSCHEDULED">Unscheduled / Deferred</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[420px] rounded border border-[#1e293b]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#161c2d] text-[#94a3b8] font-mono text-[11px] sticky top-0 border-b border-[#252f44] z-10">
            <tr>
              <th className="p-2.5">TASK ID</th>
              <th className="p-2.5">DEPT</th>
              <th className="p-2.5">ASSET ID</th>
              <th className="p-2.5">SECTION & TRACK</th>
              <th className="p-2.5">DEFECT DESCRIPTION</th>
              <th className="p-2.5 text-center">TIER / SEVERITY</th>
              <th className="p-2.5 text-right">PRIORITY</th>
              <th className="p-2.5 text-right">ML RISK</th>
              <th className="p-2.5 text-center">DUR</th>
              <th className="p-2.5 text-center">STATUS</th>
              <th className="p-2.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b] font-mono bg-[#0b0f17]">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-[#64748b] italic">
                  No maintenance tasks matching current filters.
                </td>
              </tr>
            ) : (
              filteredTasks.map(task => {
                const isEmergency = task.severity === 'EMERGENCY';
                const isCritical = task.severity === 'CRITICAL';
                const isScheduled = task.status === 'SCHEDULED';
                const isUnscheduled = task.status === 'UNSCHEDULED';

                return (
                  <tr
                    key={task.request_id}
                    onClick={() => onExplainClick(task.request_id)}
                    className="hover:bg-[#161c2d] cursor-pointer transition-colors"
                  >
                    <td className="p-2.5 font-bold text-white">{task.request_id}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          task.department === 'ENGINEERING'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : task.department === 'SIGNAL_TELECOM'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}
                      >
                        {task.department === 'ENGINEERING' ? 'ENG' : task.department === 'SIGNAL_TELECOM' ? 'S&T' : 'TRD'}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300">{task.asset_id}</td>
                    <td className="p-2.5 text-slate-300">
                      {task.section_id} <span className="text-[#64748b]">({task.track_id})</span>
                    </td>
                    <td className="p-2.5 text-[#cbd5e1] truncate max-w-xs" title={task.defect_type}>
                      {task.defect_type.replace(/_/g, ' ')}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isEmergency
                            ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                            : isCritical
                            ? 'bg-orange-950 text-orange-300 border border-orange-700'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isEmergency ? 'TIER 1 (EMG)' : isCritical ? 'TIER 1.5' : 'TIER 2'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-bold text-blue-400">
                      {task.ai_priority_score?.toFixed(1) ?? '—'}
                    </td>
                    <td className="p-2.5 text-right font-bold text-rose-400">
                      {task.ai_risk_score !== undefined ? `${(task.ai_risk_score * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="p-2.5 text-center text-[#94a3b8]">{task.duration_minutes}m</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isScheduled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : isUnscheduled
                            ? 'bg-rose-950 text-rose-300 border border-rose-700'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <span className="text-xs text-blue-400 flex items-center justify-end gap-0.5 hover:underline">
                        Explain <ChevronRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
