export type BusinessCategory =
  | "restaurants"
  | "cafes"
  | "hotels"
  | "pharmacies"
  | "hospitals"
  | "shops"
  | "markets"
  | "schools";

type GovernorateConfig = {
  governorate: string;
  city: string;
  center: { lat: number; lng: number };
  streets: string[];
  phonePrefix: string;
};

type Business = {
  name: string;
  category: BusinessCategory;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  rating: number;
  review_count: number;
  source: string;
};

const categories: BusinessCategory[] = [
  "restaurants",
  "cafes",
  "hotels",
  "pharmacies",
  "hospitals",
  "shops",
  "markets",
  "schools",
  "restaurants",
  "cafes",
  "hotels",
  "pharmacies",
  "hospitals",
  "shops",
  "markets",
  "schools",
  "restaurants",
  "cafes",
  "markets",
  "shops",
];

const categoryNames: Record<BusinessCategory, string[]> = {
  restaurants: ["مطعم", "Restaurant"],
  cafes: ["مقهى", "Cafe"],
  hotels: ["فندق", "Hotel"],
  pharmacies: ["صيدلية", "Pharmacy"],
  hospitals: ["مستشفى", "Hospital"],
  shops: ["متجر", "Shop"],
  markets: ["سوق", "Market"],
  schools: ["مدرسة", "School"],
};

const governorates: GovernorateConfig[] = [
  { governorate: "Baghdad", city: "Baghdad", center: { lat: 33.3152, lng: 44.3661 }, streets: ["Al-Mutanabbi Street", "Abu Nuwas Street", "Karrada Inside Street", "Palestine Street", "Al-Rasheed Street"], phonePrefix: "770" },
  { governorate: "Basra", city: "Basra", center: { lat: 30.5085, lng: 47.7804 }, streets: ["Al-Jumhuriya Street", "Corniche Al-Ashar", "Al-Tamimi Street", "Al-Mina Street", "Al-Jazair Street"], phonePrefix: "781" },
  { governorate: "Erbil", city: "Erbil", center: { lat: 36.1911, lng: 44.0092 }, streets: ["100 Meter Road", "Gulan Street", "Sami Abdulrahman Road", "Ankawa Main Road", "Kirkuk Road"], phonePrefix: "750" },
  { governorate: "Sulaymaniyah", city: "Sulaymaniyah", center: { lat: 35.5613, lng: 45.4304 }, streets: ["Salim Street", "Mawlawi Street", "Kawa Street", "Goizha Road", "Sarchnar Road"], phonePrefix: "751" },
  { governorate: "Kirkuk", city: "Kirkuk", center: { lat: 35.4681, lng: 44.3922 }, streets: ["Baghdad Road", "Shorja Street", "Atlas Street", "Rahim Awa Road", "Wahda Street"], phonePrefix: "772" },
  { governorate: "Najaf", city: "Najaf", center: { lat: 32.0008, lng: 44.3358 }, streets: ["Imam Ali Street", "Al-Sadiq Street", "Kufa Road", "Al-Thawra Street", "Maidan Street"], phonePrefix: "782" },
  { governorate: "Karbala", city: "Karbala", center: { lat: 32.616, lng: 44.0249 }, streets: ["Bab Baghdad Street", "Al-Qibla Street", "Al-Hussain Street", "Al-Jumhuriya Street", "Al-Hur Road"], phonePrefix: "783" },
  { governorate: "Mosul", city: "Mosul", center: { lat: 36.3456, lng: 43.1575 }, streets: ["Nineveh Street", "Al-Majmoua Street", "Al-Dawasa Street", "University Street", "Al-Zuhur Street"], phonePrefix: "771" },
  { governorate: "Anbar", city: "Ramadi", center: { lat: 33.4372, lng: 43.2861 }, streets: ["17 Tammuz Street", "Al-Malaab Street", "Al-Qadisiyah Street", "Al-Maaref Street", "Al-Andalus Street"], phonePrefix: "784" },
  { governorate: "Diyala", city: "Baqubah", center: { lat: 33.7466, lng: 44.6438 }, streets: ["Baghdad-Baqubah Road", "Tahrir Street", "Al-Muallimeen Street", "Al-Quds Street", "Oruba Street"], phonePrefix: "785" },
  { governorate: "Babil", city: "Hillah", center: { lat: 32.4729, lng: 44.4217 }, streets: ["40 Street", "Babylon Street", "Al-Jamaa Street", "Al-Salam Street", "Nile Street"], phonePrefix: "786" },
  { governorate: "Wasit", city: "Kut", center: { lat: 32.5128, lng: 45.8183 }, streets: ["Nahrain Street", "Damuk Street", "Al-Kafa'at Street", "Al-Hawraa Street", "Al-Rabee Street"], phonePrefix: "787" },
  { governorate: "Maysan", city: "Amarah", center: { lat: 31.8356, lng: 47.1442 }, streets: ["Dijla Street", "Al-Bitar Street", "Al-Matar Street", "Al-Rasheed Street", "Al-Jamaa Street"], phonePrefix: "788" },
  { governorate: "Dhi Qar", city: "Nasiriyah", center: { lat: 31.0425, lng: 46.2676 }, streets: ["Habboubi Street", "Euphrates Street", "Sumer Street", "Al-Islah Street", "Shuhada Street"], phonePrefix: "789" },
  { governorate: "Muthanna", city: "Samawah", center: { lat: 31.3136, lng: 45.2803 }, streets: ["Corniche Street", "Al-Zahraa Street", "Al-Jadida Street", "Al-Madina Street", "Al-Muthanna Street"], phonePrefix: "790" },
  { governorate: "Qadisiyyah", city: "Diwaniyah", center: { lat: 31.9905, lng: 44.9306 }, streets: ["Oruba Street", "Al-Madina Street", "Al-Jumhuriya Street", "Al-Thawra Street", "Euphrates Street"], phonePrefix: "791" },
  { governorate: "Saladin", city: "Tikrit", center: { lat: 34.6072, lng: 43.6782 }, streets: ["University Street", "Al-Zuhur Street", "Al-Qadisiya Street", "Al-Dour Road", "Al-Arbaeen Street"], phonePrefix: "792" },
  { governorate: "Dohuk", city: "Dohuk", center: { lat: 36.8617, lng: 42.9998 }, streets: ["Barzani Street", "Kawa Road", "Nohadra Street", "Amedi Road", "Zakho Street"], phonePrefix: "793" },
];

