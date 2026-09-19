import React, { useState } from 'react';
import {
  PlusCircle,
  X,
  Zap,
  Train,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Play,
  Layers,
  Flame,
  Wrench,
  Activity,
  Calendar,
  Clock
} from 'lucide-react';
import { MaintenanceRequestCreate, TrainCreate, TimetableCreate, MaintenanceRequest } from '../types';
import { createMaintenanceTask, createTrain, createTimetableEntry } from '../services/api';

interface ManualSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataCreated: () => Promise<void>;
  onTriggerOptimizer: () => Promise<void>;
  onTriggerPrioritize: () => Promise<void>;
  onOpenValidator: () => void;
  onSimulateDisruption: (payload: { train_number: string; section_id: string; delay_minutes: number }) => Promise<void>;
}

type TabType = 'task' | 'train' | 'disruption';

export const ManualSimulationModal: React.FC<ManualSimulationModalProps> = ({
  isOpen,
  onClose,
  onDataCreated,
  onTriggerOptimizer,
  onTriggerPrioritize,
  onOpenValidator,
  onSimulateDisruption,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<TabType>('task');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    type: string;
    id: string;
    details: string;
    taskObj?: MaintenanceRequest;
  } | null>(null);

  // Task Form State
  const [department, setDepartment] = useState<'ENGINEERING' | 'SIGNAL_TELECOM' | 'TRD'>('ENGINEERING');
  const [defectType, setDefectType] = useState('RAIL_FRACTURE_RISK');
  const [sectionId, setSectionId] = useState('GZB-ALJN');
  const [trackId, setTrackId] = useState('GZB-ALJN-UP');
  const [severity, setSeverity] = useState<'EMERGENCY' | 'CRITICAL' | 'URGENT' | 'ROUTINE'>('EMERGENCY');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [startKm, setStartKm] = useState(42.5);
  const [endKm, setEndKm] = useState(43.2);
  const [earliestStart, setEarliestStart] = useState('2026-10-01T06:00');
  const [latestDeadline, setLatestDeadline] = useState('2026-10-01T18:00');
  const [speedRestriction, setSpeedRestriction] = useState(30);
  const [powerBlock, setPowerBlock] = useState(false);
  const [machinery, setMachinery] = useState<string[]>(['TAMPING_MACHINE']);

  // Train Form State
  const [trainNumber, setTrainNumber] = useState('12005');
  const [trainName, setTrainName] = useState('Shatabdi Express Special');
  const [trainType, setTrainType] = useState('EXPRESS');
  const [trainPriority, setTrainPriority] = useState(2);
  const [trainSection, setTrainSection] = useState('GZB-ALJN');
  const [trainTrack, setTrainTrack] = useState('GZB-ALJN-UP');
  const [trainDirection, setTrainDirection] = useState('UP');
  const [trainEntry, setTrainEntry] = useState('2026-10-01T08:30');
  const [trainExit, setTrainExit] = useState('2026-10-01T09:15');

  // Disruption Form State
  const [disruptTrainNo, setDisruptTrainNo] = useState('22436');
  const [disruptSection, setDisruptSection] = useState('NDLS-GZB');
  const [disruptDelay, setDisruptDelay] = useState(45);

  const handleSectionChange = (sec: string) => {
    setSectionId(sec);
    setTrackId(`${sec}-UP`);
  };

  const handleTrainSectionChange = (sec: string) => {
    setTrainSection(sec);
    setTrainTrack(`${sec}-UP`);
  };

  // 1-Click Quick Presets for Live Demo
  const applyTaskPreset = (preset: 'emergency_rail' | 'ohe_flash' | 'signal_drop' | 'ultrasonic_flaw') => {
    setSuccessInfo(null);
    setErrorMessage(null);
    if (preset === 'emergency_rail') {
      setDepartment('ENGINEERING');
      setDefectType('RAIL_FRACTURE_RISK');
      setSeverity('EMERGENCY');
      setDurationMinutes(90);
      setSpeedRestriction(30);
      setPowerBlock(false);
      setMachinery(['TAMPING_MACHINE']);
      setSectionId('GZB-ALJN');
      setTrackId('GZB-ALJN-UP');
      setStartKm(48.2);
      setEndKm(48.8);
      setEarliestStart('2026-10-01T06:00');
      setLatestDeadline('2026-10-01T12:00');
    } else if (preset === 'ohe_flash') {
      setDepartment('TRD');
      setDefectType('OHE_CANTILEVER_FLASH_BURN');
      setSeverity('EMERGENCY');
      setDurationMinutes(60);
      setSpeedRestriction(0);
      setPowerBlock(true);
      setMachinery(['TOWER_WAGON']);
      setSectionId('ALJN-TDL');
      setTrackId('ALJN-TDL-UP');
      setStartKm(92.0);
      setEndKm(92.5);
      setEarliestStart('2026-10-01T07:00');
      setLatestDeadline('2026-10-01T14:00');
    } else if (preset === 'signal_drop') {
      setDepartment('SIGNAL_TELECOM');
      setDefectType('POINT_MACHINE_DETECTION_FAILURE');
      setSeverity('EMERGENCY');
      setDurationMinutes(45);
      setSpeedRestriction(15);
      setPowerBlock(false);
      setMachinery(['CREW_TEAM']);
      setSectionId('NDLS-GZB');
      setTrackId('NDLS-GZB-DOWN');
      setStartKm(12.4);
      setEndKm(12.8);
      setEarliestStart('2026-10-01T05:00');
      setLatestDeadline('2026-10-01T10:00');
    } else if (preset === 'ultrasonic_flaw') {
      setDepartment('ENGINEERING');
      setDefectType('IMR_ULTRASONIC_FLAW');
      setSeverity('CRITICAL');
      setDurationMinutes(120);
      setSpeedRestriction(45);
      setPowerBlock(false);
      setMachinery(['BCM', 'TAMPING_MACHINE']);
      setSectionId('ETW-CNB');
      setTrackId('ETW-CNB-UP');
      setStartKm(210.0);
      setEndKm(211.5);
      setEarliestStart('2026-10-01T09:00');
      setLatestDeadline('2026-10-01T20:00');
    }
  };

  const applyTrainPreset = (preset: 'vande_bharat' | 'heavy_freight' | 'rajdhani_spl') => {
    setSuccessInfo(null);
    setErrorMessage(null);
    if (preset === 'vande_bharat') {
      setTrainNumber('22438');
      setTrainName('Vande Bharat Express Special');
      setTrainType('VANDE_BHARAT');
      setTrainPriority(1);
      setTrainSection('GZB-ALJN');
      setTrainTrack('GZB-ALJN-UP');
      setTrainDirection('UP');
      setTrainEntry('2026-10-01T07:15');
      setTrainExit('2026-10-01T07:55');
    } else if (preset === 'heavy_freight') {
      setTrainNumber('BOXN-902');
      setTrainName('Thermal Coal Heavy Rake');
      setTrainType('FREIGHT_COAL');
      setTrainPriority(4);
      setTrainSection('ALJN-TDL');
      setTrainTrack('ALJN-TDL-DOWN');
      setTrainDirection('DOWN');
      setTrainEntry('2026-10-01T11:00');
      setTrainExit('2026-10-01T12:20');
    } else if (preset === 'rajdhani_spl') {
      setTrainNumber('02302');
      setTrainName('Rajdhani Festival Special');
      setTrainType('RAJDHANI');
      setTrainPriority(1);
      setTrainSection('NDLS-GZB');
      setTrainTrack('NDLS-GZB-UP');
      setTrainDirection('UP');
      setTrainEntry('2026-10-01T16:50');
      setTrainExit('2026-10-01T17:25');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      const payload: MaintenanceRequestCreate = {
        department,
        source_system: 'MANUAL_SIM',
        section_id: sectionId,
        track_id: trackId,
        start_km: Number(startKm),
        end_km: Number(endKm),
        defect_type: defectType,
        severity,
        duration_minutes: Number(durationMinutes),
        earliest_start: new Date(earliestStart).toISOString(),
        latest_deadline: new Date(latestDeadline).toISOString(),
        speed_restriction_kmph: Number(speedRestriction),
        machinery_required: machinery,
        power_block_required: powerBlock,
        scenario_tag: 'MANUAL_SIMULATION',
        actor: 'DEMO_CONTROLLER',
      };

      const created = await createMaintenanceTask(payload);
      await onDataCreated();

      setSuccessInfo({
        type: 'MAINTENANCE_TASK',
        id: created.request_id,
        details: `Task ${created.request_id} created in DB! AI Risk Score: ${(created.ai_risk_score || 0).toFixed(3)} | Priority Score: ${(created.ai_priority_score || 0).toFixed(1)} (${created.ai_urgency_level || 'ROUTINE'})`,
        taskObj: created,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create maintenance task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      const trainPayload: TrainCreate = {
        train_number: trainNumber,
        train_name: trainName,
        train_type: trainType,
        priority_rank: Number(trainPriority),
        speed_factor: 1.0,
        headway_buffer_mins: 10,
        max_speed_kmph: 110,
      };

      await createTrain(trainPayload);

      const ttPayload: TimetableCreate = {
        train_number: trainNumber,
        section_id: trainSection,
        track_id: trainTrack,
        direction: trainDirection,
        scheduled_entry: new Date(trainEntry).toISOString(),
        scheduled_exit: new Date(trainExit).toISOString(),
        headway_buffer_mins: 10,
        source: 'MANUAL_SIMULATION',
        actor: 'DEMO_CONTROLLER',
      };

      const ttRes = await createTimetableEntry(ttPayload);
      await onDataCreated();

      setSuccessInfo({
        type: 'TRAIN_SCHEDULE',
        id: trainNumber,
        details: `Train ${trainNumber} (${trainName}) timetable slot ${ttRes.timetable_id} injected on ${trainTrack}. Candidate windows automatically refreshed!`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register train schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInjectDisruption = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      await onSimulateDisruption({
        train_number: disruptTrainNo,
        section_id: disruptSection,
        delay_minutes: Number(disruptDelay),
      });

      setSuccessInfo({
        type: 'DISRUPTION',
        id: disruptTrainNo,
        details: `Train ${disruptTrainNo} delay of ${disruptDelay}m simulated on ${disruptSection}. Collided blocks isolated and warm-start re-solved!`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to simulate train delay disruption');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#0d1424] border border-slate-700/80 rounded-xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl relative overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#121a2f] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-700/50">
              <Sliders className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">Manual Simulation & Live Demo Console</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-600/40">
                  REAL-TIME DB & AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Directly inject defects, trains, and operational constraints into the live optimization model.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#10172a] px-5 pt-1.5 shrink-0 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('task');
              setSuccessInfo(null);
              setErrorMessage(null);
            }}
            className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'task'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>+ Add Maintenance Defect</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('train');
              setSuccessInfo(null);
              setErrorMessage(null);
            }}
            className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'train'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>+ Add Train Schedule</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('disruption');
              setSuccessInfo(null);
              setErrorMessage(null);
            }}
            className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'disruption'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>⚡ Inject Train Disruption</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
          {/* Success Banner */}
          {successInfo && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-xs">{successInfo.details}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-800/50">
                <span className="text-[11px] text-emerald-300 font-semibold">Next Actions:</span>
                <button
                  type="button"
                  onClick={async () => {
                    await onTriggerOptimizer();
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run CP-SAT Optimizer</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onTriggerPrioritize();
                  }}
                  className="px-2.5 py-1 rounded bg-[#17223b] hover:bg-slate-700 text-blue-300 font-semibold text-[11px] border border-blue-500/30 flex items-center gap-1 transition"
                >
                  <Zap className="w-3 h-3 text-blue-400" />
                  <span>Recalculate AI Priorities</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenValidator();
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-semibold text-[11px] border border-emerald-600/40 flex items-center gap-1 transition"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Sentinel Validate</span>
                </button>
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

          {/* Tab 1: Maintenance Task Form */}
          {activeTab === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-3.5">
              {/* Quick Presets */}
              <div className="bg-[#121a2f] p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> 1-Click Live Demo Presets:
                  </span>
                  <span className="text-[10px] text-slate-400">Pre-populates realistic parameters</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTaskPreset('emergency_rail')}
                    className="p-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-[11px] text-left transition font-mono"
                  >
                    ⚠️ Rail Fracture (ENG)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTaskPreset('ohe_flash')}
                    className="p-1.5 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 text-[11px] text-left transition font-mono"
                  >
                    ⚡ OHE Flash (TRD)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTaskPreset('signal_drop')}
                    className="p-1.5 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 text-purple-300 text-[11px] text-left transition font-mono"
                  >
                    🔴 Point Fail (S&T)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTaskPreset('ultrasonic_flaw')}
                    className="p-1.5 rounded bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 text-blue-300 text-[11px] text-left transition font-mono"
                  >
                    🔧 IMR Flaw (ENG)
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Department:</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value as any)}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="ENGINEERING" className="bg-[#162035] text-white">Engineering (Civil / Track)</option>
                    <option value="SIGNAL_TELECOM" className="bg-[#162035] text-white">Signal & Telecom (S&T)</option>
                    <option value="TRD" className="bg-[#162035] text-white">TRD (Traction / Overhead OHE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Defect Type / Issue:</label>
                  <input
                    type="text"
                    value={defectType}
                    onChange={e => setDefectType(e.target.value)}
                    required
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                    placeholder="e.g. RAIL_FRACTURE_RISK"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Section ID:</label>
                  <select
                    value={sectionId}
                    onChange={e => handleSectionChange(e.target.value)}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="NDLS-GZB" className="bg-[#162035] text-white">NDLS-GZB (New Delhi – Ghaziabad)</option>
                    <option value="GZB-ALJN" className="bg-[#162035] text-white">GZB-ALJN (Ghaziabad – Aligarh)</option>
                    <option value="ALJN-TDL" className="bg-[#162035] text-white">ALJN-TDL (Aligarh – Tundla)</option>
                    <option value="TDL-ETW" className="bg-[#162035] text-white">TDL-ETW (Tundla – Etawah)</option>
                    <option value="ETW-CNB" className="bg-[#162035] text-white">ETW-CNB (Etawah – Kanpur)</option>
                    <option value="CNB-FTP" className="bg-[#162035] text-white">CNB-FTP (Kanpur – Fatehpur)</option>
                    <option value="FTP-PRYJ" className="bg-[#162035] text-white">FTP-PRYJ (Fatehpur – Prayagraj)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Physical Track ID:</label>
                  <select
                    value={trackId}
                    onChange={e => setTrackId(e.target.value)}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  >
                    <option value={`${sectionId}-UP`} className="bg-[#162035] text-white">{sectionId}-UP (Up Track)</option>
                    <option value={`${sectionId}-DOWN`} className="bg-[#162035] text-white">{sectionId}-DOWN (Down Track)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Severity / Urgency:</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as any)}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="EMERGENCY" className="bg-[#162035] text-white">EMERGENCY (Tier 1 Priority 98.0)</option>
                    <option value="CRITICAL" className="bg-[#162035] text-white">CRITICAL (Tier 1.5 Priority 80–95)</option>
                    <option value="URGENT" className="bg-[#162035] text-white">URGENT (ML Weighted)</option>
                    <option value="ROUTINE" className="bg-[#162035] text-white">ROUTINE (Deferred Maintenance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Duration (Minutes):</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    required
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Start Km – End Km:</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={startKm}
                      onChange={e => setStartKm(Number(e.target.value))}
                      className="w-1/2 bg-[#162035] border border-slate-700 rounded-md px-2.5 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                      placeholder="Start Km"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={endKm}
                      onChange={e => setEndKm(Number(e.target.value))}
                      className="w-1/2 bg-[#162035] border border-slate-700 rounded-md px-2.5 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                      placeholder="End Km"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Speed Restriction (km/h caution):</label>
                  <input
                    type="number"
                    min="0"
                    max="110"
                    value={speedRestriction}
                    onChange={e => setSpeedRestriction(Number(e.target.value))}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Earliest Window Start:</label>
                  <input
                    type="datetime-local"
                    value={earliestStart}
                    onChange={e => setEarliestStart(e.target.value)}
                    required
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Latest Safe Deadline:</label>
                  <input
                    type="datetime-local"
                    value={latestDeadline}
                    onChange={e => setLatestDeadline(e.target.value)}
                    required
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Machinery & Power Block Checkboxes */}
              <div className="p-2.5 bg-[#121a2f] rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Machinery Needed:</span>
                  <div className="flex flex-wrap gap-2.5">
                    {['TAMPING_MACHINE', 'BCM', 'UNIMAT', 'TOWER_WAGON', 'CREW_TEAM'].map(m => (
                      <label key={m} className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={machinery.includes(m)}
                          onChange={e => {
                            if (e.target.checked) {
                              setMachinery([...machinery, m]);
                            } else {
                              setMachinery(machinery.filter(x => x !== m));
                            }
                          }}
                          className="rounded bg-[#162035] border-slate-600 text-blue-500 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>{m}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-1.5 text-amber-300 font-semibold cursor-pointer pt-1 text-xs">
                  <input
                    type="checkbox"
                    checked={powerBlock}
                    onChange={e => setPowerBlock(e.target.checked)}
                    className="rounded bg-[#162035] border-amber-600 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>⚡ OHE Power Block</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition border border-slate-700/60"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{submitting ? 'Computing AI...' : 'Create & Prioritize Task'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Train Schedule Form */}
          {activeTab === 'train' && (
            <form onSubmit={handleCreateTrain} className="space-y-3.5">
              {/* Quick Presets */}
              <div className="bg-[#121a2f] p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Train className="w-3.5 h-3.5 text-blue-400" /> 1-Click Train Presets:
                  </span>
                  <span className="text-[10px] text-slate-400">Inserts into live corridor timetable</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyTrainPreset('vande_bharat')}
                    className="p-1.5 rounded bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 text-blue-300 text-[11px] text-left transition font-mono"
                  >
                    🚄 Vande Bharat Spl
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTrainPreset('heavy_freight')}
                    className="p-1.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-[11px] text-left transition font-mono"
                  >
                    📦 Coal Freight Rake
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTrainPreset('rajdhani_spl')}
                    className="p-1.5 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 text-purple-300 text-[11px] text-left transition font-mono"
                  >
                    🚆 Rajdhani Special
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Train Number:</label>
                  <input
                    type="text"
                    value={trainNumber}
                    onChange={e => setTrainNumber(e.target.value)}
                    required
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                    placeholder="e.g. 22438"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Train Name / Description:</label>
                  <input
                    type="text"
                    value={trainName}
                    onChange={e => setTrainName(e.target.value)}
                    required
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                    placeholder="e.g. Vande Bharat Express"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Train Category:</label>
                  <select
                    value={trainType}
                    onChange={e => setTrainType(e.target.value)}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="VANDE_BHARAT" className="bg-[#162035] text-white">Vande Bharat Express (Priority 1)</option>
                    <option value="RAJDHANI" className="bg-[#162035] text-white">Rajdhani / Shatabdi (Priority 1)</option>
                    <option value="SUPERFAST" className="bg-[#162035] text-white">Superfast Express (Priority 2)</option>
                    <option value="EXPRESS" className="bg-[#162035] text-white">Mail / Express (Priority 3)</option>
                    <option value="FREIGHT_CONTAINER" className="bg-[#162035] text-white">Freight Container (Priority 4)</option>
                    <option value="FREIGHT_COAL" className="bg-[#162035] text-white">Heavy Coal Freight (Priority 4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Priority Rank (1 to 5):</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={trainPriority}
                    onChange={e => setTrainPriority(Number(e.target.value))}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Section ID:</label>
                  <select
                    value={trainSection}
                    onChange={e => handleTrainSectionChange(e.target.value)}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="NDLS-GZB" className="bg-[#162035] text-white">NDLS-GZB</option>
                    <option value="GZB-ALJN" className="bg-[#162035] text-white">GZB-ALJN</option>
                    <option value="ALJN-TDL" className="bg-[#162035] text-white">ALJN-TDL</option>
                    <option value="TDL-ETW" className="bg-[#162035] text-white">TDL-ETW</option>
                    <option value="ETW-CNB" className="bg-[#162035] text-white">ETW-CNB</option>
                    <option value="CNB-FTP" className="bg-[#162035] text-white">CNB-FTP</option>
                    <option value="FTP-PRYJ" className="bg-[#162035] text-white">FTP-PRYJ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Track & Direction:</label>
                  <select
                    value={trainTrack}
                    onChange={e => setTrainTrack(e.target.value)}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  >
                    <option value={`${trainSection}-UP`} className="bg-[#162035] text-white">{trainSection}-UP (Up Track)</option>
                    <option value={`${trainSection}-DOWN`} className="bg-[#162035] text-white">{trainSection}-DOWN (Down Track)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Scheduled Entry Time:</label>
                  <input
                    type="datetime-local"
                    value={trainEntry}
                    onChange={e => setTrainEntry(e.target.value)}
                    required
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Scheduled Exit Time:</label>
                  <input
                    type="datetime-local"
                    value={trainExit}
                    onChange={e => setTrainExit(e.target.value)}
                    required
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition border border-slate-700/60"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{submitting ? 'Inserting Timetable...' : 'Add Train Schedule'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Disruption Form */}
          {activeTab === 'disruption' && (
            <form onSubmit={handleInjectDisruption} className="space-y-3.5">
              <div className="bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/50 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Injecting a live delay will dynamically isolate collided blocks on this corridor, returning tasks to the queue while preserving unaffected scheduled possessions.
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Delayed Train Number:</label>
                  <select
                    value={disruptTrainNo}
                    onChange={e => setDisruptTrainNo(e.target.value)}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors"
                  >
                    <option value="22436" className="bg-[#162035] text-white">22436 - Vande Bharat Express</option>
                    <option value="12302" className="bg-[#162035] text-white">12302 - Howrah Rajdhani</option>
                    <option value="12004" className="bg-[#162035] text-white">12004 - Shatabdi Express</option>
                    <option value="12554" className="bg-[#162035] text-white">12554 - Vaishali Superfast</option>
                    <option value="12005" className="bg-[#162035] text-white">12005 - Shatabdi Express Special</option>
                    <option value="BOXN-902" className="bg-[#162035] text-white">BOXN-902 - Coal Freight Rake</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Corridor Section Affected:</label>
                  <select
                    value={disruptSection}
                    onChange={e => setDisruptSection(e.target.value)}
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors"
                  >
                    <option value="NDLS-GZB" className="bg-[#162035] text-white">NDLS-GZB (New Delhi – Ghaziabad)</option>
                    <option value="GZB-ALJN" className="bg-[#162035] text-white">GZB-ALJN (Ghaziabad – Aligarh)</option>
                    <option value="ALJN-TDL" className="bg-[#162035] text-white">ALJN-TDL (Aligarh – Tundla)</option>
                    <option value="TDL-ETW" className="bg-[#162035] text-white">TDL-ETW (Tundla – Etawah)</option>
                    <option value="CNB-PRYJ" className="bg-[#162035] text-white">CNB-PRYJ (Kanpur – Prayagraj)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-[11px] uppercase tracking-wider">Delay Magnitude (Minutes):</label>
                  <input
                    type="number"
                    min="10"
                    max="240"
                    value={disruptDelay}
                    onChange={e => setDisruptDelay(Number(e.target.value))}
                    required
                    className="w-full bg-[#162035] border border-slate-700 rounded-md px-3 py-1.5 text-white font-mono text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition border border-slate-700/60"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4 text-slate-950" />
                  <span>{submitting ? 'Re-planning...' : 'Simulate Delay & Re-plan'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
