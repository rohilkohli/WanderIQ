import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackEvent, analytics } from '@/lib/analytics';

describe('analytics', () => {
  beforeEach(() => {
    // Mock window.gtag
    window.gtag = vi.fn();
  });

  it('trackEvent calls window.gtag', () => {
    trackEvent('test_event', { foo: 'bar' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'test_event', expect.objectContaining({
      foo: 'bar',
      app_name: 'VoyaIQ',
      timestamp: expect.any(String)
    }));
  });

  it('trackEvent handles missing gtag gracefully', () => {
    window.gtag = undefined;
    expect(() => trackEvent('test_event')).not.toThrow();
  });

  it('analytics object methods map correctly', () => {
    analytics.tripCreated('Paris', 5);
    expect(window.gtag).toHaveBeenCalledWith('event', 'trip_created', expect.objectContaining({ destination: 'Paris', duration_days: 5 }));

    analytics.activityAdded('attraction', 'ai');
    expect(window.gtag).toHaveBeenCalledWith('event', 'activity_added', expect.objectContaining({ category: 'attraction', source: 'ai' }));

    analytics.aiAssistantUsed('planning');
    expect(window.gtag).toHaveBeenCalledWith('event', 'ai_assistant_used', expect.objectContaining({ query_type: 'planning' }));

    analytics.itineraryExported('pdf');
    expect(window.gtag).toHaveBeenCalledWith('event', 'itinerary_exported', expect.objectContaining({ format: 'pdf' }));

    analytics.preferenceUpdated('budgetTier');
    expect(window.gtag).toHaveBeenCalledWith('event', 'preference_updated', expect.objectContaining({ field: 'budgetTier' }));

    analytics.discoverMoodSearch(10);
    expect(window.gtag).toHaveBeenCalledWith('event', 'discover_mood_search', expect.objectContaining({ query_length: 10 }));

    analytics.collaborationInviteSent();
    expect(window.gtag).toHaveBeenCalledWith('event', 'collaboration_invite_sent', expect.any(Object));

    analytics.pageView('/home');
    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({ page_name: '/home' }));

    analytics.signIn('google');
    expect(window.gtag).toHaveBeenCalledWith('event', 'login', expect.objectContaining({ method: 'google' }));

    analytics.signUp('email');
    expect(window.gtag).toHaveBeenCalledWith('event', 'sign_up', expect.objectContaining({ method: 'email' }));

    analytics.packingListGenerated();
    expect(window.gtag).toHaveBeenCalledWith('event', 'packing_list_generated', expect.any(Object));

    analytics.budgetOptimized();
    expect(window.gtag).toHaveBeenCalledWith('event', 'budget_optimized', expect.any(Object));

    analytics.destinationSelected('Rome', 95);
    expect(window.gtag).toHaveBeenCalledWith('event', 'destination_selected', expect.objectContaining({ name: 'Rome', match_score: 95 }));

    analytics.dayAutoFilled(2);
    expect(window.gtag).toHaveBeenCalledWith('event', 'day_autofilled', expect.objectContaining({ day_number: 2 }));
  });
});
