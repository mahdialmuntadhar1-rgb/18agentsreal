import React from 'react';
import { Zap, Play, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PilotRuns() {
  const runs = [
    { id: '1', name: 'Sulaymaniyah Social Enrichment', date: '2026-03-23', status: 'Completed', records: 5000, success: 98 },
    { id: '2', name: 'Baghdad Text Repair', date: '2026-03-22', status: 'Completed', records: 16200, success: 95 },
    { id: '3', name: 'Basra Data Enrichment', date: '2026-03-21', status: 'Failed', records: 7000, success: 40 },
    { id: '4', name: 'Erbil QC Check', date: '2026-03-20', status: 'Completed', records: 3300, success: 100 },
  ];

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gold uppercase tracking-widest">Pilot Runs</h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Historical Execution Log</p>
      </header>

      <div className="bg-white/5 border border-gold/10 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-gold/10">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Run Name</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Records</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Success Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold/10">
            {runs.map(run => (
              <tr key={run.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-white">{run.name}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{run.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                    run.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {run.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">{run.records.toLocaleString()}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{run.success}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
