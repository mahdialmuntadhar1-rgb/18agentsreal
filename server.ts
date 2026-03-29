import express from 'express';
import { createServer as createViteServer } from 'vite';
import { runGovernor } from './server/governors/index.js';
import { supabaseAdmin } from './server/supabase-admin.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    const [agentsCheck, tasksCheck, logsCheck] = await Promise.all([
      supabaseAdmin.from('agents').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('agent_tasks').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('agent_logs').select('id', { count: 'exact', head: true }),
    ]);

    const errors = [agentsCheck.error, tasksCheck.error, logsCheck.error].filter(Boolean);
    res.json({
      status: errors.length ? 'degraded' : 'ok',
      persistence: 'supabase',
      tables: {
        agents: agentsCheck.error ? 'unreachable' : 'ok',
        agent_tasks: tasksCheck.error ? 'unreachable' : 'ok',
        agent_logs: logsCheck.error ? 'unreachable' : 'ok',
      },
      detail: errors.map((e) => e?.message).join('; ') || null,
    });
  });

  app.get('/api/agents', async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('agents').select('*').order('agent_name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data ?? []);
  });

  app.post('/api/orchestrator/start', async (_req, res) => {
    const { data: agents, error: fetchError } = await supabaseAdmin
      .from('agents')
      .select('agent_name')
      .order('agent_name');

    if (fetchError) return res.status(500).json({ error: fetchError.message });

    const agentNames = (agents ?? []).map((row) => row.agent_name).filter(Boolean);

    const [{ error: taskError }, { error: statusError }, { error: logError }] = await Promise.all([
      agentNames.length
        ? supabaseAdmin.from('agent_tasks').insert(
            agentNames.map((agentName) => ({
              type: 'orchestrator_run',
              instruction: `Queued orchestrator run for ${agentName}`,
              status: 'pending',
              created_at: new Date().toISOString(),
            })),
          )
        : Promise.resolve({ error: null }),
      supabaseAdmin.from('agents').update({ status: 'running' }).in('agent_name', agentNames),
      supabaseAdmin.from('agent_logs').insert({
        agent_id: 'system',
        type: 'info',
        message: `Orchestrator queued ${agentNames.length} agent run(s)`,
        created_at: new Date().toISOString(),
      }),
    ]);

    const error = taskError || statusError || logError;
    if (error) return res.status(500).json({ error: error.message });

    const { data: updatedAgents } = await supabaseAdmin.from('agents').select('*').order('agent_name');
    res.json({ status: 'queued', queuedAgents: agentNames.length, agents: updatedAgents ?? [] });
  });

  app.post('/api/orchestrator/stop', async (_req, res) => {
    const [{ error: statusError }, { error: taskError }, { error: logError }] = await Promise.all([
      supabaseAdmin.from('agents').update({ status: 'idle' }).neq('agent_name', ''),
      supabaseAdmin
        .from('agent_tasks')
        .update({ status: 'failed' })
        .in('status', ['pending', 'running']),
      supabaseAdmin.from('agent_logs').insert({
        agent_id: 'system',
        type: 'warning',
        message: 'Orchestrator stop requested; pending/running tasks marked failed',
        created_at: new Date().toISOString(),
      }),
    ]);

    const error = statusError || taskError || logError;
    if (error) return res.status(500).json({ error: error.message });

    const { data } = await supabaseAdmin.from('agents').select('*').order('agent_name');
    res.json({ status: 'stopped', agents: data ?? [] });
  });

  app.post('/api/agents/:agentName/run', async (req, res) => {
    const { agentName } = req.params;

    const { data: task, error: insertTaskError } = await supabaseAdmin
      .from('agent_tasks')
      .insert({
        type: 'manual_run',
        instruction: `Manual governor run requested for ${agentName}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertTaskError) return res.status(500).json({ error: insertTaskError.message });

    runGovernor(agentName)
      .then(async () => {
        await supabaseAdmin.from('agent_tasks').update({ status: 'completed' }).eq('id', task.id);
        await supabaseAdmin.from('agent_logs').insert({
          agent_id: agentName,
          type: 'success',
          message: `Manual governor run completed for ${agentName}`,
          created_at: new Date().toISOString(),
        });
      })
      .catch(async (error) => {
        await supabaseAdmin.from('agent_tasks').update({ status: 'failed' }).eq('id', task.id);
        await supabaseAdmin.from('agent_logs').insert({
          agent_id: agentName,
          type: 'error',
          message: `Manual governor run failed for ${agentName}: ${error.message}`,
          created_at: new Date().toISOString(),
        });
      });

    const { error: updateTaskError } = await supabaseAdmin.from('agent_tasks').update({ status: 'running' }).eq('id', task.id);
    if (updateTaskError) return res.status(500).json({ error: updateTaskError.message });

    res.json({ status: 'running', agentName, taskId: task.id });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
