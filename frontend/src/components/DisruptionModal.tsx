import React, { useState } from 'react';
import { ShieldAlert, X, Zap, AlertTriangle } from 'lucide-react';

interface DisruptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { train_number: string; section_id: string; delay_minutes: number }) => void;
}

export const DisruptionModal: React.FC<DisruptionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const [trainNumber, setTrainNumber] = useState('22436');
  const [sectionId, setSectionId] = useState('NDLS-GZB');
  const [delayMinutes, setDelayMinutes] = useState(45);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      train_number: trainNumber,
      section_id: sectionId,
      delay_minutes: Number(delayMinutes),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#0d1424] border border-rose-800/60 rounded-xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl relative text-slate-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-700/50">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Simulate Live Train Delay Disruption</h3>
            <p className="text-xs text-slate-400">Triggers targeted reoptimization preserving unaffected blocks</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold text-[11px] uppercase tracking-wider mb-1">Delayed Train Number:</label>
            <select
              value={trainNumber}
              onChange={e => setTrainNumber(e.target.value)}
              className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none transition-colors"
            >
              <option value="22436" className="bg-[#162035] text-white">22436 - Vande Bharat Express</option>
              <option value="12302" className="bg-[#162035] text-white">12302 - Howrah Rajdhani</option>
              <option value="12004" className="bg-[#162035] text-white">12004 - Shatabdi Express</option>
              <option value="12554" className="bg-[#162035] text-white">12554 - Vaishali Superfast</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold text-[11px] uppercase tracking-wider mb-1">Corridor Section Affected:</label>
            <select
              value={sectionId}
              onChange={e => setSectionId(e.target.value)}
              className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none transition-colors"
            >
              <option value="NDLS-GZB" className="bg-[#162035] text-white">NDLS-GZB (New Delhi - Ghaziabad)</option>
              <option value="GZB-ALJN" className="bg-[#162035] text-white">GZB-ALJN (Ghaziabad - Aligarh)</option>
              <option value="ALJN-TDL" className="bg-[#162035] text-white">ALJN-TDL (Aligarh - Tundla)</option>
              <option value="CNB-PRYJ" className="bg-[#162035] text-white">CNB-PRYJ (Kanpur - Prayagraj)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold text-[11px] uppercase tracking-wider mb-1">Delay Magnitude (Minutes):</label>
            <input
              type="number"
              min="10"
              max="240"
              value={delayMinutes}
              onChange={e => setDelayMinutes(Number(e.target.value))}
              required
              className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50 text-[11px] text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>
              The solver will isolate collided candidate windows on this corridor, return affected tasks to queue, and re-solve with CP-SAT warm start.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition border border-slate-700/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Zap className="w-3.5 h-3.5" /> Inject & Reoptimize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
