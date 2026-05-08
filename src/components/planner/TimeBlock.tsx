import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ActivityCard, TimeSlot } from '@/types';
import { SortableActivity } from './SortableActivity';

export interface TimeBlockProps {
  label:      string;
  slot:       TimeSlot;
  activities: ActivityCard[];
  dayId:      string;
  onDelete:   (dayId: string, slot: TimeSlot, id: string) => void;
  onAutoFill: (dayId: string, slot: TimeSlot) => void;
}

export const TimeBlock: React.FC<TimeBlockProps> = ({ label, slot, activities, dayId, onDelete, onAutoFill }) => {
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
