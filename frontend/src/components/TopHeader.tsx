import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, MapPin, Sparkles, Plus, Play, Database } from 'lucide-react';
import { DashboardMetrics } from '../types';
import { NavTab } from './Sidebar';

interface TopHeaderProps {
  activeTab: NavTab;
  metrics: DashboardMetrics | null;
  onRefresh: () => void;
  onOpenSimulation?: () => void;
  onOpenGenerateScenario?: () => void;
  loading: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  metrics,
  onRefresh,
  onOpenSimulation,
  onOpenGenerateScenario,
  loading,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Railway Operations Overview',
      subtitle: 'Operational briefing on maintenance demand, active possessions, and safety-critical requests.',
    },
    maintenance: {
      title: 'Maintenance Request Queue',
      subtitle: 'Track work-orders across Civil, S&T, and TRD with risk-informed operational prioritization.',
    },
    'block-plan': {
      title: 'Master Corridor Block Plan',
      subtitle: '48-hour collision-free multi-track possession schedule synchronized with train timetables.',
    },
    network: {
      title: 'Corridor Topology & Infrastructure',
      subtitle: 'Sectional occupancy, electrification status, speed restrictions, and track geometry.',
    },
    disruptions: {
      title: 'Incident & Disruption Management',
      subtitle: 'Dynamic train perturbation simulation, conflict isolation, and automated timetable re-solving.',
    },
    audit: {
      title: 'Operations Ledger & Audit Trail',
      subtitle: 'Immutable chronological record of schedule generation, controller overrides, and safety validations.',
    },
  };

  const { title, subtitle } = titles[activeTab];
  const isPlanValidated = metrics?.validation_status === 'PASSED';

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      {/* Left: Page Title & Context */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          {isPlanValidated ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Validated Plan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3 h-3" />
              Pending Re-solve
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Right: Operational Status Badges & Quick Tools */}
      <div className="flex items-center gap-2.5">
        {/* Scenario Generator Tool */}
        {onOpenGenerateScenario && (
          <button
            type="button"
            onClick={onOpenGenerateScenario}
            disabled={loading}
            className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Generate a fresh randomized railway simulation scenario"
          >
            <span>🎲</span>
            <span>Scenarios</span>
          </button>
        )}

        {/* Manual Simulation Tool */}
        {onOpenSimulation && (
          <button
            type="button"
            onClick={onOpenSimulation}
            className="px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Open Interactive Live Demo Simulation Console"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Add Simulation Data</span>
          </button>
        )}

        {/* Corridor Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium">{metrics?.corridor || 'NDLS – PRYJ Corridor'}</span>
        </div>

        {/* Planning Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
          {isPlanValidated ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Plan Validated</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Needs Planning</span>
            </>
          )}
        </div>

        {/* Refresh Data Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>
    </header>
  );
};
