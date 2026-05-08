import React from "react";
import { DESTINATIONS } from "./LandingConstants";

export interface LandingHeroProps {
  /** Current value of the mood/destination search query. */
  moodQuery: string;
  /** Setter for the mood search query. */
  setMoodQuery: (query: string) => void;
  /** Handler for form submission of the mood search. */
  handleMoodSearch: (e: React.FormEvent) => void;
  /** Handler for the primary call-to-action button. */
  handleCTA: () => void;
}
export const LandingHero: React.FC<LandingHeroProps> = ({ moodQuery, setMoodQuery, handleMoodSearch, handleCTA }) => {
  return (
    <section aria-labelledby="hero-heading" style={{ minHeight: "92vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-16) var(--space-8)", position: "relative", overflow: "hidden" }}>
      {/* Background decoration */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: ` radial-gradient(ellipse 60% 50% at 20% 40%, rgba(27,67,50,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 60%, rgba(231,111,81,0.05) 0%, transparent 70%) ` }} />

      {/* Floating destination chips */}
      <div aria-hidden="true" style={{ position: "absolute", top: "12%", left: "5%", display: "flex", flexDirection: "column", gap: "var(--space-3)", opacity: 0.7 }}>
        {DESTINATIONS.slice(0, 3).map((d, i) => (
          <div key={d.name} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-full)", padding: "var(--space-2) var(--space-4)", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "var(--space-2)", boxShadow: "var(--shadow-sm)", animation: `fadeInUp 600ms ease-out ${i * 150}ms both`, transform: `translateX(${i % 2 === 0 ? -8 : 8}px)` }}>
            <span>{d.emoji}</span>
            {d.name}
            <span className="badge badge-accent" style={{ fontSize: "0.7rem" }}>
              {d.tag}
            </span>
          </div>
        ))}
      </div>

      <div aria-hidden="true" style={{ position: "absolute", top: "15%", right: "5%", display: "flex", flexDirection: "column", gap: "var(--space-3)", opacity: 0.7 }}>
        {DESTINATIONS.slice(3).map((d, i) => (
          <div key={d.name} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-full)", padding: "var(--space-2) var(--space-4)", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "var(--space-2)", boxShadow: "var(--shadow-sm)", animation: `fadeInUp 600ms ease-out ${(i + 3) * 150}ms both` }}>
            <span>{d.emoji}</span>
            {d.name}
            <span className="badge badge-highlight" style={{ fontSize: "0.7rem" }}>
              {d.tag}
            </span>
          </div>
        ))}
      </div>

      {/* Hero content */}
      <div style={{ textAlign: "center", maxWidth: 720, position: "relative", zIndex: 1 }}>
        {/* Pill badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", background: "var(--color-accent-light)", borderRadius: "var(--radius-full)", padding: "var(--space-2) var(--space-4)", marginBottom: "var(--space-6)", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-accent)", animation: "fadeInUp 400ms ease-out both" }}>
          <span aria-hidden="true">✨</span>
          AI-powered · Google Maps · Firebase
        </div>

        <h1 id="hero-heading" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 6vw, 4.5rem)", fontWeight: 700, lineHeight: 1.1, marginBottom: "var(--space-6)", letterSpacing: "-0.02em", animation: "fadeInUp 500ms ease-out 100ms both" }}>
          Plan trips that <span style={{ fontStyle: "italic", background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-highlight) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>actually know you</span>
        </h1>

        <p style={{ fontSize: "clamp(1.0625rem, 2vw, 1.25rem)", color: "var(--color-text-muted)", lineHeight: 1.7, marginBottom: "var(--space-8)", animation: "fadeInUp 500ms ease-out 200ms both" }}>WanderIQ builds AI-powered multi-day itineraries tuned to your budget, diet, mobility, and travel style — with live weather, traffic routing, and collaborative planning baked in.</p>

        {/* Mood search CTA */}
        <form onSubmit={handleMoodSearch} style={{ animation: "fadeInUp 500ms ease-out 300ms both" }} aria-label="Trip mood search">
          <div style={{ display: "flex", gap: "var(--space-2)", background: "var(--color-surface)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "var(--space-2)", boxShadow: "var(--shadow-lg)", maxWidth: 600, margin: "0 auto" }}>
            <label htmlFor="hero-mood-input" className="sr-only">
              Describe your dream trip
            </label>
            <input id="hero-mood-input" type="text" value={moodQuery} onChange={(e) => setMoodQuery(e.target.value)} placeholder='Try "5 days in South India under ₹40,000"...' style={{ flex: 1, border: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--color-text-primary)", padding: "var(--space-3) var(--space-4)", outline: "none", minWidth: 0 }} />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-5)" }}>
              <span aria-hidden="true">🔍</span>
              Discover
            </button>
          </div>
        </form>

        {/* Secondary CTA */}
        <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", marginTop: "var(--space-6)", animation: "fadeInUp 500ms ease-out 400ms both" }}>
          <button className="btn btn-secondary btn-lg" onClick={handleCTA}>
            Start planning free →
          </button>
          <a href="#features" className="btn btn-ghost btn-lg" style={{ color: "var(--color-text-muted)" }}>
            See how it works
          </a>
        </div>

        {/* Social proof */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-4)", marginTop: "var(--space-8)", animation: "fadeInUp 500ms ease-out 500ms both" }}>
          <div style={{ display: "flex" }}>
            {["🧳", "📸", "🗺️", "✈️", "🏖️"].map((emoji, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-surface-alt)", border: "2px solid var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: i === 0 ? 0 : -10, fontSize: "0.875rem" }}>
                {emoji}
              </div>
            ))}
          </div>
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Join <strong style={{ color: "var(--color-text-primary)" }}>10,000+</strong> travellers planning smarter
          </span>
        </div>
      </div>
    </section>
  );
};
