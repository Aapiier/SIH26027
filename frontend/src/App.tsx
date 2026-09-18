import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewView } from './components/views/OverviewView';
import { MaintenanceView } from './components/views/MaintenanceView';
import { BlockPlanView } from './components/views/BlockPlanView';
import { NetworkView } from './components/views/NetworkView';
import { DisruptionsView } from './components/views/DisruptionsView';
import { AuditTrailView } from './components/views/AuditTrailView';
import { TaskDetailDrawer } from './components/views/TaskDetailDrawer';
import { BenchmarkModal } from './components/BenchmarkModal';
import { ValidatorModal } from './components/ValidatorModal';
import { OverrideModal } from './components/OverrideModal';
import { HelpModal } from './components/HelpModal';

import {
  fetchMetrics,
  fetchTasks,
  fetchLatestSchedule,
  fetchStations,
  fetchSections,
  fetchAuditLogs,
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

import { AlertCircle, RefreshCw, Train } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  
  // Real API State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tasks, setTasks] = useState<MaintenanceRequest[]>([]);
  const [plan, setPlan] = useState<BlockPlan | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [sections, setSections] = useState<TrackSection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Modals & Drawers State
  const [selectedTaskExplanation, setSelectedTaskExplanation] = useState<TaskExplanation | null>(null);
  const [selectedTaskObj, setSelectedTaskObj] = useState<MaintenanceRequest | null>(null);
  const [selectedOverrideItem, setSelectedOverrideItem] = useState<BlockPlanItem | null>(null);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [isValidatorOpen, setIsValidatorOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

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
      console.error('Error loading operational data:', err);
      setBackendError(err.message || 'RailSync backend service unavailable. Please check API server.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOptimize = async (horizon: string = 'WEEKLY') => {
    setLoading(true);
    try {
      await triggerOptimization(horizon);
      await loadData();
    } catch (err: any) {
      alert(`Optimization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTask = async (taskId: string) => {
    const foundTask = tasks.find(t => t.request_id === taskId) || null;
    setSelectedTaskObj(foundTask);
    try {
      const exp = await explainTask(taskId);
      setSelectedTaskExplanation(exp);
    } catch (err) {
      console.error('Task explanation load error:', err);
      setSelectedTaskExplanation(null);
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
      alert(`Schedule ${plan.plan_id} successfully published to divisional train controllers.`);
    } catch (err: any) {
      alert(`Publish failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Urgent Count for Sidebar Badge
  const urgentCount = tasks.filter(
    t =>
      t.severity === 'EMERGENCY' ||
      ['RAIL_FRACTURE_RISK', 'POINT_MACHINE_DETECTION_FAILURE', 'OHE_CANTILEVER_FLASH_BURN'].includes(t.defect_type)
  ).length;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg animate-bounce">
          <Train className="w-6 h-6" />
        </div>
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400 tracking-wide">
          Loading RailSync Maintenance Operations Center...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenHelp={() => setIsHelpOpen(true)}
        urgentCount={urgentCount}
      />

      {/* Main Operations Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          metrics={metrics}
          onRefresh={loadData}
          loading={loading}
        />

        {/* Backend Warning Banner */}
        {backendError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span><strong>Backend Communication Warning:</strong> {backendError}</span>
            </div>
            <button
              onClick={loadData}
              className="px-2.5 py-1 bg-white hover:bg-red-100 border border-red-200 rounded font-semibold text-red-800 transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Active Page View */}
        <main className="flex-1 p-6 md:p-8">
          {activeTab === 'overview' && (
            <OverviewView
              metrics={metrics}
              tasks={tasks}
              plan={plan}
              onNavigate={setActiveTab}
              onSelectTask={handleSelectTask}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              tasks={tasks}
              onSelectTask={handleSelectTask}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'block-plan' && (
            <BlockPlanView
              plan={plan}
              tasks={tasks}
              onGeneratePlan={handleOptimize}
              onOpenValidator={() => setIsValidatorOpen(true)}
              onOpenBenchmark={() => setIsBenchmarkOpen(true)}
              onPublishPlan={handleApprovePublish}
              onAdjustSchedule={item => setSelectedOverrideItem(item)}
              loading={loading}
            />
          )}

          {activeTab === 'network' && (
            <NetworkView
              stations={stations}
              sections={sections}
              plan={plan}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'disruptions' && (
            <DisruptionsView
              plan={plan}
              onSimulateDisruption={handleDisruptionSubmit}
              loading={loading}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTrailView logs={auditLogs} />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <TaskDetailDrawer
        explanation={selectedTaskExplanation}
        task={selectedTaskObj}
        onClose={() => {
          setSelectedTaskExplanation(null);
          setSelectedTaskObj(null);
        }}
        onFindBlock={() => setActiveTab('block-plan')}
      />

      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        selectedHorizon="WEEKLY"
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

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};

export default App;
