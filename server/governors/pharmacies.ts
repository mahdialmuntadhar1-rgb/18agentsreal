import { BaseGovernor, type BusinessData } from "./base-governor.js";
import { GeminiResearchAdapter } from "../sources/gemini-research-adapter.ts";

export class PharmaciesGovernor extends BaseGovernor {
  category = "pharmacies";
  agentName = "Agent-07";
  governmentRate = "Rate Level 2";
  city = "Duhok";
  private sourceAdapter: GeminiResearchAdapter;

  constructor(agentName?: string, city?: string, governmentRate?: string) {
    super();
    if (agentName) this.agentName = agentName;
    if (city) this.city = city;
    if (governmentRate) this.governmentRate = governmentRate;
    this.sourceAdapter = new GeminiResearchAdapter(process.env.GEMINI_API_KEY);
  }

  async gather(city?: string, category?: string): Promise<BusinessData[]> {
    const targetCity = city || this.city;
    const targetCategory = category || this.category;
    console.log(`Gathering ${targetCategory} data in ${targetCity}...`);

    return this.sourceAdapter.search({
      category: targetCategory,
      city: targetCity,
      country: "Iraq",
      limit: 20,
      strictCityCenter: true,  // Only search city center, not suburbs
    });
  }
}
