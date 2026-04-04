import express from 'express';
import { supabaseAdmin } from './supabase-admin.ts';

interface JobRequest {
  governorate: string;
  city: string;
  category: string;
  max_attempts?: number;
}

const normalizeJobInput = (input: JobRequest) => ({
  governorate: input.governorate.trim(),
  city: input.city.trim(),
  category: input.category.trim().toLowerCase(),
  max_attempts: Math.max(1, Number(input.max_attempts ?? 3)),
});

export const startApiServer = (): void => {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: '18agentsreal-runtime', at: new Date().toISOString() });
  });

  app.post('/jobs', async (req, res) => {
    const { governorate, city, category, max_attempts = 3 } = req.body ?? {};
    if (!governorate || !city || !category) {
      res.status(400).json({ error: 'governorate, city, category are required' });
      return;
    }

    const normalized = normalizeJobInput({ governorate, city, category, max_attempts });
    const payload = {
      ...normalized,
      status: 'queued',
      assigned_agent_id: null,
      attempt_count: 0,
      claimed_at: null,
      started_at: null,
      finished_at: null,
      last_heartbeat_at: null,
      failure_reason: null,
      failure_details: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .upsert(payload, { onConflict: 'governorate,city,category', ignoreDuplicates: true })
      .select('*')
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!data) {
      const { data: existing } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('governorate', normalized.governorate)
        .eq('city', normalized.city)
        .eq('category', normalized.category)
        .in('status', ['queued', 'running', 'retrying'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      res.status(200).json({ duplicate: true, job: existing ?? null });
      return;
    }

    res.status(201).json({ duplicate: false, job: data });
  });

  app.post('/jobs/bootstrap', async (req, res) => {
    const { governorates = [], cities = [], categories = [], max_attempts = 3 } = req.body ?? {};
    if (!Array.isArray(governorates) || !Array.isArray(cities) || !Array.isArray(categories)) {
      res.status(400).json({ error: 'governorates, cities, categories must be arrays' });
      return;
    }

    const jobs = [] as Array<ReturnType<typeof normalizeJobInput> & Record<string, unknown>>;
    for (const governorate of governorates) {
      for (const city of cities) {
        for (const category of categories) {
          if (!governorate || !city || !category) continue;
          jobs.push({
            ...normalizeJobInput({ governorate, city, category, max_attempts }),
            status: 'queued',
            assigned_agent_id: null,
            attempt_count: 0,
            claimed_at: null,
            started_at: null,
            finished_at: null,
            last_heartbeat_at: null,
            failure_reason: null,
            failure_details: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    if (jobs.length === 0) {
      res.status(400).json({ error: 'No valid job combinations produced' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .upsert(jobs, { onConflict: 'governorate,city,category', ignoreDuplicates: true })
      .select('id');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ requested: jobs.length, inserted: data?.length ?? 0, duplicates: jobs.length - (data?.length ?? 0) });
  });

  const port = Number(process.env.PORT || 4100);
  app.listen(port, () => {
    console.log(`[runtime] API listening on :${port}`);
  });
};
