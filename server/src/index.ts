import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { supabase } from './lib/supabase.js';
import { scrapeQueue, startAllAgents } from './queue.js';
import { IRAQI_CITIES } from './types.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

app.get('/api/agents/status', async (_req, res) => {
  const { data } = await supabase.from('agent_jobs').select('*').order('created_at', { ascending: false }).limit(50);
  res.json(data);
});

app.post('/api/agents/start', async (req, res) => {
  const { city } = req.body;

  if (!IRAQI_CITIES.includes(city)) {
    return res.status(400).json({ error: 'Invalid city' });
  }

  const job = await scrapeQueue.add({ city, jobId: null });
  res.json({ jobId: job.id, message: `Agent for ${city} started` });
});

app.post('/api/agents/start-all', async (_req, res) => {
  const jobs = await startAllAgents();
  res.json({ jobIds: jobs.map((j) => j.id), message: 'All 18 agents started' });
});

app.get('/api/agents/logs/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const { data } = await supabase.from('agent_logs').select('*').eq('job_id', jobId).order('timestamp', { ascending: true });
  res.json(data);
});

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  const channel = supabase
    .channel('agent-logs')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_logs' }, (payload) => {
      ws.send(JSON.stringify(payload.new));
    })
    .subscribe();

  ws.on('close', () => {
    supabase.removeChannel(channel);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket available on ws://localhost:${PORT}/ws`);
});
