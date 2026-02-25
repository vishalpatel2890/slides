/**
 * SlideContextMenu Tests
 *
 * Story Reference: 21-3 Task 4 - SlideContextMenu component
 * AC-21.3.8: Context menu available via right-click or Shift+F10
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SlideContextMenu } from '../../src/webview/plan/components/SlideContextMenu';
import type { SlideEntry, AgendaSection } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const sections: AgendaSection[] = [
  { id: 'intro', title: 'Introduction', narrative_role: 'opening' },
  { id: 'body', title: 'Main Content', narrative_role: 'evidence' },
  { id: 'closing', title: 'Conclusion', narrative_role: 'closing' },
];

const slide: SlideEntry = {
  number: 1,
  description: 'Welcome slide',
  suggested_template: 'title-slide',
  status: 'pending',
  storyline_role: 'hook',
  agenda_section_id: 'intro',
  key_points: ['Welcome'],
  tone: 'Warm',
};

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Rendering
// =============================================================================

describe('SlideContextMenu - Rendering', () => {
  it('renders children', () => {
    render(
      <SlideContextMenu slide={slide} sections={sections} onMoveToSection={vi.fn()}>
        <div data-testid="child">Slide card</div>
      </SlideContextMenu>
    );

    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('renders a hidden trigger button with aria-label', () => {
    const { container } = render(
      <SlideContextMenu slide={slide} sections={sections} onMoveToSection={vi.fn()}>
        <div>Slide card</div>
      </SlideContextMenu>
    );

    const trigger = container.querySelector('button[aria-label="Context menu for slide 1"]');
    expect(trigger).toBeDefined();
    expect(trigger?.getAttribute('tabindex')).toBe('-1');
  });
});

// =============================================================================
// Right-click Opens Menu (AC-21.3.8)
// =============================================================================

describe('SlideContextMenu - Right-click (AC-21.3.8)', () => {
  it('right-click on wrapper opens the context menu', async () => {
    render(
      <SlideContextMenu slide={slide} sections={sections} onMoveToSection={vi.fn()}>
        <div data-testid="child">Slide card</div>
      </SlideContextMenu>
    );

    const child = screen.getByTestId('child');
    // Right-click fires contextmenu on the wrapper div (parent of child)
    fireEvent.contextMenu(child.parentElement!);

    await waitFor(() => {
      expect(screen.getByText('Move to section')).toBeDefined();
    });
  });
});

// =============================================================================
// Shift+F10 Opens Menu (AC-21.3.8)
// =============================================================================

describe('SlideContextMenu - Shift+F10 Keyboard (AC-21.3.8)', () => {
  it('Shift+F10 on wrapper opens the context menu', async () => {
    render(
      <SlideContextMenu slide={slide} sections={sections} onMoveToSection={vi.fn()}>
        <div data-testid="child">Slide card</div>
      </SlideContextMenu>
    );

    const child = screen.getByTestId('child');
    fireEvent.keyDown(child.parentElement!, { key: 'F10', shiftKey: true });

    await waitFor(() => {
      expect(screen.getByText('Move to section')).toBeDefined();
    });
  });

  it('F10 without Shift does not open the menu', () => {
    render(
      <SlideContextMenu slide={slide} sections={sections} onMoveToSection={vi.fn()}>
        <div data-testid="child">Slide card</div>
      </SlideContextMenu>
    );

    const child = screen.getByTestId('child');
    fireEvent.keyDown(child.parentElement!, { key: 'F10', shiftKey: false });

    expect(screen.queryByText('Move to section')).toBeNull();
  });
});

// =============================================================================
// Section Filtering
// =============================================================================

describe('SlideContextMenu - Section Filtering', () => {
  it('filters out current section from available sections', async () => {
    render(
      <SlideContextMenu slide={slide} sections={sections} onMoveToSection={vi.fn()}>
        <div data-testid="child">Slide card</div>
      </SlideContextMenu>
    );

    // Open the menu
    fireEvent.contextMenu(screen.getByTestId('child').parentElement!);

    await waitFor(() => {
      expect(screen.getByText('Move to section')).toBeDefined();
    });

    // Click the submenu trigger to open the submenu (pointerMove/pointerEnter
    // don't reliably open Radix submenus in jsdom)
    fireEvent.click(screen.getByText('Move to section'));

    // Should show other sections but NOT the slide's own section
    await waitFor(() => {
      expect(screen.getByText('Main Content')).toBeDefined();
      expect(screen.getByText('Conclusion')).toBeDefined();
    });
    expect(screen.queryByText('Introduction')).toBeNull();
  });

  it('shows disabled message when slide is in the only section', async () => {
    const singleSection: AgendaSection[] = [
      { id: 'intro', title: 'Introduction', narrative_role: 'opening' },
    ];

    render(
      <SlideContextMenu slide={slide} sections={singleSection} onMoveToSection={vi.fn()}>
        <div data-testid="child">Slide card</div>
      </SlideContextMenu>
    );

    fireEvent.contextMenu(screen.getByTestId('child').parentElement!);

    await waitFor(() => {
      expect(screen.getByText('No other sections available')).toBeDefined();
    });
  });
});

// =============================================================================
// Move to Section Callback
// =============================================================================

describe('SlideContextMenu - onMoveToSection', () => {
  it('calls onMoveToSection with selected section id', async () => {
    const onMoveToSection = vi.fn();
    render(
      <SlideContextMenu slide={slide} sections={sections} onMoveToSection={onMoveToSection}>
        <div data-testid="child">Slide card</div>
      </SlideContextMenu>
    );

    // Open via right-click
    fireEvent.contextMenu(screen.getByTestId('child').parentElement!);

    await waitFor(() => {
      expect(screen.getByText('Move to section')).toBeDefined();
    });

    // Click submenu trigger to open submenu
    fireEvent.click(screen.getByText('Move to section'));

    await waitFor(() => {
      expect(screen.getByText('Main Content')).toBeDefined();
    });

    // Click a section
    fireEvent.click(screen.getByText('Main Content'));

    expect(onMoveToSection).toHaveBeenCalledWith('body');
  });
});
