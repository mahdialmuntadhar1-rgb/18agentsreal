import { BaseSourceAdapter, BusinessData, SearchQuery } from './base-adapter.ts';

export class GooglePlacesAdapter extends BaseSourceAdapter {
  name = 'Google Places';
  requiresApiKey = true;

  // City center coordinates for major Iraqi cities (downtown areas)
  private cityCenterCoords: Record<string, { lat: number; lng: number; radius: number }> = {
    'Baghdad': { lat: 33.3152, lng: 44.3661, radius: 8000 },      // 8km radius - central Baghdad
    'Basra': { lat: 30.5156, lng: 47.7804, radius: 7000 },        // 7km radius - downtown Basra
    'Erbil': { lat: 36.1911, lng: 44.0092, radius: 6000 },        // 6km radius - city center
    'Sulaymaniyah': { lat: 35.5575, lng: 45.4350, radius: 6000 }, // 6km radius
    'Nineveh': { lat: 36.3566, lng: 43.1640, radius: 5000 },       // Mosul center
    'Kirkuk': { lat: 35.4669, lng: 44.3929, radius: 5500 },        // Kirkuk center
    'Duhok': { lat: 36.8673, lng: 42.9883, radius: 4000 },          // Duhok center
    'Anbar': { lat: 33.4254, lng: 43.2886, radius: 5000 },          // Ramadi center
    'Babil': { lat: 32.4776, lng: 44.4188, radius: 5000 },         // Hillah center
    'Karbala': { lat: 32.6188, lng: 44.0281, radius: 5000 },       // Karbala center
    'Wasit': { lat: 32.5148, lng: 45.8341, radius: 5000 },         // Kut center
    'Dhi Qar': { lat: 31.0579, lng: 46.2573, radius: 5000 },       // Nasiriyah center
    'Maysan': { lat: 31.9028, lng: 47.1581, radius: 5000 },         // Amara center
    'Muthanna': { lat: 30.1984, lng: 45.3504, radius: 5000 },       // Samawah center
    'Najaf': { lat: 32.0019, lng: 44.3302, radius: 6000 },         // Najaf center
    'Qadisiyyah': { lat: 31.9837, lng: 44.9241, radius: 5000 },     // Diwaniyah center
    'Saladin': { lat: 34.6176, lng: 43.6793, radius: 5000 },        // Tikrit center
    'Diyala': { lat: 33.7500, lng: 44.6000, radius: 5000 },         // Baqubah center
  };

  async search(query: SearchQuery): Promise<BusinessData[]> {
    if (!this.apiKey) {
      console.warn('GooglePlacesAdapter: No API key provided');
      return [];
    }

    // Use city center coordinates with radius to target downtown, not suburbs
    const cityCenter = this.cityCenterCoords[query.city];
    
    let url: string;
    
    if (cityCenter) {
      // Use location + radius to stay within city center
      const location = `${cityCenter.lat},${cityCenter.lng}`;
      const radius = query.radius || cityCenter.radius;
      const searchQuery = encodeURIComponent(`${query.category} in ${query.city}`);
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&location=${location}&radius=${radius}&key=${this.apiKey}`;
      console.log(`🔍 Searching ${query.category} in ${query.city} city center (radius: ${radius}m)`);
    } else {
      // Fallback to text search with "downtown" qualifier
      const searchQuery = encodeURIComponent(`${query.category} downtown ${query.city}, ${query.country || 'Iraq'}`);
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${this.apiKey}`;
      console.log(`🔍 Searching ${query.category} downtown ${query.city} (no coords found)`);
    }

    try {
      const response = await this.fetchWithRetry(url);
      const data = await response.json();

      if (!data.results || data.status !== 'OK') {
        console.error('Google Places API error:', data.status, data.error_message);
        return [];
      }

      // Filter results to ensure they're within the city (not suburbs)
      let results = data.results;
      if (cityCenter && query.strictCityCenter) {
        results = results.filter((place: any) => {
          const lat = place.geometry?.location?.lat;
          const lng = place.geometry?.location?.lng;
          if (!lat || !lng) return false;
          // Calculate distance from city center
          const distance = this.calculateDistance(cityCenter.lat, cityCenter.lng, lat, lng);
          return distance <= (cityCenter.radius / 1000); // Convert meters to km
        });
        console.log(`📍 Filtered to ${results.length} results within city center`);
      }

      return results.map((place: any) => ({
        name: place.name,
        category: query.category,
        city: query.city,
        address: place.formatted_address,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        rating: place.rating,
        review_count: place.user_ratings_total,
        source_name: this.name,
        external_source_id: place.place_id,
        source_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      }));
    } catch (error) {
      console.error('GooglePlacesAdapter search error:', error);
      return [];
    }
  }

  async getById(placeId: string): Promise<BusinessData | null> {
    if (!this.apiKey) return null;

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${this.apiKey}`;

    try {
      const response = await this.fetchWithRetry(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.result) return null;

      const place = data.result;
      return {
        name: place.name,
        category: place.types?.[0] || 'unknown',
        city: this.extractCity(place.address_components),
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        rating: place.rating,
        review_count: place.user_ratings_total,
        opening_hours: place.opening_hours?.weekday_text?.join(', '),
        photos: place.photos?.map((p: any) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${this.apiKey}`),
        source_name: this.name,
        external_source_id: place.place_id,
        source_url: place.url,
      };
    } catch (error) {
      console.error('GooglePlacesAdapter getById error:', error);
      return null;
    }
  }

  private extractCity(components: any[]): string {
    if (!components) return '';
    const cityComponent = components.find((c: any) =>
      c.types.includes('locality') || c.types.includes('administrative_area_level_2')
    );
    return cityComponent?.long_name || '';
  }

  // Calculate distance between two coordinates in km (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
