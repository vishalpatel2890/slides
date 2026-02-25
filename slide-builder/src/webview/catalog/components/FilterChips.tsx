/**
 * FilterChips - Status filter chip toggles for deck filtering.
 *
 * Story Reference: cv-1-5 Task 3 — FilterChips component
 *
 * AC-2: Status filter chips (Planned, Partial, Built) with toggle and AND logic.
 * AC-8: Horizontally scrollable when chips overflow.
 */

import React, { useCallback } from 'react';
import { useCatalog } from '../context/CatalogContext';
import type { DeckStatus } from '../../../shared/types';

const FILTER_OPTIONS: { status: DeckStatus; label: string }[] = [
  { status: 'planned', label: 'Planned' },
  { status: 'partial', label: 'Partial' },
  { status: 'built', label: 'Built' },
];

export function FilterChips(): React.ReactElement {
  const { state, dispatch } = useCatalog();

  const handleToggle = useCallback(
    (status: DeckStatus) => {
      dispatch({ type: 'TOGGLE_FILTER', status });
    },
    [dispatch],
  );

  return (
    <div className="filter-chips" role="group" aria-label="Filter by status">
      {FILTER_OPTIONS.map(({ status, label }) => {
        const active = state.statusFilters.includes(status);
        return (
          <button
            key={status}
            type="button"
            role="checkbox"
            aria-checked={active}
            aria-label={`Filter by ${label}`}
            className={`filter-chip ${active ? 'filter-chip--active' : ''}`}
            onClick={() => handleToggle(status)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
