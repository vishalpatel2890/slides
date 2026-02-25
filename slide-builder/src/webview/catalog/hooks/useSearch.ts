/**
 * useSearch - Re-exports filtering utilities from CatalogContext.
 *
 * Story Reference: cv-1-5 Task 1 — Debounced search + filter logic
 *
 * The core filtering logic (filterDecks, useFilteredDecks) lives in CatalogContext
 * alongside the state it operates on. This module re-exports those utilities
 * for consumers that prefer importing from hooks/.
 */

export { useFilteredDecks, useStatusFilters, filterDecks } from '../context/CatalogContext';
