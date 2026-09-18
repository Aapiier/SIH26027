import React from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Clock,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { OpportunityEvaluation } from '../types';
import { Badge } from './ui/Badge';

interface OpportunityDrawerProps {
  opportunity: OpportunityEvaluation | null;
  loading: boolean;
  onClose: () => void;
}

export const OpportunityDrawer: React.FC<OpportunityDrawerProps> = ({
  opportunity,
  loading,
  onClose,
}) => {
  if (!opportunity && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-slideInRight">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Maintenance Opportunity</h2>
                <Badge variant="info" size="sm">Decision Support</Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono">Slot ID: {opportunity?.item_id || 'Evaluating...'}</p>
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

        {/* Content Body */}
        {loading ? (
          <div className="p-8 flex-1 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Evaluating corridor opportunity scores...</span>
          </div>
        ) : opportunity ? (
          <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
            {/* Opportunity Score Hero Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white shadow-md relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-300 font-semibold uppercase tracking-wider text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    <span>Maintenance Opportunity Score</span>
                    <span
                      title={opportunity.tooltip}
                      className="cursor-help text-slate-400 hover:text-white transition"
                    >
                      <HelpCircle className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-white">{opportunity.score}</span>
                    <span className="text-slate-400 text-sm font-semibold">/ 100</span>
                    <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Highest Operational Value
                    </span>
                  </div>
                </div>
              </div>

              {/* Tooltip description banner */}
              <div className="mt-3 pt-3 border-t border-slate-700/60 text-[11px] text-slate-300 flex items-center gap-1.5">
                <InfoIcon className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>{opportunity.tooltip}</span>
              </div>
            </div>

            {/* Recommended Window Overview Card */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Recommended Window Overview</span>
                <span className="text-emerald-700 font-semibold lowercase">✓ optimal slot</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Recommended Window</span>
                  <strong className="text-slate-900 font-mono text-sm">{opportunity.recommended_window}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Location Section</span>
                  <strong className="text-slate-900 text-sm">{opportunity.section_id}</strong>
                  <span className="text-slate-500 text-[10px] block font-mono">{opportunity.track_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Maintenance Scope</span>
                  <strong className="text-slate-900">{opportunity.tasks_count} tasks included</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Synchronized Depts</span>
                  <strong className="text-slate-900">{opportunity.departments.join(', ') || 'Multi-Dept'}</strong>
                </div>
              </div>
            </div>

            {/* Why This Window? (Bullet Explanations) */}
            <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-2.5">
              <h4 className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Why this Window?</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-900 font-medium">
                {opportunity.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Alternative Feasible Windows */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Alternative Windows on Corridor
                </h4>
                <span className="text-[11px] text-slate-500">Track: {opportunity.track_id}</span>
              </div>

              <div className="space-y-2">
                {opportunity.alternatives.map((alt, idx) => {
                  const isRecommended = alt.status === 'ALTERNATIVE' && alt.score >= 75;
                  const isSuboptimal = alt.status === 'ALTERNATIVE' || alt.status === 'SUBOPTIMAL';
                  const isInfeasible = alt.status === 'INFEASIBLE';

                  let badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                  if (isRecommended) badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
                  if (isInfeasible) badgeColor = 'bg-red-100 text-red-800 border-red-300';

                  return (
                    <div
                      key={alt.window_id || idx}
                      className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <strong className="font-mono text-xs text-slate-900">{alt.window_label}</strong>
                          <span className="text-slate-500 font-mono text-[11px]">({alt.duration_minutes}m)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-700">Score: {alt.score}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                            {alt.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">{alt.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score Component Breakdown Breakdown */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Objective Weight Contribution Breakdown
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>Base Maint:</span>
                  <strong className="text-slate-800">+{opportunity.breakdown.base_maintenance_value}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Asset Risk:</span>
                  <strong className="text-emerald-700">+{opportunity.breakdown.asset_risk_value}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Bundling Sync:</span>
                  <strong className="text-blue-700">+{opportunity.breakdown.bundling_benefit}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Urgency:</span>
                  <strong className="text-slate-800">+{opportunity.breakdown.urgency_value}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Traffic Density:</span>
                  <strong className="text-red-600">-{opportunity.breakdown.traffic_penalty}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Possession Cost:</span>
                  <strong className="text-red-600">-{opportunity.breakdown.possession_penalty}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
