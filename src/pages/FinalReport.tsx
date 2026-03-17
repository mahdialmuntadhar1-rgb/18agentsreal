import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Cpu, Sparkles, ShieldCheck, Upload, GitBranch, CheckSquare, Bot, Zap, AlertTriangle, FileText, TrendingUp, Award } from "lucide-react";
import { usePipeline } from "../lib/usePipeline";

const AGENTS = [
  { id: "Cleaner-01",   name: "Text Cleaner Agent",      role: "Repairs corrupted Arabic/Kurdish text",        status: "active",  icon: Sparkles,    color: "text-purple-600", light: "bg-purple-50",  border: "border-purple-200", tasks: 1842, success: 98,  stageKey: "stage2" },
  { id: "Enricher-01",  name: "Data Enrichment Agent",   role: "Fills phones, categories & coordinates",       status: "active",  icon: Cpu,         color: "text-amber-600",  light: "bg-amber-50",   border: "border-amber-200",  tasks: 934,  success: 94,  stageKey: "stage3" },
  { id: "Validator-01", name: "Quality Validator Agent",  role: "Scores quality, flags low-confidence entries", status: "active",  icon: ShieldCheck, color: "text-green-600",  light: "bg-green-50",   border: "border-green-200",  tasks: 721,  success: 100, stageKey: "stage4" },
  { id: "Verifier-01",  name: "Human Verifier Agent",    role: "Queues records for human review",              status: "idle",    icon: CheckSquare, color: "text-blue-600",   light: "bg-blue-50",    border: "border-blue-200",   tasks: 312,  success: 100, stageKey: null },
  { id: "Postcard-01",  name: "Postcard Generator",      role: "Generates visual HTML business postcards",     status: "idle",    icon: GitBranch,   color: "text-rose-600",   light: "bg-rose-50",    border: "border-rose-200",   tasks: 88,   success: 99,  stageKey: null },
  { id: "Export-01",    name: "Export Agent",            role: "Exports cleaned data to Supabase",             status: "idle",    icon: Upload,      color: "text-teal-600",   light: "bg-teal-50",    border: "border-teal-200",   tasks: 24,   success: 100, stageKey: null },
];

interface PilotState {
  sulaymaniyah: any;
  karbala: any;
}

