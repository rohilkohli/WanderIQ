import type { UserPreferences } from '@/types';

type FeedbackRating = 'up' | 'down' | 'corrected';

interface StoredFeedback {
  feature: string;
  responseId: string;
  rating: FeedbackRating;
  correction?: string;
  createdAt: string;
}

interface StoredAiMemory {
  recentActions: string[];
  recentRatings: StoredFeedback[];
}

const STORAGE_KEY = 'wanderiq-ai-memory';
const MAX_ACTION_LENGTH = 180;

function readMemory(): StoredAiMemory {
  if (typeof window === 'undefined') return { recentActions: [], recentRatings: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { recentActions: [], recentRatings: [] };
    const parsed = JSON.parse(raw) as StoredAiMemory;
    return {
      recentActions: Array.isArray(parsed.recentActions) ? parsed.recentActions.slice(-8) : [],
      recentRatings: Array.isArray(parsed.recentRatings) ? parsed.recentRatings.slice(-8) : [],
    };
  } catch {
    return { recentActions: [], recentRatings: [] };
  }
}

function writeMemory(memory: StoredAiMemory): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function rememberAiAction(action: string): void {
  const safeAction = action.trim().slice(0, MAX_ACTION_LENGTH);
  if (!safeAction) return;
  const memory = readMemory();
  memory.recentActions = [...memory.recentActions, safeAction].slice(-8);
  writeMemory(memory);
}

export function rememberAiFeedback(feedback: Omit<StoredFeedback, 'createdAt'>): void {
  const memory = readMemory();
  memory.recentRatings = [...memory.recentRatings, { ...feedback, createdAt: new Date().toISOString() }].slice(-8);
  writeMemory(memory);
}

export function buildAiUserContext(preferences?: Partial<UserPreferences>) {
  const memory = readMemory();
  return {
    preferences: preferences ?? {},
    recentActions: memory.recentActions,
    recentRatings: memory.recentRatings.map((item) => ({
      feature: item.feature,
      responseId: item.responseId,
      rating: item.rating,
      correction: item.correction,
    })),
  };
}

export async function submitAiFeedback(params: {
  feature: 'chat' | 'discover' | 'autofill' | 'budget' | 'itinerary' | 'packing';
  responseId: string;
  rating: FeedbackRating;
  correction?: string;
  provider?: string;
  model?: string;
  userId?: string;
}): Promise<void> {
  rememberAiFeedback({
    feature: params.feature,
    responseId: params.responseId,
    rating: params.rating,
    correction: params.correction,
  });

  try {
    await fetch('/api/ai-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(params.userId ? { 'x-ai-user-id': params.userId } : {}),
      },
      body: JSON.stringify({
        feature: params.feature,
        responseId: params.responseId,
        rating: params.rating,
        correction: params.correction,
        provider: params.provider,
        model: params.model,
      }),
    });
  } catch {
    // Keep local memory even if network fails.
  }
}
