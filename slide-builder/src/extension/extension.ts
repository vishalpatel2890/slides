import * as vscode from 'vscode';
import { PlanEditorProvider } from './PlanEditorProvider';
import { CatalogViewProvider } from './CatalogViewProvider';
import { CatalogDataService } from './CatalogDataService';
import { FileWatcherService } from './FileWatcherService';
import { BuildProgressService } from './BuildProgressService';
import { ThumbnailService } from './ThumbnailService';
import { DeckTemplateConfigService } from './DeckTemplateConfigService';
import { SlideViewerV2Panel } from './SlideViewerV2Panel';
import { ThemeEditorPanel } from './ThemeEditorPanel';
import { ConfigurationService, type SlideBuilderConfig } from './ConfigurationService';
import { PresentServer } from './PresentServer';
import type { SendToClaudeCodeOptions } from './claude-code-integration';
import { sendToClaudeCode } from './claude-code-integration';
import type { DeckInfo } from '../shared/types';

/**
 * Shared output channel for all Slide Builder logging.
 * Exported for use by providers and other modules.
 */
export let outputChannel: vscode.OutputChannel;

/**
 * ConfigurationService instance for reading current settings.
 * Exported for use by message handlers to get fresh configuration on each call.
 * Story Reference: vscode-config-2 AC-7 through AC-14
 */
export let configService: ConfigurationService;

/**
 * Shows a Quick Pick populated with decks from CatalogDataService.
 * Returns the selected DeckInfo or undefined if cancelled/empty.
 *
 * Story Reference: cv-1-7 AC-3, AC-9
 */
export async function showDeckPicker(
  dataService: CatalogDataService,
  placeholder: string
): Promise<DeckInfo | undefined> {
  // Use scanDecksWithFolders to include nested decks (cv-3-3)
  const { decks } = await dataService.scanDecksWithFolders();

  if (decks.length === 0) {
    vscode.window.showInformationMessage(
      'No decks found. Create a deck first.'
    );
    return undefined;
  }

  // Sort by lastModified descending (most recent first)
  const sorted = [...decks].sort((a, b) => b.lastModified - a.lastModified);

  const items: (vscode.QuickPickItem & { deckInfo: DeckInfo })[] = sorted.map(
    (deck) => ({
      label: deck.name,
      description: deck.folderId
        ? `${deck.folderId}/ • ${deck.slideCount} slides`
        : `${deck.slideCount} slides`,
      detail: `Status: ${deck.status}`,
      deckInfo: deck,
    })
  );

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: placeholder,
  });

  return selected?.deckInfo;
}

/**
 * Activates the Slide Builder extension.
 * Registers PlanEditorProvider, CatalogViewProvider, and commands.
 *
 * Story Reference: cv-1-1 AC-1, AC-3; cv-1-3 AC-4, AC-5; cv-1-7 AC-1-AC-9
 */
