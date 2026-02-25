/**
 * Tests for StatusBar save status indicator and mode display.
 * v2-3-1 AC-3.1.7, AC-3.1.8: Save status display ("Saving...", "Saved", "Save failed").
 * v2-3-1 AC-3.1.1: Edit mode indicator and keyboard hints.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBar } from '../../../src/webview/viewer/components/StatusBar';

// Mutable mock state — mutate properties per test
const mockState = {
  slides: [],
  currentSlide: 1,
  isLoading: false,
  error: null,
  deckId: 'test-deck',
  deckName: 'Test Deck',
  sidebarVisible: true,
  fullscreenMode: null as 'view' | 'edit' | null,
  currentBuildStep: 0,
  navigatedBackward: false,
  mode: 'presentation' as const,
  saveStatus: 'idle' as const,
  manifest: null,
};

vi.mock('../../../src/webview/viewer/context/ViewerContext', async () => {
  const actual = await vi.importActual('../../../src/webview/viewer/context/ViewerContext');
  return {
    ...actual,
    useViewerState: () => mockState,
  };
});

describe('StatusBar', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    mockState.mode = 'presentation';
    mockState.saveStatus = 'idle';
    mockState.fullscreenMode = null;
  });

  describe('save status indicator', () => {
    it('shows no save indicator when saveStatus is "idle"', () => {
      mockState.saveStatus = 'idle';

      render(<StatusBar currentBuildStep={0} totalGroups={0} hasAnimations={false} />);

      // None of the save status texts should be present
      expect(screen.queryByText('Saving\u2026')).toBeNull();
      expect(screen.queryByText(/Saved/)).toBeNull();
      expect(screen.queryByText('Save failed')).toBeNull();
    });

    it('shows "Saving\u2026" when saveStatus is "saving"', () => {
      mockState.saveStatus = 'saving';

      render(<StatusBar currentBuildStep={0} totalGroups={0} hasAnimations={false} />);

      expect(screen.getByText('Saving\u2026')).toBeTruthy();
    });

    it('shows "Saved \u2713" when saveStatus is "saved"', () => {
      mockState.saveStatus = 'saved';

      render(<StatusBar currentBuildStep={0} totalGroups={0} hasAnimations={false} />);

      expect(screen.getByText('Saved \u2713')).toBeTruthy();
    });

    it('shows "Save failed" when saveStatus is "error"', () => {
      mockState.saveStatus = 'error';

      render(<StatusBar currentBuildStep={0} totalGroups={0} hasAnimations={false} />);

      expect(screen.getByText('Save failed')).toBeTruthy();
    });
  });

  describe('mode indicator', () => {
    it('shows "Edit Mode" when mode is "live-edit"', () => {
      mockState.mode = 'live-edit';

      render(<StatusBar currentBuildStep={0} totalGroups={0} hasAnimations={false} />);

      expect(screen.getByText('Edit Mode')).toBeTruthy();
    });

    it('does not show "Edit Mode" when mode is "presentation"', () => {
      mockState.mode = 'presentation';

      render(<StatusBar currentBuildStep={0} totalGroups={0} hasAnimations={false} />);

      expect(screen.queryByText('Edit Mode')).toBeNull();
    });
  });

  describe('keyboard hints', () => {
    it('shows "Click text to edit" hint when mode is "live-edit"', () => {
      mockState.mode = 'live-edit';

      render(<StatusBar currentBuildStep={0} totalGroups={0} hasAnimations={false} />);

      expect(screen.getByText(/Click text to edit/)).toBeTruthy();
    });

    it('shows navigation hint when mode is "presentation" and no animations', () => {
      mockState.mode = 'presentation';

      render(<StatusBar currentBuildStep={0} totalGroups={0} hasAnimations={false} />);

      // The presentation mode hint includes navigation keys
      expect(screen.getByText(/to navigate/)).toBeTruthy();
    });

    it('shows animation hint when mode is "presentation" and has animations', () => {
      mockState.mode = 'presentation';

      render(<StatusBar currentBuildStep={0} totalGroups={3} hasAnimations={true} />);

      // The animation hint includes "Space to build"
      expect(screen.getByText(/Space to build/)).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('has role="status" on the status bar container', () => {
      render(<StatusBar currentBuildStep={0} totalGroups={0} hasAnimations={false} />);

      expect(screen.getByRole('status')).toBeTruthy();
    });

    it('has aria-label on save status indicators', () => {
      mockState.saveStatus = 'saving';

      render(<StatusBar currentBuildStep={0} totalGroups={0} hasAnimations={false} />);

      expect(screen.getByLabelText('Saving changes')).toBeTruthy();
    });
  });
});
