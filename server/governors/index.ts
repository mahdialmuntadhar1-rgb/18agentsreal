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

<<<<<<< Updated upstream
class GenericWorkerGovernor extends BaseGovernor {
  constructor(public agentName: string, public category: string, public governmentRate: string) {
    super();
  }

  async gather(city?: string): Promise<any[]> {
    const targetCity = city || "Baghdad";
    console.log(`Generic Agent ${this.agentName} gathering for ${this.category} in ${targetCity}...`);
    // Simulate finding 1-3 businesses
    return [
      {
        name: `${this.category} Hub ${Math.floor(Math.random() * 100)}`,
        category: this.category,
        city: targetCity,
        address: "Main Street, Sector 7",
        phone: "+964 770 000 0000",
        website: "https://example.com",
        source_url: "https://example.com/source",
        description: `A high-quality ${this.category.toLowerCase()} in ${targetCity}.`,
        operating_hours: "08:00 AM - 10:00 PM",
        source: "AI Crawler",
        verification_status: "Pending",
        date_collected: new Date()
      }
    ];
  }
}

const governors: Record<string, any> = {
=======
const governors: Record<string, BaseGovernor> = {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
// Register the rest of the 18 agents
const agentConfigs = [
  { id: "Agent-02", name: "Basra", category: "cafes", rate: "Rate Level 1" },
  { id: "Agent-03", name: "Nineveh", category: "bakeries", rate: "Rate Level 1" },
  { id: "Agent-04", name: "Erbil", category: "hotels", rate: "Rate Level 1" },
  { id: "Agent-05", name: "Sulaymaniyah", category: "gyms", rate: "Rate Level 2" },
  { id: "Agent-06", name: "Kirkuk", category: "beauty_salons", rate: "Rate Level 2" },
  { id: "Agent-07", name: "Duhok", category: "pharmacies", rate: "Rate Level 2" },
  { id: "Agent-08", name: "Anbar", category: "supermarkets", rate: "Rate Level 2" },
  { id: "Agent-09", name: "Babil", category: "restaurants", rate: "Rate Level 3" },
  { id: "Agent-10", name: "Karbala", category: "cafes", rate: "Rate Level 3" },
  { id: "Agent-11", name: "Wasit", category: "bakeries", rate: "Rate Level 3" },
  { id: "Agent-12", name: "Dhi Qar", category: "hotels", rate: "Rate Level 3" },
  { id: "Agent-13", name: "Maysan", category: "gyms", rate: "Rate Level 4" },
  { id: "Agent-14", name: "Muthanna", category: "beauty_salons", rate: "Rate Level 4" },
  { id: "Agent-15", name: "Najaf", category: "pharmacies", rate: "Rate Level 4" },
  { id: "Agent-16", name: "Qadisiyyah", category: "supermarkets", rate: "Rate Level 5" },
  { id: "Agent-17", name: "Saladin", category: "restaurants", rate: "Rate Level 5" },
  { id: "Agent-18", name: "Diyala", category: "cafes", rate: "Rate Level 5" },
];

agentConfigs.forEach(config => {
  if (!governors[config.id]) {
    governors[config.id] = new GenericWorkerGovernor(config.id, config.category, config.rate);
  }
});

export async function runGovernor(agentName: string) {
=======
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
>>>>>>> Stashed changes
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

