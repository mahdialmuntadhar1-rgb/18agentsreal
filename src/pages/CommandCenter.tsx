import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Terminal,
  Activity,
  Cpu,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Agent {
  agent_name: string;
  category: string;
  city: string;
  status: 'idle' | 'running' | 'error' | 'active';
  government_rate: string;
  last_run?: string;
}

const CommandCenter: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAgent = async (agentName: string) => {
    setRunningAgents(prev => new Set(prev).add(agentName));
    addLog(`Starting ${agentName}...`);
    
    try {
      const response = await fetch(`/api/agents/${agentName}/run`, { method: 'POST' });
      const data = await response.json();
      
      if (data.status === 'running') {
        addLog(`${agentName} started successfully (task: ${data.taskId})`);
      } else {
        addLog(`${agentName} failed to start`);
      }
    } catch (error) {
      addLog(`Error starting ${agentName}: ${error}`);
    } finally {
      setRunningAgents(prev => {
        const next = new Set(prev);
        next.delete(agentName);
        return next;
      });
    }
  };

  const runAllAgents = async () => {
    addLog('Starting all agents...');
    
    try {
      const response = await fetch('/api/orchestrator/start', { method: 'POST' });
      const data = await response.json();
      
      if (data.status === 'queued') {
        addLog(`Orchestrator queued ${data.queuedAgents} agents`);
        if (data.taskWarning) {
          addLog(`Warning: ${data.taskWarning}`);
        }
      }
    } catch (error) {
      addLog(`Error starting orchestrator: ${error}`);
    }
  };

  const stopAllAgents = async () => {
    addLog('Stopping all agents...');
    
    try {
      const response = await fetch('/api/orchestrator/stop', { method: 'POST' });
      const data = await response.json();
      
      if (data.status === 'stopped') {
        addLog('All agents stopped');
      }
    } catch (error) {
      addLog(`Error stopping agents: ${error}`);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return <Activity size={16} className="text-emerald-500 animate-pulse" />;
      case 'error':
        return <AlertCircle size={16} className="text-rose-500" />;
      case 'idle':
      default:
        return <CheckCircle2 size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'error':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'idle':
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">COMMAND CENTER</h2>
          <p className="text-gray-500 font-medium">Control and monitor all agent operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runAllAgents}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all"
          >
            <Play size={16} />
            Run All
          </button>
          <button
            onClick={stopAllAgents}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all"
          >
            <Square size={16} />
            Stop All
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : agents.map((agent) => (
          <div 
            key={agent.agent_name}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1B2B5E] rounded-xl flex items-center justify-center">
                  <Cpu size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1B2B5E]">{agent.agent_name}</h3>
                  <p className="text-xs text-gray-400 font-medium">{agent.category}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${getStatusColor(agent.status)}`}>
                {agent.status}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Globe size={12} />
                <span>{agent.city}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Activity size={12} />
                <span>{agent.government_rate}</span>
              </div>
            </div>

            <button
              onClick={() => runAgent(agent.agent_name)}
              disabled={runningAgents.has(agent.agent_name) || agent.status === 'running'}
              className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-xl font-bold text-xs transition-all"
            >
              {runningAgents.has(agent.agent_name) ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RotateCcw size={14} />
                  Run Agent
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* System Logs */}
      <div className="bg-[#1B2B5E] rounded-[32px] overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Terminal size={18} className="text-[#C9A84C]" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">System Logs</h3>
        </div>
        <div className="p-4 h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-white/40">No activity yet...</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, i) => (
                <p key={i} className="text-white/80">{log}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
