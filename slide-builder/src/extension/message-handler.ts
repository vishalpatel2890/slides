/**
 * Message Handler - Typed webview message dispatch for the Plan Editor extension.
 *
 * Story Reference: 18-3 Task 6.1 - Create message-handler.ts for webview message dispatch
 * Story Reference: 18-4 Task 1 - Implement edit-slide handling with WorkspaceEdit
 * Architecture Reference: notes/architecture/architecture.md#Message Protocol
 *
 * ## Undo/Redo Flow (AC-18.4.5, AC-18.4.6)
 *
 * VS Code's native undo/redo works because ALL document modifications go through
 * the WorkspaceEdit API. Here's the complete flow:
 *
 * 1. User makes an edit in the webview (e.g., changes slide intent)
 * 2. Webview sends { type: 'edit-slide', slideNumber, field, value }
 * 3. MessageHandler.handleEditSlide:
 *    a. Parses current document via parseYaml()
 *    b. Modifies YAML via setField()
 *    c. Serializes via serializeYaml() (preserves comments)
 *    d. Applies change via WorkspaceEdit (NOT fs.writeFile!)
 * 4. VS Code registers the edit in its undo stack
 * 5. VS Code fires onDidChangeTextDocument
 * 6. PlanEditorProvider detects change (debounced 300ms)
 * 7. Provider re-parses and sends plan-updated to webview
 * 8. Webview re-renders with new state
 *
 * When user presses Cmd+Z (undo):
 * 1. VS Code pops the edit from undo stack, reverting document
 * 2. onDidChangeTextDocument fires with reverted content
 * 3. Provider re-parses and sends plan-updated
 * 4. Webview shows reverted state
 *
 * CRITICAL: Using fs.writeFile() or direct document modifications would
 * bypass VS Code's undo stack and break native undo/redo.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { parse as parseYamlRaw } from 'yaml';
import type {
  WebviewMessage,
  ExtensionMessage,
  PlanData,
  SlideEntry,
  TemplateCatalogEntry,
  ThemeConfig,
  ValidationWarning,
} from '../shared/types';
import { validatePlan as validateSlideRules, normalizeDescription } from '../shared/types';
import { validatePlan as validatePlanRules } from './plan-validator';
import { parseYaml, setField, serializeYaml, insertSlide, deleteSlide, moveSlide } from './yaml-document';
import { generateContextMarkdown, writeContextFile } from './claude-context-writer';
import { sendToClaudeCode } from './claude-code-integration';
import { configService } from './extension';
import { SlideViewerV2Panel } from './SlideViewerV2Panel';

// =============================================================================
// Message Handler Class
// =============================================================================

export class MessageHandler {
  /**
   * Cached template catalog - loaded once per session (AC-18.5.2).
   * Avoids re-reading from disk on every webview ready message.
   */
  private templateCatalog: TemplateCatalogEntry[] | null = null;

  /**
   * Cached theme configuration - loaded once per session.
   * Used for context file generation (AC-23.1.8).
   */
  private themeConfig: ThemeConfig | null = null;

  constructor(
    private readonly outputChannel: vscode.OutputChannel,
    private readonly extensionUri: vscode.Uri
  ) {}

  /**
   * Handle incoming messages from the webview.
   *
   * @param message - The message received from the webview
   * @param webview - The webview to send responses to
   * @param document - The current text document
   */
  async handleMessage(
    message: WebviewMessage,
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): Promise<void> {
    this.outputChannel.appendLine(`Received message: ${message.type}`);

    switch (message.type) {
      case 'ready':
        await this.handleReady(webview, document);
        break;

      case 'edit-slide':
        await this.handleEditSlide(message, document);
        break;

      case 'add-slide':
        await this.handleAddSlide(message, document);
        break;

      case 'delete-slide':
        await this.handleDeleteSlide(message, document);
        break;

      case 'reorder-slide':
        await this.handleReorderSlide(message, document);
        break;

      case 'build-slide':
        // BR-1.3 AC-14, AC-16, AC-17: Build single slide via Claude Code
        await this.handleBuildSlide(message, document);
        break;

      case 'build-all':
        // cv-3-4 AC-24, AC-27, AC-30: Build all slides via Claude Code
        await this.handleBuildAll(webview, document);
        break;

      case 'open-claude':
        await this.handleOpenClaude(message, document);
        break;

      case 'open-slide-viewer':
        await this.handleOpenSlideViewer(document);
        break;

      default:
        this.outputChannel.appendLine(`Unknown message type: ${(message as { type: string }).type}`);
    }
  }

  /**
   * Handle the 'edit-slide' message from the webview.
   * Modifies the YAML document via WorkspaceEdit for native undo/redo support.
   *
   * Flow: parse YAML → modify via setField → serialize → apply via WorkspaceEdit
   * AC-18.4.1: UI edit flow triggers YAML update via WorkspaceEdit
   * AC-18.4.3: WorkspaceEdit enables native undo/redo
   *
   * @param message - The edit-slide message with slideNumber, field, and value
   * @param document - The text document to modify
   */
  private async handleEditSlide(
    message: { type: 'edit-slide'; slideNumber: number; field: string; value: unknown },
    document: vscode.TextDocument
  ): Promise<void> {
    const startTime = Date.now();
    this.outputChannel.appendLine(
      `Edit slide ${message.slideNumber}, field: ${message.field}`
    );

    try {
      // Parse current document (AC-18.4.8: target <50ms)
      const parseStart = Date.now();
      const doc = parseYaml(document.getText());
      const parseTime = Date.now() - parseStart;

      // Build path to the field
      // slideNumber is 1-indexed, array is 0-indexed
      const slideIndex = message.slideNumber - 1;
      const path: (string | number)[] = ['slides', slideIndex, message.field];

      // Normalize description to single line before writing
      const value = message.field === 'description' && typeof message.value === 'string'
        ? normalizeDescription(message.value)
        : message.value;

      // Modify the field
      setField(doc, path, value);

      // Serialize with comments preserved (AC-18.4.8: target <100ms for serialize + apply)
      const serializeStart = Date.now();
      const newContent = serializeYaml(doc);
      const serializeTime = Date.now() - serializeStart;

      // Apply via WorkspaceEdit for native undo/redo support
      // CRITICAL: Never use fs.writeFile() - it breaks undo/redo
      const applyStart = Date.now();
      const success = await this.applyEdit(document, newContent);
      const applyTime = Date.now() - applyStart;

      const totalTime = Date.now() - startTime;
      if (success) {
        // Performance logging (AC-18.4.8: total round-trip target <300ms)
        this.outputChannel.appendLine(
          `Edit applied (${totalTime}ms total): parse=${parseTime}ms, serialize=${serializeTime}ms, apply=${applyTime}ms | slides[${slideIndex}].${message.field}`
        );

        // Warn if any operation exceeds target
        if (parseTime > 50) {
          this.outputChannel.appendLine(`⚠️ YAML parse exceeded 50ms target: ${parseTime}ms`);
        }
        if (serializeTime + applyTime > 100) {
          this.outputChannel.appendLine(`⚠️ Serialize+apply exceeded 100ms target: ${serializeTime + applyTime}ms`);
        }

      } else {
        this.outputChannel.appendLine(`Edit failed to apply`);
      }
    } catch (error) {
      this.outputChannel.appendLine(`Edit error: ${error}`);
    }
  }

  /**
   * Handle the 'add-slide' message from the webview.
   * Creates a new slide with defaults and inserts it at the specified position.
   *
   * AC-21.1.2: New slide gets defaults (empty description, pending status, etc.)
   * AC-21.1.3: All slides renumbered after insertion
   */
  private async handleAddSlide(
    message: { type: 'add-slide'; afterSlideNumber: number; sectionId: string },
    document: vscode.TextDocument
  ): Promise<void> {
    this.outputChannel.appendLine(
      `Add slide after ${message.afterSlideNumber} in section ${message.sectionId}`
    );

    try {
      const doc = parseYaml(document.getText());

      // Determine insertion index (afterSlideNumber is 1-indexed, 0 means insert at beginning)
      const insertionIndex = message.afterSlideNumber;

      // Create new slide with defaults (AC-21.1.2)
      // Field names match YAML schema: 'description' (not 'intent'), 'design_plan' (not 'visual_guidance')
      const newSlide: Record<string, unknown> = {
        number: 0, // Will be set by renumberSlides
        description: '',
        suggested_template: '',
        status: 'pending',
        storyline_role: 'detail',
        agenda_section_id: message.sectionId,
        key_points: [],
        design_plan: '',
        tone: '',
      };

      insertSlide(doc, insertionIndex, newSlide);
      const newContent = serializeYaml(doc);
      const success = await this.applyEdit(document, newContent);

      if (success) {
        this.outputChannel.appendLine(
          `Added slide at index ${insertionIndex} in section ${message.sectionId}`
        );
      } else {
        this.outputChannel.appendLine('Add slide: edit failed to apply');
      }
    } catch (error) {
      this.outputChannel.appendLine(`Add slide error: ${error}`);
    }
  }

  /**
   * Handle the 'delete-slide' message from the webview.
   * Removes the specified slide and renumbers remaining slides.
   *
   * AC-21.1.9: Slide removed from YAML slides array
   * AC-21.1.10: Remaining slides renumbered
   */
  private async handleDeleteSlide(
    message: { type: 'delete-slide'; slideNumber: number },
    document: vscode.TextDocument
  ): Promise<void> {
    this.outputChannel.appendLine(`Delete slide ${message.slideNumber}`);

    try {
      const doc = parseYaml(document.getText());

      // slideNumber is 1-indexed, array is 0-indexed
      const slideIndex = message.slideNumber - 1;

      deleteSlide(doc, slideIndex);
      const newContent = serializeYaml(doc);
      const success = await this.applyEdit(document, newContent);

      if (success) {
        this.outputChannel.appendLine(
          `Deleted slide ${message.slideNumber} (index ${slideIndex})`
        );
      } else {
        this.outputChannel.appendLine('Delete slide: edit failed to apply');
      }
    } catch (error) {
      this.outputChannel.appendLine(`Delete slide error: ${error}`);
    }
  }

  /**
   * Handle the 'reorder-slide' message from the webview.
   * Moves a slide to a new position, optionally changing its section.
   *
   * AC-21.2.5: Within-section reorder
   * AC-21.2.6: Cross-section move (updates agenda_section_id)
   * AC-21.2.7: All slides renumbered after reorder
   * AC-21.2.8: YAML updates immediately via WorkspaceEdit
   * AC-21.2.11: Undo support via WorkspaceEdit
   */
  private async handleReorderSlide(
    message: { type: 'reorder-slide'; slideNumber: number; newIndex: number; newSectionId?: string },
    document: vscode.TextDocument
  ): Promise<void> {
    this.outputChannel.appendLine(
      `Reorder slide ${message.slideNumber} to index ${message.newIndex}${message.newSectionId ? ` (section: ${message.newSectionId})` : ''}`
    );

    try {
      const doc = parseYaml(document.getText());

      // slideNumber is 1-indexed, array is 0-indexed
      const fromIndex = message.slideNumber - 1;
      let toIndex = message.newIndex;

      // Handle newIndex=-1 convention: append to end of target section (AC-21.3.8)
      if (toIndex === -1 && message.newSectionId) {
        const slides = doc.toJS().slides as Array<{ agenda_section_id?: string }>;
        // Find the last slide in the target section
        let lastInSection = -1;
        for (let i = slides.length - 1; i >= 0; i--) {
          if (slides[i].agenda_section_id === message.newSectionId) {
            lastInSection = i;
            break;
          }
        }
        // Place after the last slide in target section (or at beginning if section is empty)
        toIndex = lastInSection >= 0 ? lastInSection + 1 : slides.length;
        this.outputChannel.appendLine(
          `Resolved newIndex=-1 for section ${message.newSectionId}: computed toIndex=${toIndex}`
        );
      }

      // Handle no-op: same position with no section change
      if (fromIndex === toIndex && !message.newSectionId) {
        this.outputChannel.appendLine('Reorder slide: no-op (same position, same section)');
        return;
      }

      // Perform the move (includes renumbering)
      const newContent = moveSlide(doc, fromIndex, toIndex, message.newSectionId);
      const success = await this.applyEdit(document, newContent);

      if (success) {
        const logMsg = message.newSectionId
          ? `Moved slide ${message.slideNumber} from index ${fromIndex} to ${toIndex}, section → ${message.newSectionId}`
          : `Moved slide ${message.slideNumber} from index ${fromIndex} to ${toIndex}`;
        this.outputChannel.appendLine(logMsg);
      } else {
        this.outputChannel.appendLine('Reorder slide: edit failed to apply');
      }
    } catch (error) {
      this.outputChannel.appendLine(`Reorder slide error: ${error}`);
    }
  }

  /**
   * Handle the 'open-claude' message from the webview.
   * Writes focused slide context and attempts to open Claude Code.
   *
   * AC-23.2.4: Message sent on button click
   * AC-23.2.5: Focused slide context written to context file
   * AC-23.2.6: Claude Code opened via command execution
   * AC-23.2.7: Claude Code panel opens if available
   * AC-23.2.8: Graceful fallback if Claude Code not installed
   *
   * @param message - The open-claude message with optional slideNumber
   * @param document - The text document to read plan from
   */
  private async handleOpenClaude(
    message: { type: 'open-claude'; slideNumber?: number; instruction?: string },
    document: vscode.TextDocument
  ): Promise<void> {
    this.outputChannel.appendLine(
      `[Claude] Open Claude Code${message.slideNumber ? ` for slide ${message.slideNumber}` : ''}` +
      `${message.instruction ? ` | instruction: "${message.instruction}"` : ''}`
    );

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      this.outputChannel.appendLine('[Claude] No workspace folder available');
      return;
    }

    try {
      const doc = parseYaml(document.getText());
      const plan = doc.toJS() as PlanData;
      const slides = plan.slides ?? [];

      // Find focused slide and neighbors
      let focusedSlide: SlideEntry | undefined;
      let focusedSlideNeighbors: { previous?: SlideEntry; next?: SlideEntry } | undefined;

      if (message.slideNumber) {
        // slideNumber is 1-indexed
        const slideIndex = message.slideNumber - 1;
        focusedSlide = slides[slideIndex];

        if (focusedSlide) {
          focusedSlideNeighbors = {
            previous: slideIndex > 0 ? slides[slideIndex - 1] : undefined,
            next: slideIndex < slides.length - 1 ? slides[slideIndex + 1] : undefined,
          };

          this.outputChannel.appendLine(
            `[Claude] Focused slide ${message.slideNumber}: "${focusedSlide.description || 'untitled'}"` +
            `${focusedSlideNeighbors.previous ? ` | prev: ${focusedSlideNeighbors.previous.number}` : ''}` +
            `${focusedSlideNeighbors.next ? ` | next: ${focusedSlideNeighbors.next.number}` : ''}`
          );
        }
      }

      // Generate context markdown with focused slide and user instruction
      // AC #14: Use minimal mode for global edits (no slideNumber)
      const content = generateContextMarkdown({
        plan,
        templates: this.templateCatalog ?? [],
        theme: this.themeConfig,
        focusedSlide,
        focusedSlideNeighbors,
        instruction: message.instruction,
        minimal: !message.slideNumber,
      });

      // AC-23.2.5: Write focused context file
      await writeContextFile(workspaceFolder.uri, content, this.outputChannel);

      // AC #13, #16: Format as slash command and send to Claude Code
      // Uses sendToClaudeCode which handles clipboard + focus + paste + notification
      const textToSend = message.instruction
        ? `/sb-create:edit-plan ${message.instruction}`
        : '';
      if (textToSend) {
        this.outputChannel.appendLine(
          `[Claude] Sending to Claude Code: "${textToSend.substring(0, 100)}${textToSend.length > 100 ? '...' : ''}"`
        );
      }

      await sendToClaudeCode(textToSend || '', this.outputChannel, workspaceFolder.uri, {
        launchMode: configService.readSettings().claudeCode.launchMode,
        position: configService.readSettings().claudeCode.position,
      });
    } catch (error) {
      this.outputChannel.appendLine(`[Claude] Error handling open-claude: ${error}`);
    }
  }


  /**
   * Handle the 'open-slide-viewer' message from the webview.
   * Derives deckId from the document URI and opens the Slide Viewer panel.
   *
   * cv-2-5 AC-2: View Slides from Plan Editor
   */
  private async handleOpenSlideViewer(
    document: vscode.TextDocument
  ): Promise<void> {
    // Derive deckId from document URI: output/<deckId>/plan.yaml
    const pathSegments = document.uri.path.split('/');
    const planIndex = pathSegments.lastIndexOf('plan.yaml');
    if (planIndex < 1) {
      this.outputChannel.appendLine('[ViewSlides] Cannot derive deckId from document URI');
      return;
    }
    const deckId = pathSegments[planIndex - 1];
    this.outputChannel.appendLine(`[ViewSlides] Opening Slide Viewer for deck '${deckId}'`);

    // Delegate to command registered in extension.ts (has access to all dependencies)
    await vscode.commands.executeCommand('slideBuilder.openSlideViewerForDeck', deckId);
  }

  /**
   * Handle the 'build-all' message from the webview.
   * Triggers /sb-create:build-all command via Claude Code terminal.
   *
   * cv-3-4 AC-24: Build all slides via Claude Code
   * cv-3-4 AC-27: Interactive build conversation in terminal
   * cv-3-4 AC-30: Build button in Plan Editor
   */
  private async handleBuildAll(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): Promise<void> {
    // Derive deck path from document URI: .slide-builder/decks/<deckId>/plan.yaml
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      this.outputChannel.appendLine('[BuildAll] No workspace folder available');
      return;
    }

    const pathSegments = document.uri.path.split('/');
    const planIndex = pathSegments.lastIndexOf('plan.yaml');
    if (planIndex < 1) {
      this.outputChannel.appendLine('[BuildAll] Cannot derive deck path from document URI');
      return;
    }

    // Build deck path: go up one level from plan.yaml
    const deckFolderSegments = pathSegments.slice(0, planIndex);
    const deckPath = deckFolderSegments.join('/');

    this.outputChannel.appendLine(`[BuildAll] Triggering build for deck: ${deckPath}`);

    // BR-2.1 AC-1, AC-3, AC-8: Pre-check plan.yaml for pending slide count
    let pendingContext = '';
    try {
      const planUri = vscode.Uri.file(path.join(deckPath, 'plan.yaml'));
      const planBytes = await vscode.workspace.fs.readFile(planUri);
      const planContent = new TextDecoder().decode(planBytes);
      const plan = parseYamlRaw(planContent);
      const slides: Array<{ status?: string }> = plan?.slides ?? [];
      const totalCount = slides.length;
      const pendingCount = slides.filter((s) => s.status !== 'built').length;

      // AC-8: Log the pre-check result
      this.outputChannel.appendLine(`[BuildAll] Pre-check: ${pendingCount}/${totalCount} slides pending`);

      if (pendingCount === 0) {
        // BR-2.2 AC-9, AC-10, AC-11: Short-circuit with non-modal info message when all slides built
        this.outputChannel.appendLine(`[BuildAll] All slides built, skipping Claude Code invocation`);
        vscode.window.showInformationMessage(`All ${totalCount} slides already built`);
        // BR-2.2: Send result back to webview for inline feedback
        webview.postMessage({ type: 'build-all-result', allBuilt: true, totalCount });
        return;
      }

      // AC-3: Include pending count context in the command
      pendingContext = `\n\nContext: ${pendingCount} of ${totalCount} slides are pending.`;
      // AC-8: Log that build is being triggered
      this.outputChannel.appendLine(`[BuildAll] Triggering build for ${pendingCount} pending slides`);
    } catch (error: unknown) {
      // AC-1 fail-open: Log error and proceed without pre-check context
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`[BuildAll] Pre-check failed: ${errorMessage}, proceeding to Claude Code`);
    }

    // lv-1-1 AC-1, AC-4: Auto-open viewer before dispatching build
    const deckId = deckFolderSegments[deckFolderSegments.length - 1];
    try {
      const buildId = `${deckId}-${Date.now()}`;
      this.outputChannel.appendLine(
        `[BuildViewer] Plan Editor: auto-open viewer for deck '${deckId}' mode='all' buildId='${buildId}'`
      );

      // Check if panel already exists before opening (for queue vs post decision)
      const panelExists = SlideViewerV2Panel.hasPanel(deckId);

      // AC-5: createOrShow reveals existing panel if already open
      await vscode.commands.executeCommand('slideBuilder.openSlideViewerForDeck', deckId);

      // AC-7: Send v2-build-started to viewer webview
      // If panel was newly created, queue message for delivery on v2-ready to avoid race condition
      const buildStartedMessage = {
        type: 'v2-build-started',
        mode: 'all' as const,
        totalSlides: 0, // Will be determined by BuildProgressService
        startSlide: 1,
        buildId,
      };
      if (panelExists) {
        SlideViewerV2Panel.postMessage(buildStartedMessage, deckId);
      } else {
        SlideViewerV2Panel.queueMessage(deckId, buildStartedMessage);
      }

      this.outputChannel.appendLine(
        `[BuildViewer] Plan Editor: viewer opened and build-started sent for '${deckId}'`
      );
    } catch (autoOpenError) {
      // lv-1-1: Auto-open is best-effort; don't block the build
      this.outputChannel.appendLine(
        `[BuildViewer] Plan Editor: auto-open failed (non-blocking): ${autoOpenError}`
      );
    }

    // story-1.2 AC-1,5: Close plan.yaml custom editor tab to maximize screen space
    try {
      const planTab = vscode.window.tabGroups.all
        .flatMap(g => g.tabs)
        .find(tab =>
          tab.input instanceof vscode.TabInputCustom &&
          tab.input.uri.toString() === document.uri.toString()
        );
      if (planTab) {
        await vscode.window.tabGroups.close(planTab);
        this.outputChannel.appendLine('[BuildAll] Closed plan.yaml editor tab');
      }
    } catch (closeError) {
      // story-1.2 AC-3: Tab close failure must not block build dispatch
      this.outputChannel.appendLine(`[BuildAll] Tab close failed (non-blocking): ${closeError}`);
    }

    // AC-2, AC-24, AC-27: Send to Claude Code terminal (interactive conversation)
    // Story Reference: vscode-config-2 AC-7 through AC-14
    const buildCommand = `/sb-create:build-all --deck "${deckPath}"${pendingContext}`;
    await sendToClaudeCode(buildCommand, this.outputChannel, workspaceFolder.uri, {
      launchMode: configService.readSettings().claudeCode.launchMode,
      position: configService.readSettings().claudeCode.position
    });
  }

  /**
   * Handle the 'build-slide' message from the webview.
   * Triggers /sb-create:build-one command via Claude Code terminal for a single slide.
   *
   * BR-1.3 AC-14: Build button sends build-slide message
   * BR-1.3 AC-16: Pending slide build follows standard workflow
   * BR-1.3 AC-17: Built slide rebuild overwrites HTML (handled by build-one workflow)
   */
  private async handleBuildSlide(
    message: { type: 'build-slide'; slideNumber: number },
    document: vscode.TextDocument
  ): Promise<void> {
    this.outputChannel.appendLine(`[PlanEditor] Build slide: ${message.slideNumber}`);

    try {
      // Derive deck path from document URI (same pattern as handleBuildAll)
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      if (!workspaceFolder) {
        this.outputChannel.appendLine('[PlanEditor] Build slide: No workspace folder available');
        vscode.window.showWarningMessage('Build slide: No workspace folder available.');
        return;
      }

      const pathSegments = document.uri.path.split('/');
      const planIndex = pathSegments.lastIndexOf('plan.yaml');
      if (planIndex < 1) {
        this.outputChannel.appendLine('[PlanEditor] Build slide: Cannot derive deck path from document URI');
        vscode.window.showWarningMessage('Build slide: Cannot derive deck path from document URI.');
        return;
      }

      // Build deck path: go up one level from plan.yaml
      const deckFolderSegments = pathSegments.slice(0, planIndex);
      const deckPath = deckFolderSegments.join('/');

      // lv-1-1 AC-3: Auto-open viewer before dispatching build-one
      const deckId = deckFolderSegments[deckFolderSegments.length - 1];
      try {
        const buildId = `${deckId}-${Date.now()}`;
        this.outputChannel.appendLine(
          `[BuildViewer] Plan Editor: auto-open viewer for deck '${deckId}' mode='one' slide=${message.slideNumber} buildId='${buildId}'`
        );

        // Check if panel already exists before opening (for queue vs post decision)
        const panelExists = SlideViewerV2Panel.hasPanel(deckId);

        // AC-5: createOrShow reveals existing panel if already open
        await vscode.commands.executeCommand('slideBuilder.openSlideViewerForDeck', deckId);

        // AC-7: Send v2-build-started to viewer webview
        // If panel was newly created, queue message for delivery on v2-ready to avoid race condition
        const buildStartedMessage = {
          type: 'v2-build-started',
          mode: 'one' as const,
          totalSlides: 1,
          startSlide: message.slideNumber,
          buildId,
        };
        if (panelExists) {
          SlideViewerV2Panel.postMessage(buildStartedMessage, deckId);
        } else {
          SlideViewerV2Panel.queueMessage(deckId, buildStartedMessage);
        }

        this.outputChannel.appendLine(
          `[BuildViewer] Plan Editor: viewer opened and build-started sent for '${deckId}' slide ${message.slideNumber}`
        );
      } catch (autoOpenError) {
        // lv-1-1: Auto-open is best-effort; don't block the build
        this.outputChannel.appendLine(
          `[BuildViewer] Plan Editor: auto-open failed (non-blocking): ${autoOpenError}`
        );
      }

      // story-1.2 AC-2,5: Close plan.yaml custom editor tab to maximize screen space
      try {
        const planTab = vscode.window.tabGroups.all
          .flatMap(g => g.tabs)
          .find(tab =>
            tab.input instanceof vscode.TabInputCustom &&
            tab.input.uri.toString() === document.uri.toString()
          );
        if (planTab) {
          await vscode.window.tabGroups.close(planTab);
          this.outputChannel.appendLine('[PlanEditor] Closed plan.yaml editor tab');
        }
      } catch (closeError) {
        // story-1.2 AC-3: Tab close failure must not block build dispatch
        this.outputChannel.appendLine(`[PlanEditor] Tab close failed (non-blocking): ${closeError}`);
      }

      // Compose Claude Code prompt with /sb-create:build-one command
      const buildCommand = `/sb-create:build-one\n\nDeck: ${deckPath}\nSlide: ${message.slideNumber}`;

      this.outputChannel.appendLine(`[PlanEditor] Build slide: sending command for deck ${deckPath}`);

      await sendToClaudeCode(buildCommand, this.outputChannel, workspaceFolder.uri, {
        launchMode: configService.readSettings().claudeCode.launchMode,
        position: configService.readSettings().claudeCode.position,
      });

      this.outputChannel.appendLine(
        `[PlanEditor] Build slide: sendToClaudeCode invoked for slide ${message.slideNumber}`
      );
    } catch (error) {
      this.outputChannel.appendLine(`[PlanEditor] Build slide error: ${error}`);
      vscode.window.showErrorMessage(`Failed to build slide ${message.slideNumber}: ${error}`);
    }
  }

  /**
   * Check if a deck has built slides and send status to webview.
   * cv-2-5 AC-3: Enable/disable View Slides button based on build status.
   */
  async sendDeckBuildStatus(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): Promise<void> {
    try {
      // Derive deckId from document URI
      const pathSegments = document.uri.path.split('/');
      const planIndex = pathSegments.lastIndexOf('plan.yaml');
      if (planIndex < 1) return;
      const deckId = pathSegments[planIndex - 1];

      // Check if index.html exists for this deck
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      if (!workspaceFolder) return;

      const viewerUri = vscode.Uri.joinPath(workspaceFolder.uri, 'output', deckId, 'index.html');
      let hasBuiltSlides = false;
      try {
        await vscode.workspace.fs.stat(viewerUri);
        hasBuiltSlides = true;
      } catch {
        // No built slides
      }

      await webview.postMessage({ type: 'deck-build-status', hasBuiltSlides });
      this.outputChannel.appendLine(`[ViewSlides] Deck '${deckId}' build status: ${hasBuiltSlides}`);
    } catch (error) {
      this.outputChannel.appendLine(`[ViewSlides] Error checking build status: ${error}`);
    }
  }

  /**
   * Applies an edit to the document via WorkspaceEdit API.
   * This enables VS Code's native undo/redo functionality.
   *
   * CRITICAL (ADR-001): ALL document modifications MUST go through WorkspaceEdit.
   * Never use fs.writeFile() or document.save() directly.
   *
   * @param document - The document to edit
   * @param newContent - The new content to replace the document with
   * @returns Promise<boolean> - Whether the edit was applied successfully
   */
  private async applyEdit(
    document: vscode.TextDocument,
    newContent: string
  ): Promise<boolean> {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    edit.replace(document.uri, fullRange, newContent);
    return vscode.workspace.applyEdit(edit);
  }

  /**
   * Handle the 'ready' message from the webview.
   * Sends initial data: plan, templates, theme, and confidence scores.
   *
   * AC-18.3.6: Extension responds to 'ready' with plan-updated, templates-loaded,
   *            theme-loaded, confidence-scores messages
   */
  private async handleReady(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): Promise<void> {
    this.outputChannel.appendLine('Webview ready - sending initial data');

    // Get workspace folder for loading catalog and theme
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

    // Send plan data
    await this.sendPlanUpdate(webview, document);

    // Send templates
    await this.sendTemplates(webview, workspaceFolder);

    // Send theme
    await this.sendTheme(webview, workspaceFolder);

    // AC-20.2.6: Compute and send confidence scores
    await this.sendConfidenceScores(webview, document);

    // cv-2-5 AC-3: Send deck build status for View Slides button
    await this.sendDeckBuildStatus(webview, document);

    this.outputChannel.appendLine('Initial data sent to webview');

    // AC-23.1.1: Write initial context file for Claude Code (fire-and-forget)
    // This is async but not awaited - context is supplementary
    if (workspaceFolder) {
      this.writeClaudeContext(document, workspaceFolder.uri);
    }
  }

  /**
   * Parse and send the current plan data to the webview.
   */
  private async sendPlanUpdate(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): Promise<void> {
    try {
      const doc = parseYaml(document.getText());
      const plan = doc.toJS() as PlanData;

      const slideWarnings = validateSlideRules(plan.slides ?? []);
      const planWarnings = validatePlanRules(plan);
      const validationWarnings = [...slideWarnings, ...planWarnings];

      const message: ExtensionMessage = {
        type: 'plan-updated',
        plan,
        validationWarnings,
      };

      webview.postMessage(message);
      const slideCount = plan.slides?.length ?? 0;
      const warningCount = validationWarnings.length;
      this.outputChannel.appendLine(
        `Sent plan-updated: ${slideCount} slides | [Validator] Validated ${slideCount} slides: ${warningCount} warnings found`
      );
    } catch (error) {
      this.outputChannel.appendLine(`Failed to parse plan: ${error}`);
      // Send empty plan on parse error
      const message: ExtensionMessage = {
        type: 'plan-updated',
        plan: {
          deck_name: 'Parse Error',
          created: '',
          last_modified: '',
          audience: { description: '', knowledge_level: 'intermediate', priorities: [] },
          purpose: '',
          desired_outcome: '',
          key_message: '',
          storyline: { opening_hook: '', tension: '', resolution: '', call_to_action: '' },
          recurring_themes: [],
          agenda_sections: [],
          slides: [],
        },
        validationWarnings: [{
          type: 'missing-field',
          message: `Failed to parse plan.yaml: ${error}`,
          severity: 'warning',
        }],
      };
      webview.postMessage(message);
    }
  }

  /**
   * Load and send template catalog to the webview.
   * AC-18.5.1: Reads catalog via workspace.fs.readFile() on ready message
   * AC-18.5.2: Cached in memory (loaded once, reused across sessions)
   * AC-18.5.3: Sends templates-loaded message to webview
   * AC-18.5.6: Shows VS Code warning if catalog missing
   */
  private async sendTemplates(
    webview: vscode.Webview,
    workspaceFolder: vscode.WorkspaceFolder | undefined
  ): Promise<void> {
    // AC-18.5.2: Return cached catalog if available
    if (this.templateCatalog !== null) {
      this.outputChannel.appendLine(`Using cached templates: ${this.templateCatalog.length} templates`);
      const message: ExtensionMessage = {
        type: 'templates-loaded',
        templates: this.templateCatalog,
      };
      webview.postMessage(message);
      return;
    }

    let templates: TemplateCatalogEntry[] = [];

    if (workspaceFolder) {
      // AC-18.5.1: Read catalog from .slide-builder/config/catalog/slide-templates.json
      const catalogPath = vscode.Uri.joinPath(
        workspaceFolder.uri,
        '.slide-builder',
        'config',
        'catalog',
        'slide-templates.json'
      );

      try {
        const catalogData = await vscode.workspace.fs.readFile(catalogPath);
        const catalogJson = JSON.parse(new TextDecoder().decode(catalogData));
        // Extract template entries from catalog
        // Support both formats: { templates: [...] } and direct array [...]
        const templateArray = Array.isArray(catalogJson)
          ? catalogJson
          : Array.isArray(catalogJson.templates)
            ? catalogJson.templates
            : [];
        templates = templateArray.map((t: Record<string, unknown>) => ({
          id: String(t.id ?? ''),
          name: String(t.name ?? ''),
          description: String(t.description ?? ''),
          use_cases: Array.isArray(t.use_cases) ? t.use_cases.map(String) : [],
        }));
        // AC-18.5.2: Cache the loaded catalog
        this.templateCatalog = templates;
        this.outputChannel.appendLine(`Loaded ${templates.length} templates from catalog`);
      } catch (error) {
        // AC-18.5.6: Show VS Code warning for missing catalog
        this.outputChannel.appendLine(`Template catalog not found or invalid: ${error}`);
        vscode.window.showWarningMessage(
          'Template catalog not found - confidence scoring will be disabled'
        );
        // Cache empty array to avoid repeated file reads and warnings
        this.templateCatalog = [];
      }
    } else {
      // No workspace folder - cache empty array
      this.templateCatalog = [];
    }

    // AC-18.5.3: Send templates-loaded message
    const message: ExtensionMessage = {
      type: 'templates-loaded',
      templates,
    };

    webview.postMessage(message);
    this.outputChannel.appendLine(`Sent templates-loaded: ${templates.length} templates`);
  }

  /**
   * Load and send theme configuration to the webview.
   * AC-18.5.4: Reads theme via workspace.fs.readFile()
   * AC-18.5.5: Sends theme-loaded message to webview
   * AC-18.5.7: Missing theme continues silently (non-blocking, optional context)
   */
  private async sendTheme(
    webview: vscode.Webview,
    workspaceFolder: vscode.WorkspaceFolder | undefined
  ): Promise<void> {
    let theme: ThemeConfig | null = null;

    if (workspaceFolder) {
      // AC-18.5.4: Read theme from .slide-builder/config/theme.json
      const themePath = vscode.Uri.joinPath(
        workspaceFolder.uri,
        '.slide-builder',
        'config',
        'theme.json'
      );

      try {
        const themeData = await vscode.workspace.fs.readFile(themePath);
        theme = JSON.parse(new TextDecoder().decode(themeData)) as ThemeConfig;
        // Cache the loaded theme for context file generation (AC-23.1.8)
        this.themeConfig = theme;
        this.outputChannel.appendLine('Loaded theme');
      } catch (error) {
        // AC-18.5.7: Missing theme continues silently (info log only, no user notification)
        this.outputChannel.appendLine(`Theme file not found: ${error}`);
        this.themeConfig = null;
      }
    }

    // AC-18.5.5: Send theme-loaded message
    const message: ExtensionMessage = {
      type: 'theme-loaded',
      theme,
    };

    webview.postMessage(message);
    this.outputChannel.appendLine(`Sent theme-loaded: ${theme ? 'loaded' : 'null'}`);
  }

  /**
   * Send empty confidence scores to the webview.
   * Scoring logic removed - template field now displays suggested_template directly.
   */
  private async sendConfidenceScores(
    webview: vscode.Webview,
    _document: vscode.TextDocument
  ): Promise<void> {
    const message: ExtensionMessage = { type: 'confidence-scores', scores: {} };
    webview.postMessage(message);
  }

  // =============================================================================
  // Claude Code Context Integration (Story 23-1)
  // =============================================================================

  /**
   * Writes the Claude Code context file with current plan state.
   * This method is fire-and-forget — errors are logged but not surfaced.
   *
   * AC-23.1.1: Context file written on activation
   * AC-23.1.11: Context file regenerated when plan changes
   * AC-23.1.14: Non-blocking (async, fire-and-forget)
   * AC-23.1.16: Errors logged to output channel, not surfaced to user
   *
   * @param document - The plan.yaml document
   * @param workspaceFolder - The workspace root URI
   */
  public async writeClaudeContext(
    document: vscode.TextDocument,
    workspaceFolder: vscode.Uri
  ): Promise<void> {
    try {
      const doc = parseYaml(document.getText());
      const plan = doc.toJS() as PlanData;

      const content = generateContextMarkdown({
        plan,
        templates: this.templateCatalog ?? [],
        theme: this.themeConfig,
      });

      const slideCount = plan.slides?.length ?? 0;
      const templateCount = this.templateCatalog?.length ?? 0;
      this.outputChannel.appendLine(
        `[Claude Context] Writing context: ${slideCount} slides, ${templateCount} templates`
      );

      await writeContextFile(workspaceFolder, content, this.outputChannel);
    } catch (error) {
      // AC-23.1.16: Log error, don't surface to user (context is supplementary)
      this.outputChannel.appendLine(`[Claude Context] Failed to generate context: ${error}`);
    }
  }

  /**
   * Gets the cached template catalog.
   * Used by PlanEditorProvider for context updates.
   */
  public getTemplates(): TemplateCatalogEntry[] {
    return this.templateCatalog ?? [];
  }

  /**
   * Gets the cached theme configuration.
   * Used by PlanEditorProvider for context updates.
   */
  public getTheme(): ThemeConfig | null {
    return this.themeConfig;
  }
}
