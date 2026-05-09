import React, { useState, useEffect } from "react";
import { generateId } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import toast from "react-hot-toast";
import type { AiMeta, PackingCategory, PackingItem } from "@/types";
import { buildAiUserContext, rememberAiAction, submitAiFeedback } from "@/lib/aiMemory";
import { getAiStatusLabel } from "@/lib/aiStatus";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useItineraryStore } from "@/store/useItineraryStore";
import { isRateLimitError } from "@/lib/rateLimitCheck";

/** Static packing list used ONLY when API quota/rate limit is exhausted. */
const RATE_LIMIT_FALLBACK_LIST: PackingCategory[] = [
  { name: "Clothing", icon: "👕", items: [
    { id: generateId(), name: "Light breathable t-shirts (5)", category: "Clothing", checked: false, isCustom: false },
    { id: generateId(), name: "Shorts / light trousers (3)", category: "Clothing", checked: false, isCustom: false },
    { id: generateId(), name: "Comfortable walking shoes", category: "Clothing", checked: false, isCustom: false },
    { id: generateId(), name: "Evening outfit", category: "Clothing", checked: false, isCustom: false },
  ]},
  { name: "Toiletries", icon: "🧴", items: [
    { id: generateId(), name: "Sunscreen SPF 50+", category: "Toiletries", checked: false, isCustom: false },
    { id: generateId(), name: "Insect repellent", category: "Toiletries", checked: false, isCustom: false },
    { id: generateId(), name: "Toothbrush & paste", category: "Toiletries", checked: false, isCustom: false },
  ]},
  { name: "Documents & Money", icon: "📄", items: [
    { id: generateId(), name: "Passport / ID", category: "Documents", checked: false, isCustom: false },
    { id: generateId(), name: "Travel insurance", category: "Documents", checked: false, isCustom: false },
    { id: generateId(), name: "Emergency contacts", category: "Documents", checked: false, isCustom: false },
  ]},
  { name: "Electronics", icon: "📱", items: [
    { id: generateId(), name: "Phone + charger", category: "Electronics", checked: false, isCustom: false },
    { id: generateId(), name: "Power bank", category: "Electronics", checked: false, isCustom: false },
  ]},
  { name: "Health & Safety", icon: "💊", items: [
    { id: generateId(), name: "Basic first-aid kit", category: "Health", checked: false, isCustom: false },
    { id: generateId(), name: "Prescription medicines", category: "Health", checked: false, isCustom: false },
  ]},
];

