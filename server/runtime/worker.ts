import { QueueJobRunner } from './job-runner.ts';

export const startWorker = async (): Promise<void> => {
  const agentId = process.env.AGENT_ID ?? 'agent-01';
  const agentName = process.env.AGENT_NAME ?? 'Agent-01';
  const agentScope = process.env.AGENT_SCOPE ?? 'Baghdad';

  const runner = new QueueJobRunner(agentId, agentName, agentScope);
  await runner.runLoop();
};
