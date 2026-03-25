import { AgentConfig, getAgentDashboard, runIraqAgent, stopAllAgents } from './agents/iraqAgent';
import { runAgent } from './agents/pipelineAgents';

export interface Env {
  GEMINI_API_KEY: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  EXPORT_SUPABASE_ANON_KEY?: string;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const AGENT_CONFIGS: AgentConfig[] = [
  { name: 'Agent-01', governorate: 'Baghdad', category: 'Restaurants', governmentRate: 'Rate Level 1' },
  { name: 'Agent-02', governorate: 'Basra', category: 'Cafes', governmentRate: 'Rate Level 1' },
  { name: 'Agent-03', governorate: 'Nineveh', category: 'Bakeries', governmentRate: 'Rate Level 1' },
  { name: 'Agent-04', governorate: 'Erbil', category: 'Hotels', governmentRate: 'Rate Level 1' },
  { name: 'Agent-05', governorate: 'Sulaymaniyah', category: 'Gyms', governmentRate: 'Rate Level 2' },
  { name: 'Agent-06', governorate: 'Kirkuk', category: 'Beauty Salons', governmentRate: 'Rate Level 2' },
  { name: 'Agent-07', governorate: 'Duhok', category: 'Barbershops', governmentRate: 'Rate Level 2' },
  { name: 'Agent-08', governorate: 'Anbar', category: 'Pharmacies', governmentRate: 'Rate Level 2' },
  { name: 'Agent-09', governorate: 'Babil', category: 'Supermarkets', governmentRate: 'Rate Level 3' },
  { name: 'Agent-10', governorate: 'Karbala', category: 'Electronics', governmentRate: 'Rate Level 3' },
  { name: 'Agent-11', governorate: 'Wasit', category: 'Clothing Stores', governmentRate: 'Rate Level 3' },
  { name: 'Agent-12', governorate: 'Dhi Qar', category: 'Car Services', governmentRate: 'Rate Level 3' },
  { name: 'Agent-13', governorate: 'Maysan', category: 'Dentists', governmentRate: 'Rate Level 4' },
  { name: 'Agent-14', governorate: 'Muthanna', category: 'Clinics', governmentRate: 'Rate Level 4' },
  { name: 'Agent-15', governorate: 'Najaf', category: 'Schools', governmentRate: 'Rate Level 4' },
  { name: 'Agent-16', governorate: 'Qadisiyyah', category: 'Co-working Spaces', governmentRate: 'Rate Level 5' },
  { name: 'Agent-17', governorate: 'Saladin', category: 'Entertainment', governmentRate: 'Rate Level 5' },
  { name: 'Agent-18', governorate: 'Diyala', category: 'Tourism', governmentRate: 'Rate Level 5' },
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function findAgent(name: string) {
  return AGENT_CONFIGS.find((agent) => agent.name.toLowerCase() === name.toLowerCase());
}

const REQUIRED_SECRETS: Array<keyof Env> = ['GEMINI_API_KEY', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

function getMissingEnv(env: Env): string[] {
  return REQUIRED_SECRETS.filter((key) => !String(env[key] ?? '').trim());
}

function getEnvHealth(env: Env) {
  const missing = getMissingEnv(env);
  const missingSet = new Set(missing);
  const present = REQUIRED_SECRETS.filter((secret) => !missingSet.has(secret));
  return { present, missing };
}

function missingSecretsResponse(env: Env): Response | null {
  const missing = getMissingEnv(env);
  if (missing.length === 0) return null;
  return json(
    {
      error: `Missing required Worker secrets: ${missing.join(', ')}`,
      missing,
    },
    500,
  );
}

async function routeApi(request: Request, env: Env, pathname: string): Promise<Response | null> {
  if (pathname === '/api/task/run' && request.method === 'POST') {
    const missingResponse = missingSecretsResponse(env);
    if (missingResponse) return missingResponse;

    const { taskType, cities, instruction } = (await request.json()) as {
      taskType: string;
      cities: string[];
      instruction?: string;
    };
    const requestedCities = Array.isArray(cities) ? cities : [];

    if (!taskType || requestedCities.length === 0) {
      return json({ error: 'taskType and at least one city are required.' }, 400);
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    void (async () => {
      try {
        const missing = getMissingEnv(env);
        if (missing.length > 0) {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: `Missing required Worker secrets: ${missing.join(', ')}`,
                timestamp: new Date().toISOString(),
              })}\n\n`,
            ),
          );
          return;
        }

        for await (const event of runAgent(env, taskType, requestedCities, instruction ?? '')) {
          await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
        await writer.write(encoder.encode('data: {"type":"done"}\n\n'));
      } catch (error: any) {
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: error?.message ?? 'Pipeline execution failed', timestamp: new Date().toISOString() })}\n\n`,
          ),
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  if (pathname === '/api/health' && request.method === 'GET') {
    const { present, missing } = getEnvHealth(env);
    return json({
      status: missing.length === 0 ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      secrets: {
        required: REQUIRED_SECRETS,
        present,
        missing,
      },
    });
  }

  if (pathname === '/api/agents' && request.method === 'GET') {
    const missingResponse = missingSecretsResponse(env);
    if (missingResponse) return missingResponse;

    try {
      const dashboard = await getAgentDashboard(env, AGENT_CONFIGS);
      return json(dashboard);
    } catch (error: any) {
      return json({ error: error?.message ?? 'Unable to load agents.' }, 500);
    }
  }

  if (pathname === '/api/orchestrator/start' && request.method === 'POST') {
    const missingResponse = missingSecretsResponse(env);
    if (missingResponse) return missingResponse;

    const results: Array<{ name: string; status: string; inserted?: number; error?: string }> = [];

    for (const config of AGENT_CONFIGS) {
      try {
        const run = await runIraqAgent(config, env);
        results.push({ name: config.name, status: 'completed', inserted: run.inserted });
      } catch (error: any) {
        results.push({ name: config.name, status: 'error', error: error?.message ?? 'Unknown error' });
      }
    }

    return json({ status: 'completed', results });
  }

  if (pathname === '/api/orchestrator/stop' && request.method === 'POST') {
    const missingResponse = missingSecretsResponse(env);
    if (missingResponse) return missingResponse;

    try {
      await stopAllAgents(env, AGENT_CONFIGS.map((agent) => agent.name));
      return json({ status: 'stopped' });
    } catch (error: any) {
      return json({ error: error?.message ?? 'Unable to stop agents.' }, 500);
    }
  }

  const agentMatch = pathname.match(/^\/api\/agents\/([^/]+)\/run$/);
  if (agentMatch && request.method === 'POST') {
    const missingResponse = missingSecretsResponse(env);
    if (missingResponse) return missingResponse;

    const agentName = decodeURIComponent(agentMatch[1]);
    const config = findAgent(agentName);

    if (!config) {
      return json({ error: `Unknown agent: ${agentName}` }, 404);
    }

    try {
      const run = await runIraqAgent(config, env);
      return json({ status: 'completed', agent: config.name, inserted: run.inserted });
    } catch (error: any) {
      return json({ error: error?.message ?? 'Agent run failed' }, 500);
    }
  }

  if (pathname.startsWith('/api/')) {
    return json({ error: 'Not found' }, 404);
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        },
      });
    }

    const apiResponse = await routeApi(request, env, url.pathname);

    if (apiResponse) {
      return apiResponse;
    }

    return env.ASSETS.fetch(request);
  },
};
