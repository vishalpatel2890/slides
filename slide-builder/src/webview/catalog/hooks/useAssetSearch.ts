/**
 * useAssetSearch - Client-side search and tag aggregation for brand assets.
 *
 * Story Reference: cv-4-2 AC-11, AC-12, AC-14
 * Architecture Reference: NFR2 — <200ms client-side filtering
 *
 * AC-11: Instant filtering (<200ms) as user types
 * AC-12: Search matches against asset name, description, tags
 * AC-14: Tag aggregation for frequently used tags
 */

import { useMemo } from 'react';
import type { BrandAsset } from '../../../shared/types';

/** Maximum number of tag suggestions to surface */
const MAX_TAG_SUGGESTIONS = 8;

/**
 * Check if a single asset matches the search query.
 * Matches against name, description, and tags (case-insensitive).
 */
export function matchesAssetQuery(asset: BrandAsset, query: string): boolean {
  const q = query.toLowerCase();
  if (asset.name.toLowerCase().includes(q)) return true;
  if (asset.description && asset.description.toLowerCase().includes(q)) return true;
  if (asset.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
  return false;
}

/**
 * Aggregate all tags across assets, sorted by frequency (descending).
 * Returns the top N most frequently used tags.
 */
export function aggregateTags(assets: BrandAsset[], limit: number = MAX_TAG_SUGGESTIONS): string[] {
  const tagCounts = new Map<string, number>();
  for (const asset of assets) {
    for (const tag of asset.tags) {
      const normalized = tag.toLowerCase();
      tagCounts.set(normalized, (tagCounts.get(normalized) ?? 0) + 1);
    }
  }
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

/**
 * Filter assets by search query, type filters, and tag filters (AND intersection).
 */
export function filterAssets(
  assets: BrandAsset[],
  query: string,
  typeFilters: string[],
  tagFilters: string[],
): BrandAsset[] {
  let result = assets;

  if (query) {
    result = result.filter((a) => matchesAssetQuery(a, query));
  }

  if (typeFilters.length > 0) {
    result = result.filter((a) => typeFilters.includes(a.type));
  }

  if (tagFilters.length > 0) {
    result = result.filter((a) =>
      tagFilters.every((filter) => a.tags.some((tag) => tag.toLowerCase() === filter.toLowerCase())),
    );
  }

  return result;
}

interface UseAssetSearchResult {
  filteredAssets: BrandAsset[];
  totalCount: number;
  matchCount: number;
  availableTags: string[];
}

/**
 * Hook for client-side brand asset search with tag aggregation.
 *
 * All filtering is performed in-memory for <200ms performance (NFR2).
 * Tag suggestions are derived from the full asset set (not filtered).
 */
export function useAssetSearch(
  assets: BrandAsset[],
  query: string,
  typeFilters: string[],
  tagFilters: string[],
): UseAssetSearchResult {
  const availableTags = useMemo(() => aggregateTags(assets), [assets]);

  const filteredAssets = useMemo(
    () => filterAssets(assets, query, typeFilters, tagFilters),
    [assets, query, typeFilters, tagFilters],
  );

  return {
    filteredAssets,
    totalCount: assets.length,
    matchCount: filteredAssets.length,
    availableTags,
  };
}
