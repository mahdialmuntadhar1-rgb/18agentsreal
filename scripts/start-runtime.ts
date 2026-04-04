const mode = process.argv[2] ?? process.env.RUNTIME_MODE ?? 'worker';
process.env.RUNTIME_MODE = mode;
await import('../server/runtime/index.ts');
