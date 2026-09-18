import React, { useState } from 'react';
import {
  FileText,
  Clock,
  User,
  ShieldCheck,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Hash,
  Copy,
  Check
} from 'lucide-react';
import { AuditLog } from '../../types';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

interface AuditTrailViewProps {
  logs: AuditLog[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredLogs = logs.filter(l => {
    if (filterAction !== 'ALL' && l.action !== filterAction) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        l.log_id.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.justification || '').toLowerCase().includes(q) ||
        (l.plan_id || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'OPTIMIZATION_RUN':
      case 'PLAN_GENERATED':
        return <Badge variant="info">Plan Generated</Badge>;
      case 'OVERRIDE':
      case 'SCHEDULE_ADJUSTED':
        return <Badge variant="warning">Schedule Adjusted</Badge>;
      case 'DISRUPTION':
      case 'DISRUPTION_REOPTIMIZE':
        return <Badge variant="emergency">Disruption Re-planned</Badge>;
      case 'PUBLISH':
        return <Badge variant="success">Plan Published</Badge>;
      default:
        return <Badge variant="neutral">{action.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Search & Filter Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by action, controller or justification..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Action Type:</span>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="ALL">All Recorded Actions</option>
            <option value="OPTIMIZATION_RUN">Plan Generated</option>
            <option value="OVERRIDE">Schedule Adjusted</option>
            <option value="DISRUPTION_REOPTIMIZE">Disruption Re-planned</option>
            <option value="PUBLISH">Plan Published</option>
          </select>
        </div>
      </div>

      {/* Audit Timeline / Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log, idx) => {
              const dateStr = new Date(log.timestamp).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
              const isExpanded = expandedLogId === log.log_id;

              return (
                <div key={log.log_id || idx} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-slate-100 text-slate-600 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getActionBadge(log.action)}
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {log.plan_id ? `Plan: ${log.plan_id}` : log.log_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1">
                          {log.justification || 'Operational maintenance plan recorded.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{log.actor || 'Chief Controller'}</span>
                      </div>
                      <span className="font-mono text-[11px]">{dateStr}</span>
                    </div>
                  </div>

                  {/* Expandable Technical Hash Section */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.log_id)}
                      className="text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <span>Technical verification details</span>
                    </button>

                    <div className="flex items-center gap-1.5 font-mono text-slate-400">
                      <Hash className="w-3.5 h-3.5" />
                      <span>{log.content_hash ? log.content_hash.slice(0, 16) + '...' : 'Signed'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 p-3 rounded bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">SHA-256 Plan Hash:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(log.content_hash || '')}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px]"
                        >
                          {copiedHash === log.content_hash ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Hash
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-slate-800 break-all text-[11px] bg-white p-2 rounded border border-slate-200">
                        {log.content_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No audit records found"
            description="All schedule generation, controller adjustments, and disruption events will be logged chronologically."
          />
        )}
      </div>
    </div>
  );
};
