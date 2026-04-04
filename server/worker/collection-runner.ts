export async function startCollectionWorker(): Promise<never> {
  throw new Error(
    '[deprecated] server/worker/collection-runner.ts is legacy and unsupported. Use server/runtime/worker.ts via npm run runtime:worker.',
  );
}
