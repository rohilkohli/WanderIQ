import { LandingFooter } from "./LandingFooter";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingFeatures } from "./LandingFeatures";
import { LandingStats } from "./LandingStats";
import { LandingHero } from "./LandingHero";
import { LandingHeader } from "./LandingHeader";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import SignInModal from "@/components/auth/SignInModal";

import { DESTINATIONS, FEATURES, STATS } from "./LandingConstants";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showSignIn, setShowSignIn] = useState(false);
  const [moodQuery, setMoodQuery] = useState("");
  const handleCTA = () => {
    if (user) navigate("/dashboard");
    else setShowSignIn(true);
  };

  const handleMoodSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (moodQuery.trim()) navigate(`/discover?mood=${encodeURIComponent(moodQuery)}`);
  };

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ── NAV BAR ─────────────────────────────── */}
      <LandingHeader user={user} setShowSignIn={setShowSignIn} />

      {/* ── HERO ────────────────────────────────── */}
      <LandingHero moodQuery={moodQuery} setMoodQuery={setMoodQuery} handleMoodSearch={handleMoodSearch} handleCTA={handleCTA} />

      {/* ── STATS BAR ───────────────────────────── */}
      <LandingStats />

      {/* ── FEATURES ────────────────────────────── */}
      <LandingFeatures />

      {/* ── HOW IT WORKS ────────────────────────── */}
      <LandingHowItWorks />

      {/* ── FINAL CTA ───────────────────────────── */}
      <section aria-labelledby="cta-heading" style={{ padding: "var(--space-24) var(--space-8)", textAlign: "center", background: "var(--color-bg)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 id="cta-heading" style={{ marginBottom: "var(--space-4)" }}>
            Your next great adventure starts here
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1.0625rem", marginBottom: "var(--space-8)" }}>Free to use. No credit card required. Start planning in under 60 seconds.</p>
          <button className="btn btn-primary btn-lg" onClick={handleCTA} style={{ borderRadius: "var(--radius-xl)" }}>
            <span aria-hidden="true">✈️</span>
            Plan my first trip →
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <LandingFooter />

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </div>
  );
};

export default Landing;
