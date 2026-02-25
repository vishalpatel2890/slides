import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { CatalogViewProvider } from '../../src/extension/CatalogViewProvider';

describe('CatalogViewProvider', () => {
  let provider: CatalogViewProvider;
  let mockOutputChannel: vscode.OutputChannel;
  let mockExtensionUri: vscode.Uri;

  beforeEach(() => {
    mockOutputChannel = {
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    } as unknown as vscode.OutputChannel;

    mockExtensionUri = vscode.Uri.file('/test/extension');
    const mockWorkspaceUri = vscode.Uri.file('/test/workspace');
    const mockDataService = {
      scanDecks: vi.fn().mockResolvedValue([]),
      scanDecksWithFolders: vi.fn().mockResolvedValue({ decks: [], folders: [] }),
      scanBrandAssets: vi.fn().mockResolvedValue([]),
      getDeckDetail: vi.fn().mockResolvedValue(null),
      getDeckPath: vi.fn(),
      dispose: vi.fn(),
    } as any;
    const mockFileWatcher = {
      onDecksChanged: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onBrandAssetsChanged: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onTemplateFilesChanged: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      dispose: vi.fn(),
    } as any;
    provider = new CatalogViewProvider(
      mockExtensionUri,
      mockWorkspaceUri,
      mockOutputChannel,
      mockDataService,
      mockFileWatcher
    );
  });

  it('has correct view type', () => {
    expect(CatalogViewProvider.viewType).toBe('slideBuilder.catalogView');
  });

  describe('resolveWebviewView', () => {
    let mockWebviewView: vscode.WebviewView;
    let mockWebview: vscode.Webview;
    let capturedHtml: string;

    beforeEach(() => {
      mockWebview = {
        options: {},
        cspSource: 'https://test.vscode-cdn.net',
        asWebviewUri: vi.fn((uri: vscode.Uri) => uri),
        onDidReceiveMessage: vi.fn(),
        postMessage: vi.fn(),
        set html(value: string) {
          capturedHtml = value;
        },
        get html() {
          return capturedHtml;
        },
      } as unknown as vscode.Webview;

      mockWebviewView = {
        webview: mockWebview,
        onDidDispose: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      } as unknown as vscode.WebviewView;

      capturedHtml = '';
    });

    it('enables scripts on webview', () => {
      provider.resolveWebviewView(
        mockWebviewView,
        {} as vscode.WebviewViewResolveContext,
        { isCancellationRequested: false, onCancellationRequested: vi.fn() } as unknown as vscode.CancellationToken
      );

      expect(mockWebview.options.enableScripts).toBe(true);
    });

    it('sets localResourceRoots to dist, .slide-builder, and output directories (AC-8)', () => {
      provider.resolveWebviewView(
        mockWebviewView,
        {} as vscode.WebviewViewResolveContext,
        { isCancellationRequested: false, onCancellationRequested: vi.fn() } as unknown as vscode.CancellationToken
      );

      expect(mockWebview.options.localResourceRoots).toBeDefined();
      expect(mockWebview.options.localResourceRoots).toHaveLength(3);
    });

    it('generates HTML with Content Security Policy', () => {
      provider.resolveWebviewView(
        mockWebviewView,
        {} as vscode.WebviewViewResolveContext,
        { isCancellationRequested: false, onCancellationRequested: vi.fn() } as unknown as vscode.CancellationToken
      );

      expect(capturedHtml).toContain('Content-Security-Policy');
      expect(capturedHtml).toContain("default-src 'none'");
      expect(capturedHtml).toContain('nonce-');
    });

    it('references catalog-webview.js and catalog-webview.css', () => {
      provider.resolveWebviewView(
        mockWebviewView,
        {} as vscode.WebviewViewResolveContext,
        { isCancellationRequested: false, onCancellationRequested: vi.fn() } as unknown as vscode.CancellationToken
      );

      expect(capturedHtml).toContain('catalog-webview.js');
      expect(capturedHtml).toContain('catalog-webview.css');
    });

    it('includes nonce on script tag', () => {
      provider.resolveWebviewView(
        mockWebviewView,
        {} as vscode.WebviewViewResolveContext,
        { isCancellationRequested: false, onCancellationRequested: vi.fn() } as unknown as vscode.CancellationToken
      );

      // Extract nonce from CSP header and verify it matches script tag
      const nonceMatch = capturedHtml.match(/nonce-([A-Za-z0-9]+)/);
      expect(nonceMatch).not.toBeNull();
      const nonce = nonceMatch![1];
      expect(capturedHtml).toContain(`nonce="${nonce}"`);
    });

    it('logs lifecycle events', () => {
      provider.resolveWebviewView(
        mockWebviewView,
        {} as vscode.WebviewViewResolveContext,
        { isCancellationRequested: false, onCancellationRequested: vi.fn() } as unknown as vscode.CancellationToken
      );

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        'CatalogViewProvider: resolveWebviewView called'
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        'CatalogViewProvider: webview HTML and message handler set'
      );
    });

    it('includes root div for React mounting', () => {
      provider.resolveWebviewView(
        mockWebviewView,
        {} as vscode.WebviewViewResolveContext,
        { isCancellationRequested: false, onCancellationRequested: vi.fn() } as unknown as vscode.CancellationToken
      );

      expect(capturedHtml).toContain('<div id="root"></div>');
    });
  });

  // v3-2-1: View preference persistence tests
  describe('view preference persistence (v3-2-1)', () => {
    it('getViewPreference returns "grid" by default when no preference saved (AC-3)', () => {
      const mockGlobalState = {
        get: vi.fn().mockReturnValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        keys: vi.fn().mockReturnValue([]),
      } as unknown as vscode.Memento;

      const providerWithState = new CatalogViewProvider(
        vscode.Uri.file('/test/extension'),
        vscode.Uri.file('/test/workspace'),
        mockOutputChannel,
        { scanDecks: vi.fn(), getDeckDetail: vi.fn(), getDeckPath: vi.fn() } as any,
        { onDecksChanged: vi.fn().mockReturnValue({ dispose: vi.fn() }) } as any,
        undefined,
        mockGlobalState
      );

      // globalState.get returns undefined (no saved value), so default 'grid' is used
      mockGlobalState.get = vi.fn().mockImplementation((key: string, defaultValue: any) => defaultValue);
      expect(providerWithState.getViewPreference()).toBe('grid');
      expect(mockGlobalState.get).toHaveBeenCalledWith('slideBuilder.catalogViewMode', 'grid');
    });

    it('getViewPreference returns saved preference (AC-2)', () => {
      const mockGlobalState = {
        get: vi.fn().mockImplementation((key: string) => {
          if (key === 'slideBuilder.catalogViewMode') return 'list';
          return undefined;
        }),
        update: vi.fn().mockResolvedValue(undefined),
        keys: vi.fn().mockReturnValue([]),
      } as unknown as vscode.Memento;

      const providerWithState = new CatalogViewProvider(
        vscode.Uri.file('/test/extension'),
        vscode.Uri.file('/test/workspace'),
        mockOutputChannel,
        { scanDecks: vi.fn(), getDeckDetail: vi.fn(), getDeckPath: vi.fn() } as any,
        { onDecksChanged: vi.fn().mockReturnValue({ dispose: vi.fn() }) } as any,
        undefined,
        mockGlobalState
      );

      expect(providerWithState.getViewPreference()).toBe('list');
    });

    it('setViewPreference updates globalState (AC-2)', async () => {
      const mockGlobalState = {
        get: vi.fn().mockReturnValue('grid'),
        update: vi.fn().mockResolvedValue(undefined),
        keys: vi.fn().mockReturnValue([]),
      } as unknown as vscode.Memento;

      const providerWithState = new CatalogViewProvider(
        vscode.Uri.file('/test/extension'),
        vscode.Uri.file('/test/workspace'),
        mockOutputChannel,
        { scanDecks: vi.fn(), getDeckDetail: vi.fn(), getDeckPath: vi.fn() } as any,
        { onDecksChanged: vi.fn().mockReturnValue({ dispose: vi.fn() }) } as any,
        undefined,
        mockGlobalState
      );

      await providerWithState.setViewPreference('list');
      expect(mockGlobalState.update).toHaveBeenCalledWith('slideBuilder.catalogViewMode', 'list');
    });

    it('getViewPreference returns "grid" when no globalState provided', () => {
      // provider was created without globalState in beforeEach
      expect(provider.getViewPreference()).toBe('grid');
    });
  });
});
