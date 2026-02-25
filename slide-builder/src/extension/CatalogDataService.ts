import * as vscode from 'vscode';
import { parse } from 'yaml';
import type {
  DeckInfo, DeckDetail, DeckStatus, SlideInfo, DeckTemplateInfo, DeckTemplateDisplay, FolderInfo,
  BrandAsset, BrandAssetType, BrandAssetCatalog, BrandAssetMetadata, ColorMetadata,
  IconCatalog, IconCatalogEntry, LogoCatalog, LogoCatalogEntry,
  ImagesCatalog, ImagesCatalogEntry, SlideTemplateDisplay,
} from '../shared/types';
import { SUPPORTED_IMAGE_FORMATS } from '../shared/types';
import { ColorAnalysisService } from './ColorAnalysisService';

/**
 * Service for discovering and reading deck data from the file system.
 * Scans output/ for deck directories containing plan.yaml, and supplements
 * with status.yaml deck registry when available.
 *
 * Architecture Reference: ADR-004 - Extension host as source of truth
 * Story Reference: cv-1-3 AC-1, AC-2, AC-3, AC-6, AC-7
 */
export class CatalogDataService implements vscode.Disposable {
  private readonly outputUri: vscode.Uri;
  /** v3-4-1: Color analysis service for brand asset intelligence */
  private readonly colorAnalysisService: ColorAnalysisService;

  constructor(
    private readonly workspaceRoot: vscode.Uri,
    private readonly outputChannel: vscode.OutputChannel
  ) {
    this.outputUri = vscode.Uri.joinPath(workspaceRoot, 'output');
    this.colorAnalysisService = new ColorAnalysisService(outputChannel);
  }

  /**
   * Get the workspace root URI.
   * v2-1-2: Used by viewer-v2-message-handler for constructing file paths.
   */
  getWorkspaceRoot(): vscode.Uri {
    return this.workspaceRoot;
  }

  /**
   * Scan output/ for deck directories containing plan.yaml (AC-1, AC-2, AC-3).
   * Returns empty array if output/ doesn't exist (AC-6).
   * Malformed YAML results in error status with folder name fallback (AC-7).
   */
  async scanDecks(): Promise<DeckInfo[]> {
    const startTime = Date.now();
    const decks: DeckInfo[] = [];

    // Read output/ directory
    let entries: [string, vscode.FileType][];
    try {
      entries = await vscode.workspace.fs.readDirectory(this.outputUri);
    } catch {
      this.outputChannel.appendLine(
        'CatalogDataService: output/ not found, returning empty'
      );
      return [];
    }

    const directories = entries.filter(
      ([name, type]) => type === vscode.FileType.Directory && name !== 'singles'
    );

    for (const [dirName] of directories) {
      const deckUri = vscode.Uri.joinPath(this.outputUri, dirName);
      const planUri = vscode.Uri.joinPath(deckUri, 'plan.yaml');

      // Step 1: Try to read plan.yaml
      let planBytes: Uint8Array;
      try {
        planBytes = await vscode.workspace.fs.readFile(planUri);
      } catch {
        this.outputChannel.appendLine(
          `CatalogDataService: Skipping ${dirName} — no plan.yaml`
        );
        continue;
      }

      // Step 2: Parse YAML and extract metadata
      try {
        const planContent = new TextDecoder().decode(planBytes);
        const planData = parse(planContent);

        if (!planData || typeof planData !== 'object') {
          throw new Error('Invalid YAML: not an object');
        }

        const slides = Array.isArray(planData.slides) ? planData.slides : [];
        const slideCount = slides.length;
        // cv-5-3: Get built slide count and first slide path for thumbnail generation
        const builtInfo = await this.getBuiltSlidesInfo(deckUri);
        const builtSlideCount = builtInfo.count;
        const status = this.computeStatus(slideCount, builtSlideCount);

        let lastModified = Date.now();
        try {
          const stat = await vscode.workspace.fs.stat(planUri);
          lastModified = stat.mtime;
        } catch {
          // Use current time as fallback
        }

        // audience can be a string or nested object with .description
        const audienceRaw = planData.audience;
        const audience =
          typeof audienceRaw === 'string'
            ? audienceRaw
            : typeof audienceRaw?.description === 'string'
              ? audienceRaw.description
              : undefined;

        decks.push({
          id: dirName,
          name: planData.deck_name || dirName,
          path: `output/${dirName}`,
          slideCount,
          builtSlideCount,
          status,
          lastModified,
          audience,
          firstSlidePath: builtInfo.firstSlidePath,
        });
      } catch (error) {
        // YAML parse error (AC-7)
        this.outputChannel.appendLine(
          `CatalogDataService: Error parsing ${dirName}/plan.yaml: ${error}`
        );
        decks.push({
          id: dirName,
          name: dirName,
          path: `output/${dirName}`,
          slideCount: 0,
          builtSlideCount: 0,
          status: 'error',
          lastModified: Date.now(),
        });
      }
    }

    const duration = Date.now() - startTime;
    this.outputChannel.appendLine(
      `CatalogDataService: Scanned ${decks.length} decks in ${duration}ms`
    );
    return decks;
  }

  /**
   * Scan output/ for folder directories (directories that contain deck subdirectories).
   * A folder is detected if it's a directory that does NOT contain plan.yaml directly,
   * but contains subdirectories that DO contain plan.yaml.
   *
   * Story Reference: cv-3-3 AC-17, AC-23
   */
  async scanFolders(): Promise<FolderInfo[]> {
    const startTime = Date.now();
    const folders: FolderInfo[] = [];

    // Read output/ directory
    let entries: [string, vscode.FileType][];
    try {
      entries = await vscode.workspace.fs.readDirectory(this.outputUri);
    } catch {
      this.outputChannel.appendLine(
        'CatalogDataService: output/ not found, returning empty folders'
      );
      return [];
    }

    const directories = entries.filter(
      ([name, type]) => type === vscode.FileType.Directory && name !== 'singles'
    );

    for (const [dirName] of directories) {
      const dirUri = vscode.Uri.joinPath(this.outputUri, dirName);
      const planUri = vscode.Uri.joinPath(dirUri, 'plan.yaml');

      // If this directory has plan.yaml, it's a deck, not a folder
      try {
        await vscode.workspace.fs.stat(planUri);
        // plan.yaml exists — this is a deck, skip
        continue;
      } catch {
        // No plan.yaml — could be a folder, check for deck subdirectories
      }

      // Count deck subdirectories (directories containing plan.yaml)
      let deckCount = 0;
      let maxMtime = 0;
      let subEntriesCount = 0;
      try {
        const subEntries = await vscode.workspace.fs.readDirectory(dirUri);
        subEntriesCount = subEntries.length;
        for (const [subName, subType] of subEntries) {
          if (subType === vscode.FileType.Directory) {
            const subPlanUri = vscode.Uri.joinPath(dirUri, subName, 'plan.yaml');
            try {
              const stat = await vscode.workspace.fs.stat(subPlanUri);
              deckCount++;
              if (stat.mtime > maxMtime) {
                maxMtime = stat.mtime;
              }
            } catch {
              // No plan.yaml in subdirectory — not a deck
            }
          }
        }
      } catch {
        // Can't read subdirectories
        continue;
      }

      // Only consider this a folder if it contains at least one deck (or is empty but could hold decks)
      // For UX purposes, we'll show folders even if empty
      if (deckCount > 0 || subEntriesCount === 0) {
        folders.push({
          id: dirName,
          name: dirName,
          path: `output/${dirName}`,
          deckCount,
          lastModified: maxMtime || Date.now(),
        });
      }
    }

    const duration = Date.now() - startTime;
    this.outputChannel.appendLine(
      `CatalogDataService: Scanned ${folders.length} folders in ${duration}ms`
    );
    return folders;
  }

  /**
   * Scan all decks including those inside folders.
   * Returns decks with folderId set for decks inside folders.
   *
   * Story Reference: cv-3-3 AC-17
   */
  async scanDecksWithFolders(): Promise<{ decks: DeckInfo[]; folders: FolderInfo[] }> {
    const startTime = Date.now();
    const decks: DeckInfo[] = [];
    const folders: FolderInfo[] = [];

    // Read output/ directory
    let entries: [string, vscode.FileType][];
    try {
      entries = await vscode.workspace.fs.readDirectory(this.outputUri);
    } catch {
      this.outputChannel.appendLine(
        'CatalogDataService: output/ not found, returning empty'
      );
      return { decks: [], folders: [] };
    }

    const directories = entries.filter(
      ([name, type]) => type === vscode.FileType.Directory && name !== 'singles'
    );

    for (const [dirName] of directories) {
      const dirUri = vscode.Uri.joinPath(this.outputUri, dirName);
      const planUri = vscode.Uri.joinPath(dirUri, 'plan.yaml');

      // Check if this is a deck (has plan.yaml) or a folder
      let isDeck = false;
      try {
        await vscode.workspace.fs.stat(planUri);
        isDeck = true;
      } catch {
        // No plan.yaml — this is a folder
      }

      if (isDeck) {
        // Process as a root-level deck
        const deck = await this.parseDeckFromPath(dirUri, dirName);
        if (deck) {
          decks.push(deck);
        }
      } else {
        // Process as a folder — scan for deck subdirectories
        let deckCount = 0;
        let maxMtime = 0;

        try {
          const subEntries = await vscode.workspace.fs.readDirectory(dirUri);
          for (const [subName, subType] of subEntries) {
            if (subType === vscode.FileType.Directory) {
              const subDeckUri = vscode.Uri.joinPath(dirUri, subName);
              const subPlanUri = vscode.Uri.joinPath(subDeckUri, 'plan.yaml');

              try {
                const stat = await vscode.workspace.fs.stat(subPlanUri);
                // This subdirectory is a deck inside the folder
                const deck = await this.parseDeckFromPath(subDeckUri, subName, dirName);
                if (deck) {
                  deck.folderId = dirName;
                  deck.path = `output/${dirName}/${subName}`;
                  decks.push(deck);
                  deckCount++;
                  if (stat.mtime > maxMtime) {
                    maxMtime = stat.mtime;
                  }
                }
              } catch {
                // No plan.yaml in subdirectory
              }
            }
          }
        } catch {
          // Can't read folder contents
        }

        // Add folder to list (even if empty for future deck organization)
        folders.push({
          id: dirName,
          name: dirName,
          path: `output/${dirName}`,
          deckCount,
          lastModified: maxMtime || Date.now(),
        });
      }
    }

    const duration = Date.now() - startTime;
    this.outputChannel.appendLine(
      `CatalogDataService: Scanned ${decks.length} decks and ${folders.length} folders in ${duration}ms`
    );
    return { decks, folders };
  }

