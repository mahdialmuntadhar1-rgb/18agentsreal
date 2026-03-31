import React, { useEffect, useState } from 'react';
import { Database, CheckCircle, AlertTriangle, Bot } from 'lucide-react';
import { businessService } from '../services/dashboardService';
import { supabase } from '../lib/supabase';

export default function Overview() {
  const [stats, setStats] = useState({
    rawCount: 0,
    verifiedCount: 0,
    pendingCount: 0,
    taskCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await businessService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats().catch(() => {});

    // Subscribe to changes in all relevant tables to update stats in real-time
    const rawChannel = supabase
      .channel('raw_businesses_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raw_businesses' }, () => fetchStats())
      .subscribe();

    const businessesChannel = supabase
      .channel('businesses_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => fetchStats())
      .subscribe();

    const tasksChannel = supabase
      .channel('tasks_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(rawChannel);
      supabase.removeChannel(businessesChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, []);

  const statCards = [
    { label: 'Total Records', value: stats.rawCount.toLocaleString(), icon: <Database className="text-blue-400" /> },
    { label: 'Verified', value: stats.verifiedCount.toLocaleString(), icon: <CheckCircle className="text-green-400" /> },
    { label: 'Pending QC', value: stats.pendingCount.toLocaleString(), icon: <AlertTriangle className="text-orange-400" /> },
    { label: 'Active Tasks', value: stats.taskCount.toLocaleString(), icon: <Bot className="text-purple-400" /> }
  ];

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gold uppercase tracking-widest">System Overview</h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Nationwide Directory Status</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white/5 border border-gold/10 rounded-xl p-6 animate-pulse">
              <div className="h-8 w-24 bg-white/10 rounded mb-4" />
              <div className="h-4 w-16 bg-white/10 rounded" />
            </div>
          ))
        ) : (
          statCards.map((stat, i) => (
            <div key={i} className="bg-white/5 border border-gold/10 rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                {stat.icon}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">{stat.label}</div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-gold/10 rounded-xl p-6 h-[400px] flex items-center justify-center text-slate-600 italic">
          [City Distribution Map Placeholder]
        </div>
        <div className="bg-white/5 border border-gold/10 rounded-xl p-6 h-[400px] flex items-center justify-center text-slate-600 italic">
          [Growth Trends Chart Placeholder]
        </div>
      </div>
    </div>
  );
}
