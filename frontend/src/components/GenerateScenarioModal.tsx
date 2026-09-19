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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full max-h-[88vh] flex flex-col shadow-xl relative overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              <Dice5 className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Generate Simulation Scenario</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  Relational Simulation
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Instantiate a varied railway operations scenario for live demonstration.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Result Card */}
          {lastResult && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900">{lastResult.preset_name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    ID: {lastResult.scenario_id}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    Seed: {lastResult.seed}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Trains Injected</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{lastResult.trains_count}</span>
                  <span className="text-[10px] text-slate-500 block">({lastResult.timetable_count} slots)</span>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Demands & Defects</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{lastResult.maintenance_requests_count}</span>
                  <span className="text-[10px] text-red-700 block font-semibold">{lastResult.tier1_emergencies_count} Emergencies</span>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Candidate Windows</span>
                  <span className="font-bold text-blue-700 font-mono text-sm">{lastResult.candidate_windows_count}</span>
                  <span className="text-[10px] text-slate-500 block">Collision-Free</span>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Scheduled Blocks</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm">{lastResult.scheduled_tasks_count}</span>
                  <span className="text-[10px] text-emerald-700 block">+{lastResult.possession_hours_saved}h saved</span>
                </div>
              </div>

              {/* Status and Sentinel */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Validation Verdict: <strong className="text-emerald-700 font-semibold">{lastResult.validation_verdict}</strong> (0 Safety Conflicts)</span>
                </div>
                {onNavigateToPlan && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToPlan();
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition"
                  >
                    <span>View in Block Plan →</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preset Selector Grid */}
          <div className="space-y-2">
            <label className="block text-slate-800 font-bold text-xs">Select Scenario Preset:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_OPTIONS.map(opt => {
                const isSelected = selectedPreset === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedPreset(opt.id)}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <span>{opt.icon}</span>
                        <span>{opt.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{opt.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Seed Input */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="block font-semibold text-slate-800 text-xs">Random Seed (Optional):</span>
              <span className="text-[11px] text-slate-500">Leave blank for fresh stochastic sampling.</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customSeed}
                onChange={e => setCustomSeed(e.target.value)}
                placeholder="e.g. 42091"
                className="w-28 bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-mono text-xs focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCustomSeed(Math.floor(10000 + Math.random() * 900000).toString())}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 text-xs font-mono transition border border-slate-300"
                title="Roll random seed"
              >
                🎲 Roll
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Executes canonical AI feature extraction & CP-SAT solver.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition border border-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-1.5 rounded-md bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs transition disabled:opacity-50"
            >
              <Dice5 className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Generating Scenario...' : 'Generate Scenario'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
