// ============================================================
// WanderIQ — GA4 Analytics Helpers
// ============================================================

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Send an event to Google Analytics 4 via the global gtag function.
 * @param eventName - The name of the event to track
 * @param params - Optional key-value parameters to send with the event
 * @returns void
 */
export const trackEvent = (eventName: string, params: Record<string, unknown> = {}): void => {
  try {
    window.gtag?.('event', eventName, {
      ...params,
      app_name: 'WanderIQ',
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Analytics should never break the app
  }
};

/**
 * Typed wrapper for tracking specific WanderIQ events.
 * @param destination - The destination name
 * @param durationDays - Trip duration
 * @returns void
 */
export const analytics = {
  /**
   * Track when a user creates a new trip.
   * @param destination - The destination of the trip
   * @param durationDays - The number of days
   * @returns void
   */
  tripCreated: (destination: string, durationDays: number) =>
    trackEvent('trip_created', { destination, duration_days: durationDays }),

  /**
   * Track when an activity is added to the itinerary.
   * @param category - The activity category
   * @param source - The source of the activity (manual, ai, or places)
   * @returns void
   */
  activityAdded: (category: string, source: 'manual' | 'ai' | 'places') =>
    trackEvent('activity_added', { category, source }),

  /**
   * Track when the Gemini assistant is queried.
   * @param queryType - The categorized intent of the query
   * @returns void
   */
  aiAssistantUsed: (queryType: string) =>
    trackEvent('ai_assistant_used', { query_type: queryType }),

  /**
   * Track when an itinerary is exported.
   * @param format - The export format (e.g. pdf, link)
   * @returns void
   */
  itineraryExported: (format: 'pdf' | 'link') =>
    trackEvent('itinerary_exported', { format }),

  /**
   * Track when a user preference is updated.
   * @param field - The preference field name that changed
   * @returns void
   */
  preferenceUpdated: (field: string) =>
    trackEvent('preference_updated', { field }),

  /**
   * Track when a mood-based destination search is performed.
   * @param queryLength - The string length of the mood query
   * @returns void
   */
  discoverMoodSearch: (queryLength: number) =>
    trackEvent('discover_mood_search', { query_length: queryLength }),

  /**
   * Track when a collaboration invite is sent.
   * @returns void
   */
  collaborationInviteSent: () =>
    trackEvent('collaboration_invite_sent', {}),

  /**
   * Track a page view within the application.
   * @param pageName - The name of the page viewed
   * @returns void
   */
  pageView: (pageName: string) =>
    trackEvent('page_view', { page_name: pageName }),

  /**
   * Track when a user signs in.
   * @param method - The authentication provider used
   * @returns void
   */
  signIn: (method: string) =>
    trackEvent('login', { method }),

  /**
   * Track when a new user registers.
   * @param method - The authentication provider used
   * @returns void
   */
  signUp: (method: string) =>
    trackEvent('sign_up', { method }),

  /**
   * Track when an AI packing list is requested.
   * @returns void
   */
  packingListGenerated: () =>
    trackEvent('packing_list_generated', {}),

  /**
   * Track when budget optimization suggestions are requested.
   * @returns void
   */
  budgetOptimized: () =>
    trackEvent('budget_optimized', {}),

  /**
   * Track when a destination is selected from the Discover page.
   * @param name - The name of the destination
   * @param matchScore - The AI-generated match score percentage
   * @returns void
   */
  destinationSelected: (name: string, matchScore: number) =>
    trackEvent('destination_selected', { name, match_score: matchScore }),

  /**
   * Track when a specific day is auto-filled using Gemini.
   * @param dayNumber - The chronological day number in the itinerary
   * @returns void
   */
  dayAutoFilled: (dayNumber: number) =>
    trackEvent('day_autofilled', { day_number: dayNumber }),
};
