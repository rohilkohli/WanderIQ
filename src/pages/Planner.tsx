import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { useItineraryStore } from "@/store/useItineraryStore";
import { useAuthStore } from "@/store/useAuthStore";
import { validateDay } from "@/lib/constraints";
import { formatCurrency, generateId } from "@/lib/utils";
import { getAiStatusLabel } from "@/lib/aiStatus";
import { analytics } from "@/lib/analytics";
import type { ActivityCard, AiMeta, ItineraryDay, TimeSlot } from "@/types";
import toast from "react-hot-toast";
import { buildAiUserContext, rememberAiAction } from "@/lib/aiMemory";
import { useSearchParams, useNavigate } from "react-router-dom";
import { isRateLimitError } from "@/lib/rateLimitCheck";
import { DEMO_DAYS } from "@/components/planner/demo-data";

/** Same-origin Gemini API proxy endpoint. */
const AUTOFILL_ENDPOINT = '/api/autofill';

import { TimeBlock } from "@/components/planner/TimeBlock";
import { ConstraintBanner } from "@/components/planner/ConstraintBanner";
import { PlannerMap } from "@/components/planner/PlannerMap";

/**
 * The main Planner page for WanderIQ.
 *
 * Renders a multi-day drag-and-drop itinerary editor backed by
 * {@link useItineraryStore} and {@link usePreferencesStore}. Includes
 * constraint validation, AI auto-fill, budget tracking, and map view.
 */
