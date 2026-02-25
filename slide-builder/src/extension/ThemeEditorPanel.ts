import * as vscode from 'vscode';
import type { FileWatcherService } from './FileWatcherService';
import { createThemeEditorMessageHandler } from './theme-editor-message-handler';
import { validateThemeJson } from '../shared/themeValidation';

/**
 * Singleton WebviewPanel factory for the Theme Editor.
 * Creates/reveals a dedicated panel for viewing and editing brand theme.
 *
 * Architecture Reference: ADR-BRAND-1, ADR-BRAND-6 — Separate WebviewPanel, singleton per workspace
 * Story Reference: bt-2-1 Task 2 — AC-1, AC-2, AC-3, AC-7
 * Story Reference: bt-2-4 Task 2 — AC-1, AC-2, AC-3, AC-7 (file watcher integration)
 *
 * Follows SlideViewerV2Panel pattern with key difference:
 * - True singleton (one per workspace, not per-deck)
 * - No deckId parameter
 */
export class ThemeEditorPanel {
  // bt-2-1 Task 2.1: Static singleton instance
  private static instance: ThemeEditorPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly workspaceUri: vscode.Uri | undefined;
  private readonly outputChannel: vscode.OutputChannel;

  // bt-2-4 Task 2: File watcher integration
  private readonly fileWatcher: FileWatcherService | undefined;
  // bt-2-4: Track isDirty on panel side for external change decision (approach 1 from dev notes)
  private isDirty = false;

