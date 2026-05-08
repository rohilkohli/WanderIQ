import React, { useState } from "react";
import { generateId } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import toast from "react-hot-toast";
import type { PackingCategory, PackingItem } from "@/types";

const INITIAL_LIST: PackingCategory[] = [
  {
    name: "Clothing",
    icon: "👕",
    items: [
      { id: generateId(), name: "Light breathable t-shirts (5)", category: "Clothing", checked: true, isCustom: false },
      { id: generateId(), name: "Shorts / light trousers (3)", category: "Clothing", checked: false, isCustom: false },
      { id: generateId(), name: "Swimwear", category: "Clothing", checked: false, isCustom: false },
      { id: generateId(), name: "Evening outfit", category: "Clothing", checked: false, isCustom: false },
      { id: generateId(), name: "Comfortable walking shoes", category: "Clothing", checked: true, isCustom: false },
      { id: generateId(), name: "Flip-flops / sandals", category: "Clothing", checked: false, isCustom: false },
    ],
  },
  {
    name: "Toiletries",
    icon: "🧴",
    items: [
      { id: generateId(), name: "Sunscreen SPF 50+", category: "Toiletries", checked: true, isCustom: false },
      { id: generateId(), name: "After-sun lotion", category: "Toiletries", checked: false, isCustom: false },
      { id: generateId(), name: "Insect repellent", category: "Toiletries", checked: false, isCustom: false },
      { id: generateId(), name: "Hand sanitiser", category: "Toiletries", checked: true, isCustom: false },
      { id: generateId(), name: "Toothbrush & paste", category: "Toiletries", checked: false, isCustom: false },
    ],
  },
  {
    name: "Documents & Money",
    icon: "📄",
    items: [
      { id: generateId(), name: "Passport / Aadhaar", category: "Documents", checked: true, isCustom: false },
      { id: generateId(), name: "Flight tickets (print)", category: "Documents", checked: false, isCustom: false },
      { id: generateId(), name: "Hotel bookings", category: "Documents", checked: false, isCustom: false },
      { id: generateId(), name: "Emergency contacts", category: "Documents", checked: false, isCustom: false },
      { id: generateId(), name: "Travel insurance", category: "Documents", checked: false, isCustom: false },
    ],
  },
  {
    name: "Electronics",
    icon: "📱",
    items: [
      { id: generateId(), name: "Phone + charger", category: "Electronics", checked: true, isCustom: false },
      { id: generateId(), name: "Power bank", category: "Electronics", checked: false, isCustom: false },
      { id: generateId(), name: "Camera + memory card", category: "Electronics", checked: false, isCustom: false },
      { id: generateId(), name: "Universal power adapter", category: "Electronics", checked: false, isCustom: false },
      { id: generateId(), name: "Earphones", category: "Electronics", checked: true, isCustom: false },
    ],
  },
  {
    name: "Health & Safety",
    icon: "💊",
    items: [
      { id: generateId(), name: "Basic first-aid kit", category: "Health", checked: false, isCustom: false },
      { id: generateId(), name: "ORS sachets", category: "Health", checked: false, isCustom: false },
      { id: generateId(), name: "Antacids", category: "Health", checked: false, isCustom: false },
      { id: generateId(), name: "Prescription medicines", category: "Health", checked: true, isCustom: false },
    ],
  },
];

const Packing: React.FC = () => {
  const [categories, setCategories] = useState<PackingCategory[]>(INITIAL_LIST);
  const [newItemText, setNewItemText] = useState("");
  const [newItemCat, setNewItemCat] = useState(INITIAL_LIST[0].name);
  const [loading, setLoading] = useState(false);

  const totalItems = categories.flatMap((c) => c.items).length;
  const checkedItems = categories.flatMap((c) => c.items).filter((i) => i.checked).length;
  const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const toggleItem = (catName: string, itemId: string) => {
    setCategories((prev) => prev.map((c) => (c.name === catName ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) } : c)));
  };

  const addCustomItem = () => {
    if (!newItemText.trim()) return;
    const newItem: PackingItem = {
      id: generateId(),
      name: newItemText.trim(),
      category: newItemCat,
      checked: false,
      isCustom: true,
    };
    setCategories((prev) => prev.map((c) => (c.name === newItemCat ? { ...c, items: [...c.items, newItem] } : c)));
    setNewItemText("");
    toast.success("Item added!");
  };

  const handleAIGenerate = async () => {
    setLoading(true);
    analytics.packingListGenerated();
    try {
      const res = await fetch("/api/packing-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: "Goa", days: 7, tripType: "Beach & Cultural" }),
      });
      if (!res.ok) throw new Error("Failed to generate packing list");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
        toast.success("Packing list updated by Gemini AI!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate AI packing list.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "var(--space-8)", maxWidth: 900, margin: "0 auto" }}>
      {/* ── Header ── */}
      <header style={{ marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "var(--space-2)" }}>🎒 Packing Checklist</h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>AI-generated for your Goa trip · 7 days · Beach & Cultural</p>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div className="progress-bar" style={{ flex: 1, height: 10 }}>
            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct === 100 ? "var(--color-success)" : "var(--color-accent)" }} role="progressbar" aria-valuenow={checkedItems} aria-valuemin={0} aria-valuemax={totalItems} aria-label={`${checkedItems} of ${totalItems} items packed`} />
          </div>
          <span style={{ fontWeight: 700, color: "var(--color-accent)", whiteSpace: "nowrap" }}>
            {checkedItems}/{totalItems} packed
          </span>
          {pct === 100 && <span style={{ color: "var(--color-success)" }}>✅ All packed!</span>}
        </div>
      </header>

      {/* ── AI Regen ── */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)", animation: "fadeInUp 300ms ease-out 60ms both" }}>
        <button onClick={handleAIGenerate} disabled={loading} className="btn btn-primary" aria-busy={loading}>
          {loading ? <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> : "✨"}
          Regenerate with Gemini AI
        </button>
        <button onClick={() => setCategories((prev) => prev.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i, checked: false })) })))} className="btn btn-ghost">
          Reset all
        </button>
      </div>

      {/* ── Categories ── */}
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
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.icon} {c.name}
                </option>
              ))}
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
