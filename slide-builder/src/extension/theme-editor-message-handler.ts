import * as vscode from 'vscode';
import type { ThemeEditorWebviewMessage } from '../shared/types';
import type { ThemeEditorPanel } from './ThemeEditorPanel';
import { sendToClaudeCode } from './claude-code-integration';
import { validateThemeJson } from '../shared/themeValidation';

/**
 * Creates a message handler for the Theme Editor webview.
 * Routes ThemeEditorWebviewMessage types to appropriate handlers.
 *
 * Story Reference: bt-2-1 Task 3 — AC-4 (ready handshake)
 * Story Reference: bt-2-2 Task 10.2 — Theme data loading on ready
 * Story Reference: bt-2-4 Task 8 — AC-5, AC-6 (launch messages)
 * Architecture Reference: ADR-008 — Switch-based message routing
 *
 * Follows viewer-message-handler.ts pattern: factory function returning a Disposable.
 */
export function createThemeEditorMessageHandler(
  webview: vscode.Webview,
  outputChannel: vscode.OutputChannel,
  panel: ThemeEditorPanel,
  workspaceUri?: vscode.Uri,
): vscode.Disposable {
  // bt-2-1 Task 3.1: Switch-based handler on message.type
  const messageDisposable = webview.onDidReceiveMessage(
    (message: ThemeEditorWebviewMessage) => {
      switch (message.type) {
        // bt-2-2 Task 10.2: Handle theme-editor-ready — load theme data and send to webview
        case 'theme-editor-ready': {
          outputChannel.appendLine('[ThemeEditor] Panel ready');
          // bt-2-2: Load theme.json and send theme-editor-data message
          panel.loadThemeData();
          break;
        }

        // bt-2-3 Task 4.2: Save theme to disk and respond with result
        // bt-4-5 Task 2: Add validation before save (AC-25, AC-26, AC-27)
        case 'theme-editor-save': {
          outputChannel.appendLine('[ThemeEditor] Save requested');
          (async () => {
            try {
              // bt-4-5 Task 2.2: Validate theme before saving
              const validationResult = validateThemeJson(message.theme);

              // bt-4-5 Task 2.3: Block save if validation errors exist (AC-25)
              if (validationResult.errors.length > 0) {
                const errorMessage = 'Cannot save: missing required fields: ' + validationResult.errors.join(', ');
                outputChannel.appendLine(
                  `[ThemeEditor] Save blocked: validation failed (${validationResult.errors.length} errors)`,
                );
                webview.postMessage({
                  type: 'theme-editor-save-result',
                  success: false,
                  error: errorMessage,
                });
                return;
              }

              // bt-4-5 Task 2.4: Valid (possibly with warnings) — proceed with save (AC-26, AC-27)
              if (validationResult.warnings.length > 0) {
                outputChannel.appendLine(
                  `[ThemeEditor] Validation warnings: ${validationResult.warnings.join(', ')}`,
                );
              }

              const result = await panel.saveThemeData(message.theme as Record<string, unknown>);
              webview.postMessage({
                type: 'theme-editor-save-result',
                success: result.success,
                error: result.error,
              });

              if (!result.success) {
                vscode.window.showErrorMessage(
                  `Failed to save theme: ${result.error || 'Unknown error'}`,
                );
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              outputChannel.appendLine(`[ThemeEditor] Save handler error: ${errorMessage}`);
              webview.postMessage({
                type: 'theme-editor-save-result',
                success: false,
                error: errorMessage,
              });
              vscode.window.showErrorMessage(`Failed to save theme: ${errorMessage}`);
            }
          })();
          break;
        }

        // bt-2-3 Task 4: Revert — re-read theme.json from disk and send to webview
        case 'theme-editor-revert': {
          outputChannel.appendLine('[ThemeEditor] Revert requested — reloading theme from disk');
          panel.loadThemeData();
          break;
        }

        // bt-2-3 Task 5.2: Update panel title based on dirty state
        // bt-2-4 Task 2: Also track isDirty on panel for external change decision
        case 'theme-editor-dirty': {
          outputChannel.appendLine(`[ThemeEditor] Dirty state: ${message.isDirty}`);
          panel.updateTitle(message.isDirty);
          panel.setIsDirty(message.isDirty);
          break;
        }

        // bt-2-4 Task 8.1: Launch AI Theme Edit via Claude Code (AC-6)
        case 'theme-editor-launch-edit': {
          outputChannel.appendLine('[ThemeEditor] AI Theme Edit launched');
          (async () => {
            try {
              await sendToClaudeCode('/sb-brand:theme-edit', outputChannel, workspaceUri);
              // bt-2-4 Task 8.4: Show confirmation notification
              vscode.window.showInformationMessage('Theme edit command sent to Claude Code');
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              outputChannel.appendLine(`[ThemeEditor] AI Theme Edit error: ${errorMessage}`);
            }
          })();
          break;
        }

        // bt-2-4 Task 8.2: Launch Brand Setup via Claude Code (AC-5)
        case 'theme-editor-launch-setup': {
          outputChannel.appendLine('[ThemeEditor] Brand setup launched from onboarding');
          (async () => {
            try {
              await sendToClaudeCode('/sb-brand:setup', outputChannel, workspaceUri);
              // bt-2-4 Task 8.4: Show confirmation notification
              vscode.window.showInformationMessage('Brand setup command sent to Claude Code');
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              outputChannel.appendLine(`[ThemeEditor] Brand setup error: ${errorMessage}`);
            }
          })();
          break;
        }

        default: {
          outputChannel.appendLine(`[ThemeEditor] Unknown message type: ${(message as { type: string }).type}`);
          break;
        }
      }
    },
  );

  return messageDisposable;
}
