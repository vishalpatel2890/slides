/**
 * Unit tests for useAssetSearch hook — search matching, tag aggregation,
 * and combined filter logic.
 *
 * Story Reference: cv-4-2 AC-11, AC-12, AC-14
 */

import { describe, it, expect } from 'vitest';
import { matchesAssetQuery, aggregateTags, filterAssets } from '../../src/webview/catalog/hooks/useAssetSearch';
import type { BrandAsset } from '../../src/shared/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockAssets: BrandAsset[] = [
  {
    id: 'asset-1',
    name: 'Logo Mark',
    type: 'icon',
    path: '/config/catalog/brand-assets/icons/logo-mark.svg',
    relativePath: 'icons/logo-mark.svg',
    description: 'Primary logo mark for brand',
    tags: ['logo', 'brand', 'primary'],
    fileSize: 2048,
    format: 'svg',
    lastModified: 1704067200000,
  },
  {
    id: 'asset-2',
    name: 'Company Logo',
    type: 'logo',
    path: '/config/catalog/brand-assets/logos/company-logo.png',
    relativePath: 'logos/company-logo.png',
    description: 'Full company logo with tagline',
    tags: ['company', 'official', 'brand'],
    fileSize: 15360,
    format: 'png',
    lastModified: 1704067200000,
  },
  {
    id: 'asset-3',
    name: 'Hero Background',
    type: 'image',
    path: '/config/catalog/brand-assets/images/hero-bg.jpg',
    relativePath: 'images/hero-bg.jpg',
    description: '',
    tags: [],
    fileSize: 524288,
    format: 'jpg',
    lastModified: 1704067200000,
  },
  {
    id: 'asset-4',
    name: 'Arrow Icon',
    type: 'icon',
    path: '/config/catalog/brand-assets/icons/arrow.svg',
    relativePath: 'icons/arrow.svg',
    description: 'Right arrow navigation icon',
    tags: ['navigation', 'brand'],
    fileSize: 1024,
    format: 'svg',
    lastModified: 1704067200000,
  },
  {
    id: 'asset-5',
    name: 'Footer Logo',
    type: 'logo',
    path: '/config/catalog/brand-assets/logos/footer-logo.svg',
    relativePath: 'logos/footer-logo.svg',
    description: 'Simplified logo for footer use',
    tags: ['brand', 'footer'],
    fileSize: 3072,
    format: 'svg',
    lastModified: 1704067200000,
  },
];

// =============================================================================
// matchesAssetQuery Tests (AC-12)
// =============================================================================

