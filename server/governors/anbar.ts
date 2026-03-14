import { BaseGovernor } from "./base-governor.js";

export class AnbarGovernor extends BaseGovernor {
  category = "Anbar";
  agentName = "Gov-10 Anbar";

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
          name: "Anbar Heritage Restaurant",
          category: this.category,
          address: "City Center Road",
          city: "Anbar",
          latitude: 33.4258,
          longitude: 43.3,
          phone: "+964 770 123 4567",
          website: "https://example.com",
          rating: 4.4,
          review_count: 110,
          source: "Google Places",
        },
        {
          name: "Anbar Riverside Grill",
          category: this.category,
          address: "Main Market Street",
          city: "Anbar",
          latitude: 33.4458,
          longitude: 43.3200,
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
      const query = encodeURIComponent("best restaurants in Anbar, Iraq");
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
        city: "Anbar",
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
