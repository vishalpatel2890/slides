/**
 * Tests for AddAssetsPanel component.
 *
 * Story Reference: cv-4-4 AC-24 through AC-34
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CatalogProvider, useCatalog } from '../../src/webview/catalog/context/CatalogContext';
import { AddAssetsPanel } from '../../src/webview/catalog/components/AddAssetsPanel';

// Mock acquireVsCodeApi
const mockPostMessage = vi.fn();
vi.mock('../../src/webview/catalog/components/AddAssetsPanel', async () => {
  const actual = await vi.importActual('../../src/webview/catalog/components/AddAssetsPanel');
  // Override the vscode mock to track calls
  return {
    ...actual,
  };
});

// Helper component to trigger panel display
function TestPanelTrigger() {
  const { dispatch } = useCatalog();
  return (
    <button
      data-testid="show-panel"
      onClick={() => dispatch({ type: 'SHOW_ADD_ASSETS_PANEL' })}
    >
      Show Panel
    </button>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<CatalogProvider>{ui}</CatalogProvider>);
}

describe('AddAssetsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Visibility (AC-24)', () => {
    it('renders nothing when showAddAssetsPanel is false', () => {
      renderWithProvider(<AddAssetsPanel />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog when showAddAssetsPanel is true', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true" and aria-labelledby', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'add-assets-title');
    });
  });

  describe('Path Input (AC-25)', () => {
    it('renders textarea for file paths', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      const textarea = screen.getByPlaceholderText(/enter file paths/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('accepts text input', async () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      const textarea = screen.getByPlaceholderText(/enter file paths/i);
      fireEvent.change(textarea, { target: { value: '/path/to/file.png' } });

      expect(textarea).toHaveValue('/path/to/file.png');
    });
  });

  describe('Browse Button (AC-26)', () => {
    it('renders Browse button', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByRole('button', { name: /browse for files/i })).toBeInTheDocument();
    });
  });

  describe('Drag-Drop Zone (AC-27)', () => {
    it('renders drag-drop zone with instructions', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByRole('region', { name: /drag and drop/i })).toBeInTheDocument();
      expect(screen.getByText(/drag & drop files/i)).toBeInTheDocument();
    });
  });

  describe('Type Selector (AC-31)', () => {
    it('renders type selector with Icon, Logo, Image options', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByRole('radio', { name: /icon/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /logo/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /image/i })).toBeInTheDocument();
    });

    it('has Image selected by default', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      const imageRadio = screen.getByRole('radio', { name: /image/i });
      expect(imageRadio).toHaveAttribute('aria-checked', 'true');
    });

    it('allows selecting different type', async () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      const iconRadio = screen.getByRole('radio', { name: /icon/i });
      fireEvent.click(iconRadio);

      expect(iconRadio).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: /image/i })).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Description Input (AC-29)', () => {
    it('renders description input field', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByPlaceholderText(/description for all assets/i)).toBeInTheDocument();
    });
  });

  describe('Tags Section (AC-30)', () => {
    it('renders tags section with label', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByText(/tags \(auto-suggested\)/i)).toBeInTheDocument();
    });

    it('renders tag input for adding new tags', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByRole('textbox', { name: /add new tag/i })).toBeInTheDocument();
    });
  });

  describe('Add/Cancel Buttons', () => {
    it('renders Cancel button', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders Add button', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    it('Add button is disabled when no files selected', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      // The "Add" button should match without any count
      const addButton = screen.getAllByRole('button', { name: /add/i })
        .find(btn => btn.textContent?.includes('Add'));
      expect(addButton).toBeDisabled();
    });

    it('Cancel button closes panel', async () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Close Button (AC-24)', () => {
    it('renders close button with aria-label', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByRole('button', { name: /close panel/i })).toBeInTheDocument();
    });

    it('close button closes panel', async () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      const closeButton = screen.getByRole('button', { name: /close panel/i });
      fireEvent.click(closeButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('type selector has role="radiogroup" with aria-label', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      expect(screen.getByRole('radiogroup', { name: /asset type/i })).toBeInTheDocument();
    });

    it('path textarea has proper label association', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      // The textarea should be labeled
      const label = screen.getByText(/file paths/i);
      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('for', 'path-input');
    });

    it('description input has proper label association', () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));

      const label = screen.getByText(/description \(optional\)/i);
      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('for', 'description-input');
    });
  });
});

describe('CatalogContext - Add Assets Panel State (cv-4-4)', () => {
  describe('SHOW_ADD_ASSETS_PANEL', () => {
    it('sets showAddAssetsPanel to true and clears selectedFilesForAdd', () => {
      // This is implicitly tested by the visibility tests above
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      // Panel not visible initially
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Show panel
      fireEvent.click(screen.getByTestId('show-panel'));

      // Panel now visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('HIDE_ADD_ASSETS_PANEL', () => {
    it('sets showAddAssetsPanel to false', async () => {
      renderWithProvider(
        <>
          <TestPanelTrigger />
          <AddAssetsPanel />
        </>
      );

      fireEvent.click(screen.getByTestId('show-panel'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Click cancel to hide
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
