/**
 * Tests for StatusDot component.
 * Story Reference: cv-1-4 Task 1 — StatusDot component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusDot } from '../../src/webview/catalog/components/StatusDot';
import type { DeckStatus } from '../../src/shared/types';

function renderStatusDot(status: DeckStatus, className?: string) {
  return render(<StatusDot status={status} className={className} />);
}

describe('StatusDot', () => {
  it('renders with role="img" (AC-3)', () => {
    renderStatusDot('planned');
    expect(screen.getByRole('img')).toBeDefined();
  });

  it.each<[DeckStatus, string]>([
    ['planned', 'Build status: Planned'],
    ['partial', 'Build status: Partially built'],
    ['built', 'Build status: Built'],
    ['error', 'Build status: Error'],
  ])('renders aria-label for %s status (AC-3)', (status, expectedLabel) => {
    renderStatusDot(status);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expectedLabel);
  });

  it.each<[DeckStatus, string]>([
    ['planned', 'status-dot--planned'],
    ['partial', 'status-dot--partial'],
    ['built', 'status-dot--built'],
    ['error', 'status-dot--error'],
  ])('applies correct CSS class for %s status', (status, expectedClass) => {
    renderStatusDot(status);
    expect(screen.getByRole('img').className).toContain(expectedClass);
  });

  it('includes base status-dot class', () => {
    renderStatusDot('built');
    expect(screen.getByRole('img').className).toContain('status-dot');
  });

  it('appends additional className', () => {
    renderStatusDot('built', 'custom-class');
    expect(screen.getByRole('img').className).toContain('custom-class');
  });

  it('trims className when no additional class provided', () => {
    renderStatusDot('built');
    const className = screen.getByRole('img').className;
    expect(className).not.toMatch(/\s$/);
  });
});
