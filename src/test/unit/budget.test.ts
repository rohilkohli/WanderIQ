// ============================================================
// WanderIQ — Unit Tests: Budget Helpers
// ============================================================

import { describe, it, expect } from 'vitest';
import { sumBudget, getDailyBudget, getCategoryPercentage, getBudgetHealth, calculateEstimatedSpend, getBudgetSummary } from '@/lib/budget';
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

describe('calculateEstimatedSpend & getBudgetSummary', () => {
  const dummyItinerary = {
    totalBudget: 10000,
    budget: { flights: 1000, accommodation: 2000, food: 0, activities: 0, transport: 0, miscellaneous: 0 },
    days: [
      {
        id: 'd1', dayNumber: 1,
        morning: [{ id: 'a1', name: 'Yoga', category: 'wellness' as const, description: '', address: '', location: { lat: 0, lng: 0 }, duration: 60, estimatedCost: 500, source: 'manual' as const, tags: [] }],
        afternoon: [{ id: 'a2', name: 'Market', category: 'experience' as const, description: '', address: '', location: { lat: 0, lng: 0 }, duration: 60, estimatedCost: 200, source: 'manual' as const, tags: [] }],
        evening: []
      },
      {
        id: 'd2', dayNumber: 2,
        morning: [],
        afternoon: [{ id: 'a3', name: 'Tour', category: 'experience' as const, description: '', address: '', location: { lat: 0, lng: 0 }, duration: 60, estimatedCost: 1000, source: 'manual' as const, tags: [] }],
        evening: [{ id: 'a4', name: 'Dinner', category: 'restaurant' as const, description: '', address: '', location: { lat: 0, lng: 0 }, duration: 60, estimatedCost: 300, source: 'manual' as const, tags: [] }]
      }
    ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  it('calculates estimated spend correctly', () => {
    expect(calculateEstimatedSpend(dummyItinerary)).toBe(2000);
  });

  it('calculates budget summary correctly', () => {
    const summary = getBudgetSummary(dummyItinerary);
    expect(summary.total).toBe(10000);
    expect(summary.spent).toBe(3000); // max of sumBudget(3000) and estimatedSpend(2000)
    expect(summary.remaining).toBe(7000);
    expect(summary.percentage).toBe(30);
    expect(summary.isOver).toBe(false);
  });
});
