import React from 'react';
import { Station, TrackSection, BlockPlan } from '../types';
import { Navigation, Radio, Activity, AlertCircle } from 'lucide-react';

interface NetworkSchematicMapProps {
  stations: Station[];
  sections: TrackSection[];
  plan: BlockPlan | null;
}

export const NetworkSchematicMap: React.FC<NetworkSchematicMapProps> = ({
  stations,
  sections,
  plan
}) => {
  if (stations.length === 0) return null;

  // Active blocks by section
  const activeBlocksBySection: Record<string, number> = {};
  if (plan && plan.items) {
    for (const item of plan.items) {
      activeBlocksBySection[item.section_id] =
        (activeBlocksBySection[item.section_id] || 0) + 1;
    }
  }

  return (
    <div className="bg-[#111622] border border-[#252f44] rounded-xl p-4 flex flex-col gap-3 shadow-sm text-[#dfe2ee]">
      <div className="flex items-center justify-between border-b border-[#252f44] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Corridor Network Topological Schematic
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {stations.length} Hubs • {sections.length} Trunk Sections
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            SYNTHETIC SIMULATION
          </span>
        </div>
      </div>

      <div className="relative w-full h-44 bg-[#0a0e16] rounded-lg border border-[#1e293b] overflow-hidden flex items-center justify-center p-4">
        {/* SVG Railway Lines */}
        <svg
          className="w-full h-full"
          viewBox="0 0 1100 200"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Main Corridor Tracks */}
          <path
            d="M 80 100 L 220 100 L 360 100 L 500 100 L 640 100 L 780 100 L 920 100 L 1040 100"
            stroke="#252f44"
            strokeWidth="5"
            fill="none"
          />
          {/* ANVT Branch Line */}
          <path
            d="M 80 100 C 150 35, 290 35, 360 100"
            stroke="#1e293b"
            strokeWidth="3"
            strokeDasharray="4 4"
            fill="none"
          />

          {/* Section Possession Overlays */}
          {sections.map((sec, idx) => {
            const blockCount = activeBlocksBySection[sec.section_id] || 0;
            if (blockCount === 0) return null;

            const startX = 80 + idx * 140;
            const endX = startX + 140;

            return (
              <g key={`block-${sec.section_id}`}>
                <line
                  x1={startX}
                  y1={100}
                  x2={endX}
                  y2={100}
                  stroke="#8b5cf6"
                  strokeWidth="8"
                  strokeOpacity="0.8"
                  className="animate-pulse"
                />
                <text
                  x={(startX + endX) / 2}
                  y={130}
                  textAnchor="middle"
                  fill="#c084fc"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  ⚡ {blockCount} Possession(s)
                </text>
              </g>
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
                  r={9}
                  fill="#0f131c"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  className="group-hover:stroke-cyan-400 group-hover:scale-125 transition-all origin-center"
                />
                <circle cx={cx} cy={cy} r={3.5} fill="#60a5fa" />
                <text
                  x={cx}
                  y={cy + 24}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="11"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  {stn.code}
                </text>
                <text
                  x={cx}
                  y={cy - 16}
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
