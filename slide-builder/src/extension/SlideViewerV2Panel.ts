import * as vscode from 'vscode';
import type { ViewerTemplateContext } from '../shared/types';
import type { BuildProgressService } from './BuildProgressService';
import type { CatalogDataService } from './CatalogDataService';
import type { FileWatcherService } from './FileWatcherService';
import type { PromptAssemblyService } from './PromptAssemblyService';
import { createViewerV2MessageHandler } from './viewer-v2-message-handler';

/**
 * WebviewPanel factory for the V2 Slide Viewer.
 * Loads a React SPA that renders slides directly (no iframe nesting).
 * Manages per-deck viewer instances in the editor area using a static Map.
 *
 * Architecture Reference: ADR-003 — Separate v2 Panel Class
 * Story Reference: v2-1-1 AC-1, AC-2, AC-3, AC-4, AC-5
 */
export class SlideViewerV2Panel {
  private static panels: Map<string, vscode.WebviewPanel> = new Map();

  /**
   * lv-1-2 AC-15,16,17: Dismissed builds tracking.
   * Keyed by `${deckId}:${buildId}`. When user closes viewer during active build,
   * the build is added here to prevent auto-reopen for that build session.
   * Per-session only (in-memory, resets on extension reload).
   */
  private static dismissedBuilds: Set<string> = new Set();

  /**
   * lv-1-2: Static reference to BuildProgressService for onDidDispose callback.
   * Set via setBuildProgressService() from extension.ts activate().
   */
  private static buildProgressService: BuildProgressService | null = null;

  /**
   * tm-3-5: Template context stored per deckId for viewer Edit button.
   * Keyed by deckId. Set when createOrShow() is called with templateContext.
   */
  static templateContexts: Map<string, ViewerTemplateContext> = new Map();

  /**
   * Pending messages to be sent to a viewer panel once its React app fires v2-ready.
   * Used to avoid the race condition where postMessage is called before the SPA loads.
   * Keyed by deckId. The viewer-v2-message-handler flushes these on v2-ready.
   *
   * Bug fix: tm-2-2 — slide preview inconsistency (new viewer panel drops postMessage
   * before React app mounts and registers window.addEventListener).
   */
  static pendingMessages: Map<string, unknown[]> = new Map();

  /**
   * Queue a message to be delivered once the viewer panel for deckId sends v2-ready.
   * If the panel is already loaded (i.e. the React app is running), the caller should
   * use postMessage directly instead.
   */
  static queueMessage(deckId: string, message: unknown): void {
    const queue = SlideViewerV2Panel.pendingMessages.get(deckId) ?? [];
    queue.push(message);
    SlideViewerV2Panel.pendingMessages.set(deckId, queue);
  }

  /**
   * Flush and return all queued messages for a deckId.
   * Called by viewer-v2-message-handler on v2-ready.
   */
  static flushPendingMessages(deckId: string): unknown[] {
    const queue = SlideViewerV2Panel.pendingMessages.get(deckId) ?? [];
    SlideViewerV2Panel.pendingMessages.delete(deckId);
    return queue;
  }

