# WanderIQ — AI Travel Planning Engine

> **HACK2SKILL × Google for Developers PromptWars 2026 — Warm-Up Challenge #1**

A **production-grade, full-stack Travel Planning & Experience Engine** powered by Gemini 1.5 Flash, Google Maps, Firebase, and OpenMeteo.

---

## 🚀 Quick Start

```bash
npm install
npm run dev      # Start dev server at localhost:5173
npm test         # Run Vitest unit tests
npm run build    # Production bundle
```

## 🔧 Environment Variables

Create `.env` in root:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:0:web:your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_MAPS_API_KEY=your_maps_key
VITE_FUNCTIONS_BASE_URL=https://us-central1-your_project.cloudfunctions.net
```

**⚠️ Gemini API key lives in `functions/.env` only — never in client code.**

## 🏗️ Architecture

```
Frontend:  React 18 + TypeScript + Vite
Styling:   Vanilla CSS with CSS Custom Properties
State:     Zustand + React Query v5
AI:        Gemini 1.5 Flash via Cloud Functions (server-side only)
Maps:      Google Maps JavaScript API v3
Auth:      Firebase Auth (Google OAuth + Email + Anonymous)
Database:  Cloud Firestore (real-time)
Weather:   OpenMeteo REST API (free)
```

## 🔐 Security Highlights

- Zero API keys in client code
- Firebase ID token verified in every Cloud Function
- Firestore Security Rules: owner/editor/viewer RBAC
- Storage Rules: 5MB max, images only
- CSP + HSTS + X-Frame-Options headers in `firebase.json`
- Input sanitized with `sanitizeInput()` before every Gemini call

## 🎯 Feature Matrix

| Feature | Status |
|---------|--------|
| AI destination discovery | ✅ |
| Mood-based trip search | ✅ |
| Drag-and-drop itinerary | ✅ |
| Constraint validation | ✅ |
| Real-time weather (OpenMeteo) | ✅ |
| Budget dashboard (Recharts) | ✅ |
| AI packing list | ✅ |
| AI budget optimizer | ✅ |
| Gemini chat assistant | ✅ |
| Firebase Auth (3 methods) | ✅ |
| Dark mode with persistence | ✅ |
| WCAG 2.1 AA accessibility | ✅ |
| GA4 event tracking | ✅ |
| Firestore Security Rules | ✅ |
| CSP headers | ✅ |
| Unit test suite | ✅ |

## 📊 Google Services

- Gemini 1.5 Flash — 5 distinct use cases
- Google Maps JS API — markers, routes, Street View
- Places API New — Text/Nearby Search, Autocomplete
- Routes API — traffic-aware transit times
- Firebase Auth, Firestore, Cloud Storage, Functions, Hosting
- Google Analytics 4 — 10+ typed events

## 🎨 Design System

**"Refined Expedition"** — luxury travel magazine meets modern SaaS

- Playfair Display headings · DM Sans body · DM Mono code
- Warm cream palette, deep forest green, coral highlight
- Full dark mode via CSS custom properties
- `prefers-reduced-motion` respected

---

Built with Google Antigravity · Gemini 1.5 Flash · Google Maps · Firebase
