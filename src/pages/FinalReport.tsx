import React from 'react';
import { BarChart3, Database, FileCheck, FileJson, FileText, CheckCircle2, Bot, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export default function FinalReport() {
  const metrics = [
    { label: 'Total Records Loaded', value: '28,430', icon: <Database size={24} className="text-blue-400" /> },
    { label: 'Duplicates Removed', value: '3,100', icon: <FileText size={24} className="text-rose-400" /> },
    { label: 'Businesses Enriched', value: '25,200', icon: <FileJson size={24} className="text-purple-400" /> },
    { label: 'Postcards Generated', value: '24,900', icon: <FileCheck size={24} className="text-pink-400" /> },
    { label: 'Approved by QC', value: '23,870', icon: <CheckCircle2 size={24} className="text-emerald-400" /> },
  ];

  const systemStats = [
    { label: 'Active Agents', value: '12', icon: <Bot size={20} className="text-cyan-400" /> },
    { label: 'Tasks Completed', value: '4,220', icon: <Activity size={20} className="text-amber-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#111827] p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="text-purple-400" size={32} />
              FINAL REPORT DASHBOARD
            </h1>
            <p className="text-slate-400 mt-1 text-sm">System metrics and pipeline performance summary</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm uppercase tracking-widest rounded-lg transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]">
              Export Report
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, i) => (
            <motion.div 
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111827] p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-6 hover:border-slate-600 transition-colors"
            >
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-inner">
                {metric.icon}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{metric.label}</p>
                <h3 className="text-3xl font-black text-white">{metric.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl p-8">
          <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">System Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {systemStats.map((stat, i) => (
              <div key={stat.label} className="flex items-center justify-between p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    {stat.icon}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-300">{stat.label}</span>
                </div>
                <span className="text-4xl font-black text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
