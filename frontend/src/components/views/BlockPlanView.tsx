import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  BarChart2,
  Send,
  Layers,
  Clock,
  Filter,
  Info,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Edit3,
  Sliders,
  Zap
} from 'lucide-react';
import { BlockPlan, BlockPlanItem, MaintenanceRequest } from '../../types';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { BlockDetailDrawer } from './BlockDetailDrawer';

interface BlockPlanViewProps {
  plan: BlockPlan | null;
  tasks: MaintenanceRequest[];
  onGeneratePlan: (horizon: string) => void;
  onOpenValidator: () => void;
  onOpenBenchmark: () => void;
  onPublishPlan: () => void;
  onAdjustSchedule: (item: BlockPlanItem) => void;
  onWhyThisWindow?: (item: BlockPlanItem) => void;
  onOpenWhatIf?: () => void;
  loading: boolean;
}

export const BlockPlanView: React.FC<BlockPlanViewProps> = ({
  plan,
  tasks,
  onGeneratePlan,
  onOpenValidator,
  onOpenBenchmark,
  onPublishPlan,
  onAdjustSchedule,
  onWhyThisWindow,
  onOpenWhatIf,
  loading,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<BlockPlanItem | null>(null);

  const items = plan?.items || [];
  const sections = Array.from(new Set(items.map(i => i.section_id))).sort();

  // Filter items
  const filteredItems = items.filter(item => {
    if (selectedSection !== 'ALL' && item.section_id !== selectedSection) return false;
    if (selectedDept !== 'ALL') {
      const memberTasks = tasks.filter(t => (item.bundled_task_ids || []).includes(t.request_id));
      if (selectedDept === 'COMBINED') {
        if ((item.bundled_task_ids || []).length <= 1) return false;
      } else {
        const hasDept = memberTasks.some(t => t.department === selectedDept);
        if (!hasDept) return false;
      }
    }
    return true;
  });

  // Calculate timeline bounds
  const timelineHours = 48;
  const hourTicks = Array.from({ length: 13 }, (_, i) => i * 4); // 0, 4, 8, 12, ... 48

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Plan Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">48-Hour Corridor Schedule</h2>
            <Badge variant="success" size="sm">✓ Validated</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {plan?.items?.length || 0} scheduled block possessions covering {plan?.total_tasks_scheduled || 0} maintenance activities.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Generate Optimized Plan (Primary Action) */}
          <button
            type="button"
            onClick={() => onGeneratePlan('WEEKLY')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Optimizing Schedule...' : 'Generate Optimized Plan'}</span>
          </button>

          {/* What If? Simulator */}
          <button
            type="button"
            onClick={onOpenWhatIf}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>What If?</span>
          </button>

          {/* Validate Plan */}
          <button
            type="button"
            onClick={onOpenValidator}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Validate Plan</span>
          </button>

          {/* Planning Comparison */}
          <button
            type="button"
            onClick={onOpenBenchmark}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span>Planning Comparison</span>
          </button>

          {/* Publish Plan */}
          <button
            type="button"
            onClick={onPublishPlan}
            disabled={loading || !plan || plan.status === 'PUBLISHED'}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md shadow-sm flex items-center gap-1.5 transition-colors ${
              plan?.status === 'PUBLISHED'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
            }`}
          >
            {plan?.status === 'PUBLISHED' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Published for Simulation</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Publish for Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Explanation: How the plan is generated */}
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-xs font-medium text-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span>How the maintenance schedule is generated</span>
          </div>
          {showExplanation ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </button>

        {showExplanation && (
          <div className="p-4 bg-white border-t border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
            <p>
              The planning engine projects all passenger and freight train timetables onto physical tracks to identify conflict-free operating gaps (shadow windows) with minimum 15-minute safety headway buffers.
            </p>
            <p>
              It synchronizes compatible requests from Engineering, S&T, and Traction to execute together under unified possessions, reducing track closure time while strictly respecting heavy machinery transit between depots.
            </p>
          </div>
        )}
      </div>

      {/* Gantt Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Section Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-500">Track Section:</span>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Trunk Sections ({sections.length})</option>
              {sections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-500">Filter View:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Maintenance Activities</option>
              <option value="COMBINED">Combined Work Only</option>
              <option value="ENGINEERING">Engineering (P-Way)</option>
              <option value="SIGNAL_TELECOM">Signal & Telecom</option>
              <option value="TRD">Traction (TRD)</option>
            </select>
          </div>
        </div>

        {/* Department Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-400"></span>
            <span>Engineering</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-400"></span>
            <span>Signal & Telecom</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-purple-100 border border-purple-400"></span>
            <span>Traction (TRD)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-400"></span>
            <span className="font-semibold text-emerald-800">Combined Work</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Timeline Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 overflow-x-auto">
        {filteredItems.length > 0 ? (
          <div className="min-w-[900px]">
            {/* Timeline Header (Hour Ticks) */}
            <div className="grid grid-cols-12 border-b border-slate-200 pb-2 mb-3 text-[11px] font-mono text-slate-500">
              <div className="col-span-3 text-left font-sans font-semibold text-slate-700">Track Section</div>
              <div className="col-span-9 grid grid-cols-12 text-center">
                {hourTicks.slice(0, 12).map(h => (
                  <span key={h} className="border-l border-slate-200 first:border-l-0">
                    +{h}h
                  </span>
                ))}
              </div>
            </div>

            {/* Section Rows */}
            <div className="space-y-3">
              {sections
                .filter(sec => selectedSection === 'ALL' || sec === selectedSection)
                .map(secId => {
                  const secItems = filteredItems.filter(i => i.section_id === secId);
                  if (secItems.length === 0 && selectedSection === 'ALL') return null;

                  return (
                    <div key={secId} className="grid grid-cols-12 items-center py-2 border-b border-slate-100 last:border-b-0">
                      {/* Section Name & Label */}
                      <div className="col-span-3 pr-3">
                        <span className="font-bold text-xs text-slate-900 block">{secId}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {secItems.length} block{secItems.length !== 1 ? 's' : ''} planned
                        </span>
                      </div>

                      {/* Timeline Canvas Row */}
                      <div className="col-span-9 relative h-12 bg-slate-50 rounded-md border border-slate-200 overflow-hidden flex items-center">
                        {/* Hour Grid Lines */}
                        <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="border-r border-slate-200/60 h-full"></div>
                          ))}
                        </div>

                        {/* Scheduled Blocks */}
                        {secItems.map((item, idx) => {
                          const isCombined = (item.bundled_task_ids || []).length > 1;
                          const startHour = new Date(item.scheduled_start).getHours();
                          const durationHours = item.duration_minutes / 60.0;

                          // Approximate visual left & width calculation relative to 48h
                          const leftPct = Math.min(90, Math.max(2, (startHour / 48) * 100 + idx * 8));
                          const widthPct = Math.min(30, Math.max(12, (durationHours / 48) * 100 * 3));

                          return (
                            <div
                              key={item.item_id || idx}
                              onClick={() => setSelectedItem(item)}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              className={`absolute h-8 rounded-md px-2.5 flex items-center justify-between text-xs font-semibold cursor-pointer shadow-xs transition-transform hover:scale-[1.02] ${
                                isCombined
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100'
                              }`}
                            >
                              <div className="truncate flex items-center gap-1">
                                {isCombined ? (
                                  <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                )}
                                <span className="truncate">
                                  {isCombined ? `Combined (${item.bundled_task_ids.length})` : item.track_id}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-600 shrink-0 ml-1">
                                {item.duration_minutes}m
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No scheduled blocks available"
            description="Click 'Generate Optimized Plan' to compute conflict-free maintenance blocks."
            actionText="Generate Optimized Plan"
            onAction={() => onGeneratePlan('WEEKLY')}
          />
        )}
      </div>

      {/* Block Detail Drawer */}
      <BlockDetailDrawer
        item={selectedItem}
        tasks={tasks}
        onClose={() => setSelectedItem(null)}
        onAdjustSchedule={onAdjustSchedule}
        onWhyThisWindow={onWhyThisWindow}
      />
    </div>
  );
};
