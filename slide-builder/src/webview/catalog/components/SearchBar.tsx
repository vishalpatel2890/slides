/**
 * SearchBar - Search input with dynamic placeholder per active tab.
 *
 * Story Reference: cv-1-2 Task 4 — SearchBar component
 * Story Reference: cv-1-5 Task 4 — Result count display, responsive collapse
 * Story Reference: cv-4-2 — Tab-aware dispatching for brand asset search
 *
 * AC-5: role="search", aria-label="Search decks", aria-label="Clear search"
 * AC-7: Collapses to icon button when sidebar < 400px
 * cv-4-2: Dispatches SET_ASSET_SEARCH on brand-assets tab, SET_SEARCH on decks tab
 */

import React, { useCallback, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useCatalog, useHasActiveAssetFilters, useHasActiveTemplateFilters } from '../context/CatalogContext';
import type { CatalogTab } from '../../../shared/types';

// =============================================================================
// Constants
// =============================================================================

const PLACEHOLDERS: Record<CatalogTab, string> = {
  'decks': 'Search decks...',
  'brand-assets': 'Search assets...',
  'templates': 'Search templates...',
};

const ARIA_LABELS: Record<CatalogTab, string> = {
  'decks': 'Search decks',
  'brand-assets': 'Search brand assets',
  'templates': 'Search templates',
};

const RESULT_LABELS: Record<CatalogTab, string> = {
  'decks': 'decks',
  'brand-assets': 'assets',
  'templates': 'templates',
};

// =============================================================================
// Props
// =============================================================================

export interface SearchBarProps {
  /** Result count to display when filtering is active */
  resultCount?: { filtered: number; total: number };
  /** Folder name when drilled into a folder (undefined = root). cv-1-8 AC-4 */
  folderName?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SearchBar({ resultCount, folderName }: SearchBarProps): React.ReactElement {
  const { state, dispatch } = useCatalog();
  const inputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const isBrandAssets = state.activeTab === 'brand-assets';
  // tm-1-6: Add isTemplates flag parallel to isBrandAssets
  const isTemplates = state.activeTab === 'templates';
  const hasActiveAssetFilters = useHasActiveAssetFilters();
  // tm-1-6: Use template-specific active filter check for the templates tab
  const hasActiveTemplateFilters = useHasActiveTemplateFilters();

  // cv-4-2: Use the correct query based on active tab
  // tm-1-6: Templates tab reads templateSearchQuery (not searchQuery) to show persisted value
  const currentQuery = isTemplates
    ? state.templateSearchQuery
    : isBrandAssets
      ? state.assetSearchQuery
      : state.searchQuery;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // tm-1-6: Templates tab dispatches SET_TEMPLATE_SEARCH (not SET_SEARCH)
      if (isTemplates) {
        dispatch({ type: 'SET_TEMPLATE_SEARCH', query: e.target.value });
        return;
      }
      if (isBrandAssets) {
        dispatch({ type: 'SET_ASSET_SEARCH', query: e.target.value });
      } else {
        dispatch({ type: 'SET_SEARCH', query: e.target.value });
      }
    },
    [dispatch, isBrandAssets, isTemplates],
  );

  const handleClear = useCallback(() => {
    // tm-1-6: Templates tab dispatches SET_TEMPLATE_SEARCH to clear template search query
    if (isTemplates) {
      dispatch({ type: 'SET_TEMPLATE_SEARCH', query: '' });
    } else if (isBrandAssets) {
      dispatch({ type: 'SET_ASSET_SEARCH', query: '' });
    } else {
      dispatch({ type: 'SET_SEARCH', query: '' });
    }
    inputRef.current?.focus();
  }, [dispatch, isBrandAssets, isTemplates]);

  const handleExpandToggle = useCallback(() => {
    setExpanded((prev) => {
      if (!prev) {
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      return !prev;
    });
  }, []);

  // tm-1-6: For templates tab, use useHasActiveTemplateFilters() (covers search, slide category, deck category)
  const isFiltering = isTemplates
    ? hasActiveTemplateFilters
    : isBrandAssets
      ? hasActiveAssetFilters
      : state.searchQuery !== '' || state.statusFilters.length > 0;

  return (
    <div className={`catalog-search ${expanded ? 'catalog-search--expanded' : ''}`} role="search">
      {/* Collapse toggle button — only visible at narrow widths via CSS */}
      <button
        type="button"
        className="catalog-search__collapse-toggle"
        onClick={handleExpandToggle}
        aria-label="Toggle search"
      >
        <Search size={14} />
      </button>

      <Search size={14} className="catalog-search__icon" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        className="catalog-search__input"
        placeholder={PLACEHOLDERS[state.activeTab]}
        aria-label={ARIA_LABELS[state.activeTab]}
        value={currentQuery}
        onChange={handleChange}
      />
      {isFiltering && resultCount && (
        <span className="catalog-search__count" role="status" aria-live="polite">
          {resultCount.filtered} of {resultCount.total} {RESULT_LABELS[state.activeTab]}{folderName ? ` in ${folderName}` : ''}
        </span>
      )}
      {currentQuery && (
        <button
          className="catalog-search__clear"
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
