// ============================================================
// WanderIQ — Preferences Store (Zustand)
// ============================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UserPreferences } from '@/types';

const defaultPreferences: UserPreferences = {
  budgetTier:    'mid-range',
  currency:      'INR',
  travelStyle:   ['cultural'],
  dietary:       ['none'],
  mobility:      'full',
  group:         'solo',
  accommodation: ['hotel'],
  transport:     ['combination'],
  interests:     ['history', 'photography'],
  blacklist:     [],
};

interface PreferencesState {
  preferences: UserPreferences;
  isDark:      boolean;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  toggleDark:     () => void;
  reset:          () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  devtools(
    persist(
      (set, get) => ({
        preferences: defaultPreferences,
        isDark:      false,

        setPreferences: (prefs) =>
          set((state) => ({
            preferences: { ...state.preferences, ...prefs },
          })),

        toggleDark: () => {
          const next = !get().isDark;
          set({ isDark: next });
          document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
        },

        reset: () => set({ preferences: defaultPreferences }),
      }),
      {
        name: 'wanderiq-preferences',
        onRehydrateStorage: () => (state) => {
          if (state?.isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        },
      }
    ),
    { name: 'wanderiq-prefs' }
  )
);
