/**
 * Tests for SearchBar component.
 *
 * Story Reference: cv-1-2 Task 4 — SearchBar component
 * AC-6: SearchBar with role="search", aria-label, dynamic placeholder
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CatalogProvider } from '../../src/webview/catalog/context/CatalogContext';
import { SearchBar } from '../../src/webview/catalog/components/SearchBar';

// =============================================================================
// Helper
// =============================================================================

function renderSearchBar(
  overrides?: Parameters<typeof CatalogProvider>[0]['initialOverrides'],
  props?: Parameters<typeof SearchBar>[0],
) {
  return render(
    <CatalogProvider initialOverrides={overrides}>
      <SearchBar {...props} />
    </CatalogProvider>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe('SearchBar', () => {
  it('renders with role="search" (AC-6)', () => {
    renderSearchBar();
    expect(screen.getByRole('search')).toBeDefined();
  });

  it('has aria-label on input (AC-6)', () => {
    renderSearchBar();
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Search decks');
  });

  it('shows "Search decks..." placeholder for Decks tab (AC-6)', () => {
    renderSearchBar();
    expect(screen.getByPlaceholderText('Search decks...')).toBeDefined();
  });

  it('shows "Search brand assets..." placeholder for Brand Assets tab', () => {
    renderSearchBar({ activeTab: 'brand-assets' });
    expect(screen.getByPlaceholderText('Search brand assets...')).toBeDefined();
  });

  it('shows "Search templates..." placeholder for Templates tab', () => {
    renderSearchBar({ activeTab: 'templates' });
    expect(screen.getByPlaceholderText('Search templates...')).toBeDefined();
  });

  it('updates aria-label per active tab', () => {
    renderSearchBar({ activeTab: 'templates' });
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Search templates');
  });

  it('accepts text input and updates value', () => {
    renderSearchBar();
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'test query' } });
    expect(input.value).toBe('test query');
  });

  it('clear button is hidden when input is empty', () => {
    renderSearchBar();
    expect(screen.queryByLabelText('Clear search')).toBeNull();
  });

  it('clear button appears when input has text', () => {
    renderSearchBar({ searchQuery: 'hello' });
    expect(screen.getByLabelText('Clear search')).toBeDefined();
  });

  it('clear button resets input to empty', () => {
    renderSearchBar({ searchQuery: 'hello' });
    const clearBtn = screen.getByLabelText('Clear search');

    fireEvent.click(clearBtn);

    // After clearing, button should be gone
    expect(screen.queryByLabelText('Clear search')).toBeNull();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });

  it('dispatches SET_SEARCH when typing', () => {
    renderSearchBar();
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'deck name' } });
    expect(input.value).toBe('deck name');
  });

  // cv-1-5 result count tests
  it('shows result count when resultCount prop provided and filtering active', () => {
    renderSearchBar(
      { searchQuery: 'test' },
      { resultCount: { filtered: 2, total: 5 } },
    );
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('2 of 5 decks')).toBeDefined();
  });

  it('hides result count when not filtering', () => {
    renderSearchBar(undefined, { resultCount: { filtered: 5, total: 5 } });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('has collapse toggle button with aria-label', () => {
    renderSearchBar();
    expect(screen.getByLabelText('Toggle search')).toBeDefined();
  });

  // cv-1-8 folder-scoped result count tests
  it('shows folder name in result count when folderName prop provided (AC-4)', () => {
    renderSearchBar(
      { searchQuery: 'test' },
      { resultCount: { filtered: 2, total: 5 }, folderName: 'Q3 Reports' },
    );
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('2 of 5 decks in Q3 Reports')).toBeDefined();
  });

  it('shows plain result count without folder name at root (AC-4)', () => {
    renderSearchBar(
      { searchQuery: 'test' },
      { resultCount: { filtered: 2, total: 5 } },
    );
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('2 of 5 decks')).toBeDefined();
  });
});
