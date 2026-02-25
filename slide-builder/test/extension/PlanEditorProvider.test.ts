import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { PlanEditorProvider } from '../../src/extension/PlanEditorProvider';

// Type for mock output channel
interface MockOutputChannel {
  appendLine: ReturnType<typeof vi.fn>;
  show: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

describe('PlanEditorProvider', () => {
  let mockContext: {
    subscriptions: { dispose: () => void }[];
    extensionUri: { fsPath: string };
  };
  let mockOutputChannel: MockOutputChannel;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      subscriptions: [],
      extensionUri: { fsPath: '/mock/extension' },
    };

    mockOutputChannel = {
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    };
  });

  describe('constructor', () => {
    it('should create a PlanEditorProvider instance', () => {
      const provider = new PlanEditorProvider(
        mockContext as any,
        mockOutputChannel as any
      );

      expect(provider).toBeDefined();
    });
  });

  describe('viewType', () => {
    it('should have correct static viewType (AC-18.2.2)', () => {
      expect(PlanEditorProvider.viewType).toBe('slideBuilder.planEditor');
    });
  });

  describe('resolveCustomTextEditor', () => {
    it('should validate .slide-builder directory exists (AC-18.2.4)', async () => {
      const provider = new PlanEditorProvider(
        mockContext as any,
        mockOutputChannel as any
      );

      const mockDocument = {
        uri: { fsPath: '/mock/workspace/plan.yaml', toString: () => '/mock/workspace/plan.yaml' },
        getText: () => 'slides: []',
      };

      const mockWebviewPanel = {
        webview: {
          options: {},
          html: '',
          asWebviewUri: vi.fn((uri) => uri),
          cspSource: 'mock-csp',
          postMessage: vi.fn(),
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        },
        onDidDispose: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      };

      // Mock stat to succeed (directory exists)
      vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: 2 } as any);

      await provider.resolveCustomTextEditor(
        mockDocument as any,
        mockWebviewPanel as any,
        { isCancellationRequested: false } as any
      );

      // Should have checked for .slide-builder directory
      expect(vscode.workspace.fs.stat).toHaveBeenCalled();
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Validated Slide Builder project')
      );
    });

    it('should throw error when .slide-builder missing (AC-18.2.9)', async () => {
      const provider = new PlanEditorProvider(
        mockContext as any,
        mockOutputChannel as any
      );

      const mockDocument = {
        uri: { fsPath: '/mock/workspace/plan.yaml', toString: () => '/mock/workspace/plan.yaml' },
        getText: () => 'slides: []',
      };

      const mockWebviewPanel = {
        webview: {
          options: {},
          html: '',
          asWebviewUri: vi.fn((uri) => uri),
          cspSource: 'mock-csp',
          postMessage: vi.fn(),
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        },
        onDidDispose: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      };

      // Mock stat to fail (directory doesn't exist)
      vi.mocked(vscode.workspace.fs.stat).mockRejectedValue(new Error('Not found'));

      await expect(
        provider.resolveCustomTextEditor(
          mockDocument as any,
          mockWebviewPanel as any,
          { isCancellationRequested: false } as any
        )
      ).rejects.toThrow('Not a Slide Builder project');

      // Should show info message
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Plan Editor requires a Slide Builder project (.slide-builder directory)'
      );
    });

    it('should log document open event (AC-18.2.8)', async () => {
      const provider = new PlanEditorProvider(
        mockContext as any,
        mockOutputChannel as any
      );

      const mockDocument = {
        uri: { fsPath: '/mock/workspace/plan.yaml', toString: () => '/mock/workspace/plan.yaml' },
        getText: () => 'slides: []',
      };

      const mockWebviewPanel = {
        webview: {
          options: {},
          html: '',
          asWebviewUri: vi.fn((uri) => uri),
          cspSource: 'mock-csp',
          postMessage: vi.fn(),
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        },
        onDidDispose: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      };

      vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: 2 } as any);

      await provider.resolveCustomTextEditor(
        mockDocument as any,
        mockWebviewPanel as any,
        { isCancellationRequested: false } as any
      );

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Opening document:')
      );
    });

    it('should configure webview with CSP and scripts enabled', async () => {
      const provider = new PlanEditorProvider(
        mockContext as any,
        mockOutputChannel as any
      );

      const mockDocument = {
        uri: { fsPath: '/mock/workspace/plan.yaml', toString: () => '/mock/workspace/plan.yaml' },
        getText: () => 'slides: []',
      };

      const mockWebviewPanel = {
        webview: {
          options: {},
          html: '',
          asWebviewUri: vi.fn((uri) => uri),
          cspSource: 'mock-csp',
          postMessage: vi.fn(),
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        },
        onDidDispose: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      };

      vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: 2 } as any);

      await provider.resolveCustomTextEditor(
        mockDocument as any,
        mockWebviewPanel as any,
        { isCancellationRequested: false } as any
      );

      // Check webview options
      expect(mockWebviewPanel.webview.options).toEqual({
        enableScripts: true,
        localResourceRoots: expect.any(Array),
      });

      // Check HTML includes CSP
      expect(mockWebviewPanel.webview.html).toContain('Content-Security-Policy');
      expect(mockWebviewPanel.webview.html).toContain('mock-csp');
    });

    it('should parse YAML and log slide count', async () => {
      const provider = new PlanEditorProvider(
        mockContext as any,
        mockOutputChannel as any
      );

      const mockDocument = {
        uri: { fsPath: '/mock/workspace/plan.yaml', toString: () => '/mock/workspace/plan.yaml' },
        getText: () => 'slides:\n  - id: slide-1\n  - id: slide-2\n  - id: slide-3\n',
      };

      const mockWebviewPanel = {
        webview: {
          options: {},
          html: '',
          asWebviewUri: vi.fn((uri) => uri),
          cspSource: 'mock-csp',
          postMessage: vi.fn(),
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        },
        onDidDispose: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      };

      vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: 2 } as any);

      await provider.resolveCustomTextEditor(
        mockDocument as any,
        mockWebviewPanel as any,
        { isCancellationRequested: false } as any
      );

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('3 slides found')
      );
    });

    it('should set up onDidChangeTextDocument listener for external changes (AC-18.4.4)', async () => {
      const provider = new PlanEditorProvider(
        mockContext as any,
        mockOutputChannel as any
      );

      const mockDocument = {
        uri: { fsPath: '/mock/workspace/plan.yaml', toString: () => '/mock/workspace/plan.yaml' },
        getText: () => 'slides: []',
      };

      const mockWebviewPanel = {
        webview: {
          options: {},
          html: '',
          asWebviewUri: vi.fn((uri) => uri),
          cspSource: 'mock-csp',
          postMessage: vi.fn(),
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        },
        onDidDispose: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      };

      vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: 2 } as any);

      await provider.resolveCustomTextEditor(
        mockDocument as any,
        mockWebviewPanel as any,
        { isCancellationRequested: false } as any
      );

      // Should have set up onDidChangeTextDocument listener
      expect(vscode.workspace.onDidChangeTextDocument).toHaveBeenCalled();
    });

    it('should dispose change listener on panel dispose', async () => {
      const provider = new PlanEditorProvider(
        mockContext as any,
        mockOutputChannel as any
      );

      const mockDocument = {
        uri: { fsPath: '/mock/workspace/plan.yaml', toString: () => '/mock/workspace/plan.yaml' },
        getText: () => 'slides: []',
      };

      const mockDispose = vi.fn();
      vi.mocked(vscode.workspace.onDidChangeTextDocument).mockReturnValue({ dispose: mockDispose });

      let onDisposeCallback: (() => void) | undefined;
      const mockWebviewPanel = {
        webview: {
          options: {},
          html: '',
          asWebviewUri: vi.fn((uri) => uri),
          cspSource: 'mock-csp',
          postMessage: vi.fn(),
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        },
        onDidDispose: vi.fn((callback: () => void) => {
          onDisposeCallback = callback;
          return { dispose: vi.fn() };
        }),
      };

      vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: 2 } as any);

      await provider.resolveCustomTextEditor(
        mockDocument as any,
        mockWebviewPanel as any,
        { isCancellationRequested: false } as any
      );

      // Simulate panel being disposed
      onDisposeCallback?.();

      // Change listener should be disposed
      expect(mockDispose).toHaveBeenCalled();
    });
  });

  describe('external change detection (AC-18.4.4)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce external changes at 300ms', async () => {
      const provider = new PlanEditorProvider(
        mockContext as any,
        mockOutputChannel as any
      );

      const mockDocument = {
        uri: { fsPath: '/mock/workspace/plan.yaml', toString: () => '/mock/workspace/plan.yaml' },
        getText: () => 'slides: []',
      };

      let changeHandler: ((e: { document: { uri: { toString: () => string } } }) => void) | undefined;
      vi.mocked(vscode.workspace.onDidChangeTextDocument).mockImplementation((handler: any) => {
        changeHandler = handler;
        return { dispose: vi.fn() };
      });

      const mockWebviewPanel = {
        webview: {
          options: {},
          html: '',
          asWebviewUri: vi.fn((uri) => uri),
          cspSource: 'mock-csp',
          postMessage: vi.fn(),
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        },
        onDidDispose: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      };

      vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: 2 } as any);

      await provider.resolveCustomTextEditor(
        mockDocument as any,
        mockWebviewPanel as any,
        { isCancellationRequested: false } as any
      );

      // Clear initial calls
      mockWebviewPanel.webview.postMessage.mockClear();
      mockOutputChannel.appendLine.mockClear();

      // Simulate rapid external changes
      changeHandler?.({ document: { uri: { toString: () => '/mock/workspace/plan.yaml' } } });
      changeHandler?.({ document: { uri: { toString: () => '/mock/workspace/plan.yaml' } } });
      changeHandler?.({ document: { uri: { toString: () => '/mock/workspace/plan.yaml' } } });

      // Before debounce time elapses, no postMessage should be called
      expect(mockWebviewPanel.webview.postMessage).not.toHaveBeenCalled();

      // Advance time by 300ms (debounce delay)
      await vi.advanceTimersByTimeAsync(300);

      // After debounce, postMessage should be called exactly once
      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledTimes(1);
      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'plan-updated' })
      );
    });

    it('should only handle changes to the current document', async () => {
      const provider = new PlanEditorProvider(
        mockContext as any,
        mockOutputChannel as any
      );

      const mockDocument = {
        uri: { fsPath: '/mock/workspace/plan.yaml', toString: () => '/mock/workspace/plan.yaml' },
        getText: () => 'slides: []',
      };

      let changeHandler: ((e: { document: { uri: { toString: () => string } } }) => void) | undefined;
      vi.mocked(vscode.workspace.onDidChangeTextDocument).mockImplementation((handler: any) => {
        changeHandler = handler;
        return { dispose: vi.fn() };
      });

      const mockWebviewPanel = {
        webview: {
          options: {},
          html: '',
          asWebviewUri: vi.fn((uri) => uri),
          cspSource: 'mock-csp',
          postMessage: vi.fn(),
          onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        },
        onDidDispose: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      };

      vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: 2 } as any);

      await provider.resolveCustomTextEditor(
        mockDocument as any,
        mockWebviewPanel as any,
        { isCancellationRequested: false } as any
      );

      // Clear initial calls
      mockWebviewPanel.webview.postMessage.mockClear();

      // Simulate change to a different document
      changeHandler?.({ document: { uri: { toString: () => '/mock/workspace/other.yaml' } } });

      // Advance time
      await vi.advanceTimersByTimeAsync(400);

      // postMessage should NOT be called for different document
      expect(mockWebviewPanel.webview.postMessage).not.toHaveBeenCalled();
    });
  });
});
