import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatCurrency } from "@/lib/utils";
import type { ActivityCard, TimeSlot } from "@/types";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "./constants";

/**
 * Props for the {@link SortableActivity} component.
 * @property activity - The activity card data to render.
 * @property dayId - Parent itinerary day ID.
 * @property slot - The time slot this activity belongs to.
 * @property onDelete - Callback invoked when the user removes the activity.
 */
export interface SortableActivityProps {
  activity: ActivityCard;
  dayId: string;
  slot: TimeSlot;
  onDelete: (dayId: string, slot: TimeSlot, id: string) => void;
}

/**
 * A drag-and-drop sortable activity card using dnd-kit.
 * Displays category icon, name, duration, cost, and accessibility badge.
 * @param props - {@link SortableActivityProps}
 */
export const SortableActivity: React.FC<SortableActivityProps> = ({ activity, dayId, slot, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} role="listitem">
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: isDragging ? "grabbing" : "grab", boxShadow: isDragging ? "var(--shadow-lg)" : "var(--shadow-sm)", transition: "box-shadow var(--transition-fast)", borderLeft: `3px solid ${CATEGORY_COLORS[activity.category]}` }}>
        {/* Drag handle */}
        <button {...attributes} {...listeners} aria-label={`Drag to reorder ${activity.name}`} style={{ background: "transparent", border: "none", cursor: "grab", color: "var(--color-text-muted)", padding: "var(--space-1)", display: "flex", alignItems: "center", fontSize: "1rem", flexShrink: 0 }}>
          ⠿
        </button>

        {/* Category icon */}
        <div style={{ fontSize: "1.25rem", flexShrink: 0 }} aria-hidden="true">
          {CATEGORY_ICONS[activity.category]}
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9375rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activity.name}</span>
            {activity.rating && <span style={{ color: "#E9C46A", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>★ {activity.rating}</span>}
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{activity.duration} min</span>
            {activity.estimatedCost !== undefined && activity.estimatedCost > 0 && <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>· {formatCurrency(activity.estimatedCost)}</span>}
            {activity.source === "ai" && (
              <span className="badge badge-accent" style={{ fontSize: "0.6rem" }}>
                AI
              </span>
            )}
            {activity.isWheelchairAccessible && (
              <span title="Wheelchair accessible" style={{ fontSize: "0.75rem" }} aria-label="Wheelchair accessible">
                ♿
              </span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button onClick={() => onDelete(dayId, slot, activity.id)} aria-label={`Remove ${activity.name}`} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "var(--space-1)", borderRadius: "var(--radius-sm)", fontSize: "1rem", flexShrink: 0, transition: "color var(--transition-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-error)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}>
          ×
        </button>
      </div>
    </div>
  );
};
