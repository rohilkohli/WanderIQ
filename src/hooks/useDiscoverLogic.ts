import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import { sanitizeInput } from '@/lib/utils';
import type { DestinationResult } from '@/types';
import { DEMO_DESTINATIONS } from '@/components/planner/demo-data';

/** Cloud Functions base URL — falls back to localhost for dev. */
const FUNCTIONS_BASE =
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  'https://us-central1-prompt-wars-in-person-gurugram.cloudfunctions.net';

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
 * Scores and sorts destinations by proximity to the user, excluding
 * locations they are already at (within 80 km).
 */
function rankByLocation(
  destinations: DestinationResult[],
  lat: number,
  lng: number
): DestinationResult[] {
  return destinations
    .map((dest) => {
      const dist = haversineKm(lat, lng, dest.location.lat, dest.location.lng);
      const proximityBoost = dist < 100 ? -20 : Math.max(0, 15 - Math.floor(dist / 400));
      return { ...dest, matchScore: Math.min(99, dest.matchScore + proximityBoost) };
    })
    .filter((d) => haversineKm(lat, lng, d.location.lat, d.location.lng) > 80)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calls the Gemini discover Cloud Function to get AI-powered destination recommendations.
 * Falls back to ranked demo data if the function is unavailable.
 */
async function fetchGeminiDestinations(
  query: string,
  userLat?: number,
  userLng?: number
): Promise<DestinationResult[]> {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/geminiDiscover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, userLat, userLng }),
    });

    if (!res.ok) throw new Error(`Function error: ${res.status}`);
    const data = (await res.json()) as { destinations: DestinationResult[] };

    if (!Array.isArray(data.destinations) || data.destinations.length === 0) {
      throw new Error('Empty response from AI');
    }
    return data.destinations;
  } catch {
    // Graceful fallback to demo data with geo-ranking
    const base = userLat && userLng
      ? rankByLocation(DEMO_DESTINATIONS, userLat, userLng)
      : DEMO_DESTINATIONS;
    return base.length > 0 ? base : DEMO_DESTINATIONS;
  }
}

/**
 * Custom hook encapsulating all Discover page logic.
 * Handles AI mood search via Gemini Cloud Function, geo-location ranking,
 * compare mode, and navigation to the Planner.
 */
export const useDiscoverLogic = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [moodQuery, setMoodQuery] = useState(params.get('mood') ?? '');
  const [destinations, setDestinations] = useState<DestinationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'grid' | 'compare'>('grid');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  /** Attempt to resolve the user's geo-location once on mount. */
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        /* permission denied — silently fall back to default ranking */
      }
    );
  }, []);

  const handleMoodSearch = async () => {
    const q = sanitizeInput(moodQuery);
    if (!q) return;
    setLoading(true);
    analytics.discoverMoodSearch(q.length);
    try {
      const results = await fetchGeminiDestinations(
        q,
        userCoords?.lat,
        userCoords?.lng
      );
      setDestinations(results);
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
    moodQuery,
    setMoodQuery,
    destinations,
    loading,
    view,
    setView,
    compareIds,
    toggleCompare,
    compareDestinations,
    handleMoodSearch,
    handleSelectDestination,
  };
};
