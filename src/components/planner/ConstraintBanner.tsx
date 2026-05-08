import React from "react";
import { validateDay } from "@/lib/constraints";

export interface ConstraintBannerProps {
  violations: ReturnType<typeof validateDay>;
}

export const ConstraintBanner: React.FC<ConstraintBannerProps> = ({ violations }) => {
  if (violations.length === 0) return null;
  return (
    <aside role="alert" aria-label="Itinerary constraint warnings" style={{ background: "rgba(231,111,81,0.1)", border: "1px solid var(--color-highlight)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", marginBottom: "var(--space-4)" }}>
      <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-highlight)", marginBottom: "var(--space-2)" }}>
        ⚠️ {violations.length} constraint{violations.length > 1 ? "s" : ""} detected
      </h3>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        {violations.slice(0, 3).map((v) => (
          <li key={v.id} style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {v.severity === "error" ? "🔴" : "🟡"} {v.message}
          </li>
        ))}
      </ul>
    </aside>
  );
};
