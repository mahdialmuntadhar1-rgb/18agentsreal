import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mock database for the API
  let agents = [
    {
      id: "agent-1",
      governorate: "Baghdad",
      status: "IDLE",
      progress: 0,
      recordsFound: 0,
      lastUpdated: Date.now(),
      agentName: "Agent-01",
      city: "Karkh",
      category: "Restaurants"
    },
    {
      id: "agent-2",
      governorate: "Erbil",
      status: "IDLE",
      progress: 0,
      recordsFound: 0,
      lastUpdated: Date.now(),
      agentName: "Agent-02",
      city: "Ankawa",
      category: "Hotels"
    },
    {
      id: "agent-3",
      governorate: "Basra",
      status: "IDLE",
      progress: 0,
      recordsFound: 0,
      lastUpdated: Date.now(),
      agentName: "Agent-03",
      city: "Zubair",
      category: "Pharmacies"
    },
    {
      id: "agent-4",
      governorate: "Najaf",
      status: "IDLE",
      progress: 0,
      recordsFound: 0,
      lastUpdated: Date.now(),
      agentName: "Agent-04",
      city: "Old City",
      category: "Medical Clinics"
    }
  ];

  // Initialize all 18 agents if not present
  const categories = [
    'Restaurants', 'Hotels', 'Pharmacies', 'Medical Clinics', 'Supermarkets',
    'Clothing Stores', 'Electronics', 'Car Dealers', 'Real Estate', 'Schools',
    'Universities', 'Gyms', 'Beauty Salons', 'Law Firms', 'Engineering Offices',
    'Travel Agencies', 'Banks', 'Factories'
  ];

  if (agents.length < 18) {
    const existingCategories = agents.map(a => a.category);
    categories.forEach((cat, index) => {
      if (!existingCategories.includes(cat)) {
        agents.push({
          id: `agent-${index + 1}`,
          governorate: "Baghdad",
          status: "IDLE",
          progress: 0,
          recordsFound: 0,
          lastUpdated: Date.now(),
          agentName: `Agent-${(index + 1).toString().padStart(2, '0')}`,
          city: "Various",
          category: cat
        });
      }
    });
  }

  // API routes
  app.use(express.json());

  app.get("/api/agents/list", (req, res) => {
    res.json(agents);
  });

  app.post("/api/agents/start", (req, res) => {
    const { governorates, agentIds } = req.body;
    agents = agents.map(agent => {
      if (agentIds.includes(agent.id)) {
        return {
          ...agent,
          status: "RUNNING",
          progress: 0,
          recordsFound: 0,
          lastUpdated: Date.now(),
          governorate: governorates[0] || agent.governorate
        };
      }
      return agent;
    });
    res.json({ status: "ok", message: "Agents started" });
  });

  app.post("/api/agents/stop", (req, res) => {
    const { agentIds } = req.body;
    agents = agents.map(agent => {
      if (agentIds.includes(agent.id)) {
        return { ...agent, status: "IDLE", progress: 0, lastUpdated: Date.now() };
      }
      return agent;
    });
    res.json({ status: "ok", message: "Agents stopped" });
  });

  app.post("/api/agents/pause", (req, res) => {
    const { agentIds } = req.body;
    agents = agents.map(agent => {
      if (agentIds.includes(agent.id)) {
        return { ...agent, status: "PAUSED", lastUpdated: Date.now() };
      }
      return agent;
    });
    res.json({ status: "ok", message: "Agents paused" });
  });

  app.post("/api/agents/resume", (req, res) => {
    const { agentIds } = req.body;
    agents = agents.map(agent => {
      if (agentIds.includes(agent.id)) {
        return { ...agent, status: "RUNNING", lastUpdated: Date.now() };
      }
      return agent;
    });
    res.json({ status: "ok", message: "Agents resumed" });
  });

  app.post("/api/agents/clear", (req, res) => {
    agents = agents.map(agent => ({
      ...agent,
      status: "IDLE",
      progress: 0,
      recordsFound: 0,
      lastUpdated: Date.now()
    }));
    res.json({ status: "ok", message: "All agents cleared" });
  });

  // Simulate progress for running agents
  setInterval(() => {
    agents = agents.map(agent => {
      if (agent.status === "RUNNING") {
        const newProgress = Math.min(100, agent.progress + Math.floor(Math.random() * 5));
        const newRecords = agent.recordsFound + (newProgress < 100 ? Math.floor(Math.random() * 10) : 0);
        return {
          ...agent,
          progress: newProgress,
          recordsFound: newRecords,
          status: newProgress === 100 ? "COMPLETED" : "RUNNING",
          lastUpdated: Date.now()
        };
      }
      return agent;
    });
  }, 3000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
