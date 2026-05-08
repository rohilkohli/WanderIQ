// ============================================================
// WanderIQ — GA4 Analytics Helpers
// ============================================================

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

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

// Typed event helpers
export const analytics = {
  tripCreated: (destination: string, durationDays: number) =>
    trackEvent('trip_created', { destination, duration_days: durationDays }),

  activityAdded: (category: string, source: 'manual' | 'ai' | 'places') =>
    trackEvent('activity_added', { category, source }),

  aiAssistantUsed: (queryType: string) =>
    trackEvent('ai_assistant_used', { query_type: queryType }),

  itineraryExported: (format: 'pdf' | 'link') =>
    trackEvent('itinerary_exported', { format }),

  preferenceUpdated: (field: string) =>
    trackEvent('preference_updated', { field }),

  discoverMoodSearch: (queryLength: number) =>
    trackEvent('discover_mood_search', { query_length: queryLength }),

  collaborationInviteSent: () =>
    trackEvent('collaboration_invite_sent', {}),

  pageView: (pageName: string) =>
    trackEvent('page_view', { page_name: pageName }),

  signIn: (method: string) =>
    trackEvent('login', { method }),

  signUp: (method: string) =>
    trackEvent('sign_up', { method }),

  packingListGenerated: () =>
    trackEvent('packing_list_generated', {}),

  budgetOptimized: () =>
    trackEvent('budget_optimized', {}),

  destinationSelected: (name: string, matchScore: number) =>
    trackEvent('destination_selected', { name, match_score: matchScore }),

  dayAutoFilled: (dayNumber: number) =>
    trackEvent('day_autofilled', { day_number: dayNumber }),
};
