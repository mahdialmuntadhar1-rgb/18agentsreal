import { BaseGovernor } from "./base-governor.js";
import { runDiscoveryOrchestrator } from "../discovery/orchestrator.js";

export class RestaurantsGovernor extends BaseGovernor {
  category = "Restaurants";
  agentName = "Agent-01";
  governmentRate = "Rate Level 1";

  async gather(city?: string, category?: string): Promise<any[]> {
    const targetCity = city || "Baghdad";
    const targetCategory = category || this.category;

    const result = await runDiscoveryOrchestrator({
      query: `${targetCategory} in ${targetCity}, Iraq`,
      city: targetCity,
      governorate: targetCity,
      category: targetCategory,
      includeGoogleFallback: true,
      limit: 12,
    });

    await this.logAdapterRuns(result.logs);

    return result.records.map((record) => ({
      ...record,
      description: record.extraction_notes,
      source_url: record.source_url || record.map_url || record.facebook_url || record.instagram_url,
      source: record.source,
      operating_hours: record.opening_hours,
      verification_status: (record.confidence_score || 0) >= 70 ? "verified" : "pending",
      date_collected: record.discovered_at ? new Date(record.discovered_at) : new Date(),
    }));
  }
}
