import React from 'react';
import { Station, TrackSection, BlockPlan } from '../types';
import { MapPin, Navigation } from 'lucide-react';

interface NetworkSchematicMapProps {
  stations: Station[];
  sections: TrackSection[];
  plan: BlockPlan | null;
}

export const NetworkSchematicMap: React.FC<NetworkSchematicMapProps> = ({ stations, sections, plan }) => {
  if (stations.length === 0) return null;

  // Active blocks by section
  const activeBlocksBySection: Record<string, number> = {};
  if (plan && plan.items) {
    for (const item of plan.items) {
      activeBlocksBySection[item.section_id] = (activeBlocksBySection[item.section_id] || 0) + 1;
    }
  }

  return (
    <div className="bg-surface2 border border-border1 rounded p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border1 pb-2.5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          Corridor Topological Schematic (Delhi - Prayagraj Trunk)
        </h2>
        <span className="text-[11px] font-mono text-slate-400">8 Hub Junctions | 7 Trunk Track Sections</span>
      </div>

      <div className="relative w-full h-44 bg-[#0a0e16] rounded border border-border1/80 overflow-hidden flex items-center justify-center p-4">
        {/* SVG Railway Lines */}
        <svg className="w-full h-full" viewBox="0 0 1100 200" preserveAspectRatio="xMidYMid meet">
          {/* Main Corridor Tracks */}
          <path
            d="M 80 100 L 220 100 L 360 100 L 500 100 L 640 100 L 780 100 L 920 100 L 1040 100"
            stroke="#334155"
            strokeWidth="4"
            fill="none"
          />
          {/* ANVT Branch Line */}
          <path
            d="M 80 100 C 150 40, 290 40, 360 100"
            stroke="#1e293b"
            strokeWidth="3"
            strokeDasharray="4 4"
            fill="none"
          />

          {/* Section Possession Glow Overlays */}
          {sections.map((sec, idx) => {
            const blockCount = activeBlocksBySection[sec.section_id] || 0;
            if (blockCount === 0) return null;

            const startX = 80 + idx * 140;
            const endX = startX + 140;

            return (
              <line
                key={`block-${sec.section_id}`}
                x1={startX}
                y1={100}
                x2={endX}
                y2={100}
                stroke="#6366f1"
                strokeWidth="6"
                strokeOpacity="0.8"
                className="animate-pulse"
              />
            );
          })}

          {/* Station Nodes */}
          {stations.map((stn, idx) => {
            const cx = 80 + idx * 140;
            const cy = stn.code === 'ANVT' ? 50 : 100;

            return (
              <g key={stn.code} className="cursor-pointer group">
                <circle
                  cx={cx}
                  cy={cy}
                  r={8}
                  fill="#0f131c"
                  stroke="#4edea3"
                  strokeWidth="3"
                  className="group-hover:stroke-indigo-400 transition-all"
                />
                <circle cx={cx} cy={cy} r={3} fill="#4edea3" />
                <text
                  x={cx}
                  y={cy + 22}
                  textAnchor="middle"
                  fill="#dfe2ee"
                  fontSize="11"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  {stn.code}
                </text>
                <text
                  x={cx}
                  y={cy - 14}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="Inter"
                >
                  {stn.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
