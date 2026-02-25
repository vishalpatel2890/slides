/**
 * Tests for useSearch / filterDecks — client-side filtering logic.
 *
 * Story Reference: cv-1-5 Task 1, Task 8.1 — useSearch hook
 * AC-1: Filters by name, audience
 * AC-2: Combines search + status filters via AND intersection
 * AC-4: Empty query returns all decks
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { filterDecks, useFilteredDecks } from '../../../src/webview/catalog/hooks/useSearch';
import { CatalogProvider } from '../../../src/webview/catalog/context/CatalogContext';
import type { DeckInfo, DeckStatus } from '../../../src/shared/types';

// =============================================================================
// Test Data
// =============================================================================

const DECKS: DeckInfo[] = [
  { id: 'd1', name: 'Q3 Report', path: '/d1', slideCount: 10, builtSlideCount: 10, status: 'built', lastModified: 1704067200000, audience: 'executives' },
  { id: 'd2', name: 'Pitch Deck', path: '/d2', slideCount: 8, builtSlideCount: 8, status: 'built', lastModified: 1704153600000, audience: 'investors' },
  { id: 'd3', name: 'Onboarding', path: '/d3', slideCount: 6, builtSlideCount: 3, status: 'partial', lastModified: 1704240000000, audience: 'new hires' },
  { id: 'd4', name: 'Product Launch', path: '/d4', slideCount: 12, builtSlideCount: 0, status: 'planned', lastModified: 1704326400000, audience: 'customers' },
];

// =============================================================================
// filterDecks unit tests
// =============================================================================

describe('filterDecks', () => {
  it('returns all decks when query is empty and no filters', () => {
    const result = filterDecks(DECKS, '', []);
    expect(result).toHaveLength(4);
  });

  it('filters by deck name (case-insensitive)', () => {
    const result = filterDecks(DECKS, 'q3', []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Q3 Report');
  });

  it('filters by audience field', () => {
    const result = filterDecks(DECKS, 'investors', []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pitch Deck');
  });

  it('filters by partial name match', () => {
    const result = filterDecks(DECKS, 'deck', []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pitch Deck');
  });

  it('returns empty array when no matches', () => {
    const result = filterDecks(DECKS, 'zzzzz', []);
    expect(result).toHaveLength(0);
  });

  it('filters by single status', () => {
    const result = filterDecks(DECKS, '', ['built']);
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.status === 'built')).toBe(true);
  });

  it('filters by multiple statuses (OR within filters)', () => {
    const result = filterDecks(DECKS, '', ['built', 'planned']);
    expect(result).toHaveLength(3);
  });

  it('combines search query and status filters via AND intersection', () => {
    const result = filterDecks(DECKS, 'Pitch', ['built', 'planned']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pitch Deck');
  });

  it('returns empty when AND intersection yields no results', () => {
    const result = filterDecks(DECKS, 'Q3', ['planned']);
    expect(result).toHaveLength(0);
  });

  it('handles empty decks array', () => {
    const result = filterDecks([], 'test', ['built']);
    expect(result).toHaveLength(0);
  });

  it('handles deck without audience field — does not crash', () => {
    const decksNoAudience: DeckInfo[] = [
      { id: 'd5', name: 'Simple Deck', path: '/d5', slideCount: 1, builtSlideCount: 0, status: 'planned', lastModified: 1704067200000 },
    ];
    const result = filterDecks(decksNoAudience, 'executives', []);
    expect(result).toHaveLength(0);
  });

  it('matches deck with audience when query matches audience but not name', () => {
    const result = filterDecks(DECKS, 'new hires', []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Onboarding');
  });
});

// =============================================================================
// useFilteredDecks hook tests
// =============================================================================

describe('useFilteredDecks', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CatalogProvider initialOverrides={{ decks: DECKS }}>
      {children}
    </CatalogProvider>
  );

  it('returns all decks and correct total when no filters', () => {
    const { result } = renderHook(() => useFilteredDecks(), { wrapper });
    expect(result.current.filtered).toHaveLength(4);
    expect(result.current.total).toBe(4);
  });

  it('returns filtered count with search query', () => {
    const searchWrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{ decks: DECKS, searchQuery: 'Q3' }}>
        {children}
      </CatalogProvider>
    );
    const { result } = renderHook(() => useFilteredDecks(), { wrapper: searchWrapper });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.total).toBe(4);
  });

  it('returns filtered count with status filters', () => {
    const filterWrapper = ({ children }: { children: React.ReactNode }) => (
      <CatalogProvider initialOverrides={{ decks: DECKS, statusFilters: ['built'] }}>
        {children}
      </CatalogProvider>
    );
    const { result } = renderHook(() => useFilteredDecks(), { wrapper: filterWrapper });
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.total).toBe(4);
  });
});
