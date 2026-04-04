import React, { useEffect, useState } from 'react';
import { Play, CheckCircle2, AlertCircle, Clock, Zap, Check, BarChart3 } from 'lucide-react';
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

// 20 Categories with subtypes count
const ALL_CATEGORIES = [
  { name: 'Restaurants & Dining', types: 4 },
  { name: 'Cafes & Coffee', types: 3 },
  { name: 'Bakeries', types: 2 },
  { name: 'Hotels & Stays', types: 3 },
  { name: 'Gyms & Fitness', types: 4 },
  { name: 'Beauty & Salons', types: 4 },
  { name: 'Pharmacy & Drugs', types: 3 },
  { name: 'Supermarkets', types: 4 },
  { name: 'Car Services', types: 3 },
  { name: 'Real Estate', types: 4 },
  { name: 'Schools', types: 3 },
  { name: 'Universities', types: 2 },
  { name: 'Law Firms', types: 3 },
  { name: 'Engineering', types: 3 },
  { name: 'Travel Agencies', types: 3 },
  { name: 'Banks & Finance', types: 3 },
  { name: 'Factories', types: 2 },
  { name: 'Hospitals', types: 4 },
  { name: 'Doctors & Physicians', types: 6 },
  { name: 'Entertainment', types: 3 },
];