  /**
   * Parse a single deck from its directory path.
   * Helper for scanDecksWithFolders.
   */
  private async parseDeckFromPath(
    deckUri: vscode.Uri,
    dirName: string,
    folderId?: string
  ): Promise<DeckInfo | null> {
    const planUri = vscode.Uri.joinPath(deckUri, 'plan.yaml');

    let planBytes: Uint8Array;
    try {
      planBytes = await vscode.workspace.fs.readFile(planUri);
    } catch {
      return null;
    }

    try {
      const planContent = new TextDecoder().decode(planBytes);
      const planData = parse(planContent);

      if (!planData || typeof planData !== 'object') {
        throw new Error('Invalid YAML: not an object');
      }

      const slides = Array.isArray(planData.slides) ? planData.slides : [];
      const slideCount = slides.length;
      // cv-5-3: Get built slide count and first slide path for thumbnail generation
      const builtInfo = await this.getBuiltSlidesInfo(deckUri);
      const builtSlideCount = builtInfo.count;
      const status = this.computeStatus(slideCount, builtSlideCount);

      let lastModified = Date.now();
      try {
        const stat = await vscode.workspace.fs.stat(planUri);
        lastModified = stat.mtime;
      } catch {
        // Use current time as fallback
      }

      const audienceRaw = planData.audience;
      const audience =
        typeof audienceRaw === 'string'
          ? audienceRaw
          : typeof audienceRaw?.description === 'string'
            ? audienceRaw.description
            : undefined;

      return {
        id: dirName,
        name: planData.deck_name || dirName,
        path: folderId ? `output/${folderId}/${dirName}` : `output/${dirName}`,
        slideCount,
        builtSlideCount,
        status,
        lastModified,
        audience,
        folderId,
        firstSlidePath: builtInfo.firstSlidePath,
      };
    } catch (error) {
      this.outputChannel.appendLine(
        `CatalogDataService: Error parsing ${dirName}/plan.yaml: ${error}`
      );
      return {
        id: dirName,
        name: dirName,
        path: folderId ? `output/${folderId}/${dirName}` : `output/${dirName}`,
        slideCount: 0,
        builtSlideCount: 0,
        status: 'error',
        lastModified: Date.now(),
        folderId,
      };
    }
  }

  /**
   * Create a new folder in output/ directory.
   * Story Reference: cv-3-3 AC-16
   */
  async createFolder(folderName: string): Promise<string> {
    const folderUri = vscode.Uri.joinPath(this.outputUri, folderName);
    await vscode.workspace.fs.createDirectory(folderUri);
    this.outputChannel.appendLine(
      `CatalogDataService: Created folder '${folderName}'`
    );
    return folderName;
  }

