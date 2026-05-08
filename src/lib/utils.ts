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
 */
export function hasInjectionRisk(input: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(input));
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate a date string is in ISO format and is a real date.
 */
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Truncate text for display.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Format a number as currency.
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
 */
export function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Generate a random ID.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
