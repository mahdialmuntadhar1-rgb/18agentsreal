import { BaseGovernor } from "./base-governor.js";
import { getGovernorateBusinesses } from "./mock-data.js";

export class GovernorateGovernor extends BaseGovernor {
  category = "Iraqi Businesses";

  constructor(
    public agentName: string,
    private governorate: string,
  ) {
    super();
  }

  async gather(): Promise<any[]> {
    console.log(`Gathering mock data for ${this.governorate}...`);
    await new Promise((resolve) => setTimeout(resolve, 150));
    return getGovernorateBusinesses(this.governorate);
  }
}
