/**
 * useValidation Hook Tests
 *
 * Story Reference: 22-1 Task 4.6
 * Tests filtering of validation warnings by slide, section, and deck level.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useValidation } from '../../src/webview/plan/hooks/useValidation';
import { PlanProvider, usePlan } from '../../src/webview/plan/context/PlanContext';
import type { ValidationWarning, PlanData } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockPlan: PlanData = {
  deck_name: 'Test',
  created: '2026-01-01',
  last_modified: '2026-01-01',
  audience: { description: 'Test', knowledge_level: 'intermediate', priorities: [] },
  purpose: 'Testing',
  desired_outcome: 'Pass',
  key_message: 'Test',
  storyline: { opening_hook: '', tension: '', resolution: '', call_to_action: '' },
  recurring_themes: [],
  agenda_sections: [
    { id: 'section-1', title: 'Intro', narrative_role: 'hook' },
  ],
  slides: [
    {
      number: 1,
      description: 'Slide 1',
      suggested_template: 'title',
      status: 'pending',
      storyline_role: 'opening',
      agenda_section_id: 'section-1',
      key_points: ['A'],
    },
  ],
};

const mixedWarnings: ValidationWarning[] = [
  { slideNumber: 1, type: 'missing-field', message: 'Slide 1: Description empty', severity: 'warning' },
  { slideNumber: 1, type: 'low-confidence', message: 'Slide 1: Low confidence (30%)', severity: 'warning' },
  { slideNumber: 2, type: 'missing-field', message: 'Slide 2: Template empty', severity: 'warning' },
  { sectionId: 'section-3', type: 'empty-section', message: "Section 'Empty' has no slides", severity: 'warning' },
  { type: 'missing-cta', message: 'No CTA slide', severity: 'warning' },
];

// =============================================================================
// Helper: Wrapper that sets up PlanProvider with initial warnings
// =============================================================================

function createWrapper(warnings: ValidationWarning[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(PlanProvider, null,
      React.createElement(WarningInjector, { warnings }, children)
    );
  };
}

function WarningInjector({ warnings, children }: { warnings: ValidationWarning[]; children: React.ReactNode }) {
  const { dispatch } = usePlan();
  React.useEffect(() => {
    dispatch({ type: 'SET_PLAN', plan: mockPlan, validationWarnings: warnings });
  }, [dispatch, warnings]);
  return React.createElement(React.Fragment, null, children);
}

// =============================================================================
// Tests
// =============================================================================

describe('useValidation', () => {
  it('returns empty results when no warnings exist', () => {
    const wrapper = createWrapper([]);
    const { result } = renderHook(() => useValidation(), { wrapper });

    expect(result.current.hasWarnings).toBe(false);
    expect(result.current.deckWarnings).toEqual([]);
    expect(result.current.slideWarnings(1)).toEqual([]);
    expect(result.current.sectionWarnings('section-1')).toEqual([]);
  });

  it('filters warnings by slide number', () => {
    const wrapper = createWrapper(mixedWarnings);
    const { result } = renderHook(() => useValidation(), { wrapper });

    const slide1 = result.current.slideWarnings(1);
    expect(slide1).toHaveLength(2);
    expect(slide1.every((w) => w.slideNumber === 1)).toBe(true);

    const slide2 = result.current.slideWarnings(2);
    expect(slide2).toHaveLength(1);
    expect(slide2[0].slideNumber).toBe(2);

    // Non-existent slide
    expect(result.current.slideWarnings(99)).toEqual([]);
  });

  it('filters warnings by section ID', () => {
    const wrapper = createWrapper(mixedWarnings);
    const { result } = renderHook(() => useValidation(), { wrapper });

    const section3 = result.current.sectionWarnings('section-3');
    expect(section3).toHaveLength(1);
    expect(section3[0].type).toBe('empty-section');

    // Non-existent section
    expect(result.current.sectionWarnings('nonexistent')).toEqual([]);
  });

  it('returns deck-level warnings (no slideNumber or sectionId)', () => {
    const wrapper = createWrapper(mixedWarnings);
    const { result } = renderHook(() => useValidation(), { wrapper });

    const deck = result.current.deckWarnings;
    expect(deck).toHaveLength(1);
    expect(deck[0].type).toBe('missing-cta');
  });

  it('hasWarnings is true when warnings exist', () => {
    const wrapper = createWrapper(mixedWarnings);
    const { result } = renderHook(() => useValidation(), { wrapper });
    expect(result.current.hasWarnings).toBe(true);
  });

  it('hasWarnings is false when warnings are empty', () => {
    const wrapper = createWrapper([]);
    const { result } = renderHook(() => useValidation(), { wrapper });
    expect(result.current.hasWarnings).toBe(false);
  });

  it('handles only slide-level warnings (no deck/section)', () => {
    const slideOnly: ValidationWarning[] = [
      { slideNumber: 1, type: 'missing-field', message: 'Test', severity: 'warning' },
    ];
    const wrapper = createWrapper(slideOnly);
    const { result } = renderHook(() => useValidation(), { wrapper });

    expect(result.current.slideWarnings(1)).toHaveLength(1);
    expect(result.current.deckWarnings).toEqual([]);
    expect(result.current.sectionWarnings('section-1')).toEqual([]);
  });

  it('handles only deck-level warnings', () => {
    const deckOnly: ValidationWarning[] = [
      { type: 'missing-cta', message: 'No CTA', severity: 'warning' },
    ];
    const wrapper = createWrapper(deckOnly);
    const { result } = renderHook(() => useValidation(), { wrapper });

    expect(result.current.deckWarnings).toHaveLength(1);
    expect(result.current.slideWarnings(1)).toEqual([]);
  });
});
