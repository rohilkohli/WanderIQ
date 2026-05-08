// ============================================================
// WanderIQ — Unit Tests: Budget Helpers
// ============================================================

import { describe, it, expect } from 'vitest';
import { sumBudget, getDailyBudget, getCategoryPercentage, getBudgetHealth } from '@/lib/budget';
import type { BudgetBreakdown } from '@/types';

const SAMPLE_BREAKDOWN: BudgetBreakdown = {
  flights:       8000,
  accommodation: 12000,
  food:          8000,
  activities:    5000,
  transport:     3500,
  miscellaneous: 1200,
};

describe('sumBudget', () => {
  it('sums all categories correctly', () => {
    expect(sumBudget(SAMPLE_BREAKDOWN)).toBe(37700);
  });
  it('handles zero values', () => {
    const zero: BudgetBreakdown = {
      flights: 0, accommodation: 0, food: 0, activities: 0, transport: 0, miscellaneous: 0,
    };
    expect(sumBudget(zero)).toBe(0);
  });
});

describe('getDailyBudget', () => {
  it('calculates daily budget correctly', () => {
    expect(getDailyBudget(40000, 7)).toBe(5714);
  });
  it('returns 0 for zero days', () => {
    expect(getDailyBudget(40000, 0)).toBe(0);
  });
  it('handles single-day trip', () => {
    expect(getDailyBudget(5000, 1)).toBe(5000);
  });
});

describe('getCategoryPercentage', () => {
  it('calculates percentage correctly', () => {
    expect(getCategoryPercentage(8000, 40000)).toBe(20);
  });
  it('returns 0 when total budget is 0', () => {
    expect(getCategoryPercentage(500, 0)).toBe(0);
  });
});

describe('getBudgetHealth', () => {
  it('returns good for <= 70%', () => {
    expect(getBudgetHealth(60)).toBe('good');
    expect(getBudgetHealth(70)).toBe('good');
  });
  it('returns warning for 71–90%', () => {
    expect(getBudgetHealth(80)).toBe('warning');
    expect(getBudgetHealth(90)).toBe('warning');
  });
  it('returns danger for > 90%', () => {
    expect(getBudgetHealth(95)).toBe('danger');
    expect(getBudgetHealth(100)).toBe('danger');
  });
});
