import { PhoneNumberData } from '@/types';

/**
 * Format phone number to E.164 international format
 * Example: +254712345678
 */
export function formatPhoneToE164(phone: string, countryCode: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If already has country code, return with +
  if (cleaned.startsWith(countryCode.replace('+', ''))) {
    return `+${cleaned}`;
  }
  
  // Remove leading zero if present (common in many countries)
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
  
  return `${countryCode}${withoutLeadingZero}`;
}

/**
 * Validate phone number data from react-native-phone-number-input
 */
export function validatePhoneNumber(phoneData: PhoneNumberData): boolean {
  if (!phoneData.isValid) {
    return false;
  }
  
  // Check E.164 format
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneData.e164Number);
}

/**
 * Parse E.164 phone number to display format
 */
export function parseE164ToDisplay(e164: string): string {
  // Remove the + prefix
  const cleaned = e164.replace('+', '');
  
  // Format based on length (this is a simple formatter)
  if (cleaned.length <= 10) {
    return e164;
  }
  
  // Example: +254 712 345 678
  const countryCode = cleaned.slice(0, -9);
  const firstPart = cleaned.slice(-9, -6);
  const secondPart = cleaned.slice(-6, -3);
  const thirdPart = cleaned.slice(-3);
  
  return `+${countryCode} ${firstPart} ${secondPart} ${thirdPart}`;
}

/**
 * Check if phone number is unique in database
 */
export function normalizePhoneNumber(phone: string): string {
  // Always store in E.164 format without spaces
  return phone.replace(/\s/g, '');
}

/**
 * Extract country code from E.164 phone number
 */
export function extractCountryCode(e164: string): string {
  // Extract country code (e.g., +254 from +254712345678)
  const match = e164.match(/^\+(\d{1,3})/);
  return match ? `+${match[1]}` : '';
}
