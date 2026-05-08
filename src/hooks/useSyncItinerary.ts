import { useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useItineraryStore } from '@/store/useItineraryStore';

/**
 * Custom React hook that automatically persists the active itinerary to Firestore.
 *
 * Watches {@link useItineraryStore}'s `isDirty` flag. When dirty, waits 1500ms
 * (debounce) then writes the full `activeItinerary` document to the `itineraries`
 * Firestore collection and calls `setIsDirty(false)` on success.
 *
 * @example
 * // In AppShell.tsx
 * useSyncItinerary();
 */
export const useSyncItinerary = () => {
  const { isDirty, activeItinerary, setIsDirty } = useItineraryStore();

  useEffect(() => {
    if (!isDirty || !activeItinerary?.id) return;

    const syncTimeout = setTimeout(async () => {
      try {
        const itineraryRef = doc(db, 'itineraries', activeItinerary.id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...dataToSync } = activeItinerary;
        await updateDoc(itineraryRef, {
          ...dataToSync,
          updatedAt: new Date().toISOString()
        });
        setIsDirty(false);
      } catch (err) {
        console.error('Failed to sync itinerary:', err);
      }
    }, 1500);

    return () => clearTimeout(syncTimeout);
  }, [isDirty, activeItinerary, setIsDirty]);
};
