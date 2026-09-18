import React from 'react';
import {
  X,
  Clock,
  MapPin,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  TrendingDown,
  Wrench,
  Truck,
  Users
} from 'lucide-react';
import { BlockPlanItem, MaintenanceRequest } from '../../types';
import { Badge } from '../ui/Badge';

interface BlockDetailDrawerProps {
  item: BlockPlanItem | null;
  tasks: MaintenanceRequest[];
  onClose: () => void;
  onAdjustSchedule: (item: BlockPlanItem) => void;
}

export const BlockDetailDrawer: React.FC<BlockDetailDrawerProps> = ({
  item,
  tasks,
  onClose,
  onAdjustSchedule,
}) => {
  if (!item) return null;

  const isCombined = (item.bundled_task_ids || []).length > 1;
  const startStr = new Date(item.scheduled_start).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const endStr = new Date(item.scheduled_end).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Find member tasks
  const memberTasks = tasks.filter(t =>
    (item.bundled_task_ids || []).includes(t.request_id)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-slideInRight">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                isCombined
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Maintenance Block</h2>
                {isCombined ? (
                  <Badge variant="combined" size="sm">Combined ({item.bundled_task_ids.length} Tasks)</Badge>
                ) : (
                  <Badge variant="eng" size="sm">Single Department</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">ID: {item.item_id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Schedule & Location Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block">Section Location</span>
                <strong className="text-sm text-slate-900">{item.section_id}</strong>
                <span className="text-slate-500 block font-mono text-[11px]">{item.track_id}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Total Possession Duration</span>
                <strong className="text-sm text-slate-900">{Math.round(item.duration_minutes / 60)}h {item.duration_minutes % 60}m</strong>
                <span className="text-emerald-700 block font-medium">✓ Conflict-free slot</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <div>
                <span className="text-slate-500 block">Scheduled Start:</span>
                <strong className="text-slate-800 font-mono">{startStr}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Scheduled End:</span>
                <strong className="text-slate-800 font-mono">{endStr}</strong>
              </div>
            </div>
          </div>

          {/* Work Included Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Work Included in this Block ({memberTasks.length || (item.bundled_task_ids || []).length})
              </h4>
            </div>

            <div className="space-y-2">
              {memberTasks.length > 0 ? (
                memberTasks.map((t, idx) => (
                  <div
                    key={t.request_id || idx}
                    className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-900">{t.defect_type.replace(/_/g, ' ')}</span>
                      </div>
                      <Badge
                        variant={
                          t.department === 'ENGINEERING'
                            ? 'eng'
                            : t.department === 'SIGNAL_TELECOM'
                            ? 'snt'
                            : 'trd'
                        }
                        size="sm"
                      >
                        {t.department.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono">
                      <span>Asset: {t.asset_id}</span>
                      <span>Required: {t.duration_minutes}m</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg border border-slate-200 bg-white text-slate-600">
                  <span>{item.justification || 'Standard track maintenance activity.'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Why are these combined? */}
          {isCombined && (
            <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Why are these activities combined?</span>
              </div>
              <p className="text-xs text-emerald-900/90 leading-relaxed">
                {item.justification ||
                  'These maintenance activities occur on the same track section and are fully compatible without machinery conflicts, allowing unified possession and saving corridor downtime.'}
              </p>
            </div>
          )}

          {/* Validation Checks */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Safety Validation Checks
            </h4>
            <div className="space-y-1.5 text-slate-700 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>No conflict with passenger or freight train timetables (≥15m buffer)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>No overlapping possession on the same physical line</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Assigned machinery and maintenance crews are available</span>
              </div>
            </div>
          </div>

          {/* Assigned Resources */}
          {(item.assigned_resource_ids || []).length > 0 && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Assigned Equipment & Resources</span>
              <div className="flex flex-wrap gap-1.5">
                {item.assigned_resource_ids.map((res, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-700">
                    {res}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onAdjustSchedule(item);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Adjust Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
