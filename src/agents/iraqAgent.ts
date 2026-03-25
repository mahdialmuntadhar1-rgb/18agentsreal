import { createClient } from "@supabase/supabase-js";

export interface Env {
  GEMINI_API_KEY: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

export interface AgentConfig {
  name: string;
  governorate: string;
  category: string;
  governmentRate: string;
}

interface GeminiBusiness {
  name_ku: string;
  name_ar: string;
  name_en: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  governorate: string;
  category: string;
  subcategory: string;
  website: string;
  description: string;
}

function createSupabaseClient(env: Env) {
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cleanJsonEnvelope(raw: string): string {
  return raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

function coerceBusinesses(value: unknown): GeminiBusiness[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        name_ku: String(record.name_ku ?? "").trim(),
        name_ar: String(record.name_ar ?? "").trim(),
        name_en: String(record.name_en ?? "").trim(),
        phone: String(record.phone ?? "").trim(),
        address: String(record.address ?? "").trim(),
        district: String(record.district ?? "").trim(),
        city: String(record.city ?? "").trim(),
        governorate: String(record.governorate ?? "").trim(),
        category: String(record.category ?? "").trim(),
        subcategory: String(record.subcategory ?? "").trim(),
        website: String(record.website ?? "").trim(),
        description: String(record.description ?? "").trim(),
      };
    })
    .filter((biz) => biz.name_en || biz.name_ar || biz.name_ku);
}

async function generateBusinessesWithGemini(config: AgentConfig, env: Env): Promise<GeminiBusiness[]> {
  const prompt = [
    `Generate 20 real Iraqi businesses in ${config.governorate} in the category ${config.category}.`,
    "Return only valid JSON array with fields:",
    "name_ku, name_ar, name_en, phone, address, district, city, governorate, category, subcategory, website, description.",
    "No markdown, no explanations.",
  ].join(" ");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${details}`);
  }

  const payload = await response.json() as any;
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text || typeof text !== "string") {
    throw new Error("Gemini response did not contain text content.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonEnvelope(text));
  } catch {
    throw new Error("Failed to parse Gemini JSON payload.");
  }

  const businesses = coerceBusinesses(parsed);
  if (businesses.length === 0) {
    throw new Error("Gemini returned no usable businesses.");
  }

  return businesses;
}

export async function runIraqAgent(config: AgentConfig, env: Env) {
  const supabase = createSupabaseClient(env);

  await supabase
    .from("agents")
    .upsert({
      agent_name: config.name,
      category: config.category,
      status: "running",
      updated_at: new Date().toISOString(),
    }, { onConflict: "agent_name" });

  try {
    const businesses = await generateBusinessesWithGemini(config, env);

    const records = businesses.map((business) => ({
      ...business,
      created_by_agent: config.name,
      verification_status: "pending",
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("businesses").insert(records);
    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    await supabase
      .from("agents")
      .upsert({
        agent_name: config.name,
        category: config.category,
        status: "idle",
        records_collected: records.length,
        updated_at: new Date().toISOString(),
        last_run: new Date().toISOString(),
      }, { onConflict: "agent_name" });

    return { inserted: records.length };
  } catch (error) {
    await supabase
      .from("agents")
      .upsert({
        agent_name: config.name,
        category: config.category,
        status: "error",
        updated_at: new Date().toISOString(),
        last_run: new Date().toISOString(),
      }, { onConflict: "agent_name" });

    throw error;
  }
}

export async function stopAllAgents(env: Env, agentNames: string[]) {
  const supabase = createSupabaseClient(env);
  const { error } = await supabase
    .from("agents")
    .update({ status: "idle", updated_at: new Date().toISOString() })
    .in("agent_name", agentNames);

  if (error) {
    throw new Error(`Unable to stop agents: ${error.message}`);
  }
}

export async function getAgentDashboard(env: Env, configs: AgentConfig[]) {
  const supabase = createSupabaseClient(env);

  const [{ data: agents, error: agentErr }, { data: businesses, error: businessErr }] = await Promise.all([
    supabase
      .from("agents")
      .select("agent_name, category, status, records_collected, last_run")
      .in("agent_name", configs.map((config) => config.name))
      .order("agent_name"),
    supabase
      .from("businesses")
      .select("created_by_agent"),
  ]);

  if (agentErr) throw new Error(`Failed to fetch agents: ${agentErr.message}`);
  if (businessErr) throw new Error(`Failed to fetch businesses: ${businessErr.message}`);

  const counts = (businesses ?? []).reduce<Record<string, number>>((acc, row: any) => {
    const key = row.created_by_agent || "";
    if (key) acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const agentMap = new Map((agents ?? []).map((agent: any) => [agent.agent_name, agent]));

  return configs.map((config) => {
    const current = agentMap.get(config.name);
    const status = current?.status === "active" ? "running" : (current?.status ?? "idle");

    return {
      name: config.name,
      governorate: config.governorate,
      category: config.category,
      governmentRate: config.governmentRate,
      status,
      recordsInserted: counts[config.name] ?? current?.records_collected ?? 0,
      lastActivity: current?.last_run ?? null,
    };
  });
}
