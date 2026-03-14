import { BaseGovernor } from "./base-governor.js";

export class DhiQarGovernor extends BaseGovernor {
  category = "Dhi Qar";
  agentName = "Gov-15 Dhi Qar";

  async gather(): Promise<any[]> {
    console.log(`Gathering data for ${this.category}...`);
    
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey || apiKey === "your-google-places-api-key") {
      console.log("No GOOGLE_PLACES_API_KEY found. Returning mock data.");
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock data for demonstration
      return [
        {
          name: "Dhi Qar Heritage Restaurant",
          category: this.category,
          address: "City Center Road",
          city: "Dhi Qar",
          latitude: 31.0461,
          longitude: 46.2573,
          phone: "+964 770 123 4567",
          website: "https://example.com",
          rating: 4.4,
          review_count: 110,
          source: "Google Places",
        },
        {
          name: "Dhi Qar Riverside Grill",
          category: this.category,
          address: "Main Market Street",
          city: "Dhi Qar",
          latitude: 31.0661,
          longitude: 46.2773,
          phone: "+964 780 987 6543",
          website: "https://example.com",
          rating: 4.7,
          review_count: 260,
          source: "Google Places",
        },
      ];
    }

    try {
      console.log("Fetching real data from Google Places API...");
      const query = encodeURIComponent("best restaurants in Dhi Qar, Iraq");
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
        city: "Dhi Qar",
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