  /**
   * Create a new V2 viewer panel for a deck, or reveal the existing one.
   * Loads a React SPA that communicates via v2- prefixed messages.
   *
   * AC-4: Opening an already-open deck reveals its existing panel.
   */
  static createOrShow(
    extensionUri: vscode.Uri,
    workspaceUri: vscode.Uri,
    deckId: string,
    deckName: string,
    dataService: CatalogDataService,
    outputChannel: vscode.OutputChannel,
    fileWatcher?: FileWatcherService,
    templateContext?: ViewerTemplateContext,
    promptAssemblyService?: PromptAssemblyService
  ): void {
    // tm-3-5: Store template context if provided (AC-5)
    if (templateContext) {
      SlideViewerV2Panel.templateContexts.set(deckId, templateContext);
      outputChannel.appendLine(
        `[SlideViewerV2Panel] Template context set: ${templateContext.templateId} / ${templateContext.slideFile}`
      );
    }

    // AC-4: Check if panel already exists for this deck
    if (SlideViewerV2Panel.revealIfOpen(deckId)) {
      // tm-3-5: If template context provided and panel already open, post it directly
      if (templateContext) {
        const existingPanel = SlideViewerV2Panel.panels.get(deckId);
        if (existingPanel) {
          existingPanel.webview.postMessage({
            type: 'v2-template-context',
            context: templateContext,
          });
        }
      }
      outputChannel.appendLine(`SlideViewerV2Panel: Revealed existing panel for '${deckName}'`);
      return;
    }

    // AC-3: Tab title shows deck name
    const panel = vscode.window.createWebviewPanel(
      'slideBuilder.slideViewerV2',
      `Slides: ${deckName}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        // AC-5: Preserve state when panel is hidden
        retainContextWhenHidden: true,
        // localResourceRoots — output/ for slide files, dist/ for React bundle
        localResourceRoots: [
          vscode.Uri.joinPath(workspaceUri, 'output'),
          vscode.Uri.joinPath(extensionUri, 'dist'),
        ],
      }
    );

    // Store in Map for tracking
    SlideViewerV2Panel.panels.set(deckId, panel);

    // Wire up V2 message handler
    const disposables: vscode.Disposable[] = [];
    const messageHandler = createViewerV2MessageHandler(
      panel.webview,
      deckId,
      dataService,
      outputChannel,
      fileWatcher,
      promptAssemblyService
    );
    disposables.push(messageHandler);

    // tm-3-5: Queue v2-template-context message for delivery on v2-ready (AC-5)
    if (templateContext) {
      SlideViewerV2Panel.queueMessage(deckId, {
        type: 'v2-template-context',
        context: templateContext,
      });
    }

    // v2-3-2 AC-1,2,3,6,7,10: Wire file watcher for external change detection
    if (fileWatcher) {
      const fileChangeDisposable = fileWatcher.onFileChanged(async (uri: vscode.Uri) => {
        // Filter: only handle changes for this panel's deck
        // Support nested folders: output/folder/subfolder/slides/
        const match = uri.fsPath.match(/output[/\\](.+?)[/\\]slides[/\\]/);
        if (!match) return;

        const fullRelativePath = match[1];

        // Extract final folder name from path (handles both / and \)
        // CatalogDataService stores deckId as just the final folder name
        const pathSegments = fullRelativePath.split(/[/\\]/);
        const extractedDeckId = pathSegments[pathSegments.length - 1];

        // Compare final folder name with panel's deckId
        if (extractedDeckId !== deckId) {
          outputChannel.appendLine(
            `[SlideViewerV2Panel] Ignoring file change for deck '${extractedDeckId}' ` +
            `(panel is for '${deckId}', full path: ${fullRelativePath})`
          );
          return;
        }

        const filename = uri.fsPath.split(/[/\\]/).pop() ?? '';

        if (/^slide-\d+\.html$/i.test(filename)) {
          // AC-2: Slide file changed — re-read and send v2-slide-updated
          const slideNumber = parseInt(filename.match(/slide-(\d+)/)?.[1] || '0', 10);
          try {
            const slideBytes = await vscode.workspace.fs.readFile(uri);
            const html = new TextDecoder().decode(slideBytes);
            await panel.webview.postMessage({
              type: 'v2-slide-updated',
              slideNumber,
              html,
            });
            outputChannel.appendLine(
              `SlideViewerV2Panel [${deckId}]: File change — sent v2-slide-updated for slide ${slideNumber}`
            );
          } catch (error) {
            outputChannel.appendLine(
              `SlideViewerV2Panel [${deckId}]: Error re-reading slide ${slideNumber}: ${error}`
            );
          }
        } else if (filename.toLowerCase() === 'manifest.json') {
          // AC-7: Manifest changed — re-read and send v2-manifest-updated
          try {
            const manifestBytes = await vscode.workspace.fs.readFile(uri);
            const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
            await panel.webview.postMessage({
              type: 'v2-manifest-updated',
              manifest,
            });
            outputChannel.appendLine(
              `SlideViewerV2Panel [${deckId}]: File change — sent v2-manifest-updated`
            );
          } catch (error) {
            outputChannel.appendLine(
              `SlideViewerV2Panel [${deckId}]: Error re-reading manifest: ${error}`
            );
          }
        }
      });
      disposables.push(fileChangeDisposable);
    }

    // AC-4: Clean up on disposal
    // v2-3-2 AC-9: Dispose file watcher subscription to prevent resource leaks
    // lv-1-2 AC-15: Track dismissed builds when user closes viewer during active build
    panel.onDidDispose(() => {
      // lv-1-2 AC-15: Check if closing during an active build for this deck
      if (SlideViewerV2Panel.buildProgressService &&
          SlideViewerV2Panel.buildProgressService.isBuilding(deckId)) {
        const buildId = SlideViewerV2Panel.buildProgressService.getBuildId();
        if (buildId) {
          SlideViewerV2Panel.dismissedBuilds.add(`${deckId}:${buildId}`);
          outputChannel.appendLine(
            `[BuildViewer] User dismissed viewer during build, marking as dismissed: ${deckId}:${buildId}`
          );
        }
      }

      SlideViewerV2Panel.panels.delete(deckId);
      SlideViewerV2Panel.templateContexts.delete(deckId);
      disposables.forEach((d) => d.dispose());
      outputChannel.appendLine(`SlideViewerV2Panel: Disposed panel and file watchers for '${deckName}'`);
    });

    // AC-2: Load React SPA HTML
    panel.webview.html = SlideViewerV2Panel.getWebviewHtml(
      panel.webview,
      extensionUri
    );

    outputChannel.appendLine(`SlideViewerV2Panel: Created panel for '${deckName}'`);
  }

  /**
   * Reveal an existing panel for a deck if it exists.
   * Returns true if panel was revealed, false if not found.
   */
  static revealIfOpen(deckId: string): boolean {
    const panel = SlideViewerV2Panel.panels.get(deckId);
    if (panel) {
      panel.reveal(vscode.ViewColumn.One);
      return true;
    }
    return false;
  }

  /**
   * Refresh the V2 viewer for a deck by posting a refresh message.
   * Called after rebuild completes.
   */
  static async refreshViewer(
    deckId: string,
    _dataService: CatalogDataService,
    outputChannel: vscode.OutputChannel
  ): Promise<void> {
    const panel = SlideViewerV2Panel.panels.get(deckId);
    if (!panel) return;

    // V2 viewer handles refresh via message — deck content reload happens in message handler
    await panel.webview.postMessage({ type: 'v2-refreshed' });
    outputChannel.appendLine(`SlideViewerV2Panel: Sent refresh to viewer for '${deckId}'`);
  }

  /**
   * Dispose a specific V2 viewer panel.
   */
  static dispose(deckId: string): void {
    const panel = SlideViewerV2Panel.panels.get(deckId);
    if (panel) {
      panel.dispose();
      // Map cleanup happens in onDidDispose handler
    }
  }

  /**
   * Post a message to a specific V2 viewer panel or all V2 panels.
   */
  static postMessage(message: unknown, deckId?: string): void {
    if (deckId) {
      const panel = SlideViewerV2Panel.panels.get(deckId);
      if (panel) {
        panel.webview.postMessage(message);
      }
    } else {
      // Post to all V2 panels
      for (const panel of SlideViewerV2Panel.panels.values()) {
        panel.webview.postMessage(message);
      }
    }
  }

  /**
   * Check if a V2 panel exists for a deck.
   */
  static hasPanel(deckId: string): boolean {
    return SlideViewerV2Panel.panels.has(deckId);
  }

  /**
   * lv-1-2 AC-19: Check if a V2 viewer panel is currently open for a deck.
   * Alias for hasPanel() per AC-19 interface contract.
   */
  static isOpen(deckId: string): boolean {
    return SlideViewerV2Panel.panels.has(deckId);
  }

  /**
   * lv-1-2 AC-15,16: Check if a build was dismissed (user closed viewer during that build).
   * Returns true if the viewer was closed during the specified build session.
   */
  static isDismissedForBuild(deckId: string, buildId: string): boolean {
    return SlideViewerV2Panel.dismissedBuilds.has(`${deckId}:${buildId}`);
  }

  /**
   * lv-1-2 AC-17: Clear dismissed entries for a deck when a new build starts.
   * Removes all entries starting with `${deckId}:` from the dismissed set.
   */
  static clearDismissedForDeck(deckId: string): void {
    const prefix = `${deckId}:`;
    for (const key of SlideViewerV2Panel.dismissedBuilds) {
      if (key.startsWith(prefix)) {
        SlideViewerV2Panel.dismissedBuilds.delete(key);
      }
    }
  }

  /**
   * lv-1-2: Set the BuildProgressService reference for onDidDispose dismissed tracking.
   * Called from extension.ts activate() after BuildProgressService is created.
   */
  static setBuildProgressService(service: BuildProgressService): void {
    SlideViewerV2Panel.buildProgressService = service;
  }

  /**
   * Generate the webview HTML that loads the React SPA bundle.
   * AC-2: Shows "Loading slides..." state initially.
   */
  private static getWebviewHtml(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ): string {
    // Get URIs for the bundled React app
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'dist', 'viewer-webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'dist', 'viewer-webview.css')
    );

    // Use nonce for CSP
    const nonce = SlideViewerV2Panel.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} https://fonts.googleapis.com 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data: blob: https:; font-src ${webview.cspSource} https://fonts.gstatic.com; connect-src https://fonts.googleapis.com https://fonts.gstatic.com; frame-src blob:;">
  <link rel="stylesheet" href="${styleUri}">
  <title>Slide Viewer V2</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      width: 100%;
      height: 100%;
      min-height: 0;
      max-width: 100%;
      max-height: 100%;
    }
    body {
      background: var(--vscode-editor-background, #1e1e1e);
      color: var(--vscode-editor-foreground, #cccccc);
      font-family: var(--vscode-font-family, system-ui, sans-serif);
    }
    #root {
      width: 100%;
      height: 100%;
      min-height: 0;
      max-width: 100%;
      max-height: 100%;
      overflow: hidden;
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