function generatePhone(prefix: string, index: number) {
  return `+964 ${prefix} ${String(1000000 + index * 379).slice(0, 3)} ${String(1000 + index * 17).slice(0, 4)}`;
}

function buildGovernorateBusinesses(config: GovernorateConfig): Business[] {
  return categories.map((category, index) => {
    const street = config.streets[index % config.streets.length];
    const [arType, enType] = categoryNames[category];
    const seq = index + 1;

    return {
      name: `${arType} ${config.city} ${seq} - ${config.governorate} ${enType} ${seq}`,
      category,
      address: `${street}, ${config.city}, ${config.governorate}, Iraq`,
      city: config.city,
      latitude: Number((config.center.lat + (index - 10) * 0.0021).toFixed(6)),
      longitude: Number((config.center.lng + (10 - index) * 0.0018).toFixed(6)),
      phone: generatePhone(config.phonePrefix, seq),
      website: `https://${config.governorate.toLowerCase().replace(/\s+/g, "-")}-${category}-${seq}.iq`,
      rating: Number((4 + (index % 5) * 0.15).toFixed(1)),
      review_count: 35 + index * 18,
      source: "Iraqi Mock Directory",
    };
  });
}

const governorateBusinesses = Object.fromEntries(
  governorates.map((config) => [config.governorate, buildGovernorateBusinesses(config)]),
) as Record<string, Business[]>;

export function getGovernorateBusinesses(governorate: string): Business[] {
  return governorateBusinesses[governorate] ?? [];
}

export const governorateNames = governorates.map((g) => g.governorate);
