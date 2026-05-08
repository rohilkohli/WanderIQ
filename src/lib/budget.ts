// ============================================================
// WanderIQ — Budget Calculation Helpers
// ============================================================

import type { Itinerary, BudgetBreakdown } from '@/types';

/**
 * Represents a comprehensive summary of itinerary budget metrics.
 * @returns The BudgetSummary object
 */
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
 * @param breakdown - The object containing categorical budget allocations
 * @returns The sum of all category budgets
 */
export function sumBudget(breakdown: BudgetBreakdown): number {
  return Object.values(breakdown).reduce((sum, val) => sum + (val || 0), 0);
}

/**
 * Calculate estimated spend from itinerary activities.
 * @param itinerary - The itinerary object containing all scheduled activities
 * @returns The sum of all estimated costs across all activities
 */
export function calculateEstimatedSpend(itinerary: Itinerary): number {
  return itinerary.days.reduce((total, day) => {
    const slots = [...day.morning, ...day.afternoon, ...day.evening];
    return total + slots.reduce((sum, activity) => sum + (activity.estimatedCost || 0), 0);
  }, 0);
}

/**
 * Get a full budget summary.
 * @param itinerary - The itinerary object to analyze
 * @returns A BudgetSummary object containing calculated metrics
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
 * @param totalBudget - The total allocated budget
 * @param days - The duration of the trip in days
 * @returns The computed daily budget average
 */
export function getDailyBudget(totalBudget: number, days: number): number {
  if (days === 0) return 0;
  return Math.round(totalBudget / days);
}

/**
 * Percentage of budget used per category.
 * @param categoryAmount - The amount allocated to a specific category
 * @param totalBudget - The total itinerary budget
 * @returns The percentage (0-100) of the total budget represented by the category amount
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
 * @param percentage - The percentage of budget consumed
 * @returns 'good' if <= 70, 'warning' if <= 90, otherwise 'danger'
 */
export function getBudgetHealth(percentage: number): 'good' | 'warning' | 'danger' {
  if (percentage <= 70) return 'good';
  if (percentage <= 90) return 'warning';
  return 'danger';
}
