import express from "express";
import { createServer as createViteServer } from "vite";
import { runGovernor } from "./server/governors/index.js";
import { runAllGovernors } from "./server/orchestrator.js";
import { runAllGovernors, runGovernor } from "./server/governors/index.js";
import { securityMiddleware } from "./server/security-middleware.js";
import { llmRouter } from "./server/llm/llm-router.js";
import { supabaseAdmin } from "./server/supabase-admin.js";

type AgentRecord = {
  agent_name: string;
  category: string | null;
  status: string;
  records_collected: number;
  target: number;
  errors: number;
  government_rate: string | null;
  last_run: string | null;
  updated_at: string | null;
};

const DEFAULT_AGENTS: Array<{
  agent_name: string;
  category: string;
  target: number;
  government_rate: string;
}> = [
  { agent_name: "Agent-01", category: "restaurants", target: 1000, government_rate: "Rate Level 1" },
  { agent_name: "Agent-02", category: "cafes", target: 1000, government_rate: "Rate Level 1" },
  { agent_name: "Agent-03", category: "bakeries", target: 1000, government_rate: "Rate Level 1" },
  { agent_name: "Agent-04", category: "hotels", target: 1000, government_rate: "Rate Level 1" },
  { agent_name: "Agent-05", category: "gyms", target: 1000, government_rate: "Rate Level 2" },
  { agent_name: "Agent-06", category: "beauty_salons", target: 1000, government_rate: "Rate Level 2" },
  { agent_name: "Agent-07", category: "pharmacies", target: 1000, government_rate: "Rate Level 2" },
  { agent_name: "Agent-08", category: "supermarkets", target: 1000, government_rate: "Rate Level 2" },
  { agent_name: "Agent-09", category: "restaurants", target: 1000, government_rate: "Rate Level 3" },
  { agent_name: "Agent-10", category: "cafes", target: 1000, government_rate: "Rate Level 3" },
  { agent_name: "Agent-11", category: "bakeries", target: 1000, government_rate: "Rate Level 3" },
  { agent_name: "Agent-12", category: "hotels", target: 1000, government_rate: "Rate Level 3" },
  { agent_name: "Agent-13", category: "gyms", target: 1000, government_rate: "Rate Level 4" },
  { agent_name: "Agent-14", category: "beauty_salons", target: 1000, government_rate: "Rate Level 4" },
  { agent_name: "Agent-15", category: "pharmacies", target: 1000, government_rate: "Rate Level 4" },
  { agent_name: "Agent-16", category: "supermarkets", target: 1000, government_rate: "Rate Level 5" },
  { agent_name: "Agent-17", category: "restaurants", target: 1000, government_rate: "Rate Level 5" },
  { agent_name: "Agent-18", category: "cafes", target: 1000, government_rate: "Rate Level 5" },
  { agent_name: "QC Overseer", category: "quality_control", target: 1000, government_rate: "Supervisory" },
];

let isOrchestratorRunning = false;

async function ensureAgentsSeeded() {
  const { count, error: countError } = await supabaseAdmin
    .from("agents")
    .select("*", { count: "exact", head: true });
  if (countError) {
    throw countError;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { error } = await supabaseAdmin.from("agents").insert(
    DEFAULT_AGENTS.map((agent) => ({
      ...agent,
      status: "idle",
      records_collected: 0,
      errors: 0,
    }))
  );
  if (error) {
    throw error;
  }
}

async function fetchAgentState(): Promise<AgentRecord[]> {
  await ensureAgentsSeeded();
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select("agent_name, category, status, records_collected, target, errors, government_rate, last_run, updated_at")
    .order("agent_name", { ascending: true });
  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function createApp(options?: { withFrontend?: boolean }) {
  const app = express();
  const withFrontend = options?.withFrontend ?? true;
  const PORT = 3000;

  app.use(express.json());
  app.use(securityMiddleware());

  if (process.env.NODE_ENV === "production" && !process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  app.use("/api/llm", llmRouter);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/agents", (req, res) => {
    fetchAgentState()
      .then((agents) => {
        res.json({ orchestratorRunning: isOrchestratorRunning, agents });
      })
      .catch((error: Error) => {
        res.status(500).json({ error: error.message });
      });
  });

  app.post("/api/orchestrator/start", (req, res) => {
    agents = agents.map(a => ({ ...a, status: "running" }));
    runAllGovernors().catch((error) => {
      console.error("Failed to start orchestrator:", error);
    });
    res.json({ status: "started", agents });
    if (isOrchestratorRunning) {
      res.status(409).json({ status: "already_running" });
      return;
    }

    isOrchestratorRunning = true;
    runAllGovernors()
      .catch((error) => {
        console.error("Orchestrator failed:", error);
      })
      .finally(() => {
        isOrchestratorRunning = false;
      });

    res.json({ status: "started" });
  });

  app.post("/api/orchestrator/stop", async (req, res) => {
    isOrchestratorRunning = false;
    const { error } = await supabaseAdmin
      .from("agents")
      .update({ status: "idle", updated_at: new Date().toISOString() })
      .in(
        "status",
        ["active", "running", "processing"]
      );

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ status: "stopped" });
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
  if (withFrontend && process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (withFrontend) {
    app.use(express.static("dist"));
  }

  return { app, PORT };
}

async function startServer() {
  const { app, PORT } = await createApp({ withFrontend: true });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

const isDirectExecution = process.argv[1] && new URL(import.meta.url).pathname === process.argv[1];
if (isDirectExecution) {
  startServer();
}
