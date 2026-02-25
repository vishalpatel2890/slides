import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  ThemeEditorProvider,
  useThemeEditor,
  useFieldDirty,
  themeEditorReducer,
  setByPath,
  getByPath,
  SECTION_KEYS,
  type ThemeEditorState,
} from '../../src/webview/theme-editor/context/ThemeEditorContext';
import type { ThemeJson } from '../../src/shared/types';

/**
 * Tests for ThemeEditorContext reducer, setByPath utility, and dirty detection.
 * Story Reference: bt-2-2 Task 12 — AC-7 (State Management)
 */

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockTheme(overrides: Partial<ThemeJson> = {}): ThemeJson {
  return {
    name: 'Test Theme',
    version: '1.0.0',
    colors: {
      primary: '#0066cc',
      secondary: '#004499',
      accent: '#ff6600',
      background: { default: '#ffffff', alt: '#f5f5f5', dark: '#1a1a1a' },
      text: { heading: '#111111', body: '#333333', onDark: '#ffffff' },
    },
    typography: {
      fonts: { heading: 'Inter', body: 'Inter' },
      scale: { h1: '2.5rem', h2: '2rem', body: '1rem' },
      weights: { regular: 400, bold: 700 },
    },
    shapes: {
      borderRadius: { sm: '4px', md: '8px', lg: '16px' },
      shadow: { sm: '0 1px 2px rgba(0,0,0,0.1)', md: '0 4px 6px rgba(0,0,0,0.1)' },
      border: { thin: '1px solid #e0e0e0', medium: '2px solid #cccccc' },
    },
    components: {
      box: { default: { background: '#ffffff', border: '1px solid #e0e0e0' } },
      arrow: { default: { strokeWidth: 2, color: '#333333' } },
    },
    ...overrides,
  };
}

function createInitialState(): ThemeEditorState {
  return {
    theme: null,
    savedTheme: null,
    exists: false,
    loaded: false,
    isDirty: false,
    saving: false,
    expandedSections: new Set(['metadata']),
  };
}

// =============================================================================
// setByPath Utility Tests
// =============================================================================

describe('setByPath', () => {
  // bt-2-2 Task 12.4: Unit test: set-by-path utility correctly sets deeply nested values
  it('sets a top-level property', () => {
    const obj = { name: 'old', version: '1.0' };
    const result = setByPath(obj, 'name', 'new');
    expect(result.name).toBe('new');
    expect(result.version).toBe('1.0');
    // Original should be unchanged (immutable)
    expect(obj.name).toBe('old');
  });

  it('sets a nested property', () => {
    const obj = { colors: { primary: '#000', secondary: '#111' } };
    const result = setByPath(obj, 'colors.primary', '#fff');
    expect(result.colors.primary).toBe('#fff');
    expect(result.colors.secondary).toBe('#111');
    // Original should be unchanged
    expect(obj.colors.primary).toBe('#000');
  });

  it('sets a deeply nested property (3 levels)', () => {
    const obj = { colors: { background: { default: '#000', alt: '#111' } } };
    const result = setByPath(obj, 'colors.background.default', '#ffffff');
    expect(result.colors.background.default).toBe('#ffffff');
    expect(result.colors.background.alt).toBe('#111');
  });

  it('creates intermediate objects if they do not exist', () => {
    const obj = { name: 'test' } as Record<string, unknown>;
    const result = setByPath(obj, 'a.b.c', 'value');
    expect((result as any).a.b.c).toBe('value');
  });

  it('handles single-segment paths', () => {
    const obj = { foo: 'bar' };
    const result = setByPath(obj, 'foo', 'baz');
    expect(result.foo).toBe('baz');
  });
});

// =============================================================================
// Reducer Tests
// =============================================================================

