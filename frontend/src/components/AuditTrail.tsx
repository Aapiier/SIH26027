import React from 'react';
import { AuditLog } from '../types';
import { ShieldCheck, History, Lock, FileText } from 'lucide-react';

interface AuditTrailProps {
  logs: AuditLog[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs }) => {
  return (
    <div className="bg-[#111622] border border-[#252f44] rounded-xl p-4 flex flex-col gap-3 shadow-sm text-[#dfe2ee]">
      <div className="flex items-center justify-between border-b border-[#252f44] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Cryptographic Audit Trail (SHA-256 Chained)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {logs.length} Immutable Entries
              </span>
            </h2>
          </div>
        </div>
        <div className="text-xs text-[#64748b] font-mono flex items-center gap-1">
          <Lock className="w-3 h-3 text-emerald-400" />
          Tamper-Evident State Log
        </div>
      </div>

      <div className="overflow-x-auto max-h-60 rounded border border-[#1e293b]">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="bg-[#161c2d] text-[#94a3b8] text-[10px] sticky top-0 border-b border-[#252f44]">
            <tr>
              <th className="p-2.5">TIMESTAMP (UTC)</th>
              <th className="p-2.5">ACTION TYPE</th>
              <th className="p-2.5">CONTROLLER ACTOR</th>
              <th className="p-2.5">JUSTIFICATION / PLAN</th>
              <th className="p-2.5">CRYPTOGRAPHIC SHA-256 HASH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b] text-[11px] bg-[#0b0f17]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[#64748b] italic">
                  No operational audit events recorded yet.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.log_id} className="hover:bg-[#161c2d] transition-colors">
                  <td className="p-2.5 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toUTCString().slice(5, 22)}
                  </td>
                  <td className="p-2.5 font-bold text-blue-400">{log.action}</td>
                  <td className="p-2.5 text-[#cbd5e1]">{log.actor}</td>
                  <td className="p-2.5 text-slate-300 truncate max-w-xs">
                    {log.justification || log.plan_id || '—'}
                  </td>
                  <td className="p-2.5 text-emerald-400 text-[10px] font-mono truncate max-w-[180px]">
                    {log.content_hash}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
