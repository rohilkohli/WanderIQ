import React, { useState, useRef } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { analytics } from "@/lib/analytics";
import { isValidEmail } from "@/lib/utils";
import toast from "react-hot-toast";

interface SignInModalProps {
  onClose: () => void;
}

const GoogleProvider = new GoogleAuthProvider();

const SignInModal: React.FC<SignInModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const setUser = useAuthStore((s) => s.setUser);
  const modalRef = useRef<HTMLDivElement>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isValidEmail(email)) errs.email = "Please enter a valid email address.";
    if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (tab === "signin") {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        setUser(cred.user);
        analytics.signIn("email");
        toast.success("Welcome back!");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        setUser(cred.user);
        analytics.signUp("email");
        toast.success("Account created! Welcome to WanderIQ.");
      }
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/invalid-api-key' || auth.app.options.apiKey === 'demo-api-key') {
        // Fallback for demo mode
        setUser({ uid: 'mock-user-id', email, displayName: email.split('@')[0] } as any);
        toast.success("Welcome (Demo Mode)!");
        onClose();
      } else {
        const message = err?.message ?? "Authentication failed.";
        toast.error(
          message
            .replace("Firebase: ", "")
            .replace(/\(.*\)\.?/, "")
            .trim(),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, GoogleProvider);
      setUser(cred.user);
      analytics.signIn("google");
      toast.success(`Welcome, ${cred.user.displayName?.split(" ")[0] ?? "traveller"}!`);
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/invalid-api-key' || auth.app.options.apiKey === 'demo-api-key') {
        setUser({ uid: 'mock-google-id', email: 'guest@wanderiq.app', displayName: 'Google Guest' } as any);
        toast.success("Welcome, Google Guest (Demo Mode)!");
        onClose();
      } else {
        toast.error("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      setUser(cred.user);
      analytics.signIn("guest");
      toast.success("Continuing as guest. You can upgrade anytime!");
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/invalid-api-key' || auth.app.options.apiKey === 'demo-api-key') {
        setUser({ uid: 'mock-guest-id', isAnonymous: true, displayName: 'Guest Traveler' } as any);
        toast.success("Continuing as guest (Demo Mode).");
        onClose();
      } else {
        toast.error("Could not start guest session.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-content" ref={modalRef}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
            <div style={{ width: 56, height: 56, background: "var(--color-accent)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M16 4L28 12V20L16 28L4 20V12L16 4Z" stroke="white" strokeWidth="2" fill="none" />
                <circle cx="16" cy="16" r="3" fill="white" />
              </svg>
            </div>
            <h1 id="modal-title" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", marginBottom: "var(--space-2)" }}>
              {tab === "signin" ? "Welcome back" : "Start exploring"}
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>{tab === "signin" ? "Sign in to your WanderIQ account" : "Create your free WanderIQ account"}</p>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Authentication options" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-1)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)", padding: "var(--space-1)", marginBottom: "var(--space-6)" }}>
            {(["signin", "signup"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} style={{ padding: "var(--space-2)", borderRadius: "var(--radius-sm)", border: "none", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", background: tab === t ? "var(--color-surface)" : "transparent", color: tab === t ? "var(--color-text-primary)" : "var(--color-text-muted)", boxShadow: tab === t ? "var(--shadow-sm)" : "none", transition: "all var(--transition-fast)" }}>
                {t === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Google Button */}
          <button onClick={handleGoogle} disabled={loading} className="btn btn-secondary" style={{ width: "100%", marginBottom: "var(--space-4)", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} noValidate>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
              <div>
                <label htmlFor="auth-email" style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "var(--space-2)" }}>
                  Email address{" "}
                  <span aria-hidden="true" style={{ color: "var(--color-highlight)" }}>
                    *
                  </span>
                </label>
                <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" required aria-required="true" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} autoComplete="email" />
                {errors.email && (
                  <p id="email-error" role="alert" style={{ color: "var(--color-error)", fontSize: "0.8125rem", marginTop: "var(--space-1)" }}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="auth-password" style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "var(--space-2)" }}>
                  Password{" "}
                  <span aria-hidden="true" style={{ color: "var(--color-highlight)" }}>
                    *
                  </span>
                </label>
                <input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" required aria-required="true" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} autoComplete={tab === "signin" ? "current-password" : "new-password"} />
                {errors.password && (
                  <p id="password-error" role="alert" style={{ color: "var(--color-error)", fontSize: "0.8125rem", marginTop: "var(--space-1)" }}>
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading} aria-busy={loading}>
              {loading ? <span className="animate-spin" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }} /> : tab === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Guest mode */}
          <button onClick={handleGuest} disabled={loading} className="btn btn-ghost" style={{ width: "100%", marginTop: "var(--space-3)", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Continue as guest (no account needed)
          </button>

          {/* Close */}
          <button onClick={onClose} aria-label="Close sign in modal" style={{ position: "absolute", top: "var(--space-4)", right: "var(--space-4)", background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "1.5rem", lineHeight: 1, padding: "var(--space-1)", borderRadius: "var(--radius-sm)" }}>
            ×
          </button>
        </div>
      </div>
    </>
  );
};

export default SignInModal;
