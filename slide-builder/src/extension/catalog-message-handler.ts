import * as vscode from 'vscode';
import * as path from 'path';
import { parse, stringify } from 'yaml';
import type { CatalogWebviewMessage } from '../shared/types';
import { parseYaml, serializeYaml, deleteField } from './yaml-document';
import type { CatalogDataService } from './CatalogDataService';
import type { DeckTemplateConfigService } from './DeckTemplateConfigService';
import type { FileWatcherService } from './FileWatcherService';
import type { ThumbnailService } from './ThumbnailService';
import { SlideViewerV2Panel } from './SlideViewerV2Panel';
import { DeckTemplateEditorPanel } from './DeckTemplateEditorPanel';
import { ThemeEditorPanel } from './ThemeEditorPanel';
import { sendToClaudeCode } from './claude-code-integration';
import { configService } from './extension';
import { PromptAssemblyService } from './PromptAssemblyService';
import type { BuildProgressService } from './BuildProgressService';

// ============================================================================
// tm-3-3: Deck template creation in-progress tracking
// Exported for use by CatalogViewProvider's onTemplateFilesChanged callback.
// ============================================================================

export interface DeckTemplateCreationState {
  /** Whether a deck template creation is currently in progress */
  active: boolean;
  /** The template name as entered by the user */
  templateName: string;
  /** The expected slug derived from the template name (lowercase, hyphenated) */
  expectedSlug: string;
  /** Whether the viewer has already been auto-opened for this creation session */
  viewerOpened: boolean;
  /** The number of slide files detected so far (for tracking subsequent slides) */
  slideCount: number;
}

/**
 * Module-level tracker for deck template creation in-progress state.
 * Accessible by CatalogViewProvider to check during onTemplateFilesChanged.
 *
 * Story Reference: tm-3-3 AC-1, AC-2, AC-3
 */
export const deckTemplateCreationTracker = {
  state: {
    active: false,
    templateName: '',
    expectedSlug: '',
    viewerOpened: false,
    slideCount: 0,
  } as DeckTemplateCreationState,

  /** Timeout handle for auto-clearing after configured duration */
  _timeoutHandle: undefined as ReturnType<typeof setTimeout> | undefined,

  /** Duration before auto-clearing the in-progress flag (ms) */
  TIMEOUT_MS: 60_000,

  /**
   * Start tracking a new deck template creation session.
   * Derives expected slug from the template name (lowercase, spaces to hyphens, strip non-alphanumeric).
   */
  start(templateName: string, outputChannel: { appendLine: (msg: string) => void }): void {
    // Edge case: overlapping sessions — log warning and override
    if (this.state.active) {
      outputChannel.appendLine(
        `[CatalogViewProvider] Overriding previous creation in-progress: ${this.state.expectedSlug} -> ${this._deriveSlug(templateName)}`
      );
    }

    const expectedSlug = this._deriveSlug(templateName);
    this.state = {
      active: true,
      templateName,
      expectedSlug,
      viewerOpened: false,
      slideCount: 0,
    };

    // Clear any existing timeout
    if (this._timeoutHandle !== undefined) {
      clearTimeout(this._timeoutHandle);
    }

    // Set auto-clear timeout
    this._timeoutHandle = setTimeout(() => {
      if (this.state.active) {
        outputChannel.appendLine(
          `[CatalogViewProvider] Creation in-progress timed out after ${this.TIMEOUT_MS}ms: ${this.state.expectedSlug}`
        );
        this.clear();
      }
    }, this.TIMEOUT_MS);

    outputChannel.appendLine(
      `[CatalogViewProvider] Creation in-progress started: ${expectedSlug} (timeout: ${this.TIMEOUT_MS}ms)`
    );
  },

  /**
   * Clear the creation in-progress state and cancel timeout.
   */
  clear(): void {
    this.state = {
      active: false,
      templateName: '',
      expectedSlug: '',
      viewerOpened: false,
      slideCount: 0,
    };
    if (this._timeoutHandle !== undefined) {
      clearTimeout(this._timeoutHandle);
      this._timeoutHandle = undefined;
    }
  },

  /**
   * Derive a slug from a template name using same convention as Claude Code.
   * Lowercase, spaces to hyphens, strip non-alphanumeric.
   */
  _deriveSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },
};

/**
 * Formats form data as context text for Claude Code CLI.
 * Converts form field values into a readable context block.
 *
 * Story Reference: v3-5-1 AC-3, AC-5
 *
 * @param operation - The operation/skill name
 * @param data - Form field values keyed by field name
 * @returns Formatted context string for Claude
 */
/**
 * Escapes a string for safe use as a double-quoted CLI argument.
 * - Escapes embedded double quotes (" -> \")
 * - Escapes backslashes (\ -> \\)
 * - Strips newlines from single-line fields
 * - Trims leading/trailing whitespace
 *
 * Story Reference: bt-1-3 AC-escape
 *
 * @param value - The raw user-provided string
 * @param stripNewlines - Whether to strip newline characters (default: true)
 * @returns The escaped string safe for embedding in double quotes
 */
export function escapeBrandCliArg(value: string, stripNewlines = true): string {
  let escaped = value.trim();
  // Escape backslashes first (before escaping quotes, to avoid double-escaping)
  escaped = escaped.replace(/\\/g, '\\\\');
  // Escape embedded double quotes
  escaped = escaped.replace(/"/g, '\\"');
  // Strip newlines if requested (single-line fields)
  if (stripNewlines) {
    escaped = escaped.replace(/[\r\n]+/g, ' ');
  }
  return escaped;
}

/**
 * Formats brand setup form data into the /sb-brand:setup CLI command.
 * Required: --folder flag with escaped asset folder path.
 * Optional: --company and --description flags (omitted if empty/undefined).
 *
 * Story Reference: bt-1-3 AC-7
 *
 * @param data - The form data: { assetFolder, companyName?, brandDescription? }
 * @returns The formatted CLI command string
 */
export function formatBrandSetupCommand(data: {
  assetFolder: string;
  companyName?: string;
  brandDescription?: string;
}): string {
  const parts: string[] = [`/sb-brand:setup --folder "${escapeBrandCliArg(data.assetFolder)}"`];

  if (data.companyName && data.companyName.trim()) {
    parts.push(`--company "${escapeBrandCliArg(data.companyName)}"`);
  }

  if (data.brandDescription && data.brandDescription.trim()) {
    parts.push(`--description "${escapeBrandCliArg(data.brandDescription)}"`);
  }

  return parts.join(' ');
}

function formatFormDataForCli(operation: string, data: Record<string, unknown>): string {
  const lines: string[] = ['Here is the context from the user:'];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;

    // Convert camelCase to Title Case for display
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();

    lines.push(`- ${label}: ${String(value)}`);
  }

  return lines.join('\n');
}

/**
 * Read deck metadata from status.yaml for a given deck slug.
 * Returns null if status.yaml doesn't exist or deck not found.
 *
 * Used by delete-deck handler to capture metadata before deletion
 * for the history entry (following workflow Step 4 pattern).
 */
async function readDeckMetadataFromStatus(
  workspaceRoot: vscode.Uri,
  deckSlug: string,
  outputChannel: vscode.OutputChannel
): Promise<{ name: string; total_slides: number } | null> {
  try {
    const statusUri = vscode.Uri.joinPath(workspaceRoot, '.slide-builder', 'status.yaml');
    const statusBytes = await vscode.workspace.fs.readFile(statusUri);
    const statusText = new TextDecoder().decode(statusBytes);
    const statusDoc = parseYaml(statusText);

    const deckEntry = statusDoc.getIn(['decks', deckSlug]);
    if (!deckEntry || typeof deckEntry !== 'object') {
      outputChannel.appendLine(
        `readDeckMetadataFromStatus: Deck '${deckSlug}' not found in status.yaml`
      );
      return null;
    }

    const name = statusDoc.getIn(['decks', deckSlug, 'name']);
    const totalSlides = statusDoc.getIn(['decks', deckSlug, 'total_slides']);

    if (typeof name === 'string' && typeof totalSlides === 'number') {
      return { name, total_slides: totalSlides };
    }

    outputChannel.appendLine(
      `readDeckMetadataFromStatus: Invalid metadata for deck '${deckSlug}'`
    );
    return null;
  } catch (error) {
    outputChannel.appendLine(
      `readDeckMetadataFromStatus: Failed to read status.yaml: ${error}`
    );
    return null;
  }
}

/**
 * Update status.yaml after deck deletion:
 * - Remove deck entry from registry
 * - Add history entry
 * - Update last_modified timestamp
 *
 * Follows workflow Step 4 pattern from delete-deck/instructions.md
 * Uses comment-preserving YAML Document API (ADR-003)
 */
