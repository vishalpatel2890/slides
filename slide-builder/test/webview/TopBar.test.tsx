/**
 * TopBar Component Tests
 *
 * Story Reference: 19-3 Task 6.1 - TopBar tests
 * AC-19.3.1: TopBar displays deck name (16px, 600 weight), audience description, purpose text.
 * AC-19.3.2: TopBar includes "Build All" button (outline style) - rendered as disabled placeholder.
 * AC-19.3.6: TopBar uses Inter font, VS Code-native feel.
 * AC-19.3.7: At narrow widths (<800px), deck header shows only deck name.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { TopBar, type TopBarProps } from '../../src/webview/plan/components/TopBar';
import { PlanProvider } from '../../src/webview/plan/context/PlanContext';
import type { AudienceContext, SlideEntry } from '../../src/shared/types';

// Extend expect with axe matchers
expect.extend(matchers);

// =============================================================================
// Test Fixtures
// =============================================================================

const mockAudience: AudienceContext = {
  description: 'Executive team',
  knowledge_level: 'expert',
  priorities: ['ROI', 'Timeline'],
};

const mockAudienceEmpty: AudienceContext = {
  description: '',
  knowledge_level: 'intermediate',
  priorities: [],
};

const defaultProps: TopBarProps = {
  deckName: 'Q1 Strategy Presentation',
  audience: mockAudience,
  purpose: 'Communicate strategic priorities for the upcoming quarter',
};

/** Render TopBar wrapped in PlanProvider (required for useValidation hook) */
function renderTopBar(props: Partial<TopBarProps> = {}) {
  return render(
    <PlanProvider>
      <TopBar {...defaultProps} {...props} />
    </PlanProvider>
  );
}

// =============================================================================
// Basic Rendering Tests (AC-19.3.1)
// =============================================================================

describe('TopBar Rendering (AC-19.3.1)', () => {
  it('renders deck name', () => {
    renderTopBar();
    expect(screen.getByText('Q1 Strategy Presentation')).toBeDefined();
  });

  it('renders deck name as h1 heading', () => {
    renderTopBar();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('Q1 Strategy Presentation');
  });

  it('renders audience description', () => {
    renderTopBar();
    expect(screen.getByText('Executive team')).toBeDefined();
  });

  it('renders purpose text', () => {
    renderTopBar();
    expect(screen.getByText('Communicate strategic priorities for the upcoming quarter')).toBeDefined();
  });

  it('renders Build All button', () => {
    renderTopBar();
    expect(screen.getByRole('button', { name: /build all/i })).toBeDefined();
  });

  it('handles empty audience description gracefully', () => {
    renderTopBar({ audience: mockAudienceEmpty });
    // Should render without crashing
    expect(screen.getByText('Q1 Strategy Presentation')).toBeDefined();
    // Empty audience description should not be in the document
    expect(screen.queryByText('Executive team')).toBeNull();
  });

  it('handles empty purpose gracefully', () => {
    renderTopBar({ purpose: '' });
    // Should render without crashing
    expect(screen.getByText('Q1 Strategy Presentation')).toBeDefined();
  });
});

// =============================================================================
// Typography Tests (AC-19.3.1, AC-19.3.6)
// =============================================================================

describe('TopBar Typography (AC-19.3.1, AC-19.3.6)', () => {
  it('applies 16px font size to deck name', () => {
    renderTopBar();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('text-[16px]');
  });

  it('applies semibold font weight to deck name', () => {
    renderTopBar();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('font-semibold');
  });

  it('applies foreground color to deck name', () => {
    renderTopBar();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('text-[var(--fg)]');
  });

  it('applies secondary color to audience description', () => {
    renderTopBar();
    const audienceText = screen.getByText('Executive team');
    expect(audienceText.className).toContain('text-[var(--fg-secondary)]');
  });
});

// =============================================================================
// Build All Button Tests (AC-19.3.2)
// =============================================================================

