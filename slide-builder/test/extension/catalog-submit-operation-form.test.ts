/**
 * Integration tests for catalog-message-handler: submit-operation-form routing.
 *
 * Story Reference: tm-1-5 AC-4
 * Tests: sb-manage:add-slide-template is routed through PromptAssemblyService;
 *        formatFormDataForCli is NOT called for this operation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspace, Uri } from 'vscode';
import { createCatalogMessageHandler } from '../../src/extension/catalog-message-handler';

// Mock claude-code-integration so sendToClaudeCode doesn't actually open VS Code
vi.mock('../../src/extension/claude-code-integration', () => ({
  sendToClaudeCode: vi.fn().mockResolvedValue(undefined),
}));

// Mock extension module to avoid circular dependency (slideBuilderConfig)
vi.mock('../../src/extension/extension', () => ({
  slideBuilderConfig: {
    claudeCode: {
      launchMode: 'extension',
      position: 'sidebar',
    },
  },
}));

// Mock SlideViewerV2Panel since it requires complex setup
vi.mock('../../src/extension/SlideViewerV2Panel', () => ({
  SlideViewerV2Panel: {
    createOrShow: vi.fn(),
    currentPanel: null,
  },
}));

import { sendToClaudeCode } from '../../src/extension/claude-code-integration';

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

function createMockWebview() {
  let messageHandler: ((msg: any) => void) | null = null;
  return {
    onDidReceiveMessage: vi.fn().mockImplementation((handler: any) => {
      messageHandler = handler;
      return { dispose: vi.fn() };
    }),
    postMessage: vi.fn().mockResolvedValue(true),
    _simulateMessage: (msg: any) => messageHandler?.(msg),
  };
}

function createMockDataService() {
  return {
    scanDecks: vi.fn().mockResolvedValue([]),
    scanDecksWithFolders: vi.fn().mockResolvedValue({ decks: [], folders: [] }),
    scanBrandAssets: vi.fn().mockResolvedValue([]),
    getDeckDetail: vi.fn().mockResolvedValue(null),
    getDeckPathAsync: vi.fn().mockResolvedValue(null),
    getDeckViewerUri: vi.fn().mockResolvedValue(null),
    dispose: vi.fn(),
  } as any;
}

function createMockFileWatcher() {
  return {
    onDecksChanged: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    onBrandAssetsChanged: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    dispose: vi.fn(),
  } as any;
}

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe('submit-operation-form routing for sb-manage:add-slide-template (tm-1-5 AC-4)', () => {
  let mockWebview: ReturnType<typeof createMockWebview>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebview = createMockWebview();

    // Default: readFile returns empty JSON for context files
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode('{}'));

    createCatalogMessageHandler(
      mockWebview as any,
      createMockDataService(),
      createMockFileWatcher(),
      mockOutputChannel,
      undefined,
      workspaceRoot // workspaceUri required for PromptAssemblyService to be instantiated
    );
  });

  // Task 7.1: assembleAddSlideTemplatePrompt is called and sendToClaudeCode is called with result
  it('routes sb-manage:add-slide-template to PromptAssemblyService and calls sendToClaudeCode (AC-4)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'sb-manage:add-slide-template',
      data: { name: 'T', description: 'D' },
    });

    // sendToClaudeCode should have been called
    expect(vi.mocked(sendToClaudeCode)).toHaveBeenCalledOnce();

    // The first argument (prompt) should start with /sb-manage:add-slide-template
    const [prompt] = vi.mocked(sendToClaudeCode).mock.calls[0];
    expect(prompt).toMatch(/^\/sb-manage:add-slide-template/);
  });

  // Task 7.1: form-submitted-ack success is posted back to webview
  it('posts form-submitted-ack with success: true after dispatching to Claude Code (AC-7)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'sb-manage:add-slide-template',
      data: { name: 'T', description: 'D' },
    });

    expect(mockWebview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'form-submitted-ack',
        operationId: 'sb-manage:add-slide-template',
        success: true,
      })
    );
  });

  // Task 7.2: formatFormDataForCli (general path) is NOT called for this operation.
  // We verify this by asserting the prompt passed to sendToClaudeCode does NOT
  // contain the "Here is the context from the user:" prefix that formatFormDataForCli would produce
  // as a standalone prefix (it would be formatted differently).
  // The PromptAssemblyService also outputs "Here is the context from the user:" but only AFTER
  // the /sb-manage:add-slide-template command, not as a /${operation}\n\n prefix.
  it('does NOT route through the generic formatFormDataForCli path (AC-4)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'sb-manage:add-slide-template',
      data: { name: 'T', description: 'D' },
    });

    expect(vi.mocked(sendToClaudeCode)).toHaveBeenCalledOnce();
    const [prompt] = vi.mocked(sendToClaudeCode).mock.calls[0];

    // If formatFormDataForCli were used, the prompt would be:
    //   /sb-manage:add-slide-template\n\nHere is the context from the user:\n- Name: T\n...
    // The PromptAssemblyService instead starts with /sb-manage:add-slide-template
    // and includes Template Name field (not "Name").
    // The key difference: formatFormDataForCli uses camelCase→TitleCase ("Name", "Description")
    // while PromptAssemblyService uses explicit labels ("Template Name", "Description").
    expect(prompt).toContain('Template Name: T');
    expect(prompt).toContain('Description: D');
  });

  // Additional: on error in assembleAddSlideTemplatePrompt, posts form-submitted-ack with success: false
  it('posts form-submitted-ack with success: false when dispatch fails (AC-4)', async () => {
    vi.mocked(sendToClaudeCode).mockRejectedValueOnce(new Error('Claude Code not available'));

    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'sb-manage:add-slide-template',
      data: { name: 'T', description: 'D' },
    });

    expect(mockWebview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'form-submitted-ack',
        operationId: 'sb-manage:add-slide-template',
        success: false,
        error: expect.stringContaining('Claude Code not available'),
      })
    );
  });

  // Additional: other operations still route through the general formatFormDataForCli path (slide)
  it('does NOT intercept other operations like sb-create:plan-deck (AC-4)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'sb-create:plan-deck',
      data: { title: 'My Deck', audience: 'Devs', goal: 'Ship it' },
    });

    // sendToClaudeCode should have been called
    expect(vi.mocked(sendToClaudeCode)).toHaveBeenCalledOnce();

    const [prompt] = vi.mocked(sendToClaudeCode).mock.calls[0];
    // Generic path produces /sb-create:plan-deck\n\n...
    expect(prompt).toMatch(/^\/sb-create:plan-deck/);
    // Does NOT use PromptAssemblyService's specific "Template Name:" format
    expect(prompt).not.toContain('Template Name:');
  });
});

// =============================================================================
// tm-3-1: submit-operation-form routing for sb-manage:add-deck-template
// =============================================================================

describe('submit-operation-form routing for sb-manage:add-deck-template (tm-3-1 AC-3, AC-5)', () => {
  let mockWebview: ReturnType<typeof createMockWebview>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebview = createMockWebview();

    // Default: readFile returns empty JSON for context files
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode('{}'));

    createCatalogMessageHandler(
      mockWebview as any,
      createMockDataService(),
      createMockFileWatcher(),
      mockOutputChannel,
      undefined,
      workspaceRoot // workspaceUri required for PromptAssemblyService to be instantiated
    );
  });

  // Task 6.4: Routes sb-manage:add-deck-template through PromptAssemblyService and calls sendToClaudeCode
  it('routes sb-manage:add-deck-template to PromptAssemblyService and calls sendToClaudeCode (AC-3, AC-5)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'sb-manage:add-deck-template',
      data: { name: 'Product Launch', purpose: 'Launch presentation' },
    });

    // sendToClaudeCode should have been called
    expect(vi.mocked(sendToClaudeCode)).toHaveBeenCalledOnce();

    // The first argument (prompt) should start with /sb-manage:add-deck-template
    const [prompt] = vi.mocked(sendToClaudeCode).mock.calls[0];
    expect(prompt).toMatch(/^\/sb-manage:add-deck-template/);
    expect(prompt).toContain('Template Name: Product Launch');
    expect(prompt).toContain('Purpose/Description: Launch presentation');
  });

  // Task 6.4: form-submitted-ack success posted
  it('posts form-submitted-ack with success: true after dispatching (AC-5)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'sb-manage:add-deck-template',
      data: { name: 'T', purpose: 'P' },
    });

    expect(mockWebview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'form-submitted-ack',
        operationId: 'sb-manage:add-deck-template',
        success: true,
      })
    );
  });

  // Task 6.5: assembleAddDeckTemplatePrompt throws → showErrorMessage called, sendToClaudeCode NOT called
  it('shows error message and does NOT call sendToClaudeCode when prompt assembly fails (AC-5)', async () => {
    // Make all readFile calls reject to simulate PromptAssemblyService internal error
    vi.mocked(sendToClaudeCode).mockRejectedValueOnce(new Error('Claude Code not available'));

    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'sb-manage:add-deck-template',
      data: { name: 'T', purpose: 'P' },
    });

    expect(mockWebview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'form-submitted-ack',
        operationId: 'sb-manage:add-deck-template',
        success: false,
        error: expect.stringContaining('Claude Code not available'),
      })
    );
  });
});
