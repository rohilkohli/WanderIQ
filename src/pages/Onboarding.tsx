import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  BudgetTier, TravelStyle, DietaryRestriction,
  MobilityNeed, GroupType, AccommodationType, TransportType, Interest,
} from '@/types';
import toast from 'react-hot-toast';

const STEPS = [
  { step: 1, title: 'Travel Personality', subtitle: 'Tell us how you like to travel' },
  { step: 2, title: 'Preferences & Needs', subtitle: 'Dietary, mobility, and group details' },
  { step: 3, title: 'Home Base & Dates',  subtitle: 'Where do you usually travel from?' },
];

const STYLES: { value: TravelStyle; label: string; emoji: string }[] = [
  { value: 'adventure', label: 'Adventure',       emoji: '🧗' },
  { value: 'cultural',  label: 'Cultural',         emoji: '🏛️' },
  { value: 'wellness',  label: 'Wellness',          emoji: '🧘' },
  { value: 'food',      label: 'Food & Drink',      emoji: '🍜' },
  { value: 'beach',     label: 'Beach',             emoji: '🏖️' },
  { value: 'wildlife',  label: 'Wildlife',          emoji: '🦁' },
  { value: 'city',      label: 'City Break',        emoji: '🏙️' },
  { value: 'offbeat',   label: 'Off-beaten-path',   emoji: '🗺️' },
];

const BUDGET_TIERS: { value: BudgetTier; label: string; desc: string; emoji: string }[] = [
  { value: 'economy',    label: 'Economy',    desc: 'Budget-conscious, hostels & street food', emoji: '💸' },
  { value: 'mid-range',  label: 'Mid-range',  desc: '3-star hotels, local restaurants',         emoji: '💳' },
  { value: 'luxury',     label: 'Luxury',     desc: '5-star, fine dining, premium experiences', emoji: '💎' },
];

