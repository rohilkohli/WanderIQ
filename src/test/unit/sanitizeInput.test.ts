// ============================================================
// WanderIQ — Unit Tests: Input Sanitization
// ============================================================

import { describe, it, expect } from 'vitest';
import { sanitizeInput, hasInjectionRisk, isValidEmail, formatCurrency, daysBetween } from '@/lib/utils';

describe('sanitizeInput', () => {
  it('strips HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<script>');
  });
  it('removes javascript: protocol', () => {
    expect(sanitizeInput('javascript:void(0)')).not.toContain('javascript:');
  });
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });
  it('respects maxLength', () => {
    const long = 'a'.repeat(3000);
    expect(sanitizeInput(long, 100).length).toBeLessThanOrEqual(100);
  });
  it('returns empty string for non-string input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeInput(null as unknown as string)).toBe('');
  });
  it('allows normal travel text', () => {
    const text = 'I want to visit Goa for 5 days with a vegetarian diet under ₹40,000';
    expect(sanitizeInput(text)).toBe(text);
  });
});

describe('hasInjectionRisk', () => {
  it('detects XSS patterns', () => {
    expect(hasInjectionRisk('<script>evil</script>')).toBe(true);
    expect(hasInjectionRisk('onclick=bad')).toBe(true);
  });
  it('returns false for safe text', () => {
    expect(hasInjectionRisk('Visit the Taj Mahal at sunrise')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('validates correct emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user+tag@sub.domain.com')).toBe(true);
  });
  it('rejects invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('formatCurrency', () => {
  it('formats INR correctly', () => {
    const result = formatCurrency(40000, 'INR');
    expect(result).toContain('40,000');
  });
  it('formats USD correctly', () => {
    const result = formatCurrency(500, 'USD');
    expect(result).toContain('500');
  });
});

describe('daysBetween', () => {
  it('returns correct number of days', () => {
    expect(daysBetween('2026-06-15', '2026-06-22')).toBe(7);
  });
  it('handles same-day travel', () => {
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
  });
});
