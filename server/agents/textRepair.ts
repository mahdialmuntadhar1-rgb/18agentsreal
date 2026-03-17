import { GoogleGenAI } from "@google/genai";
import { getState, updateRecord, updateStage } from "../progress.js";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const BATCH_SIZE = 50;
const RATE_LIMIT_MS = 200;

let aborted = false;
export function abortRepair() { aborted = true; }

async function repairBatch(batch: any[]): Promise<void> {
  const prompt = batch
    .map((r, i) => `${i}. id=${r.id} | name_ar="${r.name_ar}" | name_ku="${r.name_ku || ""}" | address_ar="${r.address_ar || ""}"`)
    .join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are a data cleaning agent for Iraqi business data. Detect and fix corrupted Arabic or Kurdish Sorani text. Corrupted text shows as garbled characters, wrong encoding, mixed scripts, or meaningless symbols. For each item, return a JSON array (same order) with: { "idx": number, "name_ar": string, "name_ku": string, "address_ar": string, "confidence": 0-100 }. If text looks fine, return it unchanged with confidence 95+. Return ONLY the JSON array, no markdown.\n\nRecords:\n${prompt}`,
  });

  const raw = response.text ?? "";
  let results: Array<{ idx: number; name_ar: string; name_ku: string; address_ar: string; confidence: number }> = [];

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) results = JSON.parse(jsonMatch[0]);
  } catch {
    console.warn("Failed to parse Gemini response for batch");
    return;
  }

  for (const result of results) {
    const record = batch[result.idx];
    if (!record) continue;
    updateRecord(record.id, {
      name_ar: result.name_ar || record.name_ar,
      name_ku: result.name_ku || record.name_ku,
      address_ar: result.address_ar || record.address_ar,
      confidence: result.confidence,
      review_status: result.confidence < 70 ? "pending" : record.review_status,
      pipeline_stage: 2,
    });
  }
}

export async function runTextRepair(onProgress: (processed: number, flagged: number, errors: number) => void): Promise<void> {
  aborted = false;
  const records = getState().records;
  const total = records.length;
  let processed = 0, flagged = 0, errors = 0;

  updateStage("stage2", {
    status: "running",
    total,
    processed: 0,
    flagged: 0,
    errors: 0,
    startedAt: new Date().toISOString(),
    message: "Starting text repair with Gemini...",
  });

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    if (aborted) break;
    const batch = records.slice(i, i + BATCH_SIZE);

    try {
      await repairBatch(batch);
      const repaired = getState().records.slice(i, i + BATCH_SIZE);
      const batchFlagged = repaired.filter(r => (r.confidence ?? 100) < 70).length;
      processed += batch.length;
      flagged += batchFlagged;
    } catch (e: any) {
      console.error(`Repair batch ${i} error:`, e.message);
      errors += batch.length;
    }

    onProgress(processed, flagged, errors);
    updateStage("stage2", { processed, flagged, errors, message: `Repaired ${processed}/${total} records...` });
    await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
  }

  updateStage("stage2", {
    status: aborted ? "idle" : "done",
    processed,
    flagged,
    errors,
    completedAt: new Date().toISOString(),
    message: `Done: ${processed} repaired, ${flagged} flagged for review, ${errors} errors`,
  });
}
