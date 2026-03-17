import { GoogleGenAI } from "@google/genai";
import { getState, updateRecord, updateStage } from "../progress.js";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const BATCH_SIZE = 30;
const RATE_LIMIT_MS = 200;

const CATEGORIES = [
  "مطاعم/Restaurants", "صحة/Health", "تعليم/Education", "تجارة/Commerce",
  "خدمات/Services", "ترفيه/Entertainment", "سفر/Travel", "عقارات/Real Estate",
  "place_of_worship", "bus_station", "other",
];

let aborted = false;
export function abortEnrichment() { aborted = true; }

function needsEnrichment(r: any): boolean {
  return !r.phone || !r.category || !r.city;
}

async function enrichBatch(batch: any[]): Promise<void> {
  const prompt = batch
    .map((r, i) => `${i}. id=${r.id} | name="${r.name_ar}" | category="${r.category || ""}" | city="${r.city || ""}" | phone="${r.phone || ""}"`)
    .join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are enriching Iraqi business directory data. For each record, infer missing fields. Available categories: ${CATEGORIES.join(", ")}. Return a JSON array (same order) with: { "idx": number, "category": string, "subcategory": string, "city_ar": string, "city_en": string, "needs_verification": boolean }. Return ONLY the JSON array, no markdown.\n\nRecords:\n${prompt}`,
  });

  const raw = response.text ?? "";
  let results: Array<{ idx: number; category: string; subcategory: string; city_ar: string; city_en: string; needs_verification: boolean }> = [];

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) results = JSON.parse(jsonMatch[0]);
  } catch {
    console.warn("Failed to parse Gemini enrichment response");
    return;
  }

  for (const result of results) {
    const record = batch[result.idx];
    if (!record) continue;
    updateRecord(record.id, {
      category: result.category || record.category,
      subcategory: result.subcategory || record.subcategory,
      city: result.city_en || record.city,
      city_ar: result.city_ar || record.city,
      needs_verification: !record.phone || result.needs_verification,
      pipeline_stage: 3,
    });
  }
}

export async function runEnrichment(onProgress: (processed: number, errors: number) => void): Promise<void> {
  aborted = false;
  const records = getState().records.filter(needsEnrichment);
  const total = records.length;
  let processed = 0, errors = 0;

  updateStage("stage3", {
    status: "running",
    total,
    processed: 0,
    errors: 0,
    startedAt: new Date().toISOString(),
    message: `Enriching ${total} records with Gemini...`,
  });

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    if (aborted) break;
    const batch = records.slice(i, i + BATCH_SIZE);

    try {
      await enrichBatch(batch);
      processed += batch.length;
    } catch (e: any) {
      console.error(`Enrichment batch ${i} error:`, e.message);
      errors += batch.length;
    }

    onProgress(processed, errors);
    updateStage("stage3", { processed, errors, message: `Enriched ${processed}/${total}...` });
    await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
  }

  updateStage("stage3", {
    status: aborted ? "idle" : "done",
    processed,
    errors,
    completedAt: new Date().toISOString(),
    message: `Done: ${processed} enriched, ${errors} errors`,
  });
}
