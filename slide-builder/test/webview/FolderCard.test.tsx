/**
 * Tests for FolderCard component.
 * Story Reference: cv-3-6 AC-1, AC-2, AC-3, AC-4, AC-5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { FolderCard } from '../../src/webview/catalog/components/FolderCard';
import { CatalogProvider } from '../../src/webview/catalog/context/CatalogContext';
import type { FolderInfo } from '../../src/shared/types';

const mockFolder: FolderInfo = {
  id: 'marketing',
  name: 'Marketing',
  path: '/decks/marketing',
  deckCount: 5,
  lastModified: Date.now(),
};

function renderFolderCard(
  overrides?: Partial<FolderInfo>,
  props?: {
    onClick?: (id: string) => void;
    onRename?: (id: string, newName: string) => void;
    onDelete?: (folder: FolderInfo) => void;
  },
) {
  const folder = { ...mockFolder, ...overrides };
  return render(
    <CatalogProvider>
      <FolderCard
        folder={folder}
        onClick={props?.onClick}
        onRename={props?.onRename}
        onDelete={props?.onDelete}
      />
    </CatalogProvider>,
  );
}

describe('FolderCard', () => {
  it('renders folder name', () => {
    renderFolderCard();
    expect(screen.getByText('Marketing')).toBeDefined();
  });

  it('renders deck count with plural', () => {
    renderFolderCard();
    expect(screen.getByText('5 decks')).toBeDefined();
  });

  it('renders deck count with singular', () => {
    renderFolderCard({ deckCount: 1 });
    expect(screen.getByText('1 deck')).toBeDefined();
  });

  it('has role="button" and tabIndex=0', () => {
    renderFolderCard();
    const card = screen.getByRole('button');
    expect(card).toBeDefined();
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('has comprehensive aria-label (AC-17)', () => {
    renderFolderCard();
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Folder: Marketing, 5 decks',
    );
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    renderFolderCard(undefined, { onClick });
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith('marketing');
  });

  it('calls onClick on Enter key', () => {
    const onClick = vi.fn();
    renderFolderCard(undefined, { onClick });
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledWith('marketing');
  });

  it('calls onClick on Space key', () => {
    const onClick = vi.fn();
    renderFolderCard(undefined, { onClick });
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalledWith('marketing');
  });

  it('applies folder-card base class', () => {
    renderFolderCard();
    expect(screen.getByRole('button').className).toContain('folder-card');
  });

  // cv-3-6 AC-1: Double-click activates inline edit
  describe('Inline rename (cv-3-6 AC-1)', () => {
    it('activates inline edit on double-click', () => {
      renderFolderCard();
      fireEvent.doubleClick(screen.getByRole('button'));
      // InlineNameEdit renders an input
      expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('input contains current folder name', () => {
      renderFolderCard();
      fireEvent.doubleClick(screen.getByRole('button'));
      expect(screen.getByRole('textbox')).toHaveValue('Marketing');
    });
  });

  // cv-3-6 AC-2: Context menu
  describe('Context Menu (cv-3-6 AC-2)', () => {
    it('shows context menu on right-click with Open, Rename, Delete', () => {
      renderFolderCard();
      fireEvent.contextMenu(screen.getByRole('button'));
      expect(screen.getByText('Open')).toBeDefined();
      expect(screen.getByText('Rename')).toBeDefined();
      expect(screen.getByText('Delete Folder')).toBeDefined();
    });

    it('"Open" triggers onClick', () => {
      const onClick = vi.fn();
      renderFolderCard(undefined, { onClick });
      fireEvent.contextMenu(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Open'));
      expect(onClick).toHaveBeenCalledWith('marketing');
    });

    it('"Rename" menu item is present in context menu', () => {
      renderFolderCard();
      fireEvent.contextMenu(screen.getByRole('button'));
      const renameItem = screen.getByText('Rename');
      expect(renameItem).toBeDefined();
      // Note: Verifying inline edit activation from context menu requires
      // pointer events not supported in jsdom. Covered by manual test gate.
    });

    it('"Delete Folder" triggers onDelete', () => {
      const onDelete = vi.fn();
      renderFolderCard(undefined, { onDelete });
      fireEvent.contextMenu(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Delete Folder'));
      expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'marketing' }));
    });
  });

  // cv-3-6 AC-5: Validation
  describe('Validation (cv-3-6 AC-5)', () => {
    it('cancels edit on Enter with empty name (InlineNameEdit behavior)', () => {
      const onRename = vi.fn();
      renderFolderCard(undefined, { onRename });
      fireEvent.doubleClick(screen.getByRole('button'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      // InlineNameEdit calls onCancel for empty, so edit mode is exited
      expect(screen.queryByRole('textbox')).toBeNull();
      expect(onRename).not.toHaveBeenCalled();
    });

    it('shows error for name with invalid characters', () => {
      const onRename = vi.fn();
      renderFolderCard(undefined, { onRename });
      fireEvent.doubleClick(screen.getByRole('button'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'foo/bar' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(screen.getByRole('alert')).toBeDefined();
      expect(onRename).not.toHaveBeenCalled();
    });
  });

  // cv-3-6 AC-3: Save rename
  describe('Save rename (cv-3-6 AC-3)', () => {
    it('calls onRename with new name on Enter', () => {
      const onRename = vi.fn();
      renderFolderCard(undefined, { onRename });
      fireEvent.doubleClick(screen.getByRole('button'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Marketing' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onRename).toHaveBeenCalledWith('marketing', 'New Marketing');
    });

    it('does not call onRename when name is unchanged', () => {
      const onRename = vi.fn();
      renderFolderCard(undefined, { onRename });
      fireEvent.doubleClick(screen.getByRole('button'));
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onRename).not.toHaveBeenCalled();
    });
  });

  // cv-3-6 AC-4: Cancel rename
  describe('Cancel rename (cv-3-6 AC-4)', () => {
    it('cancels inline edit on Escape', () => {
      renderFolderCard();
      fireEvent.doubleClick(screen.getByRole('button'));
      expect(screen.getByRole('textbox')).toBeDefined();
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
      expect(screen.queryByRole('textbox')).toBeNull();
      expect(screen.getByText('Marketing')).toBeDefined();
    });
  });
});
