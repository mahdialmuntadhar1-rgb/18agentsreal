import { BaseGovernor, type BusinessData } from "./base-governor.ts";
import { GeminiResearchAdapter } from "../sources/gemini-research-adapter.ts";

export class GenericGovernor extends BaseGovernor {
  category = "generic";
  agentName = "Agent-Generic";
  governmentRate = "Level 1";
  city = "Baghdad";
  private sourceAdapter: GeminiResearchAdapter;

  constructor(agentName: string, category: string, city: string, governmentRate: string) {
    super();
    this.agentName = agentName;
    this.category = category;
    this.city = city;
    this.governmentRate = governmentRate;
    this.sourceAdapter = new GeminiResearchAdapter(process.env.GEMINI_API_KEY);
  }

  async gather(city?: string, category?: string): Promise<BusinessData[]> {
    const targetCity = city || this.city;
    const targetCategory = category || this.category;
    console.log(`${this.agentName}: Gathering ${targetCategory} data in ${targetCity}...`);

    try {
      return await this.sourceAdapter.search({
        category: targetCategory,
        city: targetCity,
        country: "Iraq",
        limit: 20,
        strictCityCenter: true,
      });
    } catch (error) {
      console.error(`${this.agentName}: Error gathering data:`, error);
      return [];
    }
  }
}