describe('themeEditorReducer', () => {
  // bt-2-2 Task 12.1: Unit test: THEME_LOADED
  describe('THEME_LOADED', () => {
    it('sets theme, savedTheme, exists, isDirty=false, only metadata expanded (bt-4-1 AC-2)', () => {
      const state = createInitialState();
      const theme = createMockTheme();

      const result = themeEditorReducer(state, {
        type: 'THEME_LOADED',
        theme,
        exists: true,
      });

      expect(result.theme).toEqual(theme);
      expect(result.savedTheme).toEqual(theme);
      expect(result.exists).toBe(true);
      expect(result.loaded).toBe(true);
      expect(result.isDirty).toBe(false);
      // bt-4-1 AC-2: Only metadata should be expanded
      expect(result.expandedSections.has('metadata')).toBe(true);
      expect(result.expandedSections.size).toBe(1);
    });

    it('handles theme=null (no theme file)', () => {
      const state = createInitialState();

      const result = themeEditorReducer(state, {
        type: 'THEME_LOADED',
        theme: null,
        exists: false,
      });

      expect(result.theme).toBeNull();
      expect(result.savedTheme).toBeNull();
      expect(result.exists).toBe(false);
      expect(result.isDirty).toBe(false);
    });

    it('savedTheme is a deep copy (not same reference)', () => {
      const state = createInitialState();
      const theme = createMockTheme();

      const result = themeEditorReducer(state, {
        type: 'THEME_LOADED',
        theme,
        exists: true,
      });

      expect(result.theme).not.toBe(result.savedTheme);
      expect(result.theme).toEqual(result.savedTheme);
    });
  });

  // bt-2-2 Task 12.2: Unit test: UPDATE_VALUE with dot-notation path
  describe('UPDATE_VALUE', () => {
    it('updates a nested value with dot-notation path', () => {
      const theme = createMockTheme();
      const state: ThemeEditorState = {
        ...createInitialState(),
        theme,
        savedTheme: structuredClone(theme),
        exists: true,
      };

      const result = themeEditorReducer(state, {
        type: 'UPDATE_VALUE',
        path: 'colors.primary',
        value: '#ff0000',
      });

      expect(result.theme!.colors.primary).toBe('#ff0000');
    });

    it('sets isDirty=true when value differs from savedTheme', () => {
      const theme = createMockTheme();
      const state: ThemeEditorState = {
        ...createInitialState(),
        theme,
        savedTheme: structuredClone(theme),
        exists: true,
        isDirty: false,
      };

      const result = themeEditorReducer(state, {
        type: 'UPDATE_VALUE',
        path: 'colors.primary',
        value: '#ff0000',
      });

      expect(result.isDirty).toBe(true);
    });

    it('does nothing when theme is null', () => {
      const state = createInitialState();

      const result = themeEditorReducer(state, {
        type: 'UPDATE_VALUE',
        path: 'colors.primary',
        value: '#ff0000',
      });

      expect(result).toBe(state);
    });

    it('updates deeply nested values (3 levels)', () => {
      const theme = createMockTheme();
      const state: ThemeEditorState = {
        ...createInitialState(),
        theme,
        savedTheme: structuredClone(theme),
        exists: true,
      };

      const result = themeEditorReducer(state, {
        type: 'UPDATE_VALUE',
        path: 'colors.background.default',
        value: '#000000',
      });

      expect(result.theme!.colors.background.default).toBe('#000000');
    });
  });

  // bt-2-2 Task 12.3: Unit test: TOGGLE_SECTION
  describe('TOGGLE_SECTION', () => {
    it('removes section from expandedSections when currently expanded', () => {
      const state: ThemeEditorState = {
        ...createInitialState(),
        expandedSections: new Set(['metadata', 'colors']),
      };

      const result = themeEditorReducer(state, {
        type: 'TOGGLE_SECTION',
        section: 'colors',
      });

      expect(result.expandedSections.has('colors')).toBe(false);
      expect(result.expandedSections.has('metadata')).toBe(true);
    });

    it('adds section to expandedSections when currently collapsed', () => {
      const state: ThemeEditorState = {
        ...createInitialState(),
        expandedSections: new Set(['metadata', 'typography']),
      };

      const result = themeEditorReducer(state, {
        type: 'TOGGLE_SECTION',
        section: 'colors',
      });

      expect(result.expandedSections.has('colors')).toBe(true);
    });
  });

  // bt-2-2 Task 12.5: Unit test: isDirty detection
  describe('isDirty detection', () => {
    it('isDirty is false when theme matches savedTheme after update and revert', () => {
      const theme = createMockTheme();
      const state: ThemeEditorState = {
        ...createInitialState(),
        theme,
        savedTheme: structuredClone(theme),
        exists: true,
        isDirty: false,
      };

      // Change a value
      const changed = themeEditorReducer(state, {
        type: 'UPDATE_VALUE',
        path: 'colors.primary',
        value: '#ff0000',
      });
      expect(changed.isDirty).toBe(true);

      // Change it back to original
      const reverted = themeEditorReducer(changed, {
        type: 'UPDATE_VALUE',
        path: 'colors.primary',
        value: '#0066cc',
      });
      expect(reverted.isDirty).toBe(false);
    });
  });
});

