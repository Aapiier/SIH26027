import React, { useState } from 'react';
import { BlockPlan, BlockPlanItem, MaintenanceRequest } from '../types';
import {
  Clock,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Calendar,
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
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-700 shadow-2xs">
        <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">No Optimized Block Schedule Available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Click <strong className="text-blue-700">"Generate Optimized Plan"</strong> to compute collision-free block possessions against train timetables.
        </p>
      </div>
    );
  }

  // Group items by section
  const sections = Array.from(new Set(plan.items.map(i => i.section_id))).sort();

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-4 shadow-2xs text-slate-900">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Corridor Block Possession Schedule (Gantt View)
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                {plan.items.length} Possessions ({plan.total_tasks_scheduled} Tasks)
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Plan ID: <strong className="text-slate-800">{plan.plan_id}</strong> • Total Saved: <strong className="text-emerald-700">{(plan.total_saved_minutes / 60.0).toFixed(1)}h</strong>
            </p>
          </div>
        </div>

        {/* Department Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
            <span className="text-slate-700 text-[11px] font-medium">Engineering (P-Way)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span className="text-slate-700 text-[11px] font-medium">Signal & Telecom</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-600"></span>
            <span className="text-slate-700 text-[11px] font-medium">Traction (TRD)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
            <span className="text-emerald-800 text-[11px] font-bold">Unified Bundle</span>
          </div>
        </div>
      </div>

      {/* Sections and Scheduled Block Items */}
      <div className="space-y-3">
        {sections.map(secId => {
          const secItems = plan.items.filter(i => i.section_id === secId);
          return (
            <div key={secId} className="border border-slate-200 rounded-lg bg-slate-50/60 p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Section: {secId}
                </span>
                <span className="text-slate-500 font-mono">
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
                      className={`p-3 rounded-md border cursor-pointer transition-all hover:shadow-xs flex flex-col justify-between space-y-2 bg-white ${
                        isConflict
                          ? 'border-red-400 bg-red-50/40'
                          : isBundle
                          ? 'border-emerald-300 hover:border-emerald-500'
                          : 'border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {/* Top Header inside Block Card */}
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-slate-900 text-[11px] truncate" title={item.item_id}>
                          {item.item_id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isBundle && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                              <Layers className="w-3 h-3" /> {item.bundled_task_ids.length} Tasks
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {item.track_id}
                          </span>
                        </div>
                      </div>

                      {/* Possession Time */}
                      <div className="text-xs font-mono text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
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
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : d === 'SIGNAL_TELECOM'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>

                      {/* Bottom Details */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 font-mono">
                        <span className="truncate max-w-[180px]">
                          Tasks: {item.bundled_task_ids.join(', ')}
                        </span>
                        <span className="text-blue-600 flex items-center gap-1 font-semibold hover:underline">
                          <Maximize2 className="w-3 h-3" /> Details
                        </span>
                      </div>

                      {isConflict && item.conflict_reason && (
                        <div className="text-[10px] bg-red-50 text-red-800 p-1.5 rounded border border-red-200 flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
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
