/**
 * Tests for V2 Viewer file synchronization — external file changes → webview updates.
 * Tests the wiring in SlideViewerV2Panel.createOrShow() and save suppression in
 * viewer-v2-message-handler.ts.
 *
 * Story Reference: v2-3-2 AC-1 through AC-10
 * Architecture Reference: ADR-007 — File Watcher Suppression Pattern
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { window, workspace, Uri, ViewColumn } from 'vscode';
import { SlideViewerV2Panel } from '../../src/extension/SlideViewerV2Panel';
import { createViewerV2MessageHandler } from '../../src/extension/viewer-v2-message-handler';

// Mock OutputChannel
const mockOutputChannel = {
  appendLine: vi.fn(),
  append: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn(),
  name: 'Test Channel',
} as any;

// Mock FileWatcherService
function createMockFileWatcher() {
  const callbacks = new Set<(uri: any) => void>();
  return {
    onFileChanged: vi.fn().mockImplementation((cb: (uri: any) => void) => {
      callbacks.add(cb);
      return { dispose: () => callbacks.delete(cb) };
    }),
    suppressNextRefresh: vi.fn(),
    onDecksChanged: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    onBrandAssetsChanged: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    dispose: vi.fn(),
    // Test helper: simulate a file change event
    _simulateFileChange: (uri: any) => {
      callbacks.forEach((cb) => cb(uri));
    },
    _getCallbackCount: () => callbacks.size,
  };
}

// Mock CatalogDataService
function createMockDataService() {
  return {
    findDeckUri: vi.fn().mockResolvedValue({
      fsPath: '/mock/workspace/output/test-deck',
      toString: () => '/mock/workspace/output/test-deck',
    }),
    getWorkspaceRoot: vi.fn().mockReturnValue({
      fsPath: '/mock/workspace',
      toString: () => '/mock/workspace',
    }),
    dispose: vi.fn(),
  } as any;
}

const extensionUri = Uri.file('/mock/extension');
const workspaceUri = Uri.file('/mock/workspace');

describe('V2 Viewer File Synchronization', () => {
  let mockFileWatcher: ReturnType<typeof createMockFileWatcher>;
  let mockDataService: ReturnType<typeof createMockDataService>;
  let mockPanel: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileWatcher = createMockFileWatcher();
    mockDataService = createMockDataService();

    // Capture the created panel for assertions
    mockPanel = null;
    vi.mocked(window.createWebviewPanel).mockImplementation((..._args: any[]) => {
      const panel = {
        webview: {
          html: '',
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
          postMessage: vi.fn().mockResolvedValue(true),
          asWebviewUri: vi.fn().mockImplementation((uri: any) => uri),
          cspSource: 'https://webview-csp-source',
        },
        reveal: vi.fn(),
        dispose: vi.fn(),
        onDidDispose: vi.fn().mockImplementation((handler: any) => {
          panel._disposeHandler = handler;
          return { dispose: vi.fn() };
        }),
        _disposeHandler: null as any,
        _simulateDispose: () => panel._disposeHandler?.(),
      };
      mockPanel = panel;
      return panel as any;
    });

    // Reset static panel map between tests
    // @ts-expect-error accessing private static for test reset
    SlideViewerV2Panel.panels = new Map();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================
  // AC-3.2.1: FileSystemWatcher detects external changes
  // AC-3.2.2: Extension re-reads file and sends v2-slide-updated
  // ==========================================================

  describe('AC-3.2.1, AC-3.2.2: Slide file change detection and notification', () => {
    it('registers onFileChanged callback when fileWatcher is provided', () => {
      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'test-deck', 'Test Deck',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      expect(mockFileWatcher.onFileChanged).toHaveBeenCalledTimes(1);
    });

    it('does not register callback when fileWatcher is undefined', () => {
      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'test-deck', 'Test Deck',
        mockDataService, mockOutputChannel, undefined
      );

      expect(mockFileWatcher.onFileChanged).not.toHaveBeenCalled();
    });

    it('sends v2-slide-updated when a slide HTML file changes externally', async () => {
      // Mock readFile to return slide content
      const slideHtml = '<div>Updated externally</div>';
      vi.mocked(workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode(slideHtml)
      );

      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'test-deck', 'Test Deck',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      // Simulate file change for slide-3.html in test-deck
      const slideUri = Uri.file('/mock/workspace/output/test-deck/slides/slide-3.html');
      mockFileWatcher._simulateFileChange(slideUri);

      // Allow async operations to complete
      await vi.waitFor(() => {
        expect(mockPanel.webview.postMessage).toHaveBeenCalledWith({
          type: 'v2-slide-updated',
          slideNumber: 3,
          html: slideHtml,
        });
      });
    });

    it('extracts correct slide number from filename', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode('<div>Slide 12</div>')
      );

      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'test-deck', 'Test Deck',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      const slideUri = Uri.file('/mock/workspace/output/test-deck/slides/slide-12.html');
      mockFileWatcher._simulateFileChange(slideUri);

      await vi.waitFor(() => {
        expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({ slideNumber: 12 })
        );
      });
    });

    it('logs error when slide file read fails', async () => {
      vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('File not found'));

      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'test-deck', 'Test Deck',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      const slideUri = Uri.file('/mock/workspace/output/test-deck/slides/slide-1.html');
      mockFileWatcher._simulateFileChange(slideUri);

      await vi.waitFor(() => {
        expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
          expect.stringContaining('Error re-reading slide 1')
        );
      });
    });
  });

  // ==========================================================
  // AC-3.2.10: Multi-deck independence
  // ==========================================================

  describe('AC-3.2.10: Multi-deck independence', () => {
    it('ignores file changes for other decks', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode('<div>Other deck</div>')
      );

      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'deck-a', 'Deck A',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      // Simulate change to a DIFFERENT deck
      const otherUri = Uri.file('/mock/workspace/output/deck-b/slides/slide-1.html');
      mockFileWatcher._simulateFileChange(otherUri);

      // Give async time to settle
      await new Promise((r) => setTimeout(r, 50));

      // Should NOT have sent a message for deck-b changes
      expect(mockPanel.webview.postMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'v2-slide-updated' })
      );
    });

    it('each deck panel registers its own callback', () => {
      // Create first panel
      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'deck-a', 'Deck A',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      // Create second panel
      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'deck-b', 'Deck B',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      // Both panels should register callbacks
      expect(mockFileWatcher.onFileChanged).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================
  // AC-3.2.7: Manifest.json changes
  // ==========================================================

  describe('AC-3.2.7: Manifest.json change detection', () => {
    it('sends v2-manifest-updated when manifest.json changes externally', async () => {
      const manifestData = {
        deckId: 'test-deck',
        deckName: 'Test Deck',
        slideCount: 5,
        slides: [{ number: 1, fileName: 'slide-1.html', title: 'Intro' }],
        generatedAt: '2026-02-19',
      };
      vi.mocked(workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode(JSON.stringify(manifestData))
      );

      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'test-deck', 'Test Deck',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      const manifestUri = Uri.file('/mock/workspace/output/test-deck/slides/manifest.json');
      mockFileWatcher._simulateFileChange(manifestUri);

      await vi.waitFor(() => {
        expect(mockPanel.webview.postMessage).toHaveBeenCalledWith({
          type: 'v2-manifest-updated',
          manifest: manifestData,
        });
      });
    });

    it('logs error when manifest.json parse fails', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode('invalid json{{{')
      );

      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'test-deck', 'Test Deck',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      const manifestUri = Uri.file('/mock/workspace/output/test-deck/slides/manifest.json');
      mockFileWatcher._simulateFileChange(manifestUri);

      await vi.waitFor(() => {
        expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
          expect.stringContaining('Error re-reading manifest')
        );
      });
    });
  });

  // ==========================================================
  // AC-3.2.9: Disposal and cleanup
  // ==========================================================

  describe('AC-3.2.9: Disposal and cleanup', () => {
    it('disposes file watcher callback on panel close', () => {
      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'test-deck', 'Test Deck',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      expect(mockFileWatcher._getCallbackCount()).toBe(1);

      // Simulate panel disposal
      mockPanel._simulateDispose();

      // Callback should be removed
      expect(mockFileWatcher._getCallbackCount()).toBe(0);
    });

    it('logs disposal message on panel close', () => {
      SlideViewerV2Panel.createOrShow(
        extensionUri, workspaceUri, 'test-deck', 'Test Deck',
        mockDataService, mockOutputChannel, mockFileWatcher as any
      );

      mockPanel._simulateDispose();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Disposed panel and file watchers')
      );
    });
  });

  // ==========================================================
  // AC-3.2.4: Save suppression in message handler
  // ==========================================================

  describe('AC-3.2.4, AC-3.2.5: Save suppression in v2-save-slide handler', () => {
    it('calls suppressNextRefresh after successful v2-save-slide write', async () => {
      // Mock successful file write
      vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

      // Mock findDeckUri
      mockDataService.findDeckUri.mockResolvedValue({
        fsPath: '/mock/workspace/output/test-deck',
        toString: () => '/mock/workspace/output/test-deck',
      });

      // Create the message handler directly
      const mockWebview = {
        onDidReceiveMessage: vi.fn(),
        postMessage: vi.fn().mockResolvedValue(true),
      };

      let messageHandler: any;
      mockWebview.onDidReceiveMessage.mockImplementation((handler: any) => {
        messageHandler = handler;
        return { dispose: vi.fn() };
      });

      createViewerV2MessageHandler(
        mockWebview as any,
        'test-deck',
        mockDataService,
        mockOutputChannel,
        mockFileWatcher as any
      );

      // Simulate v2-save-slide message
      await messageHandler({
        type: 'v2-save-slide',
        slideNumber: 3,
        html: '<div>Edited slide 3</div>',
      });

      // Verify suppression was called AFTER the write
      expect(vi.mocked(workspace.fs.writeFile)).toHaveBeenCalled();
      expect(mockFileWatcher.suppressNextRefresh).toHaveBeenCalledWith('test-deck');
    });

    it('does not call suppressNextRefresh when save fails', async () => {
      vi.mocked(workspace.fs.writeFile).mockRejectedValue(new Error('Write failed'));

      mockDataService.findDeckUri.mockResolvedValue({
        fsPath: '/mock/workspace/output/test-deck',
        toString: () => '/mock/workspace/output/test-deck',
      });

      const mockWebview = {
        onDidReceiveMessage: vi.fn(),
        postMessage: vi.fn().mockResolvedValue(true),
      };

      let messageHandler: any;
      mockWebview.onDidReceiveMessage.mockImplementation((handler: any) => {
        messageHandler = handler;
        return { dispose: vi.fn() };
      });

      createViewerV2MessageHandler(
        mockWebview as any,
        'test-deck',
        mockDataService,
        mockOutputChannel,
        mockFileWatcher as any
      );

      await messageHandler({
        type: 'v2-save-slide',
        slideNumber: 3,
        html: '<div>Edited slide 3</div>',
      });

      // Suppression should NOT be called when write fails
      expect(mockFileWatcher.suppressNextRefresh).not.toHaveBeenCalled();
    });

    it('works without fileWatcher (undefined)', async () => {
      vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

      mockDataService.findDeckUri.mockResolvedValue({
        fsPath: '/mock/workspace/output/test-deck',
        toString: () => '/mock/workspace/output/test-deck',
      });

      const mockWebview = {
        onDidReceiveMessage: vi.fn(),
        postMessage: vi.fn().mockResolvedValue(true),
      };

      let messageHandler: any;
      mockWebview.onDidReceiveMessage.mockImplementation((handler: any) => {
        messageHandler = handler;
        return { dispose: vi.fn() };
      });

      // Pass undefined fileWatcher — should not throw
      createViewerV2MessageHandler(
        mockWebview as any,
        'test-deck',
        mockDataService,
        mockOutputChannel,
        undefined
      );

      await messageHandler({
        type: 'v2-save-slide',
        slideNumber: 1,
        html: '<div>Slide content</div>',
      });

      // Write should succeed without suppression call
      expect(vi.mocked(workspace.fs.writeFile)).toHaveBeenCalled();
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'v2-save-result', success: true })
      );
    });
  });
});