// =============================================================================
// Hook Tests
// =============================================================================

describe('useThemeEditor hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeEditorProvider>{children}</ThemeEditorProvider>
  );

  it('provides initial state with metadata-only expanded (bt-4-1 AC-1)', () => {
    const { result } = renderHook(() => useThemeEditor(), { wrapper });

    expect(result.current.state.theme).toBeNull();
    expect(result.current.state.exists).toBe(false);
    expect(result.current.state.isDirty).toBe(false);
    // bt-4-1 AC-1: Only metadata expanded by default
    expect(result.current.state.expandedSections.size).toBe(1);
    expect(result.current.state.expandedSections.has('metadata')).toBe(true);
  });

  it('throws when used outside ThemeEditorProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useThemeEditor();
      } catch (e) {
        return e;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
  });

  it('dispatches THEME_LOADED correctly', () => {
    const { result } = renderHook(() => useThemeEditor(), { wrapper });
    const theme = createMockTheme();

    act(() => {
      result.current.dispatch({ type: 'THEME_LOADED', theme, exists: true });
    });

    expect(result.current.state.theme).toEqual(theme);
    expect(result.current.state.exists).toBe(true);
    expect(result.current.state.isDirty).toBe(false);
  });

  it('dispatches UPDATE_VALUE and marks isDirty', () => {
    const { result } = renderHook(() => useThemeEditor(), { wrapper });
    const theme = createMockTheme();

    act(() => {
      result.current.dispatch({ type: 'THEME_LOADED', theme, exists: true });
    });

    act(() => {
      result.current.dispatch({ type: 'UPDATE_VALUE', path: 'name', value: 'Changed' });
    });

    expect(result.current.state.theme!.name).toBe('Changed');
    expect(result.current.state.isDirty).toBe(true);
  });

  it('dispatches TOGGLE_SECTION', () => {
    const { result } = renderHook(() => useThemeEditor(), { wrapper });

    // bt-4-1: Initial state has only 'metadata' expanded, 'colors' is collapsed
    expect(result.current.state.expandedSections.has('colors')).toBe(false);

    // Toggle colors on
    act(() => {
      result.current.dispatch({ type: 'TOGGLE_SECTION', section: 'colors' });
    });
    expect(result.current.state.expandedSections.has('colors')).toBe(true);

    // Toggle colors off
    act(() => {
      result.current.dispatch({ type: 'TOGGLE_SECTION', section: 'colors' });
    });
    expect(result.current.state.expandedSections.has('colors')).toBe(false);
  });
});

// =============================================================================
// bt-2-3 Tests: getByPath Utility
// =============================================================================

describe('getByPath', () => {
  // bt-2-3 Task 9.5: Unit test: getByPath utility
  it('retrieves a top-level property', () => {
    const obj = { name: 'Test', version: '1.0' };
    expect(getByPath(obj, 'name')).toBe('Test');
  });

  it('retrieves a nested property', () => {
    const obj = { colors: { primary: '#fff' } };
    expect(getByPath(obj, 'colors.primary')).toBe('#fff');
  });

  it('retrieves a deeply nested property (3 levels)', () => {
    const obj = { colors: { background: { default: '#000' } } };
    expect(getByPath(obj, 'colors.background.default')).toBe('#000');
  });

  it('returns undefined for missing paths', () => {
    const obj = { name: 'Test' };
    expect(getByPath(obj, 'colors.primary')).toBeUndefined();
  });

  it('returns undefined when intermediate is null', () => {
    const obj = { colors: null } as unknown as Record<string, unknown>;
    expect(getByPath(obj, 'colors.primary')).toBeUndefined();
  });

  it('returns undefined when intermediate is a primitive', () => {
    const obj = { name: 'Test' };
    expect(getByPath(obj, 'name.sub')).toBeUndefined();
  });
});

