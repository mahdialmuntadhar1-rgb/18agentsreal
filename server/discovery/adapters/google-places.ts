import { BaseDiscoveryAdapter } from "./base.js";
import { DiscoveryInput, NormalizedBusiness } from "../types.js";

export class GooglePlacesAdapter extends BaseDiscoveryAdapter {
  readonly source = "google_places" as const;

  async searchBusinesses(input: DiscoveryInput): Promise<NormalizedBusiness[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];

    const city = input.city || "Baghdad";
    const category = input.category || "business";
    const q = encodeURIComponent(`${category} in ${city}, Iraq`);

    const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${apiKey}`);
    if (!response.ok) return [];

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    return results
      .slice(0, input.limit || 8)
      .map((place: any) => this.normalizeBusiness({
        external_id: place.place_id,
        name: place.name,
        category,
        city,
        governorate: input.governorate || city,
        address: place.formatted_address,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        map_url: place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : null,
        source_url: place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : null,
        confidence_score: 50,
        extraction_notes: "Optional Google Places fallback",
        raw_payload: place,
      }))
      .filter((b): b is NormalizedBusiness => !!b);
  }
}
