/**
 * Tests for CatalogContext — reducer logic, provider, and hooks.
 *
 * Story Reference: cv-1-2 Task 1 — CatalogContext with useReducer
 * AC-4: Tab state management, Decks active by default
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  CatalogProvider,
  useCatalog,
  useActiveTab,
  useSearchQuery,
  useNavigationStack,
  useStatusFilters,
  useFilteredDecksInFolder,
  useFilteredDeckTemplates,
  catalogReducer,
  initialState,
} from '../../src/webview/catalog/context/CatalogContext';
import type { CatalogState, CatalogAction } from '../../src/shared/types';

// =============================================================================
// Reducer Tests
// =============================================================================

describe('catalogReducer', () => {
  it('returns initial state with Decks tab active', () => {
    expect(initialState.activeTab).toBe('decks');
    expect(initialState.navigationStack).toHaveLength(1);
    expect(initialState.navigationStack[0].type).toBe('tab-root');
    expect(initialState.searchQuery).toBe('');
  });

  it('handles SET_TAB action', () => {
    const state = catalogReducer(initialState, { type: 'SET_TAB', tab: 'brand-assets' });
    expect(state.activeTab).toBe('brand-assets');
    expect(state.navigationStack).toHaveLength(1);
    expect(state.navigationStack[0].label).toBe('Brand Assets');
    expect(state.searchQuery).toBe('');
    expect(state.selectedDeckId).toBeNull();
  });

  it('SET_TAB resets search query', () => {
    const withSearch: CatalogState = { ...initialState, searchQuery: 'test' };
    const state = catalogReducer(withSearch, { type: 'SET_TAB', tab: 'templates' });
    expect(state.searchQuery).toBe('');
  });

  it('handles SET_SEARCH action', () => {
    const state = catalogReducer(initialState, { type: 'SET_SEARCH', query: 'hello' });
    expect(state.searchQuery).toBe('hello');
  });

  it('handles TOGGLE_FILTER action — adds filter', () => {
    const state = catalogReducer(initialState, { type: 'TOGGLE_FILTER', status: 'planned' });
    expect(state.statusFilters).toEqual(['planned']);
  });

  it('handles TOGGLE_FILTER action — removes existing filter', () => {
    const withFilter: CatalogState = { ...initialState, statusFilters: ['planned'] };
    const state = catalogReducer(withFilter, { type: 'TOGGLE_FILTER', status: 'planned' });
    expect(state.statusFilters).toEqual([]);
  });

  it('handles NAVIGATE_TO_DECK action', () => {
    const withDecks: CatalogState = {
      ...initialState,
      decks: [{ id: 'd1', name: 'My Deck', path: '/decks/d1', slideCount: 5, status: 'planned', builtSlideCount: 0, lastModified: 1704067200000 }],
    };
    const state = catalogReducer(withDecks, { type: 'NAVIGATE_TO_DECK', deckId: 'd1' });
    expect(state.selectedDeckId).toBe('d1');
    expect(state.navigationStack).toHaveLength(2);
    expect(state.navigationStack[1].label).toBe('My Deck');
    expect(state.navigationStack[1].type).toBe('deck-detail');
  });

  it('handles NAVIGATE_BACK action', () => {
    const drilled: CatalogState = {
      ...initialState,
      navigationStack: [
        { id: 'decks', label: 'Decks', type: 'tab-root' },
        { id: 'd1', label: 'My Deck', type: 'deck-detail' },
      ],
      selectedDeckId: 'd1',
    };
    const state = catalogReducer(drilled, { type: 'NAVIGATE_BACK' });
    expect(state.navigationStack).toHaveLength(1);
    expect(state.selectedDeckId).toBeNull();
  });

  it('NAVIGATE_BACK does nothing at root level', () => {
    const state = catalogReducer(initialState, { type: 'NAVIGATE_BACK' });
    expect(state).toBe(initialState);
  });

  it('handles SET_DECKS action', () => {
    const decks = [
      { id: 'd1', name: 'Deck 1', path: '/d1', slideCount: 3, status: 'planned' as const, builtSlideCount: 0, lastModified: 1704067200000 },
    ];
    const state = catalogReducer(initialState, { type: 'SET_DECKS', decks });
    expect(state.decks).toEqual(decks);
  });

  it('handles SET_VIEW_MODE action', () => {
    const state = catalogReducer(initialState, { type: 'SET_VIEW_MODE', mode: 'list' });
    expect(state.viewMode).toBe('list');
  });

  // v3-2-1: View preference persistence tests
  it('initialState viewMode defaults to "grid" (v3-2-1 AC-3)', () => {
    expect(initialState.viewMode).toBe('grid');
  });

  it('SET_VIEW_MODE toggles back to "grid" from "list" (v3-2-1 AC-1)', () => {
    const listState = catalogReducer(initialState, { type: 'SET_VIEW_MODE', mode: 'list' });
    expect(listState.viewMode).toBe('list');
    const gridState = catalogReducer(listState, { type: 'SET_VIEW_MODE', mode: 'grid' });
    expect(gridState.viewMode).toBe('grid');
  });

  it('handles SET_DECK_DETAIL action with deck', () => {
    const deck = { id: 'd1', name: 'Deck', path: '/d1', slideCount: 1, status: 'planned' as const, builtSlideCount: 0, lastModified: 1704067200000 };
    const state = catalogReducer(initialState, { type: 'SET_DECK_DETAIL', deck });
    expect(state.selectedDeckId).toBe('d1');
  });

  it('handles SET_DECK_DETAIL action with null', () => {
    const withDeck: CatalogState = { ...initialState, selectedDeckId: 'd1' };
    const state = catalogReducer(withDeck, { type: 'SET_DECK_DETAIL', deck: null });
    expect(state.selectedDeckId).toBeNull();
  });

  it('handles CLEAR_FILTERS action — resets search and status filters', () => {
    const withFilters: CatalogState = { ...initialState, searchQuery: 'test', statusFilters: ['built', 'planned'] };
    const state = catalogReducer(withFilters, { type: 'CLEAR_FILTERS' });
    expect(state.searchQuery).toBe('');
    expect(state.statusFilters).toEqual([]);
  });

  it('CLEAR_FILTERS is a no-op when already clear', () => {
    const state = catalogReducer(initialState, { type: 'CLEAR_FILTERS' });
    expect(state.searchQuery).toBe('');
    expect(state.statusFilters).toEqual([]);
  });

  it('returns current state for unknown action type', () => {
    const state = catalogReducer(initialState, { type: 'UNKNOWN' } as unknown as CatalogAction);
    expect(state).toBe(initialState);
  });

  // tm-2-3: DELETE_DECK_TEMPLATE reducer test (Task 7.6)
  it('handles DELETE_DECK_TEMPLATE action — removes matching deck template, preserves others', () => {
    const stateWithDeckTemplates = {
      ...initialState,
      deckTemplates: [
        { id: 'quarterly-review', name: 'Quarterly Review', description: 'QBR deck', category: 'Business', slideCount: 5 },
        { id: 'company-overview', name: 'Company Overview', description: 'Overview deck', category: 'Business', slideCount: 3 },
        { id: 'sales-pitch', name: 'Sales Pitch', description: 'Sales deck', category: 'Sales', slideCount: 4 },
      ],
    };

    const result = catalogReducer(stateWithDeckTemplates, {
      type: 'DELETE_DECK_TEMPLATE',
      templateId: 'company-overview',
    });

    expect(result.deckTemplates).toHaveLength(2);
    expect(result.deckTemplates.find((t: any) => t.id === 'company-overview')).toBeUndefined();
    expect(result.deckTemplates[0].id).toBe('quarterly-review');
    expect(result.deckTemplates[1].id).toBe('sales-pitch');
  });

  // tm-1-3: DELETE_SLIDE_TEMPLATE reducer test (Task 9.4)
  it('handles DELETE_SLIDE_TEMPLATE action — removes matching template, preserves others', () => {
    const stateWithTemplates = {
      ...initialState,
      slideTemplates: [
        { id: 'hero-title', name: 'Hero Title', description: 'Bold title', use_cases: [], category: 'Title' },
        { id: 'content-grid', name: 'Content Grid', description: 'Grid layout', use_cases: [], category: 'Content' },
        { id: 'data-chart', name: 'Data Chart', description: 'Chart slide', use_cases: [], category: 'Data' },
      ],
    };

    const result = catalogReducer(stateWithTemplates, {
      type: 'DELETE_SLIDE_TEMPLATE',
      templateId: 'content-grid',
    });

    expect(result.slideTemplates).toHaveLength(2);
    expect(result.slideTemplates.find((t) => t.id === 'content-grid')).toBeUndefined();
    expect(result.slideTemplates[0].id).toBe('hero-title');
    expect(result.slideTemplates[1].id).toBe('data-chart');
  });
});

// =============================================================================
// Provider and Hook Tests
// =============================================================================

describe('CatalogProvider', () => {
  function TestConsumer() {
    const { state, dispatch } = useCatalog();
    return (
      <div>
        <span data-testid="tab">{state.activeTab}</span>
        <span data-testid="search">{state.searchQuery}</span>
        <button onClick={() => dispatch({ type: 'SET_TAB', tab: 'templates' })}>switch</button>
      </div>
    );
  }

  it('provides default state', () => {
    render(
      <CatalogProvider>
        <TestConsumer />
      </CatalogProvider>
    );
    expect(screen.getByTestId('tab').textContent).toBe('decks');
    expect(screen.getByTestId('search').textContent).toBe('');
  });

  it('supports initialOverrides', () => {
    render(
      <CatalogProvider initialOverrides={{ activeTab: 'templates' }}>
        <TestConsumer />
      </CatalogProvider>
    );
    expect(screen.getByTestId('tab').textContent).toBe('templates');
  });

  it('dispatch updates state', async () => {
    render(
      <CatalogProvider>
        <TestConsumer />
      </CatalogProvider>
    );
    expect(screen.getByTestId('tab').textContent).toBe('decks');
    await act(async () => {
      screen.getByText('switch').click();
    });
    expect(screen.getByTestId('tab').textContent).toBe('templates');
  });
});

describe('useCatalog', () => {
  it('throws if used outside CatalogProvider', () => {
    expect(() => {
      renderHook(() => useCatalog());
    }).toThrow('useCatalog must be used within a CatalogProvider');
  });
});

describe('Selector hooks', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CatalogProvider>{children}</CatalogProvider>
  );

  it('useActiveTab returns active tab', () => {
    const { result } = renderHook(() => useActiveTab(), { wrapper });
    expect(result.current).toBe('decks');
  });

  it('useSearchQuery returns search query', () => {
    const { result } = renderHook(() => useSearchQuery(), { wrapper });
    expect(result.current).toBe('');
  });

  it('useNavigationStack returns navigation stack', () => {
    const { result } = renderHook(() => useNavigationStack(), { wrapper });
    expect(result.current).toHaveLength(1);
    expect(result.current[0].type).toBe('tab-root');
  });

  it('useStatusFilters returns empty array by default', () => {
    const { result } = renderHook(() => useStatusFilters(), { wrapper });
    expect(result.current).toEqual([]);
  });
});

// =============================================================================
// cv-1-8: Folder-Scoped Filtering Tests
// =============================================================================

describe('catalogReducer — folder context preservation (cv-1-8)', () => {
  it('SET_SEARCH preserves currentFolderId (AC-5)', () => {
    const inFolder: CatalogState = {
      ...initialState,
      currentFolderId: 'folder-1',
      navigationStack: [
        { id: 'decks', label: 'Decks', type: 'tab-root' },
        { id: 'folder-1', label: 'Q3 Reports', type: 'folder' },
      ],
    };
    const state = catalogReducer(inFolder, { type: 'SET_SEARCH', query: 'test' });
    expect(state.currentFolderId).toBe('folder-1');
    expect(state.searchQuery).toBe('test');
  });

  it('SET_SEARCH with empty string preserves currentFolderId (AC-5)', () => {
    const inFolderWithSearch: CatalogState = {
      ...initialState,
      currentFolderId: 'folder-1',
      searchQuery: 'test',
      navigationStack: [
        { id: 'decks', label: 'Decks', type: 'tab-root' },
        { id: 'folder-1', label: 'Q3 Reports', type: 'folder' },
      ],
    };
    const state = catalogReducer(inFolderWithSearch, { type: 'SET_SEARCH', query: '' });
    expect(state.currentFolderId).toBe('folder-1');
    expect(state.searchQuery).toBe('');
  });

  it('TOGGLE_FILTER preserves currentFolderId (AC-3)', () => {
    const inFolder: CatalogState = {
      ...initialState,
      currentFolderId: 'folder-1',
    };
    const state = catalogReducer(inFolder, { type: 'TOGGLE_FILTER', status: 'built' });
    expect(state.currentFolderId).toBe('folder-1');
    expect(state.statusFilters).toEqual(['built']);
  });
});

describe('useFilteredDecksInFolder — folder-scoped filtering (cv-1-8)', () => {
  const folderDecks = [
    { id: 'd1', name: 'Sales Pitch', path: '/d1', slideCount: 5, status: 'planned' as const, builtSlideCount: 0, lastModified: 1, folderId: 'folder-1' },
    { id: 'd2', name: 'Q3 Report', path: '/d2', slideCount: 3, status: 'built' as const, builtSlideCount: 3, lastModified: 2, folderId: 'folder-1' },
    { id: 'd3', name: 'Sales Summary', path: '/d3', slideCount: 2, status: 'planned' as const, builtSlideCount: 0, lastModified: 3, folderId: 'folder-2' },
    { id: 'd4', name: 'Root Deck', path: '/d4', slideCount: 4, status: 'built' as const, builtSlideCount: 4, lastModified: 4 },
  ];

  it('returns only folder decks when currentFolderId is set (AC-2)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{
        decks: folderDecks,
        currentFolderId: 'folder-1',
      }}>
        {children}
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredDecksInFolder(), { wrapper });
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered.map((d) => d.id)).toEqual(['d1', 'd2']);
  });

  it('applies search query within folder scope (AC-2, AC-6)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{
        decks: folderDecks,
        currentFolderId: 'folder-1',
        searchQuery: 'Sales',
      }}>
        {children}
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredDecksInFolder(), { wrapper });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].id).toBe('d1');
  });

  it('applies status filter within folder scope (AC-3, AC-6)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{
        decks: folderDecks,
        currentFolderId: 'folder-1',
        statusFilters: ['built'],
      }}>
        {children}
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredDecksInFolder(), { wrapper });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].id).toBe('d2');
  });

  it('total count is folder-scoped, not global (AC-4)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{
        decks: folderDecks,
        currentFolderId: 'folder-1',
        searchQuery: 'Sales',
      }}>
        {children}
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredDecksInFolder(), { wrapper });
    // Total should be 2 (both decks in folder-1), not 4 (all decks)
    expect(result.current.total).toBe(2);
    // Filtered should be 1 (only "Sales Pitch" matches query)
    expect(result.current.filtered).toHaveLength(1);
  });

  it('returns root-level decks when no folder selected (AC-1)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{
        decks: folderDecks,
      }}>
        {children}
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredDecksInFolder(), { wrapper });
    // Only root-level deck (no folderId)
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].id).toBe('d4');
    expect(result.current.total).toBe(1);
  });

  it('combined: search + status + folder all intersect (AC-6)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{
        decks: folderDecks,
        currentFolderId: 'folder-1',
        searchQuery: 'Sales',
        statusFilters: ['built'],
      }}>
        {children}
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredDecksInFolder(), { wrapper });
    // "Sales Pitch" matches query but is 'planned', not 'built' → 0 results
    expect(result.current.filtered).toHaveLength(0);
    expect(result.current.total).toBe(2);
  });
});

// =============================================================================
// tm-1-4: REORDER_SLIDE_TEMPLATES reducer action tests
// Story Reference: tm-1-4 Task 9.5
// =============================================================================

describe('catalogReducer REORDER_SLIDE_TEMPLATES (tm-1-4)', () => {
  const mockSlideTemplates = [
    { id: 'template-a', name: 'A', description: 'First', category: 'Title', use_cases: [], thumbnail: undefined, background_mode: undefined },
    { id: 'template-b', name: 'B', description: 'Second', category: 'Content', use_cases: [], thumbnail: undefined, background_mode: undefined },
    { id: 'template-c', name: 'C', description: 'Third', category: 'Data', use_cases: [], thumbnail: undefined, background_mode: undefined },
  ] as any[];

  it('reorders slideTemplates to match orderedTemplates payload (AC-6)', () => {
    const stateWithTemplates = {
      ...initialState,
      slideTemplates: mockSlideTemplates,
    };

    const result = catalogReducer(stateWithTemplates, {
      type: 'REORDER_SLIDE_TEMPLATES',
      orderedTemplates: [mockSlideTemplates[2], mockSlideTemplates[0], mockSlideTemplates[1]],
    });

    expect(result.slideTemplates).toHaveLength(3);
    expect(result.slideTemplates[0].id).toBe('template-c');
    expect(result.slideTemplates[1].id).toBe('template-a');
    expect(result.slideTemplates[2].id).toBe('template-b');
  });

  it('preserves all other state properties (AC-6)', () => {
    const stateWithTemplates = {
      ...initialState,
      slideTemplates: mockSlideTemplates,
      searchQuery: 'test-query',
      activeTab: 'templates' as const,
    };

    const result = catalogReducer(stateWithTemplates, {
      type: 'REORDER_SLIDE_TEMPLATES',
      orderedTemplates: [mockSlideTemplates[1], mockSlideTemplates[0], mockSlideTemplates[2]],
    });

    // Other state preserved
    expect(result.searchQuery).toBe('test-query');
    expect(result.activeTab).toBe('templates');
    // Templates reordered
    expect(result.slideTemplates[0].id).toBe('template-b');
    expect(result.slideTemplates[1].id).toBe('template-a');
    expect(result.slideTemplates[2].id).toBe('template-c');
  });

  it('handles empty orderedTemplates array', () => {
    const stateWithTemplates = {
      ...initialState,
      slideTemplates: mockSlideTemplates,
    };

    const result = catalogReducer(stateWithTemplates, {
      type: 'REORDER_SLIDE_TEMPLATES',
      orderedTemplates: [],
    });

    expect(result.slideTemplates).toHaveLength(0);
  });
});

// =============================================================================
// tm-1-6: Template search/filter state persistence reducer tests
// Story Reference: tm-1-6 Task 7
// =============================================================================

describe('catalogReducer template filter actions (tm-1-6)', () => {
  it('SET_TEMPLATE_SEARCH sets templateSearchQuery; does not touch templateCategoryFilter or deckTemplateCategoryFilter (AC-4)', () => {
    const stateWithFilters = {
      ...initialState,
      templateCategoryFilter: 'Title',
      deckTemplateCategoryFilter: 'Business',
    };

    const result = catalogReducer(stateWithFilters, {
      type: 'SET_TEMPLATE_SEARCH',
      query: 'hero',
    });

    expect(result.templateSearchQuery).toBe('hero');
    expect(result.searchQuery).toBe('');  // deck search query unchanged
    expect(result.templateCategoryFilter).toBe('Title');  // slide category unchanged
    expect(result.deckTemplateCategoryFilter).toBe('Business');  // deck category unchanged
  });

  it('SET_TEMPLATE_CATEGORY sets templateCategoryFilter; does not touch deckTemplateCategoryFilter (AC-3)', () => {
    const stateWithDeckFilter = {
      ...initialState,
      deckTemplateCategoryFilter: 'Business',
    };

    const result = catalogReducer(stateWithDeckFilter, {
      type: 'SET_TEMPLATE_CATEGORY',
      category: 'Title',
    });

    expect(result.templateCategoryFilter).toBe('Title');
    expect(result.deckTemplateCategoryFilter).toBe('Business');  // deck filter unchanged
  });

  it('SET_TEMPLATE_CATEGORY accepts null to clear slide category filter (AC-3)', () => {
    const stateWithSlideFilter = {
      ...initialState,
      templateCategoryFilter: 'Data',
    };

    const result = catalogReducer(stateWithSlideFilter, {
      type: 'SET_TEMPLATE_CATEGORY',
      category: null,
    });

    expect(result.templateCategoryFilter).toBeNull();
  });

  it('SET_DECK_TEMPLATE_CATEGORY sets deckTemplateCategoryFilter; does not touch templateCategoryFilter (AC-3, AC-8)', () => {
    const stateWithSlideFilter = {
      ...initialState,
      templateCategoryFilter: 'Data',
    };

    const result = catalogReducer(stateWithSlideFilter, {
      type: 'SET_DECK_TEMPLATE_CATEGORY',
      category: 'Business',
    });

    expect(result.deckTemplateCategoryFilter).toBe('Business');
    expect(result.templateCategoryFilter).toBe('Data');  // slide filter unchanged
  });

  it('SET_DECK_TEMPLATE_CATEGORY accepts null to clear deck category filter (AC-3)', () => {
    const stateWithDeckFilter = {
      ...initialState,
      deckTemplateCategoryFilter: 'Business',
    };

    const result = catalogReducer(stateWithDeckFilter, {
      type: 'SET_DECK_TEMPLATE_CATEGORY',
      category: null,
    });

    expect(result.deckTemplateCategoryFilter).toBeNull();
  });

  it('CLEAR_TEMPLATE_FILTERS resets templateSearchQuery, templateCategoryFilter, and deckTemplateCategoryFilter (AC-5)', () => {
    const stateWithAllFilters = {
      ...initialState,
      templateSearchQuery: 'hero',
      templateCategoryFilter: 'Title',
      deckTemplateCategoryFilter: 'Business',
    };

    const result = catalogReducer(stateWithAllFilters, {
      type: 'CLEAR_TEMPLATE_FILTERS',
    });

    expect(result.templateSearchQuery).toBe('');
    expect(result.templateCategoryFilter).toBeNull();
    expect(result.deckTemplateCategoryFilter).toBeNull();
  });

  it('CLEAR_TEMPLATE_FILTERS does not affect deck searchQuery or statusFilters (AC-5)', () => {
    const stateWithMixedFilters = {
      ...initialState,
      searchQuery: 'my-deck-search',
      statusFilters: ['planned'] as const,
      templateSearchQuery: 'hero',
      templateCategoryFilter: 'Title',
      deckTemplateCategoryFilter: 'Business',
    };

    const result = catalogReducer(stateWithMixedFilters, {
      type: 'CLEAR_TEMPLATE_FILTERS',
    });

    // Template filters cleared
    expect(result.templateSearchQuery).toBe('');
    expect(result.templateCategoryFilter).toBeNull();
    expect(result.deckTemplateCategoryFilter).toBeNull();
    // Deck filters untouched
    expect(result.searchQuery).toBe('my-deck-search');
    expect(result.statusFilters).toEqual(['planned']);
  });

  it('initialState has deckTemplateCategoryFilter as null (AC-3)', () => {
    expect(initialState.deckTemplateCategoryFilter).toBeNull();
  });
});

// =============================================================================
// tm-1-6: useFilteredDeckTemplates with deckTemplateCategoryFilter hook test
// Story Reference: tm-1-6 Task 7.5 (AC-8)
// =============================================================================

describe('useFilteredDeckTemplates with deckTemplateCategoryFilter (tm-1-6 AC-8)', () => {
  const mockDeckTemplates = [
    { id: 'dt-biz', name: 'Business Pitch', description: 'Business deck', category: 'Business', slideCount: 5 },
    { id: 'dt-sales', name: 'Sales Deck', description: 'Sales deck', category: 'Sales', slideCount: 3 },
    { id: 'dt-biz2', name: 'Corp Overview', description: 'Corporate overview', category: 'Business', slideCount: 8 },
  ] as any[];

  it('returns only matching category when deckTemplateCategoryFilter is set (AC-8)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{
        deckTemplates: mockDeckTemplates,
        deckTemplateCategoryFilter: 'Business',
      } as any}>
        {children}
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredDeckTemplates(), { wrapper });
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered.map((t: any) => t.id)).toEqual(['dt-biz', 'dt-biz2']);
    expect(result.current.total).toBe(3);
  });

  it('returns all deck templates when deckTemplateCategoryFilter is null (AC-8)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{
        deckTemplates: mockDeckTemplates,
      } as any}>
        {children}
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredDeckTemplates(), { wrapper });
    expect(result.current.filtered).toHaveLength(3);
  });

  it('does not affect slide template category filter independently (AC-3)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{
        deckTemplates: mockDeckTemplates,
        deckTemplateCategoryFilter: 'Sales',
        templateCategoryFilter: 'Data',  // slide filter — should not affect deck results
      } as any}>
        {children}
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredDeckTemplates(), { wrapper });
    // Only Sales deck templates returned, Data slide filter has no effect on deck templates
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].id).toBe('dt-sales');
  });
});
