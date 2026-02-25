/**
 * SlideCard Component Tests - Outline Style Design
 *
 * Story Reference: 19-4 - UI Polish & Visual Refinements (Redesign)
 * Tests the new outline-style card design with number, title, and bullet points
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlideCard } from '../../src/webview/plan/components/SlideCard';
import { PlanProvider } from '../../src/webview/plan/context/PlanContext';
import type { SlideEntry } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockSlide: SlideEntry = {
  number: 1,
  description: 'Introduce the main topic and capture audience attention with a compelling hook',
  suggested_template: 'title-slide',
  status: 'pending',
  storyline_role: 'hook',
  agenda_section_id: 'intro',
  key_points: ['Main topic introduction', 'Set expectations'],
  design_plan: 'Bold text, minimal imagery',
  tone: 'Confident and engaging',
};

const slideWithManyKeyPoints: SlideEntry = {
  ...mockSlide,
  number: 2,
  key_points: ['Point one', 'Point two', 'Point three', 'Point four'],
};

const slideWithNoKeyPoints: SlideEntry = {
  ...mockSlide,
  number: 3,
  key_points: [],
};

/** Helper to render SlideCard wrapped in PlanProvider */
function renderCard(slide: SlideEntry, props: { selected?: boolean; onSelect?: () => void; onBuild?: (slideNumber: number) => void; onFocus?: () => void; tabIndex?: number } = {}) {
  const { selected = false, onSelect = vi.fn(), ...rest } = props;
  return render(
    <PlanProvider>
      <SlideCard slide={slide} selected={selected} onSelect={onSelect} {...rest} />
    </PlanProvider>
  );
}

// =============================================================================
// Tests - Content Display
// =============================================================================

describe('SlideCard - Content Display (Outline Style)', () => {
  it('renders slide number prominently', () => {
    renderCard(mockSlide);
    expect(screen.getByText('1')).toBeDefined();
  });

  it('renders intent as heading text', () => {
    renderCard(mockSlide);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeDefined();
    expect(heading.textContent).toContain('Introduce the main topic');
  });

  it('renders key points as bullet list', () => {
    renderCard(mockSlide);
    expect(screen.getByText('Main topic introduction')).toBeDefined();
    expect(screen.getByText('Set expectations')).toBeDefined();
  });

  it('renders all key points when multiple exist', () => {
    renderCard(slideWithManyKeyPoints);
    expect(screen.getByText('Point one')).toBeDefined();
    expect(screen.getByText('Point two')).toBeDefined();
    expect(screen.getByText('Point three')).toBeDefined();
    expect(screen.getByText('Point four')).toBeDefined();
  });

  it('shows soft hint when no key points but has intent', () => {
    renderCard(slideWithNoKeyPoints);
    // Soft hint only shows when there IS an intent but no key points
    expect(screen.getByText('No key points yet')).toBeDefined();
  });

  it('handles missing key_points gracefully', () => {
    const slideNoPoints: SlideEntry = { ...mockSlide, key_points: undefined };
    renderCard(slideNoPoints);
    // Shows hint because intent exists
    expect(screen.getByText('No key points yet')).toBeDefined();
  });

  it('handles missing description gracefully', () => {
    const slideNoDesc: SlideEntry = { ...mockSlide, description: undefined as any };
    renderCard(slideNoDesc);
    expect(screen.getByText('Untitled slide')).toBeDefined();
  });

  it('does not show key points hint when both description and key points are missing', () => {
    const emptySlide: SlideEntry = { ...mockSlide, description: undefined as any, key_points: [] };
    renderCard(emptySlide);
    // Should show "Untitled slide" but NOT "No key points yet"
    expect(screen.getByText('Untitled slide')).toBeDefined();
    expect(screen.queryByText('No key points yet')).toBeNull();
  });
});

// =============================================================================
// Tests - Styling
// =============================================================================

describe('SlideCard - Styling (Outline Style)', () => {
  it('has base card styling classes', () => {
    const { container } = renderCard(mockSlide);
    const card = container.querySelector('[role="gridcell"]');
    // 19-4 Enterprise: Sharper corners with rounded-md
    expect(card?.className).toContain('rounded-md');
    expect(card?.className).toContain('bg-[var(--card)]');
    expect(card?.className).toContain('border');
    expect(card?.className).toContain('flex');
  });

  it('has hover lift effect', () => {
    const { container } = renderCard(mockSlide);
    const card = container.querySelector('[role="gridcell"]');
    // 19-4 Enterprise: Subtle lift on hover
    expect(card?.className).toContain('hover:-translate-y-0.5');
    expect(card?.className).toContain('transition-all');
  });

  it('applies selected styles when selected', () => {
    const { container } = renderCard(mockSlide, { selected: true });
    const card = container.querySelector('[role="gridcell"]');
    // 19-4 Enterprise: Clean selected state with primary border
    expect(card?.className).toContain('border-[var(--primary)]');
    expect(card?.className).toContain('shadow-md');
  });

  it('does not apply selected styles when not selected', () => {
    const { container } = renderCard(mockSlide);
    const card = container.querySelector('[role="gridcell"]');
    // Check that selected-specific styles are not present
    expect(card?.className).toContain('border-[var(--border)]'); // Default border
    expect(card?.className).not.toContain('border-[var(--primary)]'); // No selection border
  });

  it('uses horizontal flex layout (number on left, content on right)', () => {
    const { container } = renderCard(mockSlide);
    const card = container.querySelector('[role="gridcell"]');
    expect(card?.className).toContain('flex');
    expect(card?.className).toContain('gap-4');
  });

  it('shows slide number', () => {
    renderCard(mockSlide);
    // 19-4 Enterprise: Simple number display without badge
    expect(screen.getByText('1')).toBeDefined();
  });

  it('highlights number when selected', () => {
    renderCard(mockSlide, { selected: true });
    // 19-4 Enterprise: Number uses primary color when selected
    const number = screen.getByText('1');
    expect(number.className).toContain('text-[var(--primary)]');
  });
});

