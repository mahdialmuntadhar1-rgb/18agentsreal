import { Client } from '@googlemaps/places';

let placesClient: Client | null = null;

export const getPlacesClient = () => {
  if (!placesClient) {
    placesClient = new Client({
      apiKey: process.env.GOOGLE_PLACES_API_KEY!
    });
  }

  return placesClient;
};

export interface GooglePlaceResult {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  location?: { latitude: number; longitude: number };
  googleMapsUri?: string;
  types?: string[];
}
