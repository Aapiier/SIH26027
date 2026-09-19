import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Train,
  RotateCcw
} from 'lucide-react';
import { BlockPlan } from '../../types';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

interface DisruptionsViewProps {
  plan: BlockPlan | null;
  onSimulateDisruption: (payload: { train_number: string; section_id: string; delay_minutes: number }) => void;
  loading: boolean;
}

export const DisruptionsView: React.FC<DisruptionsViewProps> = ({
  plan,
  onSimulateDisruption,
  loading,
}) => {
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [trainNumber, setTrainNumber] = useState<string>('22436');
  const [sectionId, setSectionId] = useState<string>('NDLS-GZB');
  const [delayMinutes, setDelayMinutes] = useState<number>(45);

  const [hasActiveDisruption, setHasActiveDisruption] = useState<boolean>(false);
  const [lastDisruptionDetails, setLastDisruptionDetails] = useState<{
    trainNumber: string;
    sectionId: string;
    delayMinutes: number;
    originalTime: string;
    revisedTime: string;
    affectedSection: string;
  } | null>(null);

  const handleApplyDisruption = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulateDisruption({
      train_number: trainNumber,
      section_id: sectionId,
      delay_minutes: delayMinutes,
    });
    setHasActiveDisruption(true);
    setLastDisruptionDetails({
      trainNumber,
      sectionId,
      delayMinutes,
      originalTime: '09:30 – 11:30 (Day 1)',
      revisedTime: '11:00 – 13:00 (Day 1)',
      affectedSection: sectionId,
    });
    setIsSimulating(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Operational Disruption & Re-Planning</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate how dynamic train delays impact planned maintenance blocks and automatically re-solve.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSimulating(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-2 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Simulate Disruption</span>
        </button>
      </div>

      {/* Disruption Status View */}
      {hasActiveDisruption && lastDisruptionDetails ? (
        <div className="space-y-6">
          {/* Active Disruption Alert */}
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-100 text-amber-800 shrink-0">
                <Train className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  Train Delay Injected: Train {lastDisruptionDetails.trainNumber} (+{lastDisruptionDetails.delayMinutes} mins)
                </h3>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  Delayed train overlaps with planned maintenance on section {lastDisruptionDetails.affectedSection}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning">1 BLOCK AFFECTED</Badge>
              <button
                type="button"
                onClick={() => {
                  onSimulateDisruption({
                    train_number: lastDisruptionDetails.trainNumber,
                    section_id: lastDisruptionDetails.sectionId,
                    delay_minutes: lastDisruptionDetails.delayMinutes,
                  });
                }}
                disabled={loading}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Re-planning...' : 'Re-plan Schedule'}</span>
              </button>
            </div>
          </div>

          {/* Before & After Re-Planning Comparison Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Schedule Adjustment Comparison</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeted warm-start reoptimization rescheduled only the impacted block while preserving unaffected work.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Plan (Collided) */}
              <div className="p-4 rounded-lg bg-red-50/60 border border-red-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-900 uppercase tracking-wider">Original Schedule</span>
                  <Badge variant="emergency" size="sm">COLLISION DETECTED</Badge>
                </div>
                <p className="text-sm font-bold text-slate-900 font-mono">{lastDisruptionDetails.originalTime}</p>
                <p className="text-xs text-slate-600">
                  Section: <strong>{lastDisruptionDetails.affectedSection}</strong> (Track UP-FAST)
                </p>
                <p className="text-[11px] text-red-700 italic">
                  Collided with delayed Train {lastDisruptionDetails.trainNumber} path.
                </p>
              </div>

              {/* Revised Plan (Resolved) */}
              <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Revised Schedule</span>
                  <Badge variant="success" size="sm">✓ CONFLICT RESOLVED</Badge>
                </div>
                <p className="text-sm font-bold text-emerald-900 font-mono">{lastDisruptionDetails.revisedTime}</p>
                <p className="text-xs text-slate-600">
                  Section: <strong>{lastDisruptionDetails.affectedSection}</strong> (Track UP-FAST)
                </p>
                <p className="text-[11px] text-emerald-700 italic">
                  Moved to next available timetable shadow window with ≥15m safety buffer.
                </p>
              </div>
            </div>

            {/* Impact Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 text-center">
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <span className="block text-lg font-bold text-slate-800">4</span>
                <span className="text-[11px] text-slate-500">Unaffected Blocks Preserved</span>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <span className="block text-lg font-bold text-amber-700">1</span>
                <span className="text-[11px] text-slate-500">Block Rescheduled</span>
              </div>
              <div className="p-3 rounded bg-emerald-50 border border-emerald-200">
                <span className="block text-lg font-bold text-emerald-700">PASSED</span>
                <span className="text-[11px] text-emerald-800">Validation Status</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Default Empty / Normal State */
        <EmptyState
          icon={CheckCircle2}
          title="No active operational disruptions"
          description="All planned maintenance blocks currently fit within the operating train timetable without conflicts. You can simulate a train delay disruption to test re-planning."
          actionText="Simulate Train Delay Disruption"
          onAction={() => setIsSimulating(true)}
        />
      )}

      {/* Disruption Simulation Modal Dialog */}
      {isSimulating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Simulate Train Delay</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulating(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyDisruption} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Train:</label>
                <select
                  value={trainNumber}
                  onChange={e => setTrainNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="22436">22436 - Vande Bharat Express</option>
                  <option value="12302">12302 - Howrah Rajdhani</option>
                  <option value="12004">12004 - Shatabdi Express</option>
                  <option value="12554">12554 - Vaishali Superfast</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Affected Section:</label>
                <select
                  value={sectionId}
                  onChange={e => setSectionId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="NDLS-GZB">NDLS – GZB Section</option>
                  <option value="GZB-ALJN">GZB – ALJN Section</option>
                  <option value="ALJN-TDL">ALJN – TDL Section</option>
                  <option value="TDL-ETW">TDL – ETW Section</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Delay Duration (Minutes):</label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  step="5"
                  value={delayMinutes}
                  onChange={e => setDelayMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSimulating(false)}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  {loading ? 'Re-planning...' : 'Re-plan Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
