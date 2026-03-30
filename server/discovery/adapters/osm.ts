import { BaseDiscoveryAdapter } from "./base.js";
import { DiscoveryInput, NormalizedBusiness } from "../types.js";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Baghdad: { lat: 33.3152, lng: 44.3661 },
  Basra: { lat: 30.5085, lng: 47.7804 },
  Erbil: { lat: 36.1911, lng: 44.0092 },
  Mosul: { lat: 36.34, lng: 43.13 },
  Sulaymaniyah: { lat: 35.5613, lng: 45.4305 },
};

export class OpenStreetMapAdapter extends BaseDiscoveryAdapter {
  readonly source = "osm" as const;

  async searchBusinesses(input: DiscoveryInput): Promise<NormalizedBusiness[]> {
    const city = input.city || "Baghdad";
    const center = CITY_COORDS[city] || CITY_COORDS.Baghdad;
    const category = (input.category || "restaurant").toLowerCase();
    const radius = 12000;

    const query = `[out:json][timeout:25];(node[\"amenity\"~\"${category}|restaurant|cafe|pharmacy|hospital|bank|marketplace\"](around:${radius},${center.lat},${center.lng});way[\"amenity\"~\"${category}|restaurant|cafe|pharmacy|hospital|bank|marketplace\"](around:${radius},${center.lat},${center.lng}););out center 40;`;

    const resp = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!resp.ok) return [];

    const data = await resp.json();
    const elements = Array.isArray(data?.elements) ? data.elements : [];

    return elements
      .map((el: any) => {
        const lat = el.lat ?? el.center?.lat ?? null;
        const lon = el.lon ?? el.center?.lon ?? null;
        return this.normalizeBusiness({
          external_id: String(el.id),
          name: el.tags?.name || el.tags?.brand,
          local_name: el.tags?.["name:ar"] || el.tags?.["name:ku"],
          category: el.tags?.amenity || category,
          city,
          governorate: input.governorate || city,
          address: [el.tags?.["addr:street"], el.tags?.["addr:suburb"]].filter(Boolean).join(", "),
          phone: el.tags?.phone || el.tags?.contact?.phone,
          website: el.tags?.website,
          map_url: lat && lon ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}` : null,
          source_url: lat && lon ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}` : null,
          latitude: lat,
          longitude: lon,
          opening_hours: el.tags?.opening_hours,
          confidence_score: 55,
          extraction_notes: "OSM/Overpass geolocation record",
          raw_payload: el,
        });
      })
      .filter((b): b is NormalizedBusiness => !!b);
  }
}
