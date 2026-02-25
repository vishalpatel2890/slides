/**
 * ValidationBadge Component Tests
 *
 * Story Reference: 22-1 Task 5.7
 * Tests rendering, aria-label, click handler, tooltip, amber styling.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidationBadge } from '../../src/webview/plan/components/ValidationBadge';
import type { ValidationWarning } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const singleWarning: ValidationWarning[] = [
  { slideNumber: 1, type: 'missing-field', message: 'Slide 1: Description is empty', severity: 'warning' },
];

const multipleWarnings: ValidationWarning[] = [
  { slideNumber: 1, type: 'missing-field', message: 'Slide 1: Description is empty', severity: 'warning' },
  { slideNumber: 1, type: 'missing-field', message: 'Slide 1: Template is empty', severity: 'warning' },
  { slideNumber: 1, type: 'low-confidence', message: 'Slide 1: Low confidence (30%)', severity: 'warning' },
];

// =============================================================================
// Tests
// =============================================================================

describe('ValidationBadge', () => {
  it('renders nothing when warnings array is empty', () => {
    const { container } = render(
      <ValidationBadge warnings={[]} onClick={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders "!" badge when warnings exist', () => {
    render(<ValidationBadge warnings={singleWarning} onClick={vi.fn()} />);
    expect(screen.getByText('!')).toBeDefined();
  });

  it('has correct aria-label for single warning', () => {
    render(<ValidationBadge warnings={singleWarning} onClick={vi.fn()} />);
    expect(screen.getByLabelText('1 warning')).toBeDefined();
  });

  it('has correct aria-label for multiple warnings (plural)', () => {
    render(<ValidationBadge warnings={multipleWarnings} onClick={vi.fn()} />);
    expect(screen.getByLabelText('3 warnings')).toBeDefined();
  });

  it('calls onClick when badge is clicked', () => {
    const handleClick = vi.fn();
    render(<ValidationBadge warnings={singleWarning} onClick={handleClick} />);
    fireEvent.click(screen.getByText('!'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('stops click propagation to prevent card selection', () => {
    const handleClick = vi.fn();
    const handleParentClick = vi.fn();

    render(
      <div onClick={handleParentClick}>
        <ValidationBadge warnings={singleWarning} onClick={handleClick} />
      </div>
    );

    fireEvent.click(screen.getByText('!'));
    expect(handleClick).toHaveBeenCalledOnce();
    expect(handleParentClick).not.toHaveBeenCalled();
  });

  it('applies amber styling classes', () => {
    render(<ValidationBadge warnings={singleWarning} onClick={vi.fn()} />);
    const badge = screen.getByText('!');

    // Check amber background and border classes
    expect(badge.className).toContain('bg-[#fffbeb]');
    expect(badge.className).toContain('border-[#fde68a]');
    expect(badge.className).toContain('text-[#f59e0b]');
  });

  it('is positioned absolute for overlay', () => {
    render(<ValidationBadge warnings={singleWarning} onClick={vi.fn()} />);
    const badge = screen.getByText('!');
    expect(badge.className).toContain('absolute');
  });

  it('renders as a button element', () => {
    render(<ValidationBadge warnings={singleWarning} onClick={vi.fn()} />);
    const badge = screen.getByRole('button', { name: '1 warning' });
    expect(badge).toBeDefined();
    expect(badge.tagName).toBe('BUTTON');
  });
});
