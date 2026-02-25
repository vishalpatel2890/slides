import * as vscode from 'vscode';
import type { DeckTemplateConfig, ViewerTemplateContext } from '../shared/types';
import type { DeckTemplateConfigService } from './DeckTemplateConfigService';
import type { CatalogDataService } from './CatalogDataService';
import type { FileWatcherService } from './FileWatcherService';
import type { PromptAssemblyService } from './PromptAssemblyService';
import { SlideViewerV2Panel } from './SlideViewerV2Panel';
import { CatalogViewProvider } from './CatalogViewProvider';
import { sendToClaudeCode } from './claude-code-integration';
import { configService } from './extension';

/**
 * WebviewPanel factory for the Deck Template Editor.
 * Loads a React SPA that renders DeckTemplateDetail in a full-size panel.
 *
 * Story Reference: tm-2-1 AC-1, AC-2, AC-3, AC-4
 * Story Reference: tm-2-2 — handles preview-deck-template-slide from DeckTemplateDetail webview
 *
 * Follows the SlideViewerV2Panel factory pattern.
 * A single panel instance is reused; if it already exists and a new template
 * is inspected the panel is revealed and updated via postMessage.
 *
 * Bug fixes (tm-2-2 manual test PARTIAL):
 * - Bug 1 (deck opening): DeckTemplateDetail was not shown on first click because the
 *   deck-template-config postMessage fired before the React SPA finished loading. Fixed
 *   by storing the pending config and sending it only after the webview signals 'ready'.
 * - Bug 2 (preview inconsistency): SlideViewerV2Panel.postMessage fired before the
 *   viewer's React SPA loaded when the panel was newly created. Fixed by queuing the
 *   preview payload via SlideViewerV2Panel.queueMessage so it is flushed on v2-ready.
 */
