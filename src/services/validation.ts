import type { NormalizedBusinessRecord } from './normalize';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlRegex = /^https?:\/\/[\w.-]+(?:\.[\w\.-]+)+[/#?]?.*$/i;

export const isValidIraqiPhone = (phone?: string): boolean => {
  if (!phone) return false;
  return /^07\d{9}$/.test(phone);
};

export const isValidEmail = (email?: string): boolean => {
  if (!email) return false;
  return emailRegex.test(email);
};

export const isValidUrl = (url?: string): boolean => {
  if (!url) return false;
  return urlRegex.test(url);
};

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

export const validateBusinessRecord = (record: NormalizedBusinessRecord): ValidationResult => {
  const issues: string[] = [];

  if (!record.name || record.name === 'Unknown business') issues.push('missing_name');
  if (!record.city || record.city === 'Unknown') issues.push('missing_city');
  if (!isValidIraqiPhone(record.phone) && !isValidIraqiPhone(record.whatsapp)) issues.push('missing_valid_phone');
  if (record.email && !isValidEmail(record.email)) issues.push('invalid_email');
  if (record.website && !isValidUrl(record.website)) issues.push('invalid_website');
  if (record.latitude !== undefined && record.longitude === undefined) issues.push('partial_geocode');

  return { isValid: issues.length === 0, issues };
};

export const calculateCompletenessScore = (record: NormalizedBusinessRecord): number => {
  const checks = [
    Boolean(record.name && record.name !== 'Unknown business'),
    Boolean(record.category && record.category !== 'unknown'),
    Boolean(record.city && record.city !== 'Unknown'),
    Boolean(record.governorate && record.governorate !== 'Unknown'),
    Boolean(isValidIraqiPhone(record.phone) || isValidIraqiPhone(record.whatsapp)),
    Boolean(record.email ? isValidEmail(record.email) : false),
    Boolean(record.website ? isValidUrl(record.website) : false),
    Boolean(record.latitude !== undefined && record.longitude !== undefined),
  ];

  const present = checks.filter(Boolean).length;
  return Math.round((present / checks.length) * 100);
};
