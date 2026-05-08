import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useItineraryStore } from '@/store/useItineraryStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { validateDay } from '@/lib/constraints';
import { formatCurrency, generateId } from '@/lib/utils';
import { analytics } from '@/lib/analytics';
import type { ActivityCard, ItineraryDay, TimeSlot, ActivityCategory } from '@/types';
import toast from 'react-hot-toast';

/* ─── Demo seed data ─────────────────────────────────────── */
const DEMO_ACTIVITIES: Record<string, ActivityCard[]> = {
  morning: [
    {
      id: generateId(), name: 'Calangute Beach Walk', category: 'nature',
      description: 'Start your morning with a peaceful walk along Goa\'s most popular beach.', address: 'Calangute Beach, North Goa',
      location: { lat: 15.5440, lng: 73.7527 }, duration: 90, estimatedCost: 0, source: 'ai',
      tags: ['Beach', 'Morning', 'Free'],
    },
    {
      id: generateId(), name: 'Fisherman\'s Wharf Breakfast', category: 'restaurant',
      description: 'Iconic riverside restaurant serving fresh Goan breakfast with river views.', address: 'Cavelossim, South Goa',
      location: { lat: 15.1558, lng: 73.9358 }, duration: 60, estimatedCost: 350, source: 'ai',
      tags: ['Breakfast', 'Seafood', 'River view'], rating: 4.4,
    },
  ],
  afternoon: [
    {
      id: generateId(), name: 'Old Goa Churches', category: 'attraction',
      description: 'UNESCO World Heritage Site — visit the Basilica of Bom Jesus and Se Cathedral.', address: 'Old Goa',
      location: { lat: 15.5050, lng: 73.9121 }, duration: 120, estimatedCost: 100, source: 'places',
      tags: ['Heritage', 'UNESCO', 'Architecture'], rating: 4.7, isWheelchairAccessible: true,
    },
  ],
  evening: [
    {
      id: generateId(), name: 'Sunset at Fort Aguada', category: 'attraction',
      description: '17th-century Portuguese fort with panoramic sunset views of the Arabian Sea.', address: 'Sinquerim, Bardez, Goa',
      location: { lat: 15.4956, lng: 73.7705 }, duration: 90, estimatedCost: 50, source: 'places',
      tags: ['Sunset', 'History', 'Views'], rating: 4.5,
    },
  ],
};

const DEMO_DAYS: ItineraryDay[] = [
  { id: 'day-1', dayNumber: 1, date: '2026-06-15', morning: [...DEMO_ACTIVITIES.morning], afternoon: [...DEMO_ACTIVITIES.afternoon], evening: [...DEMO_ACTIVITIES.evening] },
  { id: 'day-2', dayNumber: 2, date: '2026-06-16', morning: [], afternoon: [], evening: [] },
  { id: 'day-3', dayNumber: 3, date: '2026-06-17', morning: [], afternoon: [], evening: [] },
];

const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  restaurant: '🍽️', attraction: '🏛️', hotel: '🏨', transport: '🚗',
  experience: '🎭', shopping: '🛍️', nightlife: '🎵', nature: '🌿', wellness: '🧘',
};

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  restaurant: '#E76F51', attraction: '#1B4332', hotel: '#4361EE', transport: '#6B6560',
  experience: '#E9C46A', shopping: '#F4845F', nightlife: '#7B2D8B', nature: '#2D6A4F', wellness: '#0096C7',
};

/* ─── Sortable Activity Card ─────────────────────────────── */
interface SortableActivityProps {
  activity:   ActivityCard;
  dayId:      string;
  slot:       TimeSlot;
  onDelete:   (dayId: string, slot: TimeSlot, id: string) => void;
}

