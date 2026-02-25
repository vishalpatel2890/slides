import * as vscode from 'vscode';
import { parseYaml } from './yaml-document';
import { MessageHandler } from './message-handler';
import { deleteContextFile } from './claude-context-writer';
import type { BuildProgressService } from './BuildProgressService';
import type { WebviewMessage, PlanData, ValidationWarning, ExtensionMessage } from '../shared/types';

/**
 * Debounce delay for external change detection (AC-18.4.4, AC-18.4.7).
 * Prevents excessive updates when rapid external edits occur.
 */
const EXTERNAL_CHANGE_DEBOUNCE_MS = 300;

/**
 * Creates a debounced function that delays invoking fn until after
 * the specified wait time has elapsed since the last call.
 *
 * @param fn - Function to debounce
 * @param wait - Milliseconds to wait before calling fn
 * @returns Debounced function with cancel method
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: unknown[]) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * CustomTextEditorProvider for plan.yaml files.
 * Provides a visual editing experience for slide deck planning.
 *
 * Architecture Decisions:
 * - ADR-001: Uses CustomTextEditorProvider (not readonly) for native undo/redo
 * - ADR-002: Extension host is source of truth; webview is render-only client
 * - NFR12: Only activates for plan.yaml in Slide Builder projects (.slide-builder/)
 *
 * Story Reference: 18-3 Task 6 - Update extension to handle ready message
 * Story Reference: 18-4 Task 3 - External change detection with debouncing
 *
 * ## External Change Detection & Undo Flow (AC-18.4.4, AC-18.4.5, AC-18.4.6)
 *
 * External changes (Claude Code, text editor, undo/redo) trigger onDidChangeTextDocument.
 * The listener is debounced at 300ms to batch rapid changes before updating the webview.
 *
 * External Edit Flow (Claude Code → UI):
 * 1. Claude Code modifies plan.yaml via file system
 * 2. VS Code detects change → onDidChangeTextDocument fires
 * 3. Provider debounces (300ms)
 * 4. Provider re-parses YAML and sends plan-updated to webview
 * 5. Webview re-renders with new state
 *
 * Undo Flow (Cmd+Z):
 * 1. User presses Cmd+Z
 * 2. VS Code reverts document from undo stack
 * 3. onDidChangeTextDocument fires with reverted content
 * 4. Provider re-parses and sends plan-updated
 * 5. Webview shows reverted state
 *
 * This ensures the webview always reflects the document's current state,
 * whether changes come from the webview itself, external tools, or undo/redo.
 */
