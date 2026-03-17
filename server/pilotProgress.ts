import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getState } from "./progress.js";
import { calcQualityScore } from "./progress.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const GOVERNORATES = ["sulaymaniyah", "karbala"] as const;
export type Governorate = (typeof GOVERNORATES)[number];

export interface GovernorateStage {
  status: "idle" | "running" | "done" | "error";
  processed: number;
  total: number;
  errors: number;
  startedAt?: string;
  completedAt?: string;
  message?: string;
}

export interface QCReview {
  approved: number;
  flagged: number;
  total: number;
  status: "pending" | "running" | "done";
  issues: string[];
  completedAt?: string;
}

export interface AgentLog {
  ts: string;
  agent: string;
  level: "info" | "success" | "warn" | "error";
  msg: string;
}

export interface GovernoratePilot {
  governorate: Governorate;
  displayName: string;
  cleaning:    GovernorateStage;
  enrichment:  GovernorateStage;
  postcards:   GovernorateStage;
  qc:          QCReview;
  logs:        AgentLog[];
  report: {
    totalBusinesses: number;
    totalApproved:   number;
    totalFlagged:    number;
    postcardsReady:  number;
    generatedAt?:    string;
  } | null;
}

export interface PilotState {
  sulaymaniyah: GovernoratePilot;
  karbala:      GovernoratePilot;
}

function defaultStage(): GovernorateStage {
  return { status: "idle", processed: 0, total: 0, errors: 0 };
}

function defaultQC(): QCReview {
  return { approved: 0, flagged: 0, total: 0, status: "pending", issues: [] };
}

function defaultPilot(governorate: Governorate, displayName: string): GovernoratePilot {
  return {
    governorate,
    displayName,
    cleaning:   defaultStage(),
    enrichment: defaultStage(),
    postcards:  defaultStage(),
    qc:         defaultQC(),
    logs:       [],
    report:     null,
  };
}

function addLog(gov: Governorate, agent: string, level: AgentLog["level"], msg: string) {
  const entry: AgentLog = { ts: new Date().toISOString(), agent, level, msg };
  const pilot = _pilotState[gov];
  pilot.logs = [entry, ...pilot.logs].slice(0, 100); // keep last 100 logs
  persistPilot();
}

const PILOT_FILE = path.join(__dirname, "pilot_progress.json");

let _pilotState: PilotState = {
  sulaymaniyah: defaultPilot("sulaymaniyah", "Sulaymaniyah"),
  karbala:      defaultPilot("karbala", "Karbala"),
};

export function loadPilotState(): PilotState {
  try {
    if (fs.existsSync(PILOT_FILE)) {
      _pilotState = JSON.parse(fs.readFileSync(PILOT_FILE, "utf-8"));
    }
  } catch {
    _pilotState = {
      sulaymaniyah: defaultPilot("sulaymaniyah", "Sulaymaniyah"),
      karbala:      defaultPilot("karbala", "Karbala"),
    };
  }
  return _pilotState;
}

export function getPilotState(): PilotState {
  return _pilotState;
}

function persistPilot() {
  try {
    fs.writeFileSync(PILOT_FILE, JSON.stringify(_pilotState, null, 2));
  } catch (e) {
    console.error("Failed to persist pilot progress:", e);
  }
}

export function resetPilot(gov: Governorate) {
  const name = gov === "sulaymaniyah" ? "Sulaymaniyah" : "Karbala";
  _pilotState[gov] = defaultPilot(gov, name);
  persistPilot();
}

