/**
 * ColorAnalysisService unit tests
 *
 * Story Reference: v3-4-1 AC-1, AC-2, AC-7, AC-8
 * Architecture Reference: ADR-V3-003 — get-pixels for Node.js image pixel reading
 *
 * Tests the image color analysis service for brand asset intelligence.
 * Note: These tests use mocked VS Code APIs and don't actually read image files.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { ColorAnalysisService } from '../../src/extension/ColorAnalysisService';

// Mock get-pixels module
vi.mock('get-pixels', () => {
  return {
    default: vi.fn(),
  };
});

describe('ColorAnalysisService', () => {
  let service: ColorAnalysisService;
  let mockOutputChannel: vscode.OutputChannel;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOutputChannel = {
      appendLine: vi.fn(),
      append: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn(),
      name: 'Test Channel',
      replace: vi.fn(),
    } as unknown as vscode.OutputChannel;

    service = new ColorAnalysisService(mockOutputChannel);
  });

  describe('SVG handling (AC-2)', () => {
    it('returns type-based defaults for SVG files', async () => {
      const mockUri = {
        path: '/test/brand/logos/logo-dark.svg',
        fsPath: '/test/brand/logos/logo-dark.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'logo');

      expect(result.hasTransparency).toBe(true);
      expect(result.assetType).toBe('logo');
      expect(result.dominantColors).toEqual([]);
      expect(result.contrastNeeds).toBe('medium');
      expect(result.manualOverride).toBe(false);
    });

    it('infers "light" backgroundAffinity from "dark" in SVG filename', async () => {
      const mockUri = {
        path: '/test/brand/logos/logo-dark.svg',
        fsPath: '/test/brand/logos/logo-dark.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'logo');

      expect(result.backgroundAffinity).toBe('light');
    });

    it('infers "dark" backgroundAffinity from "light" in SVG filename', async () => {
      const mockUri = {
        path: '/test/brand/logos/logo-light.svg',
        fsPath: '/test/brand/logos/logo-light.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'logo');

      expect(result.backgroundAffinity).toBe('dark');
    });

    it('returns "any" backgroundAffinity for SVG without hints', async () => {
      const mockUri = {
        path: '/test/brand/logos/logo-main.svg',
        fsPath: '/test/brand/logos/logo-main.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'logo');

      expect(result.backgroundAffinity).toBe('any');
    });

    it('logs SVG analysis to output channel', async () => {
      const mockUri = {
        path: '/test/brand/icons/icon.svg',
        fsPath: '/test/brand/icons/icon.svg',
      } as vscode.Uri;

      await service.analyze(mockUri, 'icon');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[v3:color] SVG default metadata')
      );
    });
  });

  describe('Asset type mapping', () => {
    it('maps "logo" catalog type to "logo" asset type', async () => {
      const mockUri = {
        path: '/test/logo.svg',
        fsPath: '/test/logo.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'logo');

      expect(result.assetType).toBe('logo');
    });

    it('maps "icon" catalog type to "icon" asset type', async () => {
      const mockUri = {
        path: '/test/icon.svg',
        fsPath: '/test/icon.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'icon');

      expect(result.assetType).toBe('icon');
    });

    it('maps "image" catalog type to "photo" asset type', async () => {
      const mockUri = {
        path: '/test/photo.svg',
        fsPath: '/test/photo.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'image');

      expect(result.assetType).toBe('photo');
    });
  });

  describe('Error handling', () => {
    it('returns default metadata when file read fails', async () => {
      const mockUri = {
        path: '/test/corrupt.png',
        fsPath: '/test/corrupt.png',
      } as vscode.Uri;

      // Mock workspace.fs.readFile to throw
      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValueOnce(new Error('File not found'));

      const result = await service.analyze(mockUri, 'image');

      expect(result.backgroundAffinity).toBe('any');
      expect(result.hasTransparency).toBe(false);
      expect(result.dominantColors).toEqual([]);
      expect(result.contrastNeeds).toBe('medium');
      expect(result.assetType).toBe('photo');
      expect(result.manualOverride).toBe(false);
    });

    it('returns default metadata for unsupported formats', async () => {
      const mockUri = {
        path: '/test/image.bmp',
        fsPath: '/test/image.bmp',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'image');

      expect(result.backgroundAffinity).toBe('any');
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Unsupported format')
      );
    });

    it('logs analysis failures to output channel', async () => {
      const mockUri = {
        path: '/test/corrupt.png',
        fsPath: '/test/corrupt.png',
      } as vscode.Uri;

      vi.mocked(vscode.workspace.fs.readFile).mockRejectedValueOnce(new Error('Read failed'));

      await service.analyze(mockUri, 'image');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[v3:color] Failed to analyze')
      );
    });
  });

  describe('Metadata structure', () => {
    it('always returns manualOverride as false', async () => {
      const mockUri = {
        path: '/test/logo.svg',
        fsPath: '/test/logo.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'logo');

      expect(result.manualOverride).toBe(false);
    });

    it('returns valid ColorMetadata structure', async () => {
      const mockUri = {
        path: '/test/icon.svg',
        fsPath: '/test/icon.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'icon');

      expect(result).toHaveProperty('backgroundAffinity');
      expect(result).toHaveProperty('hasTransparency');
      expect(result).toHaveProperty('dominantColors');
      expect(result).toHaveProperty('contrastNeeds');
      expect(result).toHaveProperty('assetType');
      expect(result).toHaveProperty('manualOverride');
    });

    it('constrains backgroundAffinity to valid values', async () => {
      const mockUri = {
        path: '/test/logo.svg',
        fsPath: '/test/logo.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'logo');

      expect(['light', 'dark', 'both', 'any']).toContain(result.backgroundAffinity);
    });

    it('constrains contrastNeeds to valid values', async () => {
      const mockUri = {
        path: '/test/logo.svg',
        fsPath: '/test/logo.svg',
      } as vscode.Uri;

      const result = await service.analyze(mockUri, 'logo');

      expect(['high', 'medium', 'low']).toContain(result.contrastNeeds);
    });
  });
});
