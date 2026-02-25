import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { MessageHandler } from '../../src/extension/message-handler';

// Mock sendToClaudeCode - used by handleOpenClaude
vi.mock('../../src/extension/claude-code-integration', () => ({
  sendToClaudeCode: vi.fn().mockResolvedValue(undefined),
}));

// Mock configService - used by handleOpenClaude for launch settings
vi.mock('../../src/extension/extension', () => ({
  configService: {
    readSettings: vi.fn().mockReturnValue({
      claudeCode: { launchMode: 'extension', position: 'sidebar' },
    }),
  },
}));

import { sendToClaudeCode } from '../../src/extension/claude-code-integration';

/**
 * Message Handler Tests
 *
 * Story Reference: 18-4 Task 1.5 - Write test for edit-slide → WorkspaceEdit flow
 * AC-18.4.1: UI edit flow triggers YAML update via WorkspaceEdit
 * AC-18.4.3: WorkspaceEdit enables native undo/redo
 */

interface MockOutputChannel {
  appendLine: ReturnType<typeof vi.fn>;
  show: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

describe('MessageHandler', () => {
  let mockOutputChannel: MockOutputChannel;
  let mockExtensionUri: { fsPath: string };
  let handler: MessageHandler;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOutputChannel = {
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    };

    mockExtensionUri = { fsPath: '/mock/extension' };

    handler = new MessageHandler(
      mockOutputChannel as any,
      mockExtensionUri as any
    );
  });

