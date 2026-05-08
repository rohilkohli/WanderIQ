/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState } from "react";
import type { ItineraryDay } from "@/types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "./constants";
import { Loader } from "@googlemaps/js-api-loader";

export interface PlannerMapProps {
  currentDay?: ItineraryDay;
}

export const PlannerMap: React.FC<PlannerMapProps> = ({ currentDay }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    const initMap = async () => {
      // NOTE: In a real app, this should be in an environment variable e.g. VITE_GOOGLE_MAPS_API_KEY
      // The user wants full implementation, we will use the loader but gracefully handle missing keys
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
      if (!apiKey) {
        console.warn("Google Maps API Key missing. Rendering placeholder.");
        return;
      }

      const loader = new Loader({
        apiKey,
        version: "weekly",
      });

      try {
        // @ts-ignore
        const { Map } = await loader.importLibrary("maps");
        if (mapRef.current) {
          const newMap = new Map(mapRef.current, {
            center: { lat: 15.2993, lng: 74.124 }, // Default to Goa coordinates
            zoom: 10,
            mapId: "WANDERIQ_MAP_ID",
            disableDefaultUI: true,
            zoomControl: true,
          });
          setMap(newMap);
        }
      } catch (err) {
        console.error("Error loading Google Maps", err);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!map || !currentDay) return;

    // Clear old markers
    markers.forEach((m) => m.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const activities = [...currentDay.morning, ...currentDay.afternoon, ...currentDay.evening];
    
    const bounds = new google.maps.LatLngBounds();
    let hasValidLocation = false;

    activities.forEach((activity) => {
      if (activity.location && activity.location.lat !== 0) {
        hasValidLocation = true;
        const position = { lat: activity.location.lat, lng: activity.location.lng };
        bounds.extend(position);

        // Simple marker for now. AdvancedMarkerElement can be used in the future
        const marker = new google.maps.Marker({
          position,
          map,
          title: activity.name,
          // Custom icon based on category could be added here
        });
        
        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);

    if (hasValidLocation && newMarkers.length > 0) {
      if (newMarkers.length === 1) {
        map.setCenter(newMarkers[0].getPosition() as google.maps.LatLng);
        map.setZoom(14);
      } else {
        map.fitBounds(bounds);
        // Add some padding
        const listener = google.maps.event.addListener(map, "idle", () => {
          if (map.getZoom()! > 16) map.setZoom(16);
          google.maps.event.removeListener(listener);
        });
      }
    }
  }, [map, currentDay]);

  const apiKeyExists = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div role="application" aria-label="Trip map showing your itinerary locations" style={{ background: "var(--color-surface-alt)", borderLeft: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-4)", overflow: "hidden", position: "relative", width: "100%", height: "100%" }}>
      {/* Visually-hidden list for screen readers */}
      <ul className="sr-only">
        {currentDay &&
          [...currentDay.morning, ...currentDay.afternoon, ...currentDay.evening].map((a) => (
            <li key={a.id}>
              {a.name} — {a.address}
            </li>
          ))}
      </ul>

      {apiKeyExists ? (
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-4)", position: "relative" }}>
          <div style={{ fontSize: "3rem" }}>🗺️</div>
          <div style={{ textAlign: "center", padding: "var(--space-4)" }}>
            <p style={{ fontWeight: 700, color: "var(--color-accent)", marginBottom: "var(--space-2)" }}>Google Maps Ready</p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", maxWidth: 280 }}>Add your Google Maps API key to see real dynamic markers and routing.</p>
            <code style={{ display: "block", marginTop: "var(--space-3)", background: "var(--color-surface)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--color-accent)" }}>VITE_GOOGLE_MAPS_API_KEY=your_key</code>
          </div>

          {/* Placeholder Activity markers */}
          {currentDay &&
            [...currentDay.morning, ...currentDay.afternoon, ...currentDay.evening].map((a, i) => (
              <div key={a.id} style={{ position: "absolute", top: `${20 + i * 14}%`, left: `${25 + (i % 3) * 20}%`, background: CATEGORY_COLORS[a.category], color: "white", borderRadius: "var(--radius-full)", padding: "4px 10px", fontSize: "0.75rem", fontWeight: 700, boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", animation: `fadeInUp 300ms ease-out ${i * 100}ms both`, whiteSpace: "nowrap", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }} title={a.name}>
                {CATEGORY_ICONS[a.category]} {a.name.slice(0, 15)}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
