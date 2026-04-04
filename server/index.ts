import 'dotenv/config';

console.error('[deprecated] server/index.ts is deprecated. Use scripts/start-runtime.ts or npm run runtime:* commands.');
await import('./runtime/index.ts');
