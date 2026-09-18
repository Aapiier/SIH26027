import React from 'react';
import {
  X,
  Layers,
  Clock,
  MapPin,
  Cpu,
  ShieldCheck,
  Zap,
  Wrench,
  TrendingDown,
  Edit3,
  Calendar,
  AlertOctagon,
  Users
} from 'lucide-react';
import { BlockPlanItem, MaintenanceRequest } from '../types';

interface BlockDetailModalProps {
  item: BlockPlanItem | null;
  tasks: MaintenanceRequest[];
  onClose: () => void;
  onOverrideClick: (item: BlockPlanItem) => void;
}

export const BlockDetailModal: React.FC<BlockDetailModalProps> = ({
  item,
  tasks,
  onClose,
  onOverrideClick
}) => {
  if (!item) return null;

  const isBundle = (item.bundled_task_ids?.length || 0) > 1;
  const memberTasks = tasks.filter(t => item.bundled_task_ids?.includes(t.request_id));
  const departments = Array.from(new Set(memberTasks.map(t => t.department)));

  // Calculate total standalone time if tasks were executed separately
  const standaloneSumMins = memberTasks.reduce((acc, t) => acc + t.duration_minutes, 0);
  const possessionMins = item.duration_minutes;
  const savedMins = Math.max(0, standaloneSumMins - possessionMins);
  const savedHours = (savedMins / 60.0).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#111622] border border-[#252f44] w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#dfe2ee]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#161c2d] border-b border-[#252f44] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg ${isBundle ? 'bg-purple-950/70 text-purple-300 border border-purple-800' : 'bg-blue-950/70 text-blue-300 border border-blue-800'}`}>
              {isBundle ? <Layers className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">
                  {item.item_id}
                </h2>
                {isBundle ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700 font-mono font-bold">
                    UNIFIED BUNDLE ({memberTasks.length} TASKS)
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700 font-mono">
                    STANDALONE BLOCK
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {item.validation_status}
                </span>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Section: <strong className="text-white">{item.section_id}</strong> • Track: <strong className="text-white">{item.track_id}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Quick Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-[#0b0f17] p-3.5 rounded-lg border border-[#1e293b]">
              <div className="text-[11px] text-[#94a3b8] font-mono uppercase">Possession Window</div>
              <div className="text-base font-bold font-mono text-cyan-400 my-0.5">
                {(item.duration_minutes / 60.0).toFixed(1)} Hours
              </div>
              <div className="text-[10px] text-[#64748b]">
                {item.duration_minutes} Minutes
              </div>
            </div>

            <div className="bg-[#0b0f17] p-3.5 rounded-lg border border-[#1e293b]">
              <div className="text-[11px] text-[#94a3b8] font-mono uppercase">Start Possession</div>
              <div className="text-xs font-bold font-mono text-white my-1">
                {new Date(item.scheduled_start).toUTCString().slice(5, 22)}
              </div>
              <div className="text-[10px] text-[#64748b]">
                UTC Canonical Timetable
              </div>
            </div>

            <div className="bg-[#0b0f17] p-3.5 rounded-lg border border-[#1e293b]">
              <div className="text-[11px] text-[#94a3b8] font-mono uppercase">End Possession</div>
              <div className="text-xs font-bold font-mono text-white my-1">
                {new Date(item.scheduled_end).toUTCString().slice(5, 22)}
              </div>
              <div className="text-[10px] text-[#64748b]">
                Cleared for Operations
              </div>
            </div>

            <div className="bg-[#0b0f17] p-3.5 rounded-lg border border-[#1e293b]">
              <div className="text-[11px] text-[#94a3b8] font-mono uppercase">Block Time Saved</div>
              <div className="text-base font-bold font-mono text-emerald-400 my-0.5">
                {savedHours} Hours
              </div>
              <div className="text-[10px] text-[#64748b]">
                Via Collaborative Bundling
              </div>
            </div>
          </div>

          {/* Member Tasks Section */}
          <div className="bg-[#0b0f17] p-4 rounded-lg border border-[#1e293b] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#93c5fd] flex items-center gap-1.5 font-mono">
                <Users className="w-4 h-4" />
                Collaborative Member Maintenance Tasks ({memberTasks.length})
              </h3>
              <div className="flex gap-1.5">
                {departments.map((d, i) => (
                  <span
                    key={i}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
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
            </div>

            <div className="space-y-2">
              {memberTasks.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded bg-[#161c2d] border border-[#1e293b] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{t.request_id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        t.severity === 'EMERGENCY'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : t.severity === 'CRITICAL'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {t.severity}
                      </span>
                      <span className="text-[#94a3b8]">Asset: <strong>{t.asset_id}</strong></span>
                    </div>
                    <p className="text-slate-300 font-mono">
                      Defect: <strong className="text-white">{t.defect_type}</strong> (Duration: {t.duration_minutes}m)
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-right font-mono">
                    <div>
                      <div className="text-[10px] text-[#64748b]">Priority Score</div>
                      <div className="font-bold text-blue-400">{t.ai_priority_score?.toFixed(1) || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#64748b]">ML Failure Risk</div>
                      <div className="font-bold text-rose-400">
                        {t.ai_risk_score !== undefined ? `${(t.ai_risk_score * 100).toFixed(0)}%` : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Machinery & Bundling Justification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0b0f17] p-4 rounded-lg border border-[#1e293b] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#cbd5e1] flex items-center gap-1.5 font-mono">
                <Wrench className="w-4 h-4 text-amber-400" />
                Assigned Resources & Machinery
              </h3>
              {item.assigned_resource_ids && item.assigned_resource_ids.length > 0 ? (
                <div className="space-y-1.5">
                  {item.assigned_resource_ids.map((r, i) => (
                    <div key={i} className="px-2.5 py-1.5 rounded bg-[#161c2d] border border-[#1e293b] text-xs font-mono text-amber-300 flex items-center justify-between">
                      <span>{r}</span>
                      <span className="text-[10px] text-[#64748b]">Allocated Machine</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748b] italic">
                  Manual departmental crew mobilization (No heavy machine conflict).
                </p>
              )}
            </div>

            <div className="bg-[#0b0f17] p-4 rounded-lg border border-[#1e293b] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#cbd5e1] flex items-center gap-1.5 font-mono">
                <Cpu className="w-4 h-4 text-purple-400" />
                Why This Candidate Window?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {item.justification || 'Window selected by CP-SAT solver matching conflict-free timetable shadow gap between passenger train headways.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#161c2d] border-t border-[#252f44] flex items-center justify-between text-xs text-[#64748b]">
          <span>Unified Block possession item • First-Class Bundle Representation</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                onOverrideClick(item);
              }}
              className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-amber-300 font-semibold rounded border border-amber-700/50 flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manual Override</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] font-semibold rounded transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
