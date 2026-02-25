import * as vscode from 'vscode';

/**
 * Service for watching .slide-builder/ and output/ directories for file system changes.
 * Debounces rapid changes at 200ms and notifies registered callbacks.
 * Provides per-deck file change callbacks with 300ms debounce for viewer auto-refresh.
 *
 * Architecture Reference: ADR-004 - Extension host drives data updates
 * Story Reference: cv-1-3 AC-5
 * Story Reference: story-viewer-save-2 AC-1 through AC-5
 */
export class FileWatcherService implements vscode.Disposable {
  private readonly watchers: vscode.FileSystemWatcher[] = [];
  private readonly callbacks = new Set<() => void>();
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private static readonly DEBOUNCE_MS = 200;

  // Task 1: Per-deck debounce infrastructure (story-viewer-save-2)
  private readonly fileChangeCallbacks = new Set<(uri: vscode.Uri) => void>();
  private readonly deckDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private static readonly FILE_CHANGE_DEBOUNCE_MS = 300;

  // Task 3: Save guard infrastructure (story-viewer-save-2)
  private readonly suppressedDecks = new Set<string>();
  private readonly suppressTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private static readonly SUPPRESS_EXPIRY_MS = 1000;

  // cv-4-1: Brand asset change callbacks
  private readonly brandAssetsCallbacks = new Set<() => void>();
  private brandAssetsDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  // v3-6-1: Plan.yaml change callbacks
  private readonly planChangeCallbacks = new Set<(uri: vscode.Uri) => void>();
  private planDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  private static readonly PLAN_DEBOUNCE_MS = 300;

  // tm-3-2: Deck template file change callbacks
  private readonly deckTemplateCallbacks = new Set<() => void>();
  private deckTemplateDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  private suppressNextDeckTemplateRefreshFlag = false;

  // bt-2-4: Theme.json change callbacks with write-suppression
  private readonly themeChangeCallbacks = new Set<() => void>();
  private themeDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  private static readonly THEME_DEBOUNCE_MS = 300;

  constructor(
    workspaceRoot: vscode.Uri,
    private readonly outputChannel: vscode.OutputChannel
  ) {
    // Watch .slide-builder/ for status.yaml and config changes
    const sbPattern = new vscode.RelativePattern(
      workspaceRoot,
      '.slide-builder/**/*'
    );
    const sbWatcher = vscode.workspace.createFileSystemWatcher(sbPattern);
    this.watchers.push(sbWatcher);

    // Watch output/ for slide build changes
    const outputPattern = new vscode.RelativePattern(
      workspaceRoot,
      'output/**/*'
    );
    const outputWatcher = vscode.workspace.createFileSystemWatcher(outputPattern);
    this.watchers.push(outputWatcher);

    for (const watcher of this.watchers) {
      watcher.onDidCreate((uri) => {
        this.outputChannel.appendLine(`FileWatcherService: Created ${uri.fsPath}`);
        this.debouncedNotify();
        // Task 6: Also invoke file change callbacks (story-viewer-save-2)
        this.debouncedFileChangeNotify(uri);
        // cv-4-1: Brand asset change detection
        if (this.isBrandAssetUri(uri)) {
          this.debouncedBrandAssetsNotify();
        }
        // v3-6-1: Plan.yaml change detection
        if (this.isPlanYamlUri(uri)) {
          this.debouncedPlanChangeNotify(uri);
        }
        // tm-3-2: Deck template file change detection
        if (this.isDeckTemplateUri(uri)) {
          this.debouncedDeckTemplateNotify(uri);
        }
        // bt-2-4: Theme.json change detection
        if (this.isThemeJsonUri(uri)) {
          this.debouncedThemeChangeNotify();
        }
      });

      watcher.onDidChange((uri) => {
        this.outputChannel.appendLine(`FileWatcherService: Changed ${uri.fsPath}`);
        this.debouncedNotify();
        // Task 6: Also invoke file change callbacks (story-viewer-save-2)
        this.debouncedFileChangeNotify(uri);
        // cv-4-1: Brand asset change detection
        if (this.isBrandAssetUri(uri)) {
          this.debouncedBrandAssetsNotify();
        }
        // v3-6-1: Plan.yaml change detection
        if (this.isPlanYamlUri(uri)) {
          this.debouncedPlanChangeNotify(uri);
        }
        // tm-3-2: Deck template file change detection
        if (this.isDeckTemplateUri(uri)) {
          this.debouncedDeckTemplateNotify(uri);
        }
        // bt-2-4: Theme.json change detection
        if (this.isThemeJsonUri(uri)) {
          this.debouncedThemeChangeNotify();
        }
      });

      watcher.onDidDelete((uri) => {
        this.outputChannel.appendLine(`FileWatcherService: Deleted ${uri.fsPath}`);
        this.debouncedNotify();
        // Task 6: Also invoke file change callbacks (story-viewer-save-2)
        this.debouncedFileChangeNotify(uri);
        // cv-4-1: Brand asset change detection
        if (this.isBrandAssetUri(uri)) {
          this.debouncedBrandAssetsNotify();
        }
        // v3-6-1: Plan.yaml change detection (deletion)
        if (this.isPlanYamlUri(uri)) {
          this.debouncedPlanChangeNotify(uri);
        }
        // tm-3-2: Deck template file change detection (deletion)
        if (this.isDeckTemplateUri(uri)) {
          this.debouncedDeckTemplateNotify(uri);
        }
        // bt-2-4: Theme.json change detection (deletion)
        if (this.isThemeJsonUri(uri)) {
          this.debouncedThemeChangeNotify();
        }
      });
    }
  }