  describe('handleMessage - edit-slide', () => {
    it('should call setField with correct path for slide edit (AC-18.4.1)', async () => {
      const yamlContent = `slides:
  - number: 1
    intent: Original Intent
    template: hero
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      const message = {
        type: 'edit-slide' as const,
        slideNumber: 1,
        field: 'intent',
        value: 'Updated Intent',
      };

      await handler.handleMessage(message, mockWebview as any, mockDocument as any);

      // Verify applyEdit was called
      expect(vscode.workspace.applyEdit).toHaveBeenCalled();

      // Check that output channel logged success
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Edit slide 1, field: intent')
      );
    });

    it('should apply edit via WorkspaceEdit API (AC-18.4.3)', async () => {
      const yamlContent = `slides:
  - number: 1
    intent: Test
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      const message = {
        type: 'edit-slide' as const,
        slideNumber: 1,
        field: 'intent',
        value: 'New Intent',
      };

      await handler.handleMessage(message, mockWebview as any, mockDocument as any);

      // WorkspaceEdit should be applied (enables native undo/redo)
      expect(vscode.workspace.applyEdit).toHaveBeenCalledTimes(1);
    });

    it('should preserve YAML comments through edit cycle (AC-18.4.2)', async () => {
      const yamlWithComments = `# Plan file header
slides:
  # First slide comment
  - number: 1
    intent: Original  # inline comment
    template: hero
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlWithComments,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      // Mock applyEdit to capture the new content
      let capturedContent = '';
      vi.mocked(vscode.workspace.applyEdit).mockImplementation(async (edit: any) => {
        // Extract the new content from the WorkspaceEdit
        const entries = edit.entries();
        if (entries.length > 0 && entries[0][1].length > 0) {
          capturedContent = entries[0][1][0].newText;
        }
        return true;
      });

      const message = {
        type: 'edit-slide' as const,
        slideNumber: 1,
        field: 'intent',
        value: 'Updated Intent',
      };

      await handler.handleMessage(message, mockWebview as any, mockDocument as any);

      // Verify comments are preserved in the output
      expect(capturedContent).toContain('# Plan file header');
      expect(capturedContent).toContain('# First slide comment');
      expect(capturedContent).toContain('# inline comment');
      // Verify the value was updated
      expect(capturedContent).toContain('intent: Updated Intent');
    });

    it('should handle multiple slides and edit correct index', async () => {
      const yamlContent = `slides:
  - number: 1
    intent: First Slide
  - number: 2
    intent: Second Slide
  - number: 3
    intent: Third Slide
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      let capturedContent = '';
      vi.mocked(vscode.workspace.applyEdit).mockImplementation(async (edit: any) => {
        const entries = edit.entries();
        if (entries.length > 0 && entries[0][1].length > 0) {
          capturedContent = entries[0][1][0].newText;
        }
        return true;
      });

      // Edit slide 2 (slideNumber is 1-indexed)
      const message = {
        type: 'edit-slide' as const,
        slideNumber: 2,
        field: 'intent',
        value: 'Updated Second Slide',
      };

      await handler.handleMessage(message, mockWebview as any, mockDocument as any);

      // Verify only slide 2 was changed
      expect(capturedContent).toContain('intent: First Slide');
      expect(capturedContent).toContain('intent: Updated Second Slide');
      expect(capturedContent).toContain('intent: Third Slide');
    });

    it('should log timing information for performance monitoring (AC-18.4.8)', async () => {
      const yamlContent = `slides:
  - number: 1
    intent: Test
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      const message = {
        type: 'edit-slide' as const,
        slideNumber: 1,
        field: 'intent',
        value: 'Updated',
      };

      await handler.handleMessage(message, mockWebview as any, mockDocument as any);

      // Should log detailed timing info (AC-18.4.8)
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringMatching(/Edit applied \(\d+ms total\): parse=\d+ms, serialize=\d+ms, apply=\d+ms/)
      );
    });

    it('should handle edit errors gracefully', async () => {
      const invalidYaml = 'this is not valid yaml: [[[';

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => invalidYaml,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      const message = {
        type: 'edit-slide' as const,
        slideNumber: 1,
        field: 'intent',
        value: 'Updated',
      };

      // Should not throw
      await expect(
        handler.handleMessage(message, mockWebview as any, mockDocument as any)
      ).resolves.not.toThrow();

      // Should log error
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Edit error')
      );
    });

    it('should normalize multiline description to single line', async () => {
      const yamlContent = `slides:
  - number: 1
    description: Original
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      let capturedContent = '';
      vi.mocked(vscode.workspace.applyEdit).mockImplementation(async (edit: any) => {
        const entries = edit.entries();
        if (entries.length > 0 && entries[0][1].length > 0) {
          capturedContent = entries[0][1][0].newText;
        }
        return true;
      });

      const message = {
        type: 'edit-slide' as const,
        slideNumber: 1,
        field: 'description',
        value: 'Line one\nLine two\n\nLine three',
      };

      await handler.handleMessage(message, mockWebview as any, mockDocument as any);

      // Multiline value should be collapsed to single line
      expect(capturedContent).toContain('description: Line one Line two Line three');
      expect(capturedContent).not.toContain('\nLine two');
    });

    it('should not normalize non-description fields', async () => {
      const yamlContent = `slides:
  - number: 1
    tone: Original
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      let capturedContent = '';
      vi.mocked(vscode.workspace.applyEdit).mockImplementation(async (edit: any) => {
        const entries = edit.entries();
        if (entries.length > 0 && entries[0][1].length > 0) {
          capturedContent = entries[0][1][0].newText;
        }
        return true;
      });

      const message = {
        type: 'edit-slide' as const,
        slideNumber: 1,
        field: 'tone',
        value: 'Bold\nand brave',
      };

      await handler.handleMessage(message, mockWebview as any, mockDocument as any);

      // Non-description fields should NOT be normalized
      expect(capturedContent).not.toContain('tone: Bold and brave');
    });

    it('should log failure when applyEdit returns false', async () => {
      const yamlContent = `slides:
  - number: 1
    intent: Test
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      // Mock applyEdit to fail
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(false);

      const message = {
        type: 'edit-slide' as const,
        slideNumber: 1,
        field: 'intent',
        value: 'Updated',
      };

      await handler.handleMessage(message, mockWebview as any, mockDocument as any);

      // Should log failure
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('Edit failed to apply');
    });
  });

