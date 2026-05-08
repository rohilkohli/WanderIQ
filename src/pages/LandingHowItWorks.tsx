import React from "react";

export const LandingHowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" style={{ background: "var(--color-surface)", padding: "var(--space-24) var(--space-8)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
          <div className="badge badge-highlight" style={{ marginBottom: "var(--space-4)", fontSize: "0.8125rem" }}>
            ✦ How it works
          </div>
          <h2 id="how-heading">From idea to itinerary in 3 steps</h2>
        </header>

        <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          {[
            {
              step: "01",
              title: "Tell WanderIQ your dream",
              desc: "Type a mood, budget, travel style, and duration. Set dietary needs, mobility requirements, and group size. WanderIQ builds your traveller profile once — uses it everywhere.",
              icon: "🎯",
            },
            {
              step: "02",
              title: "Discover & select your destination",
              desc: "Our AI searches the world based on your profile, surfacing 3–5 destination cards with match scores, climate snapshots, and tailored activity previews.",
              icon: "🌍",
            },
            {
              step: "03",
              title: "Build, refine & share",
              desc: "Drag activities between time slots, auto-fill empty days with Gemini, check constraints, export to PDF, and invite collaborators — all in real time.",
              icon: "✅",
            },
          ].map((item, i) => (
            <li key={item.step} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "var(--space-6)", alignItems: "start" }}>
              <div style={{ width: 80, height: 80, borderRadius: "var(--radius-xl)", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0, position: "relative" }} aria-hidden="true">
                {item.icon}
                <span style={{ position: "absolute", top: -8, right: -8, background: "var(--color-highlight)", color: "white", borderRadius: "var(--radius-full)", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 700 }}>{i + 1}</span>
              </div>
              <div style={{ paddingTop: "var(--space-3)" }}>
                <h3 style={{ marginBottom: "var(--space-2)", fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>{item.title}</h3>
                <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
