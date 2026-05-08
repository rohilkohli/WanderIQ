import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import SignInModal from '@/components/auth/SignInModal';

const DESTINATIONS = [
  { name: 'Santorini', country: 'Greece', tag: 'Beach & Culture', emoji: '🏛️', color: '#4361EE' },
  { name: 'Kyoto',     country: 'Japan',  tag: 'Cultural',        emoji: '⛩️', color: '#E76F51' },
  { name: 'Patagonia', country: 'Argentina', tag: 'Adventure',    emoji: '🏔️', color: '#2D6A4F' },
  { name: 'Marrakech', country: 'Morocco', tag: 'Food & Culture', emoji: '🕌', color: '#E9C46A' },
  { name: 'Bali',      country: 'Indonesia', tag: 'Wellness',     emoji: '🌺', color: '#F4845F' },
  { name: 'Goa',       country: 'India',   tag: 'Beach',          emoji: '🌊', color: '#0096C7' },
];

const FEATURES = [
  {
    icon: '🧠',
    title: 'AI-Powered Discovery',
    desc: 'Type a mood, get 3–5 curated destinations with match scores, climate snapshots, and tailored reasons.',
  },
  {
    icon: '📅',
    title: 'Dynamic Day Builder',
    desc: 'Drag-and-drop itinerary planner with auto-fill, constraint validation, and real-time map sync.',
  },
  {
    icon: '🗺️',
    title: 'Live Map Intelligence',
    desc: 'Route polylines, Street View previews, traffic-aware transit times, and cluster markers.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Updates',
    desc: 'Live weather warnings, place open/closed status, and collaborative editing with presence indicators.',
  },
  {
    icon: '💬',
    title: 'Gemini Chat Assistant',
    desc: 'Ask anything — swap activities, find restaurants, translate signs, get packing lists.',
  },
  {
    icon: '🔐',
    title: 'Production-Grade Security',
    desc: 'Firebase auth, Firestore security rules, server-side API calls, and CSP headers.',
  },
];

const STATS = [
  { value: '10M+', label: 'Trips planned' },
  { value: '195',  label: 'Countries covered' },
  { value: '4.9★', label: 'Average rating' },
  { value: '<2s',  label: 'AI response time' },
];

