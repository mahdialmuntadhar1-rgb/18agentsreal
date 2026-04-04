import { BaseGovernor, type BusinessData } from "./base-governor.js";
import { GeminiResearchAdapter } from "../sources/gemini-research-adapter.ts";

export class BeautySalonsGovernor extends BaseGovernor {
  category = "beauty_salons";
  agentName = "Agent-06";
  governmentRate = "Rate Level 2";
  city = "Kirkuk";
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
