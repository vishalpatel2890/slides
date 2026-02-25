/**
 * Tests for CatalogDataService.scanSlideTemplates().
 * Story Reference: cv-5-1 Task 1, Task 10 — Slide template scanning
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspace, Uri } from 'vscode';
import { CatalogDataService } from '../../src/extension/CatalogDataService';

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

// Sample slide templates JSON in object format
const slideTemplatesObjectJson = JSON.stringify({
  templates: [
    {
      id: 'title-basic',
      name: 'Basic Title',
      description: 'Simple centered title slide',
      category: 'Title',
      use_cases: ['Opening slides', 'Section dividers'],
    },
    {
      id: 'content-bullets',
      name: 'Bullet Points',
      description: 'Standard content slide with bullets',
      category: 'Content',
      use_cases: ['Body content', 'Feature lists'],
    },
  ],
});

// Sample slide templates JSON in array format
const slideTemplatesArrayJson = JSON.stringify([
  {
    id: 'data-chart',
    name: 'Chart Slide',
    description: 'Data visualization with charts',
    category: 'Data',
    use_cases: ['Data presentation'],
  },
  {
    id: 'image-full',
    name: 'Full Bleed Image',
    description: 'Edge-to-edge image slide',
    category: 'Image',
    use_cases: ['Visual impact', 'Photography'],
  },
]);

describe('CatalogDataService.scanSlideTemplates', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  it('returns empty array when file missing (AC-3)', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('FileNotFound'));

    const result = await service.scanSlideTemplates();
    expect(result).toEqual([]);
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/No slide-templates\.json found/)
    );
  });

  it('parses { templates: [...] } format', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(slideTemplatesObjectJson));

    const result = await service.scanSlideTemplates();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('title-basic');
    expect(result[0].name).toBe('Basic Title');
    expect(result[0].category).toBe('Title');
    expect(result[1].id).toBe('content-bullets');
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Loaded 2 slide templates/)
    );
  });

  it('parses direct array [...] format', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(slideTemplatesArrayJson));

    const result = await service.scanSlideTemplates();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('data-chart');
    expect(result[0].category).toBe('Data');
    expect(result[1].id).toBe('image-full');
    expect(result[1].category).toBe('Image');
  });

  it('extracts category from each entry', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(slideTemplatesObjectJson));

    const result = await service.scanSlideTemplates();
    expect(result[0].category).toBe('Title');
    expect(result[1].category).toBe('Content');
  });

  it('uses default category when not provided', async () => {
    const templateWithoutCategory = JSON.stringify([
      {
        id: 'no-category',
        name: 'No Category Template',
        description: 'Template without category',
        use_cases: [],
      },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templateWithoutCategory));

    const result = await service.scanSlideTemplates();
    expect(result[0].category).toBe('Content'); // Default category
  });

  it('logs warning on malformed JSON', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode('{ invalid json'));

    const result = await service.scanSlideTemplates();
    expect(result).toEqual([]);
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/No slide-templates\.json found or parse error/)
    );
  });

  it('handles empty templates array', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(JSON.stringify({ templates: [] })));

    const result = await service.scanSlideTemplates();
    expect(result).toEqual([]);
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Loaded 0 slide templates/)
    );
  });

  it('filters out entries missing required fields', async () => {
    const mixedTemplates = JSON.stringify([
      { id: 'valid', name: 'Valid Template', description: 'Has all fields', category: 'Title', use_cases: [] },
      { name: 'Missing ID', description: 'No id field', category: 'Title' }, // Missing id
      { id: 'missing-name', description: 'No name field', category: 'Title' }, // Missing name
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(mixedTemplates));

    const result = await service.scanSlideTemplates();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('valid');
  });

  it('preserves use_cases array', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(slideTemplatesObjectJson));

    const result = await service.scanSlideTemplates();
    expect(result[0].use_cases).toEqual(['Opening slides', 'Section dividers']);
    expect(result[1].use_cases).toEqual(['Body content', 'Feature lists']);
  });

  it('handles missing use_cases gracefully', async () => {
    const templateWithoutUseCases = JSON.stringify([
      {
        id: 'no-use-cases',
        name: 'No Use Cases',
        description: 'Template without use_cases',
        category: 'Title',
      },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templateWithoutUseCases));

    const result = await service.scanSlideTemplates();
    expect(result[0].use_cases).toEqual([]);
  });

  it('reads from correct file path', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(JSON.stringify([])));

    await service.scanSlideTemplates();

    expect(workspace.fs.readFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fsPath: expect.stringMatching(/\.slide-builder.*config.*catalog.*slide-templates\.json$/),
      })
    );
  });

  it('logs unexpected structure error', async () => {
    // Neither array nor object with templates property
    const unexpectedJson = JSON.stringify({ notTemplates: [] });
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(unexpectedJson));

    const result = await service.scanSlideTemplates();
    expect(result).toEqual([]);
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/unexpected structure/)
    );
  });
});

// =============================================================================
// v3-2-3: Template Metadata Tests
// Story Reference: v3-2-3 Task 6.1, 6.2
// =============================================================================

describe('CatalogDataService.loadTemplateMetadata', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  it('returns metadata from template entry (AC-3, AC-4, AC-5)', async () => {
    const templatesWithMetadata = JSON.stringify([
      {
        id: 'title-basic',
        name: 'Basic Title',
        description: 'Simple title slide',
        category: 'Title',
        ai_prompt: 'Create a centered title slide...',
        placeholder_guidance: 'Replace [title] with your text...',
        style_rules: 'Use brand colors for background...',
      },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templatesWithMetadata));

    const result = await service.loadTemplateMetadata('title-basic');

    expect(result.aiPrompt).toBe('Create a centered title slide...');
    expect(result.placeholderGuidance).toBe('Replace [title] with your text...');
    expect(result.styleRules).toBe('Use brand colors for background...');
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Template metadata loaded: title-basic/)
    );
  });

  it('returns empty strings for missing metadata fields', async () => {
    const templatesNoMetadata = JSON.stringify([
      {
        id: 'no-metadata',
        name: 'No Metadata',
        description: 'Template without metadata fields',
        category: 'Content',
      },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templatesNoMetadata));

    const result = await service.loadTemplateMetadata('no-metadata');

    expect(result.aiPrompt).toBe('');
    expect(result.placeholderGuidance).toBe('');
    expect(result.styleRules).toBe('');
  });

  it('returns empty metadata for unknown template ID', async () => {
    const templates = JSON.stringify([
      { id: 'existing', name: 'Existing Template', description: '', category: 'Title' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templates));

    const result = await service.loadTemplateMetadata('unknown-id');

    expect(result.aiPrompt).toBe('');
    expect(result.placeholderGuidance).toBe('');
    expect(result.styleRules).toBe('');
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Template not found for metadata load: unknown-id/)
    );
  });

  it('handles { templates: [...] } object format', async () => {
    const wrappedFormat = JSON.stringify({
      templates: [
        {
          id: 'wrapped-template',
          name: 'Wrapped Template',
          ai_prompt: 'Wrapped AI prompt',
          placeholder_guidance: 'Wrapped guidance',
          style_rules: 'Wrapped style rules',
        },
      ],
    });
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(wrappedFormat));

    const result = await service.loadTemplateMetadata('wrapped-template');

    expect(result.aiPrompt).toBe('Wrapped AI prompt');
    expect(result.placeholderGuidance).toBe('Wrapped guidance');
    expect(result.styleRules).toBe('Wrapped style rules');
  });

  it('returns empty metadata on file read error', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('FileNotFound'));

    const result = await service.loadTemplateMetadata('any-id');

    expect(result.aiPrompt).toBe('');
    expect(result.placeholderGuidance).toBe('');
    expect(result.styleRules).toBe('');
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Failed to load template metadata/)
    );
  });
});

describe('CatalogDataService.saveTemplateMetadata', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  it('writes updated metadata to template entry (AC-6)', async () => {
    const existingTemplates = JSON.stringify([
      {
        id: 'title-basic',
        name: 'Basic Title',
        description: 'Simple title slide',
        category: 'Title',
      },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(existingTemplates));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.saveTemplateMetadata('title-basic', {
      aiPrompt: 'New AI prompt',
      placeholderGuidance: 'New guidance',
      styleRules: 'New style rules',
    });

    expect(workspace.fs.writeFile).toHaveBeenCalledTimes(1);
    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(new TextDecoder().decode(writeCall[1]));

    expect(writtenContent[0].ai_prompt).toBe('New AI prompt');
    expect(writtenContent[0].placeholder_guidance).toBe('New guidance');
    expect(writtenContent[0].style_rules).toBe('New style rules');
    // Preserves existing fields
    expect(writtenContent[0].name).toBe('Basic Title');
    expect(writtenContent[0].category).toBe('Title');
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Template metadata saved: title-basic/)
    );
  });

  it('preserves other template entries when saving', async () => {
    const existingTemplates = JSON.stringify([
      { id: 'template-a', name: 'Template A', description: 'A', category: 'Title' },
      { id: 'template-b', name: 'Template B', description: 'B', category: 'Content' },
      { id: 'template-c', name: 'Template C', description: 'C', category: 'Data' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(existingTemplates));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.saveTemplateMetadata('template-b', {
      aiPrompt: 'Updated B prompt',
      placeholderGuidance: '',
      styleRules: '',
    });

    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(new TextDecoder().decode(writeCall[1]));

    expect(writtenContent).toHaveLength(3);
    expect(writtenContent[0].id).toBe('template-a');
    expect(writtenContent[1].id).toBe('template-b');
    expect(writtenContent[1].ai_prompt).toBe('Updated B prompt');
    expect(writtenContent[2].id).toBe('template-c');
  });

  it('handles { templates: [...] } object format and preserves structure', async () => {
    const wrappedFormat = JSON.stringify({
      version: '1.0',
      templates: [
        { id: 'wrapped-template', name: 'Wrapped', description: '', category: 'Title' },
      ],
    });
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(wrappedFormat));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.saveTemplateMetadata('wrapped-template', {
      aiPrompt: 'Wrapped prompt',
      placeholderGuidance: 'Wrapped guidance',
      styleRules: 'Wrapped rules',
    });

    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(new TextDecoder().decode(writeCall[1]));

    // Should preserve the wrapped structure
    expect(writtenContent.version).toBe('1.0');
    expect(writtenContent.templates).toBeDefined();
    expect(writtenContent.templates[0].ai_prompt).toBe('Wrapped prompt');
  });

  it('throws error for unknown template ID', async () => {
    const templates = JSON.stringify([
      { id: 'existing', name: 'Existing', description: '', category: 'Title' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templates));

    await expect(
      service.saveTemplateMetadata('unknown-id', {
        aiPrompt: 'test',
        placeholderGuidance: '',
        styleRules: '',
      })
    ).rejects.toThrow('Template not found: unknown-id');
  });
});

// =============================================================================
// tm-1-2: Slide Template Schema Tests
// Story Reference: tm-1-2 AC1, AC3, Task 1
// =============================================================================

describe('CatalogDataService.saveSlideTemplateSchema', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  it('writes updated schema fields to template entry (AC1)', async () => {
    const existingTemplates = JSON.stringify([
      {
        id: 'hero-title',
        name: 'Hero Title',
        description: 'Old description',
        use_cases: ['old-use'],
        background_mode: 'dark',
        category: 'Title',
        file: 'templates/hero-title.html',
      },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(existingTemplates));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.saveSlideTemplateSchema('hero-title', {
      name: 'Hero Title Updated',
      description: 'New description',
      use_cases: ['opening', 'section divider'],
      background_mode: 'light',
    });

    expect(workspace.fs.writeFile).toHaveBeenCalledTimes(1);
    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(new TextDecoder().decode(writeCall[1]));

    expect(writtenContent[0].name).toBe('Hero Title Updated');
    expect(writtenContent[0].description).toBe('New description');
    expect(writtenContent[0].use_cases).toEqual(['opening', 'section divider']);
    expect(writtenContent[0].background_mode).toBe('light');
    // Preserves non-schema fields
    expect(writtenContent[0].category).toBe('Title');
    expect(writtenContent[0].file).toBe('templates/hero-title.html');
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Saved slide template schema: hero-title/)
    );
  });

  it('preserves other template entries when saving (AC1)', async () => {
    const existingTemplates = JSON.stringify([
      { id: 'template-a', name: 'Template A', description: 'A', use_cases: [], category: 'Title' },
      { id: 'template-b', name: 'Template B', description: 'B', use_cases: ['x'], category: 'Content' },
      { id: 'template-c', name: 'Template C', description: 'C', use_cases: [], category: 'Data' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(existingTemplates));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.saveSlideTemplateSchema('template-b', {
      name: 'Updated B',
      description: 'Updated B description',
      use_cases: ['updated'],
      background_mode: 'dark',
    });

    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(new TextDecoder().decode(writeCall[1]));

    expect(writtenContent).toHaveLength(3);
    expect(writtenContent[0].id).toBe('template-a');
    expect(writtenContent[0].name).toBe('Template A'); // unchanged
    expect(writtenContent[1].id).toBe('template-b');
    expect(writtenContent[1].name).toBe('Updated B');
    expect(writtenContent[2].id).toBe('template-c');
    expect(writtenContent[2].name).toBe('Template C'); // unchanged
  });

  it('handles { templates: [...] } object format and preserves wrapper (AC1)', async () => {
    const wrappedFormat = JSON.stringify({
      version: '2.0',
      templates: [
        { id: 'wrapped-template', name: 'Wrapped', description: 'Old', use_cases: [], category: 'Title' },
      ],
    });
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(wrappedFormat));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.saveSlideTemplateSchema('wrapped-template', {
      name: 'Wrapped Updated',
      description: 'New description',
      use_cases: ['new-use'],
      background_mode: 'dark',
    });

    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(new TextDecoder().decode(writeCall[1]));

    // Should preserve the wrapped structure and version field
    expect(writtenContent.version).toBe('2.0');
    expect(writtenContent.templates).toBeDefined();
    expect(writtenContent.templates[0].name).toBe('Wrapped Updated');
    expect(writtenContent.templates[0].description).toBe('New description');
    expect(writtenContent.templates[0].use_cases).toEqual(['new-use']);
    expect(writtenContent.templates[0].background_mode).toBe('dark');
  });

  it('throws error for unknown template ID (AC3)', async () => {
    const templates = JSON.stringify([
      { id: 'existing', name: 'Existing', description: '', use_cases: [], category: 'Title' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templates));

    await expect(
      service.saveSlideTemplateSchema('unknown-id', {
        name: 'test',
        description: 'test',
        use_cases: [],
        background_mode: 'dark',
      })
    ).rejects.toThrow('Template not found: unknown-id');
  });

  it('reads from and writes to correct file path', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(
      encode(JSON.stringify([{ id: 'hero-title', name: 'Hero', description: '', use_cases: [] }]))
    );
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.saveSlideTemplateSchema('hero-title', {
      name: 'Updated',
      description: 'Updated',
      use_cases: [],
      background_mode: 'dark',
    });

    expect(workspace.fs.readFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fsPath: expect.stringMatching(/\.slide-builder.*config.*catalog.*slide-templates\.json$/),
      })
    );
    // Verify write went to the same path
    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    expect(writeCall[0].fsPath).toMatch(/\.slide-builder.*config.*catalog.*slide-templates\.json$/);
  });

  it('propagates filesystem errors (AC3)', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('Permission denied'));

    await expect(
      service.saveSlideTemplateSchema('hero-title', {
        name: 'test',
        description: 'test',
        use_cases: [],
        background_mode: 'dark',
      })
    ).rejects.toThrow('Permission denied');

    expect(workspace.fs.writeFile).not.toHaveBeenCalled();
  });
});

// =============================================================================
// tm-1-3: Delete Slide Template Tests
// Story Reference: tm-1-3 AC3, AC6, AC7, Task 2
// =============================================================================

describe('CatalogDataService.deleteSlideTemplate', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  it('removes template entry from JSON and deletes HTML file (AC3)', async () => {
    const existingTemplates = JSON.stringify([
      {
        id: 'hero-title',
        name: 'Hero Title',
        description: 'Bold title slide',
        use_cases: ['opening'],
        category: 'Title',
        file: 'templates/hero-title.html',
      },
      {
        id: 'content-grid',
        name: 'Content Grid',
        description: 'Grid layout',
        use_cases: ['content'],
        category: 'Content',
        file: 'templates/content-grid.html',
      },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(existingTemplates));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(workspace.fs.delete).mockResolvedValue(undefined);

    const result = await service.deleteSlideTemplate('hero-title');

    // Entry removed from JSON
    expect(workspace.fs.writeFile).toHaveBeenCalledTimes(1);
    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(new TextDecoder().decode(writeCall[1]));
    expect(writtenContent).toHaveLength(1);
    expect(writtenContent[0].id).toBe('content-grid');

    // HTML file deleted
    expect(workspace.fs.delete).toHaveBeenCalledTimes(1);
    const deleteCall = vi.mocked(workspace.fs.delete).mock.calls[0];
    expect(deleteCall[0].fsPath).toMatch(/templates\/hero-title\.html$/);
    expect(deleteCall[1]).toEqual({ useTrash: true });

    // Returns deleted file path
    expect(result).toEqual({ deletedFile: 'templates/hero-title.html' });

    // Logs operation
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Deleted slide template: hero-title/)
    );
  });

  it('preserves wrapped { templates: [...] } format (AC3)', async () => {
    const wrappedFormat = JSON.stringify({
      version: '2.0',
      templates: [
        { id: 'template-a', name: 'A', description: '', use_cases: [], file: 'templates/a.html' },
        { id: 'template-b', name: 'B', description: '', use_cases: [], file: 'templates/b.html' },
      ],
    });
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(wrappedFormat));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(workspace.fs.delete).mockResolvedValue(undefined);

    await service.deleteSlideTemplate('template-a');

    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(new TextDecoder().decode(writeCall[1]));

    // Preserves wrapper structure
    expect(writtenContent.version).toBe('2.0');
    expect(writtenContent.templates).toHaveLength(1);
    expect(writtenContent.templates[0].id).toBe('template-b');
  });

  it('throws error for unknown template ID (AC3)', async () => {
    const templates = JSON.stringify([
      { id: 'existing', name: 'Existing', description: '', use_cases: [], file: 'templates/existing.html' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templates));

    await expect(
      service.deleteSlideTemplate('unknown-id')
    ).rejects.toThrow('Template not found: unknown-id');

    // No write or delete called
    expect(workspace.fs.writeFile).not.toHaveBeenCalled();
    expect(workspace.fs.delete).not.toHaveBeenCalled();
  });

  it('proceeds even if HTML file delete fails (AC7)', async () => {
    const templates = JSON.stringify([
      { id: 'hero-title', name: 'Hero Title', description: '', use_cases: [], file: 'templates/hero-title.html' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templates));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(workspace.fs.delete).mockRejectedValue(new Error('File locked'));

    // Should not throw — HTML delete failure is non-fatal
    const result = await service.deleteSlideTemplate('hero-title');
    expect(result).toEqual({ deletedFile: 'templates/hero-title.html' });

    // JSON still written (entry removed)
    expect(workspace.fs.writeFile).toHaveBeenCalledTimes(1);

    // Warning logged
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Warning.*could not delete template file/)
    );
  });

  it('propagates read error (AC6)', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('Permission denied'));

    await expect(
      service.deleteSlideTemplate('hero-title')
    ).rejects.toThrow('Permission denied');

    expect(workspace.fs.writeFile).not.toHaveBeenCalled();
    expect(workspace.fs.delete).not.toHaveBeenCalled();
  });
});

// =============================================================================
// tm-1-4: reorderSlideTemplates() Tests
// Story Reference: tm-1-4 Task 9.3
// =============================================================================

describe('CatalogDataService.reorderSlideTemplates', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  it('reorders templates in direct array format (AC4)', async () => {
    const templates = JSON.stringify([
      { id: 'alpha', name: 'Alpha', description: '', use_cases: [], category: 'Title' },
      { id: 'beta', name: 'Beta', description: '', use_cases: [], category: 'Content' },
      { id: 'gamma', name: 'Gamma', description: '', use_cases: [], category: 'Data' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templates));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.reorderSlideTemplates(['gamma', 'alpha', 'beta']);

    expect(workspace.fs.writeFile).toHaveBeenCalledTimes(1);
    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const written = JSON.parse(new TextDecoder().decode(writeCall[1]));
    expect(written).toHaveLength(3);
    expect(written[0].id).toBe('gamma');
    expect(written[1].id).toBe('alpha');
    expect(written[2].id).toBe('beta');
  });

  it('reorders templates in wrapped { templates: [...] } format (AC4)', async () => {
    const wrappedFormat = JSON.stringify({
      version: '2.0',
      templates: [
        { id: 'alpha', name: 'Alpha', description: '', use_cases: [], category: 'Title' },
        { id: 'beta', name: 'Beta', description: '', use_cases: [], category: 'Content' },
        { id: 'gamma', name: 'Gamma', description: '', use_cases: [], category: 'Data' },
      ],
    });
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(wrappedFormat));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.reorderSlideTemplates(['gamma', 'alpha', 'beta']);

    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const written = JSON.parse(new TextDecoder().decode(writeCall[1]));

    // Preserves wrapper structure
    expect(written.version).toBe('2.0');
    expect(written.templates).toHaveLength(3);
    expect(written.templates[0].id).toBe('gamma');
    expect(written.templates[1].id).toBe('alpha');
    expect(written.templates[2].id).toBe('beta');
  });

  it('writes JSON with 2-space indent (AC4)', async () => {
    const templates = JSON.stringify([
      { id: 'alpha', name: 'Alpha', description: '', use_cases: [], category: 'Title' },
      { id: 'beta', name: 'Beta', description: '', use_cases: [], category: 'Content' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templates));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.reorderSlideTemplates(['beta', 'alpha']);

    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    const rawOutput = new TextDecoder().decode(writeCall[1]);
    // Verify pretty-printed JSON (2-space indent)
    expect(rawOutput).toContain('  "id": "beta"');
  });

  it('reads from correct file path (AC4)', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(JSON.stringify([])));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.reorderSlideTemplates([]);

    expect(workspace.fs.readFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fsPath: expect.stringMatching(/\.slide-builder.*config.*catalog.*slide-templates\.json$/),
      })
    );
  });

  it('logs success message with template count (AC4)', async () => {
    const templates = JSON.stringify([
      { id: 'alpha', name: 'Alpha', description: '', use_cases: [], category: 'Title' },
      { id: 'beta', name: 'Beta', description: '', use_cases: [], category: 'Content' },
      { id: 'gamma', name: 'Gamma', description: '', use_cases: [], category: 'Data' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templates));
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.reorderSlideTemplates(['gamma', 'alpha', 'beta']);

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Reordered slide templates: \[3 templates\]/)
    );
  });

  it('propagates read error so handler can respond with success: false (AC7)', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('Disk error'));

    await expect(
      service.reorderSlideTemplates(['alpha', 'beta'])
    ).rejects.toThrow('Disk error');

    expect(workspace.fs.writeFile).not.toHaveBeenCalled();
  });

  it('propagates write error so handler can respond with success: false (AC7)', async () => {
    const templates = JSON.stringify([
      { id: 'alpha', name: 'Alpha', description: '', use_cases: [], category: 'Title' },
    ]);
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templates));
    vi.mocked(workspace.fs.writeFile).mockRejectedValue(new Error('Write permission denied'));

    await expect(
      service.reorderSlideTemplates(['alpha'])
    ).rejects.toThrow('Write permission denied');
  });
});

// =============================================================================
// slide-template-preview-3: getSlideTemplateHtml() Tests
// Story Reference: slide-template-preview-3 Task 4, AC-1, AC-2
// =============================================================================

describe('CatalogDataService.getSlideTemplateHtml', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  it('returns HTML for valid templateId (AC-1)', async () => {
    const htmlContent = '<div class="slide">Template Content</div>';
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(htmlContent));

    const result = await service.getSlideTemplateHtml('title-slide');

    expect(result).toBe(htmlContent);
    expect(workspace.fs.readFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fsPath: expect.stringMatching(/\.slide-builder.*config.*catalog.*slide-templates.*title-slide\.html$/),
      })
    );
  });

  it('throws error for non-existent templateId (AC-2)', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('File not found'));

    await expect(
      service.getSlideTemplateHtml('invalid-template')
    ).rejects.toThrow('Template HTML not found: invalid-template');
  });

  it('reads from correct file path (AC-1)', async () => {
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode('<div>Test</div>'));

    await service.getSlideTemplateHtml('bullet-points');

    expect(workspace.fs.readFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fsPath: expect.stringMatching(
          /\.slide-builder\/config\/catalog\/slide-templates\/bullet-points\.html$/
        ),
      })
    );
  });

  it('logs error to output channel on failure (AC-2)', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('File not found'));

    await expect(
      service.getSlideTemplateHtml('missing-template')
    ).rejects.toThrow();

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Failed to read template HTML: missing-template/)
    );
  });

  it('decodes bytes correctly (AC-1)', async () => {
    const htmlContent = '<div class="slide"><h1>Test Slide</h1><p>Content</p></div>';
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(htmlContent));

    const result = await service.getSlideTemplateHtml('test-template');

    expect(result).toBe(htmlContent);
    expect(typeof result).toBe('string');
  });

  it('handles template IDs with hyphens and underscores', async () => {
    const htmlContent = '<div>Template</div>';
    vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(htmlContent));

    await service.getSlideTemplateHtml('hero_title-v2');

    expect(workspace.fs.readFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fsPath: expect.stringMatching(/hero_title-v2\.html$/),
      })
    );
  });
});
