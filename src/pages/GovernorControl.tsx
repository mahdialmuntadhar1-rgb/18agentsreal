import React, { useEffect, useState } from 'react';
import { Play, CheckCircle2, AlertCircle, Clock, Zap, RotateCcw, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface Governor {
  id: string;
  name: string;
  category: string;
  governorate: string;
  city: string;
}

interface Job {
  id: string;
  agent_name: string;
  status: 'running' | 'completed' | 'failed' | 'idle';
  records_found: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

interface Checkpoint {
  id: string;
  message: string;
  created_at: string;
  level: string;
}

const governors: Governor[] = [
  { id: '01', name: 'Agent-01', category: 'Restaurants & Dining', governorate: 'Baghdad', city: 'Baghdad' },
  { id: '02', name: 'Agent-02', category: 'Cafes & Coffee', governorate: 'Baghdad', city: 'Baghdad' },
  { id: '03', name: 'Agent-03', category: 'Bakeries', governorate: 'Basra', city: 'Basra' },
  { id: '04', name: 'Agent-04', category: 'Hotels & Stays', governorate: 'Erbil', city: 'Erbil' },
  { id: '05', name: 'Agent-05', category: 'Gyms & Fitness', governorate: 'Najaf', city: 'Najaf' },
  { id: '06', name: 'Agent-06', category: 'Beauty & Salons', governorate: 'Karbala', city: 'Karbala' },
  { id: '07', name: 'Agent-07', category: 'Pharmacy & Drugs', governorate: 'Sulaymaniyah', city: 'Sulaymaniyah' },
  { id: '08', name: 'Agent-08', category: 'Supermarkets', governorate: 'Kirkuk', city: 'Kirkuk' },
  { id: '09', name: 'Agent-09', category: 'Car Services', governorate: 'Anbar', city: 'Anbar' },
  { id: '10', name: 'Agent-10', category: 'Real Estate', governorate: 'Diyala', city: 'Diyala' },
  { id: '11', name: 'Agent-11', category: 'Schools', governorate: 'Muthanna', city: 'Muthanna' },
  { id: '12', name: 'Agent-12', category: 'Universities', governorate: 'Qadisiyyah', city: 'Qadisiyyah' },
  { id: '13', name: 'Agent-13', category: 'Law Firms', governorate: 'Maysan', city: 'Maysan' },
  { id: '14', name: 'Agent-14', category: 'Engineering', governorate: 'Wasit', city: 'Wasit' },
  { id: '15', name: 'Agent-15', category: 'Travel Agencies', governorate: 'Babil', city: 'Babil' },
  { id: '16', name: 'Agent-16', category: 'Banks & Finance', governorate: 'Dhi Qar', city: 'Dhi Qar' },
  { id: '17', name: 'Agent-17', category: 'Factories', governorate: 'Salah al-Din', city: 'Salah al-Din' },
  { id: '18', name: 'Agent-18', category: 'Hospitals', governorate: 'Duhok', city: 'Duhok' },
];

export default function GovernorControl() {
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<Map<string, Job>>(new Map());
  const [checkpoints, setCheckpoints] = useState<Map<string, Checkpoint[]>>(new Map());
  const [selectedJobForLogs, setSelectedJobForLogs] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  // Fetch jobs periodically
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
    const interval = setInterval(fetchJobs, 2000); // Poll every 2s for real-time updates
    return () => clearInterval(interval);
  }, []);

  // Fetch checkpoints for selected job
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
    const interval = setInterval(fetchLogs, 1000); // Poll every 1s for logs
    return () => clearInterval(interval);
  }, [selectedJobForLogs]);

  // Toggle agent selection
  const toggleAgent = (agentName: string) => {
    const newSelected = new Set(selectedAgents);
    if (newSelected.has(agentName)) {
      newSelected.delete(agentName);
    } else {
      newSelected.add(agentName);
    }
    setSelectedAgents(newSelected);
  };

  // Select all
  const selectAll = () => {
    setSelectedAgents(new Set(governors.map(g => g.name)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedAgents(new Set());
  };

  // Launch selected agents in PARALLEL
  const launchSelected = async () => {
    setRunning(true);
    const promises = Array.from(selectedAgents).map(agentName => {
      const governor = governors.find(g => g.name === agentName);
      if (!governor) return Promise.reject(new Error(`Unknown agent: ${agentName}`));

      return fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          city: governor.city,
          category: governor.category,
        }),
      });
    });

    try {
      await Promise.all(promises);
      console.log('✅ All selected agents launched in parallel!');
      setRunning(false);
      // Refresh jobs
      const response = await fetch('/api/agents/list');
      if (response.ok) {
        const data = await response.json();
        setJobs(new Map(data.map((j: Job) => [j.agent_name, j])));
      }
    } catch (err) {
      console.error('Failed to launch agents:', err);
      setRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500/20 border-blue-500/50';
      case 'completed': return 'bg-green-500/20 border-green-500/50';
      case 'failed': return 'bg-red-500/20 border-red-500/50';
      default: return 'bg-slate-500/20 border-slate-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const uniqueGovernоrates = Array.from(new Set(governors.map(g => g.governorate))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-5xl font-black text-white mb-2 flex items-center gap-3">
            <Zap className="text-yellow-400" size={40} />
            Governor Control Center
          </h1>
          <p className="text-slate-400 text-lg">Select and launch agents. Work continues even if browser closes.</p>
        </motion.div>

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <button onClick={selectAll} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all">
              Select All
            </button>
            <button onClick={deselectAll} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all">
              Deselect All
            </button>
            <div className="text-white text-sm ml-auto">
              <span className="font-black">{selectedAgents.size}</span> agents selected
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={launchSelected}
            disabled={selectedAgents.size === 0 || running}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-black text-lg rounded-xl shadow-lg shadow-green-500/50 flex items-center justify-center gap-3 transition-all"
          >
            <Play size={24} />
            {running ? 'Launching Agents...' : `Launch ${selectedAgents.size} Agent${selectedAgents.size !== 1 ? 's' : ''} in Parallel`}
          </motion.button>
        </motion.div>

        {/* Agent Grid by Governorate */}
        <div className="space-y-8">
          {uniqueGovernоrates.map((governorate) => (
            <motion.div
              key={governorate}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur"
            >
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                📍 {governorate}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {governors.filter(g => g.governorate === governorate).map(governor => {
                  const job = jobs.get(governor.name);
                  const isSelected = selectedAgents.has(governor.name);

                  return (
                    <motion.div
                      key={governor.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => toggleAgent(governor.name)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-yellow-500 bg-yellow-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-black text-white">{governor.name}</p>
                          <p className="text-sm text-slate-300 mt-1">{governor.category}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </div>

                      {/* Status Badge */}
                      {job && (
                        <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${getStatusColor(job.status)}`}>
                          {getStatusIcon(job.status)}
                          <span className="text-sm font-bold capitalize">{job.status}</span>
                        </div>
                      )}

                      {/* Progress */}
                      {job && job.status === 'running' && (
                        <div className="mb-3">
                          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: '50%' }}
                              className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                            />
                          </div>
                        </div>
                      )}

                      {/* Records Count */}
                      {job && (
                        <p className="text-sm font-bold text-white mb-3">
                          📊 {job.records_found} records
                        </p>
                      )}

                      {/* View Logs Button */}
                      {job && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobForLogs(job.id);
                          }}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <Eye size={14} />
                          View Checkpoints
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Checkpoint Logs Modal */}
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
