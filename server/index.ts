import 'dotenv/config';
import { startCollectionWorker } from './worker/collection-runner.ts';

startCollectionWorker().catch((error) => {
  console.error('Fatal collection worker boot error', error);
  process.exit(1);
});
