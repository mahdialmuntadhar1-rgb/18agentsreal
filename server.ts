import express from "express";
import { createServer as createViteServer } from "vite";
import { runGovernor, getGovernorDefaults } from "./server/governors/index.js";
import { supabaseAdmin } from "./server/supabase-admin.js";

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

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/agents", (req, res) => {
    res.json(agents);
  });

  app.post('/api/orchestrator/start', async (_req, res) => {
    const { data: agents, error: fetchError } = await supabaseAdmin
      .from('agents')
      .select('agent_name, category, government_rate')
      .order('agent_name');

    if (fetchError) return res.status(500).json({ error: fetchError.message });

    const agentRows = (agents ?? []).filter((row) => row.agent_name);

    // Log the orchestrator start
    const logPromise = supabaseAdmin.from('agent_logs').insert({
      agent_name: 'system',
      action: 'orchestrator_start',
      details: `Queued ${agentRows.length} agent run(s)`,
      created_at: new Date().toISOString(),
    });

    // Update agent statuses
    const statusPromise = agentRows.length
      ? supabaseAdmin.from('agents').update({ status: 'running' }).in('agent_name', agentRows.map((r) => r.agent_name))
      : Promise.resolve({ error: null });

    let taskError = null;
    let createdTasks: { id: string | number; agent_name: string }[] = [];
    if (agentRows.length) {
      try {
        const { data, error } = await supabaseAdmin.from('agent_tasks').insert(
          agentRows.map((agent) => ({
            task_name: `orchestrator_${agent.agent_name}_${Date.now()}`,
            task_type: 'orchestrator_run',
            instruction: `Queued orchestrator run for ${agent.agent_name}`,
            assigned_to: agent.agent_name,
            agent_name: agent.agent_name,
            category: agent.category ?? 'restaurants',
            city: 'Baghdad', // Default city - agents table doesn't have city column
            government_rate: agent.government_rate ?? 'Rate Level 1',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
        ).select('id, agent_name');
        
        taskError = error;
        createdTasks = data ?? [];
        if (taskError) {
          console.warn('agent_tasks insert failed (non-fatal):', taskError.message);
        }
      } catch (err: any) {
        console.warn('agent_tasks insert exception (non-fatal):', err.message);
      }
    }

    await Promise.all([logPromise, statusPromise]);

    // Actually trigger the governors in background to make the run "real"
    agentRows.forEach((agent) => {
      const associatedTask = createdTasks.find(t => t.agent_name === agent.agent_name);
      runGovernor(agent.agent_name, {
        id: associatedTask?.id,
        city: 'Baghdad', // Default city - agents table doesn't have city column
        category: agent.category ?? 'restaurants',
        government_rate: agent.government_rate ?? 'Rate Level 1',
      }).catch((err) => {
        console.error(`Orchestrator background run failed for ${agent.agent_name}:`, err.message);
      });
    });

    const { data: updatedAgents } = await supabaseAdmin.from('agents').select('*').order('agent_name');
    res.json({ 
      status: 'queued', 
      queuedAgents: agentRows.length, 
      agents: updatedAgents ?? [],
      taskWarning: taskError ? 'Task queue unavailable, but agents set to running' : null,
    });
  });

  app.post("/api/orchestrator/stop", (req, res) => {
    agents = agents.map(a => ({ ...a, status: "idle" }));
    res.json({ status: "stopped", agents });
  });

  // Endpoint to manually trigger a governor
  app.post("/api/agents/:agentName/run", async (req, res) => {
    const { agentName } = req.params;
    const defaults = getGovernorDefaults(agentName);

    // Try to create a task record, but don't block execution if it fails
    let taskId = `manual_${Date.now()}`;
    try {
      const { data: task, error: insertTaskError } = await supabaseAdmin
        .from('agent_tasks')
        .insert({
          task_name: `manual_${agentName}_${Date.now()}`,
          task_type: 'manual_run',
          instruction: `Manual governor run requested for ${agentName}`,
          assigned_to: agentName,
          agent_name: agentName,
          category: defaults.category,
          city: defaults.city,
          government_rate: defaults.governmentRate,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, category, city, government_rate')
        .single();

      if (!insertTaskError && task) {
        taskId = task.id;
        // Run governor in background with task context
        runGovernor(agentName, {
          id: task.id,
          city: task.city,
          category: task.category,
          government_rate: task.government_rate,
        })
          .then(async () => {
            try {
              await supabaseAdmin
                .from('agent_tasks')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', task.id);
            } catch {}
            try {
              await supabaseAdmin.from('agent_logs').insert({
                agent_name: agentName,
                action: 'manual_run_completed',
                record_id: task.id,
                details: `Manual governor run completed for ${agentName}`,
                created_at: new Date().toISOString(),
              });
            } catch {}
          })
          .catch(async (error) => {
            try {
              await supabaseAdmin
                .from('agent_tasks')
                .update({ status: 'failed', updated_at: new Date().toISOString() })
                .eq('id', task.id);
            } catch {}
            try {
              await supabaseAdmin.from('agent_logs').insert({
                agent_name: agentName,
                action: 'manual_run_failed',
                record_id: task.id,
                details: `Manual governor run failed for ${agentName}: ${error.message}`,
                created_at: new Date().toISOString(),
              });
            } catch {}
          });

        // Update task to running
        try {
          await supabaseAdmin
            .from('agent_tasks')
            .update({ status: 'running', updated_at: new Date().toISOString() })
            .eq('id', task.id);
        } catch {}
      } else {
        // Task creation failed, run directly without task context
        console.warn(`Task creation failed for ${agentName}, running directly:`, insertTaskError?.message);
        runGovernor(agentName, {
          city: defaults.city,
          category: defaults.category,
          government_rate: defaults.governmentRate,
        }).catch((error) => {
          console.error(`Direct run failed for ${agentName}:`, error.message);
        });
      }
    } catch (err: any) {
      // Task table issue, run directly
      console.warn(`Task creation exception for ${agentName}, running directly:`, err.message);
      runGovernor(agentName, {
        city: defaults.city,
        category: defaults.category,
        government_rate: defaults.governmentRate,
      }).catch((error) => {
        console.error(`Direct run failed for ${agentName}:`, error.message);
      });
    }

    res.json({ status: 'running', agentName, taskId });
  });

  // ===== MULTI-SOURCE DISCOVERY API =====

  // GET /api/sources - List available data sources
  app.get('/api/sources', async (_req, res) => {
    const sources = [
      {
        id: 'gemini',
        name: 'Gemini AI Research',
        description: 'AI-powered web research for Iraqi businesses',
        enabled: !!process.env.GEMINI_API_KEY,
        reliability: 'high',
        coverage: 'Iraq-wide',
        rateLimit: '60 requests/minute',
      },
      {
        id: 'google-places',
        name: 'Google Places',
        description: 'Global business directory via Google',
        enabled: !!process.env.GOOGLE_PLACES_API_KEY,
        reliability: 'medium',
        coverage: 'Limited in Iraq',
        rateLimit: '100 requests/day (free tier)',
      },
      {
        id: 'yelp',
        name: 'Yelp',
        description: 'Review and business data platform',
        enabled: !!process.env.YELP_API_KEY,
        reliability: 'low',
        coverage: 'Not available in Iraq',
        rateLimit: '5000 requests/day',
      },
      {
        id: 'manual',
        name: 'Manual Import',
        description: 'User-uploaded CSV data',
        enabled: true,
        reliability: 'high',
        coverage: 'User-dependent',
        rateLimit: 'N/A',
      },
    ];
    res.json({ sources });
  });

  // POST /api/discovery/run - Run multi-source discovery
  app.post('/api/discovery/run', async (req, res) => {
    const { city, category, sources, limit = 10 } = req.body;

    if (!city || !category) {
      return res.status(400).json({ error: 'Missing required fields: city, category' });
    }

    const runId = `discovery_${Date.now()}`;

    // Create discovery run record
    await supabaseAdmin.from('agent_logs').insert({
      agent_name: 'discovery-orchestrator',
      action: 'discovery_start',
      details: `Multi-source discovery started for ${category} in ${city}. Sources: ${(sources || ['gemini']).join(', ')}. Limit: ${limit}`,
      created_at: new Date().toISOString(),
    });

    // Find best available agent for this category/city
    const agentMapping: Record<string, string> = {
      restaurants: 'Agent-01',
      cafes: 'Agent-02',
      bakeries: 'Agent-03',
      hotels: 'Agent-04',
      gyms: 'Agent-05',
      beauty_salons: 'Agent-06',
      pharmacies: 'Agent-07',
      supermarkets: 'Agent-08',
    };

    const agentName = agentMapping[category.toLowerCase()] || 'Agent-01';

    // Trigger the agent run
    try {
      await runGovernor(agentName, {
        city,
        category,
        government_rate: 'Rate Level 1',
      });

      await supabaseAdmin.from('agent_logs').insert({
        agent_name: 'discovery-orchestrator',
        action: 'discovery_complete',
        details: `Discovery run ${runId} completed for ${category} in ${city}`,
        created_at: new Date().toISOString(),
      });

      // Get count of newly added businesses
      const { count } = await supabaseAdmin
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('city', city)
        .eq('category', category.toLowerCase());

      res.json({
        runId,
        status: 'completed',
        city,
        category,
        sourcesUsed: sources || ['gemini'],
        totalFound: count || 0,
        message: `Discovery completed. Found ${count || 0} businesses in ${city}.`,
      });
    } catch (error: any) {
      await supabaseAdmin.from('agent_logs').insert({
        agent_name: 'discovery-orchestrator',
        action: 'discovery_failed',
        details: `Discovery run ${runId} failed: ${error.message}`,
        created_at: new Date().toISOString(),
      });

      res.status(500).json({
        runId,
        status: 'failed',
        error: error.message,
      });
    }
  });

  // GET /api/businesses - Get businesses with pagination
  app.get('/api/businesses', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const city = req.query.city as string;
    const category = req.query.category as string;
    const source = req.query.source as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = supabaseAdmin
      .from('businesses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (city && city !== 'All') query = query.eq('city', city);
    if (category && category !== 'All') query = query.eq('category', category.toLowerCase());
    if (source && source !== 'All') query = query.eq('source_name', source);
    if (status && status !== 'All') query = query.eq('verification_status', status.toLowerCase());
    if (search) query = query.ilike('business_name', `%${search}%`);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    res.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  });

  // GET /api/businesses/:id - Get single business
  app.get('/api/businesses/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('businesses').select('*').eq('id', id).single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Business not found' });

    res.json(data);
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
