const API_BASE = '/api';

export interface AgentJob {
  id: string;
  city: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  records_found: number;
  records_verified: number;
  started_at: string;
  completed_at: string | null;
}

export async function getAgentStatus(): Promise<AgentJob[]> {
  const res = await fetch(`${API_BASE}/agents/status`);
  return res.json();
}

export async function startAgent(city: string): Promise<void> {
  await fetch(`${API_BASE}/agents/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city })
  });
}

export async function startAllAgents(): Promise<void> {
  await fetch(`${API_BASE}/agents/start-all`, { method: 'POST' });
}

export async function getAgentLogs(jobId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/agents/logs/${jobId}`);
  return res.json();
}
