import { agentManager, type AgentDefinition, type DirectoryRecord } from "./agentManager.js";
import { supabaseAdmin } from "../../supabase-admin.js";

type Seed = { id: string; city: string; category: string; schedule: "hourly" | "daily" | "weekly" };

const seeds: Seed[] = [
  { id: "Agent-01", city: "Baghdad", category: "Restaurants", schedule: "hourly" },
  { id: "Agent-02", city: "Basra", category: "Cafes", schedule: "hourly" },
  { id: "Agent-03", city: "Nineveh", category: "Bakeries", schedule: "daily" },
  { id: "Agent-04", city: "Erbil", category: "Hotels", schedule: "daily" },
  { id: "Agent-05", city: "Sulaymaniyah", category: "Gyms", schedule: "daily" },
  { id: "Agent-06", city: "Kirkuk", category: "Beauty Salons", schedule: "daily" },
  { id: "Agent-07", city: "Duhok", category: "Barbershops", schedule: "weekly" },
  { id: "Agent-08", city: "Anbar", category: "Pharmacies", schedule: "daily" },
  { id: "Agent-09", city: "Babil", category: "Supermarkets", schedule: "daily" },
  { id: "Agent-10", city: "Karbala", category: "Electronics", schedule: "daily" },
  { id: "Agent-11", city: "Wasit", category: "Clothing Stores", schedule: "weekly" },
  { id: "Agent-12", city: "Dhi Qar", category: "Car Services", schedule: "weekly" },
  { id: "Agent-13", city: "Maysan", category: "Dentists", schedule: "weekly" },
  { id: "Agent-14", city: "Muthanna", category: "Clinics", schedule: "weekly" },
  { id: "Agent-15", city: "Najaf", category: "Schools", schedule: "weekly" },
  { id: "Agent-16", city: "Qadisiyyah", category: "Co-working Spaces", schedule: "weekly" },
  { id: "Agent-17", city: "Saladin", category: "Entertainment", schedule: "weekly" },
  { id: "Agent-18", city: "Diyala", category: "Tourism", schedule: "weekly" },
];

function createMockRecords(seed: Seed): DirectoryRecord[] {
  return [1, 2, 3].map((index) => ({
    name: `${seed.category} ${seed.city} ${index}`,
    city: seed.city,
    phone: `+9647700000${seed.id.slice(-2)}${index}`,
    address: `${seed.city} center block ${index}`,
    latitude: 33.2 + index / 100,
    longitude: 44.4 + index / 100,
    category: seed.category,
    source: seed.id,
  }));
}

function buildCollectorAgent(seed: Seed): AgentDefinition {
  return {
    id: seed.id,
    name: seed.id,
    description: `${seed.category} collector for ${seed.city}`,
    schedule: seed.schedule,
    async run() {
      const records = createMockRecords(seed);
      const stats = await agentManager.insertDirectoryRecords(records);
      return {
        ...stats,
        logOutput: `Collected ${records.length} records for ${seed.city} (${seed.category}).`,
      };
    },
  };
}

const validationAgent: AgentDefinition = {
  id: "Agent-19",
  name: "ValidationAgent",
  description: "Quality-control validator for duplicates and malformed records",
  schedule: "daily",
  async run() {
    const { data: directoryRows, error } = await supabaseAdmin
      .from("directory")
      .select("id, name, city, phone, address, latitude, longitude");

    if (error) throw error;
    const rows = directoryRows || [];

    let inserted = 0;
    let duplicates = 0;
    let errors = 0;

    const phoneMap = new Map<string, number>();
    for (const row of rows) {
      if (row.phone) {
        const seen = phoneMap.get(row.phone) || 0;
        phoneMap.set(row.phone, seen + 1);
      }

      const issues: { issue_type: string; issue_details: string; severity: string }[] = [];

      if (!row.address) {
        issues.push({ issue_type: "missing_address", issue_details: `${row.name} has no address`, severity: "warning" });
      }

      if (row.phone && !/^\+?\d{7,15}$/.test(String(row.phone).replace(/[\s()-]/g, ""))) {
        issues.push({ issue_type: "invalid_phone", issue_details: `${row.name} phone format is invalid`, severity: "high" });
      }

      if (
        row.latitude == null ||
        row.longitude == null ||
        row.latitude < -90 ||
        row.latitude > 90 ||
        row.longitude < -180 ||
        row.longitude > 180
      ) {
        issues.push({ issue_type: "invalid_coordinates", issue_details: `${row.name} coordinates are invalid`, severity: "high" });
      }

      if (String(row.name || "").toLowerCase().includes("test")) {
        issues.push({ issue_type: "suspicious_record", issue_details: `${row.name} appears suspicious`, severity: "medium" });
      }

      if (issues.length > 0) {
        const { error: insertError } = await supabaseAdmin.from("data_quality_reports").insert(
          issues.map((issue) => ({
            directory_id: row.id,
            issue_type: issue.issue_type,
            issue_details: issue.issue_details,
            severity: issue.severity,
            reported_by: "ValidationAgent",
          })),
        );
        if (insertError) errors += 1;
        else inserted += issues.length;
      }
    }

    for (const [, count] of phoneMap) {
      if (count > 1) duplicates += count - 1;
    }

    return {
      inserted,
      duplicates,
      errors,
      logOutput: `Validation completed across ${rows.length} directory rows.`,
    };
  },
};

export const allAgents: AgentDefinition[] = [...seeds.map(buildCollectorAgent), validationAgent];
