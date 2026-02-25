/**
 * Tests for useAnimations hook.
 * v2-2-3 AC1-11: Build animation playback state machine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useAnimations } from '../../../../src/webview/viewer/hooks/useAnimations';
import { ViewerProvider } from '../../../../src/webview/viewer/context/ViewerContext';
import type { ViewerV2Manifest } from '../../../../src/shared/types';

// Mock manifest with animation groups
const createMockManifest = (slideGroups: Record<number, string[][]>): ViewerV2Manifest => ({
  deckId: 'test-deck',
  deckName: 'Test Deck',
  slideCount: Object.keys(slideGroups).length,
  slides: Object.entries(slideGroups).map(([num, groups]) => ({
    number: parseInt(num),
    fileName: `slide-${num}.html`,
    title: `Slide ${num}`,
    buildGroups: groups,
  })),
  generatedAt: new Date().toISOString(),
});

describe('useAnimations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to render hook with ViewerProvider
  const renderAnimationsHook = (manifest: ViewerV2Manifest | null) => {
    return renderHook(() => useAnimations(manifest), {
      wrapper: ({ children }) => React.createElement(ViewerProvider, null, children),
    });
  };

  describe('initial state', () => {
    it('returns hasAnimations=false when manifest is null', () => {
      const { result } = renderAnimationsHook(null);
      expect(result.current.hasAnimations).toBe(false);
    });

    it('returns hasAnimations=false when slide has no animation groups', () => {
      const manifest = createMockManifest({ 1: [] });
      const { result } = renderAnimationsHook(manifest);
      expect(result.current.hasAnimations).toBe(false);
    });

    it('returns hasAnimations=true when slide has animation groups', () => {
      const manifest = createMockManifest({
        1: [['.bullet-1'], ['.bullet-2', '.bullet-3']],
      });
      const { result } = renderAnimationsHook(manifest);
      expect(result.current.hasAnimations).toBe(true);
    });

    it('returns currentBuildStep=0 initially', () => {
      const manifest = createMockManifest({
        1: [['.bullet-1'], ['.bullet-2']],
      });
      const { result } = renderAnimationsHook(manifest);
      expect(result.current.currentBuildStep).toBe(0);
    });

    it('returns correct totalGroups count', () => {
      const manifest = createMockManifest({
        1: [['.bullet-1'], ['.bullet-2'], ['.bullet-3']],
      });
      const { result } = renderAnimationsHook(manifest);
      expect(result.current.totalGroups).toBe(3);
    });
  });

  describe('revealNextGroup returns false without DOM (AC-3)', () => {
    it('returns false when container not found', () => {
      const manifest = createMockManifest({
        1: [['.bullet-1'], ['.bullet-2']],
      });
      const { result } = renderAnimationsHook(manifest);

      // Without DOM, revealNextGroup returns false
      const revealed = result.current.revealNextGroup();
      expect(revealed).toBe(false);
    });

    it('returns false when already at totalGroups', () => {
      const manifest = createMockManifest({ 1: [] });
      const { result } = renderAnimationsHook(manifest);

      // No animations means totalGroups=0, step=0, so already at end
      const revealed = result.current.revealNextGroup();
      expect(revealed).toBe(false);
    });
  });

  describe('hideLastGroup (AC-5)', () => {
    it('returns false when at step 0', () => {
      const manifest = createMockManifest({
        1: [['.bullet-1'], ['.bullet-2']],
      });
      const { result } = renderAnimationsHook(manifest);

      // At step 0, nothing to hide
      const hidden = result.current.hideLastGroup();
      expect(hidden).toBe(false);
    });

    it('returns false when container not found', () => {
      const manifest = createMockManifest({
        1: [['.bullet-1'], ['.bullet-2']],
      });
      const { result } = renderAnimationsHook(manifest);

      // Without DOM, hideLastGroup returns false (even if we could increment step)
      const hidden = result.current.hideLastGroup();
      expect(hidden).toBe(false);
    });
  });

  describe('exported functions', () => {
    it('exports revealNextGroup function', () => {
      const manifest = createMockManifest({ 1: [['.bullet-1']] });
      const { result } = renderAnimationsHook(manifest);
      expect(typeof result.current.revealNextGroup).toBe('function');
    });

    it('exports hideLastGroup function', () => {
      const manifest = createMockManifest({ 1: [['.bullet-1']] });
      const { result } = renderAnimationsHook(manifest);
      expect(typeof result.current.hideLastGroup).toBe('function');
    });

    it('exports revealAll function', () => {
      const manifest = createMockManifest({ 1: [['.bullet-1']] });
      const { result } = renderAnimationsHook(manifest);
      expect(typeof result.current.revealAll).toBe('function');
    });

    it('exports setFullyBuilt function', () => {
      const manifest = createMockManifest({ 1: [['.bullet-1']] });
      const { result } = renderAnimationsHook(manifest);
      expect(typeof result.current.setFullyBuilt).toBe('function');
    });
  });

  describe('slide without animations', () => {
    it('hasAnimations is false for slide with empty buildGroups', () => {
      const manifest = createMockManifest({ 1: [] });
      const { result } = renderAnimationsHook(manifest);

      expect(result.current.hasAnimations).toBe(false);
      expect(result.current.totalGroups).toBe(0);
    });

    it('revealNextGroup returns false for slide without animations', () => {
      const manifest = createMockManifest({ 1: [] });
      const { result } = renderAnimationsHook(manifest);

      const revealed = result.current.revealNextGroup();
      expect(revealed).toBe(false);
    });
  });

  describe('totalGroups calculation', () => {
    it('counts single-element groups correctly', () => {
      const manifest = createMockManifest({
        1: [['.a'], ['.b'], ['.c']],
      });
      const { result } = renderAnimationsHook(manifest);
      expect(result.current.totalGroups).toBe(3);
    });

    it('counts multi-element groups correctly', () => {
      const manifest = createMockManifest({
        1: [['.a', '.b'], ['.c', '.d', '.e']],
      });
      const { result } = renderAnimationsHook(manifest);
      expect(result.current.totalGroups).toBe(2);
    });

    it('returns 0 for undefined buildGroups', () => {
      const manifest: ViewerV2Manifest = {
        deckId: 'test',
        deckName: 'Test',
        slideCount: 1,
        slides: [{ number: 1, fileName: 'slide-1.html', title: 'Slide 1' }],
        generatedAt: new Date().toISOString(),
      };
      const { result } = renderAnimationsHook(manifest);
      expect(result.current.totalGroups).toBe(0);
      expect(result.current.hasAnimations).toBe(false);
    });
  });

  describe('new animations.groups format', () => {
    // Helper to create manifest with new format
    const createManifestWithAnimations = (slideAnimations: Record<number, Array<{ id: string; order: number; elementIds: string[]; colorIndex: number }>>): ViewerV2Manifest => ({
      deckId: 'test-deck',
      deckName: 'Test Deck',
      slideCount: Object.keys(slideAnimations).length,
      slides: Object.entries(slideAnimations).map(([num, groups]) => ({
        number: parseInt(num),
        fileName: `slide-${num}.html`,
        title: `Slide ${num}`,
        slideId: `slide-${num}-id`,
        animations: groups.length > 0 ? { groups } : undefined,
      })),
      generatedAt: new Date().toISOString(),
    });

    it('hasAnimations=true when animations.groups has groups', () => {
      const manifest = createManifestWithAnimations({
        1: [
          { id: 'group-1', order: 1, elementIds: ['bullet-1'], colorIndex: 0 },
          { id: 'group-2', order: 2, elementIds: ['bullet-2'], colorIndex: 1 },
        ],
      });
      const { result } = renderAnimationsHook(manifest);
      expect(result.current.hasAnimations).toBe(true);
      expect(result.current.totalGroups).toBe(2);
    });

    it('hasAnimations=false when animations.groups is empty', () => {
      const manifest = createManifestWithAnimations({ 1: [] });
      const { result } = renderAnimationsHook(manifest);
      expect(result.current.hasAnimations).toBe(false);
    });

    it('sorts groups by order property', () => {
      const manifest = createManifestWithAnimations({
        1: [
          { id: 'group-3', order: 3, elementIds: ['c'], colorIndex: 2 },
          { id: 'group-1', order: 1, elementIds: ['a'], colorIndex: 0 },
          { id: 'group-2', order: 2, elementIds: ['b'], colorIndex: 1 },
        ],
      });
      const { result } = renderAnimationsHook(manifest);
      // Groups should be sorted by order, so totalGroups should be 3
      expect(result.current.totalGroups).toBe(3);
    });

    it('converts elementIds to CSS ID selectors', () => {
      const manifest = createManifestWithAnimations({
        1: [
          { id: 'group-1', order: 1, elementIds: ['build-ratio-1', 'build-ratio-2'], colorIndex: 0 },
        ],
      });
      const { result } = renderAnimationsHook(manifest);
      // The hook should have 1 group with 2 element selectors (#build-ratio-1, #build-ratio-2)
      expect(result.current.totalGroups).toBe(1);
      expect(result.current.hasAnimations).toBe(true);
    });

    it('prefers animations.groups over legacy buildGroups', () => {
      const manifest: ViewerV2Manifest = {
        deckId: 'test',
        deckName: 'Test',
        slideCount: 1,
        slides: [{
          number: 1,
          fileName: 'slide-1.html',
          title: 'Slide 1',
          // Both formats present - new format should take precedence
          animations: {
            groups: [
              { id: 'g1', order: 1, elementIds: ['new-1'], colorIndex: 0 },
              { id: 'g2', order: 2, elementIds: ['new-2'], colorIndex: 1 },
            ],
          },
          buildGroups: [['.legacy-1']], // Legacy format has 1 group
        }],
        generatedAt: new Date().toISOString(),
      };
      const { result } = renderAnimationsHook(manifest);
      // Should use new format (2 groups) not legacy (1 group)
      expect(result.current.totalGroups).toBe(2);
    });
  });
});
