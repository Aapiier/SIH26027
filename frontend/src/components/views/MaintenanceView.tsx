import React, { useState } from 'react';
import { Search, Filter, Wrench, AlertTriangle, ArrowUpDown, ChevronRight, Sparkles } from 'lucide-react';
import { MaintenanceRequest } from '../../types';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { NavTab } from '../Sidebar';

interface MaintenanceViewProps {
  tasks: MaintenanceRequest[];
  onSelectTask: (taskId: string) => void;
  onNavigate: (tab: NavTab) => void;
  onPrioritize?: () => void;
  loading?: boolean;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  tasks,
  onSelectTask,
  onNavigate,
  onPrioritize,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'HIGH_RISK' | 'PLANNED' | 'UNSCHEDULED'>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTasks = tasks.filter(t => {
    // 1. Tab filter
    if (activeTab === 'CRITICAL') {
      const isCritical =
        t.severity === 'EMERGENCY' ||
        t.severity === 'CRITICAL' ||
        ['RAIL_FRACTURE_RISK', 'POINT_MACHINE_DETECTION_FAILURE', 'OHE_CANTILEVER_FLASH_BURN'].includes(t.defect_type);
      if (!isCritical) return false;
    } else if (activeTab === 'HIGH_RISK') {
      if ((t.ai_risk_score || 0) < 0.5 && t.severity !== 'CRITICAL') return false;
    } else if (activeTab === 'PLANNED') {
      if (t.status !== 'SCHEDULED') return false;
    } else if (activeTab === 'UNSCHEDULED') {
      if (t.status === 'SCHEDULED') return false;
    }

    // 2. Department filter
    if (selectedDept !== 'ALL' && t.department !== selectedDept) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.request_id.toLowerCase().includes(q) ||
        t.asset_id.toLowerCase().includes(q) ||
        t.section_id.toLowerCase().includes(q) ||
        t.defect_type.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const tabCounts = {
    ALL: tasks.length,
    CRITICAL: tasks.filter(
      t =>
        t.severity === 'EMERGENCY' ||
        t.severity === 'CRITICAL' ||
        ['RAIL_FRACTURE_RISK', 'POINT_MACHINE_DETECTION_FAILURE', 'OHE_CANTILEVER_FLASH_BURN'].includes(t.defect_type)
    ).length,
    HIGH_RISK: tasks.filter(t => (t.ai_risk_score || 0) >= 0.5).length,
    PLANNED: tasks.filter(t => t.status === 'SCHEDULED').length,
    UNSCHEDULED: tasks.filter(t => t.status !== 'SCHEDULED').length,
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by asset, location or defect issue..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Action Controls & Department Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Department:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="ALL">All Departments</option>
              <option value="ENGINEERING">Engineering (P-Way)</option>
              <option value="SIGNAL_TELECOM">Signal & Telecom</option>
              <option value="TRD">Traction (TRD)</option>
            </select>
          </div>

          {onPrioritize && (
            <button
              type="button"
              onClick={onPrioritize}
              disabled={loading}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Prioritizing...' : 'Prioritize Requests'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Priority Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        {[
          { id: 'ALL', label: 'All Requests' },
          { id: 'CRITICAL', label: 'Critical / Emergency' },
          { id: 'HIGH_RISK', label: 'Elevated Risk' },
          { id: 'PLANNED', label: 'Planned in Schedule' },
          { id: 'UNSCHEDULED', label: 'Unscheduled' },
        ].map(tab => {
          const count = tabCounts[tab.id as keyof typeof tabCounts];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap flex items-center gap-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {filteredTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Issue Description</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Plan Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredTasks.map((t, idx) => {
                  const isEmergency =
                    t.severity === 'EMERGENCY' ||
                    ['RAIL_FRACTURE_RISK', 'POINT_MACHINE_DETECTION_FAILURE', 'OHE_CANTILEVER_FLASH_BURN'].includes(
                      t.defect_type
                    );
                  const isCritical = t.severity === 'CRITICAL';
                  const isScheduled = t.status === 'SCHEDULED';

                  return (
                    <tr
                      key={t.request_id || idx}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onSelectTask(t.request_id)}
                    >
                      {/* Priority Badge */}
                      <td className="px-4 py-3">
                        {isEmergency ? (
                          <Badge variant="emergency" size="sm">CRITICAL</Badge>
                        ) : isCritical || (t.ai_risk_score || 0) >= 0.5 ? (
                          <Badge variant="warning" size="sm">HIGH RISK</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">ROUTINE</Badge>
                        )}
                      </td>

                      {/* Asset ID */}
                      <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                        {t.asset_id}
                      </td>

                      {/* Issue */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {t.defect_type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{t.section_id}</span>
                        <span className="text-slate-400 block text-[11px] font-mono">{t.track_id}</span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            t.department === 'ENGINEERING'
                              ? 'eng'
                              : t.department === 'SIGNAL_TELECOM'
                              ? 'snt'
                              : 'trd'
                          }
                          size="sm"
                        >
                          {t.department.replace('_', ' ')}
                        </Badge>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {Math.round(t.duration_minutes / 60)}h {t.duration_minutes % 60}m
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {isScheduled ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            ✓ Scheduled
                          </span>
                        ) : (
                          <span className="text-slate-500">Unscheduled</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(t.request_id);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded text-xs font-semibold transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Wrench}
            title="No matching maintenance requests"
            description="Try changing your search terms, department filter, or active priority tab."
            actionText="Clear Filters"
            onAction={() => {
              setActiveTab('ALL');
              setSelectedDept('ALL');
              setSearchQuery('');
            }}
          />
        )}
      </div>
    </div>
  );
};
