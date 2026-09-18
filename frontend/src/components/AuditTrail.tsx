import React from 'react';
import { AuditLog } from '../types';
import { ShieldCheck, History } from 'lucide-react';

interface AuditTrailProps {
  logs: AuditLog[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs }) => {
  return (
    <div className="bg-surface2 border border-border1 rounded p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border1 pb-2.5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Cryptographic Audit Trail (SHA-256 Chained)
        </h2>
        <span className="text-[11px] font-mono text-slate-400">{logs.length} Immutable Log Entries</span>
      </div>

      <div className="overflow-x-auto max-h-60">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-border1 text-slate-400 text-[10px] bg-surface1/60 sticky top-0">
              <th className="p-2">TIMESTAMP</th>
              <th className="p-2">ACTION</th>
              <th className="p-2">ACTOR</th>
              <th className="p-2">PLAN / DETAILS</th>
              <th className="p-2">SHA-256 CONTENT HASH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border1/40 text-[11px]">
            {logs.map(log => (
              <tr key={log.log_id} className="hover:bg-surface3/40 transition-colors">
                <td className="p-2 text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
                <td className="p-2 font-bold text-indigo-300">{log.action}</td>
                <td className="p-2 text-slate-300">{log.actor}</td>
                <td className="p-2 text-slate-400 truncate max-w-xs">{log.justification || log.plan_id || '-'}</td>
                <td className="p-2 text-slate-500 text-[10px] truncate max-w-[140px]">{log.content_hash}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">No audit records generated yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
