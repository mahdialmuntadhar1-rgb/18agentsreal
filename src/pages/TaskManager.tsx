import { usePipeline } from "../lib/usePipeline";
import { ListTodo, CheckCircle2, Loader2, Clock, AlertCircle } from "lucide-react";

export default function TaskManager() {
  const { state } = usePipeline();

  const stages = state ? [
    { id: "T-001", name: "Ingest from Supabase",   agent: "Ingest-01",   stage: state.stage1, priority: "high"   },
    { id: "T-002", name: "Arabic/Kurdish Text Repair", agent: "Cleaner-01", stage: state.stage2, priority: "high" },
    { id: "T-003", name: "Data Enrichment",         agent: "Enricher-01", stage: state.stage3, priority: "medium" },
    { id: "T-004", name: "Postcard Generation",     agent: "Postcard-01", stage: state.stage4, priority: "low"    },
  ] : [];

  const extraTasks = [
    { id: "T-005", name: "Human Review Queue",      agent: "Verifier-01", status: "pending",  priority: "medium", processed: 0, total: 0 },
    { id: "T-006", name: "Export to Supabase",      agent: "Export-01",   status: "pending",  priority: "low",    processed: 0, total: 0 },
    { id: "T-007", name: "Quality Score Audit",     agent: "Validator-01",status: "done",     priority: "medium", processed: 74049, total: 74049 },
  ];

  function StatusIcon({ status }: { status: string }) {
    if (status === "done")    return <CheckCircle2 size={14} className="text-green-500" />;
    if (status === "running") return <Loader2 size={14} className="text-amber-500 animate-spin" />;
    if (status === "error")   return <AlertCircle size={14} className="text-red-500" />;
    return <Clock size={14} className="text-gray-400" />;
  }

  function PriorityBadge({ priority }: { priority: string }) {
    const map: Record<string, string> = {
      high:   "bg-red-50 text-red-700 border-red-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      low:    "bg-gray-100 text-gray-500 border-gray-200",
    };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${map[priority] ?? map.low}`}>{priority}</span>;
  }

  const allTasks = [
    ...stages.map(s => ({ id: s.id, name: s.name, agent: s.agent, status: s.stage?.status ?? "idle", priority: s.priority, processed: s.stage?.processed ?? 0, total: s.stage?.total ?? 0 })),
    ...extraTasks,
  ];

  const done    = allTasks.filter(t => t.status === "done").length;
  const running = allTasks.filter(t => t.status === "running").length;
  const pending = allTasks.filter(t => t.status === "idle" || t.status === "pending").length;

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase flex items-center gap-2">
          <ListTodo size={20} className="text-blue-500" /> Task Manager
        </h1>
        <p className="text-gray-500 text-sm mt-1">Monitor all pipeline and agent tasks</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Completed",  value: done,    color: "text-green-600", bg: "bg-green-50" },
          { label: "Running",    value: running, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Pending",    value: pending, color: "text-gray-600",  bg: "bg-gray-100" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <span className="font-bold text-gray-900 text-sm">All Tasks</span>
        </div>
        <div className="divide-y divide-gray-50">
          {allTasks.map(task => (
            <div key={task.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <StatusIcon status={task.status} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">{task.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">Agent: {task.agent}</div>
              </div>
              {task.total > 0 && (
                <div className="text-xs text-gray-500 flex-shrink-0">
                  {task.processed.toLocaleString()} / {task.total.toLocaleString()}
                </div>
              )}
              <PriorityBadge priority={task.priority} />
              <span className={`text-xs font-semibold capitalize flex-shrink-0 ${
                task.status === "done"    ? "text-green-600" :
                task.status === "running" ? "text-amber-600" :
                task.status === "error"   ? "text-red-600"   : "text-gray-400"
              }`}>{task.status}</span>
              <span className="text-[10px] text-gray-300 font-mono flex-shrink-0">{task.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
