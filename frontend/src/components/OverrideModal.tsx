import React, { useState } from 'react';
import { BlockPlanItem } from '../types';
import {
  Edit3,
  X,
  Check,
  AlertTriangle,
  Clock,
  MapPin,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Badge } from './ui/Badge';

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
    'Section controller manual shift for urgent operational track clearance.'
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
        setErrorMessage(
          `Schedule adjustment rejected: ${res.conflicts || 1} operational conflicts detected with train timetables.`
        );
        return;
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to adjust schedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 relative flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Adjust Maintenance Block Schedule</h2>
              <p className="text-xs text-slate-500">Controller manual adjustment with automated safety validation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Schedule Summary */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>Location: <strong>{item.section_id}</strong> ({item.track_id})</span>
            <Badge variant="neutral" size="sm">Current Duration: {item.duration_minutes}m</Badge>
          </div>
          <p className="text-slate-500 text-[11px] font-mono">
            Current Slot: {new Date(item.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(item.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Conflict Error Message */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Adjustment Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">New Start Time:</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">New End Time:</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Reason for Adjustment (Audit Log):</label>
            <textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              rows={2}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="p-3 rounded bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
            <span>Changes are automatically checked for train conflicts and recorded in the audit trail.</span>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Validating...' : 'Save & Validate Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
