/**
 * Integration tests for load validation behavior in ThemeEditorPanel.
 *
 * Story Reference: BT-4.5 Task 4 — AC-24, AC-27
 * Tests that validateThemeJson() is called after JSON.parse in loadThemeData()
 * and handleExternalThemeChange(), with correct behavior for errors/warnings/valid themes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { window, workspace, Uri } from 'vscode';
import { ThemeEditorPanel } from '../../src/extension/ThemeEditorPanel';

// Helper: create a valid theme object that passes all required field checks
function createValidTheme(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Test Theme',
    version: '1.0.0',
    colors: {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
      background: {
        default: '#ffffff',
        alt: '#f0f0f0',
        dark: '#333333',
      },
      text: {
        heading: '#111111',
        body: '#222222',
        onDark: '#ffffff',
      },
      semantic: { success: '#00ff00' },
      dataViz: { palette: ['#ff0000'] },
      brand: { main: '#ff0000' },
    },
    typography: {
      fonts: {
        heading: 'Arial',
        body: 'Helvetica',
        mono: 'Courier',
      },
      scale: { body: '1rem', h1: '2rem' },
      weights: { regular: 400, bold: 700 },
    },
    shapes: {
      borderRadius: { medium: '8px' },
      shadow: { medium: '0 2px 4px rgba(0,0,0,0.1)' },
      border: { thin: '1px solid #e5e5e5' },
    },
    components: {},
    personality: { classification: 'modern' },
    meta: { brandDescription: 'Test' },
    brandContext: { voice: 'Professional' },
    ...overrides,
  };
}

// Helper: create a theme missing required fields
function createInvalidTheme(): Record<string, unknown> {
  return {
    version: '1.0.0',
    // Missing: name, colors.primary, colors.secondary, colors.accent, etc.
    colors: {
      background: { default: '#ffffff', alt: '#f0f0f0' },
      text: { heading: '#111111', body: '#222222' },
    },
    typography: {
      fonts: { heading: 'Arial', body: 'Helvetica' },
      scale: { body: '1rem' },
      weights: { regular: 400 },
    },
    shapes: {
      borderRadius: { medium: '8px' },
      shadow: { medium: '0 2px 4px rgba(0,0,0,0.1)' },
      border: { thin: '1px solid #e5e5e5' },
    },
    components: {},
  };
}

// Helper: create a theme with only optional fields missing (warnings only)
function createWarningOnlyTheme(): Record<string, unknown> {
  return {
    name: 'Test Theme',
    version: '1.0.0',
    colors: {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
      background: {
        default: '#ffffff',
        alt: '#f0f0f0',
        // Missing: dark (optional)
      },
      text: {
        heading: '#111111',
        body: '#222222',
        // Missing: onDark (optional)
      },
      // Missing: semantic, dataViz, brand (optional)
    },
    typography: {
      fonts: {
        heading: 'Arial',
        body: 'Helvetica',
        // Missing: mono (optional)
      },
      scale: { body: '1rem' },
      weights: { regular: 400 },
    },
    shapes: {
      borderRadius: { medium: '8px' },
      shadow: { medium: '0 2px 4px rgba(0,0,0,0.1)' },
      border: { thin: '1px solid #e5e5e5' },
    },
    components: {},
    // Missing: personality, meta, brandContext (optional)
  };
}

const mockOutputChannel = {
  appendLine: vi.fn(),
  append: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn(),
  name: 'Test Channel',
} as any;

const mockExtensionUri = {
  fsPath: '/mock/extension',
  toString: () => '/mock/extension',
};

const mockWorkspaceUri = {
  fsPath: '/mock/workspace',
  toString: () => '/mock/workspace',
};

describe('ThemeEditorPanel validation on load (BT-4.5 Task 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the singleton
    (ThemeEditorPanel as any).instance = undefined;
  });

  /**
   * Helper to create panel and capture the webview mock
   */
  function createPanel() {
    ThemeEditorPanel.createOrShow(
      mockExtensionUri as any,
      mockOutputChannel,
      mockWorkspaceUri as any,
    );
    const instance = (ThemeEditorPanel as any).instance;
    return instance;
  }

  it('should show showWarningMessage when theme has missing required fields (AC-24)', async () => {
    const invalidTheme = createInvalidTheme();
    const themeJson = JSON.stringify(invalidTheme);
    (workspace.fs.readFile as any).mockResolvedValue(new TextEncoder().encode(themeJson));

    const panel = createPanel();
    await panel.loadThemeData();

    // Verify showWarningMessage was called
    expect(window.showWarningMessage).toHaveBeenCalled();
    const warningCall = (window.showWarningMessage as any).mock.calls[0][0];
    expect(warningCall).toContain('Theme validation:');
    expect(warningCall).toContain('missing required field');
  });

  it('should send default-filled theme when errors exist (AC-24)', async () => {
    const invalidTheme = createInvalidTheme();
    const themeJson = JSON.stringify(invalidTheme);
    (workspace.fs.readFile as any).mockResolvedValue(new TextEncoder().encode(themeJson));

    const panel = createPanel();
    await panel.loadThemeData();

    // Get the postMessage call for theme-editor-data
    const webview = panel.panel?.webview || (panel as any).panel.webview;
    const postMessageCalls = webview.postMessage.mock.calls;
    const themeDataMessage = postMessageCalls.find(
      (call: any[]) => call[0]?.type === 'theme-editor-data' && call[0]?.exists === true,
    );

    expect(themeDataMessage).toBeDefined();
    const sentTheme = themeDataMessage![0].theme;

    // The sent theme should have defaults filled (e.g., name should be 'Untitled')
    expect(sentTheme.name).toBe('Untitled');
    // Primary should be defaulted to '#000000'
    expect(sentTheme.colors.primary).toBe('#000000');
  });

  it('should not show showWarningMessage when theme has only warnings (AC-27)', async () => {
    const warningTheme = createWarningOnlyTheme();
    const themeJson = JSON.stringify(warningTheme);
    (workspace.fs.readFile as any).mockResolvedValue(new TextEncoder().encode(themeJson));

    const panel = createPanel();
    await panel.loadThemeData();

    // showWarningMessage should NOT be called (warnings only go to output channel)
    expect(window.showWarningMessage).not.toHaveBeenCalled();

    // Output channel should have warning logs
    const appendLineCalls = mockOutputChannel.appendLine.mock.calls.map((c: any[]) => c[0]);
    const warningLog = appendLineCalls.find((msg: string) =>
      msg.includes('[ThemeEditor] Validation warnings:'),
    );
    expect(warningLog).toBeDefined();
  });

  it('should send original theme (not default-filled) when only warnings (AC-27)', async () => {
    const warningTheme = createWarningOnlyTheme();
    const themeJson = JSON.stringify(warningTheme);
    (workspace.fs.readFile as any).mockResolvedValue(new TextEncoder().encode(themeJson));

    const panel = createPanel();
    await panel.loadThemeData();

    const webview = panel.panel?.webview || (panel as any).panel.webview;
    const postMessageCalls = webview.postMessage.mock.calls;
    const themeDataMessage = postMessageCalls.find(
      (call: any[]) => call[0]?.type === 'theme-editor-data' && call[0]?.exists === true,
    );

    expect(themeDataMessage).toBeDefined();
    const sentTheme = themeDataMessage![0].theme;
    // Should be the original theme, not default-filled
    expect(sentTheme.name).toBe('Test Theme');
  });

  it('should not show warning or log when theme is fully valid (AC-24)', async () => {
    const validTheme = createValidTheme();
    const themeJson = JSON.stringify(validTheme);
    (workspace.fs.readFile as any).mockResolvedValue(new TextEncoder().encode(themeJson));

    const panel = createPanel();
    await panel.loadThemeData();

    // No warning notification
    expect(window.showWarningMessage).not.toHaveBeenCalled();

    // No validation warning logs (only the normal "Theme loaded" log)
    const appendLineCalls = mockOutputChannel.appendLine.mock.calls.map((c: any[]) => c[0]);
    const validationLog = appendLineCalls.find(
      (msg: string) =>
        msg.includes('Validation warnings:') || msg.includes('Validation errors:'),
    );
    expect(validationLog).toBeUndefined();
  });

  it('should send original theme as-is when fully valid', async () => {
    const validTheme = createValidTheme();
    const themeJson = JSON.stringify(validTheme);
    (workspace.fs.readFile as any).mockResolvedValue(new TextEncoder().encode(themeJson));

    const panel = createPanel();
    await panel.loadThemeData();

    const webview = panel.panel?.webview || (panel as any).panel.webview;
    const postMessageCalls = webview.postMessage.mock.calls;
    const themeDataMessage = postMessageCalls.find(
      (call: any[]) => call[0]?.type === 'theme-editor-data' && call[0]?.exists === true,
    );

    expect(themeDataMessage).toBeDefined();
    const sentTheme = themeDataMessage![0].theme;
    expect(sentTheme.name).toBe('Test Theme');
    expect(sentTheme.colors.primary).toBe('#ff0000');
  });

  it('should show at most 3 errors in the warning message', async () => {
    // Create a theme missing many required fields
    const bareTheme = { version: '1.0.0' };
    const themeJson = JSON.stringify(bareTheme);
    (workspace.fs.readFile as any).mockResolvedValue(new TextEncoder().encode(themeJson));

    const panel = createPanel();
    await panel.loadThemeData();

    expect(window.showWarningMessage).toHaveBeenCalled();
    const warningCall = (window.showWarningMessage as any).mock.calls[0][0];

    // Should contain '...' indicating truncation since there are many more than 3 errors
    expect(warningCall).toContain('...');
  });

  it('should log full error list to output channel', async () => {
    const bareTheme = { version: '1.0.0' };
    const themeJson = JSON.stringify(bareTheme);
    (workspace.fs.readFile as any).mockResolvedValue(new TextEncoder().encode(themeJson));

    const panel = createPanel();
    await panel.loadThemeData();

    const appendLineCalls = mockOutputChannel.appendLine.mock.calls.map((c: any[]) => c[0]);
    const errorsLog = appendLineCalls.find((msg: string) =>
      msg.includes('[ThemeEditor] Validation errors:'),
    );
    expect(errorsLog).toBeDefined();
    // Should list more than 3 errors (all of them)
    expect(errorsLog).toContain('Missing required field: name');
  });
});
