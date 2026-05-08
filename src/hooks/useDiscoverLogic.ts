import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import { sanitizeInput } from '@/lib/utils';
import type { DestinationResult } from '@/types';
import { DEMO_DESTINATIONS } from '@/components/planner/demo-data';

export const useDiscoverLogic = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [moodQuery, setMoodQuery] = useState(params.get('mood') ?? '');
  const [destinations, setDestinations] = useState<DestinationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'grid' | 'compare'>('grid');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const handleMoodSearch = async () => {
    const q = sanitizeInput(moodQuery);
    if (!q) return;
    setLoading(true);
    analytics.discoverMoodSearch(q.length);
    try {
      await new Promise((r) => setTimeout(r, 1400));
      setDestinations(DEMO_DESTINATIONS);
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
    handleSelectDestination
  };
};
