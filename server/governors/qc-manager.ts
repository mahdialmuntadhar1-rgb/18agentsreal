import { BaseGovernor } from "./base-governor.js";

export class QualityControlGovernor extends BaseGovernor {
  category = "Quality Control";
  agentName = "QC Overseer";
  governmentRate = "Supervisory";
  city = "System";

  async gather(): Promise<any[]> {
    console.log("QC Manager: Auditing system data...");
    
    // 1. Check for duplicates
    await this.removeDuplicates();
    
    // 2. Validate data quality (e.g., missing fields)
    await this.flagIncompleteData();
    
    // 3. Monitor agent health
    await this.monitorAgents();

    // QC doesn't gather new businesses directly, it audits existing ones
    return [];
  }

  async removeDuplicates() {
    console.log("QC: Checking for duplicate business entries...");
    // Logic to find and merge duplicates based on name and city
    // This is a simplified simulation
    const { data: duplicates } = await this.supabase
      .from("businesses")
      .select("name, city, id")
      .order("name");

    if (duplicates) {
      const seen = new Set();
      for (const biz of duplicates) {
        const key = `${biz.name}-${biz.city}`.toLowerCase();
        if (seen.has(key)) {
          console.log(`QC: Removing duplicate: ${biz.name}`);
          await this.supabase.from("businesses").delete().eq("id", biz.id);
        } else {
          seen.add(key);
        }
      }
    }
  }

  async flagIncompleteData() {
    console.log("QC: Flagging incomplete data...");
    // Flag businesses missing phone or website
    await this.supabase
      .from("businesses")
      .update({ verification_status: "Flagged" })
      .or("phone.is.null,website.is.null");
  }

  async monitorAgents() {
    console.log("QC: Monitoring agent status and managing queue...");
    
    // 1. Restart stalled agents
    const { data: stalled } = await this.supabase
      .from("agents")
      .select("agent_name")
      .eq("status", "error");
 
    if (stalled && stalled.length > 0) {
      for (const agent of stalled) {
        console.log(`QC: Restarting stalled agent: ${agent.agent_name}`);
        await this.supabase
          .from("agents")
          .update({ status: "idle" })
          .eq("agent_name", agent.agent_name);
      }
    }

    // 2. Populate queue if low
    const { count } = await this.supabase
      .from("agent_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if ((count || 0) < 10) {
      console.log("QC: Queue low. Generating new tasks...");
      await this.generateNewTasks();
    }
  }

  async generateNewTasks() {
    const cities = ["Baghdad", "Basra", "Mosul", "Erbil", "Najaf", "Karbala", "Kirkuk", "Sulaymaniyah"];
    const categories = [
      "restaurants", "cafes", "bakeries", "hotels", "gyms", 
      "beauty_salons", "pharmacies", "supermarkets"
    ];

    const newTasks = [];
    for (let i = 0; i < 10; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const rate = `Rate Level ${Math.floor(Math.random() * 5) + 1}`;
      
      newTasks.push({
        task_type: "scrape",
        category,
        city,
        government_rate: rate,
        status: "pending",
        description: `Crawl ${category} in ${city}`,
        created_at: new Date()
      });
    }

    await this.supabase.from("agent_tasks").insert(newTasks);
  }
}