export class PlanEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'slideBuilder.planEditor';
  private readonly messageHandler: MessageHandler;
  private buildProgressService: BuildProgressService | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly outputChannel: vscode.OutputChannel
  ) {
    this.messageHandler = new MessageHandler(outputChannel, context.extensionUri);
  }

  /**
   * Set the BuildProgressService instance for real-time build status updates.
   * BR-1.3 AC-19: Enables build-status-changed messages from file system events.
   */
  setBuildProgressService(service: BuildProgressService): void {
    this.buildProgressService = service;
  }

  /**
   * Called when a plan.yaml file is opened.
   * Validates project structure and initializes the webview.
   */
  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this.outputChannel.appendLine(`Opening document: ${document.uri.fsPath}`);

    // NFR12: Validate .slide-builder/ directory exists
    await this.validateSlideBuilderProject(document);

    // Get workspace folder for Claude context file operations (AC-23.1.1)
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

    // Configure webview options
    // AC-18.3.10: localResourceRoots restricts webview to dist/ directory
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist')
      ]
    };

    // Set webview HTML content (includes CSP)
    // AC-18.3.9: Webview HTML includes Content Security Policy header
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Parse initial document and log slide count
    this.loadDocument(document);

    // Set up document change listener with debouncing (AC-18.4.4)
    // Debounce at 300ms to handle rapid external edits (e.g., from Claude Code)
    // AC-23.1.11, AC-23.1.12: Context file updates are debounced at same interval
    const debouncedSendUpdate = debounce(() => {
      this.outputChannel.appendLine('External change detected (debounced) - sending plan update');
      this.sendPlanUpdate(webviewPanel.webview, document);

      // AC-23.1.11: Regenerate context file when plan changes (fire-and-forget)
      if (workspaceFolder) {
        this.messageHandler.writeClaudeContext(document, workspaceFolder.uri);
      }
    }, EXTERNAL_CHANGE_DEBOUNCE_MS);

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        debouncedSendUpdate();
      }
    });

    // BR-1.3 AC-19 Task 5: Subscribe to BuildProgressService for real-time build-status-changed
    let buildProgressSubscription: vscode.Disposable | null = null;
    if (this.buildProgressService) {
      buildProgressSubscription = this.buildProgressService.onProgress((progress) => {
        // Forward build-status-changed for each slide that has changed to 'built'
        for (const slide of progress.slides) {
          if (slide.status === 'built' || slide.status === 'building') {
            const status = slide.status === 'built' ? 'built' : 'pending';
            webviewPanel.webview.postMessage({
              type: 'build-status-changed',
              slideNumber: slide.number,
              status,
            });
          }
        }
      });
      this.outputChannel.appendLine('[PlanEditor] Subscribed to BuildProgressService for real-time updates');
    }

    // Clean up when panel is disposed
    // AC-23.1.13: Delete context file on panel dispose
    webviewPanel.onDidDispose(() => {
      debouncedSendUpdate.cancel();
      changeDocumentSubscription.dispose();

      // BR-1.3: Dispose build progress subscription
      if (buildProgressSubscription) {
        buildProgressSubscription.dispose();
      }

      // AC-23.1.13: Delete Claude context file on dispose (fire-and-forget)
      if (workspaceFolder) {
        deleteContextFile(workspaceFolder.uri, this.outputChannel);
      }
    });

    // Handle messages from webview using MessageHandler
    // AC-18.3.6: Extension responds to 'ready' with plan-updated, templates-loaded, etc.
    webviewPanel.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        await this.messageHandler.handleMessage(message, webviewPanel.webview, document);
      },
      undefined,
      this.context.subscriptions
    );
  }

  /**
   * Validates that the document is in a Slide Builder project.
   * Shows warning if not, but continues to open custom editor (non-blocking).
   */
  private async validateSlideBuilderProject(document: vscode.TextDocument): Promise<void> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

    if (!workspaceFolder) {
      this.outputChannel.appendLine('No workspace folder found');
      vscode.window.showInformationMessage(
        'Plan Editor: No workspace folder found. Some features may not work correctly.'
      );
      return; // Non-blocking: continue opening custom editor
    }

    const slideBuilderDir = vscode.Uri.joinPath(workspaceFolder.uri, '.slide-builder');

    try {
      await vscode.workspace.fs.stat(slideBuilderDir);
      this.outputChannel.appendLine(`Validated Slide Builder project: ${workspaceFolder.uri.fsPath}`);
    } catch {
      this.outputChannel.appendLine(`Not a Slide Builder project: ${workspaceFolder.uri.fsPath}`);
      vscode.window.showInformationMessage(
        'Plan Editor: .slide-builder directory not found. Some features may not work correctly.'
      );
      // Non-blocking: continue opening custom editor anyway
    }
  }

  /**
   * Parses the document and logs initial state.
   */
  private loadDocument(document: vscode.TextDocument): void {
    try {
      const doc = parseYaml(document.getText());
      const data = doc.toJS() as { slides?: unknown[] };
      const slideCount = Array.isArray(data?.slides) ? data.slides.length : 0;
      this.outputChannel.appendLine(`YAML parse success: ${slideCount} slides found`);
    } catch (error) {
      this.outputChannel.appendLine(`YAML parse failure: ${error}`);
    }
  }

  /**
   * Sends plan update to the webview when document changes.
   * Used for external file changes (Claude Code, text editor).
   */
  private sendPlanUpdate(webview: vscode.Webview, document: vscode.TextDocument): void {
    try {
      const doc = parseYaml(document.getText());
      const plan = doc.toJS() as PlanData;
      const validationWarnings: ValidationWarning[] = [];

      const message: ExtensionMessage = {
        type: 'plan-updated',
        plan,
        validationWarnings,
      };

      webview.postMessage(message);
      this.outputChannel.appendLine(`Sent plan update: ${plan.slides?.length ?? 0} slides`);
    } catch (error) {
      this.outputChannel.appendLine(`Failed to send plan update: ${error}`);
    }
  }

  /**
   * Generates the HTML content for the webview.
   * AC-18.3.9: Includes Content Security Policy for secure script execution.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'plan-webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'plan-webview.css')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src ${webview.cspSource};
    script-src 'nonce-${nonce}';
    font-src ${webview.cspSource};
  ">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>Plan Editor</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

/**
 * Generates a random nonce for Content Security Policy.
 */
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