  /**
   * Rename a folder.
   * Story Reference: cv-3-3 AC-21, cv-3-6 AC-6
   */
  async renameFolder(folderId: string, newName: string): Promise<void> {
    const sourceUri = vscode.Uri.joinPath(this.outputUri, folderId);
    const targetUri = vscode.Uri.joinPath(this.outputUri, newName);

    // cv-3-6 AC-6: Pre-rename validation — check target doesn't already exist
    try {
      await vscode.workspace.fs.stat(targetUri);
      // If stat succeeds, the target already exists
      throw new Error(`A folder named '${newName}' already exists`);
    } catch (error) {
      // FileNotFound is expected — means the target name is available
      if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
        // Good — target doesn't exist, proceed with rename
      } else if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      } else {
        // Unexpected error checking target — proceed anyway (rename will fail if conflict)
      }
    }

    await vscode.workspace.fs.rename(sourceUri, targetUri);
    this.outputChannel.appendLine(
      `CatalogDataService: Renamed folder '${folderId}' to '${newName}'`
    );
  }

  /**
   * Rename a deck directory (copy + delete pattern).
   * Resolves source via findDeckUri to support decks in folders.
   * Computes target by replacing the last path segment with newSlug.
   * Story Reference: rename-deck-1 AC-2, AC-4, AC-5
   */
  async renameDeck(deckId: string, newSlug: string): Promise<void> {
    const sourceUri = await this.findDeckUri(deckId);
    const targetUri = vscode.Uri.joinPath(sourceUri, '..', newSlug);

    // Pre-rename validation: ensure target doesn't already exist
    try {
      await vscode.workspace.fs.stat(targetUri);
      throw new Error(`A deck named '${newSlug}' already exists`);
    } catch (error) {
      if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
        // Good — target doesn't exist, proceed
      } else if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      } else {
        // Unexpected error checking target — proceed anyway
      }
    }

    // Copy source to target
    await vscode.workspace.fs.copy(sourceUri, targetUri);

    // Delete source
    await vscode.workspace.fs.delete(sourceUri, { recursive: true });

    this.outputChannel.appendLine(
      `CatalogDataService: Renamed deck '${deckId}' to '${newSlug}'`
    );
  }

  /**
   * Delete a folder and its contents.
   * Story Reference: cv-3-6
   */
  async deleteFolder(folderId: string): Promise<void> {
    const folderUri = vscode.Uri.joinPath(this.outputUri, folderId);
    await vscode.workspace.fs.delete(folderUri, { recursive: true });
    this.outputChannel.appendLine(
      `CatalogDataService: Deleted folder '${folderId}'`
    );
  }

  /**
   * Move a deck to a folder (or to root if targetFolderId is undefined).
   * Story Reference: cv-3-3 AC-18
   */
  async moveDeck(deckId: string, sourceFolderId: string | undefined, targetFolderId: string | undefined): Promise<void> {
    const sourcePath = sourceFolderId
      ? vscode.Uri.joinPath(this.outputUri, sourceFolderId, deckId)
      : vscode.Uri.joinPath(this.outputUri, deckId);
    const targetPath = targetFolderId
      ? vscode.Uri.joinPath(this.outputUri, targetFolderId, deckId)
      : vscode.Uri.joinPath(this.outputUri, deckId);

    // cv-3-7 AC-6: Collision check — fail if a deck with same ID already exists at target
    try {
      await vscode.workspace.fs.stat(targetPath);
      // If stat succeeds, a file/folder already exists at the target
      throw new Error(`A deck named '${deckId}' already exists in the destination folder.`);
    } catch (err) {
      // FileNotFound is expected (no collision) — rethrow anything else
      if (err instanceof Error && err.message.includes('already exists')) {
        throw err;
      }
      // FileNotFound — safe to proceed
    }

    await vscode.workspace.fs.rename(sourcePath, targetPath);
    this.outputChannel.appendLine(
      `CatalogDataService: Moved deck '${deckId}' from ${sourceFolderId ?? 'root'} to ${targetFolderId ?? 'root'}`
    );
  }

  /**
   * Get detailed info for a single deck including per-slide status.
   * Searches in folders if deck not found at root level.
   * Story Reference: cv-3-3 - Support decks inside folders
   */
  async getDeckDetail(deckId: string): Promise<DeckDetail | null> {
    // Find actual deck location (may be in a folder)
    const deckUri = await this.findDeckUri(deckId);
    const planUri = vscode.Uri.joinPath(deckUri, 'plan.yaml');

    try {
      const planBytes = await vscode.workspace.fs.readFile(planUri);
      const planContent = new TextDecoder().decode(planBytes);
      const planData = parse(planContent);

      if (!planData || typeof planData !== 'object') {
        return null;
      }

      const rawSlides = Array.isArray(planData.slides) ? planData.slides : [];
      const slideCount = rawSlides.length;

      // Get set of built slide files in one readDirectory call
      const builtFiles = new Set<string>();
      const slidesUri = vscode.Uri.joinPath(deckUri, 'slides');
      try {
        const slideEntries =
          await vscode.workspace.fs.readDirectory(slidesUri);
        for (const [name, type] of slideEntries) {
          if (type === vscode.FileType.File && name.endsWith('.html')) {
            builtFiles.add(name);
          }
        }
      } catch {
        // slides/ directory doesn't exist — all slides are planned
      }

      const builtSlideCount = builtFiles.size;
      const status = this.computeStatus(slideCount, builtSlideCount);

      let lastModified = Date.now();
      try {
        const stat = await vscode.workspace.fs.stat(planUri);
        lastModified = stat.mtime;
      } catch {
        // fallback
      }

      const audienceRaw = planData.audience;
      const audience =
        typeof audienceRaw === 'string'
          ? audienceRaw
          : typeof audienceRaw?.description === 'string'
            ? audienceRaw.description
            : undefined;

      const slides: SlideInfo[] = rawSlides.map(
        (rawSlide: Record<string, unknown>, index: number) => {
          const slideNum =
            typeof rawSlide.number === 'number' ? rawSlide.number : index + 1;
          const htmlFile = `slide-${slideNum}.html`;
          const isBuilt = builtFiles.has(htmlFile);

          return {
            number: slideNum,
            intent:
              (rawSlide.description as string) ||
              (rawSlide.intent as string),
            template:
              (rawSlide.suggested_template as string) ||
              (rawSlide.template as string),
            status: isBuilt ? ('built' as const) : ('planned' as const),
            htmlPath: isBuilt ? `slides/${htmlFile}` : undefined,
          };
        }
      );

      // Compute the relative path from the actual deck location
      const workspaceRoot = this.outputUri.fsPath.replace(/[/\\]output$/, '');
      const relativePath = deckUri.fsPath.replace(workspaceRoot + '/', '').replace(workspaceRoot + '\\', '');

      return {
        id: deckId,
        name: (planData.deck_name as string) || deckId,
        path: relativePath,
        slideCount,
        builtSlideCount,
        status,
        lastModified,
        audience,
        slides,
        planPath: `${relativePath}/plan.yaml`,
      };
    } catch (error) {
      this.outputChannel.appendLine(
        `CatalogDataService: Error loading deck detail for ${deckId}: ${error}`
      );
      return null;
    }
  }

  /**
   * Find the actual URI for a deck, checking both root and folder locations.
   * Returns the deck URI if found, or the default root location if not found.
   * Story Reference: cv-3-3 - Support decks inside folders
   */
  async findDeckUri(deckId: string): Promise<vscode.Uri> {
    // First try root location
    const rootUri = vscode.Uri.joinPath(this.outputUri, deckId);
    const rootPlanUri = vscode.Uri.joinPath(rootUri, 'plan.yaml');

    try {
      await vscode.workspace.fs.stat(rootPlanUri);
      return rootUri; // Found at root
    } catch {
      // Not at root, search in folders
    }

    // Search in all folders
    try {
      const entries = await vscode.workspace.fs.readDirectory(this.outputUri);
      for (const [name, type] of entries) {
        if (type !== vscode.FileType.Directory) continue;

        // Check if this is a folder containing the deck
        const folderDeckUri = vscode.Uri.joinPath(this.outputUri, name, deckId);
        const folderPlanUri = vscode.Uri.joinPath(folderDeckUri, 'plan.yaml');

        try {
          await vscode.workspace.fs.stat(folderPlanUri);
          return folderDeckUri; // Found in folder
        } catch {
          // Not in this folder, continue searching
        }
      }
    } catch {
      // Error reading output directory
    }

    // Default to root location (may not exist)
    return rootUri;
  }

  getDeckPath(deckId: string): vscode.Uri {
    return vscode.Uri.joinPath(this.outputUri, deckId);
  }

  /**
   * Get deck path asynchronously, searching folders if needed.
   * Story Reference: cv-3-3 - Support decks inside folders
   */
  async getDeckPathAsync(deckId: string): Promise<vscode.Uri> {
    return this.findDeckUri(deckId);
  }

  /**
   * Get URI to a deck's index.html viewer file.
   * Story Reference: cv-2-1 Task 2.2
   */
  async getDeckViewerUri(deckId: string): Promise<vscode.Uri> {
    const deckUri = await this.findDeckUri(deckId);
    return vscode.Uri.joinPath(deckUri, 'index.html');
  }

  /**
   * Get URI to a deck's plan.yaml.
   * Story Reference: cv-2-1 Task 2.3
   */
  getPlanUri(deckId: string): vscode.Uri {
    return vscode.Uri.joinPath(this.outputUri, deckId, 'plan.yaml');
  }

  /**
   * Get available deck templates for "Create from Template" feature and catalog browsing.
   * Reads from .slide-builder/config/catalog/deck-templates.json.
   * Returns DeckTemplateDisplay with category and slideCount.
   * Returns empty array with warning if file doesn't exist.
   *
   * Story Reference: cv-3-1 AC-3, Task 3; cv-5-2 AC-12, AC-13
   */
  async getDeckTemplates(): Promise<DeckTemplateDisplay[]> {
    const templatesUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'deck-templates.json'
    );

    try {
      const bytes = await vscode.workspace.fs.readFile(templatesUri);
      const content = new TextDecoder().decode(bytes);
      const data = JSON.parse(content);

      // Support both formats: { templates: [...] } and direct array [...]
      let templatesArray: unknown[];
      if (Array.isArray(data)) {
        templatesArray = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.templates)) {
        templatesArray = data.templates;
      } else {
        this.outputChannel.appendLine(
          'CatalogDataService: deck-templates.json is not an array and has no templates property'
        );
        return [];
      }

      // Validate and map each entry, then enhance with slideCount
      const baseTemplates = templatesArray
        .filter(
          (item: unknown): item is Record<string, unknown> =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as Record<string, unknown>).id === 'string' &&
            typeof (item as Record<string, unknown>).name === 'string'
        )
        .map((item: Record<string, unknown>) => ({
          id: item.id as string,
          name: item.name as string,
          description: (item.description as string) || '',
          // Support both 'path' and 'folder' fields
          path: (item.path as string) || (item.folder as string) || '',
          category: (item.category as string) || 'General',
          // slideCount will be calculated below, default to value from JSON or 0
          // Support both camelCase (slideCount) and snake_case (slide_count)
          slideCount: typeof item.slideCount === 'number' ? item.slideCount
            : typeof item.slide_count === 'number' ? item.slide_count : 0,
          previewUri: item.previewUri as string | undefined,
        }));

      // Calculate slideCount for each template by reading plan.yaml
      const templates: DeckTemplateDisplay[] = await Promise.all(
        baseTemplates.map(async (template) => {
          // Only calculate if slideCount wasn't provided in JSON
          if (template.slideCount === 0 && template.path) {
            try {
              const planUri = vscode.Uri.joinPath(
                this.workspaceRoot,
                template.path,
                'plan.yaml'
              );
              const planBytes = await vscode.workspace.fs.readFile(planUri);
              const planContent = new TextDecoder().decode(planBytes);
              const planData = parse(planContent);
              if (planData && Array.isArray(planData.slides)) {
                return { ...template, slideCount: planData.slides.length };
              }
            } catch {
              // Template plan.yaml not found or unreadable - keep slideCount at 0
            }
          }
          return template;
        })
      );

      this.outputChannel.appendLine(
        `CatalogDataService: Loaded ${templates.length} deck templates`
      );
      return templates;
    } catch (error) {
      this.outputChannel.appendLine(
        `CatalogDataService: No deck-templates.json found or parse error: ${error}`
      );
      return [];
    }
  }

  /**
   * Scan slide templates from .slide-builder/config/catalog/slide-templates.json.
   * Supports both formats: { templates: [...] } and direct array [...].
   * Returns empty array with log warning if file missing or malformed.
   *
   * Story Reference: cv-5-1 AC-3, Task 1
   */
  async scanSlideTemplates(): Promise<SlideTemplateDisplay[]> {
    const templatesUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'slide-templates.json'
    );

    try {
      const bytes = await vscode.workspace.fs.readFile(templatesUri);
      const content = new TextDecoder().decode(bytes);
      const data = JSON.parse(content);

      // Support both formats: { templates: [...] } and direct array [...]
      let templatesArray: unknown[];
      if (Array.isArray(data)) {
        templatesArray = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.templates)) {
        templatesArray = data.templates;
      } else {
        this.outputChannel.appendLine(
          'CatalogDataService: slide-templates.json has unexpected structure (expected array or { templates: [...] })'
        );
        return [];
      }

      // Validate and map each entry to SlideTemplateDisplay
      const templates: SlideTemplateDisplay[] = templatesArray
        .filter(
          (item: unknown): item is Record<string, unknown> =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as Record<string, unknown>).id === 'string' &&
            typeof (item as Record<string, unknown>).name === 'string'
        )
        .map((item: Record<string, unknown>) => ({
          id: item.id as string,
          name: item.name as string,
          description: (item.description as string) || '',
          use_cases: Array.isArray(item.use_cases)
            ? (item.use_cases as string[])
            : [],
          category: (item.category as string) || 'Content', // Default category
          previewUri: item.previewUri as string | undefined,
        }));

      this.outputChannel.appendLine(
        `CatalogDataService: Loaded ${templates.length} slide templates`
      );
      return templates;
    } catch (error) {
      this.outputChannel.appendLine(
        `CatalogDataService: No slide-templates.json found or parse error: ${error}`
      );
      return [];
    }
  }

  /**
   * Load template metadata (AI prompt, placeholder guidance, style rules) for a given template.
   * Reads from slide-templates.json and extracts metadata fields.
   * Returns empty strings for missing fields.
   *
   * Story Reference: v3-2-3 AC-3, AC-4, AC-5, Task 3
   */
  async loadTemplateMetadata(templateId: string): Promise<import('../shared/types').TemplateMetadata> {
    const templatesUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'slide-templates.json'
    );

    try {
      const bytes = await vscode.workspace.fs.readFile(templatesUri);
      const content = new TextDecoder().decode(bytes);
      const data = JSON.parse(content);

      const templatesArray: unknown[] = Array.isArray(data)
        ? data
        : (data?.templates ?? []);

      const entry = templatesArray.find(
        (item: unknown): item is Record<string, unknown> =>
          typeof item === 'object' &&
          item !== null &&
          (item as Record<string, unknown>).id === templateId
      ) as Record<string, unknown> | undefined;

      if (!entry) {
        this.outputChannel.appendLine(
          `[v3:catalog] Template not found for metadata load: ${templateId}`
        );
        return { aiPrompt: '', placeholderGuidance: '', styleRules: '' };
      }

      this.outputChannel.appendLine(
        `[v3:catalog] Template metadata loaded: ${templateId}`
      );

      return {
        aiPrompt: (entry.ai_prompt as string) || '',
        placeholderGuidance: (entry.placeholder_guidance as string) || '',
        styleRules: (entry.style_rules as string) || '',
      };
    } catch (error) {
      this.outputChannel.appendLine(
        `[v3:catalog] Failed to load template metadata: ${error}`
      );
      return { aiPrompt: '', placeholderGuidance: '', styleRules: '' };
    }
  }

  /**
   * Save template metadata (AI prompt, placeholder guidance, style rules) for a given template.
   * Updates the template entry in slide-templates.json, preserving all other fields and entries.
   *
   * Story Reference: v3-2-3 AC-6, Task 3
   */
  async saveTemplateMetadata(
    templateId: string,
    metadata: import('../shared/types').TemplateMetadata
  ): Promise<void> {
    const templatesUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'slide-templates.json'
    );

    const bytes = await vscode.workspace.fs.readFile(templatesUri);
    const content = new TextDecoder().decode(bytes);
    const data = JSON.parse(content);

    // Support both formats: direct array and { templates: [...] }
    const isWrapped = !Array.isArray(data) && data?.templates;
    const templatesArray: Record<string, unknown>[] = isWrapped
      ? data.templates
      : data;

    const entryIndex = templatesArray.findIndex(
      (item) => item.id === templateId
    );

    if (entryIndex === -1) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Update metadata fields on the entry
    templatesArray[entryIndex].ai_prompt = metadata.aiPrompt;
    templatesArray[entryIndex].placeholder_guidance = metadata.placeholderGuidance;
    templatesArray[entryIndex].style_rules = metadata.styleRules;

    // Write back in the original format
    const output = isWrapped
      ? { ...data, templates: templatesArray }
      : templatesArray;

    await vscode.workspace.fs.writeFile(
      templatesUri,
      new TextEncoder().encode(JSON.stringify(output, null, 2))
    );

    this.outputChannel.appendLine(
      `[v3:catalog] Template metadata saved: ${templateId}`
    );
  }

  /**
   * Save slide template schema fields (name, description, use_cases, background_mode) for a given template.
   * Updates the template entry in slide-templates.json, preserving all other fields and entries.
   *
   * Story Reference: tm-1-2 AC1, AC3, Task 1
   * Architecture Reference: notes/architecture-template-management.md#Implementation Patterns §4
   */
  async saveSlideTemplateSchema(
    templateId: string,
    schema: import('../shared/types').SlideTemplateSchema
  ): Promise<void> {
    const templatesUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'slide-templates.json'
    );

    const bytes = await vscode.workspace.fs.readFile(templatesUri);
    const content = new TextDecoder().decode(bytes);
    const data = JSON.parse(content);

    // Support both formats: direct array and { templates: [...] }
    const isWrapped = !Array.isArray(data) && data?.templates;
    const templatesArray: Record<string, unknown>[] = isWrapped
      ? data.templates
      : data;

    const entryIndex = templatesArray.findIndex(
      (item) => item.id === templateId
    );

    if (entryIndex === -1) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Update schema fields on the entry
    templatesArray[entryIndex].name = schema.name;
    templatesArray[entryIndex].description = schema.description;
    templatesArray[entryIndex].use_cases = schema.use_cases;
    templatesArray[entryIndex].background_mode = schema.background_mode;

    // Write back in the original format
    const output = isWrapped
      ? { ...data, templates: templatesArray }
      : templatesArray;

    await vscode.workspace.fs.writeFile(
      templatesUri,
      new TextEncoder().encode(JSON.stringify(output, null, 2))
    );

    this.outputChannel.appendLine(
      `[CatalogDataService] Saved slide template schema: ${templateId}`
    );
  }

  /**
   * Delete a slide template — removes the catalog entry from slide-templates.json
   * and deletes the HTML file from disk.
   *
   * Story Reference: tm-1-3 AC3, AC6, AC7, Task 2
   * Architecture Reference: notes/architecture-template-management.md#Implementation Patterns §4, §8
   */
  async deleteSlideTemplate(templateId: string): Promise<{ deletedFile?: string }> {
    const templatesUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'slide-templates.json'
    );

    const bytes = await vscode.workspace.fs.readFile(templatesUri);
    const content = new TextDecoder().decode(bytes);
    const data = JSON.parse(content);

    // Support both formats: direct array and { templates: [...] }
    const isWrapped = !Array.isArray(data) && data?.templates;
    const templatesArray: Record<string, unknown>[] = isWrapped
      ? data.templates
      : data;

    const entryIndex = templatesArray.findIndex(
      (item) => item.id === templateId
    );

    if (entryIndex === -1) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const deletedFile = templatesArray[entryIndex].file as string | undefined;

    // Remove entry from array
    templatesArray.splice(entryIndex, 1);

    // Write updated JSON back
    const output = isWrapped
      ? { ...data, templates: templatesArray }
      : templatesArray;

    await vscode.workspace.fs.writeFile(
      templatesUri,
      new TextEncoder().encode(JSON.stringify(output, null, 2))
    );

    // Delete the HTML file if we have a file path
    if (deletedFile) {
      const htmlUri = vscode.Uri.joinPath(
        this.workspaceRoot,
        '.slide-builder',
        'config',
        'catalog',
        deletedFile
      );
      try {
        await vscode.workspace.fs.delete(htmlUri, { useTrash: true });
      } catch (error) {
        this.outputChannel.appendLine(
          `[CatalogDataService] Warning - could not delete template file ${deletedFile}: ${error}`
        );
      }
    }

    this.outputChannel.appendLine(
      `[CatalogDataService] Deleted slide template: ${templateId}${deletedFile ? ` (file: ${deletedFile})` : ''}`
    );

    return { deletedFile };
  }

  /**
   * Delete a deck template — removes the entire template folder and the
   * corresponding entry from deck-templates.json.
   *
   * Story Reference: tm-2-3 AC3, AC6, AC7, Task 2
   * Architecture Reference: notes/architecture-template-management.md#Implementation Patterns §4, §8
   */
  async deleteDeckTemplate(templateId: string): Promise<{ deletedFolder: string }> {
    this.outputChannel.appendLine(
      `[CatalogDataService] Deleting deck template: ${templateId}`
    );

    // 1. Delete the template folder recursively
    const folderUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'deck-templates',
      templateId
    );

    const deletedFolder = folderUri.fsPath;

    try {
      await vscode.workspace.fs.delete(folderUri, { recursive: true });
      this.outputChannel.appendLine(
        `[CatalogDataService] Deleted deck template folder: ${deletedFolder}`
      );
    } catch (error) {
      this.outputChannel.appendLine(
        `[CatalogDataService] Error deleting deck template folder ${deletedFolder}: ${error}`
      );
      throw error;
    }

    // 2. Remove entry from deck-templates.json
    try {
      const manifestUri = vscode.Uri.joinPath(
        this.workspaceRoot,
        '.slide-builder',
        'config',
        'catalog',
        'deck-templates.json'
      );

      const bytes = await vscode.workspace.fs.readFile(manifestUri);
      const content = new TextDecoder().decode(bytes);
      const data = JSON.parse(content);

      // Support both formats: direct array and { templates: [...] }
      const isWrapped = !Array.isArray(data) && data?.templates;
      const templatesArray: Record<string, unknown>[] = isWrapped
        ? data.templates
        : data;

      const filtered = templatesArray.filter(
        (item) => item.id !== templateId
      );

      const output = isWrapped
        ? { ...data, templates: filtered }
        : filtered;

      await vscode.workspace.fs.writeFile(
        manifestUri,
        new TextEncoder().encode(JSON.stringify(output, null, 2))
      );

      this.outputChannel.appendLine(
        `[CatalogDataService] Removed deck template from manifest: ${templateId}`
      );
    } catch (error) {
      this.outputChannel.appendLine(
        `[CatalogDataService] Error removing deck template from manifest: ${error}`
      );
      throw error;
    }

    return { deletedFolder };
  }

  /**
   * Reorder slide templates — reconstructs the templates array in the given order
   * and writes the result back to slide-templates.json.
   *
   * Story Reference: tm-1-4 Task 4 — reorderSlideTemplates() implementation
   *
   * AC-4: Reads slide-templates.json, reorders array by templateIds, writes back.
   * AC-7: Propagates errors so handler can respond with success: false.
   */
  async reorderSlideTemplates(templateIds: string[]): Promise<void> {
    const templatesUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'slide-templates.json'
    );

    const bytes = await vscode.workspace.fs.readFile(templatesUri);
    const content = new TextDecoder().decode(bytes);
    const data = JSON.parse(content);

    // Support both formats: direct array and { templates: [...] }
    const isWrapped = !Array.isArray(data) && data?.templates;
    const templatesArray: Record<string, unknown>[] = isWrapped
      ? data.templates
      : data;

    // Build lookup map for O(1) access by id
    const lookupMap = new Map<string, Record<string, unknown>>();
    for (const entry of templatesArray) {
      if (typeof entry.id === 'string') {
        lookupMap.set(entry.id, entry);
      }
    }

    // Reconstruct array in the order given by templateIds
    const reorderedTemplates = templateIds
      .map((id) => lookupMap.get(id))
      .filter((entry): entry is Record<string, unknown> => entry !== undefined);

    // Write updated JSON back
    const output = isWrapped
      ? { ...data, templates: reorderedTemplates }
      : reorderedTemplates;

    await vscode.workspace.fs.writeFile(
      templatesUri,
      new TextEncoder().encode(JSON.stringify(output, null, 2))
    );

    this.outputChannel.appendLine(
      `[CatalogDataService] Reordered slide templates: [${templateIds.length} templates]`
    );
  }

  private async countBuiltSlides(deckUri: vscode.Uri): Promise<number> {
    const result = await this.getBuiltSlidesInfo(deckUri);
    return result.count;
  }

  /**
   * Gets built slide count and first slide path for thumbnail generation.
   * Story Reference: cv-5-3 AC-19 (firstSlidePath for thumbnail generation)
   */
  private async getBuiltSlidesInfo(deckUri: vscode.Uri): Promise<{ count: number; firstSlidePath?: string }> {
    const slidesUri = vscode.Uri.joinPath(deckUri, 'slides');
    try {
      const entries = await vscode.workspace.fs.readDirectory(slidesUri);
      const htmlFiles = entries
        .filter(([name, type]) =>
          type === vscode.FileType.File &&
          name.endsWith('.html') &&
          !name.includes('.vscode-viewer')
        )
        .map(([name]) => name)
        .sort();

      const count = htmlFiles.length;
      const firstSlidePath = count > 0
        ? vscode.Uri.joinPath(slidesUri, htmlFiles[0]).fsPath
        : undefined;

      return { count, firstSlidePath };
    } catch {
      return { count: 0 };
    }
  }

  private computeStatus(
    slideCount: number,
    builtSlideCount: number
  ): DeckStatus {
    if (builtSlideCount === 0) return 'planned';
    if (builtSlideCount < slideCount) return 'partial';
    return 'built';
  }

  /**
   * Extract data-slide-id attribute from slide HTML.
   * Ported from scripts/regenerate-viewer.js
   * Story Reference: story-viewer-save-1 Task 1, AC-1, AC-2
   */
  private extractSlideId(html: string): string | null {
    const match = html.match(/<div[^>]*class="slide"[^>]*data-slide-id="([^"]+)"/i) ||
                  html.match(/data-slide-id="([^"]+)"[^>]*class="slide"/i);
    return match ? match[1] : null;
  }

  /**
   * Extract title from slide HTML. Priority: h1 → title tag → Slide N fallback.
   * Ported from scripts/regenerate-viewer.js
   * Story Reference: story-viewer-save-1 Task 2, AC-1, AC-2
   */
  private extractTitle(html: string, slideNum: number): string {
    // Try h1 first (handle nested HTML by capturing all content then stripping tags)
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
      const stripped = h1Match[1].replace(/<[^>]+>/g, '').trim();
      if (stripped) return stripped;
    }

    // Try title tag
    const titleMatch = html.match(/<title>Slide \d+:\s*([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].trim();

    return `Slide ${slideNum}`;
  }

  // ===========================================================================
  // Brand Asset Scanning (cv-4-1)
  // Architecture Reference: ADR-007 — Brand Asset Metadata in JSON Sidecar
  // ===========================================================================

  /**
   * Scan .slide-builder/config/catalog/brand-assets/{icons,logos,images}/ for brand assets.
   * Loads per-type catalog files and matches discovered files to catalog entries.
   * Files without matching catalog entries get filename-based defaults.
   *
   * Story Reference: cv-4-1 AC-9, AC-10; story-brand-catalog-sync-1 AC-1..7
   */
  async scanBrandAssets(webview?: vscode.Webview): Promise<BrandAsset[]> {
    const startTime = Date.now();
    const brandUri = vscode.Uri.joinPath(this.workspaceRoot, '.slide-builder', 'config', 'catalog', 'brand-assets');
    const assets: BrandAsset[] = [];

    // Load per-type catalogs
    const iconCatalog = await this.loadIconCatalog(brandUri);
    const logoCatalog = await this.loadLogoCatalog(brandUri);
    const imagesCatalog = await this.loadImagesCatalog(brandUri);

    // v3-4-1: Load raw JSON catalogs for color metadata extraction
    const rawCatalogs = await this.loadRawPerTypeCatalogs(brandUri);

    // Scan each subdirectory
    const subdirs: { name: string; type: BrandAssetType }[] = [
      { name: 'icons', type: 'icon' },
      { name: 'logos', type: 'logo' },
      { name: 'images', type: 'image' },
    ];

    for (const { name: subdir, type } of subdirs) {
      const subdirUri = vscode.Uri.joinPath(brandUri, subdir);

      let entries: [string, vscode.FileType][];
      try {
        entries = await vscode.workspace.fs.readDirectory(subdirUri);
      } catch {
        // Directory doesn't exist — skip silently
        continue;
      }

      for (const [fileName, fileType] of entries) {
        if (fileType !== vscode.FileType.File) continue;

        // Filter by supported image formats
        const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
        if (!(SUPPORTED_IMAGE_FORMATS as readonly string[]).includes(ext)) continue;

        const fileUri = vscode.Uri.joinPath(subdirUri, fileName);
        const relativePath = `${subdir}/${fileName}`;

        // Read file stats
        let fileSize = 0;
        let lastModified = Date.now();
        try {
          const stat = await vscode.workspace.fs.stat(fileUri);
          fileSize = stat.size;
          lastModified = stat.mtime;
        } catch {
          // Use defaults
        }

        // Match against per-type catalog for metadata
        const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
        let name = nameWithoutExt;
        let description = '';
        let tags: string[] = [];

        if (type === 'icon' && iconCatalog) {
          const match = this.matchIconFile(fileName, iconCatalog);
          if (match) {
            name = match.name;
            description = match.description;
            tags = [...match.tags];
          }
        } else if (type === 'logo' && logoCatalog) {
          const match = this.matchLogoFile(fileName, logoCatalog);
          if (match) {
            name = match.name;
            description = match.description;
            tags = [...match.tags];
          }
        } else if (type === 'image' && imagesCatalog) {
          const match = this.matchImageFile(fileName, imagesCatalog);
          if (match) {
            name = match.name;
            description = match.description;
            tags = [...match.tags];
          }
        }

        // v3-4-1: Extract color metadata from raw catalog entry
        const colorMetadata = this.findColorMetadataForFile(rawCatalogs, type, fileName);

        const asset: BrandAsset = {
          id: this.generateAssetId(relativePath),
          name,
          type,
          path: fileUri.fsPath,
          relativePath,
          description,
          tags,
          fileSize,
          format: ext,
          lastModified,
          colorMetadata,
        };

        // Generate webview URI if webview is available
        if (webview) {
          asset.webviewUri = webview.asWebviewUri(fileUri).toString();
        }

        assets.push(asset);
      }
    }

    const duration = Date.now() - startTime;
    this.outputChannel.appendLine(
      `CatalogDataService: Scanned ${assets.length} brand assets in ${duration}ms`
    );
    return assets;
  }

  /**
   * Load brand asset metadata from .slide-builder/config/catalog/brand-assets/assets.json.
   * Returns empty array if file doesn't exist or is malformed.
   */
  private async loadBrandMetadata(brandUri: vscode.Uri): Promise<BrandAssetMetadata[]> {
    const metaUri = vscode.Uri.joinPath(brandUri, 'assets.json');
    try {
      const bytes = await vscode.workspace.fs.readFile(metaUri);
      const content = new TextDecoder().decode(bytes);
      const data: BrandAssetCatalog = JSON.parse(content);
      if (data && Array.isArray(data.assets)) {
        return data.assets;
      }
      this.outputChannel.appendLine(
        'CatalogDataService: assets.json has unexpected structure, using empty metadata'
      );
      return [];
    } catch {
      // File doesn't exist or parse error — return empty
      return [];
    }
  }

  /**
   * Generate a stable ID from relative path using simple hash.
   */
  private generateAssetId(relativePath: string): string {
    let hash = 0;
    for (let i = 0; i < relativePath.length; i++) {
      const char = relativePath.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return `asset-${Math.abs(hash).toString(36)}`;
  }

  // ===========================================================================
  // Per-Type Catalog Loading & Matching (story-brand-catalog-sync-1)
  // ===========================================================================

  /**
   * Load icon catalog from icons/icon-catalog.json.
   * Returns null on missing file or parse error.
   */
  private async loadIconCatalog(brandUri: vscode.Uri): Promise<IconCatalog | null> {
    const catalogUri = vscode.Uri.joinPath(brandUri, 'icons', 'icon-catalog.json');
    try {
      const bytes = await vscode.workspace.fs.readFile(catalogUri);
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (data && Array.isArray(data.icons)) {
        return data as IconCatalog;
      }
      this.outputChannel.appendLine('CatalogDataService: icon-catalog.json has unexpected structure');
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Load logo catalog from logos/logo-catalog.json.
   * Returns null on missing file or parse error.
   */
  private async loadLogoCatalog(brandUri: vscode.Uri): Promise<LogoCatalog | null> {
    const catalogUri = vscode.Uri.joinPath(brandUri, 'logos', 'logo-catalog.json');
    try {
      const bytes = await vscode.workspace.fs.readFile(catalogUri);
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (data && Array.isArray(data.logos)) {
        return data as LogoCatalog;
      }
      this.outputChannel.appendLine('CatalogDataService: logo-catalog.json has unexpected structure');
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Load images catalog from images/images-catalog.json.
   * Returns null on missing file or parse error.
   */
  private async loadImagesCatalog(brandUri: vscode.Uri): Promise<ImagesCatalog | null> {
    const catalogUri = vscode.Uri.joinPath(brandUri, 'images', 'images-catalog.json');
    try {
      const bytes = await vscode.workspace.fs.readFile(catalogUri);
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (data && Array.isArray(data.images)) {
        return data as ImagesCatalog;
      }
      this.outputChannel.appendLine('CatalogDataService: images-catalog.json has unexpected structure');
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Match a filename against icon catalog entries using direct file field comparison.
   * Returns matched entry or null.
   */
  private matchIconFile(filename: string, catalog: IconCatalog): IconCatalogEntry | null {
    for (const entry of catalog.icons) {
      if (entry.file === filename) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Match a filename against logo catalog entries by checking variant files.
   * Returns matched entry or null.
   */
  private matchLogoFile(filename: string, catalog: LogoCatalog): LogoCatalogEntry | null {
    for (const entry of catalog.logos) {
      if (entry.variants?.some(v => v.file === filename)) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Match a filename against images catalog entries by direct file field comparison.
   * Returns matched entry or null.
   */
  private matchImageFile(filename: string, catalog: ImagesCatalog): ImagesCatalogEntry | null {
    return catalog.images.find(entry => entry.file === filename) ?? null;
  }

  // ===========================================================================
  // Color Metadata Reading (v3-4-1)
  // Architecture Reference: ADR-V3-006 — Non-breaking catalog schema extension
  // ===========================================================================

  /**
   * Load raw per-type catalog JSON files for color metadata extraction.
   * Returns a map of assetType → entries array (as Record<string, unknown>[]).
   */
  private async loadRawPerTypeCatalogs(
    brandUri: vscode.Uri,
  ): Promise<Map<BrandAssetType, Array<Record<string, unknown>>>> {
    const result = new Map<BrandAssetType, Array<Record<string, unknown>>>();
    const configs: Array<{ type: BrandAssetType; subdir: string; file: string; key: string }> = [
      { type: 'icon', subdir: 'icons', file: 'icon-catalog.json', key: 'icons' },
      { type: 'logo', subdir: 'logos', file: 'logo-catalog.json', key: 'logos' },
      { type: 'image', subdir: 'images', file: 'images-catalog.json', key: 'images' },
    ];

    for (const { type, subdir, file, key } of configs) {
      try {
        const catalogUri = vscode.Uri.joinPath(brandUri, subdir, file);
        const bytes = await vscode.workspace.fs.readFile(catalogUri);
        const data = JSON.parse(new TextDecoder().decode(bytes));
        if (data && Array.isArray(data[key])) {
          result.set(type, data[key] as Array<Record<string, unknown>>);
        }
      } catch {
        // Catalog doesn't exist — skip
      }
    }

    return result;
  }

  /**
   * Find color metadata for a specific file from raw catalog entries.
   */
  private findColorMetadataForFile(
    rawCatalogs: Map<BrandAssetType, Array<Record<string, unknown>>>,
    assetType: BrandAssetType,
    fileName: string,
  ): ColorMetadata | undefined {
    const entries = rawCatalogs.get(assetType);
    if (!entries) return undefined;

    for (const entry of entries) {
      const matches =
        (assetType === 'icon' && this.matchesIconEntry(entry, fileName)) ||
        (assetType === 'logo' && this.matchesLogoEntry(entry, fileName)) ||
        (assetType === 'image' && entry['file'] === fileName);

      if (matches) {
        return this.extractColorMetadataFromEntry(entry);
      }
    }

    return undefined;
  }

  // ===========================================================================
  // Color Metadata Persistence (v3-4-1)
  // Architecture Reference: ADR-V3-006 — Non-breaking catalog schema extension
  // ===========================================================================

  /**
   * Write color metadata fields to a per-type catalog JSON entry.
   * Reads the catalog, finds/creates the entry, adds color metadata fields, writes back.
   */
  private async writeColorMetadataToPerTypeCatalog(
    brandUri: vscode.Uri,
    assetType: BrandAssetType,
    fileName: string,
    metadata: ColorMetadata,
  ): Promise<void> {
    const subdir = `${assetType}s`;
    const catalogFileName = assetType === 'image'
      ? 'images-catalog.json'
      : `${assetType}-catalog.json`;
    const catalogUri = vscode.Uri.joinPath(brandUri, subdir, catalogFileName);

    try {
      const bytes = await vscode.workspace.fs.readFile(catalogUri);
      const data = JSON.parse(new TextDecoder().decode(bytes));

      // Find the matching entry in the catalog array
      const arrayKey = assetType === 'icon' ? 'icons' : assetType === 'logo' ? 'logos' : 'images';
      const entries = data[arrayKey] as Array<Record<string, unknown>>;
      if (!Array.isArray(entries)) return;

      let found = false;
      for (const entry of entries) {
        const matches =
          (assetType === 'icon' && this.matchesIconEntry(entry, fileName)) ||
          (assetType === 'logo' && this.matchesLogoEntry(entry, fileName)) ||
          (assetType === 'image' && entry['file'] === fileName);

        if (matches) {
          entry['backgroundAffinity'] = metadata.backgroundAffinity;
          entry['hasTransparency'] = metadata.hasTransparency;
          entry['dominantColors'] = metadata.dominantColors;
          entry['contrastNeeds'] = metadata.contrastNeeds;
          entry['assetType'] = metadata.assetType;
          entry['manualOverride'] = metadata.manualOverride;
          found = true;
          break;
        }
      }

      if (!found) {
        this.outputChannel.appendLine(
          `[v3:color] No matching catalog entry for ${fileName} in ${catalogFileName}`,
        );
        return;
      }

      await vscode.workspace.fs.writeFile(
        catalogUri,
        new TextEncoder().encode(JSON.stringify(data, null, 2)),
      );
    } catch {
      // Catalog file may not exist yet — skip silently
      this.outputChannel.appendLine(
        `[v3:color] Could not write metadata to ${catalogFileName} for ${fileName}`,
      );
    }
  }

  /**
   * Check if an icon catalog entry matches a filename via file_pattern.
   */
  private matchesIconEntry(entry: Record<string, unknown>, filename: string): boolean {
    return entry['file'] === filename;
  }

  /**
   * Check if a logo catalog entry matches a filename via variants.
   */
  private matchesLogoEntry(entry: Record<string, unknown>, filename: string): boolean {
    const variants = entry['variants'] as Array<{ file?: string }> | undefined;
    return variants?.some(v => v.file === filename) ?? false;
  }

  /**
   * Extract ColorMetadata from a raw catalog JSON entry (if present).
   * Returns undefined if no color metadata fields exist.
   */
  private extractColorMetadataFromEntry(entry: Record<string, unknown>): ColorMetadata | undefined {
    if (!entry['backgroundAffinity']) return undefined;
    return {
      backgroundAffinity: entry['backgroundAffinity'] as ColorMetadata['backgroundAffinity'],
      hasTransparency: entry['hasTransparency'] as boolean ?? false,
      dominantColors: (entry['dominantColors'] as string[]) ?? [],
      contrastNeeds: entry['contrastNeeds'] as ColorMetadata['contrastNeeds'] ?? 'medium',
      assetType: entry['assetType'] as ColorMetadata['assetType'] ?? 'photo',
      manualOverride: entry['manualOverride'] as boolean ?? false,
    };
  }

  // ===========================================================================
  // Brand Asset Operations (cv-4-4)
  // Story Reference: cv-4-4 AC-26, AC-32, AC-33, AC-34
  // ===========================================================================

  /**
   * Browse for asset files using VS Code file picker.
   * Story Reference: cv-4-4 AC-26
   *
   * @returns Array of selected file paths
   */
  async browseForAssets(): Promise<string[]> {
    const options: vscode.OpenDialogOptions = {
      canSelectMany: true,
      canSelectFolders: false,
      canSelectFiles: true,
      filters: {
        'Images': ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'],
      },
      title: 'Select Brand Assets',
    };

    const result = await vscode.window.showOpenDialog(options);
    if (!result || result.length === 0) {
      return [];
    }

    return result.map((uri) => uri.fsPath);
  }

  /**
   * Add brand assets by copying files to the appropriate directory and updating assets.json.
   * Story Reference: cv-4-4 AC-32, AC-33, AC-34
   *
   * @param paths - Array of source file paths
   * @param assetType - Type classification: 'icon', 'logo', or 'image'
   * @param description - Optional batch description for all assets
   * @param tags - Optional tags for all assets
   * @returns Number of assets successfully added
   */
  async addBrandAssets(
    paths: string[],
    assetType: BrandAssetType,
    description?: string,
    tags?: string[]
  ): Promise<number> {
    const brandUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'brand-assets'
    );
    const targetDir = vscode.Uri.joinPath(brandUri, `${assetType}s`);

    // Ensure target directory exists
    try {
      await vscode.workspace.fs.createDirectory(targetDir);
    } catch {
      // Directory may already exist
    }

    let addedCount = 0;
    const newMetadataEntries: BrandAssetMetadata[] = [];

    for (const sourcePath of paths) {
      try {
        const sourceUri = vscode.Uri.file(sourcePath);
        const fileName = sourcePath.split(/[/\\]/).pop();
        if (!fileName) continue;

        // Check if file format is supported
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (!ext || !SUPPORTED_IMAGE_FORMATS.includes(ext as typeof SUPPORTED_IMAGE_FORMATS[number])) {
          this.outputChannel.appendLine(
            `CatalogDataService: Skipping unsupported format: ${fileName}`
          );
          continue;
        }

        // Copy file to target directory
        const targetUri = vscode.Uri.joinPath(targetDir, fileName);
        await vscode.workspace.fs.copy(sourceUri, targetUri, { overwrite: false });

        // Create metadata entry
        const relativePath = `${assetType}s/${fileName}`;
        const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');

        newMetadataEntries.push({
          path: relativePath,
          name: nameWithoutExt,
          type: assetType,
          description: description ?? '',
          tags: tags ?? [],
        });

        // v3-4-1: Auto-detect color metadata for the uploaded asset
        try {
          const colorMetadata = await this.colorAnalysisService.analyze(targetUri, assetType);
          await this.writeColorMetadataToPerTypeCatalog(brandUri, assetType, fileName, colorMetadata);
        } catch (colorErr) {
          this.outputChannel.appendLine(
            `CatalogDataService: Color analysis failed for ${fileName}: ${colorErr}`
          );
        }

        addedCount++;
        this.outputChannel.appendLine(
          `CatalogDataService: Added brand asset: ${fileName}`
        );
      } catch (error) {
        this.outputChannel.appendLine(
          `CatalogDataService: Failed to add asset ${sourcePath}: ${error}`
        );
      }
    }

    // Update assets.json with new entries
    if (newMetadataEntries.length > 0) {
      await this.appendBrandMetadata(brandUri, newMetadataEntries);
    }

    this.outputChannel.appendLine(
      `CatalogDataService: Added ${addedCount} brand assets to ${assetType}s/`
    );

    return addedCount;
  }

  /**
   * Append new metadata entries to assets.json.
   * Creates the file if it doesn't exist.
   */
  private async appendBrandMetadata(
    brandUri: vscode.Uri,
    newEntries: BrandAssetMetadata[]
  ): Promise<void> {
    const metaUri = vscode.Uri.joinPath(brandUri, 'assets.json');

    let catalog: BrandAssetCatalog = { version: 1, assets: [] };

    // Try to load existing catalog
    try {
      const bytes = await vscode.workspace.fs.readFile(metaUri);
      const content = new TextDecoder().decode(bytes);
      const data = JSON.parse(content);
      if (data && Array.isArray(data.assets)) {
        catalog = data as BrandAssetCatalog;
      }
    } catch {
      // File doesn't exist or parse error — use empty catalog
    }

    // Append new entries (avoid duplicates by path)
    const existingPaths = new Set(catalog.assets.map((a) => a.path));
    for (const entry of newEntries) {
      if (!existingPaths.has(entry.path)) {
        catalog.assets.push(entry);
      }
    }

    // Write updated catalog
    const content = JSON.stringify(catalog, null, 2);
    await vscode.workspace.fs.writeFile(metaUri, new TextEncoder().encode(content));

    this.outputChannel.appendLine(
      `CatalogDataService: Updated assets.json with ${newEntries.length} entries`
    );
  }

  // ===========================================================================
  // Brand Asset Edit/Delete/Duplicate Operations (cv-4-5)
  // Story Reference: cv-4-5 AC-38, AC-40, AC-41
  // ===========================================================================

  /**
   * Update brand asset metadata in the per-type catalog file.
   * Determines asset type from file system scan, then writes to the correct catalog.
   * Creates a new entry if no matching catalog entry exists (AC-8).
   *
   * Story Reference: cv-4-5 AC-38; story-brand-catalog-sync-1 AC-4, AC-5, AC-8
   *
   * @param id - Asset ID (hashPath)
   * @param updates - Partial metadata updates (name, description, tags)
   */
  async updateBrandAsset(
    id: string,
    updates: Partial<Pick<BrandAssetMetadata, 'name' | 'description' | 'tags'>>
  ): Promise<void> {
    const brandUri = vscode.Uri.joinPath(
      this.workspaceRoot, '.slide-builder', 'config', 'catalog', 'brand-assets'
    );

    // Find the asset's relativePath and filename by scanning subdirectories
    const subdirs: { name: string; type: BrandAssetType }[] = [
      { name: 'icons', type: 'icon' },
      { name: 'logos', type: 'logo' },
      { name: 'images', type: 'image' },
    ];

    let foundRelativePath: string | null = null;
    let foundFileName: string | null = null;
    let foundType: BrandAssetType | null = null;

    for (const { name: subdir, type } of subdirs) {
      const subdirUri = vscode.Uri.joinPath(brandUri, subdir);
      let entries: [string, vscode.FileType][];
      try {
        entries = await vscode.workspace.fs.readDirectory(subdirUri);
      } catch {
        continue;
      }

      for (const [fileName, fileType] of entries) {
        if (fileType !== vscode.FileType.File) continue;
        const relativePath = `${subdir}/${fileName}`;
        if (this.generateAssetId(relativePath) === id) {
          foundRelativePath = relativePath;
          foundFileName = fileName;
          foundType = type;
          break;
        }
      }
      if (foundRelativePath) break;
    }

    if (!foundRelativePath || !foundFileName || !foundType) {
      throw new Error(`Asset not found: ${id}`);
    }

    // Load and update the per-type catalog
    if (foundType === 'icon') {
      await this.updateIconCatalogEntry(brandUri, foundFileName, updates);
    } else if (foundType === 'logo') {
      await this.updateLogoCatalogEntry(brandUri, foundFileName, updates);
    } else {
      await this.updateImagesCatalogEntry(brandUri, foundFileName, updates);
    }

    this.outputChannel.appendLine(
      `CatalogDataService: Updated asset metadata for ${id} (${foundRelativePath})`
    );
  }

  /**
   * Update or create an entry in icon-catalog.json.
   */
  private async updateIconCatalogEntry(
    brandUri: vscode.Uri,
    filename: string,
    updates: Partial<Pick<BrandAssetMetadata, 'name' | 'description' | 'tags'>>
  ): Promise<void> {
    const catalogUri = vscode.Uri.joinPath(brandUri, 'icons', 'icon-catalog.json');
    let catalog: IconCatalog = { version: '1.0', icons: [] };

    try {
      const bytes = await vscode.workspace.fs.readFile(catalogUri);
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (data && Array.isArray(data.icons)) {
        catalog = data as IconCatalog;
      }
    } catch {
      // Catalog doesn't exist — will create new one
    }

    // Find matching entry by file field
    let matched = false;
    for (const entry of catalog.icons) {
      if (entry.file === filename) {
        if (updates.description !== undefined) entry.description = updates.description;
        if (updates.tags !== undefined) entry.tags = updates.tags;
        if (updates.name !== undefined) entry.name = updates.name;
        matched = true;
        break;
      }
    }

    // AC-8: Create new entry if no match found
    if (!matched) {
      const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
      catalog.icons.push({
        id: nameWithoutExt,
        name: updates.name ?? nameWithoutExt,
        description: updates.description ?? '',
        file: filename,
        base_icon: nameWithoutExt,
        size: 0,
        backgroundAffinity: 'any',
        hasTransparency: false,
        dominantColors: [],
        contrastNeeds: 'medium',
        tags: updates.tags ?? [],
      });
    }

    await vscode.workspace.fs.writeFile(
      catalogUri,
      new TextEncoder().encode(JSON.stringify(catalog, null, 2))
    );
  }

  /**
   * Update or create an entry in logo-catalog.json.
   */
  private async updateLogoCatalogEntry(
    brandUri: vscode.Uri,
    filename: string,
    updates: Partial<Pick<BrandAssetMetadata, 'name' | 'description' | 'tags'>>
  ): Promise<void> {
    const catalogUri = vscode.Uri.joinPath(brandUri, 'logos', 'logo-catalog.json');
    let catalog: LogoCatalog = { version: '1.0', logos: [] };

    try {
      const bytes = await vscode.workspace.fs.readFile(catalogUri);
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (data && Array.isArray(data.logos)) {
        catalog = data as LogoCatalog;
      }
    } catch {
      // Catalog doesn't exist — will create new one
    }

    // Find matching entry by variant file
    let matched = false;
    for (const entry of catalog.logos) {
      if (entry.variants?.some(v => v.file === filename)) {
        if (updates.description !== undefined) entry.description = updates.description;
        if (updates.tags !== undefined) entry.tags = updates.tags;
        if (updates.name !== undefined) entry.name = updates.name;
        matched = true;
        break;
      }
    }

    // AC-8: Create new entry if no match found
    if (!matched) {
      const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
      catalog.logos.push({
        id: nameWithoutExt,
        name: updates.name ?? nameWithoutExt,
        description: updates.description ?? '',
        variants: [{ variant_id: 'default', file: filename }],
        tags: updates.tags ?? [],
      });
    }

    await vscode.workspace.fs.writeFile(
      catalogUri,
      new TextEncoder().encode(JSON.stringify(catalog, null, 2))
    );
  }

  /**
   * Update or create an entry in images-catalog.json.
   */
  private async updateImagesCatalogEntry(
    brandUri: vscode.Uri,
    filename: string,
    updates: Partial<Pick<BrandAssetMetadata, 'name' | 'description' | 'tags'>>
  ): Promise<void> {
    const catalogUri = vscode.Uri.joinPath(brandUri, 'images', 'images-catalog.json');
    let catalog: ImagesCatalog = { version: '1.0', images: [] };

    try {
      const bytes = await vscode.workspace.fs.readFile(catalogUri);
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (data && Array.isArray(data.images)) {
        catalog = data as ImagesCatalog;
      }
    } catch {
      // Catalog doesn't exist — will create new one
    }

    // Find matching entry by direct file comparison
    const entry = catalog.images.find(e => e.file === filename);
    if (entry) {
      if (updates.description !== undefined) entry.description = updates.description;
      if (updates.tags !== undefined) entry.tags = updates.tags;
      if (updates.name !== undefined) entry.name = updates.name;
    } else {
      // AC-8: Create new entry if no match found
      const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
      catalog.images.push({
        id: nameWithoutExt,
        name: updates.name ?? nameWithoutExt,
        description: updates.description ?? '',
        file: filename,
        tags: updates.tags ?? [],
      });
    }

    await vscode.workspace.fs.writeFile(
      catalogUri,
      new TextEncoder().encode(JSON.stringify(catalog, null, 2))
    );
  }

  /**
   * Delete a brand asset file and its metadata entry.
   * Story Reference: cv-4-5 AC-40
   *
   * @param id - Asset ID (hashPath)
   */
  async deleteBrandAsset(id: string): Promise<void> {
    const brandUri = vscode.Uri.joinPath(
      this.workspaceRoot, '.slide-builder', 'config', 'catalog', 'brand-assets'
    );
    const metaUri = vscode.Uri.joinPath(brandUri, 'assets.json');

    // Load current catalog
    let catalog: BrandAssetCatalog = { version: 1, assets: [] };
    try {
      const bytes = await vscode.workspace.fs.readFile(metaUri);
      const content = new TextDecoder().decode(bytes);
      const data = JSON.parse(content);
      if (data && Array.isArray(data.assets)) {
        catalog = data as BrandAssetCatalog;
      }
    } catch {
      throw new Error('Cannot load assets.json for delete');
    }

    // Find asset
    const assetIndex = catalog.assets.findIndex(
      (a) => this.generateAssetId(a.path) === id
    );

    if (assetIndex === -1) {
      throw new Error(`Asset not found: ${id}`);
    }

    const asset = catalog.assets[assetIndex];
    const fileUri = vscode.Uri.joinPath(brandUri, asset.path);

    // Delete the file (useTrash: true for recoverability)
    try {
      await vscode.workspace.fs.delete(fileUri, { useTrash: true });
    } catch (error) {
      this.outputChannel.appendLine(
        `CatalogDataService: Warning - could not delete file ${asset.path}: ${error}`
      );
    }

    // Remove metadata entry
    catalog.assets.splice(assetIndex, 1);

    // Save updated catalog
    const content = JSON.stringify(catalog, null, 2);
    await vscode.workspace.fs.writeFile(metaUri, new TextEncoder().encode(content));

    this.outputChannel.appendLine(
      `CatalogDataService: Deleted asset ${asset.path} (id: ${id})`
    );
  }

  /**
   * Duplicate a brand asset file and add a new metadata entry.
   * Story Reference: cv-4-5 AC-41
   *
   * @param id - Asset ID (hashPath) of the asset to duplicate
   * @returns The new metadata entry
   */
  async duplicateBrandAsset(id: string): Promise<BrandAssetMetadata> {
    const brandUri = vscode.Uri.joinPath(
      this.workspaceRoot, '.slide-builder', 'config', 'catalog', 'brand-assets'
    );
    const metaUri = vscode.Uri.joinPath(brandUri, 'assets.json');

    // Load current catalog
    let catalog: BrandAssetCatalog = { version: 1, assets: [] };
    try {
      const bytes = await vscode.workspace.fs.readFile(metaUri);
      const content = new TextDecoder().decode(bytes);
      const data = JSON.parse(content);
      if (data && Array.isArray(data.assets)) {
        catalog = data as BrandAssetCatalog;
      }
    } catch {
      throw new Error('Cannot load assets.json for duplicate');
    }

    // Find source asset
    const sourceAsset = catalog.assets.find(
      (a) => this.generateAssetId(a.path) === id
    );

    if (!sourceAsset) {
      throw new Error(`Asset not found: ${id}`);
    }

    // Generate copy filename: "name-copy.ext"
    const sourceFileUri = vscode.Uri.joinPath(brandUri, sourceAsset.path);
    const pathParts = sourceAsset.path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const copyFileName = `${baseName}-copy${ext}`;
    const copyPath = sourceAsset.path.replace(fileName, copyFileName);
    const copyFileUri = vscode.Uri.joinPath(brandUri, copyPath);

    // Copy the file
    await vscode.workspace.fs.copy(sourceFileUri, copyFileUri, { overwrite: false });

    // Create new metadata entry
    const newEntry: BrandAssetMetadata = {
      path: copyPath,
      name: `${sourceAsset.name} (copy)`,
      type: sourceAsset.type,
      description: sourceAsset.description,
      tags: [...sourceAsset.tags],
    };

    catalog.assets.push(newEntry);

    // Save updated catalog
    const content = JSON.stringify(catalog, null, 2);
    await vscode.workspace.fs.writeFile(metaUri, new TextEncoder().encode(content));

    this.outputChannel.appendLine(
      `CatalogDataService: Duplicated asset ${sourceAsset.path} → ${copyPath}`
    );

    return newEntry;
  }

  // ===========================================================================
  // Color Metadata Manual Override & Batch Analysis (v3-4-2)
  // Story Reference: v3-4-2 AC-5 through AC-15
  // ===========================================================================

  /**
   * Update color metadata for a brand asset, setting manualOverride: true.
   * Merges partial metadata with existing values and persists to per-type catalog.
   *
   * Story Reference: v3-4-2 AC-5, AC-6, AC-8, AC-9, AC-10
   *
   * @param assetId - Asset ID (hashPath)
   * @param metadata - Partial color metadata fields to update
   */
  async updateColorMetadata(
    assetId: string,
    metadata: Partial<ColorMetadata>
  ): Promise<void> {
    const brandUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'brand-assets'
    );

    // Find the asset's relativePath and filename by scanning subdirectories
    const subdirs: { name: string; type: BrandAssetType }[] = [
      { name: 'icons', type: 'icon' },
      { name: 'logos', type: 'logo' },
      { name: 'images', type: 'image' },
    ];

    let foundFileName: string | null = null;
    let foundType: BrandAssetType | null = null;
    let existingMetadata: ColorMetadata | undefined;

    for (const { name: subdir, type } of subdirs) {
      const subdirUri = vscode.Uri.joinPath(brandUri, subdir);
      let entries: [string, vscode.FileType][];
      try {
        entries = await vscode.workspace.fs.readDirectory(subdirUri);
      } catch {
        continue;
      }

      for (const [fileName, fileType] of entries) {
        if (fileType !== vscode.FileType.File) continue;
        const relativePath = `${subdir}/${fileName}`;
        if (this.generateAssetId(relativePath) === assetId) {
          foundFileName = fileName;
          foundType = type;

          // Load existing color metadata
          const rawCatalogs = await this.loadRawPerTypeCatalogs(brandUri);
          existingMetadata = this.findColorMetadataForFile(rawCatalogs, type, fileName);
          break;
        }
      }
      if (foundFileName) break;
    }

    if (!foundFileName || !foundType) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Merge partial metadata with existing (or defaults)
    const mergedMetadata: ColorMetadata = {
      backgroundAffinity: metadata.backgroundAffinity ?? existingMetadata?.backgroundAffinity ?? 'any',
      hasTransparency: metadata.hasTransparency ?? existingMetadata?.hasTransparency ?? false,
      dominantColors: existingMetadata?.dominantColors ?? [], // Read-only, preserve existing
      contrastNeeds: metadata.contrastNeeds ?? existingMetadata?.contrastNeeds ?? 'medium',
      assetType: metadata.assetType ?? existingMetadata?.assetType ?? 'photo',
      manualOverride: true, // AC-10: Always set to true on manual update
    };

    // Write to per-type catalog
    await this.writeColorMetadataToPerTypeCatalog(brandUri, foundType, foundFileName, mergedMetadata);

    this.outputChannel.appendLine(
      `[v3:color] Updated color metadata for ${assetId} (manualOverride: true)`
    );
  }

  /**
   * Batch analyze all brand assets that lack color metadata or don't have manualOverride: true.
   * Calls ColorAnalysisService for each eligible asset and updates the catalog.
   *
   * Story Reference: v3-4-2 AC-11, AC-12, AC-13, AC-14, AC-15
   *
   * @param onProgress - Callback for progress updates (current, total)
   * @returns Array of results with success/failure status per asset
   */
  async batchAnalyze(
    onProgress?: (current: number, total: number) => Promise<void>
  ): Promise<Array<{ assetId: string; success: boolean; error?: string }>> {
    const brandUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'brand-assets'
    );

    const results: Array<{ assetId: string; success: boolean; error?: string }> = [];

    // Collect all assets that need analysis
    const subdirs: { name: string; type: BrandAssetType }[] = [
      { name: 'icons', type: 'icon' },
      { name: 'logos', type: 'logo' },
      { name: 'images', type: 'image' },
    ];

    // First pass: identify eligible assets
    const assetsToAnalyze: Array<{
      fileName: string;
      type: BrandAssetType;
      uri: vscode.Uri;
      assetId: string;
    }> = [];

    const rawCatalogs = await this.loadRawPerTypeCatalogs(brandUri);

    for (const { name: subdir, type } of subdirs) {
      const subdirUri = vscode.Uri.joinPath(brandUri, subdir);
      let entries: [string, vscode.FileType][];
      try {
        entries = await vscode.workspace.fs.readDirectory(subdirUri);
      } catch {
        continue;
      }

      for (const [fileName, fileType] of entries) {
        if (fileType !== vscode.FileType.File) continue;

        // Filter by supported image formats
        const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
        if (!['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'].includes(ext)) continue;

        const relativePath = `${subdir}/${fileName}`;
        const assetId = this.generateAssetId(relativePath);

        // Check existing metadata
        const existingMetadata = this.findColorMetadataForFile(rawCatalogs, type, fileName);

        // AC-12: Skip assets with manualOverride: true
        if (existingMetadata?.manualOverride === true) {
          this.outputChannel.appendLine(
            `[v3:batch] Skipping ${fileName} - manualOverride: true`
          );
          continue;
        }

        // Add to analysis queue if metadata is missing or incomplete
        if (!existingMetadata || !existingMetadata.backgroundAffinity) {
          assetsToAnalyze.push({
            fileName,
            type,
            uri: vscode.Uri.joinPath(subdirUri, fileName),
            assetId,
          });
        }
      }
    }

    const total = assetsToAnalyze.length;
    this.outputChannel.appendLine(
      `[v3:batch] Starting batch analysis of ${total} assets`
    );

    // Second pass: analyze each asset
    for (let i = 0; i < assetsToAnalyze.length; i++) {
      const { fileName, type, uri, assetId } = assetsToAnalyze[i];

      // AC-13: Send progress update
      if (onProgress) {
        await onProgress(i + 1, total);
      }

      try {
        // Run color analysis
        const colorMetadata = await this.colorAnalysisService.analyze(uri, type);

        // Ensure manualOverride stays false for auto-detection
        colorMetadata.manualOverride = false;

        // Write to catalog
        await this.writeColorMetadataToPerTypeCatalog(brandUri, type, fileName, colorMetadata);

        results.push({ assetId, success: true });
        this.outputChannel.appendLine(
          `[v3:batch] Analyzed ${fileName}: ${colorMetadata.backgroundAffinity}, ${colorMetadata.dominantColors.length} colors`
        );
      } catch (error) {
        results.push({
          assetId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
        this.outputChannel.appendLine(
          `[v3:batch] Failed to analyze ${fileName}: ${error}`
        );
      }
    }

    // AC-15: Log summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    this.outputChannel.appendLine(
      `[v3:batch] Batch analysis complete: ${successCount} succeeded, ${failCount} failed`
    );

    return results;
  }

  /**
   * Read slide template HTML from .slide-builder/config/catalog/slide-templates/{templateId}.html
   * Story Reference: slide-template-preview-3 Task 1, AC-1, AC-2
   *
   * @param templateId - The slide template ID (e.g., "title-slide", "bullet-points")
   * @returns The decoded HTML content as a string
   * @throws Error if template file not found
   */
  async getSlideTemplateHtml(templateId: string): Promise<string> {
    const htmlUri = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'slide-templates',
      `${templateId}.html`
    );

    try {
      const bytes = await vscode.workspace.fs.readFile(htmlUri);
      return new TextDecoder().decode(bytes);
    } catch (error) {
      this.outputChannel.appendLine(`Failed to read template HTML: ${templateId}`);
      throw new Error(`Template HTML not found: ${templateId}`);
    }
  }

  dispose(): void {
    // No resources to clean up
  }
}
