// ============================================================
// WanderIQ — Itinerary Store (Zustand)
// ============================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Itinerary, ItineraryDay, ActivityCard } from '@/types';

/**
 * The shape of the global itinerary state.
 * @returns The ItineraryState object
 */
export interface ItineraryState {
  activeItinerary:  Itinerary | null;
  itineraries:      Itinerary[];
  selectedDayIndex: number;
  isDirty:          boolean;
  isSaving:         boolean;
  error:            string | null;

  /**
   * Set the currently active itinerary for editing.
   * @param itinerary - The itinerary object or null
   * @returns void
   */
  setActiveItinerary:  (itinerary: Itinerary | null) => void;
  /**
   * Set the list of all user itineraries.
   * @param list - Array of itineraries
   * @returns void
   */
  setItineraries:      (list: Itinerary[]) => void;
  /**
   * Set the currently selected day tab in the planner.
   * @param index - The zero-based day index
   * @returns void
   */
  setSelectedDayIndex: (index: number) => void;
  /**
   * Append a new empty day to the active itinerary.
   * @returns void
   */
  addDay:              () => void;
  /**
   * Remove a specific day by its ID.
   * @param dayId - The ID of the day to remove
   * @returns void
   */
  removeDay:           (dayId: string) => void;
  /**
   * Update properties of a specific day.
   * @param dayId - The ID of the day to update
   * @param updates - Partial day properties to apply
   * @returns void
   */
  updateDay:           (dayId: string, updates: Partial<ItineraryDay>) => void;
  /**
   * Append a new activity to a specific day and time slot.
   * @param dayId - The ID of the day
   * @param slot - The time slot (morning, afternoon, evening)
   * @param activity - The activity card object to add
   * @returns void
   */
  addActivity:         (dayId: string, slot: 'morning' | 'afternoon' | 'evening', activity: ActivityCard) => void;
  /**
   * Remove a specific activity from a slot.
   * @param dayId - The ID of the day
   * @param slot - The time slot
   * @param activityId - The ID of the activity to remove
   * @returns void
   */
  removeActivity:      (dayId: string, slot: 'morning' | 'afternoon' | 'evening', activityId: string) => void;
  /**
   * Update properties of a specific activity.
   * @param dayId - The ID of the day
   * @param slot - The time slot
   * @param activityId - The ID of the activity to update
   * @param updates - Partial activity properties to apply
   * @returns void
   */
  updateActivity:      (dayId: string, slot: 'morning' | 'afternoon' | 'evening', activityId: string, updates: Partial<ActivityCard>) => void;
  /**
   * Reorder activities within a specific time slot.
   * @param dayId - The ID of the day
   * @param slot - The time slot
   * @param orderedIds - Array of activity IDs in the new sequence
   * @returns void
   */
  reorderActivities:   (dayId: string, slot: 'morning' | 'afternoon' | 'evening', orderedIds: string[]) => void;
  /**
   * Mark the current itinerary state as having unsaved changes.
   * @param dirty - Boolean flag
   * @returns void
   */
  setIsDirty:          (dirty: boolean) => void;
  /**
   * Set the global saving state indicator.
   * @param saving - Boolean flag
   * @returns void
   */
  setIsSaving:         (saving: boolean) => void;
  /**
   * Set or clear a global itinerary error.
   * @param error - The error string or null
   * @returns void
   */
  setError:            (error: string | null) => void;
  /**
   * Reset the store to its initial empty state.
   * @returns void
   */
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

/**
 * Global Zustand store for managing itinerary data and planner actions.
 * @returns The React hook for accessing the ItineraryState
 */
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
