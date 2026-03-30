export type DiscoverySource = "gemini" | "facebook" | "instagram" | "osm" | "web_directory" | "google_places";

export type DiscoveryInput = {
  query: string;
  category?: string;
  city?: string;
  governorate?: string;
  country?: string;
  languageHint?: "en" | "ar" | "ku";
  limit?: number;
  includeGoogleFallback?: boolean;
};

export type NormalizedBusiness = {
  external_id?: string | null;
  name: string;
  local_name?: string | null;
  category?: string | null;
  subcategory?: string | null;
  governorate?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  map_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_hours?: string | null;
  source: DiscoverySource;
  source_url?: string | null;
  confidence_score?: number | null;
  extraction_notes?: string | null;
  discovered_at?: string | null;
  raw_payload?: unknown;
  validation_flags?: string[];
  source_attribution?: string[];
};

export type AdapterRunLog = {
  adapter: DiscoverySource;
  ok: boolean;
  count: number;
  error?: string;
  durationMs: number;
};

export interface DiscoveryAdapter {
  readonly source: DiscoverySource;
  searchBusinesses(input: DiscoveryInput): Promise<NormalizedBusiness[]>;
  normalizeBusiness(raw: unknown): NormalizedBusiness | null;
  scoreBusiness(record: NormalizedBusiness): number;
  enrichBusiness?(record: NormalizedBusiness): Promise<NormalizedBusiness>;
}

export type OrchestratorResult = {
  query: DiscoveryInput;
  records: NormalizedBusiness[];
  logs: AdapterRunLog[];
};
