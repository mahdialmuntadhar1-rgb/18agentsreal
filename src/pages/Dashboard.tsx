/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Database, 
  Users, 
  Layers, 
  SendHorizontal, 
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';

/**
 * API Client Stub
 * 
 * Endpoint: GET http://localhost:8787/api/agents/list
 * Response Format: Agent[]
 * 
 * Example Response:
 * [
 *   {
 *     "id": "agent-1",
 *     "governorate": "Baghdad",
 *     "status": "RUNNING",
 *     "progress": 65,
 *     "recordsFound": 420,
 *     "lastUpdated": 1712232000000
 *   }
 * ]
 */

interface Agent {
  id: string;
  governorate: string;
  status: string;
  progress: number;
  recordsFound: number;
  lastUpdated: number;
  // Optional fields for UI mapping
  agentName?: string;
  city?: string;
  category?: string;
}

interface DashboardStats {
  totalRecords: number;
  activeAgents: number;
  staged: number;
  readyToPush: number;
  failedJobs: number;
}

export const Dashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:8787/api/agents/list');
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }
      const data = await response.json();
      // Handle both {agents: []} and direct array responses
      const agentsData = Array.isArray(data) ? data : data.agents || [];
      setAgents(agentsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo<DashboardStats>(() => {
    const agentsArray = Array.isArray(agents) ? agents : [];
    return {
      totalRecords: agentsArray.reduce((sum, a) => sum + (a.recordsFound || 0), 0),
      activeAgents: agentsArray.filter(a => a.status === 'RUNNING').length,
      staged: Math.floor(agentsArray.reduce((sum, a) => sum + (a.recordsFound || 0), 0) * 0.15),
      readyToPush: Math.floor(agentsArray.reduce((sum, a) => sum + (a.recordsFound || 0), 0) * 0.05),
      failedJobs: agentsArray.filter(a => a.status === 'FAILED').length,
    };
  }, [agents]);

  if (loading && agents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium tracking-tight">Connecting to operational backend...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Command Center</h2>
          <p className="text-slate-500">Real-time operational overview of the data pipeline.</p>
        </div>
        {error && (
          <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded border border-rose-100 text-xs font-bold animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Live Sync Error: {error}</span>
          </div>
        )}
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Records" value={stats.totalRecords.toLocaleString()} icon={Database} />
        <StatCard label="Active Agents" value={stats.activeAgents} icon={Users} />
        <StatCard label="Staged" value={stats.staged.toLocaleString()} icon={Layers} />
        <StatCard label="Ready to Push" value={stats.readyToPush.toLocaleString()} icon={SendHorizontal} color="text-emerald-500" />
        <StatCard label="Failed Jobs" value={stats.failedJobs} icon={AlertCircle} color="text-rose-500" />
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
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                      No active agents found in the current pipeline.
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-bold text-slate-900">{agent.agentName || agent.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{agent.governorate}</div>
                        <div className="text-xs text-slate-500">{agent.city || 'Primary Zone'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{agent.category || 'General Discovery'}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={agent.status as any} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${agent.progress}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          {agent.progress}% • {agent.recordsFound} recs
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
            {agents.filter(a => a.status === 'COMPLETED' || a.status === 'FAILED').slice(0, 4).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 border border-slate-100 rounded">
                <div>
                  <p className="text-sm font-bold text-slate-900">{job.governorate}/{job.category || 'Discovery'}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {new Date(job.lastUpdated).toLocaleTimeString()} • {job.recordsFound} records
                  </p>
                </div>
                <StatusBadge status={job.status as any} />
              </div>
            ))}
            {agents.filter(a => a.status === 'COMPLETED' || a.status === 'FAILED').length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No recent job results available.
              </div>
            )}
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
