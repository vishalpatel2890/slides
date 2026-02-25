/**
 * Keyboard Navigation Tests
 *
 * Story Reference: 21-3 - Keyboard-Accessible Slide Movement
 * AC-21.3.1: Alt+Up move
 * AC-21.3.2: Alt+Down move
 * AC-21.3.3: Boundary guard
 * AC-21.3.4: Arrow key grid traversal
 * AC-21.3.5: Tab region navigation
 * AC-21.3.6: Card selection via Enter/Space
 * AC-21.3.7: Card deselection via Escape
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SlideGrid } from '../../src/webview/plan/components/SlideGrid';
import { PlanProvider, usePlan } from '../../src/webview/plan/context/PlanContext';
import type { PlanData, AgendaSection, SlideEntry } from '../../src/shared/types';

// =============================================================================
// Mock useVSCodeApi
// =============================================================================

const mockPostMessage = vi.fn();
vi.mock('../../src/webview/plan/hooks/useVSCodeApi', () => ({
  useVSCodeApi: () => ({
    postMessage: mockPostMessage,
    postEditSlide: vi.fn(),
    onMessage: vi.fn(() => vi.fn()),
  }),
}));

// =============================================================================
// Mock ResizeObserver
// =============================================================================

class ResizeObserverMock {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(): void {
    this.callback([{ contentRect: { width: 800 } } as ResizeObserverEntry], this);
  }
  unobserve(): void {}
  disconnect(): void {}
}

// =============================================================================
// Test Fixtures
// =============================================================================

const sections: AgendaSection[] = [
  { id: 'intro', title: 'Introduction', narrative_role: 'opening' },
  { id: 'body', title: 'Main Content', narrative_role: 'evidence' },
];

const slides: SlideEntry[] = [
  {
    number: 1,
    description: 'Welcome slide',
    suggested_template: 'title-slide',
    status: 'pending',
    storyline_role: 'hook',
    agenda_section_id: 'intro',
    key_points: ['Welcome'],
    tone: 'Warm',
  },
  {
    number: 2,
    description: 'Agenda overview',
    suggested_template: 'content-slide',
    status: 'pending',
    storyline_role: 'context',
    agenda_section_id: 'intro',
    key_points: ['Topics'],
    tone: 'Clear',
  },
  {
    number: 3,
    description: 'Key benefits',
    suggested_template: 'content-slide',
    status: 'pending',
    storyline_role: 'evidence',
    agenda_section_id: 'body',
    key_points: ['Benefit 1'],
    tone: 'Confident',
  },
  {
    number: 4,
    description: 'Case study',
    suggested_template: 'content-slide',
    status: 'pending',
    storyline_role: 'evidence',
    agenda_section_id: 'body',
    key_points: ['Example'],
    tone: 'Persuasive',
  },
];

const mockPlan: PlanData = {
  deck_name: 'Keyboard Nav Test',
  created: '2026-02-16',
  last_modified: '2026-02-16',
  audience: {
    description: 'Test audience',
    knowledge_level: 'intermediate',
    priorities: ['Testing'],
  },
  purpose: 'Testing keyboard navigation',
  desired_outcome: 'All ACs pass',
  key_message: 'Accessibility',
  storyline: {
    opening_hook: 'Hook',
    tension: 'Tension',
    resolution: 'Resolution',
    call_to_action: 'CTA',
  },
  recurring_themes: ['Testing'],
  agenda_sections: sections,
  slides,
};

// =============================================================================
// Helper Components
// =============================================================================

function PlanInitializer({ plan }: { plan: PlanData }): null {
  const { dispatch } = usePlan();
  React.useEffect(() => {
    dispatch({ type: 'SET_PLAN', plan, validationWarnings: [] });
  }, [dispatch, plan]);
  return null;
}

function renderGrid(plan: PlanData = mockPlan) {
  return render(
    <PlanProvider>
      <PlanInitializer plan={plan} />
      <SlideGrid />
    </PlanProvider>
  );
}

/**
 * Helper to move focus to a specific card index via sequential ArrowDown presses.
 * Uses waitFor between events to flush React state updates (focusedIndex).
 * focusedIndex starts at -1, so one ArrowDown moves to card 0, two to card 1, etc.
 */
async function moveFocusTo(grid: HTMLElement, targetIndex: number): Promise<void> {
  // Need (targetIndex + 1) ArrowDown presses from initial -1
  for (let i = 0; i <= targetIndex; i++) {
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    // Wait for React to flush the focusedIndex state update and re-render
    await waitFor(() => {
      const cards = screen.getAllByRole('gridcell');
      expect(document.activeElement).toBe(cards[i]);
    });
  }
}

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

// =============================================================================
// Arrow Key Navigation (AC-21.3.4)
// =============================================================================

describe('Arrow Key Grid Traversal (AC-21.3.4)', () => {
  it('ArrowDown moves focus to next card', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const grid = screen.getByRole('grid');

    // Move to card 0 first (focusedIndex: -1 → 0)
    await moveFocusTo(grid, 0);

    // Press ArrowDown again to move to card 1
    fireEvent.keyDown(grid, { key: 'ArrowDown' });

    await waitFor(() => {
      const cards = screen.getAllByRole('gridcell');
      expect(document.activeElement).toBe(cards[1]);
    });
  });

  it('ArrowUp moves focus to previous card', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const grid = screen.getByRole('grid');

    // Move focus to card 1
    await moveFocusTo(grid, 1);

    // Press ArrowUp
    fireEvent.keyDown(grid, { key: 'ArrowUp' });

    await waitFor(() => {
      const cards = screen.getAllByRole('gridcell');
      expect(document.activeElement).toBe(cards[0]);
    });
  });

  it('Home moves focus to first card', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const grid = screen.getByRole('grid');

    // Move to card 2 first
    await moveFocusTo(grid, 2);

    // Press Home
    fireEvent.keyDown(grid, { key: 'Home' });

    await waitFor(() => {
      const cards = screen.getAllByRole('gridcell');
      expect(document.activeElement).toBe(cards[0]);
    });
  });

  it('End moves focus to last card', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const grid = screen.getByRole('grid');

    // Press End (from focusedIndex -1, goes to last)
    fireEvent.keyDown(grid, { key: 'End' });

    await waitFor(() => {
      const cards = screen.getAllByRole('gridcell');
      expect(document.activeElement).toBe(cards[3]);
    });
  });
});

