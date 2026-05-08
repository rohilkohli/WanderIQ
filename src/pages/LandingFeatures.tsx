import React from "react";
import { useNavigate } from "react-router-dom";
import { DESTINATIONS, FEATURES, STATS } from "./LandingConstants";

export const LandingFeatures: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section id="features" aria-labelledby="features-heading" style={{ padding: "var(--space-24) var(--space-8)", maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
        <div className="badge badge-accent" style={{ marginBottom: "var(--space-4)", fontSize: "0.8125rem" }}>
          ✦ Features
        </div>
        <h2 id="features-heading" style={{ marginBottom: "var(--space-4)" }}>
          Everything you need to travel brilliantly
        </h2>
        <p style={{ color: "var(--color-text-muted)", maxWidth: 520, margin: "0 auto", fontSize: "1.0625rem" }}>From AI destination discovery to real-time collaboration — WanderIQ handles every layer of trip planning.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-6)" }} className="stagger">
        {FEATURES.map((f) => (
          <article key={f.title} className="card" style={{ padding: "var(--space-6)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "var(--radius-lg)", background: "var(--color-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "var(--space-4)" }} aria-hidden="true">
              {f.icon}
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", marginBottom: "var(--space-2)" }}>{f.title}</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem", lineHeight: 1.65 }}>{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
