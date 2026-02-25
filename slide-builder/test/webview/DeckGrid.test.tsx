/**
 * Tests for DeckGrid component.
 * Story Reference: cv-1-4 Task 5 — DeckGrid component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DeckGrid } from '../../src/webview/catalog/components/DeckGrid';
import { CatalogProvider } from '../../src/webview/catalog/context/CatalogContext';
import type { DeckInfo } from '../../src/shared/types';

// Helper to wrap component in CatalogProvider
function renderWithProvider(ui: React.ReactElement) {
  return render(<CatalogProvider>{ui}</CatalogProvider>);
}

const mockDecks: DeckInfo[] = [
  {
    id: 'deck-1',
    name: 'Product Launch',
    path: '/decks/product-launch',
    slideCount: 12,
    builtSlideCount: 12,
    status: 'built',
    lastModified: Date.now() - 3600000,
  },
  {
    id: 'deck-2',
    name: 'Team Update',
    path: '/decks/team-update',
    slideCount: 5,
    builtSlideCount: 0,
    status: 'planned',
    lastModified: Date.now() - 86400000,
  },
  {
    id: 'deck-3',
    name: 'Q4 Review',
    path: '/decks/q4-review',
    slideCount: 20,
    builtSlideCount: 10,
    status: 'partial',
    lastModified: Date.now() - 172800000,
  },
];

describe('DeckGrid', () => {
  describe('grid mode', () => {
    it('renders with role="grid" (AC-1)', () => {
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="grid" onDeckClick={vi.fn()} />);
      expect(screen.getByRole('grid')).toBeDefined();
    });

    it('renders gridcell wrappers for each deck', () => {
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="grid" onDeckClick={vi.fn()} />);
      expect(screen.getAllByRole('gridcell')).toHaveLength(3);
    });

    it('renders deck cards with names', () => {
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="grid" onDeckClick={vi.fn()} />);
      expect(screen.getByText('Product Launch')).toBeDefined();
      expect(screen.getByText('Team Update')).toBeDefined();
      expect(screen.getByText('Q4 Review')).toBeDefined();
    });

    it('applies deck-grid class', () => {
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="grid" onDeckClick={vi.fn()} />);
      expect(screen.getByRole('grid').className).toContain('deck-grid');
    });

    it('calls onDeckClick when card is clicked (AC-10)', () => {
      const onClick = vi.fn();
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="grid" onDeckClick={onClick} />);
      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(onClick).toHaveBeenCalledWith('deck-1');
    });
  });

  describe('list mode', () => {
    it('renders with role="list" (AC-4)', () => {
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="list" onDeckClick={vi.fn()} />);
      expect(screen.getByRole('list')).toBeDefined();
    });

    it('renders list items for each deck', () => {
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="list" onDeckClick={vi.fn()} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('shows deck names in list rows', () => {
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="list" onDeckClick={vi.fn()} />);
      expect(screen.getByText('Product Launch')).toBeDefined();
      expect(screen.getByText('Team Update')).toBeDefined();
    });

    it('shows slide counts in list rows', () => {
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="list" onDeckClick={vi.fn()} />);
      expect(screen.getByText('12 slides')).toBeDefined();
      expect(screen.getByText('5 slides')).toBeDefined();
    });

    it('shows relative modified time', () => {
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="list" onDeckClick={vi.fn()} />);
      // Deck-1 was modified 1 hour ago
      expect(screen.getByText('1h ago')).toBeDefined();
    });

    it('calls onDeckClick when list row clicked', () => {
      const onClick = vi.fn();
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="list" onDeckClick={onClick} />);
      fireEvent.click(screen.getAllByRole('listitem')[1]);
      expect(onClick).toHaveBeenCalledWith('deck-2');
    });

    it('calls onDeckClick on Enter key in list row', () => {
      const onClick = vi.fn();
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="list" onDeckClick={onClick} />);
      fireEvent.keyDown(screen.getAllByRole('listitem')[0], { key: 'Enter' });
      expect(onClick).toHaveBeenCalledWith('deck-1');
    });

    it('applies deck-list class', () => {
      renderWithProvider(<DeckGrid decks={mockDecks} viewMode="list" onDeckClick={vi.fn()} />);
      expect(screen.getByRole('list').className).toContain('deck-list');
    });
  });
});