// =============================================================================
// bt-2-3 Tests: SAVE_START, SAVE_COMPLETE, REVERT reducer cases
// =============================================================================

describe('themeEditorReducer — save/revert actions (bt-2-3)', () => {
  function createLoadedState(): ThemeEditorState {
    const theme = createMockTheme();
    return {
      ...createInitialState(),
      theme,
      savedTheme: structuredClone(theme),
      exists: true,
      loaded: true,
      isDirty: false,
    };
  }

  // bt-2-3 Task 9.1: SAVE_START sets saving = true
  describe('SAVE_START', () => {
    it('sets saving = true', () => {
      const state = createLoadedState();
      const result = themeEditorReducer(state, { type: 'SAVE_START' });
      expect(result.saving).toBe(true);
    });

    it('preserves isDirty when saving starts', () => {
      const state = { ...createLoadedState(), isDirty: true };
      const result = themeEditorReducer(state, { type: 'SAVE_START' });
      expect(result.isDirty).toBe(true);
      expect(result.saving).toBe(true);
    });
  });

  // bt-2-3 Task 9.2: SAVE_COMPLETE with success
  describe('SAVE_COMPLETE', () => {
    it('on success: sets savedTheme = theme, isDirty = false, saving = false', () => {
      const state = createLoadedState();
      // Simulate a change
      const changed = themeEditorReducer(state, {
        type: 'UPDATE_VALUE',
        path: 'colors.primary',
        value: '#ff0000',
      });
      // Start save
      const saving = themeEditorReducer(changed, { type: 'SAVE_START' });
      // Complete save
      const completed = themeEditorReducer(saving, { type: 'SAVE_COMPLETE', success: true });

      expect(completed.saving).toBe(false);
      expect(completed.isDirty).toBe(false);
      expect(completed.savedTheme).toEqual(completed.theme);
      // savedTheme should be a deep clone, not same reference
      expect(completed.savedTheme).not.toBe(completed.theme);
    });

    // bt-2-3 Task 9.3: SAVE_COMPLETE with failure
    it('on failure: sets saving = false, preserves isDirty = true', () => {
      const state = createLoadedState();
      // Simulate a change
      const changed = themeEditorReducer(state, {
        type: 'UPDATE_VALUE',
        path: 'colors.primary',
        value: '#ff0000',
      });
      const saving = themeEditorReducer(changed, { type: 'SAVE_START' });
      const failed = themeEditorReducer(saving, { type: 'SAVE_COMPLETE', success: false });

      expect(failed.saving).toBe(false);
      expect(failed.isDirty).toBe(true);
      // savedTheme should NOT have been updated
      expect(failed.savedTheme!.colors.primary).toBe('#0066cc');
    });
  });

  // bt-2-3 Task 9.4: REVERT resets theme to deep clone of savedTheme
  describe('REVERT', () => {
    it('resets theme to deep clone of savedTheme, isDirty = false', () => {
      const state = createLoadedState();
      // Simulate a change
      const changed = themeEditorReducer(state, {
        type: 'UPDATE_VALUE',
        path: 'colors.primary',
        value: '#ff0000',
      });
      expect(changed.isDirty).toBe(true);
      expect(changed.theme!.colors.primary).toBe('#ff0000');

      // Revert
      const reverted = themeEditorReducer(changed, { type: 'REVERT' });

      expect(reverted.isDirty).toBe(false);
      expect(reverted.theme!.colors.primary).toBe('#0066cc');
      // theme should be a deep clone of savedTheme, not same reference
      expect(reverted.theme).not.toBe(reverted.savedTheme);
      expect(reverted.theme).toEqual(reverted.savedTheme);
    });

    it('does nothing harmful when savedTheme is null', () => {
      const state = createInitialState();
      const result = themeEditorReducer(state, { type: 'REVERT' });
      expect(result.theme).toBeNull();
      expect(result.isDirty).toBe(false);
    });
  });
});

// =============================================================================
// bt-2-4 Tests: EXTERNAL_CHANGE reducer case
// =============================================================================

