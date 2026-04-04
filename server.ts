import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase admin client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️  WARNING: Supabase credentials not set. Running in demo mode.");
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Import governors (data collection agents)
import RestaurantsGovernor from "./server/governors/RestaurantsGovernor.ts";
import HotelsGovernor from "./server/governors/HotelsGovernor.ts";
import PharmaciesGovernor from "./server/governors/PharmaciesGovernor.ts";
import MedicalClinicsGovernor from "./server/governors/MedicalClinicsGovernor.ts";
import SupermarketsGovernor from "./server/governors/SupermarketsGovernor.ts";
import ClothingStoresGovernor from "./server/governors/ClothingStoresGovernor.ts";
import ElectronicsGovernor from "./server/governors/ElectronicsGovernor.ts";
import CarDealersGovernor from "./server/governors/CarDealersGovernor.ts";
import RealEstateGovernor from "./server/governors/RealEstateGovernor.ts";
import SchoolsGovernor from "./server/governors/SchoolsGovernor.ts";
import UniversitiesGovernor from "./server/governors/UniversitiesGovernor.ts";
import GymsGovernor from "./server/governors/GymsGovernor.ts";
import BeautySalonsGovernor from "./server/governors/BeautySalonsGovernor.ts";
import LawFirmsGovernor from "./server/governors/LawFirmsGovernor.ts";
import EngineeringOfficesGovernor from "./server/governors/EngineeringOfficesGovernor.ts";
import TravelAgenciesGovernor from "./server/governors/TravelAgenciesGovernor.ts";
import BanksGovernor from "./server/governors/BanksGovernor.ts";
import FactoriesGovernor from "./server/governors/FactoriesGovernor.ts";

const governors: Record<string, any> = {
  "Agent-01": RestaurantsGovernor,
  "Agent-02": HotelsGovernor,
  "Agent-03": PharmaciesGovernor,
  "Agent-04": MedicalClinicsGovernor,
  "Agent-05": SupermarketsGovernor,
  "Agent-06": ClothingStoresGovernor,
  "Agent-07": ElectronicsGovernor,
  "Agent-08": CarDealersGovernor,
  "Agent-09": RealEstateGovernor,
  "Agent-10": SchoolsGovernor,
  "Agent-11": UniversitiesGovernor,
  "Agent-12": GymsGovernor,
  "Agent-13": BeautySalonsGovernor,
  "Agent-14": LawFirmsGovernor,
  "Agent-15": EngineeringOfficesGovernor,
  "Agent-16": TravelAgenciesGovernor,
  "Agent-17": BanksGovernor,
  "Agent-18": FactoriesGovernor,
};

const categories = [
  "Restaurants", "Hotels", "Pharmacies", "Medical Clinics", "Supermarkets",
  "Clothing Stores", "Electronics", "Car Dealers", "Real Estate", "Schools",
  "Universities", "Gyms", "Beauty Salons", "Law Firms", "Engineering Offices",
  "Travel Agencies", "Banks", "Factories"
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    const health = {
      status: supabase ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      agents: 18,
      database: supabase ? "connected" : "not-configured",
      message: supabase
        ? "All systems operational - ready for data collection"
        : "⚠️ Supabase not configured. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    };
    res.status(supabase ? 200 : 503).json(health);
  });

  // Get all agents/jobs
  app.get("/api/agents/list", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({ error: "Database not configured" });
      }
      const { data, error } = await supabase.from("jobs").select("*");
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  // Start agent run
  app.post("/api/agents/run", async (req, res) => {
    try {
      const { agentName, city, category } = req.body;

      if (!agentName || !city || !category) {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["agentName", "city", "category"],
          example: { agentName: "Agent-01", city: "Baghdad", category: "Restaurants" }
        });
      }

      // Validate agent name format
      if (!agentName.match(/^Agent-\d{2}$/)) {
        return res.status(400).json({
          error: "Invalid agentName format",
          expected: "Agent-01 through Agent-18",
          received: agentName
        });
      }

      if (!supabase) {
        return res.status(503).json({ error: "Database not configured" });
      }

      // Create job record
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
          agent_name: agentName,
          city,
          category,
          status: "running",
          started_at: new Date().toISOString(),
          records_found: 0
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Run governor asynchronously (fire-and-forget)
      (async () => {
        try {
          const Governor = governors[agentName];
          if (!Governor) {
            const validAgents = Object.keys(governors).join(", ");
            throw new Error(`Unknown agent: ${agentName}. Valid: ${validAgents}`);
          }

          const governor = new Governor();
          const records = await governor.gather({ city, category });

          // Insert collected records
          if (records.length > 0) {
            await supabase.from("staging_records").insert(records);
          }

          // Update job status
          await supabase
            .from("jobs")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              records_found: records.length
            })
            .eq("id", job.id);

          console.log(`✅ ${agentName} completed: ${records.length} records`);
        } catch (err) {
          console.error(`❌ ${agentName} failed:`, err);
          await supabase
            .from("jobs")
            .update({
              status: "failed",
              error_message: (err as any).message
            })
            .eq("id", job.id);
        }
      })();

      res.status(202).json({
        status: "started",
        jobId: job.id,
        agentName,
        city,
        category,
        message: "Agent run initiated - check /api/agents/list for status"
      });
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
    }
  });

  // Get job logs
  app.get("/api/logs/:jobId", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({ error: "Database not configured" });
      }
      const { data, error } = await supabase
        .from("job_logs")
        .select("*")
        .eq("job_id", req.params.jobId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      res.status(500).json({ error: (err as any).message });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${supabase ? "✅ Connected to Supabase" : "⚠️  Demo mode (no DB)"}`);
  });
}

startServer().catch(console.error);
