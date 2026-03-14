import { GovernorateGovernor } from "./governorate-governor.js";
import { governorateNames } from "./mock-data.js";

const governors = Object.fromEntries(
  governorateNames.map((name, index) => {
    const agentName = `Gov-${String(index + 1).padStart(2, "0")} ${name}`;
    return [agentName, new GovernorateGovernor(agentName, name)];
  }),
) as Record<string, GovernorateGovernor>;
import { RestaurantsGovernor } from "./restaurants.js";
import { BaghdadGovernor } from "./baghdad.js";
import { BasraGovernor } from "./basra.js";
import { ErbilGovernor } from "./erbil.js";
import { SulaymaniyahGovernor } from "./sulaymaniyah.js";
import { KirkukGovernor } from "./kirkuk.js";
import { NajafGovernor } from "./najaf.js";
import { KarbalaGovernor } from "./karbala.js";
import { MosulGovernor } from "./mosul.js";
import { AnbarGovernor } from "./anbar.js";
import { DiyalaGovernor } from "./diyala.js";
import { BabilGovernor } from "./babil.js";
import { WasitGovernor } from "./wasit.js";
import { MaysanGovernor } from "./maysan.js";
import { DhiQarGovernor } from "./dhi-qar.js";
import { MuthannaGovernor } from "./muthanna.js";
import { QadisiyyahGovernor } from "./qadisiyyah.js";
import { SaladinGovernor } from "./saladin.js";

const governors: Record<string, any> = {
  "Gov-01 Restaurants": new RestaurantsGovernor(),
  "Gov-02 Baghdad": new BaghdadGovernor(),
  "Gov-03 Basra": new BasraGovernor(),
  "Gov-04 Erbil": new ErbilGovernor(),
  "Gov-05 Sulaymaniyah": new SulaymaniyahGovernor(),
  "Gov-06 Kirkuk": new KirkukGovernor(),
  "Gov-07 Najaf": new NajafGovernor(),
  "Gov-08 Karbala": new KarbalaGovernor(),
  "Gov-09 Mosul (Nineveh)": new MosulGovernor(),
  "Gov-10 Anbar": new AnbarGovernor(),
  "Gov-11 Diyala": new DiyalaGovernor(),
  "Gov-12 Babil": new BabilGovernor(),
  "Gov-13 Wasit": new WasitGovernor(),
  "Gov-14 Maysan": new MaysanGovernor(),
  "Gov-15 Dhi Qar": new DhiQarGovernor(),
  "Gov-16 Muthanna": new MuthannaGovernor(),
  "Gov-17 Qadisiyyah": new QadisiyyahGovernor(),
  "Gov-18 Saladin": new SaladinGovernor(),
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
