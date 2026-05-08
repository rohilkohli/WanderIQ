import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import { sanitizeInput } from '@/lib/utils';
import type { DestinationResult } from '@/types';
import { DEMO_DESTINATIONS } from '@/components/planner/demo-data';

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
 * Scores and sorts DEMO_DESTINATIONS by proximity to the given coordinates,
 * boosting match scores for closer destinations and suppressing the one
 * nearest to the user's current position (already there!).
 */
function rankByLocation(lat: number, lng: number): DestinationResult[] {
  const MAX_DIST = 5000; // km — treat anything beyond as equal
  return DEMO_DESTINATIONS
    .map((dest) => {
      const dist = haversineKm(lat, lng, dest.location.lat, dest.location.lng);
      // Penalise destinations that are too close (< 100 km — user is already there)
      const proximityBoost = dist < 100 ? -20 : Math.max(0, 15 - Math.floor(dist / 400));
      return { ...dest, matchScore: Math.min(99, dest.matchScore + proximityBoost) };
    })
    .filter((d) => {
      // Hide destinations within 80 km of the user (they're already there)
      const dist = haversineKm(lat, lng, d.location.lat, d.location.lng);
      return dist > 80;
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Custom hook encapsulating all Discover page logic.
 * Handles mood search, geo-location ranking, compare mode, and navigation.
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
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission denied — silently fall back to default ranking */ }
    );
  }, []);

  const handleMoodSearch = async () => {
    const q = sanitizeInput(moodQuery);
    if (!q) return;
    setLoading(true);
    analytics.discoverMoodSearch(q.length);
    try {
      await new Promise((r) => setTimeout(r, 1400));
      // Rank by geo-location if we have coords, otherwise use default list
      const ranked = userCoords
        ? rankByLocation(userCoords.lat, userCoords.lng)
        : DEMO_DESTINATIONS;
      setDestinations(ranked.length > 0 ? ranked : DEMO_DESTINATIONS);
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
    handleMoodSearch,
    handleSelectDestination,
  };
};
