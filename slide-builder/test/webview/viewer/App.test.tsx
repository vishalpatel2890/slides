/**
 * Tests for V2 Viewer App component.
 *
 * Story Reference: v2-1-1 Task 6.4, AC-2
 * Updated from cv-2-1 tests to V2 viewer with ViewerContext
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

// Mock acquireVsCodeApi before importing App
const mockPostMessage = vi.fn();
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: mockPostMessage,
  getState: vi.fn(),
  setState: vi.fn(),
}));

import { App } from '../../../src/webview/viewer/App';
import { ViewerProvider } from '../../../src/webview/viewer/context/ViewerContext';
import type { ViewerV2DeckContent } from '../../../src/shared/types';

const mockDeck: ViewerV2DeckContent = {
  deckId: 'test-deck',
  deckName: 'Test Deck',
  slides: [
    { number: 1, html: '<div>Slide 1</div>', fileName: 'slide-1.html', slideId: '1', title: 'Intro' },
    { number: 2, html: '<div>Slide 2</div>', fileName: 'slide-2.html', slideId: '2', title: 'Content' },
    { number: 3, html: '<div>Slide 3</div>', fileName: 'slide-3.html', slideId: '3', title: 'Summary' },
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
    generatedAt: '2026-02-18',
  },
  planPath: 'output/test-deck/plan.yaml',
};

// Wrapper component to provide ViewerContext
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ViewerProvider>{children}</ViewerProvider>
);

describe('V2 Viewer App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially (AC-2)', () => {
    render(<App />, { wrapper: Wrapper });
    expect(screen.getByText('Loading slides...')).toBeInTheDocument();
  });

  it('renders deck content on v2-deck-loaded message', async () => {
    render(<App />, { wrapper: Wrapper });

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'v2-deck-loaded', deck: mockDeck },
        })
      );
    });

    // Should no longer show loading
    expect(screen.queryByText('Loading slides...')).not.toBeInTheDocument();
    // Should show slide counter (v2-1-3: now SlideCounter component with aria-label)
    expect(screen.getByRole('button', { name: 'Slide 1 of 3' })).toBeInTheDocument();
    // Should show deck name
    expect(screen.getByText('Test Deck')).toBeInTheDocument();
  });

  it('renders error state on v2-error message', async () => {
    render(<App />, { wrapper: Wrapper });

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'v2-error', message: 'Failed to load deck' },
        })
      );
    });

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load deck')).toBeInTheDocument();
  });

  it('renders empty state when no slides loaded (v2-1-2 AC-10)', async () => {
    render(<App />, { wrapper: Wrapper });

    // Set loading to false without providing deck
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'v2-deck-loaded',
            deck: { ...mockDeck, slides: [] },
          },
        })
      );
    });

    // v2-1-2 AC-10: Empty state shows "No slides built yet"
    expect(screen.getByText('No slides built yet')).toBeInTheDocument();
    expect(screen.getByText('Open Plan Editor')).toBeInTheDocument();
  });

  it('updates slide HTML on v2-slide-updated message (v2-1-2 AC-4)', async () => {
    render(<App />, { wrapper: Wrapper });

    // First load deck
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'v2-deck-loaded', deck: mockDeck },
        })
      );
    });

    // Then update slide
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'v2-slide-updated',
            slideNumber: 1,
            html: '<div>Updated Slide 1</div>',
          },
        })
      );
    });

    // v2-1-2 AC-4: Slide content is rendered via innerHTML in SlideDisplay container
    const slideContent = document.querySelector('.slide-display__container');
    expect(slideContent?.innerHTML).toBe('<div>Updated Slide 1</div>');
  });

  it('continues displaying current slide on v2-rebuilding message (build tracked in catalog sidebar)', async () => {
    render(<App />, { wrapper: Wrapper });

    // First load deck
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'v2-deck-loaded', deck: mockDeck },
        })
      );
    });

    expect(screen.queryByText('Loading slides...')).not.toBeInTheDocument();

    // Trigger rebuild - viewer keeps showing current slide (cv-3-5)
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'v2-rebuilding' },
        })
      );
    });

    // Should NOT show loading - viewer continues displaying slides
    expect(screen.queryByText('Loading slides...')).not.toBeInTheDocument();
    // Slide counter should still be visible
    expect(screen.getByRole('button', { name: 'Slide 1 of 3' })).toBeInTheDocument();
  });
});

/**
 * ae-1-3: In-flight state management tests.
 * Story Reference: ae-1-3 AC-17 through AC-22
 *
 * Tests the progress feedback loop: loading spinner lifecycle,
 * timeout safety net, error handling, and slide number preservation.
 */