describe('themeEditorReducer — EXTERNAL_CHANGE (bt-2-4)', () => {
  function createLoadedDirtyState(): ThemeEditorState {
    const theme = createMockTheme();
    const modified = { ...theme, name: 'Modified Theme' } as ThemeJson;
    return {
      ...createInitialState(),
      theme: modified,
      savedTheme: structuredClone(theme),
      exists: true,
      loaded: true,
      isDirty: true,
    };
  }

  // bt-2-4 Task 10.1: EXTERNAL_CHANGE sets theme and savedTheme to external data, isDirty = false
  it('sets theme and savedTheme to external data, isDirty = false', () => {
    const state = createLoadedDirtyState();
    const externalTheme = createMockTheme({ name: 'External Theme', version: '2.0.0' });

    const result = themeEditorReducer(state, {
      type: 'EXTERNAL_CHANGE',
      theme: externalTheme,
    });

    expect(result.theme).toEqual(externalTheme);
    expect(result.savedTheme).toEqual(externalTheme);
    expect(result.isDirty).toBe(false);
  });

  it('savedTheme is a deep clone (not same reference as theme)', () => {
    const state = createLoadedDirtyState();
    const externalTheme = createMockTheme({ name: 'External Theme' });

    const result = themeEditorReducer(state, {
      type: 'EXTERNAL_CHANGE',
      theme: externalTheme,
    });

    expect(result.theme).not.toBe(result.savedTheme);
    expect(result.theme).toEqual(result.savedTheme);
  });

  it('preserves exists and loaded state', () => {
    const state = createLoadedDirtyState();
    const externalTheme = createMockTheme({ name: 'External Theme' });

    const result = themeEditorReducer(state, {
      type: 'EXTERNAL_CHANGE',
      theme: externalTheme,
    });

    expect(result.exists).toBe(true);
    expect(result.loaded).toBe(true);
  });
});

// =============================================================================
// bt-4-1 Tests: SECTION_KEYS, EXPAND_ALL, COLLAPSE_ALL, default state
// =============================================================================

describe('SECTION_KEYS (bt-4-1)', () => {
  // bt-4-1 Task 5.5: SECTION_KEYS includes 'brandContext' at index 1
  it('includes brandContext at index 1 (AC-6)', () => {
    expect(SECTION_KEYS[1]).toBe('brandContext');
  });

  it('has 7 total section keys', () => {
    expect(SECTION_KEYS.length).toBe(7);
  });

  it('has the correct order: metadata, brandContext, colors, typography, shapes, components, rhythm', () => {
    expect([...SECTION_KEYS]).toEqual([
      'metadata',
      'brandContext',
      'colors',
      'typography',
      'shapes',
      'components',
      'rhythm',
    ]);
  });
});