const Planner: React.FC = () => {
  const { preferences } = usePreferencesStore();
  const user = useAuthStore((s) => s.user);
  const { activeItinerary, addActivity, removeActivity, reorderActivities, addDay } = useItineraryStore();
  const navigate = useNavigate();

  const days = activeItinerary?.days ?? [];
  const totalBudget = activeItinerary?.totalBudget || 50000;

  const [selectedDay, setSelectedDay] = useState(0);
  const [params] = useSearchParams();
  const [mapVisible, setMapVisible] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const statusLabel = getAiStatusLabel(aiStatus);
  const generationTriggered = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const currentDay = days[selectedDay];
  const violations = currentDay
    ? validateDay(currentDay, {
        mobilityNeed: preferences.mobility,
        dailyBudgetLimit: totalBudget / Math.max(days.length, 1),
      })
    : [];

  const daySpend = (day: ItineraryDay) => [...day.morning, ...day.afternoon, ...day.evening].reduce((sum, a) => sum + (a.estimatedCost ?? 0), 0);
  const totalSpend = days.reduce((sum, d) => sum + daySpend(d), 0);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !currentDay) return;
      const slots: TimeSlot[] = ["morning", "afternoon", "evening"];
      for (const slot of slots) {
        const acts = currentDay[slot];
        const oldIdx = acts.findIndex((a) => a.id === active.id);
        const newIdx = acts.findIndex((a) => a.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
          const orderedActs = arrayMove(acts, oldIdx, newIdx);
          reorderActivities(currentDay.id, slot, orderedActs.map(a => a.id));
          return;
        }
      }
    },
    [currentDay, reorderActivities],
  );

  const handleDelete = (dayId: string, slot: TimeSlot, actId: string) => {
    removeActivity(dayId, slot, actId);
    toast.success("Activity removed");
  };

  const handleAutoFill = async (dayId: string, slot: TimeSlot) => {
    if (!activeItinerary?.destination) {
      toast.error("Please select a destination first from Discover.");
      return;
    }
    toast.loading("Gemini is finding a real activity…", { id: "autofill" });
    const day = days.find((d) => d.id === dayId);
    const existingNames = day
      ? [...day.morning, ...day.afternoon, ...day.evening].map((a) => a.name)
      : [];
    const destination = activeItinerary.destination.name;
    const dayNumber = day?.dayNumber ?? 1;
    let httpStatus = 0;

    try {
      const res = await fetch(AUTOFILL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ai-user-id': user?.uid ?? 'guest' },
        body: JSON.stringify({
          destination,
          slot,
          dayNumber,
          preferences: { mobility: preferences.mobility, travelStyle: preferences.travelStyle },
          existingActivities: existingNames,
          userContext: buildAiUserContext(preferences),
        }),
      });

      httpStatus = res.status;
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || `API error: ${res.status}`;
        const httpErr = new Error(errorMsg);
        (httpErr as any)._httpStatus = res.status;
        (httpErr as any)._details = errorData;
        throw httpErr;
      }

      const data = await res.json() as { activity: Omit<ActivityCard, 'id' | 'source' | 'aiMeta'>; meta?: AiMeta };
      const activity: ActivityCard = { ...data.activity, id: generateId(), source: 'ai', aiMeta: data.meta };
      setAiStatus(data.meta?.status ?? 'validated');
      rememberAiAction(`autofill:${destination}:${slot}`);

      addActivity(dayId, slot, activity);
      analytics.dayAutoFilled(days.findIndex((d) => d.id === dayId) + 1);
      toast.success(`${activity.name} added by Gemini!`, { id: "autofill" });
    } catch (err) {
      console.error('Autofill failed:', err);
      const httpStatus = (err as any)?._httpStatus;
      const errorDetails = (err as any)?._details;
      // ONLY use static fallback when API quota is exhausted
      if (isRateLimitError(err, httpStatus) || isRateLimitError(errorDetails)) {
        const fallback: ActivityCard = {
          id: generateId(),
          name: slot === "morning" ? "Morning Exploration" : slot === "afternoon" ? "Local Sightseeing" : "Dinner & Sunset",
          category: slot === "morning" ? "wellness" : slot === "afternoon" ? "experience" : "restaurant",
          description: `Explore ${destination} and soak in the local atmosphere.`,
          address: destination,
          location: activeItinerary?.destination?.location ?? { lat: 0, lng: 0 },
          duration: 90,
          estimatedCost: slot === "morning" ? 300 : slot === "afternoon" ? 500 : 800,
          source: "ai",
          tags: ["Fallback", "Rate Limited"],
        };
        addActivity(dayId, slot, fallback);
        analytics.dayAutoFilled(days.findIndex((d) => d.id === dayId) + 1);
        toast.success("API limit reached — added a placeholder activity.", { id: "autofill" });
      } else {
        toast.error("AI autofill failed. Please try again.", { id: "autofill" });
      }
    }
  };

  const generateFullItinerary = useCallback(async () => {
    if (!activeItinerary?.destination || isGenerating) return;
    
    setIsGenerating(true);
    const destName = activeItinerary.destination.name;
    const tid = toast.loading(`Generating full itinerary for ${destName}...`);
    let httpStatus = 0;
    
    try {
      let userLocationStr = "Unknown Starting Location";
      try {
        if ("geolocation" in navigator) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          userLocationStr = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        }
      } catch (e) {
        console.warn("Could not get location for commute:", e);
      }

      const res = await fetch('/api/itinerary-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ai-user-id': user?.uid ?? 'guest' },
        body: JSON.stringify({
          destination: destName,
          days: 3,
          budget: totalBudget,
          userLocation: userLocationStr,
          preferences: { mobility: preferences.mobility, travelStyle: preferences.travelStyle },
          userContext: buildAiUserContext(preferences),
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || `Generation failed: ${res.status}`;
        const genErr = new Error(errorMsg);
        (genErr as any)._httpStatus = res.status;
        (genErr as any)._details = errorData;
        throw genErr;
      }
      
      const data = await res.json() as { itinerary: ItineraryDay[]; meta?: AiMeta };
      if (!Array.isArray(data.itinerary) || data.itinerary.length === 0) throw new Error('Empty itinerary');
      
      const generatedDays = data.itinerary.map(day => ({
        ...day,
        id: generateId(),
        morning: day.morning.map(a => ({ ...a, id: generateId(), source: 'ai' as const })),
        afternoon: day.afternoon.map(a => ({ ...a, id: generateId(), source: 'ai' as const })),
        evening: day.evening.map(a => ({ ...a, id: generateId(), source: 'ai' as const })),
      }));
      
      useItineraryStore.getState().setActiveItinerary({
        ...activeItinerary,
        days: generatedDays,
      });
      
      setAiStatus(data.meta?.status ?? 'validated');
      rememberAiAction(`itinerary:${destName}:${generatedDays.length}d`);
      toast.success(`${generatedDays.length}-day itinerary generated!`, { id: tid });
    } catch (err) {
      console.error('Itinerary generation failed:', err);
      const httpStatus = (err as any)?._httpStatus;
      const errorDetails = (err as any)?._details;
      // ONLY fall back to demo data when API quota is exhausted
      if (isRateLimitError(err, httpStatus) || isRateLimitError(errorDetails)) {
        useItineraryStore.getState().setActiveItinerary({
          ...activeItinerary,
          days: DEMO_DAYS.map(d => ({ ...d, id: generateId() })),
        });
        toast.error("API limit reached — showing sample itinerary.", { id: tid });
      } else {
        toast.error("Failed to generate itinerary. Please try again.", { id: tid });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [activeItinerary, isGenerating, preferences, totalBudget, user?.uid]);

  // Auto-generate itinerary when arriving with an empty itinerary
  useEffect(() => {
    if (activeItinerary && activeItinerary.days.length === 0 && !isGenerating && !generationTriggered.current) {
      generationTriggered.current = true;
      generateFullItinerary();
    }
  }, [activeItinerary, generateFullItinerary, isGenerating]);

  const handleAddDay = () => {
    if (!activeItinerary) {
      toast.error("Please select a destination first.");
      return;
    }
    addDay();
    setSelectedDay(days.length);
    toast.success(`Day ${days.length + 1} added`);
  };

  // If no active itinerary at all, prompt user to discover first
  if (!activeItinerary) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - var(--topbar-height))", gap: "var(--space-4)", padding: "var(--space-8)", textAlign: "center" }}>
        <div style={{ fontSize: "4rem" }}>🗺️</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem" }}>No Destination Selected</h1>
        <p style={{ color: "var(--color-text-muted)", maxWidth: 420 }}>
          Start by discovering a destination using our AI-powered search. Once you select a destination, we'll generate a full itinerary tailored to your preferences.
        </p>
        <button className="btn btn-primary" onClick={() => navigate("/discover")} style={{ marginTop: "var(--space-4)" }}>
          ✨ Discover Destinations
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: "calc(100vh - var(--topbar-height))", display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <div style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", padding: "var(--space-3) var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-4)", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: 2 }}>
            🗺️ {activeItinerary.destination.name}
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {activeItinerary.dateRange?.start && activeItinerary.dateRange?.end
              ? `${activeItinerary.dateRange.start} – ${activeItinerary.dateRange.end} · `
              : ""}
            {days.length} day{days.length !== 1 ? "s" : ""} · {formatCurrency(totalSpend)} / {formatCurrency(totalBudget)}
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {statusLabel}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 180 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>Budget</span>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div className="progress-bar-fill" style={{ width: `${Math.min((totalSpend / totalBudget) * 100, 100)}%`, background: totalSpend > totalBudget ? "var(--color-error)" : "var(--color-accent)" }} />
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: totalSpend > totalBudget ? "var(--color-error)" : "var(--color-accent)" }}>{Math.round((totalSpend / totalBudget) * 100)}%</span>
        </div>
        <button onClick={() => generateFullItinerary()} disabled={isGenerating} className="btn btn-sm btn-secondary" title="Regenerate entire itinerary with AI">
          {isGenerating ? "⏳ Generating..." : "🔄 Regenerate"}
        </button>
        <button onClick={() => setMapVisible(!mapVisible)} className={`btn btn-sm ${mapVisible ? "btn-primary" : "btn-ghost"}`}>
          🗺️ {mapVisible ? "Hide Map" : "Show Map"}
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: mapVisible ? "1fr 420px" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)", overflowX: "auto", paddingBottom: "var(--space-2)" }}>
            {days.length === 0 && isGenerating && (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-6) var(--space-8)", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", width: "100%" }}>
                <div style={{ width: 24, height: 24, border: "3px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Generating your {activeItinerary.destination.name} itinerary...</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Gemini AI is creating personalized activities for your trip.</p>
                </div>
              </div>
            )}
            {days.length === 0 && !isGenerating && (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-6) var(--space-8)", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", width: "100%" }}>
                <p style={{ color: "var(--color-text-muted)" }}>No days generated yet.</p>
                <button className="btn btn-primary btn-sm" onClick={() => { generationTriggered.current = false; generateFullItinerary(); }}>
                  ✨ Generate Itinerary
                </button>
              </div>
            )}
            {days.map((day, i) => (
              <button key={day.id} onClick={() => setSelectedDay(i)} style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)", border: "2px solid", borderColor: selectedDay === i ? "var(--color-accent)" : "var(--color-border)", background: selectedDay === i ? "var(--color-accent)" : "var(--color-surface)", color: selectedDay === i ? "white" : "var(--color-text-muted)", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.875rem", minHeight: 44 }}>
                <div>Day {day.dayNumber}</div>
                <div style={{ fontSize: "0.6875rem", opacity: 0.8, marginTop: 2 }}>{formatCurrency(daySpend(day))}</div>
              </button>
            ))}
            <button onClick={handleAddDay} style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)", border: "2px dashed var(--color-border)", background: "transparent", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.875rem", fontFamily: "var(--font-body)", minHeight: 44 }}>
              + Add Day
            </button>
          </div>
          <ConstraintBanner violations={violations} />
          {currentDay && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {(["morning", "afternoon", "evening"] as TimeSlot[]).map((slot) => {
                  const labels: Record<TimeSlot, string> = { morning: "☀️ Morning", afternoon: "🌤️ Afternoon", evening: "🌙 Evening" };
                  return <TimeBlock key={slot} label={labels[slot]} slot={slot} activities={currentDay[slot]} dayId={currentDay.id} onDelete={handleDelete} onAutoFill={handleAutoFill} />;
                })}
              </div>
            </DndContext>
          )}
        </div>
        {mapVisible && <PlannerMap currentDay={currentDay} />}
      </div>
    </div>
  );
};

export default Planner;
