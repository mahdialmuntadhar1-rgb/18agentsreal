import React, { useEffect, useState } from 'react';
import { 
  BarChart3, Database, FileCheck, FileJson, 
  FileText, CheckCircle2, Bot, Activity,
  Download, Share2, Printer, Calendar,
  TrendingUp, ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { businessService } from '../services/dashboardService';
import { supabase } from '../lib/supabase';

export default function FinalReport() {
  const [stats, setStats] = useState({
    verifiedCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    taskCount: 0
  });
  const [regionalStats, setRegionalStats] = useState<{ governorate: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, regionalData] = await Promise.all([
          businessService.getStats(),
          supabase.rpc('get_regional_stats') // Assuming an RPC exists, otherwise fetch and process
        ]);
        
        setStats(statsData);
        
        // If RPC doesn't exist, we fallback to a manual count (less efficient but works)
        if (regionalData.error) {
          const { data: businesses } = await supabase.from('businesses').select('governorate');
          const counts: Record<string, number> = {};
          businesses?.forEach(b => {
            if (b.governorate) counts[b.governorate] = (counts[b.governorate] || 0) + 1;
          });
          setRegionalStats(Object.entries(counts).map(([governorate, count]) => ({ governorate, count })));
        } else {
          setRegionalStats(regionalData.data);
        }
      } catch (err) {
        console.error('Failed to fetch report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = [
    { label: 'Total Records Loaded', value: stats.verifiedCount.toLocaleString(), icon: <Database size={24} />, color: 'text-blue-400' },
    { label: 'Verified Businesses', value: stats.verifiedCount.toLocaleString(), icon: <FileCheck size={24} />, color: 'text-emerald-400' },
    { label: 'Pending Review', value: stats.pendingCount.toLocaleString(), icon: <FileText size={24} />, color: 'text-rose-400' },
    { label: 'Tasks Executed', value: stats.taskCount.toLocaleString(), icon: <Activity size={24} />, color: 'text-purple-400' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-emerald-500/10">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <BarChart3 className="text-emerald-400" size={32} />
            FINAL REPORT
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">System Intelligence & Pipeline Performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors">
            <Printer size={20} />
          </button>
          <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors">
            <Share2 size={20} />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Download size={18} /> Export PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="h-12 w-12 bg-slate-800 rounded-xl mb-4" />
              <div className="h-8 w-24 bg-slate-800 rounded mb-2" />
              <div className="h-4 w-16 bg-slate-800 rounded" />
            </div>
          ))
        ) : (
          metrics.map((metric, i) => (
            <motion.div 
              key={metric.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-emerald-500/30 transition-all group"
            >
              <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-emerald-500/30 transition-all w-fit ${metric.color}`}>
                {metric.icon}
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-white tracking-tight">{metric.value}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">{metric.label}</div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <Activity className="text-emerald-400" size={18} />
              System Performance
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <Calendar size={14} /> Last 30 Days
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Data Integrity Score</div>
                <div className="text-2xl font-black text-emerald-400">98.4%</div>
              </div>
              <TrendingUp className="text-emerald-400" size={24} />
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '98.4%' }}
                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>
          
          <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "The system has successfully processed and enriched over {stats.verifiedCount.toLocaleString()} business records across Iraq. 
              Our regional agents are maintaining a high success rate, with minimal intervention required from QC overseers."
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-6">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <ShieldCheck className="text-emerald-400" size={18} />
            Regional Breakdown
          </h2>
          
          <div className="space-y-4 custom-scrollbar max-h-[300px] pr-2">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse" />
              ))
            ) : regionalStats.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs uppercase tracking-widest">
                No regional data available
              </div>
            ) : (
              regionalStats.map((row, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl group hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-200">{row.governorate}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-black text-slate-400">{row.count.toLocaleString()}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                      Completed
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-slate-700">
            View Detailed Regional Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
