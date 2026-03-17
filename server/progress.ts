import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROGRESS_FILE = path.join(__dirname, "progress.json");

export interface BusinessRecord {
  id: string | number;
  name_ar: string;
  name_ku?: string;
  name_en?: string;
  original_name_ar?: string;
  original_name_ku?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  city_ar?: string;
  governorate?: string;
  district?: string;
  address_ar?: string;
  address_en?: string;
  phone?: string;
  website?: string;
  lat?: string | number;
  lng?: string | number;
  postcard_url?: string;
  data_quality_score?: number;
  verified?: boolean;
  confidence?: number;
  needs_verification?: boolean;
  review_status?: "pending" | "approved" | "rejected";
  pipeline_stage?: number;
  source?: "json" | "supabase";
  created_at?: string;
}

export interface StageState {
  status: "idle" | "running" | "done" | "error";
  total: number;
  processed: number;
  flagged?: number;
  errors?: number;
  duplicates?: number;
  startedAt?: string;
  completedAt?: string;
  message?: string;
}

export interface PipelineState {
  stage1: StageState;
  stage2: StageState;
  stage3: StageState;
  stage4: StageState;
  records: BusinessRecord[];
  errors: Array<{ id: string | number; stage: number; error: string; ts: string }>;
}

const defaultState = (): PipelineState => ({
  stage1: { status: "idle", total: 0, processed: 0, duplicates: 0 },
  stage2: { status: "idle", total: 0, processed: 0, flagged: 0, errors: 0 },
  stage3: { status: "idle", total: 0, processed: 0, errors: 0 },
  stage4: { status: "idle", total: 0, processed: 0, errors: 0 },
  records: [],
  errors: [],
});

let _state: PipelineState = defaultState();

export function loadProgress(): PipelineState {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const raw = fs.readFileSync(PROGRESS_FILE, "utf-8");
      _state = JSON.parse(raw);
    }
  } catch {
    _state = defaultState();
  }
  return _state;
}

export function getState(): PipelineState {
  return _state;
}

export function setState(update: Partial<PipelineState>) {
  _state = { ..._state, ...update };
  persist();
}

export function updateStage(stage: keyof Pick<PipelineState, "stage1" | "stage2" | "stage3" | "stage4">, update: Partial<StageState>) {
  _state[stage] = { ..._state[stage], ...update };
  persist();
}

export function updateRecord(id: string | number, update: Partial<BusinessRecord>) {
  const idx = _state.records.findIndex(r => String(r.id) === String(id));
  if (idx !== -1) {
    _state.records[idx] = { ..._state.records[idx], ...update };
    persist();
  }
}

export function resetPipeline() {
  _state = defaultState();
  persist();
}

function persist() {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(_state, null, 2));
  } catch (e) {
    console.error("Failed to persist progress:", e);
  }
}

export function calcQualityScore(r: BusinessRecord): number {
  let score = 0;
  if (r.name_ar && r.name_ar.length > 1) score += 25;
  if (r.name_en) score += 10;
  if (r.phone && r.phone.length > 5) score += 20;
  if (r.category) score += 15;
  if (r.city || r.governorate) score += 15;
  if (r.address_ar || r.address_en) score += 10;
  if (r.lat && r.lng) score += 5;
  return Math.min(score, 100);
}
