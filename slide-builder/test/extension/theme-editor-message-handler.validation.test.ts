/**
 * Integration tests for save validation behavior in theme-editor-message-handler.
 *
 * Story Reference: BT-4.5 Task 5 — AC-25, AC-26, AC-27
 * Tests that validateThemeJson() is called before saveThemeData() in the
 * theme-editor-save message handler, blocking saves on errors and allowing
 * saves with warnings.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspace } from 'vscode';
import { createThemeEditorMessageHandler } from '../../src/extension/theme-editor-message-handler';

// Helper: create a valid theme object
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

// Helper: create an invalid theme (missing required fields)
function createInvalidTheme(): Record<string, unknown> {
  return {
    version: '1.0.0',
    // Missing: name, colors.primary, colors.secondary, colors.accent
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
      },
      text: {
        heading: '#111111',
        body: '#222222',
      },
    },
    typography: {
      fonts: {
        heading: 'Arial',
        body: 'Helvetica',
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

function createMockPanel() {
  return {
    saveThemeData: vi.fn().mockResolvedValue({ success: true }),
    loadThemeData: vi.fn(),
    updateTitle: vi.fn(),
    setIsDirty: vi.fn(),
  };
}

describe('theme-editor-message-handler save validation (BT-4.5 Task 5)', () => {
  let mockWebview: ReturnType<typeof createMockWebview>;
  let mockPanel: ReturnType<typeof createMockPanel>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebview = createMockWebview();
    mockPanel = createMockPanel();
  });

  function setupHandler() {
    createThemeEditorMessageHandler(
      mockWebview as any,
      mockOutputChannel,
      mockPanel as any,
    );
  }

  it('should block save when theme has missing required fields (AC-25)', async () => {
    setupHandler();
    const invalidTheme = createInvalidTheme();

    mockWebview._simulateMessage({
      type: 'theme-editor-save',
      theme: invalidTheme,
    });

    // Give the async handler time to complete
    await vi.waitFor(() => {
      expect(mockWebview.postMessage).toHaveBeenCalled();
    });

    // saveThemeData should NOT have been called
    expect(mockPanel.saveThemeData).not.toHaveBeenCalled();

    // Should have sent error result to webview
    const postMessageCalls = mockWebview.postMessage.mock.calls;
    const saveResultMessage = postMessageCalls.find(
      (call: any[]) => call[0]?.type === 'theme-editor-save-result',
    );
    expect(saveResultMessage).toBeDefined();
    expect(saveResultMessage![0].success).toBe(false);
    expect(saveResultMessage![0].error).toContain('Cannot save: missing required fields:');
  });

  it('should log save blocked message to output channel (AC-25)', async () => {
    setupHandler();
    const invalidTheme = createInvalidTheme();

    mockWebview._simulateMessage({
      type: 'theme-editor-save',
      theme: invalidTheme,
    });

    await vi.waitFor(() => {
      const calls = mockOutputChannel.appendLine.mock.calls.map((c: any[]) => c[0]);
      expect(calls.some((msg: string) => msg.includes('Save blocked: validation failed'))).toBe(true);
    });
  });

  it('should allow save when theme has only warnings (AC-26, AC-27)', async () => {
    setupHandler();
    const warningTheme = createWarningOnlyTheme();

    mockWebview._simulateMessage({
      type: 'theme-editor-save',
      theme: warningTheme,
    });

    await vi.waitFor(() => {
      expect(mockPanel.saveThemeData).toHaveBeenCalled();
    });

    // saveThemeData should have been called with the theme
    expect(mockPanel.saveThemeData).toHaveBeenCalledWith(warningTheme);

    // Output channel should have warning logs
    const appendLineCalls = mockOutputChannel.appendLine.mock.calls.map((c: any[]) => c[0]);
    const warningLog = appendLineCalls.find((msg: string) =>
      msg.includes('[ThemeEditor] Validation warnings:'),
    );
    expect(warningLog).toBeDefined();
  });

  it('should allow save when theme is fully valid with no extra logging (AC-26)', async () => {
    setupHandler();
    const validTheme = createValidTheme();

    mockWebview._simulateMessage({
      type: 'theme-editor-save',
      theme: validTheme,
    });

    await vi.waitFor(() => {
      expect(mockPanel.saveThemeData).toHaveBeenCalled();
    });

    // saveThemeData should have been called
    expect(mockPanel.saveThemeData).toHaveBeenCalledWith(validTheme);

    // No validation warning logs
    const appendLineCalls = mockOutputChannel.appendLine.mock.calls.map((c: any[]) => c[0]);
    const validationWarningLog = appendLineCalls.find((msg: string) =>
      msg.includes('Validation warnings:'),
    );
    expect(validationWarningLog).toBeUndefined();

    // No save blocked log
    const saveBlockedLog = appendLineCalls.find((msg: string) =>
      msg.includes('Save blocked'),
    );
    expect(saveBlockedLog).toBeUndefined();
  });

  it('should include specific missing field names in error message (AC-25)', async () => {
    setupHandler();
    const invalidTheme = createInvalidTheme();

    mockWebview._simulateMessage({
      type: 'theme-editor-save',
      theme: invalidTheme,
    });

    await vi.waitFor(() => {
      expect(mockWebview.postMessage).toHaveBeenCalled();
    });

    const postMessageCalls = mockWebview.postMessage.mock.calls;
    const saveResultMessage = postMessageCalls.find(
      (call: any[]) => call[0]?.type === 'theme-editor-save-result',
    );
    expect(saveResultMessage).toBeDefined();
    // Error message should list specific missing fields
    expect(saveResultMessage![0].error).toContain('name');
    expect(saveResultMessage![0].error).toContain('colors.primary');
  });
});
