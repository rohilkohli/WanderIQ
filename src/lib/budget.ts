// ============================================================
// WanderIQ — Budget Calculation Helpers
// ============================================================

import type { Itinerary, BudgetBreakdown } from '@/types';

export interface BudgetSummary {
  total:      number;
  breakdown:  BudgetBreakdown;
  spent:      number;
  remaining:  number;
  percentage: number;
  isOver:     boolean;
}

/**
 * Calculate the total budget from a breakdown.
 */
export function sumBudget(breakdown: BudgetBreakdown): number {
  return Object.values(breakdown).reduce((sum, val) => sum + (val || 0), 0);
}

/**
 * Calculate estimated spend from itinerary activities.
 */
export function calculateEstimatedSpend(itinerary: Itinerary): number {
  return itinerary.days.reduce((total, day) => {
    const slots = [...day.morning, ...day.afternoon, ...day.evening];
    return total + slots.reduce((sum, activity) => sum + (activity.estimatedCost || 0), 0);
  }, 0);
}

/**
 * Get a full budget summary.
 */
export function getBudgetSummary(itinerary: Itinerary): BudgetSummary {
  const total = itinerary.totalBudget;
  const breakdown = itinerary.budget;
  const spent = sumBudget(breakdown);
  const estimated = calculateEstimatedSpend(itinerary);
  const used = Math.max(spent, estimated);
  const remaining = total - used;
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  return {
    total,
    breakdown,
    spent:      used,
    remaining:  Math.max(remaining, 0),
    percentage: Math.min(percentage, 100),
    isOver:     remaining < 0,
  };
}

/**
 * Get daily budget (total / days).
 */
export function getDailyBudget(totalBudget: number, days: number): number {
  if (days === 0) return 0;
  return Math.round(totalBudget / days);
}

/**
 * Percentage of budget used per category.
 */
export function getCategoryPercentage(
  categoryAmount: number,
  totalBudget: number
): number {
  if (totalBudget === 0) return 0;
  return Math.round((categoryAmount / totalBudget) * 100);
}

/**
 * Budget health level.
 */
export function getBudgetHealth(percentage: number): 'good' | 'warning' | 'danger' {
  if (percentage <= 70) return 'good';
  if (percentage <= 90) return 'warning';
  return 'danger';
}
