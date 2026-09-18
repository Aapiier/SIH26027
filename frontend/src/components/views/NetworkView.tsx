import React, { useState } from 'react';
import { Network, MapPin, ArrowRight, Train, CheckCircle2, Clock, Wrench, ChevronRight } from 'lucide-react';
import { Station, TrackSection, BlockPlan } from '../../types';
import { Badge } from '../ui/Badge';
import { NavTab } from '../Sidebar';

interface NetworkViewProps {
  stations: Station[];
  sections: TrackSection[];
  plan: BlockPlan | null;
  onNavigate: (tab: NavTab) => void;
}

export const NetworkView: React.FC<NetworkViewProps> = ({
  stations,
  sections,
  plan,
  onNavigate,
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    sections[0]?.section_id || 'NDLS-GZB'
  );

  const activeBlocksBySection: Record<string, number> = {};
  if (plan && plan.items) {
    for (const item of plan.items) {
      activeBlocksBySection[item.section_id] =
        (activeBlocksBySection[item.section_id] || 0) + 1;
    }
  }

  const activeSection = sections.find(s => s.section_id === selectedSectionId) || sections[0];
  const sectionBlocks = (plan?.items || []).filter(i => i.section_id === selectedSectionId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Network Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Delhi – Prayagraj Trunk Corridor</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            435 km high-density electrified trunk route connecting 8 major junction stations.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
            {stations.length} Major Stations
          </span>
          <span className="px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
            {sections.length} Inter-Station Sections
          </span>
        </div>
      </div>

      {/* 2D Topological Route Schematic Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Corridor Route Topology (Click section to inspect)
          </span>
          <span className="text-xs text-slate-500">Interactive Schematic</span>
        </div>

        {/* SVG Route Schematic */}
        <div className="w-full bg-slate-50 rounded-lg border border-slate-200 p-4 overflow-x-auto">
          <div className="min-w-[800px] h-32 flex items-center justify-between px-6 relative">
            {/* Connecting Track Line */}
            <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-1.5 bg-slate-300 z-0"></div>

            {/* Stations & Section Nodes */}
            {stations.map((stn, idx) => (
              <div key={stn.code} className="relative z-10 flex flex-col items-center">
                {/* Station Node Dot */}
                <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-blue-800 font-bold text-[11px] shadow-sm">
                  {stn.code.slice(0, 3)}
                </div>
                {/* Station Name Label */}
                <span className="text-xs font-bold text-slate-900 mt-2">{stn.code}</span>
                <span className="text-[10px] text-slate-500">{stn.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Trunk Sections List (Left) + Selected Section Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sections List (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Trunk Track Sections</h3>
          <div className="space-y-2">
            {sections.map(sec => {
              const count = activeBlocksBySection[sec.section_id] || 0;
              const isSelected = sec.section_id === selectedSectionId;

              return (
                <div
                  key={sec.section_id}
                  onClick={() => setSelectedSectionId(sec.section_id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs text-slate-900 font-bold">{sec.section_id}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">({sec.from_stn} → {sec.to_stn})</span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-3">
                      <span>Distance: <strong>{sec.distance_km} km</strong></span>
                      <span>•</span>
                      <span>Max Speed: <strong>{sec.max_speed} km/h</strong></span>
                      <span>•</span>
                      <span>Tracks: <strong>{sec.tracks}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {count > 0 ? (
                      <Badge variant="combined" size="sm">
                        {count} Block{count > 1 ? 's' : ''} Scheduled
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">Normal Operations</Badge>
                    )}
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Section Details (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          {activeSection ? (
            <>
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Section Inspector</span>
                  <h3 className="text-base font-bold text-slate-900">{activeSection.section_id}</h3>
                </div>
                <Badge variant="info">{activeSection.line_type || 'DOUBLE BROAD GAUGE'}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Distance</span>
                  <strong className="text-slate-800 text-sm">{activeSection.distance_km} km</strong>
                </div>
                <div className="p-3 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Section Speed</span>
                  <strong className="text-slate-800 text-sm">{activeSection.max_speed} km/h</strong>
                </div>
              </div>

              {/* Scheduled Blocks on this Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">Scheduled Maintenance Blocks ({sectionBlocks.length})</h4>
                {sectionBlocks.length > 0 ? (
                  <div className="space-y-2">
                    {sectionBlocks.map((blk, idx) => (
                      <div key={blk.item_id || idx} className="p-3 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-mono">{blk.track_id}</strong>
                          <Badge variant="combined" size="sm">{blk.duration_minutes} mins</Badge>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {blk.justification || 'Synchronized departmental track block.'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    No active maintenance blocks planned on this section.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onNavigate('block-plan')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open in Block Plan →</span>
              </button>
            </>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              Select a section to view infrastructure status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
