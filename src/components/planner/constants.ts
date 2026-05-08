import type { ActivityCategory } from '@/types';

export const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  restaurant: '🍽️', attraction: '🏛️', hotel: '🏨', transport: '🚗',
  experience: '🎭', shopping: '🛍️', nightlife: '🎵', nature: '🌿', wellness: '🧘',
};

export const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  restaurant: '#E76F51', attraction: '#1B4332', hotel: '#4361EE', transport: '#6B6560',
  experience: '#E9C46A', shopping: '#F4845F', nightlife: '#7B2D8B', nature: '#2D6A4F', wellness: '#0096C7',
};
