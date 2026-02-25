/**
 * Tests for AssetGrid component — rendering, type filter chips, tag filter chips,
 * search, empty state, result count, and accessibility.
 *
 * Story Reference: cv-4-1 AC-1 through AC-8, AC-10
 * Story Reference: cv-4-2 AC-11 through AC-16
 */

import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';

// Mock ResizeObserver (required by Radix UI Tooltip)
class ResizeObserverMock {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});
import { AssetGrid } from '../../src/webview/catalog/components/AssetGrid';
import {
  CatalogProvider,
  useCatalog,
  useBrandAssets,
  useAssetSubCategory,
  useFilteredBrandAssets,
  useAssetSearchQuery,
  useAssetTypeFilters,
  useAssetTagFilters,
  useAvailableAssetTags,
  useHasActiveAssetFilters,
  catalogReducer,
  initialState,
} from '../../src/webview/catalog/context/CatalogContext';
import type { BrandAsset } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockAssets: BrandAsset[] = [
  {
    id: 'asset-1',
    name: 'Logo Mark',
    type: 'icon',
    path: '/config/catalog/brand-assets/icons/logo-mark.svg',
    relativePath: 'icons/logo-mark.svg',
    description: 'Primary logo mark for brand',
    tags: ['logo', 'brand'],
    fileSize: 2048,
    format: 'svg',
    lastModified: 1704067200000,
    webviewUri: 'https://webview-uri/icons/logo-mark.svg',
  },
  {
    id: 'asset-2',
    name: 'Company Logo',
    type: 'logo',
    path: '/config/catalog/brand-assets/logos/company-logo.png',
    relativePath: 'logos/company-logo.png',
    description: 'Full company logo',
    tags: ['company', 'official'],
    fileSize: 15360,
    format: 'png',
    lastModified: 1704067200000,
    webviewUri: 'https://webview-uri/logos/company-logo.png',
  },
  {
    id: 'asset-3',
    name: 'Hero Background',
    type: 'image',
    path: '/config/catalog/brand-assets/images/hero-bg.jpg',
    relativePath: 'images/hero-bg.jpg',
    description: '',
    tags: [],
    fileSize: 524288,
    format: 'jpg',
    lastModified: 1704067200000,
    webviewUri: 'https://webview-uri/images/hero-bg.jpg',
  },
  {
    id: 'asset-4',
    name: 'Arrow Icon',
    type: 'icon',
    path: '/config/catalog/brand-assets/icons/arrow.svg',
    relativePath: 'icons/arrow.svg',
    description: 'Right arrow navigation icon',
    tags: ['navigation', 'brand'],
    fileSize: 1024,
    format: 'svg',
    lastModified: 1704067200000,
    webviewUri: 'https://webview-uri/icons/arrow.svg',
  },
];

// Helper to render with assets in context, exposing dispatch for state-driven tests
function renderWithAssets(assets: BrandAsset[] = mockAssets) {
  let dispatchRef!: ReturnType<typeof useCatalog>['dispatch'];

  function AssetsInjector({ children }: { children: React.ReactNode }) {
    const { dispatch } = useCatalog();
    dispatchRef = dispatch;
    React.useEffect(() => {
      dispatch({ type: 'SET_BRAND_ASSETS', assets });
    }, [dispatch, assets]);
    return <>{children}</>;
  }

  const result = render(
    <CatalogProvider>
      <AssetsInjector>
        <AssetGrid />
      </AssetsInjector>
    </CatalogProvider>
  );

  return { ...result, dispatch: dispatchRef };
}

// =============================================================================
// Rendering Tests (AC-1, AC-3)
// =============================================================================

describe('AssetGrid - Content Display', () => {
  it('renders grid with asset cards (AC-1)', () => {
    renderWithAssets();
    expect(screen.getByRole('grid', { name: 'Brand assets' })).toBeDefined();
    expect(screen.getAllByRole('gridcell')).toHaveLength(4);
  });

  it('displays asset filenames (AC-3)', () => {
    renderWithAssets();
    expect(screen.getByText('Logo Mark')).toBeDefined();
    expect(screen.getByText('Company Logo')).toBeDefined();
    expect(screen.getByText('Hero Background')).toBeDefined();
  });

  it('renders thumbnails with webviewUri (AC-3)', () => {
    renderWithAssets();
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(4);
    expect(images[0]).toHaveAttribute('src', 'https://webview-uri/icons/logo-mark.svg');
  });

  it('renders placeholder when no webviewUri', () => {
    const assetsNoUri = mockAssets.map((a) => ({ ...a, webviewUri: undefined }));
    renderWithAssets(assetsNoUri);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(screen.getAllByRole('gridcell')).toHaveLength(4);
  });
});

