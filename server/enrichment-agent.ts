import { providers } from "./data-sources.js";
import { BusinessRepository } from "./repository.js";
import { normalizeMultilingualText, normalizeUrl } from "./text-normalization.js";
import type { BusinessRow, EnrichedBusinessPayload, Governorate, SourceCandidate, SourceName } from "./types.js";

const BATCH_SLEEP_MS = 5000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeCandidates(base: BusinessRow, candidates: SourceCandidate[]): EnrichedBusinessPayload {
  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);
  const pick = <K extends keyof EnrichedBusinessPayload>(field: K, fallback: EnrichedBusinessPayload[K]): EnrichedBusinessPayload[K] => {
    for (const candidate of sorted) {
      if (candidate[field] !== undefined && candidate[field] !== null) {
        return candidate[field] as EnrichedBusinessPayload[K];
      }
    }
    return fallback;
  };

  const verifiedSources = sorted.map((item) => item.source);

  return {
    name: pick("name", normalizeMultilingualText(base.name)),
    category: pick("category", normalizeMultilingualText(base.category)),
    phone_number: pick("phone_number", normalizeMultilingualText(base.phone_number)),
    website: pick("website", normalizeUrl(base.website)),
    address: pick("address", normalizeMultilingualText(base.address)),
    city: pick("city", normalizeMultilingualText(base.city)),
    governorate: pick("governorate", normalizeMultilingualText(base.governorate)),
    latitude: pick("latitude", base.latitude),
    longitude: pick("longitude", base.longitude),
    google_maps_url: pick("google_maps_url", normalizeUrl(base.google_maps_url)),
    opening_hours: pick("opening_hours", normalizeMultilingualText(base.opening_hours)),
    facebook_url: pick("facebook_url", normalizeUrl(base.facebook_url)),
    instagram_url: pick("instagram_url", normalizeUrl(base.instagram_url)),
    logo_image_url: pick("logo_image_url", normalizeUrl(base.logo_image_url)),
    cover_image_url: pick("cover_image_url", normalizeUrl(base.cover_image_url)),
    gallery_images: pick("gallery_images", base.gallery_images ?? []),
    short_description: pick("short_description", normalizeMultilingualText(base.short_description)),
    status: verifiedSources.length === 0 ? "not_found" : "enriched",
    verified_sources: [...new Set(verifiedSources)] as SourceName[],
    enriched: true,
    last_checked: new Date().toISOString(),
  };
}

export class EnrichmentAgent {
  private readonly repository = new BusinessRepository();

  constructor(readonly governorate: Governorate, readonly agentIndex: number) {}

  get name() {
    return `Agent-${String(this.agentIndex).padStart(2, "0")} ${this.governorate}`;
  }

  async runForever(signal?: AbortSignal): Promise<void> {
    while (!signal?.aborted) {
      await this.runSingleBatch();
      await wait(BATCH_SLEEP_MS);
    }
  }

  async runSingleBatch(): Promise<{ processed: number; updated: number; failed: number }> {
    const metrics = { processed: 0, updated: 0, failed: 0 };
    await this.repository.updateAgentStatus(this.name, "active");

    try {
      const batch = await this.repository.fetchBatch(this.governorate);
      if (batch.length === 0) {
        await this.repository.updateAgentStatus(this.name, "idle");
        return metrics;
      }

      for (const business of batch) {
        metrics.processed += 1;
        try {
          const candidates = (await Promise.all(providers.map((provider) => provider.lookup(business)))).filter(Boolean) as SourceCandidate[];
          const payload = mergeCandidates(business, candidates);
          await this.repository.updateEnrichedBusiness(business.id, payload);
          metrics.updated += 1;
        } catch (error) {
          metrics.failed += 1;
          console.error(`[${this.name}] Failed business ${business.id}`, error);
        }
      }

      await this.repository.logAgentRun(this.name, metrics);
      await this.repository.updateAgentStatus(this.name, metrics.failed > 0 ? "warning" : "idle");
      return metrics;
    } catch (error) {
      await this.repository.updateAgentStatus(this.name, "error", (error as Error).message);
      throw error;
    }
  }
}
