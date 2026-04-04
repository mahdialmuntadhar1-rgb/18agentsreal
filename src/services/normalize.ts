export interface RawBusinessRecord {
  id?: string;
  name?: string;
  name_en?: string;
  name_ar?: string;
  category?: string;
  city?: string;
  governorate?: string;
  province?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  source_name?: string;
  source?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  verified?: boolean;
  isVerified?: boolean;
  [key: string]: unknown;
}

export interface NormalizedBusinessRecord {
  id: string;
  name: string;
  nameAr?: string;
  category: string;
  city: string;
  governorate: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  sourceName: string;
  latitude?: number;
  longitude?: number;
  isVerified: boolean;
}

const governorateAliases: Record<string, string> = {
  baghdad: 'Baghdad',
  basra: 'Basra',
  erbil: 'Erbil',
  nineveh: 'Nineveh',
  najaf: 'Najaf',
  karbala: 'Karbala',
  kirkuk: 'Kirkuk',
  duhok: 'Duhok',
  dohuk: 'Duhok',
  sulaymaniyah: 'Sulaymaniyah',
};

const toNumber = (value: number | string | null | undefined): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const normalizeIraqiPhone = (phone?: string): string | undefined => {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('7')) return `0${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return digits;
  if (digits.length === 12 && digits.startsWith('964')) return `0${digits.slice(3)}`;
  if (digits.length === 13 && digits.startsWith('9640')) return `0${digits.slice(4)}`;

  return digits || undefined;
};

export const normalizeGovernorate = (value?: string): string => {
  if (!value) return 'Unknown';
  const cleaned = value.trim();
  const alias = governorateAliases[cleaned.toLowerCase()];
  return alias ?? cleaned;
};

export const normalizeBusinessRecord = (raw: RawBusinessRecord, fallbackId: string): NormalizedBusinessRecord => {
  const name = (raw.name_en ?? raw.name ?? '').toString().trim();

  return {
    id: String(raw.id ?? fallbackId),
    name: name || 'Unknown business',
    nameAr: raw.name_ar?.toString().trim() || undefined,
    category: (raw.category ?? 'unknown').toString().trim().toLowerCase(),
    city: (raw.city ?? 'Unknown').toString().trim(),
    governorate: normalizeGovernorate((raw.governorate ?? raw.province) as string | undefined),
    phone: normalizeIraqiPhone(raw.phone?.toString()),
    whatsapp: normalizeIraqiPhone(raw.whatsapp?.toString()),
    email: raw.email?.toString().trim().toLowerCase(),
    website: raw.website?.toString().trim(),
    sourceName: (raw.source_name ?? raw.source ?? 'unknown').toString(),
    latitude: toNumber((raw.latitude ?? raw.lat) as number | string | null | undefined),
    longitude: toNumber((raw.longitude ?? raw.lng) as number | string | null | undefined),
    isVerified: Boolean(raw.isVerified ?? raw.verified ?? false),
  };
};
