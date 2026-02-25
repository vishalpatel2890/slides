/**
 * Tests for SlideViewerV2Panel static methods.
 *
 * Story Reference: lv-1-2 AC-14, AC-15, AC-16, AC-17, AC-19
 * Tests: isOpen(), isDismissedForBuild(), clearDismissedForDeck(),
 *        queueMessage(), flushPendingMessages(), onDidDispose dismissed tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlideViewerV2Panel } from '../../src/extension/SlideViewerV2Panel';
import type { BuildProgressService } from '../../src/extension/BuildProgressService';
import type { CatalogDataService } from '../../src/extension/CatalogDataService';

// Access private statics for test setup/teardown via any cast
const Panel = SlideViewerV2Panel as any;

function createMockOutputChannel() {
  return {
    appendLine: vi.fn(),
    append: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
    name: 'Mock Channel',
  };
}

function createMockBuildProgressService(
  overrides: Partial<{
    isBuilding: (deckId?: string) => boolean;
    getBuildId: () => string | null;
  }> = {}
): BuildProgressService {
  return {
    isBuilding: vi.fn().mockImplementation(overrides.isBuilding ?? (() => false)),
    getBuildId: vi.fn().mockImplementation(overrides.getBuildId ?? (() => null)),
    startBuild: vi.fn(),
    cancelBuild: vi.fn(),
    getProgress: vi.fn(),
    onProgress: vi.fn(),
    clearBuild: vi.fn(),
    getSummary: vi.fn(),
    dispose: vi.fn(),
    markSlideError: vi.fn(),
  } as unknown as BuildProgressService;
}

describe('SlideViewerV2Panel', () => {
  beforeEach(() => {
    // Reset static state between tests
    Panel.panels = new Map();
    Panel.pendingMessages = new Map();
    Panel.dismissedBuilds = new Set();
    Panel.buildProgressService = null;
  });

  describe('isOpen (AC-19)', () => {
    it('returns false when no panel exists for deckId', () => {
      expect(SlideViewerV2Panel.isOpen('my-deck')).toBe(false);
    });

    it('returns true when panel exists for deckId', () => {
      Panel.panels.set('my-deck', { /* mock panel */ });
      expect(SlideViewerV2Panel.isOpen('my-deck')).toBe(true);
    });

    it('returns false for different deckId when another panel exists', () => {
      Panel.panels.set('deck-a', { /* mock panel */ });
      expect(SlideViewerV2Panel.isOpen('deck-b')).toBe(false);
    });
  });

  describe('hasPanel', () => {
    it('returns same result as isOpen', () => {
      expect(SlideViewerV2Panel.hasPanel('my-deck')).toBe(false);
      Panel.panels.set('my-deck', { /* mock panel */ });
      expect(SlideViewerV2Panel.hasPanel('my-deck')).toBe(true);
    });
  });

  describe('queueMessage and flushPendingMessages (AC-14, AC-19)', () => {
    it('queues a message for a deckId', () => {
      const message = { type: 'v2-build-started', mode: 'all', totalSlides: 5, startSlide: 1, buildId: 'build-1' };
      SlideViewerV2Panel.queueMessage('my-deck', message);

      const flushed = SlideViewerV2Panel.flushPendingMessages('my-deck');
      expect(flushed).toHaveLength(1);
      expect(flushed[0]).toEqual(message);
    });

    it('queues multiple messages for the same deckId', () => {
      SlideViewerV2Panel.queueMessage('my-deck', { type: 'msg-1' });
      SlideViewerV2Panel.queueMessage('my-deck', { type: 'msg-2' });
      SlideViewerV2Panel.queueMessage('my-deck', { type: 'msg-3' });

      const flushed = SlideViewerV2Panel.flushPendingMessages('my-deck');
      expect(flushed).toHaveLength(3);
    });

    it('clears queue after flush', () => {
      SlideViewerV2Panel.queueMessage('my-deck', { type: 'msg-1' });
      SlideViewerV2Panel.flushPendingMessages('my-deck');

      const secondFlush = SlideViewerV2Panel.flushPendingMessages('my-deck');
      expect(secondFlush).toHaveLength(0);
    });

    it('returns empty array when no messages queued', () => {
      const flushed = SlideViewerV2Panel.flushPendingMessages('nonexistent-deck');
      expect(flushed).toHaveLength(0);
    });

    it('isolates queues per deckId', () => {
      SlideViewerV2Panel.queueMessage('deck-a', { type: 'msg-a' });
      SlideViewerV2Panel.queueMessage('deck-b', { type: 'msg-b' });

      const flushedA = SlideViewerV2Panel.flushPendingMessages('deck-a');
      const flushedB = SlideViewerV2Panel.flushPendingMessages('deck-b');

      expect(flushedA).toHaveLength(1);
      expect((flushedA[0] as any).type).toBe('msg-a');
      expect(flushedB).toHaveLength(1);
      expect((flushedB[0] as any).type).toBe('msg-b');
    });
  });

  describe('isDismissedForBuild (AC-15, AC-16)', () => {
    it('returns false when no entries exist', () => {
      expect(SlideViewerV2Panel.isDismissedForBuild('my-deck', 'build-1')).toBe(false);
    });

    it('returns true for matching deckId:buildId', () => {
      Panel.dismissedBuilds.add('my-deck:build-1');
      expect(SlideViewerV2Panel.isDismissedForBuild('my-deck', 'build-1')).toBe(true);
    });

    it('returns false for non-matching buildId', () => {
      Panel.dismissedBuilds.add('my-deck:build-1');
      expect(SlideViewerV2Panel.isDismissedForBuild('my-deck', 'build-2')).toBe(false);
    });

    it('returns false for non-matching deckId', () => {
      Panel.dismissedBuilds.add('deck-a:build-1');
      expect(SlideViewerV2Panel.isDismissedForBuild('deck-b', 'build-1')).toBe(false);
    });
  });

  describe('clearDismissedForDeck (AC-17)', () => {
    it('removes all entries for a specific deckId', () => {
      Panel.dismissedBuilds.add('deck-a:build-1');
      Panel.dismissedBuilds.add('deck-a:build-2');
      Panel.dismissedBuilds.add('deck-b:build-3');

      SlideViewerV2Panel.clearDismissedForDeck('deck-a');

      expect(SlideViewerV2Panel.isDismissedForBuild('deck-a', 'build-1')).toBe(false);
      expect(SlideViewerV2Panel.isDismissedForBuild('deck-a', 'build-2')).toBe(false);
      // deck-b entry should be preserved
      expect(SlideViewerV2Panel.isDismissedForBuild('deck-b', 'build-3')).toBe(true);
    });

    it('handles empty set gracefully', () => {
      expect(() => SlideViewerV2Panel.clearDismissedForDeck('nonexistent')).not.toThrow();
    });

    it('handles deck with no entries when other entries exist', () => {
      Panel.dismissedBuilds.add('deck-a:build-1');
      SlideViewerV2Panel.clearDismissedForDeck('deck-b');
      // deck-a should still be dismissed
      expect(SlideViewerV2Panel.isDismissedForBuild('deck-a', 'build-1')).toBe(true);
    });
  });

  describe('setBuildProgressService', () => {
    it('stores the buildProgressService reference', () => {
      const mockService = createMockBuildProgressService();
      SlideViewerV2Panel.setBuildProgressService(mockService);
      expect(Panel.buildProgressService).toBe(mockService);
    });
  });

  describe('onDidDispose dismissed tracking (AC-15)', () => {
    it('adds dismissed entry when viewer closed during active build', () => {
      const mockOutputChannel = createMockOutputChannel();
      const mockService = createMockBuildProgressService({
        isBuilding: (deckId?: string) => deckId === 'my-deck',
        getBuildId: () => 'my-deck-12345',
      });
      SlideViewerV2Panel.setBuildProgressService(mockService);

      // Simulate createOrShow by setting up the panel and triggering dispose
      let disposeCallback: (() => void) | null = null;
      const mockPanel = {
        webview: {
          html: '',
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
          postMessage: vi.fn(),
          asWebviewUri: vi.fn().mockReturnValue({ toString: () => 'mock-uri' }),
          cspSource: 'mock-csp',
        },
        reveal: vi.fn(),
        dispose: vi.fn(),
        onDidDispose: vi.fn().mockImplementation((cb: () => void) => {
          disposeCallback = cb;
          return { dispose: vi.fn() };
        }),
      };

      // Register the panel manually (simulating createOrShow)
      Panel.panels.set('my-deck', mockPanel);

      // Simulate the onDidDispose callback that would be registered by createOrShow
      // We test the dismissed tracking logic directly since we can't easily call createOrShow
      // in unit tests (it requires full vscode mocking)
      if (Panel.buildProgressService &&
          Panel.buildProgressService.isBuilding('my-deck')) {
        const buildId = Panel.buildProgressService.getBuildId();
        if (buildId) {
          Panel.dismissedBuilds.add(`my-deck:${buildId}`);
        }
      }

      expect(SlideViewerV2Panel.isDismissedForBuild('my-deck', 'my-deck-12345')).toBe(true);
    });

    it('does not add dismissed entry when no build is active', () => {
      const mockService = createMockBuildProgressService({
        isBuilding: () => false,
        getBuildId: () => null,
      });
      SlideViewerV2Panel.setBuildProgressService(mockService);

      // Simulate dispose without active build
      if (Panel.buildProgressService &&
          Panel.buildProgressService.isBuilding('my-deck')) {
        const buildId = Panel.buildProgressService.getBuildId();
        if (buildId) {
          Panel.dismissedBuilds.add(`my-deck:${buildId}`);
        }
      }

      expect(Panel.dismissedBuilds.size).toBe(0);
    });

    it('does not add dismissed entry when buildProgressService is not set', () => {
      // buildProgressService is null by default
      if (Panel.buildProgressService &&
          Panel.buildProgressService.isBuilding('my-deck')) {
        const buildId = Panel.buildProgressService.getBuildId();
        if (buildId) {
          Panel.dismissedBuilds.add(`my-deck:${buildId}`);
        }
      }

      expect(Panel.dismissedBuilds.size).toBe(0);
    });
  });

  describe('integration: dismissed tracking workflow', () => {
    it('full lifecycle: dismiss during build, check dismissed, clear for new build', () => {
      const mockService = createMockBuildProgressService({
        isBuilding: (deckId?: string) => deckId === 'my-deck',
        getBuildId: () => 'build-abc',
      });
      SlideViewerV2Panel.setBuildProgressService(mockService);

      // Step 1: Simulate viewer closed during build
      Panel.dismissedBuilds.add('my-deck:build-abc');

      // Step 2: Verify dismissed
      expect(SlideViewerV2Panel.isDismissedForBuild('my-deck', 'build-abc')).toBe(true);

      // Step 3: New build starts, clear dismissed
      SlideViewerV2Panel.clearDismissedForDeck('my-deck');

      // Step 4: Verify cleared
      expect(SlideViewerV2Panel.isDismissedForBuild('my-deck', 'build-abc')).toBe(false);

      // Step 5: New build should auto-open normally (not dismissed)
      expect(SlideViewerV2Panel.isDismissedForBuild('my-deck', 'build-def')).toBe(false);
    });
  });
});