// =============================================================================
// Tests - ARIA Accessibility
// =============================================================================

describe('SlideCard - ARIA Accessibility', () => {
  it('has role="gridcell"', () => {
    renderCard(mockSlide);
    expect(screen.getByRole('gridcell')).toBeDefined();
  });

  it('has tabindex="0" by default', () => {
    const { container } = renderCard(mockSlide);
    const card = container.querySelector('[role="gridcell"]');
    expect(card?.getAttribute('tabindex')).toBe('0');
  });

  it('accepts custom tabIndex', () => {
    const { container } = renderCard(mockSlide, { tabIndex: -1 });
    const card = container.querySelector('[role="gridcell"]');
    expect(card?.getAttribute('tabindex')).toBe('-1');
  });

  it('has aria-selected attribute', () => {
    const { container } = renderCard(mockSlide, { selected: true });
    const card = container.querySelector('[role="gridcell"]');
    expect(card?.getAttribute('aria-selected')).toBe('true');
  });

  it('sets aria-selected="false" when not selected', () => {
    const { container } = renderCard(mockSlide);
    const card = container.querySelector('[role="gridcell"]');
    expect(card?.getAttribute('aria-selected')).toBe('false');
  });

  it('has aria-label with slide number and intent', () => {
    const { container } = renderCard(mockSlide);
    const card = container.querySelector('[role="gridcell"]');
    expect(card?.getAttribute('aria-label')).toContain('Slide 1');
    expect(card?.getAttribute('aria-label')).toContain('Introduce the main topic');
  });

  it('has fallback aria-label for untitled slides', () => {
    const untitledSlide: SlideEntry = { ...mockSlide, description: undefined as any };
    const { container } = renderCard(untitledSlide);
    const card = container.querySelector('[role="gridcell"]');
    expect(card?.getAttribute('aria-label')).toBe('Slide 1: Untitled slide');
  });
});

// =============================================================================
// Tests - Interactions
// =============================================================================

