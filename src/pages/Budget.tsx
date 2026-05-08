import React, { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { getBudgetHealth } from "@/lib/budget";
import toast from "react-hot-toast";

const DEMO_BUDGET = {
  total: 40000,
  breakdown: {
    flights: 8000,
    accommodation: 12000,
    food: 8000,
    activities: 5000,
    transport: 3500,
    miscellaneous: 1200,
  },
};

const CATEGORY_COLORS = {
  flights: "#1B4332",
  accommodation: "#52B788",
  food: "#E76F51",
  activities: "#4361EE",
  transport: "#E9C46A",
  miscellaneous: "#9A9690",
};

const CATEGORY_ICONS: Record<string, string> = {
  flights: "✈️",
  accommodation: "🏨",
  food: "🍽️",
  activities: "🎭",
  transport: "🚗",
  miscellaneous: "💡",
};

const AI_SUGGESTIONS = [
  { title: "Switch to a 3-star hotel on Day 3", savings: 1800, impact: "low" as const, desc: "Similar amenities, ₹1,800 cheaper per night" },
  { title: "Take metro instead of cab on Day 4", savings: 600, impact: "low" as const, desc: "Saves 45 min and ₹600 in transit costs" },
  { title: "Try the free heritage walk on Day 2", savings: 800, impact: "low" as const, desc: "Replaces ₹800 guided tour — same route!" },
];

const Budget: React.FC = () => {
  const { breakdown, total } = DEMO_BUDGET;
  const spent = Object.values(breakdown).reduce((s, v) => s + v, 0);
  const pct = Math.round((spent / total) * 100);
  const health = getBudgetHealth(pct);
  const [showOptimize, setShowOptimize] = useState(false);
  const [appliedSuggestions, setApplied] = useState<string[]>([]);

  const pieData = Object.entries(breakdown).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
    key: k,
  }));

  const barData = Object.entries(breakdown).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    Estimated: v,
    Budget: Math.round(total * (v / spent)),
  }));

  const applySuggestion = (title: string, savings: number) => {
    if (appliedSuggestions.includes(title)) return;
    setApplied((p) => [...p, title]);
    toast.success(`Applied! Saving ${formatCurrency(savings)} 💰`);
  };

  const healthColors = { good: "var(--color-success)", warning: "var(--color-warning)", danger: "var(--color-error)" };

  return (
    <div style={{ padding: "var(--space-8)", maxWidth: 1100, margin: "0 auto" }}>
      {/* ── Header ── */}
      <header style={{ marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "var(--space-2)" }}>💰 Budget Dashboard</h1>
        <p style={{ color: "var(--color-text-muted)" }}>Goa trip · Jun 15–22 · {7} days</p>
      </header>

      {/* ── Summary Cards ── */}
      <section aria-label="Budget summary" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)", animation: "fadeInUp 300ms ease-out 60ms both" }}>
        {[
          { label: "Total Budget", value: formatCurrency(total), color: "var(--color-accent)", icon: "💎" },
          { label: "Estimated Spend", value: formatCurrency(spent), color: healthColors[health], icon: "💳" },
          { label: "Remaining", value: formatCurrency(total - spent), color: "var(--color-text-primary)", icon: "🏦" },
          { label: "Daily Average", value: formatCurrency(Math.round(spent / 7)), color: "var(--color-text-muted)", icon: "📅" },
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
                  <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key as keyof typeof CATEGORY_COLORS]} />
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
            const pctOfTotal = Math.round((value / total) * 100);
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontWeight: 500 }}>
                    <span aria-hidden="true">{CATEGORY_ICONS[key]}</span>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                    {formatCurrency(value)} · {pctOfTotal}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${pctOfTotal}%`, background: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS] }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={total} aria-label={`${key}: ${formatCurrency(value)}`} />
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
          <button onClick={() => setShowOptimize(true)} className="btn btn-primary btn-sm" disabled={showOptimize}>
            {showOptimize ? "Suggestions loaded" : "Optimize my budget →"}
          </button>
        </div>

        {showOptimize && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", animation: "fadeInUp 300ms ease-out" }}>
            {AI_SUGGESTIONS.map((s) => (
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
