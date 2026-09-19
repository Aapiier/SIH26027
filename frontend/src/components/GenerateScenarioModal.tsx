import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Play,
  Dice5,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Train,
  Wrench,
  Clock,
  RotateCcw,
  Zap
} from 'lucide-react';
import { ScenarioGenerationResult, ScenarioPreset } from '../types';
import { triggerGenerateScenario } from '../services/api';

interface GenerateScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioGenerated: () => Promise<void>;
  onNavigateToPlan?: () => void;
}

const PRESET_OPTIONS = [
  {
    id: 'BALANCED_OPERATIONS',
    name: 'Balanced Operations',
    icon: '⚖️',
    description: 'Standard operational mix across trunk passenger and freight corridors with balanced maintenance demands.',
    badge: 'Standard'
  },
  {
    id: 'HEAVY_MAINTENANCE',
    name: 'Heavy Maintenance Surge',
    icon: '🔨',
    description: 'Intensive track renewal, tamping, and OHE maintenance demands with constrained track possessions.',
    badge: '120+ Tasks'
  },
  {
    id: 'FREIGHT_CONGESTION',
    name: 'Freight Congestion',
    icon: '📦',
    description: 'High-density goods and container traffic creating tightly squeezed candidate maintenance windows.',
    badge: 'Heavy Freight'
  },
  {
    id: 'HIGH_RISK_ASSETS',
    name: 'High-Risk Asset Degradation',
    icon: '⚠️',
    description: 'Severe asset deterioration with elevated AI failure probabilities, urgent IMR flaws, and rail fractures.',
    badge: 'AI Safety Gates'
  },
  {
    id: 'MAJOR_DISRUPTION',
    name: 'Major Train Delay Disruption',
    icon: '⚡',
    description: 'Cascading delay perturbations across trunk passenger trains requiring dynamic CP-SAT re-optimization.',
    badge: 'Disruptions'
  },
  {
    id: 'RESOURCE_SHORTAGE',
    name: 'Resource & Machinery Shortage',
    icon: '🔧',
    description: 'Scarce heavy machinery requiring complex disjunctive routing and inter-sectional transit coordination.',
    badge: 'Disjunctive Routing'
  },
  {
    id: 'MULTI_DEPARTMENT_OPPORTUNITY',
    name: 'Multi-Department Opportunity',
    icon: '🤝',
    description: 'High co-location of Engineering, S&T, and TRD requests maximizing shadow bundling possession savings.',
    badge: 'Max Possession Savings'
  },
];

export const GenerateScenarioModal: React.FC<GenerateScenarioModalProps> = ({
  isOpen,
  onClose,
  onScenarioGenerated,
  onNavigateToPlan,
}) => {
  if (!isOpen) return null;

  const [selectedPreset, setSelectedPreset] = useState<string>('BALANCED_OPERATIONS');
  const [customSeed, setCustomSeed] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScenarioGenerationResult | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMessage(null);
    try {
      const seedNum = customSeed.trim() ? parseInt(customSeed.trim(), 10) : undefined;
      const res = await triggerGenerateScenario(selectedPreset, seedNum);
      setLastResult(res);
      await onScenarioGenerated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate simulation scenario');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#0d1424] border border-slate-700/80 rounded-xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl relative overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#121a2f] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-700/50">
              <Dice5 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">Generate Random Demo Scenario</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-600/40">
                  FULL AI & CP-SAT PIPELINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generates a fresh, relational railway simulation dataset for live evaluation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
          {/* Result Card */}
          {lastResult && (
            <div className="p-3.5 rounded-lg bg-[#121c33] border border-indigo-700/50 text-slate-100 space-y-2.5">
              <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs sm:text-sm text-white">{lastResult.preset_name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-800">
                    ID: {lastResult.scenario_id}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-cyan-800">
                    Seed: {lastResult.seed}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded bg-[#17223b] border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Trains Injected</span>
                  <span className="font-bold text-white font-mono text-sm">{lastResult.trains_count}</span>
                  <span className="text-[10px] text-slate-500 block">({lastResult.timetable_count} slots)</span>
                </div>
                <div className="p-2 rounded bg-[#17223b] border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Demands & Defects</span>
                  <span className="font-bold text-white font-mono text-sm">{lastResult.maintenance_requests_count}</span>
                  <span className="text-[10px] text-rose-400 block font-semibold">{lastResult.tier1_emergencies_count} Emergencies</span>
                </div>
                <div className="p-2 rounded bg-[#17223b] border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Candidate Windows</span>
                  <span className="font-bold text-cyan-400 font-mono text-sm">{lastResult.candidate_windows_count}</span>
                  <span className="text-[10px] text-slate-500 block">Collision-Free</span>
                </div>
                <div className="p-2 rounded bg-[#17223b] border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Scheduled Blocks</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">{lastResult.scheduled_tasks_count}</span>
                  <span className="text-[10px] text-indigo-300 block">+{lastResult.possession_hours_saved}h saved</span>
                </div>
              </div>

              {/* Status and Sentinel */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-indigo-900/40 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sentinel Verdict: <strong className="text-emerald-300">{lastResult.validation_verdict}</strong> (0 Safety Conflicts)</span>
                </div>
                {onNavigateToPlan && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToPlan();
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 shadow transition"
                  >
                    <span>Inspect Block Plan</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-700 text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preset Selector Grid */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold text-xs">Select Simulation Scenario Preset:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_OPTIONS.map(opt => {
                const isSelected = selectedPreset === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedPreset(opt.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/70'
                        : 'bg-[#131b2e] border-slate-800/90 hover:border-slate-700 hover:bg-[#18233c]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                        <span>{opt.icon}</span>
                        <span>{opt.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c2742] text-indigo-300 border border-indigo-800/40">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{opt.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Seed Input */}
          <div className="p-2.5 bg-[#121a2f] rounded-lg border border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="block font-semibold text-slate-300 text-xs">Random Seed (Optional):</span>
              <span className="text-[10px] text-slate-500">Leave blank for fresh random data on every generation.</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customSeed}
                onChange={e => setCustomSeed(e.target.value)}
                placeholder="e.g. 42091"
                className="w-28 bg-[#17223b] border border-slate-700 rounded px-2.5 py-1 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setCustomSeed(Math.floor(10000 + Math.random() * 900000).toString())}
                className="px-2.5 py-1 rounded bg-[#1e2a47] hover:bg-slate-700 text-slate-200 text-xs font-mono transition border border-slate-700/60"
                title="Roll random seed"
              >
                🎲 Roll
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#10182b] border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Preserves trained AI model & executes CP-SAT solver.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition border border-slate-700/60"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
            >
              <Dice5 className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Generating Scenario...' : 'Generate Demo Data'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
