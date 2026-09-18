import React, { useState } from 'react';
import { BlockPlanItem } from '../types';
import { Edit3, X, Check, ShieldAlert } from 'lucide-react';

interface OverrideModalProps {
  item: BlockPlanItem | null;
  onClose: () => void;
  onSubmit: (payload: { plan_id: string; item_id: string; new_start: string; new_end: string; justification: string }) => void;
}

export const OverrideModal: React.FC<OverrideModalProps> = ({ item, onClose, onSubmit }) => {
  if (!item) return null;

  const [startTime, setStartTime] = useState(new Date(item.scheduled_start).toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(new Date(item.scheduled_end).toISOString().slice(0, 16));
  const [justification, setJustification] = useState('Chief Controller discretionary track possession shift for urgent engineering clearance.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      plan_id: item.plan_id,
      item_id: item.item_id,
      new_start: new Date(startTime).toISOString(),
      new_end: new Date(endTime).toISOString(),
      justification,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface2 border border-border1 rounded max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 border-b border-border1 pb-3">
          <div className="p-2 rounded bg-indigo-950 text-indigo-400 border border-indigo-700/50">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Manual Controller Schedule Override</h3>
            <p className="text-xs font-mono text-slate-400">Item: {item.item_id}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 font-mono mb-1">Track & Section:</label>
            <input
              type="text"
              disabled
              value={`${item.section_id} (${item.track_id})`}
              className="w-full bg-surface1 border border-border1 rounded p-2 text-slate-300 font-mono cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono mb-1">New Start Time:</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                className="w-full bg-surface1 border border-border1 rounded p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono mb-1">New End Time:</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                className="w-full bg-surface1 border border-border1 rounded p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Override Audit Justification:</label>
            <textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              required
              rows={3}
              className="w-full bg-surface1 border border-border1 rounded p-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-surface3 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Check className="w-3.5 h-3.5" /> Apply & Validate Override
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
