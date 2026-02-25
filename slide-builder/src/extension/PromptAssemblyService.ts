import * as vscode from 'vscode';

/**
 * PromptAssemblyService - Assembles complete Claude Code prompts from modal form data
 * and workspace context files.
 *
 * Story Reference: tm-1-5 AC-4, AC-5, AC-6, AC-7, AC-9
 * Architecture Reference: notes/architecture-template-management.md §2 — PromptAssemblyService Pattern
 *
 * This is the first method in the service; subsequent stories (TM-2, TM-3) will add
 * assembleAddDeckTemplatePrompt() and assembleEditDeckTemplatePrompt() to this same class.
 */
export class PromptAssemblyService {
  constructor(
    private readonly workspaceRoot: vscode.Uri,
    private readonly outputChannel: vscode.OutputChannel
  ) {}

  /**
   * Assembles a complete `/sb-manage:add-slide-template` prompt from form data and
   * workspace context files (theme.json, design-standards.md, slide-templates.json).
   *
   * Story Reference: tm-1-5 AC-5, AC-9
   *
   * @param formData - Form field values from the Add Slide Template modal
   * @returns Complete prompt string starting with `/sb-manage:add-slide-template`
   */
  async assembleAddSlideTemplatePrompt(formData: Record<string, unknown>): Promise<string> {
    const name = String(formData['name'] ?? '');
    const description = String(formData['description'] ?? '');
    const useCases = formData['useCases'] ? String(formData['useCases']) : '(not specified)';
    const backgroundMode = formData['backgroundMode'] ? String(formData['backgroundMode']) : 'dark';

    // Read context files — catch errors individually, proceed with available context
    const themeContent = await this._readContextFile(
      '.slide-builder/config/theme.json',
      vscode.Uri.joinPath(this.workspaceRoot, '.slide-builder', 'config', 'theme.json')
    );

    const designStandardsContent = await this._readContextFile(
      '.slide-builder/config/design-standards.md',
      vscode.Uri.joinPath(this.workspaceRoot, '.slide-builder', 'config', 'design-standards.md'),
      true // optional — do not warn if not found
    );

    const slideTemplatesContent = await this._readContextFile(
      '.slide-builder/config/catalog/slide-templates.json',
      vscode.Uri.joinPath(this.workspaceRoot, '.slide-builder', 'config', 'catalog', 'slide-templates.json')
    );

    const prompt = [
      '/sb-manage:add-slide-template',
      '',
      'Here is the context from the user:',
      `- Template Name: ${name}`,
      `- Description: ${description}`,
      `- Primary Use Cases: ${useCases}`,
      `- Background Mode: ${backgroundMode}`,
      '',
      'Context files:',
      `- Theme: .slide-builder/config/theme.json — ${themeContent}`,
      `- Design Standards: .slide-builder/config/design-standards.md — ${designStandardsContent}`,
      `- Existing Templates: .slide-builder/config/catalog/slide-templates.json — ${slideTemplatesContent}`,
    ].join('\n');

    this.outputChannel.appendLine(
      `[PromptAssemblyService] Assembled add-slide-template prompt (${prompt.length} chars)`
    );

    return prompt;
  }

  /**
   * Assembles a complete `/sb-manage:add-deck-template` prompt from form data and
   * workspace context files (theme.json, design-standards.md, deck-templates.json, slide-templates.json).
   *
   * Story Reference: tm-3-1 AC-3, AC-4
   *
   * @param formData - Form field values from the Add Deck Template modal
   * @returns Complete prompt string starting with `/sb-manage:add-deck-template`
   */
  async assembleAddDeckTemplatePrompt(formData: Record<string, unknown>): Promise<string> {
    const name = String(formData['name'] ?? '');
    const purpose = String(formData['purpose'] ?? '');
    const audience = formData['audience'] ? String(formData['audience']) : '';
    const slideCount = formData['slideCount'] ? String(formData['slideCount']) : '';

    // Read context files — catch errors individually, proceed with available context
    const themeContent = await this._readContextFile(
      '.slide-builder/config/theme/theme.json',
      vscode.Uri.joinPath(this.workspaceRoot, '.slide-builder', 'config', 'theme', 'theme.json')
    );

    const designStandardsContent = await this._readContextFile(
      '.slide-builder/config/theme/design-standards.md',
      vscode.Uri.joinPath(this.workspaceRoot, '.slide-builder', 'config', 'theme', 'design-standards.md'),
      true // optional — do not warn if not found
    );

    const deckTemplatesContent = await this._readContextFile(
      '.slide-builder/config/catalog/deck-templates.json',
      vscode.Uri.joinPath(this.workspaceRoot, '.slide-builder', 'config', 'catalog', 'deck-templates.json')
    );

    const slideTemplatesContent = await this._readContextFile(
      '.slide-builder/config/catalog/slide-templates.json',
      vscode.Uri.joinPath(this.workspaceRoot, '.slide-builder', 'config', 'catalog', 'slide-templates.json')
    );

    // Extract existing deck template names for deduplication context
    let existingDeckTemplateNames = '(none found)';
    try {
      const parsed = JSON.parse(deckTemplatesContent);
      const templates = parsed?.templates ?? parsed;
      if (Array.isArray(templates) && templates.length > 0) {
        existingDeckTemplateNames = templates.map((t: any) => t.name ?? t.id ?? 'unknown').join(', ');
      }
    } catch {
      // deckTemplatesContent might be 'unavailable' or 'not found' — that's fine
    }

    const promptLines = [
      '/sb-manage:add-deck-template',
      '',
      'Here is the context from the user:',
      `- Template Name: ${name}`,
      `- Purpose/Description: ${purpose}`,
    ];

    if (audience) {
      promptLines.push(`- Target Audience: ${audience}`);
    }
    if (slideCount) {
      promptLines.push(`- Approximate Slide Count: ${slideCount}`);
    }

    promptLines.push(
      '',
      'Deduplication context (existing deck template names):',
      `- ${existingDeckTemplateNames}`,
      '',
      'Context files:',
      `- Theme: .slide-builder/config/theme/theme.json — ${themeContent}`,
      `- Design Standards: .slide-builder/config/theme/design-standards.md — ${designStandardsContent}`,
      `- Existing Deck Templates: .slide-builder/config/catalog/deck-templates.json — ${deckTemplatesContent}`,
      `- Available Slide Templates: .slide-builder/config/catalog/slide-templates.json — ${slideTemplatesContent}`,
    );

    const prompt = promptLines.join('\n');

    this.outputChannel.appendLine(
      `[PromptAssemblyService] Assembled add-deck-template prompt (${prompt.length} chars)`
    );

    return prompt;
  }