// =============================================================================
// Alt+Up/Down Reorder (AC-21.3.1, AC-21.3.2, AC-21.3.3)
// =============================================================================

describe('Alt+Arrow Slide Movement (AC-21.3.1, AC-21.3.2, AC-21.3.3)', () => {
  it('Alt+Down sends reorder-slide message to move slide down within section (AC-21.3.2)', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const grid = screen.getByRole('grid');

    // Move focus to card 0 (slide 1, first in "intro" section)
    await moveFocusTo(grid, 0);

    // Press Alt+Down to move slide 1 down (swap with slide 2 in intro section)
    fireEvent.keyDown(grid, { key: 'ArrowDown', altKey: true });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'reorder-slide',
      slideNumber: 1,
      newIndex: 2, // After slide 2 (index 1 + 1 for forward move)
    });
  });

  it('Alt+Up sends reorder-slide message to move slide up within section (AC-21.3.1)', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const grid = screen.getByRole('grid');

    // Move focus to card 1 (slide 2, second in "intro" section)
    await moveFocusTo(grid, 1);

    // Press Alt+Up to move slide 2 up (swap with slide 1 in intro section)
    fireEvent.keyDown(grid, { key: 'ArrowUp', altKey: true });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'reorder-slide',
      slideNumber: 2,
      newIndex: 0, // Swap to index 0 (position of slide 1)
    });
  });

  it('Alt+Up on first slide in section is a no-op (AC-21.3.3)', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const grid = screen.getByRole('grid');

    // Move focus to card 0 (slide 1, first in "intro" section)
    await moveFocusTo(grid, 0);

    // Clear any messages from moveFocusTo
    mockPostMessage.mockClear();

    // Press Alt+Up — should be no-op (boundary guard)
    fireEvent.keyDown(grid, { key: 'ArrowUp', altKey: true });

    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('Alt+Down on last slide in section is a no-op (AC-21.3.3)', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const grid = screen.getByRole('grid');

    // Move focus to card 1 (slide 2, last in "intro" section)
    await moveFocusTo(grid, 1);

    // Clear any messages from moveFocusTo
    mockPostMessage.mockClear();

    // Press Alt+Down — should be no-op (boundary guard)
    fireEvent.keyDown(grid, { key: 'ArrowDown', altKey: true });

    expect(mockPostMessage).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Escape Deselect (AC-21.3.7)
// =============================================================================

describe('Escape Deselect (AC-21.3.7)', () => {
  it('Escape on grid does not crash when no card is selected', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const grid = screen.getByRole('grid');

    // Press Escape without any selection
    fireEvent.keyDown(grid, { key: 'Escape' });

    // Should not crash
    expect(screen.getAllByRole('gridcell').length).toBe(4);
  });
});

// =============================================================================
// Enter/Space Select (AC-21.3.6) — covered by SlideCard.test.tsx
// Tab Region Navigation (AC-21.3.5) — requires full app layout with EditPanel
// =============================================================================

describe('Enter/Space Card Selection (AC-21.3.6)', () => {
  it('Enter on a card triggers selection', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const cards = screen.getAllByRole('gridcell');

    // Press Enter on the first card
    fireEvent.keyDown(cards[0], { key: 'Enter' });

    // The card's onSelect should have been called via SlideCard's handleKeyDown
    // The card should now show as selected (aria-selected="true")
    await waitFor(() => {
      expect(cards[0].getAttribute('aria-selected')).toBe('true');
    });
  });

  it('Space on a card triggers selection', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getAllByRole('gridcell').length).toBe(4);
    });

    const cards = screen.getAllByRole('gridcell');

    // Press Space on the first card
    fireEvent.keyDown(cards[0], { key: ' ' });

    await waitFor(() => {
      expect(cards[0].getAttribute('aria-selected')).toBe('true');
    });
  });
});

// =============================================================================
// ARIA Roles (AC-21.3.4)
// =============================================================================

describe('ARIA Grid Roles', () => {
  it('container has role="grid"', async () => {
    renderGrid();

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeDefined();
    });
  });

  it('cards have role="gridcell"', async () => {
    renderGrid();

    await waitFor(() => {
      const cells = screen.getAllByRole('gridcell');
      expect(cells.length).toBe(4);
    });
  });

  it('grid has tabindex for keyboard focus', async () => {
    renderGrid();

    await waitFor(() => {
      const grid = screen.getByRole('grid');
      expect(grid.getAttribute('tabindex')).toBe('0');
    });
  });

  it('roving tabindex: focused card has tabindex=0, others have -1', async () => {
    renderGrid();

    await waitFor(() => {
      const cards = screen.getAllByRole('gridcell');
      // First card should have tabindex=0 (default focus)
      expect(cards[0].getAttribute('tabindex')).toBe('0');
      // Other cards should have tabindex=-1
      expect(cards[1].getAttribute('tabindex')).toBe('-1');
      expect(cards[2].getAttribute('tabindex')).toBe('-1');
      expect(cards[3].getAttribute('tabindex')).toBe('-1');
    });
  });
});
