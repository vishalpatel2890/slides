/**
 * Tests for AI edit polling-based file change detection in the V2 viewer.
 * When "Edit with AI" triggers, the message handler polls the slide file's mtime
 * and sends v2-slide-updated when a change is detected.
 *
 * Story Reference: story-ai-edit-refresh-1 AC #1 through AC #6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createViewerV2MessageHandler } from '../../src/extension/viewer-v2-message-handler';

// Track sendToClaudeCode calls
const mockSendToClaudeCode = vi.fn();

// Mock claude-code-integration
vi.mock('../../src/extension/claude-code-integration', () => ({
  sendToClaudeCode: (...args: any[]) => mockSendToClaudeCode(...args),
}));

// Mock extension.ts configService
vi.mock('../../src/extension/extension', () => ({
  configService: {
    readSettings: vi.fn().mockReturnValue({
      claudeCode: { launchMode: 'extension', position: 'sidebar' },
    }),
  },
}));

// Mock SlideViewerV2Panel
vi.mock('../../src/extension/SlideViewerV2Panel', () => ({
  SlideViewerV2Panel: {
    flushPendingMessages: vi.fn().mockReturnValue([]),
  },
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
}));

// Mock puppeteer-capture
vi.mock('../../src/extension/puppeteer-capture', () => ({
  captureSlide: vi.fn(),
  captureSlideAsPng: vi.fn(),
}));

// Mock VS Code API
vi.mock('vscode', () => ({
  window: {
    createTerminal: vi.fn(),
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
  },
  commands: {
    getCommands: vi.fn().mockResolvedValue([]),
    executeCommand: vi.fn().mockResolvedValue(undefined),
  },
  env: {
    clipboard: {
      writeText: vi.fn(),
    },
  },
  workspace: {
    fs: {
      stat: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      readDirectory: vi.fn(),
    },
    getConfiguration: vi.fn(),
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3,
  },
  Uri: {
    file: (p: string) => ({ fsPath: p, toString: () => p }),
    joinPath: (base: any, ...segments: string[]) => {
      const joined = [base.fsPath, ...segments].join('/');
      return { fsPath: joined, toString: () => joined };
    },
  },
  FileType: {
    File: 1,
    Directory: 2,
  },
}));

import { workspace } from 'vscode';
import { configService } from '../../src/extension/extension';

function createMockOutputChannel() {
  return {
    appendLine: vi.fn(),
    append: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
    name: 'Test Output',
  } as any;
}

function createMockWebview() {
  let messageHandler: ((msg: any) => Promise<void>) | null = null;
  return {
    onDidReceiveMessage: vi.fn().mockImplementation((handler: any) => {
      messageHandler = handler;
      return { dispose: vi.fn() };
    }),
    postMessage: vi.fn().mockResolvedValue(true),
    _simulateMessage: async (msg: any) => {
      if (messageHandler) {
        await messageHandler(msg);
      }
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
    getViewerContent: vi.fn(),
    getDeckDetail: vi.fn(),
    getDeckPath: vi.fn(),
    dispose: vi.fn(),
  } as any;
}

describe('AI Edit Polling (story-ai-edit-refresh-1)', () => {
  let mockWebview: ReturnType<typeof createMockWebview>;
  let mockOutputChannel: ReturnType<typeof createMockOutputChannel>;
  let mockDataService: ReturnType<typeof createMockDataService>;
  const testDeckId = 'my-presentation';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockWebview = createMockWebview();
    mockOutputChannel = createMockOutputChannel();
    mockDataService = createMockDataService();
    mockSendToClaudeCode.mockResolvedValue(undefined);

    // Re-establish configService mock after clearAllMocks
    vi.mocked(configService.readSettings).mockReturnValue({
      claudeCode: { launchMode: 'extension', position: 'sidebar' },
    } as any);

    // Default: stat returns initial mtime, readFile returns slide HTML
    vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000, ctime: 0, size: 100, type: 1 });
    vi.mocked(workspace.fs.readFile).mockResolvedValue(
      new TextEncoder().encode('<div>Updated slide</div>')
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==========================================================
  // AC #1: Auto-update within ~1-2s of file write
  // ==========================================================

  describe('AC #1: Polling detects file change and sends v2-slide-updated', () => {
    it('should start polling after successful sendToClaudeCode and detect mtime change', async () => {
      // Initial stat: mtime = 1000
      let statCallCount = 0;
      vi.mocked(workspace.fs.stat).mockImplementation(async () => {
        statCallCount++;
        // First call (initial mtime recording) and second call (first poll) return same mtime
        // Third call (second poll) returns updated mtime
        if (statCallCount <= 2) {
          return { mtime: 1000, ctime: 0, size: 100, type: 1 };
        }
        return { mtime: 2000, ctime: 0, size: 200, type: 1 };
      });

      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel
      );

      // Trigger edit with AI
      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'make it blue',
        slideNumber: 3,
      });

      // First poll (1s) — no change yet
      await vi.advanceTimersByTimeAsync(1000);

      // v2-slide-updated should NOT have been sent yet (same mtime)
      const slideUpdatedCalls = mockWebview.postMessage.mock.calls.filter(
        (call: any) => call[0]?.type === 'v2-slide-updated'
      );
      expect(slideUpdatedCalls).toHaveLength(0);

      // Second poll (2s) — mtime changed
      await vi.advanceTimersByTimeAsync(1000);

      // Now v2-slide-updated should have been sent
      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-slide-updated',
        slideNumber: 3,
        html: '<div>Updated slide</div>',
      });
    });
  });

  // ==========================================================
  // AC #3: Polling stops after detection
  // ==========================================================

  describe('AC #3: Polling clears interval and timeout after detection', () => {
    it('should not continue polling after detecting a change', async () => {
      let statCallCount = 0;
      vi.mocked(workspace.fs.stat).mockImplementation(async () => {
        statCallCount++;
        // First call: initial mtime; second call: changed mtime
        if (statCallCount <= 1) {
          return { mtime: 1000, ctime: 0, size: 100, type: 1 };
        }
        return { mtime: 2000, ctime: 0, size: 200, type: 1 };
      });

      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel
      );

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'change colors',
        slideNumber: 5,
      });

      // First poll detects change
      await vi.advanceTimersByTimeAsync(1000);

      // Record stat call count after detection
      const callCountAfterDetection = statCallCount;

      // Advance more time — should NOT trigger additional stat calls
      await vi.advanceTimersByTimeAsync(5000);

      expect(statCallCount).toBe(callCountAfterDetection);
    });
  });

  // ==========================================================
  // AC #4: Polling stops after 120s timeout
  // ==========================================================

  describe('AC #4: Safety timeout clears polling after 120s', () => {
    it('should stop polling after 120 seconds without detecting a change', async () => {
      // Stat always returns same mtime (no change)
      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000, ctime: 0, size: 100, type: 1 });

      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel
      );

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'update layout',
        slideNumber: 1,
      });

      // Advance to just before timeout
      await vi.advanceTimersByTimeAsync(119_000);

      // Stat should still be called (polling active)
      const callsBefore = vi.mocked(workspace.fs.stat).mock.calls.length;
      expect(callsBefore).toBeGreaterThan(0);

      // Advance past timeout (120s)
      await vi.advanceTimersByTimeAsync(2000);

      // Record stat call count at timeout
      const callsAtTimeout = vi.mocked(workspace.fs.stat).mock.calls.length;

      // Advance more — polling should have stopped
      await vi.advanceTimersByTimeAsync(5000);
      const callsAfterTimeout = vi.mocked(workspace.fs.stat).mock.calls.length;

      expect(callsAfterTimeout).toBe(callsAtTimeout);

      // Verify timeout log message
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('timed out after 120s')
      );
    });
  });

  // ==========================================================
  // AC #5: Cleanup on panel dispose
  // ==========================================================

  describe('AC #5: Polling cleanup on panel dispose', () => {
    it('should clean up polling timers when handler is disposed', async () => {
      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000, ctime: 0, size: 100, type: 1 });

      const handler = createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel
      );

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'fix styling',
        slideNumber: 2,
      });

      // Verify polling started (stat called for initial mtime)
      const initialCalls = vi.mocked(workspace.fs.stat).mock.calls.length;
      expect(initialCalls).toBeGreaterThan(0);

      // Dispose the handler
      handler.dispose();

      // Record stat call count
      const callsAtDispose = vi.mocked(workspace.fs.stat).mock.calls.length;

      // Advance time — no more polling should occur
      await vi.advanceTimersByTimeAsync(5000);
      const callsAfterDispose = vi.mocked(workspace.fs.stat).mock.calls.length;

      expect(callsAfterDispose).toBe(callsAtDispose);
    });
  });

  // ==========================================================
  // AC #6: New edit clears previous polling
  // ==========================================================

  describe('AC #6: New edit clears previous polling for same slide', () => {
    it('should clear previous polling when a new edit is initiated for the same slide', async () => {
      // Always return same mtime (no change detected) to keep polling active
      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000, ctime: 0, size: 100, type: 1 });

      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel
      );

      // First edit
      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'first edit',
        slideNumber: 3,
      });

      // Let some polls happen
      await vi.advanceTimersByTimeAsync(3000);

      // Second edit on same slide — should clear first polling
      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'second edit',
        slideNumber: 3,
      });

      // Verify log that previous polling was cleared
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('cleared previous polling for slide 3')
      );
    });
  });

  // ==========================================================
  // Polling resilience: file not found during polling
  // ==========================================================

  describe('Polling resilience', () => {
    it('should continue polling when stat throws (file not found)', async () => {
      let statCallCount = 0;
      vi.mocked(workspace.fs.stat).mockImplementation(async () => {
        statCallCount++;
        // First call (initial mtime) succeeds with mtime=1000
        if (statCallCount === 1) {
          return { mtime: 1000, ctime: 0, size: 100, type: 1 };
        }
        // Next 3 poll calls throw (file temporarily unavailable)
        if (statCallCount <= 4) {
          throw new Error('FileNotFound');
        }
        // Fifth call: file changed
        return { mtime: 2000, ctime: 0, size: 200, type: 1 };
      });

      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel
      );

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'create slide',
        slideNumber: 1,
      });

      // First 3 polls throw (file not found) — polling continues
      await vi.advanceTimersByTimeAsync(3000);

      // v2-slide-updated should NOT have been sent yet
      const slideUpdatedCalls = mockWebview.postMessage.mock.calls.filter(
        (call: any) => call[0]?.type === 'v2-slide-updated'
      );
      expect(slideUpdatedCalls).toHaveLength(0);

      // Fourth poll succeeds with changed mtime
      await vi.advanceTimersByTimeAsync(1000);

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-slide-updated',
        slideNumber: 1,
        html: '<div>Updated slide</div>',
      });
    });
  });
});
