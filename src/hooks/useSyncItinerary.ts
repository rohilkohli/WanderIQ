import { useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useItineraryStore } from '@/store/useItineraryStore';

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
