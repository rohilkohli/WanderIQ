import React from "react";
import { STATS } from "./LandingConstants";

export const LandingStats: React.FC = () => {
  return (
    <section aria-label="WanderIQ by the numbers" style={{ background: "var(--color-accent)", padding: "var(--space-8) var(--space-8)", display: "flex", justifyContent: "center", gap: "var(--space-16)", flexWrap: "wrap" }}>
      {STATS.map((s) => (
        <div key={s.label} style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700 }}>{s.value}</div>
          <div style={{ fontSize: "0.875rem", opacity: 0.8, marginTop: "var(--space-1)" }}>{s.label}</div>
        </div>
      ))}
    </section>
  );
};
