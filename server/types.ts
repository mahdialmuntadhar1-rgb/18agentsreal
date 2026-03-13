export const GOVERNORATES = [
  "Erbil",
  "Sulaymaniyah",
  "Duhok",
  "Baghdad",
  "Basra",
  "Nineveh",
  "Kirkuk",
  "Najaf",
  "Karbala",
  "Anbar",
  "Babil",
  "Diyala",
  "Dhi Qar",
  "Maysan",
  "Muthanna",
  "Qadisiyyah",
  "Wasit",
  "Salah al-Din",
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

export const SOURCE_PRIORITY = [
  "google_maps",
  "official_website",
  "facebook",
  "instagram",
  "local_directory",
  "government_registry",
] as const;

export type SourceName = (typeof SOURCE_PRIORITY)[number];

export type BusinessRow = {
  id: string;
  name: string | null;
  category: string | null;
  phone_number: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  governorate: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  opening_hours: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  logo_image_url: string | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  short_description: string | null;
  status: string | null;
  enriched: boolean | null;
};

export type EnrichedBusinessPayload = {
  name: string | null;
  category: string | null;
  phone_number: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  governorate: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  opening_hours: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  logo_image_url: string | null;
  cover_image_url: string | null;
  gallery_images: string[];
  short_description: string | null;
  status: "enriched" | "not_found";
  verified_sources: SourceName[];
  enriched: true;
  last_checked: string;
};

export type SourceCandidate = Partial<EnrichedBusinessPayload> & {
  source: SourceName;
  confidence: number;
};
