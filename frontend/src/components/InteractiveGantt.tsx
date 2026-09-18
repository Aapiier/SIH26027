import React, { useState } from 'react';
import { BlockPlan, BlockPlanItem, MaintenanceRequest } from '../types';
import {
  Clock,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Edit3,
  Calendar,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { BlockDetailModal } from './BlockDetailModal';

interface InteractiveGanttProps {
  plan: BlockPlan | null;
  tasks: MaintenanceRequest[];
  onOverrideClick: (item: BlockPlanItem) => void;
}

export const InteractiveGantt: React.FC<InteractiveGanttProps> = ({
  plan,
  tasks,
  onOverrideClick
}) => {
  const [selectedItem, setSelectedItem] = useState<BlockPlanItem | null>(null);

  if (!plan || !plan.items || plan.items.length === 0) {
    return (
      <div className="bg-[#111622] border border-[#252f44] rounded-xl p-10 text-center text-[#dfe2ee] shadow-sm">
        <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-bold text-slate-200">No Optimized Block Schedule Available</h3>
        <p className="text-xs text-[#94a3b8] mt-1 max-w-md mx-auto">
          Click <strong className="text-blue-400">"CP-SAT Solve"</strong> in the top control bar to compute collision-free block possessions against train timetables.
        </p>
      </div>
    );
  }

  // Group items by section
  const sections = Array.from(new Set(plan.items.map(i => i.section_id))).sort();

  return (
    <div className="bg-[#111622] border border-[#252f44] rounded-xl p-4 flex flex-col gap-4 shadow-sm text-[#dfe2ee]">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#252f44] pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Corridor Block Possession Schedule (Gantt)
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                {plan.items.length} Unified Possessions ({plan.total_tasks_scheduled} Tasks)
              </span>
            </h2>
            <p className="text-xs text-[#94a3b8] font-mono">
              Plan ID: <strong className="text-slate-200">{plan.plan_id}</strong> • Total Saved: <strong className="text-emerald-400">{(plan.total_saved_minutes / 60.0).toFixed(1)}h</strong>
            </p>
          </div>
        </div>

        {/* Department Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
            <span className="text-[#cbd5e1] text-[11px]">Engineering (P-Way)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span className="text-[#cbd5e1] text-[11px]">Signal & Telecom</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span>
            <span className="text-[#cbd5e1] text-[11px]">Traction (TRD)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-300"></span>
            <span className="text-emerald-300 text-[11px] font-bold">Unified Bundle</span>
          </div>
        </div>
      </div>

      {/* Sections and Scheduled Block Items */}
      <div className="space-y-3">
        {sections.map(secId => {
          const secItems = plan.items.filter(i => i.section_id === secId);
          return (
            <div key={secId} className="border border-[#1e293b] rounded-lg bg-[#0b0f17] p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs border-b border-[#1e293b] pb-2 font-mono">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Section: {secId}
                </span>
                <span className="text-[#94a3b8]">
                  {secItems.length} Block(s) Assigned
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {secItems.map(item => {
                  const isBundle = (item.bundled_task_ids || []).length > 1;
                  const isConflict = item.validation_status === 'CONFLICT';
                  const memberTasks = tasks.filter(t => item.bundled_task_ids?.includes(t.request_id));
                  const depts = Array.from(new Set(memberTasks.map(t => t.department)));

                  return (
                    <div
                      key={item.item_id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between space-y-2 ${
                        isConflict
                          ? 'bg-rose-950/20 border-rose-600/70 shadow-rose-950/20 shadow-md'
                          : isBundle
                          ? 'bg-purple-950/20 border-purple-600/60 shadow-purple-950/20 shadow-md hover:border-purple-400'
                          : 'bg-[#161c2d] border-[#252f44] hover:border-blue-500'
                      }`}
                    >
                      {/* Top Header inside Block Card */}
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-white text-[11px] truncate" title={item.item_id}>
                          {item.item_id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isBundle && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 text-[10px] font-bold border border-purple-700 flex items-center gap-1">
                              <Layers className="w-3 h-3" /> {item.bundled_task_ids.length} Tasks
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {item.track_id}
                          </span>
                        </div>
                      </div>

                      {/* Possession Time */}
                      <div className="text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {new Date(item.scheduled_start).toUTCString().slice(5, 22)} ({item.duration_minutes}m / {(item.duration_minutes/60).toFixed(1)}h)
                        </span>
                      </div>

                      {/* Department Badges */}
                      <div className="flex flex-wrap gap-1">
                        {depts.map((d, i) => (
                          <span
                            key={i}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                              d === 'ENGINEERING'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : d === 'SIGNAL_TELECOM'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-purple-950 text-purple-300 border border-purple-800'
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>

                      {/* Bottom Details */}
                      <div className="flex items-center justify-between text-[10px] text-[#94a3b8] border-t border-[#1e293b] pt-1.5 font-mono">
                        <span className="truncate max-w-[180px]">
                          Tasks: {item.bundled_task_ids.join(', ')}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1 hover:text-white">
                          <Maximize2 className="w-3 h-3" /> Details
                        </span>
                      </div>

                      {isConflict && item.conflict_reason && (
                        <div className="text-[10px] bg-rose-950 text-rose-300 p-1.5 rounded border border-rose-700 flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          <span>{item.conflict_reason}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Block Details Modal */}
      <BlockDetailModal
        item={selectedItem}
        tasks={tasks}
        onClose={() => setSelectedItem(null)}
        onOverrideClick={onOverrideClick}
      />
    </div>
  );
};
