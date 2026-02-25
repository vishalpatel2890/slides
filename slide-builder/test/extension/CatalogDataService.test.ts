/**
 * Tests for CatalogDataService — scanning output/ for deck directories,
 * status computation, and detail retrieval.
 *
 * Story Reference: cv-1-3 AC-1, AC-2, AC-3, AC-6, AC-7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspace, Uri, FileType } from 'vscode';
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

describe('CatalogDataService', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  describe('scanDecks', () => {
    it('returns empty array when output/ does not exist (AC-6)', async () => {
      vi.mocked(workspace.fs.readDirectory).mockRejectedValueOnce(
        new Error('FileNotFound')
      );

      const result = await service.scanDecks();
      expect(result).toEqual([]);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('output/ not found, returning empty')
      );
    });

    it('returns empty array when output/ is empty (AC-6)', async () => {
      vi.mocked(workspace.fs.readDirectory).mockResolvedValueOnce([]);

      const result = await service.scanDecks();
      expect(result).toEqual([]);
    });

    it('discovers decks with valid plan.yaml (AC-1, AC-2)', async () => {
      const plan1 = `deck_name: "Test Deck 1"\naudience: "Developers"\nslides:\n  - number: 1\n    description: "Intro"\n  - number: 2\n    description: "Main"`;
      const plan2 = `deck_name: "Test Deck 2"\nslides:\n  - number: 1\n    description: "Only slide"`;

      vi.mocked(workspace.fs.readDirectory).mockImplementation(
        async (uri: any) => {
          const path = uri.fsPath;
          if (path.endsWith('/output')) {
            return [
              ['deck-1', FileType.Directory],
              ['deck-2', FileType.Directory],
            ] as any;
          }
          if (path.endsWith('/deck-1/slides')) {
            return [['slide-1.html', FileType.File]] as any;
          }
          throw new Error('not found');
        }
      );

      vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
        if (uri.fsPath.includes('deck-1')) return encode(plan1);
        if (uri.fsPath.includes('deck-2')) return encode(plan2);
        throw new Error('not found');
      });

      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000 } as any);

      const result = await service.scanDecks();
      expect(result).toHaveLength(2);

      expect(result[0].id).toBe('deck-1');
      expect(result[0].name).toBe('Test Deck 1');
      expect(result[0].slideCount).toBe(2);
      expect(result[0].builtSlideCount).toBe(1);
      expect(result[0].status).toBe('partial');
      expect(result[0].audience).toBe('Developers');
      expect(result[0].path).toBe('output/deck-1');

      expect(result[1].id).toBe('deck-2');
      expect(result[1].name).toBe('Test Deck 2');
      expect(result[1].slideCount).toBe(1);
      expect(result[1].builtSlideCount).toBe(0);
      expect(result[1].status).toBe('planned');
      expect(result[1].audience).toBeUndefined();
    });

    it('handles audience as nested object with description', async () => {
      const plan = `deck_name: "Nested"\naudience:\n  description: "Engineers"\n  knowledge_level: expert\nslides: []`;

      vi.mocked(workspace.fs.readDirectory).mockImplementation(
        async (uri: any) => {
          if (uri.fsPath.endsWith('/output')) {
            return [['deck-1', FileType.Directory]] as any;
          }
          throw new Error('not found');
        }
      );
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(plan));
      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000 } as any);

      const result = await service.scanDecks();
      expect(result[0].audience).toBe('Engineers');
    });

    it('skips directories without plan.yaml (AC-1)', async () => {
      vi.mocked(workspace.fs.readDirectory).mockImplementation(
        async (uri: any) => {
          if (uri.fsPath.endsWith('/output')) {
            return [
              ['has-plan', FileType.Directory],
              ['no-plan', FileType.Directory],
            ] as any;
          }
          throw new Error('not found');
        }
      );

      vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
        if (uri.fsPath.includes('has-plan'))
          return encode('deck_name: "Good"\nslides: []');
        throw new Error('FileNotFound');
      });

      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000 } as any);

      const result = await service.scanDecks();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('has-plan');
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Skipping no-plan')
      );
    });

    it('skips the singles directory', async () => {
      vi.mocked(workspace.fs.readDirectory).mockResolvedValueOnce([
        ['my-deck', FileType.Directory],
        ['singles', FileType.Directory],
      ] as any);

      vi.mocked(workspace.fs.readFile).mockResolvedValue(
        encode('deck_name: "Real"\nslides: []')
      );
      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000 } as any);

      const result = await service.scanDecks();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('my-deck');
    });

    it('handles malformed YAML with error status and folder name fallback (AC-7)', async () => {
      vi.mocked(workspace.fs.readDirectory).mockImplementation(
        async (uri: any) => {
          if (uri.fsPath.endsWith('/output')) {
            return [
              ['good-deck', FileType.Directory],
              ['bad-deck', FileType.Directory],
            ] as any;
          }
          throw new Error('not found');
        }
      );

      vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
        if (uri.fsPath.includes('good-deck'))
          return encode('deck_name: "Good"\nslides: []');
        if (uri.fsPath.includes('bad-deck'))
          return encode('invalid: yaml: [[[');
        throw new Error('not found');
      });

      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000 } as any);

      const result = await service.scanDecks();
      expect(result).toHaveLength(2);

      const good = result.find((d) => d.id === 'good-deck')!;
      expect(good.name).toBe('Good');
      expect(good.status).toBe('planned');

      const bad = result.find((d) => d.id === 'bad-deck')!;
      expect(bad.name).toBe('bad-deck'); // folder name fallback
      expect(bad.status).toBe('error');
      expect(bad.slideCount).toBe(0);
    });

    it('uses folder name when deck_name is missing (AC-2)', async () => {
      vi.mocked(workspace.fs.readDirectory).mockImplementation(
        async (uri: any) => {
          if (uri.fsPath.endsWith('/output')) {
            return [['my-deck', FileType.Directory]] as any;
          }
          throw new Error('not found');
        }
      );

      vi.mocked(workspace.fs.readFile).mockResolvedValue(
        encode('slides:\n  - number: 1\n    description: "test"')
      );
      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000 } as any);

      const result = await service.scanDecks();
      expect(result[0].name).toBe('my-deck');
    });

    it('computes status correctly (AC-3)', async () => {
      vi.mocked(workspace.fs.readDirectory).mockImplementation(
        async (uri: any) => {
          const path = uri.fsPath;
          if (path.endsWith('/output')) {
            return [
              ['planned-deck', FileType.Directory],
              ['partial-deck', FileType.Directory],
              ['built-deck', FileType.Directory],
            ] as any;
          }
          if (path.endsWith('/planned-deck/slides')) throw new Error('nope');
          if (path.endsWith('/partial-deck/slides'))
            return [['slide-1.html', FileType.File]] as any;
          if (path.endsWith('/built-deck/slides'))
            return [
              ['slide-1.html', FileType.File],
              ['slide-2.html', FileType.File],
            ] as any;
          throw new Error('not found');
        }
      );

      vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
        if (uri.fsPath.includes('planned-deck'))
          return encode(
            'deck_name: "P"\nslides:\n  - number: 1\n    description: "a"\n  - number: 2\n    description: "b"'
          );
        if (uri.fsPath.includes('partial-deck'))
          return encode(
            'deck_name: "R"\nslides:\n  - number: 1\n    description: "a"\n  - number: 2\n    description: "b"\n  - number: 3\n    description: "c"'
          );
        if (uri.fsPath.includes('built-deck'))
          return encode(
            'deck_name: "B"\nslides:\n  - number: 1\n    description: "a"\n  - number: 2\n    description: "b"'
          );
        throw new Error('not found');
      });

      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000 } as any);

      const result = await service.scanDecks();
      expect(result.find((d) => d.id === 'planned-deck')!.status).toBe('planned');
      expect(result.find((d) => d.id === 'partial-deck')!.status).toBe('partial');
      expect(result.find((d) => d.id === 'built-deck')!.status).toBe('built');
    });

    it('logs scan duration and deck count', async () => {
      vi.mocked(workspace.fs.readDirectory).mockResolvedValueOnce([]);

      await service.scanDecks();
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringMatching(/Scanned 0 decks in \d+ms/)
      );
    });

    it('skips non-directory entries in output/', async () => {
      vi.mocked(workspace.fs.readDirectory).mockResolvedValueOnce([
        ['readme.md', FileType.File],
        ['real-deck', FileType.Directory],
      ] as any);

      vi.mocked(workspace.fs.readFile).mockResolvedValue(
        encode('deck_name: "Real"\nslides: []')
      );
      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 1000 } as any);

      const result = await service.scanDecks();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('real-deck');
    });
  });

  describe('getDeckDetail', () => {
    it('returns DeckDetail with per-slide status', async () => {
      const planYaml = `deck_name: "Detail Deck"\naudience: "Engineers"\nslides:\n  - number: 1\n    description: "Intro"\n    suggested_template: "title"\n  - number: 2\n    description: "Content"\n    template: "two-column"`;

      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(planYaml));
      vi.mocked(workspace.fs.stat).mockResolvedValue({ mtime: 2000 } as any);
      vi.mocked(workspace.fs.readDirectory).mockResolvedValue([
        ['slide-1.html', FileType.File],
      ] as any);

      const detail = await service.getDeckDetail('my-deck');
      expect(detail).not.toBeNull();
      expect(detail!.name).toBe('Detail Deck');
      expect(detail!.audience).toBe('Engineers');
      expect(detail!.slides).toHaveLength(2);
      expect(detail!.slides[0].status).toBe('built');
      expect(detail!.slides[0].htmlPath).toBe('slides/slide-1.html');
      expect(detail!.slides[0].template).toBe('title');
      expect(detail!.slides[1].status).toBe('planned');
      expect(detail!.slides[1].htmlPath).toBeUndefined();
      expect(detail!.planPath).toContain('plan.yaml');
    });

    it('returns null when plan.yaml cannot be read', async () => {
      vi.mocked(workspace.fs.readFile).mockRejectedValue(
        new Error('not found')
      );

      const detail = await service.getDeckDetail('missing');
      expect(detail).toBeNull();
    });
  });

  // Story: story-viewer-save-1 Task 7
  describe('extractSlideId (private)', () => {
    it('extracts id from standard attribute order (AC-1)', () => {
      const html = '<div class="slide" data-slide-id="abc-123">content</div>';
      const result = (service as any).extractSlideId(html);
      expect(result).toBe('abc-123');
    });

    it('extracts id from reversed attribute order (AC-1)', () => {
      const html = '<div data-slide-id="xyz-789" class="slide">content</div>';
      const result = (service as any).extractSlideId(html);
      expect(result).toBe('xyz-789');
    });

    it('returns null when no data-slide-id (AC-1)', () => {
      const html = '<div class="slide">no id here</div>';
      const result = (service as any).extractSlideId(html);
      expect(result).toBeNull();
    });
  });

  // Story: story-viewer-save-1 Task 8
  describe('extractTitle (private)', () => {
    it('extracts from h1 tag (AC-1)', () => {
      const html = '<h1>My Slide Title</h1><p>content</p>';
      const result = (service as any).extractTitle(html, 1);
      expect(result).toBe('My Slide Title');
    });

    it('strips nested HTML from h1 (AC-1)', () => {
      const html = '<h1><span class="highlight">Nested</span> Title</h1>';
      const result = (service as any).extractTitle(html, 2);
      expect(result).toBe('Nested Title');
    });

    it('falls back to title tag when h1 empty (AC-1)', () => {
      const html = '<title>Slide 3: Backup Title</title><h1></h1>';
      const result = (service as any).extractTitle(html, 3);
      expect(result).toBe('Backup Title');
    });

    it('falls back to Slide N when no title found (AC-1)', () => {
      const html = '<div>just content</div>';
      const result = (service as any).extractTitle(html, 5);
      expect(result).toBe('Slide 5');
    });
  });

  describe('getDeckPath', () => {
    it('returns Uri for deck output directory', () => {
      const path = service.getDeckPath('my-deck');
      expect(path.fsPath).toContain('output');
      expect(path.fsPath).toContain('my-deck');
    });
  });

  // cv-3-7: moveDeck collision check
  describe('moveDeck', () => {
    it('moves deck from folder to root', async () => {
      (workspace.fs.stat as any).mockRejectedValueOnce(new Error('FileNotFound'));

      await service.moveDeck('deck-1', 'folder-a', undefined);

      expect(workspace.fs.rename).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: expect.stringContaining('folder-a/deck-1') }),
        expect.objectContaining({ fsPath: expect.stringContaining('deck-1') }),
      );
    });

    it('moves deck from root to folder', async () => {
      (workspace.fs.stat as any).mockRejectedValueOnce(new Error('FileNotFound'));

      await service.moveDeck('deck-1', undefined, 'folder-b');

      expect(workspace.fs.rename).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: expect.stringContaining('deck-1') }),
        expect.objectContaining({ fsPath: expect.stringContaining('folder-b/deck-1') }),
      );
    });

    it('throws when target path already exists (collision check)', async () => {
      // stat succeeds = target exists = collision
      (workspace.fs.stat as any).mockResolvedValueOnce({ type: 2 });

      await expect(service.moveDeck('deck-1', 'folder-a', 'folder-b')).rejects.toThrow(
        "A deck named 'deck-1' already exists in the destination folder."
      );
      expect(workspace.fs.rename).not.toHaveBeenCalled();
    });

    it('proceeds when stat throws FileNotFound (no collision)', async () => {
      (workspace.fs.stat as any).mockRejectedValueOnce(new Error('FileNotFound'));

      await expect(service.moveDeck('deck-1', 'folder-a', 'folder-b')).resolves.not.toThrow();
      expect(workspace.fs.rename).toHaveBeenCalled();
    });
  });

  // rename-deck-1: renameDeck tests
  describe('renameDeck', () => {
    it('copies source to target and deletes source (AC-2)', async () => {
      // findDeckUri: stat for root plan.yaml succeeds (finds deck at root)
      (workspace.fs.stat as any).mockResolvedValueOnce({ type: 1 });
      // stat rejects = target doesn't exist (pre-rename validation)
      (workspace.fs.stat as any).mockRejectedValueOnce(new Error('FileNotFound'));

      await service.renameDeck('old-deck', 'new-deck');

      expect(workspace.fs.copy).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: expect.stringContaining('old-deck') }),
        expect.objectContaining({ fsPath: expect.stringContaining('new-deck') }),
      );
      expect(workspace.fs.delete).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: expect.stringContaining('old-deck') }),
        { recursive: true },
      );
    });

    it('throws when target slug already exists (AC-4)', async () => {
      // stat succeeds = target exists
      (workspace.fs.stat as any).mockResolvedValueOnce({ type: 2 });

      await expect(service.renameDeck('old-deck', 'new-deck')).rejects.toThrow(
        "A deck named 'new-deck' already exists"
      );
      expect(workspace.fs.copy).not.toHaveBeenCalled();
    });

    it('preserves folder path for decks in folders (AC-5)', async () => {
      // findDeckUri: root plan.yaml not found
      (workspace.fs.stat as any).mockRejectedValueOnce(new Error('FileNotFound'));
      // readDirectory returns a folder
      (workspace.fs.readDirectory as any).mockResolvedValueOnce([
        ['my-folder', 2 /* Directory */],
      ]);
      // findDeckUri: stat for folder/old-deck/plan.yaml succeeds
      (workspace.fs.stat as any).mockResolvedValueOnce({ type: 1 });
      // Pre-rename validation: stat rejects = target doesn't exist
      (workspace.fs.stat as any).mockRejectedValueOnce(new Error('FileNotFound'));

      await service.renameDeck('old-deck', 'new-deck');

      // Verify copy was called with source in folder and target as sibling
      const copyCall = vi.mocked(workspace.fs.copy).mock.calls[0];
      expect(copyCall[0].fsPath).toContain('my-folder/old-deck');
      // Target is computed as joinPath(source, '..', newSlug) so path contains ../new-deck
      expect(copyCall[1].fsPath).toContain('new-deck');
    });
  });

  // Story: slide-template-preview-4 Task 2 — Unit tests for getSlideTemplateHtml
  describe('getSlideTemplateHtml (slide-template-preview-4)', () => {
    it('returns HTML string for valid templateId', async () => {
      const templateHtml = '<!DOCTYPE html><html><body><h1>Title Template</h1></body></html>';

      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode(templateHtml));

      const result = await service.getSlideTemplateHtml('title-slide');

      expect(result).toBe(templateHtml);
      expect(workspace.fs.readFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fsPath: expect.stringContaining('.slide-builder/config/catalog/slide-templates/title-slide.html')
        })
      );
    });

    it('throws error for non-existent templateId', async () => {
      vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('FileNotFound'));

      await expect(service.getSlideTemplateHtml('non-existent')).rejects.toThrow(
        'Template HTML not found: non-existent'
      );
    });

    it('error message includes templateId', async () => {
      vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('FileNotFound'));

      try {
        await service.getSlideTemplateHtml('missing-template');
      } catch (error) {
        expect((error as Error).message).toContain('missing-template');
      }
    });

    it('reads from correct file path', async () => {
      vi.mocked(workspace.fs.readFile).mockResolvedValue(encode('<html></html>'));

      await service.getSlideTemplateHtml('bullet-points');

      const callArg = vi.mocked(workspace.fs.readFile).mock.calls[0][0] as any;
      expect(callArg.fsPath).toContain('.slide-builder/config/catalog/slide-templates/bullet-points.html');
    });

    it('logs error to output channel on failure', async () => {
      vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('FileNotFound'));

      try {
        await service.getSlideTemplateHtml('test-template');
      } catch {
        // Expected
      }

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        'Failed to read template HTML: test-template'
      );
    });
  });

  describe('dispose', () => {
    it('does not throw', () => {
      expect(() => service.dispose()).not.toThrow();
    });

    it('can be called multiple times safely', () => {
      service.dispose();
      expect(() => service.dispose()).not.toThrow();
    });
  });
});
