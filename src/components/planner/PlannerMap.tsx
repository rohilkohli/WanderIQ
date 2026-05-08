import React from "react";
import type { ItineraryDay } from "@/types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "./constants";

export interface PlannerMapProps {
  currentDay?: ItineraryDay;
}

export const PlannerMap: React.FC<PlannerMapProps> = ({ currentDay }) => {
  return (
    <div role="application" aria-label="Trip map showing your itinerary locations" style={{ background: "var(--color-surface-alt)", borderLeft: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-4)", overflowY: "auto" }}>
      {/* Visually-hidden list for screen readers */}
      <ul className="sr-only">
        {currentDay &&
          [...currentDay.morning, ...currentDay.afternoon, ...currentDay.evening].map((a) => (
            <li key={a.id}>
              {a.name} — {a.address}
            </li>
          ))}
      </ul>

      {/* Map placeholder — in production uses Google Maps JS API */}
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-4)", position: "relative" }}>
        <div style={{ fontSize: "3rem" }}>🗺️</div>
        <div style={{ textAlign: "center", padding: "var(--space-4)" }}>
          <p style={{ fontWeight: 700, color: "var(--color-accent)", marginBottom: "var(--space-2)" }}>Google Maps Integration</p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", maxWidth: 280 }}>Add your Google Maps API key to see activity markers, route polylines, and Street View previews.</p>
          <code style={{ display: "block", marginTop: "var(--space-3)", background: "var(--color-surface)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--color-accent)" }}>VITE_MAPS_API_KEY=your_key</code>
        </div>

        {/* Activity markers */}
        {currentDay &&
          [...currentDay.morning, ...currentDay.afternoon, ...currentDay.evening].map((a, i) => (
            <div key={a.id} style={{ position: "absolute", top: `${20 + i * 14}%`, left: `${25 + (i % 3) * 20}%`, background: CATEGORY_COLORS[a.category], color: "white", borderRadius: "var(--radius-full)", padding: "4px 10px", fontSize: "0.75rem", fontWeight: 700, boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", animation: `fadeInUp 300ms ease-out ${i * 100}ms both`, whiteSpace: "nowrap", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }} title={a.name}>
              {CATEGORY_ICONS[a.category]} {a.name.slice(0, 15)}
            </div>
          ))}
      </div>
    </div>
  );
};
