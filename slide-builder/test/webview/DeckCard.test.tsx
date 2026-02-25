/**
 * Tests for DeckCard component.
 * Story Reference: cv-1-4 Task 4 — DeckCard component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DeckCard } from '../../src/webview/catalog/components/DeckCard';
import { CatalogProvider } from '../../src/webview/catalog/context/CatalogContext';
import type { DeckInfo } from '../../src/shared/types';

const mockDeck: DeckInfo = {
  id: 'deck-1',
  name: 'Product Launch',
  path: '/decks/product-launch',
  slideCount: 12,
  builtSlideCount: 8,
  status: 'partial',
  lastModified: Date.now(),
};

function renderDeckCard(overrides?: Partial<DeckInfo>, onClick?: (id: string) => void) {
  const deck = { ...mockDeck, ...overrides };
  return render(
    <CatalogProvider>
      <DeckCard deck={deck} onClick={onClick} />
    </CatalogProvider>
  );
}

describe('DeckCard', () => {
  it('renders deck name (AC-1)', () => {
    renderDeckCard();
    expect(screen.getByText('Product Launch')).toBeDefined();
  });

  it('renders slide count text (AC-1)', () => {
    renderDeckCard();
    expect(screen.getByText('12 slides')).toBeDefined();
  });

  it('uses singular "slide" for count of 1', () => {
    renderDeckCard({ slideCount: 1 });
    expect(screen.getByText('1 slide')).toBeDefined();
  });

  it('renders StatusDot with correct status (AC-1)', () => {
    renderDeckCard();
    expect(screen.getByRole('img', { name: /Partially built/ })).toBeDefined();
  });

  it('has role="button" (AC-2)', () => {
    renderDeckCard();
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('has tabIndex=0 for keyboard focus (AC-2)', () => {
    renderDeckCard();
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
  });

  it('has comprehensive aria-label (AC-7)', () => {
    renderDeckCard();
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Deck: Product Launch, 12 slides, status: partial',
    );
  });

  it('calls onClick with deckId when clicked (AC-10)', () => {
    const onClick = vi.fn();
    renderDeckCard(undefined, onClick);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith('deck-1');
  });

  it('calls onClick on Enter key (AC-2)', () => {
    const onClick = vi.fn();
    renderDeckCard(undefined, onClick);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledWith('deck-1');
  });

  it('calls onClick on Space key (AC-2)', () => {
    const onClick = vi.fn();
    renderDeckCard(undefined, onClick);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalledWith('deck-1');
  });

  it('does not trigger on other keys', () => {
    const onClick = vi.fn();
    renderDeckCard(undefined, onClick);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies deck-card base class', () => {
    renderDeckCard();
    expect(screen.getByRole('button').className).toContain('deck-card');
  });

  it('renders thumbnail skeleton area', () => {
    const { container } = renderDeckCard();
    expect(container.querySelector('.thumbnail-skeleton')).toBeDefined();
    expect(container.querySelector('.thumbnail-skeleton')).not.toBeNull();
  });

  // cv-1-6 AC-7: Context menu
  describe('Context Menu (cv-1-6 AC-7)', () => {
    it('opens dropdown menu on right-click', () => {
      renderDeckCard();
      const card = screen.getByRole('button');
      fireEvent.contextMenu(card);
      // Radix DropdownMenu renders menu items when open
      expect(screen.getByText('Open')).toBeDefined();
      expect(screen.getByText('Edit Plan')).toBeDefined();
      expect(screen.getByText('Present')).toBeDefined();
      expect(screen.getByText('Duplicate')).toBeDefined();
      expect(screen.getByText('Delete')).toBeDefined();
    });

    it('"Open" menu item triggers onClick', () => {
      const onClick = vi.fn();
      renderDeckCard(undefined, onClick);
      fireEvent.contextMenu(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Open'));
      expect(onClick).toHaveBeenCalledWith('deck-1');
    });

    it('"Edit Plan" menu item triggers onEditPlan', () => {
      const onEditPlan = vi.fn();
      const deck = { ...mockDeck };
      render(
        <CatalogProvider>
          <DeckCard deck={deck} onEditPlan={onEditPlan} />
        </CatalogProvider>
      );
      fireEvent.contextMenu(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Edit Plan'));
      expect(onEditPlan).toHaveBeenCalledWith('deck-1');
    });

    it('disabled menu items have disabled attribute', () => {
      renderDeckCard();
      fireEvent.contextMenu(screen.getByRole('button'));
      const presentItem = screen.getByText('Present').closest('[role="menuitem"]');
      expect(presentItem).toHaveAttribute('data-disabled');
    });
  });
});
