import type { NormalizedBusinessRecord } from './normalize';

export type MatchDecision = 'NEW' | 'UPDATE' | 'DUPLICATE' | 'REVIEW';

const normalizeName = (name: string): string => name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

const hasSameContact = (a: NormalizedBusinessRecord, b: NormalizedBusinessRecord): boolean => {
  const phones = [a.phone, a.whatsapp].filter(Boolean);
  const otherPhones = [b.phone, b.whatsapp].filter(Boolean);
  if (phones.some(phone => otherPhones.includes(phone))) return true;
  return Boolean(a.email && b.email && a.email === b.email);
};

export const classifyRecordMatch = (
  incoming: NormalizedBusinessRecord,
  existing?: NormalizedBusinessRecord,
): MatchDecision => {
  if (!existing) return 'NEW';

  const sameName = normalizeName(incoming.name) === normalizeName(existing.name);
  const sameLocation = incoming.governorate === existing.governorate && incoming.city === existing.city;
  const sameContact = hasSameContact(incoming, existing);

  if (sameName && sameContact) {
    if (incoming.isVerified && !existing.isVerified) return 'UPDATE';
    return 'DUPLICATE';
  }

  if (sameName && sameLocation) return 'REVIEW';
  if (sameContact && !sameName) return 'REVIEW';

  return 'NEW';
};

export const mergeMatchedRecords = (
  primary: NormalizedBusinessRecord,
  incoming: NormalizedBusinessRecord,
): NormalizedBusinessRecord => ({
  ...primary,
  ...incoming,
  name: primary.name !== 'Unknown business' ? primary.name : incoming.name,
  sourceName: `${primary.sourceName},${incoming.sourceName}`,
  isVerified: primary.isVerified || incoming.isVerified,
  phone: primary.phone ?? incoming.phone,
  whatsapp: primary.whatsapp ?? incoming.whatsapp,
  email: primary.email ?? incoming.email,
  website: primary.website ?? incoming.website,
  latitude: primary.latitude ?? incoming.latitude,
  longitude: primary.longitude ?? incoming.longitude,
});
