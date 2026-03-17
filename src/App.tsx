import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Overview from "./pages/Overview";
import AgentRegistry from "./pages/AgentRegistry";
import AgentCommander from "./pages/AgentCommander";
import Pipelines from "./pages/Pipelines";
import TaskManager from "./pages/TaskManager";
import PilotRuns from "./pages/PilotRuns";
import QualityControl from "./pages/QualityControl";
import ApprovalHub from "./pages/ApprovalHub";
import DataCleaner from "./pages/DataCleaner";
import SystemLogs from "./pages/SystemLogs";
import ExportData from "./pages/ExportData";
import FinalReport from "./pages/FinalReport";
import {
  LayoutDashboard, Users, Terminal, GitBranch,
  ListTodo, ShieldCheck, CheckSquare, Sparkles,
  ScrollText, Upload, Cpu, Rocket, FileText,
} from "lucide-react";
import { usePipeline } from "./lib/usePipeline";

const NAV = [
  { to: "/",              label: "Overview",        ar: "عرض عام",          icon: LayoutDashboard },
  { to: "/agent-registry",label: "Agent Registry",  ar: "سجل الوكلاء",      icon: Users           },
  { to: "/agent-commander",label:"Agent Commander",  ar: "نظام الواكل",      icon: Terminal         },
  { to: "/pipelines",     label: "Pipelines",       ar: "مسارات البيانات",  icon: GitBranch        },
  { to: "/task-manager",  label: "Task Manager",    ar: "مدير المهام",      icon: ListTodo         },
  { to: "/pilot-runs",    label: "Pilot Runs",      ar: "التجارب التجريبية",icon: Rocket           },
  { to: "/quality-control",label:"Quality Control", ar: "مراقبة الجودة",    icon: ShieldCheck      },
  { to: "/approval-hub",  label: "Approval Hub",    ar: "مركز الموافقات",   icon: CheckSquare      },
  { to: "/data-cleaner",  label: "Data Cleaner",    ar: "منظف البيانات",    icon: Sparkles         },
  { to: "/system-logs",   label: "System Logs",     ar: "سجلات النظام",     icon: ScrollText       },
  { to: "/export-data",   label: "Export Data",     ar: "تصدير البيانات",   icon: Upload           },
  { to: "/final-report",  label: "Final Report",    ar: "التقرير النهائي",  icon: FileText         },
];

export default function App() {
  const { state } = usePipeline();
  const approvalCount = state?.records?.filter((r: any) => (r.confidence ?? 100) < 70 || r.needs_verification).length ?? 0;

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-100 text-gray-900">
        <aside className="w-64 flex-shrink-0 bg-[#0f172a] flex flex-col fixed h-full z-10">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#e6c97a] flex items-center justify-center shadow-lg">
                <Cpu size={18} className="text-[#0f172a]" />
              </div>
              <div>
                <div className="font-black text-white text-sm tracking-tight">IRAQ COMPASS</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">Internal Dashboard</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {NAV.map(({ to, label, ar, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group ${
                    isActive
                      ? "bg-[#C9A84C] text-[#0f172a] font-semibold"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon size={16} />
                      <span>{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {label === "Approval Hub" && approvalCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isActive ? "bg-[#0f172a]/20 text-[#0f172a]" : "bg-amber-500/20 text-amber-400"}`}>
                          {approvalCount}
                        </span>
                      )}
                      <span className={`text-[10px] font-arabic ${isActive ? "text-[#0f172a]/60" : "text-white/20"}`} dir="rtl">
                        {ar}
                      </span>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="text-[10px] text-white/20 text-center uppercase tracking-widest">
              {state?.records?.length?.toLocaleString() ?? 0} Records Loaded
            </div>
          </div>
        </aside>

        <main className="flex-1 ml-64 min-h-screen">
          <Routes>
            <Route path="/"               element={<Overview />}       />
            <Route path="/agent-registry" element={<AgentRegistry />}  />
            <Route path="/agent-commander"element={<AgentCommander />} />
            <Route path="/pipelines"      element={<Pipelines />}      />
            <Route path="/task-manager"   element={<TaskManager />}    />
            <Route path="/pilot-runs"     element={<PilotRuns />}      />
            <Route path="/quality-control"element={<QualityControl />} />
            <Route path="/approval-hub"   element={<ApprovalHub />}    />
            <Route path="/data-cleaner"   element={<DataCleaner />}    />
            <Route path="/system-logs"    element={<SystemLogs />}     />
            <Route path="/export-data"    element={<ExportData />}     />
            <Route path="/final-report"   element={<FinalReport />}    />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
