import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspace, Uri } from 'vscode';
import { DeckTemplateConfigService } from '../../src/extension/DeckTemplateConfigService';

// Valid template-config.yaml content
const VALID_CONFIG_YAML = `# Company Overview Template
name: Company Overview
description: A standard company overview deck
version: "1.0"
slide_count: 2
required_context:
  - name: client_name
    type: string
    description: Name of the client
    prompt: What is the client name?
optional_context:
  - name: date
    type: date
    description: Presentation date
    default: today
slides:
  # Title slide
  - number: 1
    name: Title Slide
    file: slides/slide-1.html
    instructions: |
      Replace the title placeholder with the company name.
    content_sources:
      - type: user_input
        field: company_name
        fallback: Ask user for company name
  # Overview slide
  - number: 2
    name: Overview
    file: slides/slide-2.html
    instructions: |
      Fill in the overview section with company details.
    content_sources:
      - type: web_search
        query: "{client_name} company overview"
        extract:
          - summary
          - key_facts
checkpoints:
  after_each_slide: true
  validation_rules:
    - All placeholders must be replaced
    - Images must have alt text
  user_interaction:
    on_incomplete: ask
    on_uncertain: ask
    on_quality_fail: retry
`;

const MALFORMED_YAML = `name: Test
slides:
  - number: 1
    name: [invalid
`;

const INVALID_CONFIG_YAML = `name: Missing Fields
version: "1.0"
`;

function createService() {
  const workspaceRoot = { fsPath: '/mock/workspace', toString: () => '/mock/workspace' } as any;
  const outputChannel = {
    appendLine: vi.fn(),
    append: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
    name: 'Test',
  } as any;

  const service = new DeckTemplateConfigService(workspaceRoot, outputChannel);
  return { service, outputChannel, workspaceRoot };
}

function mockReadFile(content: string) {
  vi.mocked(workspace.fs.readFile).mockResolvedValueOnce(
    new TextEncoder().encode(content),
  );
}

