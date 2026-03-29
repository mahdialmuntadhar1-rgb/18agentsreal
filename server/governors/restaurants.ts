import { BaseGovernor } from "./base-governor.js";

export class RestaurantsGovernor extends BaseGovernor {
  category = "Restaurants";
  agentName = "Agent-01";
  governmentRate = "Rate Level 1";

  async gather(city?: string): Promise<any[]> {
    const targetCity = city || "Baghdad";
    console.log(`Gathering data for ${this.category} in ${targetCity}...`);

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || apiKey === "your-google-places-api-key") {
      console.warn("GOOGLE_PLACES_API_KEY is not configured. No records collected for this run.");
      return [];
    }

    try {
      console.log(`Fetching real data for ${targetCity} from Google Places API...`);
      const query = encodeURIComponent(`best restaurants in ${targetCity}, Iraq`);
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.results) {
        console.error("Google Places API error:", data);
        return [];
      }

      return data.results.map((place: any) => ({
        name: place.name,
        category: this.category,
        address: place.formatted_address,
        city: targetCity,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        rating: place.rating,
        review_count: place.user_ratings_total,
        source: "Google Places",
      }));
    } catch (error) {
      console.error("Error fetching from Google Places API:", error);
      return [];
    }
  }
}