describe('SlideCard - Interactions', () => {
  it('calls onSelect with slide number when clicked', () => {
    const onSelect = vi.fn();
    renderCard(mockSlide, { onSelect });

    fireEvent.click(screen.getByRole('gridcell'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('calls onSelect when Enter key is pressed', () => {
    const onSelect = vi.fn();
    renderCard(mockSlide, { onSelect });

    fireEvent.keyDown(screen.getByRole('gridcell'), { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('calls onSelect when Space key is pressed', () => {
    const onSelect = vi.fn();
    renderCard(mockSlide, { onSelect });

    fireEvent.keyDown(screen.getByRole('gridcell'), { key: ' ' });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('does not call onSelect for other keys', () => {
    const onSelect = vi.fn();
    renderCard(mockSlide, { onSelect });

    fireEvent.keyDown(screen.getByRole('gridcell'), { key: 'Escape' });
    fireEvent.keyDown(screen.getByRole('gridcell'), { key: 'Tab' });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('calls onFocus when focused', () => {
    const onFocus = vi.fn();
    renderCard(mockSlide, { onFocus });

    fireEvent.focus(screen.getByRole('gridcell'));

    expect(onFocus).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// Tests - Build Status Badge (BR-1.1)
// =============================================================================

describe('SlideCard - Build Status Badge (BR-1.1)', () => {
  const builtSlide: SlideEntry = {
    ...mockSlide,
    status: 'built',
  };

  const pendingSlide: SlideEntry = {
    ...mockSlide,
    status: 'pending',
  };

  it('AC-1: renders Built aria-label when slide status is built', () => {
    const { container } = renderCard(builtSlide);
    const badge = container.querySelector('[aria-label="Built"]');
    expect(badge).not.toBeNull();
  });

  it('AC-2: renders Pending aria-label when slide status is pending', () => {
    const { container } = renderCard(pendingSlide);
    const badge = container.querySelector('[aria-label="Pending"]');
    expect(badge).not.toBeNull();
  });

  it('AC-1: built slide renders CheckCircle2 icon (SVG with polyline)', () => {
    const { container } = renderCard(builtSlide);
    const badge = container.querySelector('[aria-label="Built"]');
    // CheckCircle2 renders as an SVG element
    const svg = badge?.querySelector('svg');
    expect(svg).not.toBeNull();
    // CheckCircle2 has a specific class for success color
    expect(svg?.className.baseVal || svg?.getAttribute('class') || '').toContain('text-[var(--success');
  });

  it('AC-2: pending slide renders Circle icon (SVG)', () => {
    const { container } = renderCard(pendingSlide);
    const badge = container.querySelector('[aria-label="Pending"]');
    const svg = badge?.querySelector('svg');
    expect(svg).not.toBeNull();
    // Circle uses fg-faint color
    expect(svg?.className.baseVal || svg?.getAttribute('class') || '').toContain('text-[var(--fg-faint)]');
  });

  it('AC-3: badge is positioned with absolute positioning in top-right area', () => {
    const { container } = renderCard(builtSlide);
    const badge = container.querySelector('[aria-label="Built"]');
    expect(badge?.className).toContain('absolute');
    expect(badge?.className).toContain('-top-1.5');
    expect(badge?.className).toContain('-right-1.5');
  });

  it('AC-4: badge does not affect card layout elements', () => {
    // Verify card still renders all content with badge present
    renderCard(builtSlide);
    // Slide number still rendered
    expect(screen.getByText('1')).toBeDefined();
    // Description still rendered
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.textContent).toContain('Introduce the main topic');
    // Key points still rendered
    expect(screen.getByText('Main topic introduction')).toBeDefined();
    expect(screen.getByText('Set expectations')).toBeDefined();
  });

  it('AC-5: badge icon uses small w-4 h-4 sizing', () => {
    const { container } = renderCard(builtSlide);
    const badge = container.querySelector('[aria-label="Built"]');
    const svg = badge?.querySelector('svg');
    expect(svg?.className.baseVal || svg?.getAttribute('class') || '').toContain('w-4');
    expect(svg?.className.baseVal || svg?.getAttribute('class') || '').toContain('h-4');
  });
});

// =============================================================================
// Tests - Build Action Button (BR-1.3)
// =============================================================================

describe('SlideCard - Build Action Button (BR-1.3)', () => {
  const onBuild = vi.fn();

  afterEach(() => {
    onBuild.mockReset();
  });

  it('AC-13: renders build button with correct aria-label when onBuild prop is provided', () => {
    const { container } = renderCard(mockSlide, { onBuild });
    const buildButton = container.querySelector('[aria-label="Build slide 1"]');
    expect(buildButton).not.toBeNull();
  });

  it('AC-15: build button is present on pending slides', () => {
    const pendingSlide: SlideEntry = { ...mockSlide, status: 'pending' };
    const { container } = renderCard(pendingSlide, { onBuild });
    const buildButton = container.querySelector('[aria-label="Build slide 1"]');
    expect(buildButton).not.toBeNull();
  });

  it('AC-15: build button is present on built slides', () => {
    const builtSlide: SlideEntry = { ...mockSlide, status: 'built' };
    const { container } = renderCard(builtSlide, { onBuild });
    const buildButton = container.querySelector('[aria-label="Build slide 1"]');
    expect(buildButton).not.toBeNull();
  });

  it('AC-14: clicking build button calls onBuild with correct slideNumber', () => {
    const { container } = renderCard(mockSlide, { onBuild });
    const buildButton = container.querySelector('[aria-label="Build slide 1"]');
    expect(buildButton).not.toBeNull();
    fireEvent.click(buildButton!);
    expect(onBuild).toHaveBeenCalledTimes(1);
    expect(onBuild).toHaveBeenCalledWith(1);
  });

  it('AC-20: clicking build button does NOT trigger card onSelect (stopPropagation)', () => {
    const onSelect = vi.fn();
    const { container } = renderCard(mockSlide, { onSelect, onBuild });
    const buildButton = container.querySelector('[aria-label="Build slide 1"]');
    expect(buildButton).not.toBeNull();
    fireEvent.click(buildButton!);
    // onBuild should fire but onSelect should NOT
    expect(onBuild).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('AC-13: build button has aria-label matching "Build slide N" pattern', () => {
    const slide5: SlideEntry = { ...mockSlide, number: 5 };
    const { container } = renderCard(slide5, { onBuild });
    const buildButton = container.querySelector('[aria-label="Build slide 5"]');
    expect(buildButton).not.toBeNull();
  });

  it('AC-18: build button uses subtle styling with small icon', () => {
    const { container } = renderCard(mockSlide, { onBuild });
    const buildButton = container.querySelector('[aria-label="Build slide 1"]');
    // Button should have opacity-0 for progressive disclosure
    expect(buildButton?.className).toContain('opacity-0');
    // Button should have group-hover reveal
    expect(buildButton?.className).toContain('group-hover/card:opacity-100');
  });

  it('build button renders even without onBuild prop (graceful no-op)', () => {
    const { container } = renderCard(mockSlide);
    // Button should still render (always present per AC-15)
    const buildButton = container.querySelector('[aria-label="Build slide 1"]');
    expect(buildButton).not.toBeNull();
  });
});
