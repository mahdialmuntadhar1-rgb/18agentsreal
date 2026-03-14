import express from "express";
import { createServer as createViteServer } from "vite";
import { agentManager } from "./server/services/agents/agentManager.js";
import { allAgents } from "./server/services/agents/registeredAgents.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  agentManager.registerAgents(allAgents);
  agentManager.startScheduler();

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/agents", (_req, res) => {
    res.json(agentManager.listAgents());
  });

  app.get("/api/agents/:agentId/status", (req, res) => {
    res.json({ agentId: req.params.agentId, status: agentManager.getAgentStatus(req.params.agentId) });
  });

  app.get("/api/agents/:agentId/logs", async (req, res) => {
    try {
      const logs = await agentManager.getLogs(req.params.agentId);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/:agentId/run", async (req, res) => {
    try {
      const result = await agentManager.runAgent(req.params.agentId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/agents/:agentId/stop", async (req, res) => {
    try {
      await agentManager.stopAgent(req.params.agentId);
      res.json({ status: "stopped" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/agents/:agentId", async (req, res) => {
    const { enabled, schedule } = req.body;
    try {
      if (typeof enabled === "boolean") {
        await agentManager.setEnabled(req.params.agentId, enabled);
      }
      if (schedule) {
        await agentManager.setSchedule(req.params.agentId, schedule);
      }
      res.json({ ok: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/orchestrator/start", async (_req, res) => {
    const launched = await Promise.allSettled(agentManager.listAgents().filter((a) => a.enabled).map((a) => agentManager.runAgent(a.id)));
    res.json({ status: "started", launched: launched.length });
  });

  app.post("/api/orchestrator/stop", async (_req, res) => {
    await Promise.all(agentManager.listAgents().map((a) => agentManager.stopAgent(a.id)));
    res.json({ status: "stopped" });
  });

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
