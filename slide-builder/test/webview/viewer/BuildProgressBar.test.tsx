import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { BuildProgressBar } from '../../../src/webview/viewer/components/BuildProgressBar';
import type { BuildModeState } from '../../../src/webview/viewer/context/ViewerContext';

/**
 * Tests for BuildProgressBar component.
 * Story Reference: lv-2-2 AC-13 through AC-18, AC-25
 */
describe('BuildProgressBar (lv-2-2)', () => {
  const defaultBuildMode: BuildModeState = {
    active: true,
    buildId: 'test-build',
    mode: 'all',
    totalSlides: 12,
    currentSlide: 3,
    builtCount: 3,
    status: 'building',
    completedAt: null,
  };

  let onDismiss: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onDismiss = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // AC-13: Render nothing when idle
  it('AC-13: returns null when status is idle', () => {
    const idleBuildMode: BuildModeState = {
      ...defaultBuildMode,
      active: false,
      status: 'idle',
    };

    const { container } = render(
      <BuildProgressBar buildMode={idleBuildMode} onDismiss={onDismiss} />
    );

    expect(container.innerHTML).toBe('');
  });

  // AC-13: Renders bar when building
  it('AC-13: renders progress bar when status is building', () => {
    render(
      <BuildProgressBar buildMode={defaultBuildMode} onDismiss={onDismiss} />
    );

    const bar = screen.getByRole('progressbar');
    expect(bar).toBeDefined();
  });

  // AC-14: Status text shows "Building slide M+1 of N..."
  it('AC-14: shows "Building slide M+1 of N..." during building', () => {
    render(
      <BuildProgressBar buildMode={defaultBuildMode} onDismiss={onDismiss} />
    );

    expect(screen.getByText('Building slide 4 of 12...')).toBeDefined();
  });

  // AC-14: Progress width calculation
  it('AC-14: progress width is (builtCount/totalSlides)*100%', () => {
    const buildMode: BuildModeState = {
      ...defaultBuildMode,
      builtCount: 3,
      totalSlides: 12,
    };

    render(
      <BuildProgressBar buildMode={buildMode} onDismiss={onDismiss} />
    );

    const fill = document.querySelector('.build-progress-bar__fill') as HTMLElement;
    expect(fill).not.toBeNull();
    expect(fill.style.width).toBe('25%');
  });

  // AC-15: Completion text
  it('AC-15: shows "All N slides built" on successful completion', () => {
    const completeBuildMode: BuildModeState = {
      ...defaultBuildMode,
      active: false,
      builtCount: 12,
      status: 'complete',
      completedAt: Date.now(),
    };

    render(
      <BuildProgressBar buildMode={completeBuildMode} onDismiss={onDismiss} />
    );

    expect(screen.getByText('All 12 slides built')).toBeDefined();
  });

  // AC-15: Auto-dismiss after 4 seconds on complete
  it('AC-15: auto-dismisses after 4 seconds when status=complete', () => {
    const completeBuildMode: BuildModeState = {
      ...defaultBuildMode,
      active: false,
      builtCount: 12,
      status: 'complete',
      completedAt: Date.now(),
    };

    render(
      <BuildProgressBar buildMode={completeBuildMode} onDismiss={onDismiss} />
    );

    expect(onDismiss).not.toHaveBeenCalled();

    // Advance timers by 4 seconds
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // AC-16: Cancelled text
  it('AC-16: shows "Build cancelled (M of N built)" when cancelled', () => {
    const cancelledBuildMode: BuildModeState = {
      ...defaultBuildMode,
      active: false,
      builtCount: 5,
      status: 'cancelled',
      completedAt: Date.now(),
    };

    render(
      <BuildProgressBar buildMode={cancelledBuildMode} onDismiss={onDismiss} />
    );

    expect(screen.getByText('Build cancelled (5 of 12 built)')).toBeDefined();
  });

  // AC-16: Cancelled state does NOT auto-dismiss
  it('AC-16: does NOT auto-dismiss when cancelled', () => {
    const cancelledBuildMode: BuildModeState = {
      ...defaultBuildMode,
      active: false,
      builtCount: 5,
      status: 'cancelled',
      completedAt: Date.now(),
    };

    render(
      <BuildProgressBar buildMode={cancelledBuildMode} onDismiss={onDismiss} />
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  // AC-17: Error text
  it('AC-17: shows "Build completed with errors (M of N built)" on error', () => {
    const errorBuildMode: BuildModeState = {
      ...defaultBuildMode,
      active: false,
      builtCount: 8,
      status: 'error',
      completedAt: Date.now(),
    };

    render(
      <BuildProgressBar buildMode={errorBuildMode} onDismiss={onDismiss} />
    );

    expect(screen.getByText('Build completed with errors (8 of 12 built)')).toBeDefined();
  });

  // AC-17: Error state does NOT auto-dismiss
  it('AC-17: does NOT auto-dismiss when error', () => {
    const errorBuildMode: BuildModeState = {
      ...defaultBuildMode,
      active: false,
      builtCount: 8,
      status: 'error',
      completedAt: Date.now(),
    };

    render(
      <BuildProgressBar buildMode={errorBuildMode} onDismiss={onDismiss} />
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  // AC-18: Click dismisses immediately
  it('AC-18: click on bar calls onDismiss immediately', () => {
    render(
      <BuildProgressBar buildMode={defaultBuildMode} onDismiss={onDismiss} />
    );

    const bar = screen.getByRole('progressbar');
    fireEvent.click(bar);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // AC-25: VS Code CSS variables
  it('AC-25: uses VS Code CSS variables for theming', () => {
    render(
      <BuildProgressBar buildMode={defaultBuildMode} onDismiss={onDismiss} />
    );

    const bar = screen.getByRole('progressbar');
    const style = bar.getAttribute('style') || '';

    expect(style).toContain('--vscode-editor-background');
    expect(style).toContain('--vscode-panel-border');
    expect(style).toContain('--vscode-foreground');

    const fill = document.querySelector('.build-progress-bar__fill') as HTMLElement;
    expect(fill.style.backgroundColor).toContain('--vscode-progressBar-background');
  });

  // Progress width at 0%
  it('handles 0 totalSlides gracefully (0% width)', () => {
    const zeroBuildMode: BuildModeState = {
      ...defaultBuildMode,
      builtCount: 0,
      totalSlides: 0,
    };

    render(
      <BuildProgressBar buildMode={zeroBuildMode} onDismiss={onDismiss} />
    );

    const fill = document.querySelector('.build-progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });
});
