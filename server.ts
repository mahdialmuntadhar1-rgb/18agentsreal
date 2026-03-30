import express from "express";
import { createServer as createViteServer } from "vite";
import { runGovernor } from "./server/governors/index.js";
import { runDiscoveryOrchestrator } from "./server/discovery/orchestrator.js";
import { supabaseAdmin } from "./server/supabase-admin.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let activeDiscoveryRun: Promise<void> | null = null;
  let activeDiscoveryRunId: string | null = null;

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/agents", async (_req, res) => {
    const { data } = await supabaseAdmin.from("agents").select("*").order("agent_name");
    res.json((data || []).map((a: any) => ({
      name: a.agent_name,
      governorate: a.agent_name,
      category: a.category || "unknown",
      status: a.status === "active" ? "running" : a.status || "idle",
      governmentRate: a.government_rate || "N/A",
      recordsInserted: a.records_collected || 0,
      lastActivity: a.last_run ? new Date(a.last_run).toLocaleString() : "Never",
    })));
  });

  app.post("/api/orchestrator/start", async (_req, res) => {
    await supabaseAdmin.from("agents").update({ status: "active" }).neq("agent_name", "");
    res.json({ status: "started" });
  });

  app.post("/api/orchestrator/stop", async (_req, res) => {
    await supabaseAdmin.from("agents").update({ status: "idle" }).neq("agent_name", "");
    res.json({ status: "stopped" });
  });

  app.post("/api/agents/:agentName/run", async (req, res) => {
    const { agentName } = req.params;
    try {
      runGovernor(agentName).catch(console.error);
      res.json({ status: "started", agentName });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/discovery/run", async (req, res) => {
    const { agentName, city = "Baghdad", governorate, category = "restaurants", query, includeGoogleFallback = false } = req.body || {};

    if (activeDiscoveryRun) {
      return res.status(409).json({ ok: false, error: "A discovery run is already in progress", runId: activeDiscoveryRunId });
    }

    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeDiscoveryRunId = runId;

    try {
      activeDiscoveryRun = (async () => {
        try {
          if (agentName) {
            await runGovernor(agentName);
            return;
          }

          const result = await runDiscoveryOrchestrator({
            query: query || `${category} in ${city}, Iraq`,
            city,
            governorate: governorate || city,
            category,
            includeGoogleFallback,
            limit: 20,
          });

          if (result.records.length > 0) {
            const upserts = result.records.map((r) => ({
              name_en: r.name,
              name_ar: r.local_name || "",
              name_ku: "",
              name: { en: r.name, ar: r.local_name || "", ku: "" },
              category: r.category || category,
              governorate: r.governorate,
              city: r.city || city,
              address: r.address,
              phone: r.phone,
              website: r.website,
              source: r.source,
              source_url: r.source_url,
              facebook_url: r.facebook_url,
              instagram_url: r.instagram_url,
              latitude: r.latitude,
              longitude: r.longitude,
              confidence_score: r.confidence_score || 0,
              extraction_notes: r.extraction_notes,
              status: (r.confidence_score || 0) >= 70 ? "approved" : "pending",
              verification_status: (r.confidence_score || 0) >= 70 ? "approved" : "pending",
              created_by_agent: "orchestrator",
            }));

            await supabaseAdmin.from("businesses").upsert(upserts, { onConflict: "name_en,city,phone" });
          }

          for (const log of result.logs) {
            await supabaseAdmin.from("agent_logs").insert({
              agent_id: "orchestrator",
              action: "discovery_run",
              result: log.ok ? "success" : "failed",
              type: log.ok ? "info" : "warning",
              message: `${log.adapter} ${log.ok ? "ok" : "failed"} count=${log.count}${log.error ? ` error=${log.error}` : ""}`,
            });
          }
        } finally {
          activeDiscoveryRun = null;
          activeDiscoveryRunId = null;
        }
      })();

      if ((req.query?.mode || "direct") === "direct") {
        await activeDiscoveryRun;
        return res.json({ ok: true, runId, mode: "direct", status: "completed" });
      }

      return res.status(202).json({ ok: true, runId, mode: "async", status: "running" });
    } catch (error: any) {
      activeDiscoveryRun = null;
      activeDiscoveryRunId = null;
      console.error("Discovery run failed:", error);
      return res.status(500).json({ ok: false, error: error?.message || "Discovery run failed", runId });
    }
  });

  app.get("/api/discovery/search", async (req, res) => {
    const city = String(req.query.city || "Baghdad");
    const category = String(req.query.category || "restaurants");
    const query = String(req.query.query || `${category} in ${city}`);
    const includeGoogleFallback = String(req.query.includeGoogleFallback || "false") === "true";

    const result = await runDiscoveryOrchestrator({ query, city, governorate: city, category, includeGoogleFallback, limit: 20 });
    res.json(result);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
