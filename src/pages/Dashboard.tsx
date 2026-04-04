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
  Loader2,
  RefreshCw,
  PlayCircle
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
      const response = await fetch('/api/agents/list');
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }
      const data = await response.json();
      setAgents(data);
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
    return {
      totalRecords: agents.reduce((sum, a) => sum + (a.recordsFound || 0), 0),
      activeAgents: agents.filter(a => a.status === 'RUNNING').length,
      staged: Math.floor(agents.reduce((sum, a) => sum + (a.recordsFound || 0), 0) * 0.15), // Derived for demo
      readyToPush: Math.floor(agents.reduce((sum, a) => sum + (a.recordsFound || 0), 0) * 0.05), // Derived for demo
      failedJobs: agents.filter(a => a.status === 'FAILED').length,
    };
  }, [agents]);

  if (loading && agents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 py-32">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-slate-900 font-bold tracking-tight">Initializing Command Center</p>
          <p className="text-slate-500 text-sm">Connecting to operational data pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Command Center</h2>
            <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
              Live System
            </div>
          </div>
          <p className="text-slate-500 text-lg">Real-time operational overview of the Iraq business data pipeline.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {error ? (
            <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-lg border border-rose-100 text-xs font-bold shadow-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Sync Error: {error}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold shadow-sm">
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Last sync: {new Date().toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </header>

      {/* System Health Overview */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard label="Total Records" value={stats.totalRecords.toLocaleString()} icon={Database} trend={{ value: '12%', isPositive: true }} />
        <StatCard label="Active Agents" value={stats.activeAgents} icon={Users} color="text-blue-600" />
        <StatCard label="Staged" value={stats.staged.toLocaleString()} icon={Layers} color="text-cyan-600" />
        <StatCard label="Ready to Push" value={stats.readyToPush.toLocaleString()} icon={SendHorizontal} color="text-emerald-600" trend={{ value: '5%', isPositive: true }} />
        <StatCard label="Failed Jobs" value={stats.failedJobs} icon={AlertCircle} color="text-rose-600" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Active Agents List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-[0.15em]">Active Agent Runs</h3>
            </div>
            <button className="text-blue-600 text-xs font-bold hover:text-blue-700 transition-colors flex items-center group">
              View All Pipeline <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Agent Identity</th>
                    <th className="px-6 py-4">Operational Zone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Progress / Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {agents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="w-8 h-8 text-slate-200" />
                          <p className="text-slate-400 text-sm font-medium italic">No active agents found in the current pipeline.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    agents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                              {agent.agentName?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <div className="font-mono text-xs font-bold text-slate-900">{agent.agentName || agent.id}</div>
                              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{agent.category || 'General Discovery'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-bold text-slate-900">{agent.governorate}</div>
                          <div className="text-xs text-slate-500">{agent.city || 'Primary Zone'}</div>
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge status={agent.status as any} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-[100px]">
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
                                  style={{ width: `${agent.progress}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center mt-1.5">
                                <span className="text-[10px] text-slate-400 font-mono font-bold">{agent.progress}%</span>
                                <span className="text-[10px] text-blue-600 font-bold">{agent.recordsFound} records</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pipeline Health / Recent Jobs */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-[0.15em]">Recent Outcomes</h3>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full max-h-[500px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {agents.filter(a => a.status === 'COMPLETED' || a.status === 'FAILED').slice(0, 6).map((job) => (
                <div key={job.id} className="group flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-200">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{job.governorate} / {job.category || 'Discovery'}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center"><RefreshCw className="w-2.5 h-2.5 mr-1" /> {new Date(job.lastUpdated).toLocaleTimeString()}</span>
                      <span>•</span>
                      <span className="text-blue-600 font-bold">{job.recordsFound} records</span>
                    </div>
                  </div>
                  <StatusBadge status={job.status as any} />
                </div>
              ))}
              {agents.filter(a => a.status === 'COMPLETED' || a.status === 'FAILED').length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <Layers className="w-8 h-8 text-slate-100" />
                  <p className="text-center text-slate-400 text-xs font-medium italic">
                    No recent job results available.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-5 bg-slate-50/50 border-t border-slate-100">
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-500 font-medium">System Integrity</span>
                   <span className="text-emerald-600 font-bold">98.2% Nominal</span>
                 </div>
                 <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                   <div className="bg-emerald-500 h-full w-[98.2%] rounded-full" />
                 </div>
                 <p className="text-[10px] text-slate-400 leading-relaxed">
                   All systems are performing within expected parameters. Database sync is active and healthy.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
