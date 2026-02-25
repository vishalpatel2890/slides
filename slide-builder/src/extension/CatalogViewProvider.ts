import * as vscode from 'vscode';
import { createCatalogMessageHandler, deckTemplateCreationTracker } from './catalog-message-handler';
import { SlideViewerV2Panel } from './SlideViewerV2Panel';
import type { CatalogDataService } from './CatalogDataService';
import type { FileWatcherService } from './FileWatcherService';
import type { ThumbnailService } from './ThumbnailService';
import type { DeckTemplateConfigService } from './DeckTemplateConfigService';
import type { BuildProgressService } from './BuildProgressService';

/**
 * WebviewViewProvider for the Catalog sidebar panel.
 * Renders a React webview in the Activity Bar's Slide Builder container.
 *
 * Architecture Reference: ADR-002 - WebviewViewProvider for visual grid layouts
 * Story Reference: cv-1-1 AC-1, AC-2; cv-1-3 AC-4, AC-8
 * Story Reference: cv-5-3 AC-18 (thumbnail integration)
 * Story Reference: v3-2-1 AC-2, AC-3 (view preference persistence via globalState)
 */
export class CatalogViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'slideBuilder.catalogView';

  private static readonly VIEW_PREFERENCE_KEY = 'slideBuilder.catalogViewMode';

  // cv-3-5: Static reference to allow cross-webview communication
  private static instance: CatalogViewProvider | undefined;
  private webviewView: vscode.WebviewView | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly workspaceUri: vscode.Uri,
    private readonly outputChannel: vscode.OutputChannel,
    private readonly dataService: CatalogDataService,
    private readonly fileWatcher: FileWatcherService,
    private readonly thumbnailService?: ThumbnailService,
    private readonly globalState?: vscode.Memento,
    private readonly deckTemplateConfigService?: DeckTemplateConfigService,
    private readonly buildProgressService?: BuildProgressService
  ) {
    CatalogViewProvider.instance = this;
  }

  /**
   * Get the persisted view preference from globalState.
   * v3-2-1 AC-3: Returns 'grid' as default when no preference is saved.
   */
  getViewPreference(): 'grid' | 'list' {
    return this.globalState?.get<'grid' | 'list'>(CatalogViewProvider.VIEW_PREFERENCE_KEY, 'grid') ?? 'grid';
  }

  /**
   * Save the view preference to globalState for cross-session persistence.
   * v3-2-1 AC-2: Persists across VS Code sessions via globalState.
   */
  async setViewPreference(mode: 'grid' | 'list'): Promise<void> {
    await this.globalState?.update(CatalogViewProvider.VIEW_PREFERENCE_KEY, mode);
  }

  /**
   * Post a message to the catalog webview from external code.
   * cv-3-5: Used for cross-webview communication (e.g., rebuild from SlideViewer)
   */
  public static postMessage(message: unknown): Thenable<boolean> | undefined {
    return CatalogViewProvider.instance?.webviewView?.webview.postMessage(message);
  }

  /**
   * bt-1-1 AC-1, AC-2: Check if theme.json exists at .slide-builder/config/theme.json.
   * Returns true if the file exists, false otherwise.
   * Handles stat errors gracefully: FileNotFound = false; other errors = log and default to false.
   */
  private async checkThemeExists(): Promise<boolean> {
    try {
      const themeUri = vscode.Uri.joinPath(
        this.workspaceUri,
        '.slide-builder',
        'config',
        'theme.json'
      );
      await vscode.workspace.fs.stat(themeUri);
      this.outputChannel.appendLine('[Brand] Theme existence check: true (.slide-builder/config/theme.json exists)');
      return true;
    } catch (error: unknown) {
      // FileNotFound is expected when no theme exists
      if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
        this.outputChannel.appendLine('[Brand] Theme existence check: false (file not found)');
      } else {
        this.outputChannel.appendLine(`[Brand] Theme existence check: false (error: ${error})`);
      }
      return false;
    }
  }

  /**
   * bt-1-1: Send brand-status message to the webview with current theme existence state.
   */
  private async sendBrandStatus(): Promise<void> {
    const hasTheme = await this.checkThemeExists();
    CatalogViewProvider.postMessage({ type: 'brand-status', hasTheme });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.outputChannel.appendLine('CatalogViewProvider: resolveWebviewView called');
    this.webviewView = webviewView;

    // AC-8: localResourceRoots includes dist, .slide-builder, and output
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'dist'),
        vscode.Uri.joinPath(this.workspaceUri, '.slide-builder'),
        vscode.Uri.joinPath(this.workspaceUri, 'output'),
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // AC-4: Register message handler for catalog data exchange
    // cv-2-1 AC-11: Pass extensionUri and workspaceUri for SlideViewerPanel creation
    // cv-5-3 AC-21: Pass thumbnailService for thumbnail requests
    // v3-2-1 AC-2: Pass globalState for view preference persistence
    const messageHandler = createCatalogMessageHandler(
      webviewView.webview,
      this.dataService,
      this.fileWatcher,
      this.outputChannel,
      this.extensionUri,
      this.workspaceUri,
      this.thumbnailService,
      this.globalState,
      this.deckTemplateConfigService,
      this.buildProgressService
    );

    // bt-1-1 AC-4: Send initial brand-status on webview resolve
    this.sendBrandStatus();

    // tm-3-2: Wire deck template file watcher to refresh catalog on external changes
    // tm-3-3: Also handle auto-open viewer during deck template creation
    const templateWatcherDisposable = this.fileWatcher.onTemplateFilesChanged(() => {
      this.outputChannel.appendLine('[CatalogViewProvider] Refreshing deck templates after file change');
      CatalogViewProvider.postMessage({ type: 'deck-templates-updated' });

      // tm-3-3: Check if a deck template creation is in progress
      this._handleCreationAutoOpen();
    });

    // bt-1-1 AC-4, AC-8: Wire file watcher for theme.json changes to update brand status
    // The existing .slide-builder/ watcher detects theme.json creation/deletion.
    // We subscribe to the general onDecksChanged callback which fires on any .slide-builder/ change.
    const brandWatcherDisposable = this.fileWatcher.onDecksChanged(() => {
      this.sendBrandStatus();
    });

    webviewView.onDidDispose(() => {
      messageHandler.dispose();
      templateWatcherDisposable.dispose();
      brandWatcherDisposable.dispose();
    });

    this.outputChannel.appendLine(
      'CatalogViewProvider: webview HTML and message handler set'
    );
  }

  /**
   * tm-3-3: Handle auto-open/refresh of viewer during deck template creation.
   * Called from the onTemplateFilesChanged callback.
   * Checks creationInProgress state and detects new slide HTML files.
   *
   * Story Reference: tm-3-3 AC-1 (auto-open), AC-2 (refresh), AC-3 (clear on completion)
   */
  private async _handleCreationAutoOpen(): Promise<void> {
    const state = deckTemplateCreationTracker.state;
    if (!state.active) {
      return; // No creation in progress — nothing to do
    }

    const slug = state.expectedSlug;

    // AC-3: Check if deck-templates.json was updated (creation complete)
    try {
      const templatesJsonUri = vscode.Uri.joinPath(
        this.workspaceUri,
        '.slide-builder',
        'config',
        'catalog',
        'deck-templates.json'
      );
      const templatesBytes = await vscode.workspace.fs.readFile(templatesJsonUri);
      const templatesContent = new TextDecoder().decode(templatesBytes);
      const parsed = JSON.parse(templatesContent);
      const templates = parsed?.templates ?? parsed;
      if (Array.isArray(templates)) {
        const found = templates.some(
          (t: { id?: string; path?: string }) =>
            t.id === slug || (t.path && t.path.includes(slug))
        );
        if (found) {
          this.outputChannel.appendLine(
            `[CatalogViewProvider] Deck template creation completed: ${slug}`
          );
          deckTemplateCreationTracker.clear();
          return;
        }
      }
    } catch {
      // deck-templates.json might not exist yet or be unreadable — continue checking slides
    }

    // AC-1/AC-2: Check for slide HTML files in the expected template folder
    try {
      const slidesUri = vscode.Uri.joinPath(
        this.workspaceUri,
        '.slide-builder',
        'config',
        'catalog',
        'deck-templates',
        slug,
        'slides'
      );

      let slideFiles: [string, vscode.FileType][] = [];
      try {
        const dirEntries = await vscode.workspace.fs.readDirectory(slidesUri);
        slideFiles = dirEntries.filter(
          ([name, type]) =>
            type === vscode.FileType.File &&
            /^slide-\d+\.html$/i.test(name)
        );
      } catch {
        // slides/ folder doesn't exist yet — not an HTML file, just non-slide files (e.g. template-config.yaml)
        return;
      }

      if (slideFiles.length === 0) {
        return; // No slide HTML files yet — only non-HTML files created so far (AC: 5.3)
      }

      // Sort by slide number to get the latest
      slideFiles.sort((a, b) => {
        const numA = parseInt(a[0].match(/slide-(\d+)/)?.[1] || '0', 10);
        const numB = parseInt(b[0].match(/slide-(\d+)/)?.[1] || '0', 10);
        return numA - numB;
      });

      const latestSlideFile = slideFiles[slideFiles.length - 1][0];
      const latestSlideNumber = parseInt(latestSlideFile.match(/slide-(\d+)/)?.[1] || '1', 10);

      if (!state.viewerOpened) {
        // AC-1: First slide detected — auto-open viewer
        const creationDeckId = '__deck-template-creation__';
        const creationDeckName = `Creating: ${state.templateName}`;

        try {
          SlideViewerV2Panel.createOrShow(
            this.extensionUri,
            this.workspaceUri,
            creationDeckId,
            creationDeckName,
            this.dataService,
            this.outputChannel,
            this.fileWatcher
          );

          // Read the first slide HTML and post to viewer
          const slideUri = vscode.Uri.joinPath(slidesUri, latestSlideFile);
          const slideBytes = await vscode.workspace.fs.readFile(slideUri);
          const html = new TextDecoder().decode(slideBytes);

          // Build slides array from all available slides
          const allSlides = await Promise.all(
            slideFiles.map(async ([name]) => {
              const num = parseInt(name.match(/slide-(\d+)/)?.[1] || '1', 10);
              const uri = vscode.Uri.joinPath(slidesUri, name);
              const bytes = await vscode.workspace.fs.readFile(uri);
              return {
                number: num,
                html: new TextDecoder().decode(bytes),
                fileName: name,
                slideId: name.replace(/[^a-zA-Z0-9]/g, '-'),
                title: name,
              };
            })
          );

          SlideViewerV2Panel.postMessage(
            {
              type: 'v2-deck-loaded',
              deck: {
                deckId: creationDeckId,
                deckName: creationDeckName,
                planPath: '',
                slides: allSlides,
                manifest: {
                  deckId: creationDeckId,
                  deckName: creationDeckName,
                  slideCount: allSlides.length,
                  slides: allSlides.map(s => ({
                    number: s.number,
                    fileName: s.fileName,
                    title: s.title,
                  })),
                  generatedAt: new Date().toISOString(),
                },
              },
            },
            creationDeckId
          );

          deckTemplateCreationTracker.state.viewerOpened = true;
          deckTemplateCreationTracker.state.slideCount = slideFiles.length;

          this.outputChannel.appendLine(
            `[CatalogViewProvider] Auto-opening viewer for deck template creation: ${slug}`
          );
        } catch (error) {
          // AC: 5.2 — Log error and continue without blocking
          this.outputChannel.appendLine(
            `[CatalogViewProvider] Failed to auto-open viewer for creation: ${error}`
          );
        }
      } else if (slideFiles.length > state.slideCount) {
        // AC-2: Subsequent slides detected — refresh viewer
        const creationDeckId = '__deck-template-creation__';

        try {
          const slideUri = vscode.Uri.joinPath(slidesUri, latestSlideFile);
          const slideBytes = await vscode.workspace.fs.readFile(slideUri);
          const html = new TextDecoder().decode(slideBytes);

          SlideViewerV2Panel.postMessage(
            {
              type: 'v2-slide-updated',
              slideNumber: latestSlideNumber,
              html,
            },
            creationDeckId
          );

          deckTemplateCreationTracker.state.slideCount = slideFiles.length;

          this.outputChannel.appendLine(
            `[CatalogViewProvider] Viewer refreshed for new slide: ${latestSlideFile}`
          );
        } catch (error) {
          this.outputChannel.appendLine(
            `[CatalogViewProvider] Failed to refresh viewer for new slide: ${error}`
          );
        }
      }
    } catch (error) {
      // Template folder doesn't exist yet — creation just started, nothing to detect
      this.outputChannel.appendLine(
        `[CatalogViewProvider] Creation auto-open check: template folder not found yet for ${slug}`
      );
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'catalog-webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'catalog-webview.css')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src ${webview.cspSource} 'unsafe-inline';
    script-src 'nonce-${nonce}';
    img-src ${webview.cspSource} data:;
    font-src ${webview.cspSource};
  ">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>Slide Builder Catalog</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
