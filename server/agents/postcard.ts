import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BusinessRecord, getState, updateRecord, updateStage } from "../progress.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTCARDS_DIR = path.join(__dirname, "../../public/postcards");

let aborted = false;
export function abortPostcard() { aborted = true; }

function generatePostcardHtml(r: BusinessRecord): string {
  const name = r.name_ar || "Unknown";
  const nameEn = r.name_en || r.name_ku || "";
  const category = r.category || "Business";
  const city = r.city || r.governorate || "Iraq";
  const phone = r.phone || "—";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 600px; height: 350px; background: linear-gradient(135deg, #1B2A4A 0%, #0d1a30 100%); font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; }
  .card { width: 600px; height: 350px; position: relative; padding: 32px; display: flex; flex-direction: column; justify-content: space-between; }
  .gold-line { height: 3px; background: linear-gradient(90deg, #C9A84C, #f0d080, #C9A84C); border-radius: 2px; margin-bottom: 20px; }
  .badge { display: inline-block; background: #C9A84C22; border: 1px solid #C9A84C66; color: #C9A84C; font-size: 11px; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; letter-spacing: 1px; text-transform: uppercase; }
  .name-ar { font-size: 32px; font-weight: bold; color: #fff; text-align: right; line-height: 1.3; text-shadow: 0 2px 10px rgba(201,168,76,0.3); }
  .name-en { font-size: 14px; color: #C9A84C; text-align: right; margin-top: 6px; font-style: italic; }
  .divider { height: 1px; background: rgba(201,168,76,0.2); margin: 16px 0; }
  .info { display: flex; justify-content: space-between; align-items: flex-end; }
  .location { color: #8fa0c0; font-size: 13px; direction: rtl; }
  .location span { color: #C9A84C; font-size: 15px; font-weight: bold; display: block; margin-bottom: 4px; }
  .phone-block { text-align: left; }
  .phone-block .label { color: #5a7090; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; }
  .phone-block .phone { color: #C9A84C; font-size: 16px; font-weight: bold; direction: ltr; }
  .watermark { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); color: rgba(201,168,76,0.15); font-size: 10px; letter-spacing: 4px; text-transform: uppercase; white-space: nowrap; }
  .corner-dec { position: absolute; top: 0; left: 0; width: 80px; height: 80px; border-top: 2px solid #C9A84C33; border-left: 2px solid #C9A84C33; }
  .corner-dec-br { position: absolute; bottom: 0; right: 0; width: 80px; height: 80px; border-bottom: 2px solid #C9A84C33; border-right: 2px solid #C9A84C33; }
</style>
</head>
<body>
<div class="card">
  <div class="corner-dec"></div>
  <div class="corner-dec-br"></div>
  <div>
    <div class="gold-line"></div>
    <div class="badge">${category}</div>
    <div class="name-ar">${name}</div>
    ${nameEn ? `<div class="name-en">${nameEn}</div>` : ""}
  </div>
  <div>
    <div class="divider"></div>
    <div class="info">
      <div class="phone-block">
        <div class="label">Contact</div>
        <div class="phone">${phone}</div>
      </div>
      <div class="location">
        <span>${city}</span>
        Iraq
      </div>
    </div>
  </div>
  <div class="watermark">IRAQ COMPASS · BUSINESS DIRECTORY</div>
</div>
</body>
</html>`;
}

export async function runPostcard(onProgress: (processed: number, errors: number) => void): Promise<void> {
  aborted = false;

  if (!fs.existsSync(POSTCARDS_DIR)) fs.mkdirSync(POSTCARDS_DIR, { recursive: true });

  const records = getState().records.filter(r => r.data_quality_score && r.data_quality_score >= 50);
  const total = records.length;
  let processed = 0, errors = 0;

  updateStage("stage4", {
    status: "running",
    total,
    processed: 0,
    errors: 0,
    startedAt: new Date().toISOString(),
    message: `Generating ${total} postcards...`,
  });

  for (const r of records) {
    if (aborted) break;
    try {
      const html = generatePostcardHtml(r);
      const filePath = path.join(POSTCARDS_DIR, `${r.id}.html`);
      fs.writeFileSync(filePath, html);
      const url = `/postcards/${r.id}.html`;
      updateRecord(r.id, { postcard_url: url, pipeline_stage: 4 });
      processed++;
    } catch (e: any) {
      console.error(`Postcard error for ${r.id}:`, e.message);
      errors++;
    }

    if (processed % 50 === 0) {
      onProgress(processed, errors);
      updateStage("stage4", { processed, errors, message: `Generated ${processed}/${total} postcards...` });
      await new Promise(res => setTimeout(res, 10));
    }
  }

  onProgress(processed, errors);
  updateStage("stage4", {
    status: aborted ? "idle" : "done",
    processed,
    errors,
    completedAt: new Date().toISOString(),
    message: `Done: ${processed} postcards generated`,
  });
}
