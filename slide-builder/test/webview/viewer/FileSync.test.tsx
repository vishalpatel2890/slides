/**
 * Tests for V2 Viewer file synchronization — webview message handling.
 * Tests that v2-slide-updated and v2-manifest-updated messages correctly
 * update the viewer state via ViewerContext dispatch.
 *
 * Story Reference: v2-3-2 AC-3, AC-7
 * Architecture Reference: ADR-008 — v2- Message Prefix Convention
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// Mock acquireVsCodeApi before importing App
const mockPostMessage = vi.fn();
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: mockPostMessage,
  getState: vi.fn(),
  setState: vi.fn(),
}));

import { App } from '../../../src/webview/viewer/App';
import { ViewerProvider } from '../../../src/webview/viewer/context/ViewerContext';
import type { ViewerV2DeckContent, ViewerV2Manifest } from '../../../src/shared/types';

const mockDeck: ViewerV2DeckContent = {
  deckId: 'test-deck',
  deckName: 'Test Deck',
  slides: [
    { number: 1, html: '<div>Slide 1 Original</div>', fileName: 'slide-1.html', slideId: '1', title: 'Intro' },
    { number: 2, html: '<div>Slide 2 Original</div>', fileName: 'slide-2.html', slideId: '2', title: 'Content' },
    { number: 3, html: '<div>Slide 3 Original</div>', fileName: 'slide-3.html', slideId: '3', title: 'Summary' },
  ],
  manifest: {
    deckId: 'test-deck',
    deckName: 'Test Deck',
    slideCount: 3,
    slides: [
      { number: 1, fileName: 'slide-1.html', title: 'Intro' },
      { number: 2, fileName: 'slide-2.html', title: 'Content' },
      { number: 3, fileName: 'slide-3.html', title: 'Summary' },
    ],
    generatedAt: '2026-02-19',
  },
  planPath: 'output/test-deck/plan.yaml',
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ViewerProvider>{children}</ViewerProvider>
);

/** Helper to load a deck into the viewer */
function loadDeck(deck: ViewerV2DeckContent = mockDeck) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'v2-deck-loaded', deck },
      })
    );
  });
}

describe('V2 Viewer File Synchronization (Webview)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================
  // AC-3.2.3: v2-slide-updated re-renders current slide
  // ==========================================================

  describe('AC-3.2.3: v2-slide-updated updates displayed slide content', () => {
    it('updates slide 1 (currently displayed) when v2-slide-updated received', () => {
      render(<App />, { wrapper: Wrapper });
      loadDeck();

      // Verify initial content
      const slideContainer = document.querySelector('.slide-display__container');
      expect(slideContainer?.innerHTML).toBe('<div>Slide 1 Original</div>');

      // Simulate external file change
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'v2-slide-updated',
              slideNumber: 1,
              html: '<div>Slide 1 Updated Externally</div>',
            },
          })
        );
      });

      // Slide should show updated content
      expect(slideContainer?.innerHTML).toBe('<div>Slide 1 Updated Externally</div>');
    });

    it('updates a non-displayed slide without affecting current view', () => {
      render(<App />, { wrapper: Wrapper });
      loadDeck();

      // Currently on slide 1
      const slideContainer = document.querySelector('.slide-display__container');
      expect(slideContainer?.innerHTML).toBe('<div>Slide 1 Original</div>');

      // Update slide 3 (not currently displayed)
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'v2-slide-updated',
              slideNumber: 3,
              html: '<div>Slide 3 Updated</div>',
            },
          })
        );
      });

      // Current slide 1 should be unchanged
      expect(slideContainer?.innerHTML).toBe('<div>Slide 1 Original</div>');
    });

    it('shows updated content when navigating to a previously updated slide', () => {
      render(<App />, { wrapper: Wrapper });
      loadDeck();

      // Update slide 2 while viewing slide 1
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'v2-slide-updated',
              slideNumber: 2,
              html: '<div>Slide 2 Updated</div>',
            },
          })
        );
      });

      // Navigate to slide 2 using toolbar next button (first match)
      const nextButtons = screen.getAllByRole('button', { name: /next slide/i });
      act(() => {
        nextButtons[0].click();
      });

      // Should show the updated content
      const slideContainer = document.querySelector('.slide-display__container');
      expect(slideContainer?.innerHTML).toBe('<div>Slide 2 Updated</div>');
    });
  });

  // ==========================================================
  // AC-3.2.7: v2-manifest-updated updates animation data
  // ==========================================================

  describe('AC-3.2.7: v2-manifest-updated updates manifest state', () => {
    it('updates manifest state when v2-manifest-updated received', () => {
      render(<App />, { wrapper: Wrapper });
      loadDeck();

      const updatedManifest: ViewerV2Manifest = {
        deckId: 'test-deck',
        deckName: 'Test Deck',
        slideCount: 3,
        slides: [
          {
            number: 1,
            fileName: 'slide-1.html',
            title: 'Intro',
            animationGroups: [
              { groupIndex: 1, selectors: ['.fade-in'] },
            ],
          },
          { number: 2, fileName: 'slide-2.html', title: 'Content' },
          { number: 3, fileName: 'slide-3.html', title: 'Summary' },
        ],
        generatedAt: '2026-02-19T10:00:00Z',
      };

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'v2-manifest-updated',
              manifest: updatedManifest,
            },
          })
        );
      });

      // Viewer should continue rendering without errors
      // The manifest update is consumed by useAnimations hook internally
      expect(screen.getByRole('button', { name: 'Slide 1 of 3' })).toBeInTheDocument();
    });

    it('handles v2-manifest-updated without crashing on empty slides', () => {
      render(<App />, { wrapper: Wrapper });
      loadDeck();

      const minimalManifest: ViewerV2Manifest = {
        deckId: 'test-deck',
        deckName: 'Test Deck',
        slideCount: 0,
        slides: [],
        generatedAt: '2026-02-19',
      };

      // Should not throw
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'v2-manifest-updated',
              manifest: minimalManifest,
            },
          })
        );
      });

      // Viewer should still show slide content
      const slideContainer = document.querySelector('.slide-display__container');
      expect(slideContainer).toBeInTheDocument();
    });
  });

  // ==========================================================
  // Combined scenarios: slide + manifest updates
  // ==========================================================

  describe('Combined file sync scenarios', () => {
    it('handles rapid v2-slide-updated messages for multiple slides', () => {
      render(<App />, { wrapper: Wrapper });
      loadDeck();

      // Simulate rapid updates (as would happen after debounced rebuild)
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'v2-slide-updated', slideNumber: 1, html: '<div>S1 v2</div>' },
          })
        );
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'v2-slide-updated', slideNumber: 2, html: '<div>S2 v2</div>' },
          })
        );
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'v2-slide-updated', slideNumber: 3, html: '<div>S3 v2</div>' },
          })
        );
      });

      // Current slide (1) should show updated content
      const slideContainer = document.querySelector('.slide-display__container');
      expect(slideContainer?.innerHTML).toBe('<div>S1 v2</div>');
    });

    it('ignores v2-slide-updated for non-existent slide number', () => {
      render(<App />, { wrapper: Wrapper });
      loadDeck();

      // Update slide 99 (doesn't exist)
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'v2-slide-updated',
              slideNumber: 99,
              html: '<div>Ghost slide</div>',
            },
          })
        );
      });

      // Current slide 1 should be unchanged
      const slideContainer = document.querySelector('.slide-display__container');
      expect(slideContainer?.innerHTML).toBe('<div>Slide 1 Original</div>');
    });
  });
});