const INTERESTS: { value: Interest; label: string; emoji: string }[] = [
  { value: 'history',      label: 'History',      emoji: '📜' },
  { value: 'architecture', label: 'Architecture', emoji: '🏰' },
  { value: 'art',          label: 'Art',          emoji: '🎨' },
  { value: 'nightlife',    label: 'Nightlife',    emoji: '🎵' },
  { value: 'hiking',       label: 'Hiking',       emoji: '🥾' },
  { value: 'photography',  label: 'Photography',  emoji: '📷' },
  { value: 'shopping',     label: 'Shopping',     emoji: '🛍️' },
  { value: 'literature',   label: 'Literature',   emoji: '📚' },
  { value: 'music',        label: 'Music',        emoji: '🎶' },
  { value: 'sports',       label: 'Sports',       emoji: '⚽' },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, setPreferences } = usePreferencesStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const goNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      toast.success('Preferences saved! Let\'s find your perfect trip. 🌍');
      navigate('/discover');
    }
  };

  const goPrev = () => {
    if (step > 1) setStep(step - 1);
    else navigate('/');
  };

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'var(--color-bg)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        'var(--space-8)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: 36, height: 36, background: 'var(--color-accent)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><path d="M16 4L28 12V20L16 28L4 20V12L16 4Z" stroke="white" strokeWidth="2" fill="none"/><circle cx="16" cy="16" r="3" fill="white"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>WanderIQ</span>
        </div>

        {/* Step Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.step}>
              <div style={{
                width:          32, height: 32,
                borderRadius:   '50%',
                background:     s.step <= step ? 'var(--color-accent)' : 'var(--color-surface-alt)',
                border:         `2px solid ${s.step <= step ? 'var(--color-accent)' : 'var(--color-border)'}`,
                display:        'flex', alignItems: 'center', justifyContent: 'center',
                fontSize:       '0.8125rem', fontWeight: 700,
                color:          s.step <= step ? 'white' : 'var(--color-text-muted)',
                transition:     'all var(--transition-normal)',
              }}
              aria-current={s.step === step ? 'step' : undefined}
              >
                {s.step < step ? '✓' : s.step}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 40, height: 2, background: step > s.step ? 'var(--color-accent)' : 'var(--color-border)', transition: 'background var(--transition-normal)' }} aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: 'var(--space-1)' }}>
          {STEPS[step - 1].title}
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>{STEPS[step - 1].subtitle}</p>
      </div>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: 640, padding: 'var(--space-8)', animation: 'fadeInUp 300ms ease-out' }}>

        {/* ── STEP 1: Travel Personality ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
              Budget tier
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {BUDGET_TIERS.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setPreferences({ budgetTier: b.value })}
                  aria-pressed={preferences.budgetTier === b.value}
                  style={{
                    padding:      'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border:       `2px solid ${preferences.budgetTier === b.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background:   preferences.budgetTier === b.value ? 'var(--color-accent-light)' : 'var(--color-surface)',
                    cursor:       'pointer',
                    textAlign:    'left',
                    transition:   'all var(--transition-fast)',
                    fontFamily:   'var(--font-body)',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{b.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>{b.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{b.desc}</div>
                </button>
              ))}
            </div>

            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
              Travel style (select all that apply)
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setPreferences({ travelStyle: toggle(preferences.travelStyle, s.value) as TravelStyle[] })}
                  className={`tag${preferences.travelStyle.includes(s.value) ? ' active' : ''}`}
                  aria-pressed={preferences.travelStyle.includes(s.value)}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 'var(--space-6)' }}>
              <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                Interests (select all that apply)
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {INTERESTS.map((i) => (
                  <button
                    key={i.value}
                    onClick={() => setPreferences({ interests: toggle(preferences.interests, i.value) as Interest[] })}
                    className={`tag${preferences.interests.includes(i.value) ? ' active' : ''}`}
                    aria-pressed={preferences.interests.includes(i.value)}
                  >
                    {i.emoji} {i.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Preferences & Needs ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Dietary */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
                Dietary restrictions
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {(['none', 'vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free'] as DietaryRestriction[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setPreferences({ dietary: toggle(preferences.dietary, d) as DietaryRestriction[] })}
                    className={`tag${preferences.dietary.includes(d) ? ' active' : ''}`}
                    aria-pressed={preferences.dietary.includes(d)}
                  >
                    {d === 'none' ? '🍽️ No restrictions' : d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobility */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
                Mobility needs
              </h2>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                {([
                  { value: 'full', label: '🏃 Full mobility' },
                  { value: 'wheelchair', label: '♿ Wheelchair accessible' },
                  { value: 'low-exertion', label: '🚶 Low-exertion' },
                ] as { value: MobilityNeed; label: string }[]).map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPreferences({ mobility: m.value })}
                    className={`tag${preferences.mobility === m.value ? ' active' : ''}`}
                    aria-pressed={preferences.mobility === m.value}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Group */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
                Who's travelling?
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {([
                  { value: 'solo',      label: '🧍 Solo' },
                  { value: 'couple',    label: '💑 Couple' },
                  { value: 'family',    label: '👨‍👩‍👧 Family' },
                  { value: 'friends',   label: '👯 Friends' },
                  { value: 'corporate', label: '💼 Corporate' },
                ] as { value: GroupType; label: string }[]).map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setPreferences({ group: g.value })}
                    className={`tag${preferences.group === g.value ? ' active' : ''}`}
                    aria-pressed={preferences.group === g.value}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accommodation */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
                Accommodation preference
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {(['hotel', 'hostel', 'boutique', 'airbnb', 'resort'] as AccommodationType[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setPreferences({ accommodation: toggle(preferences.accommodation, a) as AccommodationType[] })}
                    className={`tag${preferences.accommodation.includes(a) ? ' active' : ''}`}
                    aria-pressed={preferences.accommodation.includes(a)}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1).replace('-', '/')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Home City & Currency ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <label htmlFor="home-city" style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                Home city (for flight searches)
              </label>
              <input
                id="home-city"
                type="text"
                className="input"
                placeholder="e.g. Mumbai, Delhi, Bangalore…"
                value={preferences.homeCity ?? ''}
                onChange={(e) => setPreferences({ homeCity: e.target.value })}
              />
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
                Currency preference
              </h2>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                {(['INR', 'USD'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setPreferences({ currency: c })}
                    className={`tag${preferences.currency === c ? ' active' : ''}`}
                    aria-pressed={preferences.currency === c}
                    style={{ flex: 1, justifyContent: 'center', padding: 'var(--space-3)' }}
                  >
                    {c === 'INR' ? '₹ Indian Rupee' : '$ US Dollar'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
                Transport preference
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {([
                  { value: 'flight',      label: '✈️ Flight only' },
                  { value: 'train',       label: '🚂 Train preferred' },
                  { value: 'road',        label: '🚗 Road trip' },
                  { value: 'combination', label: '🔀 Combination' },
                ] as { value: TransportType; label: string }[]).map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setPreferences({ transport: toggle(preferences.transport, t.value) as TransportType[] })}
                    className={`tag${preferences.transport.includes(t.value) ? ' active' : ''}`}
                    aria-pressed={preferences.transport.includes(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--color-accent-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem' }} aria-hidden="true">✅</span>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--color-accent)', marginBottom: 'var(--space-1)' }}>You're all set!</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  WanderIQ will use these preferences to personalise every AI recommendation, destination match score, and itinerary suggestion.
                  You can update them anytime from your profile.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)', gap: 'var(--space-4)' }}>
          <button onClick={goPrev} className="btn btn-ghost">
            ← {step === 1 ? 'Back to home' : 'Previous'}
          </button>
          <button onClick={goNext} className="btn btn-primary">
            {step < 3 ? 'Next step →' : '🌍 Start discovering →'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
        Step {step} of {STEPS.length} · You can change preferences anytime
      </p>
    </div>
  );
};

export default Onboarding;
