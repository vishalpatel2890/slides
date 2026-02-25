import * as vscode from 'vscode';
import { parseDocument } from 'yaml';
import type { Document } from 'yaml';
import type { DeckTemplateConfig, SlideConfig, ContentSource } from '../shared/types';

/**
 * Service for loading, validating, and saving deck template configuration files.
 * Uses YAML Document API for comment-preserving round-trips.
 *
 * Story Reference: v4-1-2 AC-1, AC-2, AC-3, AC-4
 * Architecture Reference: .slide-builder/CONVENTIONS.md#Template Config Schema
 */
export class DeckTemplateConfigService implements vscode.Disposable {
  /** Lazy-loaded config cache: templateId → parsed config */
  private readonly cache = new Map<string, DeckTemplateConfig>();

  /** YAML Document cache for comment preservation on save */
  private readonly docCache = new Map<string, Document>();

  constructor(
    private readonly workspaceRoot: vscode.Uri,
    private readonly outputChannel: vscode.OutputChannel,
  ) {}

  dispose(): void {
    this.cache.clear();
    this.docCache.clear();
    this.outputChannel.appendLine('[v4:deck-config] Disposed');
  }

  /**
   * Load and parse a template-config.yaml file.
   * Returns cached config on subsequent calls (AC-4: lazy loading).
   *
   * AC-1: Returns parsed DeckTemplateConfig object
   * AC-2: Returns meaningful error with line/column on malformed YAML
   */
  async loadConfig(templateId: string): Promise<DeckTemplateConfig> {
    // Return cached if available (AC-4)
    const cached = this.cache.get(templateId);
    if (cached) {
      this.outputChannel.appendLine(`[v4:deck-config] Cache hit for '${templateId}'`);
      return cached;
    }

    const configUri = this.resolveConfigPath(templateId);
    this.outputChannel.appendLine(`[v4:deck-config] Loading config from ${configUri.fsPath}`);

    // Read file
    let bytes: Uint8Array;
    try {
      bytes = await vscode.workspace.fs.readFile(configUri);
    } catch {
      throw new Error(`Template config not found: ${configUri.fsPath}`);
    }

    const text = new TextDecoder().decode(bytes);

    // Parse with Document API for comment preservation (AC-2, AC-3)
    const doc = parseDocument(text, { keepSourceTokens: true });

    // Check for YAML parse errors with line/column info (AC-2)
    if (doc.errors.length > 0) {
      const err = doc.errors[0];
      const pos = err.pos?.[0];
      const location = pos !== undefined ? ` at offset ${pos}` : '';
      throw new Error(`YAML parse error in ${templateId}${location}: ${err.message}`);
    }

    const raw = doc.toJSON();
    if (!raw || typeof raw !== 'object') {
      throw new Error(`Invalid template config: ${templateId} — expected YAML object`);
    }

    // Validate shape
    const validation = this.validateConfig(raw as DeckTemplateConfig);
    if (!validation.valid) {
      throw new Error(
        `Invalid template config for '${templateId}': ${validation.errors.join('; ')}`,
      );
    }

    const config = raw as DeckTemplateConfig;

    // Cache both parsed config and Document
    this.cache.set(templateId, config);
    this.docCache.set(templateId, doc);

    this.outputChannel.appendLine(
      `[v4:deck-config] Loaded '${templateId}': ${config.slides.length} slides`,
    );
    return config;
  }

  /**
   * Save a full config back to YAML, preserving comments (AC-3).
   * Uses the cached Document when available for comment preservation.
   */
  async saveConfig(templateId: string, config: DeckTemplateConfig): Promise<void> {
    const configUri = this.resolveConfigPath(templateId);
    this.outputChannel.appendLine(`[v4:deck-config] Saving config for '${templateId}'`);

    let doc = this.docCache.get(templateId);

    if (doc) {
      // Update existing Document nodes to preserve comments
      doc.set('name', config.name);
      doc.set('description', config.description);
      doc.set('version', config.version);
      doc.set('slide_count', config.slide_count);
      doc.set('required_context', config.required_context);
      doc.set('optional_context', config.optional_context);
      doc.set('slides', config.slides);
      doc.set('checkpoints', config.checkpoints);
    } else {
      // No cached Document — create fresh
      doc = parseDocument('', { keepSourceTokens: true });
      doc.contents = doc.createNode(config);
    }

    const yamlText = doc.toString();
    await vscode.workspace.fs.writeFile(configUri, new TextEncoder().encode(yamlText));

    // Invalidate and re-cache
    this.cache.set(templateId, config);
    this.docCache.set(templateId, doc);

    this.outputChannel.appendLine(`[v4:deck-config] Saved config for '${templateId}'`);
  }

