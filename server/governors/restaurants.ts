import { BaseGovernor, type BusinessData } from "./base-governor.ts";
import { GeminiResearchAdapter } from "../sources/gemini-research-adapter.ts";

export class RestaurantsGovernor extends BaseGovernor {
  category = "restaurants";
  agentName = "Agent-01";
  governmentRate = "Rate Level 1";
  city = "Baghdad";
  private sourceAdapter: GeminiResearchAdapter;

<<<<<<< Updated upstream
  async gather(city?: string): Promise<any[]> {
    const targetCity = city || "Baghdad";
    console.log(`Gathering data for ${this.category} in ${targetCity}...`);
    
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey || apiKey === "your-google-places-api-key") {
      console.log("No GOOGLE_PLACES_API_KEY found. Returning mock data.");
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
 
      // Mock data for demonstration
      return [
        {
          name: "Al-Baghdadi Traditional Restaurant",
          category: this.category,
          address: "Al-Mutanabbi Street",
          city: targetCity,
          latitude: 33.3386,
          longitude: 44.3939,
          phone: "+964 770 123 4567",
          website: "https://example.com",
          source_url: "https://example.com/al-baghdadi",
          description: `Authentic Iraqi cuisine in the heart of ${targetCity}.`,
          operating_hours: "11:00 AM - 11:00 PM",
          rating: 4.5,
          review_count: 120,
          source: "Google Places",
          verification_status: "Verified",
          date_collected: new Date()
        },
        {
          name: "Tigris River Cafe & Grill",
          category: this.category,
          address: "Abu Nuwas Street",
          city: targetCity,
          latitude: 33.3152,
          longitude: 44.4009,
          phone: "+964 780 987 6543",
          website: "https://example.com",
          source_url: "https://example.com/tigris-river",
          description: `Riverside dining with a view of the river in ${targetCity}.`,
          operating_hours: "09:00 AM - 12:00 AM",
          rating: 4.8,
          review_count: 340,
          source: "Google Places",
          verification_status: "Verified",
          date_collected: new Date()
        },
      ];
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
=======
  constructor(agentName?: string, city?: string, governmentRate?: string) {
    super();
    if (agentName) this.agentName = agentName;
    if (city) this.city = city;
    if (governmentRate) this.governmentRate = governmentRate;
    this.sourceAdapter = new GeminiResearchAdapter(process.env.GEMINI_API_KEY);
  }

  async gather(city?: string, category?: string): Promise<BusinessData[]> {
    const targetCity = city || this.city;
    const targetCategory = category || this.category;
    console.log(`Gathering ${targetCategory} data in ${targetCity}...`);

    return this.sourceAdapter.search({
      category: targetCategory,
      city: targetCity,
      country: "Iraq",
      limit: 20,
      strictCityCenter: true,  // Only search city center, not suburbs
    });
>>>>>>> Stashed changes
  }
}
