import * as vscode from 'vscode';
import type { BuildProgress, BuildSlideStatus, DeckDetail } from '../shared/types';
import type { FileWatcherService } from './FileWatcherService';
import type { CatalogDataService } from './CatalogDataService';

/**
 * Service for tracking build progress by watching the file system for new slide HTML files.
 * Follows ADR-005: File-system-driven build progress (NOT terminal parsing).
 *
 * Story Reference: cv-3-5 AC29-AC40
 * Architecture Reference: notes/architecture/architecture-catalog-viewer.md#ADR-005
 */
export class BuildProgressService implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private activeBuild: BuildProgress | null = null;
  private onProgressCallback: ((progress: BuildProgress) => void) | null = null;
  private readonly builtSlideNumbers = new Set<number>();
  /** lv-1-1 AC-12: Unique build session ID for dismissed tracking */
  private buildId: string | null = null;

  constructor(
    private readonly fileWatcher: FileWatcherService,
    private readonly dataService: CatalogDataService,
    private readonly outputChannel: vscode.OutputChannel
  ) {
    // Subscribe to file changes to detect completed slides
    const watcherDisposable = this.fileWatcher.onFileChanged((uri) => {
      this.handleFileChange(uri);
    });
    this.disposables.push(watcherDisposable);
  }

  /**
   * Start tracking a build operation for a deck.
   * Initializes all slides as 'pending' and sets first slide to 'building'.
   *
   * @param deckId - The deck ID being built
   * @param mode - 'all' for full deck, 'one' for single slide
   * @param slideNumber - If mode is 'one', the specific slide being built
   */
  async startBuild(
    deckId: string,
    mode: 'all' | 'one',
    slideNumber?: number,
    buildId?: string
  ): Promise<BuildProgress> {
    // lv-1-1 AC-12: Store build ID (generate if not provided)
    this.buildId = buildId || `${deckId}-${Date.now()}`;
    this.outputChannel.appendLine(
      `BuildProgressService: Starting build for deck '${deckId}' mode='${mode}' buildId='${this.buildId}'`
    );

    // Get deck detail to know all slides
    const deckDetail = await this.dataService.getDeckDetail(deckId);
    if (!deckDetail) {
      throw new Error(`Deck not found: ${deckId}`);
    }

    // Clear previous state
    this.builtSlideNumbers.clear();

    // Track already-built slides
    for (const slide of deckDetail.slides) {
      if (slide.status === 'built') {
        this.builtSlideNumbers.add(slide.number);
      }
    }

    // Initialize build progress
    const slides: BuildSlideStatus[] = this.initializeSlideStatuses(
      deckDetail,
      mode,
      slideNumber
    );

    this.activeBuild = {
      deckId,
      deckName: deckDetail.name,
      status: 'building',
      slides,
      startedAt: Date.now(),
    };

    this.notifyProgress();
    return this.activeBuild;
  }

  /**
   * Initialize slide statuses based on build mode.
   */
  private initializeSlideStatuses(
    deckDetail: DeckDetail,
    mode: 'all' | 'one',
    slideNumber?: number
  ): BuildSlideStatus[] {
    return deckDetail.slides.map((slide, index) => {
      const isTargetSlide =
        mode === 'one' ? slide.number === slideNumber : index === 0;
      const isInScope = mode === 'all' || slide.number === slideNumber;

      let status: BuildSlideStatus['status'];
      if (slide.status === 'built' && mode === 'all') {
        // Already built slides in build-all mode start as built
        status = 'built';
      } else if (isTargetSlide && isInScope) {
        status = 'building';
      } else if (isInScope) {
        status = 'pending';
      } else {
        // Not in scope (build-one for different slide)
        status = slide.status === 'built' ? 'built' : 'pending';
      }

      return {
        number: slide.number,
        name: slide.intent ?? `Slide ${slide.number}`,
        status,
        htmlPath: slide.htmlPath,
        thumbnailUri: slide.thumbnailUri,
      };
    });
  }

  /**
   * Handle file system changes to detect completed slides.
   * Called by FileWatcherService when slide HTML files are created/modified.
   */
  private handleFileChange(uri: vscode.Uri): void {
    if (!this.activeBuild) return;

    // Extract slide number from filename: slide-N.html
    const match = uri.fsPath.match(/slide-(\d+)\.html$/i);
    if (!match) return;

    const slideNumber = parseInt(match[1], 10);

    // Check if this is for our active deck
    if (!uri.fsPath.includes(this.activeBuild.deckId)) return;

    // Skip if we already tracked this slide as built
    if (this.builtSlideNumbers.has(slideNumber)) return;

    this.outputChannel.appendLine(
      `BuildProgressService: Detected built slide ${slideNumber} for deck '${this.activeBuild.deckId}'`
    );

    // Mark this slide as built
    this.builtSlideNumbers.add(slideNumber);
    this.markSlideBuilt(slideNumber, uri.fsPath);
  }

  /**
   * Mark a slide as built and advance to next pending slide.
   */
  private markSlideBuilt(slideNumber: number, htmlPath: string): void {
    if (!this.activeBuild) return;

    const slideIndex = this.activeBuild.slides.findIndex(
      (s) => s.number === slideNumber
    );
    if (slideIndex === -1) return;

    // Mark as built
    this.activeBuild.slides[slideIndex].status = 'built';
    this.activeBuild.slides[slideIndex].htmlPath = htmlPath;

    // Find and mark next pending slide as building
    const nextPending = this.activeBuild.slides.find(
      (s) => s.status === 'pending'
    );
    if (nextPending) {
      nextPending.status = 'building';
    }

    // Check if all slides are built
    const allBuilt = this.activeBuild.slides.every(
      (s) => s.status === 'built' || s.status === 'error'
    );

    if (allBuilt) {
      this.activeBuild.status = 'complete';
      this.activeBuild.completedAt = Date.now();
      this.outputChannel.appendLine(
        `BuildProgressService: Build complete for deck '${this.activeBuild.deckId}'`
      );
    }

    this.notifyProgress();
  }

  /**
   * Mark a slide as errored.
   */
  markSlideError(slideNumber: number, errorMessage: string): void {
    if (!this.activeBuild) return;

    const slide = this.activeBuild.slides.find((s) => s.number === slideNumber);
    if (slide) {
      slide.status = 'error';
      slide.errorMessage = errorMessage;
      this.notifyProgress();
    }
  }

  /**
   * Cancel the active build operation.
   * Story Reference: cv-3-5 AC33, AC36
   */
  cancelBuild(): BuildProgress | null {
    if (!this.activeBuild) return null;

    this.outputChannel.appendLine(
      `BuildProgressService: Cancelling build for deck '${this.activeBuild.deckId}'`
    );

    this.activeBuild.status = 'cancelled';
    this.activeBuild.completedAt = Date.now();

    // Keep any slides that finished as built, mark building as pending
    for (const slide of this.activeBuild.slides) {
      if (slide.status === 'building') {
        slide.status = 'pending';
      }
    }

    this.notifyProgress();
    return this.activeBuild;
  }

  /**
   * Get the current build progress.
   */
  getProgress(): BuildProgress | null {
    return this.activeBuild;
  }

  /**
   * Check if a build is currently active.
   * lv-1-1 AC-12: Optionally filter by deck ID.
   */
  isBuilding(deckId?: string): boolean {
    if (!this.activeBuild) return false;
    if (deckId) return this.activeBuild.deckId === deckId && this.activeBuild.status === 'building';
    return this.activeBuild.status === 'building';
  }

  /**
   * Get the current build's unique ID.
   * lv-1-1 AC-12: Returns build ID for dismissed tracking.
   */
  getBuildId(): string | null {
    return this.buildId;
  }

  /**
   * Register a callback to receive progress updates.
   */
  onProgress(callback: (progress: BuildProgress) => void): vscode.Disposable {
    this.onProgressCallback = callback;

    // If there's an active build, immediately notify
    if (this.activeBuild) {
      callback(this.activeBuild);
    }

    return {
      dispose: () => {
        this.onProgressCallback = null;
      },
    };
  }

  /**
   * Notify registered callback of progress update.
   */
  private notifyProgress(): void {
    if (this.activeBuild && this.onProgressCallback) {
      this.onProgressCallback(this.activeBuild);
    }
  }

  /**
   * Clear the active build state.
   * Called when returning to deck list or starting a new build.
   */
  clearBuild(): void {
    this.activeBuild = null;
    this.builtSlideNumbers.clear();
    this.buildId = null;
  }

  /**
   * Get build summary for display.
   */
  getSummary(): { builtCount: number; totalCount: number; status: string } | null {
    if (!this.activeBuild) return null;

    const builtCount = this.activeBuild.slides.filter(
      (s) => s.status === 'built'
    ).length;

    return {
      builtCount,
      totalCount: this.activeBuild.slides.length,
      status: this.activeBuild.status,
    };
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.activeBuild = null;
    this.onProgressCallback = null;
    this.builtSlideNumbers.clear();
    this.buildId = null;
  }
}
