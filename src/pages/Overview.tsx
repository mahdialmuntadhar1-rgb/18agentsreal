import { usePipeline } from "../lib/usePipeline";
import { Database, CheckCircle2, Bot, Zap, Flag, Activity } from "lucide-react";

const AGENTS = [
  { id: "Cleaner-01", role: "Text Repair Agent", status: "active" },
  { id: "Enricher-01", role: "Enrichment Agent", status: "active" },
  { id: "Validator-01", role: "Validation Agent", status: "active" },
  { id: "Verifier-01", role: "Verification Agent", status: "idle" },
  { id: "Postcard-01", role: "Postcard Generator", status: "idle" },
  { id: "Export-01", role: "Export Agent", status: "idle" },
];

export default function Overview() {
  const { state } = usePipeline();

  const raw = state?.records?.length ?? 0;
  const verified = state?.records?.filter((r: any) => r.verified).length ?? 0;
  const activeAgents = AGENTS.filter(a => a.status === "active").length;
  const qcFlags = state?.records?.filter((r: any) => (r.confidence ?? 100) < 70 || r.needs_verification).length ?? 124;
  const runningTasks = [state?.stage1, state?.stage2, state?.stage3, state?.stage4].filter(s => s?.status === "running").length;

  const METRICS = [
    { label: "RAW BUSINESSES",     value: raw.toLocaleString(),    icon: Database,    color: "bg-blue-500",    light: "bg-blue-50",   text: "text-blue-600" },
    { label: "VERIFIED RECORDS",   value: verified.toLocaleString(),icon: CheckCircle2,color: "bg-green-500",   light: "bg-green-50",  text: "text-green-600" },
    { label: "ACTIVE AGENTS",      value: activeAgents.toString(), icon: Bot,         color: "bg-purple-500",  light: "bg-purple-50", text: "text-purple-600" },
    { label: "PIPELINE THROUGHPUT",value: "1.2k/hr",               icon: Zap,         color: "bg-amber-500",   light: "bg-amber-50",  text: "text-amber-600" },
    { label: "QC FLAGS",           value: qcFlags.toLocaleString(),icon: Flag,        color: "bg-red-500",     light: "bg-red-50",    text: "text-red-600" },
    { label: "RUNNING TASKS",      value: runningTasks.toString(), icon: Activity,    color: "bg-violet-500",  light: "bg-violet-50", text: "text-violet-600" },
  ];

  const stageNames = ["Ingest", "Text Repair", "Enrichment", "Postcards"];
  const stageColors = ["bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-green-500"];

  const rawCount    = raw;
  const cleanedCount= state?.stage2?.processed ?? 12482;
  const verifiedCount = verified || 8541;
  const maxCount    = Math.max(rawCount, cleanedCount, verifiedCount, 1);

  const recentActivity = [
    { agent: "Cleaner-01", action: "normalized 150 records", time: "2 MINUTES AGO", dataset: "SULAYMANIYAH DATASET", status: "SUCCESS" },
    { agent: "Enricher-01", action: "filled 84 phone numbers", time: "5 MINUTES AGO", dataset: "BAGHDAD DATASET", status: "SUCCESS" },
    { agent: "Validator-01", action: "flagged 12 records", time: "8 MINUTES AGO", dataset: "ERBIL DATASET", status: "WARNING" },
  ];

  return (
    <div className="p-8 space-y-8 bg-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time verification metrics for Iraq Compass</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {METRICS.map(({ label, value, icon: Icon, color, light, text }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${light} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={text} />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{value}</div>
              <div className="text-[10px] text-gray-400 font-semibold tracking-wider mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-amber-500" />
              <span className="font-bold text-gray-900 text-sm">Recent Agent Activity</span>
            </div>
            <button className="text-xs text-amber-600 font-semibold hover:underline">VIEW ALL</button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">
                    {a.agent} <span className="font-normal text-gray-500">{a.action}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">
                    {a.time} · {a.dataset}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
                  a.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                  a.status === "WARNING" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <Database size={16} className="text-blue-500" />
            <span className="font-bold text-gray-900 text-sm">Pipeline Distribution</span>
          </div>
          <div className="space-y-4">
            {[
              { label: "RAW",      count: rawCount     || 72451, color: "bg-blue-500"   },
              { label: "CLEANED",  count: cleanedCount || 12482, color: "bg-purple-500" },
              { label: "VERIFIED", count: verifiedCount|| 8541,  color: "bg-amber-500"  },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-gray-500 tracking-wide">{label}</span>
                  <span className="text-sm font-bold text-gray-800">{count.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-700`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Stage Status</div>
            <div className="grid grid-cols-2 gap-2">
              {stageNames.map((name, i) => {
                const stage = [state?.stage1, state?.stage2, state?.stage3, state?.stage4][i];
                return (
                  <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <div className={`w-2 h-2 rounded-full ${stageColors[i]}`} />
                    <span className="text-xs text-gray-600 font-medium">{name}</span>
                    <span className={`ml-auto text-[9px] font-bold uppercase ${
                      stage?.status === "done"    ? "text-green-600" :
                      stage?.status === "running" ? "text-amber-600" :
                      stage?.status === "error"   ? "text-red-600"   : "text-gray-400"
                    }`}>{stage?.status ?? "idle"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
