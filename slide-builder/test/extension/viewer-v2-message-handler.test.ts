/**
 * Tests for viewer-v2-message-handler — v2-edit-with-ai and v2-animate-with-ai message handling.
 *
 * Story Reference: ae-1-2 AC-11, AC-12, AC-13, AC-14, AC-15
 * Story Reference: animate-context-1 AC-1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
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

describe('v2-edit-with-ai message handler (ae-1-2)', () => {
  let mockWebview: ReturnType<typeof createMockWebview>;
  let mockOutputChannel: ReturnType<typeof createMockOutputChannel>;
  let mockDataService: ReturnType<typeof createMockDataService>;
  const testDeckId = 'my-presentation';

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebview = createMockWebview();
    mockOutputChannel = createMockOutputChannel();
    mockDataService = createMockDataService();
    mockSendToClaudeCode.mockResolvedValue(undefined);

    // Create the handler (this registers the message listener)
    createViewerV2MessageHandler(
      mockWebview as any,
      testDeckId,
      mockDataService,
      mockOutputChannel
    );
  });

  describe('prompt composition (AC #11, AC #12)', () => {
    it('should compose prompt with correct format including deck slug, slide number, and instruction', async () => {
      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'make this a two-column layout',
        slideNumber: 3,
      });

      expect(mockSendToClaudeCode).toHaveBeenCalledTimes(1);
      const prompt = mockSendToClaudeCode.mock.calls[0][0];
      expect(prompt).toBe(
        `/sb-create:edit\n\nDeck: ${testDeckId}\nSlide: 3\nEdit instruction: make this a two-column layout`
      );
    });

    it('should use slideNumber from message directly (1-based index)', async () => {
      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'add a title',
        slideNumber: 1,
      });

      const prompt = mockSendToClaudeCode.mock.calls[0][0];
      expect(prompt).toContain('Slide: 1');
    });

    it('should use deckId from handler context in prompt', async () => {
      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'change colors',
        slideNumber: 2,
      });

      const prompt = mockSendToClaudeCode.mock.calls[0][0];
      expect(prompt).toContain(`Deck: ${testDeckId}`);
    });

    it('should include the instruction text verbatim in prompt', async () => {
      const instruction = 'make the header bigger and add a subtitle below it';
      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction,
        slideNumber: 5,
      });

      const prompt = mockSendToClaudeCode.mock.calls[0][0];
      expect(prompt).toContain(`Edit instruction: ${instruction}`);
    });
  });

  describe('sendToClaudeCode invocation (AC #13)', () => {
    it('should call sendToClaudeCode with newSession: true', async () => {
      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'test instruction',
        slideNumber: 1,
      });

      expect(mockSendToClaudeCode).toHaveBeenCalledWith(
        expect.any(String),
        mockOutputChannel,
        undefined,
        expect.objectContaining({ newSession: true })
      );
    });
  });

  describe('success response (AC #14)', () => {
    it('should post v2-edit-started with success: true on successful launch', async () => {
      mockSendToClaudeCode.mockResolvedValue(undefined);

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'test',
        slideNumber: 1,
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-edit-started',
        success: true,
      });
    });

    it('should log success to output channel', async () => {
      mockSendToClaudeCode.mockResolvedValue(undefined);

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'test',
        slideNumber: 1,
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ViewerV2] Edit with AI: v2-edit-started sent (success: true)'
      );
    });
  });

  describe('error handling (AC #15)', () => {
    it('should catch sendToClaudeCode errors and post v2-edit-started with success: false', async () => {
      mockSendToClaudeCode.mockRejectedValue(new Error('CC extension not installed'));

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'test',
        slideNumber: 1,
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-edit-started',
        success: false,
        error: 'CC extension not installed',
      });
    });

    it('should log error with [ViewerV2] Edit with AI failed: prefix', async () => {
      mockSendToClaudeCode.mockRejectedValue(new Error('Command failed'));

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'test',
        slideNumber: 1,
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ViewerV2] Edit with AI failed: Command failed'
      );
    });

    it('should show VS Code error notification on failure', async () => {
      mockSendToClaudeCode.mockRejectedValue(new Error('CC unavailable'));

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'test',
        slideNumber: 1,
      });

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Edit with AI failed: CC unavailable')
      );
    });

    it('should log v2-edit-started sent (success: false) on error', async () => {
      mockSendToClaudeCode.mockRejectedValue(new Error('error'));

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'test',
        slideNumber: 1,
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ViewerV2] Edit with AI: v2-edit-started sent (success: false)'
      );
    });

    it('should handle non-Error thrown values', async () => {
      mockSendToClaudeCode.mockRejectedValue('string error');

      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'test',
        slideNumber: 1,
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-edit-started',
        success: false,
        error: 'string error',
      });
    });
  });

  describe('output channel logging', () => {
    it('should log incoming message with slide number and instruction', async () => {
      await mockWebview._simulateMessage({
        type: 'v2-edit-with-ai',
        instruction: 'make this a two-column layout',
        slideNumber: 3,
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[ViewerV2] Edit with AI: slide 3, instruction: "make this a two-column layout"'
      );
    });
  });
});

/**
 * Tests for viewer-v2-message-handler — v2-submit-edit-form message handling.
 *
 * Story Reference: tm-3-5 AC-3, AC-4
 */
