/**
 * Tests for PlanContext and reducer.
 *
 * Story Reference: 18-3 Task 10.2 - Create test for PlanContext
 * AC-18.3.3: App.tsx wraps children with PlanContext provider
 */

import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import {
  PlanProvider,
  usePlan,
  usePlanData,
  useSelectedSlide,
  useTemplates,
  useTheme,
  useValidationWarnings,
} from '../../src/webview/plan/context/PlanContext';
import type {
  PlanData,
  TemplateCatalogEntry,
  ThemeConfig,
  TemplateScore,
  ValidationWarning,
} from '../../src/shared/types';

// Helper component to test the context
function TestConsumer(): React.ReactElement {
  const { state, dispatch } = usePlan();
  return (
    <div>
      <span data-testid="plan-loaded">{state.plan ? 'yes' : 'no'}</span>
      <span data-testid="slide-count">{state.plan?.slides?.length ?? 0}</span>
      <span data-testid="template-count">{state.templates.length}</span>
      <span data-testid="selected-slide">{state.selectedSlide ?? 'none'}</span>
      <span data-testid="theme-loaded">{state.theme ? 'yes' : 'no'}</span>
      <button
        data-testid="set-plan"
        onClick={() =>
          dispatch({
            type: 'SET_PLAN',
            plan: mockPlan,
            validationWarnings: [],
          })
        }
      >
        Set Plan
      </button>
      <button
        data-testid="set-templates"
        onClick={() =>
          dispatch({
            type: 'SET_TEMPLATES',
            templates: mockTemplates,
          })
        }
      >
        Set Templates
      </button>
      <button
        data-testid="set-theme"
        onClick={() =>
          dispatch({
            type: 'SET_THEME',
            theme: mockTheme,
          })
        }
      >
        Set Theme
      </button>
      <button
        data-testid="select-slide"
        onClick={() =>
          dispatch({
            type: 'SELECT_SLIDE',
            slideNumber: 3,
          })
        }
      >
        Select Slide
      </button>
      <button
        data-testid="set-scores"
        onClick={() =>
          dispatch({
            type: 'SET_CONFIDENCE_SCORES',
            scores: mockScores,
          })
        }
      >
        Set Scores
      </button>
    </div>
  );
}

// Mock data
const mockPlan: PlanData = {
  deck_name: 'Test Deck',
  created: '2026-02-15',
  last_modified: '2026-02-15',
  audience: {
    description: 'Test audience',
    knowledge_level: 'intermediate',
    priorities: ['clarity', 'brevity'],
  },
  purpose: 'Testing',
  desired_outcome: 'Tests pass',
  key_message: 'Test message',
  storyline: {
    opening_hook: 'Hook',
    tension: 'Tension',
    resolution: 'Resolution',
    call_to_action: 'Action',
  },
  recurring_themes: ['theme1'],
  agenda_sections: [
    { id: 'intro', title: 'Introduction', narrative_role: 'opening' },
  ],
  slides: [
    {
      number: 1,
      intent: 'Introduction',
      template: 'title-slide',
      status: 'pending',
      storyline_role: 'hook',
      agenda_section_id: 'intro',
      key_points: ['Point 1'],
      visual_guidance: 'Simple',
      tone: 'professional',
    },
    {
      number: 2,
      intent: 'Overview',
      template: 'content-slide',
      status: 'pending',
      storyline_role: 'context',
      agenda_section_id: 'intro',
      key_points: ['Point 2'],
      visual_guidance: 'Detailed',
      tone: 'professional',
    },
  ],
};

const mockTemplates: TemplateCatalogEntry[] = [
  { id: 't1', name: 'Title Slide', description: 'A title slide', use_cases: ['opening'] },
  { id: 't2', name: 'Content Slide', description: 'A content slide', use_cases: ['content'] },
];

const mockTheme: ThemeConfig = {
  colors: { primary: '#3a61ff', secondary: '#2d50e6' },
};

const mockScores: Record<number, TemplateScore[]> = {
  1: [
    { templateId: 't1', templateName: 'Title Slide', score: 95, tier: 'high' },
    { templateId: 't2', templateName: 'Content Slide', score: 45, tier: 'low' },
  ],
};

const mockWarnings: ValidationWarning[] = [
  { type: 'missing-cta', message: 'Missing CTA slide', severity: 'warning' },
];

