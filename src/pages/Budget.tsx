import React, { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { getBudgetHealth } from "@/lib/budget";
import { getAiStatusLabel } from "@/lib/aiStatus";
import toast from "react-hot-toast";
import type { AiMeta, BudgetSuggestion } from "@/types";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useItineraryStore } from "@/store/useItineraryStore";
import { buildAiUserContext, rememberAiAction, submitAiFeedback } from "@/lib/aiMemory";
import { useNavigate } from "react-router-dom";

const CATEGORY_COLORS: Record<string, string> = {
  flights: "#1B4332",
  accommodation: "#52B788",
  food: "#E76F51",
  activities: "#4361EE",
  transport: "#E9C46A",
  miscellaneous: "#9A9690",
  nature: "#2D6A4F",
  experience: "#7209B7",
  wellness: "#06D6A0",
  shopping: "#F77F00",
  attraction: "#3A86FF",
  restaurant: "#E76F51",
};

const CATEGORY_ICONS: Record<string, string> = {
  flights: "✈️",
  accommodation: "🏨",
  food: "🍽️",
  activities: "🎭",
  transport: "🚗",
  miscellaneous: "💡",
  nature: "🌿",
  experience: "🎪",
  wellness: "🧘",
  shopping: "🛍️",
  attraction: "🏛️",
  restaurant: "🍽️",
};

// AI_SUGGESTIONS will be fetched from API
type ApiBudgetSuggestion = Omit<BudgetSuggestion, "description"> & { desc: string };