describe('v2-submit-edit-form message handler (tm-3-5)', () => {
  let mockWebview: ReturnType<typeof createMockWebview>;
  let mockOutputChannel: ReturnType<typeof createMockOutputChannel>;
  let mockDataService: ReturnType<typeof createMockDataService>;
  const testDeckId = '__deck-template-preview__';

  const mockPromptAssemblyService = {
    assembleEditDeckTemplatePrompt: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebview = createMockWebview();
    mockOutputChannel = createMockOutputChannel();
    mockDataService = createMockDataService();
    mockSendToClaudeCode.mockResolvedValue(undefined);
    mockPromptAssemblyService.assembleEditDeckTemplatePrompt.mockResolvedValue(
      '/sb-manage:edit-deck-template\n\nTemplate: my-template\nSlide: slides/slide-1.html\nChanges: make header larger'
    );
  });

  describe('routing to PromptAssemblyService (AC #3)', () => {
    it('should call assembleEditDeckTemplatePrompt with correct args', async () => {
      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel,
        undefined,
        mockPromptAssemblyService as any
      );

      await mockWebview._simulateMessage({
        type: 'v2-submit-edit-form',
        operation: 'sb-manage:edit-deck-template',
        data: { changes: 'make header larger', templateId: 'my-template', slideFile: 'slides/slide-1.html' },
      });

      expect(mockPromptAssemblyService.assembleEditDeckTemplatePrompt).toHaveBeenCalledWith(
        { changes: 'make header larger', templateId: 'my-template', slideFile: 'slides/slide-1.html' },
        'my-template',
        'slides/slide-1.html'
      );
    });

    it('should log routing to PromptAssemblyService', async () => {
      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel,
        undefined,
        mockPromptAssemblyService as any
      );

      await mockWebview._simulateMessage({
        type: 'v2-submit-edit-form',
        operation: 'sb-manage:edit-deck-template',
        data: { changes: 'test', templateId: 'tpl', slideFile: 's.html' },
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[viewer-v2-message-handler] v2-submit-edit-form: routing to PromptAssemblyService'
      );
    });
  });

  describe('dispatching to Claude Code (AC #4)', () => {
    it('should call sendToClaudeCode with assembled prompt', async () => {
      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel,
        undefined,
        mockPromptAssemblyService as any
      );

      await mockWebview._simulateMessage({
        type: 'v2-submit-edit-form',
        operation: 'sb-manage:edit-deck-template',
        data: { changes: 'make header larger', templateId: 'my-template', slideFile: 'slides/slide-1.html' },
      });

      expect(mockSendToClaudeCode).toHaveBeenCalledWith(
        expect.stringContaining('/sb-manage:edit-deck-template'),
        mockOutputChannel
      );
    });

    it('should log successful dispatch', async () => {
      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel,
        undefined,
        mockPromptAssemblyService as any
      );

      await mockWebview._simulateMessage({
        type: 'v2-submit-edit-form',
        operation: 'sb-manage:edit-deck-template',
        data: { changes: 'test', templateId: 'tpl', slideFile: 's.html' },
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[viewer-v2-message-handler] v2-submit-edit-form: dispatched to Claude Code'
      );
    });
  });

  describe('error handling', () => {
    it('should show error when PromptAssemblyService is not available', async () => {
      // Create handler WITHOUT promptAssemblyService
      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel
      );

      await mockWebview._simulateMessage({
        type: 'v2-submit-edit-form',
        operation: 'sb-manage:edit-deck-template',
        data: { changes: 'test', templateId: 'tpl', slideFile: 's.html' },
      });

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('PromptAssemblyService not available')
      );
    });

    it('should handle assembleEditDeckTemplatePrompt rejection', async () => {
      mockPromptAssemblyService.assembleEditDeckTemplatePrompt.mockRejectedValue(
        new Error('Template config not found')
      );

      createViewerV2MessageHandler(
        mockWebview as any,
        testDeckId,
        mockDataService,
        mockOutputChannel,
        undefined,
        mockPromptAssemblyService as any
      );

      await mockWebview._simulateMessage({
        type: 'v2-submit-edit-form',
        operation: 'sb-manage:edit-deck-template',
        data: { changes: 'test', templateId: 'tpl', slideFile: 's.html' },
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[viewer-v2-message-handler] v2-submit-edit-form failed: Template config not found'
      );
    });
  });
});

