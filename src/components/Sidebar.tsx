import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wand2, 
  Bot, 
  Download, 
  LogOut,
  Compass,
  Terminal,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  Zap,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', icon: <Zap size={18} />, label: 'Command Center', labelAr: 'مركز القيادة' },
    { to: '/overview', icon: <LayoutDashboard size={18} />, label: 'Overview', labelAr: 'نظرة عامة' },
    { to: '/agents', icon: <Bot size={18} />, label: 'Agent Registry', labelAr: 'سجل الوكلاء' },
    { to: '/commander', icon: <Terminal size={18} />, label: 'Agent Commander', labelAr: 'قائد الوكلاء' },
    { to: '/pipelines', icon: <Activity size={18} />, label: 'Pipelines', labelAr: 'مسارات البيانات' },
    { to: '/tasks', icon: <CheckSquare size={18} />, label: 'Task Manager', labelAr: 'مدير المهام' },
    { to: '/pilot', icon: <Zap size={18} />, label: 'Pilot Runs', labelAr: 'تشغيل تجريبي' },
    { to: '/qc', icon: <AlertTriangle size={18} />, label: 'Quality Control', labelAr: 'مراقبة الجودة' },
    { to: '/approval', icon: <ShieldCheck size={18} />, label: 'Approval Hub', labelAr: 'مركز الموافقة' },
    { to: '/cleaner', icon: <Wand2 size={18} />, label: 'Data Cleaner', labelAr: 'منظف البيانات' },
    { to: '/logs', icon: <FileText size={18} />, label: 'System Logs', labelAr: 'سجلات النظام' },
    { to: '/export', icon: <Download size={18} />, label: 'Export Data', labelAr: 'تصدير البيانات' },
    { to: '/report', icon: <BarChart3 size={18} />, label: 'Final Report', labelAr: 'التقرير النهائي' },
  ];

  return (
    <aside className="w-64 bg-navy/95 text-[#e2d9c8] flex flex-col h-screen sticky top-0 border-r border-gold/20 font-mono">
      <div className="p-6 flex items-center gap-3 border-b border-gold/20">
        <Compass className="text-gold" size={32} />
        <div>
          <h1 className="font-bold text-sm tracking-[0.2em] text-gold uppercase">IRAQ COMPASS</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Internal Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center justify-between p-2.5 rounded-lg transition-all group
              ${isActive ? 'bg-gold/10 text-gold border-l-2 border-gold shadow-lg' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent'}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-600 group-hover:text-slate-400 group-[.active]:text-gold">
                {item.icon}
              </span>
              <span className="text-[11px] font-bold tracking-wide uppercase">{item.label}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gold/10 space-y-4">
        <div className="bg-gold/5 border border-gold/10 rounded-lg p-3">
          <div className="text-[18px] font-bold text-gold">74,049</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Records in Supabase</div>
        </div>
        <button className="flex items-center gap-3 w-full p-2.5 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
