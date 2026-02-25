/**
 * ColorAnalysisService - Image color extraction & metadata detection for brand assets.
 *
 * Story Reference: v3-4-1 AC-1, AC-2, AC-7, AC-8
 * Architecture Reference: ADR-V3-003 — get-pixels for Node.js image pixel reading
 *
 * Runs in the extension host (Node.js context). Uses get-pixels for pixel buffer
 * decoding and custom k-means for dominant color extraction. SVGs get type-based
 * defaults since they cannot be meaningfully analyzed via pixel reading.
 */

import * as vscode from 'vscode';
import type { ColorMetadata, BrandAssetType } from '../shared/types';

// get-pixels is a CommonJS module — use require for compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getPixels = require('get-pixels') as (
  data: Buffer | string,
  type: string,
  cb: (err: Error | null, pixels: NdArray) => void,
) => void;

interface NdArray {
  shape: number[];
  data: Uint8Array | Float64Array;
  get(i: number, j: number, k: number): number;
}

/**
 * Default color metadata returned on analysis failure or for unsupported formats.
 */
function defaultMetadata(assetType: ColorMetadata['assetType']): ColorMetadata {
  return {
    backgroundAffinity: 'any',
    hasTransparency: false,
    dominantColors: [],
    contrastNeeds: 'medium',
    assetType,
    manualOverride: false,
  };
}

/**
 * Map BrandAssetType to ColorMetadata assetType.
 */
function mapAssetType(type: BrandAssetType): ColorMetadata['assetType'] {
  switch (type) {
    case 'logo':
      return 'logo';
    case 'icon':
      return 'icon';
    case 'image':
      return 'photo';
    default:
      return 'photo';
  }
}

/**
 * Convert RGB to hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Calculate relative luminance (0-1) from RGB values.
 */
function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Simple k-means clustering on RGB pixel data.
 * Returns up to k cluster centroids as [r, g, b] arrays, sorted by cluster size (descending).
 */
