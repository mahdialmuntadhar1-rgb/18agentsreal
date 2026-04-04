import React, { useEffect, useState } from 'react';
import { Play, CheckCircle2, AlertCircle, Clock, Zap, Eye, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface Agent {
  id: string;
  name: string;
  category: string;
  governorate: string;
  governRate: string;
  city: string;
}

interface Job {
  id: string;
  agent_name: string;
  status: 'running' | 'completed' | 'failed' | 'idle';
  records_found: number;
  started_at: string;
  completed_at?: string;
}

interface Checkpoint {
  id: string;
  message: string;
  created_at: string;
}

// 20 Categories
const ALL_CATEGORIES = [
  'Restaurants & Dining',
  'Cafes & Coffee',
  'Bakeries',
  'Hotels & Stays',
  'Gyms & Fitness',
  'Beauty & Salons',
  'Pharmacy & Drugs',
  'Supermarkets',
  'Car Services',
  'Real Estate',
  'Schools',
  'Universities',
  'Law Firms',
  'Engineering',
  'Travel Agencies',
  'Banks & Finance',
  'Factories',
  'Hospitals',
  'Doctors & Physicians',
  'Entertainment'
];

// 18 Agents with Govern Rates
const agents: Agent[] = [
  { id: '01', name: 'Agent-01', category: 'Restaurants & Dining', governorate: 'Baghdad', governRate: 'Level 1', city: 'Baghdad' },
  { id: '02', name: 'Agent-02', category: 'Cafes & Coffee', governorate: 'Baghdad', governRate: 'Level 1', city: 'Baghdad' },
  { id: '03', name: 'Agent-03', category: 'Bakeries', governorate: 'Basra', governRate: 'Level 1', city: 'Basra' },
  { id: '04', name: 'Agent-04', category: 'Hotels & Stays', governorate: 'Erbil', governRate: 'Level 2', city: 'Erbil' },
  { id: '05', name: 'Agent-05', category: 'Gyms & Fitness', governorate: 'Najaf', governRate: 'Level 2', city: 'Najaf' },
  { id: '06', name: 'Agent-06', category: 'Beauty & Salons', governorate: 'Karbala', governRate: 'Level 2', city: 'Karbala' },
  { id: '07', name: 'Agent-07', category: 'Pharmacy & Drugs', governorate: 'Sulaymaniyah', governRate: 'Level 2', city: 'Sulaymaniyah' },
  { id: '08', name: 'Agent-08', category: 'Supermarkets', governorate: 'Kirkuk', governRate: 'Level 2', city: 'Kirkuk' },
  { id: '09', name: 'Agent-09', category: 'Car Services', governorate: 'Anbar', governRate: 'Level 3', city: 'Anbar' },
  { id: '10', name: 'Agent-10', category: 'Real Estate', governorate: 'Diyala', governRate: 'Level 3', city: 'Diyala' },
  { id: '11', name: 'Agent-11', category: 'Schools', governorate: 'Muthanna', governRate: 'Level 3', city: 'Muthanna' },
  { id: '12', name: 'Agent-12', category: 'Universities', governorate: 'Qadisiyyah', governRate: 'Level 3', city: 'Qadisiyyah' },
  { id: '13', name: 'Agent-13', category: 'Law Firms', governorate: 'Maysan', governRate: 'Level 3', city: 'Maysan' },
  { id: '14', name: 'Agent-14', category: 'Engineering', governorate: 'Wasit', governRate: 'Level 3', city: 'Wasit' },
  { id: '15', name: 'Agent-15', category: 'Travel Agencies', governorate: 'Babil', governRate: 'Level 4', city: 'Babil' },
  { id: '16', name: 'Agent-16', category: 'Banks & Finance', governorate: 'Dhi Qar', governRate: 'Level 4', city: 'Dhi Qar' },
  { id: '17', name: 'Agent-17', category: 'Factories', governorate: 'Salah al-Din', governRate: 'Level 4', city: 'Salah al-Din' },
  { id: '18', name: 'Agent-18', category: 'Hospitals', governorate: 'Duhok', governRate: 'Level 5', city: 'Duhok' },
];

export default function GovernorControl() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agents[0]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<Map<string, Job>>(new Map());
  const [checkpoints, setCheckpoints] = useState<Map<string, Checkpoint[]>>(new Map());
  const [selectedJobForLogs, setSelectedJobForLogs] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/agents/list');
        if (response.ok) {
          const data = await response.json();
          const jobMap = new Map(data.map((j: Job) => [j.agent_name, j]));
          setJobs(jobMap);
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch logs
  useEffect(() => {
    if (!selectedJobForLogs) return;

    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/logs/${selectedJobForLogs}`);
        if (response.ok) {
          const data = await response.json();
          setCheckpoints(prev => new Map(prev).set(selectedJobForLogs, data));
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, [selectedJobForLogs]);

  // Toggle category
  const toggleCategory = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  // Select all categories
  const selectAllCategories = () => {
    setSelectedCategories(new Set(ALL_CATEGORIES));
  };

  // Deselect all
  const deselectAllCategories = () => {
    setSelectedCategories(new Set());
  };

  // Launch selected agent with selected categories
  const launchAgent = async () => {
    if (!selectedAgent || selectedCategories.size === 0) {
      alert('Please select an agent and at least one category');
      return;
    }

    setRunning(true);

    const promises = Array.from(selectedCategories).map(category =>
      fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: selectedAgent.name,
          city: selectedAgent.city,
          category,
        }),
      })
    );

    try {
      await Promise.all(promises);
      console.log(`✅ Launched ${selectedAgent.name} for ${selectedCategories.size} categories!`);
      setRunning(false);
      setSelectedCategories(new Set()); // Clear selection after launch

      // Refresh jobs
      const response = await fetch('/api/agents/list');
      if (response.ok) {
        const data = await response.json();
        setJobs(new Map(data.map((j: Job) => [j.agent_name, j])));
      }
    } catch (err) {
      console.error('Failed to launch agent:', err);
      setRunning(false);
    }
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
      case 'running': return <Clock className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Zap className="text-yellow-400" size={36} />
            IQ DATA OPS
          </h1>
          <p className="text-slate-400">Select Agent → Choose Categories → Launch</p>
        </motion.div>

        {/* Two-Panel Layout */}
        <div className="grid grid-cols-3 gap-8">
          {/* LEFT: AGENTS & GOVERN RATES */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-xl font-black text-white mb-6">📋 AGENTS</h2>
            <div className="space-y-2">
              {agents.map(agent => (
                <motion.button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setSelectedCategories(new Set());
                  }}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAgent?.id === agent.id
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-white">{agent.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{agent.governorate}</p>
                      <p className="text-xs text-yellow-300 font-bold mt-1">🏛️ {agent.governRate}</p>
                    </div>
                    {selectedAgent?.id === agent.id && (
                      <Check className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* CENTER & RIGHT: CATEGORIES */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-2"
          >
            {selectedAgent && (
              <div className="space-y-6">
                {/* Selected Agent Info */}
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-6 text-white">
                  <p className="text-sm uppercase font-bold opacity-90">Selected</p>
                  <h3 className="text-3xl font-black mt-2">{selectedAgent.name}</h3>
                  <p className="text-white/80 mt-2">{selectedAgent.category} | {selectedAgent.city}</p>
                </div>

                {/* Categories Header */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-white">📂 SELECT CATEGORIES (20)</h2>
                    <span className="text-sm font-bold text-slate-400">
                      {selectedCategories.size} selected
                    </span>
                  </div>

                  {/* Select All / Deselect All */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={selectAllCategories}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all"
                    >
                      ✓ Select All
                    </button>
                    <button
                      onClick={deselectAllCategories}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
                    >
                      ✕ Deselect All
                    </button>
                  </div>

                  {/* Category Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {ALL_CATEGORIES.map(category => {
                      const isSelected = selectedCategories.has(category);
                      return (
                        <motion.button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          whileHover={{ scale: 1.02 }}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-green-500 bg-green-500'
                                : 'border-slate-500'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-sm font-bold ${isSelected ? 'text-green-300' : 'text-slate-300'}`}>
                              {category}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Launch Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={launchAgent}
                    disabled={selectedCategories.size === 0 || running}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-black text-lg rounded-xl shadow-lg shadow-green-500/50 flex items-center justify-center gap-3 transition-all"
                  >
                    <Play size={24} />
                    {running
                      ? `Launching ${selectedCategories.size} categories...`
                      : `Launch ${selectedAgent.name} for ${selectedCategories.size} Categories`}
                  </motion.button>
                </div>

                {/* Recent Jobs for This Agent */}
                {jobs.has(selectedAgent.name) && (
                  <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-white mb-4">📊 Recent Work</h3>
                    <div className={`p-4 rounded-lg border ${getStatusColor(jobs.get(selectedAgent.name)?.status || 'idle')}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(jobs.get(selectedAgent.name)?.status || 'idle')}
                          <div>
                            <p className="font-bold capitalize">{jobs.get(selectedAgent.name)?.status || 'Idle'}</p>
                            <p className="text-xs opacity-75">
                              {jobs.get(selectedAgent.name)?.records_found || 0} records found
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => jobs.get(selectedAgent.name) && setSelectedJobForLogs(jobs.get(selectedAgent.name)!.id)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-all flex items-center gap-2"
                        >
                          <Eye size={14} />
                          Logs
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Logs Modal */}
        {selectedJobForLogs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedJobForLogs(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white">Execution Checkpoints</h3>
                <button onClick={() => setSelectedJobForLogs(null)} className="text-slate-400 hover:text-white text-2xl">
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {(checkpoints.get(selectedJobForLogs) || []).map((cp, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-slate-400 min-w-fit">
                        {new Date(cp.created_at).toLocaleTimeString()}
                      </span>
                      <div className="text-sm text-slate-300 font-mono break-all">
                        {cp.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
