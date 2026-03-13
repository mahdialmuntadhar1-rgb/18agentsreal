import express from "express";
import { createServer as createViteServer } from "vite";
import { orchestrator } from "./server/orchestrator.js";
import { GOVERNORATES, type Governorate } from "./server/types.js";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", agents: orchestrator.listAgents().length });
  });

  app.get("/api/agents", (_req, res) => {
    res.json({ agents: orchestrator.listAgents(), governorates: GOVERNORATES });
  });

  app.post("/api/agents/:governorate/run", async (req, res) => {
    const governorate = req.params.governorate as Governorate;
    if (!GOVERNORATES.includes(governorate)) {
      res.status(404).json({ error: `Unknown governorate ${governorate}` });
      return;
    }

    const result = await orchestrator.runAgent(governorate);
    res.json({ governorate, ...result });
  });

  app.post("/api/orchestrator/start", async (_req, res) => {
    orchestrator.runAllContinuously().catch((error) => {
      console.error("Orchestrator stopped with error", error);
    });
    res.json({ status: "started" });
  });

  app.post("/api/orchestrator/stop", (_req, res) => {
    orchestrator.stop();
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
