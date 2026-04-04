import express from 'express';
import { supabaseAdmin } from './supabase-admin.ts';

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

    const payload = {
      governorate,
      city,
      category,
      status: 'queued',
      assigned_agent_id: null,
      attempt_count: 0,
      max_attempts,
      claimed_at: null,
      started_at: null,
      finished_at: null,
      last_heartbeat_at: null,
      failure_reason: null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from('jobs').insert(payload).select('*').single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json(data);
  });

  const port = Number(process.env.PORT || 4100);
  app.listen(port, () => {
    console.log(`[runtime] API listening on :${port}`);
  });
};
