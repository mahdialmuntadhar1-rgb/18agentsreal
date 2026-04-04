import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Zap, Activity, TrendingUp, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface Agent {
  id: string;
  name: string;
  category: string;
  city: string;
  governorate: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  recordsFound: number;
  lastUpdated: number;
  jobId?: string;
}

interface GovernorateGroup {
  governorate: string;
  agents: Agent[];
}

export default function AgentCommandCenter() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalRunning, setGlobalRunning] = useState(false);

  // Initialize 18 agents
  useEffect(() => {
    const initialAgents: Agent[] = [
      { id: '01', name: 'Agent-01', category: 'Restaurants', city: 'Baghdad', governorate: 'Baghdad', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '02', name: 'Agent-02', category: 'Cafes', city: 'Baghdad', governorate: 'Baghdad', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '03', name: 'Agent-03', category: 'Bakeries', city: 'Basra', governorate: 'Basra', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '04', name: 'Agent-04', category: 'Hotels', city: 'Erbil', governorate: 'Erbil', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '05', name: 'Agent-05', category: 'Gyms', city: 'Najaf', governorate: 'Najaf', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '06', name: 'Agent-06', category: 'Beauty Salons', city: 'Karbala', governorate: 'Karbala', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '07', name: 'Agent-07', category: 'Pharmacies', city: 'Sulaymaniyah', governorate: 'Sulaymaniyah', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '08', name: 'Agent-08', category: 'Supermarkets', city: 'Kirkuk', governorate: 'Kirkuk', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '09', name: 'Agent-09', category: 'Car Dealers', city: 'Anbar', governorate: 'Anbar', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '10', name: 'Agent-10', category: 'Real Estate', city: 'Diyala', governorate: 'Diyala', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '11', name: 'Agent-11', category: 'Schools', city: 'Muthanna', governorate: 'Muthanna', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '12', name: 'Agent-12', category: 'Universities', city: 'Qadisiyyah', governorate: 'Qadisiyyah', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '13', name: 'Agent-13', category: 'Law Firms', city: 'Maysan', governorate: 'Maysan', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '14', name: 'Agent-14', category: 'Engineering Offices', city: 'Wasit', governorate: 'Wasit', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '15', name: 'Agent-15', category: 'Travel Agencies', city: 'Babil', governorate: 'Babil', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '16', name: 'Agent-16', category: 'Banks', city: 'Dhi Qar', governorate: 'Dhi Qar', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '17', name: 'Agent-17', category: 'Factories', city: 'Salah al-Din', governorate: 'Salah al-Din', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
      { id: '18', name: 'Agent-18', category: 'Hospitals', city: 'Duhok', governorate: 'Duhok', status: 'idle', progress: 0, recordsFound: 0, lastUpdated: Date.now() },
    ];
    setAgents(initialAgents);
    setLoading(false);
  }, []);

  // Fetch real agent status from API
  useEffect(() => {
    const fetchAgentStatus = async () => {
      try {
        const response = await fetch('/api/agents/list');
        if (response.ok) {
          const jobs = await response.json();
          setAgents(prev => prev.map(agent => {
            const job = jobs.find((j: any) => j.agent_name === agent.name);
            if (job) {
              return {
                ...agent,
                status: job.status === 'completed' ? 'completed' : job.status === 'failed' ? 'failed' : 'running',
                recordsFound: job.records_found || 0,
                progress: job.status === 'completed' ? 100 : job.status === 'running' ? 50 : 0,
                jobId: job.id,
              };
            }
            return agent;
          }));
        }
      } catch (err) {
        console.error('Failed to fetch agent status:', err);
      }
    };

    const interval = setInterval(fetchAgentStatus, 3000);
    fetchAgentStatus();
    return () => clearInterval(interval);
  }, []);

  // Start single agent
  const startAgent = async (agent: Agent) => {
    try {
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent.name,
          city: agent.city,
          category: agent.category,
        }),
      });
      if (response.ok) {
        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'running', progress: 0 } : a));
      }
    } catch (err) {
      console.error('Failed to start agent:', err);
    }
  };

  // Start all agents in parallel
  const startAllAgents = async () => {
    setGlobalRunning(true);
    setAgents(prev => prev.map(a => ({ ...a, status: 'running', progress: 0 })));

    // Fire all agents in parallel
    agents.forEach(agent => {
      fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent.name,
          city: agent.city,
          category: agent.category,
        }),
      }).catch(console.error);
    });
  };

  // Group agents by governorate
  const governorateGroups = Array.from(
    new Map(agents.map(a => [a.governorate, a])).values()
  ).reduce((acc, agent) => {
    const existing = acc.find(g => g.governorate === agent.governorate);
    if (existing) {
      existing.agents.push(agent);
    } else {
      acc.push({ governorate: agent.governorate, agents: [agent] });
    }
    return acc;
  }, [] as GovernorateGroup[]);

  const stats = {
    total: agents.length,
    running: agents.filter(a => a.status === 'running').length,
    completed: agents.filter(a => a.status === 'completed').length,
    totalRecords: agents.reduce((sum, a) => sum + a.recordsFound, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
      case 'completed': return 'bg-green-500/20 border-green-500/50 text-green-300';
      case 'failed': return 'bg-red-500/20 border-red-500/50 text-red-300';
      default: return 'bg-slate-500/20 border-slate-500/50 text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4 animate-spin text-blue-400" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-white">Loading agents...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-black text-white mb-2 flex items-center gap-3">
              <Zap className="text-yellow-400" size={40} />
              Agent Command Center
            </h1>
            <p className="text-slate-400 text-lg">Monitor all 18 AI agents in real-time parallel execution across Iraq</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startAllAgents}
            disabled={globalRunning}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-lg rounded-xl shadow-lg shadow-green-500/50 disabled:opacity-50 flex items-center gap-3"
          >
            <Zap size={24} />
            {globalRunning ? 'Agents Running...' : 'Launch All Agents'}
          </motion.button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-bold uppercase">Total Agents</p>
                <p className="text-white text-3xl font-black mt-2">{stats.total}</p>
              </div>
              <Zap className="text-yellow-400" size={32} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-blue-950/50 border border-blue-500/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-bold uppercase">Running</p>
                <p className="text-blue-200 text-3xl font-black mt-2">{stats.running}</p>
              </div>
              <Activity className="text-blue-400 animate-spin" size={32} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-green-950/50 border border-green-500/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-bold uppercase">Completed</p>
                <p className="text-green-200 text-3xl font-black mt-2">{stats.completed}</p>
              </div>
              <CheckCircle2 className="text-green-400" size={32} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-purple-950/50 border border-purple-500/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-bold uppercase">Records</p>
                <p className="text-purple-200 text-3xl font-black mt-2">{stats.totalRecords.toLocaleString()}</p>
              </div>
              <TrendingUp className="text-purple-400" size={32} />
            </div>
          </motion.div>
        </div>

        {/* Governorate Sections */}
        <div className="space-y-8">
          {governorateGroups.map((group, groupIdx) => (
            <motion.div
              key={group.governorate}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.05 }}
              className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur"
            >
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                {group.governorate}
                <span className="text-sm font-normal text-slate-400 ml-auto">{group.agents.length} agent(s)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.agents.map((agent, idx) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`border rounded-xl p-4 transition-all ${getStatusColor(agent.status)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-black text-sm">{agent.name}</p>
                        <p className="text-xs opacity-75 mt-1">{agent.category}</p>
                      </div>
                      {getStatusIcon(agent.status)}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase">Progress</span>
                        <span className="text-xs font-black">{agent.progress}%</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${agent.progress}%` }}
                          className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Records found */}
                    <p className="text-sm font-bold mb-3">📊 {agent.recordsFound} records found</p>

                    {/* Action button */}
                    <button
                      onClick={() => startAgent(agent)}
                      disabled={agent.status === 'running'}
                      className="w-full py-2 px-3 bg-black/30 hover:bg-black/50 disabled:opacity-50 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={14} />
                      {agent.status === 'running' ? 'Running...' : 'Start'}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
