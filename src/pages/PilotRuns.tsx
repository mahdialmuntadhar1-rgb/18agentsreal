import React, { useEffect, useMemo, useState } from 'react';
import { Clock, History, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

type RuntimeTask = {
  id: string;
  type: string;
  instruction: string;
  status: string;
  created_at: string;
};

export default function PilotRuns() {
  const [runs, setRuns] = useState<RuntimeTask[]>([]);
  const [search, setSearch] = useState('');

  const loadRuns = async () => {
    const { data } = await supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(100);
    setRuns((data as RuntimeTask[]) ?? []);
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return runs;
    return runs.filter((run) => `${run.type} ${run.instruction} ${run.status}`.toLowerCase().includes(q));
  }, [runs, search]);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-emerald-500/10">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <History className="text-emerald-400" size={28} />
            Runtime Run History
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Persisted Supabase task execution log</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search runs..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <button onClick={loadRuns} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors">
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Task Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Instruction</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Created</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((run) => (
                <tr key={run.id} className="hover:bg-emerald-500/5 transition-colors group">
                  <td className="px-6 py-4 text-xs font-black text-slate-100 uppercase tracking-wide">{run.type}</td>
                  <td className="px-6 py-4 text-xs text-slate-300">{run.instruction}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(run.created_at).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      run.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : run.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
