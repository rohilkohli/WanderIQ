import React, { useState, useCallback } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { useItineraryStore } from "@/store/useItineraryStore";
import { validateDay } from "@/lib/constraints";
import { formatCurrency, generateId } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import type { ActivityCard, ItineraryDay, TimeSlot } from "@/types";
import toast from "react-hot-toast";

/** Same-origin Gemini API proxy endpoint. */
const AUTOFILL_ENDPOINT = '/api/autofill';

import { DEMO_DAYS } from "@/components/planner/demo-data";
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
  const { activeItinerary, addActivity, removeActivity, reorderActivities, addDay } = useItineraryStore();

  const days = activeItinerary?.days || DEMO_DAYS;
  // If usePreferencesStore exposes a budget, we'd use it here, otherwise fallback to activeItinerary or 40000
  const totalBudget = activeItinerary?.totalBudget || 40000;

  const [selectedDay, setSelectedDay] = useState(0);
  const [mapVisible, setMapVisible] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const currentDay = days[selectedDay];
  const violations = currentDay
    ? validateDay(currentDay, {
        mobilityNeed: preferences.mobility,
        dailyBudgetLimit: totalBudget / days.length,
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
    toast.loading("Gemini is filling your day…", { id: "autofill" });
    const day = days.find((d) => d.id === dayId);
    const existingNames = day
      ? [...day.morning, ...day.afternoon, ...day.evening].map((a) => a.name)
      : [];
    const destination = activeItinerary?.destination ?? 'Goa, India';
    const dayNumber = day?.dayNumber ?? 1;

    try {
      const res = await fetch(AUTOFILL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          slot,
          dayNumber,
          preferences: { mobility: preferences.mobility, travelStyle: preferences.travelStyle },
          existingActivities: existingNames,
        }),
      });

      let activity: ActivityCard;
      if (res.ok) {
        const data = await res.json() as { activity: Omit<ActivityCard, 'id' | 'source'> };
        activity = { ...data.activity, id: generateId(), source: 'ai' };
      } else {
        throw new Error(`Function error: ${res.status}`);
      }

      addActivity(dayId, slot, activity);
      analytics.dayAutoFilled(days.findIndex((d) => d.id === dayId) + 1);
      toast.success(`${activity.name} added by Gemini!`, { id: "autofill" });
    } catch {
      // Graceful fallback to a sensible default
      const fallback: ActivityCard = {
        id: generateId(),
        name: slot === "morning" ? "Morning Exploration" : slot === "afternoon" ? "Local Sightseeing" : "Dinner & Sunset",
        category: slot === "morning" ? "wellness" : slot === "afternoon" ? "experience" : "restaurant",
        description: "Explore the local area and soak in the atmosphere.",
        address: `${destination}`,
        location: { lat: 15.2993, lng: 74.124 },
        duration: 90,
        estimatedCost: slot === "morning" ? 300 : slot === "afternoon" ? 500 : 800,
        source: "ai",
        tags: ["AI Suggestion"],
      };
      addActivity(dayId, slot, fallback);
      analytics.dayAutoFilled(days.findIndex((d) => d.id === dayId) + 1);
      toast.success("Day auto-filled!", { id: "autofill" });
    }
  };

  const handleAddDay = () => {
    addDay();
    setSelectedDay(days.length);
    toast.success(`Day ${days.length + 1} added`);
  };

  return (
    <div style={{ height: "calc(100vh - var(--topbar-height))", display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <div style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", padding: "var(--space-3) var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-4)", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: 2 }}>
            {activeItinerary?.destination ? `🗺️ ${activeItinerary.destination.name}` : "🏖️ My Trip"}
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {activeItinerary?.dateRange?.start && activeItinerary?.dateRange?.end
              ? `${activeItinerary.dateRange.start} – ${activeItinerary.dateRange.end} · `
              : ""}
            {days.length} day{days.length !== 1 ? "s" : ""} · {formatCurrency(totalSpend)} / {formatCurrency(totalBudget)}
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 180 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>Budget</span>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div className="progress-bar-fill" style={{ width: `${Math.min((totalSpend / totalBudget) * 100, 100)}%`, background: totalSpend > totalBudget ? "var(--color-error)" : "var(--color-accent)" }} />
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: totalSpend > totalBudget ? "var(--color-error)" : "var(--color-accent)" }}>{Math.round((totalSpend / totalBudget) * 100)}%</span>
        </div>
        <button onClick={() => setMapVisible(!mapVisible)} className={`btn btn-sm ${mapVisible ? "btn-primary" : "btn-ghost"}`}>
          🗺️ {mapVisible ? "Hide Map" : "Show Map"}
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: mapVisible ? "1fr 420px" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)", overflowX: "auto", paddingBottom: "var(--space-2)" }}>
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