export class DeckTemplateEditorPanel {
  static currentPanel: DeckTemplateEditorPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  /**
   * Pending config to deliver once the editor webview sends 'ready'.
   * Prevents the race condition where deck-template-config is posted before
   * the React SPA has mounted and registered its message listener.
   */
  private _pendingConfig: { templateId: string; config: DeckTemplateConfig } | null = null;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    workspaceUri: vscode.Uri,
    dataService: CatalogDataService,
    outputChannel: vscode.OutputChannel,
    fileWatcher: FileWatcherService,
    deckTemplateConfigService: DeckTemplateConfigService,
    promptAssemblyService: PromptAssemblyService | null = null
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview HTML once on creation
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    // Wire message handler for messages from the DeckTemplateDetail webview
    const messageDisposable = this._panel.webview.onDidReceiveMessage(
      async (message: { type: string; templateId?: string; slideFile?: string }) => {

        // Bug fix (Bug 1): React SPA sends 'ready' after mounting.
        // Flush the pending config that was stored during createOrShow.
        if (message.type === 'ready') {
          outputChannel.appendLine(
            `DeckTemplateEditorPanel: Webview ready — flushing pending config`
          );
          if (this._pendingConfig) {
            const { templateId, config } = this._pendingConfig;
            this._pendingConfig = null;
            await this._panel.webview.postMessage({
              type: 'deck-template-config',
              templateId,
              config,
            });
          }
          return;
        }

        // tm-2-2: Preview deck template slide
        if (message.type === 'preview-deck-template-slide' && message.templateId && message.slideFile) {
          outputChannel.appendLine(
            `[DeckTemplateEditorPanel] preview-deck-template-slide: ${message.templateId}/${message.slideFile}`
          );
          try {
            const html = await deckTemplateConfigService.getSlideHtml(message.templateId, message.slideFile);
            const previewDeckId = '__deck-template-preview__';
            const previewDeckName = `Template Preview: ${message.templateId}`;

            const previewPayload = {
              type: 'v2-deck-loaded',
              deck: {
                deckId: previewDeckId,
                deckName: previewDeckName,
                planPath: '',
                slides: [
                  {
                    number: 1,
                    html,
                    fileName: message.slideFile,
                    slideId: message.slideFile.replace(/[^a-zA-Z0-9]/g, '-'),
                    title: message.slideFile,
                  },
                ],
                manifest: {
                  deckId: previewDeckId,
                  deckName: previewDeckName,
                  slideCount: 1,
                  slides: [
                    {
                      number: 1,
                      fileName: message.slideFile,
                      title: message.slideFile,
                    },
                  ],
                  generatedAt: new Date().toISOString(),
                },
              },
            };

            // tm-3-5: Construct ViewerTemplateContext for Edit button in viewer (AC-5)
            const templateContext: ViewerTemplateContext = {
              templateId: message.templateId,
              slideFile: message.slideFile,
              slideName: message.slideFile,
            };

            // Bug fix (Bug 2): If the viewer panel for this previewDeckId is already
            // open its React app is running — post directly. If it is newly created the
            // React app hasn't loaded yet, so queue the payload; it is flushed when
            // the viewer's SPA fires v2-ready (handled in viewer-v2-message-handler).
            const viewerAlreadyOpen = SlideViewerV2Panel.hasPanel(previewDeckId);

            SlideViewerV2Panel.createOrShow(
              extensionUri,
              workspaceUri,
              previewDeckId,
              previewDeckName,
              dataService,
              outputChannel,
              fileWatcher,
              templateContext,
              promptAssemblyService ?? undefined
            );

            if (viewerAlreadyOpen) {
              // Panel was already loaded — post immediately
              SlideViewerV2Panel.postMessage(previewPayload, previewDeckId);
            } else {
              // Newly created panel — queue for delivery on v2-ready
              SlideViewerV2Panel.queueMessage(previewDeckId, previewPayload);
              outputChannel.appendLine(
                `[DeckTemplateEditorPanel] Queued preview payload for '${previewDeckId}' (viewer panel is new)`
              );
            }
          } catch (error) {
            outputChannel.appendLine(
              `[DeckTemplateEditorPanel] preview-deck-template-slide: ${message.templateId}/${message.slideFile} — getSlideHtml failed: ${error}`
            );
            vscode.window.showErrorMessage(
              `Could not preview slide: ${(error as Error).message}`
            );
          }
          return;
        }

        // tm-2-3: Delete deck template — confirmation dialog + deletion + cache invalidation
        if (message.type === 'delete-deck-template' && message.templateId) {
          outputChannel.appendLine(
            `[DeckTemplateEditorPanel] delete-deck-template: ${message.templateId}`
          );
          try {
            // Load config for confirmation dialog details
            let templateName = message.templateId;
            let slideCount = 0;
            try {
              const config = await deckTemplateConfigService.loadConfig(message.templateId);
              templateName = config.name || message.templateId;
              slideCount = config.slide_count ?? config.slides?.length ?? 0;
            } catch {
              // Fall through with templateId as name
            }

            const folderPath = `.slide-builder/config/catalog/deck-templates/${message.templateId}/`;
            const detail = `This will permanently remove the template folder "${folderPath}" containing ${slideCount} slide${slideCount !== 1 ? 's' : ''}.`;
            const result = await vscode.window.showWarningMessage(
              `Delete deck template "${templateName}"?`,
              { modal: true, detail },
              'Delete'
            );

            if (result !== 'Delete') {
              outputChannel.appendLine(
                `[DeckTemplateEditorPanel] delete-deck-template: ${message.templateId} — user cancelled`
              );
              return;
            }

            // tm-3-2: Suppress next file watcher refresh to prevent redundant catalog update
            fileWatcher.suppressNextDeckTemplateRefresh();

            await dataService.deleteDeckTemplate(message.templateId);

            // Invalidate cache
            deckTemplateConfigService.invalidateCache(message.templateId);

            // Post success message back to editor webview (triggers panel close)
            await this._panel.webview.postMessage({
              type: 'deck-template-deleted',
              templateId: message.templateId,
              success: true,
            });

            // Also notify the catalog sidebar so it removes the deleted template from the grid/list
            CatalogViewProvider.postMessage({
              type: 'deck-template-deleted',
              templateId: message.templateId,
              success: true,
            });

            // Refresh the full template list in the catalog sidebar
            try {
              const slideTemplates = await dataService.scanSlideTemplates();
              const deckTemplates = await dataService.getDeckTemplates();
              CatalogViewProvider.postMessage({
                type: 'templates',
                slideTemplates,
                deckTemplates,
              });
            } catch (refreshError) {
              outputChannel.appendLine(
                `[DeckTemplateEditorPanel] delete-deck-template: catalog refresh failed: ${refreshError}`
              );
            }

            outputChannel.appendLine(
              `[DeckTemplateEditorPanel] delete-deck-template: ${message.templateId} — user confirmed`
            );
          } catch (error) {
            outputChannel.appendLine(
              `[DeckTemplateEditorPanel] delete-deck-template: ${message.templateId} — deletion failed: ${error}`
            );
            vscode.window.showErrorMessage(
              `Failed to delete deck template: ${(error as Error).message}`
            );
            // Do NOT post deck-template-deleted on error (AC11)
          }
          return;
        }

        // tm-3-4: Handle submit-operation-form for sb-manage:edit-deck-template (AC-3, AC-4)
        if (message.type === 'submit-operation-form') {
          const opMessage = message as {
            type: string;
            operation: string;
            data: Record<string, unknown>;
          };
          if (opMessage.operation === 'sb-manage:edit-deck-template') {
            outputChannel.appendLine(
              `[DeckTemplateEditorPanel] submit-operation-form: sb-manage:edit-deck-template`
            );
            try {
              if (!promptAssemblyService) {
                throw new Error('PromptAssemblyService not available');
              }
              const editTemplateId = String(opMessage.data['templateId'] ?? '');
              const editSlideFile = String(opMessage.data['slideFile'] ?? '');
              const prompt = await promptAssemblyService.assembleEditDeckTemplatePrompt(
                opMessage.data,
                editTemplateId,
                editSlideFile
              );
              await sendToClaudeCode(prompt, outputChannel, workspaceUri, {
                launchMode: configService.readSettings().claudeCode.launchMode,
                position: configService.readSettings().claudeCode.position,
              });
              outputChannel.appendLine(
                `[DeckTemplateEditorPanel] submit-operation-form: sb-manage:edit-deck-template -> sendToClaudeCode`
              );
            } catch (error) {
              outputChannel.appendLine(
                `[DeckTemplateEditorPanel] Error dispatching edit-deck-template: ${error}`
              );
              vscode.window.showErrorMessage(
                `Could not launch Claude Code for edit: ${(error as Error).message}`
              );
            }
          }
          return;
        }

        if (message.type === 'close-deck-template-editor') {
          this._panel.dispose();
        }
      }
    );
    this._disposables.push(messageDisposable);

