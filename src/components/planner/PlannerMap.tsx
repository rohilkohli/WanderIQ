/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState } from "react";
import type { ItineraryDay } from "@/types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "./constants";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export interface PlannerMapProps {
  currentDay?: ItineraryDay;
}

export const PlannerMap: React.FC<PlannerMapProps> = ({ currentDay }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    const initMap = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_MAPS_API_KEY || "";
      if (!apiKey) {
        console.warn("Google Maps API Key missing. Rendering placeholder.");
        return;
      }

      try {
        setOptions({
          key: apiKey,
          v: "weekly",
        });
        const [{ Map }, { PlacesService }, { DirectionsService, DirectionsRenderer }] = await Promise.all([
          importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          importLibrary("places") as Promise<google.maps.PlacesLibrary>,
          importLibrary("routes") as Promise<google.maps.RoutesLibrary>,
        ]);

        if (!mapRef.current) return;
        const newMap = new Map(mapRef.current, {
          center: { lat: 15.2993, lng: 74.124 },
          zoom: 10,
          mapId: "WANDERIQ_MAP_ID",
          disableDefaultUI: true,
          zoomControl: true,
        });
        placesServiceRef.current = new PlacesService(newMap);
        directionsServiceRef.current = new DirectionsService();
        directionsRendererRef.current = new DirectionsRenderer({
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: "#1B4332",
            strokeOpacity: 0.85,
            strokeWeight: 4,
          },
        });
        directionsRendererRef.current.setMap(newMap);
        setMap(newMap);
      } catch (err) {
        console.error("Error loading Google Maps", err);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      directionsRendererRef.current?.setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!map || !currentDay) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const activities = [...currentDay.morning, ...currentDay.afternoon, ...currentDay.evening];
    let isCancelled = false;

    const findPlace = (query: string): Promise<google.maps.LatLngLiteral | null> => {
      const service = placesServiceRef.current;
      if (!service || !query.trim()) return Promise.resolve(null);
      return new Promise((resolve) => {
        service.findPlaceFromQuery(
          {
            query,
            fields: ["geometry"],
          },
          (results, status) => {
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !results ||
              results.length === 0 ||
              !results[0].geometry?.location
            ) {
              resolve(null);
              return;
            }
            const location = results[0].geometry.location;
            resolve({ lat: location.lat(), lng: location.lng() });
          }
        );
      });
    };

    const renderMarkersAndRoute = async () => {
      const resolved = await Promise.all(
        activities.map(async (activity) => {
          if (activity.location?.lat && activity.location?.lng) {
            return { activity, position: { lat: activity.location.lat, lng: activity.location.lng } };
          }
          const place = await findPlace(`${activity.name} ${activity.address}`);
          return place ? { activity, position: place } : null;
        })
      );
      if (isCancelled) return;

      const points = resolved.filter(Boolean) as Array<{
        activity: (typeof activities)[number];
        position: google.maps.LatLngLiteral;
      }>;
      if (points.length === 0) return;

      const bounds = new google.maps.LatLngBounds();
      points.forEach(({ activity, position }) => {
        bounds.extend(position);
        const marker = new google.maps.Marker({
          position,
          map,
          title: activity.name,
        });
        markersRef.current.push(marker);
      });

      if (points.length === 1) {
        map.setCenter(points[0].position);
        map.setZoom(14);
        return;
      }

      const directionsRenderer = directionsRendererRef.current;
      const directionsService = directionsServiceRef.current;
      if (directionsRenderer && directionsService) {
        directionsRenderer.setMap(null);
        directionsRenderer.setMap(map);
        try {
          const result = await directionsService.route({
            origin: points[0].position,
            destination: points[points.length - 1].position,
            waypoints: points.slice(1, -1).map((point) => ({
              location: point.position,
              stopover: true,
            })),
            travelMode: google.maps.TravelMode.DRIVING,
          });
          if (!isCancelled) {
            directionsRenderer.setDirections(result);
          }
          return;
        } catch {
          // Fall back to bounds-only mode.
        }
      }

      map.fitBounds(bounds, 40);
      const listener = google.maps.event.addListener(map, "idle", () => {
        if (map.getZoom() && map.getZoom()! > 16) map.setZoom(16);
        google.maps.event.removeListener(listener);
      });
    };

    renderMarkersAndRoute();

    return () => {
      isCancelled = true;
    };
  }, [map, currentDay]);

  const apiKeyExists = !!(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_MAPS_API_KEY);

  return (
    <div role="application" aria-label="Trip map showing your itinerary locations" style={{ background: "var(--color-surface-alt)", borderLeft: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-4)", overflow: "hidden", position: "relative", width: "100%", height: "100%" }}>
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
