import express from "express";
import { createServer as createViteServer } from "vite";
import { runGovernor } from "./server/governors/index.js";
import { AgentOrchestrator } from "./server/orchestrator.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const orchestrator = new AgentOrchestrator();

  // API routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/agents", (_req, res) => {
    res.json(orchestrator.getAgents());
  });

  app.post("/api/orchestrator/start", async (req, res) => {
  app.post("/api/orchestrator/start", async (_req, res) => {
    const result = await orchestrator.startAll();
    res.json(result);
  });

  app.post("/api/orchestrator/stop", async (_req, res) => {
    const result = await orchestrator.stopAll();
    res.json(result);
  });

  // Endpoint to manually trigger a governor
  app.post("/api/agents/:agentName/run", async (req, res) => {
    const { agentName } = req.params;
    try {
      // Trigger asynchronously so we don't block the response
      runGovernor(agentName).catch(console.error);
      res.json({ status: "started", agentName });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
    console.log("Starting enrichment agents automatically...");
    void orchestrator.startAll();
  });
}

startServer();
