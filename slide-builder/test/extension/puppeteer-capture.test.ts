/**
 * Tests for puppeteer-capture module.
 * Story Reference: story-1.1 AC-1, AC-2, AC-8
 *
 * Tests the captureSlide function:
 * - JPEG capture with quality parameter
 * - PNG capture as default (backward compatible)
 * - captureSlideAsPng backward-compatible alias
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Puppeteer
const mockScreenshot = vi.fn();
const mockSetViewport = vi.fn();
const mockSetContent = vi.fn();
const mockEvaluate = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn();
const mock$ = vi.fn();

const mockNewPage = vi.fn().mockResolvedValue({
  setViewport: mockSetViewport,
  setContent: mockSetContent,
  evaluate: mockEvaluate,
  $: mock$,
  close: mockClose,
  screenshot: mockScreenshot,
});

const mockBrowserClose = vi.fn();
const mockLaunch = vi.fn().mockResolvedValue({
  connected: true,
  newPage: mockNewPage,
  close: mockBrowserClose,
});

vi.mock('puppeteer', () => ({
  default: {
    launch: mockLaunch,
  },
  launch: mockLaunch,
}));

// Import after mocking
import { captureSlide, captureSlideAsPng, disposeBrowser } from '../../src/extension/puppeteer-capture';

describe('puppeteer-capture (story-1.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no .slide element found, use full page
    mock$.mockResolvedValue(null);
    mockScreenshot.mockResolvedValue(Buffer.from('fake-image-data'));
  });

  afterEach(async () => {
    await disposeBrowser();
  });

  describe('captureSlide with JPEG format (AC-1)', () => {
    it('should pass type jpeg and quality to screenshot()', async () => {
      await captureSlide('<html>test</html>', { format: 'jpeg', quality: 82 });

      expect(mockScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'jpeg',
          quality: 82,
        })
      );
    });

    it('should pass type jpeg without quality when quality is undefined', async () => {
      await captureSlide('<html>test</html>', { format: 'jpeg' });

      const callArgs = mockScreenshot.mock.calls[0][0];
      expect(callArgs.type).toBe('jpeg');
      expect(callArgs).not.toHaveProperty('quality');
    });

    it('should return a Buffer', async () => {
      const result = await captureSlide('<html>test</html>', { format: 'jpeg', quality: 82 });
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('captureSlide with PNG format (AC-2)', () => {
    it('should default to PNG when no options provided', async () => {
      await captureSlide('<html>test</html>');

      expect(mockScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'png',
        })
      );
    });

    it('should use PNG when explicitly specified', async () => {
      await captureSlide('<html>test</html>', { format: 'png' });

      expect(mockScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'png',
        })
      );
    });

    it('should not pass quality for PNG format', async () => {
      await captureSlide('<html>test</html>', { format: 'png', quality: 90 });

      const callArgs = mockScreenshot.mock.calls[0][0];
      expect(callArgs.type).toBe('png');
      expect(callArgs).not.toHaveProperty('quality');
    });
  });

  describe('captureSlideAsPng backward compatibility (AC-2)', () => {
    it('should exist as a function', () => {
      expect(typeof captureSlideAsPng).toBe('function');
    });

    it('should capture as PNG by default', async () => {
      await captureSlideAsPng('<html>test</html>');

      expect(mockScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'png',
        })
      );
    });
  });

  describe('slide element detection', () => {
    it('should capture .slide element when it exists', async () => {
      const mockSlideElement = { screenshot: mockScreenshot };
      mock$.mockResolvedValue(mockSlideElement);

      await captureSlide('<html>test</html>', { format: 'jpeg', quality: 82 });

      // When slideElement found, clip should be undefined
      expect(mockScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'jpeg',
          quality: 82,
          clip: undefined,
        })
      );
    });

    it('should use full page clip when no .slide element found', async () => {
      mock$.mockResolvedValue(null);

      await captureSlide('<html>test</html>');

      expect(mockScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          clip: { x: 0, y: 0, width: 1920, height: 1080 },
        })
      );
    });
  });
});
