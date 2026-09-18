import React from 'react';
import { BlockPlan, BlockPlanItem } from '../types';
import { Clock, Layers, ShieldCheck, AlertCircle, Edit3 } from 'lucide-react';

interface InteractiveGanttProps {
  plan: BlockPlan | null;
  onOverrideClick: (item: BlockPlanItem) => void;
}

export const InteractiveGantt: React.FC<InteractiveGanttProps> = ({ plan, onOverrideClick }) => {
  if (!plan || !plan.items || plan.items.length === 0) {
    return (
      <div className="bg-surface2 border border-border1 rounded p-8 text-center">
        <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-60" />
        <h3 className="text-sm font-semibold text-slate-300">No Optimized Schedule Available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Click "Solve OR-Tools CP-SAT" in the header to compute collision-free block possessions against live train timetables.
        </p>
      </div>
    );
  }

  // Unique sections in schedule
  const sections = Array.from(new Set(plan.items.map(i => i.section_id)));

  return (
    <div className="bg-surface2 border border-border1 rounded p-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border1 pb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Optimized Block Possessions Timeline (Gantt)
          </h2>
          <p className="text-xs text-slate-400">
            Plan ID: <span className="font-mono text-indigo-300">{plan.plan_id}</span> | Hash: <span className="font-mono text-slate-400 text-[10px]">{plan.content_hash.slice(0, 16)}...</span>
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/80"></span>
            <span className="text-slate-300 text-[11px]">Engineering</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/80"></span>
            <span className="text-slate-300 text-[11px]">S&T</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/80"></span>
            <span className="text-slate-300 text-[11px]">TRD OHE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80 border border-emerald-400"></span>
            <span className="text-slate-300 text-[11px]">Mega Bundle</span>
          </div>
        </div>
      </div>

      {/* Corridor Sections & Schedule Items */}
      <div className="space-y-3 overflow-x-auto">
        {sections.map(secId => {
          const secItems = plan.items.filter(i => i.section_id === secId);
          return (
            <div key={secId} className="border border-border1/60 rounded bg-surface1/60 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-slate-200">{secId} Section</span>
                <span className="text-[11px] text-slate-400 font-mono">{secItems.length} Block(s) Scheduled</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {secItems.map(item => {
                  const isBundle = (item.bundled_task_ids || []).length > 1;
                  const isConflict = item.validation_status === 'CONFLICT';

                  return (
                    <div
                      key={item.item_id}
                      className={`p-2.5 rounded border transition-all relative ${
                        isConflict
                          ? 'bg-rose-950/30 border-rose-600/60'
                          : isBundle
                          ? 'bg-indigo-950/30 border-indigo-500/50'
                          : 'bg-surface2 border-border1 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono font-semibold text-slate-200 text-[11px]">
                          {item.track_id}
                        </span>
                        <div className="flex items-center gap-1">
                          {isBundle && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-700/50 flex items-center gap-1">
                              <Layers className="w-3 h-3" /> Mega Bundle
                            </span>
                          )}
                          <button
                            onClick={() => onOverrideClick(item)}
                            title="Manual Controller Override"
                            className="p-1 rounded hover:bg-surface3 text-slate-400 hover:text-indigo-300 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 font-mono mb-1">
                        ⏱ {new Date(item.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.duration_minutes}m)
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 italic mb-2">
                        {item.justification || 'Standard scheduled possession'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-border1/40 pt-1.5 font-mono">
                        <span>Tasks: {item.bundled_task_ids.join(', ')}</span>
                        {item.assigned_resource_ids.length > 0 && (
                          <span className="text-cyan-400">🚜 {item.assigned_resource_ids.join(', ')}</span>
                        )}
                      </div>

                      {isConflict && item.conflict_reason && (
                        <div className="mt-2 text-[10px] bg-rose-900/40 text-rose-300 p-1.5 rounded border border-rose-700 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
    </div>
  );
};
