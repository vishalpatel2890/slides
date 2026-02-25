/**
 * ThemeEditorContext - React Context + useReducer state management for Theme Editor.
 *
 * Story Reference: bt-2-2 Task 1 — AC-7 (State Management)
 * Architecture Reference: Pattern 4 — Theme Editor State Management (useReducer pattern)
 * Follows ViewerContext and CatalogContext patterns (ADR decision).
 *
 * Manages: theme data, dirty detection, section expand/collapse state.
 * Actions functional in this story: THEME_LOADED, UPDATE_VALUE, TOGGLE_SECTION.
 * Actions defined but deferred: SAVE_START, SAVE_COMPLETE, REVERT, EXTERNAL_CHANGE (stories 2.3, 2.4).
 */

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { ThemeJson } from '../../../shared/types';

// =============================================================================
// Section Keys — the 7 collapsible sections (brandContext added for BT-4.7)
// =============================================================================

export const SECTION_KEYS = [
  'metadata',
  'brandContext',
  'colors',
  'typography',
  'shapes',
  'components',
  'rhythm',
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

// =============================================================================
// State Interface
// =============================================================================

/**
 * bt-2-2 Task 1.1: ThemeEditorState interface.
 * Architecture Reference: ThemeEditorState tracks theme, savedTheme, exists, isDirty, saving, expandedSections.
 */
export interface ThemeEditorState {
  /** Current (possibly edited) theme data, or null before first load */
  theme: ThemeJson | null;
  /** Last-saved theme data for dirty detection */
  savedTheme: ThemeJson | null;
  /** Whether theme.json exists on disk */
  exists: boolean;
  /** Whether initial theme data has been received from extension host */
  loaded: boolean;
  /** Whether current theme differs from savedTheme */
  isDirty: boolean;
  /** Whether a save operation is in progress (story 2.3) */
  saving: boolean;
  /** Set of expanded section keys */
  expandedSections: Set<string>;
}

// =============================================================================
// Action Types
// =============================================================================

/**
 * bt-2-2 Task 1.1: ThemeEditorAction union type.
 * Architecture Reference: Action types SCREAMING_SNAKE_CASE.
 */
export type ThemeEditorAction =
  | { type: 'THEME_LOADED'; theme: ThemeJson | null; exists: boolean }
  | { type: 'UPDATE_VALUE'; path: string; value: unknown }
  | { type: 'TOGGLE_SECTION'; section: string }
  | { type: 'EXPAND_ALL' }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_COMPLETE'; success: boolean }
  | { type: 'REVERT' }
  | { type: 'EXTERNAL_CHANGE'; theme: ThemeJson };

// =============================================================================
// Set-by-path Utility
// =============================================================================

/**
 * bt-2-2 Task 1.5: Set a deeply nested value using dot-notation path.
 * Creates a new object (immutable update) with the value set at the given path.
 *
 * @example setByPath({ colors: { primary: '#000' } }, 'colors.primary', '#fff')
 * // => { colors: { primary: '#fff' } }
 */
export function setByPath<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown,
): T {
  const keys = path.split('.');
  if (keys.length === 0) return obj;

  // Clone the root
  const result = { ...obj };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    // Clone each level to preserve immutability
    if (current[key] !== null && typeof current[key] === 'object' && !Array.isArray(current[key])) {
      current[key] = { ...current[key] };
    } else {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;

  return result;
}

// =============================================================================
// Get-by-path Utility
// =============================================================================

/**
 * bt-2-3 Task 3.1: Get a deeply nested value using dot-notation path.
 * Complement to setByPath. Returns undefined for missing paths.
 *
 * @example getByPath({ colors: { primary: '#000' } }, 'colors.primary')
 * // => '#000'
 */
export function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

// =============================================================================
// Dirty Detection
// =============================================================================

/**
 * bt-2-2 Task 1.6: Detect if theme has changed from savedTheme.
 * Uses JSON.stringify comparison as specified in architecture.
 */
function computeIsDirty(theme: ThemeJson | null, savedTheme: ThemeJson | null): boolean {
  if (theme === null || savedTheme === null) return false;
  return JSON.stringify(theme) !== JSON.stringify(savedTheme);
}

// =============================================================================
// Initial State
// =============================================================================

/**
 * bt-4-1 Task 1.1: Default expandedSections to metadata-only (collapsed by default).
 * Previously all sections expanded (bt-2-2). Changed per AC-1, AC-2.
 */
const initialState: ThemeEditorState = {
  theme: null,
  savedTheme: null,
  exists: false,
  loaded: false,
  isDirty: false,
  saving: false,
  expandedSections: new Set<string>(['metadata']),
};

// =============================================================================
// Reducer
// =============================================================================

/**
 * bt-2-2 Task 1.2: Reducer handling THEME_LOADED, UPDATE_VALUE, TOGGLE_SECTION.
 * SAVE_START, SAVE_COMPLETE, REVERT, EXTERNAL_CHANGE are defined but defer to stories 2.3/2.4.
 */
export function themeEditorReducer(
  state: ThemeEditorState,
  action: ThemeEditorAction,
): ThemeEditorState {
  switch (action.type) {
    case 'THEME_LOADED': {
      // bt-4-1 AC-2: Set theme + savedTheme, exists, isDirty=false, expandedSections metadata-only
      return {
        ...state,
        theme: action.theme,
        savedTheme: action.theme ? structuredClone(action.theme) : null,
        exists: action.exists,
        loaded: true,
        isDirty: false,
        expandedSections: new Set<string>(['metadata']),
      };
    }

    case 'UPDATE_VALUE': {
      if (!state.theme) return state;
      const updatedTheme = setByPath(
        state.theme as unknown as Record<string, unknown>,
        action.path,
        action.value,
      ) as unknown as ThemeJson;
      return {
        ...state,
        theme: updatedTheme,
        isDirty: computeIsDirty(updatedTheme, state.savedTheme),
      };
    }

    case 'TOGGLE_SECTION': {
      const newExpanded = new Set(state.expandedSections);
      if (newExpanded.has(action.section)) {
        newExpanded.delete(action.section);
      } else {
        newExpanded.add(action.section);
      }
      return {
        ...state,
        expandedSections: newExpanded,
      };
    }

    // bt-4-1 AC-3: Expand all sections
    case 'EXPAND_ALL': {
      return {
        ...state,
        expandedSections: new Set<string>(SECTION_KEYS),
      };
    }

    // bt-4-1 AC-4: Collapse all sections
    case 'COLLAPSE_ALL': {
      return {
        ...state,
        expandedSections: new Set<string>(),
      };
    }

    // Deferred to story 2.3
    case 'SAVE_START':
      return { ...state, saving: true };

    case 'SAVE_COMPLETE':
      return {
        ...state,
        saving: false,
        savedTheme: action.success && state.theme ? structuredClone(state.theme) : state.savedTheme,
        isDirty: action.success ? false : state.isDirty,
      };

    case 'REVERT':
      return {
        ...state,
        theme: state.savedTheme ? structuredClone(state.savedTheme) : state.theme,
        isDirty: false,
      };

    // Deferred to story 2.4
    case 'EXTERNAL_CHANGE':
      return {
        ...state,
        theme: action.theme,
        savedTheme: structuredClone(action.theme),
        isDirty: false,
      };

    default:
      return state;
  }
}

// =============================================================================
// Context
// =============================================================================

interface ThemeEditorContextValue {
  state: ThemeEditorState;
  dispatch: React.Dispatch<ThemeEditorAction>;
}

const ThemeEditorContext = createContext<ThemeEditorContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

/**
 * bt-2-2 Task 1.3: ThemeEditorProvider component wrapping children with context.
 */
export function ThemeEditorProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(themeEditorReducer, initialState);

  return (
    <ThemeEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </ThemeEditorContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * bt-2-2 Task 1.4: useThemeEditor() hook for consuming context.
 * Throws if used outside ThemeEditorProvider.
 */
export function useThemeEditor(): ThemeEditorContextValue {
  const context = useContext(ThemeEditorContext);
  if (!context) {
    throw new Error('useThemeEditor must be used within a ThemeEditorProvider');
  }
  return context;
}

// =============================================================================
// Per-field Dirty Hook
// =============================================================================

/**
 * bt-2-3 Task 3.2: Hook that returns true when a specific field's value
 * differs from the saved value. Uses getByPath for dot-notation comparison.
 *
 * @param path - Dot-notation path to the field (e.g., 'colors.primary')
 * @returns true if the field value differs from the saved state
 */
export function useFieldDirty(path: string): boolean {
  const { state } = useThemeEditor();
  const { theme, savedTheme } = state;

  if (!theme || !savedTheme) return false;

  const currentValue = getByPath(theme as unknown as Record<string, unknown>, path);
  const savedValue = getByPath(savedTheme as unknown as Record<string, unknown>, path);

  // For objects, use JSON.stringify comparison; for primitives, use strict equality
  if (typeof currentValue === 'object' && currentValue !== null) {
    return JSON.stringify(currentValue) !== JSON.stringify(savedValue);
  }
  return currentValue !== savedValue;
}
