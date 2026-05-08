import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { analytics } from "@/lib/analytics";

const UPCOMING_TRIPS = [
  { id: "1", destination: "Goa, India", dates: "Jun 15 – Jun 22", days: 7, status: "active", emoji: "🏖️", match: 94 },
  { id: "2", destination: "Rajasthan, India", dates: "Aug 10 – Aug 17", days: 7, status: "draft", emoji: "🏰", match: 88 },
];

const PAST_TRIPS = [
  { id: "3", destination: "Ooty, Tamil Nadu", dates: "Mar 5 – Mar 9", days: 4, emoji: "🌿" },
  { id: "4", destination: "Hampi, Karnataka", dates: "Jan 14 – Jan 18", days: 4, emoji: "🗿" },
];

const WISHLIST = [
  { name: "Iceland", emoji: "🌋", tag: "Adventure" },
  { name: "Kyoto", emoji: "⛩️", tag: "Cultural" },
  { name: "Maldives", emoji: "🏝️", tag: "Beach" },
  { name: "Peru", emoji: "🦙", tag: "Adventure" },
];

const BADGES = [
  { id: "first-trip", icon: "✈️", label: "First Trip Planned", desc: "Welcome to WanderIQ!", earned: true },
  { id: "three-trips", icon: "🗺️", label: "3 Trips Planned", desc: "You're a regular planner!", earned: true },
  { id: "budget-master", icon: "💰", label: "Budget Master", desc: "Stayed under budget 3x", earned: false },
  { id: "solo-traveler", icon: "🧍", label: "Solo Explorer", desc: "Planned your first solo trip", earned: false },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { preferences } = usePreferencesStore();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const firstName = user?.displayName?.split(" ")[0] ?? "Traveller";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const handleNewTrip = () => {
    analytics.tripCreated("New Trip", 0);
    navigate("/discover");
  };

  return (
    <div id="main-content" style={{ padding: "var(--space-8)", maxWidth: 1100, margin: "0 auto" }}>
      {/* ── WELCOME HEADER ── */}
      <header style={{ marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out" }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem", marginBottom: "var(--space-1)" }}>
          {greeting}, <strong style={{ color: "var(--color-accent)" }}>{firstName}</strong> 👋
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "var(--space-2)" }}>Your Travel Dashboard</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          {preferences.travelStyle.join(", ")} traveller · {preferences.budgetTier} budget · {preferences.group}
        </p>
      </header>

      {/* ── QUICK ACTIONS ── */}
      <section aria-label="Quick actions" style={{ marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out 60ms both" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
          {[
            { icon: "🔍", label: "Discover", desc: "Find your next destination", action: () => navigate("/discover"), primary: true },
            { icon: "📋", label: "New Trip", desc: "Start building an itinerary", action: handleNewTrip, primary: false },
            { icon: "✨", label: "AI Planner", desc: "Let AI plan your day", action: () => navigate("/planner"), primary: false },
            { icon: "💰", label: "Budget", desc: "Track your travel spend", action: () => navigate("/budget"), primary: false },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "var(--space-2)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)", background: item.primary ? "var(--color-accent)" : "var(--color-surface)", border: `1px solid ${item.primary ? "transparent" : "var(--color-border)"}`, cursor: "pointer", transition: "all var(--transition-fast)", textAlign: "left", fontFamily: "var(--font-body)", minHeight: "44px" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = item.primary ? "var(--shadow-accent)" : "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <span style={{ fontSize: "1.5rem" }} aria-hidden="true">
                {item.icon}
              </span>
              <span style={{ fontWeight: 700, color: item.primary ? "white" : "var(--color-text-primary)", fontSize: "0.9375rem" }}>{item.label}</span>
              <span style={{ fontSize: "0.8125rem", color: item.primary ? "rgba(255,255,255,0.75)" : "var(--color-text-muted)" }}>{item.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "var(--space-8)", alignItems: "start" }}>
        {/* ── LEFT: Trips ── */}
        <div>
          {/* Tabs */}
          <div role="tablist" style={{ display: "flex", gap: "var(--space-1)", marginBottom: "var(--space-6)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-1)" }}>
            {(["upcoming", "past"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} style={{ padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", background: "transparent", color: tab === t ? "var(--color-accent)" : "var(--color-text-muted)", borderBottom: tab === t ? "2px solid var(--color-accent)" : "2px solid transparent", transition: "all var(--transition-fast)" }}>
                {t.charAt(0).toUpperCase() + t.slice(1)} Trips
              </button>
            ))}
          </div>

          {/* Trip cards */}
          <section aria-label={`${tab} trips`}>
            <ul  style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", listStyle: "none" }}>
              {(tab === "upcoming" ? UPCOMING_TRIPS : PAST_TRIPS).map((trip) => (
                <li key={trip.id} >
                  <article className="card" style={{ padding: "var(--space-5)", display: "flex", alignItems: "center", gap: "var(--space-4)", cursor: "pointer" }} onClick={() => navigate(`/planner/${trip.id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/planner/${trip.id}`)} tabIndex={0} aria-label={`${trip.destination} trip, ${trip.dates}`}>
                    <div style={{ width: 64, height: 64, borderRadius: "var(--radius-lg)", background: "var(--color-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0 }} aria-hidden="true">
                      {trip.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600 }}>{trip.destination}</h3>
                        {"status" in trip && <span className={`badge ${"status" in trip && (trip as { status: string }).status === "active" ? "badge-accent" : "badge-muted"}`}>{(trip as { status: string }).status}</span>}
                      </div>
                      <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                        {trip.dates} · {trip.days} days
                      </p>
                    </div>
                    {"match" in trip && (
                      <div className="score-ring" aria-label={`${(trip as { match: number }).match}% match score`}>
                        {(trip as { match: number }).match}
                      </div>
                    )}
                    <span style={{ color: "var(--color-text-muted)", fontSize: "1.25rem" }} aria-hidden="true">
                      ›
                    </span>
                  </article>
                </li>
              ))}
            </ul>

            {tab === "upcoming" && (
              <button
                onClick={() => navigate("/discover")}
                style={{ marginTop: "var(--space-4)", width: "100%", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "2px dashed var(--color-border)", background: "transparent", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "0.9375rem", fontFamily: "var(--font-body)", transition: "all var(--transition-fast)", display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-accent)";
                  e.currentTarget.style.color = "var(--color-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text-muted)";
                }}
              >
                <span aria-hidden="true">+</span>
                Plan a new trip
              </button>
            )}
          </section>
        </div>

        {/* ── RIGHT: Sidebar panels ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Wishlist */}
          <section aria-labelledby="wishlist-heading" className="card" style={{ padding: "var(--space-5)" }}>
            <h2 id="wishlist-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", marginBottom: "var(--space-4)" }}>
              🌟 Wishlist
            </h2>
            <ul  style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", listStyle: "none" }}>
              {WISHLIST.map((w) => (
                <li key={w.name}  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span aria-hidden="true">{w.emoji}</span>
                    <span style={{ fontWeight: 500 }}>{w.name}</span>
                  </div>
                  <span className="badge badge-muted" style={{ fontSize: "0.7rem" }}>
                    {w.tag}
                  </span>
                </li>
              ))}
            </ul>
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: "var(--space-3)", justifyContent: "center" }} onClick={() => navigate("/discover")}>
              Explore more →
            </button>
          </section>

          {/* Achievements */}
          <section aria-labelledby="badges-heading" className="card" style={{ padding: "var(--space-5)" }}>
            <h2 id="badges-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", marginBottom: "var(--space-4)" }}>
              🏆 Achievements
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              {BADGES.map((b) => (
                <div key={b.id} style={{ padding: "var(--space-3)", borderRadius: "var(--radius-md)", border: `1px solid ${b.earned ? "var(--color-accent)" : "var(--color-border)"}`, background: b.earned ? "var(--color-accent-light)" : "var(--color-surface-alt)", opacity: b.earned ? 1 : 0.6, textAlign: "center" }} role="img" aria-label={`${b.label}: ${b.earned ? "earned" : "not yet earned"}. ${b.desc}`}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "var(--space-1)" }}>{b.icon}</div>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: b.earned ? "var(--color-accent)" : "var(--color-text-muted)", lineHeight: 1.3 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