describe('matchesAssetQuery', () => {
  it('matches by name', () => {
    expect(matchesAssetQuery(mockAssets[0], 'logo')).toBe(true);
    expect(matchesAssetQuery(mockAssets[0], 'Logo Mark')).toBe(true);
  });

  it('matches by description', () => {
    expect(matchesAssetQuery(mockAssets[0], 'primary')).toBe(true);
    expect(matchesAssetQuery(mockAssets[1], 'tagline')).toBe(true);
  });

  it('matches by tags', () => {
    expect(matchesAssetQuery(mockAssets[0], 'brand')).toBe(true);
    expect(matchesAssetQuery(mockAssets[1], 'official')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(matchesAssetQuery(mockAssets[0], 'LOGO')).toBe(true);
    expect(matchesAssetQuery(mockAssets[0], 'BRAND')).toBe(true);
    expect(matchesAssetQuery(mockAssets[0], 'Primary')).toBe(true);
  });

  it('returns false for non-matching query', () => {
    expect(matchesAssetQuery(mockAssets[0], 'xyznonexistent')).toBe(false);
  });

  it('handles empty description gracefully', () => {
    expect(matchesAssetQuery(mockAssets[2], 'hero')).toBe(true);
    expect(matchesAssetQuery(mockAssets[2], 'description')).toBe(false);
  });

  it('handles empty tags gracefully', () => {
    expect(matchesAssetQuery(mockAssets[2], 'brand')).toBe(false);
  });

  it('matches partial strings', () => {
    expect(matchesAssetQuery(mockAssets[0], 'log')).toBe(true);
    expect(matchesAssetQuery(mockAssets[3], 'arr')).toBe(true);
  });
});

// =============================================================================
// aggregateTags Tests (AC-14)
// =============================================================================

describe('aggregateTags', () => {
  it('returns tags sorted by frequency (descending)', () => {
    const tags = aggregateTags(mockAssets);
    // 'brand' appears on 4 assets, should be first
    expect(tags[0]).toBe('brand');
  });

  it('returns unique tags only', () => {
    const tags = aggregateTags(mockAssets);
    const unique = new Set(tags);
    expect(tags.length).toBe(unique.size);
  });

  it('normalizes tags to lowercase', () => {
    const assetsWithMixedCase: BrandAsset[] = [
      { ...mockAssets[0], tags: ['Brand', 'LOGO'] },
      { ...mockAssets[1], tags: ['brand', 'logo'] },
    ];
    const tags = aggregateTags(assetsWithMixedCase);
    expect(tags).toContain('brand');
    expect(tags).toContain('logo');
    expect(tags).not.toContain('Brand');
    expect(tags).not.toContain('LOGO');
  });

  it('respects the limit parameter', () => {
    const tags = aggregateTags(mockAssets, 3);
    expect(tags.length).toBeLessThanOrEqual(3);
  });

  it('defaults to max 8 tags', () => {
    const tags = aggregateTags(mockAssets);
    expect(tags.length).toBeLessThanOrEqual(8);
  });

  it('returns empty array for assets with no tags', () => {
    const noTagAssets: BrandAsset[] = [mockAssets[2]]; // Hero Background has no tags
    const tags = aggregateTags(noTagAssets);
    expect(tags).toEqual([]);
  });

  it('returns empty array for empty asset list', () => {
    const tags = aggregateTags([]);
    expect(tags).toEqual([]);
  });

  it('counts frequency correctly', () => {
    const tags = aggregateTags(mockAssets);
    // 'brand' appears on assets 1, 2, 4, 5 = 4 times
    // 'logo' appears on asset 1 = 1 time
    // 'primary' appears on asset 1 = 1 time
    // 'company' appears on asset 2 = 1 time
    // 'official' appears on asset 2 = 1 time
    // 'navigation' appears on asset 4 = 1 time
    // 'footer' appears on asset 5 = 1 time
    expect(tags[0]).toBe('brand');
  });
});

// =============================================================================
// filterAssets Tests (AC-11, AC-12, AC-13, AC-14)
// =============================================================================

describe('filterAssets', () => {
  it('returns all assets when no filters are applied', () => {
    const result = filterAssets(mockAssets, '', [], []);
    expect(result).toHaveLength(5);
  });

  it('filters by search query alone', () => {
    const result = filterAssets(mockAssets, 'logo', [], []);
    expect(result).toHaveLength(3); // Logo Mark, Company Logo, Footer Logo
  });

  it('filters by type alone', () => {
    const result = filterAssets(mockAssets, '', ['icon'], []);
    expect(result).toHaveLength(2); // Logo Mark, Arrow Icon
  });

  it('filters by multiple types', () => {
    const result = filterAssets(mockAssets, '', ['icon', 'logo'], []);
    expect(result).toHaveLength(4); // 2 icons + 2 logos
  });

  it('filters by tag alone', () => {
    const result = filterAssets(mockAssets, '', [], ['brand']);
    expect(result).toHaveLength(4); // All except Hero Background
  });

  it('filters by multiple tags (AND intersection)', () => {
    const result = filterAssets(mockAssets, '', [], ['brand', 'logo']);
    expect(result).toHaveLength(1); // Only Logo Mark has both tags
  });

  it('combines search + type filter (AND)', () => {
    const result = filterAssets(mockAssets, 'logo', ['icon'], []);
    expect(result).toHaveLength(1); // Logo Mark (icon with 'logo' in name)
  });

  it('combines search + tag filter (AND)', () => {
    const result = filterAssets(mockAssets, 'arrow', [], ['brand']);
    expect(result).toHaveLength(1); // Arrow Icon (matches 'arrow' name + 'brand' tag)
  });

  it('combines search + type + tag filter (AND)', () => {
    const result = filterAssets(mockAssets, 'logo', ['icon'], ['brand']);
    expect(result).toHaveLength(1); // Logo Mark only
  });

  it('returns empty array when nothing matches', () => {
    const result = filterAssets(mockAssets, 'xyznonexistent', [], []);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty asset list', () => {
    const result = filterAssets([], 'logo', ['icon'], ['brand']);
    expect(result).toEqual([]);
  });

  it('tag filter is case-insensitive', () => {
    const result = filterAssets(mockAssets, '', [], ['BRAND']);
    expect(result).toHaveLength(4);
  });
});
