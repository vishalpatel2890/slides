/**
 * Tests for DeckList component.
 * Story Reference: v3-2-2 Task 5 — DeckList component
 *
 * AC-1: Right-click context menu with same options as Grid view
 * AC-3: Kebab dropdown menu with same options as Grid view
 * AC-5: All Grid operations available and functional in List view
 * AC-7: Folder context menus (Open, Rename, Delete)
 * AC-8: Multi-select (Cmd/Ctrl+Click, Shift+Click)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DeckList } from '../../src/webview/catalog/components/DeckList';
import { CatalogProvider } from '../../src/webview/catalog/context/CatalogContext';
import type { DeckInfo, FolderInfo } from '../../src/shared/types';

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
];

const mockFolders: FolderInfo[] = [
  {
    id: 'folder-1',
    name: 'Marketing',
    path: '/decks/Marketing',
    deckCount: 3,
    lastModified: Date.now() - 7200000,
  },
];

function renderDeckList(
  props?: Partial<React.ComponentProps<typeof DeckList>>,
) {
  const defaultProps = {
    decks: mockDecks,
    folders: mockFolders,
    onDeckClick: vi.fn(),
    onFolderClick: vi.fn(),
  };
  return render(
    <CatalogProvider>
      <DeckList {...defaultProps} {...props} />
    </CatalogProvider>,
  );
}

describe('DeckList', () => {
  it('renders with role="list" (AC-5)', () => {
    renderDeckList();
    expect(screen.getByRole('list')).toBeDefined();
  });

  it('renders deck names', () => {
    renderDeckList();
    expect(screen.getByText('Product Launch')).toBeDefined();
    expect(screen.getByText('Team Update')).toBeDefined();
  });

  it('renders folder names at root level', () => {
    renderDeckList();
    expect(screen.getByText('Marketing')).toBeDefined();
  });

  it('hides folders when inside a folder (currentFolderId set)', () => {
    renderDeckList({ currentFolderId: 'folder-1' });
    expect(screen.queryByText('Marketing')).toBeNull();
  });

  it('renders slide count for decks (AC-5)', () => {
    renderDeckList();
    expect(screen.getByText('12 slides')).toBeDefined();
    expect(screen.getByText('5 slides')).toBeDefined();
  });

  it('renders deck count for folders (AC-7)', () => {
    renderDeckList();
    expect(screen.getByText('3 decks')).toBeDefined();
  });

  it('renders listitems for each row', () => {
    renderDeckList();
    const items = screen.getAllByRole('listitem');
    // 1 folder + 2 decks = 3 items
    expect(items).toHaveLength(3);
  });

  it('has accessible aria-label on deck rows', () => {
    renderDeckList();
    const deckRow = screen.getByLabelText(/Deck: Product Launch/);
    expect(deckRow).toBeDefined();
  });

  it('has accessible aria-label on folder rows (AC-7)', () => {
    renderDeckList();
    const folderRow = screen.getByLabelText(/Folder: Marketing/);
    expect(folderRow).toBeDefined();
  });

  it('calls onDeckClick when deck row is clicked (AC-5)', () => {
    const onDeckClick = vi.fn();
    renderDeckList({ onDeckClick });
    fireEvent.click(screen.getByLabelText(/Deck: Product Launch/));
    expect(onDeckClick).toHaveBeenCalledWith('deck-1');
  });

  it('calls onFolderClick when folder row is clicked (AC-7)', () => {
    const onFolderClick = vi.fn();
    renderDeckList({ onFolderClick });
    fireEvent.click(screen.getByLabelText(/Folder: Marketing/));
    expect(onFolderClick).toHaveBeenCalledWith('folder-1');
  });

  it('calls onDeckClick on Enter key (AC-5)', () => {
    const onDeckClick = vi.fn();
    renderDeckList({ onDeckClick });
    fireEvent.keyDown(screen.getByLabelText(/Deck: Product Launch/), { key: 'Enter' });
    expect(onDeckClick).toHaveBeenCalledWith('deck-1');
  });

  it('calls onFolderClick on Enter key (AC-7)', () => {
    const onFolderClick = vi.fn();
    renderDeckList({ onFolderClick });
    fireEvent.keyDown(screen.getByLabelText(/Folder: Marketing/), { key: 'Enter' });
    expect(onFolderClick).toHaveBeenCalledWith('folder-1');
  });

  it('renders kebab menu button for each row (AC-3)', () => {
    renderDeckList();
    // 1 folder + 2 decks = 3 kebab buttons
    const kebabs = screen.getAllByLabelText(/Actions for/);
    expect(kebabs).toHaveLength(3);
  });

  it('has singular slide count for 1 slide', () => {
    renderDeckList({
      decks: [{ ...mockDecks[0], slideCount: 1 }],
      folders: [],
    });
    expect(screen.getByText('1 slide')).toBeDefined();
  });

  it('has singular deck count for folder with 1 deck', () => {
    renderDeckList({
      decks: [],
      folders: [{ ...mockFolders[0], deckCount: 1 }],
    });
    expect(screen.getByText('1 deck')).toBeDefined();
  });
});