// 18 Agents
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
  const [tab, setTab] = useState<'control' | 'progress'>('control');
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<Map<string, Job>>(new Map());
  const [running, setRunning] = useState(false);

  // Fetch jobs for progress dashboard
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

  // Toggle agent selection
  const toggleAgent = (agentId: string) => {
    const newSelected = new Set(selectedAgents);
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId);
    } else {
      newSelected.add(agentId);
    }
    setSelectedAgents(newSelected);
  };

  // Toggle category selection
  const toggleCategory = (categoryName: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryName)) {
      newSelected.delete(categoryName);
    } else {
      newSelected.add(categoryName);
    }
    setSelectedCategories(newSelected);
  };

  // Select all agents
  const selectAllAgents = () => {
    setSelectedAgents(new Set(agents.map(a => a.id)));
  };

  // Deselect all agents
  const deselectAllAgents = () => {
    setSelectedAgents(new Set());
  };

  // Select all categories
  const selectAllCategories = () => {
    setSelectedCategories(new Set(ALL_CATEGORIES.map(c => c.name)));
  };

  // Deselect all categories
  const deselectAllCategories = () => {
    setSelectedCategories(new Set());
  };

  // Launch selected agents with selected categories
  const launchAgents = async () => {
    if (selectedAgents.size === 0 || selectedCategories.size === 0) {
      alert('Please select at least one agent and one category');
      return;
    }

    setRunning(true);

    const selectedAgentsList = agents.filter(a => selectedAgents.has(a.id));
    const categoryArray = Array.from(selectedCategories);
    const totalLaunches = selectedAgentsList.length * categoryArray.length;

    console.log(`🚀 Launching ${selectedAgentsList.length} agents × ${categoryArray.length} categories = ${totalLaunches} jobs`);

    // Launch all agents with all categories in parallel
    const promises = selectedAgentsList.flatMap(agent =>
      categoryArray.map(category => {
        const payload = {
          agentName: agent.name,
          city: agent.city,
          category,
        };
        console.log(`📤 Sending request for ${agent.name} → ${category}`);

        return fetch('/api/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(async res => {
          const data = await res.json();
          if (!res.ok) {
            console.error(`❌ ${agent.name} × ${category} failed:`, data.error);
            throw new Error(data.error || `HTTP ${res.status}`);
          }
          console.log(`✅ ${agent.name} × ${category} started (Job: ${data.jobId})`);
          return data;
        });
      })
    );

    try {
      const results = await Promise.all(promises);
      console.log(`✅ ALL LAUNCHED: ${results.length} jobs started`);
      alert(`✅ Success! Started ${results.length} collection jobs.\n\nGo to "Progress Dashboard" to watch them run.`);
      setRunning(false);
      // Keep selections visible after launch
    } catch (err) {
      console.error('❌ Launch error:', err);
      alert(`❌ Error: ${(err as any).message}`);
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
          <h1 className="text-4xl font-black text-white mb-4 flex items-center gap-3">
            <Zap className="text-yellow-400" size={36} />
            IQ DATA COLLECTION
          </h1>

          {/* Tabs */}
          <div className="flex gap-4">
            <button
              onClick={() => setTab('control')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                tab === 'control'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Control Panel
            </button>
            <button
              onClick={() => setTab('progress')}
              className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                tab === 'progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <BarChart3 size={18} />
              Progress Dashboard
            </button>
          </div>
        </motion.div>

        {/* CONTROL PANEL TAB */}
        {tab === 'control' && (
          <div className="grid grid-cols-2 gap-8">
            {/* LEFT: AGENTS MULTI-SELECT */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6"
            >
              <div className="mb-6">
                <h2 className="text-xl font-black text-white mb-4">👥 SELECT AGENTS (18)</h2>
                <p className="text-sm text-slate-400 mb-4">
                  Selected: {selectedAgents.size} agents
                </p>

                {/* Select All / Deselect All */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={selectAllAgents}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm transition-all"
                  >
                    ✓ All
                  </button>
                  <button
                    onClick={deselectAllAgents}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-sm transition-all"
                  >
                    ✕ None
                  </button>
                </div>
              </div>

              {/* Agent List with Checkboxes */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {agents.map(agent => (
                  <motion.button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    whileHover={{ scale: 1.02 }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedAgents.has(agent.id)
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedAgents.has(agent.id)
                          ? 'border-green-500 bg-green-500'
                          : 'border-slate-500'
                      }`}>
                        {selectedAgents.has(agent.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-bold text-white">{agent.name}</p>
                        <p className="text-xs text-slate-400">{agent.governorate} • {agent.governRate}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* RIGHT: CATEGORIES WITH TYPES */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6"
            >
              <div className="mb-6">
                <h2 className="text-xl font-black text-white mb-4">📂 SELECT CATEGORIES (20)</h2>
                <p className="text-sm text-slate-400 mb-4">
                  Selected: {selectedCategories.size} categories
                </p>

                {/* Select All / Deselect All */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={selectAllCategories}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm transition-all"
                  >
                    ✓ All
                  </button>
                  <button
                    onClick={deselectAllCategories}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-sm transition-all"
                  >
                    ✕ None
                  </button>
                </div>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                {ALL_CATEGORIES.map(cat => {
                  const isSelected = selectedCategories.has(cat.name);
                  return (
                    <motion.button
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name)}
                      whileHover={{ scale: 1.02 }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-slate-500'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                            {cat.name}
                          </p>
                          <p className="text-xs text-slate-500">{cat.types} TYPES</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {/* PROGRESS DASHBOARD TAB */}
        {tab === 'progress' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-black text-white mb-6">📊 AGENT STATUS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map(agent => {
                const job = jobs.get(agent.name);
                return (
                  <motion.div
                    key={agent.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl border-2 ${getStatusColor(job?.status || 'idle')}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-white">{agent.name}</p>
                        <p className="text-xs text-slate-400">{agent.governorate}</p>
                      </div>
                      {getStatusIcon(job?.status || 'idle')}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="font-bold capitalize">{job?.status || 'Idle'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Records:</span>
                        <span className="font-bold">{job?.records_found || 0}</span>
                      </div>
                      {job?.started_at && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Started:</span>
                          <span>{new Date(job.started_at).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* LAUNCH BUTTON - Only on Control Tab */}
        {tab === 'control' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={launchAgents}
              disabled={selectedAgents.size === 0 || selectedCategories.size === 0 || running}
              className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-black text-lg rounded-xl shadow-lg shadow-green-500/50 flex items-center justify-center gap-3 transition-all"
            >
              <Play size={24} />
              {running
                ? `Launching ${selectedAgents.size} agents × ${selectedCategories.size} categories...`
                : `🚀 LAUNCH - ${selectedAgents.size} Agents × ${selectedCategories.size} Categories`}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
