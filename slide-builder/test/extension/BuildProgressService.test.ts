/**
 * Tests for BuildProgressService.
 *
 * Story Reference: cv-3-5 AC29-AC40
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BuildProgressService } from '../../src/extension/BuildProgressService';
import type { FileWatcherService } from '../../src/extension/FileWatcherService';
import type { CatalogDataService } from '../../src/extension/CatalogDataService';
import type { DeckDetail } from '../../src/shared/types';

// Mock dependencies
function createMockFileWatcher(): FileWatcherService {
  const callbacks: ((uri: { fsPath: string }) => void)[] = [];
  return {
    onFileChanged: vi.fn((callback) => {
      callbacks.push(callback);
      return { dispose: vi.fn() };
    }),
    // Helper to trigger file changes in tests
    _triggerFileChange: (fsPath: string) => {
      callbacks.forEach((cb) => cb({ fsPath }));
    },
    dispose: vi.fn(),
  } as unknown as FileWatcherService & { _triggerFileChange: (path: string) => void };
}

function createMockDataService(deckDetail: DeckDetail | null = null): CatalogDataService {
  return {
    getDeckDetail: vi.fn().mockResolvedValue(deckDetail),
  } as unknown as CatalogDataService;
}

function createMockOutputChannel() {
  return {
    appendLine: vi.fn(),
  };
}

function createMockDeckDetail(deckId: string, slideCount: number): DeckDetail {
  return {
    id: deckId,
    name: `Test Deck ${deckId}`,
    path: `/workspace/output/${deckId}`,
    slideCount,
    builtSlideCount: 0,
    status: 'planned',
    lastModified: Date.now(),
    slides: Array.from({ length: slideCount }, (_, i) => ({
      number: i + 1,
      intent: `Slide ${i + 1} intent`,
      template: 'title-slide',
      status: 'planned' as const,
    })),
    planPath: `/workspace/output/${deckId}/plan.yaml`,
  };
}

describe('BuildProgressService', () => {
  let service: BuildProgressService;
  let mockFileWatcher: ReturnType<typeof createMockFileWatcher>;
  let mockDataService: CatalogDataService;
  let mockOutputChannel: ReturnType<typeof createMockOutputChannel>;

  beforeEach(() => {
    mockFileWatcher = createMockFileWatcher();
    mockDataService = createMockDataService(createMockDeckDetail('test-deck', 5));
    mockOutputChannel = createMockOutputChannel();
    service = new BuildProgressService(
      mockFileWatcher as unknown as FileWatcherService,
      mockDataService,
      mockOutputChannel as unknown as import('vscode').OutputChannel
    );
  });

  afterEach(() => {
    service.dispose();
  });

  describe('startBuild', () => {
    it('initializes build progress with all slides as pending except first (AC-29, AC-30)', async () => {
      const progress = await service.startBuild('test-deck', 'all');

      expect(progress.deckId).toBe('test-deck');
      expect(progress.status).toBe('building');
      expect(progress.slides).toHaveLength(5);
      expect(progress.slides[0].status).toBe('building');
      expect(progress.slides.slice(1).every((s) => s.status === 'pending')).toBe(true);
    });

    it('returns current build progress via getProgress()', async () => {
      await service.startBuild('test-deck', 'all');
      const progress = service.getProgress();

      expect(progress).not.toBeNull();
      expect(progress?.deckId).toBe('test-deck');
    });

    it('reports isBuilding() correctly', async () => {
      expect(service.isBuilding()).toBe(false);
      await service.startBuild('test-deck', 'all');
      expect(service.isBuilding()).toBe(true);
    });
  });

  describe('progress tracking', () => {
    it('marks slide as built when HTML file is detected (AC-34)', async () => {
      await service.startBuild('test-deck', 'all');

      // Simulate file watcher detecting new slide HTML
      mockFileWatcher._triggerFileChange('/workspace/output/test-deck/slides/slide-1.html');

      const progress = service.getProgress();
      expect(progress?.slides[0].status).toBe('built');
      expect(progress?.slides[1].status).toBe('building'); // Next slide now building
    });

    it('advances to next slide when current completes (AC-31)', async () => {
      await service.startBuild('test-deck', 'all');

      // Complete slides 1, 2, 3
      mockFileWatcher._triggerFileChange('/workspace/output/test-deck/slides/slide-1.html');
      mockFileWatcher._triggerFileChange('/workspace/output/test-deck/slides/slide-2.html');
      mockFileWatcher._triggerFileChange('/workspace/output/test-deck/slides/slide-3.html');

      const progress = service.getProgress();
      expect(progress?.slides.filter((s) => s.status === 'built')).toHaveLength(3);
      expect(progress?.slides[3].status).toBe('building');
    });

    it('marks build complete when all slides are built (AC-37)', async () => {
      await service.startBuild('test-deck', 'all');

      // Complete all slides
      for (let i = 1; i <= 5; i++) {
        mockFileWatcher._triggerFileChange(`/workspace/output/test-deck/slides/slide-${i}.html`);
      }

      const progress = service.getProgress();
      expect(progress?.status).toBe('complete');
      expect(progress?.completedAt).toBeDefined();
    });

    it('notifies progress callback on each update', async () => {
      const callback = vi.fn();
      service.onProgress(callback);

      await service.startBuild('test-deck', 'all');
      expect(callback).toHaveBeenCalledTimes(1);

      mockFileWatcher._triggerFileChange('/workspace/output/test-deck/slides/slide-1.html');
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelBuild', () => {
    it('sets status to cancelled (AC-33)', async () => {
      await service.startBuild('test-deck', 'all');
      service.cancelBuild();

      const progress = service.getProgress();
      expect(progress?.status).toBe('cancelled');
    });

    it('preserves built slides on cancel (AC-36)', async () => {
      await service.startBuild('test-deck', 'all');

      // Build 2 slides then cancel
      mockFileWatcher._triggerFileChange('/workspace/output/test-deck/slides/slide-1.html');
      mockFileWatcher._triggerFileChange('/workspace/output/test-deck/slides/slide-2.html');
      service.cancelBuild();

      const progress = service.getProgress();
      expect(progress?.slides.filter((s) => s.status === 'built')).toHaveLength(2);
      expect(progress?.slides[2].status).toBe('pending'); // Was building, now pending
    });

    it('sets completedAt timestamp on cancel', async () => {
      await service.startBuild('test-deck', 'all');
      service.cancelBuild();

      const progress = service.getProgress();
      expect(progress?.completedAt).toBeDefined();
    });
  });

  describe('getSummary', () => {
    it('returns correct counts during build', async () => {
      await service.startBuild('test-deck', 'all');

      mockFileWatcher._triggerFileChange('/workspace/output/test-deck/slides/slide-1.html');
      mockFileWatcher._triggerFileChange('/workspace/output/test-deck/slides/slide-2.html');

      const summary = service.getSummary();
      expect(summary?.builtCount).toBe(2);
      expect(summary?.totalCount).toBe(5);
      expect(summary?.status).toBe('building');
    });

    it('returns null when no build is active', () => {
      expect(service.getSummary()).toBeNull();
    });
  });

  describe('clearBuild', () => {
    it('clears active build state', async () => {
      await service.startBuild('test-deck', 'all');
      service.clearBuild();

      expect(service.getProgress()).toBeNull();
      expect(service.isBuilding()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('marks slide as error when markSlideError called', async () => {
      await service.startBuild('test-deck', 'all');
      service.markSlideError(1, 'Build failed');

      const progress = service.getProgress();
      expect(progress?.slides[0].status).toBe('error');
      expect(progress?.slides[0].errorMessage).toBe('Build failed');
    });
  });

  describe('lv-1-1: buildId tracking (AC-12)', () => {
    it('generates a buildId when none provided', async () => {
      await service.startBuild('test-deck', 'all');

      const buildId = service.getBuildId();
      expect(buildId).not.toBeNull();
      expect(buildId).toMatch(/^test-deck-\d+$/);
    });

    it('uses provided buildId when given', async () => {
      await service.startBuild('test-deck', 'all', undefined, 'custom-build-123');

      expect(service.getBuildId()).toBe('custom-build-123');
    });

    it('clears buildId on clearBuild', async () => {
      await service.startBuild('test-deck', 'all');
      expect(service.getBuildId()).not.toBeNull();

      service.clearBuild();
      expect(service.getBuildId()).toBeNull();
    });

    it('clears buildId on dispose', async () => {
      await service.startBuild('test-deck', 'all');
      service.dispose();
      expect(service.getBuildId()).toBeNull();
    });
  });

  describe('lv-1-1: isBuilding with deckId filter', () => {
    it('returns true for matching deckId when building', async () => {
      await service.startBuild('test-deck', 'all');

      expect(service.isBuilding('test-deck')).toBe(true);
    });

    it('returns false for non-matching deckId', async () => {
      await service.startBuild('test-deck', 'all');

      expect(service.isBuilding('other-deck')).toBe(false);
    });

    it('returns false for matching deckId when build is complete', async () => {
      await service.startBuild('test-deck', 'all');

      // Complete all slides
      for (let i = 1; i <= 5; i++) {
        mockFileWatcher._triggerFileChange(`/workspace/output/test-deck/slides/slide-${i}.html`);
      }

      expect(service.isBuilding('test-deck')).toBe(false);
    });

    it('returns false when no build is active', () => {
      expect(service.isBuilding('test-deck')).toBe(false);
    });
  });
});
