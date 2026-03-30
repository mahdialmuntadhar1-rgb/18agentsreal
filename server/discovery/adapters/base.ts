import { DiscoveryAdapter, DiscoveryInput, NormalizedBusiness } from "../types.js";
import { computeConfidence, sanitizeBusiness } from "../utils.js";

export abstract class BaseDiscoveryAdapter implements DiscoveryAdapter {
  abstract readonly source: DiscoveryAdapter["source"];
  abstract searchBusinesses(input: DiscoveryInput): Promise<NormalizedBusiness[]>;

  normalizeBusiness(raw: unknown): NormalizedBusiness | null {
    if (!raw || typeof raw !== "object") return null;
    const candidate = raw as Partial<NormalizedBusiness>;

    return sanitizeBusiness({
      name: candidate.name || "",
      source: this.source,
      ...candidate,
    } as NormalizedBusiness);
  }

  scoreBusiness(record: NormalizedBusiness): number {
    return computeConfidence(record);
  }

  async enrichBusiness(record: NormalizedBusiness): Promise<NormalizedBusiness> {
    return record;
  }
}
