// ============================================================
// WanderIQ — Itinerary Store (Zustand)
// ============================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Itinerary, ItineraryDay, ActivityCard } from '@/types';

interface ItineraryState {
  activeItinerary:  Itinerary | null;
  itineraries:      Itinerary[];
  selectedDayIndex: number;
  isDirty:          boolean;
  isSaving:         boolean;
  error:            string | null;

  setActiveItinerary:  (itinerary: Itinerary | null) => void;
  setItineraries:      (list: Itinerary[]) => void;
  setSelectedDayIndex: (index: number) => void;
  addDay:              () => void;
  removeDay:           (dayId: string) => void;
  updateDay:           (dayId: string, updates: Partial<ItineraryDay>) => void;
  addActivity:         (dayId: string, slot: 'morning' | 'afternoon' | 'evening', activity: ActivityCard) => void;
  removeActivity:      (dayId: string, slot: 'morning' | 'afternoon' | 'evening', activityId: string) => void;
  updateActivity:      (dayId: string, slot: 'morning' | 'afternoon' | 'evening', activityId: string, updates: Partial<ActivityCard>) => void;
  reorderActivities:   (dayId: string, slot: 'morning' | 'afternoon' | 'evening', orderedIds: string[]) => void;
  setIsDirty:          (dirty: boolean) => void;
  setIsSaving:         (saving: boolean) => void;
  setError:            (error: string | null) => void;
  reset:               () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const initialState = {
  activeItinerary:  null,
  itineraries:      [],
  selectedDayIndex: 0,
  isDirty:          false,
  isSaving:         false,
  error:            null,
};

export const useItineraryStore = create<ItineraryState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setActiveItinerary: (itinerary) => set({ activeItinerary: itinerary }),
      setItineraries:     (list)      => set({ itineraries: list }),
      setSelectedDayIndex:(index)     => set({ selectedDayIndex: index }),
      setIsDirty:         (dirty)     => set({ isDirty: dirty }),
      setIsSaving:        (saving)    => set({ isSaving: saving }),
      setError:           (error)     => set({ error }),
      reset:              ()          => set(initialState),

      addDay: () => {
        const { activeItinerary } = get();
        if (!activeItinerary) return;
        const newDay: ItineraryDay = {
          id:        generateId(),
          dayNumber: activeItinerary.days.length + 1,
          morning:   [],
          afternoon: [],
          evening:   [],
        };
        set({
          activeItinerary: {
            ...activeItinerary,
            days:      [...activeItinerary.days, newDay],
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
      },

      removeDay: (dayId) => {
        const { activeItinerary } = get();
        if (!activeItinerary) return;
        const filtered = activeItinerary.days.filter((d) => d.id !== dayId);
        const renumbered = filtered.map((d, i) => ({ ...d, dayNumber: i + 1 }));
        set({
          activeItinerary: {
            ...activeItinerary,
            days:      renumbered,
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
      },

      updateDay: (dayId, updates) => {
        const { activeItinerary } = get();
        if (!activeItinerary) return;
        set({
          activeItinerary: {
            ...activeItinerary,
            days: activeItinerary.days.map((d) =>
              d.id === dayId ? { ...d, ...updates } : d
            ),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
      },

      addActivity: (dayId, slot, activity) => {
        const { activeItinerary } = get();
        if (!activeItinerary) return;
        set({
          activeItinerary: {
            ...activeItinerary,
            days: activeItinerary.days.map((d) =>
              d.id === dayId
                ? { ...d, [slot]: [...d[slot], activity] }
                : d
            ),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
      },

      removeActivity: (dayId, slot, activityId) => {
        const { activeItinerary } = get();
        if (!activeItinerary) return;
        set({
          activeItinerary: {
            ...activeItinerary,
            days: activeItinerary.days.map((d) =>
              d.id === dayId
                ? { ...d, [slot]: d[slot].filter((a) => a.id !== activityId) }
                : d
            ),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
      },

      updateActivity: (dayId, slot, activityId, updates) => {
        const { activeItinerary } = get();
        if (!activeItinerary) return;
        set({
          activeItinerary: {
            ...activeItinerary,
            days: activeItinerary.days.map((d) =>
              d.id === dayId
                ? {
                    ...d,
                    [slot]: d[slot].map((a) =>
                      a.id === activityId ? { ...a, ...updates } : a
                    ),
                  }
                : d
            ),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
      },

      reorderActivities: (dayId, slot, orderedIds) => {
        const { activeItinerary } = get();
        if (!activeItinerary) return;
        set({
          activeItinerary: {
            ...activeItinerary,
            days: activeItinerary.days.map((d) => {
              if (d.id !== dayId) return d;
              const reordered = orderedIds
                .map((id) => d[slot].find((a) => a.id === id))
                .filter(Boolean) as ActivityCard[];
              return { ...d, [slot]: reordered };
            }),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
      },
    }),
    { name: 'wanderiq-itinerary' }
  )
);