// =============================================================================
// Type Filter Chip Tests (cv-4-2 AC-13) — replaces Sub-category Tab Tests
// =============================================================================

describe('AssetGrid - Type Filter Chips (AC-13)', () => {
  it('renders Icons, Logos, Images filter chips', () => {
    renderWithAssets();
    expect(screen.getByRole('button', { name: 'Icons' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Logos' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Images' })).toBeDefined();
  });

  it('type chips have aria-pressed=false by default', () => {
    renderWithAssets();
    const iconsChip = screen.getByRole('button', { name: 'Icons' });
    expect(iconsChip.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking Icons chip filters to icons only (AC-13)', async () => {
    renderWithAssets();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
    });

    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(2); // Logo Mark + Arrow Icon
    expect(screen.getByText('Logo Mark')).toBeDefined();
    expect(screen.getByText('Arrow Icon')).toBeDefined();
  });

  it('clicking Icons chip sets aria-pressed=true', async () => {
    renderWithAssets();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
    });

    expect(screen.getByRole('button', { name: 'Icons' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('clicking active chip toggles it off', async () => {
    renderWithAssets();

    // Activate
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
    });
    expect(screen.getAllByRole('gridcell')).toHaveLength(2);

    // Deactivate
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
    });
    expect(screen.getAllByRole('gridcell')).toHaveLength(4);
  });

  it('multiple type chips can be active simultaneously (multi-select)', async () => {
    renderWithAssets();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
      fireEvent.click(screen.getByRole('button', { name: 'Logos' }));
    });

    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(3); // 2 icons + 1 logo
  });

  it('filter chip group has aria-label', () => {
    renderWithAssets();
    expect(screen.getByRole('group', { name: 'Filter by type' })).toBeDefined();
  });
});

// =============================================================================
// Search Tests (cv-4-2 AC-11, AC-12)
// =============================================================================

describe('AssetGrid - Search Filtering (AC-11, AC-12)', () => {
  // Note: Search bar UI is in the top-level SearchBar component (tab-aware).
  // These tests verify that dispatched search state correctly filters the AssetGrid.

  it('search state filters assets by name (AC-12)', async () => {
    const { dispatch } = renderWithAssets();

    await act(async () => {
      dispatch({ type: 'SET_ASSET_SEARCH', query: 'logo' });
    });

    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(2); // Logo Mark + Company Logo
  });

  it('search matches description (AC-12)', async () => {
    const { dispatch } = renderWithAssets();

    await act(async () => {
      dispatch({ type: 'SET_ASSET_SEARCH', query: 'arrow navigation' });
    });

    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(1);
    expect(screen.getByText('Arrow Icon')).toBeDefined();
  });

  it('search matches tags (AC-12)', async () => {
    const { dispatch } = renderWithAssets();

    await act(async () => {
      dispatch({ type: 'SET_ASSET_SEARCH', query: 'official' });
    });

    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(1);
    expect(screen.getByText('Company Logo')).toBeDefined();
  });

  it('search is case-insensitive', async () => {
    const { dispatch } = renderWithAssets();

    await act(async () => {
      dispatch({ type: 'SET_ASSET_SEARCH', query: 'HERO' });
    });

    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(1);
    expect(screen.getByText('Hero Background')).toBeDefined();
  });
});

// =============================================================================
// Combined Filter Tests (cv-4-2 AC-11 + AC-13 + AC-14)
// =============================================================================

describe('AssetGrid - Combined Filters', () => {
  it('search + type filter combine with AND intersection', async () => {
    const { dispatch } = renderWithAssets();

    // Search for "logo" → matches Logo Mark (icon) and Company Logo (logo)
    await act(async () => {
      dispatch({ type: 'SET_ASSET_SEARCH', query: 'logo' });
    });
    expect(screen.getAllByRole('gridcell')).toHaveLength(2);

    // Add Icons type filter → only Logo Mark (icon with "logo" in name)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
    });
    expect(screen.getAllByRole('gridcell')).toHaveLength(1);
    expect(screen.getByText('Logo Mark')).toBeDefined();
  });
});

