import express from "express";
import { createServer as createViteServer } from "vite";
import { runGovernor } from "./server/governors/index.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock agent state
  let agents: any[] = [
    { name: "Agent-01", governorate: "Baghdad", status: "idle" },
    { name: "Agent-02", governorate: "Erbil", status: "idle" },
    { name: "Agent-03", governorate: "Basra", status: "idle" },
    { name: "Agent-04", governorate: "Nineveh", status: "idle" },
    { name: "Agent-05", governorate: "Sulaymaniyah", status: "idle" },
  ];

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
