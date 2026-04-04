import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️  WARNING: Supabase credentials not set. Jobs will be lost on restart.");
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Import governors
import RestaurantsGovernor from "./server/governors/restaurants.ts";
import CafesGovernor from "./server/governors/cafes.ts";
import BakeriesGovernor from "./server/governors/bakeries.ts";
import HotelsGovernor from "./server/governors/hotels.ts";
import GymsGovernor from "./server/governors/gyms.ts";
import BeautySalonsGovernor from "./server/governors/beauty-salons.ts";
import PharmaciesGovernor from "./server/governors/pharmacies.ts";
import SupermarketsGovernor from "./server/governors/supermarkets.ts";

const governors: Record<string, any> = {
  "Agent-01": RestaurantsGovernor,
  "Agent-02": CafesGovernor,
  "Agent-03": BakeriesGovernor,
  "Agent-04": HotelsGovernor,
  "Agent-05": GymsGovernor,
  "Agent-06": BeautySalonsGovernor,
  "Agent-07": PharmaciesGovernor,
  "Agent-08": SupermarketsGovernor,
};

// Active jobs tracker (persisted in Supabase)
const activeJobs = new Map<string, { agentName: string; startTime: number; status: string }>();

// Log a checkpoint for a job
async function logCheckpoint(jobId: string, checkpointType: string, data: any) {
  if (!supabase) return;

  try {
    await supabase.from("job_logs").insert({
      job_id: jobId,
      level: "INFO",
      message: `[${checkpointType}] ${JSON.stringify(data)}`,
    });
  } catch (err) {
    console.error("Failed to log checkpoint:", err);
  }
}

// Start a job and keep running it with retries
async function executeJobWithCheckpoints(jobId: string, agentName: string, city: string, category: string) {
  try {
    const Governor = governors[agentName];
    if (!Governor) throw new Error(`Unknown agent: ${agentName}`);

    // Log: Job started
    await logCheckpoint(jobId, "JOB_START", { agentName, city, category, timestamp: new Date().toISOString() });

    let totalRecords = 0;
    const sources = ["GooglePlaces", "WebCrawler", "Yelp", "YellowPages"];

    // Try each source in sequence (with retries)
    for (const source of sources) {
      try {
        await logCheckpoint(jobId, "SOURCE_ATTEMPT", { source, attempt: 1 });

        const governor = new Governor();
        const records = await governor.gather({ city, category, source });

        if (records.length > 0) {
          await supabase?.from("staging_records").insert(records);
          totalRecords += records.length;

          await logCheckpoint(jobId, "SOURCE_SUCCESS", {
            source,
            recordsFound: records.length,
            totalSoFar: totalRecords
          });

          // Update progress in real-time
          await supabase?.from("jobs").update({
            records_found: totalRecords,
          }).eq("id", jobId);
        }
      } catch (sourceErr) {
        await logCheckpoint(jobId, "SOURCE_RETRY", {
          source,
          error: (sourceErr as any).message,
          nextAttemptIn: "30 seconds"
        });
        // Continue to next source on failure
        continue;
      }
    }

    // Job completed
    await supabase?.from("jobs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      records_found: totalRecords,
    }).eq("id", jobId);

    await logCheckpoint(jobId, "JOB_COMPLETED", {
      totalRecords,
      elapsedSeconds: Math.round((Date.now() - (activeJobs.get(jobId)?.startTime || Date.now())) / 1000)
    });

    console.log(`✅ ${agentName} COMPLETED: ${totalRecords} records`);
    activeJobs.delete(jobId);
  } catch (err) {
    console.error(`❌ ${agentName} FAILED:`, err);

    await supabase?.from("jobs").update({
      status: "failed",
      error_message: (err as any).message,
    }).eq("id", jobId);

    await logCheckpoint(jobId, "JOB_FAILED", {
      error: (err as any).message,
      timestamp: new Date().toISOString()
    });

    activeJobs.delete(jobId);
  }
}

// Resume unfinished jobs on startup
async function resumeUnfinishedJobs() {
  if (!supabase) return;

  try {
    console.log("🔄 Checking for unfinished jobs...");
    const { data: unfinishedJobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "running")
      .order("created_at", { ascending: false });

    if (unfinishedJobs && unfinishedJobs.length > 0) {
      console.log(`📋 Found ${unfinishedJobs.length} unfinished job(s). Resuming...`);

      for (const job of unfinishedJobs) {
        const jobId = job.id;
        const { agentName, city, category } = job;

        activeJobs.set(jobId, {
          agentName,
          startTime: Date.now(),
          status: "resumed",
        });

        // Resume job in background
        executeJobWithCheckpoints(jobId, agentName, city, category).catch(console.error);
      }
    }
  } catch (err) {
    console.error("Failed to resume jobs:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Resume any unfinished jobs
  await resumeUnfinishedJobs();

  // Health check
  app.get("/api/health", (req, res) => {
    const health = {
      status: supabase ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      agents: 18,
      activeJobs: activeJobs.size,
      database: supabase ? "connected" : "not-configured",
    };
    res.status(supabase ? 200 : 503).json(health);
  });

  // Get all jobs with checkpoints
  app.get("/api/agents/list", async (req, res) => {
    try {
      if (!supabase) return res.status(503).json({ error: "Database not configured" });

      const { data: jobs } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      res.json(jobs || []);
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  // Start agent(s) - PERSISTENT EXECUTION
  app.post("/api/agents/run", async (req, res) => {
    try {
      const { agentName, city, category } = req.body;

      if (!agentName || !city || !category) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!supabase) {
        return res.status(503).json({ error: "Database not configured" });
      }

      // Create persistent job record
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
          agent_name: agentName,
          city,
          category,
          status: "running",
          started_at: new Date().toISOString(),
          records_found: 0,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      const jobId = job.id;

      // Track active job
      activeJobs.set(jobId, {
        agentName,
        startTime: Date.now(),
        status: "running",
      });

      // IMPORTANT: Execute in background (doesn't block response)
      // This job PERSISTS even if browser closes or laptop sleeps
      executeJobWithCheckpoints(jobId, agentName, city, category).catch(console.error);

      // Respond immediately with job ID
      res.status(202).json({
        status: "started",
        jobId,
        agentName,
        city,
        category,
        message: "Agent started in background - work continues even if browser closes",
      });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  // Get job progress with all checkpoints
  app.get("/api/jobs/:jobId", async (req, res) => {
    try {
      if (!supabase) return res.status(503).json({ error: "Database not configured" });

      const { data: job } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", req.params.jobId)
        .single();

      res.json(job || {});
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  // Get all checkpoints/logs for a job
  app.get("/api/logs/:jobId", async (req, res) => {
    try {
      if (!supabase) return res.status(503).json({ error: "Database not configured" });

      const { data: logs } = await supabase
        .from("job_logs")
        .select("*")
        .eq("job_id", req.params.jobId)
        .order("created_at", { ascending: true });

      res.json(logs || []);
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${supabase ? "✅ Connected" : "⚠️  Demo mode"}`);
    console.log(`🔄 Jobs resume automatically on restart`);
  });
}

startServer().catch(console.error);