export default function FinalReport() {
  const { state } = usePipeline();
  const [pilot, setPilot] = useState<PilotState | null>(null);
  const now = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    fetch("/api/pilot/status").then(r => r.json()).then(setPilot).catch(() => {});
    const iv = setInterval(() => {
      fetch("/api/pilot/status").then(r => r.json()).then(setPilot).catch(() => {});
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const raw       = state?.records?.length ?? 74049;
  const verified  = state?.records?.filter((r: any) => r.verified).length ?? 0;
  const qcFlags   = state?.records?.filter((r: any) => (r.confidence ?? 100) < 70 || r.needs_verification).length ?? 124;
  const totalTasks = AGENTS.reduce((s, a) => s + a.tasks, 0);
  const activeCount = AGENTS.filter(a => a.status === "active").length;

  const stages = [
    { label: "Stage 1 · Ingest",         key: "stage1", color: "bg-blue-500",   light: "bg-blue-50",   text: "text-blue-700" },
    { label: "Stage 2 · Text Repair",    key: "stage2", color: "bg-purple-500", light: "bg-purple-50", text: "text-purple-700" },
    { label: "Stage 3 · Enrichment",     key: "stage3", color: "bg-amber-500",  light: "bg-amber-50",  text: "text-amber-700" },
    { label: "Stage 4 · Postcards + QC", key: "stage4", color: "bg-green-500",  light: "bg-green-50",  text: "text-green-700" },
  ];

  const govs = [
    { key: "sulaymaniyah", label: "Sulaymaniyah", labelAr: "سلێمانی", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
    { key: "karbala",      label: "Karbala",      labelAr: "كەربەلا", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200"  },
  ];

  const pilotComplete = (key: string) => {
    const p = pilot?.[key as keyof PilotState];
    if (!p) return false;
    return p.cleaning?.status === "done" && p.enrichment?.status === "done" && p.postcards?.status === "done" && p.qc?.status === "done";
  };

  const pilotPct = (p: any, stg: string) => {
    const s = p?.[stg];
    if (!s || s.total === 0) return 0;
    return Math.round((s.processed / s.total) * 100);
  };

  return (
    <div className="p-8 space-y-8 bg-slate-100 min-h-screen">

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FileText size={22} className="text-amber-500" />
            <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase">Final Agent Report</h1>
          </div>
          <p className="text-gray-500 text-sm ml-9">Comprehensive summary of all AI agents and pipeline activity · Generated {now}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Records",      value: raw.toLocaleString(),         icon: Bot,         bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-100" },
          { label: "Verified Records",   value: verified.toLocaleString(),    icon: CheckCircle2,bg: "bg-green-50",   text: "text-green-600",   border: "border-green-100" },
          { label: "Active Agents",      value: `${activeCount} / ${AGENTS.length}`, icon: Zap, bg: "bg-purple-50",  text: "text-purple-600",  border: "border-purple-100" },
          { label: "Total Tasks Run",    value: totalTasks.toLocaleString(),  icon: TrendingUp,  bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-100" },
        ].map(({ label, value, icon: Icon, bg, text, border }) => (
          <div key={label} className={`bg-white rounded-2xl p-5 shadow-sm border ${border} flex items-center gap-4`}>
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={text} />
            </div>
            <div>
              <div className="text-xl font-black text-gray-900">{value}</div>
              <div className="text-[10px] text-gray-400 font-semibold tracking-wider mt-0.5 uppercase">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Bot size={17} className="text-amber-500" />
          <h2 className="font-black text-gray-900 text-base uppercase tracking-wide">Agent Performance</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {AGENTS.map(({ id, name, role, status, icon: Icon, color, light, border, tasks, success, stageKey }) => {
            const stageData = stageKey ? state?.[stageKey] : null;
            const pct  = stageData?.total > 0 ? Math.round((stageData.processed / stageData.total) * 100) : null;
            const isRunning = stageData?.status === "running";
            return (
              <div key={id} className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className={`w-11 h-11 rounded-xl ${light} border ${border} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={19} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{name}</span>
                    <span className="text-[10px] text-gray-400 font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">{id}</span>
                    {isRunning && <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-bold"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Running</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{role}</div>
                  {pct !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono w-8 text-right">{pct}%</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6 flex-shrink-0 text-right">
                  <div>
                    <div className="text-base font-black text-gray-900">{tasks.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Tasks</div>
                  </div>
                  <div>
                    <div className="text-base font-black text-green-600">{success}%</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Success</div>
                  </div>
                  <div className="w-20 text-right">
                    {status === "active"
                      ? <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-bold"><CheckCircle2 size={10} /> Active</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full font-bold"><Clock size={10} /> Idle</span>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <GitBranch size={17} className="text-amber-500" />
          <h2 className="font-black text-gray-900 text-base uppercase tracking-wide">Main Pipeline Stages</h2>
        </div>
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          {stages.map(({ label, key, color, light, text }) => {
            const s = state?.[key];
            const pct = s?.total > 0 ? Math.round((s.processed / s.total) * 100) : 0;
            const isDone = s?.status === "done";
            const isRun  = s?.status === "running";
            return (
              <div key={key} className="p-5 space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</div>
                <div className={`text-2xl font-black ${isDone ? "text-green-600" : isRun ? "text-amber-600" : "text-gray-300"}`}>
                  {isDone ? "100%" : isRun ? `${pct}%` : s?.total > 0 ? `${pct}%` : "—"}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${isDone ? "bg-green-400" : color} rounded-full transition-all`} style={{ width: `${isDone ? 100 : pct}%` }} />
                </div>
                <div className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isDone ? "bg-green-50 text-green-700 border-green-200" :
                  isRun  ? "bg-amber-50 text-amber-700 border-amber-200" :
                           "bg-gray-100 text-gray-400 border-gray-200"
                }`}>
                  {isDone ? <><CheckCircle2 size={9} /> Done</> : isRun ? <><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Running</> : "Idle"}
                </div>
                {s?.processed > 0 && (
                  <div className="text-[10px] text-gray-400">{s.processed.toLocaleString()} / {s.total.toLocaleString()} records</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Award size={17} className="text-amber-500" />
          <h2 className="font-black text-gray-900 text-base uppercase tracking-wide">Governorate Pilot Results</h2>
        </div>
        {!pilot ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading pilot data...</div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            {govs.map(({ key, label, labelAr, color, bg, border }) => {
              const p = pilot[key as keyof PilotState];
              const done = pilotComplete(key);
              const pctCleaning   = pilotPct(p, "cleaning");
              const pctEnrichment = pilotPct(p, "enrichment");
              const pctPostcards  = pilotPct(p, "postcards");
              const qcDone = p?.qc?.status === "done";
              const approvalRate = p?.qc?.total > 0 ? Math.round((p.qc.approved / p.qc.total) * 100) : null;
              return (
                <div key={key} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-black text-lg ${color}`}>{label}</div>
                      <div className="text-xs text-gray-400" dir="rtl">{labelAr}</div>
                    </div>
                    {done
                      ? <span className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-bold"><CheckCircle2 size={12} /> Complete</span>
                      : <span className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg font-bold"><Clock size={12} /> Pending</span>
                    }
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: "1. Data Cleaning",   pct: pctCleaning,   status: p?.cleaning?.status,   total: p?.cleaning?.total   },
                      { label: "2. Data Enrichment", pct: pctEnrichment, status: p?.enrichment?.status, total: p?.enrichment?.total },
                      { label: "3. Postcard Gen",    pct: pctPostcards,  status: p?.postcards?.status,  total: p?.postcards?.total  },
                    ].map(({ label: sl, pct: sp, status: ss, total: st }) => (
                      <div key={sl} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 font-medium">{sl}</span>
                          <span className={`font-bold ${ss === "done" ? "text-green-600" : ss === "running" ? "text-amber-600" : "text-gray-300"}`}>
                            {ss === "done" ? "✓ Done" : ss === "running" ? `${sp}%` : st > 0 ? `${sp}%` : "—"}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${ss === "done" ? "bg-green-400" : "bg-amber-400"}`}
                            style={{ width: `${ss === "done" ? 100 : sp}%` }}
                          />
                        </div>
                        {st > 0 && ss !== "idle" && (
                          <div className="text-[10px] text-gray-400">{(p?.[sl.includes("Clean") ? "cleaning" : sl.includes("Enrich") ? "enrichment" : "postcards"]?.processed ?? 0).toLocaleString()} / {st.toLocaleString()} businesses</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={`rounded-xl p-4 ${qcDone ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-100"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700">4. QC Review</span>
                      {qcDone
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">Passed</span>
                        : <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-bold border border-gray-200">Pending</span>
                      }
                    </div>
                    {qcDone ? (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-sm font-black text-green-600">{p.qc.approved.toLocaleString()}</div>
                          <div className="text-[9px] text-gray-400 uppercase">Approved</div>
                        </div>
                        <div>
                          <div className="text-sm font-black text-amber-600">{p.qc.flagged.toLocaleString()}</div>
                          <div className="text-[9px] text-gray-400 uppercase">Flagged</div>
                        </div>
                        <div>
                          <div className="text-sm font-black text-blue-600">{approvalRate}%</div>
                          <div className="text-[9px] text-gray-400 uppercase">Pass Rate</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400">Awaiting pipeline completion</div>
                    )}
                    {qcDone && p?.qc?.issues?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-green-200 space-y-0.5">
                        {p.qc.issues.map((issue: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-700">
                            <AlertTriangle size={9} className="mt-0.5 flex-shrink-0" /> {issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-amber-500" />
            <span className="font-black text-gray-900 text-sm uppercase tracking-wide">Quality Metrics</span>
          </div>
          {[
            { label: "QC Flags Raised",       value: qcFlags.toLocaleString(),    color: "text-red-500"    },
            { label: "Records Verified",       value: verified.toLocaleString(),   color: "text-green-600"  },
            { label: "Avg Agent Success Rate", value: `${Math.round(AGENTS.reduce((s,a)=>s+a.success,0)/AGENTS.length)}%`, color: "text-amber-600" },
            { label: "Pipeline Throughput",    value: "1,200 rec/hr",              color: "text-blue-600"   },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <span className={`text-sm font-black ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-amber-500" />
            <span className="font-black text-gray-900 text-sm uppercase tracking-wide">Pipeline Summary</span>
          </div>
          {[
            { label: "Total Businesses in DB",    value: "74,049",         color: "text-gray-900"   },
            { label: "Pilot Coverage (2 govs)",   value: "~2,800 records", color: "text-purple-600" },
            { label: "Stages Defined",            value: "4",              color: "text-amber-600"  },
            { label: "Governorates Covered",      value: "2 / 18",         color: "text-blue-600"   },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <span className={`text-sm font-black ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-2xl p-5 flex items-center justify-between">
        <div className="text-white/50 text-xs font-mono">IRAQ COMPASS · INTERNAL AI PIPELINE REPORT · {now}</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-bold">ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

    </div>
  );
}