const SortableActivity: React.FC<SortableActivityProps> = ({ activity, dayId, slot, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id });
  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.5 : 1,
    zIndex:     isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="listitem"
    >
      <div
        style={{
          background:   'var(--color-surface)',
          border:       '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding:      'var(--space-3) var(--space-4)',
          display:      'flex',
          alignItems:   'center',
          gap:          'var(--space-3)',
          cursor:       isDragging ? 'grabbing' : 'grab',
          boxShadow:    isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
          transition:   'box-shadow var(--transition-fast)',
          borderLeft:   `3px solid ${CATEGORY_COLORS[activity.category]}`,
        }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          aria-label={`Drag ${activity.name} to reorder`}
          style={{
            background:   'transparent',
            border:       'none',
            cursor:       'grab',
            color:        'var(--color-text-muted)',
            padding:      'var(--space-1)',
            display:      'flex',
            alignItems:   'center',
            fontSize:     '1rem',
            flexShrink:   0,
          }}
        >
          ⠿
        </button>

        {/* Category icon */}
        <div style={{ fontSize: '1.25rem', flexShrink: 0 }} aria-hidden="true">
          {CATEGORY_ICONS[activity.category]}
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activity.name}
            </span>
            {activity.rating && (
              <span style={{ color: '#E9C46A', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>★ {activity.rating}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{activity.duration} min</span>
            {activity.estimatedCost !== undefined && activity.estimatedCost > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>· {formatCurrency(activity.estimatedCost)}</span>
            )}
            {activity.source === 'ai' && (
              <span className="badge badge-accent" style={{ fontSize: '0.6rem' }}>AI</span>
            )}
            {activity.isWheelchairAccessible && (
              <span title="Wheelchair accessible" style={{ fontSize: '0.75rem' }} aria-label="Wheelchair accessible">♿</span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(dayId, slot, activity.id)}
          aria-label={`Remove ${activity.name}`}
          style={{
            background:   'transparent',
            border:       'none',
            cursor:       'pointer',
            color:        'var(--color-text-muted)',
            padding:      'var(--space-1)',
            borderRadius: 'var(--radius-sm)',
            fontSize:     '1rem',
            flexShrink:   0,
            transition:   'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          ×
        </button>
      </div>
    </div>
  );
};

/* ─── Time Block ─────────────────────────────────────────── */
interface TimeBlockProps {
  label:      string;
  slot:       TimeSlot;
  activities: ActivityCard[];
  dayId:      string;
  onDelete:   (dayId: string, slot: TimeSlot, id: string) => void;
  onAutoFill: (dayId: string, slot: TimeSlot) => void;
}

const TimeBlock: React.FC<TimeBlockProps> = ({ label, slot, activities, dayId, onDelete, onAutoFill }) => {
  const slotTimes: Record<TimeSlot, string> = {
    morning:   '6:00 – 12:00',
    afternoon: '12:00 – 18:00',
    evening:   '18:00 – 23:00',
  };

  return (
    <section
      aria-label={`${label} activities`}
      style={{
        background:   'var(--color-surface-alt)',
        borderRadius: 'var(--radius-md)',
        padding:      'var(--space-4)',
        minHeight:    120,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{label}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>{slotTimes[slot]}</span>
        </div>
        <button
          onClick={() => onAutoFill(dayId, slot)}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)' }}
          aria-label={`Auto-fill ${label} slot with AI suggestions`}
        >
          ✨ Auto-fill
        </button>
      </div>

      <SortableContext items={activities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div role="list" aria-label={`${label} activity list`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {activities.map((activity) => (
            <SortableActivity
              key={activity.id}
              activity={activity}
              dayId={dayId}
              slot={slot}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      {activities.length === 0 && (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          height:         60,
          border:         '2px dashed var(--color-border)',
          borderRadius:   'var(--radius-sm)',
          color:          'var(--color-text-muted)',
          fontSize:       '0.8125rem',
          marginTop:      'var(--space-2)',
        }}>
          Drop activities here or click Auto-fill
        </div>
      )}
    </section>
  );
};

/* ─── Constraint Banner ──────────────────────────────────── */
interface ConstraintBannerProps { violations: ReturnType<typeof validateDay> }
const ConstraintBanner: React.FC<ConstraintBannerProps> = ({ violations }) => {
  if (violations.length === 0) return null;
  return (
    <aside
      role="alert"
      aria-label="Itinerary constraint warnings"
      style={{
        background:   'rgba(231,111,81,0.1)',
        border:       '1px solid var(--color-highlight)',
        borderRadius: 'var(--radius-md)',
        padding:      'var(--space-4)',
        marginBottom: 'var(--space-4)',
      }}
    >
      <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-highlight)', marginBottom: 'var(--space-2)' }}>
        ⚠️ {violations.length} constraint{violations.length > 1 ? 's' : ''} detected
      </h3>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {violations.slice(0, 3).map((v) => (
          <li key={v.id} style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {v.severity === 'error' ? '🔴' : '🟡'} {v.message}
          </li>
        ))}
      </ul>
    </aside>
  );
};

/* ─── Main Planner ──────────────────────────────────────── */
const Planner: React.FC = () => {
  const [params] = useSearchParams();
  const { preferences } = usePreferencesStore();
  const {
    addActivity, removeActivity, reorderActivities,
  } = useItineraryStore();

  const [days, setDays]           = useState<ItineraryDay[]>(DEMO_DAYS);
  const [selectedDay, setSelectedDay] = useState(0);
  const [mapVisible, setMapVisible]   = useState(false);
  const [totalBudget]                 = useState(40000);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const currentDay = days[selectedDay];
  const violations = currentDay ? validateDay(currentDay, {
    mobilityNeed:     preferences.mobility,
    dailyBudgetLimit: totalBudget / days.length,
  }) : [];

  // Budget calculation
  const daySpend = (day: ItineraryDay) =>
    [...day.morning, ...day.afternoon, ...day.evening]
      .reduce((sum, a) => sum + (a.estimatedCost ?? 0), 0);
  const totalSpend = days.reduce((sum, d) => sum + daySpend(d), 0);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentDay) return;
    const slots: TimeSlot[] = ['morning', 'afternoon', 'evening'];
    for (const slot of slots) {
      const acts = currentDay[slot];
      const oldIdx = acts.findIndex((a) => a.id === active.id);
      const newIdx = acts.findIndex((a) => a.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        const reordered = arrayMove(acts, oldIdx, newIdx);
        setDays((prev) =>
          prev.map((d, i) =>
            i === selectedDay ? { ...d, [slot]: reordered } : d
          )
        );
        return;
      }
    }
  }, [currentDay, selectedDay]);

  const handleDelete = (dayId: string, slot: TimeSlot, actId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, [slot]: d[slot].filter((a) => a.id !== actId) }
          : d
      )
    );
    toast.success('Activity removed');
  };

  const handleAutoFill = async (dayId: string, slot: TimeSlot) => {
    toast.loading('Gemini is filling your day…', { id: 'autofill' });
    await new Promise((r) => setTimeout(r, 1200));
    const demoFill: ActivityCard = {
      id:          generateId(),
      name:        slot === 'morning' ? 'Sunrise Yoga Session' : slot === 'afternoon' ? 'Local Market Tour' : 'Beachside Dinner',
      category:    slot === 'morning' ? 'wellness' : slot === 'afternoon' ? 'experience' : 'restaurant',
      description: 'AI-suggested activity based on your preferences.',
      address:     'Goa, India',
      location:    { lat: 15.2993, lng: 74.1240 },
      duration:    90,
      estimatedCost: slot === 'morning' ? 500 : slot === 'afternoon' ? 200 : 800,
      source:      'ai',
      tags:        ['AI Suggestion'],
    };
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, [slot]: [...d[slot], demoFill] } : d
      )
    );
    analytics.dayAutoFilled(days.findIndex((d) => d.id === dayId) + 1);
    toast.success('Day auto-filled by Gemini!', { id: 'autofill' });
  };

  const handleAddDay = () => {
    const newDay: ItineraryDay = {
      id:        generateId(),
      dayNumber: days.length + 1,
      morning:   [], afternoon: [], evening: [],
    };
    setDays((prev) => [...prev, newDay]);
    setSelectedDay(days.length);
    toast.success(`Day ${days.length + 1} added`);
  };

  return (
    <div style={{ height: 'calc(100vh - var(--topbar-height))', display: 'flex', flexDirection: 'column' }}>

      {/* ── Planner Topbar ── */}
      <div style={{
        background:  'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding:     'var(--space-3) var(--space-6)',
        display:     'flex',
        alignItems:  'center',
        gap:         'var(--space-4)',
        flexShrink:  0,
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 2 }}>
            🏖️ Goa, India
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Jun 15 – Jun 22 · {days.length} days · {formatCurrency(totalSpend)} / {formatCurrency(totalBudget)}
          </p>
        </div>
        <div style={{ flex: 1 }} />

        {/* Budget bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 180 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Budget</span>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min((totalSpend / totalBudget) * 100, 100)}%`,
                background: totalSpend > totalBudget ? 'var(--color-error)' : 'var(--color-accent)',
              }}
              role="progressbar"
              aria-valuenow={totalSpend}
              aria-valuemin={0}
              aria-valuemax={totalBudget}
              aria-label={`Budget: ${formatCurrency(totalSpend)} of ${formatCurrency(totalBudget)}`}
            />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: totalSpend > totalBudget ? 'var(--color-error)' : 'var(--color-accent)', whiteSpace: 'nowrap' }}>
            {Math.round((totalSpend / totalBudget) * 100)}%
          </span>
        </div>

        <button onClick={() => setMapVisible(!mapVisible)} className={`btn btn-sm ${mapVisible ? 'btn-primary' : 'btn-ghost'}`}>
          🗺️ {mapVisible ? 'Hide Map' : 'Show Map'}
        </button>
        <button className="btn btn-sm btn-secondary">
          📄 Export PDF
        </button>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: mapVisible ? '1fr 420px' : '1fr', overflow: 'hidden' }}>

        {/* Planner Panel */}
        <div style={{ overflowY: 'auto', padding: 'var(--space-6)' }}>
          {/* Day tabs */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
            {days.map((day, i) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(i)}
                aria-selected={selectedDay === i}
                style={{
                  padding:      'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border:       '2px solid',
                  borderColor:  selectedDay === i ? 'var(--color-accent)' : 'var(--color-border)',
                  background:   selectedDay === i ? 'var(--color-accent)' : 'var(--color-surface)',
                  color:        selectedDay === i ? 'white' : 'var(--color-text-muted)',
                  cursor:       'pointer',
                  fontFamily:   'var(--font-body)',
                  fontWeight:   700,
                  fontSize:     '0.875rem',
                  whiteSpace:   'nowrap',
                  transition:   'all var(--transition-fast)',
                  minHeight:    44,
                }}
              >
                <div>Day {day.dayNumber}</div>
                <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: 2 }}>
                  {formatCurrency(daySpend(day))}
                </div>
              </button>
            ))}
            <button
              onClick={handleAddDay}
              style={{
                padding:      'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border:       '2px dashed var(--color-border)',
                background:   'transparent',
                color:        'var(--color-text-muted)',
                cursor:       'pointer',
                fontSize:     '0.875rem',
                fontFamily:   'var(--font-body)',
                whiteSpace:   'nowrap',
                minHeight:    44,
                transition:   'all var(--transition-fast)',
              }}
              aria-label="Add a new day"
            >
              + Add Day
            </button>
          </div>

          {/* Constraint banner */}
          <ConstraintBanner violations={violations} />

          {/* Time blocks */}
          {currentDay && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {(['morning', 'afternoon', 'evening'] as TimeSlot[]).map((slot) => {
                  const labels: Record<TimeSlot, string> = { morning: '☀️ Morning', afternoon: '🌤️ Afternoon', evening: '🌙 Evening' };
                  return (
                    <TimeBlock
                      key={slot}
                      label={labels[slot]}
                      slot={slot}
                      activities={currentDay[slot]}
                      dayId={currentDay.id}
                      onDelete={handleDelete}
                      onAutoFill={handleAutoFill}
                    />
                  );
                })}
              </div>
            </DndContext>
          )}
        </div>

        {/* Map Panel */}
        {mapVisible && (
          <div
            role="application"
            aria-label="Trip map showing your itinerary locations"
            style={{
              background:  'var(--color-surface-alt)',
              borderLeft:  '1px solid var(--color-border)',
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap:         'var(--space-4)',
              overflowY:   'auto',
            }}
          >
            {/* Visually-hidden list for screen readers */}
            <ul className="sr-only">
              {currentDay && [...currentDay.morning, ...currentDay.afternoon, ...currentDay.evening].map((a) => (
                <li key={a.id}>{a.name} — {a.address}</li>
              ))}
            </ul>

            {/* Map placeholder — in production uses Google Maps JS API */}
            <div style={{
              width:        '100%',
              height:       '100%',
              background:   'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap:          'var(--space-4)',
              position:     'relative',
            }}>
              <div style={{ fontSize: '3rem' }}>🗺️</div>
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <p style={{ fontWeight: 700, color: 'var(--color-accent)', marginBottom: 'var(--space-2)' }}>
                  Google Maps Integration
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: 280 }}>
                  Add your Google Maps API key to see activity markers, route polylines, and Street View previews.
                </p>
                <code style={{
                  display:      'block',
                  marginTop:    'var(--space-3)',
                  background:   'var(--color-surface)',
                  padding:      'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize:     '0.75rem',
                  fontFamily:   'var(--font-mono)',
                  color:        'var(--color-accent)',
                }}>
                  VITE_MAPS_API_KEY=your_key
                </code>
              </div>

              {/* Activity markers */}
              {currentDay && [...currentDay.morning, ...currentDay.afternoon, ...currentDay.evening].map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    position:  'absolute',
                    top:       `${20 + i * 14}%`,
                    left:      `${25 + (i % 3) * 20}%`,
                    background: CATEGORY_COLORS[a.category],
                    color:     'white',
                    borderRadius: 'var(--radius-full)',
                    padding:   '4px 10px',
                    fontSize:  '0.75rem',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-md)',
                    display:   'flex',
                    alignItems: 'center',
                    gap:       '4px',
                    cursor:    'pointer',
                    animation: `fadeInUp 300ms ease-out ${i * 100}ms both`,
                    whiteSpace: 'nowrap',
                    maxWidth:  140,
                    overflow:  'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={a.name}
                >
                  {CATEGORY_ICONS[a.category]} {a.name.slice(0, 15)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Planner;
