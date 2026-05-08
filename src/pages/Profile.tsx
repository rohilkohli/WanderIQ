import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { analytics } from "@/lib/analytics";
import toast from "react-hot-toast";
import type { TravelStyle, DietaryRestriction, MobilityNeed, GroupType, Interest } from "@/types";

const STYLE_LABELS: Record<TravelStyle, string> = {
  adventure: "🧗 Adventure",
  cultural: "🏛️ Cultural",
  wellness: "🧘 Wellness",
  food: "🍜 Food & Drink",
  beach: "🏖️ Beach",
  wildlife: "🦁 Wildlife",
  city: "🏙️ City Break",
  offbeat: "🗺️ Off-beaten-path",
};

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const { preferences, setPreferences, isDark, toggleDark } = usePreferencesStore();
  const [editing, setEditing] = useState(false);

  const toggle = <T,>(arr: T[], val: T): T[] => (arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleSave = () => {
    setEditing(false);
    analytics.preferenceUpdated("profile");
    toast.success("Preferences saved!");
  };

  const STATS = [
    { label: "Trips planned", value: "2" },
    { label: "Countries", value: "1" },
    { label: "Days planned", value: "14" },
    { label: "AI chats", value: "7" },
  ];

  return (
    <div style={{ padding: "var(--space-8)", maxWidth: 900, margin: "0 auto" }}>
      {/* ── Profile Header ── */}
      <header style={{ display: "flex", alignItems: "center", gap: "var(--space-6)", marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out" }}>
        <img src={user?.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName ?? "Traveller")}&size=100&background=1B4332&color=fff`} alt={`${user?.displayName ?? "Your"} profile photo`} width={100} height={100} style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid var(--color-accent)" }} />
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "var(--space-1)" }}>{user?.displayName ?? "Traveller"}</h1>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>{user?.email ?? "guest@wanderiq.app"}</p>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button onClick={() => setEditing(!editing)} className={`btn btn-sm ${editing ? "btn-highlight" : "btn-secondary"}`}>
              {editing ? "✕ Cancel" : "✏️ Edit preferences"}
            </button>
            {editing && (
              <button onClick={handleSave} className="btn btn-sm btn-primary">
                💾 Save changes
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "var(--space-6)" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-accent)" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
        {/* ── Travel Preferences ── */}
        <section aria-labelledby="travel-prefs-heading" className="card" style={{ padding: "var(--space-6)", animation: "fadeInUp 300ms ease-out 60ms both" }}>
          <h2 id="travel-prefs-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: "var(--space-5)" }}>
            ✈️ Travel Preferences
          </h2>

          {/* Budget */}
          <div style={{ marginBottom: "var(--space-5)" }}>
            <h3 style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--space-3)" }}>Budget Tier</h3>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              {(["economy", "mid-range", "luxury"] as const).map((t) => (
                <button key={t} onClick={() => editing && setPreferences({ budgetTier: t })} className={`tag${preferences.budgetTier === t ? " active" : ""}`} disabled={!editing} aria-pressed={preferences.budgetTier === t} style={{ cursor: editing ? "pointer" : "default" }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Style */}
          <div style={{ marginBottom: "var(--space-5)" }}>
            <h3 style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--space-3)" }}>Travel Style</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {preferences.travelStyle.map((s) => (
                <span key={s} className="badge badge-accent">
                  {STYLE_LABELS[s]}
                </span>
              ))}
              {editing && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", width: "100%", marginTop: "var(--space-2)" }}>
                  {(Object.keys(STYLE_LABELS) as TravelStyle[]).map((s) => (
                    <button key={s} onClick={() => setPreferences({ travelStyle: toggle(preferences.travelStyle, s) as TravelStyle[] })} className={`tag${preferences.travelStyle.includes(s) ? " active" : ""}`} aria-pressed={preferences.travelStyle.includes(s)} style={{ fontSize: "0.75rem" }}>
                      {STYLE_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Group */}
          <div>
            <h3 style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--space-3)" }}>Who I travel with</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {(
                [
                  { value: "solo", label: "🧍 Solo" },
                  { value: "couple", label: "💑 Couple" },
                  { value: "family", label: "👨‍👩‍👧 Family" },
                  { value: "friends", label: "👯 Friends" },
                  { value: "corporate", label: "💼 Corporate" },
                ] as { value: GroupType; label: string }[]
              ).map((g) => (
                <button key={g.value} onClick={() => editing && setPreferences({ group: g.value })} className={`tag${preferences.group === g.value ? " active" : ""}`} disabled={!editing} aria-pressed={preferences.group === g.value} style={{ cursor: editing ? "pointer" : "default" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Personal Needs ── */}
        <section aria-labelledby="personal-needs-heading" className="card" style={{ padding: "var(--space-6)", animation: "fadeInUp 300ms ease-out 120ms both" }}>
          <h2 id="personal-needs-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: "var(--space-5)" }}>
            🎯 Personal Needs
          </h2>

          <div style={{ marginBottom: "var(--space-5)" }}>
            <h3 style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--space-3)" }}>Dietary</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {(["none", "vegetarian", "vegan", "halal", "kosher", "gluten-free"] as DietaryRestriction[]).map((d) => (
                <button key={d} onClick={() => editing && setPreferences({ dietary: toggle(preferences.dietary, d) as DietaryRestriction[] })} className={`tag${preferences.dietary.includes(d) ? " active" : ""}`} disabled={!editing} aria-pressed={preferences.dietary.includes(d)} style={{ cursor: editing ? "pointer" : "default" }}>
                  {d === "none" ? "🍽️ None" : d}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "var(--space-5)" }}>
            <h3 style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--space-3)" }}>Mobility</h3>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {(
                [
                  { value: "full", label: "🏃 Full mobility" },
                  { value: "wheelchair", label: "♿ Wheelchair" },
                  { value: "low-exertion", label: "🚶 Low-exertion" },
                ] as { value: MobilityNeed; label: string }[]
              ).map((m) => (
                <button key={m.value} onClick={() => editing && setPreferences({ mobility: m.value })} className={`tag${preferences.mobility === m.value ? " active" : ""}`} disabled={!editing} aria-pressed={preferences.mobility === m.value} style={{ cursor: editing ? "pointer" : "default" }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--space-3)" }}>Home City</h3>
            {editing ? <input type="text" value={preferences.homeCity ?? ""} onChange={(e) => setPreferences({ homeCity: e.target.value })} className="input" placeholder="e.g. Mumbai" aria-label="Home city for flight searches" /> : <p style={{ fontWeight: 600 }}>{preferences.homeCity ?? "Not set"}</p>}
          </div>
        </section>

        {/* ── App Settings ── */}
        <section aria-labelledby="settings-heading" className="card" style={{ padding: "var(--space-6)", animation: "fadeInUp 300ms ease-out 180ms both" }}>
          <h2 id="settings-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: "var(--space-5)" }}>
            ⚙️ App Settings
          </h2>

          {[
            {
              label: "Dark Mode",
              desc: "Switch to dark theme for low-light use",
              control: (
                <button role="switch" aria-checked={isDark} onClick={toggleDark} style={{ width: 48, height: 28, borderRadius: "var(--radius-full)", background: isDark ? "var(--color-accent)" : "var(--color-border)", border: "none", cursor: "pointer", position: "relative", transition: "background var(--transition-fast)", flexShrink: 0 }} aria-label={`Dark mode is ${isDark ? "on" : "off"}`}>
                  <span style={{ position: "absolute", top: 3, left: isDark ? 23 : 3, width: 22, height: 22, background: "white", borderRadius: "50%", transition: "left var(--transition-fast)", boxShadow: "var(--shadow-sm)" }} />
                </button>
              ),
            },
            {
              label: "Currency",
              desc: "Display budgets in your preferred currency",
              control: (
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  {(["INR", "USD"] as const).map((c) => (
                    <button key={c} onClick={() => setPreferences({ currency: c })} className={`btn btn-sm ${preferences.currency === c ? "btn-primary" : "btn-ghost"}`} aria-pressed={preferences.currency === c}>
                      {c === "INR" ? "₹" : "$"} {c}
                    </button>
                  ))}
                </div>
              ),
            },
          ].map((setting) => (
            <div key={setting.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-4) 0", borderBottom: "1px solid var(--color-border)" }}>
              <div>
                <p style={{ fontWeight: 600 }}>{setting.label}</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{setting.desc}</p>
              </div>
              {setting.control}
            </div>
          ))}
        </section>

        {/* ── Interests ── */}
        <section aria-labelledby="interests-heading" className="card" style={{ padding: "var(--space-6)", animation: "fadeInUp 300ms ease-out 240ms both" }}>
          <h2 id="interests-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: "var(--space-5)" }}>
            💫 Interests
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {(
              [
                { value: "history", label: "📜 History" },
                { value: "architecture", label: "🏰 Architecture" },
                { value: "art", label: "🎨 Art" },
                { value: "nightlife", label: "🎵 Nightlife" },
                { value: "hiking", label: "🥾 Hiking" },
                { value: "photography", label: "📷 Photography" },
                { value: "shopping", label: "🛍️ Shopping" },
                { value: "literature", label: "📚 Literature" },
                { value: "music", label: "🎶 Music" },
                { value: "sports", label: "⚽ Sports" },
              ] as { value: Interest; label: string }[]
            ).map((i) => (
              <button key={i.value} onClick={() => editing && setPreferences({ interests: toggle(preferences.interests, i.value) as Interest[] })} className={`tag${preferences.interests.includes(i.value) ? " active" : ""}`} disabled={!editing} aria-pressed={preferences.interests.includes(i.value)} style={{ cursor: editing ? "pointer" : "default" }}>
                {i.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
