import { GovernorateGovernor } from "./governorate-governor.js";
import { governorateNames } from "./mock-data.js";

const governors = Object.fromEntries(
  governorateNames.map((name, index) => {
    const agentName = `Gov-${String(index + 1).padStart(2, "0")} ${name}`;
    return [agentName, new GovernorateGovernor(agentName, name)];
  }),
) as Record<string, GovernorateGovernor>;

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
