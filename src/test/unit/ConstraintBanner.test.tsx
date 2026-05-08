import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConstraintBanner } from '@/components/planner/ConstraintBanner';
import type { ConstraintViolation } from '@/lib/constraints';

describe('ConstraintBanner', () => {
  it('renders nothing when there are no violations', () => {
    const { container } = render(<ConstraintBanner violations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a banner with role alert when violations are present', () => {
    const violations: ConstraintViolation[] = [
      { id: '1', type: 'budget', severity: 'warning', message: 'Over budget', dayId: 'd1' }
    ];
    render(<ConstraintBanner violations={violations} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Over budget');
  });

  it('renders the correct number of constraints text', () => {
    const violations: ConstraintViolation[] = [
      { id: '1', type: 'budget', severity: 'warning', message: 'Over budget', dayId: 'd1' },
      { id: '2', type: 'transit', severity: 'error', message: 'Not enough transit time', dayId: 'd1' }
    ];
    render(<ConstraintBanner violations={violations} />);
    expect(screen.getByText(/2 constraints detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Not enough transit time/i)).toBeInTheDocument();
  });
});
