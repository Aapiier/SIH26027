import React from 'react';
import { Activity, ShieldAlert, Cpu, RefreshCw, Zap } from 'lucide-react';

interface HeaderProps {
  onSync: () => void;
  onPrioritize: () => void;
  onOptimize: () => void;
  onDisruptionClick: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSync,
  onPrioritize,
  onOptimize,
  onDisruptionClick,
  loading
}) => {
  return (
    <header className="bg-surface1 border-b border-border1 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              RailSync AI <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-mono">SIH26027</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">Automatic Multi-Department Block Planning Decision Support System</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={onSync}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-surface2 hover:bg-surface3 border border-border1 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          Sync Data
        </button>

        <button
          onClick={onPrioritize}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-surface2 hover:bg-surface3 border border-border1 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          AI Prioritization
        </button>

        <button
          onClick={onOptimize}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-300" />
          Solve OR-Tools CP-SAT
        </button>

        <button
          onClick={onDisruptionClick}
          className="px-3 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-700/50 text-xs font-medium text-rose-300 flex items-center gap-1.5 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          Simulate Disruption
        </button>
      </div>
    </header>
  );
};
