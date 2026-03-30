import { FacebookDiscoveryAdapter } from "./adapters/facebook.js";
import { GeminiResearchAdapter } from "./adapters/gemini.js";
import { GooglePlacesAdapter } from "./adapters/google-places.js";
import { InstagramDiscoveryAdapter } from "./adapters/instagram.js";
import { OpenStreetMapAdapter } from "./adapters/osm.js";
import { WebDirectoryAdapter } from "./adapters/web-directory.js";
import { AdapterRunLog, DiscoveryAdapter, DiscoveryInput, OrchestratorResult } from "./types.js";
import { dedupeBusinesses, sourcePriority } from "./utils.js";

const adapterRegistry: DiscoveryAdapter[] = [
  new GeminiResearchAdapter(),
  new FacebookDiscoveryAdapter(),
  new InstagramDiscoveryAdapter(),
  new OpenStreetMapAdapter(),
  new WebDirectoryAdapter(),
  new GooglePlacesAdapter(),
];

function shouldUseInstagram(category?: string) {
  if (!category) return true;
  return /restaurant|cafe|beauty|retail|lifestyle/i.test(category);
}

export function buildAdapterPlan(input: DiscoveryInput) {
  return adapterRegistry.filter((adapter) => {
    if (adapter.source === "instagram" && !shouldUseInstagram(input.category)) return false;
    if (adapter.source === "google_places" && !input.includeGoogleFallback) return false;
    return true;
  });
}

export async function runDiscoveryOrchestrator(input: DiscoveryInput): Promise<OrchestratorResult> {
  const adapters = buildAdapterPlan(input);
  const logs: AdapterRunLog[] = [];
  const collected: OrchestratorResult["records"] = [];

  for (const adapter of adapters) {
    const start = Date.now();
    try {
      const records = await adapter.searchBusinesses(input);
      collected.push(...records);
      logs.push({ adapter: adapter.source, ok: true, count: records.length, durationMs: Date.now() - start });
    } catch (error: any) {
      logs.push({ adapter: adapter.source, ok: false, count: 0, error: error?.message || "failed", durationMs: Date.now() - start });
    }
  }

  const records = dedupeBusinesses(collected).sort((a, b) => {
    const byScore = (b.confidence_score || 0) - (a.confidence_score || 0);
    if (byScore !== 0) return byScore;
    return sourcePriority(a.source) - sourcePriority(b.source);
  });

  return { query: input, records, logs };
}
