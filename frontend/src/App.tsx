import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { NetworkSchematicMap } from './components/NetworkSchematicMap';
import { InteractiveGantt } from './components/InteractiveGantt';
import { TaskQueue } from './components/TaskQueue';
import { AIExplanationPanel } from './components/AIExplanationPanel';
import { BenchmarkModal } from './components/BenchmarkModal';
import { ValidatorModal } from './components/ValidatorModal';
import { OverrideModal } from './components/OverrideModal';
import { DisruptionModal } from './components/DisruptionModal';
import { AuditTrail } from './components/AuditTrail';

import {
  fetchMetrics,
  fetchTasks,
  fetchLatestSchedule,
  fetchStations,
  fetchSections,
  fetchAuditLogs,
  triggerSync,
  triggerPrioritization,
  triggerOptimization,
  explainTask,
  applyManualOverride,
  triggerTrainDelayDisruption,
  publishSchedule
} from './services/api';

import {
  DashboardMetrics,
  MaintenanceRequest,
  BlockPlan,
  Station,
  TrackSection,
  AuditLog,
  BlockPlanItem,
  TaskExplanation
} from './types';

import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tasks, setTasks] = useState<MaintenanceRequest[]>([]);
  const [plan, setPlan] = useState<BlockPlan | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [sections, setSections] = useState<TrackSection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [selectedHorizon, setSelectedHorizon] = useState<string>('WEEKLY');
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Modals state
  const [selectedExplanation, setSelectedExplanation] = useState<TaskExplanation | null>(null);
  const [selectedOverrideItem, setSelectedOverrideItem] = useState<BlockPlanItem | null>(null);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [isValidatorOpen, setIsValidatorOpen] = useState<boolean>(false);
  const [isDisruptionOpen, setIsDisruptionOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setBackendError(null);
      const [m, t, p, stn, sec, a] = await Promise.all([
        fetchMetrics(),
        fetchTasks(),
        fetchLatestSchedule(),
        fetchStations(),
        fetchSections(),
        fetchAuditLogs(),
      ]);
      setMetrics(m);
      setTasks(t);
      setPlan(p);
      setStations(stn);
      setSections(sec);
      setAuditLogs(a);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setBackendError(err.message || 'RailSync backend service unavailable. Please check API server.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = async () => {
    setLoading(true);
    try {
      await triggerSync();
      await loadData();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritize = async () => {
    setLoading(true);
    try {
      await triggerPrioritization();
      await loadData();
    } catch (err: any) {
      alert(`Prioritization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async (horizon: string) => {
    setLoading(true);
    try {
      await triggerOptimization(horizon);
      await loadData();
    } catch (err: any) {
      alert(`CP-SAT optimization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (taskId: string) => {
    try {
      const exp = await explainTask(taskId);
      setSelectedExplanation(exp);
    } catch (err) {
      console.error('Explain error:', err);
    }
  };

  const handleOverrideSubmit = async (payload: any) => {
    const res = await applyManualOverride(payload);
    await loadData();
    return res;
  };

  const handleDisruptionSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await triggerTrainDelayDisruption(payload);
      await loadData();
    } catch (err: any) {
      alert(`Disruption simulation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePublish = async () => {
    if (!plan?.plan_id) return;
    setLoading(true);
    try {
      await publishSchedule(plan.plan_id);
      await loadData();
      alert(`Schedule ${plan.plan_id} successfully published to live sectional controllers.`);
    } catch (err: any) {
      alert(`Publish failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-[#dfe2ee] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono text-[#94a3b8]">Initializing RailSync AI Control Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#dfe2ee] flex flex-col font-sans">
      {/* Global Header */}
      <Header
        metrics={metrics}
        onSync={handleSync}
        onPrioritize={handlePrioritize}
        onOptimize={handleOptimize}
        onBenchmarkClick={() => setIsBenchmarkOpen(true)}
        onValidationClick={() => setIsValidatorOpen(true)}
        onDisruptionClick={() => setIsDisruptionOpen(true)}
        onApprovePublish={handleApprovePublish}
        selectedHorizon={selectedHorizon}
        onHorizonChange={setSelectedHorizon}
        loading={loading}
      />

      {/* Backend Error Banner */}
      {backendError && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2.5 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span><strong>Backend Warning:</strong> {backendError}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 rounded font-semibold text-white transition flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Main Operations Canvas */}
      <main className="flex-1 p-3 md:p-5 space-y-4 max-w-[1720px] w-full mx-auto">
        {/* KPI Telemetry Pods */}
        <KPICards metrics={metrics} />

        {/* 2D Topological Corridor Map */}
        <NetworkSchematicMap
          stations={stations}
          sections={sections}
          plan={plan}
        />

        {/* Central Gantt Possession Timeline */}
        <InteractiveGantt
          plan={plan}
          tasks={tasks}
          onOverrideClick={item => setSelectedOverrideItem(item)}
        />

        {/* Maintenance Queue & AI Prioritization */}
        <TaskQueue
          tasks={tasks}
          onExplainClick={handleExplain}
        />

        {/* Cryptographic Audit Trail */}
        <AuditTrail logs={auditLogs} />
      </main>

      {/* Modals & Drawers */}
      <AIExplanationPanel
        explanation={selectedExplanation}
        onClose={() => setSelectedExplanation(null)}
      />

      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        selectedHorizon={selectedHorizon}
      />

      <ValidatorModal
        isOpen={isValidatorOpen}
        onClose={() => setIsValidatorOpen(false)}
        plan={plan}
        onPlanValidated={loadData}
      />

      <OverrideModal
        item={selectedOverrideItem}
        onClose={() => setSelectedOverrideItem(null)}
        onSubmit={handleOverrideSubmit}
      />

      <DisruptionModal
        isOpen={isDisruptionOpen}
        onClose={() => setIsDisruptionOpen(false)}
        onSubmit={handleDisruptionSubmit}
      />
    </div>
  );
};

export default App;
