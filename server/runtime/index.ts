import 'dotenv/config';
import { startApiServer } from './api.ts';
import { startWorker } from './worker.ts';

const mode = (process.env.RUNTIME_MODE ?? 'worker').toLowerCase();

if (mode === 'api') {
  startApiServer();
} else if (mode === 'all') {
  startApiServer();
  void startWorker();
} else {
  void startWorker();
}
