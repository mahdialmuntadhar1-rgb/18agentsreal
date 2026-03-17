import { supabase } from "../supabaseClient.js";
import { BusinessRecord, calcQualityScore, setState, updateStage } from "../progress.js";

function normalizeRecord(raw: any, source: "json" | "supabase"): BusinessRecord {
  const r: BusinessRecord = {
    id: String(raw.id || Math.random().toString(36).slice(2)),
    name_ar: raw.name_ar || raw.name || "",
    name_ku: raw.name_ku || "",
    name_en: raw.name_en || "",
    original_name_ar: raw.name_ar || raw.name || "",
    original_name_ku: raw.name_ku || "",
    category: raw.category || "",
    subcategory: raw.subcategory || "",
    city: raw.city || raw.governorate || "",
    governorate: raw.governorate || raw.city || "",
    district: raw.district || "",
    address_ar: raw.address_ar || raw.address || "",
    address_en: raw.address_en || "",
    phone: raw.phone || "",
    website: raw.website || "",
    lat: raw.lat ?? raw.latitude,
    lng: raw.lng ?? raw.longitude,
    postcard_url: raw.postcard_url || "",
    verified: raw.verified ?? false,
    needs_verification: !raw.phone || String(raw.phone).trim() === "",
    review_status: "pending",
    pipeline_stage: 1,
    source,
    created_at: raw.created_at || new Date().toISOString(),
  };
  r.data_quality_score = calcQualityScore(r);
  return r;
}

function deduplicateRecords(records: BusinessRecord[]): { unique: BusinessRecord[]; duplicates: number } {
  const seen = new Map<string, boolean>();
  const unique: BusinessRecord[] = [];
  let duplicates = 0;

  for (const r of records) {
    const phone = r.phone && String(r.phone).replace(/\D/g, "").length > 5
      ? `phone:${String(r.phone).replace(/\D/g, "")}`
      : null;
    const nameKey = `name:${String(r.name_ar).trim().toLowerCase().slice(0, 30)}:${String(r.city).toLowerCase()}`;
    const key = phone || nameKey;

    if (!seen.has(key)) {
      seen.set(key, true);
      unique.push(r);
    } else {
      duplicates++;
    }
  }
  return { unique, duplicates };
}

async function fetchAllFromSupabase(): Promise<BusinessRecord[]> {
  const PAGE = 1000;
  let all: BusinessRecord[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("directory")
      .select("*")
      .range(from, from + PAGE - 1);

    if (error) { console.warn("Supabase fetch error:", error.message); break; }
    if (!data || data.length === 0) break;

    all = all.concat(data.map((r: any) => normalizeRecord(r, "supabase")));
    from += PAGE;

    if (data.length < PAGE) break;
  }

  return all;
}

export async function runIngest(
  jsonRecords: any[],
  onProgress: (msg: string) => void
): Promise<void> {
  updateStage("stage1", {
    status: "running",
    startedAt: new Date().toISOString(),
    message: "Starting ingestion...",
  });

  let fromJson: BusinessRecord[] = [];
  if (jsonRecords.length > 0) {
    fromJson = jsonRecords.map(r => normalizeRecord(r, "json"));
    onProgress(`Loaded ${fromJson.length.toLocaleString()} records from JSON file.`);
    updateStage("stage1", { message: `${fromJson.length.toLocaleString()} from JSON. Fetching Supabase directory...` });
  }

  onProgress("Fetching records from Supabase directory table (paginating)...");
  const fromSupabase = await fetchAllFromSupabase();
  onProgress(`Fetched ${fromSupabase.length.toLocaleString()} records from Supabase.`);

  const all = [...fromJson, ...fromSupabase];
  const { unique, duplicates } = deduplicateRecords(all);

  setState({ records: unique });

  const msg = [
    fromJson.length > 0 ? `${fromJson.length.toLocaleString()} from JSON` : null,
    `${fromSupabase.length.toLocaleString()} from Supabase`,
    `→ ${unique.length.toLocaleString()} unique (${duplicates.toLocaleString()} duplicates removed)`,
  ].filter(Boolean).join(" + ");

  updateStage("stage1", {
    status: "done",
    total: all.length,
    processed: unique.length,
    duplicates,
    completedAt: new Date().toISOString(),
    message: msg,
  });
}
