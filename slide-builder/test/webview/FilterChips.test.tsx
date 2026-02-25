/**
 * Tests for FilterChips component.
 *
 * Story Reference: cv-1-5 Task 3, Task 8.2 — FilterChips
 * AC-2: Status filter chips with toggle, primary bg active, AND logic.
 * AC-8: Horizontally scrollable container.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CatalogProvider } from '../../src/webview/catalog/context/CatalogContext';
import { FilterChips } from '../../src/webview/catalog/components/FilterChips';

// =============================================================================
// Helper
// =============================================================================

function renderFilterChips(overrides?: Parameters<typeof CatalogProvider>[0]['initialOverrides']) {
  return render(
    <CatalogProvider initialOverrides={overrides}>
      <FilterChips />
    </CatalogProvider>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe('FilterChips', () => {
  it('renders 3 filter chips (Planned, Partial, Built)', () => {
    renderFilterChips();
    expect(screen.getByText('Planned')).toBeDefined();
    expect(screen.getByText('Partial')).toBeDefined();
    expect(screen.getByText('Built')).toBeDefined();
  });

  it('has role="group" container with accessible label', () => {
    renderFilterChips();
    const group = screen.getByRole('group', { name: /filter by status/i });
    expect(group).toBeDefined();
  });

  it('each chip has role="checkbox"', () => {
    renderFilterChips();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('chips start with aria-checked="false"', () => {
    renderFilterChips();
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => {
      expect(cb).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('clicking a chip toggles aria-checked to "true"', () => {
    renderFilterChips();
    const builtChip = screen.getByRole('checkbox', { name: /filter by built/i });
    expect(builtChip).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(builtChip);
    expect(builtChip).toHaveAttribute('aria-checked', 'true');
  });

  it('clicking an active chip deactivates it', () => {
    renderFilterChips({ statusFilters: ['built'] });
    const builtChip = screen.getByRole('checkbox', { name: /filter by built/i });
    expect(builtChip).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(builtChip);
    expect(builtChip).toHaveAttribute('aria-checked', 'false');
  });

  it('multiple chips can be active simultaneously', () => {
    renderFilterChips();
    const builtChip = screen.getByRole('checkbox', { name: /filter by built/i });
    const plannedChip = screen.getByRole('checkbox', { name: /filter by planned/i });

    fireEvent.click(builtChip);
    fireEvent.click(plannedChip);

    expect(builtChip).toHaveAttribute('aria-checked', 'true');
    expect(plannedChip).toHaveAttribute('aria-checked', 'true');
  });

  it('active chip has --active class', () => {
    renderFilterChips({ statusFilters: ['planned'] });
    const plannedChip = screen.getByRole('checkbox', { name: /filter by planned/i });
    expect(plannedChip.className).toContain('filter-chip--active');
  });

  it('inactive chip does not have --active class', () => {
    renderFilterChips();
    const builtChip = screen.getByRole('checkbox', { name: /filter by built/i });
    expect(builtChip.className).not.toContain('filter-chip--active');
  });

  it('each chip has aria-label with status name', () => {
    renderFilterChips();
    expect(screen.getByLabelText('Filter by Planned')).toBeDefined();
    expect(screen.getByLabelText('Filter by Partial')).toBeDefined();
    expect(screen.getByLabelText('Filter by Built')).toBeDefined();
  });
});
