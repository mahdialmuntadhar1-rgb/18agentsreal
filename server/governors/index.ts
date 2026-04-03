import { RestaurantsGovernor } from "./restaurants.ts";
import { CafesGovernor } from "./cafes.ts";
import { BakeriesGovernor } from "./bakeries.ts";
import { HotelsGovernor } from "./hotels.ts";
import { GymsGovernor } from "./gyms.ts";
import { BeautySalonsGovernor } from "./beauty-salons.ts";
import { PharmaciesGovernor } from "./pharmacies.ts";
import { SupermarketsGovernor } from "./supermarkets.ts";
import { QualityControlGovernor } from "./qc-manager.ts";
import { BaseGovernor } from "./base-governor.ts";

const governors: Record<string, BaseGovernor> = {
  "Agent-01": new RestaurantsGovernor(),
  "Agent-02": new CafesGovernor(),
  "Agent-03": new BakeriesGovernor(),
  "Agent-04": new HotelsGovernor(),
  "Agent-05": new GymsGovernor(),
  "Agent-06": new BeautySalonsGovernor(),
  "Agent-07": new PharmaciesGovernor(),
  "Agent-08": new SupermarketsGovernor(),
  "Agent-09": new RestaurantsGovernor("Agent-09", "Babil", "Rate Level 3"),
  "Agent-10": new CafesGovernor("Agent-10", "Karbala", "Rate Level 3"),
  "Agent-11": new BakeriesGovernor("Agent-11", "Wasit", "Rate Level 3"),
  "Agent-12": new HotelsGovernor("Agent-12", "Dhi Qar", "Rate Level 3"),
  "Agent-13": new GymsGovernor("Agent-13", "Maysan", "Rate Level 4"),
  "Agent-14": new BeautySalonsGovernor("Agent-14", "Muthanna", "Rate Level 4"),
  "Agent-15": new PharmaciesGovernor("Agent-15", "Najaf", "Rate Level 4"),
  "Agent-16": new SupermarketsGovernor("Agent-16", "Qadisiyyah", "Rate Level 5"),
  "Agent-17": new RestaurantsGovernor("Agent-17", "Saladin", "Rate Level 5"),
  "Agent-18": new CafesGovernor("Agent-18", "Diyala", "Rate Level 5"),
  "QC Overseer": new QualityControlGovernor(),
};

export function getGovernorDefaults(agentName: string) {
  const governor = governors[agentName];
  if (governor) {
    return {
      city: governor.city,
      category: governor.category,
      governmentRate: governor.governmentRate,
    };
  }
  return { city: "Baghdad", category: "restaurants", governmentRate: "Rate Level 1" };
}

export async function runGovernor(agentName: string, taskOverride?: any) {
  const governor = governors[agentName];
  if (!governor) {
    throw new Error(`Governor ${agentName} not found`);
  }
  
  console.log(`Starting run for ${agentName}...`);
  await governor.run();
  console.log(`Finished run for ${agentName}`);
}

export async function runAllGovernors() {
  for (const agentName of Object.keys(governors)) {
    if (agentName !== "QC Overseer") {
      await runGovernor(agentName);
    }
  }
}

export { BaseGovernor };