  describe('handleMessage - ready', () => {
    it('should send plan-updated message on ready', async () => {
      const yamlContent = `deck_name: Test Deck
slides:
  - number: 1
    intent: Test
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      // Mock workspace folder for theme/template loading
      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      // Mock fs.readFile to fail (no templates/theme files)
      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('Not found'));

      const message = { type: 'ready' as const };

      await handler.handleMessage(message, mockWebview as any, mockDocument as any);

      // Should send plan-updated
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'plan-updated',
          plan: expect.objectContaining({
            deck_name: 'Test Deck',
          }),
        })
      );
    });

    it('should return validation warnings for slides missing key_points', async () => {
      const yamlContent = `deck_name: Test Deck
slides:
  - number: 1
    description: Good slide
    key_points:
      - Point one
  - number: 2
    description: Bad slide
    key_points: []
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('Not found'));

      await handler.handleMessage({ type: 'ready' }, mockWebview as any, mockDocument as any);

      // Should include validation warnings for slide 2 (empty key_points)
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'plan-updated',
          validationWarnings: expect.arrayContaining([
            expect.objectContaining({
              type: 'empty-key-points',
              slideNumber: 2,
            }),
          ]),
        })
      );
    });
  });

  /**
   * Story 18-5: Template Catalog & Theme Loading Tests
   * AC-18.5.1 through AC-18.5.7
   */
  describe('Template Catalog Loading', () => {
    const mockCatalog = [
      { id: 'hero', name: 'Hero Slide', description: 'A bold opening', use_cases: ['intro', 'branding'] },
      { id: 'content', name: 'Content Slide', description: 'Standard content', use_cases: ['info'] },
    ];

    const mockTheme = {
      colors: { primary: '#1a73e8', secondary: '#ea4335' },
      typography: { headingFont: 'Inter' },
    };

    const yamlContent = `deck_name: Test Deck
slides:
  - number: 1
    intent: Test
`;

    it('should read catalog from correct path on ready (AC-18.5.1)', async () => {
      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      // Mock catalog load success, theme fails
      vi.mocked(vscode.workspace.fs.readFile).mockImplementation(async (uri: any) => {
        if (uri.fsPath.includes('slide-templates.json')) {
          return new TextEncoder().encode(JSON.stringify(mockCatalog));
        }
        throw new Error('Not found');
      });

      await handler.handleMessage({ type: 'ready' }, mockWebview as any, mockDocument as any);

      // Verify catalog path was correct
      expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
        expect.anything(),
        '.slide-builder',
        'config',
        'catalog',
        'slide-templates.json'
      );
    });

    it('should cache catalog and reuse on second ready (AC-18.5.2)', async () => {
      // Create fresh handler for isolation
      const freshHandler = new MessageHandler(mockOutputChannel as any, mockExtensionUri as any);

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      const readFileMock = vi.fn().mockImplementation(async (uri: any) => {
        if (uri.fsPath.includes('slide-templates.json')) {
          return new TextEncoder().encode(JSON.stringify(mockCatalog));
        }
        throw new Error('Not found');
      });
      vi.mocked(vscode.workspace.fs.readFile).mockImplementation(readFileMock);

      // First ready
      await freshHandler.handleMessage({ type: 'ready' }, mockWebview as any, mockDocument as any);

      // Count readFile calls for catalog
      const catalogCallsAfterFirst = readFileMock.mock.calls.filter(
        (call: any) => call[0].fsPath.includes('slide-templates.json')
      ).length;

      // Second ready
      await freshHandler.handleMessage({ type: 'ready' }, mockWebview as any, mockDocument as any);

      // Count again
      const catalogCallsAfterSecond = readFileMock.mock.calls.filter(
        (call: any) => call[0].fsPath.includes('slide-templates.json')
      ).length;

      // Should not have read catalog file again (caching)
      expect(catalogCallsAfterSecond).toBe(catalogCallsAfterFirst);

      // Should have logged cache usage
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Using cached templates')
      );
    });

    it('should send templates-loaded message with parsed entries (AC-18.5.3)', async () => {
      const freshHandler = new MessageHandler(mockOutputChannel as any, mockExtensionUri as any);

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      vi.mocked(vscode.workspace.fs.readFile).mockImplementation(async (uri: any) => {
        if (uri.fsPath.includes('slide-templates.json')) {
          return new TextEncoder().encode(JSON.stringify(mockCatalog));
        }
        throw new Error('Not found');
      });

      await freshHandler.handleMessage({ type: 'ready' }, mockWebview as any, mockDocument as any);

      // Should send templates-loaded with correct structure
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'templates-loaded',
          templates: expect.arrayContaining([
            expect.objectContaining({
              id: 'hero',
              name: 'Hero Slide',
              description: 'A bold opening',
              use_cases: ['intro', 'branding'],
            }),
          ]),
        })
      );
    });

    it('should show VS Code warning when catalog missing (AC-18.5.6)', async () => {
      const freshHandler = new MessageHandler(mockOutputChannel as any, mockExtensionUri as any);

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      // All files not found
      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('File not found'));

      await freshHandler.handleMessage({ type: 'ready' }, mockWebview as any, mockDocument as any);

      // Should show warning message
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'Template catalog not found - confidence scoring will be disabled'
      );

      // Should still send templates-loaded with empty array
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'templates-loaded',
          templates: [],
        })
      );
    });
  });

  describe('Theme Loading', () => {
    const mockTheme = {
      colors: { primary: '#1a73e8' },
      typography: { headingFont: 'Inter' },
    };

    const yamlContent = `deck_name: Test Deck
slides: []
`;

    it('should read theme from correct path (AC-18.5.4)', async () => {
      const freshHandler = new MessageHandler(mockOutputChannel as any, mockExtensionUri as any);

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      vi.mocked(vscode.workspace.fs.readFile).mockImplementation(async (uri: any) => {
        if (uri.fsPath.includes('theme.json')) {
          return new TextEncoder().encode(JSON.stringify(mockTheme));
        }
        throw new Error('Not found');
      });

      await freshHandler.handleMessage({ type: 'ready' }, mockWebview as any, mockDocument as any);

      // Verify theme path was correct
      expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
        expect.anything(),
        '.slide-builder',
        'config',
        'theme.json'
      );
    });

    it('should send theme-loaded message with parsed config (AC-18.5.5)', async () => {
      const freshHandler = new MessageHandler(mockOutputChannel as any, mockExtensionUri as any);

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      vi.mocked(vscode.workspace.fs.readFile).mockImplementation(async (uri: any) => {
        if (uri.fsPath.includes('theme.json')) {
          return new TextEncoder().encode(JSON.stringify(mockTheme));
        }
        throw new Error('Not found');
      });

      await freshHandler.handleMessage({ type: 'ready' }, mockWebview as any, mockDocument as any);

      // Should send theme-loaded with correct structure
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'theme-loaded',
          theme: expect.objectContaining({
            colors: { primary: '#1a73e8' },
            typography: { headingFont: 'Inter' },
          }),
        })
      );

      // Should log success
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('Loaded theme');
    });

    it('should continue silently when theme file missing (AC-18.5.7)', async () => {
      const freshHandler = new MessageHandler(mockOutputChannel as any, mockExtensionUri as any);

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = {
        postMessage: vi.fn(),
      };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      // Theme not found
      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('Not found'));

      // Clear previous warning calls
      vi.mocked(vscode.window.showWarningMessage).mockClear();

      await freshHandler.handleMessage({ type: 'ready' }, mockWebview as any, mockDocument as any);

      // Should NOT show warning for missing theme (only for missing catalog)
      const warningCalls = vi.mocked(vscode.window.showWarningMessage).mock.calls;
      const themeWarnings = warningCalls.filter(call =>
        call[0].toLowerCase().includes('theme')
      );
      expect(themeWarnings.length).toBe(0);

      // Should send theme-loaded with null
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'theme-loaded',
          theme: null,
        })
      );

      // Should log to OutputChannel (not show user warning)
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Theme file not found')
      );
    });
  });

  // ===========================================================================
  // Story 21-1: Add/Delete Slide Handlers (AC-21.1.2, AC-21.1.9, AC-21.1.12)
  // ===========================================================================

  describe('handleMessage - add-slide', () => {
    it('should insert slide with defaults via WorkspaceEdit (AC-21.1.2, AC-21.1.12)', async () => {
      const yamlContent = `slides:
  - number: 1
    description: First
    suggested_template: ""
    status: pending
    storyline_role: detail
    agenda_section_id: intro
    key_points: []
    design_plan: ""
    tone: ""
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = { postMessage: vi.fn() };

      let capturedContent = '';
      vi.mocked(vscode.workspace.applyEdit).mockImplementation(async (edit: any) => {
        const entries = edit.entries();
        if (entries.length > 0 && entries[0][1].length > 0) {
          capturedContent = entries[0][1][0].newText;
        }
        return true;
      });

      await handler.handleMessage(
        { type: 'add-slide', afterSlideNumber: 1, sectionId: 'body' },
        mockWebview as any,
        mockDocument as any
      );

      // WorkspaceEdit must be called (AC-21.1.12 - enables Cmd+Z undo)
      expect(vscode.workspace.applyEdit).toHaveBeenCalledTimes(1);

      // New slide should have defaults and correct section
      expect(capturedContent).toContain('agenda_section_id: body');
      expect(capturedContent).toContain('status: pending');
      expect(capturedContent).toContain('storyline_role: detail');

      // Should have 2 slides, renumbered 1 and 2
      expect(capturedContent).toContain('description: First');
    });

    it('should renumber slides after insertion (AC-21.1.3)', async () => {
      const yamlContent = `slides:
  - number: 1
    description: First
    agenda_section_id: intro
    status: pending
    storyline_role: detail
    key_points: []
  - number: 2
    description: Second
    agenda_section_id: intro
    status: pending
    storyline_role: detail
    key_points: []
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = { postMessage: vi.fn() };

      let capturedContent = '';
      vi.mocked(vscode.workspace.applyEdit).mockImplementation(async (edit: any) => {
        const entries = edit.entries();
        if (entries.length > 0 && entries[0][1].length > 0) {
          capturedContent = entries[0][1][0].newText;
        }
        return true;
      });

      // Insert after slide 1 (at index 1)
      await handler.handleMessage(
        { type: 'add-slide', afterSlideNumber: 1, sectionId: 'intro' },
        mockWebview as any,
        mockDocument as any
      );

      // Should have 3 slides, all renumbered
      const numberMatches = capturedContent.match(/number: \d+/g) ?? [];
      expect(numberMatches).toEqual(['number: 1', 'number: 2', 'number: 3']);
    });
  });

  describe('handleMessage - delete-slide', () => {
    it('should delete slide via WorkspaceEdit (AC-21.1.9, AC-21.1.12)', async () => {
      const yamlContent = `slides:
  - number: 1
    description: First
    status: pending
    storyline_role: detail
    key_points: []
  - number: 2
    description: Second
    status: pending
    storyline_role: detail
    key_points: []
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = { postMessage: vi.fn() };

      let capturedContent = '';
      vi.mocked(vscode.workspace.applyEdit).mockImplementation(async (edit: any) => {
        const entries = edit.entries();
        if (entries.length > 0 && entries[0][1].length > 0) {
          capturedContent = entries[0][1][0].newText;
        }
        return true;
      });

      await handler.handleMessage(
        { type: 'delete-slide', slideNumber: 1 },
        mockWebview as any,
        mockDocument as any
      );

      // WorkspaceEdit must be called (AC-21.1.12 - enables Cmd+Z undo)
      expect(vscode.workspace.applyEdit).toHaveBeenCalledTimes(1);

      // First slide should be gone, second slide renumbered to 1
      expect(capturedContent).not.toContain('description: First');
      expect(capturedContent).toContain('description: Second');
      expect(capturedContent).toContain('number: 1');
    });
  });

  // ===========================================================================
  // Story 23-2: Open Claude Handler (AC-23.2.4, AC-23.2.5, AC-23.2.6, AC-23.2.8)
  // ===========================================================================

  describe('handleMessage - open-claude', () => {
    const yamlContent = `deck_name: Test Deck
slides:
  - number: 1
    description: First Slide
    status: pending
    storyline_role: opening
    agenda_section_id: intro
    key_points:
      - Point A
  - number: 2
    description: Second Slide
    status: pending
    storyline_role: evidence
    agenda_section_id: body
    key_points:
      - Point B
  - number: 3
    description: Third Slide
    status: pending
    storyline_role: cta
    agenda_section_id: close
    key_points:
      - Point C
`;

    it('should log open-claude message receipt (AC-23.2.4)', async () => {
      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = { postMessage: vi.fn() };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('Not found'));
      vi.mocked(vscode.commands.getCommands).mockResolvedValue([]);

      await handler.handleMessage(
        { type: 'open-claude', slideNumber: 2 },
        mockWebview as any,
        mockDocument as any
      );

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[Claude] Open Claude Code')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('slide 2')
      );
    });

    it('should write context file with focused slide (AC-23.2.5)', async () => {
      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = { postMessage: vi.fn() };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('Not found'));
      vi.mocked(vscode.commands.getCommands).mockResolvedValue([]);

      await handler.handleMessage(
        { type: 'open-claude', slideNumber: 2 },
        mockWebview as any,
        mockDocument as any
      );

      // Should have called writeFile for context
      expect(vscode.workspace.fs.writeFile).toHaveBeenCalled();
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[Claude Context]')
      );
    });

    it('should send instruction to Claude Code via sendToClaudeCode (AC-23.2.6, AC #13)', async () => {
      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = { postMessage: vi.fn() };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('Not found'));

      await handler.handleMessage(
        { type: 'open-claude', slideNumber: 1, instruction: 'Make the title larger' },
        mockWebview as any,
        mockDocument as any
      );

      // Should delegate to sendToClaudeCode with /sb-create:edit-plan prefix
      expect(sendToClaudeCode).toHaveBeenCalledWith(
        '/sb-create:edit-plan Make the title larger',
        mockOutputChannel,
        expect.objectContaining({ fsPath: '/mock/workspace' }),
        expect.objectContaining({ launchMode: 'extension', position: 'sidebar' })
      );
    });

    it('should call sendToClaudeCode with empty string when no instruction (AC-23.2.8)', async () => {
      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = { postMessage: vi.fn() };

      const workspaceUri = { fsPath: '/mock/workspace', toString: () => '/mock/workspace' };
      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: workspaceUri,
        name: 'mock-workspace',
        index: 0,
      } as any);

      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('Not found'));

      await handler.handleMessage(
        { type: 'open-claude', slideNumber: 1 },
        mockWebview as any,
        mockDocument as any
      );

      // Should call sendToClaudeCode with empty string (no instruction)
      expect(sendToClaudeCode).toHaveBeenCalledWith(
        '',
        mockOutputChannel,
        expect.objectContaining({ fsPath: '/mock/workspace' }),
        expect.objectContaining({ launchMode: 'extension', position: 'sidebar' })
      );
    });

    it('should log focused slide details with neighbors', async () => {
      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = { postMessage: vi.fn() };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('Not found'));
      vi.mocked(vscode.commands.getCommands).mockResolvedValue([]);

      await handler.handleMessage(
        { type: 'open-claude', slideNumber: 2 },
        mockWebview as any,
        mockDocument as any
      );

      // Should log focused slide with neighbors
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Focused slide 2')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('prev: 1')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('next: 3')
      );
    });

    it('should handle open-claude without slideNumber', async () => {
      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
      };

      const mockWebview = { postMessage: vi.fn() };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('Not found'));
      vi.mocked(vscode.commands.getCommands).mockResolvedValue([]);

      // Should not throw
      await expect(
        handler.handleMessage(
          { type: 'open-claude' },
          mockWebview as any,
          mockDocument as any
        )
      ).resolves.not.toThrow();
    });
  });

  // ===========================================================================
  // Story BR-2.1: Build-All Pre-Check Tests (AC-1, AC-2, AC-3, AC-8)
  // ===========================================================================

  describe('handleMessage - build-all pre-check', () => {
    const planYamlWithMixedStatuses = `deck_name: Test Deck
slides:
  - number: 1
    description: Slide One
    status: built
  - number: 2
    description: Slide Two
    status: pending
  - number: 3
    description: Slide Three
    status: built
  - number: 4
    description: Slide Four
    status: pending
  - number: 5
    description: Slide Five
    status: pending
  - number: 6
    description: Slide Six
    status: built
`;

    const createBuildAllMocks = () => {
      const mockDocument = {
        uri: {
          fsPath: '/mock/workspace/output/my-deck/plan.yaml',
          path: '/mock/workspace/output/my-deck/plan.yaml',
          toString: () => '/mock/workspace/output/my-deck/plan.yaml',
        },
        getText: () => '',
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = { postMessage: vi.fn() };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      return { mockDocument, mockWebview };
    };

    it('should read plan.yaml and include pending count context in command (AC-1, AC-3)', async () => {
      const { mockDocument, mockWebview } = createBuildAllMocks();

      // Mock plan.yaml read with mixed statuses (3 built, 3 pending)
      vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode(planYamlWithMixedStatuses)
      );

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      // AC-2: sendToClaudeCode should be called
      expect(sendToClaudeCode).toHaveBeenCalled();

      // AC-3: Command should include pending count context
      const commandArg = vi.mocked(sendToClaudeCode).mock.calls[0][0];
      expect(commandArg).toContain('Context: 3 of 6 slides are pending.');
      expect(commandArg).toContain('/sb-create:build-all --deck');
    });

    it('should log pre-check result with pending/total counts (AC-8)', async () => {
      const { mockDocument, mockWebview } = createBuildAllMocks();

      vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode(planYamlWithMixedStatuses)
      );

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      // AC-8: Pre-check log
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[BuildAll] Pre-check: 3/6 slides pending'
      );

      // AC-8: Triggering log
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[BuildAll] Triggering build for 3 pending slides'
      );
    });

    it('should invoke sendToClaudeCode even when pre-check fails (fail-open)', async () => {
      const { mockDocument, mockWebview } = createBuildAllMocks();

      // Mock readFile to throw an error
      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(
        new Error('ENOENT: file not found')
      );

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      // Should still call sendToClaudeCode (fail-open)
      expect(sendToClaudeCode).toHaveBeenCalled();

      // Should log the pre-check failure
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[BuildAll] Pre-check failed:')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('ENOENT')
      );

      // Command should NOT have pending context (failed pre-check)
      const commandArg = vi.mocked(sendToClaudeCode).mock.calls[0][0];
      expect(commandArg).not.toContain('Context:');
    });

    it('should handle plan.yaml with all slides built (zero pending) - short-circuit with info message (BR-2.2 AC-9, AC-10)', async () => {
      const allBuiltYaml = `deck_name: Test Deck
slides:
  - number: 1
    status: built
  - number: 2
    status: built
`;

      const { mockDocument, mockWebview } = createBuildAllMocks();

      vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode(allBuiltYaml)
      );

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      // Should log 0 pending
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[BuildAll] Pre-check: 0/2 slides pending'
      );

      // BR-2.2 AC-9: Should show information message with slide count
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'All 2 slides already built'
      );

      // BR-2.2 AC-10: Should NOT call sendToClaudeCode
      expect(sendToClaudeCode).not.toHaveBeenCalled();

      // BR-2.2: Should log short-circuit
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[BuildAll] All slides built, skipping Claude Code invocation'
      );
    });

    it('should handle plan.yaml with no slides array - short-circuit with info message (BR-2.2 AC-9, edge case)', async () => {
      const noSlidesYaml = `deck_name: Test Deck
`;

      const { mockDocument, mockWebview } = createBuildAllMocks();

      vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode(noSlidesYaml)
      );

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      // Should log 0/0 pending
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        '[BuildAll] Pre-check: 0/0 slides pending'
      );

      // BR-2.2 AC-9: Should show info message for 0 slides
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'All 0 slides already built'
      );

      // BR-2.2 AC-10: Should NOT call sendToClaudeCode
      expect(sendToClaudeCode).not.toHaveBeenCalled();
    });

    it('should show correct count for single built slide (BR-2.2 edge case)', async () => {
      const singleBuiltYaml = `deck_name: Test Deck
slides:
  - number: 1
    status: built
`;

      const { mockDocument, mockWebview } = createBuildAllMocks();

      vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode(singleBuiltYaml)
      );

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      // BR-2.2 AC-9: Message includes correct count
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'All 1 slides already built'
      );

      // BR-2.2 AC-10: No Claude Code session
      expect(sendToClaudeCode).not.toHaveBeenCalled();
    });

    it('should use showInformationMessage, not showWarningMessage or showErrorMessage (BR-2.2 AC-11)', async () => {
      const allBuiltYaml = `deck_name: Test Deck
slides:
  - number: 1
    status: built
  - number: 2
    status: built
  - number: 3
    status: built
`;

      const { mockDocument, mockWebview } = createBuildAllMocks();

      vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode(allBuiltYaml)
      );

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      // BR-2.2 AC-11: Must use showInformationMessage (non-blocking)
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'All 3 slides already built'
      );

      // AC-11: Must NOT use showWarningMessage or showErrorMessage
      expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
      expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
    });

    it('should fail-open when plan.yaml is malformed YAML (BR-2.2 AC-16, edge case)', async () => {
      const malformedYaml = `{{{not valid yaml: [`;

      const { mockDocument, mockWebview } = createBuildAllMocks();

      vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode(malformedYaml)
      );

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      // Should fail-open: still call sendToClaudeCode
      expect(sendToClaudeCode).toHaveBeenCalled();

      // Should log the pre-check failure
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[BuildAll] Pre-check failed:')
      );
    });
  });

  // ===========================================================================
  // Story 1.2: Close Plan.yaml Tab on Build All / Build Slide
  // ===========================================================================

  describe('handleMessage - build-all tab close (story-1.2)', () => {
    const createBuildAllTabCloseMocks = () => {
      const documentUri = '/mock/workspace/.slide-builder/decks/my-deck/plan.yaml';
      const mockDocument = {
        uri: {
          fsPath: documentUri,
          path: documentUri,
          toString: () => documentUri,
        },
        getText: () => '',
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = { postMessage: vi.fn() };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      // Mock plan.yaml read with pending slides so build proceeds
      vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
        new TextEncoder().encode('deck_name: Test\nslides:\n  - number: 1\n    status: pending\n')
      );

      return { mockDocument, mockWebview, documentUri };
    };

    it('should call tabGroups.close with matching tab when Build All is triggered (AC-1, AC-5)', async () => {
      const { mockDocument, mockWebview, documentUri } = createBuildAllTabCloseMocks();

      // Set up a matching tab in tabGroups
      const matchingTab = {
        input: new vscode.TabInputCustom({ toString: () => documentUri }),
      };
      vscode.window.tabGroups.all = [{ tabs: [matchingTab] }];

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      expect(vscode.window.tabGroups.close).toHaveBeenCalledWith(matchingTab);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('[BuildAll] Closed plan.yaml editor tab');
    });

    it('should not error when no matching tab is found (AC-4)', async () => {
      const { mockDocument, mockWebview } = createBuildAllTabCloseMocks();

      // No matching tabs
      vscode.window.tabGroups.all = [{ tabs: [] }];

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      // Should not call close
      expect(vscode.window.tabGroups.close).not.toHaveBeenCalled();
      // Build should still proceed
      expect(sendToClaudeCode).toHaveBeenCalled();
    });

    it('should not block sendToClaudeCode when tab close fails (AC-3)', async () => {
      const { mockDocument, mockWebview, documentUri } = createBuildAllTabCloseMocks();

      const matchingTab = {
        input: new vscode.TabInputCustom({ toString: () => documentUri }),
      };
      vscode.window.tabGroups.all = [{ tabs: [matchingTab] }];

      // Make close throw
      vi.mocked(vscode.window.tabGroups.close).mockRejectedValueOnce(new Error('Tab API error'));

      await handler.handleMessage(
        { type: 'build-all' },
        mockWebview as any,
        mockDocument as any
      );

      // Build should still proceed despite tab close failure
      expect(sendToClaudeCode).toHaveBeenCalled();
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[BuildAll] Tab close failed (non-blocking)')
      );
    });
  });

  describe('handleMessage - build-slide tab close (story-1.2)', () => {
    it('should call tabGroups.close with matching tab when Build Slide is triggered (AC-2, AC-5)', async () => {
      const documentUri = '/mock/workspace/.slide-builder/decks/my-deck/plan.yaml';
      const mockDocument = {
        uri: {
          fsPath: documentUri,
          path: documentUri,
          toString: () => documentUri,
        },
        getText: () => '',
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = { postMessage: vi.fn() };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        uri: { fsPath: '/mock/workspace', toString: () => '/mock/workspace' },
        name: 'mock-workspace',
        index: 0,
      } as any);

      const matchingTab = {
        input: new vscode.TabInputCustom({ toString: () => documentUri }),
      };
      vscode.window.tabGroups.all = [{ tabs: [matchingTab] }];

      await handler.handleMessage(
        { type: 'build-slide', slideNumber: 3 },
        mockWebview as any,
        mockDocument as any
      );

      expect(vscode.window.tabGroups.close).toHaveBeenCalledWith(matchingTab);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('[PlanEditor] Closed plan.yaml editor tab');
      // Build should also proceed
      expect(sendToClaudeCode).toHaveBeenCalled();
    });
  });

  describe('handleMessage - delete-slide', () => {
    it('should renumber remaining slides after deletion (AC-21.1.10)', async () => {
      const yamlContent = `slides:
  - number: 1
    description: First
    status: pending
    storyline_role: detail
    key_points: []
  - number: 2
    description: Second
    status: pending
    storyline_role: detail
    key_points: []
  - number: 3
    description: Third
    status: pending
    storyline_role: detail
    key_points: []
`;

      const mockDocument = {
        uri: { fsPath: '/mock/plan.yaml', toString: () => '/mock/plan.yaml' },
        getText: () => yamlContent,
        positionAt: (offset: number) => ({ line: 0, character: offset }),
      };

      const mockWebview = { postMessage: vi.fn() };

      let capturedContent = '';
      vi.mocked(vscode.workspace.applyEdit).mockImplementation(async (edit: any) => {
        const entries = edit.entries();
        if (entries.length > 0 && entries[0][1].length > 0) {
          capturedContent = entries[0][1][0].newText;
        }
        return true;
      });

      // Delete middle slide (slide 2)
      await handler.handleMessage(
        { type: 'delete-slide', slideNumber: 2 },
        mockWebview as any,
        mockDocument as any
      );

      // Should have 2 slides, renumbered 1 and 2
      const numberMatches = capturedContent.match(/number: \d+/g) ?? [];
      expect(numberMatches).toEqual(['number: 1', 'number: 2']);
      expect(capturedContent).toContain('description: First');
      expect(capturedContent).toContain('description: Third');
      expect(capturedContent).not.toContain('description: Second');
    });
  });
});
