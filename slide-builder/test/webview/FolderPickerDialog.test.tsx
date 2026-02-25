/**
 * Tests for FolderPickerDialog component.
 * Story Reference: cv-3-7 — Move deck to folder
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { FolderPickerDialog } from '../../src/webview/catalog/components/FolderPickerDialog';
import type { FolderInfo } from '../../src/shared/types';

// Mock useCatalogFolders
const mockFolders: FolderInfo[] = [
  { id: 'folder-a', name: 'Marketing', path: '/decks/folder-a', deckCount: 3, lastModified: Date.now() },
  { id: 'folder-b', name: 'Sales', path: '/decks/folder-b', deckCount: 1, lastModified: Date.now() },
  { id: 'folder-c', name: 'Engineering', path: '/decks/folder-c', deckCount: 0, lastModified: Date.now() },
];

vi.mock('../../src/webview/catalog/context/CatalogContext', () => ({
  useCatalogFolders: () => mockFolders,
}));

const mockPostMessage = vi.fn();
vi.mock('../../src/webview/shared/hooks/useVSCodeApi', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

describe('FolderPickerDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    deckId: 'deck-1',
    deckName: 'Product Launch',
    currentFolderId: 'folder-a',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog title with deck name (AC-2)', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    expect(screen.getByText(/Product Launch/)).toBeDefined();
  });

  it('renders description text', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    expect(screen.getByText('Select a destination folder:')).toBeDefined();
  });

  it('lists available folders excluding current folder (AC-3)', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    // folder-a (Marketing) should be excluded since it's the current folder
    expect(screen.queryByText('Marketing')).toBeNull();
    // Other folders should be visible
    expect(screen.getByText('Sales')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
  });

  it('shows Root option when deck is in a folder (AC-5)', () => {
    render(<FolderPickerDialog {...defaultProps} currentFolderId="folder-a" />);
    expect(screen.getByText('Root (No Folder)')).toBeDefined();
  });

  it('hides Root option when deck is at root', () => {
    render(<FolderPickerDialog {...defaultProps} currentFolderId={undefined} />);
    expect(screen.queryByText('Root (No Folder)')).toBeNull();
  });

  it('shows deck count per folder (AC-2)', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    expect(screen.getByText('1 deck')).toBeDefined();
    expect(screen.getByText('0 decks')).toBeDefined();
  });

  it('selects a folder via radio input on label click', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    const radios = screen.getAllByRole('radio');
    // Click the Sales label (second radio — first is Root)
    fireEvent.click(screen.getByText('Sales'));
    // The radio associated with Sales should be checked
    const salesRadio = radios.find((r) => {
      const label = r.closest('label');
      return label?.textContent?.includes('Sales');
    });
    expect(salesRadio).toBeDefined();
    expect((salesRadio as HTMLInputElement).checked).toBe(true);
  });

  it('selects Root option on click', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Root (No Folder)'));
    const radios = screen.getAllByRole('radio');
    const rootRadio = radios.find((r) => {
      const label = r.closest('label');
      return label?.textContent?.includes('Root');
    });
    expect((rootRadio as HTMLInputElement).checked).toBe(true);
  });

  it('Move button is disabled when nothing is selected (AC-4)', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    const moveBtn = screen.getByText('Move');
    expect(moveBtn).toHaveAttribute('disabled');
  });

  it('Move button is enabled after selecting a folder', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Sales'));
    const moveBtn = screen.getByText('Move');
    expect(moveBtn).not.toHaveAttribute('disabled');
  });

  it('posts move-deck message on Move click (AC-4)', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Sales'));
    fireEvent.click(screen.getByText('Move'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'move-deck',
      deckId: 'deck-1',
      targetFolderId: 'folder-b',
    });
  });

  it('posts move-deck with undefined targetFolderId for Root (AC-5)', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Root (No Folder)'));
    fireEvent.click(screen.getByText('Move'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'move-deck',
      deckId: 'deck-1',
      targetFolderId: undefined,
    });
  });

  it('calls onOpenChange(false) on Cancel click', () => {
    const onOpenChange = vi.fn();
    render(<FolderPickerDialog {...defaultProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes dialog on Move click', () => {
    const onOpenChange = vi.fn();
    render(<FolderPickerDialog {...defaultProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText('Sales'));
    fireEvent.click(screen.getByText('Move'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders radio inputs for folder selection (AC-8)', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    const radios = screen.getAllByRole('radio');
    // Root + Sales + Engineering = 3 (Marketing excluded as current folder)
    expect(radios.length).toBe(3);
  });

  it('all radios share the same name for mutual exclusivity', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute('name', 'target-folder');
    });
  });

  it('renders all folder radios when deck is at root', () => {
    render(<FolderPickerDialog {...defaultProps} currentFolderId={undefined} />);
    const radios = screen.getAllByRole('radio');
    // All 3 folders, no root option
    expect(radios.length).toBe(3);
    expect(screen.queryByText('Root (No Folder)')).toBeNull();
  });

  it('Enter key triggers Move when a folder is selected (AC-8)', () => {
    render(<FolderPickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Sales'));
    // Fire Enter on the dialog content
    const dialogContent = screen.getByLabelText('Move deck to folder');
    fireEvent.keyDown(dialogContent, { key: 'Enter' });
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'move-deck',
      deckId: 'deck-1',
      targetFolderId: 'folder-b',
    });
  });

  it('displays error message from extension (AC-7)', async () => {
    render(<FolderPickerDialog {...defaultProps} />);
    // Simulate error message from extension
    act(() => {
      const errorEvent = new MessageEvent('message', {
        data: { type: 'error', context: 'move-deck', message: 'Deck already exists' },
      });
      window.dispatchEvent(errorEvent);
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText('Deck already exists')).toBeDefined();
    });
  });
});
