import { DiscoverySource, NormalizedBusiness } from "./types.js";

const IRAQ_GOVERNORATES = [
  "Baghdad", "Basra", "Nineveh", "Erbil", "Sulaymaniyah", "Kirkuk", "Duhok", "Anbar", "Babil",
  "Karbala", "Wasit", "Dhi Qar", "Maysan", "Muthanna", "Najaf", "Qadisiyyah", "Saladin", "Diyala",
];

const JUNK_VALUES = new Set(["n/a", "na", "none", "null", "unknown", "-"]); 

const arabicNormalizationMap: Record<string, string> = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ة": "ه",
  "ى": "ي",
  "ؤ": "و",
  "ئ": "ي",
};

export function normalizeLooseText(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (JUNK_VALUES.has(lower)) return "";

  const arabicNormalized = trimmed
    .split("")
    .map((char) => arabicNormalizationMap[char] || char)
    .join("");

  return arabicNormalized.replace(/\s+/g, " ").trim();
}

export function normalizePhone(phone?: string | null): string | null {
  const clean = normalizeLooseText(phone);
  if (!clean) return null;
  const digits = clean.replace(/[^\d+]/g, "");
  if (!digits) return null;

  if (digits.startsWith("+964")) return digits;
  if (digits.startsWith("964")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+964${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 13) return digits.startsWith("+") ? digits : `+${digits}`;
  return null;
}

export function normalizeGovernorate(raw?: string | null): string | null {
  const value = normalizeLooseText(raw);
  if (!value) return null;
  const found = IRAQ_GOVERNORATES.find((g) => g.toLowerCase() === value.toLowerCase());
  return found || value;
}

export function computeConfidence(record: NormalizedBusiness): number {
  let score = 15;
  if (record.phone) score += 20;
  if (record.address) score += 15;
  if (record.city || record.governorate) score += 15;
  if (record.latitude != null && record.longitude != null) score += 15;
  if (record.website || record.facebook_url || record.instagram_url) score += 10;
  if (record.source_url) score += 5;
  if (record.opening_hours) score += 5;
  if (record.name.length > 4) score += 5;
  return Math.max(0, Math.min(100, score));
}

export function sanitizeBusiness(record: NormalizedBusiness): NormalizedBusiness | null {
  const name = normalizeLooseText(record.name);
  if (!name || name.length < 2) return null;

  const cleaned: NormalizedBusiness = {
    ...record,
    name,
    local_name: normalizeLooseText(record.local_name) || null,
    category: normalizeLooseText(record.category) || null,
    subcategory: normalizeLooseText(record.subcategory) || null,
    governorate: normalizeGovernorate(record.governorate),
    city: normalizeLooseText(record.city) || null,
    address: normalizeLooseText(record.address) || null,
    phone: normalizePhone(record.phone),
    website: normalizeLooseText(record.website) || null,
    facebook_url: normalizeLooseText(record.facebook_url) || null,
    instagram_url: normalizeLooseText(record.instagram_url) || null,
    map_url: normalizeLooseText(record.map_url) || null,
    source_url: normalizeLooseText(record.source_url) || null,
    opening_hours: normalizeLooseText(record.opening_hours) || null,
    extraction_notes: normalizeLooseText(record.extraction_notes) || null,
    discovered_at: record.discovered_at || new Date().toISOString(),
    confidence_score: record.confidence_score ?? computeConfidence(record),
    source_attribution: Array.from(new Set([...(record.source_attribution || []), record.source])),
    validation_flags: [],
  };

  if (!cleaned.address && !cleaned.city && !cleaned.phone && !cleaned.source_url) {
    cleaned.validation_flags?.push("insufficient_contact_or_location");
  }
  if (!cleaned.phone) cleaned.validation_flags?.push("missing_phone");
  if ((cleaned.confidence_score || 0) < 40) cleaned.validation_flags?.push("low_confidence");

  return cleaned;
}

function dedupeKey(record: NormalizedBusiness) {
  const normalizedName = normalizeLooseText(record.name).toLowerCase();
  const phone = record.phone || "";
  const city = normalizeLooseText(record.city).toLowerCase();
  const gov = normalizeLooseText(record.governorate).toLowerCase();
  const sourceUrl = normalizeLooseText(record.source_url).toLowerCase();
  return `${normalizedName}::${phone}::${city || gov}::${sourceUrl}`;
}

export function mergeBusinesses(existing: NormalizedBusiness, incoming: NormalizedBusiness): NormalizedBusiness {
  const pick = <T>(a: T | null | undefined, b: T | null | undefined) => a ?? b;
  const higher = (existing.confidence_score || 0) >= (incoming.confidence_score || 0) ? existing : incoming;

  return {
    ...higher,
    local_name: pick(existing.local_name, incoming.local_name),
    category: pick(existing.category, incoming.category),
    subcategory: pick(existing.subcategory, incoming.subcategory),
    governorate: pick(existing.governorate, incoming.governorate),
    city: pick(existing.city, incoming.city),
    address: pick(existing.address, incoming.address),
    phone: pick(existing.phone, incoming.phone),
    website: pick(existing.website, incoming.website),
    facebook_url: pick(existing.facebook_url, incoming.facebook_url),
    instagram_url: pick(existing.instagram_url, incoming.instagram_url),
    map_url: pick(existing.map_url, incoming.map_url),
    latitude: pick(existing.latitude, incoming.latitude),
    longitude: pick(existing.longitude, incoming.longitude),
    opening_hours: pick(existing.opening_hours, incoming.opening_hours),
    source_url: pick(existing.source_url, incoming.source_url),
    confidence_score: Math.max(existing.confidence_score || 0, incoming.confidence_score || 0),
    source_attribution: Array.from(new Set([...(existing.source_attribution || []), ...(incoming.source_attribution || []), existing.source, incoming.source])),
    validation_flags: Array.from(new Set([...(existing.validation_flags || []), ...(incoming.validation_flags || [])])),
  };
}

export function dedupeBusinesses(records: NormalizedBusiness[]): NormalizedBusiness[] {
  const bucket = new Map<string, NormalizedBusiness>();

  for (const record of records) {
    const key = dedupeKey(record);
    const current = bucket.get(key);
    bucket.set(key, current ? mergeBusinesses(current, record) : record);
  }

  return Array.from(bucket.values())
    .filter((record) => !(record.validation_flags || []).includes("insufficient_contact_or_location"))
    .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));
}

export function sourcePriority(source: DiscoverySource) {
  const order: DiscoverySource[] = ["facebook", "instagram", "gemini", "osm", "web_directory", "google_places"];
  return order.indexOf(source);
}