async function updateStatusAfterDeletion(
  workspaceRoot: vscode.Uri,
  deckSlug: string,
  metadata: { name: string; total_slides: number },
  outputChannel: vscode.OutputChannel
): Promise<void> {
  try {
    const statusUri = vscode.Uri.joinPath(workspaceRoot, '.slide-builder', 'status.yaml');

    const statusBytes = await vscode.workspace.fs.readFile(statusUri);
    const statusText = new TextDecoder().decode(statusBytes);
    const statusDoc = parseYaml(statusText);

    // Remove deck entry from registry
    const deleted = deleteField(statusDoc, ['decks', deckSlug]);
    if (!deleted) {
      outputChannel.appendLine(
        `updateStatusAfterDeletion: Deck '${deckSlug}' was not in registry (already removed)`
      );
    }

    // Add history entry
    const history = statusDoc.getIn(['history']) || [];
    const historyEntry = {
      action: `Deleted deck: ${metadata.name} (${deckSlug}, ${metadata.total_slides} slides)`,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = Array.isArray(history)
      ? [historyEntry, ...history]
      : [historyEntry];
    statusDoc.setIn(['history'], updatedHistory);

    // Update last_modified
    statusDoc.setIn(['last_modified'], new Date().toISOString());

    // Write back with comment preservation
    const updatedStatusText = serializeYaml(statusDoc);
    await vscode.workspace.fs.writeFile(statusUri, Buffer.from(updatedStatusText, 'utf8'));

    outputChannel.appendLine(
      `updateStatusAfterDeletion: Updated status.yaml - removed ${deckSlug}, added history`
    );
  } catch (error) {
    // Non-fatal: log error but don't fail the deletion
    outputChannel.appendLine(
      `updateStatusAfterDeletion: Failed to update status.yaml: ${error}`
    );
    outputChannel.appendLine(
      `Note: Deck files were deleted but status.yaml was not updated. Manual cleanup may be needed.`
    );
  }
}

/**
 * Update status.yaml after deck rename:
 * - Move deck entry from old slug key to new slug key
 * - Update output_folder path in the entry
 * - Update name if newName provided
 * - Add history entry
 * - Update last_modified timestamp
 *
 * Story Reference: rename-deck-1 AC-2, AC-3
 * Uses comment-preserving YAML Document API (ADR-003)
 */
async function updateStatusAfterRename(
  workspaceRoot: vscode.Uri,
  oldSlug: string,
  newSlug: string,
  newName: string | undefined,
  outputChannel: vscode.OutputChannel
): Promise<void> {
  try {
    const statusUri = vscode.Uri.joinPath(workspaceRoot, '.slide-builder', 'status.yaml');

    const statusBytes = await vscode.workspace.fs.readFile(statusUri);
    const statusText = new TextDecoder().decode(statusBytes);
    const statusDoc = parseYaml(statusText);

    // Read existing deck entry
    const deckEntry = statusDoc.getIn(['decks', oldSlug]);
    if (!deckEntry || typeof deckEntry !== 'object') {
      outputChannel.appendLine(
        `updateStatusAfterRename: Deck '${oldSlug}' not found in status.yaml registry`
      );
      return;
    }

    // Get current values for history entry
    const oldName = statusDoc.getIn(['decks', oldSlug, 'name']) as string || oldSlug;
    const oldOutputFolder = statusDoc.getIn(['decks', oldSlug, 'output_folder']) as string || '';

    // Create new entry with updated slug key
    // Clone the entry data by getting all fields
    const newEntry: Record<string, unknown> = {};
    if (typeof deckEntry === 'object' && deckEntry !== null) {
      const entryObj = deckEntry as Record<string, unknown>;
      for (const key of Object.keys(entryObj)) {
        newEntry[key] = entryObj[key];
      }
    }

    // Update output_folder path: replace old slug with new slug in the path
    if (oldOutputFolder) {
      newEntry['output_folder'] = oldOutputFolder.replace(oldSlug, newSlug);
    }

    // Update name if provided
    if (newName) {
      newEntry['name'] = newName;
    }

    // Remove old entry and add new entry
    deleteField(statusDoc, ['decks', oldSlug]);
    statusDoc.setIn(['decks', newSlug], newEntry);

    // Add history entry
    const displayName = newName || oldName;
    const history = statusDoc.getIn(['history']) || [];
    const historyEntry = {
      action: `Renamed deck: ${oldName} (${oldSlug}) → ${displayName} (${newSlug})`,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = Array.isArray(history)
      ? [historyEntry, ...history]
      : [historyEntry];
    statusDoc.setIn(['history'], updatedHistory);

    // Update last_modified
    statusDoc.setIn(['last_modified'], new Date().toISOString());

    // Write back with comment preservation
    const updatedStatusText = serializeYaml(statusDoc);
    await vscode.workspace.fs.writeFile(statusUri, Buffer.from(updatedStatusText, 'utf8'));

    outputChannel.appendLine(
      `updateStatusAfterRename: Updated status.yaml - renamed ${oldSlug} → ${newSlug}`
    );
  } catch (error) {
    // Non-fatal: log error but don't fail the rename
    outputChannel.appendLine(
      `updateStatusAfterRename: Failed to update status.yaml: ${error}`
    );
  }
}

/**
 * Creates a message handler that routes CatalogWebviewMessage types
 * and wires file watcher updates to the catalog webview.
 *
 * Story Reference: cv-1-3 AC-4; cv-2-1 AC-11; cv-2-5 (fileWatcher pass-through)
 * Story Reference: cv-5-3 AC-21 (thumbnail request handling)
 */
export function createCatalogMessageHandler(
  webview: vscode.Webview,
  dataService: CatalogDataService,
  fileWatcher: FileWatcherService,
  outputChannel: vscode.OutputChannel,
  extensionUri?: vscode.Uri,
  workspaceUri?: vscode.Uri,
  thumbnailService?: ThumbnailService,
  globalState?: vscode.Memento,
  deckTemplateConfigService?: DeckTemplateConfigService,
  buildProgressService?: BuildProgressService,
): vscode.Disposable {
  const disposables: vscode.Disposable[] = [];

  // tm-1-5: Instantiate PromptAssemblyService for assembling Claude Code prompts
  // from modal form data and workspace context files (theme.json, design-standards.md, slide-templates.json)
  const promptAssemblyService = workspaceUri
    ? new PromptAssemblyService(workspaceUri, outputChannel)
    : null;

  // Handle messages from catalog webview
  const messageDisposable = webview.onDidReceiveMessage(
    async (message: CatalogWebviewMessage) => {
      outputChannel.appendLine(
        `CatalogMessageHandler: Received ${message.type}`
      );

      switch (message.type) {
        case 'ready': {
          // cv-3-3: Use scanDecksWithFolders to include folder data
          const { decks, folders } = await dataService.scanDecksWithFolders();
          await webview.postMessage({ type: 'catalog-data', decks, folders });
          // cv-4-1: Send brand assets alongside deck data
          const brandAssets = await dataService.scanBrandAssets(webview);
          await webview.postMessage({ type: 'brand-assets', assets: brandAssets });
          // v3-2-1 AC-2, AC-3: Send persisted view preference (defaults to 'grid')
          if (globalState) {
            const viewMode = globalState.get<'grid' | 'list'>('slideBuilder.catalogViewMode', 'grid');
            outputChannel.appendLine(`CatalogMessageHandler: Sending view-preference: ${viewMode}`);
            await webview.postMessage({ type: 'view-preference', mode: viewMode });
          }
          break;
        }

        case 'request-deck-detail': {
          const deck = await dataService.getDeckDetail(message.deckId);
          if (deck) {
            await webview.postMessage({ type: 'deck-detail', deck });
          } else {
            await webview.postMessage({
              type: 'error',
              message: `Deck not found: ${message.deckId}`,
            });
          }
          break;
        }

        case 'open-plan-editor': {
          // cv-4-3: Use async path lookup to find decks in folders
          const deckUri = await dataService.getDeckPathAsync(message.deckId);
          const planUri = vscode.Uri.joinPath(deckUri, 'plan.yaml');
          await vscode.commands.executeCommand('vscode.open', planUri);
          break;
        }

        case 'present-deck': {
          // cv-2-4, pd-1-3: Route through presentDeck command for HTTP server flow
          await vscode.commands.executeCommand('slideBuilder.presentDeck', message.deckId);
          break;
        }

        case 'open-slide-viewer': {
          // cv-2-6 AC-1, AC-9: Open V2 Slide Viewer panel for the deck
          if (extensionUri && workspaceUri) {
            const detail = await dataService.getDeckDetail(message.deckId);
            const deckName = detail?.name ?? message.deckId;
            outputChannel.appendLine(
              `CatalogMessageHandler: Opening V2 viewer for deck '${message.deckId}'`
            );
            SlideViewerV2Panel.createOrShow(
              extensionUri,
              workspaceUri,
              message.deckId,
              deckName,
              dataService,
              outputChannel,
              fileWatcher
            );
          } else {
            outputChannel.appendLine(
              'CatalogMessageHandler: Cannot open V2 viewer — extensionUri/workspaceUri not provided'
            );
          }
          break;
        }

        case 'create-deck': {
          // cv-3-1: Create new deck from template
          // Note: "Plan with AI" now uses submit-operation-form via OperationModal (v3-5-1)
          outputChannel.appendLine(
            `CatalogMessageHandler: Creating deck via ${message.method}`
          );

          if (message.method === 'from-template') {
            // AC-3: Show QuickPick with deck templates
            const templates = await dataService.getDeckTemplates();

            if (templates.length === 0) {
              vscode.window.showWarningMessage(
                'No deck templates available. Create templates in .slide-builder/config/catalog/deck-templates.json'
              );
              break;
            }

            const selected = await vscode.window.showQuickPick(
              templates.map((t) => ({
                label: t.name,
                description: t.description,
                detail: t.path,
                templateId: t.id,
                templatePath: t.path,
              })),
              {
                placeHolder: 'Select a deck template',
                title: 'Create Deck from Template',
              }
            );

            if (selected && selected.templatePath && workspaceUri) {
              // Copy template to new deck folder
              const templateUri = vscode.Uri.joinPath(
                workspaceUri,
                selected.templatePath
              );
              const deckName = await vscode.window.showInputBox({
                prompt: 'Enter a name for your new deck',
                placeHolder: 'my-new-deck',
                validateInput: (value) => {
                  if (!value || value.trim().length === 0) {
                    return 'Deck name is required';
                  }
                  // Sanitize for folder name
                  if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
                    return 'Use only letters, numbers, hyphens, and underscores';
                  }
                  return null;
                },
              });

              if (deckName) {
                const newDeckUri = vscode.Uri.joinPath(
                  workspaceUri,
                  'output',
                  deckName
                );
                try {
                  await vscode.workspace.fs.copy(templateUri, newDeckUri);
                  outputChannel.appendLine(
                    `CatalogMessageHandler: Created deck '${deckName}' from template`
                  );
                  // File watcher will auto-refresh the catalog
                  await webview.postMessage({
                    type: 'deck-created',
                    deckId: deckName,
                  });
                } catch (error) {
                  outputChannel.appendLine(
                    `CatalogMessageHandler: Failed to create deck from template: ${error}`
                  );
                  vscode.window.showErrorMessage(
                    `Failed to create deck: ${error}`
                  );
                }
              }
            }
          }
          break;
        }

        case 'duplicate-deck': {
          // cv-3-2: Duplicate deck directory with "-copy" suffix
          outputChannel.appendLine(
            `CatalogMessageHandler: Duplicating deck '${message.deckId}'`
          );

          const sourceDeckUri = await dataService.getDeckPathAsync(message.deckId);

          // Find a unique target name: {deck}-copy, {deck}-copy-2, etc.
          let copyNum = 0;
          let targetDeckId: string;
          let targetDeckUri: vscode.Uri;
          let targetExists = true;

          while (targetExists) {
            targetDeckId = copyNum === 0
              ? `${message.deckId}-copy`
              : `${message.deckId}-copy-${copyNum + 1}`;
            targetDeckUri = vscode.Uri.joinPath(sourceDeckUri, '..', targetDeckId);

            try {
              await vscode.workspace.fs.stat(targetDeckUri);
              // Target exists, try next number
              copyNum++;
            } catch {
              // Target doesn't exist, we can use this name
              targetExists = false;
            }
          }

          try {
            await vscode.workspace.fs.copy(sourceDeckUri, targetDeckUri!);

            // Update deck_name in plan.yaml to append " Copy" suffix
            const planUri = vscode.Uri.joinPath(targetDeckUri!, 'plan.yaml');
            try {
              const planBytes = await vscode.workspace.fs.readFile(planUri);
              const planContent = new TextDecoder().decode(planBytes);
              const plan = parse(planContent);

              if (plan && typeof plan.deck_name === 'string') {
                // Generate the display name suffix matching directory suffix
                const nameSuffix = copyNum === 0 ? ' Copy' : ` Copy ${copyNum + 1}`;
                plan.deck_name = plan.deck_name + nameSuffix;
                const updatedContent = stringify(plan);
                await vscode.workspace.fs.writeFile(
                  planUri,
                  new TextEncoder().encode(updatedContent)
                );
                outputChannel.appendLine(
                  `CatalogMessageHandler: Updated deck_name to '${plan.deck_name}'`
                );
              }
            } catch (planError) {
              // Non-fatal: deck was copied but plan.yaml update failed
              outputChannel.appendLine(
                `CatalogMessageHandler: Warning - could not update plan.yaml: ${planError}`
              );
            }

            outputChannel.appendLine(
              `CatalogMessageHandler: Duplicated deck '${message.deckId}' → '${targetDeckId!}'`
            );
            // File watcher will auto-refresh the catalog
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Failed to duplicate deck: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to duplicate deck: ${error}`,
            });
          }
          break;
        }

        case 'delete-deck': {
          // cv-3-2: Delete deck directory recursively
          // ENHANCEMENT: Also update status.yaml registry (workflow Step 4)
          outputChannel.appendLine(
            `CatalogMessageHandler: Deleting deck '${message.deckId}'`
          );

          const deckUri = await dataService.getDeckPathAsync(message.deckId);

          try {
            // Step 1: Read deck metadata from status.yaml BEFORE deletion
            // (needed for history entry - workflow Step 4 pattern)
            const metadata = await readDeckMetadataFromStatus(
              workspaceUri!,
              message.deckId,
              outputChannel
            );

            // Step 2: Delete deck files
            await vscode.workspace.fs.delete(deckUri, { recursive: true });
            outputChannel.appendLine(
              `CatalogMessageHandler: Deleted deck directory '${message.deckId}'`
            );

            // Step 3: Update status.yaml (remove deck, add history)
            if (metadata) {
              await updateStatusAfterDeletion(
                workspaceUri!,
                message.deckId,
                metadata,
                outputChannel
              );
            } else {
              outputChannel.appendLine(
                `CatalogMessageHandler: Skipping status.yaml update (metadata not found)`
              );
            }

            // File watcher will auto-refresh the catalog
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Failed to delete deck: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to delete deck: ${error}`,
            });
          }
          break;
        }

        // rename-deck-1: Rename deck display name and/or directory slug
        case 'rename-deck': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Renaming deck '${message.deckId}' (newName: ${message.newName ?? 'unchanged'}, newSlug: ${message.newSlug ?? 'unchanged'})`
          );

          try {
            const deckId = message.deckId;
            const newName = message.newName;
            const newSlug = message.newSlug;
            let currentName = newName;

            // rename-deck-1 AC-1: Update plan.yaml display name if newName provided
            if (newName) {
              const deckUri = await dataService.getDeckPathAsync(deckId);
              const planUri = vscode.Uri.joinPath(deckUri, 'plan.yaml');

              const planBytes = await vscode.workspace.fs.readFile(planUri);
              const planContent = new TextDecoder().decode(planBytes);
              const plan = parse(planContent);

              if (plan && typeof plan === 'object') {
                currentName = currentName || plan.deck_name || deckId;
                plan.deck_name = newName;
                plan.last_modified = new Date().toISOString();
                const updatedContent = stringify(plan);
                await vscode.workspace.fs.writeFile(
                  planUri,
                  new TextEncoder().encode(updatedContent)
                );
                outputChannel.appendLine(
                  `CatalogMessageHandler: Updated deck_name to '${newName}' in plan.yaml`
                );
              }
            }

            // rename-deck-1 AC-2, AC-5: Rename directory if newSlug provided
            if (newSlug) {
              await dataService.renameDeck(deckId, newSlug);

              // rename-deck-1 AC-2, AC-3: Update status.yaml with new key
              if (workspaceUri) {
                await updateStatusAfterRename(
                  workspaceUri,
                  deckId,
                  newSlug,
                  newName,
                  outputChannel
                );
              }
            } else if (newName && workspaceUri) {
              // Name-only rename: update status.yaml name field
              try {
                const statusUri = vscode.Uri.joinPath(workspaceUri, '.slide-builder', 'status.yaml');
                const statusBytes = await vscode.workspace.fs.readFile(statusUri);
                const statusText = new TextDecoder().decode(statusBytes);
                const statusDoc = parseYaml(statusText);

                const deckEntry = statusDoc.getIn(['decks', deckId]);
                if (deckEntry) {
                  statusDoc.setIn(['decks', deckId, 'name'], newName);
                  statusDoc.setIn(['last_modified'], new Date().toISOString());
                  const updatedStatusText = serializeYaml(statusDoc);
                  await vscode.workspace.fs.writeFile(statusUri, Buffer.from(updatedStatusText, 'utf8'));
                  outputChannel.appendLine(
                    `CatalogMessageHandler: Updated deck name in status.yaml`
                  );
                }
              } catch (statusError) {
                outputChannel.appendLine(
                  `CatalogMessageHandler: Warning - could not update status.yaml name: ${statusError}`
                );
              }
            }

            // rename-deck-1 AC-7: Post success message
            const resultDeckId = newSlug ?? deckId;
            const resultName = currentName || deckId;
            await webview.postMessage({
              type: 'deck-renamed',
              deckId: resultDeckId,
              newName: resultName,
            });

            outputChannel.appendLine(
              `CatalogMessageHandler: Rename complete - deck '${deckId}' → '${resultDeckId}'`
            );
            // File watcher will auto-refresh the catalog
          } catch (error) {
            // rename-deck-1 AC-4, AC-6: Error handling
            outputChannel.appendLine(
              `CatalogMessageHandler: Failed to rename deck: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to rename deck: ${error}`,
              context: 'rename-deck',
            });
          }
          break;
        }

        // cv-3-3: Folder operations
        case 'create-folder': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Creating folder`
          );

          try {
            // Generate unique folder name
            let folderName = 'New Folder';
            let num = 0;
            let exists = true;

            while (exists) {
              const testName = num === 0 ? folderName : `${folderName} ${num + 1}`;
              try {
                const testUri = vscode.Uri.joinPath(
                  workspaceUri!,
                  'output',
                  testName
                );
                await vscode.workspace.fs.stat(testUri);
                num++;
              } catch {
                folderName = num === 0 ? folderName : `${folderName} ${num + 1}`;
                exists = false;
              }
            }

            const folderId = await dataService.createFolder(folderName);
            outputChannel.appendLine(
              `CatalogMessageHandler: Created folder '${folderId}'`
            );
            await webview.postMessage({
              type: 'folder-created',
              folderId,
            });
            // File watcher will auto-refresh the catalog
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Failed to create folder: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to create folder: ${error}`,
            });
          }
          break;
        }

        case 'delete-folder': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Deleting folder '${message.folderId}'`
          );

          try {
            await dataService.deleteFolder(message.folderId);
            outputChannel.appendLine(
              `CatalogMessageHandler: Deleted folder '${message.folderId}'`
            );
            // File watcher will auto-refresh the catalog
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Failed to delete folder: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to delete folder: ${error}`,
            });
          }
          break;
        }

        case 'rename-folder': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Renaming folder '${message.folderId}' to '${message.newName}'`
          );

          try {
            await dataService.renameFolder(message.folderId, message.newName);
            outputChannel.appendLine(
              `CatalogMessageHandler: Renamed folder '${message.folderId}' → '${message.newName}'`
            );
            // File watcher will auto-refresh the catalog
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Failed to rename folder: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to rename folder: ${error}`,
            });
          }
          break;
        }

        case 'move-deck': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Moving deck '${message.deckId}' to folder '${message.targetFolderId ?? 'root'}'`
          );

          try {
            // Find the current location of the deck to determine source folder
            const { decks } = await dataService.scanDecksWithFolders();
            const deck = decks.find((d) => d.id === message.deckId);
            const sourceFolderId = deck?.folderId;

            await dataService.moveDeck(message.deckId, sourceFolderId, message.targetFolderId);
            outputChannel.appendLine(
              `CatalogMessageHandler: Moved deck '${message.deckId}' to '${message.targetFolderId ?? 'root'}'`
            );
            // File watcher will auto-refresh the catalog
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Failed to move deck: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to move deck: ${error}`,
              context: 'move-deck',
            });
          }
          break;
        }

        // cv-5-4: Bulk delete decks
        case 'delete-decks': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Bulk deleting ${message.deckIds.length} decks`
          );

          let successCount = 0;
          const failures: string[] = [];

          for (const deckId of message.deckIds) {
            try {
              const deckUri = await dataService.getDeckPathAsync(deckId);
              await vscode.workspace.fs.delete(deckUri, { recursive: true });
              successCount++;
              outputChannel.appendLine(
                `CatalogMessageHandler: Deleted deck '${deckId}'`
              );
            } catch (error) {
              failures.push(deckId);
              outputChannel.appendLine(
                `CatalogMessageHandler: Failed to delete deck '${deckId}': ${error}`
              );
            }
          }

          if (failures.length > 0) {
            await webview.postMessage({
              type: 'error',
              message: `Deleted ${successCount} decks. Failed to delete ${failures.length}: ${failures.join(', ')}`,
              context: 'delete-decks',
            });
          }
          // File watcher will auto-refresh the catalog
          break;
        }

        // cv-5-4: Bulk delete brand assets
        case 'delete-brand-assets': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Bulk deleting ${message.ids.length} brand assets`
          );

          let successCount = 0;
          const failures: string[] = [];

          for (const assetId of message.ids) {
            try {
              await dataService.deleteBrandAsset(assetId);
              successCount++;
              outputChannel.appendLine(
                `CatalogMessageHandler: Deleted brand asset '${assetId}'`
              );
            } catch (error) {
              failures.push(assetId);
              outputChannel.appendLine(
                `CatalogMessageHandler: Failed to delete brand asset '${assetId}': ${error}`
              );
            }
          }

          if (failures.length > 0) {
            await webview.postMessage({
              type: 'asset-operation-error',
              operation: 'delete',
              message: `Deleted ${successCount} assets. Failed to delete ${failures.length}.`,
            });
          } else {
            await webview.postMessage({
              type: 'asset-operation-success',
              operation: 'delete',
              count: successCount,
            });
          }
          // File watcher will auto-refresh the catalog
          break;
        }

        // cv-5-4: Bulk delete slides from a deck
        case 'delete-slides': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Bulk deleting ${message.slideNumbers.length} slides from deck '${message.deckId}'`
          );

          try {
            const deckUri = await dataService.getDeckPathAsync(message.deckId);
            let successCount = 0;
            const failures: number[] = [];

            // Sort descending so we delete from end first (avoids index shifting issues)
            const slideNums = [...message.slideNumbers].sort((a, b) => b - a);

            for (const slideNum of slideNums) {
              try {
                const slideUri = vscode.Uri.joinPath(deckUri, `slide-${slideNum}.html`);
                await vscode.workspace.fs.delete(slideUri);
                successCount++;
                outputChannel.appendLine(
                  `CatalogMessageHandler: Deleted slide-${slideNum}.html`
                );
              } catch (error) {
                failures.push(slideNum);
                outputChannel.appendLine(
                  `CatalogMessageHandler: Failed to delete slide-${slideNum}.html: ${error}`
                );
              }
            }

            if (failures.length > 0) {
              await webview.postMessage({
                type: 'error',
                message: `Deleted ${successCount} slides. Failed to delete ${failures.length}.`,
                context: 'delete-slides',
              });
            }
            // File watcher will auto-refresh
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Failed to access deck for slide deletion: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to delete slides: ${error}`,
              context: 'delete-slides',
            });
          }
          break;
        }

        // cv-5-4: Move multiple decks to a folder
        case 'move-decks-to-folder': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Bulk moving ${message.deckIds.length} decks to folder '${message.targetFolderId || 'root'}'`
          );

          let successCount = 0;
          const failures: string[] = [];

          // Get current deck locations
          const { decks } = await dataService.scanDecksWithFolders();

          for (const deckId of message.deckIds) {
            try {
              const deck = decks.find((d) => d.id === deckId);
              const sourceFolderId = deck?.folderId;
              await dataService.moveDeck(deckId, sourceFolderId, message.targetFolderId || undefined);
              successCount++;
              outputChannel.appendLine(
                `CatalogMessageHandler: Moved deck '${deckId}' to '${message.targetFolderId || 'root'}'`
              );
            } catch (error) {
              failures.push(deckId);
              outputChannel.appendLine(
                `CatalogMessageHandler: Failed to move deck '${deckId}': ${error}`
              );
            }
          }

          if (failures.length > 0) {
            await webview.postMessage({
              type: 'error',
              message: `Moved ${successCount} decks. Failed to move ${failures.length}: ${failures.join(', ')}`,
              context: 'move-decks-to-folder',
            });
          }
          // File watcher will auto-refresh the catalog
          break;
        }

        case 'build-deck': {
          // cv-3-4: Build deck via Claude Code terminal
          // cv-3-3: Use async path lookup to find decks in folders
          const deckUri = await dataService.getDeckPathAsync(message.deckId);
          const deckPath = deckUri.fsPath;
          const deckName = message.deckId;

          let buildCommand: string;
          if (message.mode === 'all') {
            // AC-24: Build all slides in deck
            outputChannel.appendLine(
              `CatalogMessageHandler: Build All for deck '${deckName}'`
            );

            // BR-2.2 AC-12: Pre-check plan.yaml for pending slide count (same pattern as message-handler.ts)
            try {
              const planUri = vscode.Uri.file(path.join(deckPath, 'plan.yaml'));
              const planBytes = await vscode.workspace.fs.readFile(planUri);
              const planContent = new TextDecoder().decode(planBytes);
              const plan = parse(planContent);
              const slides: Array<{ status?: string }> = plan?.slides ?? [];
              const totalCount = slides.length;
              const pendingCount = slides.filter((s: { status?: string }) => s.status !== 'built').length;

              outputChannel.appendLine(`[BuildAll] Pre-check: ${pendingCount}/${totalCount} slides pending`);

              if (pendingCount === 0) {
                // BR-2.2 AC-9, AC-10, AC-11, AC-12: Short-circuit with non-modal info message
                outputChannel.appendLine(`[BuildAll] All slides built, skipping Claude Code invocation`);
                vscode.window.showInformationMessage(`All ${totalCount} slides already built`);
                await webview.postMessage({
                  type: 'build-triggered',
                  deckId: message.deckId,
                  mode: message.mode,
                });
                break;
              }
            } catch (error: unknown) {
              // BR-2.2 AC-16: Fail-open - log error and proceed to Claude Code
              const errorMessage = error instanceof Error ? error.message : String(error);
              outputChannel.appendLine(`[BuildAll] Pre-check failed: ${errorMessage}, proceeding to Claude Code`);
            }

            buildCommand = `/sb-create:build-all --deck "${deckPath}"`;
          } else {
            // AC-25: Build single slide
            const slideNum = message.slideNumber ?? 1;
            buildCommand = `/sb-create:build-one --deck "${deckPath}" --slide ${slideNum}`;
            outputChannel.appendLine(
              `CatalogMessageHandler: Build slide ${slideNum} for deck '${deckName}'`
            );
          }

          // lv-1-1 AC-1, AC-3, AC-4, AC-5: Auto-open viewer before dispatching build
          // lv-1-2 AC-18: Skip auto-open for fully-built decks (FR27)
          try {
            if (extensionUri && workspaceUri) {
              // lv-1-2 AC-18: Check if all slides are already built before auto-open
              const deckDetailForCheck = await dataService.getDeckDetail(message.deckId);
              if (deckDetailForCheck &&
                  deckDetailForCheck.slides.length > 0 &&
                  deckDetailForCheck.slides.filter(s => s.status !== 'built').length === 0) {
                outputChannel.appendLine(
                  `[BuildViewer] Fully-built deck detected, skipping auto-open: ${message.deckId}`
                );
              } else {

              const buildId = `${message.deckId}-${Date.now()}`;
              outputChannel.appendLine(
                `[BuildViewer] Auto-open viewer for deck '${message.deckId}' mode='${message.mode}' buildId='${buildId}'`
              );

              // lv-1-2 AC-17: Clear dismissed entries for this deck (new build starting)
              SlideViewerV2Panel.clearDismissedForDeck(message.deckId);
              outputChannel.appendLine(
                `[BuildViewer] Cleared dismissed entries for deck: ${message.deckId} (new build starting)`
              );

              // Check if panel already exists before opening (for queue vs post decision)
              const panelExists = SlideViewerV2Panel.hasPanel(message.deckId);

              // AC-5: createOrShow reveals existing panel if already open
              SlideViewerV2Panel.createOrShow(
                extensionUri,
                workspaceUri,
                message.deckId,
                deckName,
                dataService,
                outputChannel,
                fileWatcher
              );

              // AC-12: Start build tracking with unique ID
              if (buildProgressService) {
                const slideNum = message.mode === 'one' ? (message.slideNumber ?? 1) : undefined;
                await buildProgressService.startBuild(
                  message.deckId,
                  message.mode === 'one' ? 'one' : 'all',
                  slideNum,
                  buildId
                );
              }

              // AC-4, AC-7: Determine start slide and total for v2-build-started message
              let totalSlides = 1;
              let startSlide = message.mode === 'one' ? (message.slideNumber ?? 1) : 1;
              try {
                const deckDetail = await dataService.getDeckDetail(message.deckId);
                if (deckDetail) {
                  totalSlides = deckDetail.slides.length;
                  // For 'all' mode (resume): find first pending slide
                  if (message.mode === 'all') {
                    const firstPending = deckDetail.slides.find(s => s.status !== 'built');
                    if (firstPending) {
                      startSlide = firstPending.number;
                    }
                  }
                }
              } catch (detailError) {
                outputChannel.appendLine(
                  `[BuildViewer] Could not get deck detail for slide count: ${detailError}`
                );
              }

              // AC-7: Send v2-build-started to viewer webview
              // If panel was newly created, queue message for delivery on v2-ready to avoid race condition
              const buildMode = message.mode === 'one' ? 'one' : 'all';
              const buildStartedMessage = {
                type: 'v2-build-started',
                mode: buildMode,
                totalSlides,
                startSlide,
                buildId,
              };
              if (panelExists) {
                SlideViewerV2Panel.postMessage(buildStartedMessage, message.deckId);
              } else {
                SlideViewerV2Panel.queueMessage(message.deckId, buildStartedMessage);
              }

              outputChannel.appendLine(
                `[BuildViewer] Viewer opened and build-started sent for '${message.deckId}'`
              );
              } // end else (not fully-built)
            }
          } catch (autoOpenError) {
            // lv-1-1: Auto-open is best-effort; don't block the build
            outputChannel.appendLine(
              `[BuildViewer] Auto-open failed (non-blocking): ${autoOpenError}`
            );
          }

          // AC-27: Send to Claude Code terminal (interactive conversation)
          // Story Reference: vscode-config-2 AC-7 through AC-14
          await sendToClaudeCode(buildCommand, outputChannel, workspaceUri, {
            launchMode: configService.readSettings().claudeCode.launchMode,
            position: configService.readSettings().claudeCode.position
          });

          // AC-29: Notify webview that build was triggered (for future Build Progress view)
          await webview.postMessage({
            type: 'build-triggered',
            deckId: message.deckId,
            mode: message.mode,
          });
          break;
        }

        case 'cancel-build': {
          // cv-3-5 AC-33: Cancel build by sending Ctrl+C to Claude Code terminal
          outputChannel.appendLine(
            `CatalogMessageHandler: Cancelling build for deck '${message.deckId}'`
          );

          // Send Ctrl+C to the active terminal (Claude Code)
          const terminal = vscode.window.activeTerminal;
          if (terminal) {
            // Send interrupt signal - \x03 is Ctrl+C
            terminal.sendText('\x03', false);
            outputChannel.appendLine(
              'CatalogMessageHandler: Sent Ctrl+C to terminal'
            );
          } else {
            outputChannel.appendLine(
              'CatalogMessageHandler: No active terminal found to cancel build'
            );
          }

          // Cancel the build progress service state
          buildProgressService?.cancelBuild();

          // Compute builtCount from service progress
          const cancelBuiltCount =
            buildProgressService
              ?.getProgress()
              ?.slides.filter((s: { status: string }) => s.status === 'built').length ?? 0;

          // Send v2-build-complete with cancelled: true (matches inactivity timeout pattern)
          SlideViewerV2Panel.postMessage(
            {
              type: 'v2-build-complete' as const,
              builtCount: cancelBuiltCount,
              errorCount: 0,
              cancelled: true,
            },
            message.deckId
          );
          break;
        }

        // cv-4-4: Browse for asset files
        case 'browse-files': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Browse for ${message.assetType} files`
          );
          try {
            const paths = await dataService.browseForAssets();
            await webview.postMessage({
              type: 'browse-files-result',
              paths,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Browse files error: ${error}`
            );
            await webview.postMessage({
              type: 'asset-operation-error',
              operation: 'browse',
              message: `Failed to browse files: ${error}`,
            });
          }
          break;
        }

        // cv-4-4: Add brand assets
        case 'add-brand-assets': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Adding ${message.paths.length} assets as ${message.assetType}`
          );
          try {
            const count = await dataService.addBrandAssets(
              message.paths,
              message.assetType,
              message.description,
              message.tags
            );
            await webview.postMessage({
              type: 'asset-operation-success',
              operation: 'add',
              count,
            });
            // File watcher will auto-refresh the asset grid (AC-33)
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Add assets error: ${error}`
            );
            await webview.postMessage({
              type: 'asset-operation-error',
              operation: 'add',
              message: `Failed to add assets: ${error}`,
            });
          }
          break;
        }

        // cv-4-5: Update brand asset metadata
        case 'update-brand-asset': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Updating asset ${message.id}`
          );
          try {
            await dataService.updateBrandAsset(message.id, message.updates);
            await webview.postMessage({
              type: 'asset-operation-success',
              operation: 'update',
            });
            // Explicitly re-scan and push updated assets (per-type catalog writes
            // may not trigger the file watcher reliably)
            const updatedAssets = await dataService.scanBrandAssets(webview);
            await webview.postMessage({ type: 'brand-assets', assets: updatedAssets });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Update asset error: ${error}`
            );
            await webview.postMessage({
              type: 'asset-operation-error',
              operation: 'update',
              message: `Failed to update asset: ${error}`,
            });
          }
          break;
        }

        // cv-4-5: Delete brand asset
        case 'delete-brand-asset': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Deleting asset ${message.id}`
          );
          try {
            await dataService.deleteBrandAsset(message.id);
            await webview.postMessage({
              type: 'asset-operation-success',
              operation: 'delete',
            });
            // File watcher will auto-refresh the asset grid
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Delete asset error: ${error}`
            );
            await webview.postMessage({
              type: 'asset-operation-error',
              operation: 'delete',
              message: `Failed to delete asset: ${error}`,
            });
          }
          break;
        }

        // cv-4-5: Duplicate brand asset
        case 'duplicate-brand-asset': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Duplicating asset ${message.id}`
          );
          try {
            await dataService.duplicateBrandAsset(message.id);
            await webview.postMessage({
              type: 'asset-operation-success',
              operation: 'duplicate',
            });
            // File watcher will auto-refresh the asset grid
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Duplicate asset error: ${error}`
            );
            await webview.postMessage({
              type: 'asset-operation-error',
              operation: 'duplicate',
              message: `Failed to duplicate asset: ${error}`,
            });
          }
          break;
        }

        // cv-4-5: Copy asset path to clipboard
        case 'copy-asset-path': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Copy path: ${message.relativePath}`
          );
          await vscode.env.clipboard.writeText(message.relativePath);
          break;
        }

        // cv-5-1: Request template catalog data
        case 'request-templates': {
          outputChannel.appendLine(
            'CatalogMessageHandler: Fetching slide and deck templates'
          );
          try {
            const slideTemplates = await dataService.scanSlideTemplates();
            const deckTemplates = await dataService.getDeckTemplates();
            await webview.postMessage({
              type: 'templates',
              slideTemplates,
              deckTemplates,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error fetching templates: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to load templates: ${error}`,
            });
          }
          break;
        }

        // v3-2-3: Load template metadata for editing
        case 'load-template-metadata': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Loading template metadata for '${message.templateId}'`
          );
          try {
            const metadata = await dataService.loadTemplateMetadata(message.templateId);
            await webview.postMessage({
              type: 'template-metadata',
              templateId: message.templateId,
              metadata,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error loading template metadata: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to load template metadata: ${error}`,
              context: 'template-metadata',
            });
          }
          break;
        }

        // v3-2-3: Save template metadata after editing
        case 'save-template-metadata': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Saving template metadata for '${message.templateId}'`
          );
          try {
            await dataService.saveTemplateMetadata(message.templateId, message.metadata);
            await webview.postMessage({
              type: 'template-metadata-saved',
              templateId: message.templateId,
              success: true,
            });
            // Refresh template list to reflect changes
            const slideTemplates = await dataService.scanSlideTemplates();
            const deckTemplates = await dataService.getDeckTemplates();
            await webview.postMessage({
              type: 'templates',
              slideTemplates,
              deckTemplates,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error saving template metadata: ${error}`
            );
            await webview.postMessage({
              type: 'template-metadata-saved',
              templateId: message.templateId,
              success: false,
            });
          }
          break;
        }

        // tm-1-3: Delete slide template — shows VSCode native confirmation dialog, then removes catalog entry and HTML file
        case 'delete-slide-template': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Delete slide template requested for '${message.templateId}'`
          );
          try {
            // Look up template name for the confirmation dialog
            const allSlideTemplates = await dataService.scanSlideTemplates();
            const templateToDelete = allSlideTemplates.find((t) => t.id === message.templateId);
            const templateName = templateToDelete?.name ?? message.templateId;

            const detail = `This will remove "${templateName}" from the catalog and delete its HTML file from disk.`;
            const result = await vscode.window.showWarningMessage(
              `Delete template "${templateName}"?`,
              { modal: true, detail },
              'Delete'
            );

            if (result !== 'Delete') {
              // User cancelled — no-op, no response message needed
              outputChannel.appendLine(
                `CatalogMessageHandler: Delete cancelled by user for '${message.templateId}'`
              );
              break;
            }

            await dataService.deleteSlideTemplate(message.templateId);
            await webview.postMessage({
              type: 'slide-template-deleted',
              templateId: message.templateId,
              success: true,
            });
            // Refresh template list so catalog grid reflects deletion
            const slideTemplates = await dataService.scanSlideTemplates();
            const deckTemplates = await dataService.getDeckTemplates();
            await webview.postMessage({
              type: 'templates',
              slideTemplates,
              deckTemplates,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error deleting slide template: ${error}`
            );
            await vscode.window.showErrorMessage(
              `Failed to delete template: ${error}`
            );
            await webview.postMessage({
              type: 'slide-template-deleted',
              templateId: message.templateId,
              success: false,
            });
          }
          break;
        }

        // tm-1-4: Reorder slide templates — writes new order to slide-templates.json
        case 'reorder-slide-templates': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Reorder slide templates requested (${message.templateIds.length} templates)`
          );
          try {
            await dataService.reorderSlideTemplates(message.templateIds);
            outputChannel.appendLine(
              `CatalogMessageHandler: Slide templates reordered successfully`
            );
            await webview.postMessage({
              type: 'slide-templates-reordered',
              success: true,
            });
            // File watcher will auto-refresh the catalog
          } catch (error) {
            outputChannel.appendLine(
              `[CatalogDataService] Reorder slide templates failed: ${error}`
            );
            await vscode.window.showErrorMessage(
              `Failed to reorder templates: ${error}`
            );
            await webview.postMessage({
              type: 'slide-templates-reordered',
              success: false,
            });
          }
          break;
        }

        // tm-1-2: Save slide template schema fields (name, description, use_cases, background_mode)
        case 'save-slide-template-schema': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Saving slide template schema for '${message.templateId}'`
          );
          try {
            await dataService.saveSlideTemplateSchema(message.templateId, message.schema);
            await webview.postMessage({
              type: 'slide-template-schema-saved',
              templateId: message.templateId,
              success: true,
            });
            // Refresh template list to reflect schema changes in catalog grid
            const slideTemplates = await dataService.scanSlideTemplates();
            const deckTemplates = await dataService.getDeckTemplates();
            await webview.postMessage({
              type: 'templates',
              slideTemplates,
              deckTemplates,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error saving slide template schema: ${error}`
            );
            await webview.postMessage({
              type: 'slide-template-schema-saved',
              templateId: message.templateId,
              success: false,
            });
          }
          break;
        }

        // cv-5-2: Use deck template to create new deck (AC-16)
        case 'use-deck-template': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Use deck template '${message.templateId}'`
          );

          // Get the template info to find its path
          const templates = await dataService.getDeckTemplates();
          const template = templates.find((t) => t.id === message.templateId);

          if (!template) {
            vscode.window.showErrorMessage(
              `Template not found: ${message.templateId}`
            );
            break;
          }

          // Copy template to new deck folder (same flow as create-deck from-template)
          if (workspaceUri) {
            const templateUri = vscode.Uri.joinPath(
              workspaceUri,
              template.path
            );
            const deckName = await vscode.window.showInputBox({
              prompt: 'Enter a name for your new deck',
              placeHolder: 'my-new-deck',
              validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                  return 'Deck name is required';
                }
                // Sanitize for folder name
                if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
                  return 'Use only letters, numbers, hyphens, and underscores';
                }
                return null;
              },
            });

            if (deckName) {
              const newDeckUri = vscode.Uri.joinPath(
                workspaceUri,
                'output',
                deckName
              );
              try {
                await vscode.workspace.fs.copy(templateUri, newDeckUri);
                outputChannel.appendLine(
                  `CatalogMessageHandler: Created deck '${deckName}' from template '${template.name}'`
                );
                // File watcher will auto-refresh the catalog
                await webview.postMessage({
                  type: 'deck-created',
                  deckId: deckName,
                });
                // Show success notification
                vscode.window.showInformationMessage(
                  `Deck '${deckName}' created from template '${template.name}'`
                );
              } catch (error) {
                outputChannel.appendLine(
                  `CatalogMessageHandler: Failed to create deck from template: ${error}`
                );
                vscode.window.showErrorMessage(
                  `Failed to create deck: ${error}`
                );
              }
            }
          }
          break;
        }

        // cv-5-3: Request thumbnail for a deck (AC-21)
        case 'request-thumbnail': {
          if (!thumbnailService) {
            outputChannel.appendLine(
              'CatalogMessageHandler: ThumbnailService not available'
            );
            await webview.postMessage({
              type: 'thumbnail-ready',
              id: message.id,
              uri: '', // Empty URI signals failure
            });
            break;
          }

          outputChannel.appendLine(
            `CatalogMessageHandler: Thumbnail requested for ${message.id}`
          );

          try {
            const thumbnailUri = await thumbnailService.getThumbnail(
              message.sourcePath,
              webview
            );

            if (thumbnailUri) {
              // AC-21: Send thumbnail-ready with webview-safe URI
              await webview.postMessage({
                type: 'thumbnail-ready',
                id: message.id,
                uri: thumbnailUri,
              });
            } else {
              // AC-23: Generation failed, send placeholder
              // Extract deck name from sourcePath for initials
              const pathParts = message.sourcePath.split(/[/\\]/);
              const deckId = pathParts[pathParts.length - 3] || 'Deck';
              const initials = thumbnailService.getDeckInitials(deckId);
              const placeholderUri = thumbnailService.generatePlaceholder(initials);

              await webview.postMessage({
                type: 'thumbnail-ready',
                id: message.id,
                uri: placeholderUri,
              });
            }
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Thumbnail generation error: ${error}`
            );
            await webview.postMessage({
              type: 'thumbnail-ready',
              id: message.id,
              uri: '', // Empty URI signals failure
            });
          }
          break;
        }

        case 'set-view-preference': {
          // v3-2-1 AC-2: Persist view preference to globalState
          if (globalState) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Saving view preference: ${message.mode}`
            );
            await globalState.update('slideBuilder.catalogViewMode', message.mode);
          }
          break;
        }

        // v3-4-2: Update color metadata for a brand asset (AC-5 to AC-10)
        case 'update-color-metadata': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Updating color metadata for asset '${message.assetId}'`
          );
          try {
            await dataService.updateColorMetadata(message.assetId, message.metadata);
            // Fetch updated metadata to confirm
            const updatedAssets = await dataService.scanBrandAssets(webview);
            const updatedAsset = updatedAssets.find(a => a.id === message.assetId);
            if (updatedAsset?.colorMetadata) {
              await webview.postMessage({
                type: 'color-metadata-updated',
                assetId: message.assetId,
                metadata: updatedAsset.colorMetadata,
              });
            }
            // Refresh asset list
            await webview.postMessage({ type: 'brand-assets', assets: updatedAssets });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error updating color metadata: ${error}`
            );
            await webview.postMessage({
              type: 'asset-operation-error',
              operation: 'update',
              message: `Failed to update color metadata: ${error}`,
            });
          }
          break;
        }

        // v3-4-2: Start batch analysis of all assets (AC-11 to AC-15)
        case 'start-batch-analysis': {
          outputChannel.appendLine(
            'CatalogMessageHandler: Starting batch analysis'
          );
          try {
            const results = await dataService.batchAnalyze(
              async (current, total) => {
                // Send progress updates to webview
                await webview.postMessage({
                  type: 'batch-analysis-progress',
                  current,
                  total,
                });
              }
            );
            // Send completion message
            await webview.postMessage({
              type: 'batch-analysis-complete',
              results,
            });
            // Refresh asset list with updated metadata
            const updatedAssets = await dataService.scanBrandAssets(webview);
            await webview.postMessage({ type: 'brand-assets', assets: updatedAssets });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error in batch analysis: ${error}`
            );
            await webview.postMessage({
              type: 'batch-analysis-complete',
              results: [],
            });
          }
          break;
        }

        // v3-5-1: Submit operation form data (AC-3, AC-5)
        case 'submit-operation-form': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Form submitted for operation '${message.operation}'`
          );

          // tm-1-5: Route sb-manage:add-slide-template through PromptAssemblyService
          // instead of the generic formatFormDataForCli path (AC-4, AC-6, AC-7)
          if (message.operation === 'sb-manage:add-slide-template') {
            try {
              if (!promptAssemblyService) {
                throw new Error('PromptAssemblyService not available (no workspaceUri)');
              }
              const prompt = await promptAssemblyService.assembleAddSlideTemplatePrompt(message.data);
              await sendToClaudeCode(prompt, outputChannel, workspaceUri, {
                launchMode: configService.readSettings().claudeCode.launchMode,
                position: configService.readSettings().claudeCode.position,
              });
              await webview.postMessage({
                type: 'form-submitted-ack',
                operationId: message.operation,
                success: true,
              });
              outputChannel.appendLine(
                `CatalogMessageHandler: Dispatched add-slide-template to Claude Code`
              );
            } catch (error) {
              outputChannel.appendLine(
                `CatalogMessageHandler: Error dispatching add-slide-template: ${error}`
              );
              await webview.postMessage({
                type: 'form-submitted-ack',
                operationId: message.operation,
                success: false,
                error: String(error),
              });
            }
            break;
          }

          // tm-3-1: Route sb-manage:add-deck-template through PromptAssemblyService (AC-3, AC-5)
          if (message.operation === 'sb-manage:add-deck-template') {
            try {
              if (!promptAssemblyService) {
                throw new Error('PromptAssemblyService not available (no workspaceUri)');
              }
              const prompt = await promptAssemblyService.assembleAddDeckTemplatePrompt(message.data);
              await sendToClaudeCode(prompt, outputChannel, workspaceUri, {
                launchMode: configService.readSettings().claudeCode.launchMode,
                position: configService.readSettings().claudeCode.position,
              });
              await webview.postMessage({
                type: 'form-submitted-ack',
                operationId: message.operation,
                success: true,
              });

              // tm-3-3: Set creation in-progress flag after successful dispatch
              const templateName = String(message.data['name'] ?? '');
              if (templateName) {
                deckTemplateCreationTracker.start(templateName, outputChannel);
              }

              outputChannel.appendLine(
                `[catalog-message-handler] submit-operation-form: sb-manage:add-deck-template -> sendToClaudeCode`
              );
            } catch (error) {
              outputChannel.appendLine(
                `CatalogMessageHandler: Error dispatching add-deck-template: ${error}`
              );
              vscode.window.showErrorMessage('Could not launch Claude Code');
              await webview.postMessage({
                type: 'form-submitted-ack',
                operationId: message.operation,
                success: false,
                error: String(error),
              });
            }
            break;
          }

          // bt-1-3 AC-7, AC-escape, AC-logging: Brand setup CLI command formatting and dispatch
          if (message.operation === 'brand-setup') {
            try {
              const { assetFolder, companyName, brandDescription } = message.data as {
                assetFolder: string;
                companyName?: string;
                brandDescription?: string;
              };

              // AC-logging: Log form receipt with [Brand] prefix
              outputChannel.appendLine(
                `[Brand] Brand setup form submitted: folder=${assetFolder}, company=${companyName || '(none)'}, description=${brandDescription ? '(provided)' : '(none)'}`
              );

              // AC-7a: Format CLI command with proper escaping (AC-escape)
              const command = formatBrandSetupCommand({ assetFolder, companyName, brandDescription });

              // AC-logging: Log formatted command
              outputChannel.appendLine(`[Brand] Sending to Claude Code: ${command}`);

              // AC-7b: Dispatch to Claude Code
              await sendToClaudeCode(command, outputChannel, workspaceUri, {
                launchMode: configService.readSettings().claudeCode.launchMode,
                position: configService.readSettings().claudeCode.position,
              });

              // AC-logging: Log success
              outputChannel.appendLine('[Brand] Brand setup dispatched to Claude Code');

              // AC-7d: Show VSCode information message
              vscode.window.showInformationMessage(
                'Brand setup started -- paste the command into Claude Code to begin'
              );

              // AC-7c: Send form-submitted-ack back to webview (modal closes on ack)
              await webview.postMessage({
                type: 'form-submitted-ack',
                operationId: 'brand-setup',
                success: true,
              });
            } catch (error) {
              // AC-logging: Log error
              outputChannel.appendLine(`[Brand] Error dispatching brand setup: ${error}`);

              // Show error message to user
              vscode.window.showErrorMessage(
                `Brand setup failed: ${error instanceof Error ? error.message : String(error)}`
              );

              // Send failure ack back to webview
              await webview.postMessage({
                type: 'form-submitted-ack',
                operationId: 'brand-setup',
                success: false,
                error: String(error),
              });
            }
            break;
          }

          try {
            // Format form data as context for the CLI command
            const formattedContext = formatFormDataForCli(message.operation, message.data);

            // Invoke Claude Code terminal with the skill command and form context
            // Story Reference: vscode-config-2 AC-7 through AC-14
            await sendToClaudeCode(
              `/${message.operation}\n\n${formattedContext}`,
              outputChannel,
              workspaceUri,
              {
                launchMode: configService.readSettings().claudeCode.launchMode,
                position: configService.readSettings().claudeCode.position
              }
            );

            // Collapse sidebar for plan operations to maximize editor space
            if (message.operation === 'sb-create:plan-deck' || message.operation === 'sb-create:plan-one') {
              try {
                await vscode.commands.executeCommand('workbench.action.closeSidebar');
                outputChannel.appendLine('[Catalog] Sidebar collapsed for plan operation');
              } catch (sidebarError) {
                outputChannel.appendLine(`[Catalog] Sidebar collapse failed (non-blocking): ${sidebarError}`);
              }
            }

            // AC-3: Send acknowledgment back to webview
            await webview.postMessage({
              type: 'form-submitted-ack',
              operationId: message.operation,
              success: true,
            });

            outputChannel.appendLine(
              `CatalogMessageHandler: Form data sent to Claude Code for '${message.operation}'`
            );
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error submitting form: ${error}`
            );
            await webview.postMessage({
              type: 'form-submitted-ack',
              operationId: message.operation,
              success: false,
              error: String(error),
            });
          }
          break;
        }

        // =============================================================================
        // V4-1: Deck Template Configuration Messages
        // Story Reference: v4-1-2 AC-1, AC-2, AC-3
        // =============================================================================

        case 'load-deck-template-config': {
          if (!deckTemplateConfigService) {
            await webview.postMessage({ type: 'error', message: 'DeckTemplateConfigService not available' });
            break;
          }
          outputChannel.appendLine(
            `CatalogMessageHandler: Loading deck template config for '${message.templateId}'`
          );
          try {
            const config = await deckTemplateConfigService.loadConfig(message.templateId);
            await webview.postMessage({
              type: 'deck-template-config',
              templateId: message.templateId,
              config,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error loading deck template config: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to load template config: ${error}`,
              context: 'deck-template-config',
            });
          }
          break;
        }

        case 'save-deck-template-config': {
          if (!deckTemplateConfigService) {
            await webview.postMessage({
              type: 'deck-template-config-saved',
              templateId: message.templateId,
              success: false,
              error: 'DeckTemplateConfigService not available',
            });
            break;
          }
          outputChannel.appendLine(
            `CatalogMessageHandler: Saving deck template config for '${message.templateId}'`
          );
          try {
            await deckTemplateConfigService.saveConfig(message.templateId, message.config);
            await webview.postMessage({
              type: 'deck-template-config-saved',
              templateId: message.templateId,
              success: true,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error saving deck template config: ${error}`
            );
            await webview.postMessage({
              type: 'deck-template-config-saved',
              templateId: message.templateId,
              success: false,
              error: String(error),
            });
          }
          break;
        }

        case 'save-slide-instructions': {
          if (!deckTemplateConfigService) {
            await webview.postMessage({
              type: 'deck-template-config-saved',
              templateId: message.templateId,
              success: false,
              error: 'DeckTemplateConfigService not available',
            });
            break;
          }
          outputChannel.appendLine(
            `CatalogMessageHandler: Saving slide instructions for slide ${message.slideNumber} of '${message.templateId}'`
          );
          try {
            await deckTemplateConfigService.saveSlideInstructions(
              message.templateId,
              message.slideNumber,
              message.instructions,
            );
            await webview.postMessage({
              type: 'deck-template-config-saved',
              templateId: message.templateId,
              success: true,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error saving slide instructions: ${error}`
            );
            await webview.postMessage({
              type: 'deck-template-config-saved',
              templateId: message.templateId,
              success: false,
              error: String(error),
            });
          }
          break;
        }

        case 'save-content-sources': {
          if (!deckTemplateConfigService) {
            await webview.postMessage({
              type: 'deck-template-config-saved',
              templateId: message.templateId,
              success: false,
              error: 'DeckTemplateConfigService not available',
            });
            break;
          }
          outputChannel.appendLine(
            `CatalogMessageHandler: Saving content sources for slide ${message.slideNumber} of '${message.templateId}'`
          );
          try {
            await deckTemplateConfigService.saveContentSources(
              message.templateId,
              message.slideNumber,
              message.sources,
            );
            await webview.postMessage({
              type: 'deck-template-config-saved',
              templateId: message.templateId,
              success: true,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error saving content sources: ${error}`
            );
            await webview.postMessage({
              type: 'deck-template-config-saved',
              templateId: message.templateId,
              success: false,
              error: String(error),
            });
          }
          break;
        }

        case 'request-slide-preview': {
          if (!deckTemplateConfigService) {
            await webview.postMessage({ type: 'error', message: 'DeckTemplateConfigService not available' });
            break;
          }
          outputChannel.appendLine(
            `CatalogMessageHandler: Requesting slide preview for slide ${message.slideNumber} of '${message.templateId}'`
          );
          try {
            const config = await deckTemplateConfigService.loadConfig(message.templateId);
            const slide = config.slides.find((s) => s.number === message.slideNumber);
            if (!slide) {
              throw new Error(`Slide ${message.slideNumber} not found`);
            }
            const html = await deckTemplateConfigService.getSlideHtml(
              message.templateId,
              slide.file,
            );
            await webview.postMessage({
              type: 'deck-template-slide-preview',
              templateId: message.templateId,
              slideNumber: message.slideNumber,
              html,
            });
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error loading slide preview: ${error}`
            );
            await webview.postMessage({
              type: 'error',
              message: `Failed to load slide preview: ${error}`,
              context: 'slide-preview',
            });
          }
          break;
        }

        // tm-2-2: Preview deck template slide — read slide HTML and open SlideViewerV2Panel
        case 'preview-deck-template-slide': {
          if (!deckTemplateConfigService) {
            await webview.postMessage({ type: 'error', message: 'DeckTemplateConfigService not available' });
            break;
          }
          outputChannel.appendLine(
            `[catalog-message-handler] preview-deck-template-slide: ${message.templateId}/${message.slideFile}`
          );
          try {
            const html = await deckTemplateConfigService.getSlideHtml(message.templateId, message.slideFile);
            // Open or focus the viewer panel using a special deckId for template previews (ADR-TM-005)
            const previewDeckId = '__deck-template-preview__';
            const previewDeckName = `Template Preview: ${message.templateId}`;
            SlideViewerV2Panel.createOrShow(
              extensionUri!,
              workspaceUri!,
              previewDeckId,
              previewDeckName,
              dataService,
              outputChannel,
              fileWatcher
            );
            // Post synthetic deck content with the single slide HTML to the viewer
            SlideViewerV2Panel.postMessage(
              {
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
              },
              previewDeckId
            );
          } catch (error) {
            outputChannel.appendLine(
              `[catalog-message-handler] preview-deck-template-slide: ${message.templateId}/${message.slideFile} — getSlideHtml failed: ${error}`
            );
            vscode.window.showErrorMessage(
              `Could not preview slide: ${(error as Error).message}`
            );
            // Do not post to viewer or modify viewer state on error (AC5)
          }
          break;
        }

        // slide-template-preview-3: Preview slide template — read template HTML and open SlideViewerV2Panel
        case 'preview-slide-template': {
          outputChannel.appendLine(
            `[catalog-message-handler] preview-slide-template: ${message.templateId}`
          );
          try {
            const html = await dataService.getSlideTemplateHtml(message.templateId);
            // Open or focus the viewer panel using a special deckId for template previews
            const previewDeckId = '__slide-template-preview__';
            const previewDeckName = `Template Preview: ${message.templateId}`;

            // Check if panel already exists to avoid race condition
            const panelExists = SlideViewerV2Panel.hasPanel(previewDeckId);

            SlideViewerV2Panel.createOrShow(
              extensionUri!,
              workspaceUri!,
              previewDeckId,
              previewDeckName,
              dataService,
              outputChannel,
              fileWatcher
            );

            // Prepare the deck loaded message
            const deckLoadedMessage = {
              type: 'v2-deck-loaded',
              deck: {
                deckId: previewDeckId,
                deckName: previewDeckName,
                planPath: '',
                slides: [
                  {
                    number: 1,
                    html,
                    fileName: `${message.templateId}.html`,
                    slideId: message.templateId,
                    title: `Template: ${message.templateId}`,
                  },
                ],
                manifest: {
                  deckId: previewDeckId,
                  deckName: previewDeckName,
                  slideCount: 1,
                  slides: [
                    {
                      number: 1,
                      fileName: `${message.templateId}.html`,
                      title: `Template: ${message.templateId}`,
                    },
                  ],
                  generatedAt: new Date().toISOString(),
                },
              },
            };

            // If panel already existed, post message directly; otherwise queue for v2-ready
            if (panelExists) {
              SlideViewerV2Panel.postMessage(deckLoadedMessage, previewDeckId);
            } else {
              SlideViewerV2Panel.queueMessage(previewDeckId, deckLoadedMessage);
            }
          } catch (error) {
            outputChannel.appendLine(`[catalog-message-handler] preview failed: ${error}`);
            vscode.window.showErrorMessage(`Could not preview template: ${(error as Error).message}`);
          }
          break;
        }

        // tm-2-1: Inspect deck template — load config and open DeckTemplateDetail panel
        case 'inspect-deck-template': {
          if (!deckTemplateConfigService) {
            await webview.postMessage({ type: 'error', message: 'DeckTemplateConfigService not available' });
            break;
          }
          outputChannel.appendLine(
            `CatalogMessageHandler: inspect-deck-template: ${message.templateId}`
          );
          try {
            const config = await deckTemplateConfigService.loadConfig(message.templateId);
            outputChannel.appendLine(
              `CatalogMessageHandler: inspect-deck-template: ${message.templateId} → loaded ${config.slides?.length ?? 0} slides`
            );
            DeckTemplateEditorPanel.createOrShow(
              extensionUri!,
              workspaceUri!,
              message.templateId,
              config,
              outputChannel,
              dataService,
              fileWatcher,
              deckTemplateConfigService,
              promptAssemblyService
            );
          } catch (error) {
            outputChannel.appendLine(
              `[catalog-message-handler] inspect-deck-template: ${message.templateId} — loadConfig failed: ${error}`
            );
            vscode.window.showErrorMessage(
              `Could not load template config: ${(error as Error).message}`
            );
            // Do NOT post any message to webview on error (AC5)
          }
          break;
        }

        // tm-2-3: Delete deck template — confirmation dialog + folder/manifest removal + cache invalidation
        case 'delete-deck-template': {
          outputChannel.appendLine(
            `CatalogMessageHandler: Delete deck template requested for '${message.templateId}'`
          );
          try {
            // Look up template name and slide count for the confirmation dialog
            let templateName = message.templateId;
            let slideCount = 0;
            if (deckTemplateConfigService) {
              try {
                const config = await deckTemplateConfigService.loadConfig(message.templateId);
                templateName = config.name || message.templateId;
                slideCount = config.slide_count ?? config.slides?.length ?? 0;
              } catch {
                // Fall through with templateId as name
              }
            }

            const folderPath = `.slide-builder/config/catalog/deck-templates/${message.templateId}/`;
            const detail = `This will permanently remove the template folder "${folderPath}" containing ${slideCount} slide${slideCount !== 1 ? 's' : ''}.`;
            const result = await vscode.window.showWarningMessage(
              `Delete deck template "${templateName}"?`,
              { modal: true, detail },
              'Delete'
            );

            if (result !== 'Delete') {
              // User cancelled — no-op
              outputChannel.appendLine(
                `[catalog-message-handler] delete-deck-template: ${message.templateId} — user cancelled`
              );
              break;
            }

            // tm-3-2: Suppress next file watcher refresh to prevent redundant catalog update
            fileWatcher.suppressNextDeckTemplateRefresh();

            await dataService.deleteDeckTemplate(message.templateId);

            // Invalidate DeckTemplateConfigService cache (AC10)
            if (deckTemplateConfigService) {
              deckTemplateConfigService.invalidateCache(message.templateId);
            }

            await webview.postMessage({
              type: 'deck-template-deleted',
              templateId: message.templateId,
              success: true,
            });

            // Refresh template list so catalog grid reflects deletion
            const slideTemplates = await dataService.scanSlideTemplates();
            const deckTemplates = await dataService.getDeckTemplates();
            await webview.postMessage({
              type: 'templates',
              slideTemplates,
              deckTemplates,
            });

            outputChannel.appendLine(
              `[catalog-message-handler] delete-deck-template: ${message.templateId} — user confirmed`
            );
          } catch (error) {
            outputChannel.appendLine(
              `CatalogMessageHandler: Error deleting deck template: ${error}`
            );
            await vscode.window.showErrorMessage(
              `Failed to delete deck template: ${error}`
            );
            // Do NOT post deck-template-deleted on error (AC11)
          }
          break;
        }

        // bt-1-2 AC-5, AC-6: Handle folder picker request from webview
        case 'pick-folder': {
          outputChannel.appendLine('[Brand] Folder picker opened');
          try {
            const result = await vscode.window.showOpenDialog({
              canSelectFolders: true,
              canSelectFiles: false,
              canSelectMany: false,
              openLabel: 'Select Brand Assets Folder',
            });

            if (result && result.length > 0) {
              const folderPath = result[0].fsPath;
              outputChannel.appendLine(`[Brand] Folder picker result: ${folderPath}`);
              await webview.postMessage({ type: 'folder-picked', path: folderPath });
            } else {
              outputChannel.appendLine('[Brand] Folder picker cancelled by user');
              // AC-folder-cancel: No message sent on cancellation — field remains unchanged
            }
          } catch (error) {
            outputChannel.appendLine(`[Brand] Folder picker error: ${error}`);
          }
          break;
        }

        // bt-2-1 Task 6.2: Open Theme Editor panel (AC-1, AC-2)
        case 'open-theme-editor': {
          outputChannel.appendLine('[Brand] Open Theme Editor requested');
          if (extensionUri && workspaceUri) {
            ThemeEditorPanel.createOrShow(extensionUri, outputChannel, workspaceUri);
          } else {
            outputChannel.appendLine('[Brand] Cannot open Theme Editor: missing extensionUri or workspaceUri');
            vscode.window.showErrorMessage('Cannot open Theme Editor: workspace not available');
          }
          break;
        }

        // bt-1-1 AC-9: AI Theme Edit — dispatch /sb-brand:theme-edit to Claude Code
        case 'launch-ai-theme-edit': {
          outputChannel.appendLine('[Brand] AI Theme Edit requested');
          if (workspaceUri) {
            const command = '/sb-brand:theme-edit';
            outputChannel.appendLine(`[Brand] Sending to Claude Code: ${command}`);
            await sendToClaudeCode(command, outputChannel, workspaceUri, {
              launchMode: configService.readSettings().claudeCode.launchMode,
              position: configService.readSettings().claudeCode.position,
            });
            vscode.window.showInformationMessage('AI Theme Edit started -- paste the command into Claude Code to begin');
          } else {
            outputChannel.appendLine('[Brand] Cannot dispatch AI Theme Edit: no workspace URI');
            vscode.window.showWarningMessage('Cannot start AI Theme Edit: no workspace found');
          }
          break;
        }

        default:
          outputChannel.appendLine(
            `CatalogMessageHandler: Unhandled message type: ${(message as { type: string }).type}`
          );
      }
    }
  );
  disposables.push(messageDisposable);

  // Wire file watcher: on decks changed → rescan → push update (AC-5, cv-3-3 AC-23)
  const watcherDisposable = fileWatcher.onDecksChanged(async () => {
    outputChannel.appendLine(
      'CatalogMessageHandler: File change detected, rescanning'
    );
    const { decks, folders } = await dataService.scanDecksWithFolders();
    await webview.postMessage({ type: 'catalog-data', decks, folders });
  });
  disposables.push(watcherDisposable);

  // cv-4-1: Wire brand assets watcher → rescan → push update
  const brandWatcherDisposable = fileWatcher.onBrandAssetsChanged(async () => {
    outputChannel.appendLine(
      'CatalogMessageHandler: Brand asset change detected, rescanning'
    );
    const brandAssets = await dataService.scanBrandAssets(webview);
    await webview.postMessage({ type: 'brand-assets', assets: brandAssets });
  });
  disposables.push(brandWatcherDisposable);

  return {
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