// =============================================================================
// Empty State Tests (AC-7, cv-4-2 AC-15)
// =============================================================================

describe('AssetGrid - Empty State', () => {
  it('shows empty state when no assets exist (AC-7)', () => {
    renderWithAssets([]);
    expect(screen.getByText(/No assets in your brand library/)).toBeDefined();
  });

  it('includes guidance text about adding assets', () => {
    renderWithAssets([]);
    expect(screen.getByText(/\.slide-builder\/config\/catalog\/brand-assets\//)).toBeDefined();
  });

  it('shows search empty state with query message (AC-15)', async () => {
    const { dispatch } = renderWithAssets();

    await act(async () => {
      dispatch({ type: 'SET_ASSET_SEARCH', query: 'xyznonexistent' });
    });

    expect(screen.getByText("No results for 'xyznonexistent'")).toBeDefined();
  });

  it('shows "Clear filters" link in search empty state (AC-15)', async () => {
    const { dispatch } = renderWithAssets();

    await act(async () => {
      dispatch({ type: 'SET_ASSET_SEARCH', query: 'xyznonexistent' });
    });

    expect(screen.getByText('Clear filters')).toBeDefined();
  });

  it('"Clear filters" restores full grid (AC-15)', async () => {
    const { dispatch } = renderWithAssets();

    await act(async () => {
      dispatch({ type: 'SET_ASSET_SEARCH', query: 'xyznonexistent' });
    });

    expect(screen.queryByRole('grid')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByText('Clear filters'));
    });

    expect(screen.getAllByRole('gridcell')).toHaveLength(4);
  });

  it('shows "No matching assets" when type filter yields no results', async () => {
    // Only icons in the data
    const iconsOnly: BrandAsset[] = [mockAssets[0], mockAssets[3]];
    renderWithAssets(iconsOnly);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Logos' }));
    });

    expect(screen.getByText('No matching assets')).toBeDefined();
  });
});

// Note: Result count (AC-16) is now displayed in the top-level SearchBar component,
// not within AssetGrid. Result count tests belong in SearchBar.test.tsx.

// =============================================================================
// Add Assets Button (AC-8)
// =============================================================================

describe('AssetGrid - Add Assets Button', () => {
  it('renders "+ Add Assets" button (AC-8)', () => {
    renderWithAssets();
    expect(screen.getByRole('button', { name: 'Add brand assets' })).toBeDefined();
    expect(screen.getByText('Add Assets')).toBeDefined();
  });

  it('button is clickable', () => {
    renderWithAssets();
    const button = screen.getByRole('button', { name: 'Add brand assets' });
    expect(() => fireEvent.click(button)).not.toThrow();
  });
});

// =============================================================================
// Accessibility Tests (AC-10)
// =============================================================================

describe('AssetGrid - Accessibility', () => {
  it('grid has role="grid" with aria-label (AC-10)', () => {
    renderWithAssets();
    const grid = screen.getByRole('grid');
    expect(grid.getAttribute('aria-label')).toBe('Brand assets');
  });

  it('cards have role="gridcell" with descriptive aria-labels (AC-10)', () => {
    renderWithAssets();
    const cells = screen.getAllByRole('gridcell');
    expect(cells[0].getAttribute('aria-label')).toBe('Asset: Logo Mark, type: icon');
    expect(cells[1].getAttribute('aria-label')).toBe('Asset: Company Logo, type: logo');
  });

  it('cards have tabIndex for keyboard focus (AC-10)', () => {
    renderWithAssets();
    const cells = screen.getAllByRole('gridcell');
    expect(cells[0].getAttribute('tabindex')).toBe('0');
  });

  it('arrow key navigation moves focus between cards (AC-10)', () => {
    renderWithAssets();
    const cells = screen.getAllByRole('gridcell');

    cells[0].focus();
    expect(document.activeElement).toBe(cells[0]);

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cells[1]);
  });

  it('type filter chips have aria-pressed attribute', () => {
    renderWithAssets();
    const chips = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('aria-pressed') !== null,
    );
    expect(chips.length).toBeGreaterThanOrEqual(3); // Icons, Logos, Images
  });
});

// =============================================================================
// CatalogContext Brand Asset Tests
// =============================================================================