  /**
   * Register a callback to be called when deck-related files change.
   * Callback fires after 200ms debounce to coalesce rapid changes.
   * Returns a Disposable to unregister.
   */
  onDecksChanged(callback: () => void): vscode.Disposable {
    this.callbacks.add(callback);
    return {
      dispose: () => {
        this.callbacks.delete(callback);
      },
    };
  }

  /**
   * Register a callback for brand asset directory changes.
   * Fires after 200ms debounce. Only triggers for .slide-builder/config/catalog/brand-assets/ changes.
   *
   * Story Reference: cv-4-1 AC-9, Task 3
   */
  onBrandAssetsChanged(callback: () => void): vscode.Disposable {
    this.brandAssetsCallbacks.add(callback);
    return {
      dispose: () => {
        this.brandAssetsCallbacks.delete(callback);
      },
    };
  }

  private debouncedBrandAssetsNotify(): void {
    if (this.brandAssetsDebounceTimer !== undefined) {
      clearTimeout(this.brandAssetsDebounceTimer);
    }
    this.brandAssetsDebounceTimer = setTimeout(() => {
      this.brandAssetsDebounceTimer = undefined;
      this.brandAssetsCallbacks.forEach((cb) => cb());
    }, FileWatcherService.DEBOUNCE_MS);
  }

  /**
   * Check if a URI is within the brand assets directory.
   */
  private isBrandAssetUri(uri: vscode.Uri): boolean {
    return uri.fsPath.includes('.slide-builder/config/catalog/brand-assets/') ||
           uri.fsPath.includes('.slide-builder\\config\\catalog\\brand-assets\\');
  }

  /**
   * Register a callback for plan.yaml file changes (create/change).
   * Only fires for plan.yaml files within output/ directories.
   * Debounced at 300ms to handle rapid writes during Claude planning.
   *
   * Story Reference: v3-6-1 AC-1, AC-2, AC-3
   */
  onPlanChanged(callback: (uri: vscode.Uri) => void): vscode.Disposable {
    this.planChangeCallbacks.add(callback);
    return {
      dispose: () => {
        this.planChangeCallbacks.delete(callback);
      },
    };
  }

  /**
   * Check if a URI is a plan.yaml file within the output directory.
   * Filters to only output/ paths to avoid false positives.
   *
   * Story Reference: v3-6-1 AC-7
   */
  private isPlanYamlUri(uri: vscode.Uri): boolean {
    const fsPath = uri.fsPath;
    const isPlanFile = fsPath.endsWith('plan.yaml') || fsPath.endsWith('plan.yml');
    const isInOutput = fsPath.includes('/output/') || fsPath.includes('\\output\\');
    return isPlanFile && isInOutput;
  }

