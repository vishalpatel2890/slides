/**
 * Unit tests for PromptAssemblyService.
 *
 * Story Reference: tm-1-5 AC-5, AC-9
 * Tests: prompt assembly correctness, graceful degradation on file-read errors, logging behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspace, Uri, FileSystemError } from 'vscode';
import { PromptAssemblyService } from '../../src/extension/PromptAssemblyService';

const mockOutputChannel = {
  appendLine: vi.fn(),
  append: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn(),
  name: 'Test Channel',
} as any;

const workspaceRoot = Uri.file('/mock/workspace');

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

const mockThemeJson = JSON.stringify({
  primary: '#1a1a2e',
  secondary: '#e94560',
  background: '#0f0f23',
});

const mockSlideTemplatesJson = JSON.stringify({
  templates: [
    { id: 'hero', name: 'Hero Slide', file: 'hero.html' },
  ],
});

const mockDeckTemplatesJson = JSON.stringify({
  templates: [
    { id: 'quarterly-review', name: 'Quarterly Review' },
    { id: 'team-standup', name: 'Team Standup' },
  ],
});

const mockDesignStandardsMd = '# Design Standards\n\nUse dark backgrounds by default.';

describe('PromptAssemblyService', () => {
  let service: PromptAssemblyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PromptAssemblyService(workspaceRoot, mockOutputChannel);
  });

  // Task 6.2: Test that returned string starts with /sb-manage:add-slide-template
  it('returns a prompt string starting with /sb-manage:add-slide-template (AC-5)', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(mockThemeJson));

    const result = await service.assembleAddSlideTemplatePrompt({
      name: 'Test',
      description: 'Desc',
      useCases: 'opener',
      backgroundMode: 'dark',
    });

    expect(result).toMatch(/^\/sb-manage:add-slide-template/);
  });

  // Task 6.3: Test that prompt contains form data fields
  it('includes all form data fields in the assembled prompt (AC-5)', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(mockThemeJson));

    const result = await service.assembleAddSlideTemplatePrompt({
      name: 'Test',
      description: 'Desc',
      useCases: 'opener',
      backgroundMode: 'dark',
    });

    expect(result).toContain('Template Name: Test');
    expect(result).toContain('Description: Desc');
    expect(result).toContain('Primary Use Cases: opener');
    expect(result).toContain('Background Mode: dark');
  });

  // Additional: test optional fields not provided use defaults
  it('uses "(not specified)" for missing useCases and "dark" for missing backgroundMode (AC-5)', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(mockThemeJson));

    const result = await service.assembleAddSlideTemplatePrompt({
      name: 'Minimal',
      description: 'Just a description',
    });

    expect(result).toContain('Primary Use Cases: (not specified)');
    expect(result).toContain('Background Mode: dark');
  });

  // Task 6.4: Test that service logs error and returns string (does not throw) when readFile throws
  it('logs error and returns a prompt string (does not throw) when theme.json read fails (AC-9)', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(
      new Error('Some unexpected error reading theme.json')
    );

    let result: string | undefined;
    let threw = false;
    try {
      result = await service.assembleAddSlideTemplatePrompt({
        name: 'Test',
        description: 'Desc',
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
    expect(typeof result).toBe('string');
    expect(result!).toMatch(/^\/sb-manage:add-slide-template/);

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('[PromptAssemblyService] Error reading context file: .slide-builder/config/theme.json')
    );
  });

  // Task 6.5: Test that outputChannel.appendLine is called with the assembled prompt log line
  it('logs assembled prompt length to outputChannel on success (AC-5)', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(mockThemeJson));

    await service.assembleAddSlideTemplatePrompt({
      name: 'Test',
      description: 'Desc',
    });

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('[PromptAssemblyService] Assembled add-slide-template prompt')
    );
  });

  // Additional: design-standards.md not found returns 'not found' gracefully
  it('handles missing design-standards.md gracefully without logging error (AC-9)', async () => {
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      const path = uri.fsPath as string;
      if (path.includes('design-standards')) {
        throw FileSystemError.FileNotFound(uri);
      }
      return encode(mockThemeJson);
    });

    const result = await service.assembleAddSlideTemplatePrompt({
      name: 'Test',
      description: 'Desc',
    });

    expect(result).toContain('Design Standards: .slide-builder/config/design-standards.md — not found');
    // Should NOT log an error for the optional file
    const errorCalls = vi.mocked(mockOutputChannel.appendLine).mock.calls
      .filter((c: unknown[]) => String(c[0]).includes('Error reading context file: .slide-builder/config/design-standards'));
    expect(errorCalls).toHaveLength(0);
  });

  // Additional: slide-templates.json unavailable → included as 'unavailable' in prompt
  it('marks slide-templates.json as unavailable and logs error when it cannot be read (AC-9)', async () => {
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      const path = uri.fsPath as string;
      if (path.includes('slide-templates')) {
        throw new Error('Disk error');
      }
      return encode(mockThemeJson);
    });

    const result = await service.assembleAddSlideTemplatePrompt({
      name: 'Test',
      description: 'Desc',
    });

    expect(result).toContain('Existing Templates: .slide-builder/config/catalog/slide-templates.json — unavailable');
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('[PromptAssemblyService] Error reading context file: .slide-builder/config/catalog/slide-templates.json')
    );
  });

  // Additional: full context included in prompt when all files readable
  it('includes full file content in prompt when all context files are readable (AC-5)', async () => {
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      const path = uri.fsPath as string;
      if (path.includes('theme.json')) return encode(mockThemeJson);
      if (path.includes('design-standards')) return encode(mockDesignStandardsMd);
      if (path.includes('slide-templates')) return encode(mockSlideTemplatesJson);
      throw new Error(`Unexpected path: ${path}`);
    });

    const result = await service.assembleAddSlideTemplatePrompt({
      name: 'Hero',
      description: 'A bold hero layout',
      useCases: 'title slides',
      backgroundMode: 'dark',
    });

    expect(result).toContain(mockThemeJson);
    expect(result).toContain(mockDesignStandardsMd);
    expect(result).toContain(mockSlideTemplatesJson);
  });

  // ==========================================================================
  // tm-3-1: assembleAddDeckTemplatePrompt tests (Task 6.1 - 6.3)
  // ==========================================================================

  describe('assembleAddDeckTemplatePrompt (tm-3-1)', () => {
    function mockAllContextFiles() {
      vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
        const path = uri.fsPath as string;
        if (path.includes('theme.json')) return encode(mockThemeJson);
        if (path.includes('design-standards')) return encode(mockDesignStandardsMd);
        if (path.includes('deck-templates')) return encode(mockDeckTemplatesJson);
        if (path.includes('slide-templates')) return encode(mockSlideTemplatesJson);
        throw new Error(`Unexpected path: ${path}`);
      });
    }

    // Task 6.1: Full form data with all context files
    it('returns prompt starting with /sb-manage:add-deck-template containing form data and context (AC-3, AC-4)', async () => {
      mockAllContextFiles();

      const result = await service.assembleAddDeckTemplatePrompt({
        name: 'Product Launch',
        purpose: 'Present new product features',
        audience: 'Stakeholders',
        slideCount: '8',
      });

      // Prompt starts with the correct command
      expect(result).toMatch(/^\/sb-manage:add-deck-template/);
      // Form data included
      expect(result).toContain('Template Name: Product Launch');
      expect(result).toContain('Purpose/Description: Present new product features');
      expect(result).toContain('Target Audience: Stakeholders');
      expect(result).toContain('Approximate Slide Count: 8');
      // Context files included
      expect(result).toContain(mockThemeJson);
      expect(result).toContain(mockDesignStandardsMd);
      expect(result).toContain(mockDeckTemplatesJson);
      expect(result).toContain(mockSlideTemplatesJson);
      // Deduplication context
      expect(result).toContain('Quarterly Review');
      expect(result).toContain('Team Standup');
    });

    // Task 6.2: Only required fields (audience and slideCount omitted)
    it('assembles prompt without error when optional fields are omitted (AC-3)', async () => {
      mockAllContextFiles();

      const result = await service.assembleAddDeckTemplatePrompt({
        name: 'Minimal Deck',
        purpose: 'A simple deck template',
      });

      expect(result).toMatch(/^\/sb-manage:add-deck-template/);
      expect(result).toContain('Template Name: Minimal Deck');
      expect(result).toContain('Purpose/Description: A simple deck template');
      // Optional fields should NOT appear when empty
      expect(result).not.toContain('Target Audience:');
      expect(result).not.toContain('Approximate Slide Count:');
    });

    // Task 6.3: Context file read failure (theme.json missing)
    it('assembles prompt with available context when theme.json read fails (AC-3)', async () => {
      vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
        const path = uri.fsPath as string;
        if (path.includes('theme.json')) throw new Error('File not found');
        if (path.includes('design-standards')) return encode(mockDesignStandardsMd);
        if (path.includes('deck-templates')) return encode(mockDeckTemplatesJson);
        if (path.includes('slide-templates')) return encode(mockSlideTemplatesJson);
        throw new Error(`Unexpected path: ${path}`);
      });

      const result = await service.assembleAddDeckTemplatePrompt({
        name: 'Test',
        purpose: 'Testing',
      });

      // Should still assemble without throwing
      expect(result).toMatch(/^\/sb-manage:add-deck-template/);
      expect(result).toContain('Template Name: Test');
      // Theme should be marked as unavailable
      expect(result).toContain('Theme: .slide-builder/config/theme/theme.json — unavailable');
      // Other context files should still be present
      expect(result).toContain(mockDesignStandardsMd);
      // Error should be logged
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[PromptAssemblyService] Error reading context file: .slide-builder/config/theme/theme.json')
      );
    });

    // Task 6.3b: Deduplication context includes existing deck template names
    it('includes existing deck template names as deduplication context (AC-4)', async () => {
      mockAllContextFiles();

      const result = await service.assembleAddDeckTemplatePrompt({
        name: 'New Deck',
        purpose: 'Test dedup',
      });

      expect(result).toContain('Deduplication context (existing deck template names):');
      expect(result).toContain('Quarterly Review');
      expect(result).toContain('Team Standup');
    });

    // Logging test
    it('logs assembled prompt length to outputChannel (AC-3)', async () => {
      mockAllContextFiles();

      await service.assembleAddDeckTemplatePrompt({
        name: 'Test',
        purpose: 'Testing',
      });

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[PromptAssemblyService] Assembled add-deck-template prompt')
      );
    });
  });

  // ==========================================================================
  // tm-3-4: assembleEditDeckTemplatePrompt tests (Task 7.2)
  // ==========================================================================

  describe('assembleEditDeckTemplatePrompt (tm-3-4)', () => {
    const mockTemplateConfigYaml = 'name: quarterly-review\nslide_count: 5\nslides:\n  - slide-1.html';

    function mockEditContextFiles() {
      vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
        const path = uri.fsPath as string;
        if (path.includes('theme.json')) return encode(mockThemeJson);
        if (path.includes('design-standards')) return encode(mockDesignStandardsMd);
        if (path.includes('template-config.yaml')) return encode(mockTemplateConfigYaml);
        throw new Error(`Unexpected path: ${path}`);
      });
    }

    it('returns prompt starting with /sb-manage:edit-deck-template (AC-3)', async () => {
      mockEditContextFiles();

      const result = await service.assembleEditDeckTemplatePrompt(
        { changes: 'make header bigger' },
        'quarterly-review',
        'slides/slide-3.html'
      );

      expect(result).toMatch(/^\/sb-manage:edit-deck-template/);
    });

    it('includes templateId, slideFile, and change description in prompt (AC-3)', async () => {
      mockEditContextFiles();

      const result = await service.assembleEditDeckTemplatePrompt(
        { changes: 'make header bigger' },
        'quarterly-review',
        'slides/slide-3.html'
      );

      expect(result).toContain('Template ID: quarterly-review');
      expect(result).toContain('Slide File: slides/slide-3.html');
      expect(result).toContain('Change Description: make header bigger');
    });

    it('includes theme.json, design-standards.md, and template-config.yaml content (AC-3)', async () => {
      mockEditContextFiles();

      const result = await service.assembleEditDeckTemplatePrompt(
        { changes: 'add subtitle area' },
        'quarterly-review',
        'slides/slide-1.html'
      );

      expect(result).toContain(mockThemeJson);
      expect(result).toContain(mockDesignStandardsMd);
      expect(result).toContain(mockTemplateConfigYaml);
    });

    it('reads template-config.yaml from the correct template-specific path (AC-3)', async () => {
      mockEditContextFiles();

      await service.assembleEditDeckTemplatePrompt(
        { changes: 'test' },
        'my-template',
        'slides/slide-1.html'
      );

      // Verify the correct path was used for template-config.yaml
      const readFileCalls = vi.mocked(workspace.fs.readFile).mock.calls;
      const templateConfigCall = readFileCalls.find(
        (call: any) => call[0].fsPath?.includes('my-template/template-config.yaml')
      );
      expect(templateConfigCall).toBeDefined();
    });

    it('assembles prompt with available context when design-standards.md is not found (AC-3)', async () => {
      vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
        const path = uri.fsPath as string;
        if (path.includes('design-standards')) {
          throw FileSystemError.FileNotFound(uri);
        }
        if (path.includes('theme.json')) return encode(mockThemeJson);
        if (path.includes('template-config.yaml')) return encode(mockTemplateConfigYaml);
        throw new Error(`Unexpected path: ${path}`);
      });

      const result = await service.assembleEditDeckTemplatePrompt(
        { changes: 'test' },
        'quarterly-review',
        'slides/slide-1.html'
      );

      expect(result).toMatch(/^\/sb-manage:edit-deck-template/);
      expect(result).toContain('Design Standards: .slide-builder/config/theme/design-standards.md — not found');
      expect(result).toContain(mockThemeJson);
    });

    it('logs assembled prompt with templateId/slideFile and char count (AC-3)', async () => {
      mockEditContextFiles();

      await service.assembleEditDeckTemplatePrompt(
        { changes: 'test' },
        'quarterly-review',
        'slides/slide-3.html'
      );

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[PromptAssemblyService] Assembled edit-deck-template prompt for quarterly-review/slides/slide-3.html')
      );
    });
  });
});
