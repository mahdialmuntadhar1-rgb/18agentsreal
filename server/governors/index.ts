import { RestaurantsGovernor } from "./restaurants.js";
// Import other governors here as they are created
// import { CafesGovernor } from "./cafes.js";

const governors: Record<string, any> = {
  "Gov-01 Restaurants": new RestaurantsGovernor(),
  // "Gov-02 Cafes": new CafesGovernor(),
};

export function getGovernorNames() {
  return Object.keys(governors);
}

export async function runGovernor(agentName: string) {
  const governor = governors[agentName];
  if (!governor) {
    throw new Error(`Governor ${agentName} not found`);
  }
  
  console.log(`Starting run for ${agentName}...`);
  await governor.run();
  console.log(`Finished run for ${agentName}`);
}

export async function runAllGovernors() {
  for (const agentName of getGovernorNames()) {
    await runGovernor(agentName);
  }
}
