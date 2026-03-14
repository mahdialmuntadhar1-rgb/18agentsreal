import { BaseGovernor } from "./base-governor.js";
import { getGovernorateBusinesses } from "./mock-data.js";

export class RestaurantsGovernor extends BaseGovernor {
  category = "Iraqi Businesses";
  agentName = "Gov-01 Baghdad";

  async gather(): Promise<any[]> {
    return getGovernorateBusinesses("Baghdad");
  }
}
