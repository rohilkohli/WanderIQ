// ============================================================
// WanderIQ — Unit Tests: Constraint Validators
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  hasTimeOverlap, validateOpeningHours, validateTransitTime,
  validateAccessibility, validateBudget, validateDay,
} from '@/lib/constraints';
import type { ActivityCard, ItineraryDay } from '@/types';

const mockActivity = (overrides: Partial<ActivityCard> = {}): ActivityCard => ({
  id:          'test-id',
  name:        'Test Activity',
  category:    'attraction',
  description: 'A test activity',
  address:     '123 Test St',
  location:    { lat: 0, lng: 0 },
  duration:    60,
  source:      'manual',
  ...overrides,
});

describe('hasTimeOverlap', () => {
  it('detects overlapping activities', () => {
    const a = mockActivity({ startTime: '10:00', endTime: '12:00' });
    const b = mockActivity({ startTime: '11:00', endTime: '13:00' });
    expect(hasTimeOverlap(a, b)).toBe(true);
  });
  it('returns false for non-overlapping activities', () => {
    const a = mockActivity({ startTime: '09:00', endTime: '11:00' });
    const b = mockActivity({ startTime: '11:30', endTime: '13:00' });
    expect(hasTimeOverlap(a, b)).toBe(false);
  });
  it('returns false when times are missing', () => {
    const a = mockActivity({});
    const b = mockActivity({});
    expect(hasTimeOverlap(a, b)).toBe(false);
  });
  it('handles back-to-back activities (no overlap)', () => {
    const a = mockActivity({ startTime: '10:00', endTime: '11:00' });
    const b = mockActivity({ startTime: '11:00', endTime: '12:00' });
    expect(hasTimeOverlap(a, b)).toBe(false);
  });
});

describe('validateOpeningHours', () => {
  it('returns null when no opening hours data', () => {
    const a = mockActivity({ startTime: '10:00' });
    expect(validateOpeningHours(a)).toBeNull();
  });
  it('warns when place is closed', () => {
    const a = mockActivity({
      startTime:    '22:00',
      openingHours: { openNow: false, weekdayDescriptions: ['Mon–Fri: 9:00–18:00'] },
    });
    const result = validateOpeningHours(a);
    expect(result).not.toBeNull();
    expect(result?.severity).toBe('warning');
  });
});

describe('validateTransitTime', () => {
  it('warns when transit gap is too short', () => {
    const a = mockActivity({ endTime: '10:00' });
    const b = mockActivity({ startTime: '10:05' });
    const result = validateTransitTime(a, b, 15);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('transit');
  });
  it('returns null when enough time', () => {
    const a = mockActivity({ endTime: '10:00' });
    const b = mockActivity({ startTime: '10:30' });
    expect(validateTransitTime(a, b, 15)).toBeNull();
  });
});

describe('validateAccessibility', () => {
  it('flags non-accessible venue for wheelchair users', () => {
    const a = mockActivity({ isWheelchairAccessible: false });
    const result = validateAccessibility(a, 'wheelchair');
    expect(result).not.toBeNull();
    expect(result?.severity).toBe('error');
  });
  it('returns null for full-mobility users', () => {
    const a = mockActivity({ isWheelchairAccessible: false });
    expect(validateAccessibility(a, 'full')).toBeNull();
  });
});

describe('validateBudget', () => {
  it('warns when activity exceeds remaining budget', () => {
    const a = mockActivity({ estimatedCost: 5000 });
    const result = validateBudget(a, 3000);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('budget');
  });
  it('returns null when within budget', () => {
    const a = mockActivity({ estimatedCost: 500 });
    expect(validateBudget(a, 3000)).toBeNull();
  });
});

describe('validateDay', () => {
  it('returns no violations for a clean day', () => {
    const day: ItineraryDay = {
      id: 'd1', dayNumber: 1,
      morning:   [mockActivity({ id: 'a1', name: 'Museum', startTime: '09:00', endTime: '11:00' })],
      afternoon: [mockActivity({ id: 'a2', name: 'Lunch',  startTime: '12:00', endTime: '13:00' })],
      evening:   [],
    };
    const violations = validateDay(day, { minTransitMin: 15 });
    expect(violations.filter((v) => v.type === 'overlap')).toHaveLength(0);
  });

  it('detects overlap, budget, and accessibility in validateDay', () => {
    const day: ItineraryDay = {
      id: 'd2', dayNumber: 2,
      morning: [
        mockActivity({ id: 'a1', name: 'A', startTime: '09:00', endTime: '11:00', estimatedCost: 50, isWheelchairAccessible: false }),
        mockActivity({ id: 'a2', name: 'B', startTime: '10:00', endTime: '12:00', estimatedCost: 150 })
      ],
      afternoon: [], evening: []
    };
    const violations = validateDay(day, { minTransitMin: 15, dailyBudgetLimit: 100, mobilityNeed: 'wheelchair' });
    
    const overlap = violations.find(v => v.type === 'overlap');
    expect(overlap).toBeDefined();
    
    const budget = violations.find(v => v.type === 'budget');
    expect(budget).toBeDefined();

    const access = violations.find(v => v.type === 'accessibility');
    expect(access).toBeDefined();
  });
});
