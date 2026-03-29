import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Activity, Search, RefreshCw, Play } from 'lucide-react';

type AgentRow = {
  id: string;
  agent_name: string;
  category?: string | null;
  status: string;
  records_collected?: number | null;
  last_run?: string | null;
};

const formatLastRun = (dateStr?: string | null) => {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
};

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((agent) =>
      `${agent.agent_name} ${agent.category ?? ''}`.toLowerCase().includes(q),
    );
  }, [agents, query]);

  const activeCount = agents.filter((a) => a.status === 'running').length;

  const triggerRun = async (agentName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(agentName)}/run`, { method: 'POST' });
      if (!response.ok) throw new Error(`Failed to run ${agentName}`);
      await loadAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to run ${agentName}`);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">AGENT REGISTRY</h2>
          <p className="text-gray-500 font-medium">Live status from persisted Supabase agent state.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} />
            {activeCount} Agents Running
          </div>
          <button onClick={loadAgents} className="px-3 py-2 rounded-xl border bg-white text-xs font-black" disabled={loading}>
            <RefreshCw size={14} className="inline mr-1" /> Refresh
          </button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents by name or category..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C9A84C]"
          />
        </div>
      </div>

      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((agent) => (
          <div key={agent.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner bg-gray-50 text-gray-600">
                <Bot size={28} />
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${agent.status === 'running' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {agent.status}
              </div>
            </div>
            <h3 className="text-lg font-black text-[#1B2B5E] uppercase tracking-tight">{agent.agent_name}</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{agent.category || 'Unassigned'}</p>

            <div className="mt-4 space-y-1 text-sm text-gray-600">
              <div>Records: {(agent.records_collected || 0).toLocaleString()}</div>
              <div>Last Run: {formatLastRun(agent.last_run)}</div>
            </div>

            <button
              onClick={() => triggerRun(agent.agent_name)}
              disabled={loading}
              className="mt-4 w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#1B2B5E] text-white hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Play size={14} /> Trigger Run
            </button>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && <div className="text-sm text-gray-500">No persisted agents found.</div>}
    </div>
  );
};

export default Agents;
