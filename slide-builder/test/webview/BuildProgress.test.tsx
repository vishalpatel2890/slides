/**
 * Tests for BuildProgress component.
 *
 * Story Reference: cv-3-5 AC29-AC40
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { BuildProgress } from '../../src/webview/catalog/components/BuildProgress';
import type { BuildProgress as BuildProgressType } from '../../src/shared/types';

// Mock VS Code API
const mockPostMessage = vi.fn();
vi.mock('../../src/webview/shared/hooks/useVSCodeApi', () => ({
  getVSCodeApi: () => ({
    postMessage: mockPostMessage,
  }),
}));

function createMockBuildProgress(
  overrides: Partial<BuildProgressType> = {}
): BuildProgressType {
  return {
    deckId: 'test-deck',
    deckName: 'Test Deck',
    status: 'building',
    startedAt: Date.now(),
    slides: [
      { number: 1, name: 'Introduction', status: 'built' },
      { number: 2, name: 'Overview', status: 'building' },
      { number: 3, name: 'Details', status: 'pending' },
      { number: 4, name: 'Conclusion', status: 'pending' },
    ],
    ...overrides,
  };
}

describe('BuildProgress', () => {
  const mockOnCancel = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('progress bar (AC-30)', () => {
    it('shows progress bar with correct fraction', () => {
      const progress = createMockBuildProgress();
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      expect(screen.getByText('1/4 slides')).toBeDefined();
    });

    it('progress bar has correct ARIA attributes', () => {
      const progress = createMockBuildProgress();
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar.getAttribute('aria-valuenow')).toBe('1');
      expect(progressBar.getAttribute('aria-valuemax')).toBe('4');
    });
  });

  describe('slide status list (AC-31)', () => {
    it('renders all slides with correct statuses', () => {
      const progress = createMockBuildProgress();
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      const list = screen.getByRole('list', { name: 'Slide build status' });
      const items = within(list).getAllByRole('listitem');

      expect(items).toHaveLength(4);
    });

    it('shows slide names and numbers', () => {
      const progress = createMockBuildProgress();
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      expect(screen.getByText('Slide 1')).toBeDefined();
      expect(screen.getByText('Introduction')).toBeDefined();
      expect(screen.getByText('Slide 2')).toBeDefined();
      expect(screen.getByText('Overview')).toBeDefined();
    });
  });

  describe('building slide accent (AC-32)', () => {
    it('applies building class to currently building slide', () => {
      const progress = createMockBuildProgress();
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      // Find slide 2 which is building
      const list = screen.getByRole('list', { name: 'Slide build status' });
      const items = within(list).getAllByRole('listitem');

      // Second item (index 1) should have the building class
      expect(items[1].className).toContain('build-progress__slide--building');
    });
  });

  describe('cancel button (AC-33)', () => {
    it('shows cancel button when building', () => {
      const progress = createMockBuildProgress();
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      expect(screen.getByRole('button', { name: /cancel build/i })).toBeDefined();
    });

    it('sends cancel-build message on click', () => {
      const progress = createMockBuildProgress();
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel build/i }));

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'cancel-build',
        deckId: 'test-deck',
      });
    });

    it('hides cancel button when build complete', () => {
      const progress = createMockBuildProgress({
        status: 'complete',
        slides: [
          { number: 1, name: 'Introduction', status: 'built' },
          { number: 2, name: 'Overview', status: 'built' },
        ],
      });
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      expect(screen.queryByRole('button', { name: /cancel build/i })).toBeNull();
    });
  });

  describe('build complete banner (AC-37, AC-38)', () => {
    it('shows complete banner when all slides built', () => {
      const progress = createMockBuildProgress({
        status: 'complete',
        slides: [
          { number: 1, name: 'Introduction', status: 'built' },
          { number: 2, name: 'Overview', status: 'built' },
        ],
      });
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      // "Build Complete" appears in both header and banner - use getAllByText
      const completeTexts = screen.getAllByText('Build Complete');
      expect(completeTexts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('All slides have been built successfully.')).toBeDefined();
    });

    it('shows View Slides CTA button', () => {
      const progress = createMockBuildProgress({ status: 'complete' });
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      expect(screen.getByRole('button', { name: /view slides/i })).toBeDefined();
    });

    it('View Slides sends open-slide-viewer message', () => {
      const progress = createMockBuildProgress({ status: 'complete' });
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      fireEvent.click(screen.getByRole('button', { name: /view slides/i }));

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'open-slide-viewer',
        deckId: 'test-deck',
      });
    });

    it('shows Edit Plan and Present buttons', () => {
      const progress = createMockBuildProgress({ status: 'complete' });
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      expect(screen.getByRole('button', { name: /edit plan/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /present/i })).toBeDefined();
    });
  });

  describe('cancelled state (AC-36)', () => {
    it('shows cancelled banner with counts', () => {
      const progress = createMockBuildProgress({
        status: 'cancelled',
        slides: [
          { number: 1, name: 'Introduction', status: 'built' },
          { number: 2, name: 'Overview', status: 'built' },
          { number: 3, name: 'Details', status: 'pending' },
          { number: 4, name: 'Conclusion', status: 'pending' },
        ],
      });
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      // "Build Cancelled" appears in both header and banner - use getAllByText
      const cancelledTexts = screen.getAllByText(/build cancelled/i);
      expect(cancelledTexts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/2\/4 slides built/i)).toBeDefined();
    });

    it('shows back button when cancelled', () => {
      const progress = createMockBuildProgress({ status: 'cancelled' });
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      expect(screen.getByRole('button', { name: /back to deck/i })).toBeDefined();
    });
  });

  describe('error state', () => {
    it('shows error message for failed slides', () => {
      const progress = createMockBuildProgress({
        slides: [
          { number: 1, name: 'Introduction', status: 'built' },
          { number: 2, name: 'Overview', status: 'error', errorMessage: 'Build failed' },
          { number: 3, name: 'Details', status: 'pending' },
        ],
      });
      render(
        <BuildProgress progress={progress} onCancel={mockOnCancel} onBack={mockOnBack} />
      );

      expect(screen.getByText('Build failed')).toBeDefined();
    });
  });
});
