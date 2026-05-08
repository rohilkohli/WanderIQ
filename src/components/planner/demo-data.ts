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

import type { DestinationResult } from '@/types';
export const DEMO_DESTINATIONS: DestinationResult[] = [
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    description: 'Vibrant beach state on India\'s western coast blending Portuguese heritage with tropical beauty, legendary nightlife, and incredible seafood.',
    heroImageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80',
    location: { lat: 15.2993, lng: 74.1240 },
    rating: 4.6,
    priceLevel: 2,
    tags: ['Beach', 'Food', 'Nightlife', 'Cultural'],
    matchScore: 94,
    matchReasons: ['Matches your beach preference', 'Excellent street food scene', 'Budget-friendly'],
    climate: { tempMin: 26, tempMax: 33, rainProbability: 12, condition: 'sunny', description: 'Warm & sunny' },
    bestFor: ['Solo', 'Couples', 'Friends'],
  },
  {
    id: 'rajasthan',
    name: 'Rajasthan',
    country: 'India',
    description: 'The Land of Kings — magnificent forts, sand dunes, opulent palaces, and the most vibrant bazaars in Asia.',
    heroImageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80',
    location: { lat: 27.0238, lng: 74.2179 },
    rating: 4.8,
    priceLevel: 2,
    tags: ['Cultural', 'Architecture', 'History', 'Shopping'],
    matchScore: 88,
    matchReasons: ['Matches your cultural travel style', 'Rich architectural heritage', 'Great photography spots'],
    climate: { tempMin: 20, tempMax: 37, rainProbability: 8, condition: 'sunny', description: 'Hot & dry' },
    bestFor: ['Couples', 'Families', 'Solo'],
  },
  {
    id: 'coorg',
    name: 'Coorg',
    country: 'India',
    description: 'Scotland of India — rolling coffee plantations, misty hills, waterfalls, and wildlife sanctuaries in Karnataka\'s Western Ghats.',
    heroImageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
    location: { lat: 12.3375, lng: 75.8069 },
    rating: 4.5,
    priceLevel: 2,
    tags: ['Wellness', 'Nature', 'Wildlife', 'Photography'],
    matchScore: 82,
    matchReasons: ['Perfect for wellness retreats', 'Incredible nature photography', 'Low-exertion friendly'],
    climate: { tempMin: 15, tempMax: 25, rainProbability: 35, condition: 'cloudy', description: 'Cool & misty' },
    bestFor: ['Couples', 'Solo', 'Friends'],
  },
  {
    id: 'andaman',
    name: 'Andaman Islands',
    country: 'India',
    description: 'Pristine turquoise waters, coral reefs, and white-sand beaches far off the beaten path — India\'s tropical paradise.',
    heroImageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    location: { lat: 11.7401, lng: 92.6586 },
    rating: 4.7,
    priceLevel: 2,
    tags: ['Beach', 'Adventure', 'Diving', 'Wildlife'],
    matchScore: 79,
    matchReasons: ['Off-beaten-path destination', 'Exceptional marine life', 'Adventure activities'],
    climate: { tempMin: 24, tempMax: 30, rainProbability: 20, condition: 'clear', description: 'Tropical & clear' },
    bestFor: ['Couples', 'Friends', 'Divers'],
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    country: 'India',
    description: 'One of the world\'s oldest living cities — ghats on the Ganges, ancient temples, silk weaving, and profound spiritual energy.',
    heroImageUrl: 'https://images.unsplash.com/photo-1561361058-c24e017e5e87?w=800&q=80',
    location: { lat: 25.3176, lng: 82.9739 },
    rating: 4.4,
    priceLevel: 1,
    tags: ['Cultural', 'Spiritual', 'History', 'Photography'],
    matchScore: 76,
    matchReasons: ['Deep cultural immersion', 'World heritage architecture', 'Budget-friendly'],
    climate: { tempMin: 18, tempMax: 32, rainProbability: 15, condition: 'sunny', description: 'Warm & dry' },
    bestFor: ['Solo', 'Cultural explorers'],
  },
];

export const PRICE_LABELS: Record<number, string> = { 1: '₹', 2: '₹₹', 3: '₹₹₹', 4: '₹₹₹₹' };
export const CONDITION_BG: Record<string, string> = {
  sunny: 'linear-gradient(135deg, #FFB300, #FF6F00)',
  cloudy: 'linear-gradient(135deg, #78909C, #546E7A)',
  rainy:  'linear-gradient(135deg, #1565C0, #0D47A1)',
  clear:  'linear-gradient(135deg, #0288D1, #0097A7)',
};