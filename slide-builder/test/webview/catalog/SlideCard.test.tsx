/**
 * Tests for SlideCard component (catalog deck detail view).
 * Story Reference: cv-1-6 Task 3 — SlideCard component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SlideCard } from '../../../src/webview/catalog/components/SlideCard';
import type { SlideInfo } from '../../../src/shared/types';

const mockSlide: SlideInfo = {
  number: 3,
  intent: 'Explain the market opportunity with supporting data',
  template: 'two-column',
  status: 'built',
  htmlPath: 'slides/slide-3.html',
};

function renderSlideCard(overrides?: Partial<SlideInfo>) {
  const slide = { ...mockSlide, ...overrides };
  return render(<SlideCard slide={slide} />);
}

describe('SlideCard', () => {
  it('renders slide number (AC-4)', () => {
    renderSlideCard();
    expect(screen.getByText('#3')).toBeDefined();
  });

  it('renders intent text (AC-4)', () => {
    renderSlideCard();
    expect(screen.getByText('Explain the market opportunity with supporting data')).toBeDefined();
  });

  it('renders template badge (AC-4)', () => {
    renderSlideCard();
    expect(screen.getByText('two-column')).toBeDefined();
  });

  it('renders StatusDot with correct status (AC-4)', () => {
    renderSlideCard({ status: 'built' });
    expect(screen.getByRole('img', { name: /Built/ })).toBeDefined();
  });

  it('renders StatusDot for planned status', () => {
    renderSlideCard({ status: 'planned' });
    expect(screen.getByRole('img', { name: /Planned/ })).toBeDefined();
  });

  it('renders StatusDot for error status', () => {
    renderSlideCard({ status: 'error' });
    expect(screen.getByRole('img', { name: /Error/ })).toBeDefined();
  });

  it('has role="listitem"', () => {
    renderSlideCard();
    expect(screen.getByRole('listitem')).toBeDefined();
  });

  it('has aria-label with slide info', () => {
    renderSlideCard();
    expect(screen.getByRole('listitem')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Slide 3'),
    );
  });

  it('omits intent paragraph when intent is undefined', () => {
    const { container } = renderSlideCard({ intent: undefined });
    expect(container.querySelector('.slide-card__intent')).toBeNull();
  });

  it('omits template badge when template is undefined', () => {
    const { container } = renderSlideCard({ template: undefined });
    expect(container.querySelector('.slide-card__template')).toBeNull();
  });

  it('applies slide-card base class', () => {
    const { container } = renderSlideCard();
    expect(container.querySelector('.slide-card')).not.toBeNull();
  });

  it('truncates long intent via CSS class (2-line clamp)', () => {
    const { container } = renderSlideCard({
      intent: 'This is a very long intent that should be truncated by the CSS line-clamp property to show only two lines',
    });
    const intentEl = container.querySelector('.slide-card__intent');
    expect(intentEl).not.toBeNull();
  });
});
