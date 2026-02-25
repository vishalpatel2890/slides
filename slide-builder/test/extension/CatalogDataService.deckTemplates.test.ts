/**
 * Tests for CatalogDataService.getDeckTemplates().
 * Story Reference: cv-5-2 AC-13 — Deck template loading with category and slideCount
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

// Sample deck templates JSON (array format)
const deckTemplatesJson = JSON.stringify([
  {
    id: 'business-pitch',
    name: 'Business Pitch',
    description: 'Professional pitch deck for investors',
    path: '.slide-builder/templates/business-pitch',
    category: 'Business',
    slideCount: 12,
  },
  {
    id: 'education-course',
    name: 'Course Presentation',
    description: 'Educational course deck template',
    path: '.slide-builder/templates/education-course',
    category: 'Education',
    slideCount: 8,
  },
]);

// Sample deck templates JSON (object format with templates array)
const deckTemplatesObjectJson = JSON.stringify({
  version: '1.0',
  templates: [
    {
      id: 'sample-pitch',
      name: 'Sample Pitch Deck',
      description: 'A simple pitch deck template',
      folder: 'sample-pitch',
      slide_count: 2,
    },
    {
      id: 'rocd-readout',
      name: 'ROCD Executive Readout',
      description: 'Present findings from ROCD workshops',
      folder: 'rocd-executive-readout',
      slide_count: 17,
    },
  ],
});

// Template without category or slideCount
const minimalTemplateJson = JSON.stringify([
  {
    id: 'minimal-deck',
    name: 'Minimal Deck',
    description: 'Basic deck template',
    path: '.slide-builder/templates/minimal',
  },
]);

// Plan.yaml content for slideCount calculation
const planYamlContent = `
deck_name: Test Deck
slides:
  - number: 1
    intent: Title slide
  - number: 2
    intent: Content slide
  - number: 3
    intent: Closing slide
`;

describe('CatalogDataService.getDeckTemplates', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  describe('Basic Loading (AC-13)', () => {
    it('returns empty array when file missing', async () => {
      vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('FileNotFound'));

      const result = await service.getDeckTemplates();
      expect(result).toEqual([]);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringMatching(/No deck-templates\.json found/)
      );
    });

    it('parses deck templates from JSON array', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(deckTemplatesJson));

      const result = await service.getDeckTemplates();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('business-pitch');
      expect(result[0].name).toBe('Business Pitch');
      expect(result[1].id).toBe('education-course');
    });

    it('reads from correct file path', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(JSON.stringify([])));

      await service.getDeckTemplates();

      expect(workspace.fs.readFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fsPath: expect.stringMatching(/\.slide-builder.*config.*catalog.*deck-templates\.json$/),
        })
      );
    });

    it('parses deck templates from { templates: [...] } object format', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(deckTemplatesObjectJson));

      const result = await service.getDeckTemplates();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('sample-pitch');
      expect(result[0].name).toBe('Sample Pitch Deck');
      expect(result[1].id).toBe('rocd-readout');
    });

    it('extracts slide_count (snake_case) from JSON', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(deckTemplatesObjectJson));

      const result = await service.getDeckTemplates();
      expect(result[0].slideCount).toBe(2);
      expect(result[1].slideCount).toBe(17);
    });

    it('uses folder field as path when path not provided', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(deckTemplatesObjectJson));

      const result = await service.getDeckTemplates();
      expect(result[0].path).toBe('sample-pitch');
      expect(result[1].path).toBe('rocd-executive-readout');
    });
  });

  describe('Category Extraction (cv-5-2 AC-12)', () => {
    it('extracts category from deck template JSON', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(deckTemplatesJson));

      const result = await service.getDeckTemplates();
      expect(result[0].category).toBe('Business');
      expect(result[1].category).toBe('Education');
    });

    it('uses "General" as default category when not provided', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(minimalTemplateJson));

      const result = await service.getDeckTemplates();
      expect(result[0].category).toBe('General');
    });
  });

  describe('Slide Count (cv-5-2 AC-12)', () => {
    it('extracts slideCount from JSON when provided', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(deckTemplatesJson));

      const result = await service.getDeckTemplates();
      expect(result[0].slideCount).toBe(12);
      expect(result[1].slideCount).toBe(8);
    });

    it('calculates slideCount from plan.yaml when not in JSON', async () => {
      // First call: deck-templates.json
      // Second call: plan.yaml for minimal-deck
      vi.mocked(workspace.fs.readFile)
        .mockResolvedValueOnce(encode(minimalTemplateJson))
        .mockResolvedValueOnce(encode(planYamlContent));

      const result = await service.getDeckTemplates();
      expect(result[0].slideCount).toBe(3);
    });

    it('keeps slideCount at 0 when plan.yaml missing and not in JSON', async () => {
      vi.mocked(workspace.fs.readFile)
        .mockResolvedValueOnce(encode(minimalTemplateJson))
        .mockRejectedValueOnce(new Error('FileNotFound'));

      const result = await service.getDeckTemplates();
      expect(result[0].slideCount).toBe(0);
    });
  });

  describe('Validation', () => {
    it('filters out entries missing required fields', async () => {
      const mixedTemplates = JSON.stringify([
        { id: 'valid', name: 'Valid Template', description: 'Has all fields', path: '/templates/valid', category: 'General' },
        { name: 'Missing ID', description: 'No id field', path: '/templates/invalid' },
        { id: 'missing-name', description: 'No name field', path: '/templates/invalid' },
      ]);
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(mixedTemplates));

      const result = await service.getDeckTemplates();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('valid');
    });

    it('logs warning on malformed JSON', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode('{ invalid json'));

      const result = await service.getDeckTemplates();
      expect(result).toEqual([]);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringMatching(/No deck-templates\.json found or parse error/)
      );
    });

    it('returns empty array when object has no templates property', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(JSON.stringify({ notTemplates: [] })));

      const result = await service.getDeckTemplates();
      expect(result).toEqual([]);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringMatching(/not an array and has no templates property/)
      );
    });
  });

  describe('Preview URI', () => {
    it('extracts previewUri when provided', async () => {
      const templateWithPreview = JSON.stringify([
        {
          id: 'preview-deck',
          name: 'Preview Deck',
          description: 'Has preview',
          path: '/templates/preview',
          category: 'General',
          slideCount: 5,
          previewUri: 'https://example.com/preview.png',
        },
      ]);
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templateWithPreview));

      const result = await service.getDeckTemplates();
      expect(result[0].previewUri).toBe('https://example.com/preview.png');
    });

    it('handles missing previewUri gracefully', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(deckTemplatesJson));

      const result = await service.getDeckTemplates();
      expect(result[0].previewUri).toBeUndefined();
    });
  });
});
