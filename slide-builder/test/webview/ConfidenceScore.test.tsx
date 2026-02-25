/**
 * ConfidenceScore Component Tests
 *
 * Story Reference: 20-2 Task 1.4 - Badge variant tests
 * AC-20.2.4: Badge colors - Green >=80%, Amber 50-79%, Red <50%
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfidenceScore, scoreTier } from '../../src/webview/plan/components/ConfidenceScore';

// =============================================================================
// Tests - scoreTier helper
// =============================================================================

describe('scoreTier', () => {
  it('returns high for scores >= 80', () => {
    expect(scoreTier(80)).toBe('high');
    expect(scoreTier(100)).toBe('high');
    expect(scoreTier(95)).toBe('high');
  });

  it('returns medium for scores 50-79', () => {
    expect(scoreTier(50)).toBe('medium');
    expect(scoreTier(79)).toBe('medium');
    expect(scoreTier(65)).toBe('medium');
  });

  it('returns low for scores < 50', () => {
    expect(scoreTier(49)).toBe('low');
    expect(scoreTier(0)).toBe('low');
    expect(scoreTier(30)).toBe('low');
  });
});

// =============================================================================
// Tests - ConfidenceScore Rendering
// =============================================================================

describe('ConfidenceScore', () => {
  it('renders score as percentage text', () => {
    render(<ConfidenceScore score={85} />);
    expect(screen.getByText('85%')).toBeDefined();
  });

  it('rounds decimal scores', () => {
    render(<ConfidenceScore score={85.7} />);
    expect(screen.getByText('86%')).toBeDefined();
  });

  it('has aria-label with score percentage', () => {
    render(<ConfidenceScore score={72} />);
    const badge = screen.getByLabelText('72% confidence');
    expect(badge).toBeDefined();
  });

  // AC-20.2.4: Green for >= 80%
  it('uses green styling for high confidence (AC-20.2.4)', () => {
    const { container } = render(<ConfidenceScore score={85} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('#22c55e');
  });

  // AC-20.2.4: Amber for 50-79%
  it('uses amber styling for medium confidence (AC-20.2.4)', () => {
    const { container } = render(<ConfidenceScore score={65} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('#f59e0b');
  });

  // AC-20.2.4: Red for < 50%
  it('uses red styling for low confidence (AC-20.2.4)', () => {
    const { container } = render(<ConfidenceScore score={30} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('#ef4444');
  });

  it('renders sm size variant', () => {
    const { container } = render(<ConfidenceScore score={50} size="sm" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-[10px]');
  });

  it('renders md size variant (default)', () => {
    const { container } = render(<ConfidenceScore score={50} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-[11px]');
  });

  it('renders 0% score', () => {
    render(<ConfidenceScore score={0} />);
    expect(screen.getByText('0%')).toBeDefined();
  });

  it('renders 100% score', () => {
    render(<ConfidenceScore score={100} />);
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(<ConfidenceScore score={50} className="mt-2" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('mt-2');
  });
});
