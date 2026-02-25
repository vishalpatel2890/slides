/**
 * DeckCard Thumbnail Tests
 *
 * Story Reference: cv-5-3
 * Tests for thumbnail display states in DeckCard component.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { DeckInfo } from '../../../src/shared/types';

// Mock the hooks and components
vi.mock('../../../src/webview/catalog/hooks/useLazyThumbnail', () => ({
  useLazyThumbnail: vi.fn(),
}));

vi.mock('../../../src/webview/catalog/context/CatalogContext', () => ({
  useIsNewDeck: () => false,
  useClearNewDeck: () => vi.fn(),
  useCatalogFolders: () => [],
}));

vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Translate: { toString: () => '' } },
}));

// Get the mock function
import { useLazyThumbnail } from '../../../src/webview/catalog/hooks/useLazyThumbnail';
const mockUseLazyThumbnail = vi.mocked(useLazyThumbnail);

// Import component after mocks
import { DeckCard } from '../../../src/webview/catalog/components/DeckCard';

describe('DeckCard Thumbnail Display (cv-5-3)', () => {
  const mockDeck: DeckInfo = {
    id: 'test-deck',
    name: 'Test Deck',
    path: 'output/test-deck',
    slideCount: 5,
    builtSlideCount: 3,
    status: 'partial',
    lastModified: Date.now(),
    firstSlidePath: '/workspace/output/test-deck/slides/slide-1.html',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-18: Skeleton shimmer while loading', () => {
    it('should show ThumbnailSkeleton when isLoading is true', () => {
      mockUseLazyThumbnail.mockReturnValue({
        ref: vi.fn(),
        isLoading: true,
        thumbnailUri: undefined,
        error: false,
      });

      render(<DeckCard deck={mockDeck} />);

      // Should have skeleton element
      const skeleton = document.querySelector('.thumbnail-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('AC-21: Thumbnail display when loaded', () => {
    it('should show thumbnail image when thumbnailUri is available', () => {
      const thumbnailUri = 'vscode-webview://test/thumbnail.png';
      mockUseLazyThumbnail.mockReturnValue({
        ref: vi.fn(),
        isLoading: false,
        thumbnailUri,
        error: false,
      });

      render(<DeckCard deck={mockDeck} />);

      // Should have image element
      const img = document.querySelector('.deck-card__thumbnail-image') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img?.src).toBe(thumbnailUri);
    });

    it('should not show skeleton when thumbnail is loaded', () => {
      mockUseLazyThumbnail.mockReturnValue({
        ref: vi.fn(),
        isLoading: false,
        thumbnailUri: 'vscode-webview://test/thumbnail.png',
        error: false,
      });

      render(<DeckCard deck={mockDeck} />);

      const skeleton = document.querySelector('.thumbnail-skeleton');
      expect(skeleton).toBeFalsy();
    });
  });

  describe('AC-23: Placeholder on failure', () => {
    it('should show placeholder when no thumbnailUri and not loading', () => {
      mockUseLazyThumbnail.mockReturnValue({
        ref: vi.fn(),
        isLoading: false,
        thumbnailUri: undefined,
        error: true,
      });

      render(<DeckCard deck={mockDeck} />);

      // Should have placeholder element
      const placeholder = document.querySelector('.thumbnail-placeholder');
      expect(placeholder).toBeTruthy();
    });

    it('should display deck initials in placeholder', () => {
      mockUseLazyThumbnail.mockReturnValue({
        ref: vi.fn(),
        isLoading: false,
        thumbnailUri: undefined,
        error: true,
      });

      render(<DeckCard deck={mockDeck} />);

      // Should have label with initials "TD" for "Test Deck"
      const label = document.querySelector('.thumbnail-placeholder__label');
      expect(label?.textContent).toBe('TD');
    });
  });

  describe('Hook invocation', () => {
    it('should call useLazyThumbnail with deck id and firstSlidePath', () => {
      mockUseLazyThumbnail.mockReturnValue({
        ref: vi.fn(),
        isLoading: true,
        thumbnailUri: undefined,
        error: false,
      });

      render(<DeckCard deck={mockDeck} />);

      expect(mockUseLazyThumbnail).toHaveBeenCalledWith(
        mockDeck.id,
        mockDeck.firstSlidePath
      );
    });

    it('should handle undefined firstSlidePath', () => {
      const deckWithoutSlides = {
        ...mockDeck,
        firstSlidePath: undefined,
        builtSlideCount: 0,
      };

      mockUseLazyThumbnail.mockReturnValue({
        ref: vi.fn(),
        isLoading: false,
        thumbnailUri: undefined,
        error: false,
      });

      render(<DeckCard deck={deckWithoutSlides} />);

      expect(mockUseLazyThumbnail).toHaveBeenCalledWith(
        deckWithoutSlides.id,
        undefined
      );
    });
  });
});
