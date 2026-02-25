/**
 * PlanContext - Global state management for the Plan Editor webview.
 *
 * Story Reference: 18-3 Task 3 - Create PlanContext and state management
 * Story Reference: 19-2 Task 5 - Add expandedSections state (AC-19.2.8)
 * Architecture Reference: notes/architecture/architecture.md#ADR-005 - useReducer + Context
 *
 * AC-18.3.3: App.tsx wraps children with PlanContext provider
 * AC-19.2.8: Section collapse state persists within webview session
 */

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  PlanData,
  TemplateCatalogEntry,
  ThemeConfig,
  TemplateScore,
  ValidationWarning,
} from '../../../shared/types';
import { getAgendaSections } from '../../../shared/types';

// =============================================================================
// State Interface
// =============================================================================

export interface PlanState {
  /** The current plan data, null until loaded */
  plan: PlanData | null;
  /** Available slide templates from the catalog */
  templates: TemplateCatalogEntry[];
  /** Theme configuration for styling */
  theme: ThemeConfig | null;
  /** Currently selected slide number, null if none selected */
  selectedSlide: number | null;
  /** Confidence scores for each slide's templates */
  confidenceScores: Record<number, TemplateScore[]>;
  /** Validation warnings for the current plan */
  validationWarnings: ValidationWarning[];
  /** Expanded section IDs for accordion state (AC-19.2.8) */
  expandedSections: string[];
}

// =============================================================================
// Actions
// =============================================================================

export type PlanAction =
  | { type: 'SET_PLAN'; plan: PlanData; validationWarnings: ValidationWarning[] }
  | { type: 'SET_TEMPLATES'; templates: TemplateCatalogEntry[] }
  | { type: 'SET_THEME'; theme: ThemeConfig | null }
  | { type: 'SELECT_SLIDE'; slideNumber: number | null }
  | { type: 'SET_CONFIDENCE_SCORES'; scores: Record<number, TemplateScore[]> }
  | { type: 'SET_EXPANDED_SECTIONS'; sectionIds: string[] }
  | { type: 'TOGGLE_SECTION'; sectionId: string }
  | { type: 'UPDATE_SLIDE_STATUS'; slideNumber: number; status: 'pending' | 'built' };

// =============================================================================
// Initial State
// =============================================================================

const initialState: PlanState = {
  plan: null,
  templates: [],
  theme: null,
  selectedSlide: null,
  confidenceScores: {},
  validationWarnings: [],
  expandedSections: [], // Will be initialized with all sections when plan loads
};

// =============================================================================
// Reducer
// =============================================================================

function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case 'SET_PLAN': {
      // When a new plan loads, expand all sections by default (AC-19.2.8)
      // Include 'uncategorized' for slides without valid agenda_section_id
      // Supports both agenda_sections (direct) and agenda.sections (nested) formats
      const agendaSections = getAgendaSections(action.plan);
      const slides = action.plan.slides ?? [];
      const sectionIds = agendaSections.map((s) => s.id);
      const hasUncategorized = slides.some(
        (slide) => !slide.agenda_section_id || !sectionIds.includes(slide.agenda_section_id)
      );
      return {
        ...state,
        plan: action.plan,
        validationWarnings: action.validationWarnings,
        expandedSections: hasUncategorized ? [...sectionIds, 'uncategorized'] : sectionIds,
      };
    }

    case 'SET_TEMPLATES':
      return {
        ...state,
        templates: action.templates,
      };

    case 'SET_THEME':
      return {
        ...state,
        theme: action.theme,
      };

    case 'SELECT_SLIDE':
      return {
        ...state,
        selectedSlide: action.slideNumber,
      };

    case 'SET_CONFIDENCE_SCORES':
      return {
        ...state,
        confidenceScores: action.scores,
      };

    case 'SET_EXPANDED_SECTIONS':
      return {
        ...state,
        expandedSections: action.sectionIds,
      };

    case 'TOGGLE_SECTION': {
      const isExpanded = state.expandedSections.includes(action.sectionId);
      return {
        ...state,
        expandedSections: isExpanded
          ? state.expandedSections.filter((id) => id !== action.sectionId)
          : [...state.expandedSections, action.sectionId],
      };
    }

    // BR-1.1 AC-7: Update a single slide's build status without full plan reload
    case 'UPDATE_SLIDE_STATUS': {
      if (!state.plan) return state;
      return {
        ...state,
        plan: {
          ...state.plan,
          slides: state.plan.slides.map((slide) =>
            slide.number === action.slideNumber
              ? { ...slide, status: action.status }
              : slide
          ),
        },
      };
    }

    default:
      return state;
  }
}

// =============================================================================
// Context
// =============================================================================

interface PlanContextValue {
  state: PlanState;
  dispatch: React.Dispatch<PlanAction>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface PlanProviderProps {
  children: ReactNode;
  /** Optional initial warnings for testing purposes */
  initialWarnings?: ValidationWarning[];
}

export function PlanProvider({ children, initialWarnings }: PlanProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(
    planReducer,
    initialWarnings
      ? { ...initialState, validationWarnings: initialWarnings }
      : initialState
  );

  return (
    <PlanContext.Provider value={{ state, dispatch }}>
      {children}
    </PlanContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access the plan context.
 *
 * @throws Error if used outside of PlanProvider
 * @returns The plan context value with state and dispatch
 */
export function usePlan(): PlanContextValue {
  const context = useContext(PlanContext);

  if (context === null) {
    throw new Error('usePlan must be used within a PlanProvider');
  }

  return context;
}

// =============================================================================
// Selector Hooks (for convenience)
// =============================================================================

/**
 * Get the current plan data.
 */
export function usePlanData(): PlanData | null {
  const { state } = usePlan();
  return state.plan;
}

/**
 * Get the currently selected slide.
 */
export function useSelectedSlide(): number | null {
  const { state } = usePlan();
  return state.selectedSlide;
}

/**
 * Get the available templates.
 */
export function useTemplates(): TemplateCatalogEntry[] {
  const { state } = usePlan();
  return state.templates;
}

/**
 * Get the theme configuration.
 */
export function useTheme(): ThemeConfig | null {
  const { state } = usePlan();
  return state.theme;
}

/**
 * Get validation warnings.
 */
export function useValidationWarnings(): ValidationWarning[] {
  const { state } = usePlan();
  return state.validationWarnings;
}

/**
 * Get expanded sections (AC-19.2.8).
 */
export function useExpandedSections(): string[] {
  const { state } = usePlan();
  return state.expandedSections;
}
