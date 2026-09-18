import React from 'react';
import {
  RefreshCw,
  Zap,
  Play,
  BarChart2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';
import { DashboardMetrics } from '../types';

interface HeaderProps {
  metrics: DashboardMetrics | null;
  onSync: () => void;
  onPrioritize: () => void;
  onOptimize: (horizon: string) => void;
  onBenchmarkClick: () => void;
  onValidationClick: () => void;
  onDisruptionClick: () => void;
  onApprovePublish: () => void;
  selectedHorizon: string;
  onHorizonChange: (horizon: string) => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  onSync,
  onPrioritize,
  onOptimize,
  onBenchmarkClick,
  onValidationClick,
  onDisruptionClick,
  onApprovePublish,
  selectedHorizon,
  onHorizonChange,
  loading
}) => {
  const planStatus = metrics?.active_plan_status || 'NO_PLAN';
  const valStatus = metrics?.validation_status || 'UNVALIDATED';
  const isPassed = valStatus === 'PASSED';

  return (
    <header className="bg-[#111622] border-b border-[#252f44] px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Operational Context */}
        <div className="flex items-center space-x-3">
          <div className="bg-[#1e293b] p-2 rounded border border-[#3b82f6]/40 flex items-center justify-center">
            <Radio className="w-5 h-5 text-[#3b82f6] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                RailSync AI
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#1e293b] text-[#93c5fd] border border-[#3b82f6]/30">
                  SIH26027
                </span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                SIMULATED OCC
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] flex items-center gap-2">
              <span>Corridor: <strong className="text-[#cbd5e1]">{metrics?.corridor || 'Bilaspur - Nagpur (BSP-NGP)'}</strong></span>
              <span className="text-[#475569]">•</span>
              <span>Model: <strong className="text-[#60a5fa]">{metrics?.model_version || 'v2.0.0 LightGBM (14d Risk)'}</strong></span>
            </p>
          </div>
        </div>

        {/* Center: Live Status Telemetry Badges */}
        <div className="hidden lg:flex items-center space-x-2 bg-[#0b0f17] px-3 py-1.5 rounded border border-[#1e293b] text-xs">
          <div className="flex items-center space-x-1.5 pr-3 border-r border-[#1e293b]">
            <span className="text-[#64748b]">Horizon:</span>
            <select
              value={selectedHorizon}
              onChange={(e) => onHorizonChange(e.target.value)}
              className="bg-[#1e293b] text-[#e2e8f0] font-mono text-xs px-2 py-0.5 rounded border border-[#334155] focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="WEEKLY">WEEKLY (48h Tactical)</option>
              <option value="MONTHLY">MONTHLY (30d Strategic)</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 pr-3 border-r border-[#1e293b]">
            <span className="text-[#64748b]">Plan State:</span>
            <span className={`px-2 py-0.5 rounded font-mono font-semibold ${
              planStatus === 'APPROVED' || planStatus === 'PUBLISHED'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : planStatus === 'RECOMMENDED'
                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {planStatus}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 cursor-pointer hover:opacity-80" onClick={onValidationClick}>
            <span className="text-[#64748b]">Sentinel:</span>
            <span className={`px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1 ${
              isPassed
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'bg-red-950 text-red-300 border border-red-700'
            }`}>
              {isPassed ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-red-400" />}
              {valStatus}
            </span>
          </div>
        </div>

        {/* Right: Operational Action Triggers */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onSync}
            disabled={loading}
            title="Sync simulated defect & timetable data from canonical database"
            className="px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-xs text-[#cbd5e1] rounded border border-[#334155] flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={onPrioritize}
            disabled={loading}
            title="Run Tier 1 Safety Gates + ML Failure Risk Prioritization"
            className="px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-xs text-[#60a5fa] rounded border border-[#3b82f6]/40 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>AI Priority</span>
          </button>

          <button
            onClick={() => onOptimize(selectedHorizon)}
            disabled={loading}
            title="Execute Google OR-Tools CP-SAT Constrained Block Optimization"
            className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-xs text-white font-semibold rounded border border-[#3b82f6] flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>CP-SAT Solve</span>
          </button>

          <button
            onClick={onBenchmarkClick}
            disabled={loading}
            title="Compare CP-SAT against Deterministic Greedy Baseline"
            className="px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-xs text-[#a78bfa] rounded border border-[#8b5cf6]/40 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <BarChart2 className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>Benchmark</span>
          </button>

          <button
            onClick={onValidationClick}
            title="Inspect Sentinel Independent Integrity Checks & Hash"
            className="px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-xs text-[#34d399] rounded border border-[#10b981]/40 flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#34d399]" />
            <span>Sentinel</span>
          </button>

          <button
            onClick={onDisruptionClick}
            title="Simulate train delay or track disruption"
            className="px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-xs text-[#fbbf24] rounded border border-[#f59e0b]/40 flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>Disruption</span>
          </button>

          <button
            onClick={onApprovePublish}
            disabled={!metrics?.plan_id || loading}
            title="Authorize and publish validated schedule to sectional controllers"
            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-xs text-white font-semibold rounded border border-emerald-500 flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        </div>
      </div>
    </header>
  );
};
