// ============================================================
// WanderIQ — Input Sanitization & Validation
// ============================================================

const HTML_TAG_REGEX = /<[^>]*>/g;
const INJECTION_PATTERNS = [
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<script/gi,
  /eval\s*\(/gi,
  /\bINJECT\b/gi,
];

/**
 * Sanitize user-provided text before sending to Gemini or storing in Firestore.
 * @param input - The raw string input from the user
 * @param maxLength - The maximum allowed length for the string
 * @returns The sanitized string safe for processing
 */
export function sanitizeInput(input: string, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  let clean = input
    .replace(HTML_TAG_REGEX, '')
    .trim()
    .slice(0, maxLength);
  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, '');
  }
  return clean;
}

/**
 * Check if a string has potential XSS/injection content.
 * @param input - The string to check for malicious patterns
 * @returns True if the string contains risky patterns, false otherwise
 */
export function hasInjectionRisk(input: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(input));
}

/**
 * Validate email format.
 * @param email - The email string to validate
 * @returns True if the email is properly formatted, false otherwise
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate a date string is in ISO format and is a real date.
 * @param dateStr - The date string to validate
 * @returns True if the date is valid, false otherwise
 */
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Clamp a number between min and max.
 * @param value - The number to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The clamped number
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Truncate text for display.
 * @param text - The text string to truncate
 * @param maxLength - The maximum allowed length of the text
 * @returns The truncated string with an ellipsis if it exceeded maxLength
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Format a number as currency.
 * @param amount - The numeric amount to format
 * @param currency - The currency code to format as
 * @returns The formatted currency string
 */
export function formatCurrency(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date range for display.
 * @param start - The start date string
 * @param end - The end date string
 * @returns A formatted string representing the date range
 */
export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (s.getFullYear() !== e.getFullYear()) {
    opts.year = 'numeric';
  }
  return `${s.toLocaleDateString('en-IN', opts)} – ${e.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })}`;
}

/**
 * Get number of days between two date strings.
 * @param start - The start date string
 * @param end - The end date string
 * @returns The number of days between the start and end dates
 */
export function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Generate a random ID.
 * @returns A random unique identifier string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
