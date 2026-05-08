import { describe, it, expect } from 'vitest';
import { isValidDate, clamp, truncate, formatCurrency, formatDateRange, daysBetween, generateId } from '@/lib/utils';

describe('utils', () => {
  it('isValidDate works', () => {
    expect(isValidDate('2024-01-01')).toBe(true);
    expect(isValidDate('invalid-date')).toBe(false);
  });
  
  it('clamp works', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(0, 1, 10)).toBe(1);
    expect(clamp(20, 1, 10)).toBe(10);
  });

  it('truncate works', () => {
    expect(truncate('hello world', 50)).toBe('hello world');
    expect(truncate('hello world', 5)).toBe('hell…');
  });

  it('formatCurrency works', () => {
    expect(formatCurrency(1000)).toMatch(/1,000/);
    expect(formatCurrency(1000, 'USD')).toMatch(/1,000/);
  });

  it('formatDateRange works', () => {
    expect(formatDateRange('2024-01-01', '2024-01-10')).toContain('2024');
    expect(formatDateRange('2024-12-01', '2025-01-10')).toContain('2024');
  });

  it('daysBetween works', () => {
    expect(daysBetween('2024-01-01', '2024-01-10')).toBe(9);
  });

  it('generateId works', () => {
    expect(generateId()).toBeTypeOf('string');
    expect(generateId().length).toBeGreaterThan(5);
  });
});