const Packing: React.FC = () => {
  const preferences = usePreferencesStore((s) => s.preferences);
  const user = useAuthStore((s) => s.user);
  const { activeItinerary } = useItineraryStore();

  const currentDestination = activeItinerary?.destination?.name ?? "your destination";
  const currentDays = activeItinerary?.days?.length || 5;
  const currentTripType = preferences.travelStyle?.length > 0 ? preferences.travelStyle.join(", ") : "General";
  const currentWeather = activeItinerary?.destination?.climate?.description ?? "Unknown";

  const [categories, setCategories] = useState<PackingCategory[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [newItemCat, setNewItemCat] = useState("Essentials");
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>("idle");
  const [aiMeta, setAiMeta] = useState<AiMeta | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<"up" | "down" | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const statusLabel = getAiStatusLabel(aiStatus);

  const totalItems = categories.flatMap((c) => c.items).length;
  const checkedItems = categories.flatMap((c) => c.items).filter((i) => i.checked).length;
  const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const toggleItem = (catName: string, itemId: string) => {
    setCategories((prev) => prev.map((c) => (c.name === catName ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) } : c)));
  };

  const addCustomItem = () => {
    if (!newItemText.trim()) return;
    const targetCat = categories.length > 0 ? newItemCat : "Essentials";
    const newItem: PackingItem = {
      id: generateId(),
      name: newItemText.trim(),
      category: targetCat,
      checked: false,
      isCustom: true,
    };
    setCategories((prev) => {
      const exists = prev.find((c) => c.name === targetCat);
      if (exists) {
        return prev.map((c) => (c.name === targetCat ? { ...c, items: [...c.items, newItem] } : c));
      }
      return [...prev, { name: targetCat, icon: "📦", items: [newItem] }];
    });
    setNewItemText("");
    toast.success("Item added!");
  };

  const handleAIGenerate = async () => {
    setLoading(true);
    analytics.packingListGenerated();
    try {
      const res = await fetch("/api/packing-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ai-user-id": user?.uid ?? "guest" },
        body: JSON.stringify({
          destination: currentDestination,
          days: currentDays,
          tripType: currentTripType,
          weather: currentWeather,
          preferences,
          userContext: buildAiUserContext(preferences),
        }),
      });
      if (!res.ok) {
        const packErr = new Error(`Failed to generate packing list: ${res.status}`);
        (packErr as any)._httpStatus = res.status;
        throw packErr;
      }
      const data = await res.json() as { categories?: PackingCategory[]; meta?: AiMeta };
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
        setAiStatus(data.meta?.status ?? "validated");
        setAiMeta(data.meta ?? null);
        setFeedbackRating(null);
        setHasGenerated(true);
        rememberAiAction(`packing:${currentDestination}:${currentDays}d`);
        toast.success("Packing list generated by Gemini AI!");
      }
    } catch (err) {
      console.error(err);
      const httpStatus = (err as any)?._httpStatus;
      // ONLY use static fallback when API quota is exhausted
      if (isRateLimitError(err, httpStatus)) {
        setCategories(RATE_LIMIT_FALLBACK_LIST);
        setHasGenerated(true);
        toast.error("API limit reached — showing a generic packing list.");
      } else {
        toast.error("Failed to generate AI packing list. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate packing list on first visit if we have a destination
  useEffect(() => {
    if (activeItinerary?.destination && !hasGenerated && categories.length === 0 && !loading) {
      handleAIGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItinerary?.destination]);

  const handleFeedback = async (rating: "up" | "down") => {
    if (feedbackRating) return;
    setFeedbackRating(rating);
    await submitAiFeedback({
      feature: "packing",
      responseId: `packing:${currentDestination}:${currentDays}d`,
      rating,
      provider: aiMeta?.provider,
      model: aiMeta?.model,
      userId: user?.uid ?? "guest",
    });
  };

  return (
    <div style={{ padding: "var(--space-8)", maxWidth: 900, margin: "0 auto" }}>
      {/* ── Header ── */}
      <header style={{ marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "var(--space-2)" }}>🎒 Packing Checklist</h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
          {activeItinerary?.destination
            ? `AI-generated for your ${currentDestination} trip · ${currentDays} days · ${currentTripType}`
            : "Select a destination to generate a personalized packing list"}
        </p>

        {/* Progress */}
        {totalItems > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <div className="progress-bar" style={{ flex: 1, height: 10 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct === 100 ? "var(--color-success)" : "var(--color-accent)" }} role="progressbar" aria-valuenow={checkedItems} aria-valuemin={0} aria-valuemax={totalItems} aria-label={`${checkedItems} of ${totalItems} items packed`} />
            </div>
            <span style={{ fontWeight: 700, color: "var(--color-accent)", whiteSpace: "nowrap" }}>
              {checkedItems}/{totalItems} packed
            </span>
            {pct === 100 && <span style={{ color: "var(--color-success)" }}>✅ All packed!</span>}
          </div>
        )}
      </header>

      {/* ── AI Regen ── */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)", animation: "fadeInUp 300ms ease-out 60ms both", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {statusLabel}
        </span>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <button onClick={handleAIGenerate} disabled={loading} className="btn btn-primary" aria-busy={loading}>
            {loading ? <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> : "✨"}
            {categories.length > 0 ? " Regenerate with Gemini AI" : " Generate Packing List"}
          </button>
          {categories.length > 0 && (
            <button onClick={() => setCategories((prev) => prev.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i, checked: false })) })))} className="btn btn-ghost">
              Reset all
            </button>
          )}
        </div>
      </div>

      {aiStatus !== "idle" && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Was this list helpful?</span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ minHeight: 24, padding: "2px 8px" }}
            disabled={Boolean(feedbackRating)}
            onClick={() => handleFeedback("up")}
            aria-label="Rate packing list as helpful"
          >
            👍
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ minHeight: 24, padding: "2px 8px" }}
            disabled={Boolean(feedbackRating)}
            onClick={() => handleFeedback("down")}
            aria-label="Rate packing list as not helpful"
          >
            👎
          </button>
        </div>
      )}

      {/* ── Empty State ── */}
      {categories.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "var(--space-16) 0", animation: "fadeIn 300ms ease-out" }}>
          <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)" }}>🎒</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "var(--space-2)" }}>
            {activeItinerary?.destination ? "Generating your packing list..." : "No destination selected"}
          </h2>
          <p style={{ color: "var(--color-text-muted)", maxWidth: 400, margin: "0 auto" }}>
            {activeItinerary?.destination
              ? "Click the button above to generate a personalized packing list based on your trip details."
              : "Head to Discover to choose a destination first — your packing list will be generated automatically."}
          </p>
        </div>
      )}

      {/* ── Loading State ── */}
      {categories.length === 0 && loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", padding: "var(--space-12)", animation: "fadeIn 300ms ease-out" }}>
          <div style={{ width: 24, height: 24, border: "3px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "var(--color-text-muted)" }}>Generating packing list for {currentDestination}...</p>
        </div>
      )}

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", animation: "fadeInUp 300ms ease-out 120ms both" }}>
          {categories.map((cat) => {
            const catChecked = cat.items.filter((i) => i.checked).length;
            return (
              <section key={cat.name} aria-labelledby={`cat-${cat.name}`} className="card" style={{ padding: "var(--space-5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                  <h2 id={`cat-${cat.name}`} style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span aria-hidden="true">{cat.icon}</span>
                    {cat.name}
                  </h2>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    {catChecked}/{cat.items.length}
                  </span>
                </div>

                <ul role="list" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", listStyle: "none" }}>
                  {cat.items.map((item) => (
                    <li key={item.id} role="listitem">
                      <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: item.checked ? "var(--color-accent-light)" : "transparent", transition: "background var(--transition-fast)", minHeight: 44 }}>
                        <input type="checkbox" checked={item.checked} onChange={() => toggleItem(cat.name, item.id)} style={{ width: 18, height: 18, accentColor: "var(--color-accent)", cursor: "pointer" }} aria-label={`Mark "${item.name}" as ${item.checked ? "unpacked" : "packed"}`} />
                        <span style={{ flex: 1, fontSize: "0.9375rem", textDecoration: item.checked ? "line-through" : "none", color: item.checked ? "var(--color-text-muted)" : "var(--color-text-primary)", transition: "all var(--transition-fast)" }}>{item.name}</span>
                        {item.isCustom && (
                          <span className="badge badge-highlight" style={{ fontSize: "0.6875rem" }}>
                            Custom
                          </span>
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* ── Add Custom Item ── */}
      <section aria-labelledby="add-item-heading" className="card" style={{ padding: "var(--space-5)", marginTop: "var(--space-6)", animation: "fadeInUp 300ms ease-out 240ms both" }}>
        <h2 id="add-item-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", marginBottom: "var(--space-4)" }}>
          ➕ Add Custom Item
        </h2>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label htmlFor="new-item-input" className="sr-only">
              New item name
            </label>
            <input id="new-item-input" type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomItem()} placeholder="e.g. Travel pillow, Voltage converter…" className="input" />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label htmlFor="item-category" className="sr-only">
              Item category
            </label>
            <select id="item-category" value={newItemCat} onChange={(e) => setNewItemCat(e.target.value)} className="input" style={{ cursor: "pointer" }}>
              {categories.length > 0 ? (
                categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))
              ) : (
                <option value="Essentials">📦 Essentials</option>
              )}
            </select>
          </div>
          <button onClick={addCustomItem} className="btn btn-primary" disabled={!newItemText.trim()}>
            Add item
          </button>
        </div>
      </section>
    </div>
  );
};

export default Packing;