describe('PlanContext', () => {
  describe('PlanProvider', () => {
    it('should provide initial state', () => {
      render(
        <PlanProvider>
          <TestConsumer />
        </PlanProvider>
      );

      expect(screen.getByTestId('plan-loaded')).toHaveTextContent('no');
      expect(screen.getByTestId('slide-count')).toHaveTextContent('0');
      expect(screen.getByTestId('template-count')).toHaveTextContent('0');
      expect(screen.getByTestId('selected-slide')).toHaveTextContent('none');
      expect(screen.getByTestId('theme-loaded')).toHaveTextContent('no');
    });

    it('should throw error when usePlan is used outside provider', () => {
      // We need to suppress the error output for this test
      const consoleError = console.error;
      console.error = () => {};

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('usePlan must be used within a PlanProvider');

      console.error = consoleError;
    });
  });

  describe('SET_PLAN action', () => {
    it('should update plan state', () => {
      render(
        <PlanProvider>
          <TestConsumer />
        </PlanProvider>
      );

      act(() => {
        screen.getByTestId('set-plan').click();
      });

      expect(screen.getByTestId('plan-loaded')).toHaveTextContent('yes');
      expect(screen.getByTestId('slide-count')).toHaveTextContent('2');
    });
  });

  describe('SET_TEMPLATES action', () => {
    it('should update templates state', () => {
      render(
        <PlanProvider>
          <TestConsumer />
        </PlanProvider>
      );

      act(() => {
        screen.getByTestId('set-templates').click();
      });

      expect(screen.getByTestId('template-count')).toHaveTextContent('2');
    });
  });

  describe('SET_THEME action', () => {
    it('should update theme state', () => {
      render(
        <PlanProvider>
          <TestConsumer />
        </PlanProvider>
      );

      act(() => {
        screen.getByTestId('set-theme').click();
      });

      expect(screen.getByTestId('theme-loaded')).toHaveTextContent('yes');
    });
  });

  describe('SELECT_SLIDE action', () => {
    it('should update selected slide', () => {
      render(
        <PlanProvider>
          <TestConsumer />
        </PlanProvider>
      );

      act(() => {
        screen.getByTestId('select-slide').click();
      });

      expect(screen.getByTestId('selected-slide')).toHaveTextContent('3');
    });
  });

  describe('SET_CONFIDENCE_SCORES action', () => {
    it('should update confidence scores', () => {
      // Use a custom component to test scores
      function ScoresConsumer(): React.ReactElement {
        const { state, dispatch } = usePlan();
        return (
          <div>
            <span data-testid="has-scores">
              {Object.keys(state.confidenceScores).length > 0 ? 'yes' : 'no'}
            </span>
            <button
              data-testid="set-scores-btn"
              onClick={() =>
                dispatch({
                  type: 'SET_CONFIDENCE_SCORES',
                  scores: mockScores,
                })
              }
            >
              Set Scores
            </button>
          </div>
        );
      }

      render(
        <PlanProvider>
          <ScoresConsumer />
        </PlanProvider>
      );

      expect(screen.getByTestId('has-scores')).toHaveTextContent('no');

      act(() => {
        screen.getByTestId('set-scores-btn').click();
      });

      expect(screen.getByTestId('has-scores')).toHaveTextContent('yes');
    });
  });

  // BR-1.1 AC-7: UPDATE_SLIDE_STATUS action
  describe('UPDATE_SLIDE_STATUS action (BR-1.1)', () => {
    it('should update a specific slide status from pending to built', () => {
      function StatusConsumer(): React.ReactElement {
        const { state, dispatch } = usePlan();
        const slide1Status = state.plan?.slides?.find((s) => s.number === 1)?.status ?? 'none';
        const slide2Status = state.plan?.slides?.find((s) => s.number === 2)?.status ?? 'none';
        return (
          <div>
            <span data-testid="slide-1-status">{slide1Status}</span>
            <span data-testid="slide-2-status">{slide2Status}</span>
            <button
              data-testid="load-plan"
              onClick={() =>
                dispatch({
                  type: 'SET_PLAN',
                  plan: mockPlan,
                  validationWarnings: [],
                })
              }
            >
              Load
            </button>
            <button
              data-testid="update-slide-1"
              onClick={() =>
                dispatch({
                  type: 'UPDATE_SLIDE_STATUS',
                  slideNumber: 1,
                  status: 'built',
                })
              }
            >
              Build Slide 1
            </button>
          </div>
        );
      }

      render(
        <PlanProvider>
          <StatusConsumer />
        </PlanProvider>
      );

      // Load plan first
      act(() => {
        screen.getByTestId('load-plan').click();
      });

      expect(screen.getByTestId('slide-1-status')).toHaveTextContent('pending');
      expect(screen.getByTestId('slide-2-status')).toHaveTextContent('pending');

      // Update slide 1 status
      act(() => {
        screen.getByTestId('update-slide-1').click();
      });

      expect(screen.getByTestId('slide-1-status')).toHaveTextContent('built');
      // Slide 2 should remain unchanged
      expect(screen.getByTestId('slide-2-status')).toHaveTextContent('pending');
    });

    it('should do nothing if plan is not loaded', () => {
      function NoOpConsumer(): React.ReactElement {
        const { state, dispatch } = usePlan();
        return (
          <div>
            <span data-testid="plan-exists">{state.plan ? 'yes' : 'no'}</span>
            <button
              data-testid="update-no-plan"
              onClick={() =>
                dispatch({
                  type: 'UPDATE_SLIDE_STATUS',
                  slideNumber: 1,
                  status: 'built',
                })
              }
            >
              Update
            </button>
          </div>
        );
      }

      render(
        <PlanProvider>
          <NoOpConsumer />
        </PlanProvider>
      );

      // Should not throw when no plan is loaded
      act(() => {
        screen.getByTestId('update-no-plan').click();
      });

      expect(screen.getByTestId('plan-exists')).toHaveTextContent('no');
    });
  });
});

describe('Selector hooks', () => {
  function SelectorConsumer(): React.ReactElement {
    const plan = usePlanData();
    const selected = useSelectedSlide();
    const templates = useTemplates();
    const theme = useTheme();
    const warnings = useValidationWarnings();

    return (
      <div>
        <span data-testid="plan">{plan?.deck_name ?? 'none'}</span>
        <span data-testid="selected">{selected ?? 'none'}</span>
        <span data-testid="templates">{templates.length}</span>
        <span data-testid="theme">{theme ? 'loaded' : 'none'}</span>
        <span data-testid="warnings">{warnings.length}</span>
      </div>
    );
  }

  it('should provide correct values through selector hooks', () => {
    render(
      <PlanProvider>
        <SelectorConsumer />
      </PlanProvider>
    );

    expect(screen.getByTestId('plan')).toHaveTextContent('none');
    expect(screen.getByTestId('selected')).toHaveTextContent('none');
    expect(screen.getByTestId('templates')).toHaveTextContent('0');
    expect(screen.getByTestId('theme')).toHaveTextContent('none');
    expect(screen.getByTestId('warnings')).toHaveTextContent('0');
  });
});