const Landing: React.FC = () => {
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const [showSignIn, setShowSignIn] = useState(false);
  const [moodQuery, setMoodQuery]   = useState('');
  const handleCTA = () => {
    if (user) navigate('/dashboard');
    else setShowSignIn(true);
  };

  const handleMoodSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (moodQuery.trim()) navigate(`/discover?mood=${encodeURIComponent(moodQuery)}`);
  };

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV BAR ─────────────────────────────── */}
      <header
        role="banner"
        style={{
          position:     'sticky',
          top:          0,
          zIndex:       'var(--z-sticky)',
          background:   'rgba(247,244,238,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          padding:      '0 var(--space-8)',
          display:      'flex',
          alignItems:   'center',
          height:       'var(--topbar-height)',
          gap:          'var(--space-4)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{
            width:  36, height: 36,
            background:   'var(--color-accent)',
            borderRadius: 'var(--radius-md)',
            display:      'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 4L28 12V20L16 28L4 20V12L16 4Z" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="16" r="3" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
            WanderIQ
          </span>
        </div>

        <nav aria-label="Main navigation" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 'var(--space-6)' }}>
          {[['Features', '#features'], ['How it works', '#how-it-works'], ['Pricing', '#pricing']].map(([label, href]) => (
            <a key={href} href={href} style={{
              color: 'var(--color-text-muted)', fontSize: '0.9375rem', fontWeight: 500,
              textDecoration: 'none', transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              {label}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
              Go to Dashboard →
            </button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSignIn(true)}>Sign in</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowSignIn(true)}>Get started free</button>
            </>
          )}
        </div>
      </header>

      {/* ── HERO ────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        style={{
          minHeight:      '92vh',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        'var(--space-16) var(--space-8)',
          position:       'relative',
          overflow:       'hidden',
        }}
      >
        {/* Background decoration */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 50% at 20% 40%, rgba(27,67,50,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 60%, rgba(231,111,81,0.05) 0%, transparent 70%)
          `,
        }} />

        {/* Floating destination chips */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '12%', left: '5%',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
          opacity: 0.7,
        }}>
          {DESTINATIONS.slice(0, 3).map((d, i) => (
            <div key={d.name} style={{
              background:   'var(--color-surface)',
              border:       '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding:      'var(--space-2) var(--space-4)',
              fontSize:     '0.875rem',
              fontWeight:   500,
              display:      'flex',
              alignItems:   'center',
              gap:          'var(--space-2)',
              boxShadow:    'var(--shadow-sm)',
              animation:    `fadeInUp 600ms ease-out ${i * 150}ms both`,
              transform:    `translateX(${i % 2 === 0 ? -8 : 8}px)`,
            }}>
              <span>{d.emoji}</span>
              {d.name}
              <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{d.tag}</span>
            </div>
          ))}
        </div>

        <div aria-hidden="true" style={{
          position: 'absolute', top: '15%', right: '5%',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
          opacity: 0.7,
        }}>
          {DESTINATIONS.slice(3).map((d, i) => (
            <div key={d.name} style={{
              background:   'var(--color-surface)',
              border:       '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding:      'var(--space-2) var(--space-4)',
              fontSize:     '0.875rem',
              fontWeight:   500,
              display:      'flex',
              alignItems:   'center',
              gap:          'var(--space-2)',
              boxShadow:    'var(--shadow-sm)',
              animation:    `fadeInUp 600ms ease-out ${(i + 3) * 150}ms both`,
            }}>
              <span>{d.emoji}</span>
              {d.name}
              <span className="badge badge-highlight" style={{ fontSize: '0.7rem' }}>{d.tag}</span>
            </div>
          ))}
        </div>

        {/* Hero content */}
        <div style={{ textAlign: 'center', maxWidth: 720, position: 'relative', zIndex: 1 }}>
          {/* Pill badge */}
          <div style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          'var(--space-2)',
            background:   'var(--color-accent-light)',
            borderRadius: 'var(--radius-full)',
            padding:      'var(--space-2) var(--space-4)',
            marginBottom: 'var(--space-6)',
            fontSize:     '0.875rem',
            fontWeight:   600,
            color:        'var(--color-accent)',
            animation:    'fadeInUp 400ms ease-out both',
          }}>
            <span aria-hidden="true">✨</span>
            Powered by Gemini 1.5 Flash · Google Maps · Firebase
          </div>

          <h1
            id="hero-heading"
            style={{
              fontFamily:    'var(--font-display)',
              fontSize:      'clamp(2.75rem, 6vw, 4.5rem)',
              fontWeight:    700,
              lineHeight:    1.1,
              marginBottom:  'var(--space-6)',
              letterSpacing: '-0.02em',
              animation:     'fadeInUp 500ms ease-out 100ms both',
            }}
          >
            Plan trips that{' '}
            <span style={{
              fontStyle:      'italic',
              background:     'linear-gradient(135deg, var(--color-accent) 0%, var(--color-highlight) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              actually know you
            </span>
          </h1>

          <p style={{
            fontSize:     'clamp(1.0625rem, 2vw, 1.25rem)',
            color:        'var(--color-text-muted)',
            lineHeight:   1.7,
            marginBottom: 'var(--space-8)',
            animation:    'fadeInUp 500ms ease-out 200ms both',
          }}>
            WanderIQ builds AI-powered multi-day itineraries tuned to your budget, diet, mobility, and travel style —
            with live weather, traffic routing, and collaborative planning baked in.
          </p>

          {/* Mood search CTA */}
          <form
            onSubmit={handleMoodSearch}
            style={{ animation: 'fadeInUp 500ms ease-out 300ms both' }}
            aria-label="Trip mood search"
          >
            <div style={{
              display:      'flex',
              gap:          'var(--space-2)',
              background:   'var(--color-surface)',
              border:       '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding:      'var(--space-2)',
              boxShadow:    'var(--shadow-lg)',
              maxWidth:     600,
              margin:       '0 auto',
            }}>
              <label htmlFor="hero-mood-input" className="sr-only">Describe your dream trip</label>
              <input
                id="hero-mood-input"
                type="text"
                value={moodQuery}
                onChange={(e) => setMoodQuery(e.target.value)}
                placeholder='Try "5 days in South India under ₹40,000"...'
                style={{
                  flex:       1,
                  border:     'none',
                  background: 'transparent',
                  fontFamily: 'var(--font-body)',
                  fontSize:   '0.9375rem',
                  color:      'var(--color-text-primary)',
                  padding:    'var(--space-3) var(--space-4)',
                  outline:    'none',
                  minWidth:   0,
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-5)' }}
              >
                <span aria-hidden="true">🔍</span>
                Discover
              </button>
            </div>
          </form>

          {/* Secondary CTA */}
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-6)', animation: 'fadeInUp 500ms ease-out 400ms both' }}>
            <button className="btn btn-secondary btn-lg" onClick={handleCTA}>
              Start planning free →
            </button>
            <a
              href="#features"
              className="btn btn-ghost btn-lg"
              style={{ color: 'var(--color-text-muted)' }}
            >
              See how it works
            </a>
          </div>

          {/* Social proof */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            gap:          'var(--space-4)',
            marginTop:    'var(--space-8)',
            animation:    'fadeInUp 500ms ease-out 500ms both',
          }}>
            <div style={{ display: 'flex' }}>
              {['🧳', '📸', '🗺️', '✈️', '🏖️'].map((emoji, i) => (
                <div key={i} style={{
                  width:          32, height: 32,
                  borderRadius:   '50%',
                  background:     'var(--color-surface-alt)',
                  border:         '2px solid var(--color-surface)',
                  display:        'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft:     i === 0 ? 0 : -10,
                  fontSize:       '0.875rem',
                }}>
                  {emoji}
                </div>
              ))}
            </div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Join <strong style={{ color: 'var(--color-text-primary)' }}>10,000+</strong> travellers planning smarter
            </span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────── */}
      <section
        aria-label="WanderIQ by the numbers"
        style={{
          background:    'var(--color-accent)',
          padding:       'var(--space-8) var(--space-8)',
          display:       'flex',
          justifyContent: 'center',
          gap:           'var(--space-16)',
          flexWrap:      'wrap',
        }}
      >
        {STATS.map((s) => (
          <div key={s.label} style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: 'var(--space-1)' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── FEATURES ────────────────────────────── */}
      <section
        id="features"
        aria-labelledby="features-heading"
        style={{ padding: 'var(--space-24) var(--space-8)', maxWidth: 1200, margin: '0 auto' }}
      >
        <header style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <div className="badge badge-accent" style={{ marginBottom: 'var(--space-4)', fontSize: '0.8125rem' }}>
            ✦ Features
          </div>
          <h2 id="features-heading" style={{ marginBottom: 'var(--space-4)' }}>
            Everything you need to travel brilliantly
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 520, margin: '0 auto', fontSize: '1.0625rem' }}>
            From AI destination discovery to real-time collaboration — WanderIQ handles every layer of trip planning.
          </p>
        </header>

        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap:                 'var(--space-6)',
          }}
          className="stagger"
        >
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="card"
              style={{ padding: 'var(--space-6)' }}
            >
              <div style={{
                width:          52, height: 52,
                borderRadius:   'var(--radius-lg)',
                background:     'var(--color-surface-alt)',
                display:        'flex', alignItems: 'center', justifyContent: 'center',
                fontSize:       '1.5rem',
                marginBottom:   'var(--space-4)',
              }} aria-hidden="true">
                {f.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', marginBottom: 'var(--space-2)' }}>
                {f.title}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.65 }}>
                {f.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────── */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        style={{
          background: 'var(--color-surface)',
          padding:    'var(--space-24) var(--space-8)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <header style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <div className="badge badge-highlight" style={{ marginBottom: 'var(--space-4)', fontSize: '0.8125rem' }}>
              ✦ How it works
            </div>
            <h2 id="how-heading">From idea to itinerary in 3 steps</h2>
          </header>

          <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {[
              {
                step: '01',
                title: 'Tell WanderIQ your dream',
                desc: 'Type a mood, budget, travel style, and duration. Set dietary needs, mobility requirements, and group size. WanderIQ builds your traveller profile once — uses it everywhere.',
                icon: '🎯',
              },
              {
                step: '02',
                title: 'Discover & select your destination',
                desc: 'Our AI searches the world based on your profile, surfacing 3–5 destination cards with match scores, climate snapshots, and tailored activity previews.',
                icon: '🌍',
              },
              {
                step: '03',
                title: 'Build, refine & share',
                desc: 'Drag activities between time slots, auto-fill empty days with Gemini, check constraints, export to PDF, and invite collaborators — all in real time.',
                icon: '✅',
              },
            ].map((item, i) => (
              <li key={item.step} style={{
                display:       'grid',
                gridTemplateColumns: '80px 1fr',
                gap:           'var(--space-6)',
                alignItems:    'start',
              }}>
                <div style={{
                  width:          80, height: 80,
                  borderRadius:   'var(--radius-xl)',
                  background:     'var(--color-accent)',
                  display:        'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize:       '2rem',
                  flexShrink:     0,
                  position:       'relative',
                }} aria-hidden="true">
                  {item.icon}
                  <span style={{
                    position:     'absolute',
                    top:          -8, right: -8,
                    background:   'var(--color-highlight)',
                    color:        'white',
                    borderRadius: 'var(--radius-full)',
                    width:        24, height: 24,
                    display:      'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize:     '0.6875rem',
                    fontWeight:   700,
                  }}>
                    {i + 1}
                  </span>
                </div>
                <div style={{ paddingTop: 'var(--space-3)' }}>
                  <h3 style={{ marginBottom: 'var(--space-2)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────── */}
      <section
        aria-labelledby="cta-heading"
        style={{
          padding:    'var(--space-24) var(--space-8)',
          textAlign:  'center',
          background: 'var(--color-bg)',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 id="cta-heading" style={{ marginBottom: 'var(--space-4)' }}>
            Your next great adventure starts here
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.0625rem', marginBottom: 'var(--space-8)' }}>
            Free to use. No credit card required. Start planning in under 60 seconds.
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleCTA} style={{ borderRadius: 'var(--radius-xl)' }}>
            <span aria-hidden="true">✈️</span>
            Plan my first trip →
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer
        role="contentinfo"
        style={{
          background:    'var(--color-accent)',
          color:         'rgba(255,255,255,0.8)',
          padding:       'var(--space-8) var(--space-8)',
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'space-between',
          flexWrap:      'wrap',
          gap:           'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', color: 'white' }}>WanderIQ</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <span style={{ fontSize: '0.8125rem' }}>Built for HACK2SKILL × Google for Developers PromptWars 2026</span>
        </div>
        <p style={{ fontSize: '0.8125rem' }}>
          Powered by Gemini · Google Maps · Firebase · OpenMeteo
        </p>
      </footer>

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </div>
  );
};

export default Landing;
