import { usePipeline } from "../lib/usePipeline";
import { CheckCircle2, Clock, Loader2, AlertCircle, GitBranch } from "lucide-react";

const STAGES = [
  { key: "stage1", num: 1, label: "Ingest",      desc: "Pull records from Supabase",              color: "blue"   },
  { key: "stage2", num: 2, label: "Text Repair",  desc: "AI text cleaning (Arabic/Kurdish)",       color: "purple" },
  { key: "stage3", num: 3, label: "Enrichment",   desc: "Fill missing data fields",               color: "amber"  },
  { key: "stage4", num: 4, label: "Postcards",    desc: "Generate HTML business postcards",        color: "green"  },
];

const COLORS: Record<string, { bg: string; text: string; bar: string; border: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   bar: "bg-blue-500",   border: "border-blue-200"   },
  purple: { bg: "bg-purple-50", text: "text-purple-600", bar: "bg-purple-500", border: "border-purple-200" },
  amber:  { bg: "bg-amber-50",  text: "text-amber-600",  bar: "bg-amber-500",  border: "border-amber-200"  },
  green:  { bg: "bg-green-50",  text: "text-green-600",  bar: "bg-green-500",  border: "border-green-200"  },
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    done:    "bg-green-50 text-green-700 border-green-200",
    running: "bg-amber-50 text-amber-700 border-amber-200",
    error:   "bg-red-50 text-red-700 border-red-200",
    idle:    "bg-gray-100 text-gray-400 border-gray-200",
  };
  const icon: Record<string, JSX.Element> = {
    done:    <CheckCircle2 size={11} />,
    running: <Loader2 size={11} className="animate-spin" />,
    error:   <AlertCircle size={11} />,
    idle:    <Clock size={11} />,
  };
  return (
    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold capitalize ${map[status] ?? map.idle}`}>
      {icon[status] ?? icon.idle} {status}
    </span>
  );
}

export default function Pipelines() {
  const { state } = usePipeline();

  if (!state) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );

  const stagesDone = STAGES.filter(s => (state[s.key as keyof typeof state] as any)?.status === "done").length;

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase flex items-center gap-2">
            <GitBranch size={20} className="text-purple-500" /> Pipelines
          </h1>
          <p className="text-gray-500 text-sm mt-1">4-stage AI data processing pipeline · {stagesDone}/4 stages complete</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm text-sm font-semibold text-gray-700">
          {state.records.length.toLocaleString()} Records
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STAGES.map(({ key, num, label, color }) => {
          const stage = state[key as keyof typeof state] as any;
          const c = COLORS[color];
          const pct = stage.total > 0 ? Math.round((stage.processed / stage.total) * 100) : 0;
          return (
            <div key={key} className={`bg-white rounded-2xl p-5 shadow-sm border ${stage.status === "done" ? c.border : "border-gray-100"}`}>
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                <span className={`text-lg font-black ${c.text}`}>{num}</span>
              </div>
              <div className="font-bold text-gray-900 text-sm mb-1">{label}</div>
              <StatusPill status={stage.status} />
              {stage.total > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div className={`h-full rounded-full ${c.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] text-gray-400">{stage.processed.toLocaleString()} / {stage.total.toLocaleString()}</div>
                </div>
              )}
              {stage.message && <div className="text-[10px] text-gray-400 mt-2 truncate">{stage.message}</div>}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {STAGES.map(({ key, label, desc, color }) => {
          const stage = state[key as keyof typeof state] as any;
          const c = COLORS[color];
          const pct = stage.total > 0 ? Math.round((stage.processed / stage.total) * 100) : 0;
          return (
            <div key={key} className={`bg-white rounded-2xl p-5 shadow-sm border ${stage.status === "done" ? c.border : "border-gray-100"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-gray-900">{label}</span>
                    <StatusPill status={stage.status} />
                  </div>
                  <div className="text-sm text-gray-400">{stage.message || desc}</div>
                  {stage.total > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>{stage.processed.toLocaleString()} processed</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {stage.flagged != null && stage.flagged > 0 && <div className="text-sm font-bold text-amber-600">{stage.flagged} flagged</div>}
                  {stage.errors  != null && stage.errors  > 0 && <div className="text-sm font-bold text-red-600">{stage.errors} errors</div>}
                  {stage.duplicates != null && <div className="text-sm font-bold text-gray-400">−{stage.duplicates} dupes</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
