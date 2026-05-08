import React from "react";

interface LoadingScreenProps {
  fullScreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ fullScreen }) => {
  return (
    <div role="status" aria-label="Loading WanderIQ..." style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: fullScreen ? "100vh" : "auto", gap: "var(--space-4)", background: fullScreen ? "var(--color-bg)" : "transparent" }}>
      {/* Animated logo mark */}
      <div style={{ width: 56, height: 56, borderRadius: "var(--radius-lg)", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 1.5s ease-in-out infinite" }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 4L28 12V20L16 28L4 20V12L16 4Z" stroke="white" strokeWidth="2" fill="none" />
          <path d="M16 8L24 13V19L16 24L8 19V13L16 8Z" fill="white" opacity="0.3" />
          <circle cx="16" cy="16" r="3" fill="white" />
        </svg>
      </div>

      {fullScreen && (
        <>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>WanderIQ</span>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Planning your perfect journey…</p>
        </>
      )}
    </div>
  );
};

export default LoadingScreen;