describe('TopBar Build All Button (AC-19.3.2, cv-3-4)', () => {
  it('renders Build All button as disabled when onBuildAll not provided', () => {
    renderTopBar();
    const button = screen.getByRole('button', { name: /build all/i });
    expect(button).toHaveProperty('disabled', true);
  });

  it('renders Build All button as enabled when onBuildAll provided (cv-3-4 AC-30)', () => {
    const mockOnBuildAll = vi.fn();
    renderTopBar({ onBuildAll: mockOnBuildAll });
    const button = screen.getByRole('button', { name: /build all/i });
    expect(button).toHaveProperty('disabled', false);
    button.click();
    expect(mockOnBuildAll).toHaveBeenCalledTimes(1);
  });

  it('has outline style - white background', () => {
    renderTopBar();
    const button = screen.getByRole('button', { name: /build all/i });
    expect(button.className).toContain('bg-white');
  });

  it('has outline style - border', () => {
    renderTopBar();
    const button = screen.getByRole('button', { name: /build all/i });
    expect(button.className).toContain('border');
  });

  it('has disabled styles - reduced opacity and not-allowed cursor', () => {
    renderTopBar();
    const button = screen.getByRole('button', { name: /build all/i });
    expect(button.className).toContain('disabled:opacity-50');
    expect(button.className).toContain('disabled:cursor-not-allowed');
  });

  it('calls onBuildAll callback when clicked (cv-3-4)', () => {
    const onBuildAll = vi.fn();
    renderTopBar({ onBuildAll });
    const button = screen.getByRole('button', { name: /build all/i });

    // Button is now enabled when onBuildAll is provided
    fireEvent.click(button);
    expect(onBuildAll).toHaveBeenCalledTimes(1);
  });

  it('has accessible aria-label', () => {
    renderTopBar();
    const button = screen.getByRole('button', { name: /build all slides/i });
    expect(button).toBeDefined();
  });
});

// =============================================================================
// Responsive Behavior Tests (AC-19.3.7)
// =============================================================================

describe('TopBar Responsive Classes (AC-19.3.7)', () => {
  it('audience description has hidden class for narrow viewports', () => {
    renderTopBar();
    const audienceText = screen.getByText('Executive team');
    // hidden at default, visible at md breakpoint
    expect(audienceText.className).toContain('hidden');
    expect(audienceText.className).toContain('md:block');
  });

  it('purpose text has hidden class for narrow viewports', () => {
    renderTopBar();
    const purposeText = screen.getByText('Communicate strategic priorities for the upcoming quarter');
    // hidden at default, visible at lg breakpoint
    expect(purposeText.className).toContain('hidden');
    expect(purposeText.className).toContain('lg:block');
  });

  it('deck name is always visible (no hidden class)', () => {
    renderTopBar();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).not.toContain('hidden');
  });
});

// =============================================================================
// Styling Tests (AC-19.3.6)
// =============================================================================