  /**
   * Debounced plan.yaml change notification (300ms).
   * Coalesces rapid writes during Claude planning.
   *
   * Story Reference: v3-6-1 AC-1, AC-2
   */
  private debouncedPlanChangeNotify(uri: vscode.Uri): void {
    if (this.planDebounceTimer !== undefined) {
      clearTimeout(this.planDebounceTimer);
    }
    this.planDebounceTimer = setTimeout(() => {
      this.planDebounceTimer = undefined;
      this.outputChannel.appendLine(`FileWatcherService: Plan changed: ${uri.fsPath}`);
      this.planChangeCallbacks.forEach((cb) => cb(uri));
    }, FileWatcherService.PLAN_DEBOUNCE_MS);
  }

  /**
   * Register a callback for deck template directory changes.
   * Fires after 300ms debounce. Only triggers for .slide-builder/config/catalog/deck-templates/ changes.
   *
   * Story Reference: tm-3-2 AC-1, AC-2, AC-3
   */
  onTemplateFilesChanged(callback: () => void): vscode.Disposable {
    this.deckTemplateCallbacks.add(callback);
    return {
      dispose: () => {
        this.deckTemplateCallbacks.delete(callback);
      },
    };
  }

  /**
   * Suppress the next deck template watcher-triggered refresh.
   * Used to prevent redundant refreshes when the extension itself modifies template files
   * (e.g., delete from TM-2 UI).
   *
   * Story Reference: tm-3-2 AC-4
   */
  suppressNextDeckTemplateRefresh(): void {
    this.suppressNextDeckTemplateRefreshFlag = true;
    this.outputChannel.appendLine('[FileWatcherService] Deck template refresh suppression armed');
  }

  /**
   * Check if a URI is within the deck templates directory.
   *
   * Story Reference: tm-3-2 AC-1
   */
  private isDeckTemplateUri(uri: vscode.Uri): boolean {
    return uri.fsPath.includes('.slide-builder/config/catalog/deck-templates/') ||
           uri.fsPath.includes('.slide-builder\\config\\catalog\\deck-templates\\');
  }

  /**
   * Debounced deck template change notification (300ms).
   * Coalesces rapid file writes during Claude Code template generation.
   * Checks suppressNextDeckTemplateRefreshFlag before invoking callbacks.
   *
   * Story Reference: tm-3-2 AC-2, AC-3, AC-4
   */
  private debouncedDeckTemplateNotify(uri: vscode.Uri): void {
    this.outputChannel.appendLine(`[FileWatcherService] Template files changed: ${uri.fsPath}`);
    if (this.deckTemplateDebounceTimer !== undefined) {
      clearTimeout(this.deckTemplateDebounceTimer);
    }
    this.deckTemplateDebounceTimer = setTimeout(() => {
      this.deckTemplateDebounceTimer = undefined;
      this.outputChannel.appendLine('[FileWatcherService] Deck templates watcher debounce fired');

      // AC-4: Check suppress guard before invoking callbacks
      if (this.suppressNextDeckTemplateRefreshFlag) {
        this.suppressNextDeckTemplateRefreshFlag = false;
        this.outputChannel.appendLine('[FileWatcherService] Deck template refresh suppressed (self-triggered)');
        return;
      }

      this.deckTemplateCallbacks.forEach((cb) => cb());
    }, FileWatcherService.FILE_CHANGE_DEBOUNCE_MS);
  }

  /**
   * bt-2-4 Task 1.1: Register a callback for theme.json file changes.
   * Fires after 300ms debounce. Only triggers for .slide-builder/config/theme.json changes.
   * Respects suppression via suppressNextRefresh('theme-editor') key.
   * Returns a Disposable so the panel can deregister on dispose.
   *
   * Story Reference: bt-2-4 AC-7, AC-1, AC-3
   */
  onThemeChanged(callback: () => void): vscode.Disposable {
    this.themeChangeCallbacks.add(callback);
    return {
      dispose: () => {
        this.themeChangeCallbacks.delete(callback);
      },
    };
  }

