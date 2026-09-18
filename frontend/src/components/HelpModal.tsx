import React from 'react';
import { X, HelpCircle, BookOpen, Layers, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const definitions = [
    {
      term: 'Track Possession (Block)',
      icon: Clock,
      definition:
        'A designated time window during which normal train movements are halted or restricted on a specific track section to allow maintenance crews and heavy machinery to work safely.',
    },
    {
      term: 'Combined Maintenance (Bundling)',
      icon: Layers,
      definition:
        'Synchronizing compatible maintenance tasks from multiple departments (Engineering, Signalling, and Traction) into a single shared track possession, drastically reducing total corridor downtime.',
    },
    {
      term: 'Asset Risk Assessment',
      icon: AlertTriangle,
      definition:
        'Estimated probability of an infrastructure asset (rail, point machine, or OHE catenary) requiring urgent intervention within the next 14 days based on wear trends, traffic tonnage, and inspection history.',
    },
    {
      term: 'Plan Validation',
      icon: ShieldCheck,
      definition:
        'Automated safety verification ensuring that all planned blocks maintain strict train headway clearances (≥15 minutes), zero simultaneous track overlaps, and feasible heavy machinery transit between depots.',
    },
    {
      term: 'Disruption Re-planning',
      icon: BookOpen,
      definition:
        'Adjusting scheduled maintenance blocks when passenger or freight train delays occur. Unaffected blocks are preserved while impacted jobs are automatically moved to the next available conflict-free window.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full p-6 relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Railway Planning Concepts & Guide</h2>
              <p className="text-xs text-slate-500">Plain-language explanations of operational maintenance planning terms</p>
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

        {/* List of Concepts */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1">
          {definitions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex gap-3.5 items-start">
                <div className="p-2 rounded-md bg-white text-blue-600 border border-slate-200 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{item.term}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.definition}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
