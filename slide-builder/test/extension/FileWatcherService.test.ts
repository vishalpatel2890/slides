/**
 * Tests for FileWatcherService — debounce behavior and cleanup.
 * Watches both .slide-builder/ and output/ directories.
 * Provides per-deck file change callbacks for viewer auto-refresh.
 *
 * Story Reference: cv-1-3 AC-5
 * Story Reference: story-viewer-save-2 AC-1 through AC-5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { workspace, Uri } from 'vscode';
import { FileWatcherService } from '../../src/extension/FileWatcherService';

const mockOutputChannel = {
  appendLine: vi.fn(),
  append: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn(),
  name: 'Test Channel',
} as any;

const workspaceRoot = Uri.file('/mock/workspace');

describe('FileWatcherService', () => {
  let service: FileWatcherService;
  let mockWatchers: any[];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Each createFileSystemWatcher call returns a distinct mock
    mockWatchers = [];
    vi.mocked(workspace.createFileSystemWatcher).mockImplementation(() => {
      const watcher = {
        onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        dispose: vi.fn(),
      };
      mockWatchers.push(watcher);
      return watcher as any;
    });

    service = new FileWatcherService(workspaceRoot, mockOutputChannel);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates two file system watchers (for .slide-builder/ and output/)', () => {
    expect(workspace.createFileSystemWatcher).toHaveBeenCalledTimes(2);
    expect(mockWatchers).toHaveLength(2);
  });

  it('registers handlers for create, change, and delete on each watcher', () => {
    for (const watcher of mockWatchers) {
      expect(watcher.onDidCreate).toHaveBeenCalled();
      expect(watcher.onDidChange).toHaveBeenCalled();
      expect(watcher.onDidDelete).toHaveBeenCalled();
    }
  });

  it('debounces rapid events into a single callback (AC-5)', () => {
    const callback = vi.fn();
    service.onDecksChanged(callback);

    // Use first watcher's handlers (the .slide-builder watcher)
    const createHandler = mockWatchers[0].onDidCreate.mock.calls[0][0];
    const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
    const deleteHandler = mockWatchers[0].onDidDelete.mock.calls[0][0];

    createHandler({ fsPath: '/mock/file1' });
    changeHandler({ fsPath: '/mock/file2' });
    deleteHandler({ fsPath: '/mock/file3' });

    // Before debounce timeout
    expect(callback).not.toHaveBeenCalled();

    // After 200ms debounce
    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('events from either watcher trigger the same debounce', () => {
    const callback = vi.fn();
    service.onDecksChanged(callback);

    // Event from first watcher (.slide-builder)
    const sbHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
    sbHandler({ fsPath: '/mock/.slide-builder/status.yaml' });

    // Event from second watcher (output) before debounce fires
    const outputHandler = mockWatchers[1].onDidCreate.mock.calls[0][0];
    outputHandler({ fsPath: '/mock/output/deck/slides/slide-1.html' });

    vi.advanceTimersByTime(200);
    // Should coalesce into a single callback
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('resets debounce timer on new events within 200ms', () => {
    const callback = vi.fn();
    service.onDecksChanged(callback);

    const createHandler = mockWatchers[0].onDidCreate.mock.calls[0][0];

    createHandler({ fsPath: '/mock/file1' });
    vi.advanceTimersByTime(100);
    createHandler({ fsPath: '/mock/file2' });
    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('onDecksChanged returns disposable that unregisters callback', () => {
    const callback = vi.fn();
    const disposable = service.onDecksChanged(callback);
    disposable.dispose();

    const createHandler = mockWatchers[0].onDidCreate.mock.calls[0][0];
    createHandler({ fsPath: '/mock/file' });
    vi.advanceTimersByTime(200);

    expect(callback).not.toHaveBeenCalled();
  });

  it('notifies multiple registered callbacks', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    service.onDecksChanged(cb1);
    service.onDecksChanged(cb2);

    const createHandler = mockWatchers[0].onDidCreate.mock.calls[0][0];
    createHandler({ fsPath: '/mock/file' });
    vi.advanceTimersByTime(200);

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('dispose cleans up all watchers and callbacks', () => {
    const callback = vi.fn();
    service.onDecksChanged(callback);
    service.dispose();

    for (const watcher of mockWatchers) {
      expect(watcher.dispose).toHaveBeenCalled();
    }

    // Trigger shouldn't fire after dispose
    const createHandler = mockWatchers[0].onDidCreate.mock.calls[0][0];
    createHandler({ fsPath: '/mock/file' });
    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();
  });

  // =====================================================
  // Task 9: Tests for onFileChanged() (story-viewer-save-2)
  // =====================================================

  describe('onFileChanged (story-viewer-save-2)', () => {
    it('fires callback with URI when slide file changes (AC-1)', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      // Simulate slide file change via output watcher
      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
      const slideUri = Uri.file('/mock/workspace/output/test-deck/slides/slide-1.html');
      changeHandler(slideUri);

      // Wait for 300ms debounce
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(slideUri);
    });

    it('fires callback for manifest.json changes (AC-1)', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
      const manifestUri = Uri.file('/mock/workspace/output/test-deck/slides/manifest.json');
      changeHandler(manifestUri);

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(manifestUri);
    });

    it('per-deck debounce: rapid changes to same deck fire once after 300ms (AC-2)', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
      const slide1 = Uri.file('/mock/workspace/output/deck-a/slides/slide-1.html');
      const slide2 = Uri.file('/mock/workspace/output/deck-a/slides/slide-2.html');
      const slide3 = Uri.file('/mock/workspace/output/deck-a/slides/slide-3.html');

      // Rapid changes to same deck
      changeHandler(slide1);
      vi.advanceTimersByTime(100);
      changeHandler(slide2);
      vi.advanceTimersByTime(100);
      changeHandler(slide3);

      // After first 200ms total, callback not fired yet
      expect(callback).not.toHaveBeenCalled();

      // After 300ms from last change
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
      // Called with the last URI
      expect(callback).toHaveBeenCalledWith(slide3);
    });

    it('different decks debounce independently (AC-3)', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
      const slideA = Uri.file('/mock/workspace/output/deck-a/slides/slide-1.html');
      const slideB = Uri.file('/mock/workspace/output/deck-b/slides/slide-1.html');

      // Changes to two different decks
      changeHandler(slideA);
      changeHandler(slideB);

      // After 300ms, both should fire independently
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(slideA);
      expect(callback).toHaveBeenCalledWith(slideB);
    });

    it('only fires for slide HTML files and manifest.json, not other types (AC-1)', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];

      // These should NOT trigger callback
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/index.html'));
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/style.css'));
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/script.js'));
      changeHandler(Uri.file('/mock/workspace/output/test-deck/plan.yaml'));
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/slide-notes.txt'));

      vi.advanceTimersByTime(300);
      expect(callback).not.toHaveBeenCalled();

      // These SHOULD trigger callback
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/slide-1.html'));
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('returns disposable that unregisters callback', () => {
      const callback = vi.fn();
      const disposable = service.onFileChanged(callback);

      // Unregister
      disposable.dispose();

      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/slide-1.html'));
      vi.advanceTimersByTime(300);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // =====================================================
  // Task 10: Tests for suppressNextRefresh() (story-viewer-save-2)
  // =====================================================

  describe('suppressNextRefresh (story-viewer-save-2)', () => {
    it('skips next callback for suppressed deck (AC-4)', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      // Suppress the deck
      service.suppressNextRefresh('test-deck');

      // Trigger file change
      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/slide-1.html'));

      vi.advanceTimersByTime(300);
      // Should be suppressed - callback NOT called
      expect(callback).not.toHaveBeenCalled();
    });

    it('does not suppress callbacks for other decks (AC-4)', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      // Suppress only deck-a
      service.suppressNextRefresh('deck-a');

      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];

      // Change to deck-b (NOT suppressed)
      changeHandler(Uri.file('/mock/workspace/output/deck-b/slides/slide-1.html'));
      vi.advanceTimersByTime(300);

      // deck-b should fire normally
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('auto-expires after 1000ms and allows callback (AC-5)', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      // Suppress the deck
      service.suppressNextRefresh('test-deck');

      // Wait for auto-expiry (1000ms)
      vi.advanceTimersByTime(1000);

      // Now trigger file change - should NOT be suppressed anymore
      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/slide-1.html'));

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('only suppresses one callback, then allows subsequent ones', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      // Suppress the deck
      service.suppressNextRefresh('test-deck');

      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];

      // First change - suppressed
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/slide-1.html'));
      vi.advanceTimersByTime(300);
      expect(callback).not.toHaveBeenCalled();

      // Second change - should fire normally
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/slide-2.html'));
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('can suppress multiple decks independently', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      // Suppress both decks
      service.suppressNextRefresh('deck-a');
      service.suppressNextRefresh('deck-b');

      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];

      // Both should be suppressed
      changeHandler(Uri.file('/mock/workspace/output/deck-a/slides/slide-1.html'));
      changeHandler(Uri.file('/mock/workspace/output/deck-b/slides/slide-1.html'));
      vi.advanceTimersByTime(300);

      expect(callback).not.toHaveBeenCalled();

      // Now both should fire on next change
      changeHandler(Uri.file('/mock/workspace/output/deck-a/slides/slide-2.html'));
      changeHandler(Uri.file('/mock/workspace/output/deck-b/slides/slide-2.html'));
      vi.advanceTimersByTime(300);

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  // =====================================================
  // Task 11: Tests for dispose() cleanup (story-viewer-save-2)
  // =====================================================

  describe('dispose cleanup for file change infrastructure (story-viewer-save-2)', () => {
    it('clears pending deck debounce timers on dispose', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      // Start a debounce timer
      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/slide-1.html'));

      // Dispose before timer fires
      service.dispose();

      // Advance time - callback should NOT fire (timer was cleared)
      vi.advanceTimersByTime(500);
      expect(callback).not.toHaveBeenCalled();
    });

    it('clears suppress timers on dispose', () => {
      // Suppress a deck (starts 1000ms expiry timer)
      service.suppressNextRefresh('test-deck');

      // Dispose
      service.dispose();

      // Advance time past expiry - should not throw errors
      vi.advanceTimersByTime(2000);
      // No assertion needed - just verifying no errors
    });

    it('clears file change callbacks on dispose', () => {
      const callback = vi.fn();
      service.onFileChanged(callback);

      service.dispose();

      // Try to trigger after dispose
      const changeHandler = mockWatchers[1].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/output/test-deck/slides/slide-1.html'));
      vi.advanceTimersByTime(300);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // =====================================================
  // cv-4-1: Tests for onBrandAssetsChanged()
  // =====================================================

  describe('onBrandAssetsChanged (cv-4-1)', () => {
    it('fires callback when brand asset file changes', () => {
      const callback = vi.fn();
      service.onBrandAssetsChanged(callback);

      // Simulate brand asset change via first watcher (.slide-builder)
      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/brand-assets/icons/logo.svg'));

      // Before 200ms debounce
      expect(callback).not.toHaveBeenCalled();

      // After 200ms debounce
      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not fire for non-brand file changes', () => {
      const callback = vi.fn();
      service.onBrandAssetsChanged(callback);

      // Simulate non-brand change
      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/decks/plan.yaml'));

      vi.advanceTimersByTime(200);
      expect(callback).not.toHaveBeenCalled();
    });

    it('debounces rapid brand asset changes (200ms)', () => {
      const callback = vi.fn();
      service.onBrandAssetsChanged(callback);

      const createHandler = mockWatchers[0].onDidCreate.mock.calls[0][0];

      createHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/brand-assets/icons/icon1.svg'));
      vi.advanceTimersByTime(100);
      createHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/brand-assets/icons/icon2.svg'));
      vi.advanceTimersByTime(100);
      // Not fired yet — debounce resets
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('fires on brand asset deletion', () => {
      const callback = vi.fn();
      service.onBrandAssetsChanged(callback);

      const deleteHandler = mockWatchers[0].onDidDelete.mock.calls[0][0];
      deleteHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/brand-assets/logos/old-logo.png'));

      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('returns disposable that unregisters callback', () => {
      const callback = vi.fn();
      const disposable = service.onBrandAssetsChanged(callback);
      disposable.dispose();

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/brand-assets/icons/logo.svg'));
      vi.advanceTimersByTime(200);

      expect(callback).not.toHaveBeenCalled();
    });

    it('notifies multiple registered brand asset callbacks', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      service.onBrandAssetsChanged(cb1);
      service.onBrandAssetsChanged(cb2);

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/brand-assets/images/photo.jpg'));
      vi.advanceTimersByTime(200);

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    it('clears brand assets timer and callbacks on dispose', () => {
      const callback = vi.fn();
      service.onBrandAssetsChanged(callback);

      // Trigger a brand change to start timer
      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/brand-assets/icons/logo.svg'));

      // Dispose before timer fires
      service.dispose();

      vi.advanceTimersByTime(200);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  // =====================================================
  // tm-3-2: Tests for onTemplateFilesChanged() — deck template file watching
  // =====================================================

  describe('onTemplateFilesChanged (tm-3-2)', () => {
    it('fires callback when deck template file changes (AC-1, AC-2)', () => {
      const callback = vi.fn();
      service.onTemplateFilesChanged(callback);

      // Simulate deck template file change via first watcher (.slide-builder)
      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/my-template/slides/slide-1.html'));

      // Before 300ms debounce
      expect(callback).not.toHaveBeenCalled();

      // After 300ms debounce
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('fires callback on deck template file creation (AC-1)', () => {
      const callback = vi.fn();
      service.onTemplateFilesChanged(callback);

      const createHandler = mockWatchers[0].onDidCreate.mock.calls[0][0];
      createHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/new-template/slides/slide-1.html'));

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('fires callback on deck template file deletion (AC-1)', () => {
      const callback = vi.fn();
      service.onTemplateFilesChanged(callback);

      const deleteHandler = mockWatchers[0].onDidDelete.mock.calls[0][0];
      deleteHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/old-template/deck-templates.json'));

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not fire for non-deck-template file changes', () => {
      const callback = vi.fn();
      service.onTemplateFilesChanged(callback);

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      // .slide-builder file outside deck-templates directory
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/brand-assets/logo.svg'));

      vi.advanceTimersByTime(300);
      expect(callback).not.toHaveBeenCalled();
    });

    it('debounces rapid deck template changes — 5 events coalesce to 1 callback (AC-3)', () => {
      const callback = vi.fn();
      service.onTemplateFilesChanged(callback);

      const createHandler = mockWatchers[0].onDidCreate.mock.calls[0][0];

      // Simulate 5 rapid file writes within 300ms (Claude Code creating slides)
      createHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-1.html'));
      vi.advanceTimersByTime(50);
      createHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-2.html'));
      vi.advanceTimersByTime(50);
      createHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-3.html'));
      vi.advanceTimersByTime(50);
      createHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-4.html'));
      vi.advanceTimersByTime(50);
      createHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-5.html'));

      // Not yet fired (200ms elapsed, but debounce resets on each event)
      expect(callback).not.toHaveBeenCalled();

      // After 300ms from last event
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('returns disposable that unregisters callback', () => {
      const callback = vi.fn();
      const disposable = service.onTemplateFilesChanged(callback);
      disposable.dispose();

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-1.html'));
      vi.advanceTimersByTime(300);

      expect(callback).not.toHaveBeenCalled();
    });

    it('notifies multiple registered callbacks', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      service.onTemplateFilesChanged(cb1);
      service.onTemplateFilesChanged(cb2);

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-1.html'));
      vi.advanceTimersByTime(300);

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  // =====================================================
  // tm-3-2: Tests for suppressNextDeckTemplateRefresh()
  // =====================================================

  describe('suppressNextDeckTemplateRefresh (tm-3-2)', () => {
    it('suppresses next callback invocation (AC-4)', () => {
      const callback = vi.fn();
      service.onTemplateFilesChanged(callback);

      // Suppress the next refresh
      service.suppressNextDeckTemplateRefresh();

      // Trigger file change
      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-1.html'));

      vi.advanceTimersByTime(300);
      // Should be suppressed
      expect(callback).not.toHaveBeenCalled();
    });

    it('only suppresses one callback, then allows subsequent ones (AC-4)', () => {
      const callback = vi.fn();
      service.onTemplateFilesChanged(callback);

      // Suppress the next refresh
      service.suppressNextDeckTemplateRefresh();

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];

      // First change — suppressed
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-1.html'));
      vi.advanceTimersByTime(300);
      expect(callback).not.toHaveBeenCalled();

      // Second change — should fire normally
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-2.html'));
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('logs suppression message', () => {
      service.onTemplateFilesChanged(vi.fn());
      service.suppressNextDeckTemplateRefresh();

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-1.html'));
      vi.advanceTimersByTime(300);

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[FileWatcherService] Deck template refresh suppressed (self-triggered)'
      );
    });
  });

  // =====================================================
  // bt-2-4: Tests for onThemeChanged() — theme.json file watching
  // =====================================================

  describe('onThemeChanged (bt-2-4)', () => {
    it('fires callback when theme.json changes (AC-7, AC-1)', () => {
      const callback = vi.fn();
      service.onThemeChanged(callback);

      // Simulate theme.json change via first watcher (.slide-builder)
      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));

      // Before 300ms debounce
      expect(callback).not.toHaveBeenCalled();

      // After 300ms debounce
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('fires callback on theme.json creation', () => {
      const callback = vi.fn();
      service.onThemeChanged(callback);

      const createHandler = mockWatchers[0].onDidCreate.mock.calls[0][0];
      createHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('fires callback on theme.json deletion', () => {
      const callback = vi.fn();
      service.onThemeChanged(callback);

      const deleteHandler = mockWatchers[0].onDidDelete.mock.calls[0][0];
      deleteHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not fire for non-theme.json file changes', () => {
      const callback = vi.fn();
      service.onThemeChanged(callback);

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/brand-assets/logo.svg'));

      vi.advanceTimersByTime(300);
      expect(callback).not.toHaveBeenCalled();
    });

    it('debounces rapid theme.json changes (300ms)', () => {
      const callback = vi.fn();
      service.onThemeChanged(callback);

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];

      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));
      vi.advanceTimersByTime(100);
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));
      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('returns disposable that unregisters callback (AC-7)', () => {
      const callback = vi.fn();
      const disposable = service.onThemeChanged(callback);
      disposable.dispose();

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));
      vi.advanceTimersByTime(300);

      expect(callback).not.toHaveBeenCalled();
    });

    it('notifies multiple registered callbacks', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      service.onThemeChanged(cb1);
      service.onThemeChanged(cb2);

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));
      vi.advanceTimersByTime(300);

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  // =====================================================
  // bt-2-4: Tests for theme-editor key suppression
  // =====================================================

  describe('suppressNextRefresh with theme-editor key (bt-2-4)', () => {
    it('suppresses theme callback when theme-editor key is suppressed (AC-3)', () => {
      const callback = vi.fn();
      service.onThemeChanged(callback);

      // Suppress with theme-editor key
      service.suppressNextRefresh('theme-editor');

      // Trigger theme.json change
      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));

      vi.advanceTimersByTime(300);
      // Should be suppressed
      expect(callback).not.toHaveBeenCalled();
    });

    it('auto-expires after 1000ms and allows callback (AC-3 safety net)', () => {
      const callback = vi.fn();
      service.onThemeChanged(callback);

      // Suppress with theme-editor key
      service.suppressNextRefresh('theme-editor');

      // Wait for auto-expiry (1000ms)
      vi.advanceTimersByTime(1000);

      // Now trigger theme.json change -- should NOT be suppressed anymore
      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('only suppresses one callback, then allows subsequent ones', () => {
      const callback = vi.fn();
      service.onThemeChanged(callback);

      service.suppressNextRefresh('theme-editor');

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];

      // First change -- suppressed
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));
      vi.advanceTimersByTime(300);
      expect(callback).not.toHaveBeenCalled();

      // Second change -- should fire normally
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // =====================================================
  // bt-2-4: Tests for theme change dispose cleanup
  // =====================================================

  describe('dispose cleanup for theme change infrastructure (bt-2-4)', () => {
    it('clears theme debounce timer on dispose', () => {
      const callback = vi.fn();
      service.onThemeChanged(callback);

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));

      service.dispose();

      vi.advanceTimersByTime(300);
      expect(callback).not.toHaveBeenCalled();
    });

    it('clears theme change callbacks on dispose', () => {
      const callback = vi.fn();
      service.onThemeChanged(callback);

      service.dispose();

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/theme.json'));
      vi.advanceTimersByTime(300);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // =====================================================
  // tm-3-2: Tests for dispose cleanup of deck template infrastructure
  // =====================================================

  describe('dispose cleanup for deck template infrastructure (tm-3-2)', () => {
    it('clears deck template debounce timer on dispose', () => {
      const callback = vi.fn();
      service.onTemplateFilesChanged(callback);

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-1.html'));

      // Dispose before timer fires
      service.dispose();

      vi.advanceTimersByTime(300);
      expect(callback).not.toHaveBeenCalled();
    });

    it('clears deck template callbacks on dispose', () => {
      const callback = vi.fn();
      service.onTemplateFilesChanged(callback);

      service.dispose();

      const changeHandler = mockWatchers[0].onDidChange.mock.calls[0][0];
      changeHandler(Uri.file('/mock/workspace/.slide-builder/config/catalog/deck-templates/tpl/slides/slide-1.html'));
      vi.advanceTimersByTime(300);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
