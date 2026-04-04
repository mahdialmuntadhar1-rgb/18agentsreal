import React from 'react';
import { StatCard } from '../components/StatCard';
import { Database, Layers, AlertCircle, GitMerge, ClipboardCheck } from 'lucide-react';
import { useDashboardStats } from '../hooks/useSupabase';

export const Dashboard: React.FC = () => {
  const { stats, loading } = useDashboardStats();

  if (loading || !stats) {
    return <div className="text-slate-500">Loading dashboard metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Command Center</h2>
        <p className="text-slate-500">Live operational counters from runtime tables.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Records" value={stats.totalRecords.toLocaleString()} icon={Database} />
        <StatCard label="Active Agents" value={stats.activeAgents.toLocaleString()} icon={Layers} />
        <StatCard label="Staged" value={stats.staged} icon={AlertCircle} color="text-amber-500" />
        <StatCard label="Ready To Push" value={stats.readyToPush} icon={GitMerge} color="text-blue-500" />
        <StatCard label="Failed Jobs" value={stats.failedJobs} icon={ClipboardCheck} color="text-rose-500" />
      </div>

      {stats.totalRecords === 0 && (
        <div className="bg-white border border-slate-200 p-4 text-sm text-slate-600">
          Supabase is configured but no runtime data exists yet. Enqueue jobs and run workers to populate this dashboard.
        </div>
      )}
    </div>
  );
};
