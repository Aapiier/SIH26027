import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { NetworkSchematicMap } from './components/NetworkSchematicMap';
import { InteractiveGantt } from './components/InteractiveGantt';
import { TaskQueue } from './components/TaskQueue';
import { UnscheduledModal } from './components/UnscheduledModal';
import { OverrideModal } from './components/OverrideModal';
import { DisruptionModal } from './components/DisruptionModal';
import { AuditTrail } from './components/AuditTrail';

import {
  fetchMetrics, fetchTasks, fetchLatestSchedule, fetchStations,
  fetchSections, fetchAuditLogs, triggerSync, triggerPrioritization,
  triggerOptimization, explainUnscheduled, applyManualOverride,
  triggerTrainDelayDisruption
} from './services/api';

import { DashboardMetrics, MaintenanceRequest, BlockPlan, Station, TrackSection, AuditLog, BlockPlanItem } from './types';

export const App: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tasks, setTasks] = useState<MaintenanceRequest[]>([]);
  const [plan, setPlan] = useState<BlockPlan | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [sections, setSections] = useState<TrackSection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modals state
  const [selectedExplanation, setSelectedExplanation] = useState<any | null>(null);
  const [selectedOverrideItem, setSelectedOverrideItem] = useState<BlockPlanItem | null>(null);
  const [isDisruptionModalOpen, setIsDisruptionModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
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
    } catch (err) {
      console.error('Error loading dashboard data:', err);
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
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritize = async () => {
    setLoading(true);
    try {
      await triggerPrioritization();
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      await triggerOptimization('WEEKLY');
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (taskId: string) => {
    try {
      const exp = await explainUnscheduled(taskId);
      setSelectedExplanation(exp);
    } catch (err) {
      console.error('Explain error:', err);
    }
  };

  const handleOverrideSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await applyManualOverride(payload);
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleDisruptionSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await triggerTrainDelayDisruption(payload);
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#dfe2ee] flex flex-col">
      <Header
        onSync={handleSync}
        onPrioritize={handlePrioritize}
        onOptimize={handleOptimize}
        onDisruptionClick={() => setIsDisruptionModalOpen(true)}
        loading={loading}
      />

      <main className="flex-1 p-4 md:p-6 space-y-4 max-w-[1600px] w-full mx-auto">
        {/* KPI Metric Pods */}
        <KPICards metrics={metrics} />

        {/* 2D Topological Corridor Map */}
        <NetworkSchematicMap stations={stations} sections={sections} plan={plan} />

        {/* Interactive Gantt Timeline */}
        <InteractiveGantt plan={plan} onOverrideClick={item => setSelectedOverrideItem(item)} />

        {/* Maintenance Queue */}
        <TaskQueue tasks={tasks} onExplainClick={handleExplain} />

        {/* Cryptographic Audit Trail */}
        <AuditTrail logs={auditLogs} />
      </main>

      {/* Modals */}
      <UnscheduledModal explanation={selectedExplanation} onClose={() => setSelectedExplanation(null)} />
      <OverrideModal item={selectedOverrideItem} onClose={() => setSelectedOverrideItem(null)} onSubmit={handleOverrideSubmit} />
      <DisruptionModal isOpen={isDisruptionModalOpen} onClose={() => setIsDisruptionModalOpen(false)} onSubmit={handleDisruptionSubmit} />
    </div>
  );
};
export default App;
