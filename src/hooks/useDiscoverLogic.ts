import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import { sanitizeInput } from '@/lib/utils';
import type { DestinationResult } from '@/types';
import { DEMO_DESTINATIONS } from '@/components/planner/demo-data';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { buildAiUserContext, rememberAiAction } from '@/lib/aiMemory';

/** Haversine distance in km between two lat/lng points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Scores and sorts destinations by proximity, excluding ones user is already at.
 */
function rankByLocation(
  destinations: DestinationResult[],
  lat: number,
  lng: number
): DestinationResult[] {
  return destinations
    .map((dest) => {
      const dist = haversineKm(lat, lng, dest.location.lat, dest.location.lng);
      const boost = dist < 100 ? -20 : Math.max(0, 15 - Math.floor(dist / 400));
      return { ...dest, matchScore: Math.min(99, dest.matchScore + boost) };
    })
    .filter((d) => haversineKm(lat, lng, d.location.lat, d.location.lng) > 80)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calls the same-origin /api/discover endpoint (Gemini-backed).
 * Falls back to geo-ranked demo data on any error.
 */
async function fetchDestinations(
  query: string,
  preferences: Record<string, unknown>,
  userId: string,
  userLat?: number,
  userLng?: number
): Promise<{ destinations: DestinationResult[]; status: string }> {
  try {
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ai-user-id': userId,
      },
      body: JSON.stringify({ query, userLat, userLng, preferences, userContext: buildAiUserContext(preferences) }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = (await res.json()) as { destinations: DestinationResult[]; meta?: { status?: string } };
    if (!Array.isArray(data.destinations) || data.destinations.length === 0) throw new Error('Empty');
    return { destinations: data.destinations, status: data.meta?.status ?? 'validated' };
  } catch {
    const base = userLat && userLng
      ? rankByLocation(DEMO_DESTINATIONS, userLat, userLng)
      : DEMO_DESTINATIONS;
    return { destinations: base.length > 0 ? base : DEMO_DESTINATIONS, status: 'fallback_demo' };
  }
}

/**
 * Custom hook for Discover page — real-time Gemini AI search with geo-location ranking.
 * Falls back gracefully to curated demo destinations when AI is unavailable.
 */
export const useDiscoverLogic = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preferences = usePreferencesStore((s) => s.preferences);
  const user = useAuthStore((s) => s.user);
  const [moodQuery, setMoodQuery] = useState(params.get('mood') ?? '');
  const [destinations, setDestinations] = useState<DestinationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>('idle');
  const [view, setView] = useState<'grid' | 'compare'>('grid');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* denied — silently fall back */ }
    );
  }, []);

  const handleMoodSearch = async () => {
    const q = sanitizeInput(moodQuery);
    if (!q) return;
    setLoading(true);
    analytics.discoverMoodSearch(q.length);
    try {
      const result = await fetchDestinations(
        q,
        preferences as unknown as Record<string, unknown>,
        user?.uid ?? 'guest',
        userCoords?.lat,
        userCoords?.lng
      );
      setDestinations(result.destinations);
      setAiStatus(result.status);
      rememberAiAction(`discover:${q.slice(0, 80)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (params.get('mood')) handleMoodSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectDestination = (dest: DestinationResult) => {
    analytics.destinationSelected(dest.name, dest.matchScore);
    navigate(`/planner?destination=${dest.id}`);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 2)
    );
  };

  const compareDestinations = compareIds
    .map((id) => destinations.find((d) => d.id === id))
    .filter(Boolean) as DestinationResult[];

  return {
    moodQuery, setMoodQuery,
    destinations, loading,
    view, setView,
    compareIds, toggleCompare,
    compareDestinations,
    aiStatus,
    handleMoodSearch,
    handleSelectDestination,
  };
};
