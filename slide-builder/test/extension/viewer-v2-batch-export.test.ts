/**
 * Tests for V2 batch PNG export — message handler behavior.
 * Story Reference: v2-5-3 AC-1 through AC-8
 *
 * Tests the extension host side of batch export:
 * - Folder picker initiation (__batch_init__)
 * - Batch file writes to selected folder
 * - v2-batch-complete clearing batchExportFolder state
 * - Cancel flow cleanup
 * - Subsequent single export after batch (no stale folder)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { window, workspace, Uri } from 'vscode';
import { createViewerV2MessageHandler } from '../../src/extension/viewer-v2-message-handler';

// Mock puppeteer-capture module
vi.mock('../../src/extension/puppeteer-capture', () => ({
  captureSlide: vi.fn().mockResolvedValue(Buffer.from('mock-png-data')),
  captureSlideAsPng: vi.fn().mockResolvedValue(Buffer.from('mock-png-data')),
}));

// Mock claude-code-integration
vi.mock('../../src/extension/claude-code-integration', () => ({
  sendToClaudeCode: vi.fn().mockResolvedValue(undefined),
}));

// Mock CatalogViewProvider
vi.mock('../../src/extension/CatalogViewProvider', () => ({
  CatalogViewProvider: {
    postMessage: vi.fn(),
  },
}));

// Mock yaml-document
vi.mock('../../src/extension/yaml-document', () => ({
  parseYaml: vi.fn(),
  getField: vi.fn(),
  serializeYaml: vi.fn(),
  renumberSlides: vi.fn(),
  isSeq: vi.fn(),
}));

const mockOutputChannel = {
  appendLine: vi.fn(),
} as any;

function createMockWebview() {
  let messageHandler: ((msg: any) => Promise<void>) | null = null;
  return {
    onDidReceiveMessage: vi.fn().mockImplementation((handler: any) => {
      messageHandler = handler;
      return { dispose: vi.fn() };
    }),
    postMessage: vi.fn().mockResolvedValue(true),
    _simulateMessage: async (msg: any) => {
      if (messageHandler) await messageHandler(msg);
    },
  };
}

function createMockDataService() {
  return {
    findDeckUri: vi.fn().mockResolvedValue({
      fsPath: '/workspace/output/test-deck',
      toString: () => '/workspace/output/test-deck',
    }),
    getWorkspaceRoot: vi.fn().mockReturnValue({
      fsPath: '/workspace',
      toString: () => '/workspace',
    }),
    dispose: vi.fn(),
  } as any;
}

describe('V2 Batch PNG Export (v2-5-3)', () => {
  let mockWebview: ReturnType<typeof createMockWebview>;
  let mockDataService: ReturnType<typeof createMockDataService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebview = createMockWebview();
    mockDataService = createMockDataService();

    createViewerV2MessageHandler(
      mockWebview as any,
      'test-deck',
      mockDataService,
      mockOutputChannel
    );
  });

  describe('Batch init — folder picker (AC-1)', () => {
    it('should show folder picker on __batch_init__ message', async () => {
      const mockFolderUri = {
        fsPath: '/users/test/exports',
        toString: () => '/users/test/exports',
      };
      (window as any).showOpenDialog = vi.fn().mockResolvedValue([mockFolderUri]);

      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: '__batch_init__',
        fileName: 'batch-5',
      });

      expect((window as any).showOpenDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          canSelectFolders: true,
          canSelectFiles: false,
          canSelectMany: false,
        })
      );
      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-export-folder-ready',
      });
    });
  });

  describe('Folder picker cancel (AC-7)', () => {
    it('should send v2-export-cancelled when user cancels folder picker', async () => {
      (window as any).showOpenDialog = vi.fn().mockResolvedValue(undefined);

      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: '__batch_init__',
        fileName: 'batch-5',
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-export-cancelled',
      });
    });

    it('should send v2-export-cancelled when folder array is empty', async () => {
      (window as any).showOpenDialog = vi.fn().mockResolvedValue([]);

      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: '__batch_init__',
        fileName: 'batch-3',
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-export-cancelled',
      });
    });
  });

  describe('Batch file writes (AC-4)', () => {
    it('should write PNG files to selected batch folder', async () => {
      const mockFolderUri = {
        fsPath: '/users/test/exports',
        toString: () => '/users/test/exports',
      };
      (window as any).showOpenDialog = vi.fn().mockResolvedValue([mockFolderUri]);

      // Step 1: Init batch (select folder)
      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: '__batch_init__',
        fileName: 'batch-3',
      });

      // Step 2: Send a batch file
      const pngData = 'data:image/png;base64,iVBORw0KGgo=';
      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: pngData,
        fileName: 'slide-1.png',
      });

      // Should write to batch folder, not show save dialog
      expect(Uri.joinPath).toHaveBeenCalledWith(mockFolderUri, 'slide-1.png');
      expect(workspace.fs.writeFile).toHaveBeenCalled();
      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-export-ready',
        format: 'png',
        fileName: 'slide-1.png',
      });
    });
  });

  describe('Batch complete — state cleanup (AC-5, AC-8)', () => {
    it('should clear batchExportFolder on v2-batch-complete', async () => {
      const mockFolderUri = {
        fsPath: '/users/test/exports',
        toString: () => '/users/test/exports',
      };
      (window as any).showOpenDialog = vi.fn().mockResolvedValue([mockFolderUri]);

      // Step 1: Init batch
      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: '__batch_init__',
        fileName: 'batch-3',
      });

      // Step 2: Signal batch complete
      await mockWebview._simulateMessage({
        type: 'v2-batch-complete',
        total: 3,
        errorCount: 0,
      });

      // Should send summary message
      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-export-ready',
        format: 'png',
        fileName: 'Exported 3 slides',
      });

      // Step 3: Next single PNG export should show save dialog (not write to batch folder)
      (window as any).showSaveDialog = vi.fn().mockResolvedValue(undefined);
      const singlePngData = 'data:image/png;base64,iVBORw0KGgo=';
      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: singlePngData,
        fileName: 'slide-1.png',
        deckId: 'test-deck',
      });

      // Should show save dialog since batchExportFolder was cleared
      expect((window as any).showSaveDialog).toHaveBeenCalled();
    });

    it('should report error count in summary when slides fail (AC-6)', async () => {
      const mockFolderUri = {
        fsPath: '/users/test/exports',
        toString: () => '/users/test/exports',
      };
      (window as any).showOpenDialog = vi.fn().mockResolvedValue([mockFolderUri]);

      // Init batch
      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: '__batch_init__',
        fileName: 'batch-10',
      });

      // Signal batch complete with errors
      await mockWebview._simulateMessage({
        type: 'v2-batch-complete',
        total: 10,
        errorCount: 2,
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-export-ready',
        format: 'png',
        fileName: 'Exported 8 of 10 slides (2 failed)',
      });
    });

    it('should log batch completion to output channel', async () => {
      await mockWebview._simulateMessage({
        type: 'v2-batch-complete',
        total: 5,
        errorCount: 0,
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Batch complete')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Exported 5 slides')
      );
    });
  });

  describe('Stale batch folder prevention (AC-5)', () => {
    it('should not use stale batch folder for single PNG after batch is done', async () => {
      const mockFolderUri = {
        fsPath: '/users/test/exports',
        toString: () => '/users/test/exports',
      };
      (window as any).showOpenDialog = vi.fn().mockResolvedValue([mockFolderUri]);
      (window as any).showSaveDialog = vi.fn().mockResolvedValue(undefined);

      // Batch init
      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: '__batch_init__',
        fileName: 'batch-2',
      });

      // Batch write
      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: 'data:image/png;base64,iVBORw0KGgo=',
        fileName: 'slide-1.png',
      });

      // Batch complete → clears batchExportFolder
      await mockWebview._simulateMessage({
        type: 'v2-batch-complete',
        total: 2,
        errorCount: 0,
      });

      vi.clearAllMocks();

      // Now single PNG export — should use save dialog
      await mockWebview._simulateMessage({
        type: 'v2-export-file',
        format: 'png',
        data: 'data:image/png;base64,iVBORw0KGgo=',
        fileName: 'slide-3.png',
        deckId: 'test-deck',
      });

      expect((window as any).showSaveDialog).toHaveBeenCalled();
    });
  });
});
