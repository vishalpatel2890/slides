/**
 * Tests for NavigationHeader component.
 *
 * Story Reference: cv-1-2 Task 3 — NavigationHeader component
 * AC-4: Section title, back arrow when drilled in
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CatalogProvider } from '../../src/webview/catalog/context/CatalogContext';
import { NavigationHeader } from '../../src/webview/catalog/components/NavigationHeader';

// =============================================================================
// Helper
// =============================================================================

function renderNavigationHeader(overrides?: Parameters<typeof CatalogProvider>[0]['initialOverrides']) {
  return render(
    <CatalogProvider initialOverrides={overrides}>
      <NavigationHeader />
    </CatalogProvider>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe('NavigationHeader', () => {
  it('renders with role="navigation"', () => {
    renderNavigationHeader();
    expect(screen.getByRole('navigation')).toBeDefined();
  });

  it('shows section title matching active tab', () => {
    renderNavigationHeader();
    expect(screen.getByText('Decks')).toBeDefined();
  });

  it('shows "Brand Assets" title when on brand-assets tab', () => {
    renderNavigationHeader({
      activeTab: 'brand-assets',
      navigationStack: [{ id: 'brand-assets', label: 'Brand Assets', type: 'tab-root' }],
    });
    expect(screen.getByText('Brand Assets')).toBeDefined();
  });

  it('shows "Templates" title when on templates tab', () => {
    renderNavigationHeader({
      activeTab: 'templates',
      navigationStack: [{ id: 'templates', label: 'Templates', type: 'tab-root' }],
    });
    expect(screen.getByText('Templates')).toBeDefined();
  });

  it('back button is hidden at root level', () => {
    renderNavigationHeader();
    expect(screen.queryByLabelText(/Back to/)).toBeNull();
  });

  it('back button is shown when drilled in', () => {
    renderNavigationHeader({
      navigationStack: [
        { id: 'decks', label: 'Decks', type: 'tab-root' },
        { id: 'd1', label: 'My Deck', type: 'deck-detail' },
      ],
    });
    expect(screen.getByLabelText('Back to Decks')).toBeDefined();
  });

  it('shows current entry label as title when drilled in', () => {
    renderNavigationHeader({
      navigationStack: [
        { id: 'decks', label: 'Decks', type: 'tab-root' },
        { id: 'd1', label: 'My Deck', type: 'deck-detail' },
      ],
    });
    expect(screen.getByText('My Deck')).toBeDefined();
  });

  it('back button click navigates back', () => {
    renderNavigationHeader({
      navigationStack: [
        { id: 'decks', label: 'Decks', type: 'tab-root' },
        { id: 'd1', label: 'My Deck', type: 'deck-detail' },
      ],
    });

    fireEvent.click(screen.getByLabelText('Back to Decks'));

    // After navigating back, should show "Decks" title and no back button
    expect(screen.getByText('Decks')).toBeDefined();
    expect(screen.queryByLabelText(/Back to/)).toBeNull();
  });
});
