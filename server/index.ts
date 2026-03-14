import express from "express";
import { runGovernor } from "./governors/index.js";

const app = express();

app.use(express.json());

let agents: Array<{ name: string; governorate: string; status: string }> = [
  { name: "Agent-01", governorate: "Baghdad", status: "idle" },
  { name: "Agent-02", governorate: "Erbil", status: "idle" },
  { name: "Agent-03", governorate: "Basra", status: "idle" },
  { name: "Agent-04", governorate: "Nineveh", status: "idle" },
  { name: "Agent-05", governorate: "Sulaymaniyah", status: "idle" },
];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/agents", (req, res) => {
  res.json(agents);
});

app.post("/api/orchestrator/start", (req, res) => {
  agents = agents.map((agent) => ({ ...agent, status: "running" }));
  res.json({ status: "started", agents });
});

app.post("/api/orchestrator/stop", (req, res) => {
  agents = agents.map((agent) => ({ ...agent, status: "idle" }));
  res.json({ status: "stopped", agents });
});

app.post("/api/agents/:agentName/run", async (req, res) => {
  const { agentName } = req.params;

  try {
    runGovernor(agentName).catch(console.error);
    res.json({ status: "started", agentName });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default app;
