import React, { useState } from 'react';
import { BlockPlanItem } from '../types';
import {
  Edit3,
  X,
  Check,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Lock
} from 'lucide-react';

interface OverrideModalProps {
  item: BlockPlanItem | null;
  onClose: () => void;
  onSubmit: (payload: {
    plan_id: string;
    item_id: string;
    new_start: string;
    new_end: string;
    justification: string;
  }) => Promise<any>;
}

export const OverrideModal: React.FC<OverrideModalProps> = ({
  item,
  onClose,
  onSubmit
}) => {
  if (!item) return null;

  const [startTime, setStartTime] = useState(
    new Date(item.scheduled_start).toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    new Date(item.scheduled_end).toISOString().slice(0, 16)
  );
  const [justification, setJustification] = useState(
    'Chief Sectional Controller manual shift for urgent operational track clearance.'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await onSubmit({
        plan_id: item.plan_id,
        item_id: item.item_id,
        new_start: new Date(startTime).toISOString(),
        new_end: new Date(endTime).toISOString(),
        justification
      });

      if (res && res.validation_verdict === 'FAILED') {
        setErrorMessage(`Override created conflicts: ${res.conflicts} hard constraint violations detected. Sentinel validator rejected plan.`);
        return;
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply manual override');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#111622] border border-[#252f44] rounded-xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl relative text-[#dfe2ee]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#252f44] pb-3">
          <div className="p-2.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Manual Controller Schedule Override
            </h3>
            <p className="text-xs font-mono text-[#94a3b8]">
              Item: <strong className="text-white">{item.item_id}</strong> (Plan: {item.plan_id})
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <strong className="block font-bold">Sentinel Conflict Warning:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#94a3b8] font-mono mb-1">
              Corridor Section & Track:
            </label>
            <input
              type="text"
              disabled
              value={`${item.section_id} (Track: ${item.track_id})`}
              className="w-full bg-[#0b0f17] border border-[#1e293b] rounded p-2 text-slate-300 font-mono cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="block text-[#94a3b8] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> New Start Time:
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                className="w-full bg-[#0b0f17] border border-[#1e293b] rounded p-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> New End Time:
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                className="w-full bg-[#0b0f17] border border-[#1e293b] rounded p-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#94a3b8] font-mono mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Controller Audit Justification:
            </label>
            <textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              required
              rows={3}
              placeholder="State operational reason for shifting block possession..."
              className="w-full bg-[#0b0f17] border border-[#1e293b] rounded p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[10px] text-[#64748b] block mt-0.5">
              * Logged to SHA-256 tamper-evident cryptographic audit chain.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#252f44]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-1.5 rounded bg-[#1e293b] text-slate-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition shadow-md disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? 'Validating...' : 'Validate & Apply Override'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