describe('ae-1-3: In-flight state management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Mock scrollIntoView which is not available in jsdom
    // (ThumbnailSidebar uses it in requestAnimationFrame callback)
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /**
   * Helper: Render App with a deck loaded and put into in-flight state
   * by clicking "Edit with AI" and submitting an instruction.
   */
  function renderWithDeckAndSetInFlight() {
    render(<App />, { wrapper: Wrapper });

    // Load deck
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'v2-deck-loaded', deck: mockDeck },
        })
      );
    });

    // Click "Edit with AI" button to open modal
    const editAiButton = screen.getByRole('button', { name: /edit with ai/i });
    act(() => {
      fireEvent.click(editAiButton);
    });

    // Type instruction and submit via Enter key
    const textarea = screen.getByTestId('edit-modal-textarea');
    act(() => {
      fireEvent.change(textarea, { target: { value: 'make two columns' } });
    });
    act(() => {
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    });

    // Now aiEditInFlight should be true — button should be disabled
    const button = screen.getByRole('button', { name: /edit with ai/i });
    expect(button).toBeDisabled();
  }

  // AC-18: v2-slide-updated resets in-flight state
  it('resets in-flight state when v2-slide-updated arrives while aiEditInFlight is true (AC-18)', () => {
    renderWithDeckAndSetInFlight();

    // Simulate v2-slide-updated message (file watcher detected change)
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'v2-slide-updated',
            slideNumber: 1,
            html: '<div>Updated Slide 1</div>',
          },
        })
      );
    });

    // Button should return to default state (enabled, Wand2 icon)
    const button = screen.getByRole('button', { name: /edit with ai/i });
    expect(button).not.toBeDisabled();
  });

  // AC-18: v2-slide-updated when NOT in-flight should not cause issues
  it('does not dispatch extra SET_AI_EDIT_IN_FLIGHT when not in-flight (AC-18)', () => {
    render(<App />, { wrapper: Wrapper });

    // Load deck (not in-flight)
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'v2-deck-loaded', deck: mockDeck },
        })
      );
    });

    // Receive slide update when not in-flight
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'v2-slide-updated',
            slideNumber: 1,
            html: '<div>Updated Slide 1</div>',
          },
        })
      );
    });

    // Button should still be in default (enabled) state — no crash, no extra dispatch
    const button = screen.getByRole('button', { name: /edit with ai/i });
    expect(button).not.toBeDisabled();
  });

  // AC-19: 120-second timeout dispatches SET_AI_EDIT_IN_FLIGHT(false)
  it('resets in-flight state after 120-second timeout (AC-19)', () => {
    renderWithDeckAndSetInFlight();

    // Advance timer by 120 seconds
    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    // Button should return to default state
    const button = screen.getByRole('button', { name: /edit with ai/i });
    expect(button).not.toBeDisabled();
  });

  // AC-19: Timeout cleanup — clearing in-flight before 120s prevents dispatch
  it('cleans up timeout when in-flight state becomes false before 120s (AC-19)', () => {
    renderWithDeckAndSetInFlight();

    // Reset in-flight via v2-slide-updated (before timeout)
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'v2-slide-updated',
            slideNumber: 1,
            html: '<div>Updated</div>',
          },
        })
      );
    });

    // Verify button is already reset
    const button = screen.getByRole('button', { name: /edit with ai/i });
    expect(button).not.toBeDisabled();

    // Advance past timeout — should not cause errors or re-dispatch
    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    // Button should still be in default state (no double-reset issues)
    expect(button).not.toBeDisabled();
  });

  // AC-22: v2-edit-started { success: false } resets in-flight immediately
  it('resets in-flight state on v2-edit-started { success: false } (AC-22)', () => {
    renderWithDeckAndSetInFlight();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate CC launch failure
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'v2-edit-started',
            success: false,
            error: 'Claude Code extension not found',
          },
        })
      );
    });

    // Button should return to default state
    const button = screen.getByRole('button', { name: /edit with ai/i });
    expect(button).not.toBeDisabled();

    // Should log error
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Claude Code extension not found')
    );

    consoleSpy.mockRestore();
  });

  // AC-22: v2-edit-started { success: true } does NOT reset in-flight
  it('does NOT reset in-flight state on v2-edit-started { success: true } (AC-22)', () => {
    renderWithDeckAndSetInFlight();

    // Simulate successful CC launch
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'v2-edit-started',
            success: true,
          },
        })
      );
    });

    // Button should STILL be disabled (in-flight persists until v2-slide-updated or timeout)
    const button = screen.getByRole('button', { name: /edit with ai/i });
    expect(button).toBeDisabled();
  });

  // AC-21: Slide number preserved after UPDATE_SLIDE dispatch
  it('preserves current slide number after v2-slide-updated (AC-21)', () => {
    render(<App />, { wrapper: Wrapper });

    // Load deck
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'v2-deck-loaded', deck: mockDeck },
        })
      );
    });

    // Navigate to slide 2 using the toolbar Next button (first match)
    const nextButtons = screen.getAllByRole('button', { name: 'Next slide' });
    act(() => {
      fireEvent.click(nextButtons[0]);
    });

    // Verify on slide 2 via slide counter
    expect(screen.getByRole('button', { name: 'Slide 2 of 3' })).toBeInTheDocument();

    // Update slide 2 content
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'v2-slide-updated',
            slideNumber: 2,
            html: '<div>Updated Slide 2</div>',
          },
        })
      );
    });

    // Should still be on slide 2
    expect(screen.getByRole('button', { name: 'Slide 2 of 3' })).toBeInTheDocument();
  });
});
