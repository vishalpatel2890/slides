/**
 * Tests for DeckDetail component (catalog deck drill-down view).
 * Story Reference: cv-1-6 Task 4 — DeckDetail component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { DeckDetail } from '../../../src/webview/catalog/components/DeckDetail';
import { CatalogProvider } from '../../../src/webview/catalog/context/CatalogContext';
import type { DeckDetail as DeckDetailType } from '../../../src/shared/types';

// Mock VS Code API
const mockPostMessage = vi.fn();
vi.mock('../../../src/webview/shared/hooks/useVSCodeApi', () => ({
  getVSCodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => undefined,
    setState: vi.fn(),
  }),
}));

const mockDeck: DeckDetailType = {
  id: 'test-deck',
  name: 'Q1 Product Launch',
  path: 'output/test-deck',
  slideCount: 5,
  builtSlideCount: 3,
  status: 'partial',
  lastModified: Date.now() - 7200000, // 2 hours ago
  slides: [
    { number: 1, intent: 'Introduction and welcome', template: 'title', status: 'built', htmlPath: 'slides/slide-1.html' },
    { number: 2, intent: 'Market opportunity analysis', template: 'two-column', status: 'built' },
    { number: 3, intent: 'Product features overview', template: 'image-left', status: 'built' },
    { number: 4, intent: 'Revenue projections', template: 'chart', status: 'planned' },
    { number: 5, intent: 'Call to action', template: 'closing', status: 'planned' },
  ],
  planPath: 'output/test-deck/plan.yaml',
};

function renderDeckDetail(deck: DeckDetailType = mockDeck) {
  return render(
    <CatalogProvider>
      <DeckDetail deck={deck} />
    </CatalogProvider>,
  );
}

describe('DeckDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header (AC-2)', () => {
    it('renders deck name', () => {
      renderDeckDetail();
      expect(screen.getByText('Q1 Product Launch')).toBeDefined();
    });

    it('renders slide count', () => {
      renderDeckDetail();
      expect(screen.getByText('5 slides')).toBeDefined();
    });

    it('renders singular slide for count of 1', () => {
      renderDeckDetail({ ...mockDeck, slideCount: 1 });
      expect(screen.getByText('1 slide')).toBeDefined();
    });

    it('renders relative time', () => {
      renderDeckDetail();
      expect(screen.getByText(/Last modified/)).toBeDefined();
    });

    it('renders StatusDot', () => {
      renderDeckDetail();
      expect(screen.getByRole('img', { name: /Partially built/ })).toBeDefined();
    });
  });

  describe('Action Bar (AC-3)', () => {
    it('renders all 4 action buttons', () => {
      renderDeckDetail();
      expect(screen.getByRole('button', { name: 'View Slides' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Edit Plan' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Build All' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Present' })).toBeDefined();
    });

    it('Edit Plan is enabled', () => {
      renderDeckDetail();
      expect(screen.getByRole('button', { name: 'Edit Plan' })).not.toBeDisabled();
    });

    it('View Slides is enabled and opens slide viewer', () => {
      renderDeckDetail();
      const viewBtn = screen.getByRole('button', { name: 'View Slides' });
      expect(viewBtn).not.toBeDisabled();
      viewBtn.click();
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'open-slide-viewer',
        deckId: 'test-deck',
      });
    });

    it('Build All is enabled and sends build-deck message (cv-3-4 AC-24)', () => {
      renderDeckDetail();
      const buildBtn = screen.getByRole('button', { name: 'Build All' });
      expect(buildBtn).not.toBeDisabled();
      buildBtn.click();
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'build-deck',
        deckId: 'test-deck',
        mode: 'all',
      });
    });

    it('Present is enabled for non-planned deck (cv-2-4 AC-7)', () => {
      renderDeckDetail();
      expect(screen.getByRole('button', { name: 'Present' })).not.toBeDisabled();
    });

    it('Present is disabled for planned deck (cv-2-4 AC-7)', () => {
      renderDeckDetail({ ...mockDeck, status: 'planned' });
      expect(screen.getByRole('button', { name: 'Present' })).toBeDisabled();
    });
  });

  describe('Present (cv-2-4 AC-1, AC-7)', () => {
    it('sends present-deck message on click', () => {
      renderDeckDetail();
      fireEvent.click(screen.getByRole('button', { name: 'Present' }));
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'present-deck',
        deckId: 'test-deck',
      });
    });

    it('does not send message when disabled (planned deck)', () => {
      renderDeckDetail({ ...mockDeck, status: 'planned' });
      fireEvent.click(screen.getByRole('button', { name: 'Present' }));
      expect(mockPostMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'present-deck' })
      );
    });
  });

  describe('Edit Plan (AC-5)', () => {
    it('sends open-plan-editor message on click', () => {
      renderDeckDetail();
      fireEvent.click(screen.getByRole('button', { name: 'Edit Plan' }));
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'open-plan-editor',
        deckId: 'test-deck',
      });
    });
  });

  describe('Slide Grid (AC-4)', () => {
    it('renders slide cards for all slides', () => {
      renderDeckDetail();
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(5);
    });

    it('renders slide numbers', () => {
      renderDeckDetail();
      expect(screen.getByText('#1')).toBeDefined();
      expect(screen.getByText('#5')).toBeDefined();
    });

    it('renders slide intents', () => {
      renderDeckDetail();
      expect(screen.getByText('Introduction and welcome')).toBeDefined();
      expect(screen.getByText('Call to action')).toBeDefined();
    });

    it('renders template badges', () => {
      renderDeckDetail();
      expect(screen.getByText('title')).toBeDefined();
      expect(screen.getByText('closing')).toBeDefined();
    });
  });

  describe('Slide Search (AC-6)', () => {
    it('renders search input', () => {
      renderDeckDetail();
      expect(screen.getByPlaceholderText('Search slides...')).toBeDefined();
    });

    it('filters slides by intent', async () => {
      vi.useFakeTimers();
      renderDeckDetail();

      const input = screen.getByPlaceholderText('Search slides...');
      fireEvent.change(input, { target: { value: 'revenue' } });

      // Wait for 100ms debounce
      act(() => {
        vi.advanceTimersByTime(100);
      });

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(1);
      expect(screen.getByText('Revenue projections')).toBeDefined();

      vi.useRealTimers();
    });

    it('filters slides by template name', async () => {
      vi.useFakeTimers();
      renderDeckDetail();

      const input = screen.getByPlaceholderText('Search slides...');
      fireEvent.change(input, { target: { value: 'title' } });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(1);
      expect(screen.getByText('Introduction and welcome')).toBeDefined();

      vi.useRealTimers();
    });

    it('shows no-match message when search yields no results', async () => {
      vi.useFakeTimers();
      renderDeckDetail();

      const input = screen.getByPlaceholderText('Search slides...');
      fireEvent.change(input, { target: { value: 'nonexistent' } });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByRole('status')).toBeDefined();

      vi.useRealTimers();
    });

    it('does not render search input when no slides', () => {
      renderDeckDetail({ ...mockDeck, slides: [] });
      expect(screen.queryByPlaceholderText('Search slides...')).toBeNull();
    });
  });

  describe('Empty State (AC-9)', () => {
    it('shows empty state when no slides', () => {
      renderDeckDetail({ ...mockDeck, slides: [], slideCount: 0 });
      expect(screen.getByText('No slides built yet')).toBeDefined();
    });

    it('shows enabled Build All CTA in empty state (cv-3-4)', () => {
      renderDeckDetail({ ...mockDeck, slides: [], slideCount: 0 });
      // Find the Build All button in the empty state (there may be one in the action bar too)
      const buildButtons = screen.getAllByRole('button', { name: /Build All/ });
      const emptyStateBuildBtn = buildButtons.find((b) => b.closest('.deck-detail__empty'));
      expect(emptyStateBuildBtn).toBeDefined();
      expect(emptyStateBuildBtn).not.toBeDisabled();
    });
  });

  describe('Search input accessibility', () => {
    it('search input has aria-label', () => {
      renderDeckDetail();
      expect(screen.getByLabelText('Search slides')).toBeDefined();
    });
  });
});
