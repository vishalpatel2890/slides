/**
 * Tests for CatalogDataService brand asset scanning, per-type catalog matching,
 * and update write-back.
 *
 * Story Reference: cv-4-1 AC-9, AC-10; story-brand-catalog-sync-1 AC-1..8
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

const mockWebview = {
  asWebviewUri: vi.fn().mockImplementation((uri: any) => ({
    toString: () => `https://webview-uri${uri.fsPath}`,
  })),
  cspSource: 'https://webview-csp-source',
} as any;

// Sample per-type catalog JSON (v2.0 schema — flat entries with color metadata)
const iconCatalogJson = JSON.stringify({
  version: '2.0',
  icons: [
    {
      id: 'accuracy-dark',
      base_icon: 'accuracy',
      name: 'Accuracy',
      description: 'Crosshair target symbol',
      file: 'icons8-accuracy-100-dark.png',
      size: 100,
      backgroundAffinity: 'light',
      hasTransparency: true,
      dominantColors: ['#000000'],
      contrastNeeds: 'high',
      tags: ['accuracy', 'target', 'goal'],
    },
    {
      id: 'accuracy-white',
      base_icon: 'accuracy',
      name: 'Accuracy',
      description: 'Crosshair target symbol',
      file: 'icons8-accuracy-100-white.png',
      size: 100,
      backgroundAffinity: 'dark',
      hasTransparency: true,
      dominantColors: ['#FFFFFF'],
      contrastNeeds: 'high',
      tags: ['accuracy', 'target', 'goal'],
    },
    {
      id: 'chart-dark',
      base_icon: 'chart',
      name: 'Chart Icon',
      description: 'Bar chart graphic',
      file: 'icons8-chart-100-dark.png',
      size: 100,
      backgroundAffinity: 'light',
      hasTransparency: true,
      dominantColors: ['#000000'],
      contrastNeeds: 'high',
      tags: ['chart', 'data'],
    },
  ],
});

const logoCatalogJson = JSON.stringify({
  version: '1.0',
  logos: [
    {
      id: 'primary-mark',
      name: 'Primary Brand Mark',
      description: 'Amperity brand symbol',
      variants: [
        { variant_id: 'dark', file: 'amperity-mark-black.png' },
        { variant_id: 'light', file: 'amperity-mark-white.png' },
      ],
      tags: ['brand', 'mark', 'primary'],
    },
  ],
});

const imagesCatalogJson = JSON.stringify({
  version: '1.0',
  images: [
    {
      id: 'icon-col1',
      name: 'Column Decorative 1',
      description: 'Primary decorative element',
      file: 'icon-col1.png',
      tags: ['column', 'visual', 'decorative'],
    },
  ],
});

describe('CatalogDataService.scanBrandAssets', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  it('returns empty array when brand directory does not exist (AC-9)', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('FileNotFound'));
    vi.mocked(workspace.fs.readDirectory).mockRejectedValue(new Error('FileNotFound'));

    const result = await service.scanBrandAssets();
    expect(result).toEqual([]);
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Scanned 0 brand assets/)
    );
  });

  it('discovers assets from icons, logos, and images subdirectories (AC-9)', async () => {
    // No per-type catalog files
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('not found'));

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      const path = uri.fsPath;
      if (path.endsWith('/icons')) {
        return [['logo-mark.svg', FileType.File]] as any;
      }
      if (path.endsWith('/logos')) {
        return [['company-logo.png', FileType.File]] as any;
      }
      if (path.endsWith('/images')) {
        return [['hero-bg.jpg', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 1024, mtime: 2000 } as any);

    const result = await service.scanBrandAssets();
    expect(result).toHaveLength(3);

    const icon = result.find((a) => a.relativePath === 'icons/logo-mark.svg')!;
    expect(icon).toBeDefined();
    expect(icon.type).toBe('icon');
    expect(icon.name).toBe('logo-mark');
    expect(icon.format).toBe('svg');
    expect(icon.fileSize).toBe(1024);

    const logo = result.find((a) => a.relativePath === 'logos/company-logo.png')!;
    expect(logo).toBeDefined();
    expect(logo.type).toBe('logo');
    expect(logo.name).toBe('company-logo');

    const image = result.find((a) => a.relativePath === 'images/hero-bg.jpg')!;
    expect(image).toBeDefined();
    expect(image.type).toBe('image');
    expect(image.name).toBe('hero-bg');
  });

  it('populates description/tags from icon-catalog.json via direct file matching (AC-1)', async () => {
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('icon-catalog.json')) return encode(iconCatalogJson);
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/icons')) {
        return [
          ['icons8-accuracy-100-dark.png', FileType.File],
          ['icons8-accuracy-100-white.png', FileType.File],
          ['unmatched-icon.svg', FileType.File],
        ] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 512, mtime: 3000 } as any);

    const result = await service.scanBrandAssets();
    expect(result).toHaveLength(3);

    // Dark variant matches by exact file field
    const iconDark = result.find((a) => a.relativePath === 'icons/icons8-accuracy-100-dark.png')!;
    expect(iconDark.name).toBe('Accuracy');
    expect(iconDark.description).toBe('Crosshair target symbol');
    expect(iconDark.tags).toEqual(['accuracy', 'target', 'goal']);

    // White variant matches by exact file field
    const iconWhite = result.find((a) => a.relativePath === 'icons/icons8-accuracy-100-white.png')!;
    expect(iconWhite.name).toBe('Accuracy');
    expect(iconWhite.description).toBe('Crosshair target symbol');

    // Unmatched icon gets filename-based defaults
    const unmatched = result.find((a) => a.relativePath === 'icons/unmatched-icon.svg')!;
    expect(unmatched.name).toBe('unmatched-icon');
    expect(unmatched.description).toBe('');
    expect(unmatched.tags).toEqual([]);
  });

  it('populates description/tags from logo-catalog.json via variant matching (AC-2)', async () => {
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('logo-catalog.json')) return encode(logoCatalogJson);
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/logos')) {
        return [
          ['amperity-mark-black.png', FileType.File],
          ['amperity-mark-white.png', FileType.File],
          ['other-logo.svg', FileType.File],
        ] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 512, mtime: 3000 } as any);

    const result = await service.scanBrandAssets();
    expect(result).toHaveLength(3);

    const dark = result.find((a) => a.relativePath === 'logos/amperity-mark-black.png')!;
    expect(dark.name).toBe('Primary Brand Mark');
    expect(dark.description).toBe('Amperity brand symbol');
    expect(dark.tags).toEqual(['brand', 'mark', 'primary']);

    const light = result.find((a) => a.relativePath === 'logos/amperity-mark-white.png')!;
    expect(light.name).toBe('Primary Brand Mark');
    expect(light.description).toBe('Amperity brand symbol');

    const other = result.find((a) => a.relativePath === 'logos/other-logo.svg')!;
    expect(other.name).toBe('other-logo');
    expect(other.description).toBe('');
  });

  it('populates description/tags from images-catalog.json via direct file matching (AC-3)', async () => {
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('images-catalog.json')) return encode(imagesCatalogJson);
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/images')) {
        return [
          ['icon-col1.png', FileType.File],
          ['unknown-bg.jpg', FileType.File],
        ] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 512, mtime: 3000 } as any);

    const result = await service.scanBrandAssets();
    expect(result).toHaveLength(2);

    const matched = result.find((a) => a.relativePath === 'images/icon-col1.png')!;
    expect(matched.name).toBe('Column Decorative 1');
    expect(matched.description).toBe('Primary decorative element');
    expect(matched.tags).toEqual(['column', 'visual', 'decorative']);

    const unmatched = result.find((a) => a.relativePath === 'images/unknown-bg.jpg')!;
    expect(unmatched.name).toBe('unknown-bg');
    expect(unmatched.description).toBe('');
  });

  it('falls back to filename defaults when no catalogs exist (AC-6)', async () => {
    // All catalog file reads fail
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('not found'));

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/icons')) {
        return [['icon.svg', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);

    const result = await service.scanBrandAssets();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('icon');
    expect(result[0].description).toBe('');
    expect(result[0].tags).toEqual([]);
  });

  it('falls back to defaults when catalog JSON is malformed (AC-7)', async () => {
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('icon-catalog.json')) return encode('not valid json {{{');
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/icons')) {
        return [['icon.svg', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);

    // Should not throw — returns assets with filename-based defaults
    const result = await service.scanBrandAssets();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('icon');
    expect(result[0].description).toBe('');
  });

  it('filters out unsupported file formats', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('not found'));

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/icons')) {
        return [
          ['icon.svg', FileType.File],
          ['readme.txt', FileType.File],
          ['data.json', FileType.File],
          ['icon.png', FileType.File],
        ] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);

    const result = await service.scanBrandAssets();
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.format)).toEqual(['svg', 'png']);
  });

  it('skips non-file entries (directories) within brand subdirectories', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('not found'));

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/images')) {
        return [
          ['photo.jpg', FileType.File],
          ['subfolder', FileType.Directory],
        ] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 200, mtime: 1000 } as any);

    const result = await service.scanBrandAssets();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('photo');
  });

  it('generates stable IDs from relative paths', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('not found'));

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/icons')) {
        return [['test.svg', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);

    const result1 = await service.scanBrandAssets();
    const result2 = await service.scanBrandAssets();

    // Same file should produce same ID
    expect(result1[0].id).toBe(result2[0].id);
    expect(result1[0].id).toMatch(/^asset-/);
  });

  it('generates webviewUri when webview is provided (AC-3)', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('not found'));

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/icons')) {
        return [['icon.svg', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);

    const result = await service.scanBrandAssets(mockWebview);
    expect(result[0].webviewUri).toBeDefined();
    expect(result[0].webviewUri).toContain('webview-uri');
    expect(mockWebview.asWebviewUri).toHaveBeenCalled();
  });

  it('omits webviewUri when no webview provided', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('not found'));

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/icons')) {
        return [['icon.svg', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);

    const result = await service.scanBrandAssets();
    expect(result[0].webviewUri).toBeUndefined();
  });

  it('handles stat failure gracefully with defaults', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('not found'));

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/icons')) {
        return [['icon.svg', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockRejectedValue(new Error('stat failed'));

    const result = await service.scanBrandAssets();
    expect(result).toHaveLength(1);
    expect(result[0].fileSize).toBe(0);
  });

  it('logs scan duration and asset count', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('not found'));
    vi.mocked(workspace.fs.readDirectory).mockRejectedValue(new Error('not found'));

    await service.scanBrandAssets();
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringMatching(/Scanned \d+ brand assets in \d+ms/)
    );
  });

  it('supports all SUPPORTED_IMAGE_FORMATS', async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('not found'));

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/images')) {
        return [
          ['a.svg', FileType.File],
          ['b.png', FileType.File],
          ['c.jpg', FileType.File],
          ['d.jpeg', FileType.File],
          ['e.gif', FileType.File],
          ['f.webp', FileType.File],
          ['g.ico', FileType.File],
        ] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);

    const result = await service.scanBrandAssets();
    expect(result).toHaveLength(7);
    expect(result.map((a) => a.format).sort()).toEqual(
      ['gif', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'webp']
    );
  });
});

describe('CatalogDataService.updateBrandAsset', () => {
  let service: CatalogDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CatalogDataService(workspaceRoot, mockOutputChannel);
  });

  it('writes updated description to icon-catalog.json (AC-4)', async () => {
    // Mock readDirectory to find the icon file for ID lookup
    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/icons')) {
        return [['icons8-accuracy-100-dark.png', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('icon-catalog.json')) return encode(iconCatalogJson);
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    // Get the ID for icons/icons8-accuracy-100-dark.png
    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);
    const scanned = await service.scanBrandAssets();
    const asset = scanned.find(a => a.relativePath === 'icons/icons8-accuracy-100-dark.png')!;

    vi.clearAllMocks();

    // Re-mock for the update call
    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/icons')) {
        return [['icons8-accuracy-100-dark.png', FileType.File]] as any;
      }
      throw new Error('not found');
    });
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('icon-catalog.json')) return encode(iconCatalogJson);
      throw new Error('not found');
    });
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.updateBrandAsset(asset.id, { description: 'Updated description' });

    expect(vi.mocked(workspace.fs.writeFile)).toHaveBeenCalledTimes(1);
    // Verify it wrote to icon-catalog.json
    const writeCall = vi.mocked(workspace.fs.writeFile).mock.calls[0];
    expect((writeCall[0] as any).fsPath).toContain('icon-catalog.json');

    // Verify the written content contains the updated description
    const writtenContent = JSON.parse(new TextDecoder().decode(writeCall[1] as Uint8Array));
    const updatedEntry = writtenContent.icons.find((e: any) => e.id === 'accuracy-dark');
    expect(updatedEntry.description).toBe('Updated description');
  });

  it('writes updated tags to images-catalog.json (AC-5)', async () => {
    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/images')) {
        return [['icon-col1.png', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('images-catalog.json')) return encode(imagesCatalogJson);
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);
    const scanned = await service.scanBrandAssets();
    const asset = scanned.find(a => a.relativePath === 'images/icon-col1.png')!;

    vi.clearAllMocks();

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/images')) {
        return [['icon-col1.png', FileType.File]] as any;
      }
      throw new Error('not found');
    });
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('images-catalog.json')) return encode(imagesCatalogJson);
      throw new Error('not found');
    });
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.updateBrandAsset(asset.id, { tags: ['updated', 'tags'] });

    const writtenBytes = vi.mocked(workspace.fs.writeFile).mock.calls[0][1] as Uint8Array;
    const writtenContent = JSON.parse(new TextDecoder().decode(writtenBytes));
    const updatedEntry = writtenContent.images.find((e: any) => e.id === 'icon-col1');
    expect(updatedEntry.tags).toEqual(['updated', 'tags']);
  });

  it('writes to logo-catalog.json for logo asset updates', async () => {
    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/logos')) {
        return [['amperity-mark-black.png', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('logo-catalog.json')) return encode(logoCatalogJson);
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);
    const scanned = await service.scanBrandAssets();
    const asset = scanned.find(a => a.relativePath === 'logos/amperity-mark-black.png')!;

    vi.clearAllMocks();

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/logos')) {
        return [['amperity-mark-black.png', FileType.File]] as any;
      }
      throw new Error('not found');
    });
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('logo-catalog.json')) return encode(logoCatalogJson);
      throw new Error('not found');
    });
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.updateBrandAsset(asset.id, { description: 'New logo description' });

    const writtenBytes = vi.mocked(workspace.fs.writeFile).mock.calls[0][1] as Uint8Array;
    const writtenContent = JSON.parse(new TextDecoder().decode(writtenBytes));
    expect(writtenContent.logos[0].description).toBe('New logo description');
  });

  it('creates new entry when no matching catalog entry exists (AC-8)', async () => {
    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/images')) {
        return [['brand-new-image.png', FileType.File]] as any;
      }
      throw new Error('not found');
    });

    // images-catalog.json exists but has no matching entry
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('images-catalog.json')) return encode(imagesCatalogJson);
      throw new Error('not found');
    });

    vi.mocked(workspace.fs.stat).mockResolvedValue({ size: 100, mtime: 1000 } as any);
    const scanned = await service.scanBrandAssets();
    const asset = scanned.find(a => a.relativePath === 'images/brand-new-image.png')!;

    vi.clearAllMocks();

    vi.mocked(workspace.fs.readDirectory).mockImplementation(async (uri: any) => {
      if (uri.fsPath.endsWith('/images')) {
        return [['brand-new-image.png', FileType.File]] as any;
      }
      throw new Error('not found');
    });
    vi.mocked(workspace.fs.readFile).mockImplementation(async (uri: any) => {
      if (uri.fsPath.includes('images-catalog.json')) return encode(imagesCatalogJson);
      throw new Error('not found');
    });
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);

    await service.updateBrandAsset(asset.id, {
      description: 'Newly added',
      tags: ['new'],
    });

    const writtenBytes = vi.mocked(workspace.fs.writeFile).mock.calls[0][1] as Uint8Array;
    const writtenContent = JSON.parse(new TextDecoder().decode(writtenBytes));
    // Original entry still present plus new one
    expect(writtenContent.images).toHaveLength(2);
    const newEntry = writtenContent.images.find((e: any) => e.file === 'brand-new-image.png');
    expect(newEntry).toBeDefined();
    expect(newEntry.description).toBe('Newly added');
    expect(newEntry.tags).toEqual(['new']);
  });

  it('throws when asset ID not found in any subdirectory', async () => {
    vi.mocked(workspace.fs.readDirectory).mockRejectedValue(new Error('not found'));

    await expect(service.updateBrandAsset('nonexistent-id', { description: 'test' }))
      .rejects.toThrow('Asset not found');
  });
});
