import React from "react";
import { useNavigate } from "react-router-dom";
import type { User } from 'firebase/auth';

export interface LandingHeaderProps {
  /** The currently authenticated Firebase user, or null if signed out. */
  user: User | null;
  /** Callback to toggle the sign-in modal visibility. */
  setShowSignIn: (show: boolean) => void;
}
export const LandingHeader: React.FC<LandingHeaderProps> = ({ user, setShowSignIn }) => {
  const navigate = useNavigate();
  return (
    <header role="banner" style={{ position: "sticky", top: 0, zIndex: "var(--z-sticky)", background: "rgba(247,244,238,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--color-border)", padding: "0 var(--space-8)", display: "flex", alignItems: "center", height: "var(--topbar-height)", gap: "var(--space-4)" }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <div style={{ width: 36, height: 36, background: "var(--color-accent)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 4L28 12V20L16 28L4 20V12L16 4Z" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="16" cy="16" r="3" fill="white" />
          </svg>
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", color: "var(--color-text-primary)" }}>VoyaIQ</span>
      </div>

      <nav aria-label="Main navigation" style={{ flex: 1, display: "flex", justifyContent: "center", gap: "var(--space-6)" }}>
        {[
          ["Features", "#features"],
          ["How it works", "#how-it-works"],
          ["Pricing", "#pricing"],
        ].map(([label, href]) => (
          <a key={href} href={href} style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem", fontWeight: 500, textDecoration: "none", transition: "color var(--transition-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}>
            {label}
          </a>
        ))}
      </nav>

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        {user ? (
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/dashboard")}>
            Go to Dashboard →
          </button>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSignIn(true)}>
              Sign in
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowSignIn(true)}>
              Get started free
            </button>
          </>
        )}
      </div>
    </header>
  );
};
