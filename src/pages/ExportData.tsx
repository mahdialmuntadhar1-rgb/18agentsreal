import { useState } from "react";
import { usePipeline } from "../lib/usePipeline";
import { Download, Database, FileJson, CheckCircle, Loader2, AlertCircle, Upload } from "lucide-react";

export default function ExportData() {
  const { state, pushToSupabase } = usePipeline();
  const [pushing, setPushing]     = useState(false);
  const [pushResult, setPushResult] = useState<{ ok?: boolean; pushed?: number; error?: string } | null>(null);

  const total       = state?.records?.length ?? 0;
  const verified    = state?.records?.filter(r => r.verified).length ?? 0;
  const quality50   = state?.records?.filter(r => (r.data_quality_score ?? 0) >= 50).length ?? 0;
  const quality80   = state?.records?.filter(r => (r.data_quality_score ?? 0) >= 80).length ?? 0;
  const withPhone   = state?.records?.filter(r => r.phone).length ?? 0;
  const withPostcard= state?.records?.filter(r => r.postcard_url).length ?? 0;
  const stages      = state ? [state.stage1, state.stage2, state.stage3, state.stage4] : [];
  const stagesDone  = stages.filter(s => s.status === "done").length;

  const handlePush = async () => {
    setPushing(true);
    setPushResult(null);
    const res = await pushToSupabase();
    setPushResult(res);
    setPushing(false);
  };

  const reportLines = [
    `Iraq Compass Pipeline Export Report`,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `== PIPELINE STATUS ==`,
    `Stages Completed: ${stagesDone}/4`,
    ``,
    `== RECORD COUNTS ==`,
    `Total Records: ${total}`,
    `Verified: ${verified}`,
    `Quality >= 80: ${quality80}`,
    `Quality >= 50: ${quality50}`,
    `With Phone: ${withPhone}`,
    `With Postcard: ${withPostcard}`,
    ``,
    `== STAGE DETAILS ==`,
    ...["Stage 1 (Ingest)", "Stage 2 (Text Repair)", "Stage 3 (Enrichment)", "Stage 4 (Postcards)"].map((label, i) => {
      const s = stages[i];
      if (!s) return `${label}: not started`;
      return `${label}: ${s.status} | ${s.processed}/${s.total} processed | ${s.message || ""}`;
    }),
  ].join("\n");

  const downloadReport = () => {
    const blob = new Blob([reportLines], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "pipeline-report.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const STATS = [
    { label: "Total Records",  value: total },
    { label: "Verified",       value: verified },
    { label: "Stages Done",    value: `${stagesDone}/4` },
  ];

  const ACTIONS = [
    {
      icon: FileJson,
      color: "text-blue-600",
      bg:    "bg-blue-50",
      title: "Download JSON",
      desc:  `Export all ${total.toLocaleString()} cleaned records as a JSON file`,
      action: (
        <a href="/api/export/json" download="iraq-compass-export.json"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm transition-all">
          <Download size={14} /> Download JSON
        </a>
      ),
    },
    {
      icon: Database,
      color: "text-amber-600",
      bg:    "bg-amber-50",
      title: "Push to Supabase",
      desc:  `Upsert ${quality50.toLocaleString()} quality records (score ≥ 50) into your businesses table`,
      action: (
        <button onClick={handlePush} disabled={pushing || total === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-40">
          {pushing ? <><Loader2 size={14} className="animate-spin" /> Pushing...</> : <><Database size={14} /> Push to Supabase</>}
        </button>
      ),
    },
    {
      icon: FileJson,
      color: "text-gray-500",
      bg:    "bg-gray-100",
      title: "Pipeline Report",
      desc:  "Export a summary of all pipeline stages and statistics",
      action: (
        <button onClick={downloadReport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-gray-900 text-sm font-semibold shadow-sm transition-all">
          <Download size={14} /> Export Report
        </button>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase flex items-center gap-2">
          <Upload size={20} className="text-teal-500" /> Export Data
        </h1>
        <p className="text-gray-500 text-sm mt-1">Download cleaned data or push verified records to Supabase</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {STATS.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-2xl font-black text-gray-900">{String(value)}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">{label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {ACTIONS.map(({ icon: Icon, color, bg, title, desc, action }) => (
          <div key={title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900">{title}</div>
              <div className="text-sm text-gray-400 mt-0.5">{desc}</div>
            </div>
            {action}
          </div>
        ))}
      </div>

      {pushResult && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-semibold ${
          pushResult.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {pushResult.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {pushResult.ok ? `Successfully pushed ${pushResult.pushed} records to Supabase` : `Error: ${pushResult.error}`}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-4">Record Quality Breakdown</div>
        <div className="space-y-3">
          {[
            { label: "High Quality (≥ 80)",  value: quality80,            color: "bg-green-500"  },
            { label: "Acceptable (50–79)",    value: quality50 - quality80,color: "bg-amber-500"  },
            { label: "Needs Work (< 50)",     value: total - quality50,    color: "bg-red-500"    },
            { label: "Has Phone",             value: withPhone,            color: "bg-blue-500"   },
            { label: "Has Postcard",          value: withPostcard,         color: "bg-purple-500" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-medium">
                <span>{label}</span>
                <span className="text-gray-800 font-bold">{value.toLocaleString()} ({total > 0 ? Math.round((value / total) * 100) : 0}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${total > 0 ? (value / total) * 100 : 0}%`, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
