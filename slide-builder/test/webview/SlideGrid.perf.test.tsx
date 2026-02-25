/**
 * SlideGrid Performance Tests
 *
 * Story Reference: 19-1 Task 8 - Performance Testing
 * AC-19.1.9: 50-slide grid renders in <500ms
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { SlideGrid } from '../../src/webview/plan/components/SlideGrid';
import { PlanProvider, usePlan } from '../../src/webview/plan/context/PlanContext';
import type { PlanData, SlideEntry } from '../../src/shared/types';

// =============================================================================
// Test Fixtures: Generate 50 slides
// =============================================================================

const storylineRoles: SlideEntry['storyline_role'][] = [
  'hook', 'context', 'evidence', 'detail', 'transition', 'cta',
];

const createSlide = (number: number): SlideEntry => ({
  number,
  intent: `Slide ${number} intent: This is a detailed description of what this slide will cover including key talking points and visual guidance.`,
  template: `template-${(number % 5) + 1}`,
  status: number % 3 === 0 ? 'built' : 'pending',
  storyline_role: storylineRoles[number % storylineRoles.length],
  agenda_section_id: `section-${Math.floor(number / 10) + 1}`,
  key_points: ['Point 1', 'Point 2', 'Point 3'],
  visual_guidance: 'Charts and graphs',
  tone: 'Professional',
});

const create50SlidePlan = (): PlanData => ({
  deck_name: 'Performance Test Deck (50 Slides)',
  created: '2026-02-16T00:00:00Z',
  last_modified: '2026-02-16T00:00:00Z',
  audience: {
    description: 'Performance testers',
    knowledge_level: 'expert',
    priorities: ['Speed', 'Efficiency'],
  },
  purpose: 'Test rendering performance with large slide counts',
  desired_outcome: 'Verify <500ms render time',
  key_message: 'Performance is critical',
  storyline: {
    opening_hook: 'Performance matters',
    tension: 'Large decks can be slow',
    resolution: 'Our grid is fast',
    call_to_action: 'Use the grid confidently',
  },
  recurring_themes: ['Performance', 'Scale'],
  agenda_sections: [
    { id: 'section-1', title: 'Introduction', narrative_role: 'intro' },
    { id: 'section-2', title: 'Main Content', narrative_role: 'body' },
    { id: 'section-3', title: 'Details', narrative_role: 'body' },
    { id: 'section-4', title: 'Examples', narrative_role: 'evidence' },
    { id: 'section-5', title: 'Conclusion', narrative_role: 'outro' },
  ],
  slides: Array.from({ length: 50 }, (_, i) => createSlide(i + 1)),
});

// =============================================================================
// Mock ResizeObserver
// =============================================================================

class ResizeObserverMock {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(): void {
    this.callback(
      [{ contentRect: { width: 1200 } } as ResizeObserverEntry],
      this
    );
  }

  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

// =============================================================================
// Helper: Render SlideGrid with pre-populated plan state
// =============================================================================

interface TestWrapperProps {
  children: React.ReactNode;
}

function TestWrapper({ children }: TestWrapperProps): React.ReactElement {
  return <PlanProvider>{children}</PlanProvider>;
}

function SlideGridWithPlan({ plan }: { plan: PlanData }): React.ReactElement {
  const { dispatch } = usePlan();

  // Dispatch plan on mount
  React.useEffect(() => {
    dispatch({ type: 'SET_PLAN', plan, validationWarnings: [] });
  }, [dispatch, plan]);

  return <SlideGrid />;
}

// =============================================================================
// Performance Tests
// =============================================================================

describe('SlideGrid Performance (AC-19.1.9)', () => {
  it('renders 50 slides in under 500ms', () => {
    const plan50 = create50SlidePlan();

    const startTime = performance.now();

    const { container } = render(
      <TestWrapper>
        <SlideGridWithPlan plan={plan50} />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Verify render completed
    const cards = container.querySelectorAll('[role="gridcell"]');
    expect(cards.length).toBe(50);

    // AC-19.1.9: Must render in <500ms
    console.log(`50-slide grid render time: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(500);
  });

  it('renders 100 slides in under 1000ms (stress test)', () => {
    const plan100: PlanData = {
      ...create50SlidePlan(),
      deck_name: 'Stress Test (100 Slides)',
      slides: Array.from({ length: 100 }, (_, i) => createSlide(i + 1)),
    };

    const startTime = performance.now();

    const { container } = render(
      <TestWrapper>
        <SlideGridWithPlan plan={plan100} />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    const cards = container.querySelectorAll('[role="gridcell"]');
    expect(cards.length).toBe(100);

    console.log(`100-slide grid render time: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(1000);
  });

  it('each SlideCard renders quickly', () => {
    // Test individual card render time
    const slides = Array.from({ length: 10 }, (_, i) => createSlide(i + 1));
    const plan: PlanData = {
      ...create50SlidePlan(),
      slides,
    };

    const startTime = performance.now();

    render(
      <TestWrapper>
        <SlideGridWithPlan plan={plan} />
      </TestWrapper>
    );

    const endTime = performance.now();
    const avgTimePerCard = (endTime - startTime) / 10;

    console.log(`Average time per card: ${avgTimePerCard.toFixed(2)}ms`);
    expect(avgTimePerCard).toBeLessThan(10); // Each card should render in <10ms
  });
});
