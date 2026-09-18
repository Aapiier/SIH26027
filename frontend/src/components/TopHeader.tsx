import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, MapPin } from 'lucide-react';
import { DashboardMetrics } from '../types';
import { NavTab } from './Sidebar';

interface TopHeaderProps {
  activeTab: NavTab;
  metrics: DashboardMetrics | null;
  onRefresh: () => void;
  loading: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  metrics,
  onRefresh,
  loading,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Railway Operations Overview',
      subtitle: 'Review maintenance demand, active track possessions, and items requiring attention.',
    },
    maintenance: {
      title: 'Maintenance Requests',
      subtitle: 'Review pending maintenance work and understand what should be planned first.',
    },
    'block-plan': {
      title: 'Block Plan',
      subtitle: 'Review, optimize, and manage scheduled track maintenance blocks across the corridor.',
    },
    network: {
      title: 'Corridor Network',
      subtitle: 'View maintenance activity, section occupancy, and infrastructure status across stations.',
    },
    disruptions: {
      title: 'Operational Disruptions',
      subtitle: 'Simulate train delays and re-plan impacted maintenance blocks seamlessly.',
    },
    audit: {
      title: 'Activity & Audit Trail',
      subtitle: 'Review immutable chronological records of all schedule generation and adjustments.',
    },
  };

  const { title, subtitle } = titles[activeTab];
  const isPlanValidated = metrics?.validation_status === 'PASSED';

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
      {/* Left: Page Title & Subtitle */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Right: Operational Status Badges & Refresh */}
      <div className="flex items-center gap-3">
        {/* Corridor Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{metrics?.corridor || 'NDLS – PRYJ Corridor'}</span>
        </div>

        {/* Planning Horizon Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Horizon: <strong>Next 48 Hours</strong></span>
        </div>

        {/* Plan Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border ${
            isPlanValidated
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
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

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
