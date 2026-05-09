import React, { useState } from "react";
import { useDiscoverLogic } from "@/hooks/useDiscoverLogic";
import { submitAiFeedback } from "@/lib/aiMemory";
import { getAiStatusLabel } from "@/lib/aiStatus";
import { useAuthStore } from "@/store/useAuthStore";

const PRICE_LABELS: Record<number, string> = { 1: '₹', 2: '₹₹', 3: '₹₹₹', 4: '₹₹₹₹' };
const CONDITION_BG: Record<string, string> = {
  sunny: 'linear-gradient(135deg, #FFB300, #FF6F00)',
  cloudy: 'linear-gradient(135deg, #78909C, #546E7A)',
  rainy:  'linear-gradient(135deg, #1565C0, #0D47A1)',
  clear:  'linear-gradient(135deg, #0288D1, #0097A7)',
};

const Discover: React.FC = () => {
  const { moodQuery, setMoodQuery, destinations, loading, view, setView, compareIds, toggleCompare, compareDestinations, aiStatus, aiMeta, searchError, handleMoodSearch, handleSelectDestination } = useDiscoverLogic();
  const user = useAuthStore((s) => s.user);
  const statusLabel = getAiStatusLabel(aiStatus);
  const [feedbackById, setFeedbackById] = useState<Record<string, "up" | "down">>({});

  const handleFeedback = async (destinationId: string, rating: "up" | "down") => {
    if (feedbackById[destinationId]) return;
    setFeedbackById((prev) => ({ ...prev, [destinationId]: rating }));
    await submitAiFeedback({
      feature: "discover",
      responseId: destinationId,
      rating,
      provider: aiMeta?.provider,
      model: aiMeta?.model,
      userId: user?.uid ?? "guest",
    });
  };

  return (
    <div style={{ padding: "var(--space-8)", maxWidth: 1200, margin: "0 auto" }}>
      {/* ── HEADER ── */}
      <header style={{ marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "var(--space-2)" }}>Discover Your Next Adventure</h1>
        <p style={{ color: "var(--color-text-muted)" }}>Describe your dream trip and our AI finds destinations that match your personality, budget, and style.</p>
      </header>

      {/* ── MOOD SEARCH ── */}
      <section aria-labelledby="mood-search-heading" style={{ marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out 60ms both" }}>
        <h2 id="mood-search-heading" className="sr-only">
          AI Mood Search
        </h2>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "var(--space-6)", boxShadow: "var(--shadow-md)" }}>
          <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-4)", alignItems: "center" }}>
            <div style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-highlight))", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)", fontSize: "0.8125rem", fontWeight: 700, color: "white", display: "flex", gap: "var(--space-1)", alignItems: "center" }}>✨ AI Discover</div>
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Describe your dream trip in plain language</span>
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <label htmlFor="mood-input" className="sr-only">
              Describe your dream trip
            </label>
            <input id="mood-input" type="text" value={moodQuery} onChange={(e) => setMoodQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleMoodSearch()} placeholder='e.g. "5-day cultural trip in South India under ₹40,000, vegetarian food, no beaches"' className="input" style={{ flex: 1, fontSize: "1rem" }} />
            <button onClick={handleMoodSearch} disabled={loading || !moodQuery.trim()} className="btn btn-primary" style={{ whiteSpace: "nowrap" }} aria-busy={loading}>
              {loading ? <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} aria-label="Searching..." /> : "🔍 Find Destinations"}
            </button>
          </div>

          {/* Quick prompts */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", alignSelf: "center" }}>Try:</span>
            {["Beach holiday under ₹50,000 for 5 days", "Solo cultural trip to Rajasthan 7 days", "Family wildlife safari affordable", "Wellness retreat in hills for a couple"].map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setMoodQuery(prompt);
                }}
                className="tag"
                style={{ fontSize: "0.75rem" }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESULTS ── */}
      {destinations.length > 0 && (
        <section aria-labelledby="results-heading" style={{ animation: "fadeInUp 300ms ease-out" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
            <h2 id="results-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>
              {destinations.length} destinations found
            </h2>
            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                {statusLabel}
              </span>
              {(["grid", "compare"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`btn btn-sm ${view === v ? "btn-primary" : "btn-ghost"}`} aria-pressed={view === v}>
                  {v === "grid" ? "⊞ Grid" : "⇔ Compare"}
                </button>
              ))}
            </div>
          </div>

          {view === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-6)" }} className="stagger" role="list" aria-label="Discovered destinations">
              {destinations.map((dest) => (
                <article key={dest.id} className="card" role="listitem" style={{ overflow: "hidden", cursor: "pointer" }} onClick={() => handleSelectDestination(dest)} onKeyDown={(e) => e.key === "Enter" && handleSelectDestination(dest)} tabIndex={0} aria-label={`${dest.name}, ${dest.country}. Match score: ${dest.matchScore}%`}>
                  {/* Hero image */}
                  <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                    <img src={dest.heroImageUrl} alt={`${dest.name}, ${dest.country}`} width={400} height={200} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform var(--transition-slow)" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "")} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://loremflickr.com/800/600/${encodeURIComponent(dest.name.split(' ')[0].replace(/[^a-zA-Z]/g, ''))},city,travel/all`; }} />
                    {/* Match score overlay */}
                    <div style={{ position: "absolute", top: "var(--space-3)", right: "var(--space-3)", background: "rgba(0,0,0,0.7)", borderRadius: "var(--radius-full)", padding: "var(--space-1) var(--space-3)", color: "white", fontSize: "0.8125rem", fontWeight: 700 }}>{dest.matchScore}% match</div>
                    {/* Climate badge */}
                    {dest.climate && (
                      <div style={{ position: "absolute", bottom: "var(--space-3)", left: "var(--space-3)", background: CONDITION_BG[dest.climate.condition] ?? CONDITION_BG.clear, borderRadius: "var(--radius-full)", padding: "var(--space-1) var(--space-3)", color: "white", fontSize: "0.75rem", fontWeight: 600 }}>
                        🌡️ {dest.climate.tempMin}–{dest.climate.tempMax}°C · {dest.climate.description}
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: "var(--space-5)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                      <div>
                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600 }}>{dest.name}</h3>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{dest.country}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", flexShrink: 0 }}>
                        {dest.rating && <span style={{ color: "#E9C46A", fontWeight: 700, fontSize: "0.875rem" }}>★ {dest.rating}</span>}
                        {dest.priceLevel && <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{PRICE_LABELS[dest.priceLevel]}</span>}
                      </div>
                    </div>

                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "var(--space-4)" }}>{dest.description.slice(0, 120)}…</p>

                    {/* Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                      {dest.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="badge badge-accent" style={{ fontSize: "0.6875rem" }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Match reasons */}
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-1)", marginBottom: "var(--space-4)" }}>
                      {dest.matchReasons.slice(0, 2).map((r) => (
                        <li key={r} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                          <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>✓</span> {r}
                        </li>
                      ))}
                    </ul>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Was this helpful?</span>
                      <div style={{ display: "flex", gap: "var(--space-1)" }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ minHeight: 24, padding: "2px 8px" }}
                          disabled={Boolean(feedbackById[dest.id])}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFeedback(dest.id, "up");
                          }}
                          aria-label={`Rate ${dest.name} as helpful`}
                        >
                          👍
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ minHeight: 24, padding: "2px 8px" }}
                          disabled={Boolean(feedbackById[dest.id])}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFeedback(dest.id, "down");
                          }}
                          aria-label={`Rate ${dest.name} as not helpful`}
                        >
                          👎
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDestination(dest);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                      >
                        Plan this trip →
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(dest.id);
                        }}
                        className={`btn btn-sm ${compareIds.includes(dest.id) ? "btn-highlight" : "btn-secondary"}`}
                        aria-pressed={compareIds.includes(dest.id)}
                        aria-label={`${compareIds.includes(dest.id) ? "Remove from" : "Add to"} comparison`}
                      >
                        {compareIds.includes(dest.id) ? "✓ Comparing" : "Compare"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {view === "compare" && compareDestinations.length === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }} aria-label="Destination comparison">
              {compareDestinations.map((dest) => (
                <article key={dest.id} className="card" style={{ overflow: "hidden" }}>
                  <img src={dest.heroImageUrl} alt={dest.name} width={600} height={240} loading="lazy" style={{ width: "100%", height: 240, objectFit: "cover" }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://loremflickr.com/800/600/${encodeURIComponent(dest.name.split(' ')[0].replace(/[^a-zA-Z]/g, ''))},city,travel/all`; }} />
                  <div style={{ padding: "var(--space-5)" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "var(--space-2)" }}>{dest.name}</h3>
                    {[
                      ["Match score", `${dest.matchScore}%`],
                      ["Rating", `★ ${dest.rating}`],
                      ["Price level", PRICE_LABELS[dest.priceLevel ?? 2]],
                      ["Climate", dest.climate ? `${dest.climate.tempMin}–${dest.climate.tempMax}°C` : "N/A"],
                      ["Rain chance", dest.climate ? `${dest.climate.rainProbability}%` : "N/A"],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{label}</span>
                        <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{value}</span>
                      </div>
                    ))}
                    <button className="btn btn-primary" style={{ width: "100%", marginTop: "var(--space-4)" }} onClick={() => handleSelectDestination(dest)}>
                      Choose {dest.name} →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {view === "compare" && compareDestinations.length < 2 && (
            <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-text-muted)" }}>
              <p style={{ fontSize: "1.25rem" }}>Select 2 destinations to compare side-by-side</p>
              <p style={{ fontSize: "0.875rem", marginTop: "var(--space-2)" }}>Click "Compare" on any destination card in Grid view</p>
            </div>
          )}
        </section>
      )}

      {/* Error state */}
      {searchError && destinations.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "var(--space-12) 0", animation: "fadeIn 300ms ease-out" }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>⚠️</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: "var(--space-2)" }}>Search didn't return results</h2>
          <p style={{ color: "var(--color-text-muted)", maxWidth: 400, margin: "0 auto", marginBottom: "var(--space-4)" }}>{searchError}</p>
          <button className="btn btn-primary" onClick={handleMoodSearch}>🔄 Try again</button>
        </div>
      )}

      {/* Empty state */}
      {destinations.length === 0 && !loading && !searchError && (
        <div style={{ textAlign: "center", padding: "var(--space-16) 0", animation: "fadeIn 300ms ease-out" }}>
          <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)" }}>🌍</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "var(--space-2)" }}>Start with a mood</h2>
          <p style={{ color: "var(--color-text-muted)", maxWidth: 400, margin: "0 auto" }}>Describe your dream trip above and Gemini AI will surface personalized destinations matched to your preferences.</p>
        </div>
      )}
    </div>
  );
};

export default Discover;
