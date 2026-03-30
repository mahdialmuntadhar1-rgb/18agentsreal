import express from "express";
import { createServer as createViteServer } from "vite";
import { runGovernor } from "./server/governors/index.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock agent state
  let agents: any[] = [
    { name: "Agent-01", governorate: "Baghdad", category: "Restaurants", status: "active", governmentRate: "Rate Level 1", recordsInserted: 3247, lastActivity: "2m ago" },
    { name: "Agent-02", governorate: "Basra", category: "Cafes", status: "active", governmentRate: "Rate Level 1", recordsInserted: 1892, lastActivity: "5m ago" },
    { name: "Agent-03", governorate: "Nineveh", category: "Bakeries", status: "idle", governmentRate: "Rate Level 1", recordsInserted: 843, lastActivity: "1h ago" },
    { name: "Agent-04", governorate: "Erbil", category: "Hotels", status: "active", governmentRate: "Rate Level 1", recordsInserted: 612, lastActivity: "8m ago" },
    { name: "Agent-05", governorate: "Sulaymaniyah", category: "Gyms", status: "active", governmentRate: "Rate Level 2", recordsInserted: 438, lastActivity: "12m ago" },
    { name: "Agent-06", governorate: "Kirkuk", category: "Beauty Salons", status: "active", governmentRate: "Rate Level 2", recordsInserted: 1124, lastActivity: "3m ago" },
    { name: "Agent-07", governorate: "Duhok", category: "Barbershops", status: "idle", governmentRate: "Rate Level 2", recordsInserted: 967, lastActivity: "45m ago" },
    { name: "Agent-08", governorate: "Anbar", category: "Pharmacies", status: "active", governmentRate: "Rate Level 2", recordsInserted: 756, lastActivity: "6m ago" },
    { name: "Agent-09", governorate: "Babil", category: "Supermarkets", status: "active", governmentRate: "Rate Level 3", recordsInserted: 521, lastActivity: "9m ago" },
    { name: "Agent-10", governorate: "Karbala", category: "Electronics", status: "error", governmentRate: "Rate Level 3", recordsInserted: 389, lastActivity: "2h ago" },
    { name: "Agent-11", governorate: "Wasit", category: "Clothing Stores", status: "active", governmentRate: "Rate Level 3", recordsInserted: 1043, lastActivity: "4m ago" },
    { name: "Agent-12", governorate: "Dhi Qar", category: "Car Services", status: "idle", governmentRate: "Rate Level 3", recordsInserted: 334, lastActivity: "3h ago" },
    { name: "Agent-13", governorate: "Maysan", category: "Dentists", status: "active", governmentRate: "Rate Level 4", recordsInserted: 287, lastActivity: "15m ago" },
    { name: "Agent-14", governorate: "Muthanna", category: "Clinics", status: "active", governmentRate: "Rate Level 4", recordsInserted: 412, lastActivity: "7m ago" },
    { name: "Agent-15", governorate: "Najaf", category: "Schools", status: "active", governmentRate: "Rate Level 4", recordsInserted: 891, lastActivity: "11m ago" },
    { name: "Agent-16", governorate: "Qadisiyyah", category: "Co-working Spaces", status: "idle", governmentRate: "Rate Level 5", recordsInserted: 156, lastActivity: "6h ago" },
    { name: "Agent-17", governorate: "Saladin", category: "Entertainment", status: "active", governmentRate: "Rate Level 5", recordsInserted: 743, lastActivity: "18m ago" },
    { name: "Agent-18", governorate: "Diyala", category: "Tourism", status: "active", governmentRate: "Rate Level 5", recordsInserted: 512, lastActivity: "22m ago" },
    { name: "QC Overseer", governorate: "QC Overseer", category: "Quality Control", status: "active", governmentRate: "Supervisory", recordsInserted: 15420, lastActivity: "1m ago" },
  ];


  let activeDiscoveryRun: Promise<void> | null = null;
  let activeDiscoveryRunId: string | null = null;


  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/agents", (req, res) => {
    res.json(agents);
  });

  app.post("/api/orchestrator/start", (req, res) => {
    agents = agents.map(a => ({ ...a, status: "running" }));
    res.json({ status: "started", agents });
  });

  app.post("/api/orchestrator/stop", (req, res) => {
    agents = agents.map(a => ({ ...a, status: "idle" }));
    res.json({ status: "stopped", agents });
  });

  // Endpoint to manually trigger a governor
  app.post("/api/agents/:agentName/run", async (req, res) => {
    const { agentName } = req.params;
    try {
      // In a real app, this would be triggered by a cron job or background worker
      // We run it asynchronously so we don't block the response
      runGovernor(agentName).catch(console.error);
      res.json({ status: "started", agentName });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/discovery/run", async (req, res) => {
    const { agentName } = req.body || {};

    if (activeDiscoveryRun) {
      return res.status(409).json({
        ok: false,
        error: "A discovery run is already in progress",
        runId: activeDiscoveryRunId,
      });
    }

    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeDiscoveryRunId = runId;

    try {
      activeDiscoveryRun = (async () => {
        try {
          if (agentName) {
            return await runGovernor(agentName);
          }
          return await runGovernor("Agent-01");
        } finally {
          activeDiscoveryRun = null;
          activeDiscoveryRunId = null;
        }
      })();

      if ((req.query?.mode || "direct") === "direct") {
        const runResult: any = await activeDiscoveryRun;
        if (runResult?.status === "no_task") {
          return res.status(409).json({ ok: false, runId, mode: "direct", status: "no_task", error: "No pending agent_tasks available" });
        }
        return res.json({ ok: true, runId, mode: "direct", status: runResult?.status || "completed", result: runResult });
      }

      return res.status(202).json({ ok: true, runId, mode: "async", status: "running" });
    } catch (error: any) {
      activeDiscoveryRun = null;
      activeDiscoveryRunId = null;
      console.error("Discovery run failed:", error);
      return res.status(500).json({ ok: false, error: error?.message || "Discovery run failed", runId });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