describe('themeEditorReducer — bt-4-1 collapse/expand actions', () => {
  // bt-4-1 Task 5.1: initial state expandedSections equals metadata-only
  it('initial state has expandedSections with only metadata (AC-1)', () => {
    const state = createInitialState();
    expect(state.expandedSections.size).toBe(1);
    expect(state.expandedSections.has('metadata')).toBe(true);
  });

  // bt-4-1 Task 5.2: THEME_LOADED resets expandedSections to metadata-only
  it('THEME_LOADED resets expandedSections to metadata-only (AC-2)', () => {
    const state: ThemeEditorState = {
      ...createInitialState(),
      expandedSections: new Set(SECTION_KEYS), // all expanded
    };
    const theme = createMockTheme();

    const result = themeEditorReducer(state, {
      type: 'THEME_LOADED',
      theme,
      exists: true,
    });

    expect(result.expandedSections.size).toBe(1);
    expect(result.expandedSections.has('metadata')).toBe(true);
  });

  // bt-4-1 Task 5.3: EXPAND_ALL sets expandedSections to all 7 sections
  it('EXPAND_ALL sets expandedSections to all SECTION_KEYS (AC-3)', () => {
    const state = createInitialState(); // metadata-only

    const result = themeEditorReducer(state, { type: 'EXPAND_ALL' });

    expect(result.expandedSections.size).toBe(SECTION_KEYS.length);
    SECTION_KEYS.forEach((key) => {
      expect(result.expandedSections.has(key)).toBe(true);
    });
  });

  // bt-4-1 Task 5.4: COLLAPSE_ALL sets expandedSections to empty
  it('COLLAPSE_ALL sets expandedSections to empty set (AC-4)', () => {
    const state: ThemeEditorState = {
      ...createInitialState(),
      expandedSections: new Set(SECTION_KEYS), // all expanded
    };

    const result = themeEditorReducer(state, { type: 'COLLAPSE_ALL' });

    expect(result.expandedSections.size).toBe(0);
  });

  // bt-4-1 Task 5.6: TOGGLE_SECTION still works after EXPAND_ALL
  it('TOGGLE_SECTION works after EXPAND_ALL — collapses only that section (AC-5)', () => {
    const state = createInitialState();

    // Expand all
    const expanded = themeEditorReducer(state, { type: 'EXPAND_ALL' });
    expect(expanded.expandedSections.size).toBe(SECTION_KEYS.length);

    // Toggle colors off
    const toggled = themeEditorReducer(expanded, {
      type: 'TOGGLE_SECTION',
      section: 'colors',
    });

    expect(toggled.expandedSections.has('colors')).toBe(false);
    expect(toggled.expandedSections.has('metadata')).toBe(true);
    expect(toggled.expandedSections.has('typography')).toBe(true);
    expect(toggled.expandedSections.size).toBe(SECTION_KEYS.length - 1);
  });

  // bt-4-1 Task 5.6: TOGGLE_SECTION still works after COLLAPSE_ALL
  it('TOGGLE_SECTION works after COLLAPSE_ALL — expands only that section (AC-5)', () => {
    const state: ThemeEditorState = {
      ...createInitialState(),
      expandedSections: new Set(SECTION_KEYS),
    };

    // Collapse all
    const collapsed = themeEditorReducer(state, { type: 'COLLAPSE_ALL' });
    expect(collapsed.expandedSections.size).toBe(0);

    // Toggle typography on
    const toggled = themeEditorReducer(collapsed, {
      type: 'TOGGLE_SECTION',
      section: 'typography',
    });

    expect(toggled.expandedSections.has('typography')).toBe(true);
    expect(toggled.expandedSections.size).toBe(1);
  });

  // bt-4-1: EXPAND_ALL / COLLAPSE_ALL do not affect other state fields
  it('EXPAND_ALL preserves theme, isDirty, saving, and other state', () => {
    const theme = createMockTheme();
    const state: ThemeEditorState = {
      ...createInitialState(),
      theme,
      savedTheme: structuredClone(theme),
      exists: true,
      loaded: true,
      isDirty: true,
      saving: false,
    };

    const result = themeEditorReducer(state, { type: 'EXPAND_ALL' });

    expect(result.theme).toBe(state.theme);
    expect(result.isDirty).toBe(true);
    expect(result.exists).toBe(true);
    expect(result.loaded).toBe(true);
  });
});

// =============================================================================
// bt-2-3 Tests: useFieldDirty hook
// =============================================================================

describe('useFieldDirty hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeEditorProvider>{children}</ThemeEditorProvider>
  );

  // bt-2-3 Task 9.6: useFieldDirty returns true when field differs from saved
  it('returns false when no changes have been made', () => {
    const { result } = renderHook(
      () => {
        const context = useThemeEditor();
        const dirty = useFieldDirty('colors.primary');
        return { context, dirty };
      },
      { wrapper },
    );

    const theme = createMockTheme();
    act(() => {
      result.current.context.dispatch({ type: 'THEME_LOADED', theme, exists: true });
    });

    expect(result.current.dirty).toBe(false);
  });

  it('returns true when field value differs from saved', () => {
    const { result } = renderHook(
      () => {
        const context = useThemeEditor();
        const dirty = useFieldDirty('colors.primary');
        return { context, dirty };
      },
      { wrapper },
    );

    const theme = createMockTheme();
    act(() => {
      result.current.context.dispatch({ type: 'THEME_LOADED', theme, exists: true });
    });

    act(() => {
      result.current.context.dispatch({
        type: 'UPDATE_VALUE',
        path: 'colors.primary',
        value: '#ff0000',
      });
    });

    expect(result.current.dirty).toBe(true);
  });

  it('returns false when theme is not loaded', () => {
    const { result } = renderHook(
      () => {
        const context = useThemeEditor();
        const dirty = useFieldDirty('colors.primary');
        return { context, dirty };
      },
      { wrapper },
    );

    expect(result.current.dirty).toBe(false);
  });
});