describe('CatalogContext - Brand Asset Actions', () => {
  it('SET_BRAND_ASSETS updates assets state', () => {
    const state = catalogReducer(initialState, {
      type: 'SET_BRAND_ASSETS',
      assets: mockAssets,
    });
    expect(state.assets).toEqual(mockAssets);
  });

  it('SET_ASSET_SUB_CATEGORY updates assetSubCategory', () => {
    const state = catalogReducer(initialState, {
      type: 'SET_ASSET_SUB_CATEGORY',
      subCategory: 'icons',
    });
    expect(state.assetSubCategory).toBe('icons');
  });

  it('initial state has empty assets and "all" sub-category', () => {
    expect(initialState.assets).toEqual([]);
    expect(initialState.assetSubCategory).toBe('all');
  });

  it('initial state has empty search/filter state (cv-4-2)', () => {
    expect(initialState.assetSearchQuery).toBe('');
    expect(initialState.assetTypeFilters).toEqual([]);
    expect(initialState.assetTagFilters).toEqual([]);
  });
});

// =============================================================================
// CatalogContext - cv-4-2 Search/Filter Actions
// =============================================================================

describe('CatalogContext - Asset Search/Filter Actions (cv-4-2)', () => {
  it('SET_ASSET_SEARCH updates assetSearchQuery', () => {
    const state = catalogReducer(initialState, {
      type: 'SET_ASSET_SEARCH',
      query: 'logo',
    });
    expect(state.assetSearchQuery).toBe('logo');
  });

  it('TOGGLE_ASSET_TYPE_FILTER adds type to filter', () => {
    const state = catalogReducer(initialState, {
      type: 'TOGGLE_ASSET_TYPE_FILTER',
      filterType: 'icon',
    });
    expect(state.assetTypeFilters).toEqual(['icon']);
  });

  it('TOGGLE_ASSET_TYPE_FILTER removes type when already present', () => {
    const withIcon = catalogReducer(initialState, {
      type: 'TOGGLE_ASSET_TYPE_FILTER',
      filterType: 'icon',
    });
    const withoutIcon = catalogReducer(withIcon, {
      type: 'TOGGLE_ASSET_TYPE_FILTER',
      filterType: 'icon',
    });
    expect(withoutIcon.assetTypeFilters).toEqual([]);
  });

  it('TOGGLE_ASSET_TYPE_FILTER supports multiple types', () => {
    let state = catalogReducer(initialState, {
      type: 'TOGGLE_ASSET_TYPE_FILTER',
      filterType: 'icon',
    });
    state = catalogReducer(state, {
      type: 'TOGGLE_ASSET_TYPE_FILTER',
      filterType: 'logo',
    });
    expect(state.assetTypeFilters).toEqual(['icon', 'logo']);
  });

  it('TOGGLE_ASSET_TAG_FILTER adds tag to filter', () => {
    const state = catalogReducer(initialState, {
      type: 'TOGGLE_ASSET_TAG_FILTER',
      tag: 'brand',
    });
    expect(state.assetTagFilters).toEqual(['brand']);
  });

  it('TOGGLE_ASSET_TAG_FILTER removes tag when already present', () => {
    const withTag = catalogReducer(initialState, {
      type: 'TOGGLE_ASSET_TAG_FILTER',
      tag: 'brand',
    });
    const withoutTag = catalogReducer(withTag, {
      type: 'TOGGLE_ASSET_TAG_FILTER',
      tag: 'brand',
    });
    expect(withoutTag.assetTagFilters).toEqual([]);
  });

  it('CLEAR_ASSET_FILTERS resets all asset search state', () => {
    let state = catalogReducer(initialState, { type: 'SET_ASSET_SEARCH', query: 'test' });
    state = catalogReducer(state, { type: 'TOGGLE_ASSET_TYPE_FILTER', filterType: 'icon' });
    state = catalogReducer(state, { type: 'TOGGLE_ASSET_TAG_FILTER', tag: 'brand' });

    const cleared = catalogReducer(state, { type: 'CLEAR_ASSET_FILTERS' });
    expect(cleared.assetSearchQuery).toBe('');
    expect(cleared.assetTypeFilters).toEqual([]);
    expect(cleared.assetTagFilters).toEqual([]);
  });

  it('CLEAR_ASSET_FILTERS does not affect deck search state', () => {
    let state = catalogReducer(initialState, { type: 'SET_SEARCH', query: 'deck search' });
    state = catalogReducer(state, { type: 'SET_ASSET_SEARCH', query: 'asset search' });

    const cleared = catalogReducer(state, { type: 'CLEAR_ASSET_FILTERS' });
    expect(cleared.assetSearchQuery).toBe('');
    expect(cleared.searchQuery).toBe('deck search');
  });
});