    // Clean up on dispose
    this._panel.onDidDispose(() => this._dispose(), null, this._disposables);
  }

  /**
   * Create a new DeckTemplateEditor panel or reveal/update the existing one.
   *
   * tm-2-2: Accepts additional dependencies for preview-deck-template-slide handling.
   *
   * Bug fix (Bug 1): Config is no longer posted immediately on panel creation.
   * Instead it is stored as _pendingConfig and delivered once the editor webview
   * sends 'ready' (after its React SPA has mounted).
   */
  static createOrShow(
    extensionUri: vscode.Uri,
    workspaceUri: vscode.Uri,
    templateId: string,
    config: DeckTemplateConfig,
    outputChannel: vscode.OutputChannel,
    dataService?: CatalogDataService,
    fileWatcher?: FileWatcherService,
    deckTemplateConfigService?: DeckTemplateConfigService,
    promptAssemblyService?: PromptAssemblyService | null
  ): void {
    const column = vscode.ViewColumn.One;

    // If panel already exists, reveal it and post updated config directly.
    // The React SPA is already running so postMessage reaches it immediately.
    if (DeckTemplateEditorPanel.currentPanel) {
      DeckTemplateEditorPanel.currentPanel._panel.reveal(column);
      DeckTemplateEditorPanel.currentPanel._panel.webview.postMessage({
        type: 'deck-template-config',
        templateId,
        config,
      });
      outputChannel.appendLine(
        `DeckTemplateEditorPanel: Revealed existing panel and posted config for '${config.name}'`
      );
      return;
    }

    // Create a new panel
    const panel = vscode.window.createWebviewPanel(
      'deckTemplateEditor',
      config.name,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(workspaceUri, 'output'),
          vscode.Uri.joinPath(extensionUri, 'dist'),
        ],
      }
    );

    // Create stub services if not provided (graceful degradation)
    const effectiveDataService = dataService ?? ({ getDeckDetail: async () => null } as unknown as CatalogDataService);
    const effectiveFileWatcher = fileWatcher ?? ({} as FileWatcherService);
    const effectiveConfigService = deckTemplateConfigService ?? ({
      getSlideHtml: async () => { throw new Error('DeckTemplateConfigService not available'); }
    } as unknown as DeckTemplateConfigService);

    const instance = new DeckTemplateEditorPanel(
      panel,
      extensionUri,
      workspaceUri,
      effectiveDataService,
      outputChannel,
      effectiveFileWatcher,
      effectiveConfigService,
      promptAssemblyService ?? null
    );

    // Bug fix (Bug 1): Store config as pending instead of posting immediately.
    // The 'ready' message handler in the constructor will flush it once the SPA loads.
    instance._pendingConfig = { templateId, config };

    DeckTemplateEditorPanel.currentPanel = instance;

    outputChannel.appendLine(
      `DeckTemplateEditorPanel: Created panel for '${config.name}' — config pending webview ready`
    );
  }

  /**
   * Generate the webview HTML that loads the React SPA bundle.
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'deck-template-editor.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'deck-template-editor.css')
    );

    const nonce = DeckTemplateEditorPanel._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data: blob:; font-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>Deck Template Editor</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
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
   * Dispose this panel and clean up resources.
   */
  private _dispose(): void {
    DeckTemplateEditorPanel.currentPanel = undefined;
    this._panel.dispose();
    for (const disposable of this._disposables) {
      disposable.dispose();
    }
    this._disposables = [];
  }

  /**
   * Generate a random nonce for CSP.
   */
  private static _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