  /**
   * Partial update: save only a specific slide's instructions field (AC-3).
   */
  async saveSlideInstructions(
    templateId: string,
    slideNumber: number,
    instructions: string,
  ): Promise<void> {
    this.outputChannel.appendLine(
      `[v4:deck-config] Saving instructions for slide ${slideNumber} of '${templateId}'`,
    );

    // Ensure config is loaded (populates docCache)
    const config = await this.loadConfig(templateId);
    const doc = this.docCache.get(templateId);
    if (!doc) {
      throw new Error(`No YAML document cached for '${templateId}'`);
    }

    const slideIndex = slideNumber - 1;
    if (slideIndex < 0 || slideIndex >= config.slides.length) {
      throw new Error(`Slide ${slideNumber} not found in '${templateId}'`);
    }

    // Update Document node for comment preservation
    doc.setIn(['slides', slideIndex, 'instructions'], instructions);

    // Write back
    const yamlText = doc.toString();
    const configUri = this.resolveConfigPath(templateId);
    await vscode.workspace.fs.writeFile(configUri, new TextEncoder().encode(yamlText));

    // Update cached config
    config.slides[slideIndex].instructions = instructions;

    this.outputChannel.appendLine(
      `[v4:deck-config] Saved instructions for slide ${slideNumber} of '${templateId}'`,
    );
  }

  /**
   * Partial update: save only a specific slide's content_sources field (AC-3).
   */
  async saveContentSources(
    templateId: string,
    slideNumber: number,
    sources: ContentSource[],
  ): Promise<void> {
    this.outputChannel.appendLine(
      `[v4:deck-config] Saving content sources for slide ${slideNumber} of '${templateId}'`,
    );

    const config = await this.loadConfig(templateId);
    const doc = this.docCache.get(templateId);
    if (!doc) {
      throw new Error(`No YAML document cached for '${templateId}'`);
    }

    const slideIndex = slideNumber - 1;
    if (slideIndex < 0 || slideIndex >= config.slides.length) {
      throw new Error(`Slide ${slideNumber} not found in '${templateId}'`);
    }

    doc.setIn(['slides', slideIndex, 'content_sources'], sources);

    const yamlText = doc.toString();
    const configUri = this.resolveConfigPath(templateId);
    await vscode.workspace.fs.writeFile(configUri, new TextEncoder().encode(yamlText));

    config.slides[slideIndex].content_sources = sources;

    this.outputChannel.appendLine(
      `[v4:deck-config] Saved content sources for slide ${slideNumber} of '${templateId}'`,
    );
  }

  /**
   * Read an HTML slide file relative to the template directory.
   */
  async getSlideHtml(templateId: string, slideFile: string): Promise<string> {
    const templateDir = vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'deck-templates',
      templateId,
    );
    const htmlUri = vscode.Uri.joinPath(templateDir, slideFile);

    this.outputChannel.appendLine(`[v4:deck-config] Reading slide HTML: ${htmlUri.fsPath}`);

    try {
      const bytes = await vscode.workspace.fs.readFile(htmlUri);
      return new TextDecoder().decode(bytes);
    } catch {
      throw new Error(`Slide HTML not found: ${slideFile} in template '${templateId}'`);
    }
  }

  /**
   * Validate that a config object matches the DeckTemplateConfig shape.
   * Returns { valid, errors } for detailed error reporting.
   */
  validateConfig(config: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const c = config as Record<string, unknown>;

    if (!c || typeof c !== 'object') {
      return { valid: false, errors: ['Config must be an object'] };
    }

    // Required top-level fields
    if (typeof c.name !== 'string') errors.push('Missing or invalid field: name (string)');
    if (typeof c.description !== 'string')
      errors.push('Missing or invalid field: description (string)');
    if (typeof c.version !== 'string') errors.push('Missing or invalid field: version (string)');
    if (typeof c.slide_count !== 'number')
      errors.push('Missing or invalid field: slide_count (number)');

    // Slides array
    if (!Array.isArray(c.slides)) {
      errors.push('Missing or invalid field: slides (array)');
    } else {
      if (typeof c.slide_count === 'number' && c.slides.length !== c.slide_count) {
        errors.push(`slides.length (${c.slides.length}) does not match slide_count (${c.slide_count})`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Invalidate cached config for a template (e.g. after external file change).
   */
  invalidateCache(templateId: string): void {
    this.cache.delete(templateId);
    this.docCache.delete(templateId);
    this.outputChannel.appendLine(`[v4:deck-config] Cache invalidated for '${templateId}'`);
  }

  /**
   * Resolve the template-config.yaml path for a given template ID.
   */
  private resolveConfigPath(templateId: string): vscode.Uri {
    return vscode.Uri.joinPath(
      this.workspaceRoot,
      '.slide-builder',
      'config',
      'catalog',
      'deck-templates',
      templateId,
      'template-config.yaml',
    );
  }
}