  /**
   * Private constructor — use createOrShow() instead.
   */
  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    outputChannel: vscode.OutputChannel,
    workspaceUri?: vscode.Uri,
    fileWatcher?: FileWatcherService,
  ) {
    this.panel = panel;
    this.workspaceUri = workspaceUri;
    this.outputChannel = outputChannel;
    this.fileWatcher = fileWatcher;

    // bt-2-1 Task 2.3: Set webview HTML content
    this.panel.webview.html = ThemeEditorPanel.getWebviewContent(
      this.panel.webview,
      extensionUri,
    );

    // bt-2-1 Task 2.4: Register message handler
    // bt-2-2 Task 10.2: Pass panel reference so message handler can call loadThemeData
    // bt-2-4 Task 8: Pass workspaceUri for sendToClaudeCode launch messages
    const messageHandler = createThemeEditorMessageHandler(
      this.panel.webview,
      outputChannel,
      this,
      workspaceUri,
    );
    this.disposables.push(messageHandler);

    // bt-2-4 Task 2.1: Register file watcher callback for theme.json changes
    if (fileWatcher) {
      const themeWatcherDisposable = fileWatcher.onThemeChanged(() => {
        this.handleExternalThemeChange();
      });
      this.disposables.push(themeWatcherDisposable);
      outputChannel.appendLine('[ThemeEditor] File watcher registered for theme.json');
    }

    // bt-2-1 Task 2.5: Register dispose handler
    this.panel.onDidDispose(
      () => {
        ThemeEditorPanel.instance = undefined;
        // bt-2-4 Task 2.6: Disposables include file watcher callback
        this.disposables.forEach((d) => d.dispose());
        outputChannel.appendLine('[ThemeEditor] Panel disposed');
      },
      null,
      this.disposables,
    );

    // bt-2-1 Task 2.6: Log creation
    outputChannel.appendLine('[ThemeEditor] Panel created');
  }

  /**
   * bt-2-1 Task 2.2: Create or reveal the Theme Editor panel.
   *
   * AC-1: Creates a new panel if none exists.
   * AC-2: Reveals existing panel if already open.
   * AC-3: retainContextWhenHidden preserves state across tab switches.
   *
   * @param extensionUri - Extension root URI (for dist/ assets)
   * @param outputChannel - Output channel for logging
   * @param workspaceUri - Workspace root URI
   * @param fileWatcher - Optional FileWatcherService (used by future stories 2.4)
   */
  static createOrShow(
    extensionUri: vscode.Uri,
    outputChannel: vscode.OutputChannel,
    workspaceUri: vscode.Uri,
    fileWatcher?: FileWatcherService,
  ): void {
    // AC-2: If panel already exists, reveal it
    if (ThemeEditorPanel.instance) {
      ThemeEditorPanel.instance.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    // AC-1: Create new WebviewPanel
    const panel = vscode.window.createWebviewPanel(
      'slideBuilder.themeEditor',
      'Theme Editor',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        // AC-3 (FR38): Preserve state when panel is hidden
        retainContextWhenHidden: true,
        // bt-2-1 Task 2.7: localResourceRoots for dist/ directory
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist'),
        ],
      },
    );

    ThemeEditorPanel.instance = new ThemeEditorPanel(
      panel,
      extensionUri,
      outputChannel,
      workspaceUri,
      fileWatcher,
    );
  }

  /**
   * bt-2-2 Task 10.1: Load theme.json from disk and send to webview.
   *
   * AC-1: Reads .slide-builder/config/theme.json via vscode.workspace.fs.readFile()
   * Sends theme-editor-data message with theme data and exists flag.
   */
  async loadThemeData(): Promise<void> {
    if (!this.workspaceUri) {
      this.outputChannel.appendLine('[ThemeEditor] No workspace URI available, cannot load theme');
      this.panel.webview.postMessage({
        type: 'theme-editor-data',
        theme: null,
        exists: false,
      });
      return;
    }

    const themePath = vscode.Uri.joinPath(this.workspaceUri, '.slide-builder', 'config', 'theme.json');

    try {
      // bt-2-2 Task 10.1: Read theme.json via vscode.workspace.fs.readFile()
      const fileData = await vscode.workspace.fs.readFile(themePath);
      const themeText = new TextDecoder().decode(fileData);
      const theme = JSON.parse(themeText);

      // bt-4-5 Task 1.2: Validate theme after parsing (AC-24, AC-27)
      const validationResult = validateThemeJson(theme);

      // bt-4-5 Task 1.3: If errors, show warning notification with first 3 errors (AC-24)
      if (validationResult.errors.length > 0) {
        const errorSummary = validationResult.errors.slice(0, 3).join(', ');
        const suffix = validationResult.errors.length > 3 ? '...' : '';
        vscode.window.showWarningMessage(
          `Theme validation: ${validationResult.errors.length} missing required field(s): ${errorSummary}${suffix}`,
        );
        this.outputChannel.appendLine(
          `[ThemeEditor] Validation: ${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings`,
        );
        this.outputChannel.appendLine(
          `[ThemeEditor] Validation errors: ${validationResult.errors.join(', ')}`,
        );
      } else if (validationResult.warnings.length > 0) {
        // bt-4-5 Task 1.5: If only warnings, log to output channel (AC-27)
        this.outputChannel.appendLine(
          `[ThemeEditor] Validation warnings: ${validationResult.warnings.join(', ')}`,
        );
      }
      // bt-4-5 Task 1.6: If valid (no errors, no warnings), no additional logging

      // bt-4-5 Task 1.4: Use default-filled theme when errors exist (AC-24)
      const themeToSend = validationResult.errors.length > 0 ? validationResult.theme : theme;

      // bt-2-2 Task 10.3: Log success with version
      this.outputChannel.appendLine(
        `[ThemeEditor] Theme loaded from .slide-builder/config/theme.json (v${theme.version || 'unknown'})`,
      );

      this.panel.webview.postMessage({
        type: 'theme-editor-data',
        theme: themeToSend,
        exists: true,
      });
    } catch (error: unknown) {
      // bt-2-2 Task 10.4: On file not found, send exists: false
      if (
        error instanceof vscode.FileSystemError ||
        (error instanceof Error && error.message.includes('ENOENT'))
      ) {
        this.outputChannel.appendLine('[ThemeEditor] No theme.json found at .slide-builder/config/theme.json');
        this.panel.webview.postMessage({
          type: 'theme-editor-data',
          theme: null,
          exists: false,
        });
        return;
      }

      // bt-2-2 Task 10.5: On parse error, log error and show notification
      this.outputChannel.appendLine(`[ThemeEditor] Error loading theme.json: ${String(error)}`);
      vscode.window.showErrorMessage(
        `Failed to load theme.json: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.panel.webview.postMessage({
        type: 'theme-editor-data',
        theme: null,
        exists: false,
      });
    }
  }

  /**
   * bt-2-3 Task 4.1: Save theme data to .slide-builder/config/theme.json.
   * Full-read/full-write per ADR-BRAND-2: writes complete ThemeJson, no partial merges.
   *
   * @returns Success/failure result with optional error message
   */
  async saveThemeData(theme: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    if (!this.workspaceUri) {
      return { success: false, error: 'No workspace URI available' };
    }

    const themePath = vscode.Uri.joinPath(this.workspaceUri, '.slide-builder', 'config', 'theme.json');

    try {
      // bt-2-3 Task 4.3: Log before write
      const jsonString = JSON.stringify(theme, null, 2);
      const sizeKB = (jsonString.length / 1024).toFixed(1);
      this.outputChannel.appendLine(`[ThemeEditor] Save: writing theme.json (${sizeKB}KB)`);

      // bt-2-4 Task 2.5: Suppress file watcher before write (AC-3)
      if (this.fileWatcher) {
        this.outputChannel.appendLine('[ThemeEditor] Suppressing file watcher for own save');
        this.fileWatcher.suppressNextRefresh('theme-editor');
      }

      // bt-2-3 Task 4.4: Write with try/catch for error handling
      const encoder = new TextEncoder();
      await vscode.workspace.fs.writeFile(themePath, encoder.encode(jsonString));

      this.outputChannel.appendLine('[ThemeEditor] Save: complete');
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`[ThemeEditor] Save: FAILED -- ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * bt-2-3 Task 5.3: Update the panel title for dirty state indication.
   * Shows "Theme Editor *" when dirty, "Theme Editor" when clean.
   */
  updateTitle(isDirty: boolean): void {
    this.panel.title = isDirty ? 'Theme Editor *' : 'Theme Editor';
  }

  /**
   * bt-2-4 Task 2: Update isDirty tracking on the panel side.
   * Called from message handler when theme-editor-dirty message received.
   * Used to decide between auto-reload and conflict dialog on external changes.
   */
  setIsDirty(dirty: boolean): void {
    this.isDirty = dirty;
  }

  /**
   * bt-2-4 Task 2.2-2.4, 2.7: Handle external theme.json change detected by file watcher.
   * Re-reads theme.json, then decides:
   * - If NOT dirty: auto-reload by sending theme-editor-data (AC-1)
   * - If dirty: send theme-editor-external-change to prompt user (AC-2)
   * - If file deleted: send theme-editor-data with exists=false (AC-10)
   */
  private async handleExternalThemeChange(): Promise<void> {
    if (!this.workspaceUri) return;

    const themePath = vscode.Uri.joinPath(this.workspaceUri, '.slide-builder', 'config', 'theme.json');

    try {
      const fileData = await vscode.workspace.fs.readFile(themePath);
      const themeText = new TextDecoder().decode(fileData);
      const theme = JSON.parse(themeText);

      // bt-4-5 Task 3.2: Validate externally changed theme (AC-24)
      const validationResult = validateThemeJson(theme);

      if (validationResult.errors.length > 0) {
        const errorSummary = validationResult.errors.slice(0, 3).join(', ');
        const suffix = validationResult.errors.length > 3 ? '...' : '';
        vscode.window.showWarningMessage(
          `Theme validation: ${validationResult.errors.length} missing required field(s): ${errorSummary}${suffix}`,
        );
        this.outputChannel.appendLine(
          `[ThemeEditor] Validation: ${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings`,
        );
        this.outputChannel.appendLine(
          `[ThemeEditor] Validation errors: ${validationResult.errors.join(', ')}`,
        );
      } else if (validationResult.warnings.length > 0) {
        this.outputChannel.appendLine(
          `[ThemeEditor] Validation warnings: ${validationResult.warnings.join(', ')}`,
        );
      }

      // Use default-filled theme when errors exist
      const themeToSend = validationResult.errors.length > 0 ? validationResult.theme : theme;

      if (!this.isDirty) {
        // bt-2-4 Task 2.3: Auto-reload (AC-1)
        this.outputChannel.appendLine('[ThemeEditor] External change detected, notifying webview');
        this.panel.webview.postMessage({
          type: 'theme-editor-data',
          theme: themeToSend,
          exists: true,
        });
      } else {
        // bt-2-4 Task 2.4: Prompt user (AC-2)
        this.outputChannel.appendLine('[ThemeEditor] External change detected, editor has unsaved changes -- prompting user');
        this.panel.webview.postMessage({
          type: 'theme-editor-external-change',
          theme: themeToSend,
        });
      }
    } catch (error: unknown) {
      // bt-2-4 Task 9.1: File deleted — transition to onboarding
      this.outputChannel.appendLine('[ThemeEditor] External change: theme.json not found, transitioning to onboarding');
      this.panel.webview.postMessage({
        type: 'theme-editor-data',
        theme: null,
        exists: false,
      });
    }
  }

  /**
   * bt-2-1 Task 2.3: Generate webview HTML with CSP nonces.
   *
   * Follows CatalogViewProvider.getHtmlForWebview() CSP pattern.
   * References bundled dist/theme-editor-webview.js and .css.
   */
  private static getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'dist', 'theme-editor-webview.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'dist', 'theme-editor-webview.css'),
    );

    const nonce = ThemeEditorPanel.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>Theme Editor</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }
    body {
      background: var(--vscode-editor-background, #1e1e1e);
      color: var(--vscode-editor-foreground, #cccccc);
      font-family: var(--vscode-font-family, system-ui, sans-serif);
    }
    #root {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Generate a random nonce for CSP.
   */
  private static getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
