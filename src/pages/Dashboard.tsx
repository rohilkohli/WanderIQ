import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { useItineraryStore } from "@/store/useItineraryStore";
import { analytics } from "@/lib/analytics";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import type { Itinerary } from "@/types";

const WISHLIST: { name: string; emoji: string; tag: string }[] = [];

const BADGES: { id: string; icon: string; label: string; desc: string; earned: boolean }[] = [];

const DEST_EMOJI: Record<string, string> = {
  goa: "🏖️", rajasthan: "🏰", coorg: "🌿", andaman: "🏝️", varanasi: "🕌",
  kerala: "🌴", himachal: "🏔️", mumbai: "🏙️", default: "🗺️",
};

function destEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(DEST_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return DEST_EMOJI.default;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { preferences } = usePreferencesStore();
  const { setActiveItinerary } = useItineraryStore();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);

  const firstName = user?.displayName?.split(" ")[0] ?? "Traveller";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  /** Load real itineraries from Firestore for the signed-in user. */
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "itineraries"),
      where("ownerUid", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
    getDocs(q)
      .then((snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Itinerary));
        setItineraries(docs);
      })
      .catch(() => setItineraries([]));
  }, [user?.uid]);

  const visibleItineraries = user?.uid ? itineraries : [];

  const now = new Date().toISOString().split("T")[0];
  const upcoming = visibleItineraries.filter((t) => (t.dateRange?.end ?? "9999") >= now && t.status !== "completed");
  const past = visibleItineraries.filter((t) => (t.dateRange?.end ?? "9999") < now || t.status === "completed");

  const handleNewTrip = () => {
    analytics.tripCreated("New Trip", 0);
    navigate("/discover");
  };

  const openTrip = (trip: Itinerary) => {
    setActiveItinerary(trip);
    navigate("/planner");
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
            {(tab === "upcoming" ? upcoming : past).length === 0 && (
              <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }}>✈️</div>
                <p style={{ fontWeight: 600 }}>No {tab} trips yet</p>
                <p style={{ fontSize: "0.875rem", marginTop: "var(--space-2)" }}>
                  {tab === "upcoming" ? "Start by discovering your next destination!" : "Your completed trips will appear here."}
                </p>
                {tab === "upcoming" && (
                  <button className="btn btn-primary" style={{ marginTop: "var(--space-4)" }} onClick={() => navigate("/discover")}>
                    Discover Destinations →
                  </button>
                )}
              </div>
            )}
            <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", listStyle: "none" }}>
              {(tab === "upcoming" ? upcoming : past).map((trip) => {
                const destName = typeof trip.destination === "object" ? trip.destination.name : String(trip.destination);
                const emoji = destEmoji(destName);
                const dates = trip.dateRange ? `${trip.dateRange.start} – ${trip.dateRange.end}` : "Dates TBD";
                return (
                  <li key={trip.id}>
                    <article className="card" style={{ padding: "var(--space-5)", display: "flex", alignItems: "center", gap: "var(--space-4)", cursor: "pointer" }} onClick={() => openTrip(trip)} onKeyDown={(e) => e.key === "Enter" && openTrip(trip)} tabIndex={0} aria-label={`${destName} trip, ${dates}`}>
                      <div style={{ width: 64, height: 64, borderRadius: "var(--radius-lg)", background: "var(--color-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0 }} aria-hidden="true">
                        {emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600 }}>{destName}</h3>
                          <span className={`badge ${trip.status === "active" ? "badge-accent" : "badge-muted"}`}>{trip.status}</span>
                        </div>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                          {dates} · {trip.days.length} day{trip.days.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "1.25rem" }} aria-hidden="true">›</span>
                    </article>
                  </li>
                );
              })}
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
            {WISHLIST.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "var(--space-4) 0" }}>Your wishlist is empty.</p>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", listStyle: "none" }}>
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
            )}
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: "var(--space-3)", justifyContent: "center" }} onClick={() => navigate("/discover")}>
              Explore more →
            </button>
          </section>

          {/* Achievements */}
          <section aria-labelledby="badges-heading" className="card" style={{ padding: "var(--space-5)" }}>
            <h2 id="badges-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", marginBottom: "var(--space-4)" }}>
              🏆 Achievements
            </h2>
            {BADGES.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "var(--space-4) 0" }}>No badges earned yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                {BADGES.map((b) => (
                  <div key={b.id} style={{ padding: "var(--space-3)", borderRadius: "var(--radius-md)", border: `1px solid ${b.earned ? "var(--color-accent)" : "var(--color-border)"}`, background: b.earned ? "var(--color-accent-light)" : "var(--color-surface-alt)", opacity: b.earned ? 1 : 0.6, textAlign: "center" }} role="img" aria-label={`${b.label}: ${b.earned ? "earned" : "not yet earned"}. ${b.desc}`}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "var(--space-1)" }}>{b.icon}</div>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: b.earned ? "var(--color-accent)" : "var(--color-text-muted)", lineHeight: 1.3 }}>{b.label}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
