import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  MapPin,
  Wrench,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  BarChart2,
  Zap,
  ShieldAlert,
  Info
} from 'lucide-react';
import { TaskExplanation, MaintenanceRequest } from '../../types';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';

interface TaskDetailDrawerProps {
  explanation: TaskExplanation | null;
  task?: MaintenanceRequest | null;
  onClose: () => void;
  onFindBlock?: (taskId: string) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  explanation,
  task,
  onClose,
  onFindBlock,
}) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const [markedReviewed, setMarkedReviewed] = useState(false);

  if (!explanation && !task) return null;

  const reqId = explanation?.request_id || task?.request_id || '';
  const defectType = task?.defect_type || explanation?.explanation || 'Track Maintenance';
  const department = task?.department || 'ENGINEERING';
  const sectionId = task?.section_id || explanation?.asset_info?.section_id || 'NDLS-GZB';
  const trackId = task?.track_id || explanation?.asset_info?.track_id || 'MAIN-UP';
  const severity = task?.severity || 'CRITICAL';
  const duration = task?.duration_minutes || explanation?.duration_minutes || 120;
  const status = task?.status || explanation?.status || 'UNSCHEDULED';

  const riskCtx = explanation?.ai_risk_context;
  const riskProb = riskCtx?.predicted_failure_risk ?? (task?.ai_risk_score || 0.45);
  const riskPercent = Math.round(riskProb * 100);

  const isEmergency =
    severity === 'EMERGENCY' ||
    defectType.includes('FRACTURE') ||
    defectType.includes('POINT_MACHINE');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-slideInRight">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                isEmergency
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Maintenance Request</h2>
                <Badge variant={isEmergency ? 'emergency' : 'warning'} size="sm">
                  {severity}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono">ID: {reqId}</p>
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

        {/* Body Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Defect & Location Summary Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Issue Description</span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{defectType.replace(/_/g, ' ')}</h3>
              </div>
              <Badge variant={department === 'ENGINEERING' ? 'eng' : department === 'SIGNAL_TELECOM' ? 'snt' : 'trd'}>
                {department.replace('_', ' ')}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Location</span>
                <strong className="text-slate-800">{sectionId}</strong>
                <span className="text-slate-500 block text-[11px] font-mono">{trackId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Duration Required</span>
                <strong className="text-slate-800">{Math.round(duration / 60)}h {duration % 60}m</strong>
                <span className="text-slate-500 block text-[11px]">Status: {status}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Asset Risk Assessment (Plain Language) */}
          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-bold text-blue-950">Asset Risk Assessment</h4>
              </div>
              <span className="text-xs font-bold text-blue-900">{riskPercent}% Risk</span>
            </div>

            {/* Visual Risk Bar */}
            <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  riskPercent > 70 ? 'bg-red-600' : riskPercent > 40 ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, riskPercent))}%` }}
              />
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {isEmergency
                ? 'Safety-critical defect detected. High risk of train operation disruption or track speed restrictions if not addressed promptly.'
                : 'Asset wear rate is elevated under current corridor traffic tonnage. Proactive maintenance within 14 days is advised.'}
            </p>
          </div>

          {/* Section 2: Why is this important? */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Why is this important?</h4>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
              <p>
                {explanation?.explanation ||
                  'Recent track geometry and ultrasonic testing indicate accumulated wear. Addressing this defect during a scheduled shadow window prevents emergency speed restrictions.'}
              </p>
              {explanation?.recommendation && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <strong>Recommendation:</strong> {explanation.recommendation}
                </div>
              )}
            </div>
          </div>

          {/* Controller Recommendation Notice */}
          <div className="p-3 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>AI recommendation for decision support. Final block authorization remains with the controller.</span>
          </div>

          {/* Section 4: Expandable Technical Details */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTechnical(!showTechnical)}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-500" />
                <span>Technical & Model Details</span>
              </div>
              {showTechnical ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showTechnical && (
              <div className="p-3.5 bg-white border-t border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Model Name:</span>
                    <p className="font-mono font-semibold text-slate-800">{riskCtx?.model_name || 'HistGradientBoosting GBDT (v2.0)'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Model Version:</span>
                    <p className="font-mono font-semibold text-slate-800">{riskCtx?.model_version || '2.0.0-longitudinal'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Raw Risk Probability:</span>
                    <p className="font-mono font-semibold text-slate-800">{riskProb.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Evaluation Target:</span>
                    <p className="font-mono font-semibold text-slate-800">failure_within_14d</p>
                  </div>
                </div>

                {/* Feature Attribution Bars */}
                {riskCtx?.feature_attributions && Object.keys(riskCtx.feature_attributions).length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-2">Key Contributing Factors (Attribution)</span>
                    <div className="space-y-1.5">
                      {Object.entries(riskCtx.feature_attributions)
                        .slice(0, 4)
                        .map(([feat, score]) => (
                          <div key={feat} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600">{feat.replace(/_/g, ' ')}</span>
                            <span className="font-mono text-slate-800">{(score * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMarkedReviewed(!markedReviewed)}
            className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
              markedReviewed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {markedReviewed ? '✓ Marked Reviewed' : 'Mark Reviewed'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (onFindBlock) onFindBlock(reqId);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
          >
            Find in Block Plan →
          </button>
        </div>
      </div>
    </div>
  );
};
