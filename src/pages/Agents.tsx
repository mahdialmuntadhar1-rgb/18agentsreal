import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Activity, Play, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

type ApiAgent = {
  agent_name: string;
  category: string | null;
  status: string;
  records_collected: number;
  target: number;
  errors: number;
  government_rate: string | null;
  last_run: string | null;
};

export default function Agents() {
  const [agents, setAgents] = useState<ApiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyAgent, setBusyAgent] = useState<string | null>(null);
  const [orchestratorRunning, setOrchestratorRunning] = useState(false);

  const activeCount = useMemo(
    () => agents.filter((agent) => ['active', 'running', 'processing'].includes(agent.status)).length,
    [agents]
  );

  const withAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Authentication required. Please sign in first.');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  const loadAgents = async () => {
    setError('');
    try {
      const headers = await withAuthHeaders();
      const response = await fetch('/api/agents', { headers });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load agents');
      }
      setAgents(payload.agents || []);
      setOrchestratorRunning(Boolean(payload.orchestratorRunning));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
    const timer = setInterval(loadAgents, 7000);
    return () => clearInterval(timer);
  }, []);

  const startStopOrchestrator = async (action: 'start' | 'stop') => {
    setBusyAgent(action);
    setError('');
    try {
      const headers = await withAuthHeaders();
      const response = await fetch(`/api/orchestrator/${action}`, { method: 'POST', headers });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || payload?.status || `Failed to ${action} orchestrator`);
      }
      await loadAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action} orchestrator`);
    } finally {
      setBusyAgent(null);
    }
  };

  const runAgent = async (agentName: string) => {
    setBusyAgent(agentName);
    setError('');
    try {
      const headers = await withAuthHeaders();
      const response = await fetch(`/api/agents/${encodeURIComponent(agentName)}/run`, {
        method: 'POST',
        headers,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to run agent');
      }
      await loadAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run agent');
    } finally {
      setBusyAgent(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">AGENT REGISTRY</h2>
          <p className="text-gray-500 font-medium">Live runtime status from backend + Supabase</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAgents}
            className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest flex items-center gap-2"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            disabled={orchestratorRunning || busyAgent !== null}
            onClick={() => startStopOrchestrator('start')}
            className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            Start All
          </button>
          <button
            disabled={!orchestratorRunning || busyAgent !== null}
            onClick={() => startStopOrchestrator('stop')}
            className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            Stop All
          </button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest font-bold text-gray-500">Orchestrator</div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${orchestratorRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {orchestratorRunning ? 'Running' : 'Idle'}
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} />
          {activeCount} Agents Active
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && agents.map((agent, idx) => {
          const isRunning = ['running', 'active', 'processing'].includes(agent.status);
          const completion = Math.min(100, Math.round((agent.records_collected / Math.max(agent.target || 1, 1)) * 100));
          return (
            <motion.div
              key={agent.agent_name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isRunning ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                  <Bot size={28} />
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {agent.status}
                </div>
              </div>

              <h3 className="text-lg font-black text-[#1B2B5E] uppercase tracking-tight">{agent.agent_name}</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{agent.category || 'unassigned'}</p>
              <p className="text-xs text-gray-400 mt-1">{agent.government_rate || 'No rate configured'}</p>

              <div className="mt-4 mb-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#C9A84C]" style={{ width: `${completion}%` }} />
                </div>
                <p className="text-[11px] text-gray-600 mt-2">{agent.records_collected} / {agent.target} records · {agent.errors} errors</p>
                <p className="text-[11px] text-gray-400">Last run: {agent.last_run ? new Date(agent.last_run).toLocaleString() : 'Never'}</p>
              </div>

              <button
                disabled={busyAgent !== null}
                onClick={() => runAgent(agent.agent_name)}
                className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#1B2B5E] text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play size={14} />
                {busyAgent === agent.agent_name ? 'Starting...' : 'Run Agent'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {loading && <p className="text-sm text-gray-500">Loading agents...</p>}
      {!loading && agents.length === 0 && <p className="text-sm text-gray-500">No agents found. Seed the agents table and refresh.</p>}
    </div>
  );
}
