import React, { useEffect, useState } from 'react';
import { 
  Zap, Clock, History, Search, Filter,
  MoreVertical, ChevronLeft, ChevronRight,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';
import { AgentTask } from '../types';

export default function PilotRuns() {
  const [runs, setRuns] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRuns = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRuns(data || []);
    } catch (err) {
      await handleSupabaseError(err, OperationType.GET, 'agent_tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();

    const channel = supabase
      .channel('tasks_history_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks' }, () => {
        fetchRuns();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = runs.filter(run => 
    (run.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (run.instruction || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedRuns = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-emerald-500/10">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <History className="text-emerald-400" size={28} />
            Pilot Run History
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Historical Execution Log & Performance Audit</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search runs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <button disabled title="Advanced filters are not implemented yet" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 opacity-60 cursor-not-allowed">
            <Filter size={20} />
          </button>
        </div>
      </header>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Execution Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Summary</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading history...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <History size={48} className="text-slate-700 mb-2" />
                      <p className="font-bold text-white">No history found</p>
                      <p className="text-sm">Run tasks to see them here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRuns.map((run, i) => (
                  <motion.tr 
                    key={run.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-emerald-500/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : run.status === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          <Zap size={14} />
                        </div>
                        <span className="text-xs font-black text-slate-100 uppercase tracking-wide">{run.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest uppercase truncate max-w-[150px] block">{run.instruction}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {new Date(run.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        run.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Database size={12} />
                        <span className="text-xs font-bold truncate max-w-[200px]">{run.result_summary || 'No summary'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-600 hover:text-emerald-400 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} historical runs
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-slate-800 rounded-lg text-slate-400 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-slate-800 rounded-lg text-slate-400 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
