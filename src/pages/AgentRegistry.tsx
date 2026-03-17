import { Bot, CheckCircle2, Clock, AlertCircle, Cpu, Sparkles, ShieldCheck, Upload, GitBranch, CheckSquare } from "lucide-react";

const AGENTS = [
  { id: "Cleaner-01",   name: "Text Cleaner Agent",     role: "Repairs corrupted Arabic/Kurdish text using Gemini AI",  status: "active",  icon: Sparkles,    color: "text-purple-600", light: "bg-purple-50",  tasks: 1842, success: 98 },
  { id: "Enricher-01",  name: "Data Enrichment Agent",  role: "Fills missing categories, cities, and phone numbers",    status: "active",  icon: Cpu,         color: "text-amber-600",  light: "bg-amber-50",   tasks: 934,  success: 94 },
  { id: "Validator-01", name: "Quality Validator Agent", role: "Scores record quality and flags low-confidence entries", status: "active",  icon: ShieldCheck, color: "text-green-600",  light: "bg-green-50",   tasks: 721,  success: 100 },
  { id: "Verifier-01",  name: "Human Verifier Agent",   role: "Queues records needing human review and approval",       status: "idle",    icon: CheckSquare, color: "text-blue-600",   light: "bg-blue-50",    tasks: 312,  success: 100 },
  { id: "Postcard-01",  name: "Postcard Generator",     role: "Generates visual HTML business postcards",              status: "idle",    icon: GitBranch,   color: "text-rose-600",   light: "bg-rose-50",    tasks: 88,   success: 99 },
  { id: "Export-01",    name: "Export Agent",           role: "Exports cleaned data and pushes to Supabase",           status: "idle",    icon: Upload,      color: "text-teal-600",   light: "bg-teal-50",    tasks: 24,   success: 100 },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "active")  return <span className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-semibold"><CheckCircle2 size={11} /> Active</span>;
  if (status === "running") return <span className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold"><Clock size={11} /> Running</span>;
  return <span className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full font-semibold"><Clock size={11} /> Idle</span>;
}

export default function AgentRegistry() {
  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase">Agent Registry</h1>
        <p className="text-gray-500 text-sm mt-1">All registered AI agents and their operational status</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {AGENTS.map(({ id, name, role, status, icon: Icon, color, light, tasks, success }) => (
          <div key={id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-5">
            <div className={`w-12 h-12 rounded-xl ${light} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-gray-900">{name}</span>
                <span className="text-xs text-gray-400 font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">{id}</span>
              </div>
              <div className="text-sm text-gray-500 mt-0.5">{role}</div>
            </div>
            <div className="flex items-center gap-6 flex-shrink-0">
              <div className="text-right">
                <div className="text-lg font-black text-gray-900">{tasks.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Tasks Done</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-green-600">{success}%</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Success Rate</div>
              </div>
              <StatusBadge status={status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
