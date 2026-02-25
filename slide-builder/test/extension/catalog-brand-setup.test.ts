/**
 * Tests for brand-setup CLI integration in catalog-message-handler.
 *
 * Story Reference: bt-1-3 AC-7 (CLI command formatting & dispatch),
 *                  AC-escape (string escaping),
 *                  AC-logging (observability)
 *
 * Tests cover:
 * - escapeBrandCliArg utility (AC-escape)
 * - formatBrandSetupCommand utility (AC-7)
 * - submit-operation-form brand-setup handler integration (AC-7, AC-logging)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { window, workspace, Uri } from 'vscode';
import {
  createCatalogMessageHandler,
  escapeBrandCliArg,
  formatBrandSetupCommand,
} from '../../src/extension/catalog-message-handler';

// Mock claude-code-integration so sendToClaudeCode doesn't actually open VS Code
vi.mock('../../src/extension/claude-code-integration', () => ({
  sendToClaudeCode: vi.fn().mockResolvedValue(undefined),
}));

// Mock extension module to provide configService
vi.mock('../../src/extension/extension', () => ({
  configService: {
    readSettings: vi.fn().mockReturnValue({
      claudeCode: {
        launchMode: 'extension',
        position: 'sidebar',
      },
    }),
  },
}));

// Mock SlideViewerV2Panel
vi.mock('../../src/extension/SlideViewerV2Panel', () => ({
  SlideViewerV2Panel: {
    createOrShow: vi.fn(),
    postMessage: vi.fn(),
    hasPanel: vi.fn().mockReturnValue(false),
  },
}));

// Mock DeckTemplateEditorPanel
vi.mock('../../src/extension/DeckTemplateEditorPanel', () => ({
  DeckTemplateEditorPanel: {
    createOrShow: vi.fn(),
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

// ============================================================================
// Unit tests for escapeBrandCliArg (AC-escape)
// ============================================================================
describe('escapeBrandCliArg (bt-1-3 AC-escape)', () => {
  it('trims whitespace from input', () => {
    expect(escapeBrandCliArg('  hello  ')).toBe('hello');
  });

  it('escapes embedded double quotes', () => {
    expect(escapeBrandCliArg('Company "Best" Inc')).toBe('Company \\"Best\\" Inc');
  });

  it('escapes backslashes', () => {
    expect(escapeBrandCliArg('C:\\Users\\brand')).toBe('C:\\\\Users\\\\brand');
  });

  it('strips newlines by default', () => {
    expect(escapeBrandCliArg('line1\nline2\r\nline3')).toBe('line1 line2 line3');
  });

  it('preserves newlines when stripNewlines is false', () => {
    expect(escapeBrandCliArg('line1\nline2', false)).toBe('line1\nline2');
  });

  it('handles folder path with spaces', () => {
    expect(escapeBrandCliArg('/Users/john/My Brand Assets')).toBe('/Users/john/My Brand Assets');
  });

  it('handles empty string', () => {
    expect(escapeBrandCliArg('')).toBe('');
  });

  it('handles string with only whitespace', () => {
    expect(escapeBrandCliArg('   ')).toBe('');
  });

  it('escapes quotes and backslashes together', () => {
    expect(escapeBrandCliArg('path\\"quoted"')).toBe('path\\\\\\"quoted\\"');
  });
});

// ============================================================================
// Unit tests for formatBrandSetupCommand (AC-7)
// ============================================================================
describe('formatBrandSetupCommand (bt-1-3 AC-7)', () => {
  it('formats command with all three fields provided (5.1)', () => {
    const result = formatBrandSetupCommand({
      assetFolder: '/Users/john/brand-assets',
      companyName: 'Acme Corp',
      brandDescription: 'A technology company',
    });
    expect(result).toBe(
      '/sb-brand:setup --folder "/Users/john/brand-assets" --company "Acme Corp" --description "A technology company"'
    );
  });

  it('formats command with only required folder field (5.2)', () => {
    const result = formatBrandSetupCommand({
      assetFolder: '/Users/john/brand-assets',
    });
    expect(result).toBe('/sb-brand:setup --folder "/Users/john/brand-assets"');
  });

  it('omits --company when companyName is empty string (5.6)', () => {
    const result = formatBrandSetupCommand({
      assetFolder: '/path/to/assets',
      companyName: '',
    });
    expect(result).toBe('/sb-brand:setup --folder "/path/to/assets"');
  });

  it('omits --company when companyName is only whitespace (5.6)', () => {
    const result = formatBrandSetupCommand({
      assetFolder: '/path/to/assets',
      companyName: '   ',
    });
    expect(result).toBe('/sb-brand:setup --folder "/path/to/assets"');
  });

  it('omits --description when brandDescription is undefined (5.6)', () => {
    const result = formatBrandSetupCommand({
      assetFolder: '/path/to/assets',
      companyName: 'Test Co',
      brandDescription: undefined,
    });
    expect(result).toBe('/sb-brand:setup --folder "/path/to/assets" --company "Test Co"');
  });

  it('escapes folder path with spaces (5.3)', () => {
    const result = formatBrandSetupCommand({
      assetFolder: '/Users/john/My Brand Assets',
    });
    expect(result).toBe('/sb-brand:setup --folder "/Users/john/My Brand Assets"');
  });

  it('escapes company name with double quotes (5.4)', () => {
    const result = formatBrandSetupCommand({
      assetFolder: '/assets',
      companyName: 'Company "Best" Inc',
    });
    expect(result).toBe('/sb-brand:setup --folder "/assets" --company "Company \\"Best\\" Inc"');
  });

  it('strips newlines from description (5.5)', () => {
    const result = formatBrandSetupCommand({
      assetFolder: '/assets',
      brandDescription: 'Line one\nLine two\nLine three',
    });
    expect(result).toBe('/sb-brand:setup --folder "/assets" --description "Line one Line two Line three"');
  });

  it('escapes backslashes in Windows folder path', () => {
    const result = formatBrandSetupCommand({
      assetFolder: 'C:\\Users\\john\\brand assets',
    });
    expect(result).toBe('/sb-brand:setup --folder "C:\\\\Users\\\\john\\\\brand assets"');
  });
});

// ============================================================================
// Integration tests for brand-setup submit-operation-form handler (AC-7, AC-logging)
// ============================================================================
describe('submit-operation-form brand-setup handler (bt-1-3)', () => {
  let mockWebview: ReturnType<typeof createMockWebview>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebview = createMockWebview();

    createCatalogMessageHandler(
      mockWebview as any,
      createMockDataService(),
      createMockFileWatcher(),
      mockOutputChannel,
      undefined,
      workspaceRoot
    );
  });

  it('dispatches correctly formatted CLI command to sendToClaudeCode (AC-7)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'brand-setup',
      data: {
        assetFolder: '/Users/john/brand-assets',
        companyName: 'Acme Corp',
        brandDescription: 'A tech company',
      },
    });

    expect(vi.mocked(sendToClaudeCode)).toHaveBeenCalledOnce();
    const [command] = vi.mocked(sendToClaudeCode).mock.calls[0];
    expect(command).toBe(
      '/sb-brand:setup --folder "/Users/john/brand-assets" --company "Acme Corp" --description "A tech company"'
    );
  });

  it('passes configService settings to sendToClaudeCode (AC-7b)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'brand-setup',
      data: { assetFolder: '/assets' },
    });

    expect(vi.mocked(sendToClaudeCode)).toHaveBeenCalledWith(
      expect.any(String),
      mockOutputChannel,
      workspaceRoot,
      { launchMode: 'extension', position: 'sidebar' }
    );
  });

  it('sends form-submitted-ack with success: true on success (AC-7c)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'brand-setup',
      data: { assetFolder: '/assets' },
    });

    expect(mockWebview.postMessage).toHaveBeenCalledWith({
      type: 'form-submitted-ack',
      operationId: 'brand-setup',
      success: true,
    });
  });

  it('shows VSCode information message on success (AC-7d)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'brand-setup',
      data: { assetFolder: '/assets' },
    });

    expect(window.showInformationMessage).toHaveBeenCalledWith(
      'Brand setup started -- paste the command into Claude Code to begin'
    );
  });

  it('logs form receipt with [Brand] prefix (AC-logging 2.1)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'brand-setup',
      data: {
        assetFolder: '/path/to/brand',
        companyName: 'Test Co',
      },
    });

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/\[Brand\] Brand setup form submitted: folder=\/path\/to\/brand, company=Test Co/)
    );
  });

  it('logs formatted command with [Brand] prefix (AC-logging 2.2)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'brand-setup',
      data: { assetFolder: '/my/assets' },
    });

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/\[Brand\] Sending to Claude Code: \/sb-brand:setup --folder "\/my\/assets"/)
    );
  });

  it('logs success with [Brand] prefix (AC-logging 2.3)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'brand-setup',
      data: { assetFolder: '/assets' },
    });

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      '[Brand] Brand setup dispatched to Claude Code'
    );
  });

  it('logs error and shows error message on sendToClaudeCode failure (AC-logging 2.4, Task 1.8)', async () => {
    vi.mocked(sendToClaudeCode).mockRejectedValueOnce(new Error('Claude Code not available'));

    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'brand-setup',
      data: { assetFolder: '/assets' },
    });

    // Error logged with [Brand] prefix
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/\[Brand\] Error dispatching brand setup:.*Claude Code not available/)
    );

    // Error message shown to user
    expect(window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('Brand setup failed')
    );

    // Failure ack sent to webview
    expect(mockWebview.postMessage).toHaveBeenCalledWith({
      type: 'form-submitted-ack',
      operationId: 'brand-setup',
      success: false,
      error: expect.stringContaining('Claude Code not available'),
    });
  });

  it('formats command with only folder when optional fields are absent', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'brand-setup',
      data: { assetFolder: '/assets' },
    });

    const [command] = vi.mocked(sendToClaudeCode).mock.calls[0];
    expect(command).toBe('/sb-brand:setup --folder "/assets"');
    // No --company or --description flags
    expect(command).not.toContain('--company');
    expect(command).not.toContain('--description');
  });

  it('properly escapes special characters in form data (AC-escape)', async () => {
    await mockWebview._simulateMessage({
      type: 'submit-operation-form',
      operation: 'brand-setup',
      data: {
        assetFolder: '/Users/john/My "Brand" Assets',
        companyName: 'O\'Brien & Sons "Ltd"',
        brandDescription: 'Multi\nline\ndescription',
      },
    });

    const [command] = vi.mocked(sendToClaudeCode).mock.calls[0];
    // Folder path quotes escaped
    expect(command).toContain('--folder "/Users/john/My \\"Brand\\" Assets"');
    // Company quotes escaped
    expect(command).toContain('--company "O\'Brien & Sons \\"Ltd\\""');
    // Description newlines stripped
    expect(command).toContain('--description "Multi line description"');
  });
});
