import React, { useState } from 'react';
import {
  X,
  Sliders,
  Play,
  ArrowRight,
  TrendingDown,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { WhatIfResponse, BlockPlan } from '../types';
import { simulateWhatIf } from '../services/api';
import { Badge } from './ui/Badge';

interface WhatIfModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BlockPlan | null;
  onApplyReplan: (trainNo: string, sectionId: string, delayMins: number) => void;
}

export const WhatIfModal: React.FC<WhatIfModalProps> = ({
  isOpen,
  onClose,
  plan,
  onApplyReplan,
}) => {
  const [perturbationType, setPerturbationType] = useState<'TRAIN_DELAY' | 'EXPAND_DURATION' | 'SHIFT_BLOCK'>('TRAIN_DELAY');
  const [trainNumber, setTrainNumber] = useState<string>('12004');
  const [sectionId, setSectionId] = useState<string>('GZB-ALJN');
  const [delayMinutes, setDelayMinutes] = useState<number>(45);
  const [extraMinutes, setExtraMinutes] = useState<number>(60);
  const [shiftMinutes, setShiftMinutes] = useState<number>(60);

  const [loading, setLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<WhatIfResponse | null>(null);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await simulateWhatIf({
        perturbation_type: perturbationType,
        train_number: trainNumber,
        section_id: sectionId,
        delay_minutes: delayMinutes,
        extra_minutes: extraMinutes,
        shift_minutes: shiftMinutes,
      });
      setSimulationResult(res);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = () => {
    onApplyReplan(trainNumber, sectionId, delayMinutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">What-If Scenario Simulator</h3>
              <p className="text-xs text-slate-500">
                Simulate schedule impact under operational perturbations without modifying live plan.
              </p>
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

        {/* Body */}
        <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* Condition Selectors */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                1. Select Planning Perturbation Condition
              </span>
              <Badge variant="info" size="sm">Real Optimizer Evaluation</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPerturbationType('TRAIN_DELAY')}
                className={`p-2.5 rounded-lg border text-left font-medium transition ${
                  perturbationType === 'TRAIN_DELAY'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <strong className="block text-xs">Train Delay</strong>
                <span className="text-[11px] text-slate-500">Inject timetable delay</span>
              </button>

              <button
                type="button"
                onClick={() => setPerturbationType('EXPAND_DURATION')}
                className={`p-2.5 rounded-lg border text-left font-medium transition ${
                  perturbationType === 'EXPAND_DURATION'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <strong className="block text-xs">Expand Duration</strong>
                <span className="text-[11px] text-slate-500">Increase maintenance time</span>
              </button>

              <button
                type="button"
                onClick={() => setPerturbationType('SHIFT_BLOCK')}
                className={`p-2.5 rounded-lg border text-left font-medium transition ${
                  perturbationType === 'SHIFT_BLOCK'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <strong className="block text-xs">Move Block Slot</strong>
                <span className="text-[11px] text-slate-500">Shift window timing</span>
              </button>
            </div>

            {/* Condition Parameters */}
            {perturbationType === 'TRAIN_DELAY' && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Train Number</label>
                  <input
                    type="text"
                    value={trainNumber}
                    onChange={e => setTrainNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 12004"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    value={sectionId}
                    onChange={e => setSectionId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ANVT-GZB">ANVT-GZB</option>
                    <option value="GZB-ALJN">GZB-ALJN</option>
                    <option value="ALJN-TDL">ALJN-TDL</option>
                    <option value="TDL-CNB">TDL-CNB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Delay Duration</label>
                  <select
                    value={delayMinutes}
                    onChange={e => setDelayMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value={15}>+15 minutes</option>
                    <option value={30}>+30 minutes</option>
                    <option value={45}>+45 minutes</option>
                    <option value={60}>+60 minutes</option>
                    <option value={90}>+90 minutes</option>
                  </select>
                </div>
              </div>
            )}

            {perturbationType === 'EXPAND_DURATION' && (
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Additional Duration</label>
                <select
                  value={extraMinutes}
                  onChange={e => setExtraMinutes(Number(e.target.value))}
                  className="w-full max-w-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value={30}>+30 minutes (Minor extension)</option>
                  <option value={60}>+60 minutes (Standard overhaul)</option>
                  <option value={120}>+120 minutes (Heavy track renewal)</option>
                </select>
              </div>
            )}

            {perturbationType === 'SHIFT_BLOCK' && (
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Timing Shift</label>
                <select
                  value={shiftMinutes}
                  onChange={e => setShiftMinutes(Number(e.target.value))}
                  className="w-full max-w-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value={30}>+30 minutes later</option>
                  <option value={60}>+60 minutes later</option>
                  <option value={-60}>-60 minutes earlier</option>
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleSimulate}
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Evaluating Scenario Impact...' : 'Run What-If Simulation'}</span>
            </button>
          </div>

          {/* Simulation Output: Before / After Comparison */}
          {simulationResult && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                2. Before vs. After Plan Impact
              </h4>

              {/* Comparison Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Current Plan Card */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">CURRENT PLAN</span>
                    <Badge variant="neutral" size="sm">Baseline</Badge>
                  </div>
                  <div className="space-y-1 text-slate-800 font-medium">
                    <div className="text-sm font-bold">{simulationResult.current_plan.possession_hours}h possession</div>
                    <div>{simulationResult.current_plan.scheduled_tasks} tasks scheduled</div>
                    <div>{simulationResult.current_plan.combined_blocks} combined blocks</div>
                  </div>
                </div>

                {/* What-If Plan Card */}
                <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">WHAT-IF PLAN</span>
                    <Badge variant="info" size="sm">Simulated</Badge>
                  </div>
                  <div className="space-y-1 text-blue-950 font-medium">
                    <div className="text-sm font-bold">{simulationResult.what_if_plan.possession_hours}h possession</div>
                    <div>{simulationResult.what_if_plan.scheduled_tasks} tasks scheduled</div>
                    <div>{simulationResult.what_if_plan.combined_blocks} combined blocks</div>
                  </div>
                </div>
              </div>

              {/* Impact Delta Summary Box */}
              <div className="p-4 rounded-lg bg-slate-900 text-white shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300 uppercase tracking-wider text-[10px]">
                    OPERATIONAL IMPACT DELTA
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">✓ Feasible Plan</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
                  <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">Possession Delta</span>
                    <strong className="text-amber-400 text-sm">{simulationResult.impact.possession_delta_label}</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">Bundles Status</span>
                    <strong className="text-slate-200 text-sm">{simulationResult.impact.bundles_lost_label}</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">Blocks Re-aligned</span>
                    <strong className="text-blue-400 text-sm">{simulationResult.impact.blocks_moved_label}</strong>
                  </div>
                </div>

                {/* Reasons / Narrative */}
                <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-300 font-sans">
                  {simulationResult.impact.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-400">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-semibold transition"
          >
            Close
          </button>

          {simulationResult && (
            <button
              type="button"
              onClick={handleExecute}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Apply & Re-plan Schedule</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
