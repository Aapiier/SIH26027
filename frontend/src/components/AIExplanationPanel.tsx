import React from 'react';
import {
  X,
  ShieldAlert,
  Activity,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Layers,
  Clock,
  Compass,
  FileText,
  BarChart,
  Info
} from 'lucide-react';
import { TaskExplanation } from '../types';

interface AIExplanationPanelProps {
  explanation: TaskExplanation | null;
  onClose: () => void;
}

export const AIExplanationPanel: React.FC<AIExplanationPanelProps> = ({
  explanation,
  onClose
}) => {
  if (!explanation) return null;

  const isScheduled = explanation.status === 'SCHEDULED';
  const ai = explanation.ai_risk_context;
  const asset = explanation.asset_info;
  const attributions = ai?.feature_attributions || {};

  // Sort attributions by absolute impact
  const sortedAttributions = Object.entries(attributions).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#111622] border border-[#252f44] w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#dfe2ee]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#161c2d] border-b border-[#252f44] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isScheduled ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' : 'bg-amber-950/60 text-amber-400 border border-amber-800'
            }`}>
              {isScheduled ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">
                  {explanation.request_id}
                </h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold font-mono ${
                  isScheduled ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300'
                }`}>
                  {explanation.status}
                </span>
                {ai?.tier && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 font-mono">
                    {ai.tier}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94a3b8]">
                Asset: <strong className="text-white">{asset?.asset_name || asset?.asset_id || 'N/A'}</strong> ({asset?.department}) • Section: <strong className="text-white">{asset?.section_id}</strong> (Track: {asset?.track_id})
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
          {/* Top Row: AI Risk Score & Model Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Risk Gauge Card */}
            <div className="bg-[#0b0f17] p-4 rounded-lg border border-[#1e293b] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span className="font-semibold uppercase tracking-wider">Predicted Failure Risk</span>
                <Activity className="w-4 h-4 text-rose-400" />
              </div>
              <div className="my-2 text-center">
                <div className="text-3xl font-extrabold font-mono text-rose-400">
                  {ai?.predicted_failure_risk !== undefined ? `${(ai.predicted_failure_risk * 100).toFixed(1)}%` : '—'}
                </div>
                <div className="text-[11px] text-[#64748b] mt-0.5">
                  Target: <span className="font-mono text-slate-400">P(failure_within_14d)</span>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, (ai?.predicted_failure_risk || 0.1) * 100))}%` }}
                />
              </div>
              <div className="text-[10px] text-[#64748b] mt-1 text-center italic">
                * Predicted synthetic failure risk
              </div>
            </div>

            {/* Model Metadata Card */}
            <div className="bg-[#0b0f17] p-4 rounded-lg border border-[#1e293b] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span className="font-semibold uppercase tracking-wider">Predictive Model Spec</span>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Engine:</span>
                  <span className="text-[#93c5fd] font-semibold">{ai?.model_name || 'HistGradientBoosting GBDT'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Model Version:</span>
                  <span className="text-[#cbd5e1]">{ai?.model_version || 'v3.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Horizon:</span>
                  <span className="text-[#cbd5e1]">{ai?.prediction_horizon || '14 Days'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Calibrated Cutoff:</span>
                  <span className="text-[#cbd5e1]">{ai?.calibrated_threshold || 0.40}</span>
                </div>
              </div>
              <div className="text-[10px] text-[#64748b] bg-[#161c2d] p-1.5 rounded border border-[#1e293b]">
                {ai?.tier_description || 'Safety-gated priority scoring.'}
              </div>
            </div>

            {/* Asset Physical State Card */}
            <div className="bg-[#0b0f17] p-4 rounded-lg border border-[#1e293b] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span className="font-semibold uppercase tracking-wider">Asset Health Telemetry</span>
                <Compass className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Health Index:</span>
                  <span className={`font-semibold ${
                    (asset?.health_index || 90) < 65 ? 'text-rose-400' : (asset?.health_index || 90) < 80 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {asset?.health_index || '90.0'} / 100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Last Inspected:</span>
                  <span className="text-[#cbd5e1]">{asset?.last_inspected_days_ago || 10} days ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Criticality Rank:</span>
                  <span className="text-[#cbd5e1]">Weight {asset?.criticality_weight || 3} (1-5)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">KM Post:</span>
                  <span className="text-[#cbd5e1]">{asset?.start_km} - {asset?.end_km} km</span>
                </div>
              </div>
              <div className="text-[10px] text-[#64748b]">
                Category: <strong className="text-slate-300">{asset?.category || 'TRACK'}</strong>
              </div>
            </div>
          </div>

          {/* Local Feature Attribution (SHAP Proxy Breakdown) */}
          <div className="bg-[#0b0f17] p-4 rounded-lg border border-[#1e293b] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#93c5fd] flex items-center gap-1.5">
                <BarChart className="w-4 h-4" />
                Local Feature Attribution Breakdown
              </h3>
              <span className="text-[10px] text-[#64748b] font-mono">
                Contribution to P(failure_within_14d)
              </span>
            </div>

            <div className="space-y-2">
              {sortedAttributions.map(([feature, val], idx) => {
                const isPositive = val > 0;
                const barWidth = Math.min(100, Math.max(8, Math.abs(val) * 100));
                return (
                  <div key={idx} className="text-xs font-mono flex items-center justify-between gap-4">
                    <span className="w-56 text-[#94a3b8] truncate" title={feature}>
                      {feature}
                    </span>
                    <div className="flex-1 bg-slate-800/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className={`w-16 text-right font-semibold ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Feasibility & Recommendations */}
          <div className="bg-[#0b0f17] p-4 rounded-lg border border-[#1e293b] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              Operational Scheduling Rationale & Recommendation
            </h3>

            {isScheduled ? (
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded bg-emerald-950/30 border border-emerald-800/50 text-emerald-300">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Scheduled in Block: <span className="font-mono text-white">{explanation.block_id}</span>
                  </div>
                  <div className="mt-1 text-slate-300 font-mono">
                    Time: {explanation.scheduled_start ? new Date(explanation.scheduled_start).toUTCString() : 'N/A'} — {explanation.scheduled_end ? new Date(explanation.scheduled_end).toUTCString() : 'N/A'}
                  </div>
                  {explanation.is_bundled && (
                    <div className="mt-1 text-xs text-indigo-300 font-mono flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      Bundled with {explanation.bundled_task_ids?.length} collaborative tasks (Shared Possession Slot)
                    </div>
                  )}
                </div>
                <p className="text-[#94a3b8]">
                  <strong>Controller Recommendation:</strong> {explanation.recommendation || 'Proceed with field mobilization during scheduled possession.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded bg-amber-950/30 border border-amber-800/50 text-amber-300 space-y-1">
                  <div className="font-semibold font-mono flex items-center gap-1.5 text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Root Cause: {explanation.root_cause || 'CAPACITY_CONSTRAINED'}
                  </div>
                  <p className="text-slate-300">
                    {explanation.explanation}
                  </p>
                </div>
                <div className="p-3 rounded bg-blue-950/30 border border-blue-800/50 text-blue-200">
                  <span className="font-semibold text-white">Actionable Mitigation Recommendation:</span>
                  <p className="mt-0.5 text-slate-300">{explanation.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#161c2d] border-t border-[#252f44] flex items-center justify-between text-xs text-[#64748b]">
          <span>RailSync Decision Support • Synthetic Asset Degradation Model</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] font-semibold rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
