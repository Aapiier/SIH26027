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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface2 border border-rose-800/60 rounded max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 border-b border-border1 pb-3">
          <div className="p-2 rounded bg-rose-950 text-rose-400 border border-rose-700/50">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Simulate Live Train Delay Disruption</h3>
            <p className="text-xs text-slate-400">Triggers targeted reoptimization preserving unaffected blocks</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 font-mono mb-1">Delayed Train Number:</label>
            <select
              value={trainNumber}
              onChange={e => setTrainNumber(e.target.value)}
              className="w-full bg-surface1 border border-border1 rounded p-2 text-white font-mono focus:border-rose-500 focus:outline-none"
            >
              <option value="22436">22436 - Vande Bharat Express</option>
              <option value="12302">12302 - Howrah Rajdhani</option>
              <option value="12004">12004 - Shatabdi Express</option>
              <option value="12554">12554 - Vaishali Superfast</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Corridor Section Affected:</label>
            <select
              value={sectionId}
              onChange={e => setSectionId(e.target.value)}
              className="w-full bg-surface1 border border-border1 rounded p-2 text-white font-mono focus:border-rose-500 focus:outline-none"
            >
              <option value="NDLS-GZB">NDLS-GZB (New Delhi - Ghaziabad)</option>
              <option value="GZB-ALJN">GZB-ALJN (Ghaziabad - Aligarh)</option>
              <option value="ALJN-TDL">ALJN-TDL (Aligarh - Tundla)</option>
              <option value="CNB-PRYJ">CNB-PRYJ (Kanpur - Prayagraj)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Delay Magnitude (Minutes):</label>
            <input
              type="number"
              min="10"
              max="240"
              value={delayMinutes}
              onChange={e => setDelayMinutes(Number(e.target.value))}
              required
              className="w-full bg-surface1 border border-border1 rounded p-2 text-white font-mono focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="bg-rose-950/30 p-2.5 rounded border border-rose-800/40 text-[11px] text-rose-300 flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>
              The solver will isolate collided shadow windows on this corridor, return affected tasks to queue, and re-solve with warm start.
            </span>
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
              className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-rose-600/20"
            >
              <Zap className="w-3.5 h-3.5" /> Inject & Reoptimize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
