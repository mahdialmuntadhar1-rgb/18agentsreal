import 'dotenv/config';
import { startApiServer } from './api.ts';
import { assertRuntimeStartup } from './guardrails.ts';
import { startWorker } from './worker.ts';

const mode = (process.env.RUNTIME_MODE ?? 'worker').toLowerCase() as 'api' | 'worker' | 'all';

if (!['api', 'worker', 'all'].includes(mode)) {
  throw new Error(`[runtime] Invalid RUNTIME_MODE '${mode}'. Expected one of: api, worker, all.`);
}

await assertRuntimeStartup(mode);

if (mode === 'api') {
  startApiServer();
} else if (mode === 'all') {
  startApiServer();
  void startWorker();
} else {
  void startWorker();
}