/**
 * Tests for viewer-v2-message-handler — v2-animate-with-ai message handling.
 *
 * Story Reference: animate-context-1 AC-1
 */
describe('v2-animate-with-ai message handler (animate-context-1)', () => {
  let mockWebview: ReturnType<typeof createMockWebview>;
  let mockOutputChannel: ReturnType<typeof createMockOutputChannel>;
  let mockDataService: ReturnType<typeof createMockDataService>;
  const testDeckId = 'my-presentation';

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebview = createMockWebview();
    mockOutputChannel = createMockOutputChannel();
    mockDataService = createMockDataService();
    mockSendToClaudeCode.mockResolvedValue(undefined);

    createViewerV2MessageHandler(
      mockWebview as any,
      testDeckId,
      mockDataService,
      mockOutputChannel
    );
  });

  describe('prompt composition with deck context (AC #1)', () => {
    it('should include Deck: {deckId} in the composed prompt', async () => {
      await mockWebview._simulateMessage({
        type: 'v2-animate-with-ai',
        instruction: 'fade in cards one by one',
        slideNumber: 6,
      });

      expect(mockSendToClaudeCode).toHaveBeenCalledTimes(1);
      const prompt = mockSendToClaudeCode.mock.calls[0][0];
      expect(prompt).toBe(
        `/sb-create:animate 6\n\nDeck: ${testDeckId}\nInstruction: fade in cards one by one`
      );
    });

    it('should include Deck context even without instruction', async () => {
      await mockWebview._simulateMessage({
        type: 'v2-animate-with-ai',
        instruction: '',
        slideNumber: 3,
      });

      const prompt = mockSendToClaudeCode.mock.calls[0][0];
      expect(prompt).toBe(`/sb-create:animate 3\n\nDeck: ${testDeckId}`);
    });

    it('should not append Instruction line when instruction is whitespace-only', async () => {
      await mockWebview._simulateMessage({
        type: 'v2-animate-with-ai',
        instruction: '   ',
        slideNumber: 2,
      });

      const prompt = mockSendToClaudeCode.mock.calls[0][0];
      expect(prompt).not.toContain('Instruction:');
    });

    it('should include instruction text verbatim when provided', async () => {
      const instruction = 'stagger the process steps with arrows';
      await mockWebview._simulateMessage({
        type: 'v2-animate-with-ai',
        instruction,
        slideNumber: 4,
      });

      const prompt = mockSendToClaudeCode.mock.calls[0][0];
      expect(prompt).toContain(`Instruction: ${instruction}`);
    });
  });

  describe('success response', () => {
    it('should post v2-animate-started with success: true on successful launch', async () => {
      await mockWebview._simulateMessage({
        type: 'v2-animate-with-ai',
        instruction: 'test',
        slideNumber: 1,
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-animate-started',
        success: true,
      });
    });
  });

  describe('error handling', () => {
    it('should post v2-animate-started with success: false on error', async () => {
      mockSendToClaudeCode.mockRejectedValue(new Error('CC not installed'));

      await mockWebview._simulateMessage({
        type: 'v2-animate-with-ai',
        instruction: 'test',
        slideNumber: 1,
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'v2-animate-started',
        success: false,
        error: 'CC not installed',
      });
    });
  });
});
