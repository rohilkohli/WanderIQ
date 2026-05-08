// ============================================================
// WanderIQ — Itinerary Constraint Validators
// ============================================================

import type { ItineraryDay, ActivityCard } from '@/types';

export type ConstraintSeverity = 'error' | 'warning' | 'info';

export interface ConstraintViolation {
  id:          string;
  type:        string;
  severity:    ConstraintSeverity;
  message:     string;
  activityIds?: string[];
  dayId?:      string;
}

/**
 * Check if two activities have overlapping time windows.
 */
export function hasTimeOverlap(a: ActivityCard, b: ActivityCard): boolean {
  if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) return false;
  const aStart = timeToMinutes(a.startTime);
  const aEnd   = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd   = timeToMinutes(b.endTime);
  return aStart < bEnd && aEnd > bStart;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Validate opening hours: activity start time must be within open window.
 */
export function validateOpeningHours(activity: ActivityCard): ConstraintViolation | null {
  if (!activity.startTime || !activity.openingHours) return null;
  if (!activity.openingHours.openNow && activity.openingHours.weekdayDescriptions?.length) {
    return {
      id:          `opening-${activity.id}`,
      type:        'opening-hours',
      severity:    'warning',
      message:     `"${activity.name}" may be closed at the planned time.`,
      activityIds: [activity.id],
    };
  }
  return null;
}

/**
 * Validate transit: enough time between activities.
 */
export function validateTransitTime(
  from: ActivityCard,
  to: ActivityCard,
  minTransitMinutes: number
): ConstraintViolation | null {
  if (!from.endTime || !to.startTime) return null;
  const gap = timeToMinutes(to.startTime) - timeToMinutes(from.endTime);
  if (gap < minTransitMinutes) {
    return {
      id:          `transit-${from.id}-${to.id}`,
      type:        'transit',
      severity:    'warning',
      message:     `Not enough travel time between "${from.name}" and "${to.name}" (need ~${minTransitMinutes} min).`,
      activityIds: [from.id, to.id],
    };
  }
  return null;
}

/**
 * Validate accessibility: wheelchair user at non-accessible venue.
 */
export function validateAccessibility(
  activity: ActivityCard,
  mobilityNeed: string
): ConstraintViolation | null {
  if (mobilityNeed === 'wheelchair' && activity.isWheelchairAccessible === false) {
    return {
      id:          `access-${activity.id}`,
      type:        'accessibility',
      severity:    'error',
      message:     `"${activity.name}" is not reported as wheelchair accessible.`,
      activityIds: [activity.id],
    };
  }
  return null;
}

/**
 * Validate budget: activity cost vs remaining budget.
 */
export function validateBudget(
  activity: ActivityCard,
  remainingBudget: number
): ConstraintViolation | null {
  if (
    activity.estimatedCost !== undefined &&
    activity.estimatedCost > remainingBudget
  ) {
    return {
      id:          `budget-${activity.id}`,
      type:        'budget',
      severity:    'warning',
      message:     `"${activity.name}" may exceed your remaining daily budget.`,
      activityIds: [activity.id],
    };
  }
  return null;
}

/**
 * Run all validators for a full day.
 */
export function validateDay(
  day: ItineraryDay,
  options: {
    mobilityNeed?:     string;
    dailyBudgetLimit?: number;
    minTransitMin?:    number;
  } = {}
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const allActivities = [...day.morning, ...day.afternoon, ...day.evening];
  let runningCost = 0;

  for (let i = 0; i < allActivities.length; i++) {
    const activity = allActivities[i];
    runningCost += activity.estimatedCost || 0;

    // Opening hours check
    const hoursViolation = validateOpeningHours(activity);
    if (hoursViolation) violations.push({ ...hoursViolation, dayId: day.id });

    // Accessibility check
    if (options.mobilityNeed) {
      const accessViolation = validateAccessibility(activity, options.mobilityNeed);
      if (accessViolation) violations.push({ ...accessViolation, dayId: day.id });
    }

    // Budget check
    if (options.dailyBudgetLimit) {
      const remaining = options.dailyBudgetLimit - runningCost + (activity.estimatedCost || 0);
      const budgetViolation = validateBudget(activity, remaining);
      if (budgetViolation) violations.push({ ...budgetViolation, dayId: day.id });
    }

    // Transit time check
    if (i < allActivities.length - 1) {
      const next = allActivities[i + 1];
      const transitViolation = validateTransitTime(activity, next, options.minTransitMin ?? 15);
      if (transitViolation) violations.push({ ...transitViolation, dayId: day.id });
    }

    // Time overlap check
    for (let j = i + 1; j < allActivities.length; j++) {
      const other = allActivities[j];
      if (hasTimeOverlap(activity, other)) {
        violations.push({
          id:          `overlap-${activity.id}-${other.id}`,
          type:        'overlap',
          severity:    'error',
          message:     `"${activity.name}" and "${other.name}" overlap in time.`,
          activityIds: [activity.id, other.id],
          dayId:       day.id,
        });
      }
    }
  }

  return violations;
}
