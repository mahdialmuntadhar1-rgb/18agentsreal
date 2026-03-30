import React, { useEffect, useState } from 'react';
import { 
  Database, 
  Wand2, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Activity,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { businessService } from '../services/dashboardService';
import { AgentTask } from '../types';

import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';

const Pipelines: React.FC = () => {
  const [stats, setStats] = useState({
    rawCount: 0,
    verifiedCount: 0,
    pendingCount: 0,
    taskCount: 0
  });
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsData, tasksData] = await Promise.all([
        businessService.getStats(),
        supabase.from('agent_tasks').select('*').eq('status', 'running').limit(5)
      ]);
      setStats(statsData);
      setActiveTasks(tasksData.data || []);
    } catch (err) {
      await handleSupabaseError(err, OperationType.GET, 'pipeline/data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('pipeline_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const STAGES = [
    { 
      id: 'raw', 
      name: 'Raw Ingestion', 
      icon: <Database size={24} />, 
      count: stats.rawCount, 
      status: 'Active', 
      color: 'blue',
      description: 'Incoming data from scrapers and JSON uploads'
    },
    { 
      id: 'verification', 
      name: 'Verification', 
      icon: <ShieldCheck size={24} />, 
      count: stats.pendingCount, 
      status: 'Processing', 
      color: 'amber',
      description: 'Cross-referencing names, phones, and locations'
    },
    { 
      id: 'approved', 
      name: 'Ready for Approval', 
      icon: <CheckCircle size={24} />, 
      count: stats.verifiedCount, 
      status: 'Ready', 
      color: 'emerald',
      description: 'Human-in-the-loop final review and publishing'
    }
  ];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">DATA PIPELINES</h2>
        <p className="text-gray-500 font-medium">Visualizing the flow of Iraqi business records</p>
      </header>

      {/* Visual Pipeline Flow */}
      <div className="bg-white p-12 rounded-[40px] shadow-sm border border-gray-200 overflow-x-auto">
        <div className="flex items-center justify-center min-w-[800px] relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
          
          {STAGES.map((stage, idx) => (
            <React.Fragment key={stage.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="relative z-10 flex flex-col items-center group px-10"
              >
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg mb-4 transition-all group-hover:scale-110 ${
                  stage.color === 'blue' ? 'bg-blue-500 text-white' :
                  stage.color === 'amber' ? 'bg-amber-500 text-white' :
                  'bg-emerald-500 text-white'
                }`}>
                  {stage.icon}
                </div>
                <div className="text-center">
                  <h4 className="text-xs font-black text-[#1B2B5E] uppercase tracking-widest mb-1">{stage.name}</h4>
                  <p className="text-2xl font-black text-[#1B2B5E]">{stage.count.toLocaleString()}</p>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    stage.status === 'Processing' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                    stage.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {stage.status}
                  </span>
                </div>

                {/* Tooltip-like Description */}
                <div className="absolute top-full mt-4 w-48 bg-[#1B2B5E] text-white p-3 rounded-xl text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                  {stage.description}
                </div>
              </motion.div>

              {idx < STAGES.length - 1 && (
                <div className="flex-1 flex justify-center z-10">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300">
                    <ArrowRight size={16} />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Pipeline Tasks */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-[#1B2B5E] mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
            <Activity size={16} className="text-[#C9A84C]" />
            Active Pipeline Tasks
          </h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400 text-xs uppercase tracking-widest">Loading active tasks...</div>
            ) : activeTasks.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs uppercase tracking-widest">No active tasks</div>
            ) : (
              activeTasks.map((task, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-black text-[#1B2B5E] uppercase tracking-widest">{task.type}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{task.instruction?.slice(0, 50)}...</p>
                    </div>
                    <span className="text-xs font-black text-[#C9A84C]">{task.status.toUpperCase()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      className="h-full bg-[#C9A84C]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline Health */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-[#1B2B5E] mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
            <Layers size={16} className="text-[#C9A84C]" />
            Pipeline Health
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Throughput</p>
              <p className="text-3xl font-black text-emerald-700">{(stats.taskCount / 24).toFixed(1)}</p>
              <p className="text-[9px] text-emerald-600 font-bold">Tasks / Hour (Avg)</p>
            </div>
            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 text-center">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Success Rate</p>
              <p className="text-3xl font-black text-rose-700">99.6%</p>
              <p className="text-[9px] text-rose-600 font-bold">Last 24 Hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pipelines;
