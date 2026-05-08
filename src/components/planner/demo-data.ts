import type { ActivityCard, ItineraryDay } from '@/types';
import { generateId } from '@/lib/utils';

export const DEMO_ACTIVITIES: Record<string, ActivityCard[]> = {
  morning: [
    {
      id: generateId(), name: 'Calangute Beach Walk', category: 'nature',
      description: 'Start your morning with a peaceful walk along Goa\'s most popular beach.', address: 'Calangute Beach, North Goa',
      location: { lat: 15.5440, lng: 73.7527 }, duration: 90, estimatedCost: 0, source: 'ai',
      tags: ['Beach', 'Morning', 'Free'],
    },
    {
      id: generateId(), name: 'Fisherman\'s Wharf Breakfast', category: 'restaurant',
      description: 'Iconic riverside restaurant serving fresh Goan breakfast with river views.', address: 'Cavelossim, South Goa',
      location: { lat: 15.1558, lng: 73.9358 }, duration: 60, estimatedCost: 350, source: 'ai',
      tags: ['Breakfast', 'Seafood', 'River view'], rating: 4.4,
    },
  ],
  afternoon: [
    {
      id: generateId(), name: 'Old Goa Churches', category: 'attraction',
      description: 'UNESCO World Heritage Site — visit the Basilica of Bom Jesus and Se Cathedral.', address: 'Old Goa',
      location: { lat: 15.5050, lng: 73.9121 }, duration: 120, estimatedCost: 100, source: 'places',
      tags: ['Heritage', 'UNESCO', 'Architecture'], rating: 4.7, isWheelchairAccessible: true,
    },
  ],
  evening: [
    {
      id: generateId(), name: 'Sunset at Fort Aguada', category: 'attraction',
      description: '17th-century Portuguese fort with panoramic sunset views of the Arabian Sea.', address: 'Sinquerim, Bardez, Goa',
      location: { lat: 15.4956, lng: 73.7705 }, duration: 90, estimatedCost: 50, source: 'places',
      tags: ['Sunset', 'History', 'Views'], rating: 4.5,
    },
  ],
};

export const DEMO_DAYS: ItineraryDay[] = [
  { id: 'day-1', dayNumber: 1, date: '2026-06-15', morning: [...DEMO_ACTIVITIES.morning], afternoon: [...DEMO_ACTIVITIES.afternoon], evening: [...DEMO_ACTIVITIES.evening] },
  { id: 'day-2', dayNumber: 2, date: '2026-06-16', morning: [], afternoon: [], evening: [] },
  { id: 'day-3', dayNumber: 3, date: '2026-06-17', morning: [], afternoon: [], evening: [] },
];
