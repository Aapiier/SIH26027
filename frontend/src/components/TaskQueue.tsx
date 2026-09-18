import React, { useState } from 'react';
import { MaintenanceRequest } from '../types';
import { ListFilter, AlertTriangle, Cpu, HelpCircle, CheckCircle, Clock } from 'lucide-react';

interface TaskQueueProps {
  tasks: MaintenanceRequest[];
  onExplainClick: (taskId: string) => void;
}

export const TaskQueue: React.FC<TaskQueueProps> = ({ tasks, onExplainClick }) => {
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredTasks = tasks.filter(t => {
    if (filterDept !== 'ALL' && t.department !== filterDept) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="bg-surface2 border border-border1 rounded p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border1 pb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-purple-400" />
            Maintenance Tasks & Ingestion Queue
          </h2>
          <span className="text-xs px-2 py-0.5 rounded bg-surface3 font-mono text-slate-300">
            {filteredTasks.length} / {tasks.length}
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="bg-surface1 border border-border1 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="ALL">All Departments</option>
            <option value="ENGINEERING">Engineering (P-Way)</option>
            <option value="SIGNAL_TELECOM">S&T (Signalling)</option>
            <option value="TRD">TRD (Traction)</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-surface1 border border-border1 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="UNSCHEDULED">Unscheduled</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Task Table */}
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border1 text-slate-400 font-mono text-[11px] bg-surface1/60 sticky top-0">
              <th className="p-2">TASK ID</th>
              <th className="p-2">DEPT</th>
              <th className="p-2">SECTION & TRACK</th>
              <th className="p-2">DEFECT TYPE</th>
              <th className="p-2">SEVERITY</th>
              <th className="p-2">PRIORITY</th>
              <th className="p-2">DUR</th>
              <th className="p-2">STATUS</th>
              <th className="p-2 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border1/40 font-mono">
            {filteredTasks.map(task => {
              const isEmergency = task.severity === 'EMERGENCY';
              const isScheduled = task.status === 'SCHEDULED';
              const isUnscheduled = task.status === 'UNSCHEDULED';

              return (
                <tr key={task.request_id} className="hover:bg-surface3/40 transition-colors">
                  <td className="p-2 font-bold text-slate-200">{task.request_id}</td>
                  <td className="p-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        task.department === 'ENGINEERING'
                          ? 'bg-orange-950 text-orange-300 border border-orange-700/50'
                          : task.department === 'SIGNAL_TELECOM'
                          ? 'bg-purple-950 text-purple-300 border border-purple-700/50'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                      }`}
                    >
                      {task.department === 'ENGINEERING' ? 'ENG' : task.department === 'SIGNAL_TELECOM' ? 'S&T' : 'TRD'}
                    </span>
                  </td>
                  <td className="p-2 text-slate-300">{task.section_id} ({task.track_id})</td>
                  <td className="p-2 text-slate-300 truncate max-w-xs">{task.defect_type.replace(/_/g, ' ')}</td>
                  <td className="p-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        isEmergency
                          ? 'bg-rose-950 text-rose-300 border border-rose-700 font-bold animate-pulse'
                          : task.severity === 'CRITICAL'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {task.severity}
                    </span>
                  </td>
                  <td className="p-2 text-indigo-300 font-bold">{task.ai_priority_score ?? '-'}</td>
                  <td className="p-2 text-slate-400">{task.duration_minutes}m</td>
                  <td className="p-2">
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
                  <td className="p-2 text-right">
                    {isUnscheduled && (
                      <button
                        onClick={() => onExplainClick(task.request_id)}
                        className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-[10px] text-rose-300 flex items-center gap-1 ml-auto transition-colors"
                      >
                        <HelpCircle className="w-3 h-3" /> Explain
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
