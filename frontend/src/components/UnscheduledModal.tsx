import React from 'react';
import { HelpCircle, X, AlertOctagon, Lightbulb } from 'lucide-react';

interface UnscheduledModalProps {
  explanation: any | null;
  onClose: () => void;
}

export const UnscheduledModal: React.FC<UnscheduledModalProps> = ({ explanation, onClose }) => {
  if (!explanation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface2 border border-border1 rounded max-w-lg w-full p-5 flex flex-col gap-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 border-b border-border1 pb-3">
          <div className="p-2 rounded bg-rose-950 text-rose-400 border border-rose-700/50">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Unscheduled Task Diagnostic Feasibility</h3>
            <p className="text-xs font-mono text-slate-400">Request: {explanation.request_id}</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Root Cause:</span>
            <div className="mt-1 font-mono text-rose-300 font-bold bg-rose-950/40 p-2 rounded border border-rose-800/40">
              {explanation.root_cause || 'NO_FEASIBLE_WINDOW'}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Mathematical Explanation:</span>
            <p className="mt-1 text-slate-200 bg-surface1 p-2.5 rounded border border-border1/60 leading-relaxed">
              {explanation.explanation}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Operational Dispatch Recommendation:
            </span>
            <p className="mt-1 text-amber-200 bg-amber-950/30 p-2.5 rounded border border-amber-800/40 leading-relaxed">
              {explanation.recommendation}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-surface3 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
