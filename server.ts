import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { loadProgress, getState, updateRecord, resetPipeline, setState } from "./server/progress.js";
import { runIngest } from "./server/agents/ingest.js";
import { runTextRepair, abortRepair } from "./server/agents/textRepair.js";
import { runEnrichment, abortEnrichment } from "./server/agents/enrichment.js";
import { runPostcard, abortPostcard } from "./server/agents/postcard.js";
import { supabase } from "./server/supabaseClient.js";
import {
  loadPilotState, getPilotState, resetPilot, abortPilot,
  runPilotCleaning, runPilotEnrichment, runPilotPostcards, runPilotQC,
  getPilotProgressFile, GOVERNORATES, type Governorate,
} from "./server/pilotProgress.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = process.env.NODE_ENV === "production" ? 24678 : 5000;

  app.use(express.json({ limit: "100mb" }));
  app.use(express.static(path.join(__dirname, "public")));

  loadProgress();
  loadPilotState();

  const sseClients: Response[] = [];
  function broadcast(data: object) {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(c => { try { c.write(msg); } catch {} });
  }
  function broadcastState() { broadcast({ type: "state", payload: getState() }); }

  app.get("/api/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    sseClients.push(res);
    res.write(`data: ${JSON.stringify({ type: "state", payload: getState() })}\n\n`);
    req.on("close", () => { const i = sseClients.indexOf(res); if (i > -1) sseClients.splice(i, 1); });
  });

  app.get("/api/status", (_req, res) => { res.json(getState()); });

  app.post("/api/reset", (_req, res) => {
    resetPipeline();
    broadcastState();
    res.json({ ok: true });
  });

  app.post("/api/stage1/start", async (req, res) => {
    const { records } = req.body as { records?: any[] };
    res.json({ ok: true, message: "Ingestion started" });
    runIngest(records ?? [], (msg) => {
      broadcast({ type: "log", payload: msg });
      broadcastState();
    }).then(() => broadcastState()).catch(console.error);
    setTimeout(broadcastState, 500);
  });

  app.post("/api/stage2/start", async (req, res) => {
    if (getState().stage1.status !== "done") return res.status(400).json({ error: "Run Stage 1 first" });
    res.json({ ok: true, message: "Text repair started" });
    runTextRepair((processed, flagged, errors) => broadcastState()).catch(console.error);
  });

  app.post("/api/stage2/stop", (_req, res) => { abortRepair(); res.json({ ok: true }); });

  app.post("/api/stage3/start", async (req, res) => {
    if (getState().stage2.status !== "done") return res.status(400).json({ error: "Run Stage 2 first" });
    res.json({ ok: true, message: "Enrichment started" });
    runEnrichment((processed, errors) => broadcastState()).catch(console.error);
  });

  app.post("/api/stage3/stop", (_req, res) => { abortEnrichment(); res.json({ ok: true }); });

  app.post("/api/stage4/start", async (req, res) => {
    if (getState().stage3.status !== "done") return res.status(400).json({ error: "Run Stage 3 first" });
    res.json({ ok: true, message: "Postcard generation started" });
    runPostcard((processed, errors) => broadcastState()).catch(console.error);
  });

  app.post("/api/stage4/stop", (_req, res) => { abortPostcard(); res.json({ ok: true }); });

  app.get("/api/businesses", (req, res) => {
    const { page = "1", limit = "50", city, category, status, q } = req.query as Record<string, string>;
    let records = getState().records;

    if (city) records = records.filter(r => r.city?.toLowerCase().includes(city.toLowerCase()) || r.governorate?.toLowerCase().includes(city.toLowerCase()));
    if (category) records = records.filter(r => r.category?.toLowerCase().includes(category.toLowerCase()));
    if (status === "verified") records = records.filter(r => r.verified);
    if (status === "pending") records = records.filter(r => !r.verified);
    if (status === "flagged") records = records.filter(r => (r.confidence ?? 100) < 70);
    if (q) records = records.filter(r => r.name_ar?.includes(q) || r.name_en?.toLowerCase().includes(q.toLowerCase()) || r.city?.toLowerCase().includes(q.toLowerCase()));

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, parseInt(limit));
    const total = records.length;
    const data = records.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({ data, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
  });

  app.get("/api/businesses/review", (_req, res) => {
    const flagged = getState().records.filter(r => (r.confidence ?? 100) < 70 || r.needs_verification);
    res.json({ data: flagged, total: flagged.length });
  });

  app.put("/api/businesses/:id", (req, res) => {
    updateRecord(req.params.id, req.body);
    broadcastState();
    res.json({ ok: true });
  });

  app.post("/api/businesses/:id/approve", (req, res) => {
    updateRecord(req.params.id, { review_status: "approved", verified: true });
    broadcastState();
    res.json({ ok: true });
  });

  app.post("/api/businesses/:id/reject", (req, res) => {
    updateRecord(req.params.id, { review_status: "rejected" });
    broadcastState();
    res.json({ ok: true });
  });

  // ─── Governorate Pilot APIs ───────────────────────────────────────────────
  app.get("/api/pilot/status", (_req, res) => { res.json(getPilotState()); });

  app.post("/api/pilot/:gov/reset", (req, res) => {
    const gov = req.params.gov as Governorate;
    if (!GOVERNORATES.includes(gov)) return res.status(400).json({ error: "Unknown governorate" });
    resetPilot(gov);
    broadcastPilot();
    res.json({ ok: true });
  });

  app.post("/api/pilot/:gov/cleaning/start", (req, res) => {
    const gov = req.params.gov as Governorate;
    if (!GOVERNORATES.includes(gov)) return res.status(400).json({ error: "Unknown governorate" });
    res.json({ ok: true });
    runPilotCleaning(gov, broadcastPilot).catch(console.error);
  });

  app.post("/api/pilot/:gov/enrichment/start", (req, res) => {
    const gov = req.params.gov as Governorate;
    if (!GOVERNORATES.includes(gov)) return res.status(400).json({ error: "Unknown governorate" });
    res.json({ ok: true });
    runPilotEnrichment(gov, broadcastPilot).catch(console.error);
  });

  app.post("/api/pilot/:gov/postcards/start", (req, res) => {
    const gov = req.params.gov as Governorate;
    if (!GOVERNORATES.includes(gov)) return res.status(400).json({ error: "Unknown governorate" });
    res.json({ ok: true });
    runPilotPostcards(gov, broadcastPilot).catch(console.error);
  });

  app.post("/api/pilot/:gov/qc/start", (req, res) => {
    const gov = req.params.gov as Governorate;
    if (!GOVERNORATES.includes(gov)) return res.status(400).json({ error: "Unknown governorate" });
    res.json({ ok: true });
    runPilotQC(gov, broadcastPilot).catch(console.error);
  });

  app.post("/api/pilot/:gov/abort", (req, res) => {
    const gov = req.params.gov as Governorate;
    if (!GOVERNORATES.includes(gov)) return res.status(400).json({ error: "Unknown governorate" });
    abortPilot(gov);
    res.json({ ok: true });
  });

  app.post("/api/pilot/:gov/autorun", (req, res) => {
    const gov = req.params.gov as Governorate;
    if (!GOVERNORATES.includes(gov)) return res.status(400).json({ error: "Unknown governorate" });
    res.json({ ok: true, message: "Auto-run started" });
    (async () => {
      await runPilotCleaning(gov, broadcastPilot);
      await runPilotEnrichment(gov, broadcastPilot);
      await runPilotPostcards(gov, broadcastPilot);
      await runPilotQC(gov, broadcastPilot);
    })().catch(console.error);
  });

  app.get("/api/pilot/:gov/progress", (req, res) => {
    const gov = req.params.gov as Governorate;
    if (!GOVERNORATES.includes(gov)) return res.status(400).json({ error: "Unknown governorate" });
    res.json(getPilotProgressFile(gov));
  });

  function broadcastPilot() {
    broadcast({ type: "pilot", payload: getPilotState() });
  }
  // ──────────────────────────────────────────────────────────────────────────

  app.get("/api/export/json", (_req, res) => {
    res.setHeader("Content-Disposition", "attachment; filename=iraq-compass-export.json");
    res.json(getState().records);
  });

  app.post("/api/export/push", async (_req, res) => {
    const records = getState().records.filter(r => r.source === "supabase" && r.pipeline_stage && r.pipeline_stage >= 2);
    let updated = 0, errors = 0;

    for (const r of records) {
      const { error } = await supabase
        .from("directory")
        .update({
          name: r.name_ar || undefined,
          category: r.category || undefined,
          city: r.city || r.governorate || undefined,
          phone: r.phone || undefined,
        })
        .eq("id", r.id);

      if (error) { console.error(`Update ${r.id} failed:`, error.message); errors++; }
      else updated++;
    }

    if (errors > 0 && updated === 0) return res.status(500).json({ error: `All ${errors} updates failed` });
    res.json({ ok: true, pushed: updated, errors, message: `Updated ${updated} records in Supabase directory table` });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Iraq Compass Pipeline running on http://localhost:${PORT}`);
  });
}

startServer();