function kMeansClusters(
  pixels: Array<[number, number, number]>,
  k: number,
  maxIterations = 10,
): Array<{ center: [number, number, number]; count: number }> {
  if (pixels.length === 0) return [];
  if (pixels.length <= k) {
    return pixels.map((p) => ({ center: p, count: 1 }));
  }

  // Initialize centroids by evenly sampling from the pixel array
  const step = Math.floor(pixels.length / k);
  let centroids: Array<[number, number, number]> = [];
  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[i * step]]);
  }

  let assignments = new Array<number>(pixels.length);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each pixel to the nearest centroid
    for (let i = 0; i < pixels.length; i++) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dr = pixels[i][0] - centroids[c][0];
        const dg = pixels[i][1] - centroids[c][1];
        const db = pixels[i][2] - centroids[c][2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < minDist) {
          minDist = dist;
          minIdx = c;
        }
      }
      assignments[i] = minIdx;
    }

    // Recompute centroids
    const sums: Array<[number, number, number, number]> = centroids.map(
      () => [0, 0, 0, 0] as [number, number, number, number],
    );
    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i];
      sums[c][0] += pixels[i][0];
      sums[c][1] += pixels[i][1];
      sums[c][2] += pixels[i][2];
      sums[c][3] += 1;
    }

    const newCentroids: Array<[number, number, number]> = sums.map((s) => {
      if (s[3] === 0) return [0, 0, 0] as [number, number, number];
      return [s[0] / s[3], s[1] / s[3], s[2] / s[3]] as [number, number, number];
    });

    centroids = newCentroids;
  }

  // Count assignments per cluster
  const counts = new Array<number>(centroids.length).fill(0);
  for (const a of assignments) {
    counts[a]++;
  }

  return centroids
    .map((center, i) => ({ center, count: counts[i] }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

export class ColorAnalysisService {
  constructor(private readonly outputChannel: vscode.OutputChannel) {}

  /**
   * Analyze a single image and return its color metadata.
   * For SVGs, returns type-based defaults.
   * For raster images, performs pixel analysis.
   */
  async analyze(
    imageUri: vscode.Uri,
    catalogType: BrandAssetType = 'image',
  ): Promise<ColorMetadata> {
    const fileName = imageUri.path.split('/').pop() ?? '';
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    const assetType = mapAssetType(catalogType);

    // SVGs: return type-based defaults (AC-2)
    if (ext === 'svg') {
      this.outputChannel.appendLine(
        `[v3:color] SVG default metadata for ${fileName}: affinity=any, transparent=true`,
      );
      return {
        backgroundAffinity: this.inferAffinityFromFilename(fileName),
        hasTransparency: true,
        dominantColors: [],
        contrastNeeds: 'medium',
        assetType,
        manualOverride: false,
      };
    }

    // Raster images: pixel analysis
    try {
      const imageBytes = await vscode.workspace.fs.readFile(imageUri);
      const mimeType = this.getMimeType(ext);
      if (!mimeType) {
        this.outputChannel.appendLine(
          `[v3:color] Unsupported format for ${fileName}, using defaults`,
        );
        return defaultMetadata(assetType);
      }

      const pixels = await this.decodePixels(Buffer.from(imageBytes), mimeType);
      if (!pixels) {
        return defaultMetadata(assetType);
      }

      const [width, height] = pixels.shape;

      // Downsample for performance (max 100x100)
      const sampleStepX = Math.max(1, Math.floor(width / 100));
      const sampleStepY = Math.max(1, Math.floor(height / 100));

      const rgbPixels: Array<[number, number, number]> = [];
      let transparentCount = 0;
      let totalSampled = 0;

      for (let y = 0; y < height; y += sampleStepY) {
        for (let x = 0; x < width; x += sampleStepX) {
          const r = pixels.get(x, y, 0);
          const g = pixels.get(x, y, 1);
          const b = pixels.get(x, y, 2);
          const a = pixels.shape[2] >= 4 ? pixels.get(x, y, 3) : 255;

          totalSampled++;

          if (a < 250) {
            transparentCount++;
          }

          // Only include non-transparent pixels in color analysis
          if (a >= 128) {
            rgbPixels.push([r, g, b]);
          }
        }
      }

      const hasTransparency = transparentCount > 0;
      const transparencyRatio = totalSampled > 0 ? transparentCount / totalSampled : 0;

      // K-means clustering for dominant colors (k=5)
      const clusters = kMeansClusters(rgbPixels, 5);
      const dominantColors = clusters
        .slice(0, 5)
        .map((c) => rgbToHex(c.center[0], c.center[1], c.center[2]));

      // Infer backgroundAffinity
      const backgroundAffinity = this.inferAffinity(
        clusters,
        hasTransparency,
        transparencyRatio,
      );

      // Infer contrastNeeds from color variance
      const contrastNeeds = this.inferContrastNeeds(clusters);

      this.outputChannel.appendLine(
        `[v3:color] Analyzed ${fileName}: affinity=${backgroundAffinity}, colors=${dominantColors.length}, transparent=${hasTransparency}`,
      );

      return {
        backgroundAffinity,
        hasTransparency,
        dominantColors,
        contrastNeeds,
        assetType,
        manualOverride: false,
      };
    } catch (error) {
      this.outputChannel.appendLine(
        `[v3:color] Failed to analyze ${fileName}: ${error}`,
      );
      return defaultMetadata(assetType);
    }
  }

  /**
   * Decode image pixels using get-pixels.
   */
  private decodePixels(
    buffer: Buffer,
    mimeType: string,
  ): Promise<NdArray | null> {
    return new Promise((resolve) => {
      getPixels(buffer, mimeType, (err, pixels) => {
        if (err) {
          this.outputChannel.appendLine(
            `[v3:color] Pixel decode error: ${err.message}`,
          );
          resolve(null);
        } else {
          resolve(pixels);
        }
      });
    });
  }

  /**
   * Get MIME type for image format.
   */
  private getMimeType(ext: string): string | null {
    const map: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
    };
    return map[ext] ?? null;
  }

  /**
   * Infer background affinity from dominant colors and transparency.
   */
  private inferAffinity(
    clusters: Array<{ center: [number, number, number]; count: number }>,
    hasTransparency: boolean,
    transparencyRatio: number,
  ): ColorMetadata['backgroundAffinity'] {
    if (!hasTransparency || transparencyRatio < 0.1) {
      return 'any'; // Opaque images work on any background
    }

    // For transparent images, check the luminance of non-transparent content
    if (clusters.length === 0) return 'any';

    const avgLuminance =
      clusters.reduce(
        (sum, c) => sum + luminance(c.center[0], c.center[1], c.center[2]) * c.count,
        0,
      ) / clusters.reduce((sum, c) => sum + c.count, 0);

    if (avgLuminance < 0.3) {
      return 'light'; // Dark content → needs light background
    } else if (avgLuminance > 0.7) {
      return 'dark'; // Light content → needs dark background
    }
    return 'both'; // Mixed content → works on both
  }

  /**
   * Infer contrast needs from color variance across clusters.
   */
  private inferContrastNeeds(
    clusters: Array<{ center: [number, number, number]; count: number }>,
  ): ColorMetadata['contrastNeeds'] {
    if (clusters.length <= 1) return 'low';

    // Calculate variance across cluster centers
    const avgR =
      clusters.reduce((s, c) => s + c.center[0], 0) / clusters.length;
    const avgG =
      clusters.reduce((s, c) => s + c.center[1], 0) / clusters.length;
    const avgB =
      clusters.reduce((s, c) => s + c.center[2], 0) / clusters.length;

    const variance =
      clusters.reduce((s, c) => {
        const dr = c.center[0] - avgR;
        const dg = c.center[1] - avgG;
        const db = c.center[2] - avgB;
        return s + dr * dr + dg * dg + db * db;
      }, 0) / clusters.length;

    // High variance = diverse colors = low contrast needs (self-contrasting)
    // Low variance = uniform colors = high contrast needs (needs background contrast)
    if (variance > 5000) return 'low';
    if (variance > 1500) return 'medium';
    return 'high';
  }

  /**
   * Infer background affinity from filename hints (for SVGs).
   */
  private inferAffinityFromFilename(
    fileName: string,
  ): ColorMetadata['backgroundAffinity'] {
    const lower = fileName.toLowerCase();
    if (lower.includes('dark') || lower.includes('white') || lower.includes('light-bg')) {
      return 'light';
    }
    if (lower.includes('light') || lower.includes('black') || lower.includes('dark-bg')) {
      return 'dark';
    }
    return 'any';
  }
}
