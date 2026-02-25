import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../../../src/webview/viewer/components/Toolbar';
import { ViewerProvider } from '../../../src/webview/viewer/context/ViewerContext';
import type { UseExportReturn } from '../../../src/webview/viewer/hooks/useExport';

// Mock useVsCodeApi
const mockPostMessage = vi.fn();
vi.mock('../../../src/webview/viewer/hooks/useVsCodeApi', () => ({
  useVsCodeApi: () => ({
    postMessage: mockPostMessage,
    getState: vi.fn(),
    setState: vi.fn(),
  }),
}));

const mockExportActions: UseExportReturn = {
  exportCurrentPng: vi.fn(),
  exportAllPng: vi.fn(),
  exportPdf: vi.fn(),
  isExporting: false,
  exportProgress: null,
};

function renderToolbar() {
  return render(
    <ViewerProvider>
      <Toolbar
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onNavigate={vi.fn()}
        exportActions={mockExportActions}
      />
    </ViewerProvider>
  );
}

describe('story-viewer-add-slide-1: Add Slide button in Toolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC #8: Button disabled when no deck loaded', () => {
    it('renders Add Slide button with aria-label', () => {
      renderToolbar();
      const addButton = screen.getByRole('button', { name: /add slide/i });
      expect(addButton).toBeInTheDocument();
    });

    it('button is disabled when no deck is loaded (deckId is null)', () => {
      renderToolbar();
      const addButton = screen.getByRole('button', { name: /add slide/i });
      // In initial state, deckId is null
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveAttribute('title', 'No deck loaded');
    });
  });

  describe('AC #10: Button position — in Group 3 before Edit Plan', () => {
    it('Add Slide button appears before Edit Plan button in toolbar', () => {
      renderToolbar();
      const addButton = screen.getByRole('button', { name: /add slide/i });
      const editPlanButton = screen.getByRole('button', { name: /edit plan/i });

      // Verify both exist — position order is implicitly tested by DOM order
      expect(addButton).toBeInTheDocument();
      expect(editPlanButton).toBeInTheDocument();

      // Check DOM order: Add Slide should come before Edit Plan
      const allButtons = screen.getAllByRole('button');
      const addIndex = allButtons.indexOf(addButton);
      const editPlanIndex = allButtons.indexOf(editPlanButton);
      expect(addIndex).toBeLessThan(editPlanIndex);
    });
  });
});
