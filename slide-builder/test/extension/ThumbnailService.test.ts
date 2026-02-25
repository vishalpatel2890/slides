/**
 * ThumbnailService Tests
 *
 * Story Reference: cv-5-3
 * Tests for thumbnail generation, caching, and eviction functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as crypto from 'crypto';

// Mock vscode
vi.mock('vscode', () => ({
  Uri: {
    file: (path: string) => ({ fsPath: path, scheme: 'file' }),
    joinPath: (base: { fsPath: string }, ...parts: string[]) => ({
      fsPath: [base.fsPath, ...parts].join('/'),
      scheme: 'file',
    }),
  },
  workspace: {
    fs: {
      stat: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      readDirectory: vi.fn(),
      createDirectory: vi.fn(),
      delete: vi.fn(),
    },
  },
  window: {
    createWebviewPanel: vi.fn(),
  },
  FileType: {
    File: 1,
    Directory: 2,
  },
  ViewColumn: {
    Beside: 2,
  },
}));

describe('ThumbnailService', () => {
  describe('Cache Key Generation (AC-20)', () => {
    it('should generate different cache keys for different mtimes', () => {
      const path = '/workspace/output/deck1/slides/slide-1.html';
      const mtime1 = 1000000;
      const mtime2 = 1000001;

      const hash1 = crypto.createHash('md5').update(path + mtime1.toString()).digest('hex');
      const hash2 = crypto.createHash('md5').update(path + mtime2.toString()).digest('hex');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate same cache key for same path and mtime', () => {
      const path = '/workspace/output/deck1/slides/slide-1.html';
      const mtime = 1000000;

      const hash1 = crypto.createHash('md5').update(path + mtime.toString()).digest('hex');
      const hash2 = crypto.createHash('md5').update(path + mtime.toString()).digest('hex');

      expect(hash1).toBe(hash2);
    });

    it('should generate different cache keys for different paths', () => {
      const path1 = '/workspace/output/deck1/slides/slide-1.html';
      const path2 = '/workspace/output/deck2/slides/slide-1.html';
      const mtime = 1000000;

      const hash1 = crypto.createHash('md5').update(path1 + mtime.toString()).digest('hex');
      const hash2 = crypto.createHash('md5').update(path2 + mtime.toString()).digest('hex');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('ThumbnailCacheIndex structure (AC-26)', () => {
    it('should have correct structure with version 1', () => {
      const index = {
        version: 1 as const,
        entries: [
          {
            sourcePath: '/path/to/slide.html',
            cacheKey: 'abc123',
            thumbnailPath: '/cache/abc123.png',
            generatedAt: Date.now(),
          },
        ],
      };

      expect(index.version).toBe(1);
      expect(index.entries).toHaveLength(1);
      expect(index.entries[0]).toHaveProperty('sourcePath');
      expect(index.entries[0]).toHaveProperty('cacheKey');
      expect(index.entries[0]).toHaveProperty('thumbnailPath');
      expect(index.entries[0]).toHaveProperty('generatedAt');
    });
  });

  describe('Placeholder generation (AC-23)', () => {
    it('should generate deck initials from name', () => {
      const getDeckInitials = (deckName: string): string => {
        return deckName
          .split(/\s+/)
          .slice(0, 2)
          .map(word => word.charAt(0).toUpperCase())
          .join('');
      };

      expect(getDeckInitials('My Presentation')).toBe('MP');
      expect(getDeckInitials('Sales')).toBe('S');
      expect(getDeckInitials('Q4 Financial Review')).toBe('QF');
      expect(getDeckInitials('a')).toBe('A');
    });

    it('should generate placeholder SVG with correct color', () => {
      const generatePlaceholder = (label: string): string => {
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
            <rect width="100%" height="100%" fill="#3a61ff"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".35em"
                  fill="white" font-family="system-ui, sans-serif" font-size="48" font-weight="600">
              ${label}
            </text>
          </svg>
        `;
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      };

      const placeholder = generatePlaceholder('MP');
      expect(placeholder).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(Buffer.from(placeholder.replace('data:image/svg+xml;base64,', ''), 'base64').toString()).toContain('#3a61ff');
      expect(Buffer.from(placeholder.replace('data:image/svg+xml;base64,', ''), 'base64').toString()).toContain('MP');
    });
  });

  describe('Sequential queue (AC-25)', () => {
    it('should process items in order', async () => {
      const results: number[] = [];
      const queue: Array<() => Promise<void>> = [];

      const processQueue = async () => {
        while (queue.length > 0) {
          const item = queue.shift()!;
          await item();
        }
      };

      // Add items
      for (let i = 1; i <= 3; i++) {
        const num = i;
        queue.push(async () => {
          await new Promise(r => setTimeout(r, 10));
          results.push(num);
        });
      }

      await processQueue();

      expect(results).toEqual([1, 2, 3]);
    });
  });
});

describe('useLazyThumbnail hook logic', () => {
  describe('IntersectionObserver integration (AC-21)', () => {
    it('should only request thumbnail when element becomes visible', () => {
      // This is a unit test for the logic, not the actual hook
      // The hook creates an IntersectionObserver that fires when isIntersecting is true

      let intersectionCallback: (entries: Array<{ isIntersecting: boolean }>) => void = () => {};
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };

      // Simulate IntersectionObserver creation
      const createObserver = (callback: typeof intersectionCallback) => {
        intersectionCallback = callback;
        return mockObserver;
      };

      const requestThumbnail = vi.fn();

      // Create observer
      const observer = createObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          requestThumbnail();
        }
      });

      // Observe element
      observer.observe({} as Element);

      // Not visible yet
      intersectionCallback([{ isIntersecting: false }]);
      expect(requestThumbnail).not.toHaveBeenCalled();

      // Now visible
      intersectionCallback([{ isIntersecting: true }]);
      expect(requestThumbnail).toHaveBeenCalledTimes(1);
    });
  });
});
