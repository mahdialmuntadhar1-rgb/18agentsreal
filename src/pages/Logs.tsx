import React, { useEffect, useMemo, useState } from 'react';
import { Search, Terminal, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

type RuntimeLog = {
  id: string;
  created_at: string;
  agent_id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
};

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<RuntimeLog[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    const { data } = await supabase.from('agent_logs').select('*').order('created_at', { ascending: false }).limit(200);
    setLogs((data as RuntimeLog[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => `${log.agent_id} ${log.message} ${log.type}`.toLowerCase().includes(q));
  }, [logs, query]);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">SYSTEM LOGS</h2>
          <p className="text-gray-500 font-medium">Persisted runtime audit events from Supabase.</p>
        </div>
        <button onClick={loadLogs} className="bg-[#1B2B5E] text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search logs by agent, type, or message..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C9A84C]"
          />
        </div>
      </div>

      <div className="bg-[#151619] rounded-[32px] shadow-2xl overflow-hidden border border-white/5">
        <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4 flex items-center gap-2">
            <Terminal size={12} /> Live System Output
          </span>
          <span className="text-[10px] text-white/40">{loading ? 'loading...' : `${filtered.length} events`}</span>
        </div>

        <div className="p-6 font-mono text-xs space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
          {filtered.map((log) => (
            <div key={log.id} className="flex items-start gap-4 group">
              <span className="text-white/20 whitespace-nowrap">[{new Date(log.created_at).toLocaleTimeString()}]</span>
              <span className="font-bold whitespace-nowrap min-w-[120px] text-[#C9A84C]">{log.agent_id}</span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                  log.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : log.type === 'warning'
                      ? 'bg-amber-500/10 text-amber-400'
                      : log.type === 'error'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-blue-500/10 text-blue-400'
                }`}
              >
                {log.type}
              </span>
              <span className="text-white/60 group-hover:text-white transition-colors">{log.message}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-white/20 pt-4">
            <Clock size={12} />
            <span>{filtered.length === 0 ? 'No runtime events found in Supabase.' : 'End of persisted log stream.'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