  /**
   * Assembles a complete `/sb-manage:edit-deck-template` prompt from form data,
   * template ID, slide file path, and workspace context files (theme.json,
   * design-standards.md, template-config.yaml).
   *
   * Story Reference: tm-3-4 AC-3, AC-4
   *
   * @param formData - Form field values from the Edit Slide modal (contains `changes`)
   * @param templateId - The deck template identifier
   * @param slideFile - The slide file path within the template (e.g., "slides/slide-3.html")
   * @returns Complete prompt string starting with `/sb-manage:edit-deck-template`
   */
  async assembleEditDeckTemplatePrompt(
    formData: Record<string, unknown>,
    templateId: string,
    slideFile: string
  ): Promise<string> {
    const changes = String(formData['changes'] ?? '');

    // Read context files — catch errors individually, proceed with available context
    const themeContent = await this._readContextFile(
      '.slide-builder/config/theme/theme.json',
      vscode.Uri.joinPath(this.workspaceRoot, '.slide-builder', 'config', 'theme', 'theme.json')
    );

    const designStandardsContent = await this._readContextFile(
      '.slide-builder/config/theme/design-standards.md',
      vscode.Uri.joinPath(this.workspaceRoot, '.slide-builder', 'config', 'theme', 'design-standards.md'),
      true // optional — do not warn if not found
    );

    const templateConfigContent = await this._readContextFile(
      `.slide-builder/config/catalog/deck-templates/${templateId}/template-config.yaml`,
      vscode.Uri.joinPath(
        this.workspaceRoot,
        '.slide-builder', 'config', 'catalog', 'deck-templates', templateId, 'template-config.yaml'
      )
    );

    const prompt = [
      '/sb-manage:edit-deck-template',
      '',
      'Here is the context from the user:',
      `- Template ID: ${templateId}`,
      `- Slide File: ${slideFile}`,
      `- Change Description: ${changes}`,
      '',
      'Context files:',
      `- Template Config: .slide-builder/config/catalog/deck-templates/${templateId}/template-config.yaml — ${templateConfigContent}`,
      `- Theme: .slide-builder/config/theme/theme.json — ${themeContent}`,
      `- Design Standards: .slide-builder/config/theme/design-standards.md — ${designStandardsContent}`,
    ].join('\n');

    this.outputChannel.appendLine(
      `[PromptAssemblyService] Assembled edit-deck-template prompt for ${templateId}/${slideFile} (${prompt.length} chars)`
    );

    return prompt;
  }

  /**
   * Reads a workspace context file and returns its content as a string.
   * On error, logs to the output channel and returns an 'unavailable' note.
   *
   * Story Reference: tm-1-5 AC-9 — graceful degradation on file-read errors
   *
   * @param displayPath - Human-readable path for logging and prompt notes
   * @param uri - VS Code URI to read
   * @param optional - If true, a FileNotFound error is silently treated as 'not found' rather than 'unavailable'
   * @returns File content as string, or a descriptive note if unavailable
   */
  private async _readContextFile(
    displayPath: string,
    uri: vscode.Uri,
    optional = false
  ): Promise<string> {
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      return new TextDecoder().decode(bytes);
    } catch (error) {
      // Detect file-not-found by code property (runtime vscode API) or error message (tests/mock)
      const isNotFound =
        (error instanceof vscode.FileSystemError && (error as any).code === 'FileNotFound') ||
        (error instanceof Error && error.message.includes('FileNotFound'));

      if (isNotFound && optional) {
        return 'not found';
      }

      this.outputChannel.appendLine(
        `[PromptAssemblyService] Error reading context file: ${displayPath}: ${error}`
      );

      return isNotFound ? 'not found' : 'unavailable';
    }
  }
}

export default PromptAssemblyService;
