import React from "react";
import { useNavigate } from "react-router-dom";
import { DESTINATIONS, FEATURES, STATS } from "./LandingConstants";

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate();
  return (
    <footer role="contentinfo" style={{ background: "var(--color-accent)", color: "rgba(255,255,255,0.8)", padding: "var(--space-8) var(--space-8)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.125rem", color: "white" }}>WanderIQ</span>
        <span style={{ opacity: 0.6 }}>·</span>
        <span style={{ fontSize: "0.8125rem" }}>Built for HACK2SKILL × Google for Developers PromptWars 2026</span>
      </div>
      <p style={{ fontSize: "0.8125rem" }}>Powered by Gemini · Google Maps · Firebase · OpenMeteo</p>
    </footer>
  );
};