describe('TopBar Styling (AC-19.3.6)', () => {
  it('has card background', () => {
    const { container } = renderTopBar();
    const topBar = container.firstChild as HTMLElement;
    expect(topBar.className).toContain('bg-[var(--card)]');
  });

  it('has bottom border', () => {
    const { container } = renderTopBar();
    const topBar = container.firstChild as HTMLElement;
    expect(topBar.className).toContain('border-b');
  });

  it('has horizontal padding', () => {
    const { container } = renderTopBar();
    const topBar = container.firstChild as HTMLElement;
    expect(topBar.className).toContain('px-6');
  });

  it('has vertical padding', () => {
    const { container } = renderTopBar();
    const topBar = container.firstChild as HTMLElement;
    expect(topBar.className).toContain('py-4');
  });

  it('accepts custom className', () => {
    const { container } = renderTopBar({ className: 'custom-class' });
    const topBar = container.firstChild as HTMLElement;
    expect(topBar.className).toContain('custom-class');
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('TopBar Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderTopBar();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations with empty audience', async () => {
    const { container } = renderTopBar({ audience: mockAudienceEmpty });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations with empty purpose', async () => {
    const { container } = renderTopBar({ purpose: '' });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('TopBar Edge Cases', () => {
  it('handles very long deck name (truncates)', () => {
    renderTopBar({
      deckName: 'This is an extremely long deck name that should be truncated when it overflows the available space in the header',
    });
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('truncate');
  });

  it('handles null/undefined audience gracefully', () => {
    // TypeScript would prevent this, but test runtime behavior
    renderTopBar({
      audience: null as unknown as AudienceContext,
    });
    // Should render without crashing
    expect(screen.getByText('Q1 Strategy Presentation')).toBeDefined();
  });

  it('handles special characters in deck name', () => {
    const specialName = 'Q1 Strategy & Goals 2024';
    renderTopBar({ deckName: specialName });
    expect(screen.getByText(specialName)).toBeDefined();
  });
});

// =============================================================================
// Edit w/ Claude Button Tests (AC-1, AC-2, AC-6)
// =============================================================================

describe('TopBar Edit w/ Claude Button (AC-1, AC-6)', () => {
  it('renders button with Sparkles icon and "Edit w/ Claude" text when onOpenClaude provided', () => {
    const onOpenClaude = vi.fn();
    renderTopBar({ onOpenClaude });
    const button = screen.getByRole('button', { name: /edit plan with claude/i });
    expect(button).toBeDefined();
    expect(button.textContent).toContain('Edit w/ Claude');
  });

  it('does not render Claude button when onOpenClaude is not provided', () => {
    renderTopBar();
    expect(screen.queryByRole('button', { name: /edit plan with claude/i })).toBeNull();
  });

  it('fires onOpenClaude callback on click (AC-2)', () => {
    const onOpenClaude = vi.fn();
    renderTopBar({ onOpenClaude });
    const button = screen.getByRole('button', { name: /edit plan with claude/i });
    fireEvent.click(button);
    expect(onOpenClaude).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-label for accessibility (AC-6)', () => {
    const onOpenClaude = vi.fn();
    renderTopBar({ onOpenClaude });
    const button = screen.getByRole('button', { name: 'Edit plan with Claude' });
    expect(button).toBeDefined();
  });

  it('has outline styling matching Build All pattern', () => {
    const onOpenClaude = vi.fn();
    renderTopBar({ onOpenClaude });
    const button = screen.getByRole('button', { name: /edit plan with claude/i });
    expect(button.className).toContain('bg-white');
    expect(button.className).toContain('border');
    expect(button.className).toContain('rounded-sm');
  });

  it('has responsive text (hidden at narrow widths)', () => {
    const onOpenClaude = vi.fn();
    renderTopBar({ onOpenClaude });
    const button = screen.getByRole('button', { name: /edit plan with claude/i });
    // The text span should have hidden md:inline classes
    const textSpan = button.querySelector('span');
    expect(textSpan?.className).toContain('hidden');
    expect(textSpan?.className).toContain('md:inline');
  });
});

// =============================================================================
// Deck-Level Warning Banner Tests (AC-22.1.12)
// =============================================================================

describe('TopBar Deck-Level Warning Banner (AC-22.1.12)', () => {
  it('does not render warning banner when no deck-level warnings', () => {
    renderTopBar();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

// =============================================================================
// Build Progress Summary Test Fixtures (BR-1.2)
// =============================================================================

/** Helper to create a minimal SlideEntry for testing */
function makeSlide(number: number, status: 'pending' | 'built'): SlideEntry {
  return {
    number,
    description: `Slide ${number}`,
    status,
    storyline_role: 'body',
    agenda_section_id: 'section-1',
    key_points: ['Point 1'],
  };
}

const mixedSlides: SlideEntry[] = [
  makeSlide(1, 'built'),
  makeSlide(2, 'built'),
  makeSlide(3, 'built'),
  makeSlide(4, 'pending'),
  makeSlide(5, 'pending'),
  makeSlide(6, 'pending'),
  makeSlide(7, 'pending'),
  makeSlide(8, 'pending'),
];

const allPendingSlides: SlideEntry[] = [
  makeSlide(1, 'pending'),
  makeSlide(2, 'pending'),
  makeSlide(3, 'pending'),
  makeSlide(4, 'pending'),
  makeSlide(5, 'pending'),
];

const allBuiltSlides: SlideEntry[] = [
  makeSlide(1, 'built'),
  makeSlide(2, 'built'),
  makeSlide(3, 'built'),
  makeSlide(4, 'built'),
  makeSlide(5, 'built'),
];

// =============================================================================
// Build Progress Summary Tests (BR-1.2 AC-8, AC-9, AC-10, AC-12)
// =============================================================================

describe('TopBar Build Progress Summary (BR-1.2)', () => {
  it('AC-8: displays "M/N slides built" with mixed statuses', () => {
    renderTopBar({ slides: mixedSlides });
    expect(screen.getByText('3/8 slides built')).toBeDefined();
  });

  it('AC-9: displays "0/N slides built" when no slides are built', () => {
    renderTopBar({ slides: allPendingSlides });
    expect(screen.getByText('0/5 slides built')).toBeDefined();
  });

  it('AC-10: displays "N/N slides built" when all slides are built', () => {
    renderTopBar({ slides: allBuiltSlides });
    expect(screen.getByText('5/5 slides built')).toBeDefined();
  });

  it('AC-8: displays "0/0 slides built" with empty slides array', () => {
    renderTopBar({ slides: [] });
    expect(screen.getByText('0/0 slides built')).toBeDefined();
  });

  it('AC-8: displays progress when slides prop is not provided (defaults to empty)', () => {
    renderTopBar();
    expect(screen.getByText('0/0 slides built')).toBeDefined();
  });

  it('AC-10: applies success color class when all slides are built', () => {
    renderTopBar({ slides: allBuiltSlides });
    const progressText = screen.getByText('5/5 slides built');
    expect(progressText.className).toContain('text-[var(--success,#22c55e)]');
  });

  it('AC-8: applies secondary color class when not all slides are built', () => {
    renderTopBar({ slides: mixedSlides });
    const progressText = screen.getByText('3/8 slides built');
    expect(progressText.className).toContain('text-[var(--fg-secondary)]');
  });

  it('AC-12: progress text has hidden md:block responsive classes (collapses at narrow widths)', () => {
    renderTopBar({ slides: mixedSlides });
    const progressText = screen.getByText('3/8 slides built');
    expect(progressText.className).toContain('hidden');
    expect(progressText.className).toContain('md:block');
  });

  it('AC-12: progress text uses whitespace-nowrap to prevent line wrapping', () => {
    renderTopBar({ slides: mixedSlides });
    const progressText = screen.getByText('3/8 slides built');
    expect(progressText.className).toContain('whitespace-nowrap');
  });

  it('AC-12: progress text is inline within existing flex layout (no new row)', () => {
    const { container } = renderTopBar({ slides: mixedSlides });
    const topBar = container.firstChild as HTMLElement;
    // The flex layout should remain the same (items-center, justify-between)
    expect(topBar.className).toContain('flex');
    expect(topBar.className).toContain('items-center');
    // Progress text should be inside the left section (first child of flex container)
    const leftSection = topBar.querySelector('.flex.items-center.gap-4');
    expect(leftSection).not.toBeNull();
    const progressText = screen.getByText('3/8 slides built');
    expect(leftSection!.contains(progressText)).toBe(true);
  });

  it('has accessible aria-label for screen readers', () => {
    renderTopBar({ slides: mixedSlides });
    const progressText = screen.getByLabelText('3 of 8 slides built');
    expect(progressText).toBeDefined();
  });

  it('does not apply success color when 0/0 (empty deck)', () => {
    renderTopBar({ slides: [] });
    const progressText = screen.getByText('0/0 slides built');
    // allBuilt is false when totalCount is 0, so secondary color should apply
    expect(progressText.className).toContain('text-[var(--fg-secondary)]');
    expect(progressText.className).not.toContain('text-[var(--success,#22c55e)]');
  });
});

// =============================================================================
// Build Progress Summary Accessibility Tests (BR-1.2)
// =============================================================================

describe('TopBar Progress Summary Accessibility (BR-1.2)', () => {
  it('has no accessibility violations with progress summary', async () => {
    const { container } = renderTopBar({ slides: mixedSlides });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with all-built progress', async () => {
    const { container } = renderTopBar({ slides: allBuiltSlides });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with empty slides', async () => {
    const { container } = renderTopBar({ slides: [] });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
