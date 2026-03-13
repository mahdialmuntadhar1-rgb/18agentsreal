import { normalizeMultilingualText, normalizeUrl } from "./text-normalization.js";
import type { BusinessRow, SourceCandidate, SourceName } from "./types.js";

export interface SourceProvider {
  source: SourceName;
  lookup(business: BusinessRow): Promise<SourceCandidate | null>;
}

class GoogleMapsProvider implements SourceProvider {
  source: SourceName = "google_maps";

  async lookup(business: BusinessRow): Promise<SourceCandidate | null> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || !business.name) {
      return null;
    }

    const query = encodeURIComponent(`${business.name} ${business.city ?? ""} ${business.governorate ?? "Iraq"}`.trim());
    const endpoint = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;
    const response = await fetch(endpoint);
    const payload = await response.json();
    const first = payload.results?.[0];

    if (!first) {
      return null;
    }

    return {
      source: this.source,
      confidence: 0.95,
      name: normalizeMultilingualText(first.name) ?? null,
      address: normalizeMultilingualText(first.formatted_address) ?? null,
      latitude: first.geometry?.location?.lat ?? null,
      longitude: first.geometry?.location?.lng ?? null,
      google_maps_url: first.place_id ? `https://maps.google.com/?cid=${first.place_id}` : null,
      category: first.types?.[0] ?? null,
    };
  }
}

class UrlPresenceProvider implements SourceProvider {
  constructor(public source: SourceName, private field: "website" | "facebook_url" | "instagram_url") {}

  async lookup(business: BusinessRow): Promise<SourceCandidate | null> {
    const value = business[this.field];
    if (!value) {
      return null;
    }

    return {
      source: this.source,
      confidence: 0.7,
      [this.field]: normalizeUrl(value),
    };
  }
}

export const providers: SourceProvider[] = [
  new GoogleMapsProvider(),
  new UrlPresenceProvider("official_website", "website"),
  new UrlPresenceProvider("facebook", "facebook_url"),
  new UrlPresenceProvider("instagram", "instagram_url"),
];