const Budget: React.FC = () => {
  const preferences = usePreferencesStore((s) => s.preferences);
  const user = useAuthStore((s) => s.user);
  const { activeItinerary } = useItineraryStore();
  const navigate = useNavigate();

  const currentDestination = activeItinerary?.destination?.name ?? "";
  const daysCount = activeItinerary?.days?.length || 0;
  
  // Calculate real breakdown from activities
  const realBreakdown = activeItinerary?.days?.reduce((acc, day) => {
    [...day.morning, ...day.afternoon, ...day.evening].forEach(act => {
      const cat = act.category ?? 'activities';
      acc[cat] = (acc[cat] || 0) + (act.estimatedCost || 0);
    });
    return acc;
  }, {} as Record<string, number>) ?? {};

  // Filter out zero-value categories
  const breakdown = Object.fromEntries(Object.entries(realBreakdown).filter(([, v]) => v > 0));
  const hasData = Object.keys(breakdown).length > 0;
  const total = activeItinerary?.totalBudget || 50000;
  const spent = Object.values(breakdown).reduce((s, v) => s + v, 0);
  const pct = total > 0 ? Math.round((spent / total) * 100) : 0;
  const health = getBudgetHealth(pct);
  const [suggestions, setSuggestions] = useState<ApiBudgetSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedSuggestions, setApplied] = useState<string[]>([]);
  const [ratedSuggestions, setRatedSuggestions] = useState<Record<string, "up" | "down">>({});
  const [aiStatus, setAiStatus] = useState<string>("idle");
  const [aiMeta, setAiMeta] = useState<AiMeta | null>(null);
  const statusLabel = getAiStatusLabel(aiStatus);

  const pieData = Object.entries(breakdown).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
    key: k,
  }));

  const barData = Object.entries(breakdown).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    Estimated: v,
    Budget: spent > 0 ? Math.round(total * (v / spent)) : 0,
  }));

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/budget-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ai-user-id": user?.uid ?? "guest" },
        body: JSON.stringify({
          destination: currentDestination,
          breakdown,
          total,
          preferences,
          userContext: buildAiUserContext(preferences),
        }),
      });
      if (!res.ok) throw new Error("Failed to optimize budget");
      const data = await res.json() as { suggestions?: ApiBudgetSuggestion[]; meta?: AiMeta };
      if (Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        setAiStatus(data.meta?.status ?? "validated");
        setAiMeta(data.meta ?? null);
        rememberAiAction("budget:optimize");
        toast.success("Budget optimized by Gemini AI!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate AI budget suggestions.");
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (title: string, savings: number) => {
    if (appliedSuggestions.includes(title)) return;
    setApplied((p) => [...p, title]);
    toast.success(`Applied! Saving ${formatCurrency(savings)} 💰`);
  };

  const rateSuggestion = async (suggestion: ApiBudgetSuggestion, rating: "up" | "down") => {
    if (ratedSuggestions[suggestion.title]) return;
    setRatedSuggestions((prev) => ({ ...prev, [suggestion.title]: rating }));
    await submitAiFeedback({
      feature: "budget",
      responseId: suggestion.title,
      rating,
      provider: aiMeta?.provider,
      model: aiMeta?.model,
      userId: user?.uid ?? "guest",
    });
  };

  const healthColors = { good: "var(--color-success)", warning: "var(--color-warning)", danger: "var(--color-error)" };

  // If no itinerary or no activities, show helpful empty state
  if (!activeItinerary || !hasData) {
    return (
      <div style={{ padding: "var(--space-8)", maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "var(--space-2)" }}>💰 Budget Dashboard</h1>
          <p style={{ color: "var(--color-text-muted)" }}>Track and optimize your travel spending with AI insights</p>
        </header>
        <div style={{ textAlign: "center", padding: "var(--space-16) 0", animation: "fadeIn 300ms ease-out" }}>
          <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)" }}>📊</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "var(--space-2)" }}>
            {activeItinerary ? "No activities planned yet" : "No trip selected"}
          </h2>
          <p style={{ color: "var(--color-text-muted)", maxWidth: 420, margin: "0 auto", marginBottom: "var(--space-6)" }}>
            {activeItinerary
              ? "Add activities to your itinerary in the Planner to see real-time budget tracking and AI optimization."
              : "Select a destination and generate an itinerary to see your budget dashboard with real spending data."}
          </p>
          <button className="btn btn-primary" onClick={() => navigate(activeItinerary ? "/planner" : "/discover")}>
            {activeItinerary ? "📋 Go to Planner" : "🔍 Discover Destinations"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-8)", maxWidth: 1100, margin: "0 auto" }}>
      {/* ── Header ── */}
      <header style={{ marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "var(--space-2)" }}>💰 Budget Dashboard</h1>
        <p style={{ color: "var(--color-text-muted)" }}>{currentDestination} trip · {daysCount} days</p>
      </header>

      {/* ── Summary Cards ── */}
      <section aria-label="Budget summary" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out 60ms both" }}>
        {[
          { label: "Total Budget", value: formatCurrency(total), color: "var(--color-accent)", icon: "💎" },
          { label: "Estimated Spend", value: formatCurrency(spent), color: healthColors[health], icon: "💳" },
          { label: "Remaining", value: formatCurrency(total - spent), color: "var(--color-text-primary)", icon: "🏦" },
          { label: "Daily Average", value: formatCurrency(Math.round(spent / Math.max(daysCount, 1))), color: "var(--color-text-muted)", icon: "📅" },
        ].map((card) => (
          <div key={card.label} className="card" style={{ padding: "var(--space-5)" }}>
            <span style={{ fontSize: "1.5rem", display: "block", marginBottom: "var(--space-2)" }} aria-hidden="true">
              {card.icon}
            </span>
            <div style={{ fontWeight: 700, fontSize: "1.5rem", color: card.color, marginBottom: "var(--space-1)", fontFamily: "var(--font-mono)" }}>{card.value}</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{card.label}</div>
          </div>
        ))}
      </section>

      {/* ── Budget Bar ── */}
      <section aria-label="Budget progress" className="card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out 120ms both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
          <span style={{ fontWeight: 700 }}>Overall Budget Usage</span>
          <span style={{ fontWeight: 700, color: healthColors[health] }}>{pct}%</span>
        </div>
        <div className="progress-bar" style={{ height: 12, borderRadius: "var(--radius-full)" }}>
          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: healthColors[health], borderRadius: "var(--radius-full)" }} role="progressbar" aria-valuenow={spent} aria-valuemin={0} aria-valuemax={total} aria-label={`${pct}% of budget used`} />
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "var(--space-2)" }}>
          {formatCurrency(total - spent)} remaining · {health === "good" ? "✅ On track" : health === "warning" ? "⚠️ Watch your spend" : "🔴 Over budget"}
        </p>
      </section>

      {/* ── Charts ── */}
      <section aria-labelledby="charts-heading" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-8)", marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out 180ms both" }}>
        <div className="card" style={{ padding: "var(--space-6)" }}>
          <h2 id="charts-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", marginBottom: "var(--space-4)" }}>
            Spend Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart aria-label="Budget breakdown pie chart">
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key] ?? "#9A9690"} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: "var(--space-6)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", marginBottom: "var(--space-4)" }}>Budget vs Estimated</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} aria-label="Budget vs estimated spend bar chart">
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Budget" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Estimated" fill="var(--color-highlight)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Category Breakdown ── */}
      <section aria-labelledby="breakdown-heading" className="card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out 240ms both" }}>
        <h2 id="breakdown-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", marginBottom: "var(--space-5)" }}>
          Category Breakdown
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {Object.entries(breakdown).map(([key, value]) => {
            const pctOfTotal = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontWeight: 500 }}>
                    <span aria-hidden="true">{CATEGORY_ICONS[key] ?? "📌"}</span>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                    {formatCurrency(value)} · {pctOfTotal}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${pctOfTotal}%`, background: CATEGORY_COLORS[key] ?? "#9A9690" }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={total} aria-label={`${key}: ${formatCurrency(value)}`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── AI Budget Optimizer ── */}
      <section aria-labelledby="optimize-heading" style={{ animation: "fadeInUp 300ms ease-out 300ms both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2 id="optimize-heading" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
            ✨ AI Budget Optimizer
          </h2>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {statusLabel}
          </span>
          <button onClick={fetchSuggestions} className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? "Optimizing..." : suggestions.length > 0 ? "🔄 Re-optimize" : "Optimize my budget →"}
          </button>
        </div>

        {suggestions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", animation: "fadeInUp 300ms ease-out" }}>
            {suggestions.map((s) => (
              <div key={s.title} className="card" style={{ padding: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-4)", opacity: appliedSuggestions.includes(s.title) ? 0.6 : 1 }}>
                <div style={{ fontSize: "1.5rem" }} aria-hidden="true">
                  💡
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>{s.title}</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{s.desc}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--color-success)", fontSize: "0.9375rem" }}>-{formatCurrency(s.savings)}</div>
                  <button onClick={() => applySuggestion(s.title, s.savings)} disabled={appliedSuggestions.includes(s.title)} className="btn btn-sm btn-secondary" style={{ marginTop: "var(--space-2)" }}>
                    {appliedSuggestions.includes(s.title) ? "✓ Applied" : "Apply"}
                  </button>
                  <div style={{ display: "flex", gap: "var(--space-1)", marginTop: "var(--space-2)", justifyContent: "flex-end" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ minHeight: 24, padding: "2px 8px" }}
                      disabled={Boolean(ratedSuggestions[s.title])}
                      onClick={() => rateSuggestion(s, "up")}
                    >
                      👍
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ minHeight: 24, padding: "2px 8px" }}
                      disabled={Boolean(ratedSuggestions[s.title])}
                      onClick={() => rateSuggestion(s, "down")}
                    >
                      👎
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Budget;
