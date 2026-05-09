import { beforeEach, describe, expect, it } from 'vitest';
import { buildAiUserContext, rememberAiAction, rememberAiFeedback } from '@/lib/aiMemory';

describe('aiMemory', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores recent actions and feedback in context payload', () => {
    rememberAiAction('discover:hill stations');
    rememberAiFeedback({
      feature: 'budget',
      responseId: 'tip-1',
      rating: 'up',
    });

    const context = buildAiUserContext({ currency: 'INR' });
    expect(context.recentActions).toEqual(['discover:hill stations']);
    expect(context.recentRatings[0]).toMatchObject({
      feature: 'budget',
      responseId: 'tip-1',
      rating: 'up',
    });
    expect(context.preferences).toMatchObject({ currency: 'INR' });
  });

  it('keeps only recent items within cap', () => {
    for (let i = 0; i < 12; i += 1) {
      rememberAiAction(`action-${i}`);
    }
    const context = buildAiUserContext();
    expect(context.recentActions.length).toBe(8);
    expect(context.recentActions[0]).toBe('action-4');
    expect(context.recentActions[7]).toBe('action-11');
  });
});
