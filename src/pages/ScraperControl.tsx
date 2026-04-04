/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search,
  MapPin,
  Layers,
  Terminal,
  Database,
  ArrowRight,
  ChevronRight,
  Activity,
  Utensils,
  Hotel,
  Pill,
  Stethoscope,
  ShoppingBag,
  Shirt,
  Cpu,
  Car,
  Home,
  GraduationCap,
  BookOpen,
  Dumbbell,
  Scissors,
  Scale,
  PenTool,
  Plane,
  Wallet,
  Factory
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GOVERNORATES, CATEGORIES } from '../constants/scraper';
import { StatusBadge } from '../components/StatusBadge';

const ICON_MAP: Record<string, any> = {
  Utensils, Hotel, Pill, Stethoscope, ShoppingBag, Shirt, Cpu, Car, Home,
  GraduationCap, BookOpen, Dumbbell, Scissors, Scale, PenTool, Plane, Wallet, Factory
};

interface Agent {
  id: string;
  governorate: string;
  status: string;
  progress: number;
  recordsFound: number;
  lastUpdated: number;
  agentName: string;
  category: string;
}

export const ScraperControl: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedGovernorates, setSelectedGovernorates] = useState<string[]>(['Baghdad']);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{id: string, time: string, msg: string, level: string}[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents/list');
      if (!res.ok) throw new Error('Failed to fetch agents');
      const data = await res.json();
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (msg: string, level: string = 'INFO') => {
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      msg,
      level
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  const handleStart = async () => {
    if (selectedAgentIds.length === 0) {
      addLog('No agents selected for collection', 'WARN');
      return;
    }
    try {
      const res = await fetch('/api/agents/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ governorates: selectedGovernorates, agentIds: selectedAgentIds })
      });
      if (res.ok) {
        addLog(`Started collection for ${selectedAgentIds.length} agents in ${selectedGovernorates.join(', ')}`);
      }
    } catch (err) {
      addLog('Failed to start agents', 'ERROR');
    }
  };

  const handleStop = async () => {
    if (selectedAgentIds.length === 0) return;
    try {
      const res = await fetch('/api/agents/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentIds: selectedAgentIds })
      });
      if (res.ok) addLog(`Stopped ${selectedAgentIds.length} agents`);
    } catch (err) {
      addLog('Failed to stop agents', 'ERROR');
    }
  };

  const handlePause = async () => {
    if (selectedAgentIds.length === 0) return;
    try {
      const res = await fetch('/api/agents/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentIds: selectedAgentIds })
      });
      if (res.ok) addLog(`Paused ${selectedAgentIds.length} agents`);
    } catch (err) {
      addLog('Failed to pause agents', 'ERROR');
    }
  };

  const handleResume = async () => {
    if (selectedAgentIds.length === 0) return;
    try {
      const res = await fetch('/api/agents/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentIds: selectedAgentIds })
      });
      if (res.ok) addLog(`Resumed ${selectedAgentIds.length} agents`);
    } catch (err) {
      addLog('Failed to resume agents', 'ERROR');
    }
  };

  const handleClear = async () => {
    try {
      const res = await fetch('/api/agents/clear', { method: 'POST' });
      if (res.ok) {
        setLogs([]);
        addLog('System reset successful');
      }
    } catch (err) {
      addLog('Failed to reset system', 'ERROR');
    }
  };

  const toggleGovernorate = (gov: string) => {
    setSelectedGovernorates(prev => 
      prev.includes(gov) ? prev.filter(g => g !== gov) : [...prev, gov]
    );
  };

  const toggleAgent = (id: string) => {
    setSelectedAgentIds(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const selectAllAgents = () => {
    setSelectedAgentIds(agents.map(a => a.id));
  };

  const deselectAllAgents = () => {
    setSelectedAgentIds([]);
  };

  const activeAgentsCount = agents.filter(a => a.status === 'RUNNING').length;
  const totalRecords = agents.reduce((sum, a) => sum + a.recordsFound, 0);
  const avgProgress = agents.length > 0 ? agents.reduce((sum, a) => sum + a.progress, 0) / agents.length : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Action Bar */}
      <header className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <Activity className="w-6 h-6 mr-2 text-blue-600" />
              OPERATOR COMMAND
            </h1>
            <p className="text-slate-500 text-sm font-medium">Configure and launch business directory agents across Iraq.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleStart}
              disabled={selectedAgentIds.length === 0}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Launch Collection
            </button>
            <div className="h-10 w-px bg-slate-200 mx-1 hidden sm:block" />
            <button 
              onClick={handlePause}
              className="p-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Pause Selected"
            >
              <Pause className="w-5 h-5" />
            </button>
            <button 
              onClick={handleResume}
              className="p-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Resume Selected"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={handleStop}
              className="p-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Stop Selected"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={handleClear}
              className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Reset System"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Governorate Selector */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-2 text-blue-600" />
                Governorates
              </h3>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {selectedGovernorates.length} Selected
              </span>
            </div>
            <div className="p-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {GOVERNORATES.map(gov => (
                <button
                  key={gov}
                  onClick={() => toggleGovernorate(gov)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    selectedGovernorates.includes(gov)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {gov}
                  {selectedGovernorates.includes(gov) && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-4 shadow-xl shadow-slate-900/20">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Session</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black">{activeAgentsCount}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Active Agents</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-400">{totalRecords.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Records Found</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-500">Overall Progress</span>
                  <span className="text-blue-400">{Math.round(avgProgress)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${avgProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Panel: Agent Cards */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-slate-400" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Available Agents (18)</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={selectAllAgents}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button 
                onClick={deselectAllAgents}
                className="text-[10px] font-bold text-slate-500 hover:underline"
              >
                Deselect
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map((agent, idx) => {
              const category = CATEGORIES.find(c => c.name === agent.category);
              const Icon = category ? ICON_MAP[category.icon] : Layers;
              const isSelected = selectedAgentIds.includes(agent.id);
              
              return (
                <motion.div
                  key={agent.id}
                  layout
                  onClick={() => toggleAgent(agent.id)}
                  className={`relative group cursor-pointer border-2 rounded-2xl p-4 transition-all ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/30 shadow-md' 
                      : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <StatusBadge status={agent.status as any} />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent {idx + 1}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <h4 className="font-black text-slate-900 tracking-tight">{agent.category}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{agent.governorate} • {agent.recordsFound} records</p>
                  </div>

                  {agent.status === 'RUNNING' && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[9px] font-bold uppercase">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-blue-600">{agent.progress}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-500" 
                          style={{ width: `${agent.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Logs & Terminal */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live System Logs</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase">Connected</span>
              </div>
            </div>
            <div className="p-4 h-48 overflow-y-auto font-mono text-[11px] space-y-1 custom-scrollbar bg-slate-950">
              {logs.length === 0 ? (
                <p className="text-slate-600 italic">Waiting for system events...</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex space-x-3 group">
                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                    <span className={`font-bold shrink-0 ${
                      log.level === 'ERROR' ? 'text-rose-500' : 
                      log.level === 'WARN' ? 'text-amber-500' : 
                      'text-blue-400'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-slate-300 group-hover:text-white transition-colors">{log.msg}</span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