describe('DeckTemplateConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load and parse a valid template-config.yaml (AC-1)', async () => {
      const { service } = createService();
      mockReadFile(VALID_CONFIG_YAML);

      const config = await service.loadConfig('company-overview');

      expect(config.name).toBe('Company Overview');
      expect(config.description).toBe('A standard company overview deck');
      expect(config.version).toBe('1.0');
      expect(config.slide_count).toBe(2);
      expect(config.slides).toHaveLength(2);
      expect(config.slides[0].number).toBe(1);
      expect(config.slides[0].name).toBe('Title Slide');
      expect(config.slides[0].file).toBe('slides/slide-1.html');
      expect(config.slides[0].content_sources).toHaveLength(1);
      expect(config.slides[0].content_sources[0].type).toBe('user_input');
      expect(config.slides[1].content_sources[0].type).toBe('web_search');
      expect(config.required_context).toHaveLength(1);
      expect(config.required_context[0].name).toBe('client_name');
      expect(config.optional_context).toHaveLength(1);
      expect(config.checkpoints.after_each_slide).toBe(true);
      expect(config.checkpoints.user_interaction.on_incomplete).toBe('ask');
    });

    it('should return meaningful error with offset for malformed YAML (AC-2)', async () => {
      const { service } = createService();
      mockReadFile(MALFORMED_YAML);

      await expect(service.loadConfig('bad-template')).rejects.toThrow(/YAML parse error/);
    });

    it('should return validation error for invalid config shape', async () => {
      const { service } = createService();
      mockReadFile(INVALID_CONFIG_YAML);

      await expect(service.loadConfig('invalid-template')).rejects.toThrow(
        /Invalid template config/,
      );
    });

    it('should throw when config file does not exist', async () => {
      const { service } = createService();
      vi.mocked(workspace.fs.readFile).mockRejectedValueOnce(new Error('File not found'));

      await expect(service.loadConfig('nonexistent')).rejects.toThrow(/Template config not found/);
    });

    it('should cache config on subsequent calls (AC-4)', async () => {
      const { service } = createService();
      mockReadFile(VALID_CONFIG_YAML);

      const first = await service.loadConfig('cached-template');
      const second = await service.loadConfig('cached-template');

      // readFile should only be called once
      expect(workspace.fs.readFile).toHaveBeenCalledTimes(1);
      expect(first).toBe(second);
    });

    it('should load different templates independently', async () => {
      const { service } = createService();
      mockReadFile(VALID_CONFIG_YAML);

      const altYaml = VALID_CONFIG_YAML.replace('name: Company Overview', 'name: Alt Template');
      mockReadFile(altYaml);

      const config1 = await service.loadConfig('template-a');
      const config2 = await service.loadConfig('template-b');

      expect(config1.name).toBe('Company Overview');
      expect(config2.name).toBe('Alt Template');
    });
  });

  describe('saveConfig', () => {
    it('should save config preserving top-level YAML comments (AC-3)', async () => {
      const { service } = createService();
      mockReadFile(VALID_CONFIG_YAML);

      // Load first to populate caches
      const config = await service.loadConfig('test-template');

      // Modify a top-level scalar and save
      const updated = { ...config, name: 'Updated Name' };
      await service.saveConfig('test-template', updated);

      expect(workspace.fs.writeFile).toHaveBeenCalledTimes(1);
      const writtenBytes = vi.mocked(workspace.fs.writeFile).mock.calls[0][1];
      const writtenText = new TextDecoder().decode(writtenBytes as Uint8Array);

      // Top-level comment is preserved via Document API
      expect(writtenText).toContain('# Company Overview Template');
      // Updated value should be present
      expect(writtenText).toContain('Updated Name');
      // Structural content should be present
      expect(writtenText).toContain('slide_count: 2');
      expect(writtenText).toContain('slides:');
    });

    it('should save config without cached Document (fresh)', async () => {
      const { service } = createService();

      const config = {
        name: 'Fresh Config',
        description: 'A fresh config',
        version: '1.0',
        slide_count: 1,
        required_context: [],
        optional_context: [],
        slides: [
          {
            number: 1,
            name: 'Slide 1',
            file: 'slides/slide-1.html',
            instructions: 'Do something',
            content_sources: [],
          },
        ],
        checkpoints: {
          after_each_slide: false,
          validation_rules: [],
          user_interaction: {
            on_incomplete: 'ask' as const,
            on_uncertain: 'skip' as const,
            on_quality_fail: 'retry' as const,
          },
        },
      };

      await service.saveConfig('fresh-template', config);

      expect(workspace.fs.writeFile).toHaveBeenCalledTimes(1);
      const writtenBytes = vi.mocked(workspace.fs.writeFile).mock.calls[0][1];
      const writtenText = new TextDecoder().decode(writtenBytes as Uint8Array);
      expect(writtenText).toContain('Fresh Config');
    });
  });

  describe('saveSlideInstructions', () => {
    it('should update only the target slide instructions (partial update)', async () => {
      const { service } = createService();
      mockReadFile(VALID_CONFIG_YAML);

      await service.saveSlideInstructions('test-template', 1, 'New instructions for slide 1');

      expect(workspace.fs.writeFile).toHaveBeenCalledTimes(1);
      const writtenBytes = vi.mocked(workspace.fs.writeFile).mock.calls[0][1];
      const writtenText = new TextDecoder().decode(writtenBytes as Uint8Array);

      expect(writtenText).toContain('New instructions for slide 1');
      // Other slide's instructions should remain
      expect(writtenText).toContain('Fill in the overview section');
    });

    it('should throw for out-of-range slide number', async () => {
      const { service } = createService();
      mockReadFile(VALID_CONFIG_YAML);

      await expect(
        service.saveSlideInstructions('test-template', 99, 'Invalid'),
      ).rejects.toThrow(/Slide 99 not found/);
    });
  });

  describe('saveContentSources', () => {
    it('should update only the target slide content sources', async () => {
      const { service } = createService();
      mockReadFile(VALID_CONFIG_YAML);

      const newSources = [
        { type: 'file' as const, path: 'data/overview.md' },
        { type: 'mcp_tool' as const, tool: 'fetch_data' },
      ];

      await service.saveContentSources('test-template', 2, newSources);

      expect(workspace.fs.writeFile).toHaveBeenCalledTimes(1);
      const writtenBytes = vi.mocked(workspace.fs.writeFile).mock.calls[0][1];
      const writtenText = new TextDecoder().decode(writtenBytes as Uint8Array);

      expect(writtenText).toContain('data/overview.md');
      expect(writtenText).toContain('fetch_data');
    });
  });

  describe('getSlideHtml', () => {
    it('should read and return HTML file content', async () => {
      const { service } = createService();
      const htmlContent = '<div class="slide">Hello World</div>';
      mockReadFile(htmlContent);

      const result = await service.getSlideHtml('test-template', 'slides/slide-1.html');
      expect(result).toBe(htmlContent);
    });

    it('should throw when HTML file not found', async () => {
      const { service } = createService();
      vi.mocked(workspace.fs.readFile).mockRejectedValueOnce(new Error('Not found'));

      await expect(
        service.getSlideHtml('test-template', 'slides/nonexistent.html'),
      ).rejects.toThrow(/Slide HTML not found/);
    });
  });

  describe('validateConfig', () => {
    it('should pass for valid config', () => {
      const { service } = createService();

      const result = service.validateConfig({
        name: 'Test',
        description: 'A test',
        version: '1.0',
        slide_count: 1,
        required_context: [],
        optional_context: [],
        slides: [{ number: 1, name: 'Slide', file: 's.html', instructions: '', content_sources: [] }],
        checkpoints: { after_each_slide: false, validation_rules: [], user_interaction: {} },
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with specific errors for invalid config', () => {
      const { service } = createService();

      const result = service.validateConfig({
        name: 123, // should be string
        // missing description, version, slide_count, slides
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid field: name (string)');
      expect(result.errors).toContain('Missing or invalid field: description (string)');
      expect(result.errors).toContain('Missing or invalid field: version (string)');
      expect(result.errors).toContain('Missing or invalid field: slide_count (number)');
      expect(result.errors).toContain('Missing or invalid field: slides (array)');
    });

    it('should fail when slides length does not match slide_count', () => {
      const { service } = createService();

      const result = service.validateConfig({
        name: 'Test',
        description: 'A test',
        version: '1.0',
        slide_count: 3,
        slides: [{ number: 1 }],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('does not match slide_count'))).toBe(true);
    });

    it('should fail for null config', () => {
      const { service } = createService();
      const result = service.validateConfig(null);
      expect(result.valid).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should invalidate cache for a template', async () => {
      const { service } = createService();
      mockReadFile(VALID_CONFIG_YAML);
      await service.loadConfig('test-template');

      service.invalidateCache('test-template');

      // Next load should read file again
      mockReadFile(VALID_CONFIG_YAML);
      await service.loadConfig('test-template');

      expect(workspace.fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should clear all caches on dispose', async () => {
      const { service } = createService();
      mockReadFile(VALID_CONFIG_YAML);
      await service.loadConfig('test-template');

      service.dispose();

      // Next load should read file again
      mockReadFile(VALID_CONFIG_YAML);
      await service.loadConfig('test-template');

      expect(workspace.fs.readFile).toHaveBeenCalledTimes(2);
    });
  });
});
