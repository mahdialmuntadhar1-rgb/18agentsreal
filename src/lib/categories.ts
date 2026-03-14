export const ALLOWED_CATEGORIES = [
  "restaurants",
  "cafes",
  "bakeries",
  "hotels",
  "gyms",
  "beauty_salons",
  "pharmacies",
  "supermarkets",
] as const;

export type AllowedCategory = (typeof ALLOWED_CATEGORIES)[number];
