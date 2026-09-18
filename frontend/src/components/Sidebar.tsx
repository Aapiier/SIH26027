import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Network,
  AlertTriangle,
  FileText,
  HelpCircle,
  Database,
  Train,
  RotateCcw
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'maintenance'
  | 'block-plan'
  | 'network'
  | 'disruptions'
  | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenHelp: () => void;
  onResetDemo?: () => void;
  urgentCount?: number;
  disruptionCount?: number;
  resetting?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenHelp,
  onResetDemo,
  urgentCount = 0,
  disruptionCount = 0,
  resetting = false,
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: ClipboardList,
      badge: urgentCount > 0 ? urgentCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'block-plan',
      label: 'Block Plan',
      icon: Calendar,
    },
    {
      id: 'network',
      label: 'Network',
      icon: Network,
    },
    {
      id: 'disruptions',
      label: 'Disruptions',
      icon: AlertTriangle,
      badge: disruptionCount > 0 ? disruptionCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: FileText,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none text-slate-300">
      {/* Top: Logo & Title */}
      <div>
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">RailSync AI</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                SIH26027
              </span>
            </div>
            <p className="text-xs text-slate-400">Railway Maintenance Planning</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Demo Controls & Help Guide */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* Simulation Environment Indicator */}
        <div className="px-3.5 py-2 rounded-md bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-medium">Environment</span>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-mono">
            SIMULATION
          </span>
        </div>

        {/* Demo Controls Header */}
        <div className="pt-1">
          <div className="px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Demo Controls</span>
            <span className="text-[9px] text-blue-400 font-mono">Canonical</span>
          </div>

          {/* Reset Demo Button */}
          {onResetDemo && (
            <button
              type="button"
              onClick={onResetDemo}
              disabled={resetting}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-md text-xs font-semibold bg-blue-950/40 hover:bg-blue-900/60 text-blue-200 border border-blue-800/50 hover:border-blue-700 transition-all disabled:opacity-50"
              title="Restore the deterministic demonstration state before presenting."
            >
              <div className="flex items-center gap-2">
                <RotateCcw className={`w-3.5 h-3.5 text-blue-400 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Restoring Baseline...' : 'Reset Demo'}</span>
              </div>
              <span className="text-[10px] font-mono text-blue-300">Prinstine</span>
            </button>
          )}
        </div>

        {/* Help & Concepts Button */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Help & Definitions</span>
        </button>
      </div>
    </aside>
  );
};