  /**
   * bt-2-4 Task 1.3: Check if a URI is the theme.json file.
   */
  private isThemeJsonUri(uri: vscode.Uri): boolean {
    return uri.fsPath.includes('.slide-builder/config/theme.json') ||
           uri.fsPath.includes('.slide-builder\\config\\theme.json');
  }

  /**
   * bt-2-4 Task 1.1/1.3: Debounced theme.json change notification (300ms).
   * Checks suppression key 'theme-editor' before invoking callbacks.
   *
   * Story Reference: bt-2-4 AC-1, AC-3
   */
  private debouncedThemeChangeNotify(): void {
    if (this.themeDebounceTimer !== undefined) {
      clearTimeout(this.themeDebounceTimer);
    }
    this.themeDebounceTimer = setTimeout(() => {
      this.themeDebounceTimer = undefined;

      // bt-2-4 Task 1.3: Respect suppression for 'theme-editor' key
      if (this.suppressedDecks.has('theme-editor')) {
        this.suppressedDecks.delete('theme-editor');
        const expiryTimer = this.suppressTimers.get('theme-editor');
        if (expiryTimer !== undefined) {
          clearTimeout(expiryTimer);
          this.suppressTimers.delete('theme-editor');
        }
        this.outputChannel.appendLine('[FileWatcherService] Theme change suppressed (self-triggered save)');
        return;
      }

      this.outputChannel.appendLine('[FileWatcherService] Theme.json changed, notifying callbacks');
      this.themeChangeCallbacks.forEach((cb) => cb());
    }, FileWatcherService.THEME_DEBOUNCE_MS);
  }