export function activate(context: vscode.ExtensionContext): void {
  // Create shared OutputChannel
  outputChannel = vscode.window.createOutputChannel('Slide Builder');
  context.subscriptions.push(outputChannel);
  outputChannel.appendLine('Slide Builder extension activated');

  // Story Reference: vscode-config-2 AC-7 through AC-14
  // Create configuration service (will be used to read fresh config on each call)
  configService = new ConfigurationService(context, outputChannel);
  const initialConfig = configService.readSettings();
  outputChannel.appendLine(
    `[Config] Initial settings - Launch Mode: ${initialConfig.claudeCode.launchMode}, ` +
    `Position: ${initialConfig.claudeCode.position}`
  );

  // Register CustomTextEditorProvider for plan.yaml (AC-18.2.3)
  const planProvider = new PlanEditorProvider(context, outputChannel);

  // BR-1.3 AC-19: BuildProgressService wired after fileWatcher/dataService creation below
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      PlanEditorProvider.viewType,
      planProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    )
  );
  outputChannel.appendLine('PlanEditorProvider registered for plan.yaml');

  // Get workspace root for file system services (cv-1-3)
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const workspaceUri = workspaceFolder?.uri ?? context.extensionUri;

  // Create catalog services (cv-1-3 AC-1, AC-5)
  const dataService = new CatalogDataService(workspaceUri, outputChannel);
  const fileWatcher = new FileWatcherService(workspaceUri, outputChannel);
  context.subscriptions.push(dataService);
  context.subscriptions.push(fileWatcher);

  // BR-1.3 AC-19: Wire BuildProgressService to PlanEditorProvider for real-time build-status-changed
  const buildProgressService = new BuildProgressService(fileWatcher, dataService, outputChannel);
  context.subscriptions.push(buildProgressService);
  planProvider.setBuildProgressService(buildProgressService);
  // lv-1-2: Wire BuildProgressService to SlideViewerV2Panel for dismissed tracking in onDidDispose
  SlideViewerV2Panel.setBuildProgressService(buildProgressService);
  outputChannel.appendLine('BuildProgressService wired to PlanEditorProvider and SlideViewerV2Panel');

  // lv-2-2 AC-22, Task 6: Build inactivity timeout (10 minutes)
  // Protects against stuck build mode from crashed/abandoned Claude Code processes (ADR-LV-6)
  const BUILD_INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  let buildInactivityTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Resets the build inactivity timer. Called on each onProgress event.
   * If 10 minutes pass without progress, cancels the build and notifies the viewer.
   * lv-2-2 Task 6.2
   */
  function resetBuildInactivityTimer(deckId: string): void {
    // Clear existing timer
    if (buildInactivityTimer !== null) {
      clearTimeout(buildInactivityTimer);
      buildInactivityTimer = null;
    }
    outputChannel.appendLine(`[BuildViewer] Build inactivity timeout reset for deck: ${deckId}`);

    buildInactivityTimer = setTimeout(() => {
      try {
        outputChannel.appendLine(
          `[BuildViewer] Build inactivity timeout reached for deck: ${deckId} -- cancelling build mode`
        );
        // Check if still building before cancelling
        if (buildProgressService.isBuilding(deckId)) {
          buildProgressService.cancelBuild();
        }
        // Send v2-build-complete with cancelled: true to viewer
        const timeoutBuiltCount = buildProgressService.getProgress()?.slides.filter(
          (s: { status: string }) => s.status === 'built'
        ).length ?? 0;
        SlideViewerV2Panel.postMessage({
          type: 'v2-build-complete' as const,
          builtCount: timeoutBuiltCount,
          errorCount: 0,
          cancelled: true,
        }, deckId);
        outputChannel.appendLine(
          `[BuildViewer] Sending v2-build-complete (timeout cancellation) to viewer: deck=${deckId}`
        );
      } catch (error) {
        outputChannel.appendLine(
          `[BuildViewer] Error in inactivity timeout handler (non-blocking): ${error}`
        );
      }
      buildInactivityTimer = null;
    }, BUILD_INACTIVITY_TIMEOUT);
  }

  // lv-2-1 AC-11: Wire build->viewer progress bridge
  // Forwards build progress from BuildProgressService to viewer via v2-build-progress postMessage
  outputChannel.appendLine('[BuildViewer] Wiring build->viewer progress bridge');
  context.subscriptions.push(
    buildProgressService.onProgress((progress) => {
      try {
        const deckId = progress.deckId;
        const builtCount = progress.slides.filter(s => s.status === 'built').length;
        const currentBuildingIndex = progress.slides.findIndex(s => s.status === 'building');
        const currentBuilding = currentBuildingIndex >= 0 ? currentBuildingIndex + 1 : builtCount;
        const totalSlides = progress.slides.length;

        // Determine status for the message
        let status: 'building' | 'built' | 'error' = 'building';
        if (progress.status === 'error') {
          status = 'error';
        } else if (progress.status === 'complete') {
          status = 'built';
        }

        // lv-2-1 AC-11, Task 5.3: Check if viewer was dismissed for this build
        const buildId = buildProgressService.getBuildId();
        if (buildId && SlideViewerV2Panel.isDismissedForBuild(deckId, buildId)) {
          outputChannel.appendLine(
            `[BuildViewer] Skipping v2-build-progress for dismissed build: deck=${deckId}, buildId=${buildId}`
          );
          return;
        }

        // lv-2-2 Task 7.1: Detect build completion or cancellation
        if (progress.status === 'complete' || progress.status === 'cancelled') {
          const errorCount = progress.slides.filter(s => s.status === 'error').length;
          const cancelled = progress.status === 'cancelled';

          // lv-2-2 Task 7.4: Log build completion
          outputChannel.appendLine(
            `[BuildViewer] Build complete: deck=${deckId}, built=${builtCount}, errors=${errorCount}`
          );
          outputChannel.appendLine(
            `[BuildViewer] Sending v2-build-complete to viewer: deck=${deckId}`
          );

          // lv-2-2 Task 7.2: Send v2-build-complete to viewer
          SlideViewerV2Panel.postMessage({
            type: 'v2-build-complete' as const,
            builtCount,
            errorCount,
            cancelled,
          }, deckId);

          // lv-2-2 Task 7.3, 6.4: Clear inactivity timer on completion
          if (buildInactivityTimer !== null) {
            clearTimeout(buildInactivityTimer);
            buildInactivityTimer = null;
            outputChannel.appendLine(
              `[BuildViewer] Build inactivity timer cleared (build completed): deck=${deckId}`
            );
          }
          return; // Don't send a progress message for completed builds
        }

        // lv-2-2 Task 6.3: Reset inactivity timer on each progress event
        resetBuildInactivityTimer(deckId);

        // lv-2-1 Task 5.5: Log progress bridge event
        outputChannel.appendLine(
          `[BuildViewer] Slide ${currentBuilding} built for deck: ${deckId} (${builtCount}/${totalSlides})`
        );
        outputChannel.appendLine(
          `[BuildViewer] Sending v2-build-progress to viewer: deck=${deckId}, built=${builtCount}, total=${totalSlides}`
        );

        // lv-2-1 Task 5.4: Send v2-build-progress to viewer
        SlideViewerV2Panel.postMessage({
          type: 'v2-build-progress' as const,
          currentSlide: currentBuilding || builtCount,
          totalSlides,
          builtCount,
          status,
        }, deckId);
      } catch (error) {
        // lv-2-1 Task 5.6: Never block the progress callback
        outputChannel.appendLine(
          `[BuildViewer] Error in progress bridge (non-blocking): ${error}`
        );
      }
    })
  );

  // cv-5-3: Create and initialize thumbnail service (AC-22, AC-24)
  const thumbnailService = new ThumbnailService(
    context.extensionUri,
    workspaceUri,
    outputChannel
  );
  context.subscriptions.push(thumbnailService);

  // Initialize thumbnail service and evict orphaned entries on startup (AC-24)
  thumbnailService.initialize().then(() => {
    thumbnailService.evictOrphanedEntries().catch((error) => {
      outputChannel.appendLine(`ThumbnailService eviction error: ${error}`);
    });
  }).catch((error) => {
    outputChannel.appendLine(`ThumbnailService initialization error: ${error}`);
  });

  // Task 8: Wire file watcher to viewer auto-refresh (story-viewer-save-2 AC-1, cv-2-6)
  // Updated to use V2 Viewer; V2 panels also have internal file watching for fine-grained updates
  // lv-1-2 AC-13, AC-14: CLI build detection and auto-open
  context.subscriptions.push(
    fileWatcher.onFileChanged(async (uri) => {
      // Extract deckId from URI path: output/{deckId}/slides/...
      const match = uri.fsPath.match(/output[/\\]([^/\\]+)[/\\]slides[/\\]/);
      if (match) {
        const deckId = match[1];
        outputChannel.appendLine(`extension: Auto-refreshing V2 viewer for deck '${deckId}'`);
        SlideViewerV2Panel.refreshViewer(deckId, dataService, outputChannel);

        // lv-1-2 AC-13: CLI build detection — if no active build and no open viewer,
        // infer a CLI-initiated build from the first file write
        const isSlideFile = /slide-\d+\.html$/i.test(uri.fsPath);
        if (isSlideFile) {
          try {
            // Only auto-open if no UI-initiated build is active and viewer is not open
            if (!buildProgressService.isBuilding(deckId) && !SlideViewerV2Panel.isOpen(deckId)) {
              // lv-1-2 AC-18: Check if all slides are already built (fully-built deck skip)
              const deckDetailForCheck = await dataService.getDeckDetail(deckId);
              if (deckDetailForCheck &&
                  deckDetailForCheck.slides.length > 0 &&
                  deckDetailForCheck.slides.filter(s => s.status !== 'built').length === 0) {
                outputChannel.appendLine(
                  `[BuildViewer] Fully-built deck detected, skipping auto-open: ${deckId}`
                );
              } else {
                // Infer CLI build
                const buildId = `${deckId}-${Date.now()}`;
                outputChannel.appendLine(
                  `[BuildViewer] CLI build detected for deck: ${deckId}, inferring build mode`
                );

                // lv-1-2 AC-17: Clear dismissed entries for new build
                SlideViewerV2Panel.clearDismissedForDeck(deckId);
                outputChannel.appendLine(
                  `[BuildViewer] Cleared dismissed entries for deck: ${deckId} (new build starting)`
                );

                // Start tracking the inferred build
                const totalSlides = deckDetailForCheck?.slides.length ?? 0;
                await buildProgressService.startBuild(deckId, 'all', undefined, buildId);

                // Auto-open viewer
                const deckName = deckDetailForCheck?.name ?? deckId;
                SlideViewerV2Panel.createOrShow(
                  context.extensionUri,
                  workspaceUri,
                  deckId,
                  deckName,
                  dataService,
                  outputChannel,
                  fileWatcher
                );

                // lv-1-2 AC-14: Queue v2-build-started for delivery on v2-ready
                SlideViewerV2Panel.queueMessage(deckId, {
                  type: 'v2-build-started',
                  mode: 'all' as const,
                  totalSlides,
                  startSlide: 1,
                  buildId,
                });
                outputChannel.appendLine(
                  `[BuildViewer] Queued v2-build-started for panel not yet ready: ${deckId} buildId='${buildId}'`
                );
              }
            } else if (buildProgressService.isBuilding(deckId)) {
              // lv-1-2 AC-16: Check if this build was dismissed before auto-open
              const currentBuildId = buildProgressService.getBuildId();
              if (currentBuildId && SlideViewerV2Panel.isDismissedForBuild(deckId, currentBuildId)) {
                outputChannel.appendLine(
                  `[BuildViewer] Skipping auto-open for dismissed build: ${deckId}:${currentBuildId}`
                );
              }
            }
          } catch (cliDetectError) {
            // lv-1-2: CLI detection is best-effort; never block file watcher
            outputChannel.appendLine(
              `[BuildViewer] CLI build detection error (non-blocking): ${cliDetectError}`
            );
          }
        }
      }
    })
  );

  // tm-2-1: Create DeckTemplateConfigService for catalog inspect-deck-template handler
  const deckTemplateConfigService = new DeckTemplateConfigService(workspaceUri, outputChannel);
  context.subscriptions.push(deckTemplateConfigService);

  // Register CatalogViewProvider for Activity Bar sidebar (cv-1-1 AC-1, AC-2)
  // cv-5-3: Pass thumbnailService for thumbnail generation (AC-18, AC-21)
  // v3-2-1 AC-2: Pass globalState for view preference persistence
  // lv-1-1 AC-1: Pass buildProgressService to CatalogViewProvider for auto-open wiring
  const catalogProvider = new CatalogViewProvider(
    context.extensionUri,
    workspaceUri,
    outputChannel,
    dataService,
    fileWatcher,
    thumbnailService,
    context.globalState,
    deckTemplateConfigService,
    buildProgressService
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CatalogViewProvider.viewType,
      catalogProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  outputChannel.appendLine('CatalogViewProvider registered for slideBuilder.catalogView');

  // Register slideBuilder.openCatalog command (cv-1-1 AC-3, cv-1-7 AC-2)
  context.subscriptions.push(
    vscode.commands.registerCommand('slideBuilder.openCatalog', () => {
      vscode.commands.executeCommand('slideBuilder.catalogView.focus');
    })
  );

  // Register slideBuilder.viewDeck command (cv-2-1 AC-10, cv-2-6 AC-2)
  // Updated to use V2 Viewer (React SPA, no iframes)
  context.subscriptions.push(
    vscode.commands.registerCommand('slideBuilder.viewDeck', async () => {
      try {
        const deck = await showDeckPicker(dataService, 'Select a deck to view');
        if (deck) {
          SlideViewerV2Panel.createOrShow(
            context.extensionUri,
            workspaceUri,
            deck.id,
            deck.name,
            dataService,
            outputChannel,
            fileWatcher
          );
        }
      } catch (error) {
        outputChannel.appendLine(`slideBuilder.viewDeck error: ${error}`);
      }
    })
  );

  // Register slideBuilder.presentDeck command (cv-2-4 AC-4, pd-1-3 AC-1 through AC-4, AC-7)
  context.subscriptions.push(
    vscode.commands.registerCommand('slideBuilder.presentDeck', async (deckIdArg?: string) => {
      try {
        let deck: DeckInfo | undefined;
        if (deckIdArg) {
          deck = await dataService.getDeckDetail(deckIdArg) ?? undefined;
        } else {
          deck = await showDeckPicker(dataService, 'Select a deck to present');
        }
        if (!deck) {
          return;
        }

        // AC-2: Check for built slides before starting server
        if (!deck.builtSlideCount || deck.builtSlideCount === 0) {
          vscode.window.showErrorMessage('Deck has no built slides');
          return;
        }

        // AC-1: Start server and open browser at HTTP URL
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
          vscode.window.showErrorMessage('No workspace folder open');
          return;
        }

        try {
          const server = PresentServer.getInstance(workspaceRoot, outputChannel);
          const port = await server.ensureRunning();
          const deckPath = encodeURIComponent(deck.path);
          const presenterUrl = `http://localhost:${port}/present/${encodeURIComponent(deck.id)}?deckPath=${deckPath}`;

          await vscode.env.openExternal(vscode.Uri.parse(presenterUrl));

          // AC-7: Log presenter opened event
          outputChannel.appendLine(
            `[PresentServer] Opened presenter for "${deck.name}" at ${presenterUrl}`
          );
        } catch (err: unknown) {
          // AC-3: Server startup failure notification
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(
            `Failed to start presentation server: ${message}`
          );
          outputChannel.appendLine(`[PresentServer] Error: ${message}`);
        }
      } catch (error) {
        outputChannel.appendLine(`slideBuilder.presentDeck error: ${error}`);
      }
    })
  );

  // Register slideBuilder.buildDeck command (cv-1-7 AC-6 — placeholder for CV-3)
  context.subscriptions.push(
    vscode.commands.registerCommand('slideBuilder.buildDeck', async () => {
      try {
        const deck = await showDeckPicker(dataService, 'Select a deck to build');
        if (deck) {
          outputChannel.appendLine(`Build All Slides: ${deck.name}`);
          vscode.window.showInformationMessage(
            `Build integration coming in Epic CV-3`
          );
        }
      } catch (error) {
        outputChannel.appendLine(`slideBuilder.buildDeck error: ${error}`);
      }
    })
  );

  // Register slideBuilder.buildSlide command (cv-1-7 AC-6 — placeholder for CV-3)
  context.subscriptions.push(
    vscode.commands.registerCommand('slideBuilder.buildSlide', async () => {
      try {
        const deck = await showDeckPicker(dataService, 'Select a deck');
        if (deck) {
          outputChannel.appendLine(`Build Current Slide: ${deck.name}`);
          vscode.window.showInformationMessage(
            `Build integration coming in Epic CV-3`
          );
        }
      } catch (error) {
        outputChannel.appendLine(`slideBuilder.buildSlide error: ${error}`);
      }
    })
  );

  // Register slideBuilder.newDeck command (cv-1-7 AC-4 — placeholder for CV-3)
  context.subscriptions.push(
    vscode.commands.registerCommand('slideBuilder.newDeck', async () => {
      try {
        const choice = await vscode.window.showQuickPick(
          [
            {
              label: '$(sparkle) Plan with AI',
              description: 'Start a guided AI planning session',
            },
            {
              label: '$(file-code) From Template',
              description: 'Choose from a deck template',
            },
          ],
          { placeHolder: 'How would you like to create your deck?' }
        );
        if (choice) {
          outputChannel.appendLine(`New Deck: ${choice.label}`);
          vscode.window.showInformationMessage(
            `Deck creation coming in Epic CV-3`
          );
        }
      } catch (error) {
        outputChannel.appendLine(`slideBuilder.newDeck error: ${error}`);
      }
    })
  );

  // bt-1-1 AC-3, bt-1-2 AC-4: Register slideBuilder.brandSetup command
  // Reveals Catalog sidebar and triggers brand-setup modal via message to webview
  context.subscriptions.push(
    vscode.commands.registerCommand('slideBuilder.brandSetup', async () => {
      outputChannel.appendLine('[Brand] Brand Setup command invoked');
      await vscode.commands.executeCommand('slideBuilder.catalogView.focus');
      // bt-1-2: Send message to webview to open brand setup modal
      // Small delay to ensure sidebar webview is ready after focus
      setTimeout(() => {
        CatalogViewProvider.postMessage({ type: 'open-brand-setup' });
      }, 200);
    })
  );

  // bt-2-1 Task 6.1: Register slideBuilder.openThemeEditor command (AC-1, AC-2)
  context.subscriptions.push(
    vscode.commands.registerCommand('slideBuilder.openThemeEditor', () => {
      outputChannel.appendLine('[Brand] Open Theme Editor command invoked');
      ThemeEditorPanel.createOrShow(context.extensionUri, outputChannel, workspaceUri);
    })
  );

  // bt-1-1 AC-3, AC-9: Register slideBuilder.aiThemeEdit command
  context.subscriptions.push(
    vscode.commands.registerCommand('slideBuilder.aiThemeEdit', async () => {
      outputChannel.appendLine('[Brand] AI Theme Edit command invoked');
      const command = '/sb-brand:theme-edit';
      outputChannel.appendLine(`[Brand] Sending to Claude Code: ${command}`);
      await sendToClaudeCode(command, outputChannel, workspaceUri, {
        launchMode: configService.readSettings().claudeCode.launchMode,
        position: configService.readSettings().claudeCode.position,
      });
      vscode.window.showInformationMessage('AI Theme Edit started -- paste the command into Claude Code to begin');
    })
  );

  // Register slideBuilder.openSlideViewerForDeck command (cv-2-5 AC-2, cv-2-6 AC-3)
  // Called by Plan Editor message handler to open Slide Viewer for a specific deck
  // Updated to use V2 Viewer (React SPA, no iframes)
  context.subscriptions.push(
    vscode.commands.registerCommand('slideBuilder.openSlideViewerForDeck', async (deckId: string) => {
      try {
        if (!deckId) {
          outputChannel.appendLine('slideBuilder.openSlideViewerForDeck: no deckId provided');
          return;
        }
        const detail = await dataService.getDeckDetail(deckId);
        const deckName = detail?.name ?? deckId;
        SlideViewerV2Panel.createOrShow(
          context.extensionUri,
          workspaceUri,
          deckId,
          deckName,
          dataService,
          outputChannel,
          fileWatcher
        );
      } catch (error) {
        outputChannel.appendLine(`slideBuilder.openSlideViewerForDeck error: ${error}`);
      }
    })
  );

  // Story 1.2: Wire FileWatcherService plan.yaml watcher to open PlanEditorProvider
  // When plan.yaml is saved, open it in PlanEditorProvider (light-themed visual editor)
  context.subscriptions.push(
    fileWatcher.onPlanChanged((uri) => {
      outputChannel.appendLine(`extension: Plan changed — opening editor for ${uri.fsPath}`);

      // Story 1.3: Suppress auto-open when a build is active for this deck
      // Follows same guard pattern as onFileChanged CLI build detection (line ~296-369)
      try {
        const planMatch = /output[/\\]([^/\\]+)[/\\]plan\.yaml$/.exec(uri.fsPath);
        if (planMatch) {
          const deckId = planMatch[1];
          if (buildProgressService.isBuilding(deckId)) {
            outputChannel.appendLine(`extension: Suppressing plan.yaml auto-open during build for deck '${deckId}'`);
            return;
          }
        }
      } catch (guardError) {
        // AC #4: Fail-open — if guard errors, fall through to normal auto-open behavior
        outputChannel.appendLine(`extension: Plan auto-open guard error (proceeding with open): ${guardError}`);
      }

      // Check all tab groups for existing plan.yaml custom editor (AC-3)
      // visibleTextEditors doesn't include custom editors (WebView panels)
      const alreadyOpen = vscode.window.tabGroups.all.some(group =>
        group.tabs.some(tab =>
          tab.input instanceof vscode.TabInputCustom &&
          tab.input.uri.toString() === uri.toString()
        )
      );

      if (!alreadyOpen) {
        // Use vscode.openWith to explicitly route to PlanEditorProvider (AC-1, AC-2)
        vscode.commands.executeCommand(
          'vscode.openWith',
          uri,
          'slideBuilder.planEditor',
          vscode.ViewColumn.Beside
        );
      }
    })
  );

  outputChannel.appendLine('All 8 commands registered');
}

/**
 * Deactivates the extension.
 */
export async function deactivate(): Promise<void> {
  // pd-1-3 AC-6: Stop PresentServer and release port on deactivate
  try {
    PresentServer.stopIfRunning();
  } catch {
    // Safe to ignore — server may not have been started
  }

  // Dispose Puppeteer browser if it was launched for export capture
  try {
    const { disposeBrowser } = await import('./puppeteer-capture');
    await disposeBrowser();
  } catch {
    // Module may not have been loaded
  }
  if (outputChannel) {
    outputChannel.appendLine('Slide Builder extension deactivated');
  }
}
