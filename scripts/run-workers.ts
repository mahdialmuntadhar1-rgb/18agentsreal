import { spawn } from 'node:child_process';

const scopesRaw = process.env.WORKER_SCOPES ?? process.argv[2] ?? '';
const scopes = scopesRaw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (scopes.length === 0) {
  console.error('Set WORKER_SCOPES="Baghdad,Basra,..." or pass a comma-separated argument.');
  process.exit(1);
}

const baseAgentName = process.env.AGENT_NAME_PREFIX ?? 'agent';

for (const [idx, scope] of scopes.entries()) {
  const child = spawn(
    process.execPath,
    ['node_modules/tsx/dist/cli.mjs', 'server/runtime/index.ts'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        RUNTIME_MODE: 'worker',
        AGENT_SCOPE: scope,
        AGENT_ID: `${baseAgentName}-${idx + 1}`,
        AGENT_NAME: `${baseAgentName}-${idx + 1}`,
      },
    },
  );

  child.on('exit', (code) => {
    console.error(`[worker ${scope}] exited with code ${code ?? 0}`);
  });
}