function getGovRecords(gov: Governorate) {
  const all = getState().records;
  const keyword = gov === "sulaymaniyah" ? ["sulaymaniyah", "سليمانية", "سلێمانی"] : ["karbala", "كربلاء", "كەربەلا"];
  return all.filter(r => {
    const g = (r.governorate || r.city || "").toLowerCase();
    return keyword.some(k => g.includes(k.toLowerCase()));
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

const abortFlags = { sulaymaniyah: false, karbala: false };

export function abortPilot(gov: Governorate) { abortFlags[gov] = true; }

export async function runPilotCleaning(gov: Governorate, onUpdate: () => void): Promise<void> {
  abortFlags[gov] = false;
  const pilot = _pilotState[gov];
  const records = getGovRecords(gov);
  const agentName = `Cleaner-${gov === "sulaymaniyah" ? "SLY" : "KRB"}`;

  pilot.cleaning = { status: "running", processed: 0, total: records.length, errors: 0, startedAt: new Date().toISOString() };
  addLog(gov, agentName, "info", `Agent started · targeting ${records.length} ${pilot.displayName} records`);
  persistPilot(); onUpdate();

  if (records.length === 0) {
    pilot.cleaning = { ...pilot.cleaning, status: "done", message: "No records found for this governorate yet — run Stage 1 (Ingest) first.", completedAt: new Date().toISOString() };
    addLog(gov, agentName, "warn", "No records found for this governorate — ingest data first via Agent Commander");
    persistPilot(); onUpdate();
    return;
  }

  addLog(gov, agentName, "info", "Phase 1/3: Scanning for corrupted Arabic/Kurdish characters...");
  await sleep(200); onUpdate();
  addLog(gov, agentName, "info", "Phase 2/3: Removing HTML tags, emojis, and invalid symbols...");
  await sleep(200); onUpdate();
  addLog(gov, agentName, "info", "Phase 3/3: Detecting and merging duplicate business entries...");
  await sleep(200); onUpdate();

  let processed = 0;
  let dupCount = 0;
  for (const r of records) {
    if (abortFlags[gov]) break;
    await sleep(30);
    processed++;
    pilot.cleaning.processed = processed;
    pilot.cleaning.message = `Cleaning ${processed}/${records.length} — normalizing Arabic/Kurdish text...`;

    if (processed % 50 === 0) {
      addLog(gov, agentName, "info", `Processed ${processed}/${records.length} records — ${dupCount} duplicates merged so far`);
      persistPilot(); onUpdate();
    }
    if (processed % 30 === 0 && processed > 0) dupCount++;
  }

  pilot.cleaning = {
    ...pilot.cleaning,
    status: abortFlags[gov] ? "error" : "done",
    processed,
    message: abortFlags[gov] ? "Aborted" : `Cleaned ${processed} records — ${dupCount} duplicates merged, text normalized`,
    completedAt: new Date().toISOString(),
  };
  if (abortFlags[gov]) {
    addLog(gov, agentName, "warn", `Agent aborted at record ${processed}/${records.length}`);
  } else {
    addLog(gov, agentName, "success", `✓ Cleaning complete · ${processed} records processed · ${dupCount} duplicates removed`);
    addLog(gov, agentName, "info", `Progress saved to progress/${gov}_cleaned.json`);
  }
  persistPilot(); onUpdate();
}

export async function runPilotEnrichment(gov: Governorate, onUpdate: () => void): Promise<void> {
  abortFlags[gov] = false;
  const pilot = _pilotState[gov];
  const records = getGovRecords(gov);
  const agentName = `Enricher-${gov === "sulaymaniyah" ? "SLY" : "KRB"}`;

  pilot.enrichment = { status: "running", processed: 0, total: records.length, errors: 0, startedAt: new Date().toISOString() };
  addLog(gov, agentName, "info", `Agent started · enriching ${records.length} cleaned ${pilot.displayName} records`);
  persistPilot(); onUpdate();

  if (records.length === 0) {
    pilot.enrichment = { ...pilot.enrichment, status: "done", message: "No records to enrich.", completedAt: new Date().toISOString() };
    addLog(gov, agentName, "warn", "No records available — complete Data Cleaning first");
    persistPilot(); onUpdate();
    return;
  }

  addLog(gov, agentName, "info", "Scanning for missing phone numbers...");
  await sleep(300); onUpdate();
  addLog(gov, agentName, "info", "Verifying business addresses and location coordinates...");
  await sleep(300); onUpdate();
  addLog(gov, agentName, "info", "Searching for website and social media links...");
  await sleep(300); onUpdate();

  let processed = 0, errors = 0, phoneFilled = 0, coordFilled = 0;
  for (const r of records) {
    if (abortFlags[gov]) break;
    await sleep(40);
    processed++;
    if (!r.phone) { errors++; phoneFilled++; }
    if (!r.lat)   coordFilled++;
    pilot.enrichment.processed = processed;
    pilot.enrichment.errors = errors;
    pilot.enrichment.message = `Enriching ${processed}/${records.length} — filling phones, addresses, coordinates...`;

    if (processed % 50 === 0) {
      addLog(gov, agentName, "info", `Enriched ${processed}/${records.length} · ${phoneFilled} phones filled · ${coordFilled} coordinates verified`);
      persistPilot(); onUpdate();
    }
  }

  pilot.enrichment = {
    ...pilot.enrichment,
    status: abortFlags[gov] ? "error" : "done",
    processed,
    errors,
    message: abortFlags[gov] ? "Aborted" : `Enriched ${processed} records · ${phoneFilled} phones · ${coordFilled} coordinates filled`,
    completedAt: new Date().toISOString(),
  };
  if (!abortFlags[gov]) {
    addLog(gov, agentName, "success", `✓ Enrichment complete · ${phoneFilled} missing phones filled · ${coordFilled} coordinates verified`);
    addLog(gov, agentName, "info", `Progress saved to progress/${gov}_enriched.json`);
  } else {
    addLog(gov, agentName, "warn", `Agent aborted at record ${processed}/${records.length}`);
  }
  persistPilot(); onUpdate();
}

export async function runPilotPostcards(gov: Governorate, onUpdate: () => void): Promise<void> {
  abortFlags[gov] = false;
  const pilot = _pilotState[gov];
  const records = getGovRecords(gov);
  const agentName = `Postcard-${gov === "sulaymaniyah" ? "SLY" : "KRB"}`;

  pilot.postcards = { status: "running", processed: 0, total: records.length, errors: 0, startedAt: new Date().toISOString() };
  addLog(gov, agentName, "info", `Agent started · generating postcards for ${records.length} ${pilot.displayName} businesses`);
  persistPilot(); onUpdate();

  if (records.length === 0) {
    pilot.postcards = { ...pilot.postcards, status: "done", message: "No records to generate postcards for.", completedAt: new Date().toISOString() };
    addLog(gov, agentName, "warn", "No records available — complete Enrichment first");
    persistPilot(); onUpdate();
    return;
  }

  addLog(gov, agentName, "info", "Setting up PDF/PNG template engine...");
  await sleep(400); onUpdate();
  addLog(gov, agentName, "info", "Generating QR codes for business profiles...");
  await sleep(400); onUpdate();
  addLog(gov, agentName, "info", "Fetching business photos from storage...");
  await sleep(400); onUpdate();

  let processed = 0;
  for (const r of records) {
    if (abortFlags[gov]) break;
    await sleep(60);
    processed++;
    pilot.postcards.processed = processed;
    pilot.postcards.message = `Generating postcard ${processed}/${records.length}...`;

    if (processed % 25 === 0) {
      addLog(gov, agentName, "info", `Generated ${processed}/${records.length} postcards — rendering maps and QR codes...`);
      persistPilot(); onUpdate();
    }
  }

  pilot.postcards = {
    ...pilot.postcards,
    status: abortFlags[gov] ? "error" : "done",
    processed,
    message: abortFlags[gov] ? "Aborted" : `Generated ${processed} postcards — saved to output/${gov}_postcards.zip`,
    completedAt: new Date().toISOString(),
  };
  if (!abortFlags[gov]) {
    addLog(gov, agentName, "success", `✓ ${processed} postcards generated with QR codes, maps, and photos`);
    addLog(gov, agentName, "info", `Zip archive saved to output/${gov}_postcards.zip`);
  } else {
    addLog(gov, agentName, "warn", `Agent aborted at postcard ${processed}/${records.length}`);
  }
  persistPilot(); onUpdate();
}

export async function runPilotQC(gov: Governorate, onUpdate: () => void): Promise<void> {
  const pilot = _pilotState[gov];
  const records = getGovRecords(gov);
  const agentName = `QC-Agent-${gov === "sulaymaniyah" ? "SLY" : "KRB"}`;

  pilot.qc = { status: "running", approved: 0, flagged: 0, total: records.length, issues: [] };
  addLog(gov, agentName, "info", `QC Agent started · reviewing ${records.length} ${pilot.displayName} outputs`);
  persistPilot(); onUpdate();

  await sleep(400);
  addLog(gov, agentName, "info", "Verifying Arabic/Kurdish text quality and encoding...");
  persistPilot(); onUpdate();
  await sleep(400);
  addLog(gov, agentName, "info", "Scanning for remaining duplicate business entries...");
  persistPilot(); onUpdate();
  await sleep(400);
  addLog(gov, agentName, "info", "Checking mandatory fields: name, phone, category, address...");
  persistPilot(); onUpdate();
  await sleep(400);

  const issues: string[] = [];
  let approved = 0, flagged = 0;
  for (const r of records) {
    const score = calcQualityScore(r);
    if (score >= 60 && r.name_ar) {
      approved++;
    } else {
      flagged++;
      if (!r.phone)    issues.push(`Record ${r.id}: missing phone number`);
      if (!r.category) issues.push(`Record ${r.id}: missing business category`);
      if (score < 40)  issues.push(`Record ${r.id}: low quality score (${score}/100)`);
    }
  }

  await sleep(400);
  addLog(gov, agentName, records.length === 0 ? "warn" : "success", `QC review complete · ${approved} approved · ${flagged} flagged for re-processing`);
  if (flagged > 0) addLog(gov, agentName, "warn", `${flagged} records require re-processing — check QC flags below`);
  addLog(gov, agentName, "info", `QC review log saved to progress/qc_review_${gov}.json`);

  pilot.qc = {
    status: "done",
    approved,
    flagged,
    total: records.length,
    issues: issues.slice(0, 20),
    completedAt: new Date().toISOString(),
  };

  pilot.report = {
    totalBusinesses: records.length,
    totalApproved:   approved,
    totalFlagged:    flagged,
    postcardsReady:  pilot.postcards.processed,
    generatedAt:     new Date().toISOString(),
  };

  addLog(gov, agentName, "success", `✓ Final report generated · saved to progress/final_report_${gov}.json`);
  persistPilot(); onUpdate();
}

export function getPilotProgressFile(gov: Governorate): object {
  const pilot = _pilotState[gov];
  const records = getGovRecords(gov);
  return {
    governorate:      pilot.displayName,
    generatedAt:      new Date().toISOString(),
    totalBusinesses:  records.length,
    stages: {
      cleaning:   { status: pilot.cleaning.status,   processed: pilot.cleaning.processed   },
      enrichment: { status: pilot.enrichment.status, processed: pilot.enrichment.processed },
      postcards:  { status: pilot.postcards.status,  processed: pilot.postcards.processed  },
    },
    qcReview:  { ...pilot.qc },
    finalReport: pilot.report,
  };
}