// =============================================================================
// CatalogContext - Brand Asset Selector Hooks (cv-4-2)
// =============================================================================

describe('CatalogContext - Brand Asset Selector Hooks (cv-4-2)', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CatalogProvider>{children}</CatalogProvider>
  );

  it('useBrandAssets returns empty array by default', () => {
    const { result } = renderHook(() => useBrandAssets(), { wrapper });
    expect(result.current).toEqual([]);
  });

  it('useAssetSubCategory returns "all" by default', () => {
    const { result } = renderHook(() => useAssetSubCategory(), { wrapper });
    expect(result.current).toBe('all');
  });

  it('useAssetSearchQuery returns empty string by default', () => {
    const { result } = renderHook(() => useAssetSearchQuery(), { wrapper });
    expect(result.current).toBe('');
  });

  it('useAssetTypeFilters returns empty array by default', () => {
    const { result } = renderHook(() => useAssetTypeFilters(), { wrapper });
    expect(result.current).toEqual([]);
  });

  it('useAssetTagFilters returns empty array by default', () => {
    const { result } = renderHook(() => useAssetTagFilters(), { wrapper });
    expect(result.current).toEqual([]);
  });

  it('useHasActiveAssetFilters returns false when no filters active', () => {
    const { result } = renderHook(() => useHasActiveAssetFilters(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('useFilteredBrandAssets returns { filtered, total } shape', () => {
    function TestWrapper({ children }: { children: React.ReactNode }) {
      const { dispatch } = useCatalog();
      React.useEffect(() => {
        dispatch({ type: 'SET_BRAND_ASSETS', assets: mockAssets });
      }, [dispatch]);
      return <>{children}</>;
    }

    const outerWrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider>
        <TestWrapper>{children}</TestWrapper>
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredBrandAssets(), { wrapper: outerWrapper });
    expect(result.current.filtered).toHaveLength(4);
    expect(result.current.total).toBe(4);
  });

  it('useFilteredBrandAssets filters by search query', () => {
    function TestWrapper({ children }: { children: React.ReactNode }) {
      const { dispatch } = useCatalog();
      React.useEffect(() => {
        dispatch({ type: 'SET_BRAND_ASSETS', assets: mockAssets });
        dispatch({ type: 'SET_ASSET_SEARCH', query: 'logo' });
      }, [dispatch]);
      return <>{children}</>;
    }

    const outerWrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider>
        <TestWrapper>{children}</TestWrapper>
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredBrandAssets(), { wrapper: outerWrapper });
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.total).toBe(4);
  });

  it('useFilteredBrandAssets filters by type', () => {
    function TestWrapper({ children }: { children: React.ReactNode }) {
      const { dispatch } = useCatalog();
      React.useEffect(() => {
        dispatch({ type: 'SET_BRAND_ASSETS', assets: mockAssets });
        dispatch({ type: 'TOGGLE_ASSET_TYPE_FILTER', filterType: 'icon' });
      }, [dispatch]);
      return <>{children}</>;
    }

    const outerWrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider>
        <TestWrapper>{children}</TestWrapper>
      </CatalogProvider>
    );

    const { result } = renderHook(() => useFilteredBrandAssets(), { wrapper: outerWrapper });
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered.every((a) => a.type === 'icon')).toBe(true);
  });

  it('useAvailableAssetTags returns tags sorted by frequency', () => {
    function TestWrapper({ children }: { children: React.ReactNode }) {
      const { dispatch } = useCatalog();
      React.useEffect(() => {
        dispatch({ type: 'SET_BRAND_ASSETS', assets: mockAssets });
      }, [dispatch]);
      return <>{children}</>;
    }

    const outerWrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider>
        <TestWrapper>{children}</TestWrapper>
      </CatalogProvider>
    );

    const { result } = renderHook(() => useAvailableAssetTags(), { wrapper: outerWrapper });
    // 'brand' appears on 2 assets, 'logo' on 1, etc.
    expect(result.current[0]).toBe('brand');
    expect(result.current.length).toBeGreaterThan(0);
  });
});
