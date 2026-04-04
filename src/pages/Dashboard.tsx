/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Database, 
  Users, 
  Layers, 
  SendHorizontal, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { AgentJob } from '../types';
import { useDashboardStats, useActiveJobs } from '../hooks/useSupabase';

// Mock data for initial UI
const MOCK_STATS = {
  totalRecords: '142,892',
  activeAgents: 12,
  staged: '8,421',
  readyToPush: '3,105',
  failedJobs: 2
};

const MOCK_ACTIVE_AGENTS: AgentJob[] = [
  {
    id: '1',
    agentName: 'Agent-Alpha',
    governorate: 'Baghdad',
    city: 'Karkh',
    category: 'Restaurants',
    status: 'RUNNING',
    progress: 65,
    recordsFound: 420,
    lastUpdated: '2 mins ago',
    errorCount: 0
  },
  {
    id: '2',
    agentName: 'Agent-Beta',
    governorate: 'Erbil',
    city: 'Ankawa',
    category: 'Hotels',
    status: 'RUNNING',
    progress: 88,
    recordsFound: 156,
    lastUpdated: 'Just now',
    errorCount: 1
  },
  {
    id: '3',
    agentName: 'Agent-Gamma',
    governorate: 'Basra',
    city: 'Zubair',
    category: 'Pharmacies',
    status: 'WAITING',
    progress: 0,
    recordsFound: 0,
    lastUpdated: '15 mins ago',
    errorCount: 0
  }
];

export const Dashboard: React.FC = () => {
  const { stats, loading: statsLoading } = useDashboardStats();
  const { jobs, loading: jobsLoading } = useActiveJobs();

  const displayStats = stats || MOCK_STATS;
  const displayJobs = jobs.length > 0 ? jobs : MOCK_ACTIVE_AGENTS;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Command Center</h2>
        <p className="text-slate-500">Real-time operational overview of the data pipeline.</p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Records" value={displayStats.totalRecords.toLocaleString()} icon={Database} />
        <StatCard label="Active Agents" value={displayStats.activeAgents} icon={Users} />
        <StatCard label="Staged" value={displayStats.staged.toLocaleString()} icon={Layers} />
        <StatCard label="Ready to Push" value={displayStats.readyToPush.toLocaleString()} icon={SendHorizontal} color="text-emerald-500" />
        <StatCard label="Failed Jobs" value={displayStats.failedJobs} icon={AlertCircle} color="text-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Agents List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Active Agent Runs</h3>
            <button className="text-blue-600 text-xs font-bold hover:underline flex items-center">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Agent</th>
                  <th className="px-6 py-3">Region</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayJobs.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-slate-900">{agent.agentName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{agent.governorate}</div>
                      <div className="text-xs text-slate-500">{agent.city}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{agent.category}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${agent.progress}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">{agent.progress}% • {agent.recordsFound} recs</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline Health / Recent Jobs */}
        <div className="bg-white border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Recent Job Results</h3>
          </div>
          <div className="p-4 space-y-4">
            {[
              { id: 'j1', label: 'Baghdad/Retail', status: 'COMPLETED', time: '1h ago', count: 1240 },
              { id: 'j2', label: 'Basra/Industrial', status: 'FAILED', time: '3h ago', count: 0 },
              { id: 'j3', label: 'Dohuk/Tourism', status: 'COMPLETED', time: '5h ago', count: 450 },
              { id: 'j4', label: 'Najaf/Medical', status: 'COMPLETED', time: '8h ago', count: 890 },
            ].map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 border border-slate-100 rounded">
                <div>
                  <p className="text-sm font-bold text-slate-900">{job.label}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{job.time} • {job.count} records</p>
                </div>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200">
             <div className="flex justify-between items-center text-xs">
               <span className="text-slate-500">System Health</span>
               <span className="text-emerald-600 font-bold">98.2% Nominal</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