  private debouncedNotify(): void {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this.callbacks.forEach((cb) => cb());
    }, FileWatcherService.DEBOUNCE_MS);
  }

  /**
   * Task 2: Register a URI-aware callback for file changes.
   * Per-deck debounce at 300ms — only fires for slide HTML files and manifest.json
   * in output/{deckId}/slides/ directories.
   *
   * Story Reference: story-viewer-save-2 AC-1, AC-2, AC-3
   */
  onFileChanged(callback: (uri: vscode.Uri) => void): vscode.Disposable {
    this.fileChangeCallbacks.add(callback);
    return {
      dispose: () => {
        this.fileChangeCallbacks.delete(callback);
      },
    };
  }

  /**
   * Task 4: Suppress the next file change callback for a specific deck.
   * Used to prevent self-triggered refreshes after save operations.
   * Auto-expires after 1000ms as a safety net.
   *
   * Story Reference: story-viewer-save-2 AC-4, AC-5
   */
  suppressNextRefresh(deckId: string): void {
    // Clear any existing expiry timer for this deck
    const existingTimer = this.suppressTimers.get(deckId);
    if (existingTimer !== undefined) {
      clearTimeout(existingTimer);
    }

    // Add to suppressed set
    this.suppressedDecks.add(deckId);
    this.outputChannel.appendLine(`FileWatcherService: Suppressing next refresh for deck '${deckId}'`);

    // Set auto-expiry timer (AC-5: safety net after 1000ms)
    const expiryTimer = setTimeout(() => {
      this.suppressedDecks.delete(deckId);
      this.suppressTimers.delete(deckId);
      this.outputChannel.appendLine(`FileWatcherService: Suppress guard expired for deck '${deckId}'`);
    }, FileWatcherService.SUPPRESS_EXPIRY_MS);

    this.suppressTimers.set(deckId, expiryTimer);
  }

  /**
   * Task 2 & 5: Per-deck debounced file change notification.
   * Extracts deckId from URI, filters for slide/manifest files only,
   * applies per-deck debounce, and checks save guard before invoking callbacks.
   *
   * Story Reference: story-viewer-save-2 AC-1, AC-2, AC-3, AC-4
   */
  private debouncedFileChangeNotify(uri: vscode.Uri): void {
    // Extract deckId from URI path: output/{deckId}/slides/...
    // Support nested folders: output/folder/subfolder/slides/
    const match = uri.fsPath.match(/output[/\\](.+?)[/\\]slides[/\\]/);
    if (!match) {
      return; // Not a slide file — ignore
    }

    const fullRelativePath = match[1];

    // Extract final folder name from path (handles both / and \)
    // CatalogDataService stores deckId as just the final folder name
    const pathSegments = fullRelativePath.split(/[/\\]/);
    const deckId = pathSegments[pathSegments.length - 1];

    // Filter: only fire for slide HTML files (slide-N.html) and manifest.json
    const filename = uri.fsPath.split(/[/\\]/).pop() ?? '';
    const isSlideFile = /^slide-\d+\.html$/i.test(filename);
    const isManifest = filename.toLowerCase() === 'manifest.json';
    if (!isSlideFile && !isManifest) {
      return; // Not a slide file or manifest — ignore
    }

    // Clear any existing debounce timer for this deck (AC-2: per-deck debouncing)
    const existingTimer = this.deckDebounceTimers.get(deckId);
    if (existingTimer !== undefined) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer (AC-2: 300ms debounce)
    const timer = setTimeout(() => {
      this.deckDebounceTimers.delete(deckId);

      // Task 5: Check save guard before invoking callbacks (AC-4)
      if (this.suppressedDecks.has(deckId)) {
        // Suppressed — remove from set, clear expiry timer, skip callbacks
        this.suppressedDecks.delete(deckId);
        const expiryTimer = this.suppressTimers.get(deckId);
        if (expiryTimer !== undefined) {
          clearTimeout(expiryTimer);
          this.suppressTimers.delete(deckId);
        }
        this.outputChannel.appendLine(`FileWatcherService: Refresh suppressed for deck '${deckId}'`);
        return;
      }

      // Not suppressed — invoke all file change callbacks (AC-1, AC-3)
      this.outputChannel.appendLine(`FileWatcherService: Notifying file change for deck '${deckId}': ${filename}`);
      this.fileChangeCallbacks.forEach((cb) => cb(uri));
    }, FileWatcherService.FILE_CHANGE_DEBOUNCE_MS);

    this.deckDebounceTimers.set(deckId, timer);
  }

  /**
   * Task 7: Dispose all resources including new timers and sets.
   * Story Reference: story-viewer-save-2 (cleanup)
   */
  dispose(): void {
    // Clear catalog debounce timer
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
    }

    // Task 7: Clear per-deck debounce timers
    this.deckDebounceTimers.forEach((timer) => clearTimeout(timer));
    this.deckDebounceTimers.clear();

    // Task 7: Clear suppress timers
    this.suppressTimers.forEach((timer) => clearTimeout(timer));
    this.suppressTimers.clear();

    // Task 7: Clear sets
    this.fileChangeCallbacks.clear();
    this.suppressedDecks.clear();

    // cv-4-1: Clear brand assets timer and callbacks
    if (this.brandAssetsDebounceTimer !== undefined) {
      clearTimeout(this.brandAssetsDebounceTimer);
    }
    this.brandAssetsCallbacks.clear();

    // v3-6-1: Clear plan change timer and callbacks
    if (this.planDebounceTimer !== undefined) {
      clearTimeout(this.planDebounceTimer);
    }
    this.planChangeCallbacks.clear();

    // tm-3-2: Clear deck template timer and callbacks
    if (this.deckTemplateDebounceTimer !== undefined) {
      clearTimeout(this.deckTemplateDebounceTimer);
    }
    this.deckTemplateCallbacks.clear();

    // bt-2-4: Clear theme change timer and callbacks
    if (this.themeDebounceTimer !== undefined) {
      clearTimeout(this.themeDebounceTimer);
    }
    this.themeChangeCallbacks.clear();

    // Dispose watchers and callbacks
    this.watchers.forEach((w) => w.dispose());
    this.callbacks.clear();
  }
}
